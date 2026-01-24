import crypto from "crypto";

// Usar uma chave de encriptação separada do JWT_SECRET
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "default_encryption_key_32chars!!";

// Garantir que a chave tem 32 bytes
function getKey(): Buffer {
  const key = ENCRYPTION_KEY;
  if (key.length >= 32) {
    return Buffer.from(key.slice(0, 32));
  }
  // Pad with zeros if too short
  return Buffer.from(key.padEnd(32, "0"));
}

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encripta um texto usando AES-256-GCM
 * Retorna: iv:authTag:ciphertext (base64)
 */
export function encrypt(text: string): string {
  if (!text) return "";

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:ciphertext
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Desencripta um texto encriptado com encrypt()
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return "";

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash seguro para dados que não precisam ser recuperados
 * (ex: tokens de verificação para comparação)
 */
export function hashSecure(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Gera um token aleatório seguro
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Gera um ID único para JWT (jti)
 */
export function generateJwtId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Compara strings de forma segura (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Encripta dados sensíveis do utilizador
 */
export function encryptUserData(data: {
  phone?: string | null;
  birthDate?: Date | null;
}): {
  phone?: string | null;
  birthDate?: string | null;
} {
  return {
    phone: data.phone ? encrypt(data.phone) : null,
    birthDate: data.birthDate ? encrypt(data.birthDate.toISOString()) : null,
  };
}

/**
 * Desencripta dados sensíveis do utilizador
 */
export function decryptUserData(data: {
  phone?: string | null;
  birthDate?: string | null;
}): {
  phone?: string | null;
  birthDate?: Date | null;
} {
  try {
    return {
      phone: data.phone ? decrypt(data.phone) : null,
      birthDate: data.birthDate ? new Date(decrypt(data.birthDate)) : null,
    };
  } catch {
    // Se falhar a desencriptação, retornar dados em branco
    return { phone: null, birthDate: null };
  }
}
