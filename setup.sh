#!/bin/bash

echo "🚀 Configurando ReportBloc"
echo "==========================="

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3.8 ou superior."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 16 ou superior."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale npm."
    exit 1
fi

echo "✅ Dependências básicas verificadas"

# Criar ambiente virtual Python
echo "📦 Criando ambiente virtual Python..."
python3 -m venv venv

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências Python
echo "📥 Instalando dependências Python..."
pip install -r requirements.txt

# Configurar arquivo .env
if [ ! -f .env ]; then
    echo "⚙️  Criando arquivo de configuração..."
    cp config_example.env .env
    echo "📝 Arquivo .env criado. Edite-o com suas configurações."
fi

# Instalar dependências Node.js
echo "📥 Instalando dependências Node.js..."
npm install

# Configurar Tailwind CSS
echo "🎨 Configurando Tailwind CSS..."
npx tailwindcss init -p

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Execute o backend: python app.py"
echo "3. Execute o frontend: npm start"
echo "4. Acesse: http://localhost:3000"
echo ""
echo "👤 Usuário padrão: admin / admin123"
echo "" 