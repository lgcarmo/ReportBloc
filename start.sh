#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando ReportBloc${NC}"
echo -e "${BLUE}======================${NC}"
echo ""

# Verificar se o ambiente virtual existe
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Ambiente virtual não encontrado. Execute ./setup.sh primeiro.${NC}"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ Dependências Node.js não encontradas. Execute ./setup.sh primeiro.${NC}"
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado. Execute ./setup.sh primeiro.${NC}"
    exit 1
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Encerrando processos...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    # Matar processos filhos também
    pkill -P $$ 2>/dev/null
    echo -e "${GREEN}✅ Processos encerrados${NC}"
    exit 0
}

# Capturar sinais para limpeza
trap cleanup SIGINT SIGTERM

# Ativar ambiente virtual
echo -e "${YELLOW}🔧 Ativando ambiente virtual...${NC}"
source venv/bin/activate

# Verificar se as portas estão em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Verificar porta 5001 (backend)
if check_port 5001; then
    echo -e "${YELLOW}⚠️  Porta 5001 já está em uso. Tentando continuar...${NC}"
fi

# Verificar porta 3000 (frontend)
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Porta 3000 já está em uso. Tentando continuar...${NC}"
fi

# Iniciar backend
echo -e "${YELLOW}🔷 Iniciando backend (Flask)...${NC}"
cd "$(dirname "$0")"
python app.py > backend.log 2>&1 &
BACKEND_PID=$!

# Aguardar um pouco para o backend iniciar
sleep 2

# Verificar se o backend está rodando
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Erro ao iniciar backend. Verifique backend.log${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}   Backend disponível em: http://localhost:5001${NC}"

# Iniciar frontend
echo -e "${YELLOW}🔶 Iniciando frontend (React)...${NC}"
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

# Aguardar um pouco para o frontend iniciar
sleep 3

# Verificar se o frontend está rodando
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Erro ao iniciar frontend. Verifique frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}   Frontend disponível em: http://localhost:3000${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ ReportBloc está rodando!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📱 Acesse: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}📋 Logs:${NC}"
echo -e "   Backend:  tail -f backend.log"
echo -e "   Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para encerrar ambos os serviços${NC}"
echo ""

# Loop para monitorar processos
while true; do
    # Verificar se os processos ainda estão rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend parou inesperadamente${NC}"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend parou inesperadamente${NC}"
        cleanup
    fi
    
    # Aguardar 1 segundo antes de verificar novamente
    sleep 1
done

