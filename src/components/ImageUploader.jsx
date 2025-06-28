import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiUpload, FiImage, FiAlertCircle, FiInfo } = FiIcons;

const ImageUploader = ({ onImagesUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(async (files) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      setError('画像ファイルを選択してください');
      return;
    }

    if (imageFiles.length > 500) {
      setError('一度にアップロードできる画像は500枚までです');
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    const imagePromises = imageFiles.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `${Date.now()}-${index}`,
            file,
            name: file.name,
            url: e.target.result,
            size: file.size,
            type: file.type
          });
          setUploadProgress(((index + 1) / imageFiles.length) * 100);
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const images = await Promise.all(imagePromises);
      // Sort by filename for consistent ordering
      images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      onImagesUpload(images);
    } catch (err) {
      setError('画像の読み込み中にエラーが発生しました');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onImagesUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    processFiles(files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <motion.div
          animate={{ scale: isDragOver ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <SafeIcon icon={FiUpload} className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            画像をドラッグ&ドロップ
          </h3>
          <p className="text-gray-500 mb-4">
            または<span className="text-primary-500 font-medium">クリックして選択</span>
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center">
              <SafeIcon icon={FiImage} className="mr-1" />
              JPG, PNG, GIF, WebP
            </div>
            <div>最大500枚</div>
          </div>
        </motion.div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center mb-2">
            <SafeIcon icon={FiInfo} className="text-blue-500 mr-2" />
            <span className="text-blue-700 font-medium">
              画像を読み込み中... ({Math.round(uploadProgress)}%)
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
      >
        <h4 className="font-medium text-gray-800 mb-2">📝 アップロードのコツ</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• ファイル名に番号を含めると自動的に順序が整理されます</li>
          <li>• 高解像度の画像でもKindleサイズに最適化されます</li>
          <li>• 一度に大量の画像をアップロードできます（最大500枚）</li>
          <li>• ドラッグ&ドロップで後から順序を変更できます</li>
        </ul>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
        >
          <SafeIcon icon={FiAlertCircle} className="text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ImageUploader;