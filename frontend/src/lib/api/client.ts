import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const TOKEN_KEY = 'task_tracker_token';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiRequestConfig {
  url: string;
  method?: HttpMethod;
  params?: Record<string, unknown>;
  payload?: unknown;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export async function apiRequest<T>({
  url,
  method = 'GET',
  params,
  payload,
}: ApiRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>({
    url,
    method,
    params,
    data: payload,
  });

  if (response.data.data === undefined) {
    throw new Error('Invalid response from server');
  }

  return response.data.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      errors?: { field: string; message: string }[];
    }>;

    if (axiosError.response?.data?.errors?.length) {
      return axiosError.response.data.errors
        .map((item) => item.message)
        .join(', ');
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.message === 'Network Error') {
      return 'Unable to reach the server. Please check your connection.';
    }
  }

  return 'Something went wrong. Please try again.';
}

export default apiClient;
