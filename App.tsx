
import React, { useState, useCallback, useRef } from 'react';
import { ImageFile, ImageFormat } from './types';
import { analyzeImage } from './services/gemini';

// --- Components ---

const Header = () => (
  <header className="py-12 px-4 flex flex-col items-center justify-center text-center">
    <div className="mb-4 flex items-center space-x-3">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight text-white">Pixel<span className="gradient-text">Morph</span></h1>
    </div>
    <p className="text-slate-400 max-w-lg mx-auto text-lg">
      Convierte cualquier imagen a <span className="text-blue-400 font-semibold">WebP</span> con optimización de IA para SEO y rendimiento.
    </p>
  </header>
);

const ImageUploader = ({ onFilesSelected }: { onFilesSelected: (files: FileList) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) onFilesSelected(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative cursor-pointer transition-all duration-500 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center p-16 w-full max-w-3xl mx-auto glass ${
        isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-slate-700 hover:border-slate-500 hover:bg-white/5'
      }`}
    >
      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onFilesSelected(e.target.files)} className="hidden" multiple accept="image/*" />
      <div className={`p-6 rounded-3xl mb-6 transition-all duration-500 ${isDragging ? 'bg-blue-500 shadow-lg shadow-blue-500/40 rotate-12' : 'bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isDragging ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-slate-100 mb-2">Suelte sus imágenes aquí</h3>
      <p className="text-slate-400 text-center">PNG, JPG, HEIC o GIF — Se convertirán instantáneamente a <span className="text-blue-400 font-bold">WebP</span></p>
    </div>
  );
};

const ConversionItem = ({ image, onRemove, onUpdateOptions }: { image: ImageFile, onRemove: (id: string) => void, onUpdateOptions: (id: string, opts: any) => void }) => (
  <div className="glass rounded-3xl p-5 flex flex-col md:flex-row items-center gap-6 transition-all duration-300 hover:border-white/20">
    <div className="relative w-32 h-32 flex-shrink-0 group">
      <img src={image.preview} alt="Preview" className="w-full h-full object-cover rounded-2xl border border-slate-700 group-hover:scale-105 transition-transform duration-500" />
      {image.status === 'completed' && (
        <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-2 shadow-xl ring-4 ring-slate-900">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
           </svg>
        </div>
      )}
    </div>

    <div className="flex-grow w-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-slate-100 font-bold truncate max-w-[200px] md:max-w-md">
            {image.aiName ? `${image.aiName}.webp` : image.file.name}
          </h4>
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest bg-slate-800 px-2 py-0.5 rounded">
            {image.file.type.split('/')[1] || 'img'} → WEBP
          </span>
        </div>
        <button onClick={() => onRemove(image.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {image.status === 'pending' ? (
        <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Calidad WebP</span>
            <span className="text-sm text-blue-400 font-mono font-bold">{Math.round(image.quality * 100)}%</span>
          </div>
          <input 
            type="range" min="0.1" max="1.0" step="0.1" value={image.quality}
            onChange={(e) => onUpdateOptions(image.id, { quality: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      ) : image.status === 'converting' ? (
        <div className="animate-pulse space-y-3">
          <div className="h-1.5 bg-slate-800 w-full rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-2/3 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
          </div>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">IA Analizando y Optimizando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {image.aiCaption && (
            <p className="text-[11px] text-slate-400 italic bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
              <span className="text-blue-500 font-bold not-italic mr-1">AI:</span> "{image.aiCaption}"
            </p>
          )}
          <a 
            href={image.resultUrl} 
            download={image.aiName ? `${image.aiName}.webp` : `pixelmorph_${image.id}.webp`}
            className="flex items-center justify-center space-x-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Descargar WebP</span>
          </a>
        </div>
      )}
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFilesSelected = (files: FileList) => {
    const newImages: ImageFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      targetFormat: ImageFormat.WEBP,
      quality: 0.85,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const updateOptions = (id: string, options: any) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...options } : img));
  };

  const convertToWebP = async (img: ImageFile): Promise<ImageFile> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const imgObj = new Image();
        imgObj.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = imgObj.width;
          canvas.height = imgObj.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(imgObj, 0, 0);
          
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const resultUrl = URL.createObjectURL(blob);
            const base64 = dataUrl.split(',')[1];
            const aiData = await analyzeImage(base64, img.file.type);
            resolve({ ...img, status: 'completed', resultUrl, aiName: aiData.suggestedName, aiCaption: aiData.caption });
          }, 'image/webp', img.quality);
        };
        imgObj.src = dataUrl;
      };
      reader.readAsDataURL(img.file);
    });
  };

  const processAll = async () => {
    setIsProcessing(true);
    const pending = images.filter(img => img.status === 'pending');
    setImages(prev => prev.map(img => img.status === 'pending' ? { ...img, status: 'converting' } : img));
    for (const img of pending) {
      const done = await convertToWebP(img);
      setImages(prev => prev.map(i => i.id === done.id ? done : i));
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <main className="max-w-4xl mx-auto px-6 space-y-12">
        <ImageUploader onFilesSelected={onFilesSelected} />

        {images.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                Cola de Conversión
                <span className="bg-blue-600/20 text-blue-400 text-xs px-3 py-1 rounded-full font-black border border-blue-500/30">
                  {images.length}
                </span>
              </h2>
              <div className="flex gap-4">
                <button onClick={() => setImages([])} className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest">Limpiar todo</button>
                {images.some(i => i.status === 'pending') && (
                  <button 
                    onClick={processAll} disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-[0.15em] px-8 py-3 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                  >
                    {isProcessing ? <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full"></div> : null}
                    Convertir a WebP
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              {images.map(img => (
                <ConversionItem key={img.id} image={img} onRemove={removeImage} onUpdateOptions={updateOptions} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 p-5 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Las imágenes se procesan <span className="text-blue-400">localmente</span> en su navegador. Privacidad garantizada.
              </p>
              <div className="flex items-center space-x-6">
                  <div className="text-right">
                      <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black block leading-none mb-1">Status de IA</span>
                      <span className="text-xs text-blue-400 font-bold flex items-center justify-end">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-ping"></span>
                          Gemini 3 Flash
                      </span>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
}
