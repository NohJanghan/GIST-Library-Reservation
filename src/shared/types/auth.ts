export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  type: string;
  expiredAt: number;
};

export type AuthState = AuthResponse & {
  userId: string;
};
