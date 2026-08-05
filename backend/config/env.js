/* 
 * Environment Configurations Helper
 * Validates and wraps environment variables
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5000',
    mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        pass: process.env.DB_PASS || '',
        name: process.env.DB_NAME || 'cyberpay_db'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'supersecretkeyforcyberpayai123',
        expire: process.env.JWT_EXPIRE || '24h'
    }
};
