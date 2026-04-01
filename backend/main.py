from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

from models import DDRReport, ProcessingStatus
from report_generator import ReportGenerator

# Load environment variables
load_dotenv()

app = FastAPI(
    title="DDR Report Generator API",
    description="Backend API for automatically generating Detailed Diagnostic Reports (DDR) from technical PDF documents."
)

# CORS middleware for development integration with React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize report generator with Groq API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    # We will raise this error at runtime instead of startup to allow environment setup
    print("WARNING: GROQ_API_KEY not found in environment variables.")

# Create upload directory for temporary file handling
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "DDR Report Generator API",
        "groq_configured": bool(os.getenv("GROQ_API_KEY"))
    }

@app.post("/api/generate-ddr", response_model=DDRReport)
async def generate_ddr(
    inspection_report: UploadFile = File(...),
    thermal_report: UploadFile = File(...)
):
    """
    Endpoint to trigger DDR generation.
    Uploads two PDFs, extracts data, and uses AI to generate a structured report.
    """
    
    # 1. API Key Validation
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server.")
    
    # 2. File Type Validation
    if not (inspection_report.filename.lower().endswith('.pdf') and 
            thermal_report.filename.lower().endswith('.pdf')):
        raise HTTPException(status_code=400, detail="Both files must be PDF format.")
    
    # 3. Save files temporarily
    ins_path = UPLOAD_DIR / f"ins_{inspection_report.filename}"
    thr_path = UPLOAD_DIR / f"thr_{thermal_report.filename}"
    
    try:
        # Save inspection report
        with open(ins_path, "wb") as f:
            shutil.copyfileobj(inspection_report.file, f)
            
        # Save thermal report
        with open(thr_path, "wb") as f:
            shutil.copyfileobj(thermal_report.file, f)
            
        # 4. Generate Report
        generator = ReportGenerator(api_key)
        report = generator.generate_ddr(str(ins_path), str(thr_path))
        
        # 5. Cleanup
        if ins_path.exists(): os.remove(ins_path)
        if thr_path.exists(): os.remove(thr_path)
        
        return report
        
    except Exception as e:
        # Clean up on failure
        if ins_path.exists(): os.remove(ins_path)
        if thr_path.exists(): os.remove(thr_path)
        
        print(f"Error during DDR generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "ddr-generator"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
