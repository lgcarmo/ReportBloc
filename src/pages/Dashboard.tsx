import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Calendar, Shield } from 'lucide-react';
import { templatesAPI, reportsAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [templatesCount, setTemplatesCount] = useState<number>(0);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [reportsThisMonth, setReportsThisMonth] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [templatesRes, reportsRes] = await Promise.all([
        templatesAPI.getAll(),
        reportsAPI.getAll()
      ]);

      const templates = templatesRes.data || [];
      const reports = reportsRes.data || [];
      
      setTemplatesCount(templates.length);
      setReportsCount(reports.length);

      // Contar relatórios deste mês
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const reportsThisMonthCount = reports.filter((report: any) => {
        const reportDate = new Date(report.created_at);
        return reportDate >= firstDayOfMonth;
      }).length;
      
      setReportsThisMonth(reportsThisMonthCount);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral dos seus relatórios de pentest
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Templates Disponíveis
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {loading ? '...' : templatesCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-green-500 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total de Relatórios
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {loading ? '...' : reportsCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Relatórios Este Mês
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {loading ? '...' : reportsThisMonth}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Link
                  to="/templates/new"
                  className="relative group bg-white dark:bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-4 ring-white dark:ring-gray-800">
                      <Plus className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Novo Template
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Crie um novo template para seus relatórios de pentest.
                    </p>
                  </div>
                </Link>
              )}

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Link
                  to="/proposals"
                  className="relative group bg-white dark:bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-4 ring-white dark:ring-gray-800">
                      <Plus className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Novo Relatório
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Crie um novo relatório a partir de um template existente.
                    </p>
                  </div>
                </Link>
              )}

              <Link
                to="/proposals"
                className="relative group bg-white dark:bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-4 ring-white dark:ring-gray-800">
                    <Shield className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Ver Relatórios
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Visualize e gerencie todos os seus relatórios de pentest.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 