/* 
 * Auth Controller
 * Manages user authentication, registration onboarding, login checks, and token issuing
 */

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { sequelize } = require('../config/database');

// @desc    Register a new user and initialize a wallet
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    const { fullName, email, phone, password } = req.body;
    
    // Start atomic transaction
    const t = await sequelize.transaction();

    try {
        // Check if user already exists
        const userExists = await User.findOne({ where: { email } }, { transaction: t });
        if (userExists) {
            await t.rollback();
            return sendError(res, 'User email already registered.', 400);
        }

        const phoneExists = await User.findOne({ where: { phone } }, { transaction: t });
        if (phoneExists) {
            await t.rollback();
            return sendError(res, 'Phone number already registered.', 400);
        }

        // Create User
        const user = await User.create({
            fullName,
            email,
            phone,
            password
        }, { transaction: t });

        // Initialize Wallet for User (with welcome balance of $1000.00)
        const wallet = await Wallet.create({
            userId: user.id,
            balance: 1000.00
        }, { transaction: t });

        // Commit all creations
        await t.commit();

        const token = generateToken(user.id);

        return sendSuccess(res, 'User registered and wallet initialized successfully.', {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            wallet: {
                balance: wallet.balance
            },
            token
        }, 201);

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Fetch user with their wallet details
        const user = await User.findOne({ 
            where: { email },
            include: [{ model: Wallet, as: 'wallet' }]
        });

        if (!user) {
            return sendError(res, 'Invalid email or password.', 401);
        }

        // Check password matching
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return sendError(res, 'Invalid email or password.', 401);
        }

        const token = generateToken(user.id);

        return sendSuccess(res, 'Login successful.', {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            wallet: user.wallet ? {
                balance: user.wallet.balance
            } : null,
            token
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    return sendSuccess(res, 'User profile retrieved successfully.', {
        user: {
            id: req.user.id,
            fullName: req.user.fullName,
            email: req.user.email,
            phone: req.user.phone,
            profileImage: req.user.profileImage,
            role: req.user.role
        },
        wallet: req.user.wallet ? {
            balance: req.user.wallet.balance,
            totalSent: req.user.wallet.totalSent,
            totalReceived: req.user.wallet.totalReceived
        } : null
    });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
    const { fullName, email, phone, profileImage } = req.body;

    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return sendError(res, 'User not found.', 404);
        }

        // If email or phone changes, verify they are unique
        if (email && email !== user.email) {
            const emailInUse = await User.findOne({ where: { email } });
            if (emailInUse) return sendError(res, 'Email address already in use.', 400);
            user.email = email;
        }

        if (phone && phone !== user.phone) {
            const phoneInUse = await User.findOne({ where: { phone } });
            if (phoneInUse) return sendError(res, 'Phone number already in use.', 400);
            user.phone = phone;
        }

        if (fullName) user.fullName = fullName;
        if (profileImage) user.profileImage = profileImage;

        await user.save();

        return sendSuccess(res, 'Profile details updated successfully.', {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Change user password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return sendError(res, 'User not found.', 404);
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return sendError(res, 'Incorrect current password.', 400);
        }

        user.password = newPassword;
        await user.save();

        return sendSuccess(res, 'Password updated successfully.');

    } catch (error) {
        next(error);
    }
};

// @desc    Logout user (clears access on client)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    // Standard stateless JWT logouts are handled client-side by purging tokens,
    // we return a success statement indicating server authorization clears.
    return sendSuccess(res, 'Logged out successfully. PURGE JWT token on client.');
};

// @desc    Developer endpoint to reset database tables and seed defaults
// @route   POST /api/auth/reset-db
// @access  Public
const resetDb = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const Wallet = require('../models/Wallet');
        const Transaction = require('../models/Transaction');
        const Bill = require('../models/Bill');
        const FraudAlert = require('../models/FraudAlert');
        const seedData = require('../config/seeder');

        // Disable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Truncate tables
        await FraudAlert.destroy({ where: {}, truncate: true });
        await Transaction.destroy({ where: {}, truncate: true });
        await Bill.destroy({ where: {}, truncate: true });
        await Wallet.destroy({ where: {}, truncate: true });
        await User.destroy({ where: {}, truncate: true });

        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        // Re-run the seed data function
        await seedData();

        return sendSuccess(res, 'Database reset and default profiles restored successfully.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    logoutUser,
    resetDb
};
