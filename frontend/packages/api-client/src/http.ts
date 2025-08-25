import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { v4 as uuid } from 'uuid';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const apiHttp = (cfg?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({ baseURL, ...cfg, withCredentials: true });

  instance.interceptors.request.use((config) => {
    if (config.method?.toUpperCase() === 'POST') {
      config.headers = config.headers ?? {};
      if (!config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = uuid();
      }
    }
    return config;
  });

  return instance;
};
