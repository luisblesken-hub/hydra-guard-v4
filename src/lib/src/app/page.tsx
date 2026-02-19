import React from 'react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#001529] flex items-center justify-center text-white p-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-[#002140] p-10 rounded-xl border border-blue-900 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-widest text-white mb-2 uppercase">Hydra Guard V4</h1>
          <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
          <p className="mt-4 text-sm text-blue-400 uppercase tracking-widest">Enterprise Claims Intelligence</p>
        </div>
        
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Business E-Mail" 
              className="w-full px-4 py-3 bg-[#001529] border border-blue-900 rounded-lg text-white outline-none"
            />
            <input 
              type="password" 
              placeholder="Passwort" 
              className="w-full px-4 py-3 bg-[#001529] border border-blue-900 rounded-lg text-white outline-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all uppercase tracking-wider"
          >
            System-Zugang
          </button>
        </form>
      </div>
    </div>
  );
}
