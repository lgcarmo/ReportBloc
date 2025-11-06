import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, FileText, Trash2, Download, Upload } from 'lucide-react';
import { templatesAPI } from '../services/api';
import { Template } from '../types';
import ImageGallery from '../components/ImageGallery';
import { useAuth } from '../contexts/AuthContext';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setLoading(true);
    templatesAPI.getAll()
      .then(res => setTemplates(res.data))
      .catch(() => setError('Erro ao carregar templates.'))
      .finally(() => setLoading(false));
  };

  const handleDeleteTemplate = async (templateId: number, templateName: string) => {
    if (window.confirm(`Tem certeza que deseja apagar o template "${templateName}"?`)) {
      try {
        await templatesAPI.delete(templateId);
        loadTemplates(); // Recarrega a lista
      } catch (error) {
        alert('Erro ao apagar template.');
      }
    }
  };

  const handleExport = async (id: number) => {
    try {
      const response = await templatesAPI.getExport(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Erro ao exportar template');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await templatesAPI.importTemplate(json);
      alert('Template importado com sucesso!');
      loadTemplates();
    } catch (error) {
      alert('Erro ao importar template. Verifique o arquivo.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja apagar este template?')) return;
    try {
      await templatesAPI.delete(id);
      setTemplates(templates => templates.filter(t => t.id !== id));
    } catch (error) {
      alert('Erro ao apagar template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Templates</h1>
            {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="flex gap-2">
              <button
                onClick={handleImportClick}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center"
                title="Importar Template"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </button>
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
              />
            </div>
            )}
            {(user?.role === 'admin' || user?.role === 'manager') && (
            <Link
              to="/templates/new"
              className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Template
            </Link>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            {loading && <div className="p-6 text-center text-gray-900 dark:text-white">Carregando...</div>}
            {error && <div className="p-6 text-center text-red-600 dark:text-red-400">{error}</div>}
            {!loading && !error && (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{template.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{template.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/templates/${template.id}/edit`)}
                            className={`text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 ${user?.role === 'viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Editar"
                            disabled={user?.role === 'viewer'}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleExport(template.id)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            title="Exportar"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Apagar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="mt-8">
          
        </div>
      </div>
    </div>
  );
};

export default Templates; 