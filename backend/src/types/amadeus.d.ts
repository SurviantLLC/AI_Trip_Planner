/**
 * Type declarations for Amadeus Node.js SDK
 */
declare module 'amadeus' {
  export default class Amadeus {
    constructor(options: { clientId: string; clientSecret: string });

    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<{ data: any }>;
        post(body: string): Promise<{ data: any }>;
      };
      flightOffers: {
        pricing: {
          post(body: string): Promise<{ data: any }>;
        };
      };
      hotelOffers: {
        get(params: any): Promise<{ data: any }>;
      };
      hotelOffersByHotel: {
        get(params: any): Promise<{ data: any }>;
      };
    };

    booking: {
      flightOrders: {
        post(body: string): Promise<{ data: any }>;
      };
      hotelBookings: {
        post(body: string): Promise<{ data: any }>;
      };
    };

    referenceData: {
      locations: {
        get(params: any): Promise<{ data: any }>;
        hotels: {
          byCity: {
            get(params: any): Promise<{ data: any }>;
          };
        };
        pointsOfInterest: {
          get(params: any): Promise<{ data: any }>;
          bySquare: {
            get(params: any): Promise<{ data: any }>;
          };
        };
      };
    };
  }
}
