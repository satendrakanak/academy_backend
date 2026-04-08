export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}
