import { useEffect } from 'react';

/** Rendered on "not found" screens so search engines don't index them as real pages (soft 404s). */
export default function Noindex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return null;
}
