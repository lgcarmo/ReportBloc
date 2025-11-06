import React, { useState, useEffect } from 'react';
import { Star, X, Plus, Trash2 } from 'lucide-react';
import { blockTemplatesAPI, BlockTemplate } from '../services/api';

interface BlockTemplateSelectorProps {
  onSelect: (blockTemplate: BlockTemplate | null) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BlockTemplateSelector: React.FC<BlockTemplateSelectorProps> = ({ onSelect, onClose, isOpen }) => {
  const [blockTemplates, setBlockTemplates] = useState<BlockTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBlockTemplates();
    }
  }, [isOpen]);

  const loadBlockTemplates = async () => {
    try {
      setLoading(true);
      const response = await blockTemplatesAPI.getAll();
      setBlockTemplates(response.data);
    } catch (error) {
      console.error('Erro ao carregar blocos favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, templateId: number) => {
    e.stopPropagation(); // Prevenir que o clique no botão selecione o bloco
    
    if (!window.confirm('Tem certeza que deseja remover este bloco dos favoritos?')) {
      return;
    }

    try {
      await blockTemplatesAPI.delete(templateId);
      // Recarregar a lista após deletar
      await loadBlockTemplates();
    } catch (error) {
      console.error('Erro ao remover bloco favorito:', error);
      alert('Erro ao remover bloco favorito.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            Selecionar Bloco
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">Carregando...</div>
          ) : (
            <div className="space-y-3">
              {/* Opção de bloco vazio */}
              <button
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Bloco Vazio</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Criar um novo bloco do zero</div>
                  </div>
                </div>
              </button>

              {/* Lista de blocos favoritos */}
              {blockTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum bloco favorito salvo ainda.
                  <br />
                  <span className="text-sm">Salve blocos como favoritos para reutilizá-los!</span>
                </div>
              ) : (
                blockTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <button
                      onClick={() => {
                        onSelect(template);
                        onClose();
                      }}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-gray-900 dark:text-white">{template.name}</span>
                          </div>
                          {template.title && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Título: {template.title}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-500 overflow-hidden" style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {template.content.substring(0, 100)}
                            {template.content.length > 100 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="px-4 pb-4 flex justify-end">
                      <button
                        onClick={(e) => handleDelete(e, template.id)}
                        className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                        title="Remover dos favoritos"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockTemplateSelector;

