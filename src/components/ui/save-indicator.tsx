import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
  showText?: boolean;
}

export function SaveIndicator({ status, className, showText = true }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm transition-all duration-300',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-green-500',
        status === 'error' && 'text-destructive',
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span>Salvando...</span>}
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-4 w-4" />
          {showText && <span>Salvo</span>}
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4" />
          {showText && <span>Erro ao salvar</span>}
        </>
      )}
    </div>
  );
}
