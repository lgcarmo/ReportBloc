# coding=utf-8
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_file, send_from_directory, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import json
import markdown
from datetime import datetime
import ldap
from dotenv import load_dotenv
from flask_cors import CORS
from pdf_generator import PDFGenerator
import tempfile
import traceback

# Carregar variaveis de ambiente
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'sua-chave-secreta-aqui')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///reports.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

# Habilitar CORS para o React
CORS(app, supports_credentials=True)

# Configuracoes LDAP
LDAP_URL = os.getenv('LDAP_URL')
LDAP_BASE_DN = os.getenv('LDAP_BASE_DN')
LDAP_BIND_USER = os.getenv('LDAP_BIND_USER')
LDAP_BIND_PASSWORD = os.getenv('LDAP_BIND_PASSWORD')

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
# login_manager.login_view = 'login'  # Não usar em API REST

# Instância do gerador de PDF
pdf_generator = PDFGenerator()

UPLOAD_FOLDER = os.path.join('static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Handler para API REST: retorna 401 em vez de redirecionar
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'Não autenticado'}), 401

# Modelos do banco de dados
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  # DEPRECATED
    role = db.Column(db.String(20), default='viewer')  # admin, manager, viewer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Template(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    blocks = db.relationship('TemplateBlock', backref='template', lazy=True, order_by='TemplateBlock.order')

