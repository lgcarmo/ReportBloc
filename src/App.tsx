import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import TemplateView from './pages/TemplateView';
import Proposals from './pages/Proposals';
import ProposalEditor from './pages/ProposalEditor';
import ProposalView from './pages/ProposalView';
import PDFConfig from './pages/PDFConfig';
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';
import UserAdmin from './pages/UserAdmin';
import BlockTemplates from './pages/BlockTemplates';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/templates" element={
        <PrivateRoute>
          <Templates />
        </PrivateRoute>
      } />
      
      <Route path="/templates/new" element={
        <PrivateRoute>
          <TemplateEditor />
        </PrivateRoute>
      } />
      
      <Route path="/templates/:id" element={
        <PrivateRoute>
          <TemplateView />
        </PrivateRoute>
      } />
      
      <Route path="/templates/:id/edit" element={
        <PrivateRoute>
          <TemplateEditor />
        </PrivateRoute>
      } />
      
      <Route path="/proposals" element={
        <PrivateRoute>
          <Proposals />
        </PrivateRoute>
      } />
      
      <Route path="/proposals/new/:templateId" element={
        <PrivateRoute>
          <ProposalEditor />
        </PrivateRoute>
      } />
      
      <Route path="/proposals/new" element={
        <PrivateRoute>
          <ProposalEditor />
        </PrivateRoute>
      } />
      
      <Route path="/proposals/:id/edit" element={
        <PrivateRoute>
          <ProposalEditor />
        </PrivateRoute>
      } />
      
      <Route path="/proposals/:id" element={
        <PrivateRoute>
          <ProposalView />
        </PrivateRoute>
      } />
      
      <Route path="/pdf-config" element={
        <PrivateRoute>
          <PDFConfig />
        </PrivateRoute>
      } />
      
      <Route path="/admin/users" element={
        <PrivateRoute>
          <UserAdmin />
        </PrivateRoute>
      } />
      
      <Route path="/block-templates" element={
        <PrivateRoute>
          <BlockTemplates />
        </PrivateRoute>
      } />
    </Routes>
  );
};

export default App; 