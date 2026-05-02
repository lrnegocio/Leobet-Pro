
'use client';

import React, { useEffect } from 'react';

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Bloqueio de Botão Direito
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Bloqueio de Teclas de Inspeção e Atalhos de Hacker
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear F12
      if (e.keyCode === 123 || e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Bloquear Ctrl + U (View Source)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }

      // Bloquear Ctrl + S (Save Page)
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }

      // Bloquear Ctrl + Shift + I / J / C / K (Developer Tools)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) {
        e.preventDefault();
        return false;
      }

      // Bloquear Cmd + Alt + I (Mac Developer Tools)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Proteção contra drag and drop de elementos
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return <>{children}</>;
}
