import 'dotenv/config'; // Load environment variables
import amadeusService from './src/features/flights/services/amadeus.service';

// Test function to check Amadeus service initialization and API credentials
async function testAmadeusService() {
  console.log('======== AMADEUS SERVICE DIAGNOSTIC TEST ========');
  console.log('Environment variables:');
  console.log('- AMADEUS_CLIENT_ID exists:', !!process.env.AMADEUS_CLIENT_ID);
  console.log('- AMADEUS_CLIENT_SECRET exists:', !!process.env.AMADEUS_CLIENT_SECRET);
  console.log('- AMADEUS_HOSTNAME:', process.env.AMADEUS_HOSTNAME || 'Not set (defaulting to test)');
  
  console.log('\nAmadeus Service:');
  console.log('- Service object exists:', !!amadeusService);
  console.log('- Is initialized:', amadeusService.isClientInitialized());
  
  try {
    console.log('\nAttempting simple search operation...');
    const testResults = await amadeusService.searchFlights(
      'LHR', // London Heathrow
      'JFK', // New York JFK
      '2025-07-15', // Future date
      undefined, // No return date
      1, // 1 adult
      'ECONOMY' // Economy class
    );
    
    console.log('✅ API call successful!');
    console.log(`Number of results: ${testResults?.length || 0}`);
    if (testResults?.length > 0) {
      console.log('First result sample:');
      console.log(JSON.stringify(testResults[0], null, 2).substring(0, 500) + '...');
    }
  } catch (error) {
    console.error('❌ API call failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
  
  console.log('\n======== TEST COMPLETE ========');
}

// Run the test
testAmadeusService().catch(err => {
  console.error('Test failed with error:', err);
});
