import React, { useState, useEffect } from 'react';
import { Star, Trash2, Edit, Plus, X } from 'lucide-react';
import { blockTemplatesAPI, BlockTemplate } from '../services/api';
import BackButton from '../components/BackButton';

const BlockTemplates: React.FC = () => {
  const [blockTemplates, setBlockTemplates] = useState<BlockTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadBlockTemplates();
  }, []);

  const loadBlockTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blockTemplatesAPI.getAll();
      setBlockTemplates(response.data);
    } catch (error) {
      setError('Erro ao carregar blocos favoritos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja apagar este bloco favorito?')) return;
    
    try {
      await blockTemplatesAPI.delete(id);
      setBlockTemplates(blockTemplates.filter(bt => bt.id !== id));
    } catch (error) {
      alert('Erro ao apagar bloco favorito.');
      console.error(error);
    }
  };

  const startEdit = (blockTemplate: BlockTemplate) => {
    setEditingId(blockTemplate.id);
    setEditName(blockTemplate.name);
    setEditTitle(blockTemplate.title);
    setEditContent(blockTemplate.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editName.trim()) {
      alert('O nome do bloco é obrigatório.');
      return;
    }

    try {
      await blockTemplatesAPI.update(editingId, {
        name: editName.trim(),
        title: editTitle,
        content: editContent
      });
      await loadBlockTemplates();
      cancelEdit();
    } catch (error) {
      alert('Erro ao atualizar bloco favorito.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Star className="h-8 w-8 mr-3 text-yellow-500" />
            Blocos Favoritos
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {blockTemplates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border dark:border-gray-700">
            <Star className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum bloco favorito salvo ainda.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Salve blocos como favoritos nos editores de relatórios e templates para reutilizá-los!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockTemplates.map((blockTemplate) => (
              <div
                key={blockTemplate.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6"
              >
                {editingId === blockTemplate.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome do Bloco Favorito
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Nome do bloco"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Título do Bloco
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Título do bloco"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Conteúdo (Markdown)
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="Conteúdo do bloco em Markdown"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Star className="h-5 w-5 mr-2 text-yellow-500 fill-yellow-500" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {blockTemplate.name}
                          </h3>
                        </div>
                        {blockTemplate.title && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Título: {blockTemplate.title}
                          </p>
                        )}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mt-2">
                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                            {blockTemplate.content.substring(0, 200)}
                            {blockTemplate.content.length > 200 ? '...' : ''}
                          </pre>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => startEdit(blockTemplate)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(blockTemplate.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Criado em: {new Date(blockTemplate.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockTemplates;

