#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configurando ReportBloc${NC}"
echo -e "${BLUE}===========================${NC}"
echo ""

# Função para verificar versão
check_version() {
    local command=$1
    local min_version=$2
    local version_output=$($command --version 2>&1 | head -n 1)
    echo "$version_output"
}

# Verificar se Python está instalado
echo -e "${YELLOW}📋 Verificando pré-requisitos...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 não encontrado. Por favor, instale Python 3.8 ou superior.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✅ Python encontrado: $PYTHON_VERSION${NC}"

# Verificar versão mínima do Python (3.8)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
    echo -e "${RED}❌ Python 3.8 ou superior é necessário. Versão atual: $PYTHON_VERSION${NC}"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Por favor, instale Node.js 16 ou superior.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
echo -e "${GREEN}✅ Node.js encontrado: $NODE_VERSION${NC}"

# Verificar versão mínima do Node.js (16)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 16 ]; then
    echo -e "${RED}❌ Node.js 16 ou superior é necessário. Versão atual: $NODE_VERSION${NC}"
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado. Por favor, instale npm.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm encontrado: $NPM_VERSION${NC}"

echo ""
echo -e "${GREEN}✅ Todos os pré-requisitos atendidos!${NC}"
echo ""

# Criar ambiente virtual Python
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Criando ambiente virtual Python...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao criar ambiente virtual.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Ambiente virtual criado${NC}"
else
    echo -e "${GREEN}✅ Ambiente virtual já existe${NC}"
fi

# Ativar ambiente virtual
echo -e "${YELLOW}🔧 Ativando ambiente virtual...${NC}"
source venv/bin/activate

# Atualizar pip
echo -e "${YELLOW}📥 Atualizando pip...${NC}"
pip install --upgrade pip --quiet

# Instalar dependências Python
echo -e "${YELLOW}📥 Instalando dependências Python...${NC}"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências Python.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências Python instaladas${NC}"

# Configurar arquivo .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚙️  Criando arquivo de configuração...${NC}"
    cp config_example.env .env
    
    # Gerar SECRET_KEY automaticamente
    echo -e "${YELLOW}🔐 Gerando SECRET_KEY segura...${NC}"
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    
    # Atualizar .env com a SECRET_KEY gerada
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    fi
    
    echo -e "${GREEN}✅ Arquivo .env criado com SECRET_KEY gerada automaticamente${NC}"
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

# Instalar dependências Node.js
echo -e "${YELLOW}📥 Instalando dependências Node.js...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências Node.js.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências Node.js instaladas${NC}"

# Configurar Tailwind CSS (se não existir)
if [ ! -f "tailwind.config.js" ]; then
    echo -e "${YELLOW}🎨 Configurando Tailwind CSS...${NC}"
    npx tailwindcss init -p --quiet
    echo -e "${GREEN}✅ Tailwind CSS configurado${NC}"
else
    echo -e "${GREEN}✅ Tailwind CSS já configurado${NC}"
fi

# Inicializar banco de dados
echo ""
echo -e "${YELLOW}🗄️  Inicializando banco de dados...${NC}"
# Executar app.py em modo de inicialização (cria banco e usuário admin)
# Usar python do ambiente virtual
python -c "
from app import app, db, User
with app.app_context():
    db.create_all()
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', email='admin@empresa.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('✅ Usuário admin criado')
    else:
        print('✅ Banco de dados já inicializado')
"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao inicializar banco de dados.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Instalação concluída com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo ""
echo -e "1. Para iniciar o sistema, execute:"
echo -e "   ${YELLOW}./start.sh${NC}"
echo ""
echo -e "   Ou manualmente:"
echo -e "   ${YELLOW}Terminal 1:${NC} source venv/bin/activate && python app.py"
echo -e "   ${YELLOW}Terminal 2:${NC} npm start"
echo ""
echo -e "2. Acesse: ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "3. Faça login com:"
echo -e "   ${YELLOW}Usuário:${NC} admin"
echo -e "   ${YELLOW}Senha:${NC} admin123"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Altere a senha do admin após o primeiro login!${NC}"
echo ""
