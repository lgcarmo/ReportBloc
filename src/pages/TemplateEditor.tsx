import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Save, Star } from 'lucide-react';
import api, { blockTemplatesAPI, BlockTemplate } from '../services/api';
import BackButton from '../components/BackButton';
import PlaceholderSelector from '../components/PlaceholderSelector';
import BlockTemplateSelector from '../components/BlockTemplateSelector';
import ImageGallery from '../components/ImageGallery';
import { useAuth } from '../contexts/AuthContext';

interface Block {
  id: string;
  title: string;
  content: string;
  page_break_before?: boolean;
}

const TemplateEditor: React.FC = () => {
  const { id } = useParams(); // id do template (se edição)
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [pendingInsertIndex, setPendingInsertIndex] = useState<number | null>(null);

  // Carregar dados do template se for edição
  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/api/templates/${id}`)
        .then(res => {
          setName(res.data.name);
          setDescription(res.data.description);
          setBlocks(res.data.blocks.map((block: any) => ({
            ...block,
            page_break_before: !!block.page_break_before
          })));
        })
        .catch(() => setError('Erro ao carregar template.'))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setDescription('');
      setBlocks([]);
      setLoading(false);
    }
  }, [id]);

  // Adicionar bloco a partir de template favorito
  const addBlockFromTemplate = (blockTemplate: BlockTemplate | null, insertAt?: number) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      title: blockTemplate?.title || '',
      content: blockTemplate?.content || '',
      page_break_before: blockTemplate?.page_break_before || false
    };

    if (insertAt !== undefined) {
      setBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks.splice(insertAt + 1, 0, newBlock);
        return newBlocks;
      });
      setActiveBlockIndex(insertAt + 1);
    } else {
      setBlocks(prev => [...prev, newBlock]);
      setActiveBlockIndex(blocks.length);
    }
  };

  // Adicionar novo bloco
  const addBlock = () => {
    setPendingInsertIndex(null);
    setShowBlockSelector(true);
  };

  // Inserir bloco em posição específica
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
    const block = blocks[blockIndex];
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
        block_type: 'text',
        page_break_before: block.page_break_before || false
      });
      alert('Bloco salvo como favorito com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar bloco como favorito:', error);
      alert('Erro ao salvar bloco como favorito.');
    }
  };

  // Remover bloco
  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  // Atualizar conteúdo do bloco
  const updateBlock = (index: number, field: keyof Block, value: string | boolean) => {
    setBlocks(blocks =>
      blocks.map((block, i) =>
        i === index ? { ...block, [field]: value } : block
      )
    );
  };

  // Drag and drop
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(blocks);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setBlocks(reordered);
  };

  // Salvar template
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Enviar title e content de cada bloco
      const payload = { 
        name, 
        description, 
        blocks: blocks.map(b => ({ 
          title: b.title, 
          content: b.content, 
          page_break_before: !!b.page_break_before 
        })) 
      };
      if (id) {
        await api.put(`/api/templates/${id}`, payload);
        navigate('/templates');
      } else {
        const res = await api.post('/api/templates', payload);
        navigate(`/templates/${res.data.template_id}/edit`);
        return;
      }
    } catch (e) {
      setError('Erro ao salvar template.');
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    if (activeBlockIndex !== null) {
      const currentContent = blocks[activeBlockIndex].content;
      updateBlock(activeBlockIndex, 'content', currentContent + placeholder);
    }
  };

  if (user?.role === 'viewer') {
    return <div className="p-8 text-center text-red-600 dark:text-red-400">Acesso restrito a administradores e managers.</div>;
  }

  if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {id ? 'Editar Template' : 'Novo Template'}
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Nome</label>
            <input
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do template"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Descrição</label>
            <input
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição breve"
            />
          </div>

          <div className="mb-6">
            {/* Galeria de imagens do template (apenas em modo edição) */}
            {id && <ImageGallery templateId={Number(id)} />}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Blocos de Markdown</span>
              <div className="flex items-center space-x-3">
                <PlaceholderSelector onInsert={insertPlaceholder} />
                <button
                  type="button"
                  className="flex items-center bg-primary-600 dark:bg-primary-500 text-white px-3 py-1 rounded hover:bg-primary-700 dark:hover:bg-primary-600"
                  onClick={addBlock}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Bloco
                </button>
              </div>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {blocks.map((block, idx) => (
                      <Draggable key={block.id} draggableId={block.id} index={idx}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className="mb-4 bg-gray-100 dark:bg-gray-700 rounded p-4 shadow flex flex-col border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600 dark:text-gray-300 font-medium">Bloco {idx + 1}</span>
                              <div className="flex items-center space-x-2">
                                <span {...prov.dragHandleProps} className="cursor-move text-gray-400 dark:text-gray-500">☰</span>
                                <PlaceholderSelector onInsert={(placeholder) => {
                                  const currentContent = block.content;
                                  updateBlock(idx, 'content', currentContent + placeholder);
                                }} />
                                <button
                                  type="button"
                                  onClick={() => saveBlockAsFavorite(idx)}
                                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                                  title="Salvar como favorito"
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                  onClick={() => removeBlock(block.id)}
                                  title="Remover bloco"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="w-full" onClick={() => setActiveBlockIndex(idx)}>
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  checked={block.page_break_before || false}
                                  onChange={e => updateBlock(idx, 'page_break_before', e.target.checked)}
                                  className="mr-2"
                                  id={`page-break-${block.id}`}
                                />
                                <label htmlFor={`page-break-${block.id}`} className="text-sm text-gray-700 dark:text-gray-300">Iniciar em nova página</label>
                              </div>
                              <MDEditor
                                value={block.content}
                                onChange={(value) => updateBlock(idx, 'content', value || '')}
                                height={400}
                                preview="live"
                              />
                            </div>
                            {/* Botão para adicionar bloco após este */}
                            <div className="flex justify-center mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  insertBlock(idx);
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
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          

          <button
            type="button"
            className="flex items-center bg-primary-600 dark:bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Template'}
          </button>
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

export default TemplateEditor; 