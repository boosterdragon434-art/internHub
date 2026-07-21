import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Ultra-optimized canvas particle system.
 * - Adaptive particle count (fewer on mobile)
 * - Single composite draw per frame
 * - No object allocation in the render loop
 * - Pauses when tab is not visible
 */
const FloatingParticles = ({ reducedMotion = false }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef(null);
  const timeRef = useRef(0);
  const isVisibleRef = useRef(true);

  const initParticles = useCallback((width, height) => {
    // Fewer particles on small screens for performance
    const isMobile = width < 768;
    const count = isMobile ? 15 : 25;

    const particles = new Float64Array(count * 8);
    // Layout: [x, y, size, speedX, speedY, phase, frequency, colorIdx] per particle
    for (let i = 0; i < count; i++) {
      const offset = i * 8;
      particles[offset]     = Math.random() * width;       // x
      particles[offset + 1] = Math.random() * height;      // y
      particles[offset + 2] = Math.random() * 2.5 + 1;     // size
      particles[offset + 3] = (Math.random() - 0.5) * 0.2; // speedX
      particles[offset + 4] = (Math.random() - 0.5) * 0.15;// speedY
      particles[offset + 5] = Math.random() * 6.28;        // phase
      particles[offset + 6] = Math.random() * 0.004 + 0.001;// frequency
      particles[offset + 7] = Math.floor(Math.random() * 4);// colorIdx
    }
    particlesRef.current = { data: particles, count };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const colors = [
      'rgba(37,99,235,0.22)',   // blue
      'rgba(37,99,235,0.10)',   // blue light
      'rgba(249,115,22,0.18)',  // orange
      'rgba(249,115,22,0.08)', // orange light
    ];

    let width, height, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for perf
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!particlesRef.current) {
        initParticles(width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Pause when tab hidden
    const onVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current && !reducedMotion) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reducedMotion) {
      // Draw once, static
      const p = particlesRef.current;
      if (p) {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < p.count; i++) {
          const o = i * 8;
          ctx.beginPath();
          ctx.arc(p.data[o], p.data[o + 1], p.data[o + 2], 0, 6.28);
          ctx.fillStyle = colors[p.data[o + 7]];
          ctx.fill();
        }
      }
      return () => {
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }

    const animate = () => {
      if (!isVisibleRef.current) return;

      const p = particlesRef.current;
      if (!p) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      timeRef.current++;
      const t = timeRef.current;

      for (let i = 0; i < p.count; i++) {
        const o = i * 8;
        const freq = p.data[o + 6];
        const phase = p.data[o + 5];

        // Update position with sine drift
        p.data[o]     += p.data[o + 3] + Math.sin(t * freq + phase) * 0.15;
        p.data[o + 1] += p.data[o + 4] + Math.cos(t * freq * 0.7 + phase) * 0.1;

        // Wrap
        if (p.data[o] < -5) p.data[o] = width + 5;
        else if (p.data[o] > width + 5) p.data[o] = -5;
        if (p.data[o + 1] < -5) p.data[o + 1] = height + 5;
        else if (p.data[o + 1] > height + 5) p.data[o + 1] = -5;

        // Draw
        ctx.beginPath();
        ctx.arc(p.data[o], p.data[o + 1], p.data[o + 2], 0, 6.28);
        ctx.fillStyle = colors[p.data[o + 7]];
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [reducedMotion, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1, willChange: 'auto' }}
      aria-hidden="true"
    />
  );
};

export default React.memo(FloatingParticles);
