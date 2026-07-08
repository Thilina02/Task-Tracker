import { apiRequest, TOKEN_KEY } from './client';
import type {
  AuthData,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types/auth.types';

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthData> {
  return apiRequest<AuthData>({
    url: '/api/auth/register',
    method: 'POST',
    payload,
  });
}

export async function loginUser(payload: LoginPayload): Promise<AuthData> {
  return apiRequest<AuthData>({
    url: '/api/auth/login',
    method: 'POST',
    payload,
  });
}

export async function getCurrentUser(): Promise<User> {
  const result = await apiRequest<{ user: User }>({
    url: '/api/auth/me',
    method: 'GET',
  });

  return result.user;
}

export function persistAuthSession(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}
