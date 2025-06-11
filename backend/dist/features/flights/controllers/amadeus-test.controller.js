"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAmadeusController = void 0;
const amadeus_service_1 = __importDefault(require("../services/amadeus.service"));
/**
 * Controller for testing Amadeus API integration
 */
exports.testAmadeusController = {
    /**
     * Test if Amadeus is initialized and all API services are working
     */
    async testApiServices(req, res) {
        try {
            const results = {
                isInitialized: false,
                services: {
                    citySearch: { tested: false, working: false, result: null, error: null },
                    flightSearch: { tested: false, working: false, result: null, error: null },
                    hotelSearch: { tested: false, working: false, result: null, error: null },
                    pointsOfInterest: { tested: false, working: false, result: null, error: null }
                }
            };
            // Test if Amadeus client is initialized
            results.isInitialized = amadeus_service_1.default.isClientInitialized();
            if (!results.isInitialized) {
                return res.status(500).json({
                    message: 'Amadeus client is not initialized. Check environment variables.',
                    results
                });
            }
            // Test city search API
            try {
                results.services.citySearch.tested = true;
                const cityResult = await amadeus_service_1.default.lookupCity('Chicago');
                results.services.citySearch.working = cityResult && cityResult.length > 0;
                results.services.citySearch.result = cityResult;
            }
            catch (error) {
                results.services.citySearch.error = error instanceof Error ? error.message : String(error);
            }
            // Test flight search API
            try {
                results.services.flightSearch.tested = true;
                const flightResult = await amadeus_service_1.default.searchFlights('CHI', // Chicago
                'MIA', // Miami
                '2023-07-15' // Test date
                );
                results.services.flightSearch.working = flightResult && flightResult.length > 0;
                // Only include relevant parts to avoid huge response
                if (flightResult && flightResult.length > 0) {
                    results.services.flightSearch.result = {
                        count: flightResult.length,
                        firstResult: flightResult[0]
                    };
                }
            }
            catch (error) {
                results.services.flightSearch.error = error instanceof Error ? error.message : String(error);
            }
            // Test hotel search API
            try {
                results.services.hotelSearch.tested = true;
                const hotelResult = await amadeus_service_1.default.searchHotels('MIA', // Miami
                '2023-07-15', // Check-in
                '2023-07-20' // Check-out
                );
                results.services.hotelSearch.working = hotelResult && hotelResult.length > 0;
                // Only include relevant parts
                if (hotelResult && hotelResult.length > 0) {
                    results.services.hotelSearch.result = {
                        count: hotelResult.length,
                        firstResult: hotelResult[0]
                    };
                }
            }
            catch (error) {
                results.services.hotelSearch.error = error instanceof Error ? error.message : String(error);
            }
            // Test points of interest API
            try {
                results.services.pointsOfInterest.tested = true;
                const poiResult = await amadeus_service_1.default.searchPointsOfInterest(25.7617, // Miami latitude
                -80.1918 // Miami longitude
                );
                results.services.pointsOfInterest.working = poiResult && poiResult.length > 0;
                // Only include relevant parts
                if (poiResult && poiResult.length > 0) {
                    results.services.pointsOfInterest.result = {
                        count: poiResult.length,
                        firstResult: poiResult[0]
                    };
                }
            }
            catch (error) {
                results.services.pointsOfInterest.error = error instanceof Error ? error.message : String(error);
            }
            return res.status(200).json({
                message: 'Amadeus API services test completed',
                results
            });
        }
        catch (error) {
            return res.status(500).json({
                message: 'Error testing Amadeus API services',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
};
