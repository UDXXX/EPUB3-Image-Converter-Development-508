import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { generateEpub } from '../utils/epubGenerator';
import EpubViewer from './EpubViewer';

const { 
  FiArrowLeft, FiDownload, FiLoader, FiCheckCircle, FiAlertCircle, 
  FiEye, FiBook, FiSettings, FiFileText
} = FiIcons;

const EpubGenerator = ({ images, settings, onBack, isGenerating, setIsGenerating }) => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [showViewer, setShowViewer] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError('');
      setProgress(0);

      const blob = await generateEpub(images, settings, (progressValue) => {
        setProgress(progressValue);
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(100);
    } catch (err) {
      console.error('EPUB generation failed:', err);
      setError('EPUB生成中にエラーが発生しました: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${settings.title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}.epub`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetGeneration = () => {
    setDownloadUrl(null);
    setError('');
    setProgress(0);
  };

  const getSelectedSize = () => {
    const bookSizes = {
      'kindle-standard': { width: 600, height: 800, name: 'Kindle標準' },
      'kindle-large': { width: 758, height: 1024, name: 'Kindle大型' },
      'kindle-paperwhite': { width: 758, height: 1024, name: 'Kindle Paperwhite' },
      'ipad-standard': { width: 768, height: 1024, name: 'iPad標準' },
      'mobile-friendly': { width: 480, height: 640, name: 'モバイル最適' },
      'custom': { 
        width: settings.customWidth || 600, 
        height: settings.customHeight || 800, 
        name: 'カスタム' 
      }
    };
    return bookSizes[settings.bookSize] || bookSizes['kindle-standard'];
  };

  const selectedSize = getSelectedSize();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <SafeIcon icon={FiBook} className="mr-3 text-primary-600" />
          EPUB3生成
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <SafeIcon icon={FiSettings} className="mr-2" />
              生成概要
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">タイトル:</span>
                <span className="font-medium text-right">{settings.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">著者:</span>
                <span className="font-medium">{settings.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">画像数:</span>
                <span className="font-medium">{images.length}枚</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">言語:</span>
                <span className="font-medium">{settings.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">書籍サイズ:</span>
                <span className="font-medium">{selectedSize.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">解像度:</span>
                <span className="font-medium">{selectedSize.width} × {selectedSize.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ページ方向:</span>
                <span className="font-medium">
                  {settings.pageDirection === 'rtl' ? '右から左' : '左から右'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">出版社:</span>
                <span className="font-medium">{settings.publisher}</span>
              </div>
              {settings.enableToc && (
                <div className="flex justify-between">
                  <span className="text-gray-600">目次:</span>
                  <span className="font-medium">{settings.chapters?.length || 0}章</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview & Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <SafeIcon icon={FiEye} className="mr-2" />
              プレビュー & アクション
            </h3>
            
            {/* Preview Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowViewer(true)}
              className="w-full p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
            >
              <SafeIcon icon={FiEye} className="text-2xl text-primary-500 mx-auto mb-2" />
              <div className="font-medium text-gray-800 group-hover:text-primary-600">
                書籍をプレビュー
              </div>
              <div className="text-sm text-gray-500">
                生成前に内容を確認
              </div>
            </motion.button>

            {/* File Size Estimate */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">推定ファイルサイズ</h4>
              <div className="text-sm text-blue-700">
                約 {Math.round((images.reduce((acc, img) => acc + img.size, 0) * 0.8) / 1024 / 1024)} MB
              </div>
              <div className="text-xs text-blue-600 mt-1">
                ※ 圧縮により実際のサイズは小さくなります
              </div>
            </div>

            {/* Chapter Summary */}
            {settings.enableToc && settings.chapters?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2 flex items-center">
                  <SafeIcon icon={FiFileText} className="mr-2" />
                  目次構成
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {settings.chapters.map((chapter, index) => (
                    <div key={chapter.id} className="text-sm text-green-700 flex justify-between">
                      <span>{chapter.title}</span>
                      <span>p.{chapter.pageNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generation Status */}
        {!downloadUrl && !isGenerating && !error && (
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              設定内容を確認して、EPUB3ファイルを生成してください。
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              EPUB3を生成
            </motion.button>
          </div>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <SafeIcon icon={FiLoader} className="text-2xl text-primary-500 animate-spin mr-3" />
              <span className="text-lg font-medium text-gray-700">
                EPUB3を生成中... ({Math.round(progress)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-primary-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-sm text-gray-500 mt-2 text-center">
              {progress < 20 && "ファイル構造を作成中..."}
              {progress >= 20 && progress < 60 && "画像を処理中..."}
              {progress >= 60 && progress < 90 && "メタデータを生成中..."}
              {progress >= 90 && "最終処理中..."}
            </div>
          </div>
        )}

        {/* Success */}
        {downloadUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-6"
          >
            <SafeIcon icon={FiCheckCircle} className="text-5xl text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              EPUB3生成完了！
            </h3>
            <p className="text-gray-600 mb-6">
              ファイルをダウンロードして電子書籍リーダーで開いてください。
            </p>
            <div className="flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowViewer(true)}
                className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <SafeIcon icon={FiEye} className="mr-2" />
                プレビュー
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <SafeIcon icon={FiDownload} className="mr-2" />
                ダウンロード
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGeneration}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                再生成
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
          >
            <SafeIcon icon={FiAlertCircle} className="text-red-500 mr-3 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">エラーが発生しました</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGeneration}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                再試行
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            disabled={isGenerating}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SafeIcon icon={FiArrowLeft} className="mr-2" />
            戻る
          </motion.button>
        </div>
      </div>

      {/* EPUB Viewer */}
      <EpubViewer
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        images={images}
        settings={settings}
      />
    </motion.div>
  );
};

export default EpubGenerator;