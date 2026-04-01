import fitz  # PyMuPDF
from PIL import Image
import io
import base64
from typing import Dict, List, Tuple
from models import ImageData

class DocumentProcessor:
    def __init__(self):
        self.supported_image_formats = ["jpeg", "png", "jpg"]
    
    def extract_pdf_content(self, pdf_path: str, doc_type: str) -> Dict:
        """
        Extract text and images from PDF
        
        Args:
            pdf_path: Path to PDF file
            doc_type: "inspection" or "thermal"
        
        Returns:
            {
                "text": "Full extracted text",
                "images": [ImageData objects],
                "page_texts": {"page_1": "text", "page_2": "text"}
            }
        """
        pdf_document = fitz.open(pdf_path)
        
        full_text = ""
        images = []
        page_texts = {}
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            
            # Extract text
            page_text = page.get_text()
            full_text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            page_texts[f"page_{page_num + 1}"] = page_text
            
            # Extract images
            image_list = page.get_images(full=True)
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Convert to base64
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                
                # Create ImageData object
                image_data = ImageData(
                    image_id=f"{doc_type}_p{page_num+1}_img{img_index+1}",
                    filename=f"{doc_type}_page{page_num+1}_image{img_index+1}.{image_ext}",
                    base64_data=image_base64,
                    source_document=doc_type,
                    page_number=page_num + 1
                )
                images.append(image_data)
        
        pdf_document.close()
        
        return {
            "text": full_text,
            "images": images,
            "page_texts": page_texts
        }
    
    def process_both_documents(
        self, 
        inspection_path: str, 
        thermal_path: str
    ) -> Dict:
        """Process both PDFs and return combined data"""
        
        inspection_data = self.extract_pdf_content(inspection_path, "inspection")
        thermal_data = self.extract_pdf_content(thermal_path, "thermal")
        
        return {
            "inspection": inspection_data,
            "thermal": thermal_data,
            "all_images": inspection_data["images"] + thermal_data["images"]
        }
