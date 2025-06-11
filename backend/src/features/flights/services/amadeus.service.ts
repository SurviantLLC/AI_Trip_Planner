import Amadeus from 'amadeus';

/**
 * Service for Amadeus API integration
 * Handles flights, hotels, points of interest searches, and flight booking
 */
class AmadeusService {
  private client: Amadeus | null = null;
  private isInitialized = false;
  
  /**
   * Check if Amadeus client is properly initialized
   * @returns boolean indicating if the client is ready for API calls
   */
  public isClientInitialized(): boolean {
    return this.isInitialized;
  }

  constructor() {
    this.initialize();
    
    // Test authorization on init to verify credentials work
    if (this.isInitialized) {
      this.testAuth().catch(e => console.error('❌ Amadeus auth test failed:', e));
    }
  }
  
  /**
   * Initialize the Amadeus client with environment variables
   * @private
   */
  private initialize() {
    try {
      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      const hostname = process.env.AMADEUS_HOSTNAME || 'test';
      
      console.log('Attempting to initialize Amadeus with:');
      console.log('- Client ID exists:', !!clientId);
      console.log('- Client Secret exists:', !!clientSecret);
      console.log('- Hostname:', hostname);
      
      if (!clientId || !clientSecret) {
        console.error('⚠️ ERROR: Amadeus API credentials are missing!');
        console.error('Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in your .env file');
        return;
      }
      
      // Create Amadeus client with the right configuration
      // Note: TypeScript definitions might be incomplete
      this.client = new Amadeus({
        clientId,
        clientSecret
      } as any);
      
      // Log the environment being used
      console.log(`Using Amadeus ${hostname} environment`);
      
      this.isInitialized = true;
      console.log('✅ Amadeus service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Amadeus client:', error);
      this.isInitialized = false;
      this.client = null;
    }
  }
  
