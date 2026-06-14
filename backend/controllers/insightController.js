/* 
 * AI Spending Insights Controller
 * Exposes endpoints for spending analytics aggregates and financial advice recommendations
 */

const aiInsightService = require('../services/aiInsightService');
const { sendSuccess } = require('../utils/responseHandler');

// @desc    Get user's monthly spending summary budgets
// @route   GET /api/insights/monthly
// @access  Private
const getMonthlySummary = async (req, res, next) => {
    try {
        const insights = await aiInsightService.getInsights(req.user.id, {
            monthlyBudget: req.user.wallet ? req.user.wallet.monthlyBudget || 2500.00 : 2500.00
        });

        return sendSuccess(res, 'Monthly budget summary retrieved.', {
            summary: insights.monthlySummary,
            budgetAnalysis: insights.budgetAnalysis
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get categorized spending totals
// @route   GET /api/insights/spending
// @access  Private
const getSpendingCategories = async (req, res, next) => {
    try {
        const insights = await aiInsightService.getInsights(req.user.id, {
            monthlyBudget: req.user.wallet ? req.user.wallet.monthlyBudget || 2500.00 : 2500.00
        });

        return sendSuccess(res, 'Categorized spending totals loaded.', {
            categories: insights.spendingCategories,
            topExpenses: insights.topExpenses
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get AI spending alerts and recommendations
// @route   GET /api/insights/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
    try {
        const insights = await aiInsightService.getInsights(req.user.id, {
            monthlyBudget: req.user.wallet ? req.user.wallet.monthlyBudget || 2500.00 : 2500.00
        });

        return sendSuccess(res, 'AI financial recommendations compiled.', {
            recommendations: insights.recommendations
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMonthlySummary,
    getSpendingCategories,
    getRecommendations
};
