
'use client';

import React from 'react';

/**
 * SecurityProvider - Gerencia camadas de proteção da aplicação.
 * Removidos bloqueios de interface (Context Menu/F12) para evitar 
 * sinalizações de segurança de plataformas de hospedagem e melhorar UX.
 */
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
