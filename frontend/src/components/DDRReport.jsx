import React, { useState } from 'react';
import { 
  FileText, 
  MapPin, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Download, 
  ArrowLeft,
  Calendar,
  Layers,
  Image as ImageIcon,
  Zap,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

const DDRReport = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  const severityColors = {
    Low: 'bg-green-100 text-green-700 border-green-200',
    Moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
  };

  const severityGlow = {
    Low: 'shadow-green-500/10',
    Moderate: 'shadow-yellow-500/10',
    High: 'shadow-orange-500/10',
    Critical: 'shadow-red-500/10',
  };

  const SectionHeader = ({ title, icon: Icon, color = "text-slate-900" }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h3 className={`text-xl font-bold tracking-tight ${color}`}>{title}</h3>
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <button 
            onClick={onReset}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
          <h2 className="text-3xl font-black text-slate-900">Detailed Diagnostic Report</h2>
          <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date().toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Report ID: DDR-{Math.floor(Math.random() * 90000) + 10000}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className={`px-4 py-2 rounded-full border flex items-center gap-2 font-bold text-sm shadow-sm ${severityColors[data.severity_level]}`}>
            <AlertTriangle className="w-4 h-4" />
            {data.severity_level} Severity
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50"
          >
            <SectionHeader title="Property Issue Summary" icon={Info} color="text-primary-600" />
            <p className="text-slate-600 leading-relaxed text-lg italic">
              "{data.property_issue_summary}"
            </p>
          </motion.div>

          {/* Observations */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <SectionHeader title="Area-wise Observations" icon={Layers} color="text-indigo-600" />
            
            {data.area_wise_observations.map((obs, idx) => (
              <motion.div 
                key={idx}
                variants={item}
                className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Observation Text */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                        <MapPin className="w-4 h-4 text-indigo-500" /> {obs.area}
                      </h4>
                      {obs.thermal_data && (
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold flex items-center gap-1.5 border border-orange-100">
                          <Thermometer className="w-3 h-3 text-orange-500" /> {obs.thermal_data}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      {obs.description}
                    </p>
                    
                    {/* Visual Evidence (Placeholder logic for base64 images) */}
                    {obs.images && obs.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {obs.images.map((imgId, i) => {
                          const imgObj = data.images.find(img => img.image_id === imgId);
                          return imgObj ? (
                            <motion.div 
                              key={i} 
                              whileHover={{ scale: 1.02 }}
                              className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group/img"
                            >
                              <img 
                                src={`data:image/jpeg;base64,${imgObj.base64_data}`} 
                                alt={imgObj.filename}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] text-white font-bold tracking-tight uppercase px-2 py-1 bg-white/20 backdrop-blur-md rounded-md">
                                  Evidence {i+1}
                                </span>
                              </div>
                            </motion.div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div className="py-4 border-t border-dashed border-slate-100 flex items-center gap-2 text-slate-400 text-sm">
                        <ImageIcon className="w-4 h-4" /> Image Not Available
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Analysis Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Zap className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary-400">
              <ShieldAlert className="w-5 h-5" /> Root Cause Analysis
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
              {data.probable_root_cause}
            </p>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Severity Breakdown</h4>
              <p className="text-sm text-slate-200 italic leading-snug">
                {data.severity_assessment}
              </p>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xl"
          >
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" /> Recommended Actions
            </h3>
            <ul className="space-y-4">
              {data.recommended_actions.map((action, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 group">
                  <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 group-hover:bg-green-100 transition-colors">
                    {i + 1}
                  </span>
                  <span className="group-hover:text-slate-900 transition-colors leading-tight">
                    {action}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Missing Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-3xl bg-slate-50 border border-slate-100"
          >
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-wider">
               Missing/Unclear Info
            </h3>
            <ul className="space-y-2">
              {data.missing_information.map((info, i) => (
                <li key={i} className="text-xs text-slate-500 flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 flex-shrink-0" />
                  <span>{info}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DDRReport;
