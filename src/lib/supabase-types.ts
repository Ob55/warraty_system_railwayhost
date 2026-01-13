// Custom types for the warranty management system
export type ProductType = 'EPC' | 'LPG' | 'OTHER';
export type WarrantyStatus = 'active' | 'expired';
export type AppRole = 'admin' | 'user';

export interface Product {
  id: string;
  product_type: ProductType;
  serial_number: string;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyOwner {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  access_code: string;
  created_at: string;
  updated_at: string;
}

export interface Warranty {
  id: string;
  product_id: string;
  owner_id: string;
  activation_date: string;
  expiry_date: string;
  status: WarrantyStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface WarrantyWithDetails extends Warranty {
  product: Product;
  owner: WarrantyOwner;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
