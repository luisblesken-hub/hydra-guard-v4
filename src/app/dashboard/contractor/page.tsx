'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, AlertTriangle, Settings, RefreshCw } from 'lucide-react';

// Verbindung zu deiner Supabase-Datenbank herstellen
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ContractorDashboard() {
  const [markup, setMarkup] = useState(15);
  const [loading, setLoading] = useState(true);
  const basePrice = 4200; // Dein Basiswert aus der Datenbank
  const insuranceLimit = 5500;
  
  const currentTotal = basePrice * (1 + markup / 100);
  const isOverLimit = currentTotal > insuranceLimit;

  // 1. DATEN BEIM LADEN ABFRAGEN
  useEffect(() => {
    async function fetchMargin() {
      const { data, error } = await supabase
        .from('claims')
        .select('margin')
        .limit(1)
        .single();
      
      if (data) setMarkup(data.margin);
      setLoading(false);
    }
    fetchMargin();
  }, []);

  // 2. DATEN BEIM SLIDEN SPEICHERN
  async function updateMargin(newVal: number) {
    setMarkup(newVal);
    // Hier nutzen wir das Testprojekt aus deiner Datenbank
    await supabase
      .from('claims')
      .update({ margin: newVal })
      .match({ project_name: 'Testprojekt Hydra' });
  }

  if (loading) return (
    <div className="min-h-screen bg-[#001529] flex items-center justify-center">
      <RefreshCw className="animate-spin text-blue-500 w-8 h-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001529] text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-blue-900/50 pb-4">
        <h1 className="text-lg font-bold tracking-tighter text-blue-100 uppercase italic">Hydra | Contractor</h1>
        <Settings className="w-5 h-5 text-blue-800" />
      </header>

      <main className="max-w-xl mx-auto space-y-8">
        <div className={`p-8 rounded-3xl border transition-all duration-700 ${isOverLimit ? 'bg-red-950/10 border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.1)]' : 'bg-[#002140] border-blue-800 shadow-2xl'}`}>
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold mb-2">Projekt-Marge</p>
              <h2 className="text-5xl font-black tracking-tighter tabular-nums">{markup}%</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500 font-bold mb-2 font-sans">Angebotssumme</p>
              <p className={`text-3xl font-bold tabular-nums ${isOverLimit ? 'text-red-500' : 'text-green-400'}`}>
                {currentTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>

          <input 
            type="range" min="0" max="40" step="1" value={markup} 
            onChange={(e) => updateMargin(parseInt(e.target.value))}
            className="w-full h-1.5 bg-blue-900/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          <div className={`mt-10 flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 ${isOverLimit ? 'bg-red-900/10 border-red-800/50' : 'bg-green-900/10 border-green-800/50'}`}>
            <div className={`p-2 rounded-full ${isOverLimit ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              {isOverLimit ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <p className={`text-sm font-bold ${isOverLimit ? 'text-red-400' : 'text-green-400'}`}>
                {isOverLimit ? 'Limit überschritten' : 'KI-Direktfreigabe'}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5 uppercase tracking-wider font-bold">
                Hydra-Algorithmus Status
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
