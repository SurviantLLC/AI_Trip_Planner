// @ts-ignore - Ignoring TypeScript errors for Express import to make it work with CommonJS
const express = require('express');
import { testAmadeusController } from '../controllers/amadeus-test.controller';
import { bookingController } from '../controllers/booking.controller';

const router = express.Router();

// Endpoint to test Amadeus API services
router.get('/test-api', testAmadeusController.testApiServices);

// New booking flow endpoints
router.post('/booking/confirm-price', bookingController.confirmPrice);
router.post('/booking/create', bookingController.createBooking);

export default router;
