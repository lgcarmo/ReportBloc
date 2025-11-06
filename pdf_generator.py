# coding=utf-8
import markdown
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import os
from datetime import datetime

class PDFGenerator:
    def __init__(self):
        self.css_styles = """
        @page {
            size: A4;
            margin: 2cm;
            @top-center {
                content: "Relatório de Pentest";
                font-size: 10pt;
                color: #666;
            }
            @bottom-center {
                content: "Página " counter(page) " de " counter(pages);
                font-size: 10pt;
                color: #666;
            }
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2em;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 1em;
        }
        
        .title {
            font-size: 2em;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 0.5em;
        }
        
        .subtitle {
            font-size: 1.2em;
            color: #666;
            margin-bottom: 1em;
        }
        
        .client-info {
            background-color: #f8fafc;
            padding: 1em;
            border-radius: 8px;
            margin-bottom: 2em;
            border-left: 4px solid #2563eb;
        }
        
        .client-name {
            font-weight: bold;
            color: #1e40af;
        }
        
        .date {
            color: #666;
            font-style: italic;
        }
        
        .block {
            margin-bottom: 2em;
            page-break-inside: avoid;
        }
        
        .block-title {
            font-size: 1.3em;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 1em;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5em;
        }
        
        .block-content {
            line-height: 1.8;
        }
        
        /* TABELAS MARKDOWN */
        .block-content table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            margin-bottom: 1.5em;
        }
        .block-content th, .block-content td {
            border: 2px solid #000;
            padding: 8px 12px;
            text-align: left;
            background-color: #fff;
        }
        .block-content th {
            background-color: #e0e7ff;
            color: #1e40af;
            font-weight: bold;
        }
        .block-content tr:nth-child(even) td {
            background-color: #f3f4f6;
        }
        
        .block-content h1, .block-content h2, .block-content h3 {
            color: #1e40af;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        
        .block-content h1 {
            font-size: 1.5em;
        }
        
        .block-content h2 {
            font-size: 1.3em;
        }
        
        .block-content h3 {
            font-size: 1.1em;
        }
        
        .block-content p {
            margin-bottom: 1em;
        }
        
        .block-content ul, .block-content ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }
        
        .block-content li {
            margin-bottom: 0.5em;
        }
        
        .block-content strong {
            color: #1e40af;
        }
        
        .block-content em {
            color: #666;
        }
        
        .block-content code {
            background-color: #f1f5f9;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        .block-content pre {
            background-color: #f1f5f9;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            margin-bottom: 1em;
        }
        
        .block-content blockquote {
            border-left: 4px solid #2563eb;
            padding-left: 1em;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }
        
        .footer {
            margin-top: 3em;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 1em;
        }
        
        /* Ajuste de imagens no PDF */
        img, .block-content img, .block-content table img {
            max-width: 100%;
            max-height: 12cm;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        
        .header-image {
            width: 100%;
            height: 1.8cm;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin: 0;
            padding: 0;
        }
        .header-image img {
            max-height: 100%;
            max-width: 100%;
            height: auto;
            width: auto;
            object-fit: contain;
            display: block;
            
        }
        """
    
    def process_placeholders(self, text, proposal_data):
        """
        Processa placeholders no texto
        
        Args:
            text: Texto com placeholders
            proposal_data: Dados do relatório
        
        Returns:
            str: Texto com placeholders substituídos
        """
        if not text:
            return text
        
        # Placeholders disponíveis (suporta chaves antigas para compatibilidade e novas de relatório)
        placeholders = {
            '{{PROPOSAL_NUMBER}}': proposal_data.get('proposal_number', ''),
            '{{PROPOSAL_TITLE}}': proposal_data.get('title', ''),
            '{{CLIENT_NAME}}': proposal_data.get('client_name', ''),
            '{{CURRENT_DATE}}': datetime.now().strftime('%d/%m/%Y'),
            '{{CURRENT_DATE_FULL}}': datetime.now().strftime('%d de %B de %Y'),
            '{{CURRENT_YEAR}}': datetime.now().strftime('%Y'),
            '{{CURRENT_MONTH}}': datetime.now().strftime('%m'),
            '{{CURRENT_DAY}}': datetime.now().strftime('%d'),
            '{{COMPANY_NAME}}': proposal_data.get('config', {}).get('company_name', 'Empresa'),
            # Novas chaves de relatório
            '{{REPORT_NUMBER}}': proposal_data.get('proposal_number', ''),
            '{{REPORT_TITLE}}': proposal_data.get('title', ''),
            '{{REPORT_CLIENT}}': proposal_data.get('client_name', ''),
        }
        
        # Substituir placeholders
        processed_text = text
        for placeholder, value in placeholders.items():
            processed_text = processed_text.replace(placeholder, str(value))
        
        return processed_text
    
    def generate_pdf(self, proposal_data):
        """
        Gera um PDF a partir dos dados do relatório
        
        Args:
            proposal_data: Dicionário com os dados do relatório
                - title: Título do relatório
                - client_name: Nome do cliente
                - blocks: Lista de blocos com title e content
                - created_at: Data de criação (opcional)
                - config: Configurações de PDF (opcional)
        
        Returns:
            bytes: Conteúdo do PDF
        """
        # Converter markdown para HTML
        html_content = self._generate_html(proposal_data)
        
        # Obter configurações
        config = proposal_data.get('config', {})
        
        # Gerar CSS personalizado
        css_styles = self._generate_css(config)
        
        # Configurar fontes
        font_config = FontConfiguration()
        
        # Gerar PDF
        html = HTML(string=html_content)
        css = CSS(string=css_styles, font_config=font_config)
        
        pdf_bytes = html.write_pdf(stylesheets=[css], font_config=font_config)
        
        return pdf_bytes
    
    def _generate_css(self, config):
        """Gera CSS personalizado baseado nas configurações"""
        company_name = config.get('company_name', 'Empresa')
        primary_color = config.get('primary_color', '#2563eb')
        secondary_color = config.get('secondary_color', '#1e40af')
        font_family = config.get('font_family', 'Helvetica')
        paper_size = config.get('paper_size', 'A4')
        margin_top = config.get('margin_top', 2.0)
        margin_bottom = config.get('margin_bottom', 2.0)
        margin_left = config.get('margin_left', 2.0)
        margin_right = config.get('margin_right', 2.0)
        show_page_numbers = config.get('show_page_numbers', True)
        
        # Reservar espaço para o header em todas as páginas
        header_height = 1.8  # em cm, ajuste conforme necessário
        css = f"""
        @page {{
            size: {paper_size};
            margin-top: {header_height + margin_top}cm;
            margin-right: {margin_right}cm;
            margin-bottom: {margin_bottom}cm;
            margin-left: {margin_left}cm;
            background: url('timbrado/timbrado.png') no-repeat center center;
            background-size: cover;
        """
        if show_page_numbers:
            css += f"""
            @top-center {{
                content: "{company_name}";
                font-size: 10pt;
                color: #666;
            }}
            @bottom-center {{
                content: "Página " counter(page) " de " counter(pages);
                font-size: 10pt;
                color: #666;
            }}
            """
        # Imagem do cabeçalho ocupa todo o espaço reservado, centralizada e ajustada
        header_image_url = config.get('header_image_url', '')
        if header_image_url:
            css += f"""
            """
        
        css += f"""
        }}
        
        body {{
            font-family: '{font_family}', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 2em;
            border-bottom: 2px solid {primary_color};
            padding-bottom: 1em;
        }}
        
        .title {{
            font-size: 2em;
            font-weight: bold;
            color: {primary_color};
            margin-bottom: 0.5em;
        }}
        
        .subtitle {{
            font-size: 1.2em;
            color: #666;
            margin-bottom: 1em;
        }}
        
        .client-info {{
            background-color: #f8fafc;
            padding: 1em;
            border-radius: 8px;
            margin-bottom: 2em;
            border-left: 4px solid {primary_color};
        }}
        
        .client-name {{
            font-weight: bold;
            color: {primary_color};
        }}
        
        .date {{
            color: #666;
            font-style: italic;
        }}
        
        .block {{
            margin-bottom: 2em;
            page-break-inside: avoid;
        }}
        
        .block-title {{
            font-size: 1.3em;
            font-weight: bold;
            color: {primary_color};
            margin-bottom: 1em;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5em;
        }}
        
        .block-content {{
            line-height: 1.8;
        }}
        
        .block-content h1, .block-content h2, .block-content h3 {{
            color: {primary_color};
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }}
        
        .block-content h1 {{
            font-size: 1.5em;
        }}
        
        .block-content h2 {{
            font-size: 1.3em;
        }}
        
        .block-content h3 {{
            font-size: 1.1em;
        }}
        
        .block-content p {{
            margin-bottom: 1em;
        }}
        
        .block-content ul, .block-content ol {{
            margin-bottom: 1em;
            padding-left: 2em;
        }}
        
        .block-content li {{
            margin-bottom: 0.5em;
        }}
        
        .block-content strong {{
            color: {primary_color};
        }}
        
        .block-content em {{
            color: #666;
        }}
        
        .block-content code {{
            background-color: #f1f5f9;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        
        .block-content pre {{
            background-color: #f1f5f9;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            margin-bottom: 1em;
        }}
        
        .block-content blockquote {{
            border-left: 4px solid {primary_color};
            padding-left: 1em;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }}
        
        .footer {{
            margin-top: 3em;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 1em;
        }}
        """
        
        css += """
        img, .block-content img, .block-content table img {
            max-width: 100%;
            max-height: 12cm;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        """
        
        css += """
        .block-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 2px solid #000 !important;
            margin-bottom: 1.5em !important;
        }
        .block-content th, .block-content td {
            border: 2px solid #000 !important;
            padding: 8px 12px !important;
            text-align: left !important;
            background-color: #fff !important;
        }
        .block-content th {
            background-color: #e0e7ff !important;
            color: #1e40af !important;
            font-weight: bold !important;
        }
        .block-content tr:nth-child(even) td {
            background-color: #f3f4f6 !important;
        }
        """
        
        css += """
        
        """
        
        # Garantir que a imagem do cabeçalho fique encostada no canto superior direito
        if header_image_url:
            css += f"""
            .header-image {{
                position: running(headerimg);
                display: block;
                height: {header_height}cm;
                width: auto;
            }}
            .header-image img {{
                max-height: 100%;
                width: auto; /* Mantém a proporção */
            }}
            @page {{
                @top-right {{
                    content: element(headerimg);
                    vertical-align: top;
                    padding: 0;
                    background: url('timbrado/timbrado.png') no-repeat center center;
                    background-size: cover;
                }}
            }}
            """
        
        return css
    
    def _generate_html(self, proposal_data):
        """Gera o HTML do relatório"""
        title = proposal_data.get('title', 'Relatório de Pentest')
        client_name = proposal_data.get('client_name', 'Cliente')
        blocks = proposal_data.get('blocks', [])
        created_at = proposal_data.get('created_at', datetime.now())
        config = proposal_data.get('config', {})
        
        # Configurações personalizadas
        company_name = config.get('company_name', 'Empresa')
        company_logo_url = config.get('company_logo_url', '')
        header_text = config.get('header_text', '')
        header_image_url = config.get('header_image_url', '')
        footer_text = config.get('footer_text', '')
        footer_image_url = config.get('footer_image_url', '')
        
        # Processar placeholders nos textos
        title = self.process_placeholders(title, proposal_data)
        client_name = self.process_placeholders(client_name, proposal_data)
        header_text = self.process_placeholders(header_text, proposal_data)
        footer_text = self.process_placeholders(footer_text, proposal_data)
        
        # Formatar data
        if isinstance(created_at, str):
            date_str = created_at
        else:
            date_str = created_at.strftime('%d/%m/%Y')
        
        # Gerar HTML dos blocos
        blocks_html = ''
        for block in blocks:
            block_title = block.get('title', '')
            block_content = block.get('content', '')
            page_break_before = block.get('page_break_before', False)
            
            # Processar placeholders nos blocos
            block_title = self.process_placeholders(block_title, proposal_data)
            block_content = self.process_placeholders(block_content, proposal_data)
            
            # Converter markdown para HTML
            content_html = markdown.markdown(block_content, extensions=['tables', 'fenced_code', 'codehilite'])
            
            # Adicionar page-break se necessário
            block_style = 'page-break-before: always;' if page_break_before else ''
            
            blocks_html += f"""
            <div class='block' style='{block_style}'>
                <div class='block-title'>{block_title}</div>
                <div class='block-content'>{content_html}</div>
            </div>
            """
        
        # Logo HTML (remover do header)
        logo_html = ''
        # Imagem do cabeçalho (apenas no topo, não dentro da div.header)
        header_image_html = ''
        if header_image_url:
            header_image_html = f'<div class="header-image"><img src="{header_image_url}" alt="Cabeçalho" /></div>'
        
        # Imagem do rodapé
        footer_image_html = ''
        if footer_image_url:
            footer_image_html = f'<img src="{footer_image_url}" alt="Rodapé" style="max-width: 100%; max-height: 80px; margin-top: 1em;" />'
        
        # HTML completo
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{title}</title>
        </head>
        <body>
            {header_image_html}
            <div class="header">
            </br></br></br></br>
            <h1 class="title">RELATÓRIO DE PENTEST</h1>

                </br></br></br></br></br></br></br></br></br></br></br>
                {header_text and f'<div class="header-text">{header_text}</div>' or ''}
            </div>
            
            <div class="client-info" style="text-align: right;">
                <div class="client-name">{client_name}</div>
                <div class="date">Data: {date_str}</div>
            </div>
            {blocks_html}
            <div class="footer">
                {footer_image_html}
                {footer_text and f'<p>{footer_text}</p>' or ''}
                <p>Este relatório foi gerado automaticamente pelo sistema de Relatórios de Pentest.</p>
                <p>Para mais informações, entre em contato conosco.</p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def save_pdf(self, proposal_data, filename):
        """
        Salva o PDF em um arquivo
        
        Args:
            proposal_data: Dados do relatório
            filename: Nome do arquivo para salvar
        
        Returns:
            str: Caminho do arquivo salvo
        """
        pdf_bytes = self.generate_pdf(proposal_data)
        
        with open(filename, 'wb') as f:
            f.write(pdf_bytes)
        
        return filename 