'use client';

import React, { useEffect } from 'react';

/**
 * SecurityProvider - Proteção avançada do terminal LEOBET PRO.
 * Bloqueia inspeção e cópia não autorizada de forma segura.
 */
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Bloqueia o menu de contexto (Botão Direito)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Bloqueia teclas de atalho de desenvolvedor
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloqueia F12 (123)
      if (e.keyCode === 123 || e.key === 'F12') {
        e.preventDefault();
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspecionar/Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
      }

      // Ctrl+U (Exibir Código Fonte - 85)
      if (e.ctrlKey && (e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
      }

      // Ctrl+S (Salvar Página - 83)
      if (e.ctrlKey && (e.key === 's' || e.keyCode === 83)) {
        e.preventDefault();
      }
    };

    // Adiciona os ouvintes apenas se estiver no navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('keydown', handleKeyDown, true);
      }
    };
  }, []);

  return <>{children}</>;
}
