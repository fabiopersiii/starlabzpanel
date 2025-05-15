import { AUTH_CONFIG } from '@/config/auth.config';

export const SECURITY_CONFIG = {
  // Configurações de autenticação
  auth: {
    ...AUTH_CONFIG,
    SESSION_TIMEOUT: 1000 * 60 * 60 * 24, // 24 horas
    REFRESH_THRESHOLD: 1000 * 60 * 5, // 5 minutos antes de expirar
    INACTIVITY_TIMEOUT: 1000 * 60 * 30, // 30 minutos de inatividade
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 1000 * 60 * 15, // 15 minutos de bloqueio
  },

  // Headers de segurança
  headers: {
    'Content-Security-Policy': {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://webhook.dpscloud.online", "https://*.supabase.co"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: parseInt(import.meta.env.VITE_RATE_LIMIT || "100"), // Limite por IP
    message: "Muitas requisições deste IP, por favor tente novamente mais tarde.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // CORS
  cors: {
    origin: import.meta.env.MODE === 'production'
      ? ['https://webhook.dpscloud.online']
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Algorithm',
      'X-Key-Type'
    ],
    credentials: true,
    maxAge: 86400 // 24 horas
  },

  // Validação de entrada
  validation: {
    username: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_.-]+$/
    },
    password: {
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    }
  },

  // Criptografia
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 64,
    tagLength: 16,
    iterations: 100000,
    digest: 'sha512'
  }
} as const;
