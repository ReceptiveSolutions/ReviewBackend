// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

console.log('Google OAuth Config:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '***exists***' : 'MISSING!');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '***exists***' : 'MISSING!');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback", // Fixed: Added /api
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          photo: profile.photos?.[0]?.value
        });

        // Extract essential data
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        // Prepare user data for your application
        const userData = {
          googleId: profile.id,
          displayName: profile.displayName,
          email: email,
          firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
          lastName: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' ') || null,
          photo: profile.photos?.[0]?.value
        };

        console.log('Sending userData to controller:', userData); // Debug log

        done(null, userData);
      } catch (error) {
        console.error('Passport Google strategy error:', error);
        done(error);
      }
    }
  )
);

// Serialization - keep minimal
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user); // Debug log
  done(null, {
    id: user.googleId,
    email: user.email,
    displayName: user.displayName,
    photo: user.photo
  });
});

passport.deserializeUser((obj, done) => {
  console.log('Deserializing user:', obj); // Debug log
  done(null, obj);
});