import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Eye, Edit, Trash2, Download } from 'lucide-react';
import { reportsAPI } from '../services/api';
import { Proposal, Template } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Proposals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [nextNumber, setNextNumber] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState(''); // <-- busca

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getAll();
      setProposals(response.data);
    } catch (error) {
      setError('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (proposalId: number, proposalTitle: string, clientName: string) => {
    try {
      setGeneratingPDF(proposalId);
      const response = await reportsAPI.generatePDF(proposalId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const fileName = `relatorio_${proposalTitle.replace(/\s+/g, '_')}_${clientName.replace(/\s+/g, '_')}.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const openModal = async () => {
    setShowModal(true);
    setCreating(false);
    try {
      const [templatesRes, numberRes] = await Promise.all([
        reportsAPI.getTemplates(),
        reportsAPI.getNextNumber()
      ]);
      setTemplates(templatesRes.data);
      setNextNumber(numberRes.data.next_number);
      setSelectedTemplate('');
    } catch (error) {
      alert('Erro ao carregar dados para novo relatório');
    }
  };

  const handleCreate = () => {
    setCreating(true);
    const targetRoute = selectedTemplate
      ? `/proposals/new/${selectedTemplate}`
      : '/proposals/new';
    navigate(targetRoute);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja apagar este relatório?')) return;
    try {
      await reportsAPI.delete(id);
      setProposals(proposals => proposals.filter(p => p.id !== id));
    } catch (error) {
      alert('Erro ao apagar relatório');
    }
  };

  const filteredProposals = proposals.filter(p =>
    `${p.proposal_number} ${p.title} ${p.client_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <button
                onClick={openModal}
                className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Relatório
              </button>
            )}
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por número, título ou cliente..."
              className="w-full sm:w-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            {loading && <div className="p-6 text-center text-gray-900 dark:text-white">Carregando...</div>}
            {error && <div className="p-6 text-center text-red-600 dark:text-red-400">{error}</div>}
            {!loading && !error && (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {proposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{proposal.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{proposal.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{proposal.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/proposals/${proposal.id}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            title="Visualizar Relatório"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button
                              onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="Editar Relatório"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleGeneratePDF(proposal.id, proposal.title, proposal.client_name)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30"
                            title="Baixar PDF do Relatório"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button
                              onClick={() => handleDelete(proposal.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Apagar Relatório"
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

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-opacity-60">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Novo Relatório</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número do Relatório</label>
                  <input
                    type="text"
                    value={nextNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">Relatório em branco</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                >
                  Criar Relatório
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Proposals;
 