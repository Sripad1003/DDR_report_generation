import time
import random
from groq import Groq, InternalServerError, APIStatusError
import json
import os
from typing import Dict, List, Tuple, Any
from models import DDRReport, Observation, SeverityLevel, ImageData

class AIEngine:
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
        self.main_model = "llama-3.3-70b-versatile"
        self.fallback_model = "llama-3.1-8b-instant"
    
    def _call_llm(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 1000, response_format: Dict = None) -> str:
        """
        Helper to call Groq with exponential backoff and fallback model logic
        """
        max_retries = 3
        current_model = self.main_model
        
        for attempt in range(max_retries + 1):
            try:
                params = {
                    "model": current_model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                if response_format:
                    params["response_format"] = response_format
                
                response = self.client.chat.completions.create(**params)
                return response.choices[0].message.content
            
            except (InternalServerError, APIStatusError) as e:
                # Check for 503 or 429
                status_code = getattr(e, 'status_code', 500)
                if status_code in [503, 429, 500] and attempt < max_retries:
                    wait_time = (2 ** attempt) + random.random()
                    print(f"⚠️ Groq API Error ({status_code}) on {current_model}. Retrying in {wait_time:.2f}s... (Attempt {attempt+1}/{max_retries})")
                    
                    # On second attempt failure, try switching to fallback model
                    if attempt >= 1:
                        current_model = self.fallback_model
                        print(f"🔄 Switching to fallback model: {current_model}")
                        
                    time.sleep(wait_time)
                    continue
                raise e
        return ""

    def extract_observations(
        self, 
        inspection_text: str, 
        thermal_text: str
    ) -> List[Dict]:
        """
        Extract structured observations from both documents using LLM
        """
        
        prompt = f"""
You are an expert building inspector analyzing water damage reports.

INSPECTION REPORT (TRUNCATED):
{inspection_text[:2000]}

THERMAL REPORT (TRUNCATED):
{thermal_text[:1000]}

Your task: Extract all observations and merge them logically.

Return ONLY a JSON array of observations in this precisely formatted structure:
[
  {{
    "area": "Hall",
    "description": "Dampness at skirting level observed near the entrance.",
    "thermal_reading": "Hotspot: 28.8°C, Coldspot: 23.4°C",
    "severity": "Moderate"
  }}
]

Rules:
- Merge related observations (same area)
- Avoid duplicates
- Be specific about locations
- Include temperature data when available from the thermal report
- If information conflicts, mention both sources
- Return ONLY the JSON array.
"""

        content = self._call_llm(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        if not content: return []
        
        try:
            data = json.loads(content.strip())
            if isinstance(data, dict) and "observations" in data:
                return data["observations"]
            elif isinstance(data, list):
                return data
            return [data] if isinstance(data, dict) else []
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            if "```json" in content:
                try:
                    content = content.split("```json")[1].split("```")[0]
                    return json.loads(content.strip())
                except:
                    pass
            return []
    
    def generate_root_cause_analysis(
        self, 
        observations: List[Dict]
    ) -> str:
        """Generate probable root cause based on combined observations"""
        
        obs_text = json.dumps(observations, indent=2)
        
        prompt = f"""
Based on these combined inspection observations:
{obs_text}

Provide a concise, professional probable root cause analysis (2-3 sentences).
Focus on specific likely failures like: plumbing leaks, waterproofing degradation, structural cracks, or external drainage issues.
"""

        content = self._call_llm(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=800
        )
        
        return content.strip() if content else "Root cause analysis failed."
    
    def generate_recommended_actions(
        self, 
        observations: List[Dict],
        root_cause: str
    ) -> List[str]:
        """Generate professional recommended actions"""
        
        prompt = f"""
Root Cause: {root_cause}

Observations: {json.dumps(observations, indent=2)[:4000]}

Provide 5-7 specific, actionable recommended steps to remediate these issues.
Return ONLY a JSON array of strings:
["Step 1: Thoroughly clean...", "Step 2: Apply waterproofing...", ...]
"""

        content = self._call_llm(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        if not content: return ["Contact a professional for remediation steps."]
        
        try:
            data = json.loads(content.strip())
            if isinstance(data, dict) and "actions" in data:
                return data["actions"]
            elif isinstance(data, list):
                return data
            return list(data.values())[0] if isinstance(data, dict) and len(data) > 0 else []
        except:
            return [line.strip("- ").strip() for line in content.split("\n") if line.strip() and len(line) > 5]
    
    def assess_severity(
        self, 
        observations: List[Dict]
    ) -> Tuple[SeverityLevel, str]:
        """
        Assess overall severity level with reasoning
        """
        
        prompt = f"""
Observations: {json.dumps(observations, indent=2)}

Assess the overall severity of this water damage issue. Use one of: Low, Moderate, High, Critical.

Return JSON:
{{
  "severity": "Low|Moderate|High|Critical",
  "reasoning": "Detailed explanation considering structural risk, health implications, and urgency."
}}
"""

        content = self._call_llm(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        if not content: return SeverityLevel.MODERATE, "Unable to perform automated assessment."
        
        try:
            result = json.loads(content.strip())
            
            severity_map = {
                "Low": SeverityLevel.LOW,
                "Moderate": SeverityLevel.MODERATE,
                "High": SeverityLevel.HIGH,
                "Critical": SeverityLevel.CRITICAL
            }
            
            severity_str = result.get("severity", "Moderate")
            severity = severity_map.get(severity_str, SeverityLevel.MODERATE)
            reasoning = result.get("reasoning", "Unable to assess severity automatically.")
            
            return severity, reasoning
        except:
            return SeverityLevel.MODERATE, "Automated assessment failed to parse."
