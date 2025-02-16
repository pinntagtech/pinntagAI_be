export interface JwtPayload {
    id: string;
    email: string;
    businessProfile?: string;
    role?: string;
}