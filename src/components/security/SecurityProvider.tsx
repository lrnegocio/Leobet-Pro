'use client';

import React, { useEffect } from 'react';

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. BLOQUEIO DE BOTÃO DIREITO
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. BLOQUEIO DE TECLAS DE INSPEÇÃO (F12, CTRL+U, CTRL+SHIFT+I, ETC)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (['I', 'J', 'C'].includes(e.key.toUpperCase()))) {
        e.preventDefault();
        return false;
      }
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }
    };

    // 3. BLOQUEIO DE SELEÇÃO E CÓPIA (EXCETO INPUTS)
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', (e) => e.preventDefault());

    // PROTEÇÃO DE CONSOLE
    const disableConsole = () => {
      if (process.env.NODE_ENV === 'production') {
        const noop = () => {};
        (window.console as any).log = noop;
        (window.console as any).info = noop;
        (window.console as any).warn = noop;
        (window.console as any).error = noop;
        (window.console as any).debug = noop;
      }
    };
    disableConsole();

    const heartBeat = setInterval(() => {
       if (process.env.NODE_ENV === 'production') {
          console.clear();
       }
    }, 2000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      clearInterval(heartBeat);
    };
  }, []);

  return (
    <div className="select-none outline-none ring-0">
      <style jsx global>{`
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        input, textarea {
          -webkit-user-select: text !important;
          user-select: text !important;
        }
      `}</style>
      {children}
    </div>
  );
}
