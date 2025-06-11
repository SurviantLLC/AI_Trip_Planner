"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const amadeus_service_1 = __importDefault(require("../../../features/flights/services/amadeus.service"));
class OpenAIService {
    constructor() {
        try {
            // Initialize OpenAI client with API key from environment variables
            const apiKey = process.env.OPENAI_API_KEY || '';
            if (!apiKey || apiKey === '') {
                console.warn('⚠️ WARNING: OPENAI_API_KEY is not set in environment variables');
                console.warn('Will use fallback responses instead of real AI');
            }
            else {
                console.log('OpenAI service initialized successfully with valid API key');
            }
            this.client = new openai_1.default({
                apiKey: apiKey || 'dummy-key-for-initialization',
            });
            // Note: Once LangChain packages are installed, we would initialize them here
            if (apiKey && apiKey !== '') {
                console.log('Ready for LangChain integration when packages are installed');
            }
        }
        catch (error) {
            console.error('Failed to initialize OpenAI client:', error);
            // Create a dummy client to prevent application crashes
            this.client = {};
        }
    }
    /**
     * Detect if the user message is related to travel and extract structured data
     * @param userMessage The most recent user message
     * @returns Travel intent analysis result or null if not a travel intent
     */
    async detectTravelIntent(userMessage) {
        try {
            // This is a simple heuristic approach until we implement LangChain
            // Once LangChain is available, this will use structured output parsing
            const lowerMsg = userMessage.toLowerCase();
            // Detect flight intent - expanded patterns to catch more variations
            if (lowerMsg.includes('flight') ||
                lowerMsg.includes('fly') ||
                lowerMsg.includes('plane') ||
                lowerMsg.includes('airport') ||
                (lowerMsg.includes('from') && lowerMsg.includes('to') &&
                    (lowerMsg.includes('travel') || lowerMsg.includes('go'))) ||
                // Add patterns to catch "Find me flights from X to Y" format
                (lowerMsg.includes('find') &&
                    (lowerMsg.includes('flight') || lowerMsg.match(/from\s+[\w\s]+\s+to\s+[\w\s]+/)))) {
                console.log('DETECTED FLIGHT INTENT with confidence 0.9');
                return {
                    intentType: 'flight',
                    confidence: 0.9,
                    params: {
                        searchText: userMessage
                    },
                    requiresAmadeusApi: true
                };
            }
            // Hotel-related intent detection
            if (lowerMsg.includes('hotel') || lowerMsg.includes('stay') ||
                lowerMsg.includes('accommodation') || lowerMsg.includes('room') ||
                lowerMsg.includes('lodge') || lowerMsg.includes('hostel')) {
                console.log('DETECTED HOTEL INTENT with confidence 0.8');
                return {
                    intentType: 'hotel',
                    confidence: 0.8,
                    params: {
                        searchText: userMessage
                    },
                    requiresAmadeusApi: true
                };
            }
            // Points of interest / attractions intent
            if (lowerMsg.includes('attraction') || lowerMsg.includes('sight') ||
                lowerMsg.includes('visit') || lowerMsg.includes('tour') ||
                lowerMsg.includes('museum') || lowerMsg.includes('landmark')) {
                console.log('DETECTED POINT OF INTEREST INTENT with confidence 0.75');
                return {
                    intentType: 'pointOfInterest',
                    confidence: 0.75,
                    params: {
                        searchText: userMessage
                    },
                    requiresAmadeusApi: true
                };
            }
            // Itinerary intent
            if (lowerMsg.includes('itinerary') || lowerMsg.includes('plan') ||
                lowerMsg.includes('schedule') ||
                (lowerMsg.includes('day') && lowerMsg.includes('trip'))) {
                console.log('DETECTED ITINERARY INTENT with confidence 0.7');
                return {
                    intentType: 'itinerary',
                    confidence: 0.7,
                    params: {
                        searchText: userMessage
                    },
                    requiresAmadeusApi: false // Can be handled by just LLM initially
                };
            }
            // General travel intent
            if (lowerMsg.includes('travel') || lowerMsg.includes('vacation') ||
                lowerMsg.includes('holiday') || lowerMsg.includes('destination')) {
                console.log('DETECTED GENERAL TRAVEL INTENT with confidence 0.6');
                return {
                    intentType: 'general',
                    confidence: 0.6,
                    params: {
                        searchText: userMessage
                    },
                    requiresAmadeusApi: false
                };
            }
            return null; // Not a travel intent
        }
        catch (error) {
            console.error('Error detecting travel intent:', error);
            return null;
        }
    }
    /**
     * Generate standard OpenAI response
     * @param systemMessage The system message to guide the AI
     * @param messages Conversation history
     */
    async generateStandardResponse(systemMessage, messages) {
        try {
            // Prepare messages for OpenAI API format
            const apiMessages = [
                { role: systemMessage.role, content: systemMessage.content },
                ...messages.map((msg) => ({
                    role: msg.role,
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
        }
        catch (error) {
            console.error('Error in standard response:', error);
            return this.getFallbackResponse(messages);
        }
    }
    /**
     * Fallback response generator when OpenAI API is not available
     * @param messages Conversation history or the current user message
     */
    getFallbackResponse(messages) {
        try {
            // Get the user message from either a string or the messages array
            let userInput = '';
            if (typeof messages === 'string') {
                userInput = messages;
            }
            else {
                // Get the last user message to respond to
                const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
                userInput = lastUserMessage?.content || '';
            }
            console.log('Using fallback response for:', userInput.substring(0, 50));
            // Simple keyword-based responses for travel queries
            if (userInput.toLowerCase().includes('flight')) {
                return "I'd be happy to help you find flights. To get started, please let me know your departure city, destination, preferred travel dates, and number of passengers.";
            }
            else if (userInput.toLowerCase().includes('hotel')) {
                return "I can help you find the perfect hotel. What's your destination, check-in/out dates, and do you have any preferences like budget or amenities?";
            }
            else if (userInput.toLowerCase().includes('trip') || userInput.toLowerCase().includes('plan')) {
                return "I'd love to help plan your trip. Where are you thinking of traveling to, and do you have specific dates in mind?";
            }
            else if (userInput.toLowerCase().includes('recommend') || userInput.toLowerCase().includes('suggest')) {
                return "I'd be happy to make some recommendations. Could you tell me what destination you're interested in?";
            }
            else {
                return "I'm your travel assistant and can help with flights, hotels, trip planning, and travel recommendations. How can I assist with your travel plans today?";
            }
        }
        catch (error) {
            // Ultimate fallback if everything fails
            return "I'm here to help with your travel plans. What would you like assistance with today?";
        }
    }
    /**
     * Handle flight-related travel intent
     */
    async handleFlightIntent(messages, intent) {
        try {
            // Get the last user message
            const userMessage = [...messages].reverse().find(msg => msg.role === 'user');
            if (!userMessage) {
                return "Please provide details about your flight search.";
            }
            console.log('Processing flight intent with message:', userMessage.content);
            // Extract flight search parameters from the message using regex patterns
            // This is a simple implementation that could be replaced with LangChain
            let origin = null;
            let destination = null;
            let departDate = null;
            // Extract origin and destination
            const locationPattern = /(?:from|between)\s+([A-Za-z\s]+)\s+to\s+([A-Za-z\s]+)/i;
            const locationMatch = userMessage.content.match(locationPattern);
            if (locationMatch) {
                origin = locationMatch[1].trim();
                destination = locationMatch[2].trim();
                console.log(`Detected origin: ${origin}, destination: ${destination}`);
            }
            // Extract date patterns (simple version)
            const datePattern = /(?:on|for)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+)(?:\s+\d{4})?/i;
            const dateMatch = userMessage.content.match(datePattern);
            if (dateMatch) {
                departDate = dateMatch[1].trim();
                console.log(`Detected date: ${departDate}`);
            }
            // If we don't have enough information, ask for more details
            if (!origin || !destination) {
                return `I'd be happy to help you find flights! To search for available options, could you please provide:

1. **Departure city/airport**
2. **Destination city/airport**
3. **Departure date** (and return date for round-trip)

For example: "Find flights from New York to London on June 15th"`;
            }
            // Try to convert city names to airport codes
            try {
                // Look up city codes
                const originInfo = await amadeus_service_1.default.lookupCity(origin);
                const destInfo = await amadeus_service_1.default.lookupCity(destination);
                if (originInfo && originInfo.length > 0 && destInfo && destInfo.length > 0) {
                    const originCode = originInfo[0].iataCode;
                    const destCode = destInfo[0].iataCode;
                    // Format the departure date (simple approach)
                    let formattedDate = new Date();
                    if (departDate) {
                        formattedDate = new Date(departDate);
                    }
                    else {
                        // Default to tomorrow if no date provided
                        formattedDate.setDate(formattedDate.getDate() + 1);
                    }
                    const dateString = formattedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                    console.log(`Searching flights: ${originCode} to ${destCode} on ${dateString}`);
                    // Search for flights using the Amadeus API
                    const flightOffers = await amadeus_service_1.default.searchFlights(originCode, destCode, dateString);
                    if (flightOffers && flightOffers.length > 0) {
                        // Format the results
                        let response = `Here are some flight options from ${origin} to ${destination}`;
                        if (departDate)
                            response += ` on ${departDate}`;
                        response += ':\n\n';
                        // Display up to 3 flight options
                        const flightsToShow = Math.min(3, flightOffers.length);
                        for (let i = 0; i < flightsToShow; i++) {
                            const offer = flightOffers[i];
                            const firstSegment = offer.itineraries[0].segments[0];
                            const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
                            response += `${i + 1}. **${firstSegment.carrierCode} ${firstSegment.number}**\n`;
                            response += `   - Departure: ${firstSegment.departure.iataCode} at ${new Date(firstSegment.departure.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n`;
                            response += `   - Arrival: ${lastSegment.arrival.iataCode} at ${new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n`;
                            response += `   - Duration: ${offer.itineraries[0].duration.replace('PT', '')}\n`;
                            response += `   - Price: ${offer.price.currency} ${offer.price.total}\n\n`;
                        }
                        response += `Would you like to see more options or filter these results?`;
                        return response;
                    }
                    else {
                        return `I searched for flights from ${origin} to ${destination}, but couldn't find any available options for the specified date. Would you like to try different dates or airports?`;
                    }
                }
                else {
                    return `I couldn't find airport codes for ${origin} or ${destination}. Could you please provide IATA airport codes instead (e.g., JFK for New York JFK, LHR for London Heathrow)?`;
                }
            }
            catch (error) {
                console.error('Error searching flights:', error);
                // Provide a helpful response even when API calls fail
                return `I'd be happy to help you find flights from ${origin || 'your departure city'} to ${destination || 'your destination'}.

To provide the most accurate flight options, I'll need the following information:

1. **Departure city/airport**: ${origin || 'Please specify'}
2. **Destination city/airport**: ${destination || 'Please specify'}
3. **Departure date**: ${departDate || 'Please specify'} (YYYY-MM-DD format works best)
4. **Number of passengers**: Adults, children?
5. **Cabin preference**: Economy, Premium Economy, Business, or First?

Once you provide these details, I'll search for the best options for you.`;
            }
        }
        catch (error) {
            console.error('Error in flight intent handler:', error);
            return `I encountered an issue while searching for flights. Please try again with more specific details about your departure city/airport, destination, and travel dates.`;
        }
    }
    /**
     * Handle hotel-related travel intent
     */
    async handleHotelIntent(messages, intent) {
        // In a full implementation, this would use LangChain to orchestrate Amadeus API calls
        return `I can help you find the perfect hotel accommodation!

**Hotel Search**

To search for hotels using the Amadeus API, I'll need a few details:

1. **Destination city**
2. **Check-in date**
3. **Check-out date**
4. **Number of guests**
5. **Any preferences** (budget range, star rating, amenities)

Once you provide these details, I'll find the best hotel options for your stay.`;
    }
    /**
     * Handle points of interest travel intent
     */
    async handlePointOfInterestIntent(messages, intent) {
        // In a full implementation, this would use LangChain to orchestrate Amadeus API calls
        return `I'd be happy to help you discover points of interest and attractions!

**Attractions Search**

Using the Amadeus Points of Interest API, I can find top attractions, landmarks, and activities. To help you better:

1. **Which city/destination are you interested in?**
2. **Any specific categories of interest?** (museums, parks, historical sites, etc.)
3. **How much time do you have to explore?**

Once you provide these details, I'll compile a list of recommended attractions for your visit.`;
    }
    /**
     * Handle itinerary creation intent
     */
    async handleItineraryIntent(messages, intent) {
        // In a full implementation, this would use LangChain to orchestrate multiple services
        return `I'd love to help you create a travel itinerary!

**Itinerary Planning**

To create a personalized itinerary for you, I'll need to know:

1. **Destination(s)** you'll be visiting
2. **Travel dates** (arrival and departure)
3. **Key interests** (history, nature, food, shopping, etc.)
4. **Pace preference** (relaxed, moderate, packed)
5. **Any must-see attractions** you already know about

Once you provide these details, I'll craft a day-by-day itinerary that balances attractions, dining, and experiences.`;
    }
    /**
     * Handle general travel questions
     */
    async handleGeneralTravelIntent(messages, intent) {
        // Create a system message specifically tailored for travel advice
        const travelSystemMessage = {
            role: 'system',
            content: `You are a knowledgeable travel assistant. Provide helpful, accurate travel information and tips.
      Focus on practical advice and organize your response clearly using markdown formatting when appropriate.
      If you don't know specific details about a location, acknowledge that rather than inventing facts.`
        };
        // Use standard OpenAI response with enhanced travel system message
        return this.generateStandardResponse(travelSystemMessage, messages);
    }
    /**
     * Generate an AI response based on conversation history
     *
     * @param messages Array of conversation messages with role and content
     * @returns AI generated response text
     */
    async generateResponse(messages) {
        try {
            // Check if OpenAI client is properly initialized
            if (!this.client || !this.client.chat || typeof this.client.chat.completions?.create !== 'function') {
                console.warn('OpenAI client not properly initialized. Using fallback response.');
                return this.getFallbackResponse(messages);
            }
            // Check if API key is available
            if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
                console.warn('Missing OpenAI API key. Using fallback response.');
                return this.getFallbackResponse(messages);
            }
            // Create a better system message with instructions for handling travel planning
            const systemMessage = {
                role: 'system',
                content: `You are an intelligent travel assistant. Help users plan trips, find flights, hotels, and attractions. Be concise and helpful. IMPORTANT INSTRUCTIONS:
        1) Remember user preferences and details they provide such as dates, destinations, and preferences.
        2) Never ask for the same information twice.
        3) If the user provides travel dates, passenger counts, or other details, acknowledge them and use them in your responses.
        4) Present information in a clear, organized manner.
        5) When appropriate, organize information using markdown formatting (bold, headings, bullet points).
        6) For complex recommendations, use numbered steps.
        7) Focus on practical travel advice and personalization.
        8) If you don't know specific details about a location, acknowledge that rather than inventing facts.`
            };
            // Get the last user message
            const userMessage = [...messages].reverse().find(msg => msg.role === 'user');
            if (!userMessage) {
                return "Hello! I'm your travel planning assistant. How can I help you today?";
            }
            // Check if this is a travel-related query that should be handled by LangChain
            const travelIntent = await this.detectTravelIntent(userMessage.content);
            if (travelIntent && travelIntent.confidence > 0.65) {
                console.log(`Detected travel intent: ${travelIntent.intentType} with confidence ${travelIntent.confidence}`);
                // In a full implementation, we would route to different LangChain agents based on intent
                // For now, we'll handle the response with information about what would happen
                let response = '';
                switch (travelIntent.intentType) {
                    case 'flight':
                        response = await this.handleFlightIntent(messages, travelIntent);
                        break;
                    case 'hotel':
                        response = await this.handleHotelIntent(messages, travelIntent);
                        break;
                    case 'pointOfInterest':
                        response = await this.handlePointOfInterestIntent(messages, travelIntent);
                        break;
                    case 'itinerary':
                        response = await this.handleItineraryIntent(messages, travelIntent);
                        break;
                    case 'general':
                        response = await this.handleGeneralTravelIntent(messages, travelIntent);
                        break;
                    default:
                        // Fall back to standard OpenAI response
                        return await this.generateStandardResponse(systemMessage, messages);
                }
                return response || this.getFallbackResponse(messages);
            }
            // If no travel intent detected or confidence is low, use standard OpenAI response
            return await this.generateStandardResponse(systemMessage, messages);
        }
        catch (error) {
            console.error('Error in generateResponse:', error?.message || error);
            return this.getFallbackResponse(messages);
        }
    }
}
// Export a singleton instance
const openAIService = new OpenAIService();
// For better compatibility with both ESM and CommonJS
exports.default = openAIService;
module.exports = { default: openAIService };
// Make TypeScript happy
module.exports.default = openAIService;
