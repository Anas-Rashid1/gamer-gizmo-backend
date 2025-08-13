// src/types/product.ts
export interface Product {
  id: number;
  name: string;
  price: string; // Kept as string to match your database schema
  created_at: Date;
  category_id: number;
}
