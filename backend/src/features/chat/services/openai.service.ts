import OpenAI from 'openai';
import { Message } from '../models/message.model';
import { z } from 'zod';
import amadeusService from '../../../features/flights/services/amadeus.service';
import type AmadeusService from '../../../features/flights/services/amadeus.service';

// Types for travel intent detection
interface TravelIntent {
  intentType: 'flight' | 'hotel' | 'pointOfInterest' | 'itinerary' | 'general' | 'booking';
  confidence: number;
  params: Record<string, any>;
  requiresAmadeusApi: boolean;
}

/**
 * Interface for location data returned by Amadeus API
 */
interface LocationData {
  type: string; // 'location'
  subType: string; // 'CITY' or 'AIRPORT'
  name: string;
  detailedName: string;
  id: string;
  self: { href: string, methods: string[] };
  timeZoneOffset: string;
  iataCode: string;
  geoCode: { latitude: number, longitude: number };
  address?: { cityName: string, cityCode: string, countryName: string, countryCode: string, regionCode?: string };
  analytics?: { travelers: { score: number } };
  relevance?: number;
}

class OpenAIService {
  private client: OpenAI;

  constructor() {
    try {
      const apiKey = process.env.OPENAI_API_KEY || '';
      
      if (!apiKey || apiKey === '') {
        console.warn('⚠️ WARNING: OPENAI_API_KEY is not set in environment variables');
        console.warn('Will use fallback responses instead of real AI');
      } else {
        console.log('OpenAI service initialized successfully with valid API key');
      }
      
      this.client = new OpenAI({
        apiKey: apiKey || 'dummy-key-for-initialization',
      });
      
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      this.client = {} as OpenAI;
    }
  }
  
