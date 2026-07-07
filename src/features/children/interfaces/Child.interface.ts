export interface ChildRegister {
  full_name: string;
  age: number | null;
  status: string;
  daycare_id: string;
}

export interface ChildUpdate {
  full_name?: string;
  age?: number | null;
  status?: string;
  daycare_id?: string;
}

export interface ChildResponse {
  id: string;
  code: string;
  full_name: string;
  age: number | null;
  status: string;
  daycare_id: string;
  created_at: string;
  updated_at: string;
}
