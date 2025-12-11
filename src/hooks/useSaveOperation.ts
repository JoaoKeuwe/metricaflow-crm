import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseSaveOperationOptions {
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

export function useSaveOperation(options: UseSaveOperationOptions = {}) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const {
    successMessage = 'Salvo com sucesso!',
    errorMessage = 'Erro ao salvar. Tente novamente.',
    showToast = true,
  } = options;

  const execute = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      setStatus('saving');
      setError(null);

      try {
        const result = await operation();
        setStatus('saved');

        if (showToast) {
          toast({
            title: '✓ Salvo',
            description: successMessage,
          });
        }

        // Reset to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : errorMessage;
        setStatus('error');
        setError(message);

        if (showToast) {
          toast({
            title: 'Erro ao salvar',
            description: message,
            variant: 'destructive',
          });
        }

        // Reset to idle after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);

        return null;
      }
    },
    [successMessage, errorMessage, showToast]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    error,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    isError: status === 'error',
    execute,
    reset,
  };
}
