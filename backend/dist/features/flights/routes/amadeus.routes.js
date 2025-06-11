"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore - Ignoring TypeScript errors for Express import to make it work with CommonJS
const express = require('express');
const amadeus_test_controller_1 = require("../controllers/amadeus-test.controller");
const router = express.Router();
// Endpoint to test Amadeus API services
router.get('/test-api', amadeus_test_controller_1.testAmadeusController.testApiServices);
exports.default = router;
