import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { View } from '../types';

interface NavState {
  stack: View[];
  pos: number;
}

interface NavContextValue {
  view: View;
  canGoBack: boolean;
  canGoForward: boolean;
  navigate: (view: View) => void;
  replace: (view: View) => void;
  back: () => void;
  forward: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export const viewKey = (view: View): string => {
  switch (view.type) {
    case 'home':
      return 'home';
    case 'search':
      return 'search';
    case 'collection':
      return `collection:${view.id}`;
    case 'library':
      return 'library';
    case 'settings':
      return 'settings';
  }
};

const same = (a: View, b: View): boolean => JSON.stringify(a) === JSON.stringify(b);

export function NavProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavState>({ stack: [{ type: 'home' }], pos: 0 });

  const navigate = useCallback((view: View) => {
    setState((s) => {
      if (same(s.stack[s.pos], view)) return s;
      const stack = [...s.stack.slice(0, s.pos + 1), view];
      return { stack, pos: stack.length - 1 };
    });
  }, []);

  const replace = useCallback((view: View) => {
    setState((s) => {
      if (same(s.stack[s.pos], view)) return s;
      const stack = s.stack.slice();
      stack[s.pos] = view;
      return { stack, pos: s.pos };
    });
  }, []);

  const back = useCallback(() => setState((s) => (s.pos > 0 ? { ...s, pos: s.pos - 1 } : s)), []);
  const forward = useCallback(
    () => setState((s) => (s.pos < s.stack.length - 1 ? { ...s, pos: s.pos + 1 } : s)),
    [],
  );

  const value = useMemo<NavContextValue>(
    () => ({
      view: state.stack[state.pos],
      canGoBack: state.pos > 0,
      canGoForward: state.pos < state.stack.length - 1,
      navigate,
      replace,
      back,
      forward,
    }),
    [state, navigate, replace, back, forward],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside <NavProvider>');
  return ctx;
}
