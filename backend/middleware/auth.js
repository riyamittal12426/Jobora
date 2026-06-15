import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'jobtracker-super-secret-key-32-chars-long-or-more!!!';

// Utility: Hashing passwords with PBKDF2
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Utility: Verifying hashed passwords
export function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;
  const parts = storedPassword.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verifyHash === originalHash;
}

// Utility: Sign Token (JWT standard)
export function signToken(payload, expiresInSeconds = 86400) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = { ...payload, exp };

  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${headerBase64}.${payloadBase64}`)
    .digest('base64url');

  return `${headerBase64}.${payloadBase64}.${signature}`;
}

// Utility: Verify Token (JWT standard)
export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerBase64, payloadBase64, signature] = parts;

    // Verify signature integrity
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));

    // Check expiration timestamp
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

// Express Middleware: Authenticate Request token
export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is missing or malformed.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Authorization token is invalid or expired.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Failed to authenticate request.' });
  }
}
