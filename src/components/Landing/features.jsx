import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../contexts/AuthContext';
import { featuresData } from './featuresData';
import LoginModal from './LoginModal';

gsap.registerPlugin(ScrollTrigger);

/**
 * ─── Features ──────────────────────────────────────────────────
 * K72-inspired project grid section.
 *
 * Layout:
 *  - Massive "FEATURES" heading with superscript count
 *  - 2-column grid of project cards
 *  - Each card = large image + metadata row above
 *  - Hover: image scales, rounded corners appear, "VIEW PROJECT" overlay
 *  - Scroll: cards fade-in with stagger, subtle parallax on rows
 *  - Click: auth-aware navigation
 */
function Features() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const rowRefs = useRef([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingFeatureTitle, setPendingFeatureTitle] = useState('');

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Handle project click ───────────────────────────────────── */
  const handleProjectClick = useCallback(
    (feature) => {
      if (isAuthenticated) {
        navigate(feature.route);
      } else {
        setPendingFeatureTitle(feature.title);
        setShowLoginModal(true);
      }
    },
    [isAuthenticated, navigate]
  );

  /* ── GSAP scroll animations ─────────────────────────────────── */
  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        /* Heading entrance */
        if (headingRef.current) {
          gsap.fromTo(
            headingRef.current,
            { opacity: 0, y: 100 },
            {
              opacity: 1,
              y: 0,
              duration: 1.2,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: headingRef.current,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        /* Row entrance with stagger + parallax */
        rowRefs.current.forEach((row, i) => {
          if (!row) return;
          const cards = row.querySelectorAll('.project-card');

          // Fade-in entrance
          gsap.fromTo(
            cards,
            { opacity: 0, y: 120 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              stagger: 0.15,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: row,
                start: 'top 88%',
                toggleActions: 'play none none reverse',
              },
            }
          );

          // Subtle parallax: even rows move slightly slower
          if (i % 2 === 1) {
            gsap.to(row, {
              y: -30,
              ease: 'none',
              scrollTrigger: {
                trigger: row,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
              },
            });
          }
        });

        ScrollTrigger.refresh();
      }, sectionRef);

      return () => ctx.revert();
    }, 200);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  /* ── Build rows of 2 ────────────────────────────────────────── */
  const rows = [];
  for (let i = 0; i < featuresData.length; i += 2) {
    rows.push(featuresData.slice(i, i + 2));
  }

  return (
    <>
      <section
        ref={sectionRef}
        className="relative w-full bg-black pointer-events-auto"
        aria-label="Features section"
        style={{ paddingBottom: '12vh' }}
      >
        {/* ── Heading ──────────────────────────────────────────── */}
        <div
          ref={headingRef}
          className="px-6 md:px-12 lg:px-16 pt-24 md:pt-32 pb-12 md:pb-20"
        >
          <h2 className="text-white text-[15vw] md:text-[12vw] lg:text-[10vw] font-black uppercase leading-[0.85] tracking-tight font-[font1] relative inline-block">
            Features
            <sup className="text-[3vw] md:text-[2.5vw] align-top ml-2 font-normal tracking-normal">
              {featuresData.length}
            </sup>
          </h2>
        </div>

        {/* ── Project Grid ────────────────────────────────────── */}
        <div className="px-4 md:px-10 lg:px-14">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              ref={(el) => (rowRefs.current[rowIndex] = el)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6"
            >
              {row.map((feature) => (
                <ProjectCard
                  key={feature.id}
                  feature={feature}
                  onClick={() => handleProjectClick(feature)}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => navigate('/auth')}
        onSignup={() => navigate('/auth')}
        featureTitle={pendingFeatureTitle}
      />
    </>
  );
}

/**
 * ─── ProjectCard ────────────────────────────────────────────────
 * Single project card matching K72 aesthetic:
 *  - Metadata row: title (left) · description (center) · year (right)
 *  - Large image with overflow:hidden
 *  - Hover: image scale + rounded corners + "VIEW PROJECT" overlay
 */
function ProjectCard({ feature, onClick, prefersReducedMotion }) {
  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (prefersReducedMotion) return;
    gsap.to(imageRef.current, {
      scale: 1.05,
      duration: 0.8,
      ease: 'power3.out',
    });
    gsap.to(containerRef.current, {
      borderRadius: '20px',
      duration: 0.5,
      ease: 'power2.out',
    });
    gsap.to(overlayRef.current, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (prefersReducedMotion) return;
    gsap.to(imageRef.current, {
      scale: 1,
      duration: 0.8,
      ease: 'power3.out',
    });
    gsap.to(containerRef.current, {
      borderRadius: '0px',
      duration: 0.5,
      ease: 'power2.out',
    });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  return (
    <div
      className="project-card cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      role="button"
      tabIndex={0}
      aria-label={`View ${feature.title}`}
    >
      {/* ── Metadata row ──────────────────────────────────────── */}
      <div className="flex items-baseline justify-between px-1 py-3 md:py-4 border-b border-white/10">
        <span className="text-white text-sm md:text-base lg:text-lg font-semibold tracking-tight">
          {feature.title}
        </span>
        <span className="text-white/40 text-xs md:text-sm hidden md:block">
          {feature.description}
        </span>
        <span className="text-white/40 text-xs md:text-sm font-medium">
          {feature.year}
        </span>
      </div>

      {/* ── Image container ───────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden w-full will-change-[border-radius]"
        style={{ aspectRatio: '16 / 10', borderRadius: '0px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imageRef}
          src={feature.image}
          alt={feature.title}
          className="w-full h-full object-cover will-change-transform"
          style={{ transform: 'scale(1)' }}
          loading="lazy"
        />

        {/* Hover overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 will-change-[opacity]"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <span
            className="text-white text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-wider px-8 py-3 border-2 border-white rounded-full"
            style={{ backdropFilter: 'blur(4px)' }}
          >
            View Project
          </span>
        </div>
      </div>

      {/* ── Tags row ──────────────────────────────────────────── */}
      <div className="px-1 pt-2 pb-1">
        <span className="text-white/30 text-xs tracking-wide">
          {feature.tags}
        </span>
      </div>
    </div>
  );
}

export default Features;