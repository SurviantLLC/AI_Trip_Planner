import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive media queries
 * 
 * @param query - CSS media query string
 * @returns Boolean indicating if the media query matches
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Avoid running on server
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set initial value
      setMatches(media.matches);
      
      // Event listener callback
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Listen for changes
      media.addEventListener('change', listener);
      
      // Cleanup function
      return () => media.removeEventListener('change', listener);
    }
    
    // Default to false on initial server-side render
    return undefined;
  }, [query]);

  return matches;
}

export default useMediaQuery;
