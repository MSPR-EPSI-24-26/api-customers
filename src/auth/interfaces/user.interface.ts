export interface User {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  sub?: string;
}
