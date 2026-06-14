/* 
 * Authentication Routes Configuration
 * Maps auth routes and applies validation checkers
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    logoutUser,
    resetDb
} = require('../controllers/authController');

// Input validation schema definitions
const registerValidation = [
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('email').trim().isEmail().withMessage('Please provide a valid email address.'),
    body('phone').trim().notEmpty().withMessage('Phone number is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    validate
];

const loginValidation = [
    body('email').trim().isEmail().withMessage('Please provide a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
    validate
];

const passwordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.'),
    validate
];

const profileValidation = [
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty.'),
    body('email').optional().trim().isEmail().withMessage('Please provide a valid email.'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
    validate
];

// Register & Login
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.post('/reset-db', resetDb);

// Protected Profiles endpoints
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, profileValidation, updateUserProfile);
router.post('/change-password', protect, passwordValidation, changePassword);
router.post('/logout', protect, logoutUser);

module.exports = router;
