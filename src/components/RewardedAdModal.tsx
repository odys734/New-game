import React, { useEffect, useState } from 'react';
import { Gift, Sparkles, Tv, CheckCircle, X } from 'lucide-react';

interface RewardedAdModalProps {
  rewardTitle: string;
  rewardAmount: number;
  rewardUnit?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  rewardTitle,
  rewardAmount,
  rewardUnit = 'Coins',
  onComplete,
  onCancel,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsFinished(true);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative text-slate-100 text-center animate-scale-up">
        {/* Close button if finished or allowed */}
        {isFinished && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4">
          <Tv className="w-8 h-8 text-amber-400" />
        </div>

        <h3 className="font-bold text-lg text-slate-100 mb-1">Bonus Rewarded Stream</h3>
        <p className="text-xs text-slate-400 mb-6">
          {rewardTitle} (+{rewardAmount} {rewardUnit})
        </p>

        {/* Video simulation card */}
        <div className="relative aspect-video w-full bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/40 via-purple-950/40 to-slate-950 animate-pulse" />

          {!isFinished ? (
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-3xl font-extrabold text-amber-400 mb-1">{countdown}s</span>
              <span className="text-xs text-slate-400 font-medium">Simulating Rewarded Sponsor Stream...</span>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
              <span className="text-sm font-bold text-emerald-300">Reward Ready!</span>
            </div>
          )}
        </div>

        <button
          onClick={onComplete}
          disabled={!isFinished}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isFinished ? `Claim +${rewardAmount} ${rewardUnit}` : `Watching Sponsor (${countdown}s)...`}
        </button>
      </div>
    </div>
  );
};
