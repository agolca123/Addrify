export interface ReverseAddressResult {
  id: string;
  locationId: string;
  address: string;
  streetAddress: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  userData: {
    name?: string;
    phone?: string;
    email?: string;
    age?: number;
    gender?: string;
    interests?: string[];
    occupation?: string;
    income_level?: string;
    education?: string;
    marital_status?: string;
    household_size?: number;
  };
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  parentId?: string;
  pixelCode: string;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
  addressCount: number;
  twoFactorEnabled: boolean;
  isDemo: boolean;
  notificationPreferences: {
    email: boolean;
    browser: boolean;
    updates: boolean;
    security: boolean;
  };
  createdAt: string;
}

export interface LocationData {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  deviceInfo?: any;
  timestamp: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  addressLimit: number;
  features: string[];
  isPopular: boolean;
  stripePriceId?: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  planId?: string;
  stripePaymentId?: string;
  createdAt: string;
}