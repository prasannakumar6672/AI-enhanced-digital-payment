/* 
 * Request Input validation parser
 * Captures express-validator logs and formats errors
 */

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorArray = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        return sendError(res, 'Request validation failed.', 400, errorArray);
    }
    
    next();
};

module.exports = { validate };
