
from typing import Dict, List, Tuple
from models import DDRReport, Observation, ImageData, SeverityLevel
from ai_engine import AIEngine
from document_processor import DocumentProcessor

class ReportGenerator:
    def __init__(self, groq_api_key: str):
        self.ai_engine = AIEngine(groq_api_key)
        self.doc_processor = DocumentProcessor()
    
    def match_images_to_observations(
        self,
        observations: List[Dict],
        all_images: List[ImageData]
    ) -> List[Observation]:
        """
        Associate relevant images with observations based on keywords
        """
        
        observations_with_images = []
        
        for obs in observations:
            area = obs.get("area", "").lower()
            description = obs.get("description", "").lower()
            
            # Find matching images
            matched_images = []
            
            # Define keywords for common areas
            keywords = ["bathroom", "bedroom", "kitchen", "hall", "terrace", "balcony", "toilet", "skirting", "ceiling", "corner"]
            
            for image in all_images:
                # Check for area keyword in filename or description
                if area and area in image.filename.lower():
                    matched_images.append(image.image_id)
                elif any(keyword in area or keyword in description for keyword in keywords) and any(keyword in image.filename.lower() for keyword in keywords):
                    # More fuzzy matching if area is descriptive
                    matched_images.append(image.image_id)
            
            # Create Observation object
            observation = Observation(
                area=obs.get("area", "General"),
                description=obs.get("description", "Not Available"),
                thermal_data=obs.get("thermal_reading"),
                images=list(set(matched_images))[:4]  # Deduplicate and limit
            )
            observations_with_images.append(observation)
        
        return observations_with_images
    
    def generate_ddr(
        self,
        inspection_pdf_path: str,
        thermal_pdf_path: str
    ) -> DDRReport:
        """
        Main method to generate complete DDR report by coordinating processor and AI
        """
        
        # Step 1: Extract content from both PDFs
        print("📄 Extracting PDF content...")
        extracted_data = self.doc_processor.process_both_documents(
            inspection_pdf_path,
            thermal_pdf_path
        )
        
        inspection_text = extracted_data["inspection"]["text"]
        thermal_text = extracted_data["thermal"]["text"]
        all_images = extracted_data["all_images"]
        
        # Step 2: Extract observations using AI
        print("🤖 Analyzing observations...")
        raw_observations = self.ai_engine.extract_observations(
            inspection_text,
            thermal_text
        )
        
        # Step 3: Match images to observations
        print("🖼️ Matching images...")
        observations = self.match_images_to_observations(
            raw_observations,
            all_images
        )
        
        # Step 4: Generate root cause
        print("🔍 Analyzing root cause...")
        root_cause = self.ai_engine.generate_root_cause_analysis(raw_observations)
        
        # Step 5: Assess severity
        print("⚠️ Assessing severity...")
        severity_level, severity_reasoning = self.ai_engine.assess_severity(raw_observations)
        
        # Step 6: Generate recommendations
        print("✅ Generating recommendations...")
        recommended_actions = self.ai_engine.generate_recommended_actions(
            raw_observations,
            root_cause
        )
        
        # Step 7: Identify missing information
        missing_info = self._identify_missing_info(inspection_text, thermal_text)
        
        # Step 8: Build summary
        summary = self._generate_summary(observations, severity_level, root_cause)
        
        # Step 9: Compile final DDR
        ddr_report = DDRReport(
            property_issue_summary=summary,
            area_wise_observations=observations,
            probable_root_cause=root_cause,
            severity_assessment=severity_reasoning,
            severity_level=severity_level,
            recommended_actions=recommended_actions,
            additional_notes="Report generated using AI-assisted analysis. Please verify all findings with on-site inspection.",
            missing_information=missing_info,
            images=all_images
        )
        
        print("✨ DDR Generation Complete!")
        return ddr_report
    
    def _generate_summary(self, observations: List[Observation], severity: str, root_cause: str) -> str:
        """Generate a professional executive summary"""
        num_areas = len(observations)
        areas = ", ".join([obs.area for obs in observations[:4]])
        
        summary = f"""
The detailed property investigation has identified water ingress and deterioration issues across {num_areas} key areas including {areas}. 
The overall severity is classified as {severity}, with the primary root cause identified as {root_cause}.
Remedial actions should be prioritized based on structural implications and risk of further spread.
"""
        return summary.strip()
    
    def _identify_missing_info(self, inspection_text: str, thermal_text: str) -> List[str]:
        """Explicitly detect missing data as per assignment requirements"""
        missing = []
        
        lower_ins = inspection_text.lower()
        if "not available" in lower_ins or "n/a" in lower_ins:
            missing.append("Certain checklist items in the site inspection were marked as Not Available.")
        
        if "no thermal" in thermal_text.lower() or len(thermal_text) < 500:
             missing.append("Possible limited thermal imaging coverage.")
        
        if not missing:
            missing.append("All primary observation fields filled.")
            
        return missing
