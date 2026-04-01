import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onGenerate, loading, error }) => {
  const [files, setFiles] = useState({ inspection: null, thermal: null });
  const [dragActive, setDragActive] = useState({ type: null, active: false });
  
  const insInputRef = useRef(null);
  const thrInputRef = useRef(null);

  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setFiles(prev => ({ ...prev, [type]: file }));
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };

  const removeFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
  };

  const isReady = files.inspection && files.thermal;

  const FileCard = ({ type, file, label, icon: Icon, inputRef }) => (
    <div className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 ${
      file ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
    }`}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={(e) => handleFileChange(e, type)}
      />
      
      {file ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 transition-transform hover:rotate-3">
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
            {file.name}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button 
            onClick={() => removeFile(type)}
            className="mt-4 p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div 
          className="flex flex-col items-center text-center cursor-pointer"
          onClick={() => inputRef.current.click()}
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{label}</h3>
          <p className="text-xs text-slate-500 mt-1 px-4">
            Click or drag & drop inspection report
          </p>
        </div>
      )}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider mb-4 border border-primary-100">
          AI-Powered Diagnostic System
        </span>
        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          Upload <span className="text-primary-600">Inspection Data</span>
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Our AI engine will analyze both reports, extract observations, and merge them into a production-ready DDR report.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <FileCard 
          type="inspection" 
          file={files.inspection} 
          label="Site Inspection Report" 
          icon={FileText} 
          inputRef={insInputRef}
        />
        <FileCard 
          type="thermal" 
          file={files.thermal} 
          label="Thermal Imaging Data" 
          icon={ShieldAlert} 
          inputRef={thrInputRef}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900">Generation Failed</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center">
        <button
          onClick={() => onGenerate(files)}
          disabled={!isReady || loading}
          className={`group relative overflow-hidden flex items-center gap-3 px-10 py-4 font-bold text-white rounded-2xl transition-all duration-500 ${
            isReady && !loading 
              ? 'bg-slate-900 hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-1' 
              : 'bg-slate-200 cursor-not-allowed'
          }`}
        >
          <div className="absolute inset-0 w-0 bg-primary-600 transition-all duration-500 ease-out group-hover:w-full -z-10" />
          {loading ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Documents...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Generate DDR Report</span>
            </>
          )}
        </button>
      </div>
      
      {!isReady && !loading && (
        <p className="text-center text-slate-400 text-xs mt-6">
          Upload both PDFs to initiate the AI analysis pipeline.
        </p>
      )}
    </motion.div>
  );
};

export default FileUpload;
