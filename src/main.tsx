import React, { type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { AuthGate, AuthProvider } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { DialogProvider } from './context/DialogContext';
import { LibraryProvider } from './context/LibraryContext';
import { NavProvider } from './context/NavContext';
import { PlayerProvider } from './context/PlayerContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { spring } from './lib/motion';
import './index.css';

function MotionRoot({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  return (
    <MotionConfig transition={spring} reducedMotion={settings.reduceMotion ? 'always' : 'user'}>
      {children}
    </MotionConfig>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate fallback={<LoginScreen />}>
        <SettingsProvider>
          <MotionRoot>
            <ToastProvider>
              <LibraryProvider>
                <NavProvider>
                  <DialogProvider>
                    <PlayerProvider>
                      <App />
                    </PlayerProvider>
                  </DialogProvider>
                </NavProvider>
              </LibraryProvider>
            </ToastProvider>
          </MotionRoot>
        </SettingsProvider>
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>,
);
