import api from './client';

export const authApi = {
  signup: async (data: any) => {
    const res = await api.post('/auth/signup', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  googleAuth: async (payload: any) => {
    const body = typeof payload === 'string' ? { token: payload } : payload;
    const res = await api.post('/auth/google', body);
    return res.data;
  },
  sendOtp: async (email: string, purpose: string = 'LOGIN') => {
    const res = await api.post('/auth/send-otp', { email, purpose });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string, purpose: string = 'LOGIN') => {
    const res = await api.post('/auth/verify-otp', { email, otp, purpose });
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data: any) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
};
