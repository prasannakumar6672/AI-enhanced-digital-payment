/* 
 * Global Centralized Error Middleware
 * Intercepts uncaught exceptions and sends clean, formatted JSON payloads
 */

const { sendError } = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log the full stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
        console.error('✘ Server Exception Intercepted:', err.stack);
    } else {
        console.error('✘ Server Exception:', err.message);
    }

    sendError(
        res,
        err.message || 'Internal Server Error',
        statusCode,
        process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
    );
};

module.exports = { errorHandler };
