'use client';

import React, { useEffect } from 'react';

/**
 * SecurityProvider - Proteção avançada do terminal LEOBET PRO.
 * Bloqueia inspeção, console e cópia não autorizada sem causar erros de frame.
 */
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Bloqueia o menu de contexto (Botão Direito)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Bloqueia teclas de atalho de desenvolvedor
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloqueia F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspecionar/Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
      }

      // Ctrl+U (Exibir Código Fonte)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }

      // Ctrl+S (Salvar Página)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
      }
    };

    // Adiciona os ouvintes de eventos de forma segura no objeto window
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <>{children}</>;
}
