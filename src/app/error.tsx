'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = window.location.pathname + '?_t=' + Date.now();
  };

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-slate-800 uppercase mb-2">Error de la Aplicacion</h2>
        <p className="text-slate-500 text-sm mb-4">Ha ocurrido un error inesperado. Intenta reintentar o limpiar la caché.</p>
        <pre className="mt-2 mb-4 p-3 bg-slate-50 rounded-xl text-left text-[10px] text-red-600 font-mono overflow-auto max-h-40">
          {error?.message || 'Error desconocido'}
        </pre>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-transform"
          >
            REINTENTAR
          </button>
          <button
            onClick={handleHardReset}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Limpiar caché y recargar
          </button>
        </div>
      </div>
    </div>
  );
}
