import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'puzzle'; levelId?: string }
  | { name: 'studio'; artworkId?: string }
  | { name: 'gallery' }
  | { name: 'explore' }
  | { name: 'about' };

export function parseRoute(raw: string): Route {
  const hash = raw.replace(/^#\/?/, '');
  const [head, ...rest] = hash.split('/').filter(Boolean);
  const param = rest.length > 0 ? decodeURIComponent(rest.join('/')) : undefined;
  switch (head) {
    case 'puzzle':
      return { name: 'puzzle', levelId: param };
    case 'studio':
      return { name: 'studio', artworkId: param };
    case 'gallery':
      return { name: 'gallery' };
    case 'explore':
      return { name: 'explore' };
    case 'about':
      return { name: 'about' };
    default:
      return { name: 'home' };
  }
}

export function routeToPath(route: Route): string {
  switch (route.name) {
    case 'puzzle':
      return route.levelId ? `#/puzzle/${route.levelId}` : '#/puzzle';
    case 'studio':
      return route.artworkId ? `#/studio/${route.artworkId}` : '#/studio';
    case 'gallery':
      return '#/gallery';
    case 'explore':
      return '#/explore';
    case 'about':
      return '#/about';
    default:
      return '#/';
  }
}

export function navigate(route: Route | string): void {
  const path = typeof route === 'string' ? route : routeToPath(route);
  if (window.location.hash === path) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = path;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}
