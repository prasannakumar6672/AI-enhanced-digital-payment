/* 
 * Bill Payment Controller
 * Manages utility clearances, billing records, and payment logs
 */

const Bill = require('../models/Bill');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { sequelize } = require('../config/database');

// @desc    Clear utility bill dues
// @route   POST /api/bills/pay
// @access  Private
const payBill = async (req, res, next) => {
    const { billType, amount, billId } = req.body;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
        return sendError(res, 'Please provide a valid bill amount.', 400);
    }

    const t = await sequelize.transaction();

    try {
        const wallet = await Wallet.findOne({ 
            where: { userId: req.user.id } 
        }, { transaction: t });

        if (!wallet) {
            await t.rollback();
            return sendError(res, 'User wallet not found.', 404);
        }

        // Check wallet balances
        if (parseFloat(wallet.balance) < amountNum) {
            await t.rollback();
            return sendError(res, 'Insufficient wallet balance to clear utility bill.', 400);
        }

        // Deduct from wallet balance and add to totalSent
        wallet.balance = parseFloat(wallet.balance) - amountNum;
        wallet.totalSent = parseFloat(wallet.totalSent) + amountNum;
        await wallet.save({ transaction: t });

        let bill;
        if (billId) {
            bill = await Bill.findOne({
                where: { id: billId, userId: req.user.id, status: 'UNPAID' }
            }, { transaction: t });

            if (bill) {
                bill.status = 'PAID';
                bill.paidAt = new Date();
                await bill.save({ transaction: t });
            }
        }

        if (!bill) {
            // Check if there is an unpaid bill of the same type and amount to clear it
            bill = await Bill.findOne({
                where: { userId: req.user.id, billType, amount: amountNum, status: 'UNPAID' }
            }, { transaction: t });

            if (bill) {
                bill.status = 'PAID';
                bill.paidAt = new Date();
                await bill.save({ transaction: t });
            } else {
                // Otherwise create a new bill record
                bill = await Bill.create({
                    userId: req.user.id,
                    billType,
                    amount: amountNum,
                    status: 'PAID',
                    paidAt: new Date()
                }, { transaction: t });
            }
        }

        // Create transaction logs
        const transaction = await Transaction.create({
            senderId: req.user.id,
            receiverId: null, // Outward payment to service provider
            amount: amountNum,
            transactionType: 'bill-payment',
            description: `${billType} payment cleared`,
            status: 'Success',
            fraudRisk: 'SAFE'
        }, { transaction: t });

        await t.commit();

        return sendSuccess(res, `Utility ${billType} bill of $${amountNum.toFixed(2)} paid successfully.`, {
            bill,
            transaction,
            newBalance: wallet.balance
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// @desc    Get user utility bills ledger history
// @route   GET /api/bills/history
// @access  Private
const getBillHistory = async (req, res, next) => {
    try {
        const bills = await Bill.findAll({
            where: { userId: req.user.id },
            order: [['paidAt', 'DESC']]
        });

        return sendSuccess(res, 'Billing statement history loaded.', { bills });

    } catch (error) {
        next(error);
    }
};

// @desc    Get bill details by ID
// @route   GET /api/bills/:id
// @access  Private
const getBillById = async (req, res, next) => {
    try {
        const bill = await Bill.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!bill) {
            return sendError(res, 'Billing invoice not found or unauthorized access.', 404);
        }

        return sendSuccess(res, 'Utility invoice loaded.', { bill });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    payBill,
    getBillHistory,
    getBillById
};
