/* 
 * Sequelize Database Connection Configuration
 * Initializes MySQL pool connection using credentials from environment variables
 */

const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
    host: env.db.host,
    dialect: 'mysql',
    logging: env.nodeEnv === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true // adds createdAt and updatedAt automatically
    }
});

// Test DB Connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✔ MySQL Database Connected successfully.');
    } catch (error) {
        console.error('✘ Unable to connect to MySQL database:', error.message);
        console.log('Please ensure that MySQL is running and database exists.');
    }
};

module.exports = {
    sequelize,
    connectDB
};
