"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore - Ignoring TypeScript errors for Express import to make it work with CommonJS
const express = require('express');
const amadeus_service_1 = __importDefault(require("../services/amadeus.service"));
const router = express.Router();
// Debug endpoint to check Amadeus environment variables
router.get('/check-env', (req, res) => {
    // Check if environment variables are loaded
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    // Mask credentials for security
    const maskedClientId = clientId ?
        `${clientId.substring(0, 3)}...${clientId.substring(clientId.length - 3)}` :
        'Not found';
    const maskedClientSecret = clientSecret ?
        `${clientSecret.substring(0, 3)}...${clientSecret.substring(clientSecret.length - 3)}` :
        'Not found';
    res.json({
        envVarsLoaded: {
            AMADEUS_CLIENT_ID: maskedClientId,
            AMADEUS_CLIENT_SECRET: maskedClientSecret,
        },
        serviceInitialized: amadeus_service_1.default.isClientInitialized(),
        nodeEnv: process.env.NODE_ENV || 'not set'
    });
});
// Simple test endpoint for Amadeus airport lookup
router.get('/test-airport/:code', async (req, res) => {
    const { code } = req.params;
    try {
        if (!amadeus_service_1.default.isClientInitialized()) {
            return res.status(500).json({
                error: 'Amadeus client not initialized',
                reason: 'Check if your environment variables are loaded correctly'
            });
        }
        console.log(`Testing airport lookup for code: ${code}`);
        const result = await amadeus_service_1.default.lookupCity(code);
        return res.json({
            success: true,
            query: code,
            result
        });
    }
    catch (error) {
        console.error('Error testing Amadeus API:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.default = router;
