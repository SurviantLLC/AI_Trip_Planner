"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amadeus_1 = __importDefault(require("amadeus"));
/**
 * Service for Amadeus API integration
 * Handles flights, hotels, and points of interest searches
 */
class AmadeusService {
    /**
     * Check if Amadeus client is properly initialized
     * @returns boolean indicating if the client is ready for API calls
     */
    isClientInitialized() {
        return this.isInitialized;
    }
    constructor() {
        this.isInitialized = false;
        try {
            // Initialize Amadeus client with API key from environment variables
            const clientId = process.env.AMADEUS_CLIENT_ID;
            const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
            console.log('Amadeus credentials check:', {
                hasClientId: !!clientId,
                hasClientSecret: !!clientSecret,
                clientIdLength: clientId?.length || 0,
                clientSecretLength: clientSecret?.length || 0
            });
            if (!clientId || !clientSecret) {
                console.warn('⚠️ WARNING: Amadeus API credentials are not set in environment variables');
                console.warn('Amadeus API integration will not function correctly');
            }
            else {
                this.client = new amadeus_1.default({
                    clientId,
                    clientSecret
                });
                // Enable debug logging
                console.log('Amadeus client created with credentials');
                this.isInitialized = true;
                console.log('Amadeus service initialized successfully with credentials');
                // Test authorization on init to verify credentials work
                this.testAuth().catch(e => console.error('Amadeus auth test failed:', e));
            }
        }
        catch (error) {
            console.error('Failed to initialize Amadeus client:', error);
            this.isInitialized = false;
        }
    }
    /**
     * Test authorization by making a simple API call
     * @private
     * @returns Promise resolving to boolean indicating success
     */
    async testAuth() {
        try {
            // Make a simple API call to verify credentials
            // Using an API call that's documented in the Amadeus API
            const response = await this.client.referenceData.locations.get({
                keyword: 'LON',
                subType: 'CITY'
            });
            console.log('Amadeus auth test successful:', response.data);
            return true;
        }
        catch (error) {
            console.error('Amadeus auth test failed:', error);
            this.isInitialized = false;
            return false;
        }
    }
    /**
     * Check if the Amadeus client is initialized
     * @private
     */
    checkInitialization() {
        if (!this.isInitialized) {
            throw new Error('Amadeus client is not initialized. Please check your credentials.');
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
    async searchFlights(originCode, destinationCode, departDate, returnDate, adults = 1, cabin = 'ECONOMY') {
        this.checkInitialization();
        try {
            const response = await this.client.shopping.flightOffersSearch.get({
                originLocationCode: originCode,
                destinationLocationCode: destinationCode,
                departureDate: departDate,
                returnDate: returnDate,
                adults: adults,
                travelClass: cabin,
                currencyCode: 'USD',
                max: 20
            });
            return response.data;
        }
        catch (error) {
            console.error('Error searching flights:', error);
            throw error;
        }
    }
    /**
     * Search for flights with more advanced criteria (POST method)
     *
     * @param searchParams Flight search parameters
     * @returns Flight offers matching the criteria
     */
    async searchFlightsWithCriteria(searchParams) {
        this.checkInitialization();
        try {
            const response = await this.client.shopping.flightOffersSearch.post(JSON.stringify(searchParams));
            return response.data;
        }
        catch (error) {
            console.error('Error searching flights with criteria:', error);
            throw error;
        }
    }
    /**
     * Get pricing information for selected flight offers
     *
     * @param flightOffers Array of flight offers to price
     * @returns Priced flight offers
     */
    async getFlightOffersPrice(flightOffers) {
        this.checkInitialization();
        try {
            const response = await this.client.shopping.flightOffers.pricing.post(JSON.stringify({
                data: {
                    type: 'flight-offers-pricing',
                    flightOffers: flightOffers
                }
            }));
            return response.data;
        }
        catch (error) {
            console.error('Error pricing flight offers:', error);
            throw error;
        }
    }
    /**
     * Create flight order (booking)
     *
     * @param flightOffer Flight offer to book
     * @param travelers Traveler information
     * @param contactDetails Contact details for the booking
     * @returns Booking confirmation
     */
    async createFlightOrder(flightOffer, travelers, contactDetails) {
        this.checkInitialization();
        try {
            const response = await this.client.booking.flightOrders.post(JSON.stringify({
                data: {
                    type: 'flight-order',
                    flightOffers: [flightOffer],
                    travelers: travelers,
                    remarks: {
                        general: [{
                                subType: 'GENERAL_MISCELLANEOUS',
                                text: 'AI Trip Planner booking'
                            }]
                    },
                    ticketingAgreement: {
                        option: 'DELAY_TO_CANCEL',
                        delay: '6D'
                    },
                    contacts: [contactDetails]
                }
            }));
            return response.data;
        }
        catch (error) {
            console.error('Error creating flight order:', error);
            throw error;
        }
    }
    /**
     * Get list of hotels in a city (Hotel List/Search)
     *
     * @param cityCode IATA city code
     * @param radius Search radius in KM (default: 5)
     * @returns List of hotels in the city
     */
    async getHotelList(cityCode, radius = 5) {
        this.checkInitialization();
        try {
            const response = await this.client.referenceData.locations.hotels.byCity.get({
                cityCode: cityCode,
                radius: radius,
                radiusUnit: 'KM',
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting hotel list:', error);
            throw error;
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
    async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5) {
        this.checkInitialization();
        try {
            const response = await this.client.shopping.hotelOffers.get({
                cityCode: cityCode,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                adults: adults,
                radius: radius,
                radiusUnit: 'KM',
                currency: 'USD',
                includeClosed: false,
                bestRateOnly: true,
                view: 'FULL'
            });
            return response.data;
        }
        catch (error) {
            console.error('Error searching hotels:', error);
            throw error;
        }
    }
    /**
     * Get offers for a specific hotel
     *
     * @param hotelId Hotel ID
     * @param checkInDate Check-in date in YYYY-MM-DD format
     * @param checkOutDate Check-out date in YYYY-MM-DD format
     * @param adults Number of adult guests
     * @returns Hotel offer details
     */
    async getHotelOffers(hotelId, checkInDate, checkOutDate, adults = 1) {
        this.checkInitialization();
        try {
            const response = await this.client.shopping.hotelOffersByHotel.get({
                hotelId: hotelId,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                adults: adults,
                currency: 'USD',
                view: 'FULL_ALL_IMAGES'
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting hotel offers:', error);
            throw error;
        }
    }
    /**
     * Book a hotel (Hotel Booking)
     *
     * @param offerId Hotel offer ID to book
     * @param guests Guest information
     * @param payments Payment information
     * @returns Booking confirmation
     */
    async bookHotel(offerId, guests, payments) {
        this.checkInitialization();
        try {
            const response = await this.client.booking.hotelBookings.post(JSON.stringify({
                data: {
                    offerId: offerId,
                    guests: guests,
                    payments: payments
                }
            }));
            return response.data;
        }
        catch (error) {
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
    async searchPointsOfInterest(latitude, longitude, radius = 2) {
        this.checkInitialization();
        try {
            // Correctly access the pointsOfInterest endpoint
            const response = await this.client.referenceData.locations.pointsOfInterest.get({
                latitude: latitude,
                longitude: longitude,
                radius: radius
            });
            return response.data;
        }
        catch (error) {
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
    async lookupCity(keyword, subType = 'CITY,AIRPORT') {
        this.checkInitialization();
        try {
            const response = await this.client.referenceData.locations.get({
                keyword: keyword,
                subType: subType
            });
            return response.data;
        }
        catch (error) {
            console.error('Error looking up city:', error);
            throw error;
        }
    }
}
// Export a singleton instance
const amadeusService = new AmadeusService();
exports.default = amadeusService;
