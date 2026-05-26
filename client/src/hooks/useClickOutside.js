import { useEffect } from 'react';

/**
 * Hook to execute a callback when a click is detected outside the referenced element.
 * @param {React.RefObject} ref - Ref to the element to watch
 * @param {Function} callback - Callback function to run
 */
export function useClickOutside(ref, callback) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      callback(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, callback]);
}
