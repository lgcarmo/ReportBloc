import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface PlaceholderSelectorProps {
  onInsert: (placeholder: string) => void;
}

const PlaceholderSelector: React.FC<PlaceholderSelectorProps> = ({ onInsert }) => {
  const [isOpen, setIsOpen] = useState(false);

  const placeholders = [
    // Placeholders principais de Relatório
    { key: '{{REPORT_NUMBER}}', label: 'Número do Relatório', description: 'Ex: 5001001' },
    { key: '{{REPORT_TITLE}}', label: 'Título do Relatório', description: 'Título atual do relatório' },
    { key: '{{REPORT_CLIENT}}', label: 'Cliente', description: 'Nome do cliente do relatório' },
    // Datas e empresa
    { key: '{{CURRENT_DATE}}', label: 'Data Atual', description: 'Ex: 26/06/2025' },
    { key: '{{CURRENT_DATE_FULL}}', label: 'Data Completa', description: 'Ex: 26 de Junho de 2025' },
    { key: '{{CURRENT_YEAR}}', label: 'Ano Atual', description: 'Ex: 2025' },
    { key: '{{CURRENT_MONTH}}', label: 'Mês Atual', description: 'Ex: 06' },
    { key: '{{CURRENT_DAY}}', label: 'Dia Atual', description: 'Ex: 26' },
    { key: '{{COMPANY_NAME}}', label: 'Nome da Empresa', description: 'Nome configurado da empresa' },
    // Placeholders de compatibilidade (mantidos para retrocompatibilidade)
    { key: '{{PROPOSAL_NUMBER}}', label: 'Número do Relatório (antigo)', description: 'Ex: 4002506 - Use {{REPORT_NUMBER}}' },
    { key: '{{PROPOSAL_TITLE}}', label: 'Título do Relatório (antigo)', description: 'Use {{REPORT_TITLE}}' },
    { key: '{{CLIENT_NAME}}', label: 'Nome do Cliente (antigo)', description: 'Use {{REPORT_CLIENT}}' },
  ];

  const handleInsert = (placeholder: string) => {
    onInsert(placeholder);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-600"
      >
        <Plus className="h-4 w-4 mr-1" />
        Inserir Placeholder
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">Placeholders disponíveis:</div>
            {placeholders.map((placeholder, index) => {
              const isLegacy = placeholder.key.includes('PROPOSAL') || placeholder.key === '{{CLIENT_NAME}}';
              return (
                <button
                  key={placeholder.key}
                  onClick={() => handleInsert(placeholder.key)}
                  className={`w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex flex-col ${
                    isLegacy ? 'opacity-70' : ''
                  }`}
                >
                  <div className="font-mono text-sm text-blue-600 dark:text-blue-400">{placeholder.key}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{placeholder.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{placeholder.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceholderSelector; 