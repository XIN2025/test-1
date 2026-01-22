from typing import Dict, Optional, Any, List
import logging
import os
from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from app.config import OPENAI_API_KEY, LLM_MODEL, LLM_TEMPERATURE

logger = logging.getLogger(__name__)

class DocumentExtractionService:
    """Service to extract structured data from medical documents using LLM"""
    
    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("OpenAI API key not found in environment variables")
        
        self.llm = ChatOpenAI(
            model=LLM_MODEL,
            openai_api_key=OPENAI_API_KEY,
            temperature=0,  
            max_retries=2,
            timeout=60,
        )
        self.model = LLM_MODEL
    
    async def extract_structured_data(self, markdown_content: str) -> Dict[str, Any]:
        """
        Extract structured data from medical document markdown.
        Returns a dictionary with Conditions/diagnoses, Medications, Allergies, and Labs.
        """
        schema = {
            "title": "MedicalDocumentExtraction",
            "description": "Extracted structured data from a medical document",
            "type": "object",
            "properties": {
                "conditions_diagnoses": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "condition": {"type": "string", "description": "Name of the medical condition or diagnosis"},
                            "intent": {
                                "type": "string", 
                                "enum": ["prevent", "manage", "reverse"],
                                "description": "The healthcare intent - 'prevent' if working to prevent this condition, 'manage' if actively managing/treating it, or 'reverse' if working to reverse/cure it"
                            }
                        },
                        "required": ["condition", "intent"]
                    },
                    "description": "List of medical conditions, diagnoses, or health issues with their healthcare intent"
                },
                "medications": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Medication name"},
                            "dosage": {"type": "string", "description": "Dosage information if available"},
                            "frequency": {"type": "string", "description": "Frequency of administration if available"}
                        },
                        "required": ["name"]
                    },
                    "description": "List of medications mentioned in the document"
                },
                "allergies": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "allergen": {"type": "string", "description": "Name of the allergen"},
                            "reaction": {"type": "string", "description": "Reaction description if available"},
                            "severity": {"type": "string", "description": "Severity level if available"}
                        },
                        "required": ["allergen"]
                    },
                    "description": "List of allergies mentioned in the document"
                },
                "labs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "test_name": {"type": "string", "description": "Name of the lab test"},
                            "value": {"type": "string", "description": "Test value if available"},
                            "unit": {"type": "string", "description": "Unit of measurement if available"},
                            "reference_range": {"type": "string", "description": "Reference range if available"},
                            "status": {"type": "string", "description": "Status (normal, abnormal, high, low) if available"}
                        },
                        "required": ["test_name"]
                    },
                    "description": "List of lab tests mentioned in the document (only if present)"
                }
            },
            "required": ["conditions_diagnoses", "medications", "allergies", "labs"]
        }
        
        system_prompt = (
            "You are an expert medical document analyzer. "
            "Extract structured information from medical documents including conditions/diagnoses, "
            "medications, allergies, and lab tests (if present). "
            "Be thorough and accurate. If a category has no information, return an empty array. "
            "\n\nFor conditions/diagnoses, classify the healthcare intent as:\n"
            "- 'prevent': Conditions the patient is working to prevent (risk factors, family history)\n"
            "- 'manage': Conditions actively being managed or treated (current diagnoses)\n"
            "- 'reverse': Conditions being actively worked on to reverse or cure\n"
            "\nFor medications, include dosage and frequency if available. "
            "For allergies, include reaction and severity if available. "
            "For labs, only include them if they are actually present in the document."
        )
        
        user_prompt = (
            "Extract structured medical information from the following document:\n\n"
            "{markdown_content}\n\n"
            "Please extract all conditions/diagnoses (with their healthcare intent: prevent/manage/reverse), "
            "medications, allergies, and lab tests (if present)."
        )
        
        try:
            llm_with_schema = self.llm.with_structured_output(schema)
            prompt = ChatPromptTemplate.from_messages(
                [("system", system_prompt), ("user", user_prompt)]
            )
            chain = prompt | llm_with_schema
            result = await chain.ainvoke({"markdown_content": markdown_content})
            
            if not isinstance(result, dict):
                logger.error(f"extract_structured_data returned non-dict type: {type(result).__name__}")
                return self._get_empty_extraction()
            
            extraction = {
                "conditions_diagnoses": result.get("conditions_diagnoses", []),
                "medications": result.get("medications", []),
                "allergies": result.get("allergies", []),
                "labs": result.get("labs", [])
            }
            
            logger.info(f"Successfully extracted data: {len(extraction['conditions_diagnoses'])} conditions, "
                       f"{len(extraction['medications'])} medications, {len(extraction['allergies'])} allergies, "
                       f"{len(extraction['labs'])} labs")
            
            return extraction
            
        except Exception as e:
            logger.error(f"Error extracting structured data: {type(e).__name__}: {str(e)}", exc_info=True)
            return self._get_empty_extraction()
    
    def _get_empty_extraction(self) -> Dict[str, Any]:
        """Return empty extraction structure"""
        return {
            "conditions_diagnoses": [],
            "medications": [],
            "allergies": [],
            "labs": []
        }


document_extraction_service = None

def get_document_extraction_service() -> DocumentExtractionService:
    """Get or create a DocumentExtractionService instance"""
    global document_extraction_service
    if document_extraction_service is None:
        document_extraction_service = DocumentExtractionService()
    return document_extraction_service

def reset_document_extraction_service():
    """Reset the global DocumentExtractionService instance"""
    global document_extraction_service
    document_extraction_service = None

