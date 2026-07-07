export interface UserRegister {
    username: string;
    email: string;
    role: string;
    daycare_id: string | null;
    password: string;
}

export interface UserUpdate {
    username?: string;
    email?: string;
    role?: string;
    daycare_id?: string | null;
    password?: string;
}

export interface UserResponse {
    id: string;
    username: string;
    email: string;
    role: string;
    daycare_id: string | null;
    created_at: string;
}