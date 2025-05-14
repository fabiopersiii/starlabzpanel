import xss from 'xss';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
}

const defaultOptions: SanitizeOptions = {
  allowedTags: [], // Nenhuma tag HTML permitida por padrão
  allowedAttributes: {} // Nenhum atributo permitido por padrão
};

export function sanitizeInput(input: string, options: SanitizeOptions = defaultOptions): string {
  if (typeof input !== 'string') return '';
  
  return xss(input, {
    whiteList: options.allowedTags?.reduce((acc, tag) => ({ ...acc, [tag]: [] }), {}) || {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'] // Remove script tags e seu conteúdo
  });
}

export function validateInput(input: string, pattern: RegExp): boolean {
  return pattern.test(sanitizeInput(input));
}

// Padrões comuns de validação
export const patterns = {
  username: /^[a-zA-Z0-9_-]{3,16}$/, // 3-16 caracteres, letras, números, _ e -
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, // Mínimo 8 caracteres, pelo menos uma letra e um número
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-]{10,}$/
};
