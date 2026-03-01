
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handler = (error: FirestorePermissionError) => {
      // In development, we want to see this error clearly.
      // In a real production app, we might handle it more subtly.
      toast({
        variant: "destructive",
        title: "Erro de Permissão",
        description: `Acesso negado em: ${error.context.path} (${error.context.operation})`,
      });
      
      // We throw it so it hits the Next.js error overlay in development
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handler);
    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, [toast]);

  return null;
}
