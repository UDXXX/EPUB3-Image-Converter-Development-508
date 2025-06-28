import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { 
  FiArrowLeft, FiArrowRight, FiBookOpen, FiBook, FiColumns, 
  FiFileText, FiRotateCw, FiEye, FiMove, FiPlus, FiMinus,
  FiChevronUp, FiChevronDown, FiGrid, FiList
} = FiIcons;

const PageLayoutEditor = ({ images, settings, onSettingsChange, onBack, onNext }) => {
  const [selectedPages, setSelectedPages] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'spread', 'single'
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);

  // Initialize page layouts if not exists
  const pageLayouts = settings.pageLayouts || images.map((_, index) => ({
    id: index,
    type: index === 0 ? 'cover' : 'content',
    spread: false,
    readingDirection: settings.pageDirection || 'rtl'
  }));

  const updatePageLayouts = useCallback((layouts) => {
    onSettingsChange(prev => ({
      ...prev,
      pageLayouts: layouts
    }));
  }, [onSettingsChange]);

  const togglePageSpread = useCallback((pageIndex) => {
    const newLayouts = [...pageLayouts];
    newLayouts[pageIndex] = {
      ...newLayouts[pageIndex],
      spread: !newLayouts[pageIndex].spread
    };
    updatePageLayouts(newLayouts);
  }, [pageLayouts, updatePageLayouts]);

  const setPageType = useCallback((pageIndex, type) => {
    const newLayouts = [...pageLayouts];
    newLayouts[pageIndex] = {
      ...newLayouts[pageIndex],
      type
    };
    updatePageLayouts(newLayouts);
  }, [pageLayouts, updatePageLayouts]);

  const bulkSetSpread = useCallback((indices, isSpread) => {
    const newLayouts = [...pageLayouts];
    indices.forEach(index => {
      if (newLayouts[index]) {
        newLayouts[index] = {
          ...newLayouts[index],
          spread: isSpread
        };
      }
    });
    updatePageLayouts(newLayouts);
    setSelectedPages([]);
  }, [pageLayouts, updatePageLayouts]);

  // 見開きペアを正しく生成する関数
  const getSpreadPairs = useCallback(() => {
    const pairs = [];
    const isRTL = settings.pageDirection === 'rtl';
    
    for (let i = 0; i < images.length; i++) {
      const layout = pageLayouts[i];
      
      // 表紙や目次は常に単独
      if (layout.type === 'cover' || layout.type === 'toc' || !layout.spread) {
        pairs.push({
          type: 'single',
          pages: [i],
          isSpread: false
        });
      } else {
        // 見開きページの処理
        if (i + 1 < images.length && pageLayouts[i + 1]?.spread) {
          // 2ページ見開き
          if (isRTL) {
            pairs.push({
              type: 'spread',
              pages: [i + 1, i], // RTLでは右→左の順序
              isSpread: true
            });
          } else {
            pairs.push({
              type: 'spread',
              pages: [i, i + 1], // LTRでは左→右の順序
              isSpread: true
            });
          }
          i++; // 次のページをスキップ
        } else {
          // 単独の見開きページ（ペアがない場合）
          pairs.push({
            type: 'spread-single',
            pages: [i],
            isSpread: true
          });
        }
      }
    }
    
    return pairs;
  }, [pageLayouts, images.length, settings.pageDirection]);

  const spreadPairs = getSpreadPairs();

  const getPageTypeIcon = (type) => {
    switch (type) {
      case 'cover': return FiBook;
      case 'toc': return FiList;
      case 'content': return FiFileText;
      default: return FiFileText;
    }
  };

  const getPageTypeColor = (type) => {
    switch (type) {
      case 'cover': return 'bg-purple-100 border-purple-300';
      case 'toc': return 'bg-blue-100 border-blue-300';
      case 'content': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const togglePageSelection = (index) => {
    setSelectedPages(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // プリセットレイアウト関数
  const applyMangaLayout = () => {
    const newLayouts = pageLayouts.map((layout, index) => {
      // 表紙は単独、本文は見開き（偶数インデックスから開始）、最終ページは単独
      let shouldSpread = false;
      if (index > 0 && index < pageLayouts.length - 1) {
        // 偶数インデックス（1ページ目、3ページ目...）から見開きスタート
        shouldSpread = true;
      }
      
      return {
        ...layout,
        spread: shouldSpread
      };
    });
    updatePageLayouts(newLayouts);
  };

  const applySinglePageLayout = () => {
    const newLayouts = pageLayouts.map((layout) => ({
      ...layout,
      spread: false
    }));
    updatePageLayouts(newLayouts);
  };

  const applyAlternateSpreadLayout = () => {
    const newLayouts = pageLayouts.map((layout, index) => {
      // 奇数インデックス（2ページ目、4ページ目...）を見開きに
      const shouldSpread = index > 0 && index % 2 === 1;
      return {
        ...layout,
        spread: shouldSpread
      };
    });
    updatePageLayouts(newLayouts);
  };

  const handleNext = () => {
    console.log('PageLayoutEditor: Next button clicked');
    if (onNext) {
      onNext();
    }
  };

  const handleBack = () => {
    console.log('PageLayoutEditor: Back button clicked');
    if (onBack) {
      onBack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <SafeIcon icon={FiColumns} className="mr-3 text-primary-600" />
          ページレイアウト設定
        </h2>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* View Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">表示モード</h3>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white border border-gray-300'
                }`}
              >
                <SafeIcon icon={FiGrid} className="mr-1" />
                グリッド表示
              </button>
              <button
                onClick={() => setViewMode('spread')}
                className={`p-2 rounded text-sm ${
                  viewMode === 'spread' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white border border-gray-300'
                }`}
              >
                <SafeIcon icon={FiColumns} className="mr-1" />
                見開きプレビュー
              </button>
              <button
                onClick={() => setViewMode('single')}
                className={`p-2 rounded text-sm ${
                  viewMode === 'single' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white border border-gray-300'
                }`}
              >
                <SafeIcon icon={FiBook} className="mr-1" />
                単ページプレビュー
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              一括操作 ({selectedPages.length}枚選択)
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => bulkSetSpread(selectedPages, true)}
                disabled={selectedPages.length === 0}
                className="w-full p-2 bg-green-500 text-white rounded text-sm disabled:opacity-50"
              >
                見開きに設定
              </button>
              <button
                onClick={() => bulkSetSpread(selectedPages, false)}
                disabled={selectedPages.length === 0}
                className="w-full p-2 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
              >
                単ページに設定
              </button>
            </div>
          </div>

          {/* Page Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">ページ統計</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>総ページ数:</span>
                <span className="font-medium">{images.length}</span>
              </div>
              <div className="flex justify-between">
                <span>見開きページ:</span>
                <span className="font-medium text-green-600">
                  {pageLayouts.filter(p => p.spread).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>単ページ:</span>
                <span className="font-medium text-blue-600">
                  {pageLayouts.filter(p => !p.spread).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>見開きペア:</span>
                <span className="font-medium text-purple-600">
                  {spreadPairs.filter(p => p.type === 'spread').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spread Preview */}
        {viewMode === 'spread' && spreadPairs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                見開きプレビュー ({spreadPairs[currentSpreadIndex]?.type})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - 1))}
                  disabled={currentSpreadIndex === 0}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <SafeIcon icon={FiChevronUp} />
                </button>
                <span className="text-sm text-gray-600">
                  {currentSpreadIndex + 1} / {spreadPairs.length}
                </span>
                <button
                  onClick={() => setCurrentSpreadIndex(Math.min(spreadPairs.length - 1, currentSpreadIndex + 1))}
                  disabled={currentSpreadIndex === spreadPairs.length - 1}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <SafeIcon icon={FiChevronDown} />
                </button>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-6">
              <div className="flex justify-center">
                {spreadPairs[currentSpreadIndex] && (
                  <div className="flex justify-center items-center space-x-2 max-w-6xl">
                    {spreadPairs[currentSpreadIndex].pages.map((pageIndex, pairIndex) => {
                      const image = images[pageIndex];
                      const layout = pageLayouts[pageIndex];
                      
                      return (
                        <motion.div
                          key={pageIndex}
                          layoutId={`preview-${pageIndex}`}
                          className={`relative ${
                            spreadPairs[currentSpreadIndex].type === 'spread' 
                              ? 'w-80' 
                              : 'w-96'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`Page ${pageIndex + 1}`}
                            className="w-full h-auto rounded shadow-lg border-2 border-gray-300"
                          />
                          
                          {/* Page Number */}
                          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {pageIndex + 1}
                          </div>
                          
                          {/* Layout Type */}
                          <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
                            layout.spread ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                          }`}>
                            {layout.spread ? '見開き' : '単ページ'}
                          </div>
                          
                          {/* Page Type */}
                          <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                            {layout.type === 'cover' ? '表紙' : 
                             layout.type === 'toc' ? '目次' : '本文'}
                          </div>
                          
                          {/* Reading Direction Indicator for Spread */}
                          {spreadPairs[currentSpreadIndex].type === 'spread' && (
                            <div className="absolute bottom-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                              {pairIndex === 0 ? 
                                (settings.pageDirection === 'rtl' ? '右' : '左') :
                                (settings.pageDirection === 'rtl' ? '左' : '右')
                              }
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Spread Info */}
              <div className="mt-4 text-center text-sm text-gray-600">
                {spreadPairs[currentSpreadIndex]?.type === 'spread' && (
                  <p>
                    見開き表示 - 読み方向: {settings.pageDirection === 'rtl' ? '右から左' : '左から右'}
                  </p>
                )}
                {spreadPairs[currentSpreadIndex]?.type === 'single' && (
                  <p>単ページ表示</p>
                )}
                {spreadPairs[currentSpreadIndex]?.type === 'spread-single' && (
                  <p>見開き設定の単独ページ（ペアなし）</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Single Page Preview */}
        {viewMode === 'single' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">単ページプレビュー</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - 1))}
                  disabled={currentSpreadIndex === 0}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <SafeIcon icon={FiChevronUp} />
                </button>
                <span className="text-sm text-gray-600">
                  {currentSpreadIndex + 1} / {images.length}
                </span>
                <button
                  onClick={() => setCurrentSpreadIndex(Math.min(images.length - 1, currentSpreadIndex + 1))}
                  disabled={currentSpreadIndex === images.length - 1}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <SafeIcon icon={FiChevronDown} />
                </button>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 flex justify-center">
              <div className="relative w-96">
                <img
                  src={images[currentSpreadIndex]?.url}
                  alt={`Page ${currentSpreadIndex + 1}`}
                  className="w-full h-auto rounded shadow-lg border-2 border-gray-300"
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {currentSpreadIndex + 1}
                </div>
                <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
                  pageLayouts[currentSpreadIndex]?.spread ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {pageLayouts[currentSpreadIndex]?.spread ? '見開き' : '単ページ'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Grid */}
        {viewMode === 'grid' && (
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-800">ページ設定</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {images.map((image, index) => {
                const layout = pageLayouts[index];
                const isSelected = selectedPages.includes(index);
                
                return (
                  <motion.div
                    key={image.id}
                    layout
                    className={`relative bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary-500 ring-2 ring-primary-200' 
                        : layout.spread 
                          ? 'border-green-400' 
                          : 'border-gray-300'
                    } ${getPageTypeColor(layout.type)}`}
                    onClick={() => togglePageSelection(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-1 left-1 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePageSelection(index)}
                        className="w-4 h-4"
                      />
                    </div>

                    {/* Page Number */}
                    <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded z-10">
                      {index + 1}
                    </div>

                    {/* Page Type Icon */}
                    <div className="absolute bottom-1 left-1 z-10">
                      <SafeIcon 
                        icon={getPageTypeIcon(layout.type)} 
                        className="text-gray-600"
                      />
                    </div>

                    {/* Spread Indicator */}
                    <div className={`absolute bottom-1 right-1 text-xs px-1 py-0.5 rounded z-10 ${
                      layout.spread 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {layout.spread ? '見開' : '単'}
                    </div>

                    {/* Image */}
                    <img
                      src={image.url}
                      alt={`Page ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />

                    {/* Action Buttons */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePageSpread(index);
                          }}
                          className="p-1 bg-white rounded text-xs"
                          title={layout.spread ? '単ページに変更' : '見開きに変更'}
                        >
                          <SafeIcon icon={layout.spread ? FiBook : FiColumns} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Page Type Settings */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-gray-800">ページタイプ設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['cover', 'toc', 'content'].map(type => (
              <div key={type} className={`p-4 rounded-lg border-2 ${getPageTypeColor(type)}`}>
                <div className="flex items-center mb-2">
                  <SafeIcon icon={getPageTypeIcon(type)} className="mr-2" />
                  <span className="font-medium">
                    {type === 'cover' ? '表紙' : type === 'toc' ? '目次' : '本文'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {pageLayouts.filter(p => p.type === type).length}ページ
                </div>
                <button
                  onClick={() => {
                    selectedPages.forEach(index => setPageType(index, type));
                    setSelectedPages([]);
                  }}
                  disabled={selectedPages.length === 0}
                  className="mt-2 w-full p-2 bg-gray-500 text-white rounded text-sm disabled:opacity-50"
                >
                  選択ページに適用
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preset Layouts */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-gray-800">プリセットレイアウト</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={applyMangaLayout}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-medium">漫画スタイル</div>
              <div className="text-sm text-gray-600">
                表紙単独、本文全て見開き
              </div>
            </button>
            <button
              onClick={applyAlternateSpreadLayout}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-medium">交互見開き</div>
              <div className="text-sm text-gray-600">
                偶数ページを見開きに設定
              </div>
            </button>
            <button
              onClick={applySinglePageLayout}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-medium">単ページのみ</div>
              <div className="text-sm text-gray-600">
                全てのページを単ページ表示
              </div>
            </button>
          </div>
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
            次へ進む
            <SafeIcon icon={FiArrowRight} className="ml-2" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PageLayoutEditor;