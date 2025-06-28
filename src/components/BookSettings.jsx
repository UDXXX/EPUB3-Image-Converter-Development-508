import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { 
  FiArrowLeft, FiArrowRight, FiBook, FiUser, FiGlobe, FiFileText, 
  FiBuilding, FiMonitor, FiInfo, FiImage, FiX, FiSmartphone, FiTablet 
} = FiIcons;

const BookSettings = ({ settings, onSettingsChange, onBack, onNext, images }) => {
  const handleChange = (field, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const languages = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' }
  ];

  const bookSizes = [
    {
      id: 'kindle-standard',
      name: 'Kindle標準 (600×800)',
      width: 600,
      height: 800,
      description: '最も一般的なKindleサイズ'
    },
    {
      id: 'kindle-large',
      name: 'Kindle大型 (758×1024)',
      width: 758,
      height: 1024,
      description: 'Kindle Oasis等の大型端末'
    },
    {
      id: 'kindle-paperwhite',
      name: 'Kindle Paperwhite (758×1024)',
      width: 758,
      height: 1024,
      description: 'Paperwhite推奨サイズ'
    },
    {
      id: 'ipad-standard',
      name: 'iPad標準 (768×1024)',
      width: 768,
      height: 1024,
      description: 'iPad向け最適サイズ'
    },
    {
      id: 'mobile-friendly',
      name: 'モバイル最適 (480×640)',
      width: 480,
      height: 640,
      description: 'スマートフォン向け'
    },
    {
      id: 'custom',
      name: 'カスタム',
      width: settings.customWidth || 600,
      height: settings.customHeight || 800,
      description: '独自サイズを指定'
    }
  ];

  const selectedSize = bookSizes.find(size => size.id === settings.bookSize) || bookSizes[0];

  const removeCover = (type) => {
    handleChange(type, null);
  };

  const handleNext = () => {
    console.log('BookSettings: handleNext called');
    console.log('Settings enableToc:', settings.enableToc);
    if (onNext) {
      onNext();
    }
  };

  const handleBack = () => {
    console.log('BookSettings: handleBack called');
    if (onBack) {
      onBack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <SafeIcon icon={FiBook} className="mr-3 text-primary-600" />
          書籍設定
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">基本情報</h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SafeIcon icon={FiBook} className="mr-2" />
                書籍タイトル
              </label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="書籍のタイトルを入力"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SafeIcon icon={FiUser} className="mr-2" />
                著者名
              </label>
              <input
                type="text"
                value={settings.author}
                onChange={(e) => handleChange('author', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="著者名を入力"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SafeIcon icon={FiFileText} className="mr-2" />
                説明
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="書籍の説明を入力"
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SafeIcon icon={FiBuilding} className="mr-2" />
                出版社
              </label>
              <input
                type="text"
                value={settings.publisher}
                onChange={(e) => handleChange('publisher', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="出版社名を入力"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SafeIcon icon={FiGlobe} className="mr-2" />
                言語
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Middle Column - Cover Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">表紙設定（任意）</h3>
            
            {/* Front Cover */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <SafeIcon icon={FiImage} className="mr-2" />
                表紙
              </label>
              {settings.frontCover ? (
                <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <button
                    onClick={() => removeCover('frontCover')}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <SafeIcon icon={FiX} className="text-sm" />
                  </button>
                  <img
                    src={settings.frontCover.url}
                    alt="Front Cover"
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-sm text-gray-600 mt-2 truncate">{settings.frontCover.name}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {images.map((image, index) => (
                    <motion.button
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChange('frontCover', image)}
                      className="relative bg-gray-50 border-2 border-gray-200 rounded-lg p-2 hover:border-primary-300 transition-colors"
                    >
                      <img
                        src={image.url}
                        alt={`Page ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                画像を選択して表紙に設定
              </p>
            </div>

            {/* Back Cover */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <SafeIcon icon={FiImage} className="mr-2" />
                裏表紙
              </label>
              {settings.backCover ? (
                <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <button
                    onClick={() => removeCover('backCover')}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <SafeIcon icon={FiX} className="text-sm" />
                  </button>
                  <img
                    src={settings.backCover.url}
                    alt="Back Cover"
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-sm text-gray-600 mt-2 truncate">{settings.backCover.name}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {images.map((image, index) => (
                    <motion.button
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChange('backCover', image)}
                      className="relative bg-gray-50 border-2 border-gray-200 rounded-lg p-2 hover:border-primary-300 transition-colors"
                    >
                      <img
                        src={image.url}
                        alt={`Page ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                画像を選択して裏表紙に設定
              </p>
            </div>
          </div>

          {/* Right Column - Display Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">表示設定</h3>
            
            {/* Book Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <SafeIcon icon={FiMonitor} className="mr-2" />
                書籍サイズ
              </label>
              <div className="space-y-3">
                {bookSizes.map(size => (
                  <div key={size.id} className="relative">
                    <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        value={size.id}
                        checked={settings.bookSize === size.id}
                        onChange={(e) => handleChange('bookSize', e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{size.name}</div>
                        <div className="text-sm text-gray-600">{size.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {size.width} × {size.height} px
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Size Input */}
            {settings.bookSize === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    幅 (px)
                  </label>
                  <input
                    type="number"
                    value={settings.customWidth || 600}
                    onChange={(e) => handleChange('customWidth', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="100"
                    max="2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    高さ (px)
                  </label>
                  <input
                    type="number"
                    value={settings.customHeight || 800}
                    onChange={(e) => handleChange('customHeight', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="100"
                    max="2000"
                  />
                </div>
              </motion.div>
            )}

            {/* Page Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ページ方向
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    value="ltr"
                    checked={settings.pageDirection === 'ltr'}
                    onChange={(e) => handleChange('pageDirection', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">左から右 (LTR)</div>
                    <div className="text-sm text-gray-600">一般的な書籍・小説向け</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    value="rtl"
                    checked={settings.pageDirection === 'rtl'}
                    onChange={(e) => handleChange('pageDirection', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">右から左 (RTL)</div>
                    <div className="text-sm text-gray-600">漫画・雑誌向け</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Spread View Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <SafeIcon icon={FiTablet} className="mr-2" />
                見開き表示設定
              </label>
              <div className="space-y-3">
                <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableSpread || false}
                    onChange={(e) => handleChange('enableSpread', e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">見開き表示を有効化</div>
                    <div className="text-sm text-gray-600">横向き時に2ページを並べて表示</div>
                  </div>
                </label>

                {settings.enableSpread && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-6 space-y-2"
                  >
                    <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer transition-colors">
                      <input
                        type="radio"
                        value="auto"
                        checked={settings.spreadMode === 'auto'}
                        onChange={(e) => handleChange('spreadMode', e.target.value)}
                        className="mr-2"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700">自動判定</div>
                        <div className="text-xs text-gray-500">デバイスの向きに応じて自動切替</div>
                      </div>
                    </label>
                    <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer transition-colors">
                      <input
                        type="radio"
                        value="landscape-only"
                        checked={settings.spreadMode === 'landscape-only'}
                        onChange={(e) => handleChange('spreadMode', e.target.value)}
                        className="mr-2"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700">横向きのみ</div>
                        <div className="text-xs text-gray-500">横向き時のみ見開き表示</div>
                      </div>
                    </label>
                    <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer transition-colors">
                      <input
                        type="radio"
                        value="always"
                        checked={settings.spreadMode === 'always'}
                        onChange={(e) => handleChange('spreadMode', e.target.value)}
                        className="mr-2"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700">常に表示</div>
                        <div className="text-xs text-gray-500">画面サイズが十分な場合常に見開き</div>
                      </div>
                    </label>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Enable Table of Contents */}
            <div>
              <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableToc || false}
                  onChange={(e) => handleChange('enableToc', e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-800">目次を生成</div>
                  <div className="text-sm text-gray-600">章の区切りを指定して目次を作成</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Size Preview */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <SafeIcon icon={FiInfo} className="text-gray-500 mr-2" />
            <span className="font-medium text-gray-700">選択中のサイズ</span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedSize.name}</span> - {selectedSize.width} × {selectedSize.height} ピクセル
          </div>
          <div className="text-xs text-gray-500 mt-1">{selectedSize.description}</div>
          
          {settings.enableSpread && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center mb-2">
                <SafeIcon icon={FiSmartphone} className="text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-700">見開き表示設定</span>
              </div>
              <div className="text-xs text-blue-600">
                横向き時: {selectedSize.width * 2} × {selectedSize.height} ピクセル (見開き)
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="mr-2" />
            戻る
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            {settings.enableToc ? '目次設定へ' : 'EPUB生成へ'}
            <SafeIcon icon={FiArrowRight} className="ml-2" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BookSettings;