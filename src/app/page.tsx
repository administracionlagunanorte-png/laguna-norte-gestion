'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Loading spinner shown during SSR (and before client JS hydrates)
function LoadingSpinner() {
  return (
    <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm font-bold">Cargando...</p>
      </div>
    </div>
  );
}

// Dynamically import the entire app with SSR disabled
// This completely eliminates all hydration/SSR issues
const LagunaNorteApp = dynamic(() => import('./LagunaNorteApp'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

// Cache buster: detectar si el usuario tiene una versión antigua cacheada
// y forzar recarga completa. Esto es crucial para móviles donde Safari/Chrome
// cachean agresivamente el JS.
function CacheBuster() {
  useEffect(() => {
    try {
      const BUILD_VERSION = '2026-07-11-v10-patentes-fix'; // Cambiar este valor en cada deploy crítico
      const stored = localStorage.getItem('app_build_version');
      if (stored !== BUILD_VERSION) {
        localStorage.setItem('app_build_version', BUILD_VERSION);
        // Limpiar caches del navegador
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
        // Forzar recarga con parámetro anti-cache
        const url = window.location.pathname + '?_v=' + BUILD_VERSION;
        window.location.replace(url);
      }
    } catch {
      // Si localStorage falla (modo privado), continuar sin hacer nada
    }
  }, []);
  return null;
}

export default function Home() {
  return (
    <>
      <CacheBuster />
      <LagunaNorteApp />
    </>
  );
}
