const User = require("../models/user.schema");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendEmail, sendTemplateEmail } = require("../config/email");
const emailTemplate = require("../templates/email.templates");
const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const crypto = require("crypto");
const axios = require("axios");

const signUp = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!email || !name || !password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  //Generate token from email
  const token = await jwt.sign(
    { email: email ,

  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  //generate email token
  const emailToken = uuidv4();
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  // Create a new user
  const newUser = new User({
    name,
    email,
    password: hashedPassword, // hash the password
    token: token, // store the JWT token
    emailToken: emailToken, // store the email token
  });

  try {
    await newUser.save();
    res
      .status(201)
      .json({ message: "User created successfully", token: token });
  } catch (error) {
    console.error(error.message);
  }
  //send welcome email
  const welcomeTemplate = emailTemplate.welcomeTemplate(name, emailToken);
  await sendTemplateEmail(
    email,
    welcomeTemplate.subject,
    welcomeTemplate.html,
    welcomeTemplate.text
  );
};

//verify email
const verifyEmail = async (req, res) => {
  const token = req.params.token;
  if (!token) {
    return res.status(404).json({ message: "There is no token " });
  }
  try {
    const user = await User.findOne({ emailToken: token });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this token does not exist" });
    }

    user.isVerified = true;
    user.emailToken = null;

    //send successful email verification
    const successTemplate = emailTemplate.emailVerificationSuccessTemplate(
      user.name
    );
    await sendTemplateEmail(
      user.email,
      successTemplate.subject,
      successTemplate.html,
      successTemplate.text
    );
    await user.save();
       return res.redirect('https://car-rental-frontend-xi-nine.vercel.app/user_auth/email_verified.html');
    
  } catch (error) {
    return res.status(500).json({ message: `${error.message}` });
  }
};

