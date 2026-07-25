'use client';

import React, { useEffect } from 'react';

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // BLOQUEIO TOTAL DE BOTÃO DIREITO
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // BLOQUEIO DE TECLAS DE INSPEÇÃO (F12, CTRL+U, CTRL+SHIFT+I, ETC)
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

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Proteção contra drag and drop de imagens/texto
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
