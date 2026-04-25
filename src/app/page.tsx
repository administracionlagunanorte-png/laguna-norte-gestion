'use client';

import dynamic from 'next/dynamic';

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

export default function Home() {
  return <LagunaNorteApp />;
}