  /**
   * Detect travel intent from user message
   * @param userMessage User's message to analyze for intent
   * @returns Travel intent object or null if no relevant intent detected
   */
  private async detectTravelIntent(userMessage: string): Promise<TravelIntent | null> {
    try {
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        return null;
      }
      
      const lowerMsg = userMessage.toLowerCase();
      
      // Ignore greeting/welcome messages
      const greetingPatterns = [
        /^hi$/i, /^hello$/i, /^hey$/i, /^greetings$/i,
        /^what can you do/i, /^help me/i, /^how does this work/i,
        /^what is this/i, /^tell me about yourself/i
      ];
      
      for (const pattern of greetingPatterns) {
        if (pattern.test(lowerMsg)) {
          console.log('Detected greeting message, skipping intent detection');
          return null;
        }
      }
      
      // Detect flight intent with more precise patterns
      const flightPatterns = [
        /\b(?:find|search|looking for|need)\s+(?:a\s+)?flights?\b/i,
        /\b(?:book|get)\s+(?:a\s+)?flights?\b/i,
        /\b(?:fly(?:ing)?)\s+from\s+([\w\s]+)\s+to\s+([\w\s]+)\b/i,
        /\bflights?\s+(?:from|between)\s+([\w\s]+)\s+(?:to|and)\s+([\w\s]+)\b/i,
        /\bair(?:plane|port|line)\s+(?:tickets?|flights?)\b/i
      ];
      
      for (const pattern of flightPatterns) {
        if (pattern.test(lowerMsg)) {
          console.log('DETECTED FLIGHT INTENT with confidence 0.9');
          return {
            intentType: 'flight',
            confidence: 0.9,
            params: { searchText: userMessage },
            requiresAmadeusApi: true
          };
        }
      }
      
      // Hotel intent with improved patterns
      const hotelPatterns = [
        /\b(?:find|search|looking for|need)\s+(?:a\s+)?hotels?\b/i,
        /\b(?:book|get)\s+(?:a\s+)?hotels?\b/i,
        /\b(?:stay|accommodation|room)\s+in\s+([\w\s]+)\b/i,
        /\bhotels?\s+(?:in|near|at)\s+([\w\s]+)\b/i
      ];
      
      for (const pattern of hotelPatterns) {
        if (pattern.test(lowerMsg)) {
          console.log('DETECTED HOTEL INTENT with confidence 0.8');
          return {
            intentType: 'hotel',
            confidence: 0.8,
            params: { searchText: userMessage },
            requiresAmadeusApi: true
          };
        }
      }
      
      // Booking intent with improved patterns
      const bookingPatterns = [
        /\b(?:book|reserve|purchase)\s+(?:a\s+)?(?:tickets?|seats?|flights?)\b/i,
        /\bmake\s+(?:a\s+)?(?:reservation|booking)\b/i,
        /\bbuy\s+(?:a\s+)?(?:tickets?|seats?)\b/i
      ];
      
      for (const pattern of bookingPatterns) {
        if (pattern.test(lowerMsg)) {
          console.log('DETECTED BOOKING INTENT with confidence 0.95');
          return {
            intentType: 'booking',
            confidence: 0.95,
            params: { searchText: userMessage },
            requiresAmadeusApi: true
          };
        }
      }
      
      // Less specific checks as fallback
      if (lowerMsg.includes('flight') && (lowerMsg.includes('from') || lowerMsg.includes('to'))) {
        console.log('DETECTED FLIGHT INTENT (fallback) with confidence 0.7');
        return {
          intentType: 'flight',
          confidence: 0.7,
          params: { searchText: userMessage },
          requiresAmadeusApi: true
        };
      }
      
      if (lowerMsg.includes('hotel') && (lowerMsg.includes('in') || lowerMsg.includes('at') || lowerMsg.includes('near'))) {
        console.log('DETECTED HOTEL INTENT (fallback) with confidence 0.7');
        return {
          intentType: 'hotel',
          confidence: 0.7,
          params: { searchText: userMessage },
          requiresAmadeusApi: true
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting travel intent:', error);
      return null;
    }
  }

  /**
   * Extract flight search parameters from user message
   * @param message User message to parse for flight parameters
   * @returns Object containing origin, destination, and departure date
   */
  private extractFlightParams(message: string): {
    origin?: string;
    destination?: string;
    departDate?: string;
  } {
    const params: {
      origin?: string;
      destination?: string;
      departDate?: string;
    } = {};
    
    // Extract origin and destination
    const locationPatterns = [
      /(?:from|between)\s+([A-Za-z\s]+)\s+to\s+([A-Za-z\s]+)/i,
      /([A-Za-z\s]+)\s+to\s+([A-Za-z\s]+)/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = message.match(pattern);
      if (match) {
        params.origin = match[1].trim();
        params.destination = match[2].trim();
        break;
      }
    }
    
    // Check for common country names that shouldn't be used as destinations
    const countryAbbreviations: Record<string, string> = {
      'uk': 'London',
      'usa': 'New York',
      'us': 'New York',
      'uae': 'Dubai',
      'england': 'London',
      'australia': 'Sydney',
      'canada': 'Toronto',
      'china': 'Beijing',
      'india': 'Delhi',
      'japan': 'Tokyo'
    };
    
    // Replace country references with most popular cities
    if (params.origin) {
      const originLower = params.origin.toLowerCase();
      if (countryAbbreviations[originLower]) {
        params.origin = countryAbbreviations[originLower];
      }
    }
    
    if (params.destination) {
      const destLower = params.destination.toLowerCase();
      if (countryAbbreviations[destLower]) {
        params.destination = countryAbbreviations[destLower];
      }
    }
    
    // Extract dates
    const datePatterns = [
      /(?:on|for)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)/i,
      /(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?)/i,
      /([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        params.departDate = match[1].trim();
        break;
      }
    }
    
    return params;
  }

  /**
   * Convert date string to YYYY-MM-DD format
   * @param dateStr Input date string in various formats
   * @returns ISO formatted date string (YYYY-MM-DD)
   */
  private formatDate(dateStr: string): string {
    try {
      if (!dateStr || typeof dateStr !== 'string') {
        throw new Error('Invalid date string provided');
      }
      
      // Remove ordinal suffixes (1st, 2nd, 3rd, 4th, etc.)
      let normalizedDate = dateStr.replace(/([0-9]+)(st|nd|rd|th)/gi, '$1').trim();
      
      // Add current year if not present
      if (!normalizedDate.match(/\d{4}$/)) {
        const currentYear = new Date().getFullYear();
        normalizedDate += ` ${currentYear}`;
      }
      
      const dateObj = new Date(normalizedDate);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
      }
      
      // Ensure date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateObj < today) {
        // Use tomorrow if date is in the past
        console.warn(`Date ${dateStr} is in the past, using tomorrow instead`);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      // Return tomorrow as default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
  }

  /**
   * Get IATA code for a city/airport
   * @param location Location name (city or airport)
   * @returns IATA code for the location (3-letter code)
   * @throws Error if location cannot be mapped to a valid IATA code
   */
  /**
   * Get a fallback IATA code when Amadeus API is unavailable
   * @param location Location name to convert to airport code
   * @returns Best-effort IATA code for the location
   */
  private getFallbackAirportCode(location: string): string {
    // Common airport/city codes mapping
    const airportCodes: Record<string, string> = {
      'london': 'LHR',
      'new york': 'JFK',
      'paris': 'CDG',
      'tokyo': 'HND',
      'sydney': 'SYD',
      'dubai': 'DXB',
      'madrid': 'MAD',
      'berlin': 'BER',
      'singapore': 'SIN',
      'los angeles': 'LAX',
      'san francisco': 'SFO',
      'miami': 'MIA',
      'chicago': 'ORD',
      'toronto': 'YYZ',
      'vancouver': 'YVR',
      'rome': 'FCO',
      'barcelona': 'BCN',
      'amsterdam': 'AMS',
      'frankfurt': 'FRA',
      'munich': 'MUC',
      'manchester': 'MAN',
      'edinburgh': 'EDI',
      'glasgow': 'GLA',
      'delhi': 'DEL',
      'mumbai': 'BOM',
      'beijing': 'PEK',
      'shanghai': 'PVG',
      'san ramon': 'OAK' // Added San Ramon mapping to nearby Oakland airport
    };
    
    // Try to find an exact match first
    const locationLower = location.toLowerCase();
    const exactCode = airportCodes[locationLower];
    if (exactCode) {
      console.log(`Using fallback IATA code ${exactCode} for ${location}`);
      return exactCode;
    }
    
    // If no exact match, try to find a partial match
    for (const [city, code] of Object.entries(airportCodes)) {
      if (locationLower.includes(city) || city.includes(locationLower)) {
        console.log(`Using partial match fallback IATA code ${code} for ${location} (matched with ${city})`);
        return code;
      }
    }
    
    // If not found, create a sensible 3-letter code
    const sanitizedLocation = location.replace(/[^a-zA-Z0-9]/g, '');
    const generatedCode = sanitizedLocation.substring(0, 3).toUpperCase();
    console.warn(`Generated IATA code ${generatedCode} for ${location}`);
    return generatedCode;
  }

  /**
   * Convert a location name to an IATA code using Amadeus API or fallback
   * @param location Location name to convert (city or airport)
   * @returns IATA code for the location (3-letter code)
   * @throws Error if location cannot be mapped to a valid IATA code
   */
  private async getIATACode(location: string): Promise<string> {
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      throw new Error('Invalid location: Location name is required');
    }

    // Check for country names and special cases first
    const countryToCity: Record<string, string> = {
      'uk': 'London',
      'usa': 'New York',
      'us': 'New York',
      'uae': 'Dubai',
      'england': 'London',
      'britain': 'London',
      'great britain': 'London',
      'united kingdom': 'London',
      'united states': 'New York',
      'australia': 'Sydney',
      'canada': 'Toronto',
      'china': 'Beijing',
      'india': 'Delhi',
      'japan': 'Tokyo',
      'france': 'Paris',
      'germany': 'Berlin',
      'spain': 'Madrid',
      'italy': 'Rome'
    };

    // Check if the location is a country and convert to its major city
    const normalizedLocation = location.trim().toLowerCase();
    if (countryToCity[normalizedLocation]) {
      console.log(`Converting country "${location}" to city "${countryToCity[normalizedLocation]}"`);
      location = countryToCity[normalizedLocation];
    }

    // Check if Amadeus API is available and configured
    if (!amadeusService || !amadeusService.isClientInitialized()) {
      console.log('Amadeus client not initialized, using fallback airport codes');
      return this.getFallbackAirportCode(location);
    }
    
    try {
      // Use Amadeus API to look up the location
      console.log(`Looking up IATA code for: ${location}`);
      const locationData = await amadeusService.lookupCity(location) as LocationData[];
      
      if (locationData && Array.isArray(locationData) && locationData.length > 0) {
        // Prefer city codes over airport codes for better results
        const cityLocation = locationData.find(loc => loc.subType === 'CITY');
        const airportLocation = locationData.find(loc => loc.subType === 'AIRPORT');
        
        const iataCode = cityLocation?.iataCode || airportLocation?.iataCode || locationData[0].iataCode;
        
        // Validate that we have a proper IATA code
        if (iataCode && typeof iataCode === 'string' && iataCode.length === 3) {
          console.log(`Found IATA code: ${iataCode} for ${location}`);
          return iataCode;
        } else {
          console.warn(`Invalid IATA code returned for ${location}: ${iataCode}, falling back to generated code`);
        }
      }
    } catch (error) {
      console.error(`Error looking up IATA code for ${location} via Amadeus:`, error);
    }
    
    // Fallback if API fails or returns invalid data
    console.warn(`Could not find IATA code for ${location}, using fallback method`);
    return this.getFallbackAirportCode(location);
      
    // Fallback if API fails or returns invalid data
    // Return a sanitized fallback in case of error
    const sanitizedLocation = location.replace(/[^a-zA-Z0-9]/g, '');
    if (sanitizedLocation.length >= 3) {
      return sanitizedLocation.substring(0, 3).toUpperCase();
    } else {
      // Pad with 'X' if too short
      return (sanitizedLocation + 'XXX').substring(0, 3).toUpperCase();
    }
  }

