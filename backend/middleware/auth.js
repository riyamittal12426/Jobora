import admin from '../config/firebaseAdmin.js';

/**
 * Middleware: Verify Firebase ID Token
 * Extracts the Bearer token from Authorization header,
 * verifies it with Firebase Admin SDK, and attaches decoded
 * user info (uid, email) to req.user.
 */
export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization token is missing or malformed.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({
        message: 'Authorization token is empty.',
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Attach the decoded Firebase user to the request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
      authProvider: decodedToken.firebase?.sign_in_provider || 'unknown',
    };

    next();
  } catch (error) {
    console.error('🔒 Firebase token verification failed:', error.code || error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token has expired. Please sign in again.' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ message: 'Token has been revoked. Please sign in again.' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ message: 'Invalid token format.' });
    }

    return res.status(401).json({ message: 'Failed to authenticate request.' });
  }
}

/**
 * Middleware Factory: Require a specific role
 * Must be used AFTER verifyFirebaseToken and after user
 * has been synced (req.dbUser populated by controller).
 *
 * Usage: app.get('/admin', verifyFirebaseToken, requireRole('admin'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.dbUser) {
      return res.status(403).json({ message: 'User profile not found.' });
    }

    if (!roles.includes(req.dbUser.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
}

/**
 * Middleware: Attach MongoDB user to req.dbUser
 * Looks up the user in the database by Firebase UID.
 * Must be used AFTER verifyFirebaseToken.
 */
export async function attachDbUser(req, res, next) {
  try {
    // Dynamic import to avoid circular dependency
    const { default: User } = await import('../models/User.js');

    const dbUser = await User.findOne({ firebaseUid: req.user.uid });
    if (dbUser) {
      req.dbUser = dbUser;
    }

    next();
  } catch (error) {
    console.error('Error attaching DB user:', error.message);
    next(); // Continue even if DB lookup fails
  }
}

// Default export for backward compatibility with existing route imports
export default verifyFirebaseToken;
