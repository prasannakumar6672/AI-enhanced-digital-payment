/* 
 * Fraud Detection Controller
 * Serves transaction security threat analysis, risk grades, and alert records
 */

const fraudService = require('../services/fraudService');
const FraudAlert = require('../models/FraudAlert');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Perform a mock security risk analysis on proposed transfer parameters
// @route   POST /api/fraud/check
// @access  Private
const checkTransactionRisk = async (req, res, next) => {
    const { amount } = req.body;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
        return sendError(res, 'Please provide a valid transaction amount.', 400);
    }

    try {
        const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
        const walletBalance = wallet ? parseFloat(wallet.balance) : 0.00;

        const analysis = await fraudService.analyzeTransaction({
            senderId: req.user.id,
            amount: amountNum,
            walletBalance
        });

        return sendSuccess(res, 'Transaction security risk report compiled.', { analysis });

    } catch (error) {
        next(error);
    }
};

// @desc    List all recent fraud alerts associated with current user's payments
// @route   GET /api/fraud/alerts
// @access  Private
const getFraudAlerts = async (req, res, next) => {
    try {
        const alerts = await FraudAlert.findAll({
            include: [{
                model: Transaction,
                as: 'transaction',
                where: { senderId: req.user.id },
                attributes: ['id', 'receiverId', 'amount', 'transactionType', 'status', 'createdAt']
            }],
            order: [['createdAt', 'DESC']]
        });

        return sendSuccess(res, 'Fraud alerts log loaded successfully.', { alerts });

    } catch (error) {
        next(error);
    }
};

// @desc    Compile system security safety reports
// @route   GET /api/fraud/report
// @access  Private
const getSecurityReport = async (req, res, next) => {
    try {
        // Count total successful, suspicious, and blocked transaction counts for current user
        const totalTxns = await Transaction.count({ where: { senderId: req.user.id } });
        const blockedTxns = await Transaction.count({ where: { senderId: req.user.id, status: 'Failed', fraudRisk: 'HIGH_RISK' } });
        const suspiciousTxns = await Transaction.count({ where: { senderId: req.user.id, fraudRisk: 'SUSPICIOUS' } });
        
        let riskScore = 98; // Default Excellent rating
        if (blockedTxns > 0) riskScore -= 15 * blockedTxns;
        if (suspiciousTxns > 0) riskScore -= 5 * suspiciousTxns;
        riskScore = Math.max(riskScore, 10); // Minimum score clamp

        return sendSuccess(res, 'Platform security diagnostic report loaded.', {
            overview: {
                totalScansRun: totalTxns,
                blockedTransfers: blockedTxns,
                flaggedSuspiciousAudits: suspiciousTxns,
                overallSafetyRating: riskScore,
                systemStatus: riskScore >= 80 ? 'EXCELLENT' : riskScore >= 50 ? 'ELEVATED_RISK' : 'CRITICAL'
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkTransactionRisk,
    getFraudAlerts,
    getSecurityReport
};
