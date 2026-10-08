import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl text-xs font-medium transition-all transform translate-y-0 backdrop-blur-md ${
                isSuccess
                  ? 'bg-zinc-900/95 dark:bg-zinc-900/95 text-zinc-100 border-emerald-500/40 shadow-emerald-950/20'
                  : isError
                  ? 'bg-zinc-900/95 dark:bg-zinc-900/95 text-zinc-100 border-red-500/40 shadow-red-950/20'
                  : isWarning
                  ? 'bg-zinc-900/95 dark:bg-zinc-900/95 text-zinc-100 border-amber-500/40 shadow-amber-950/20'
                  : 'bg-zinc-900/95 dark:bg-zinc-900/95 text-zinc-100 border-zinc-700 shadow-black/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isSuccess && <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />}
                {isError && <WarningCircle size={18} weight="fill" className="text-red-400 shrink-0" />}
                {isWarning && <WarningCircle size={18} weight="fill" className="text-amber-400 shrink-0" />}
                {!isSuccess && !isError && !isWarning && <Info size={18} weight="fill" className="text-red-500 shrink-0" />}
                <span className="leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg ml-2 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
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
