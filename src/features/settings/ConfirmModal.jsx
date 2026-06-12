import React, { useRef, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import gsap from 'gsap';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      }
      if (panelRef.current) {
        gsap.fromTo(panelRef.current,
          { scale: 0.9, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)', delay: 0.05 }
        );
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    }
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        scale: 0.9, opacity: 0, y: 20,
        duration: 0.2, ease: 'power2.in',
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  const variantStyles = {
    danger: {
      icon: 'bg-red-500/10 text-red-400 border-red-500/20',
      button: 'bg-red-600 hover:bg-red-500 shadow-red-500/20',
    },
    warning: {
      icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20',
    },
    info: {
      icon: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
    },
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${styles.icon}`}>
            <AlertTriangle size={28} />
          </div>

          <h3 className="text-xl font-bold text-white mb-2 font-[font2]">{title}</h3>
          <p className="text-gray-400 text-sm mb-6 font-[font1] leading-relaxed max-w-sm">{message}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold transition-all font-[font2] text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); handleClose(); }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-semibold transition-all hover:shadow-lg font-[font2] text-sm ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
