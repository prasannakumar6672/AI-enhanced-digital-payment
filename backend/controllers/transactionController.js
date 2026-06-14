/* 
 * Transaction Controller
 * Manages money transfers, histories, detail query lookups, and AI Security classifiers
 */

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const fraudService = require('../services/fraudService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// @desc    Transfer funds between user wallets
// @route   POST /api/transactions/send-money
// @access  Private
const sendMoney = async (req, res, next) => {
    const { receiverEmailOrPhone, amount, description } = req.body;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
        return sendError(res, 'Please enter a valid transfer amount.', 400);
    }

    try {
        // Find Sender Wallet
        const senderWallet = await Wallet.findOne({ where: { userId: req.user.id } });
        if (!senderWallet) {
            return sendError(res, 'Sender wallet not found.', 404);
        }

        // Check sender balance
        if (parseFloat(senderWallet.balance) < amountNum) {
            return sendError(res, 'Insufficient wallet balance to execute payment.', 400);
        }

        // Find Receiver
        const receiver = await User.findOne({
            where: {
                [Op.or]: [
                    { email: receiverEmailOrPhone },
                    { phone: receiverEmailOrPhone }
                ],
                id: { [Op.ne]: req.user.id } // Can't send money to yourself
            },
            include: [{ model: Wallet, as: 'wallet' }]
        });

        if (!receiver || !receiver.wallet) {
            return sendError(res, 'Recipient wallet not found or is invalid.', 404);
        }

        // CALL AI FRAUD SHIELD
        const fraudAnalysis = await fraudService.analyzeTransaction({
            senderId: req.user.id,
            amount: amountNum,
            walletBalance: parseFloat(senderWallet.balance)
        });

        // If high risk, block transfer immediately
        if (fraudAnalysis.riskLevel === 'HIGH_RISK') {
            // Log failed transaction for audit logs
            const failedTxn = await Transaction.create({
                senderId: req.user.id,
                receiverId: receiver.id,
                amount: amountNum,
                transactionType: 'send-money',
                description: description ? `[BLOCKED] ${description}` : 'Blocked transaction',
                status: 'Failed',
                fraudRisk: 'HIGH_RISK'
            });

            // Log Fraud Alert details
            await fraudService.logAlert(failedTxn.id, fraudAnalysis);

            return sendError(res, `Transaction blocked by AI Shield. Reason: ${fraudAnalysis.message}`, 400, {
                riskLevel: 'HIGH_RISK',
                riskScore: fraudAnalysis.riskScore
            });
        }

        // START SEQUELIZE TRANSACTION FOR ATOMIC WALLET SWAPS
        const t = await sequelize.transaction();

        try {
            // Deduct sender balance and add to totalSent
            senderWallet.balance = parseFloat(senderWallet.balance) - amountNum;
            senderWallet.totalSent = parseFloat(senderWallet.totalSent) + amountNum;
            await senderWallet.save({ transaction: t });

            // Add receiver balance and add to totalReceived
            const receiverWallet = receiver.wallet;
            receiverWallet.balance = parseFloat(receiverWallet.balance) + amountNum;
            receiverWallet.totalReceived = parseFloat(receiverWallet.totalReceived) + amountNum;
            await receiverWallet.save({ transaction: t });

            // Create Transaction record
            const transaction = await Transaction.create({
                senderId: req.user.id,
                receiverId: receiver.id,
                amount: amountNum,
                transactionType: 'send-money',
                description: description || `Transferred to ${receiver.fullName}`,
                status: 'Success',
                fraudRisk: fraudAnalysis.riskLevel
            }, { transaction: t });

            // Commit atomic updates
            await t.commit();

            // Log suspicious alert to DB in background if warning flagged
            if (fraudAnalysis.riskLevel === 'SUSPICIOUS') {
                await fraudService.logAlert(transaction.id, fraudAnalysis);
            }

            return sendSuccess(res, `Transferred $${amountNum.toFixed(2)} to ${receiver.fullName} successfully.`, {
                transaction,
                newBalance: senderWallet.balance,
                securityClassification: {
                    riskLevel: fraudAnalysis.riskLevel,
                    riskScore: fraudAnalysis.riskScore
                }
            });

        } catch (txnError) {
            await t.rollback();
            throw txnError;
        }

    } catch (error) {
        next(error);
    }
};

// @desc    Get user transaction history
// @route   GET /api/transactions/history
// @access  Private
const getTransactionHistory = async (req, res, next) => {
    try {
        const history = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { senderId: req.user.id },
                    { receiverId: req.user.id }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'fullName', 'email', 'phone'] },
                { model: User, as: 'receiver', attributes: ['id', 'fullName', 'email', 'phone'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return sendSuccess(res, 'Transaction ledger history retrieved successfully.', { history });

    } catch (error) {
        next(error);
    }
};

// @desc    Get transaction details by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            where: {
                id: req.params.id,
                [Op.or]: [
                    { senderId: req.user.id },
                    { receiverId: req.user.id }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'fullName', 'email', 'phone'] },
                { model: User, as: 'receiver', attributes: ['id', 'fullName', 'email', 'phone'] }
            ]
        });

        if (!transaction) {
            return sendError(res, 'Transaction record not found or unauthorized access.', 404);
        }

        return sendSuccess(res, 'Transaction details loaded.', { transaction });

    } catch (error) {
        next(error);
    }
};

// @desc    Delete transaction record
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            where: {
                id: req.params.id,
                senderId: req.user.id // Only allow sender to clear/hide their transaction record representation
            }
        });

        if (!transaction) {
            return sendError(res, 'Transaction record not found or unauthorized.', 404);
        }

        await transaction.destroy();
        return sendSuccess(res, 'Transaction record deleted from list view.');

    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendMoney,
    getTransactionHistory,
    getTransactionById,
    deleteTransaction
};
