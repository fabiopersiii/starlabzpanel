import { sanitizeInput, validateInput, patterns } from './security';
import { auth } from './auth';
import { toast } from 'sonner';

interface RequestOptions {
  requireAuth?: boolean;
  requiredRole?: string;
  validateBody?: {
    [key: string]: RegExp;
  };
}

interface Headers {
  [key: string]: string;
}

export async function validateRequest(
  url: string,
  method: string,
  body?: any,
  options: RequestOptions = {}
): Promise<{ headers: Headers; body?: any }> {
  const headers: Headers = {
    'Content-Type': 'application/json',
  };

  // Adiciona o token de API se existir
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // Verifica autenticação se necessário
  if (options.requireAuth) {
    const token = auth.getToken();
    if (!token) {
      toast.error('Você precisa estar autenticado para realizar esta ação');
      throw new Error('Autenticação necessária');
    }
    headers['Authorization'] = `Bearer ${token}`;

    // Verifica role se necessário
    if (options.requiredRole && !auth.hasRole(options.requiredRole)) {
      toast.error('Você não tem permissão para realizar esta ação');
      throw new Error('Permissão negada');
    }
  }

  // Sanitiza e valida o body se necessário
  if (body && options.validateBody) {
    const sanitizedBody = { ...body };
    
    for (const [key, pattern] of Object.entries(options.validateBody)) {
      if (body[key] !== undefined) {
        const sanitizedValue = sanitizeInput(body[key].toString());
        if (!validateInput(sanitizedValue, pattern)) {
          toast.error(`Valor inválido para o campo ${key}`);
          throw new Error(`Validação falhou para o campo ${key}`);
        }
        sanitizedBody[key] = sanitizedValue;
      }
    }

    return { headers, body: sanitizedBody };
  }

  return { headers, body };
}

// Exemplo de uso:
/*
const { headers, body } = await validateRequest('/api/user', 'POST', {
  username: 'john_doe',
  email: 'john@example.com'
}, {
  requireAuth: true,
  requiredRole: 'admin',
  validateBody: {
    username: patterns.username,
    email: patterns.email
  }
});
*/
