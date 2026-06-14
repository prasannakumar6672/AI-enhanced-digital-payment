/* 
 * User Route Maps
 * Exposes profile search options for transfer validation checks
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchUsers, getUserById } = require('../controllers/userController');

// All user search routes require authentication
router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserById);

module.exports = router;
