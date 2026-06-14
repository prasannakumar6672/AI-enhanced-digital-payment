/* 
 * Authentication Guard Middleware
 * Validates requests containing Bearer JWT keys and loads the matching user
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { sendError } = require('../utils/responseHandler');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, env.jwt.secret);

            // Fetch User along with Wallet details
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] },
                include: [{ model: Wallet, as: 'wallet' }]
            });

            if (!req.user) {
                return sendError(res, 'Authorization failed: User no longer exists.', 401);
            }

            next();
        } catch (error) {
            console.error('JWT Token Verification Error:', error.message);
            return sendError(res, 'Authorization failed: Invalid or expired token.', 401);
        }
    }

    if (!token) {
        return sendError(res, 'Authorization failed: Bearer token is missing.', 401);
    }
};

module.exports = { protect };
