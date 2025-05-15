import { SECURITY_CONFIG } from './securityConfig';
import CryptoJS from 'crypto-js';

interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export class Encryption {
  private static instance: Encryption;
  private readonly config = SECURITY_CONFIG.encryption;
  private readonly secret = SECURITY_CONFIG.auth.JWT_SECRET;

  private constructor() {}

  static getInstance(): Encryption {
    if (!Encryption.instance) {
      Encryption.instance = new Encryption();
    }
    return Encryption.instance;
  }

  encryptData(data: string): EncryptedData {
    try {
      // Gera IV e salt aleatórios
      const iv = CryptoJS.lib.WordArray.random(this.config.ivLength);
      const salt = CryptoJS.lib.WordArray.random(this.config.saltLength);

      // Deriva a chave usando PBKDF2
      const key = CryptoJS.PBKDF2(this.secret, salt, {
        keySize: this.config.keyLength / 32,
        iterations: this.config.iterations,
        hasher: CryptoJS.algo.SHA512
      });

      // Criptografa os dados
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
        salt: salt.toString(CryptoJS.enc.Base64)
      };
    } catch (error) {
      console.error('Erro ao criptografar:', error);
      throw new Error('Falha na criptografia dos dados');
    }
  }

  decryptData(encrypted: EncryptedData): string {
    try {
      // Converte os dados de Base64
      const ciphertext = CryptoJS.enc.Base64.parse(encrypted.ciphertext);
      const iv = CryptoJS.enc.Base64.parse(encrypted.iv);
      const salt = CryptoJS.enc.Base64.parse(encrypted.salt);

      // Deriva a chave usando PBKDF2
      const key = CryptoJS.PBKDF2(this.secret, salt, {
        keySize: this.config.keyLength / 32,
        iterations: this.config.iterations,
        hasher: CryptoJS.algo.SHA512
      });

      // Recria o objeto CipherParams
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext,
        iv: iv,
        salt: salt
      });

      // Descriptografa os dados
      const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia dos dados');
    }
  }

  encryptDataWithPassword(data: string, password: string): EncryptedData {
    try {
      const salt = CryptoJS.lib.WordArray.random(this.config.saltLength);
      const iv = CryptoJS.lib.WordArray.random(this.config.ivLength);

      // Deriva uma chave da senha
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: this.config.keyLength / 32,
        iterations: this.config.iterations,
        hasher: CryptoJS.algo.SHA512
      });

      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
        salt: salt.toString(CryptoJS.enc.Base64)
      };
    } catch (error) {
      console.error('Erro ao criptografar com senha:', error);
      throw new Error('Falha na criptografia dos dados com senha');
    }
  }

  decryptDataWithPassword(encrypted: EncryptedData, password: string): string {
    try {
      const ciphertext = CryptoJS.enc.Base64.parse(encrypted.ciphertext);
      const iv = CryptoJS.enc.Base64.parse(encrypted.iv);
      const salt = CryptoJS.enc.Base64.parse(encrypted.salt);

      // Deriva a mesma chave da senha
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: this.config.keyLength / 32,
        iterations: this.config.iterations,
        hasher: CryptoJS.algo.SHA512
      });

      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext,
        iv: iv,
        salt: salt
      });

      const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Erro ao descriptografar com senha:', error);
      throw new Error('Falha na descriptografia dos dados com senha');
    }
  }
}

export const encryption = Encryption.getInstance();
