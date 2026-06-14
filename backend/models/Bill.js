/* 
 * Sequelize Database Model: Bill
 * Tracks utility bill invoices and paid/unpaid status
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Bill = sequelize.define('Bill', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    billType: {
        type: DataTypes.ENUM('Electricity', 'Water', 'Mobile Recharge', 'Internet', 'DTH', 'Gas'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    status: {
        type: DataTypes.ENUM('PAID', 'UNPAID'),
        allowNull: false,
        defaultValue: 'UNPAID'
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'bills'
});

// Associations
User.hasMany(Bill, { foreignKey: 'userId', as: 'bills' });
Bill.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Bill;
