import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning'| "error";

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, description?: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-stone-900 text-stone-100 rounded-xl p-4 shadow-xl border border-stone-800 flex items-start justify-between gap-3 transition-all duration-200 transform translate-y-0"
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'warning' && (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold text-stone-100">{toast.message}</p>
                {toast.description && (
                  <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{toast.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-200 transition-colors p-1 -mr-1 -mt-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