  /**
   * Format flight offers into a readable response
   * @param flightOffers Array of flight offer objects from Amadeus API
   * @param origin Original departure location (city name)
   * @param destination Original destination location (city name)
   * @param date Original departure date string
   * @returns Formatted response string with flight details
   */
  private formatFlightResponse(flightOffers: Array<Record<string, any>>, origin: string, destination: string, date: string): string {
    if (!flightOffers || flightOffers.length === 0) {
      return `I couldn't find any flights from ${origin} to ${destination} on ${date}. Would you like to try different dates or locations?`;
    }
    
    let response = `I found ${flightOffers.length} flight option${flightOffers.length > 1 ? 's' : ''} from ${origin} to ${destination} on ${date}:\n\n`;
    
    // Show up to 5 flights
    const maxFlights = Math.min(5, flightOffers.length);
    
    // Define TypeScript interface for expected flight offer structure
    interface FlightSegment {
      departure: { at: string; iataCode: string };
      arrival: { at: string; iataCode: string };
      carrierCode?: string;
      number?: string;
      cabin?: string;
      travelerPricings?: Array<{
        fareDetailsBySegment: Array<{ cabin: string }>
      }>;
    }

    interface FlightItinerary {
      segments: FlightSegment[];
      duration?: string;
    }
    
    interface FlightOffer {
      itineraries: FlightItinerary[];
      price: { 
        total: string; 
        grandTotal?: string;
        currency: string;
      };
    }

    for (let i = 0; i < maxFlights; i++) {
      try {
        const offer = flightOffers[i] as FlightOffer;
        if (!offer?.itineraries?.[0]?.segments) continue;
        
        const itinerary = offer.itineraries[0];
        const segments = itinerary.segments;
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];
        
        response += `**Option ${i + 1}**\n`;
        response += `🛫 Departure: ${new Date(firstSegment.departure.at).toLocaleString()} from ${firstSegment.departure.iataCode}\n`;
        response += `🛬 Arrival: ${new Date(lastSegment.arrival.at).toLocaleString()} at ${lastSegment.arrival.iataCode}\n`;
        
        // Calculate duration
        if (amadeusService && typeof amadeusService.calculateTotalJourneyTime === 'function') {
          const totalDuration = amadeusService.calculateTotalJourneyTime(segments);
          response += `⏱️ Duration: ${totalDuration}\n`;
        } else if (itinerary.duration) {
          response += `⏱️ Duration: ${itinerary.duration}\n`;
        }
        
        // Show stops
        if (segments.length > 1) {
          response += `✈️ Stops: ${segments.length - 1} (${segments.map(seg => seg.arrival.iataCode).slice(0, -1).join(', ')})\n`;
        } else {
          response += `✈️ Direct Flight\n`;
        }
        
        // Show flight number if available
        if (firstSegment.carrierCode && firstSegment.number) {
          response += `🔢 Flight: ${firstSegment.carrierCode}${firstSegment.number}\n`;
        }
        
        // Show price
        const priceValue = offer.price.grandTotal || offer.price.total;
        response += `💰 Price: ${offer.price.currency} ${priceValue}\n`;
        
        // Show cabin class
        let cabinClass = 'Economy';
        if (firstSegment.cabin) {
          cabinClass = firstSegment.cabin;
        } else if (firstSegment.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin) {
          cabinClass = firstSegment.travelerPricings[0].fareDetailsBySegment[0].cabin;
        }
        response += `🪑 Cabin: ${cabinClass}\n`;
        
        response += '\n';
      } catch (err: any) {
        console.error(`Error formatting flight ${i}:`, err);
        continue;
      }
    }
    
