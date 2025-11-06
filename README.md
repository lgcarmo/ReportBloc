# ReportBloc

Sistema web completo para criação e gerenciamento de relatórios de pentest com templates modulares, blocos favoritos reutilizáveis e geração de PDFs profissionais.

## 🚀 Funcionalidades

### 🔐 Autenticação
- Login com credenciais locais (hash bcrypt)
- Sistema de registro de usuários com diferentes níveis de acesso (admin, manager, viewer)
- Controle de sessão seguro

### 📦 Templates
- Criação de templates modulares reutilizáveis
- Blocos editáveis em Markdown com pré-visualização em tempo real
- Drag-and-drop para reordenação de blocos
- Editor visual intuitivo com suporte a placeholders dinâmicos
- Galeria de imagens por template

### 📃 Relatórios
- Criação de relatórios a partir de templates ou do zero
- Edição livre do conteúdo dos blocos (Markdown)
- Visualização final formatada
- Geração de PDFs profissionais com configurações personalizáveis
- Numeração sequencial automática de relatórios

### ⭐ Blocos Favoritos
- Salve blocos como favoritos para reutilização rápida
- Gerencie seus blocos favoritos em uma página dedicada
- Selecione entre bloco vazio ou favorito ao adicionar novos blocos
- Edite e remova blocos favoritos facilmente

### 🎨 Interface
- Modo escuro/claro
- Interface responsiva e moderna
- Navegação intuitiva

## 🛠️ Tecnologias

### Backend
- **Python 3.8+** com Flask
- **SQLite** (configurável para PostgreSQL)
- **Autenticação**: bcrypt
- **Markdown**: python-markdown
- **PDF**: WeasyPrint para geração de PDFs

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **@hello-pangea/dnd** para drag-and-drop
- **Axios** para requisições HTTP
- **Lucide React** para ícones
- **@uiw/react-md-editor** para edição Markdown

## 📋 Pré-requisitos

- **Python 3.8+** (recomendado 3.9 ou superior)
- **Node.js 16+** (recomendado 18 ou superior)
- **npm** ou **yarn**
- **pip** (geralmente incluído com Python)

## 🔧 Instalação

### Método Rápido (Recomendado - Linux/Mac)

O script `setup.sh` automatiza toda a instalação:

```bash
# Clone o repositório
git clone https://github.com/lgcarmo/ReportBloc
cd ReportBloc

# Execute o script de instalação
chmod +x setup.sh
./setup.sh
```

O script irá:
- ✅ Verificar pré-requisitos (Python 3.8+, Node.js 16+)
- ✅ Criar ambiente virtual Python
- ✅ Instalar todas as dependências (Python e Node.js)
- ✅ Criar arquivo `.env` com SECRET_KEY gerada automaticamente
- ✅ Configurar Tailwind CSS
- ✅ Inicializar banco de dados e criar usuário admin padrão

Após a instalação, inicie o sistema com:

```bash
./start.sh
```

Isso iniciará backend e frontend automaticamente. Acesse `http://localhost:3000` no navegador.

**Credenciais padrão:**
- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha do admin após o primeiro login!

---

### Instalação Manual (Alternativa)

Se preferir instalar manualmente ou estiver no Windows:

#### 1. Clone o repositório

```bash
git clone https://github.com/lgcarmo/ReportBloc
cd ReportBloc
```

#### 2. Configurar Backend (Python/Flask)

**Criar ambiente virtual Python**

```bash
# Linux/Mac
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

**Instalar dependências Python**

**⚠️ Windows - Requisito para WeasyPrint**: 
O WeasyPrint requer o GTK Runtime no Windows. Antes de instalar as dependências Python, baixe e instale:

1. Baixe o **GTK-for-Windows-Runtime-Environment-Installer** de: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases
2. Execute o instalador
3. Reinicie o terminal/PowerShell
4. Depois instale as dependências:

```bash
pip install -r requirements.txt
```

**Linux/macOS**: Pode prosseguir diretamente com a instalação das dependências.

**Configurar variáveis de ambiente**

```bash
cp config_example.env .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Gere uma chave secreta única e segura!
SECRET_KEY=sua-chave-secreta-muito-segura-aqui

# Banco de dados (SQLite por padrão)
DATABASE_URL=sqlite:///reports.db

# Para PostgreSQL (opcional)
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/reports
```

**⚠️ IMPORTANTE**: Gere uma `SECRET_KEY` única e segura! Você pode usar:

```python
import secrets
print(secrets.token_hex(32))
```

#### 3. Configurar Frontend (React)

**Instalar dependências Node.js**

```bash
npm install
```

**Configurar Tailwind CSS**

O Tailwind já está configurado, mas se necessário:

```bash
npx tailwindcss init -p
```

#### 4. Inicializar o banco de dados

Na primeira execução, o banco de dados será criado automaticamente com um usuário administrador padrão:

- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha do admin após o primeiro login!

## 🚀 Executando o Sistema

### Método Rápido (Linux/Mac)

Use o script `start.sh` para iniciar backend e frontend em paralelo:

```bash
./start.sh
```

O script iniciará ambos os serviços e você poderá acessar:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5001`

