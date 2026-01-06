import React, { useState } from 'react';
import { AppSettings, Ticket } from '../types';
import { Package, Box, Tag, FileText, ChevronDown } from 'lucide-react';

interface BrandsWorksProps {
  settings: AppSettings;
  tickets: Ticket[]; 
}

export default function BrandsWorks({ settings, tickets }: BrandsWorksProps) {
  // Use the service brands from settings
  const brands = settings.serviceBrands;
  
  // Default to the first brand if available
  const [activeBrandId, setActiveBrandId] = useState<string>(brands[0]?.id || '');

  const activeBrand = brands.find(b => b.id === activeBrandId);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-140px)] gap-6">
      {/* Header / Intro */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
          <Package size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Brands Works</h2>
          <p className="text-slate-500">Track jobs, parts, and workflows for specific partner brands.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* Sidebar Tabs (Desktop) / Dropdown (Mobile) */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             
             {/* Mobile Dropdown */}
             <div className="lg:hidden p-4">
                <div className="relative">
                   <select 
                      value={activeBrandId}
                      onChange={(e) => setActiveBrandId(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                   >
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
             </div>

             {/* Desktop Vertical Tabs */}
             <div className="hidden lg:block p-3 space-y-1">
                <h3 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Partner Brands</h3>
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => setActiveBrandId(brand.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      activeBrandId === brand.id 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{brand.name}</span>
                    {activeBrandId === brand.id && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                  </button>
                ))}
                {brands.length === 0 && (
                   <p className="px-4 py-2 text-sm text-slate-400 italic">No brands configured.</p>
                )}
             </div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[400px]">
           {activeBrand ? (
             <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                      {activeBrand.name.charAt(0)}
                   </div>
                   <div>
                      <h1 className="text-3xl font-black text-slate-800">{activeBrand.name}</h1>
                      <p className="text-slate-400 font-medium text-sm flex items-center gap-1">
                        <Tag size={12} /> Work Dashboard
                      </p>
                   </div>
                </div>

                {/* Blank Page Placeholder */}
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                    <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                        <Box size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Work Data Yet</h3>
                    <p className="text-slate-500 max-w-sm">
                      This is a blank works dashboard for <span className="font-bold text-slate-700">{activeBrand.name}</span>. 
                      You can add work orders, specific part inventories, or task lists here.
                    </p>
                    <button className="mt-8 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                       <FileText size={18} /> Add Work Item
                    </button>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Package size={48} className="mb-4 opacity-50" />
                <p>Select a brand to view work details.</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}