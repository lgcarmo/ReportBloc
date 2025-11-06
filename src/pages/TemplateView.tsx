import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarkdownPreview from '@uiw/react-markdown-preview';
import api from '../services/api';
import BackButton from '../components/BackButton';

interface Block {
  id: string;
  content: string;
}

const TemplateView: React.FC = () => {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/api/templates/${id}`)
        .then(res => {
          setName(res.data.name);
          setDescription(res.data.description);
          setBlocks(res.data.blocks || []);
        })
        .catch(() => setError('Erro ao carregar template.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{name}</h1>
          <Link
            to={`/templates/${id}/edit`}
            className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-600"
          >
            Editar
          </Link>
        </div>
        <div className="mb-4 text-gray-600 dark:text-gray-400">{description}</div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          {blocks.length === 0 && (
            <div className="text-gray-400 dark:text-gray-500">Nenhum bloco neste template.</div>
          )}
          {blocks.map((block, idx) => (
            <div key={block.id} className="mb-8">
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Bloco {idx + 1}</div>
              <MarkdownPreview 
                source={block.content} 
                className="bg-gray-50 dark:bg-gray-700 rounded p-3" 
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateView; 