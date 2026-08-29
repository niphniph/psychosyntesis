import React, { useState, useEffect } from 'react';
import api from '../api';
import { Image as ImageIcon, Upload, X, Check, Search, Trash2 } from 'lucide-react';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  altText?: string;
  createdAt: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string, altText?: string) => void;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage
}) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedAlt, setSelectedAlt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/media');
      if (res.data && Array.isArray(res.data)) setMediaList(res.data);
    } catch (err) {
      console.error('Error fetching media list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        setMediaList(prev => Array.isArray(prev) ? [res.data, ...prev] : [res.data]);
        setSelectedUrl(res.data.url);
        setSelectedAlt(res.data.altText || '');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this media item?')) return;
    try {
      await api.delete(`/admin/media/${id}`);
      setMediaList(prev => Array.isArray(prev) ? prev.filter(m => m.id !== id) : []);
      if (selectedUrl === (Array.isArray(mediaList) ? mediaList.find(m => m.id === id)?.url : undefined)) {
        setSelectedUrl(null);
      }
    } catch (err) {
      console.error('Failed to delete media item', err);
    }
  };

  if (!isOpen) return null;

  const filteredMedia = mediaList.filter(m => 
    m.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.altText && m.altText.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b251c] border border-[#c7a85b]/30 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#c7a85b]/20 flex justify-between items-center bg-[#00241a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c7a85b]/20 text-[#c7a85b] rounded-xl flex items-center justify-center">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display-lg">Media Library</h3>
              <p className="text-xs text-[#a4d0be]">Select or upload images for your content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input
                type="text"
                placeholder="Search images by filename or alt text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#00241a] border border-[#c7a85b]/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#c7a85b]"
              />
            </div>

            {/* Upload Button */}
            <label className="bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg">
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Upload New Image'}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-xs text-red-300 font-bold">
              {errorMsg}
            </div>
          )}

          {/* Media Grid */}
          {loading ? (
            <div className="py-20 text-center text-[#a4d0be] text-xs font-bold animate-pulse">
              Loading Media Library...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-2xl p-8 space-y-3">
              <ImageIcon size={36} className="mx-auto text-white/20" />
              <p className="text-sm font-bold text-white/60">No images found</p>
              <p className="text-xs text-[#a4d0be]/60">Upload an image to start using it in your content</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMedia.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedUrl(item.url);
                      setSelectedAlt(item.altText || '');
                    }}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#c7a85b] ring-4 ring-[#c7a85b]/30 scale-[0.98]'
                        : 'border-white/10 hover:border-[#c7a85b]/50'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.altText || item.filename}
                      className="w-full h-full object-cover"
                    />

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#c7a85b] text-[#00241a] p-1 rounded-full shadow-lg">
                        <Check size={14} />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-left">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Delete image"
                          className="bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div>
                        <p className="text-[10px] text-white font-bold truncate">{item.filename}</p>
                        <p className="text-[9px] text-[#a4d0be]/80">{(item.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#c7a85b]/20 bg-[#00241a] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-[#a4d0be] truncate max-w-md">
            {selectedUrl ? (
              <span className="font-mono text-white/80">Selected: {selectedUrl}</span>
            ) : (
              'Click an image to select it'
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl border border-white/20 text-xs text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!selectedUrl}
              onClick={() => {
                if (selectedUrl) {
                  onSelectImage(selectedUrl, selectedAlt);
                  onClose();
                }
              }}
              className="flex-1 sm:flex-initial bg-[#c7a85b] hover:bg-[#ffdf95] text-[#00241a] font-bold text-xs px-6 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
            >
              Use Selected Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
