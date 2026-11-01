import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useCallback } from 'react';

export function Toast({ type, message, onClose }: { type: 'success' | 'error', message: string, onClose: () => void }) {
  // Stabilize the onClose callback
  const handleClose = useCallback(() => { onClose(); }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, 4000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white z-50 transition-all ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-medium pr-4">{message}</span>
      <button onClick={handleClose} className="hover:opacity-75 transition"><X className="w-4 h-4" /></button>
    </div>
  );
}