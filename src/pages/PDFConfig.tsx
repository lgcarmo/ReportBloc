import React, { useEffect, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { pdfConfigAPI } from '../services/api';
import { PDFConfig } from '../types';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';

const PDFConfigPage: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<PDFConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await pdfConfigAPI.get();
      setConfig(response.data);
    } catch (err) {
      setError('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await pdfConfigAPI.update(config);
      setSuccess('Configurações salvas com sucesso!');
    } catch (err) {
      setError('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof PDFConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-600 dark:text-red-400">Acesso restrito ao administrador.</div>;
  }

  if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Carregando...</div>;
  if (!config) return <div className="p-8 text-center text-red-600 dark:text-red-400">Erro ao carregar configurações.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton />
        </div>
        
        <div className="flex items-center mb-6">
          <Settings className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações de PDF</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded">
              {success}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Informações da Empresa */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">
                Informações da Empresa
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={config.company_name}
                    onChange={(e) => updateConfig('company_name', e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    URL do Logo (opcional)
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={config.company_logo_url || ''}
                    onChange={(e) => updateConfig('company_logo_url', e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Cabeçalho e Rodapé */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">
                Cabeçalho e Rodapé
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Texto do Cabeçalho (opcional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={config.header_text}
                    onChange={(e) => updateConfig('header_text', e.target.value)}
                    placeholder="Texto que aparecerá no cabeçalho do PDF..."
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Imagem do Cabeçalho (opcional)
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={config.header_image_url || ''}
                    onChange={(e) => updateConfig('header_image_url', e.target.value)}
                    placeholder="https://exemplo.com/imagem-cabecalho.png"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    URL da imagem que aparecerá no cabeçalho (máx. 100px de altura)
                  </p>
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Texto do Rodapé (opcional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={config.footer_text}
                    onChange={(e) => updateConfig('footer_text', e.target.value)}
                    placeholder="Texto que aparecerá no rodapé do PDF..."
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Imagem do Rodapé (opcional)
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={config.footer_image_url || ''}
                    onChange={(e) => updateConfig('footer_image_url', e.target.value)}
                    placeholder="https://exemplo.com/imagem-rodape.png"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    URL da imagem que aparecerá no rodapé (máx. 80px de altura)
                  </p>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={config.show_page_numbers}
                      onChange={(e) => updateConfig('show_page_numbers', e.target.checked)}
                    />
                    <span className="text-gray-700 dark:text-gray-300">Mostrar numeração de páginas</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Cores */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">
                Cores
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Cor Primária
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded"
                      value={config.primary_color}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={config.primary_color}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Cor Secundária
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded"
                      value={config.secondary_color}
                      onChange={(e) => updateConfig('secondary_color', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={config.secondary_color}
                      onChange={(e) => updateConfig('secondary_color', e.target.value)}
                      placeholder="#1e40af"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tipografia e Layout */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">
                Tipografia e Layout
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Fonte Principal
                  </label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={config.font_family}
                    onChange={(e) => updateConfig('font_family', e.target.value)}
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Tamanho do Papel
                  </label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={config.paper_size}
                    onChange={(e) => updateConfig('paper_size', e.target.value)}
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Margens */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">
                Margens (em centímetros)
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Superior
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={config.margin_top}
                    onChange={(e) => updateConfig('margin_top', parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Inferior
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={config.margin_bottom}
                    onChange={(e) => updateConfig('margin_bottom', parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Esquerda
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={config.margin_left}
                    onChange={(e) => updateConfig('margin_left', parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Direita
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={config.margin_right}
                    onChange={(e) => updateConfig('margin_right', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center bg-primary-600 dark:bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PDFConfigPage; 