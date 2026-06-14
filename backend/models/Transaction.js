/* 
 * Sequelize Database Model: Transaction
 * Represents money transfer details and risk grades
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable for add_money or system credits
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable for withdrawals or payments outside users
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    transactionType: {
        type: DataTypes.ENUM('send-money', 'receive-money', 'bill-payment', 'add-money', 'withdraw'),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Success', 'Failed', 'Pending'),
        allowNull: false,
        defaultValue: 'Success'
    },
    fraudRisk: {
        type: DataTypes.ENUM('SAFE', 'SUSPICIOUS', 'HIGH_RISK'),
        allowNull: false,
        defaultValue: 'SAFE'
    }
}, {
    tableName: 'transactions'
});

// Associations
User.hasMany(Transaction, { foreignKey: 'senderId', as: 'sentTransactions' });
User.hasMany(Transaction, { foreignKey: 'receiverId', as: 'receivedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Transaction.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

module.exports = Transaction;
