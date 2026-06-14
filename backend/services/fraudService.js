/* 
 * Fraud Detection Service
 * Evaluates payment metrics against heuristic rules to flag suspicious wire transfers
 */

const { Op } = require('sequelize');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');

class FraudService {
    /**
     * Evaluates security risk score of a proposed transaction
     * @param {Object} transactionData - details of transfer (senderId, receiverId, amount, walletBalance)
     * @returns {Promise<Object>} - returns { riskLevel: 'SAFE'|'SUSPICIOUS'|'HIGH_RISK', riskScore: Number, messages: Array }
     */
    async analyzeTransaction(transactionData) {
        const { senderId, amount, walletBalance } = transactionData;
        const amountNum = parseFloat(amount);

        // 1. Attempt ML-based Random Forest classification via FastAPI
        try {
            // Formulate standard input features for creditcard.csv RF model (30 features)
            // Time: seconds since start of current day
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const Time = (now.getTime() - startOfDay.getTime()) / 1000;
            
            const mlFeatures = {
                Time,
                Amount: amountNum
            };
            
            // PCA V1-V28 are zero-centered, default to 0.0
            for (let i = 1; i <= 28; i++) {
                mlFeatures[`V${i}`] = 0.0;
            }
            
            // Heuristic adjustments to PCA values to simulate anomalies for testing:
            // e.g. if the transaction drains the wallet or is an extreme high amount
            if (walletBalance && amountNum > (walletBalance * 0.85)) {
                mlFeatures['V1'] = -1.5; // Simulate anomaly
                mlFeatures['V3'] = -2.0;
            }
            if (amountNum > 2000.0) {
                mlFeatures['V10'] = -2.5; // High influence feature for fraud in creditcard.csv
            }

            const response = await axios.post('http://localhost:8000/predict', mlFeatures, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 2000 // 2 second timeout safety threshold
            });

            if (response.data && typeof response.data.risk_score === 'number') {
                return {
                    riskLevel: response.data.risk_level,
                    riskScore: response.data.risk_score,
                    alertType: response.data.risk_level !== 'SAFE' ? 'ML_ALERT' : 'NONE',
                    message: `Transaction evaluated by ML Shield: ${response.data.risk_level}. (Score: ${response.data.risk_score})`
                };
            }
        } catch (error) {
            console.warn('ML Shield microservice offline or error. Falling back to heuristic classifier. Error:', error.message);
        }

        // 2. Fallback heuristic classifier
        let riskScore = 10; // Base normal starting baseline
        const alertMessages = [];
        const alertTypes = [];

        // Rule 1: High Transaction Amount
        if (amountNum > 2000.00) {
            riskScore += 55;
            alertMessages.push('Anomalous high transaction amount exceeding standard user profile limits.');
            alertTypes.push('HIGH_AMOUNT');
        } else if (amountNum > 1000.00) {
            riskScore += 30;
            alertMessages.push('Transaction amount exceeds average user bounds.');
            alertTypes.push('ELEVATED_AMOUNT');
        }

        // Rule 2: Transaction Timing anomaly (1:00 AM - 4:00 AM)
        const currentHour = new Date().getHours();
        if (currentHour >= 1 && currentHour <= 4) {
            riskScore += 20;
            alertMessages.push('Transaction executed at anomalous night hours.');
            alertTypes.push('ANOMALOUS_HOURS');
        }

        // Rule 3: Frequency Spike (velocity check in last 2 minutes)
        if (senderId) {
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            const recentTxnCount = await Transaction.count({
                where: {
                    senderId,
                    createdAt: {
                        [Op.gte]: twoMinutesAgo
                    }
                }
            });

            if (recentTxnCount >= 4) {
                riskScore += 40;
                alertMessages.push('High frequency transaction velocity detected. Possible automated script liquidation.');
                alertTypes.push('FREQUENCY_SPIKE');
            } else if (recentTxnCount >= 2) {
                riskScore += 15;
                alertMessages.push('Elevated transaction frequency.');
                alertTypes.push('ELEVATED_FREQUENCY');
            }
        }

        // Rule 4: Wallet Behavior (Draining check - transfer exceeds 85% of wallet balance)
        if (walletBalance && amountNum > (walletBalance * 0.85)) {
            riskScore += 30;
            alertMessages.push('Transaction drains over 85% of active wallet balance (anomalous liquidation).');
            alertTypes.push('WALLET_DRAIN');
        }

        // Bound risk score between 0 and 100
        riskScore = Math.min(Math.max(riskScore, 0), 100);

        // Classify Risk Level
        let riskLevel = 'SAFE';
        if (riskScore >= 70) {
            riskLevel = 'HIGH_RISK';
        } else if (riskScore >= 40) {
            riskLevel = 'SUSPICIOUS';
        }

        return {
            riskLevel,
            riskScore,
            alertType: alertTypes[0] || 'NONE',
            message: alertMessages.join(' | ') || 'Transaction approved: safe heuristics.'
        };
    }

    /**
     * Logs a fraud alert record to database
     * @param {Number} transactionId 
     * @param {Object} analysisResult 
     */
    async logAlert(transactionId, analysisResult) {
        if (analysisResult.riskLevel === 'SAFE') return null;

        return await FraudAlert.create({
            transactionId,
            riskScore: analysisResult.riskScore,
            alertType: analysisResult.alertType,
            message: analysisResult.message
        });
    }
}

module.exports = new FraudService();