Pressione `Ctrl+C` para encerrar ambos os serviços.

### Modo Desenvolvimento Manual

#### Terminal 1 - Backend

```bash
# Ativar ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Executar Flask
python app.py
```

O backend estará disponível em: `http://localhost:5001`

#### Terminal 2 - Frontend

```bash
npm start
```

O frontend estará disponível em: `http://localhost:3000`

### Modo Produção

#### Build do Frontend

```bash
npm run build
```

Isso criará uma pasta `build/` com os arquivos otimizados.

#### Executar Backend em Produção

```bash
# Instalar Gunicorn
pip install gunicorn

# Executar
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Servir Frontend

Você pode servir a pasta `build/` com:

- **Nginx**:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        root /caminho/para/ReportBloc/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- **Apache**: Configure um VirtualHost apontando para a pasta `build/`

- **Node.js** (serve): `npx serve -s build`

## 📖 Guia de Uso

### 1. Primeiro Acesso

1. Acesse `http://localhost:3000`
2. Faça login com:
   - Usuário: `admin`
   - Senha: `admin123`
3. **Altere a senha imediatamente** em Configurações

### 2. Criar um Template

1. Acesse **Templates** → **Novo Template**
2. Defina um nome e descrição
3. Adicione blocos com conteúdo Markdown:
   - Clique em **Adicionar Bloco**
   - Escolha entre **Bloco Vazio** ou um **Bloco Favorito**
   - Edite o título e conteúdo do bloco
   - Use placeholders como `{{REPORT_NUMBER}}`, `{{CLIENT_NAME}}`, etc.
4. Reordene blocos arrastando e soltando
5. Salve o template

### 3. Salvar Blocos como Favoritos

1. Ao editar um bloco em um template ou relatório
2. Clique no ícone de **estrela** ⭐ no cabeçalho do bloco
3. Digite um nome para o bloco favorito
4. O bloco será salvo e poderá ser reutilizado em outros templates/relatórios

### 4. Criar um Relatório

1. Acesse **Relatórios** → **Novo Relatório**
   - Ou clique em **Novo Relatório** em um template específico
2. Preencha:
   - Título do relatório
   - Nome do cliente
3. Edite os blocos conforme necessário
4. Use placeholders para informações dinâmicas
5. Salve o relatório

### 5. Gerar PDF

1. Abra um relatório
2. Clique em **Gerar PDF do Relatório**
3. O PDF será baixado automaticamente

### 6. Configurar PDF

1. Acesse **Administração** → **Configurações PDF**
2. Configure:
   - Nome da empresa
   - Logo da empresa
   - Cabeçalho e rodapé
   - Cores e fontes
   - Margens e tamanho do papel

### 7. Gerenciar Blocos Favoritos

1. Acesse **Blocos Favoritos** no menu
2. Visualize todos os seus blocos favoritos
3. Edite ou remova blocos conforme necessário
4. Também é possível remover diretamente no modal de seleção

## 📊 Estrutura do Projeto

```
ReportBloc/
├── app.py                      # Backend Flask principal
├── pdf_generator.py            # Gerador de PDFs
├── requirements.txt            # Dependências Python
├── package.json                # Dependências Node.js
├── tailwind.config.js          # Configuração Tailwind CSS
├── tsconfig.json               # Configuração TypeScript
├── README.md                   # Este arquivo
├── config_example.env          # Exemplo de configuração
├── setup.sh                    # Script de instalação (Linux/Mac)
├── .gitignore                  # Arquivos ignorados pelo Git
│
├── public/                     # Arquivos públicos React
│   └── index.html
│
├── src/                        # Código fonte React
│   ├── components/            # Componentes reutilizáveis
│   │   ├── Header.tsx
│   │   ├── BackButton.tsx
│   │   ├── PlaceholderSelector.tsx
│   │   ├── BlockTemplateSelector.tsx
│   │   └── ...
│   ├── pages/                 # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── Templates.tsx
│   │   ├── TemplateEditor.tsx
│   │   ├── Proposals.tsx
│   │   ├── ProposalEditor.tsx
│   │   ├── BlockTemplates.tsx
│   │   └── ...
│   ├── contexts/              # Contextos React
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/              # Serviços de API
│   │   └── api.ts
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts
│   ├── App.tsx                # Componente principal
│   ├── index.tsx               # Ponto de entrada
│   └── index.css               # Estilos globais
│
└── instance/                   # Banco de dados (criado automaticamente)
    └── reports.db
```

## 🔄 Fluxo de Trabalho Recomendado

1. **Configurar o Sistema**
   - Configure variáveis de ambiente
   - Configure as opções de PDF

2. **Criar Templates Base**
   - Crie templates com estrutura padrão para seus relatórios
   - Use placeholders para informações dinâmicas

