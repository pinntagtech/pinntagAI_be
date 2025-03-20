import mongoose from 'mongoose';

export class Menu {
  name: string;
  description: string;
  price: number;
}

export class Allergen {
  name: string;
  description: string;
}

export class OpeningHours {
  day: string;
  open: string;
  close: string;
}
export class Review {
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

export class Promotion {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

export class Insurance {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
}

export class TaxDetails {
  vatRate: number;
  corporationTaxRate: number;
}

export class Location {
  id?: string;
  name?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  email?: string;
  phone?: string;
  referenceNumber?: string;
}
