import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Download, Edit } from 'lucide-react';
import { reportsAPI } from '../services/api';
import BackButton from '../components/BackButton';

interface Block {
  id: string;
  title: string;
  content: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  sent: 'bg-blue-200 text-blue-700',
  approved: 'bg-green-200 text-green-700',
  rejected: 'bg-red-200 text-red-700',
};

const ProposalView: React.FC = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      reportsAPI.getById(Number(id))
        .then(res => {
          setTitle(res.data.title);
          setClientName(res.data.client_name);
          setStatus(res.data.status);
          setCreatedAt(res.data.created_at);
          setUpdatedAt(res.data.updated_at);
          setBlocks((res.data.blocks || []).map((b: any) => ({
            id: String(b.id),
            title: b.title,
            content: b.content,
          })));
        })
        .catch(() => setError('Erro ao carregar relatório.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleGeneratePDF = async () => {
    if (!id) return;
    
    try {
      setGeneratingPDF(true);
      const response = await reportsAPI.generatePDF(Number(id));
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${title.replace(/\s+/g, '_')}_${clientName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };


  if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {generatingPDF ? 'Gerando...' : 'Gerar PDF do Relatório'}
            </button>
            <Link
              to={`/proposals/${id}/edit`}
              className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-600 flex items-center"
              title="Editar Relatório"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número do Relatório
              </label>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título
              </label>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente
              </label>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {clientName}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {status === 'draft' ? 'Rascunho' :
                 status === 'sent' ? 'Enviada' :
                 status === 'approved' ? 'Aprovada' :
                 'Rejeitada'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Criada em
              </label>
              <div className="text-sm text-gray-900 dark:text-white">
                {new Date(createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Última atualização
              </label>
              <div className="text-sm text-gray-900 dark:text-white">
                {new Date(updatedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          {blocks.length === 0 && (
            <div className="text-gray-400 dark:text-gray-500">Nenhum bloco neste relatório.</div>
          )}
          {blocks.map((block, idx) => (
            <div key={block.id} className="mb-8">
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">{block.title || `Bloco ${idx + 1}`}</div>
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

export default ProposalView; 