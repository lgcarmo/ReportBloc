import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const LDAPConfig: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    enabled: false,
    name: '',
    server: '',
    port: '389',
    username: '',
    password: '',
    base: '',
    login_attr: 'sAMAccountName',
    name_attr: 'cn',
    email_attr: 'mail',
    use_ssl: false,
    follow_referrals: false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/api/ldap-config');
      setConfig(res.data);
    } catch (e) {
      setError('Erro ao carregar configurações do LDAP.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await api.put('/api/ldap-config', config);
      setSuccess('Configurações salvas com sucesso!');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-600 dark:text-red-400">Acesso restrito ao administrador.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="mr-3">Configuração LDAP</span>
        </h1>
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <div className="mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                name="enabled"
                checked={config.enabled}
                onChange={handleChange}
              />
              Ativar LDAP
            </label>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                name="use_ssl"
                checked={config.use_ssl}
                onChange={handleChange}
              />
              Usar SSL
            </label>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                name="follow_referrals"
                checked={config.follow_referrals}
                onChange={handleChange}
              />
              Seguir referrals
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Nome</label>
            <input
              type="text"
              name="name"
              value={config.name}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Nome da configuração"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Servidor</label>
            <input
              type="text"
              name="server"
              value={config.server}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="servidor.ldap.exemplo.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Porta</label>
            <input
              type="text"
              name="port"
              value={config.port}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="389"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Usuário de Bind</label>
            <input
              type="text"
              name="username"
              value={config.username}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="usuario@exemplo.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Senha de Bind</label>
            <input
              type="password"
              name="password"
              value={config.password}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Senha do usuário de bind"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Base DN</label>
            <input
              type="text"
              name="base"
              value={config.base}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="DC=exemplo,DC=com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Atributo de Login</label>
            <input
              type="text"
              name="login_attr"
              value={config.login_attr}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="sAMAccountName"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Atributo de Nome</label>
            <input
              type="text"
              name="name_attr"
              value={config.name_attr}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="cn"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Atributo de E-mail</label>
            <input
              type="text"
              name="email_attr"
              value={config.email_attr}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="mail"
              required
            />
          </div>
          {success && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded">{success}</div>}
          {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">{error}</div>}
          <button
            type="submit"
            className="flex items-center bg-primary-600 dark:bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-60"
            disabled={saving}
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LDAPConfig; 