/* 
 * Wallet Routes Configuration
 * Maps wallet endpoints and enforces auth check and validator parameters
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
    getBalance,
    getWalletSummary,
    addMoney,
    withdrawMoney
} = require('../controllers/walletController');

const transactionValueValidation = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive decimal greater than 0.'),
    validate
];

// All wallet endpoints are private
router.get('/balance', protect, getBalance);
router.get('/summary', protect, getWalletSummary);
router.post('/add-money', protect, transactionValueValidation, addMoney);
router.post('/withdraw', protect, transactionValueValidation, withdrawMoney);

module.exports = router;
