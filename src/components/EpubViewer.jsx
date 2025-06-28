import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiX, FiChevronLeft, FiChevronRight, FiList, FiZoomIn, FiZoomOut, FiMaximize2, FiMinimize2, FiHome, FiBookmark, FiColumns, FiFileText } = FiIcons;

const EpubViewer = ({ isOpen, onClose, images, settings }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showSpread, setShowSpread] = useState(false);

  const chapters = settings.chapters || [];
  const isRTL = settings.pageDirection === 'rtl';
  const enableSpread = settings.enableSpread || false;
  const spreadMode = settings.spreadMode || 'landscape-only';

  // Check orientation and spread view
  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);

      if (enableSpread) {
        switch (spreadMode) {
          case 'auto':
            setShowSpread(landscape && window.innerWidth >= 768);
            break;
          case 'landscape-only':
            setShowSpread(landscape);
            break;
          case 'always':
            setShowSpread(window.innerWidth >= 768);
            break;
          default:
            setShowSpread(false);
        }
      } else {
        setShowSpread(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [enableSpread, spreadMode]);

  // Keyboard shortcuts
  useHotkeys('left', () => previousPage(), { enabled: isOpen });
  useHotkeys('right', () => nextPage(), { enabled: isOpen });
  useHotkeys('escape', () => onClose(), { enabled: isOpen });
  useHotkeys('f', () => toggleFullscreen(), { enabled: isOpen });
  useHotkeys('t', () => setShowToc(!showToc), { enabled: isOpen });
  useHotkeys('s', () => setShowSpread(!showSpread), { enabled: isOpen && enableSpread });

  const nextPage = useCallback(() => {
    if (showSpread) {
      // 見開き表示時は2ページずつ進む
      if (isRTL) {
        setCurrentPage(prev => Math.max(0, prev - 2));
      } else {
        setCurrentPage(prev => Math.min(images.length - 1, prev + 2));
      }
    } else {
      // 単ページ表示時は1ページずつ進む
      if (isRTL) {
        setCurrentPage(prev => Math.max(0, prev - 1));
      } else {
        setCurrentPage(prev => Math.min(images.length - 1, prev + 1));
      }
    }
  }, [isRTL, images.length, showSpread]);

  const previousPage = useCallback(() => {
    if (showSpread) {
      // 見開き表示時は2ページずつ戻る
      if (isRTL) {
        setCurrentPage(prev => Math.min(images.length - 1, prev + 2));
      } else {
        setCurrentPage(prev => Math.max(0, prev - 2));
      }
    } else {
      // 単ページ表示時は1ページずつ戻る
      if (isRTL) {
        setCurrentPage(prev => Math.min(images.length - 1, prev + 1));
      } else {
        setCurrentPage(prev => Math.max(0, prev - 1));
      }
    }
  }, [isRTL, images.length, showSpread]);

  const goToPage = useCallback((pageIndex) => {
    setCurrentPage(Math.max(0, Math.min(images.length - 1, pageIndex)));
    setShowToc(false);
  }, [images.length]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const adjustZoom = useCallback((delta) => {
    setZoom(prev => Math.max(25, Math.min(500, prev + delta)));
  }, []);

  const toggleSpreadView = useCallback(() => {
    if (enableSpread) {
      setShowSpread(!showSpread);
    }
  }, [enableSpread, showSpread]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentPage];
  const nextImage = showSpread && currentPage + 1 < images.length ? images[currentPage + 1] : null;

  const currentChapter = chapters.find(ch => ch.pageIndex <= currentPage) || null;

  const canGoNext = isRTL 
    ? currentPage > 0 
    : showSpread 
      ? currentPage + 1 < images.length 
      : currentPage < images.length - 1;

  const canGoPrev = isRTL 
    ? showSpread 
      ? currentPage + 1 < images.length 
      : currentPage < images.length - 1 
    : currentPage > 0;

  // 見開き表示用の画像配置ロジック
  const getSpreadImages = () => {
    if (!showSpread) {
      return { leftImage: null, rightImage: currentImage };
    }

    if (isRTL) {
      // 右から左読み: 右ページが現在、左ページが次
      return {
        rightImage: currentImage,
        leftImage: nextImage
      };
    } else {
      // 左から右読み: 左ページが現在、右ページが次
      return {
        leftImage: currentImage,
        rightImage: nextImage
      };
    }
  };

  const { leftImage, rightImage } = getSpreadImages();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
            <div>
              <h3 className="font-semibold">{settings.title}</h3>
              <p className="text-sm text-gray-300">
                {showSpread && nextImage
                  ? `${currentPage + 1}-${currentPage + 2} / ${images.length}`
                  : `${currentPage + 1} / ${images.length}`}
                {currentChapter && ` - ${currentChapter.title}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <button
              onClick={() => adjustZoom(-25)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="縮小 (25%)"
            >
              <SafeIcon icon={FiZoomOut} />
            </button>
            <span className="text-sm px-2">{zoom}%</span>
            <button
              onClick={() => adjustZoom(25)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="拡大 (25%)"
            >
              <SafeIcon icon={FiZoomIn} />
            </button>

            {/* Spread View Toggle */}
            {enableSpread && (
              <button
                onClick={toggleSpreadView}
                className={`p-2 rounded-lg transition-colors ${
                  showSpread ? 'bg-primary-600' : 'hover:bg-gray-700'
                }`}
                title="見開き表示 (S)"
              >
                <SafeIcon icon={FiColumns} />
              </button>
            )}

            {/* Table of Contents */}
            {chapters.length > 0 && (
              <button
                onClick={() => setShowToc(!showToc)}
                className={`p-2 rounded-lg transition-colors ${
                  showToc ? 'bg-primary-600' : 'hover:bg-gray-700'
                }`}
                title="目次 (T)"
              >
                <SafeIcon icon={FiList} />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="全画面 (F)"
            >
              <SafeIcon icon={isFullscreen ? FiMinimize2 : FiMaximize2} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 relative">
          {/* Table of Contents Sidebar */}
          <AnimatePresence>
            {showToc && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 300 }}
                exit={{ width: 0 }}
                className="bg-gray-800 text-white overflow-hidden"
              >
                <div className="p-4 border-b border-gray-700">
                  <h4 className="font-semibold">目次</h4>
                </div>
                <div className="overflow-y-auto">
                  {chapters.map((chapter) => (
                    <motion.button
                      key={chapter.id}
                      whileHover={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
                      onClick={() => goToPage(chapter.pageIndex)}
                      className={`w-full text-left p-4 border-b border-gray-700 hover:bg-blue-600/10 transition-colors ${
                        currentPage >= chapter.pageIndex ? 'text-blue-400' : ''
                      }`}
                    >
                      <div className="font-medium">{chapter.title}</div>
                      <div className="text-sm text-gray-400">ページ {chapter.pageNumber}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
            {/* Navigation Buttons */}
            <button
              onClick={previousPage}
              disabled={!canGoPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
              title={isRTL ? "次のページ (→)" : "前のページ (←)"}
            >
              <SafeIcon icon={FiChevronLeft} className="text-xl" />
            </button>

            <button
              onClick={nextPage}
              disabled={!canGoNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
              title={isRTL ? "前のページ (←)" : "次のページ (→)"}
            >
              <SafeIcon icon={FiChevronRight} className="text-xl" />
            </button>

            {/* Page Images - 見開き対応 */}
            <div className={`flex items-center justify-center h-full w-full ${showSpread ? 'space-x-0' : ''}`}>
              {showSpread ? (
                // 見開き表示: 2枚の画像を左右に配置
                <div className="flex h-full w-full">
                  {/* 左ページ */}
                  <div className="flex-1 flex items-center justify-center">
                    {leftImage && (
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={`left-${leftImage.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          src={leftImage.url}
                          alt={`Left Page`}
                          className="max-w-full max-h-full object-contain"
                          style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'center'
                          }}
                          onClick={nextPage}
                        />
                      </AnimatePresence>
                    )}
                  </div>
                  
                  {/* 中央の境界線 */}
                  <div className="w-px bg-gray-600 opacity-30"></div>
                  
                  {/* 右ページ */}
                  <div className="flex-1 flex items-center justify-center">
                    {rightImage && (
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={`right-${rightImage.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          src={rightImage.url}
                          alt={`Right Page`}
                          className="max-w-full max-h-full object-contain"
                          style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'center'
                          }}
                          onClick={nextPage}
                        />
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              ) : (
                // 単ページ表示
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImage.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    src={currentImage.url}
                    alt={`Page ${currentPage + 1}`}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'center'
                    }}
                    onClick={nextPage}
                  />
                </AnimatePresence>
              )}
            </div>

            {/* Page Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {showSpread && nextImage
                ? `${currentPage + 1}-${currentPage + 2} / ${images.length}`
                : `${currentPage + 1} / ${images.length}`}
              {showSpread && (
                <span className="ml-2 text-green-400">見開き</span>
              )}
            </div>

            {/* Reading Direction Indicator */}
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
              {isRTL ? '右→左' : '左→右'}
              {showSpread && <span className="ml-1 text-green-400">・見開き</span>}
            </div>

            {/* Orientation Indicator */}
            {enableSpread && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                {isLandscape ? '横向き' : '縦向き'}
                {showSpread && <span className="ml-1 text-green-400">・見開き</span>}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-gray-900 text-white p-2">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => goToPage(0)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="最初のページ"
            >
              <SafeIcon icon={FiHome} />
            </button>

            {/* Page Slider */}
            <div className="flex-1 max-w-md">
              <input
                type="range"
                min="0"
                max={images.length - 1}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={() => goToPage(images.length - 1)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="最後のページ"
            >
              <SafeIcon icon={FiBookmark} />
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="absolute top-20 right-4 bg-black/70 text-white p-3 rounded-lg text-xs max-w-xs">
          <div className="font-semibold mb-2">キーボードショートカット</div>
          <div className="space-y-1">
            <div>← / → : ページ移動</div>
            <div>T : 目次の表示/非表示</div>
            {enableSpread && <div>S : 見開き表示切替</div>}
            <div>F : 全画面モード</div>
            <div>ESC : 閉じる</div>
          </div>
          {showSpread && (
            <div className="mt-2 pt-2 border-t border-gray-500">
              <div className="font-semibold">見開き表示</div>
              <div>左: {isRTL ? '次ページ' : '現在ページ'}</div>
              <div>右: {isRTL ? '現在ページ' : '次ページ'}</div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EpubViewer;