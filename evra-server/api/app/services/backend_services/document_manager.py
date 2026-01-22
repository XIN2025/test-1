from typing import List, Dict, Optional, Union, Callable, Any
from bson import ObjectId
import asyncio
import logging
from datetime import datetime, timezone
from .db import get_db
from app.services.ai_services.mongodb_vectorstore import get_vector_store
from app.services.ai_services.document_processor import get_document_processor
from app.services.ai_services.document_extraction_service import get_document_extraction_service
from app.services.backend_services.progress_tracker import get_progress_tracker
from app.schemas.backend.documents import DocumentType

logger = logging.getLogger(__name__)

class DocumentManager:
    def __init__(self):
        self.db = get_db()
        self.vector_store = get_vector_store()
        self.processor = get_document_processor()
        self.progress_tracker = get_progress_tracker()
        self.extraction_service = get_document_extraction_service()
        self.uploaded_files_collection = self.db["uploaded_files"]

    def add_document(self, content: Union[str, bytes], filename: str, user_email: str, upload_id: str, type: DocumentType) -> Dict:
        """
        Process document: extract markdown, then run vector generation and data extraction in parallel.
        Only extract structured data for DOCUMENT type (not LAB_REPORT).
        """
        current_progress = self.progress_tracker.get_progress(upload_id)
        should_update_progress = True
        
        if current_progress:
            current_status = current_progress.get("status")
            if current_status in ["completed", "failed"]:
                should_update_progress = False
                logger.info(f"Progress already {current_status} for {upload_id}, skipping progress updates to avoid overwriting")
        
        progress_callback = None
        if should_update_progress:
            progress_callback = lambda percentage, message, status: self.progress_tracker.update_progress(
                upload_id=upload_id,
                percentage=percentage,
                message=message,
                status=status
            )
        
        file_extension = None
        if filename and isinstance(filename, str) and '.' in filename:
            file_extension = filename.split('.')[-1].lower()
        
        if should_update_progress and progress_callback:
            progress_callback(percentage=20, message="Starting document analysis...", status="processing")
        
        markdown = None
        if isinstance(content, str):
            markdown = content
        elif file_extension == 'pdf':
            markdown = self.processor.convert_pdf_bytes_to_markdown(content)
        elif file_extension == 'docx':
            markdown = self.processor.convert_docx_bytes_to_markdown(content)
        elif file_extension == 'doc':
            markdown = self.processor.convert_doc_bytes_to_markdown(content)
        elif file_extension == 'xml':
            markdown = self.processor.convert_xml_bytes_to_markdown(content)
        else:
            error_msg = f"Unsupported file type: .{file_extension if file_extension else 'unknown'}. Supported formats: pdf, docx, doc, xml, text"
            if should_update_progress and progress_callback:
                progress_callback(percentage=100, message=error_msg, status="failed")
            return {"success": False, "error": error_msg}
        
        if not markdown:
            error_msg = "Failed to extract text from document"
            if should_update_progress and progress_callback:
                progress_callback(percentage=100, message=error_msg, status="failed")
            return {"success": False, "error": error_msg}
        
        if type == DocumentType.DOCUMENT:
            result = self._process_document_with_extraction(
                markdown, filename, user_email, upload_id, type, progress_callback, should_update_progress
            )
        else:
            result = self.processor.process_markdown_file(
                markdown, filename, user_email, type, upload_id, progress_callback if progress_callback else None
            )
        
        if not result.get("success"):
            if should_update_progress and progress_callback:
                progress_callback(
                    percentage=100,
                    message=result.get("error", "Failed to process document"),
                    status="failed",
                )
            return {"success": False, "error": result.get("error", "Unknown error")}

        if should_update_progress and progress_callback:
            progress_callback(
                percentage=100,
                message="Document processed successfully",
                status="completed"
            )
        return {"success": True, "filename": filename, "chunks_count": result.get("chunks_count", 0)}
    
    def _process_document_with_extraction(
        self, 
        markdown: str, 
        filename: str, 
        user_email: str, 
        upload_id: str, 
        type: DocumentType,
        progress_callback: Optional[Callable],
        should_update_progress: bool
    ) -> Dict:
        """
        Process document by running vector generation and data extraction in parallel.
        """
        try:
            if should_update_progress and progress_callback:
                progress_callback(percentage=40, message="Extracting structured data and generating vectors...", status="processing")
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                extraction_task = self.extraction_service.extract_structured_data(markdown)
                
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    vector_future = executor.submit(
                        self.vector_store.add_document,
                        markdown, user_email, filename, type, upload_id
                    )
                    extraction_result = loop.run_until_complete(extraction_task)
                    vector_result = vector_future.result()
                
                if isinstance(vector_result, Exception):
                    logger.error(f"Error in vector generation: {vector_result}", exc_info=True)
                    raise vector_result
                
                if isinstance(extraction_result, Exception):
                    logger.error(f"Error in data extraction: {extraction_result}", exc_info=True)
                    extraction_result = self.extraction_service._get_empty_extraction()
                
                chunks_count = vector_result if isinstance(vector_result, int) else 0
                
                if should_update_progress and progress_callback:
                    progress_callback(percentage=85, message="Saving extracted data...", status="processing")
                
                self._save_extracted_data(
                    upload_id=upload_id,
                    filename=filename,
                    user_email=user_email,
                    extracted_data=extraction_result
                )
                
                return {
                    "success": True,
                    "filename": filename,
                    "chunks_count": chunks_count
                }
                
            finally:
                loop.close()
                
        except Exception as e:
            logger.error(f"Error processing document with extraction: {e}", exc_info=True)
            return {
                "success": False,
                "filename": filename,
                "error": str(e)
            }
    
    def _save_extracted_data(
        self, 
        upload_id: str, 
        filename: str, 
        user_email: str, 
        extracted_data: Dict[str, Any]
    ):
        """
        Save extracted structured data to uploaded_files collection.
        """
        try:
            document_record = {
                "upload_id": upload_id,
                "filename": filename,
                "user_email": user_email,
                "conditions_diagnoses": extracted_data.get("conditions_diagnoses", []),
                "medications": extracted_data.get("medications", []),
                "allergies": extracted_data.get("allergies", []),
                "labs": extracted_data.get("labs", []),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            self.uploaded_files_collection.update_one(
                {"upload_id": upload_id},
                {"$set": document_record},
                upsert=True
            )
            
            logger.info(f"Saved extracted data for upload_id: {upload_id}, filename: {filename}")
            
        except Exception as e:
            logger.error(f"Error saving extracted data for upload_id {upload_id}: {e}", exc_info=True)
    
    def get_all_documents_by_user_email(self, user_email: str) -> List[Dict]:
        documents = self.vector_store.get_all_documents_by_user_email(user_email)
        return documents

    def delete_document_by_upload_id(self, upload_id: str) -> bool:
        return self.vector_store.delete_document_by_upload_id(upload_id)

# Global instance
document_manager = None

def get_document_manager() -> DocumentManager:
    """Get or create a DocumentManager instance"""
    global document_manager
    if document_manager is None:
        document_manager = DocumentManager()
    return document_manager
