
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ConversionItem from './components/ConversionItem';
import { ImageFile, ImageFormat } from './types';
import { analyzeImage } from './services/gemini';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFilesSelected = useCallback((files: FileList) => {
    const newImages: ImageFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      targetFormat: ImageFormat.WEBP, // Hardcoded to WebP
      quality: 0.8,
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const target = prev.find(img => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
      }
      return filtered;
    });
  };

  const updateOptions = (id: string, options: { targetFormat?: ImageFormat; quality?: number }) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...options } : img));
  };

  const convertToWebP = async (img: ImageFile): Promise<ImageFile> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const imageObj = new Image();
        
        imageObj.onload = async () => {
          canvas.width = imageObj.width;
          canvas.height = imageObj.height;
          ctx?.drawImage(imageObj, 0, 0);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const resultUrl = URL.createObjectURL(blob);
              const base64Data = dataUrl.split(',')[1];
              const aiData = await analyzeImage(base64Data, img.file.type);

              resolve({
                ...img,
                status: 'completed',
                resultUrl,
                aiName: aiData.suggestedName,
                aiCaption: aiData.caption
              });
            }
          }, 'image/webp', img.quality);
        };
        imageObj.src = dataUrl;
      };
      reader.readAsDataURL(img.file);
    });
  };

  const processAll = async () => {
    setIsProcessing(true);
    const pendingImages = images.filter(img => img.status === 'pending');
    
    setImages(prev => prev.map(img => img.status === 'pending' ? { ...img, status: 'converting' } : img));

    for (const img of pendingImages) {
      const completedImg = await convertToWebP(img);
      setImages(prev => prev.map(i => i.id === completedImg.id ? completedImg : i));
    }

    setIsProcessing(false);
  };

  const clearCompleted = () => {
    setImages(prev => {
        prev.forEach(img => {
            if (img.status === 'completed') {
                URL.revokeObjectURL(img.preview);
                if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
            }
        });
        return prev.filter(img => img.status !== 'completed');
    });
  };

  const pendingCount = images.filter(img => img.status === 'pending').length;

  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 space-y-8">
        <ImageUploader onFilesSelected={onFilesSelected} />

        {images.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center space-x-2">
                <span>WebP Queue</span>
                <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-mono border border-blue-500/30">
                    {images.length}
                </span>
              </h2>
              <div className="flex space-x-3">
                 <button 
                  onClick={clearCompleted}
                  className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
                >
                  Clear Completed
                </button>
                {pendingCount > 0 && (
                    <button 
                        onClick={processAll}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center space-x-2"
                    >
                        {isProcessing ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : null}
                        <span>Convert All to WebP</span>
                    </button>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {images.map(img => (
                <ConversionItem 
                  key={img.id} 
                  image={img} 
                  onRemove={removeImage}
                  onUpdateOptions={updateOptions}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 p-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="hidden sm:block">
                  <p className="text-sm text-slate-400">
                      Private processing. Images are converted directly in your browser to <span className="text-blue-400 font-medium">WebP</span>.
                  </p>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="text-right flex-grow sm:flex-grow-0">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block leading-tight">Gemini Vision AI</span>
                      <span className="text-xs text-blue-400 font-medium flex items-center justify-end">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                          Active
                      </span>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default App;
