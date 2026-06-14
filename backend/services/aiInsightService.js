/* 
 * AI Spending Insights Service
 * Aggregates user transaction history into category tables and gives budget advice
 */

const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');
const { Op } = require('sequelize');

class AiInsightService {
    /**
     * Aggregates transactions into monthly totals and category splits
     * @param {Number} userId 
     * @param {Object} userBudgetInfo - { monthlyBudget: Number }
     */
    async getInsights(userId, userBudgetInfo = { monthlyBudget: 2500 }) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Fetch all successful debits for the current user
        const transactions = await Transaction.findAll({
            where: {
                senderId: userId,
                status: 'Success',
                createdAt: {
                    [Op.gte]: startOfMonth
                }
            },
            order: [['amount', 'DESC']]
        });

        // Compute spending categories sum
        const categories = {
            'Transfers': 0.00,
            'Utilities': 0.00,
            'Entertainment': 0.00,
            'Food & Shopping': 0.00,
            'Other': 0.00
        };

        let totalSpent = 0.00;
        const topExpenses = [];

        transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            totalSpent += amount;

            // Simple classifier based on description/type
            const desc = (t.description || '').toLowerCase();
            const type = t.transactionType;

            if (type === 'bill-payment') {
                categories['Utilities'] += amount;
            } else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('game') || desc.includes('tv')) {
                categories['Entertainment'] += amount;
            } else if (desc.includes('starbucks') || desc.includes('food') || desc.includes('target') || desc.includes('coffee') || desc.includes('shopping')) {
                categories['Food & Shopping'] += amount;
            } else if (type === 'send-money') {
                categories['Transfers'] += amount;
            } else {
                categories['Other'] += amount;
            }

            // Push to top expenses list (up to 3 items)
            if (topExpenses.length < 3) {
                topExpenses.push({
                    id: t.id,
                    name: t.description || 'Instapay Transfer',
                    amount: amount,
                    date: t.createdAt
                });
            }
        });

        // Budget analysis calculations
        const monthlyBudget = parseFloat(userBudgetInfo.monthlyBudget) || 2500.00;
        const percentageSpent = monthlyBudget > 0 ? ((totalSpent / monthlyBudget) * 100) : 0;
        const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);

        // AI Recommendations Engine (Rule-based heuristics)
        const recommendations = [];

        if (percentageSpent >= 90) {
            recommendations.push({
                level: 'DANGER',
                title: 'Budget Threshold Violated',
                description: `You have consumed ${percentageSpent.toFixed(1)}% of your monthly allowance. We recommend halting non-essential transactions.`
            });
        } else if (percentageSpent >= 70) {
            recommendations.push({
                level: 'WARNING',
                title: 'High Spending Velocity',
                description: `You are approaching your budget cap. You have $${remainingBudget.toFixed(2)} remaining for this cycle.`
            });
        } else {
            recommendations.push({
                level: 'SUCCESS',
                title: 'Healthy Budget Margins',
                description: 'Your spending rate is normal. Excellent job managing resources this month!'
            });
        }

        // Add specific category spending recommendations
        if (categories['Utilities'] > (monthlyBudget * 0.3)) {
            recommendations.push({
                level: 'INFO',
                title: 'Utilities Cost Surge',
                description: 'Utility payments represent over 30% of total allowances. Check for scheduled autopay adjustments.'
            });
        }

        if (categories['Entertainment'] > (monthlyBudget * 0.1)) {
            recommendations.push({
                level: 'WARNING',
                title: 'Entertainment Subscriptions Check',
                description: 'Re-verify active streaming subscriptions to eliminate unused licenses.'
            });
        }

        /* 
         * NOTE ON GEMINI/OPENAI LLM API HANDOFF:
         * To generate dynamic, human-like summaries using Gemini AI:
         * 
         * const { GoogleGenAI } = require('@google/generative-ai');
         * const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
         * const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
         * 
         * const prompt = `Analyze this user's monthly spending: 
         * Total Budget: $${monthlyBudget}, Total Spent: $${totalSpent}. 
         * Categories: ${JSON.stringify(categories)}. 
         * Top Expenses: ${JSON.stringify(topExpenses)}.
         * Provide 3 concise and actionable financial tips.`;
         * 
         * const result = await model.generateContent(prompt);
         * const aiRecommendations = parseResultToJSON(result.response.text());
         */

        return {
            monthlySummary: {
                totalSpent,
                monthlyBudget,
                remainingBudget,
                percentageSpent
            },
            spendingCategories: categories,
            topExpenses,
            budgetAnalysis: {
                status: percentageSpent > 100 ? 'OVER_BUDGET' : percentageSpent > 80 ? 'CRITICAL' : 'STABLE',
                message: percentageSpent > 100 ? 'Budget exceeded.' : `Remaining: $${remainingBudget.toFixed(2)}`
            },
            recommendations
        };
    }
}

module.exports = new AiInsightService();
