/* 
 * Environment Configurations Helper
 * Validates and wraps environment variables
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env file
dotenv.config({ path: path.join(__dirname, '../.env') });

module.exports = {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        pass: process.env.DB_PASS || '',
        name: process.env.DB_NAME || 'cyberpay_db'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'supersecretkeyforcyberpayai123',
        expire: process.env.JWT_EXPIRE || '24h'
    }
};
