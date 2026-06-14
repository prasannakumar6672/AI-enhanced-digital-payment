/* 
 * JWT Authentication Token Generator
 * Signs and exports payload using the secret config keys
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, env.jwt.secret, {
        expiresIn: env.jwt.expire
    });
};

module.exports = generateToken;
