/* 
 * User Controller
 * Provides user search utilities to resolve pay targets
 */

const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { Op } = require('sequelize');

// @desc    Search users by phone, email or name (for transfers target checking)
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res, next) => {
    const { query } = req.query;

    if (!query) {
        return sendError(res, 'Search query is required.', 400);
    }

    try {
        const users = await User.findAll({
            where: {
                [Op.and]: [
                    {
                        // Exclude the current user from search
                        id: { [Op.ne]: req.user.id }
                    },
                    {
                        [Op.or]: [
                            { email: { [Op.like]: `%${query}%` } },
                            { phone: { [Op.like]: `%${query}%` } },
                            { fullName: { [Op.like]: `%${query}%` } }
                        ]
                    }
                ]
            },
            attributes: ['id', 'fullName', 'email', 'phone', 'profileImage'],
            limit: 10
        });

        return sendSuccess(res, 'Users matching search criteria retrieved.', { users });

    } catch (error) {
        next(error);
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'fullName', 'email', 'phone', 'profileImage']
        });

        if (!user) {
            return sendError(res, 'User not found.', 404);
        }

        return sendSuccess(res, 'User details retrieved successfully.', { user });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    searchUsers,
    getUserById
};
