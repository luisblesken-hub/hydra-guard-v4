'use client';
import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Settings, TrendingUp } from 'lucide-react';

export default function ContractorDashboard() {
  const [markup, setMarkup] = useState(15);
  const basePrice = 4200;
  const insuranceLimit = 5100;
  const currentTotal = basePrice * (1 + markup / 100);
  const isOverLimit = currentTotal > insuranceLimit;

  return (
    <div className="min-h-screen bg-[#000d1a] text-white p-6 font-sans">
      {/* ELITE HEADER */}
      <header className="flex justify-between items-center mb-10 border-b border-blue-900/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
          <h1 className="text-xl font-black tracking-widest uppercase">Hydra | Contractor</h1>
        </div>
        <Settings className="w-5 h-5 text-blue-900 hover:text-blue-400 transition-colors cursor-pointer" />
      </header>

      <main className="max-w-xl mx-auto space-y-8">
        {/* GAMIFICATION CARD */}
        <div className={`p-8 rounded-3xl border transition-all duration-700 ${isOverLimit ? 'bg-red-950/10 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.1)]' : 'bg-[#001529] border-blue-900 shadow-2xl'}`}>
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold mb-2">Projekt-Marge</p>
              <h2 className="text-6xl font-black tracking-tighter tabular-nums">{markup}%</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold mb-2">Angebotssumme</p>
              <p className={`text-3xl font-bold tabular-nums transition-colors ${isOverLimit ? 'text-red-500' : 'text-green-400'}`}>
                {currentTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>

          <input 
            type="range" min="0" max="40" step="1" value={markup} 
            onChange={(e) => setMarkup(parseInt(e.target.value))}
            className="w-full h-1.5 bg-blue-950 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
          />

          <div className={`mt-10 flex items-center gap-4 p-5 rounded-2xl border transition-all ${isOverLimit ? 'bg-red-900/10 border-red-800/40' : 'bg-green-900/10 border-green-800/40'}`}>
            <div className={`p-2 rounded-full ${isOverLimit ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              {isOverLimit ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div>
              <p className={`font-bold ${isOverLimit ? 'text-red-400' : 'text-green-400'}`}>
                {isOverLimit ? 'Limit überschritten' : 'KI-Direktfreigabe'}
              </p>
              <p className="text-[11px] text-blue-800 uppercase font-medium tracking-wider">Hydra-Algorithmus Status</p>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="grid gap-3">
          {[
            { label: "Materialkosten", val: 1800 },
            { label: "Arbeitsstunden", val: 2400 }
          ].map((item, i) => (
            <div key={i} className="flex justify-between p-4 bg-blue-950/20 border border-blue-900/20 rounded-2xl hover:bg-blue-950/40 transition-colors">
              <span className="text-sm text-blue-200">{item.label}</span>
              <span className="text-sm font-mono text-blue-500">
                {(item.val * (1 + markup/100)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