  /**
   * Test authorization by making a simple API call
   * @private
   * @returns Promise resolving to boolean indicating success
   */
  private async testAuth(): Promise<boolean> {
    try {
      // Make a simple API call to verify credentials
      // Using an API call that's documented in the Amadeus API
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      
      const response = await this.client.referenceData.locations.get({
        keyword: 'LON',
        subType: 'CITY'
      });
      console.log('Amadeus auth test successful:', response.data);
      return true;
    } catch (error) {
      console.error('Amadeus auth test failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if the Amadeus client is initialized
   * @private
   */
  private checkInitialization() {
    if (!this.isInitialized || !this.client) {
      throw new Error('Amadeus client is not initialized. Please check your credentials in the .env file.');
    }
  }

  /**
   * Search for flights between two locations (GET method)
   * 
   * @param originCode IATA airport/city code for origin
   * @param destinationCode IATA airport/city code for destination
   * @param departDate Departure date in YYYY-MM-DD format
   * @param returnDate Optional return date in YYYY-MM-DD format
   * @param adults Number of adult passengers
   * @param cabin Optional cabin class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
   * @returns Flight offers if available
   */
  async searchFlights(
    originCode: string,
    destinationCode: string,
    departDate: string,
    returnDate?: string,
    adults: number = 1,
    cabin: string = 'ECONOMY'
  ) {
    this.checkInitialization();

    try {
      // Ensure the date is in the future
      const depDate = new Date(departDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (depDate < today) {
        console.warn('Departure date is in the past, using tomorrow instead');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        departDate = tomorrow.toISOString().split('T')[0];
      }
      
      // Process return date if provided
      if (returnDate) {
        const retDate = new Date(returnDate);
        if (retDate < depDate) {
          console.warn('Return date is before departure date, using departure date + 7 days');
          const nextWeek = new Date(depDate);
          nextWeek.setDate(nextWeek.getDate() + 7);
          returnDate = nextWeek.toISOString().split('T')[0];
        }
      }

      console.log(`Searching flights: ${originCode.toUpperCase()} to ${destinationCode.toUpperCase()} on ${departDate}${returnDate ? ' returning ' + returnDate : ''}`);
      
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      
      const response = await this.client.shopping.flightOffersSearch.get({
        originLocationCode: originCode.toUpperCase(),
        destinationLocationCode: destinationCode.toUpperCase(),
        departureDate: departDate,
        returnDate: returnDate,
        adults: adults,
        travelClass: cabin,
        currencyCode: 'USD',
        max: 10
      });

      console.log(`Found ${response.data.length} flight offers`);
      return response.data;
    } catch (error: any) {
      console.error('Error searching flights:', error.response?.body || error.message || error);
      
      if (error.response?.statusCode === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      } else if (error.response?.statusCode === 401) {
        throw new Error('Authentication failed. Please check your Amadeus API credentials.');
      } else if (error.response?.statusCode === 404) {
        throw new Error('No flights found for the given criteria.');
      }
      
      throw error;
    }
  }

  /**
   * Search for flights with more advanced criteria (POST method)
   * 
   * @param searchParams Flight search parameters
   * @returns Flight offers matching the criteria
   */
  async searchFlightsWithCriteria(searchParams: any) {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      const response = await this.client.shopping.flightOffersSearch.post(
        JSON.stringify(searchParams)
      );
      
      return response.data;
    } catch (error) {
      console.error('Error searching flights with criteria:', error);
      throw error;
    }
  }
  
  /**
   * Search for flights with advanced criteria using POST method
   * Supports more complex search parameters like multi-city, specific airlines, etc.
   * 
   * @param searchParams Advanced flight search parameters
   * @returns Flight offers matching the criteria
   */
  async searchFlightsAdvanced(searchParams: {
    originDestinations: Array<{
      id: string;
      originLocationCode: string;
      destinationLocationCode: string;
      departureDateTimeRange: {
        date: string;
        time?: string;
        dateWindow?: string;
      };
    }>;
    travelers: Array<{
      id: string;
      travelerType: 'ADULT' | 'CHILD' | 'HELD_INFANT' | 'SEATED_INFANT' | 'SENIOR';
      associatedAdultId?: string;
    }>;
    sources?: string[];
    searchCriteria?: {
      maxFlightOffers?: number;
      flightFilters?: {
        cabinRestrictions?: Array<{
          cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
          coverage: 'MOST_SEGMENTS' | 'AT_LEAST_ONE_SEGMENT' | 'ALL_SEGMENTS';
          originDestinationIds: string[];
        }>;
        carrierRestrictions?: {
          blacklistedInEUAllowed?: boolean;
          excludedCarrierCodes?: string[];
          includedCarrierCodes?: string[];
        };
        connectionRestriction?: {
          maxNumberOfConnections?: number;
          airportChangeAllowed?: boolean;
          technicalStopsAllowed?: boolean;
        };
      };
    };
  }) {
    this.checkInitialization();

    try {
      console.log('Performing advanced flight search with criteria:', searchParams);

      const response = await this.client!.shopping.flightOffersSearch.post(
        JSON.stringify(searchParams)
      );
      
      console.log(`Found ${response.data?.length || 0} flight offers (advanced search)`);
      return response.data;
    } catch (error: any) {
      console.error('Error in advanced flight search:', error.response?.body || error.message || error);
      
      if (error.response?.statusCode === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      throw error;
    }
  }
  
  /**
   * Confirm the price and availability of selected flight offers
   * This is a mandatory step before booking to ensure price hasn't changed
   * 
   * @param flightOffers Array of flight offers to price (usually just one)
   * @param travelers Optional traveler details for more accurate pricing
   * @returns Confirmed flight offers with final pricing
   */
  async confirmFlightPrice(
    flightOffers: any[],
    travelers?: Array<{
      id: string;
      dateOfBirth?: string;
      name?: {
        firstName: string;
        lastName: string;
      };
      gender?: 'MALE' | 'FEMALE';
    }>
  ) {
    this.checkInitialization();
    
    try {
      console.log('Confirming price for flight offers...');
      
      const requestBody: any = {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: flightOffers
        }
      };

      // Add traveler details if provided for more accurate pricing
      if (travelers && travelers.length > 0) {
        requestBody.data.travelers = travelers;
      }

      // Include additional pricing details using queryparams option in the body itself
      // instead of as a second parameter to avoid type errors
      requestBody.include = 'detailed-fare-rules,bags';
      
      const response = await this.client!.shopping.flightOffers.pricing.post(
        JSON.stringify(requestBody)
      );
      
      console.log('Price confirmation successful');
      console.log(`Original price: ${flightOffers[0]?.price?.total}, Confirmed price: ${response.data?.flightOffers?.[0]?.price?.total}`);
      
      // Check for price change
      if (response.data?.flightOffers?.[0]) {
        const originalPrice = parseFloat(flightOffers[0]?.price?.total || '0');
        const confirmedPrice = parseFloat(response.data.flightOffers[0].price.total);
        
        if (Math.abs(originalPrice - confirmedPrice) > 0.01) {
          console.warn(`PRICE CHANGED! Original: ${originalPrice}, New: ${confirmedPrice}`);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error confirming flight price:', error.response?.body || error.message || error);
      
      if (error.response?.statusCode === 400 && error.response?.body?.errors?.[0]?.code === 37200) {
        throw new Error(`Price has changed. ${error.response.body.errors[0].detail}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Create a flight booking (PNR) with passenger details
   * This is the final step in the booking process
   * 
   * @param confirmedOffer The flight offer from confirmFlightPrice (with confirmed pricing)
   * @param travelers Array of traveler details
   * @param contacts Contact information for the booking
   * @param remarks Optional booking remarks
   * @returns Booking confirmation with PNR
   */
  async createFlightBooking(
    confirmedOffer: any,
    travelers: Array<{
      id: string;
      dateOfBirth: string; // YYYY-MM-DD
      name: {
        firstName: string;
        lastName: string;
      };
      gender: 'MALE' | 'FEMALE';
      contact: {
        emailAddress?: string;
        phones?: Array<{
          deviceType: 'MOBILE' | 'LANDLINE';
          countryCallingCode: string;
          number: string;
        }>;
      };
      documents?: Array<{
        documentType: 'PASSPORT' | 'IDENTITY_CARD';
        birthPlace?: string;
        issuanceLocation?: string;
        issuanceDate?: string; // YYYY-MM-DD
        number: string;
        expiryDate?: string; // YYYY-MM-DD
        issuanceCountry: string;
        validityCountry: string;
        nationality: string;
        holder: boolean;
      }>;
    }>,
    contacts: Array<{
      addresseeName?: {
        firstName: string;
        lastName: string;
      };
      companyName?: string;
      purpose?: 'STANDARD' | 'INVOICE';
      emailAddress?: string;
      phones?: Array<{
        deviceType: 'MOBILE' | 'LANDLINE';
        countryCallingCode: string;
        number: string;
      }>;
      address?: {
        lines: string[];
        postalCode?: string;
        cityName?: string;
        countryCode: string;
      };
    }>,
    remarks?: {
      general?: Array<{
        subType: 'GENERAL_MISCELLANEOUS';
        text: string;
      }>;
    }
  ) {
    this.checkInitialization();
    
    try {
      console.log('Creating flight booking...');
      
      const requestBody = {
        data: {
          type: 'flight-order',
          flightOffers: [confirmedOffer], // Must be from confirmFlightPrice response
          travelers: travelers,
          remarks: remarks || {
            general: [{
              subType: 'GENERAL_MISCELLANEOUS' as const,
              text: 'Booking created via AI Trip Planner'
            }]
          },
          ticketingAgreement: {
            option: 'DELAY_TO_CANCEL',
            delay: '6D' // 6 days to ticket
          },
          contacts: contacts
        }
      };

      const response = await this.client!.booking.flightOrders.post(
        JSON.stringify(requestBody)
      );
      
      console.log('✅ Flight booking created successfully!');
      console.log(`PNR: ${response.data?.associatedRecords?.[0]?.reference || 'N/A'}`);
      console.log(`Order ID: ${response.data?.id}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating flight booking:', error.response?.body || error.message || error);
      
      // Handle specific booking errors
      if (error.response?.statusCode === 400) {
        const errorBody = error.response.body;
        
        if (errorBody?.errors?.[0]?.code === 37200) {
          throw new Error('Price has changed since confirmation. Please search again.');
        } else if (errorBody?.errors?.[0]?.code === 1398) {
          throw new Error('Invalid passenger information. Please check all details.');
        } else if (errorBody?.errors?.[0]?.title === 'INVALID FORMAT') {
          throw new Error('Payment cannot be processed in self-service mode. Work with an airline consolidator.');
        }
        
        throw new Error(`Booking failed: ${JSON.stringify(errorBody)}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Get available fare rules for a confirmed flight offer
   * 
   * @param confirmedOffer Flight offer from confirmFlightPrice
   * @returns Detailed fare rules
   */
  async getFlightFareRules(confirmedOffer: any) {
    this.checkInitialization();
    
    try {
      if (!confirmedOffer?.id) {
        throw new Error('Invalid flight offer - missing ID');
      }

      // Fare rules are included in the confirmFlightPrice response if requested
      // This is just a helper to extract them
      return confirmedOffer.fareDetailsBySegment || [];
    } catch (error) {
      console.error('Error getting fare rules:', error);
      throw error;
    }
  }

  /**
   * Format flight duration from ISO 8601 to human readable
   * @param duration ISO 8601 duration like "PT2H30M"
   * @returns Human readable duration like "2h 30m"
   */
  formatFlightDuration(duration: string): string {
    if (!duration) return '';
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return duration;
    
    const hours = match[1] || '0';
    const minutes = match[2] || '0';
    
    return `${hours}h ${minutes}m`;
  }

  /**
   * Calculate total journey time including layovers
   * @param segments Array of flight segments
   * @returns Total duration in human readable format
   */
  calculateTotalJourneyTime(segments: any[]): string {
    if (!segments || segments.length === 0) return '';
    
    const departure = new Date(segments[0].departure.at);
    const arrival = new Date(segments[segments.length - 1].arrival.at);
    
    const diffMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  /**
   * Get list of hotels in a city (Hotel List/Search)
   * 
   * @param cityCode IATA city code
   * @param radius Search radius in KM (default: 5)
   * @returns List of hotels in the city
   */
  async getHotelList(
    cityCode: string,
    radius: number = 5
  ) {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      
      console.log(`Getting hotel list for city: ${cityCode}`);
      
      // The correct way to access this endpoint
      const response = await (this.client as any).referenceData.locations.hotels.byCity.get({
        cityCode: cityCode.toUpperCase()
      });

      console.log(`Found ${response.data?.length || 0} hotels in ${cityCode}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error getting hotel list:', error.response?.body || error.message || error);
      
      if (error.response?.statusCode === 404) {
        throw new Error(`No hotels found for city code: ${cityCode}`);
      }
      
      throw new Error(`Failed to get hotel list: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Search for hotel offers in a given location (Hotel Offers Search)
   * 
   * @param cityCode IATA city code
   * @param checkInDate Check-in date in YYYY-MM-DD format
   * @param checkOutDate Check-out date in YYYY-MM-DD format
   * @param adults Number of adult guests
   * @param radius Search radius in KM (default: 5)
   * @returns Hotel offers if available
   */
  async searchHotels(
    cityCode: string,
    checkInDate: string,
    checkOutDate: string,
    adults: number = 1,
    radius: number = 5
  ) {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      
      console.log(`Searching hotels in ${cityCode} from ${checkInDate} to ${checkOutDate}`);
      
      // First, try to get hotels by city
      let hotelIds: string[] = [];
      
      try {
        // Get list of hotels in the city first
        const hotelList = await this.getHotelList(cityCode);
        
        if (hotelList && hotelList.length > 0) {
          // Extract hotel IDs (limit to first 20 to avoid too many requests)
          hotelIds = hotelList.slice(0, 20).map((hotel: any) => hotel.hotelId);
          console.log(`Found ${hotelIds.length} hotels to search for offers`);
        }
      } catch (listError) {
        console.warn('Could not get hotel list, trying direct search:', listError);
      }
      
      // If we have hotel IDs, search for offers
      if (hotelIds.length > 0) {
        try {
          // Use hotelOffersSearch with specific hotel IDs
          const response = await (this.client as any).shopping.hotelOffersSearch.get({
            hotelIds: hotelIds.join(','),
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            adults: adults,
            currency: 'USD',
            bestRateOnly: true
          });
          
          console.log(`Found ${response.data?.length || 0} hotel offers`);
          return response.data || [];
        } catch (searchError: any) {
          console.error('Error searching hotel offers by IDs:', searchError.response?.body || searchError);
        }
      }
      
      // Fallback: Try searching by city coordinates if available
      try {
        // Try to get city details first
        const cityDetails = await this.lookupCity(cityCode, 'CITY');
        
        if (cityDetails && cityDetails.length > 0 && cityDetails[0].geoCode) {
          const { latitude, longitude } = cityDetails[0].geoCode;
          
          console.log(`Searching hotels by coordinates: ${latitude}, ${longitude}`);
          
          const response = await (this.client as any).shopping.hotelOffersSearch.get({
            latitude: latitude,
            longitude: longitude,
            radius: radius,
            radiusUnit: 'KM',
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            adults: adults,
            currency: 'USD',
            bestRateOnly: true
          });
          
          console.log(`Found ${response.data?.length || 0} hotel offers by location`);
          return response.data || [];
        }
      } catch (coordError) {
        console.error('Coordinate search also failed:', coordError);
      }
      
      // If all methods fail, throw an error
      throw new Error(`Unable to find hotels in ${cityCode}. Try a different city or check the city code.`);
      
    } catch (error: any) {
      console.error('Error searching hotels:', error.response?.body || error.message || error);
      
      if (error.message?.includes('Unable to find hotels')) {
        throw error;
      }
      
      throw new Error(`Hotel search failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Search hotels by geographic coordinates (alternative method)
   */
  async searchHotelsByCoordinates(
    latitude: number,
    longitude: number,
    checkInDate: string,
    checkOutDate: string,
    adults: number = 1,
    radius: number = 5
  ) {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      
      console.log(`Searching hotels by coordinates: ${latitude}, ${longitude}`);
      
      const response = await (this.client as any).shopping.hotelOffersSearch.get({
        latitude: latitude,
        longitude: longitude,
        radius: radius,
        radiusUnit: 'KM',
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        adults: adults,
        currency: 'USD',
        bestRateOnly: true
      });

      return response.data || [];
    } catch (error: any) {
      console.error('Error searching hotels by coordinates:', error);
      throw new Error(`Hotel search by coordinates failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Get details for a specific hotel
   * 
   * @param hotelId Hotel ID
   * @returns Hotel details
   */
  async getHotelDetails(hotelId: string) {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      const response = await this.client.shopping.hotelOffersByHotel.get({
        hotelId: hotelId
      });

      return response.data;
    } catch (error) {
      console.error('Error getting hotel details:', error);
      throw error;
    }
  }

  /**
   * Book a hotel offer
   * 
   * @param offerId Hotel offer ID to book
   * @param guests Guest information
   * @param payments Payment information
   * @returns Booking confirmation
   */
  async bookHotel(
    offerId: string,
    guests: any[],
    payments: any[]
  ) {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      const response = await this.client.booking.hotelBookings.post(
        JSON.stringify({
          data: {
            offerId: offerId,
            guests: guests,
            payments: payments
          }
        })
      );

      return response.data;
    } catch (error) {
      console.error('Error booking hotel:', error);
      throw error;
    }
  }

  /**
   * Search for points of interest in a given location
   * 
   * @param latitude Latitude coordinate
   * @param longitude Longitude coordinate
   * @param radius Search radius in KM (default: 2)
   * @returns Points of interest if available
   */
  async searchPointsOfInterest(
    latitude: number,
    longitude: number,
    radius: number = 2
  ) {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      // Correctly access the pointsOfInterest endpoint
      const response = await this.client.referenceData.locations.pointsOfInterest.get({
        latitude: latitude,
        longitude: longitude,
        radius: radius
      });

      return response.data;
    } catch (error) {
      console.error('Error searching points of interest:', error);
      throw error;
    }
  }

  /**
   * Look up city or airport information by keyword (Airport & City Search)
   * 
   * @param keyword City name, airport name, or IATA code
   * @param subType Type of location to search for (AIRPORT, CITY, or both)
   * @returns Location information if available
   */
  async lookupCity(keyword: string, subType: string = 'CITY,AIRPORT') {
    this.checkInitialization();

    try {
      if (!this.client) {
        throw new Error('Amadeus client is not initialized');
      }
      const response = await this.client.referenceData.locations.get({
        keyword: keyword,
        subType: subType
      });

      return response.data;
    } catch (error) {
      console.error('Error looking up city:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const amadeusService = new AmadeusService();
export default amadeusService;