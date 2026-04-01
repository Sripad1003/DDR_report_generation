import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import DDRReport from './components/DDRReport';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, Info, Bell, ChevronRight } from 'lucide-react';

const App = () => {
  const [ddrData, setDdrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('analyzer');
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('ddr_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);
  
  // Set default axios base URL for convenience
  axios.defaults.baseURL = 'https://ddr-backend.vercel.app';

  const handleGenerate = async (files) => {
    setLoading(true);
    setError(null);
    
    // Using FormData to handle multi-part file uploads
    const formData = new FormData();
    formData.append('inspection_report', files.inspection);
    formData.append('thermal_report', files.thermal);
    
    try {
      // Simulate real-time progress for better UX
      // (Actual generation takes ~15-30s depending on LLM response)
      const response = await axios.post('/api/generate-ddr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setDdrData(response.data);
      
      // Save to history
      const newReport = {
        id: `DDR-${Date.now()}`,
        date: new Date().toISOString(),
        data: response.data
      };
      
      const updatedHistory = [newReport, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('ddr_history', JSON.stringify(updatedHistory));
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Generation failed. Please try again.';
      setError(msg);
      console.error('Error generating DDR:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/10">
              <Shield className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight">DDR Intelligence</h1>
              <span className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">v1.0</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <button 
              onClick={() => setActiveView('analyzer')}
              className={`${activeView === 'analyzer' ? 'text-slate-900 border-b-2 border-primary-600' : 'hover:text-primary-600'} transition-all py-1`}
            >
              Analyzer
            </button>
            <button 
              onClick={() => setActiveView('history')}
              className={`${activeView === 'history' ? 'text-slate-900 border-b-2 border-primary-600' : 'hover:text-primary-600'} transition-all py-1`}
            >
              History
            </button>
            <button 
              onClick={() => setActiveView('docs')}
              className={`${activeView === 'docs' ? 'text-slate-900 border-b-2 border-primary-600' : 'hover:text-primary-600'} transition-all py-1`}
            >
              Docs
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="px-6 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {activeView === 'analyzer' && (
            !ddrData ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                <FileUpload 
                  onGenerate={handleGenerate} 
                  loading={loading} 
                  error={error} 
                />
              </motion.div>
            ) : (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <DDRReport 
                  data={ddrData} 
                  onReset={() => setDdrData(null)} 
                />
              </motion.div>
            )
          )}

          {activeView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-slate-900">Past Analysis Results</h2>
                <button 
                  onClick={() => {
                    localStorage.removeItem('ddr_history');
                    setHistory([]);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-2"
                >
                  Clear History
                </button>
              </div>

              {history.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Info className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">No History Found</h3>
                  <p className="text-slate-500 mt-2">Generate your first report to see it here.</p>
                  <button 
                    onClick={() => setActiveView('analyzer')}
                    className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm"
                  >
                    Go generate report
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((h) => (
                    <div 
                      key={h.id}
                      className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">
                          {h.data.severity_level[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{h.id}</h4>
                          <p className="text-xs text-slate-500">{new Date(h.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          h.data.severity_level === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                          h.data.severity_level === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                          'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          {h.data.severity_level}
                        </span>
                        <button 
                          onClick={() => {
                            setDdrData(h.data);
                            setActiveView('analyzer');
                          }}
                          className="px-4 py-2 bg-slate-50 text-slate-900 rounded-lg hover:bg-primary-600 hover:text-white font-bold text-sm transition-all"
                        >
                          View Full Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'docs' && (
            <motion.div
              key="docs"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto bg-white p-12 rounded-3xl border border-slate-100 shadow-xl"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-6">System Documentation</h2>
              <div className="prose prose-slate max-w-none">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-primary-600">
                      <Shield className="w-5 h-5" /> What is DDR Intelligence?
                    </h3>
                    <p className="text-slate-600 leading-relaxed mt-2">
                      DDR Intelligence is an AI-powered analyzer designed for building inspectors. It processes physical site inspection PDF reports and thermal imaging reports to automatically generate a **Detailed Diagnostic Report (DDR)**.
                    </p>
                  </section>

                  <section className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-bold mb-3">Key Features:</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        <span>Multi-PDF data extraction and cross-referencing.</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        <span>Autonomous root cause analysis using LLMs.</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        <span>Automated severity assessment and remediation suggestions.</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        <span>Visual evidence matching (Thermal Images & Inspect Photos).</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                      <Settings className="w-5 h-5" /> How it Works?
                    </h3>
                    <p className="text-slate-600 text-sm mt-4">
                      1. **Extraction**: We use <code>PyMuPDF</code> to extract raw text and high-res images from your PDF uploads.<br/><br/>
                      2. **Analysis**: The text is sent to our AI core (Llama 3 hosted on Groq) to identify specific areas of concern.<br/><br/>
                      3. **Matching**: Images are analyzed to determine their relevance to specific observations using keyword synthesis.<br/><br/>
                      4. **Reporting**: A structured JSON output is generated and styled with this premium UI.
                    </p>
                  </section>
                </div>
              </div>
              <button 
                onClick={() => setActiveView('analyzer')}
                className="mt-12 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
              >
                Start Generating <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm">
            © 2024 Applied AI Builder Assignment. Built with Llama 3 & FastAPI.
          </p>
          <div className="flex items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              API Connected
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
