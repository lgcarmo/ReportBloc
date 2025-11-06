import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Star } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MDEditor from '@uiw/react-md-editor';
import api, { reportsAPI, blockTemplatesAPI, BlockTemplate } from '../services/api';
import { Proposal, ProposalBlock, Template } from '../types';
import BackButton from '../components/BackButton';
import PlaceholderSelector from '../components/PlaceholderSelector';
import BlockTemplateSelector from '../components/BlockTemplateSelector';
import { useAuth } from '../contexts/AuthContext';

const ProposalEditor: React.FC = () => {
  const { id, templateId } = useParams<{ id: string; templateId: string }>();
  const navigate = useNavigate();
  const isEditing = id !== 'new';
  const { user } = useAuth();
  
  const [proposal, setProposal] = useState<Proposal>({
    id: 0,
    proposal_number: '',
    title: '',
    client_name: '',
    template_id: undefined,
    created_by: 0,
    created_at: '',
    updated_at: '',
    status: 'draft',
    blocks: []
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [pendingInsertIndex, setPendingInsertIndex] = useState<number | null>(null);

  // Função para gerar o próximo número de relatório
  const generateNextReportNumber = async () => {
    try {
      const response = await reportsAPI.getNextNumber();
      return response.data.next_number;
    } catch (error) {
      console.error('Erro ao gerar número do relatório:', error);
      return '';
    }
  };

  useEffect(() => {
    if (isEditing && id && id !== 'new') {
      loadProposal();
    } else if (templateId) {
      loadTemplate();
    } else if (!isEditing) {
      // Novo relatório sem template - gerar número automaticamente
      generateNextReportNumber().then(nextNumber => {
        setProposal(prev => ({ ...prev, proposal_number: nextNumber }));
      });
    }
  }, [id, templateId]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getById(Number(id));
      setProposal(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      alert('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/templates/${templateId}`);
      const template: Template = response.data;
      
      // Gerar próximo número de relatório
      const nextNumber = await generateNextReportNumber();
      
      // Criar relatório baseado no template
      setProposal(prev => ({
        ...prev,
        proposal_number: nextNumber,
        template_id: template.id,
        title: template.name,
        blocks: template.blocks.map(block => ({
          id: Date.now() + Math.random(),
          proposal_id: 0, // Será definido quando o relatório for salvo
          title: block.title,
          content: block.content,
          order: block.order,
          block_type: block.block_type,
          page_break_before: block.page_break_before || false
        }))
      }));
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      alert('Erro ao carregar template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!proposal.title.trim() || !proposal.client_name.trim()) {
      alert('Por favor, preencha o título e o nome do cliente');
      return;
    }

    try {
      setSaving(true);
      
      // Preparar dados para envio (remover campos desnecessários)
      const proposalData = {
        title: proposal.title,
        client_name: proposal.client_name,
        proposal_number: proposal.proposal_number,
        template_id: proposal.template_id,
        blocks: proposal.blocks.map(block => ({
          title: block.title,
          content: block.content,
          order: block.order,
          block_type: block.block_type,
          page_break_before: block.page_break_before || false
        }))
      };
      
      if (isEditing && id && id !== 'new') {
        await reportsAPI.update(Number(id), proposalData);
      } else {
        const response = await reportsAPI.create(proposalData);
        navigate('/proposals');
        return;
      }
      
      alert('Relatório salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      alert('Erro ao salvar relatório');
    } finally {
      setSaving(false);
    }
  };

  const addBlockFromTemplate = (blockTemplate: BlockTemplate | null, insertAt?: number) => {
    const newBlock: ProposalBlock = {
      id: Date.now(),
      proposal_id: proposal.id,
      title: blockTemplate?.title || '',
      content: blockTemplate?.content || '',
      order: insertAt !== undefined ? insertAt + 1 : proposal.blocks.length,
      block_type: blockTemplate?.block_type || 'text',
      page_break_before: blockTemplate?.page_break_before || false
    };

    if (insertAt !== undefined) {
      setProposal(prev => {
        const newBlocks = [...prev.blocks];
        newBlocks.splice(insertAt + 1, 0, newBlock);
        return {
          ...prev,
          blocks: newBlocks.map((block, idx) => ({ ...block, order: idx }))
        };
      });
      setActiveBlockIndex(insertAt + 1);
    } else {
      setProposal(prev => ({
        ...prev,
        blocks: [...prev.blocks, newBlock]
      }));
      setActiveBlockIndex(proposal.blocks.length);
    }
  };

  const addBlock = () => {
    setPendingInsertIndex(null);
    setShowBlockSelector(true);
  };

  const insertBlock = (afterIndex: number) => {
    setPendingInsertIndex(afterIndex);
    setShowBlockSelector(true);
  };

  const handleBlockTemplateSelect = (blockTemplate: BlockTemplate | null) => {
    if (pendingInsertIndex !== null) {
      addBlockFromTemplate(blockTemplate, pendingInsertIndex);
      setPendingInsertIndex(null);
    } else {
      addBlockFromTemplate(blockTemplate);
    }
  };

  const saveBlockAsFavorite = async (blockIndex: number) => {
    const block = proposal.blocks[blockIndex];
    if (!block.title.trim() && !block.content.trim()) {
      alert('O bloco precisa ter pelo menos um título ou conteúdo para ser salvo como favorito.');
      return;
    }

    const name = prompt('Digite um nome para este bloco favorito:', block.title || 'Bloco sem nome');
    if (!name) return;

    try {
      await blockTemplatesAPI.create({
        name: name.trim(),
        title: block.title,
        content: block.content,
        block_type: block.block_type,
        page_break_before: block.page_break_before || false
      });
      alert('Bloco salvo como favorito com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar bloco como favorito:', error);
      alert('Erro ao salvar bloco como favorito.');
    }
  };

  const removeBlock = (index: number) => {
    setProposal(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
  };

  const updateBlock = (index: number, field: keyof ProposalBlock, value: any) => {
    setProposal(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) => 
        i === index ? { ...block, [field]: value } : block
      )
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const blocks = Array.from(proposal.blocks);
    const [reorderedBlock] = blocks.splice(result.source.index, 1);
    blocks.splice(result.destination.index, 0, reorderedBlock);

    // Atualizar ordem
    const updatedBlocks = blocks.map((block, index) => ({
      ...block,
      order: index
    }));

    setProposal(prev => ({
      ...prev,
      blocks: updatedBlocks
    }));
  };

  const insertPlaceholder = (placeholder: string) => {
    if (activeBlockIndex !== null) {
      const currentContent = proposal.blocks[activeBlockIndex].content;
      updateBlock(activeBlockIndex, 'content', currentContent + placeholder);
    }
  };

  if (user?.role === 'viewer') {
    return <div className="p-8 text-center text-red-600">Acesso restrito a administradores e managers.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Relatório' : 'Novo Relatório'}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número do Relatório
              </label>
              <input
                type="text"
                value={proposal.proposal_number}
                onChange={(e) => setProposal(prev => ({ ...prev, proposal_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o número do relatório"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Preenchido automaticamente. Pode ser editado se necessário.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título do Relatório
              </label>
              <input
                type="text"
                value={proposal.title}
                onChange={(e) => setProposal(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o título do relatório"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={proposal.client_name}
                onChange={(e) => setProposal(prev => ({ ...prev, client_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o nome do cliente"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Blocos do Relatório</h2>
              <div className="flex items-center space-x-3">
                <PlaceholderSelector onInsert={insertPlaceholder} />
                <button
                  onClick={addBlock}
                  className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Bloco
                </button>
              </div>
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="blocks">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="p-6"
                >
                  {proposal.blocks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum bloco adicionado ainda</p>
                      <button
                        onClick={addBlock}
                        className="flex items-center mx-auto px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Bloco
                      </button>
                    </div>
                  ) : (
                    proposal.blocks.map((block, index) => (
                      <Draggable 
                        key={block.id} 
                        draggableId={block.id.toString()} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 ${
                              snapshot.isDragging ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500 cursor-move" />
                                </div>
                                <input
                                  type="text"
                                  value={block.title}
                                  onChange={(e) => updateBlock(index, 'title', e.target.value)}
                                  className="bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                                  placeholder="Título do bloco"
                                  onClick={() => setActiveBlockIndex(index)}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => saveBlockAsFavorite(index)}
                                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                                  title="Salvar como favorito"
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => removeBlock(index)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  title="Remover bloco"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div 
                              className="p-4"
                              onClick={() => setActiveBlockIndex(index)}
                            >
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  checked={block.page_break_before || false}
                                  onChange={e => updateBlock(index, 'page_break_before', e.target.checked)}
                                  className="mr-2"
                                  id={`page-break-${block.id}`}
                                />
                                <label htmlFor={`page-break-${block.id}`} className="text-sm text-gray-700 dark:text-gray-300">Iniciar em nova página</label>
                              </div>
                              <div onMouseDown={(e) => e.stopPropagation()}>
                                <MDEditor
                                  value={block.content}
                                  onChange={(value) => updateBlock(index, 'content', value || '')}
                                  height={200}
                                  preview="live"
                                />
                              </div>
                            </div>
                            {/* Botão para adicionar bloco após este */}
                            <div className="flex justify-center p-4 border-t border-gray-200 dark:border-gray-600">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  insertBlock(index);
                                }}
                                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                                title="Adicionar bloco aqui"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="text-sm">Adicionar bloco</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      <BlockTemplateSelector
        isOpen={showBlockSelector}
        onSelect={handleBlockTemplateSelect}
        onClose={() => {
          setShowBlockSelector(false);
          setPendingInsertIndex(null);
        }}
      />
    </div>
  );
};

export default ProposalEditor; 