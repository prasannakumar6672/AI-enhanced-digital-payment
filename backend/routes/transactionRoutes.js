/* 
 * Transaction Route Maps
 * Defines transfers routes, search history, and delete options
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
    sendMoney,
    getTransactionHistory,
    getTransactionById,
    deleteTransaction
} = require('../controllers/transactionController');

const transferValidation = [
    body('receiverEmailOrPhone')
        .trim()
        .notEmpty()
        .withMessage('Receiver phone number or email is required.'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Transfer amount must be a positive decimal greater than 0.'),
    validate
];

// All transfer endpoints require authentication
router.post('/send-money', protect, transferValidation, sendMoney);
router.get('/history', protect, getTransactionHistory);
router.get('/:id', protect, getTransactionById);
router.delete('/:id', protect, deleteTransaction);

module.exports = router;
