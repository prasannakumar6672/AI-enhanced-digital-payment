/* 
 * Wallet Controller
 * Manages active balances, cash flow summaries, deposits, and withdrawal checks
 */

const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { sequelize } = require('../config/database');

// @desc    Get wallet balance
// @route   GET /api/wallet/balance
// @access  Private
const getBalance = async (req, res, next) => {
    try {
        const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
        
        if (!wallet) {
            return sendError(res, 'Wallet not found.', 404);
        }

        return sendSuccess(res, 'Wallet balance retrieved.', {
            balance: wallet.balance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get wallet summary (balance, sent, received)
// @route   GET /api/wallet/summary
// @access  Private
const getWalletSummary = async (req, res, next) => {
    try {
        const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
        
        if (!wallet) {
            return sendError(res, 'Wallet not found.', 404);
        }

        return sendSuccess(res, 'Wallet summary data retrieved.', {
            balance: wallet.balance,
            totalSent: wallet.totalSent,
            totalReceived: wallet.totalReceived
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add money to wallet
// @route   POST /api/wallet/add-money
// @access  Private
const addMoney = async (req, res, next) => {
    const { amount, description } = req.body;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
        return sendError(res, 'Please provide a valid deposit amount.', 400);
    }

    const t = await sequelize.transaction();

    try {
        const wallet = await Wallet.findOne({ 
            where: { userId: req.user.id } 
        }, { transaction: t });

        if (!wallet) {
            await t.rollback();
            return sendError(res, 'Wallet not found.', 404);
        }

        // Add funds to wallet balance
        wallet.balance = parseFloat(wallet.balance) + amountNum;
        await wallet.save({ transaction: t });

        // Log Transaction ledger
        const transaction = await Transaction.create({
            senderId: null, // Deposit, no external user sender
            receiverId: req.user.id,
            amount: amountNum,
            transactionType: 'add-money',
            description: description || 'Deposited funds to smart wallet',
            status: 'Success',
            fraudRisk: 'SAFE'
        }, { transaction: t });

        await t.commit();

        return sendSuccess(res, `Successfully deposited $${amountNum.toFixed(2)} to wallet.`, {
            newBalance: wallet.balance,
            transaction
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// @desc    Withdraw money from wallet to bank
// @route   POST /api/wallet/withdraw
// @access  Private
const withdrawMoney = async (req, res, next) => {
    const { amount, description } = req.body;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
        return sendError(res, 'Please provide a valid withdrawal amount.', 400);
    }

    const t = await sequelize.transaction();

    try {
        const wallet = await Wallet.findOne({ 
            where: { userId: req.user.id } 
        }, { transaction: t });

        if (!wallet) {
            await t.rollback();
            return sendError(res, 'Wallet not found.', 404);
        }

        if (parseFloat(wallet.balance) < amountNum) {
            await t.rollback();
            return sendError(res, 'Insufficient wallet balance for withdrawal.', 400);
        }

        // Deduct funds from wallet balance
        wallet.balance = parseFloat(wallet.balance) - amountNum;
        await wallet.save({ transaction: t });

        // Log Transaction ledger
        const transaction = await Transaction.create({
            senderId: req.user.id,
            receiverId: null, // Outward transfer to bank
            amount: amountNum,
            transactionType: 'withdraw',
            description: description || 'Withdrew funds from wallet to bank',
            status: 'Success',
            fraudRisk: 'SAFE'
        }, { transaction: t });

        await t.commit();

        return sendSuccess(res, `Successfully withdrew $${amountNum.toFixed(2)} to linked bank.`, {
            newBalance: wallet.balance,
            transaction
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

module.exports = {
    getBalance,
    getWalletSummary,
    addMoney,
    withdrawMoney
};
