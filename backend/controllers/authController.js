import User from '../models/User.js';

// Admin emails from environment (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * POST /api/auth/sync
 * Called after successful Firebase authentication.
 * Creates the user in MongoDB if they don't exist, or updates their info.
 * The Firebase token has already been verified by middleware.
 */
export async function syncUser(req, res) {
  try {
    const { uid, email, displayName, photoURL, authProvider } = req.user;

    if (!uid || !email) {
      return res.status(400).json({
        message: 'Firebase token missing required fields (uid or email).',
      });
    }

    // Determine role based on admin emails list
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';

    // Find existing user by Firebase UID, or by email (for migration)
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Update existing user with latest Firebase info
      user.firebaseUid = uid;
      user.email = email.toLowerCase();
      if (displayName && !user.displayName) user.displayName = displayName;
      if (photoURL && !user.photoURL) user.photoURL = photoURL;
      if (authProvider) user.authProvider = authProvider;
      user.role = role;

      // Split displayName into firstName/lastName if not already set
      if (displayName && !user.firstName) {
        const nameParts = displayName.split(' ');
        user.firstName = nameParts[0] || '';
        user.lastName = nameParts.slice(1).join(' ') || '';
      }

      await user.save();
    } else {
      // Create new user
      const nameParts = (displayName || '').split(' ');
      user = await User.create({
        firebaseUid: uid,
        email: email.toLowerCase(),
        displayName: displayName || '',
        photoURL: photoURL || '',
        authProvider: authProvider || 'password',
        role,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
      });
    }

    const userObj = user.toObject();

    res.status(200).json({
      message: 'User synced successfully',
      user: userObj,
    });
  } catch (error) {
    console.error('Error syncing user:', error);

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (user) {
          return res.status(200).json({
            message: 'User synced successfully',
            user: user.toObject(),
          });
        }
      } catch (retryErr) {
        // Fall through to error response
      }
    }

    res.status(500).json({ message: 'Failed to sync user profile.' });
  }
}

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile from MongoDB.
 */
export async function getProfile(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.status(200).json(user.toObject());
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
}

/**
 * PUT /api/auth/profile
 * Updates the authenticated user's profile in MongoDB.
 */
export async function updateProfile(req, res) {
  try {
    // Fields that can be updated by the user
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'age',
      'address', 'resume', 'displayName', 'photoURL',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.status(200).json(user.toObject());
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({ message: error.message });
  }
}

/**
 * GET /api/admin/users
 * Admin-only: List all users.
 */
export async function listUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments({}),
    ]);

    res.status(200).json({
      users: users.map(u => u.toObject()),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Failed to list users.' });
  }
}
