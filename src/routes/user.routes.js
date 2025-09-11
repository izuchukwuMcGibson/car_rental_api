const express = require('express');
const {  
  signUp,
  login,
  verifyEmail,
  makeAdmin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getGoogleAuthURL,
  googleCallback,
  verifyGoogleToken
} = require('../controller/user.controller');
const { isAuthenticated } = require('../middlewares/isAuth');
const { isAuth, isAdmin } = require('../middlewares/auth');
const router = express.Router();



router.post('/signup', signUp);
router.post('/login', login);
router.post('/makeAdmin/:userId', makeAdmin,isAuth,isAdmin);
router.post('/verify-email/:token',verifyEmail)
router.post('/forgot-password',forgotPassword)
router.post('/verify-otp',verifyOtp)
router.post('/reset-password/:userId',resetPassword)

//Google authentication
router.get('/google', getGoogleAuthURL);
router.get('/google/callback', googleCallback);
router.post('/google/verify', verifyGoogleToken);



module.exports = router