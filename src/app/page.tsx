import React from 'react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#001529] flex items-center justify-center text-white p-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-[#002140] p-10 rounded-xl border border-blue-900 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-widest text-white mb-2 uppercase">Hydra Guard V4</h1>
          <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
          <p className="mt-4 text-sm text-blue-400 uppercase tracking-widest text-center">Enterprise Claims Intelligence</p>
        </div>
        
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="email" 
                placeholder="Business E-Mail" 
                className="w-full px-4 py-3 bg-[#001529] border border-blue-900 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder-blue-800"
              />
            </div>
            <div className="relative">
              <input 
                type="password" 
                placeholder="Passwort" 
                className="w-full px-4 py-3 bg-[#001529] border border-blue-900 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder-blue-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-blue-500">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="rounded bg-[#001529] border-blue-900" />
              <span>Angemeldet bleiben</span>
            </label>
            <a href="#" className="hover:text-blue-400 transition-colors">Passwort vergessen?</a>
          </div>

          <button 
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all uppercase tracking-wider"
          >
            System-Zugang
          </button>
        </form>

        <div className="text-center text-[10px] text-blue-900 pt-6 border-t border-blue-900/30 uppercase tracking-[0.2em]">
          Streng vertraulich • Multi-Tenant Encryption Active
        </div>
      </div>
    </div>
  );
}
