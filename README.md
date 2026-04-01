# Antigravity DDR Intelligence

An AI-powered diagnostic engine that automatically generates Detailed Diagnostic Reports (DDR) by analyzing site inspection PDFs and thermal imaging reports. Built for the Applied AI Builder Assignment.

## 🚀 Key Features

*   **Dual-PDF Analysis**: Simultaneously extracts text and high-res imagery from both physical site inspection reports and thermal imaging PDFs using `PyMuPDF`.
*   **AI-Driven Root Cause Analysis**: Uses **Llama-3.3-70B** (via Groq) to cross-reference data and identify structural/thermal anomalies.
*   **Intelligent Image Matching**: Automatically identifies and associates relevant visual evidence (skirting photos, thermal hotspots) with specific observations using keyword synthesis.
*   **DDR Severity Assessment**: Classifies issues (Low, Moderate, High, Critical) with data-backed reasoning.
*   **Persistent History**: Stores all past analysis results in browser `localStorage` for instant review.
*   **Automated Remediation**: Generates actionable, professional steps to remediate identified water ingress issues.

## 🛠️ Technology Stack

*   **Frontend**: React, Vite, Tailwind CSS, Framer Motion (for premium animations).
*   **Backend**: FastAPI (Python), Uvicorn.
*   **AI Core**: Groq API (Llama 3.3 70B & Llama 3.1 8B).
*   **Document Processing**: PyMuPDF (fitz), Pillow.

## 📦 Setup & Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```
*Create a `.env` file in the `backend` directory with your Groq API Key:*
```env
GROQ_API_KEY=your_groq_api_key_here
```
```bash
python main.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## ⚠️ Known Limitations & Optimizations

*   **Rate Limits**: The Groq free tier has strict TPM (Tokens Per Minute) limits. The app includes **exponential backoff retry logic** to handle 429/503 errors gracefully.
*   **Context Window**: Long PDFs are intelligently truncated (prioritizing key assessment areas) to stay within the model's token limits while maintaining accuracy.
*   **Model Capacity**: If the 70B model is over capacity, the system automatically falls back to the faster 8B model to ensure a response is always generated.

## 🔮 Future Improvements

*   **Vector Database (RAG)**: Implement Pinecone or Milvus to handle even larger documents and cross-reference multiple historical reports without truncation.
*   **Export Functionality**: Enable PDF export of the generated DDR for professional distribution.
*   **User Auth**: Move history from localStorage to a database (MongoDB/PostgreSQL) with user accounts for multi-device access.
*   **Advanced Visual Analysis**: Use Vision models (Llava/Llama-Vision) for even more precise image-to-text correlation.

---
Built by Antigravity AI Assistant.
