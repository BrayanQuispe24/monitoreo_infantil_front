export interface LoginResponse {
    access_token: string,
    token_type: string,
    user: {
        username: string,
        email: string,
        role: string,
        daycare_id: string,
        id: string,
        created_at: string
    }
    guardian: null
}