'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hier würde später die echte Authentifizierung stattfinden
    router.push('/dashboard/contractor');
  };

  return (
    <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Hydra Guard</h1>
          <p className="text-blue-400 text-sm tracking-widest uppercase mt-2">Next-Gen Insurance Tech</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div className="space-y-2">
            <input 
              type="email" placeholder="Berechtigungsschlüssel (Email)" 
              className="w-full p-4 bg-[#002140] border border-blue-900 rounded-xl text-white outline-none focus:border-blue-500 transition-all placeholder:text-blue-900"
            />
          </div>
          <button 
            type="submit"
            className="w-full p-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all group shadow-lg shadow-blue-500/20"
          >
            SYSTEM-ZUGRIFF <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <p className="text-center text-[10px] text-blue-900 uppercase tracking-widest pt-10">
          Secure Core v4.0 | Advanced Disruption Engine
        </p>
      </div>
    </div>
  );
}
