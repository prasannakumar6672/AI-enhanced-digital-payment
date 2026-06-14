/* 
 * Spending Insights Router Configuration
 * Serves category breakdowns, budgeting summaries, and alerts recommendations
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getMonthlySummary,
    getSpendingCategories,
    getRecommendations
} = require('../controllers/insightController');

// All insights routes require authentication
router.get('/monthly', protect, getMonthlySummary);
router.get('/spending', protect, getSpendingCategories);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
