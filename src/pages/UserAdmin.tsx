import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { User } from '../types';
import { Plus, Trash2, Save, Edit, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const UserAdmin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersAPI.list();
      setUsers(res.data);
    } catch (e) {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox' && 'checked' in e.target) {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await usersAPI.create(form);
      setShowForm(false);
      setForm({ username: '', email: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erro ao criar usuário.');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    try {
      await usersAPI.update(editingUser.id, form);
      setEditingUser(null);
      setShowForm(false);
      setForm({ username: '', email: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erro ao atualizar usuário.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja apagar este usuário?')) return;
    setError(null);
    try {
      await usersAPI.delete(id);
      fetchUsers();
    } catch (e) {
      setError('Erro ao apagar usuário.');
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('ATENÇÃO: Esta ação irá apagar TODOS os relatórios, templates e configurações do banco de dados. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }
    
    if (!window.confirm('Tem CERTEZA ABSOLUTA? Todos os dados serão perdidos permanentemente!')) {
      return;
    }
    
    setError(null);
    try {
      await api.post('/api/admin/clear-database');
      alert('Banco de dados limpo com sucesso!');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erro ao limpar banco de dados.');
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-600 dark:text-red-400">Acesso restrito ao administrador.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Administração de Usuários</h1>
      {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}
      <div className="mb-6 flex justify-between items-center">
        <button
          className="flex items-center bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-600"
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            setForm({ username: '', email: '', password: '', role: 'viewer' });
          }}
        >
          <Plus className="h-5 w-5 mr-2" /> Novo Usuário
        </button>
        <button
          className="flex items-center bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600"
          onClick={handleClearDatabase}
          title="Limpar todo o banco de dados (relatórios, templates e configurações)"
        >
          <Database className="h-5 w-5 mr-2" /> Limpar Banco de Dados
        </button>
      </div>
      {showForm && (
        <form onSubmit={editingUser ? handleUpdate : handleCreate} className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8 border dark:border-gray-700">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Usuário</label>
            <input
              name="username"
              value={form.username}
              onChange={handleInput}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Nome de usuário"
              disabled={!!editingUser}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">E-mail</label>
            <input
              name="email"
              value={form.email}
              onChange={handleInput}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="E-mail"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Senha</label>
            <input
              name="password"
              value={form.password}
              onChange={handleInput}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Senha"
              type="password"
              required={!editingUser}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Papel</label>
            <select
              name="role"
              value={form.role}
              onChange={handleInput}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="admin">Administrador</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex items-center bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-600"
            >
              <Save className="h-5 w-5 mr-2" /> {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </button>
            <button
              type="button"
              className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => { setShowForm(false); setEditingUser(null); }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      <div className="bg-white dark:bg-gray-800 rounded shadow border dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">E-mail</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Admin</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{u.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-white">{u.role === 'admin' ? 'Sim' : 'Não'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right flex gap-2 justify-end">
                  <button
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={() => handleEdit(u)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => handleDelete(u.id)}
                    title="Apagar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAdmin; 