/* 
 * Sequelize Database Model: FraudAlert
 * Logs AI threat alerts triggered by transactions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Transaction = require('./Transaction');

const FraudAlert = sequelize.define('FraudAlert', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    transactionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'transactions',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    riskScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    alertType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'fraud_alerts'
});

// Associations
Transaction.hasMany(FraudAlert, { foreignKey: 'transactionId', as: 'fraudAlerts' });
FraudAlert.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

module.exports = FraudAlert;
