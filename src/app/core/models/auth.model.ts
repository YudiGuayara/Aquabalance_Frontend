export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  token: string;
  email: string;
  nombre: string;
  rol: string;
}

export interface MensajeResponse {
  mensaje: string;
}

export interface ResetPasswordRequest {
  token: string;
  nuevaPassword: string;
}