class TemplateBlock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('template.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, nullable=False)
    block_type = db.Column(db.String(20), default='text')  # text, table, image, etc.
    page_break_before = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "template_id": self.template_id,
            "title": self.title,
            "content": self.content,
            "order": self.order,
            "block_type": self.block_type,
            "page_break_before": self.page_break_before
        }

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_number = db.Column(db.String(20), unique=True, nullable=False)  # Número sequencial do relatório
    title = db.Column(db.String(200), nullable=False)
    client_name = db.Column(db.String(200), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('template.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = db.Column(db.String(20), default='draft')  # draft, sent, approved, rejected
    blocks = db.relationship('ReportBlock', backref='report', lazy=True, order_by='ReportBlock.order')
    deleted = db.Column(db.Boolean, default=False)  # Soft delete

class ReportBlock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('report.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, nullable=False)
    block_type = db.Column(db.String(20), default='text')
    page_break_before = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "report_id": self.report_id,
            "title": self.title,
            "content": self.content,
            "order": self.order,
            "block_type": self.block_type,
            "page_break_before": self.page_break_before
        }

class BlockTemplate(db.Model):
    """Modelo para armazenar blocos favoritos reutilizáveis"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # Nome do bloco favorito
    title = db.Column(db.String(100), nullable=False)  # Título padrão do bloco
    content = db.Column(db.Text, nullable=False)  # Conteúdo Markdown do bloco
    block_type = db.Column(db.String(20), default='text')
    page_break_before = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'title': self.title,
            'content': self.content,
            'block_type': self.block_type,
            'page_break_before': self.page_break_before,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class PDFConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(200), nullable=False, default='Empresa')
    company_logo_url = db.Column(db.String(500))
    header_text = db.Column(db.Text, default='')
    header_image_url = db.Column(db.String(500))
    footer_text = db.Column(db.Text, default='')
    footer_image_url = db.Column(db.String(500))
    show_page_numbers = db.Column(db.Boolean, default=True)
    primary_color = db.Column(db.String(7), default='#2563eb')  # Hex color
    secondary_color = db.Column(db.String(7), default='#1e40af')
    font_family = db.Column(db.String(50), default='Helvetica')
    paper_size = db.Column(db.String(10), default='A4')
    margin_top = db.Column(db.Float, default=2.0)  # cm
    margin_bottom = db.Column(db.Float, default=2.0)
    margin_left = db.Column(db.Float, default=2.0)
    margin_right = db.Column(db.Float, default=2.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_pdf_config_dict(self):
        return {
            'company_name': self.company_name,
            'company_logo_url': self.company_logo_url,
            'header_text': self.header_text,
            'header_image_url': self.header_image_url,
            'footer_text': self.footer_text,
            'footer_image_url': self.footer_image_url,
            'show_page_numbers': self.show_page_numbers,
            'primary_color': self.primary_color,
            'secondary_color': self.secondary_color,
            'font_family': self.font_family,
            'paper_size': self.paper_size,
            'margin_top': self.margin_top,
            'margin_bottom': self.margin_bottom,
            'margin_left': self.margin_left,
            'margin_right': self.margin_right,
        }


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

def authenticate_ldap(username, password):
    """Autenticação via LDAP"""
    if not all([LDAP_URL, LDAP_BASE_DN, LDAP_BIND_USER, LDAP_BIND_PASSWORD]):
        return False
    
    try:
        ldap_client = ldap.initialize(LDAP_URL)
        ldap_client.set_option(ldap.OPT_REFERRALS, 0)
        ldap_client.simple_bind_s(LDAP_BIND_USER, LDAP_BIND_PASSWORD)
        
        # Buscar usuário
        search_filter = f"(uid={username})"
        result = ldap_client.search_s(LDAP_BASE_DN, ldap.SCOPE_SUBTREE, search_filter)
        
        if result:
            user_dn = result[0][0]
            # Tentar autenticar com as credenciais fornecidas
            ldap_client.simple_bind_s(user_dn, password)
            return True
    except Exception as e:
        print(f"Erro LDAP: {e}")
        return False
    
    return False

# Rotas da API para o React
@app.route('/api/user', methods=['GET'])
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'role': getattr(current_user, 'role', 'viewer'),
            'is_admin': getattr(current_user, 'role', 'viewer') == 'admin',
        })
    return jsonify({'error': 'Não autenticado'}), 401

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Primeiro, tentar autenticação local
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'viewer'),
                'is_admin': getattr(user, 'role', 'viewer') == 'admin',
            },
            'token': 'dummy-token'  # Em produção, usar JWT
        })
    
    # Se não encontrar usuário local, tentar LDAP
    if authenticate_ldap(username, password):
        # Criar usuário local se não existir
        user = User.query.filter_by(username=username).first()
        if not user:
            user = User(username=username, email=f"{username}@empresa.com", role='viewer')
            user.set_password(password)  # Hash da senha LDAP
            db.session.add(user)
            db.session.commit()
        
        login_user(user)
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'viewer'),
                'is_admin': getattr(user, 'role', 'viewer') == 'admin',
            },
            'token': 'dummy-token'
        })
    
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    logout_user()
    return jsonify({'success': True})

# APIs para Templates
@app.route('/api/templates', methods=['GET'])
@login_required
def api_get_templates():
    templates = Template.query.all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'description': t.description,
        'created_by': t.created_by,
        'created_at': t.created_at.isoformat(),
        'blocks': [{
            'id': b.id,
            'title': b.title,
            'content': b.content,
            'order': b.order,
            'block_type': b.block_type,
            'page_break_before': getattr(b, 'page_break_before', False)
        } for b in t.blocks]
    } for t in templates])

@app.route('/api/templates/<int:template_id>', methods=['GET'])
@login_required
def api_get_template(template_id):
    template = Template.query.get_or_404(template_id)
    return jsonify({
        'id': template.id,
        'name': template.name,
        'description': template.description,
        'created_by': template.created_by,
        'created_at': template.created_at.isoformat(),
        'blocks': [{
            'id': b.id,
            'title': b.title,
            'content': b.content,
            'order': b.order,
            'block_type': b.block_type,
            'page_break_before': getattr(b, 'page_break_before', False)
        } for b in template.blocks]
    })

@app.route('/api/templates', methods=['POST'])
@login_required
def api_create_template():
    data = request.get_json()
    template = Template(
        name=data['name'],
        description=data.get('description', ''),
        created_by=current_user.id
    )
    db.session.add(template)
    db.session.commit()
    
    # Adicionar blocos
    for i, block in enumerate(data.get('blocks', [])):
        template_block = TemplateBlock(
            template_id=template.id,
            title=block['title'],
            content=block['content'],
            order=i,
            block_type=block.get('type', 'text'),
            page_break_before=block.get('page_break_before', False)
        )
        db.session.add(template_block)
    
    db.session.commit()
    return jsonify({'success': True, 'template_id': template.id})

@app.route('/api/templates/<int:template_id>', methods=['PUT'])
@login_required
def api_update_template(template_id):
    data = request.get_json()
    template = Template.query.get_or_404(template_id)
    template.name = data['name']
    template.description = data.get('description', '')

    # Remove blocos antigos
    TemplateBlock.query.filter_by(template_id=template.id).delete()
    db.session.commit()

    # Adiciona blocos novos
    for i, block in enumerate(data.get('blocks', [])):
        template_block = TemplateBlock(
            template_id=template.id,
            title=block['title'],
            content=block['content'],
            order=i,
            block_type=block.get('type', 'text'),
            page_break_before=block.get('page_break_before', False)
        )
        db.session.add(template_block)
    db.session.commit()
    return jsonify({'success': True, 'template_id': template.id})

@app.route('/api/templates/<int:template_id>', methods=['DELETE'])
@login_required
def api_delete_template(template_id):
    template = Template.query.get_or_404(template_id)
    
    # Remove blocos do template
    TemplateBlock.query.filter_by(template_id=template.id).delete()
    
    # Remove o template
    db.session.delete(template)
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/templates/<int:template_id>/export', methods=['GET'])
@login_required
def api_export_template(template_id):
    template = Template.query.get_or_404(template_id)
    blocks = TemplateBlock.query.filter_by(template_id=template.id).order_by(TemplateBlock.order).all()
    template_data = {
        'name': template.name,
        'description': template.description,
        'blocks': [
            {
                'title': b.title,
                'content': b.content,
                'order': b.order,
                'block_type': b.block_type,
                'page_break_before': getattr(b, 'page_break_before', False)
            } for b in blocks
        ]
    }
    from flask import Response
    import json
    return Response(
        json.dumps(template_data, ensure_ascii=False, indent=2),
        mimetype='application/json',
        headers={
            'Content-Disposition': f'attachment;filename=template_{template.id}.json'
        }
    )

@app.route('/api/templates/import', methods=['POST'])
@login_required
def api_import_template():
    import json
    data = request.get_json()
    if not data or 'name' not in data or 'blocks' not in data:
        return jsonify({'error': 'Arquivo inválido'}), 400
    template = Template(
        name=data['name'],
        description=data.get('description', ''),
        created_by=current_user.id
    )
    db.session.add(template)
    db.session.commit()
    for i, block in enumerate(data['blocks']):
        template_block = TemplateBlock(
            template_id=template.id,
            title=block.get('title', ''),
            content=block.get('content', ''),
            order=i,
            block_type=block.get('block_type', 'text'),
            page_break_before=block.get('page_break_before', False)
        )
        db.session.add(template_block)
    db.session.commit()
    return jsonify({'success': True, 'template_id': template.id})

# APIs para Relatórios
@app.route('/api/proposals', methods=['GET'])
@login_required
def api_get_proposals():
    reports = Report.query.filter_by(deleted=False).order_by(Report.created_at.desc()).all()
    return jsonify([{
        'id': r.id,
        'proposal_number': r.report_number,  # Mantém compatibilidade com frontend antigo
        'report_number': r.report_number,
        'title': r.title,
        'client_name': r.client_name,
        'template_id': r.template_id,
        'created_by': r.created_by,
        'created_at': r.created_at.isoformat(),
        'updated_at': r.updated_at.isoformat(),
        'status': r.status,
        'blocks': [{
            'id': b.id,
            'title': b.title,
            'content': b.content,
            'order': b.order,
            'block_type': b.block_type,
            'page_break_before': getattr(b, 'page_break_before', False)
        } for b in r.blocks]
    } for r in reports])

@app.route('/api/proposals/<int:proposal_id>', methods=['GET'])
@login_required
def api_get_proposal(proposal_id):
    report = Report.query.get_or_404(proposal_id)
    return jsonify({
        'id': report.id,
        'proposal_number': report.report_number,  # Mantém compatibilidade
        'report_number': report.report_number,
        'title': report.title,
        'client_name': report.client_name,
        'template_id': report.template_id,
        'created_by': report.created_by,
        'created_at': report.created_at.isoformat(),
        'updated_at': report.updated_at.isoformat(),
        'status': report.status,
        'blocks': [{
            'id': b.id,
            'title': b.title,
            'content': b.content,
            'order': b.order,
            'block_type': b.block_type,
            'page_break_before': getattr(b, 'page_break_before', False)
        } for b in report.blocks]
    })

@app.route('/api/proposals', methods=['POST'])
@login_required
def api_create_proposal():
    data = request.get_json()
    
    # Usar número fornecido ou gerar automaticamente
    report_number = data.get('proposal_number') or data.get('report_number') or generate_report_number()
    
    report = Report(
        report_number=report_number,
        title=data['title'],
        client_name=data['client_name'],
        template_id=data.get('template_id'),
        created_by=current_user.id
    )
    db.session.add(report)
    db.session.commit()
    
    # Copiar blocos do template se especificado
    if data.get('template_id'):
        template_blocks = TemplateBlock.query.filter_by(template_id=data['template_id']).order_by(TemplateBlock.order).all()
        
        for i, template_block in enumerate(template_blocks):
            report_block = ReportBlock(
                report_id=report.id,
                title=template_block.title,
                content=template_block.content,
                order=i,
                block_type=template_block.block_type,
                page_break_before=template_block.page_break_before
            )
            db.session.add(report_block)
    
    db.session.commit()
    return jsonify({'success': True, 'proposal_id': report.id, 'report_id': report.id})

# API para renderizar markdown
@app.route('/api/markdown/render', methods=['POST'])
@login_required
def api_render_markdown():
    data = request.get_json()
    html = markdown.markdown(data['content'])
    return jsonify({'html': html})

# APIs para configurações de PDF
@app.route('/api/pdf-config', methods=['GET'])
@login_required
def api_get_pdf_config():
    config = PDFConfig.query.filter_by(user_id=current_user.id).first()
    if not config:
        # Criar configuração padrão
        config = PDFConfig(user_id=current_user.id)
        db.session.add(config)
        db.session.commit()
    
    return jsonify({
        'id': config.id,
        'company_name': config.company_name,
        'company_logo_url': config.company_logo_url,
        'header_text': config.header_text,
        'header_image_url': config.header_image_url,
        'footer_text': config.footer_text,
        'footer_image_url': config.footer_image_url,
        'show_page_numbers': config.show_page_numbers,
        'primary_color': config.primary_color,
        'secondary_color': config.secondary_color,
        'font_family': config.font_family,
        'paper_size': config.paper_size,
        'margin_top': config.margin_top,
        'margin_bottom': config.margin_bottom,
        'margin_left': config.margin_left,
        'margin_right': config.margin_right,
        'created_at': config.created_at.isoformat(),
        'updated_at': config.updated_at.isoformat()
    })

@app.route('/api/pdf-config', methods=['PUT'])
@login_required
def api_update_pdf_config():
    data = request.get_json()
    config = PDFConfig.query.filter_by(user_id=current_user.id).first()
    
    if not config:
        config = PDFConfig(user_id=current_user.id)
        db.session.add(config)
    
    # Atualizar campos
    config.company_name = data.get('company_name', config.company_name)
    config.company_logo_url = data.get('company_logo_url', config.company_logo_url)
    config.header_text = data.get('header_text', config.header_text)
    config.header_image_url = data.get('header_image_url', config.header_image_url)
    config.footer_text = data.get('footer_text', config.footer_text)
    config.footer_image_url = data.get('footer_image_url', config.footer_image_url)
    config.show_page_numbers = data.get('show_page_numbers', config.show_page_numbers)
    config.primary_color = data.get('primary_color', config.primary_color)
    config.secondary_color = data.get('secondary_color', config.secondary_color)
    config.font_family = data.get('font_family', config.font_family)
    config.paper_size = data.get('paper_size', config.paper_size)
    config.margin_top = data.get('margin_top', config.margin_top)
    config.margin_bottom = data.get('margin_bottom', config.margin_bottom)
    config.margin_left = data.get('margin_left', config.margin_left)
    config.margin_right = data.get('margin_right', config.margin_right)
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Configurações salvas com sucesso'})

# API para gerar PDF (Relatórios)
@app.route('/api/proposals/<int:proposal_id>/pdf', methods=['GET'])
@login_required
def api_generate_pdf(proposal_id):
    try:
        # Buscar relatório
        report = Report.query.get_or_404(proposal_id)
        
        # Buscar configurações de PDF do usuário
        pdf_config = PDFConfig.query.filter_by(user_id=current_user.id).first()
        if not pdf_config:
            pdf_config = PDFConfig(user_id=current_user.id)
            db.session.add(pdf_config)
            db.session.commit()
        
        # Preparar dados para o PDF
        report_data = {
            'id': report.id,
            'proposal_number': report.report_number,  # Mantém compatibilidade
            'report_number': report.report_number,
            'title': report.title,
            'client_name': report.client_name,
            'created_at': report.created_at,
            'blocks': [{
                'title': block.title,
                'content': block.content,
                'page_break_before': getattr(block, 'page_break_before', False)
            } for block in report.blocks],
            'config': {
                'company_name': pdf_config.company_name,
                'company_logo_url': pdf_config.company_logo_url,
                'header_text': pdf_config.header_text,
                'header_image_url': pdf_config.header_image_url,
                'footer_text': pdf_config.footer_text,
                'footer_image_url': pdf_config.footer_image_url,
                'show_page_numbers': pdf_config.show_page_numbers,
                'primary_color': pdf_config.primary_color,
                'secondary_color': pdf_config.secondary_color,
                'font_family': pdf_config.font_family,
                'paper_size': pdf_config.paper_size,
                'margin_top': pdf_config.margin_top,
                'margin_bottom': pdf_config.margin_bottom,
                'margin_left': pdf_config.margin_left,
                'margin_right': pdf_config.margin_right,
            }
        }
        
        # Gerar PDF
        pdf_bytes = pdf_generator.generate_pdf(report_data)
        
        # Criar arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(pdf_bytes)
            tmp_file_path = tmp_file.name
        
        # Nome do arquivo para download
        filename = f"relatorio_{report.title.replace(' ', '_')}_{report.client_name.replace(' ', '_')}.pdf"
        
        return send_file(
            tmp_file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar PDF: {str(e)}'}), 500

@app.route('/api/proposals/<int:proposal_id>/number', methods=['PUT'])
@login_required
def api_update_proposal_number(proposal_id):
    report = Report.query.get_or_404(proposal_id)
    
    # Verificar se o usuário é o criador do relatório
    if report.created_by != current_user.id:
        return jsonify({'error': 'Acesso negado'}), 403
    
    data = request.get_json()
    new_number = data.get('proposal_number') or data.get('report_number')
    
    if not new_number:
        return jsonify({'error': 'Número do relatório é obrigatório'}), 400
    
    # Verificar se o número já existe
    existing_report = Report.query.filter_by(report_number=new_number).first()
    if existing_report and existing_report.id != proposal_id:
        return jsonify({'error': 'Este número de relatório já existe'}), 400
    
    report.report_number = new_number
    db.session.commit()
    
    return jsonify({'success': True, 'proposal_number': new_number, 'report_number': new_number})

def generate_report_number():
    """Gera o próximo número sequencial de relatório"""
    # Busca pelo relatório com o maior número (ordenando numericamente)
    last_report = Report.query.order_by(Report.report_number.cast(db.Integer).desc()).first()
    
    print(f"Último relatório encontrado: {last_report.report_number if last_report else 'Nenhum'}")
    
    if not last_report:
        # Primeiro relatório - começar em 4002506
        print("Primeiro relatório - retornando 4002506")
        return "4002506"
    
    # Extrair número do último relatório
    try:
        last_number = int(last_report.report_number)
        next_number = last_number + 1
        print(f"Último número: {last_number}, Próximo número: {next_number}")
    except (ValueError, IndexError):
        # Se não conseguir extrair, começar do 4002506
        print("Erro ao extrair número - retornando 4002506")
        next_number = 4002506
    
    # Retornar como string
    return str(next_number)

@app.route('/api/proposals/next-number', methods=['GET'])
@login_required
def api_get_next_proposal_number():
    """Retorna o próximo número de relatório disponível"""
    try:
        next_number = generate_report_number()
        return jsonify({'next_number': next_number})
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar número: {str(e)}'}), 500

@app.route('/api/proposals/<int:proposal_id>', methods=['PUT'])
@login_required
def api_update_proposal(proposal_id):
    try:
        report = Report.query.get_or_404(proposal_id)
        
        # Verificar se o usuário é o criador do relatório
        if report.created_by != current_user.id:
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Atualizar campos básicos
        if data.get('title'):
            report.title = data['title']
        if data.get('client_name'):
            report.client_name = data['client_name']
        if data.get('proposal_number') or data.get('report_number'):
            report.report_number = data.get('report_number') or data.get('proposal_number')
        
        # Atualizar blocos
        if data.get('blocks'):
            # Remover blocos existentes
            ReportBlock.query.filter_by(report_id=report.id).delete()
            
            # Adicionar novos blocos
            for i, block_data in enumerate(data['blocks']):
                report_block = ReportBlock(
                    report_id=report.id,
                    title=block_data.get('title', ''),
                    content=block_data.get('content', ''),
                    order=i,
                    block_type=block_data.get('block_type', 'text'),
                    page_break_before=block_data.get('page_break_before', False)
                )
                db.session.add(report_block)
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Relatório atualizado com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar relatório: {str(e)}")
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@app.route('/api/proposals/debug-numbers', methods=['GET'])
@login_required
def api_debug_proposal_numbers():
    """Rota de debug para verificar números de relatório existentes"""
    try:
        reports = Report.query.order_by(Report.report_number.cast(db.Integer).desc()).all()
        numbers = [r.report_number for r in reports]
        return jsonify({
            'total_reports': len(reports),
            'numbers': numbers,
            'next_number': generate_report_number()
        })
    except Exception as e:
        return jsonify({'error': f'Erro: {str(e)}'}), 500

@app.route('/api/proposals/<int:proposal_id>', methods=['DELETE'])
@login_required
def api_delete_proposal(proposal_id):
    report = Report.query.get_or_404(proposal_id)
    if report.created_by != current_user.id and not current_user.role == 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    report.deleted = True
    db.session.commit()
    return jsonify({'success': True})

# --- Aliases de rotas para Relatórios (mantém compatibilidade e facilita migração) ---

@app.route('/api/reports', methods=['GET'])
@login_required
def api_get_reports():
    return api_get_proposals()

@app.route('/api/reports/<int:report_id>', methods=['GET'])
@login_required
def api_get_report(report_id):
    return api_get_proposal(report_id)

@app.route('/api/reports', methods=['POST'])
@login_required
def api_create_report():
    return api_create_proposal()

@app.route('/api/reports/<int:report_id>', methods=['PUT'])
@login_required
def api_update_report(report_id):
    return api_update_proposal(report_id)

@app.route('/api/reports/<int:report_id>', methods=['DELETE'])
@login_required
def api_delete_report(report_id):
    return api_delete_proposal(report_id)

@app.route('/api/reports/next-number', methods=['GET'])
@login_required
def api_get_next_report_number():
    return api_get_next_proposal_number()

@app.route('/api/reports/<int:report_id>/pdf', methods=['GET'])
@login_required
def api_generate_report_pdf(report_id):
    return api_generate_pdf(report_id)


@app.route('/api/images/upload', methods=['POST'])
@login_required
def api_upload_image():
    template_id = request.form.get('template_id')
    if not template_id:
        return jsonify({'error': 'template_id é obrigatório'}), 400

    if 'image' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Nome de arquivo vazio'}), 400

    # Pasta do template
    template_folder = os.path.join(UPLOAD_FOLDER, f'template_{template_id}')
    os.makedirs(template_folder, exist_ok=True)

    filename = file.filename
    save_path = os.path.join(template_folder, filename)
    # Evitar sobrescrever arquivos
    base, ext = os.path.splitext(filename)
    i = 1
    while os.path.exists(save_path):
        filename = f"{base}_{i}{ext}"
        save_path = os.path.join(template_folder, filename)
        i += 1
    file.save(save_path)
    url = f"/static/uploads/template_{template_id}/{filename}"
    return jsonify({'success': True, 'url': url, 'filename': filename})

@app.route('/api/images', methods=['GET'])
@login_required
def api_list_images():
    template_id = request.args.get('template_id')
    if not template_id:
        return jsonify({'error': 'template_id é obrigatório'}), 400
    template_folder = os.path.join(UPLOAD_FOLDER, f'template_{template_id}')
    if not os.path.exists(template_folder):
        return jsonify({'images': []})
    files = os.listdir(template_folder)
    urls = [f"/static/uploads/template_{template_id}/{f}" for f in files if not f.startswith('.')]
    return jsonify({'images': urls})

@app.route('/static/uploads/<path:filename>')
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/images/<filename>', methods=['DELETE'])
@login_required
def api_delete_image(filename):
    template_id = request.args.get('template_id')
    if not template_id:
        return jsonify({'error': 'template_id é obrigatório'}), 400
    template_folder = os.path.join(UPLOAD_FOLDER, f'template_{template_id}')
    file_path = os.path.join(template_folder, filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'Arquivo não encontrado'}), 404
    try:
        os.remove(file_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- ADMINISTRAÇÃO DE USUÁRIOS (apenas admin) ---

@app.route('/api/users', methods=['GET'])
@login_required
def api_list_users():
    if not current_user.role == 'admin':
        return abort(403)
    users = User.query.all()
    return jsonify([
        {
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': getattr(u, 'role', 'viewer'),
            'is_admin': getattr(u, 'role', 'viewer') == 'admin',
            'created_at': u.created_at.isoformat()
        } for u in users
    ])

@app.route('/api/users', methods=['POST'])
@login_required
def api_create_user():
    if not current_user.role == 'admin':
        return abort(403)
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'viewer')
    is_ldap = data.get('is_ldap', False)
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Nome de usuário já existe'}), 400
    user = User(username=username, email=email, role=role)
    if not is_ldap:
        if not password:
            return jsonify({'error': 'Senha obrigatória para usuário local'}), 400
        user.set_password(password)
    else:
        user.password_hash = ''
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'user_id': user.id})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
def api_update_user(user_id):
    if not current_user.role == 'admin':
        return abort(403)
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    user.email = data.get('email', user.email)
    user.role = data.get('role', user.role)
    if not data.get('is_ldap', False) and data.get('password'):
        user.set_password(data['password'])
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
def api_delete_user(user_id):
    if not current_user.role == 'admin':
        return abort(403)
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/admin/clear-database', methods=['POST'])
@login_required
def api_clear_database():
    """Limpa todo o banco de dados (apenas admin)"""
    if not current_user.role == 'admin':
        return abort(403)
    
    try:
        # Deletar todos os dados (exceto usuários)
        ReportBlock.query.delete()
        Report.query.delete()
        TemplateBlock.query.delete()
        Template.query.delete()
        PDFConfig.query.delete()
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Banco de dados limpo com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao limpar banco: {str(e)}'}), 500

@app.route('/api/ldap-config', methods=['GET'])
@login_required
def api_get_ldap_config():
    if not current_user.role == 'admin':
        return abort(403)
    return jsonify({
        'enabled': os.getenv('LDAP_ENABLED', 'false').lower() == 'true',
        'name': os.getenv('LDAP_NAME', ''),
        'server': os.getenv('LDAP_SERVER', ''),
        'port': os.getenv('LDAP_PORT', '389'),
        'username': os.getenv('LDAP_USERNAME', ''),
        'password': os.getenv('LDAP_PASSWORD', ''),
        'base': os.getenv('LDAP_BASE', ''),
        'login_attr': os.getenv('LDAP_LOGIN_ATTR', 'sAMAccountName'),
        'name_attr': os.getenv('LDAP_NAME_ATTR', 'cn'),
        'email_attr': os.getenv('LDAP_EMAIL_ATTR', 'mail'),
        'use_ssl': os.getenv('LDAP_USE_SSL', 'false').lower() == 'true',
        'follow_referrals': os.getenv('LDAP_FOLLOW_REFERRALS', 'false').lower() == 'true',
    })

@app.route('/api/ldap-config/test', methods=['POST'])
@login_required
def api_test_ldap_config():
    if not current_user.role == 'admin':
        return abort(403)
    data = request.get_json()
    import ldap
    try:
        server = data.get('server')
        port = int(data.get('port', 389))
        use_ssl = data.get('use_ssl', False)
        ldap_url = f"ldap{'s' if use_ssl else ''}://{server}:{port}"
        username = data.get('username')
        password = data.get('password')
        follow_referrals = data.get('follow_referrals', False)
        ldap_client = ldap.initialize(ldap_url)
        ldap_client.set_option(ldap.OPT_REFERRALS, int(follow_referrals))
        ldap_client.simple_bind_s(username, password)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/ldap-config', methods=['PUT'])
@login_required
def api_update_ldap_config():
    if not current_user.role == 'admin':
        return abort(403)
    data = request.get_json()
    import json
    with open('ldap_config.json', 'w') as f:
        json.dump(data, f, indent=2)
    return jsonify({'success': True})

# APIs para Blocos Favoritos
@app.route('/api/block-templates', methods=['GET'])
@login_required
def api_get_block_templates():
    """Lista todos os blocos favoritos do usuário"""
    block_templates = BlockTemplate.query.filter_by(user_id=current_user.id).order_by(BlockTemplate.created_at.desc()).all()
    return jsonify([bt.to_dict() for bt in block_templates])

@app.route('/api/block-templates/<int:template_id>', methods=['GET'])
@login_required
def api_get_block_template(template_id):
    """Obtém um bloco favorito específico"""
    block_template = BlockTemplate.query.get_or_404(template_id)
    if block_template.user_id != current_user.id:
        return abort(403)
    return jsonify(block_template.to_dict())

@app.route('/api/block-templates', methods=['POST'])
@login_required
def api_create_block_template():
    """Cria um novo bloco favorito"""
    data = request.get_json()
    block_template = BlockTemplate(
        user_id=current_user.id,
        name=data.get('name', 'Bloco sem nome'),
        title=data.get('title', ''),
        content=data.get('content', ''),
        block_type=data.get('block_type', 'text'),
        page_break_before=data.get('page_break_before', False)
    )
    db.session.add(block_template)
    db.session.commit()
    return jsonify({'success': True, 'block_template': block_template.to_dict()})

@app.route('/api/block-templates/<int:template_id>', methods=['PUT'])
@login_required
def api_update_block_template(template_id):
    """Atualiza um bloco favorito"""
    block_template = BlockTemplate.query.get_or_404(template_id)
    if block_template.user_id != current_user.id:
        return abort(403)
    
    data = request.get_json()
    if 'name' in data:
        block_template.name = data['name']
    if 'title' in data:
        block_template.title = data['title']
    if 'content' in data:
        block_template.content = data['content']
    if 'block_type' in data:
        block_template.block_type = data['block_type']
    if 'page_break_before' in data:
        block_template.page_break_before = data['page_break_before']
    
    block_template.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True, 'block_template': block_template.to_dict()})

@app.route('/api/block-templates/<int:template_id>', methods=['DELETE'])
@login_required
def api_delete_block_template(template_id):
    """Deleta um bloco favorito"""
    block_template = BlockTemplate.query.get_or_404(template_id)
    if block_template.user_id != current_user.id:
        return abort(403)
    db.session.delete(block_template)
    db.session.commit()
    return jsonify({'success': True})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Criar usuário admin padrão se não existir
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(username='admin', email='admin@empresa.com', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
    
    app.run(debug=True, port=5001) 