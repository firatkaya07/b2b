export type Role = "admin" | "institution" | "student";

export interface User {
  id: number;
  role: Role;
  full_name: string;
  phone: string;
  institution_id: number | null;
  grade: string | null;
  section: string | null;
  student_no: string | null;
  is_active: number;
}

export interface SetRow {
  id: number;
  institution_id: number;
  name: string;
  grade: string;
  section: string | null;
  teacher: string | null;
  description: string | null;
  price: number;
  is_active: number;
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  price: number;
}

export interface OrderRow {
  id: number;
  user_id: number;
  institution_id: number | null;
  status: string;
  total: number;
  recipient_name: string | null;
  recipient_phone: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  created_at: string;
}