3. **Criar Blocos Favoritos**
   - Salve blocos comuns como favoritos
   - Facilite a criação de novos relatórios

4. **Criar Relatórios**
   - Use templates ou crie do zero
   - Adicione blocos favoritos quando necessário
   - Personalize o conteúdo

5. **Gerar PDFs**
   - Revise o relatório
   - Gere o PDF final
   - Compartilhe ou arquive

## 🔧 Configuração Avançada

### Banco de Dados PostgreSQL

1. Instale o PostgreSQL
2. Crie um banco de dados:
```sql
CREATE DATABASE reports;
```

3. Atualize o `.env`:
```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/reports
```

4. Instale o driver:
```bash
pip install psycopg2-binary
```

### Variáveis de Ambiente Disponíveis

```env
# Obrigatório
SECRET_KEY=sua-chave-secreta

# Banco de dados
DATABASE_URL=sqlite:///reports.db

# Produção (opcional)
DEBUG=False
HOST=0.0.0.0
PORT=5000
```

## 🐳 Docker (Opcional)

### Dockerfile Backend

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Dockerfile Frontend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/reports
    depends_on:
      - db

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: reports
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔒 Segurança

### Variáveis de Ambiente
**IMPORTANTE**: Nunca commite arquivos com dados sensíveis no repositório!

- Use `config_example.env` como base e crie seu próprio `.env`
- O arquivo `.gitignore` já está configurado para excluir:
  - `.env` (variáveis de ambiente)
  - `*.db` (bancos de dados)
  - `instance/` (dados do banco)
  - `static/uploads/` (arquivos de upload)

### Boas Práticas
- ✅ Senhas hashadas com bcrypt
- ✅ Sessões seguras com chave secreta
- ✅ Proteção CSRF em formulários
- ✅ Validação de entrada em todas as rotas
- ✅ Autenticação requerida para todas as páginas
- ✅ Interceptors de API para tratamento de erros
- ✅ **Sempre gere uma SECRET_KEY única e segura no `.env`**
- ✅ **Nunca compartilhe credenciais ou chaves de API**
- ✅ **Altere a senha padrão do admin imediatamente**
- ✅ **Use HTTPS em produção**

## 🧪 Testes

### Backend

```bash
# Instalar dependências de teste
pip install pytest pytest-cov

# Executar testes
pytest

# Com cobertura
pytest --cov=app tests/
```

### Frontend

```bash
npm test
```

## 📝 Placeholders Disponíveis

- `{{REPORT_NUMBER}}` - Número do relatório
- `{{REPORT_TITLE}}` - Título do relatório
- `{{REPORT_CLIENT}}` - Nome do cliente
- `{{CURRENT_DATE}}` - Data atual (DD/MM/YYYY)
- `{{CURRENT_DATE_FULL}}` - Data completa (DD de Mês de YYYY)
- `{{CURRENT_YEAR}}` - Ano atual
- `{{CURRENT_MONTH}}` - Mês atual
- `{{CURRENT_DAY}}` - Dia atual
- `{{COMPANY_NAME}}` - Nome da empresa configurada

**Nota**: Placeholders antigos (`{{PROPOSAL_*}}`, `{{CLIENT_NAME}}`) ainda funcionam para compatibilidade, mas use os novos nomes.

## 🐛 Troubleshooting

### Erro "Module not found"

Certifique-se de que o ambiente virtual está ativado e todas as dependências foram instaladas:
```bash
pip install -r requirements.txt
```

### Erro ao gerar PDF

#### Windows
Se você receber erros relacionados ao GTK ao gerar PDFs, instale o **GTK-for-Windows-Runtime-Environment-Installer**:
1. Baixe de: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases
2. Execute o instalador
3. Reinicie o terminal e tente novamente

#### Linux
Pode ser necessário instalar dependências do sistema:
```bash
# Ubuntu/Debian
sudo apt-get install python3-cffi python3-brotli libpango-1.0-0 libpangoft2-1.0-0

# Fedora/RHEL
sudo dnf install python3-cffi python3-brotli pango
```

#### macOS
O WeasyPrint geralmente funciona sem dependências adicionais. Se houver problemas:
```bash
brew install pango gdk-pixbuf libffi
```

### Porta já em uso

Altere a porta no `app.py` ou `.env`:
```python
app.run(port=5002)  # Use outra porta
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript para o frontend
- Siga as convenções do PEP 8 para Python
- Adicione comentários quando necessário
- Mantenha o código limpo e legível

## 📞 Suporte

Para suporte e dúvidas:

- 📧 Abra uma [issue](https://github.com/seu-usuario/ReportBloc/issues) no GitHub
- 📖 Consulte a documentação
- 💬 Entre em contato com a equipe de desenvolvimento

## 🙏 Agradecimentos

- Flask e React pelas excelentes frameworks
- Todos os mantenedores das bibliotecas utilizadas
- Comunidade open source

---

**Desenvolvido com ❤️ para facilitar a criação de relatórios de pentest profissionais**
