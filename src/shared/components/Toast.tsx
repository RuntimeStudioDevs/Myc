import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-14 sm:top-16 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md mx-auto sm:mx-0 z-50 bg-blue-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 border border-blue-700 animate-in fade-in slide-in-from-top-2">
      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="flex-1">{message}</span>
    </div>
  );
};
