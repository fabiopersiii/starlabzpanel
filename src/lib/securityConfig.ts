import helmet from 'helmet';

// Configuração básica do Helmet com CSP
const securityMiddleware = helmet({
  contentSecurityPolicy: {
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
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// Rate limiting configuration
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(import.meta.env.VITE_RATE_LIMIT || "60"), // Limite por IP
  message: "Muitas requisições deste IP, por favor tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
};

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://webhook.dpscloud.online'] 
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400, // 24 horas
};

export { securityMiddleware, rateLimit, corsOptions };