    if (flightOffers.length > maxFlights) {
      response += `... and ${flightOffers.length - maxFlights} more options available.\n\n`;
    }
    
    response += "Would you like to book any of these flights or see more options?";
    
    return response;
  }

  /**
   * Handle flight search intent
   * @param messages Array of conversation messages
   * @param intent Detected travel intent
   * @returns Response string with flight search results or error message
   */
  private async handleFlightIntent(messages: Message[], intent: TravelIntent): Promise<string> {
    try {
      const userMessage = [...messages].reverse().find(msg => msg.role === 'user');
      if (!userMessage) {
        return "Please provide details about your flight search.";
      }

      console.log('Processing flight intent:', userMessage.content);

      // Check if Amadeus service is initialized
      if (!amadeusService.isClientInitialized()) {
        console.error('Amadeus service is not initialized');
        return `I'd be happy to help you find flights, but the flight search service is currently unavailable. 

Please ensure:
1. Amadeus API credentials are set in your .env file:
   - AMADEUS_CLIENT_ID=your_client_id
   - AMADEUS_CLIENT_SECRET=your_client_secret

2. The credentials are valid for the Amadeus test environment.

Once configured, I'll be able to search for real flight options for you.`;
      }

      // Extract parameters
      const params = this.extractFlightParams(userMessage.content);
      
      if (!params.origin || !params.destination) {
        return "I'd be happy to search for flights for you. Please provide both the departure city and destination city. For example: 'Find flights from New York to London on June 15th'";
      }

      if (!params.departDate) {
        return `I found that you want to travel from ${params.origin} to ${params.destination}. What date would you like to depart?`;
      }

      // Convert locations to IATA codes
      const originCode = await this.getIATACode(params.origin);
      const destinationCode = await this.getIATACode(params.destination);
      
      // Format the date
      const formattedDate = this.formatDate(params.departDate);
      
      console.log(`Searching flights: ${originCode} → ${destinationCode} on ${formattedDate}`);

      try {
        if (!originCode || !destinationCode) {
          throw new Error('Invalid airport codes');
        }
        
        // Call Amadeus API
        const flightOffers = await amadeusService.searchFlights(
          originCode,
          destinationCode,
          formattedDate,
          undefined, // No return date
          1, // 1 adult
          'ECONOMY' // Default cabin
        );
        
        // Ensure we got a valid response
        if (!flightOffers || !Array.isArray(flightOffers)) {
          throw new Error('No valid flight data returned');
        }
        
        // Format and return the response
        return this.formatFlightResponse(flightOffers, params.origin || '', params.destination || '', params.departDate || '');
        
      } catch (error: any) {
        console.error('Amadeus API error:', error);
        
        // Extract error details if available in Amadeus format
        let errorDetail = '';
        try {
          if (error.message && error.message.includes('{"errors"')) {
            const errorJson = JSON.parse(error.message.substring(error.message.indexOf('{')));
            if (errorJson.errors && errorJson.errors[0]) {
              const amadeuserror = errorJson.errors[0];
              errorDetail = amadeuserror.detail || amadeuserror.title || '';
            }
          }
        } catch (parseError) {
          console.error('Error parsing Amadeus error response:', parseError);
        }
        
        if (error.message?.includes('Authentication failed')) {
          return "The flight search service is not properly configured. Please check your Amadeus API credentials.";
        } else if (error.message?.includes('No flights found')) {
          return `I couldn't find any flights from ${params.origin} to ${params.destination} on ${params.departDate}. This could be because:

1. The route might not be available on that date
2. The airports might be too small or the cities incorrectly identified
3. The date might be too far in the future or already passed

Would you like to try:
- Different dates?
- Nearby airports?
- A different route?`;
        } else if (errorDetail.includes('INVALID FORMAT') || errorDetail.includes('must be a 3-letter code')) {
          // Handle specific case of invalid location codes
          return `I'm having trouble finding the airport codes for your cities. Can you provide more specific information?

For example, instead of "UK" as a destination, please specify a city like "London", "Manchester", or "Edinburgh".

Similarly, for the US, please specify cities like "New York", "Los Angeles", or "Chicago" rather than just "USA".`;
        } else if (errorDetail) {
          // Use the extracted error detail for more informative messages
          return `I encountered an issue while searching for flights: ${errorDetail}. Please try again with more specific locations.`;
        } else {
          return `I encountered an issue while searching for flights. ${error.message || 'Please try again with specific airport codes if possible.'}`;
        }
      }
    } catch (error) {
      console.error('Error in flight intent handler:', error);
      return "I encountered an issue while searching for flights. Please try again with more specific details.";
    }
  }

  /**
   * Handle hotel search intent
   * @param messages Array of conversation messages
   * @param intent Detected travel intent
   * @returns Response string with hotel search results or error message
   */
  private async handleHotelIntent(messages: Message[], intent: TravelIntent): Promise<string> {
    try {
      const userMessage = [...messages].reverse().find(msg => msg.role === 'user');
      if (!userMessage) {
        return "Please provide details about your hotel search.";
      }

      // Check if Amadeus client is initialized and credentials are valid
      if (!amadeusService || !amadeusService.isClientInitialized()) {
        console.error('Amadeus client is not initialized or missing');
        return `I'd be happy to help you find hotels, but the hotel search service is currently unavailable. 

Please ensure:
1. Amadeus API credentials are set in your .env file:
   - AMADEUS_CLIENT_ID=your_client_id
   - AMADEUS_CLIENT_SECRET=your_client_secret

2. The credentials are valid for the Amadeus test environment.

Once configured, I'll be able to search for real hotel options for you.`;
      }

      // Define TypeScript interfaces for hotel search
      interface HotelRoomOffer {
        price: {
          currency: string;
          total: string;
          base?: string;
        };
        room?: {
          type?: string;
          description?: string | { text?: string; lang?: string };
          bedType?: string;
        };
        guests?: {
          adults: number;
        };
        policies?: {
          cancellation?: {
            deadline?: string;
            description?: string | { text?: string; lang?: string };
          };
        };
      }

      interface HotelOffer {
        hotel?: {
          name?: string;
          hotelId?: string;
          cityCode?: string;
          rating?: string | number;
          description?: {
            text?: string;
          };
          amenities?: string[];
          address?: {
            lines?: string[];
            cityName?: string;
            countryCode?: string;
          };
          contact?: {
            phone?: string;
            email?: string;
          };
        };
        offers?: HotelRoomOffer[];
      }

      // Extract parameters from the message
      const message = userMessage.content;
      let city: string | null = null;
      let checkInDate: string | null = null;
      let checkOutDate: string | null = null;
      let adults: number = 1;
      
      // Extract city - enhanced pattern to handle complex locations like "San Ramon, California"
      let cityMatch = null;
      
      // First try to find a full location with specific patterns
      const cityStatePattern = /(?:in|at|near|to)\s+([A-Za-z\s,]+?(?:\s+in\s+[A-Za-z\s]+)?)(?:\s+from|\s+on|\s+for|$)/i;
      cityMatch = message.match(cityStatePattern);
      
      // If that doesn't work, try a more general capture
      if (!cityMatch) {
        const generalLocationPattern = /(?:hotel|stay|room|accommodation)(?:\s+in|\s+at|\s+near|\s+to)?\s+([A-Za-z\s,]+)/i;
        cityMatch = message.match(generalLocationPattern);
      }
      
      // If still no match, try to find any city name in the message
      if (!cityMatch) {
        const fallbackPattern = /([A-Za-z]+(?:\s*,\s*[A-Za-z]+)?)/i;
        cityMatch = message.match(fallbackPattern);
      }
      
      if (cityMatch) {
        city = cityMatch[1].trim();
        
        // Log the extracted city for debugging
        console.log(`Extracted city: "${city}" from message: "${message}"`);  
      }
      
      // Extract dates (simple pattern, could be improved)
      const checkInPattern = /(?:from|on|starting|check[\s-]*in)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?|\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i;
      const checkInMatch = message.match(checkInPattern);
      if (checkInMatch) {
        checkInDate = checkInMatch[1].trim();
      }
      
      const checkOutPattern = /(?:to|until|through|checkout|check[\s-]*out)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?|\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i;
      const checkOutMatch = message.match(checkOutPattern);
      if (checkOutMatch) {
        checkOutDate = checkOutMatch[1].trim();
      }
      
      // Extract number of adults
      const adultsPattern = /(\d+)\s+(?:adult|adults|people|guests)/i;
      const adultsMatch = message.match(adultsPattern);
      if (adultsMatch) {
        adults = parseInt(adultsMatch[1], 10);
        if (isNaN(adults) || adults < 1) adults = 1;
        if (adults > 9) adults = 9; // Typical API limit
      }
      
      if (!city) {
        return "I'd be happy to help you find hotels. Which city are you looking to stay in?";
      }

      // Get city code
      const cityCode = await this.getIATACode(city);
      
      // Use default dates if not provided
      const checkIn = checkInDate ? new Date(this.formatDate(checkInDate)) : new Date();
      if (isNaN(checkIn.getTime())) {
        checkIn.setDate(new Date().getDate() + 7); // Default to 1 week from now
      }
      
      const checkOut = checkOutDate ? new Date(this.formatDate(checkOutDate)) : new Date(checkIn);
      if (isNaN(checkOut.getTime()) || checkOut <= checkIn) {
        checkOut.setDate(checkIn.getDate() + 3); // Default to 3 night stay
      }
      
      const checkInStr = checkIn.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      try {
        if (!cityCode) {
          throw new Error(`Unable to find city code for ${city}`);
        }
        
        console.log(`Searching hotels in ${city} (${cityCode}) from ${checkInStr} to ${checkOutStr} for ${adults} adults`);
        
        let hotelOffers: HotelOffer[] = [];
        try {
          // Explicitly handle errors in the API call
          if (!amadeusService.searchHotels) {
            throw new Error('Hotel search method is not available');
          }
          
          const result = await amadeusService.searchHotels(
            cityCode,
            checkInStr,
            checkOutStr,
            adults
          );
          
          // Validate the response format
          if (!result) {
            throw new Error('Empty response from hotel search');
          }
          
          hotelOffers = result as HotelOffer[];
          console.log(`Retrieved ${hotelOffers?.length || 0} hotel offers for ${city}`);
        } catch (searchError: any) {
          console.error('Hotel search API error:', searchError);
          throw new Error(`Hotel search failed: ${searchError.message || 'Unknown error'}`);
        }
        
        if (!hotelOffers || !Array.isArray(hotelOffers) || hotelOffers.length === 0) {
          return `I couldn't find any available hotels in ${city} for those dates. Would you like to try different dates or a nearby city?`;
        }
        
        let response = `I found ${hotelOffers.length} hotels in ${city}:\n\n`;
        response += `🗓️ Check-in: ${new Date(checkInStr).toLocaleDateString()}\n`;
        response += `🗓️ Check-out: ${new Date(checkOutStr).toLocaleDateString()}\n`;
        response += `👥 Guests: ${adults} adult${adults > 1 ? 's' : ''}\n\n`;
        
        // Show up to 3 hotels
        const maxHotels = Math.min(3, hotelOffers.length);
        
        for (let i = 0; i < maxHotels; i++) {
          const hotel = hotelOffers[i];
          response += `**${i + 1}. ${hotel.hotel?.name || 'Hotel'}**\n`;
          
          if (hotel.hotel?.rating) {
            response += `⭐ Rating: ${hotel.hotel.rating}/5\n`;
          }
          
          if (hotel.hotel?.address?.cityName) {
            response += `📍 Location: ${hotel.hotel.address.cityName}\n`;
          }
          
          if (hotel.offers?.[0]) {
            const offer = hotel.offers[0];
            response += `💰 Price: ${offer.price.currency} ${offer.price.total}\n`;
            
            if (offer.room?.description) {
              // Handle room description which may be an object with text property
              const roomDesc = typeof offer.room.description === 'object' && offer.room.description?.text
                ? offer.room.description.text
                : (typeof offer.room.description === 'string' 
                    ? offer.room.description 
                    : 'Standard Room');
              response += `🛏️ Room: ${roomDesc}\n`;
            }
            
            if (offer.policies?.cancellation?.description) {
              // Handle cancellation description which may be an object with text property
              const cancellationDesc = typeof offer.policies.cancellation.description === 'object' && 
                                      offer.policies.cancellation.description?.text
                ? offer.policies.cancellation.description.text
                : (typeof offer.policies.cancellation.description === 'string' 
                    ? offer.policies.cancellation.description 
                    : 'See hotel for cancellation policy');
              response += `ℹ️ ${cancellationDesc}\n`;
            }
          }
          
          if (hotel.hotel?.amenities && hotel.hotel.amenities.length > 0) {
            const topAmenities = hotel.hotel.amenities.slice(0, 3);
            response += `🏨 Amenities: ${topAmenities.join(', ')}\n`;
          }
          
          response += '\n';
        }
        
        response += "Would you like more details about any of these hotels or to modify your search criteria?";
        return response;
        
      } catch (error: any) {
        console.error('Hotel search error:', error);
        
        if (error.message?.includes('Authentication failed')) {
          return "The hotel search service is not properly configured. Please check your Amadeus API credentials.";
        } else if (error.message?.includes('Invalid city code') || error.message?.includes('Unable to find city code')) {
          return `I couldn't find any hotels in ${city}. The city might be misspelled or not available in our database. Could you try a different city or specify the country as well?`;
        } else {
          return `I encountered an issue searching for hotels in ${city}: ${error.message || 'Please try again with more specific details.'}`;  
        }
      }
    } catch (error: any) {
      console.error('Error in hotel intent handler:', error);
      return `I encountered an issue while searching for hotels: ${error.message || 'Please try again.'}`;  
    }
  }

  /**
   * Fallback response generator
   */
  private getFallbackResponse(messages: Message[] | string): string {
    try {
      let userInput = '';
      
      if (typeof messages === 'string') {
        userInput = messages;
      } else {
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
        userInput = lastUserMessage?.content || '';
      }
      
      const lowerInput = userInput.toLowerCase();
      
      if (lowerInput.includes('flight')) {
        return "I'd be happy to help you find flights. Please let me know your departure city, destination, and travel dates.";
      } else if (lowerInput.includes('hotel')) {
        return "I can help you find hotels. What city are you visiting and when do you need accommodation?";
      } else {
        return "I'm your travel assistant. I can help you search for flights and hotels. What would you like to explore today?";
      }
    } catch (error) {
      return "I'm here to help with your travel plans. What would you like assistance with today?";
    }
  }

  /**
   * Generate standard OpenAI response
   */
  private async generateStandardResponse(
    systemMessage: { role: string; content: string },
    messages: Message[]
  ): Promise<string> {
    try {
      const apiMessages = [
        { role: systemMessage.role as 'system', content: systemMessage.content },
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ];
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || this.getFallbackResponse(messages);
    } catch (error) {
      console.error('Error in standard response:', error);
      return this.getFallbackResponse(messages);
    }
  }

  /**
   * Main response generation method
   */
  async generateResponse(messages: Message[]): Promise<string> {
    try {
      // Check if OpenAI is properly configured
      if (!this.client || !process.env.OPENAI_API_KEY) {
        console.warn('OpenAI not configured, using fallback');
        return this.getFallbackResponse(messages);
      }

      const systemMessage = {
        role: 'system',
        content: `You are an intelligent travel assistant with access to real-time flight and hotel data through Amadeus APIs. 
        Help users search for flights, hotels, and plan their trips. 
        When users ask about flights or hotels, use the integrated Amadeus API to provide real, current data.
        Be helpful, concise, and accurate. Format responses with markdown for clarity.`
      };
      
      // Get the last user message
      const userMessage = [...messages].reverse().find(msg => msg.role === 'user');
      
      // Handle first message specially - never try to detect intent on the first message
      // This prevents incorrect parsing of welcome messages as flight searches
      if (!userMessage || messages.length <= 1) {
        return "Hello! I'm your AI travel assistant. I can help you plan trips, find flights, book hotels, and create amazing itineraries. What would you like to explore today?";
      }
      
      // Check if this is a simple greeting or question about capabilities
      const isGreeting = /^(hi|hello|hey|greetings|what can you do|help me|how does this work)$/i.test(userMessage.content.trim());
      if (isGreeting) {
        if (userMessage.content.toLowerCase().includes('what can you do')) {
          return "I can help you with a variety of travel-related tasks, including:\n\n" +
                 "1. Flight Search: Find and compare flights based on your preferences for dates, destinations, and airlines.\n\n" +
                 "2. Hotel Booking: Locate hotels that suit your budget and requirements, and provide booking information.\n\n" +
                 "3. Trip Planning: Offer suggestions for travel itineraries, including popular attractions and activities at your destination.\n\n" +
                 "4. Travel Advice: Provide tips on travel safety, packing, and cultural insights for different regions.\n\n" +
                 "5. Real-Time Updates: Access current data for flights and hotels to ensure you have the most accurate information.\n\n" +
                 "Let me know what you need help with, and I'll be glad to assist!";
        }
        return "Hello! How can I assist you with your travel plans today? Are you looking for flights, hotels, or some travel inspiration?";
      }
      
      // Detect travel intent for non-greeting messages
      const travelIntent = await this.detectTravelIntent(userMessage.content);
      
      if (travelIntent && travelIntent.confidence > 0.65) {
        console.log(`Detected ${travelIntent.intentType} intent with confidence ${travelIntent.confidence}`);
        
        switch (travelIntent.intentType) {
          case 'flight':
            return await this.handleFlightIntent(messages, travelIntent);
            
          case 'hotel':
            return await this.handleHotelIntent(messages, travelIntent);
            
          case 'booking':
            return `I can help you with flight bookings! To proceed, I'll need:\n\n1. First, let's search for your flight\n2. Select the flight you want to book\n3. Provide passenger details\n4. Confirm and complete the booking\n\nWhat route would you like to book? Please provide your departure city, destination, and travel date.`;
            
          default:
            return await this.generateStandardResponse(systemMessage, messages);
        }
      }
      
      // No travel intent detected, use standard OpenAI
      return await this.generateStandardResponse(systemMessage, messages);
      
    } catch (error: any) {
      console.error('Error in generateResponse:', error);
      return this.getFallbackResponse(messages);
    }
  }
}

// Export singleton instance
const openAIService = new OpenAIService();
export default openAIService;