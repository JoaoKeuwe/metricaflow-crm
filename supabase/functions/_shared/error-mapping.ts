/**
 * Shared error mapping utility for Edge Functions
 * Maps database/API errors to safe, user-friendly messages
 * Prevents information disclosure through verbose error messages
 */

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * Maps database error codes to user-friendly messages
 * Logs detailed errors server-side only
 */
export function mapDatabaseError(error: any): ErrorResponse {
  // Log detailed error server-side
  console.error('Database error:', {
    code: error.code,
    message: error.message,
    details: error.details,
  });

  // Map to safe user messages
  const errorMap: Record<string, string> = {
    '23505': 'Registro duplicado',
    '23503': 'Referência inválida',
    '23514': 'Dados inválidos',
    '42501': 'Permissão negada',
    '42P01': 'Recurso não encontrado',
    '22P02': 'Formato de dado inválido',
  };

  return {
    success: false,
    error: errorMap[error.code] || 'Erro ao processar solicitação. Tente novamente.',
    code: error.code,
  };
}

/**
 * Maps API/external service errors to user-friendly messages
 */
export function mapApiError(error: any, serviceName: string): ErrorResponse {
  console.error(`${serviceName} error:`, {
    status: error.status,
    statusText: error.statusText,
    message: error.message,
  });

  return {
    success: false,
    error: `Falha na comunicação com ${serviceName}. Tente novamente mais tarde.`,
  };
}

/**
 * Generic error handler for unexpected errors
 */
export function mapGenericError(error: any): ErrorResponse {
  console.error('Unexpected error:', error);

  return {
    success: false,
    error: 'Erro interno do servidor. Contate o suporte se o problema persistir.',
  };
}
