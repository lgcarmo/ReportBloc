export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  blocks: TemplateBlock[];
}

export interface TemplateBlock {
  id: number;
  template_id: number;
  title: string;
  content: string;
  order: number;
  block_type: string;
  page_break_before?: boolean;
}

export interface Proposal {
  id: number;
  proposal_number: string;
  title: string;
  client_name: string;
  template_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  status: string;
  blocks: ProposalBlock[];
}

export interface ProposalBlock {
  id: number;
  proposal_id: number;
  title: string;
  content: string;
  order: number;
  block_type: string;
  page_break_before?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface PDFConfig {
  id: number;
  company_name: string;
  company_logo_url?: string;
  header_text: string;
  header_image_url?: string;
  footer_text: string;
  footer_image_url?: string;
  show_page_numbers: boolean;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  paper_size: string;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  created_at: string;
  updated_at: string;
} 