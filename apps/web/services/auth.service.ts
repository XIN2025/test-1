import { ApiClient } from '@/lib/api-client';
import { AuthContextType, LoginInput, RegisterEmailInput, SetPasswordInput } from '@repo/shared-types/types';

export interface LoginResponse {
  id: string;
  email: string;
  name: string;
  token: string;
}

export interface VerifyEmailResponse {
  redirectUrl: string;
}

export class AuthService {
  static async loginEmail(loginData: LoginInput) {
    return await ApiClient.post<LoginResponse>('/api/auth/login/email', loginData);
  }

  static async loginGoogle(idToken: string) {
    return await ApiClient.post<LoginResponse>('/api/auth/login/google', { idToken });
  }

  static async registerEmail(registerData: RegisterEmailInput) {
    return await ApiClient.post('/api/auth/register/email', registerData);
  }

  static async setPassword(setPasswordData: SetPasswordInput) {
    return await ApiClient.post('/api/auth/set/password', setPasswordData);
  }

  static async verifyEmail(token: string) {
    return await ApiClient.get<VerifyEmailResponse>(`/api/auth/verify/email?token=${encodeURIComponent(token)}`);
  }

  static async checkPasswordResetStatus(token: string) {
    return await ApiClient.get<boolean>(`/api/auth/set/password/status?token=${encodeURIComponent(token)}`);
  }

  static async me() {
    return await ApiClient.get<AuthContextType>('/api/auth/me');
  }
}
