/* 
 * Fraud Shield Router Configuration
 * Exposes checking utilities and lists triggered threat warning logs
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
    checkTransactionRisk,
    getFraudAlerts,
    getSecurityReport
} = require('../controllers/fraudController');

const checkValidation = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Heuristic check requires a valid transaction amount.'),
    validate
];

// All security guard routes require authentication
router.post('/check', protect, checkValidation, checkTransactionRisk);
router.get('/alerts', protect, getFraudAlerts);
router.get('/report', protect, getSecurityReport);

module.exports = router;
