from typing import Dict, Optional, Callable
import time
import fitz
import pypandoc
try:
    import defusedxml.ElementTree as ET
except ImportError:
    # Fallback to standard library if defusedxml not available
    import xml.etree.ElementTree as ET
    import warnings
    warnings.warn("defusedxml not installed. XML parsing may be vulnerable to XXE attacks. Install with: pip install defusedxml")
from langchain_core.documents import Document
from app.services.ai_services.mongodb_vectorstore import get_vector_store
from app.schemas.backend.documents import DocumentType

class DocumentProcessor:
    def __init__(self):
        self.vector_store = get_vector_store()
        self.ensure_pandoc_installed()

    def ensure_pandoc_installed(self):
        try:
            pypandoc.get_pandoc_version()
            return True
        except OSError:
            return False

    def convert_pdf_bytes_to_markdown(self, pdf_bytes: bytes) -> Optional[str]:
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            md_lines = []
            for page_num, page in enumerate(doc, 1):
                text = page.get_text()
                md_lines.append(f"\n## Page {page_num}\n\n{text}")
            markdown = '\n'.join(md_lines)
            print(f"Converted PDF bytes to markdown string")
            return markdown
        except Exception as e:
            print(f"Error converting PDF: {e}")
            return None
        
    def convert_docx_bytes_to_markdown(self, docx_bytes: bytes) -> Optional[str]:
        try:
            output = pypandoc.convert_text(docx_bytes, 'md', format='docx')
            print(f"Converted DOCX bytes to markdown string")
            return output
        except Exception as e:
            print(f"Error converting DOCX: {e}")
            return None
    
    def convert_doc_bytes_to_markdown(self, doc_bytes: bytes) -> Optional[str]:
        try:
            output = pypandoc.convert_text(doc_bytes, 'md', format='doc')
            print(f"Converted DOC bytes to markdown string")
            return output
        except Exception as e:
            print(f"Error converting DOC: {e}")
            return None
    
    def convert_xml_bytes_to_markdown(self, xml_bytes: bytes) -> Optional[str]:
        """Convert XML bytes to markdown format for better readability and LLM processing"""
        try:
            root = ET.fromstring(xml_bytes.decode('utf-8'))
            
            md_lines = []
            md_lines.append("# XML Document Content\n")
            
            def xml_to_markdown(element, level=0):
                indent = "  " * level
                
                if level == 0:
                    md_lines.append(f"## {element.tag}")
                elif level == 1:
                    md_lines.append(f"### {element.tag}")
                else:
                    md_lines.append(f"{indent}- **{element.tag}**")
                
                if element.attrib:
                    for key, value in element.attrib.items():
                        md_lines.append(f"{indent}  - *{key}*: {value}")
                
                if element.text and element.text.strip():
                    text = element.text.strip()
                    if level <= 1:
                        md_lines.append(f"\n{text}\n")
                    else:
                        md_lines.append(f"{indent}  {text}")
                
                for child in element:
                    xml_to_markdown(child, level + 1)
                
                if element.tail and element.tail.strip():
                    tail_text = element.tail.strip()
                    md_lines.append(f"{indent}{tail_text}")
            
            xml_to_markdown(root)
            
            markdown = '\n'.join(md_lines)
            print(f"Converted XML bytes to markdown string")
            return markdown
            
        except ET.ParseError as e:
            print(f"Error parsing XML: {e}")
            try:
                text_content = xml_bytes.decode('utf-8')
                return f"# XML Document (Raw Content)\n\n{text_content}"
            except:
                return None
        except Exception as e:
            print(f"Error converting XML: {e}")
            return None

    def process_markdown_file(
        self,
        content: str,
        filename: str,
        user_email: str,
        type: DocumentType,
        upload_id: str = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        print(f"Processing markdown file: {filename} for user {user_email}")

        try:
            if progress_callback:
                progress_callback(
                    percentage=60,
                    message="Uploading document chunks...",
                    status="processing"
                )
                time.sleep(0.5)

            chunks_count = self.vector_store.add_document(content, user_email, filename, type, upload_id=upload_id)

            if progress_callback:
                progress_callback(
                    percentage=95,
                    message="Finalizing upload...",
                    status="processing"
                )
                time.sleep(0.5)

            return {
                "success": True,
                "filename": filename,
                "chunks_count": chunks_count
            }

        except Exception as e:
            print(f"Error processing markdown file {filename}: {e}")
            return {
                "success": False,
                "filename": filename,
                "error": str(e)
            }


    def process_pdf_file(
        self,
        file_content: bytes,
        filename: str,
        user_email: str,
        type: DocumentType,
        upload_id: str = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        print(f"Processing PDF file: {filename} for user {user_email}")

        try:
            if progress_callback:
                progress_callback(
                    percentage=25,
                    message="Converting PDF to markdown...",
                    status="processing"
                )
                time.sleep(0.5)

            markdown = self.convert_pdf_bytes_to_markdown(file_content)
            if not markdown:
                raise ValueError("Failed to convert PDF to markdown.")

            return self.process_markdown_file(markdown, filename, user_email, type, upload_id, progress_callback)
        except Exception as e:
            print(f"Error processing PDF file {filename}: {e}")
            return {
                "success": False,
                "filename": filename,
                "error": str(e)
            }
    
    def process_docx_file(
        self,
        file_content: bytes,
        filename: str,
        user_email: str,
        type: DocumentType,
        upload_id: str = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        print(f"Processing DOCX file: {filename} for user {user_email}")

        try:
            if progress_callback:
                progress_callback(
                    percentage=25,
                    message="Converting DOCX to markdown...",
                    status="processing"
                )
                time.sleep(0.5)

            markdown = self.convert_docx_bytes_to_markdown(file_content)
            if not markdown:
                raise ValueError("Failed to convert DOCX to markdown.")

            return self.process_markdown_file(markdown, filename, user_email, type, upload_id, progress_callback)
        except Exception as e:
            print(f"Error processing DOCX file {filename}: {e}")
            return {
                "success": False,
                "filename": filename,
                "error": str(e)
            }
    
    def process_doc_file(
        self,
        file_content: bytes,
        filename: str,
        user_email: str,
        type: DocumentType,
        upload_id: str = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        print(f"Processing DOC file: {filename} for user {user_email}")

        try:
            if progress_callback:
                progress_callback(
                    percentage=25,
                    message="Converting DOC to markdown...",
                    status="processing"
                )
                time.sleep(0.5)

            markdown = self.convert_doc_bytes_to_markdown(file_content)
            if not markdown:
                raise ValueError("Failed to convert DOC to markdown.")

            return self.process_markdown_file(markdown, filename, user_email, type, upload_id, progress_callback)
        except Exception as e:
            print(f"Error processing DOC file {filename}: {e}")
            return {
                "success": False,
                "filename": filename,
                "error": str(e)
            }
    
    def process_text_file(
        self,
        file_content: str,
        filename: str,
        user_email: str,
        type: DocumentType,
        upload_id: str = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        try:
            if progress_callback:
                progress_callback(
                    percentage=25,
                    message="Reading text file...",
                    status="processing"
                )
                time.sleep(0.5)

            return self.process_markdown_file(file_content, filename, user_email, type, upload_id, progress_callback)
        except Exception as e:
            print(f"Error processing text file {filename}: {e}")
            return {
                "success": False,
                "filename": filename,
                "error": str(e)
            }
    
    def process_xml_file(
        self,
        file_content: bytes,
        filename: str,
        user_email: str,
        type: DocumentType,
        upload_id: str = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        print(f"Processing XML file: {filename} for user {user_email}")

        try:
            if progress_callback:
                progress_callback(
                    percentage=25,
                    message="Converting XML to markdown...",
                    status="processing"
                )
                time.sleep(0.5)

            markdown = self.convert_xml_bytes_to_markdown(file_content)
            if not markdown:
                raise ValueError("Failed to convert XML to markdown.")

            return self.process_markdown_file(markdown, filename, user_email, type, upload_id, progress_callback)
        except Exception as e:
            print(f"Error processing XML file {filename}: {e}")
            return {
                "success": False,
                "filename": filename,
                "error": str(e)
            }


document_processor = None

def get_document_processor() -> DocumentProcessor:
    """
    Get or create a DocumentProcessor instance using OpenAI
    """
    global document_processor
    if document_processor is None:
        document_processor = DocumentProcessor()
    return document_processor

def reset_document_processor():
    """Reset the global DocumentProcessor instance"""
    global document_processor
    document_processor = None 
