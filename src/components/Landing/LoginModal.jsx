import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

/**
 * ─── LoginModal ─────────────────────────────────────────────────
 * Premium glassmorphism modal shown when unauthenticated users
 * click a feature. GSAP-animated entrance/exit.
 */
function LoginModal({ isOpen, onClose, onLogin, onSignup, featureTitle }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  /* ── GSAP entrance animation ─────────────────────────────────── */
  useEffect(() => {
    if (!overlayRef.current || !modalRef.current) return;

    const ctx = gsap.context(() => {
      if (isOpen) {
        const tl = gsap.timeline();
        tl.fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        tl.fromTo(modalRef.current,
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power4.out' },
          '-=0.15'
        );
      }
    });

    return () => ctx.revert();
  }, [isOpen]);

  /* ── Close with animation ────────────────────────────────────── */
  const handleClose = () => {
    const tl = gsap.timeline({
      onComplete: onClose,
    });
    tl.to(modalRef.current, {
      opacity: 0, y: 30, scale: 0.96, duration: 0.3, ease: 'power2.in',
    });
    tl.to(overlayRef.current, {
      opacity: 0, duration: 0.25, ease: 'power2.in',
    }, '-=0.15');
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Login required"
    >
      <div
        ref={modalRef}
        className="
          relative w-full max-w-md
          rounded-[28px] p-10
          border
          text-center
        "
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderColor: 'rgba(255,255,255,0.1)',
          boxShadow: '0 40px 120px rgba(124,92,255,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Lock icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl"
          style={{ background: 'rgba(124,92,255,0.15)' }}
        >
          🔒
        </div>

        {/* Title */}
        <h2 className="text-white text-2xl font-bold mb-3">
          Login to Continue
        </h2>

        {/* Description */}
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Sign in to access <span className="text-white/80 font-medium">{featureTitle}</span> and
          unlock all premium features of JOBORA.
        </p>

        {/* Login button */}
        <button
          onClick={() => { handleClose(); setTimeout(onLogin, 400); }}
          className="
            w-full py-3.5 rounded-full font-semibold text-sm mb-3
            text-white transition-all duration-300
            hover:scale-[1.02] hover:shadow-lg
          "
          style={{
            background: 'linear-gradient(135deg, #7C5CFF 0%, #5B3FD9 100%)',
            boxShadow: '0 8px 30px rgba(124,92,255,0.3)',
          }}
        >
          Login
        </button>

        {/* Signup button */}
        <button
          onClick={() => { handleClose(); setTimeout(onSignup, 400); }}
          className="
            w-full py-3.5 rounded-full font-semibold text-sm
            text-white/70 border border-white/10
            transition-all duration-300
            hover:bg-white/5 hover:text-white hover:scale-[1.02]
          "
        >
          Create Account
        </button>

        {/* Divider */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <p className="text-white/30 text-xs">
            Free to start · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
