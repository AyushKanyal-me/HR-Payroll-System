import { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const token = sessionStorage.getItem('pp360_token') || localStorage.getItem('pp360_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...customHeaders,
    };
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : BASE_URL + endpoint;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(options.headers),
    };

    try {
      const response = await fetch(url, config);
      if (response.ok) {
        const data = await response.json();
        return data as ApiResponse<T>;
      }
      const errBody = await response.json().catch(() => null);
      if (errBody?.error?.message) {
        if (Array.isArray(errBody.error.details) && errBody.error.details.length > 0) {
          const detailMessages = errBody.error.details
            .map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`)
            .join('; ');
          throw new Error(detailMessages || errBody.error.message);
        }
        throw new Error(errBody.error.message);
      }
      if (errBody?.message) {
        throw new Error(errBody.message);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'}`);
    } catch (fetchErr: any) {
      // Always propagate real errors to callers
      throw fetchErr;
    }
  }

  get<T = any>(endpoint: string, params?: Record<string, any>) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export { BASE_URL };
