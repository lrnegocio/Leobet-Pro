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
      // Bloquear F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Bloquear Ctrl + U (Ver código fonte)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }

      // Bloquear Ctrl + S (Salvar página)
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }

      // Bloquear Ferramentas de Desenvolvedor (Ctrl+Shift+I, J, C)
      if (e.ctrlKey && e.shiftKey && (['I', 'J', 'C'].includes(e.key.toUpperCase()))) {
        e.preventDefault();
        return false;
      }

      // Bloquear Cmd + Alt + I (Mac Developer Tools)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }
    };

    // 3. BLOQUEIO DE SELEÇÃO E CÓPIA
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // 4. PROTEÇÃO DE CONSOLE (LIMPA O CONSOLE REPETIDAMENTE)
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

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    
    // Proteção contra drag and drop
    document.addEventListener('dragstart', (e) => e.preventDefault());

    disableConsole();

    // Loop infinito para travar quem tenta forçar o console aberto
    const heartBeat = setInterval(() => {
       if (process.env.NODE_ENV === 'production') {
          console.clear();
       }
    }, 1000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      clearInterval(heartBeat);
    };
  }, []);

  return (
    <div className="select-none outline-none ring-0 focus:ring-0 active:ring-0">
      <style jsx global>{`
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        input, textarea {
          -webkit-user-select: text !important;
          -khtml-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `}</style>
      {children}
    </div>
  );
}
