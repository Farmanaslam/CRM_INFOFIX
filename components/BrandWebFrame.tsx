
import React, { useState } from 'react';
import { ExternalLink, Globe, RefreshCw, AlertCircle } from 'lucide-react';

interface BrandWebFrameProps {
  url: string;
  title: string;
}

export default function BrandWebFrame({ url, title }: BrandWebFrameProps) {
  const [key, setKey] = useState(0); // Used to force reload iframe

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Slim Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
            <Globe size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 leading-none">{title}</span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px] sm:max-w-xs">{url}</span>
                <span className="text-[10px] text-amber-600 flex items-center gap-0.5 bg-amber-50 px-1.5 rounded" title="If you see Session Expired, please use the Launch button.">
                    <AlertCircle size={10} /> Login Required
                </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setKey(prev => prev + 1)}
             className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
             title="Reload Frame"
           >
             <RefreshCw size={16} /> 
           </button>
           <a 
             href={url} 
             target="_blank" 
             rel="noreferrer"
             className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-xs font-bold shadow-sm shadow-indigo-200"
           >
             <span>Launch Full Portal</span>
             <ExternalLink size={14} />
           </a>
        </div>
      </div>

      {/* Full Size Web Frame */}
      <div className="flex-1 w-full relative bg-white overflow-hidden">
         <iframe 
            key={key}
            src={url} 
            className="w-full h-full border-0"
            title={`${title} Service Portal`}
            allowFullScreen
            // Enhanced permissions to support external CRMs
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-downloads allow-modals"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; camera; microphone; geolocation"
            referrerPolicy="origin"
         />
      </div>
    </div>
  );
}
