import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';

/**
 * Zero-re-render mouse position tracker.
 * Uses refs + CSS custom properties instead of React state so the entire
 * component tree never re-renders on mouse move. Children read position
 * via the ref or via CSS variables --mouse-x / --mouse-y on the container.
 */
const MouseContext = createContext({
  posRef: { current: { x: 0, y: 0, normalizedX: 0, normalizedY: 0 } },
});

export const useMousePosition = () => useContext(MouseContext);

export const MouseTracker = ({ children, containerRef }) => {
  const posRef = useRef({ x: 0, y: 0, normalizedX: 0, normalizedY: 0 });
  const rafId = useRef(null);
  const latestEvent = useRef(null);

  const updateMouse = useCallback(() => {
    const e = latestEvent.current;
    if (!e || !containerRef?.current) {
      rafId.current = null;
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normalizedX = (x / rect.width) * 2 - 1;
    const normalizedY = (y / rect.height) * 2 - 1;

    posRef.current = { x, y, normalizedX, normalizedY };

    // Push tilt values to CSS custom properties — zero React re-renders
    containerRef.current.style.setProperty('--mouse-nx', normalizedX.toFixed(3));
    containerRef.current.style.setProperty('--mouse-ny', normalizedY.toFixed(3));

    rafId.current = null;
  }, [containerRef]);

  const handleMouseMove = useCallback((e) => {
    latestEvent.current = e;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(updateMouse);
    }
  }, [updateMouse]);

  // Reset on mouse leave so the dashboard snaps back to center
  const handleMouseLeave = useCallback(() => {
    if (containerRef?.current) {
      posRef.current = { x: 0, y: 0, normalizedX: 0, normalizedY: 0 };
      containerRef.current.style.setProperty('--mouse-nx', '0');
      containerRef.current.style.setProperty('--mouse-ny', '0');
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    container.style.setProperty('--mouse-nx', '0');
    container.style.setProperty('--mouse-ny', '0');
    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [containerRef, handleMouseMove, handleMouseLeave]);

  const value = React.useMemo(() => ({ posRef }), []);

  return (
    <MouseContext.Provider value={value}>
      {children}
    </MouseContext.Provider>
  );
};

export default MouseTracker;
