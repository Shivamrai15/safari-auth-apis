import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { db } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Google OAuth Strategy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName;
        const image = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"), false);
        }

        // Check if user exists by email
        let user = await db.user.findUnique({
          where: { email },
          include: {
            accounts: true,
          },
        });

        if (!user) {
          // Create new user with Google account
          user = await db.user.create({
            data: {
              email,
              name,
              image: image || null,
              emailVerified: new Date(),
              accounts: {
                create: {
                  type: "oauth",
                  provider: "google",
                  providerAccountId: googleId,
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  token_type: "Bearer",
                },
              },
            },
            include: {
              accounts: true,
            },
          });
        } else {
          // Check if Google account is already linked
          const existingGoogleAccount = user.accounts.find(
            (account) =>
              account.provider === "google" &&
              account.providerAccountId === googleId
          );

          if (!existingGoogleAccount) {
            // Link Google account to existing user
            await db.account.create({
              data: {
                userId: user.id,
                type: "oauth",
                provider: "google",
                providerAccountId: googleId,
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: "Bearer",
              },
            });
          } else {
            // Update existing Google account tokens
            await db.account.update({
              where: { id: existingGoogleAccount.id },
              data: {
                access_token: accessToken,
                refresh_token: refreshToken,
              },
            });
          }

          // Update user profile with latest Google info
          user = await db.user.update({
            where: { id: user.id },
            data: {
              name: name || user.name,
              image: image || user.image,
              emailVerified: user.emailVerified || new Date(),
            },
            include: {
              accounts: true,
            },
          });
        }

        return done(null, user as any);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, false);
      }
    }
  )
);

passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await db.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
            showRecommendations: true,
            privateSession: true,
            createdAt: true,
          },
        });

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Mobile OAuth Routes
app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req: any, res) => {
    try {
      const token = jwt.sign(
        {
          userId: req.user.id,
          email: req.user.email,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      console.log("Authentication successful, redirecting to mobile app");

      // Always redirect to mobile app with token
      return res.redirect(`safari://auth/success?token=${token}`);
    } catch (error) {
      console.error("Callback error:", error);

      // Redirect to mobile app with error
      return res.redirect(
        `safari://auth/error?message=Authentication failed`
      );
    }
  }
);

// Middleware to protect routes
const authenticateJWT = passport.authenticate("jwt", { session: false });

// Session endpoint for mobile apps to verify tokens
app.get("/api/v2/session", authenticateJWT, (req: any, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Main mobile auth endpoint
app.get("/auth/google", (req, res) => {
  console.log("Mobile app requesting Google OAuth");
  res.redirect("/api/auth/google");
});

// Health check endpoint
app.get("/api/v2/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "Mobile Auth Server is running",
  });
});

// Logout endpoint
app.post("/api/v2/logout", authenticateJWT, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// User profile endpoint
app.get("/api/v2/profile", authenticateJWT, (req: any, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Mobile Auth Server is running on port ${PORT}`);
});

export default app;