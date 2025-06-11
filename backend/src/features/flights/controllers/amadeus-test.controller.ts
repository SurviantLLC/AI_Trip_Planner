import { Request, Response } from 'express';
import amadeusService from '../services/amadeus.service';

/**
 * Controller for testing Amadeus API integration
 */
export const testAmadeusController = {
  /**
   * Test if Amadeus is initialized and all API services are working
   */
  async testApiServices(req: Request, res: Response) {
    console.log('Starting Amadeus API services test...');
    try {
      const results = {
        isInitialized: false,
        services: {
          citySearch: { tested: false, working: false, result: null as any, error: null as string | null },
          flightSearch: { tested: false, working: false, result: null as any, error: null as string | null },
          hotelSearch: { tested: false, working: false, result: null as any, error: null as string | null },
          pointsOfInterest: { tested: false, working: false, result: null as any, error: null as string | null }
        }
      };

      // Test if Amadeus client is initialized
      results.isInitialized = amadeusService.isClientInitialized();
      console.log(`Amadeus client initialized: ${results.isInitialized}`);

      if (!results.isInitialized) {
        return res.status(500).json({
          message: 'Amadeus client is not initialized. Check environment variables.',
          results
        });
      }

      // Test city search API
      try {
        console.log('Testing Amadeus city search API...');
        results.services.citySearch.tested = true;
        const cityResult = await amadeusService.lookupCity('Chicago');
        console.log('City search API response received:', cityResult ? `Found ${cityResult.length} results` : 'No results');
        results.services.citySearch.working = cityResult && cityResult.length > 0;
        results.services.citySearch.result = cityResult;
        console.log('City search API test completed successfully');
      } catch (error) {
        console.error('Error testing city search API:', error);
        results.services.citySearch.error = error instanceof Error ? error.message : String(error);
      }

      // Test flight search API
      try {
        console.log('Testing Amadeus flight search API...');
        results.services.flightSearch.tested = true;
        const flightResult = await amadeusService.searchFlights(
          'CHI', // Chicago
          'MIA', // Miami
          '2023-07-15' // Test date
        );
        console.log('Flight search API response received:', flightResult ? `Found ${flightResult.length} results` : 'No results');
        results.services.flightSearch.working = flightResult && flightResult.length > 0;
        // Only include relevant parts to avoid huge response
        if (flightResult && flightResult.length > 0) {
          results.services.flightSearch.result = {
            count: flightResult.length,
            firstResult: flightResult[0]
          };
          console.log(`Flight search found ${flightResult.length} flights`);
        }
        console.log('Flight search API test completed successfully');
      } catch (error) {
        console.error('Error testing flight search API:', error);
        results.services.flightSearch.error = error instanceof Error ? error.message : String(error);
      }

      // Test hotel search API
      try {
        results.services.hotelSearch.tested = true;
        const hotelResult = await amadeusService.searchHotels(
          'MIA', // Miami
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
      } catch (error) {
        results.services.hotelSearch.error = error instanceof Error ? error.message : String(error);
      }

      // Test points of interest API
      try {
        results.services.pointsOfInterest.tested = true;
        const poiResult = await amadeusService.searchPointsOfInterest(
          25.7617, // Miami latitude
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
      } catch (error) {
        results.services.pointsOfInterest.error = error instanceof Error ? error.message : String(error);
      }

      return res.status(200).json({
        message: 'Amadeus API services test completed',
        results
      });

    } catch (error) {
      return res.status(500).json({
        message: 'Error testing Amadeus API services',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
};
