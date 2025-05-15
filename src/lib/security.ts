import xss from 'xss';
import { SECURITY_CONFIG } from './securityConfig';
import crypto from 'crypto';

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

export function validateCredentials(username: string, password: string): boolean {
  const { validation } = SECURITY_CONFIG;
  
  // Valida o nome de usuário
  if (username.length < validation.username.minLength || 
      username.length > validation.username.maxLength ||
      !validation.username.pattern.test(username)) {
    return false;
  }
  
  // Valida a senha
  if (password.length < validation.password.minLength ||
      password.length > validation.password.maxLength ||
      !validation.password.pattern.test(password)) {
    return false;
  }
  
  return true;
}

// Função para hash seguro de senhas
export async function hashPassword(password: string): Promise<string> {
  const { encryption } = SECURITY_CONFIG;
  const salt = crypto.randomBytes(encryption.saltLength);
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password, 
      salt, 
      encryption.iterations, 
      encryption.keyLength, 
      encryption.digest,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
      }
    );
  });
}

// Função para verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const { encryption } = SECURITY_CONFIG;
  const [salt, key] = hashedPassword.split(':');
  
  return new Promise((resolve, reject) => {
    const saltBuffer = Buffer.from(salt, 'hex');
    crypto.pbkdf2(
      password,
      saltBuffer,
      encryption.iterations,
      encryption.keyLength,
      encryption.digest,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') === key);
      }
    );
  });
}

// Função para criptografar dados sensíveis
export function encryptData(data: string): { encrypted: string; iv: string; tag: string } {
  const { encryption } = SECURITY_CONFIG;
  const iv = crypto.randomBytes(encryption.ivLength);
  const cipher = crypto.createCipheriv(
    encryption.algorithm,
    crypto.scryptSync(SECURITY_CONFIG.auth.JWT_SECRET, 'salt', encryption.keyLength),
    iv,
    { authTagLength: encryption.tagLength }
  );
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

// Função para descriptografar dados
export function decryptData(encrypted: string, iv: string, tag: string): string {
  const { encryption } = SECURITY_CONFIG;
  const decipher = crypto.createDecipheriv(
    encryption.algorithm,
    crypto.scryptSync(SECURITY_CONFIG.auth.JWT_SECRET, 'salt', encryption.keyLength),
    Buffer.from(iv, 'hex'),
    { authTagLength: encryption.tagLength }
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Padrões comuns de validação
export const patterns = {
  username: SECURITY_CONFIG.validation.username.pattern,
  password: SECURITY_CONFIG.validation.password.pattern,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-]{10,}$/
};
