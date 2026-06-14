/* 
 * Bill Payment Routes Configuration
 * Maps utility checkout requests and verifies body parameters
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
    payBill,
    getBillHistory,
    getBillById
} = require('../controllers/billController');

const billPayValidation = [
    body('billType')
        .isIn(['Electricity', 'Water', 'Mobile Recharge', 'Internet', 'DTH'])
        .withMessage('Invalid utility service type.'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Utility payment amount must be greater than 0.'),
    validate
];

// All billing endpoints require auth guards
router.post('/pay', protect, billPayValidation, payBill);
router.get('/history', protect, getBillHistory);
router.get('/:id', protect, getBillById);

module.exports = router;
