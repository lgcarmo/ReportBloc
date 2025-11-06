import axios from 'axios';
import { LoginCredentials, Template, Proposal, PDFConfig, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Só redireciona se não estiver na tela de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Autenticação
export const authAPI = {
  login: (credentials: LoginCredentials) => 
    api.post('/api/login', credentials),
  
  logout: () => 
    api.post('/api/logout'),
  
  getCurrentUser: () => 
    api.get('/api/user'),
};

// Templates
export const templatesAPI = {
  getAll: () => 
    api.get<Template[]>('/api/templates'),
  
  getById: (id: number) => 
    api.get<Template>(`/api/templates/${id}`),
  
  create: (data: Partial<Template>) => 
    api.post<Template>('/api/templates', data),
  
  update: (id: number, data: Partial<Template>) => 
    api.put<Template>(`/api/templates/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/templates/${id}`),
  
  getExport: (id: number) => 
    api.get(`/api/templates/${id}/export`, { responseType: 'blob' }),
  
  importTemplate: (data: any) => 
    api.post('/api/templates/import', data),
};

// API legada (mantida para compatibilidade - usar reportsAPI)
export const proposalsAPI = {
  getAll: () => 
    api.get<Proposal[]>('/api/proposals'),
  
  getById: (id: number) => 
    api.get<Proposal>(`/api/proposals/${id}`),
  
  create: (data: Partial<Proposal>) => 
    api.post<Proposal>('/api/proposals', data),
  
  update: (id: number, data: Partial<Proposal>) => 
    api.put<Proposal>(`/api/proposals/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/proposals/${id}`),
  
  generatePDF: (id: number) => 
    api.get(`/api/proposals/${id}/pdf`, { responseType: 'blob' }),
  
  getTemplates: () => 
    api.get<Template[]>('/api/templates'),
  
  getNextNumber: () => 
    api.get<{ next_number: string }>('/api/proposals/next-number'),
};

// API de Relatórios (nova terminologia - recomendado)
export const reportsAPI = {
  getAll: () => 
    api.get<Proposal[]>('/api/reports'),
  
  getById: (id: number) => 
    api.get<Proposal>(`/api/reports/${id}`),
  
  // usa payload flexível (DTO) para criação/atualização
  create: (data: any) => 
    api.post('/api/reports', data),
  
  update: (id: number, data: any) => 
    api.put(`/api/reports/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/api/reports/${id}`),
  
  generatePDF: (id: number) => 
    api.get(`/api/reports/${id}/pdf`, { responseType: 'blob' }),
  
  getTemplates: () => 
    api.get<Template[]>('/api/templates'),
  
  getNextNumber: () => 
    api.get<{ next_number: string }>('/api/reports/next-number'),
};

// Markdown
export const markdownAPI = {
  render: (content: string) => 
    api.post('/api/markdown/render', { content }),
};

// Configurações de PDF
export const pdfConfigAPI = {
  get: () => 
    api.get<PDFConfig>('/api/pdf-config'),
  
  update: (data: Partial<PDFConfig>) => 
    api.put<PDFConfig>('/api/pdf-config', data),
};

// Imagens
export const imagesAPI = {
  list: (templateId: number) => api.get<string[]>(`/api/images?template_id=${templateId}`),
  upload: (formData: FormData, templateId: number) =>
    api.post(`/api/images/upload`, (() => { formData.append('template_id', String(templateId)); return formData; })(), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (filename: string, templateId: number) =>
    api.delete(`/api/images/${filename}?template_id=${templateId}`),
};

// Usuários
export const usersAPI = {
  list: () => api.get<User[]>('/api/users'),
  create: (data: { username: string; email: string; password?: string; role?: string; is_ldap?: boolean }) =>
    api.post('/api/users', data),
  update: (id: number, data: { email?: string; password?: string; role?: string; is_ldap?: boolean }) =>
    api.put(`/api/users/${id}`, data),
  delete: (id: number) => api.delete(`/api/users/${id}`),
};

// Blocos Favoritos
export interface BlockTemplate {
  id: number;
  user_id: number;
  name: string;
  title: string;
  content: string;
  block_type: string;
  page_break_before: boolean;
  created_at: string;
  updated_at: string;
}

export const blockTemplatesAPI = {
  getAll: () => 
    api.get<BlockTemplate[]>('/api/block-templates'),
  
  getById: (id: number) => 
    api.get<BlockTemplate>(`/api/block-templates/${id}`),
  
  create: (data: { name: string; title: string; content: string; block_type?: string; page_break_before?: boolean }) =>
    api.post<BlockTemplate>('/api/block-templates', data),
  
  update: (id: number, data: Partial<BlockTemplate>) =>
    api.put<BlockTemplate>(`/api/block-templates/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/api/block-templates/${id}`),
};

export default api; 