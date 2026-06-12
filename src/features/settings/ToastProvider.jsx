import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import gsap from 'gsap';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  error:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     bar: 'bg-red-500' },
  info:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    bar: 'bg-blue-500' },
  warning: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   bar: 'bg-amber-500' },
};

let toastId = 0;

function Toast({ toast, onRemove }) {
  const ref = useRef(null);
  const barRef = useRef(null);
  const Icon = ICONS[toast.type] || Info;
  const colors = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current,
        { x: 80, opacity: 0, scale: 0.95 },
        { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
    if (barRef.current) {
      gsap.fromTo(barRef.current,
        { scaleX: 1 },
        { scaleX: 0, duration: toast.duration / 1000, ease: 'none', transformOrigin: 'left' }
      );
    }
    const timer = setTimeout(() => handleRemove(), toast.duration);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    if (ref.current) {
      gsap.to(ref.current, {
        x: 80, opacity: 0, scale: 0.95,
        duration: 0.3, ease: 'power2.in',
        onComplete: () => onRemove(toast.id),
      });
    } else {
      onRemove(toast.id);
    }
  };

  return (
    <div
      ref={ref}
      className={`relative flex items-start gap-3 p-4 pr-10 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-[420px] overflow-hidden ${colors.bg} ${colors.border}`}
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${colors.text}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-white text-sm font-[font2]">{toast.title}</p>}
        <p className="text-sm text-gray-300 font-[font1] leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div ref={barRef} className={`h-full w-full ${colors.bar} opacity-60`} />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ type: 'success', title, message }),
    error: (message, title) => addToast({ type: 'error', title, message }),
    info: (message, title) => addToast({ type: 'info', title, message }),
    warning: (message, title) => addToast({ type: 'warning', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-auto">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export default ToastContext;
