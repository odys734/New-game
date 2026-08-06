import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface OfflineOverlayProps {
  onRetry: () => void;
}

export const OfflineOverlay: React.FC<OfflineOverlayProps> = ({ onRetry }) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const handleRetryClick = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      onRetry();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-cyan-950">
        <WifiOff className="w-10 h-10 text-cyan-400 animate-pulse" />
      </div>

      <h2 className="text-2xl font-bold text-slate-100 mb-2">Internet Connection Required</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
        Liquid Logic relies on continuous AI validation and online servers to verify puzzle physics determinism. Please reconnect to proceed.
      </p>

      <button
        onClick={handleRetryClick}
        disabled={isChecking}
        className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
        <span>{isChecking ? 'Verifying Connection...' : 'Retry Connection'}</span>
      </button>
    </div>
  );
};
