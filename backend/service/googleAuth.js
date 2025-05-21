import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
// If you have a user controller with register function, import it
// import { register } from '../controllers/userController.js';

// JWT token generation - use the same approach as in userController
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Configure Passport Google Strategy
const setupGoogleAuth = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists by email
          let user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // User exists - we could update last login time here if needed
            return done(null, user);
          }
          
          
          // Create user following your existing registration pattern
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
          });
          
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

// Google auth routes handlers
const googleAuth = {
  // Initiate Google OAuth
  authenticate: passport.authenticate('google', { 
    scope: ['profile', 'email']
  }),
  
  // Google OAuth callback handler
  callback: (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
      }
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_not_found`);
      }
      
      // Generate JWT token using the same approach as your login function
      const token = generateToken(user);
      
      // Redirect to frontend with token
      return res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    })(req, res, next);
  }
};

export { setupGoogleAuth, googleAuth };
