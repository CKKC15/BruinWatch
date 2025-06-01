import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.js';

// Create Google OAuth client for token verification
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and return the payload
 * @param {string} token - The ID token to verify
 * @returns {Promise<Object>} The decoded payload
 */
const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  return ticket.getPayload();
};

/**
 * Find or create a user based on Google profile data
 * @param {Object} profile - Google profile data
 * @returns {Promise<Object>} User object
 */
const findOrCreateGoogleUser = async (profile) => {
  // Check if user already exists by email
  let user = await User.findOne({ email: profile.email });
  
  if (user) {
    return user;
  }
  
  // Create new user
  user = await User.create({
    name: profile.name,
    email: profile.email,
      googleId: profile.sub,
      picture: profile.picture
    });
    
    return user;
};

export { verifyGoogleToken, findOrCreateGoogleUser };
