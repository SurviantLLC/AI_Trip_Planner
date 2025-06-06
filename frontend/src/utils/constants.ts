// API endpoints
export const API_ENDPOINTS = {
  CHAT: '/chat',
  AUTH: '/auth',
  USER: '/user',
  TRIPS: '/trips',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  CHAT_HISTORY: 'chatHistory',
};

// Chat message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LOCATION: 'location',
  SUGGESTION: 'suggestion',
};

// Travel styles
export const TRAVEL_STYLES = [
  { id: 'adventure', name: 'Adventure', icon: '🧗‍♂️' },
  { id: 'beach', name: 'Beach', icon: '🏖️' },
  { id: 'city', name: 'City', icon: '🏙️' },
  { id: 'culture', name: 'Cultural', icon: '🏛️' },
  { id: 'food', name: 'Culinary', icon: '🍽️' },
  { id: 'luxury', name: 'Luxury', icon: '💎' },
  { id: 'nature', name: 'Nature', icon: '🏞️' },
  { id: 'relaxation', name: 'Relaxation', icon: '🧘‍♀️' },
];
