export interface User {
    id: number;
    email: string;
    createdAt?: string;
}

export interface AuthResponse {
    message: string;
    accessToken: string;
    user: User;
}

export interface RefreshResponse {
    message: string;
    accessToken: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface UserResponse {
    user: User;
}
