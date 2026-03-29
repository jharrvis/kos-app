export interface Province {
  id: string;
  code: string;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface City {
  id: string;
  province_id: string;
  code: string;
  name: string;
  slug: string;
  type: 'kota' | 'kabupaten';
  created_at?: string;
  updated_at?: string;
}

export interface Property {
  id: string;
  provider_id: string;
  title: string;
  description?: string;
  address: string;
  province_id: string;
  city_id: string;
  latitude?: number;
  longitude?: number;
  price: number;
  room_type?: string;
  capacity?: number;
  facilities?: string[];
  status: 'draft' | 'published' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface PropertyWithLocation extends Property {
  provinces?: Province;
  cities?: City;
}