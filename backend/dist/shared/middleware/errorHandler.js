"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: err.message || 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
