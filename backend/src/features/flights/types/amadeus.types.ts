export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;
  maxPrice?: number;
  includedAirlineCodes?: string[];
  excludedAirlineCodes?: string[];
}

export interface TravelerInfo {
  id: string;
  dateOfBirth: string;
  name: {
    firstName: string;
    lastName: string;
  };
  gender: 'MALE' | 'FEMALE';
  contact: {
    emailAddress: string;
    phones: Array<{
      deviceType: 'MOBILE' | 'LANDLINE';
      countryCallingCode: string;
      number: string;
    }>;
  };
  documents?: Array<{
    documentType: 'PASSPORT' | 'IDENTITY_CARD';
    number: string;
    expiryDate: string;
    issuanceCountry: string;
    nationality: string;
    holder: boolean;
  }>;
}

export interface ContactInfo {
  emailAddress: string;
  phones: Array<{
    deviceType: 'MOBILE' | 'LANDLINE';
    countryCallingCode: string;
    number: string;
  }>;
  addresseeName: {
    firstName: string;
    lastName: string;
  };
}

export interface BookingRequest {
  selectedOffer: any;
  travelers: TravelerInfo[];
  contacts: ContactInfo[];
}
