// Define the user response type
export interface JwtUser {
  sub: number;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  isManager: boolean;
  isAdmin: boolean;
}
