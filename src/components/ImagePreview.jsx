import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiX, FiMove, FiEye } = FiIcons;

const ImagePreview = ({ images, onImageRemove, onImageReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onImageReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          アップロード画像 ({images.length}枚)
        </h2>
        <p className="text-gray-600">
          ドラッグして順序を変更できます
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <AnimatePresence>
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              className={`relative bg-white rounded-lg shadow-md overflow-hidden cursor-move ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Page Number */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10">
                {index + 1}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex space-x-1 z-10">
                <button
                  onClick={() => setPreviewImage(image)}
                  className="bg-black bg-opacity-70 text-white p-1 rounded hover:bg-opacity-90 transition-opacity"
                >
                  <SafeIcon icon={FiEye} className="text-sm" />
                </button>
                <button
                  onClick={() => onImageRemove(index)}
                  className="bg-red-500 bg-opacity-70 text-white p-1 rounded hover:bg-opacity-90 transition-opacity"
                >
                  <SafeIcon icon={FiX} className="text-sm" />
                </button>
              </div>

              {/* Drag Handle */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded">
                <SafeIcon icon={FiMove} className="text-sm" />
              </div>

              {/* Image */}
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-32 object-cover"
              />

              {/* Image Info */}
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate" title={image.name}>
                  {image.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(image.size)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-opacity z-10"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded">
                <p className="font-medium">{previewImage.name}</p>
                <p className="text-sm opacity-80">{formatFileSize(previewImage.size)}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ImagePreview;