//login
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //check if user is verified
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "please verify your email first" });
    }

    //check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //Generate jwt token
    const payload = {
      id: user._id,
      email: user.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const loginTime = new Date().toLocaleString();
    const loginTemplate = emailTemplate.loginNotificationTemplate(
      user.name,
      loginTime
    );
    await sendTemplateEmail(
      email,
      loginTemplate.subject,
      loginTemplate.html,
      loginTemplate.text
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// const jwt = require('jsonwebtoken');

// app.get('/api/users/get-user', (req, res) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.status(401).json({ message: 'Authorization token missing' });
//   }

//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, 'YOUR_SECRET_KEY');
//     const userId = decoded.userId; // Extract userId from token payload

//     // Fetch user details from the database
//     const user = getUserById(userId); // Replace with your DB query logic
//     if (user) {
//       return res.json(user);
//     } else {
//       return res.status(404).json({ message: 'User not found' });
//     }
//   } catch (error) {
//     return res.status(401).json({ message: 'Invalid token' });
//   }
// });

const getUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ message: "No Authorization string found" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Internal server error${error}` });
  }
};

const makeAdmin = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  try {
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    user.isAdmin = true;
    await user.save();
    return res.status(200).json({ message: "User is now an admin", user });
  } catch (error) {
    return res.status(500).json({ message: `internal server error ${error}` });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    await user.save();

    // Send reset password email
    const resetTemplate = emailTemplate.forgotPasswordTemplate(user.name, otp);
    await sendTemplateEmail(
      user.email,
      resetTemplate.subject,
      resetTemplate.html,
      resetTemplate.text
    );

    res.status(200).json({ message: "Reset password email sent" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp: otp });
    if (!user) {
      return res.status(404).json({ message: "Invalid OTP" });
    }
    user.otpVerified = true;
    user.otp = null; // Clear OTP after verification
    await user.save();

    // OTP is valid, you can proceed with password reset or other actions
    return res
      .status(200)
      .json({ message: "OTP verified successfully", userId: user._id });
  } catch (e) {
    console.error("Error verifying OTP:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const resetPassword = async (req, res) => {
  const { confirmPassword, newPassword } = req.body;
  const { userId } = req.params;
  console.log(userId);
  // Validate input
  if (!userId || !newPassword) {
    return res
      .status(400)
      .json({ message: "User ID and new password are required" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.otpVerified !== true) {
      return res
        .status(403)
        .json({ message: "OTP not verified, Please Verify Your Otp" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    user.otpVerified = false; // Reset OTP verification status
    await user.save();

    // Send password reset confirmation email
    const confirmationTemplate =
      emailTemplate.passwordResetConfirmationTemplate(user.name);
    await sendTemplateEmail(
      user.email,
      confirmationTemplate.subject,
      confirmationTemplate.html,
      confirmationTemplate.text
    );

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Google authentication

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    "https://car-rental-api-ks0u.onrender.com/api/users/google/callback"
);

// Keep all your existing functions...

// Add these new functions for Google authentication:

// Generate Google auth URL
const getGoogleAuthURL = (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });

  res.json({ url });
};

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res
        .status(400)
        .json({ message: "Authorization code not received" });
    }

    console.log("Received authorization code:", code); // Debug log

    // Exchange code for access token
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri:
        process.env.GOOGLE_REDIRECT_URI ||
        "https://car-rental-api-ks0u.onrender.com/api/users/google/callback",
    });

    console.log("Token exchange successful"); // Debug log

    // Get user info from Google
    const { data: profile } = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    console.log("Google profile data:", profile); // Debug log

    // Check if user already exists
    let user = await User.findOne({ email: profile.email });

    if (!user) {
      console.log("Creating new user for:", profile.email);

      // Generate a secure random password
      const crypto = require("crypto");
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create new user
      user = new User({
        name: profile.name,
        email: profile.email,
        password: hashedPassword, // Required by your schema
        googleId: profile.id,
        avatar: profile.picture,
        isVerified: true,
      });

      await user.save();
      console.log("New user created successfully:", user._id);
    } else {
      console.log("Existing user found:", user.email);

      // Update existing user with Google ID if not present
      if (!user.googleId) {
        user.googleId = profile.id;
        user.isVerified = true;
        if (!user.avatar && profile.picture) user.avatar = profile.picture;
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id, // Use 'id' to match your verifyGoogleToken function
        userId: user._id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Redirect to frontend with token
   const redirectUrl = `${
  process.env.FRONTEND_URL || "https://car-rental-frontend-xi-nine.vercel.app"
}/user_dashboard.html?token=${token}`;
res.redirect(redirectUrl);
    console.log("Redirecting to:", redirectUrl); // Debug log

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google authentication error:", error);
    console.error("Error details:", error.response?.data || error.message);

    res.redirect(
      `${
        process.env.FRONTEND_URL || "https://car-rental-frontend-xi-nine.vercel.app"
      }/auth/error?message=${encodeURIComponent(error.message)}`
    );
  }
};
// Verify Google ID token directly from frontend
const verifyGoogleToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      const newUser = new User({
        name,
        email,
        isVerified: true,
        googleId,
        profilePicture: picture,
      });

      user = await newUser.save();

      // Send welcome email
      const welcomeTemplate = emailTemplate.welcomeTemplate(name);
      await sendTemplateEmail(
        email,
        welcomeTemplate.subject,
        welcomeTemplate.html,
        welcomeTemplate.text
      );
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user.googleId = googleId;
      user.isVerified = true;
      if (!user.profilePicture) user.profilePicture = picture;
      await user.save();
    }

    // Generate JWT token
    const jwtPayload = {
      id: user._id,
      email: user.email,
    };

    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Record login
    const loginTime = new Date().toLocaleString();
    const loginTemplate = emailTemplate.loginNotificationTemplate(
      user.name,
      loginTime
    );
    await sendTemplateEmail(
      user.email,
      loginTemplate.subject,
      loginTemplate.html,
      loginTemplate.text
    );

    res.status(200).json({
      message: "Google authentication successful",
      token: jwtToken,
    });
  } catch (error) {
    console.error("Google token verification error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = {
  signUp,
  login,
  verifyEmail,
  makeAdmin,
  getUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getGoogleAuthURL,
  googleCallback,
  verifyGoogleToken,
};
