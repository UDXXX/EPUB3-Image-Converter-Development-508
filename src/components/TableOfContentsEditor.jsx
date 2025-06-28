import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiArrowRight, FiPlus, FiEdit3, FiTrash2, FiList, FiBookOpen } = FiIcons;

const TableOfContentsEditor = ({ images, settings, onSettingsChange, onBack, onNext }) => {
  const [chapters, setChapters] = useState(settings.chapters || []);
  const [editingChapter, setEditingChapter] = useState(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  useEffect(() => {
    onSettingsChange(prev => ({
      ...prev,
      chapters
    }));
  }, [chapters, onSettingsChange]);

  const addChapter = (pageIndex) => {
    const title = newChapterTitle.trim() || `Chapter ${chapters.length + 1}`;
    const newChapter = {
      id: Date.now(),
      title,
      pageIndex,
      pageNumber: pageIndex + 1
    };
    setChapters(prev => [...prev, newChapter].sort((a, b) => a.pageIndex - b.pageIndex));
    setNewChapterTitle('');
  };

  const removeChapter = (id) => {
    setChapters(prev => prev.filter(chapter => chapter.id !== id));
  };

  const updateChapterTitle = (id, title) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === id ? { ...chapter, title } : chapter
    ));
    setEditingChapter(null);
  };

  const autoGenerateChapters = () => {
    const chapterCount = Math.min(10, Math.ceil(images.length / 10));
    const newChapters = [];
    for (let i = 0; i < chapterCount; i++) {
      const pageIndex = Math.floor((images.length / chapterCount) * i);
      newChapters.push({
        id: Date.now() + i,
        title: `第${i + 1}章`,
        pageIndex,
        pageNumber: pageIndex + 1
      });
    }
    setChapters(newChapters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <SafeIcon icon={FiList} className="mr-3 text-primary-600" />
          目次設定
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Chapter Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">章の設定</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={autoGenerateChapters}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                自動生成
              </motion.button>
            </div>

            {/* Chapter Input */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しい章のタイトル
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="章のタイトルを入力"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && newChapterTitle && addChapter(0)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                下のページ一覧から開始ページをクリックして章を追加
              </p>
            </div>

            {/* Chapters List */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">設定済みの章 ({chapters.length})</h4>
              <AnimatePresence>
                {chapters.map((chapter) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      {editingChapter === chapter.id ? (
                        <input
                          type="text"
                          defaultValue={chapter.title}
                          onBlur={(e) => updateChapterTitle(chapter.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateChapterTitle(chapter.id, e.target.value);
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          autoFocus
                        />
                      ) : (
                        <div>
                          <div className="font-medium text-gray-800">{chapter.title}</div>
                          <div className="text-sm text-gray-500">ページ {chapter.pageNumber}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingChapter(chapter.id)}
                        className="p-1 text-gray-400 hover:text-blue-500"
                      >
                        <SafeIcon icon={FiEdit3} className="text-sm" />
                      </button>
                      <button
                        onClick={() => removeChapter(chapter.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <SafeIcon icon={FiTrash2} className="text-sm" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {chapters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <SafeIcon icon={FiBookOpen} className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>まだ章が設定されていません</p>
                  <p className="text-sm">右のページから開始ページを選択してください</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Page Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">ページ一覧</h3>
            <p className="text-sm text-gray-600">
              ページをクリックして章の開始ページに設定
            </p>
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="grid grid-cols-4 gap-2 p-4">
                {images.map((image, index) => {
                  const isChapterStart = chapters.some(ch => ch.pageIndex === index);
                  const chapter = chapters.find(ch => ch.pageIndex === index);
                  
                  return (
                    <motion.div
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => newChapterTitle && addChapter(index)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isChapterStart 
                          ? 'border-green-500 bg-green-50' 
                          : newChapterTitle ? 'border-primary-300 hover:border-primary-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Page ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                      {isChapterStart && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs p-1 text-center">
                          <SafeIcon icon={FiBookOpen} className="inline mr-1" />
                          {chapter.title}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="mr-2" />
            戻る
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className="flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            EPUB生成
            <SafeIcon icon={FiArrowRight} className="ml-2" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default TableOfContentsEditor;