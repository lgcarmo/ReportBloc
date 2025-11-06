import React, { useRef, useState } from 'react';
import { imagesAPI } from '../services/api';
import { Upload, Clipboard, Check, Trash2, Copy, Download } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface ImageGalleryProps {
  templateId: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ templateId }) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchImages();
  }, [templateId]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await imagesAPI.list(templateId);
      setImages(Array.isArray(res.data) ? res.data : (res.data as any).images || []);
    } catch (e) {
      setError('Erro ao carregar imagens.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let uploadedCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        await imagesAPI.upload(formData, templateId);
        uploadedCount++;
      }
      
      setSuccess(`${uploadedCount} imagem${uploadedCount > 1 ? 'ns' : ''} enviada${uploadedCount > 1 ? 's' : ''} com sucesso!`);
      fetchImages();
    } catch (e) {
      setError('Erro ao enviar imagem(s).');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (img: string) => {
    const url = `${API_BASE_URL}${img}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const handleDelete = async (img: string) => {
    if (!window.confirm('Tem certeza que deseja apagar esta imagem?')) return;
    const filename = img.split('/').pop();
    if (!filename) return;
    setLoading(true);
    setError(null);
    try {
      await imagesAPI.delete(filename, templateId);
      setSuccess('Imagem apagada com sucesso!');
      fetchImages();
    } catch (e) {
      setError('Erro ao apagar imagem.');
    } finally {
      setLoading(false);
    }
  };

  // Funções para seleção múltipla
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedImages(new Set());
      setSelectAll(false);
    } else {
      setSelectedImages(new Set(images));
      setSelectAll(true);
    }
  };

  const toggleImageSelection = (img: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(img)) {
      newSelected.delete(img);
    } else {
      newSelected.add(img);
    }
    setSelectedImages(newSelected);
    setSelectAll(newSelected.size === images.length);
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    
    const confirmMessage = selectedImages.size === 1 
      ? 'Tem certeza que deseja apagar esta imagem?' 
      : `Tem certeza que deseja apagar ${selectedImages.size} imagens?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let deletedCount = 0;
      for (const img of Array.from(selectedImages)) {
        const filename = img.split('/').pop();
        if (filename) {
          await imagesAPI.delete(filename, templateId);
          deletedCount++;
        }
      }
      
      setSuccess(`${deletedCount} imagem${deletedCount > 1 ? 'ns' : ''} apagada${deletedCount > 1 ? 's' : ''} com sucesso!`);
      setSelectedImages(new Set());
      setSelectAll(false);
      fetchImages();
    } catch (e) {
      setError('Erro ao apagar imagens selecionadas.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCopyUrls = () => {
    if (selectedImages.size === 0) return;
    
    const urls = Array.from(selectedImages).map(img => `${API_BASE_URL}${img}`);
    const urlsText = urls.join('\n');
    
    navigator.clipboard.writeText(urlsText);
    setCopiedUrl('multiple');
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const selectedCount = selectedImages.size;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Repositório de Imagens</h2>
      
      {/* Barra de ações */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
        />
        <button
          type="button"
          className="flex items-center bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-5 w-5 mr-2" />
          {uploading ? 'Enviando...' : 'Enviar Imagens'}
        </button>
        
        {/* Ações em lote */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedCount} selecionada{selectedCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleBulkCopyUrls}
              className="flex items-center text-sm bg-blue-200 px-3 py-1 rounded hover:bg-blue-300 text-blue-800"
              title="Copiar URLs das imagens selecionadas"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar URLs
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center text-sm bg-red-200 px-3 py-1 rounded hover:bg-red-300 text-red-800"
              title="Apagar imagens selecionadas"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Apagar Selecionadas
            </button>
          </div>
        )}
        
        {error && <span className="text-red-600">{error}</span>}
        {success && <span className="text-green-600">{success}</span>}
        {copiedUrl === 'multiple' && <span className="text-green-600">URLs copiadas!</span>}
      </div>

      {loading ? (
        <div>Carregando imagens...</div>
      ) : (
        <div>
          {/* Cabeçalho com checkbox "Selecionar todas" */}
          {images.length > 0 && (
            <div className="mb-3 flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Selecionar todas ({images.length})
                </span>
              </label>
            </div>
          )}
          
          {/* Grid de imagens */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.length === 0 && (
              <div className="col-span-4 text-gray-500 text-center py-8">
                Nenhuma imagem enviada ainda.
              </div>
            )}
            {images.map((img) => {
              const url = `${API_BASE_URL}${img}`;
              const isSelected = selectedImages.has(img);
              
              return (
                <div 
                  key={img} 
                  className={`border rounded p-2 flex flex-col items-center bg-gray-50 transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  {/* Checkbox de seleção */}
                  <div className="w-full flex justify-end mb-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleImageSelection(img)}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  {/* Imagem */}
                  <img 
                    src={url} 
                    alt={img} 
                    className="w-24 h-24 object-contain mb-2 cursor-pointer"
                    onClick={() => toggleImageSelection(img)}
                    title="Clique para selecionar"
                  />
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <button
                      className="flex items-center text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                      onClick={() => handleCopyUrl(img)}
                      title="Copiar URL desta imagem"
                    >
                      {copiedUrl === url ? (
                        <Check className="h-4 w-4 mr-1 text-green-600" />
                      ) : (
                        <Clipboard className="h-4 w-4 mr-1" />
                      )}
                      {copiedUrl === url ? 'Copiado!' : 'URL'}
                    </button>
                    <button
                      className="flex items-center text-sm bg-red-200 px-2 py-1 rounded hover:bg-red-400 text-red-800"
                      onClick={() => handleDelete(img)}
                      title="Apagar esta imagem"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Apagar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery; 