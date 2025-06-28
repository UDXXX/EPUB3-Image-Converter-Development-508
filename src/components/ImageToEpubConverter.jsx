import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ImageUploader from './ImageUploader';
import ImagePreview from './ImagePreview';
import PageLayoutEditor from './PageLayoutEditor';
import BookSettings from './BookSettings';
import TableOfContentsEditor from './TableOfContentsEditor';
import EpubGenerator from './EpubGenerator';

const { FiBook, FiImage, FiSettings, FiList, FiColumns } = FiIcons;

const STEP_TYPES = {
  UPLOAD: 'upload',
  LAYOUT: 'layout', 
  SETTINGS: 'settings',
  TOC: 'toc',
  GENERATE: 'generate'
};

const ImageToEpubConverter = () => {
  const [images, setImages] = useState([]);
  const [bookSettings, setBookSettings] = useState({
    title: 'My Image Book',
    author: 'Unknown Author',
    language: 'ja',
    description: 'A book created from images',
    publisher: 'Image to EPUB Converter',
    pageDirection: 'rtl',
    bookSize: 'kindle-standard',
    customWidth: 600,
    customHeight: 800,
    enableToc: false,
    chapters: [],
    frontCover: null,
    backCover: null,
    enableSpread: true,
    spreadMode: 'landscape-only',
    pageLayouts: []
  });

  const [currentStepType, setCurrentStepType] = useState(STEP_TYPES.UPLOAD);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate step configuration dynamically
  const getStepConfig = () => {
    const steps = [
      { type: STEP_TYPES.UPLOAD, title: '画像アップロード', icon: FiImage, number: 1 },
      { type: STEP_TYPES.LAYOUT, title: 'ページレイアウト', icon: FiColumns, number: 2 },
      { type: STEP_TYPES.SETTINGS, title: '設定', icon: FiSettings, number: 3 }
    ];

    if (bookSettings.enableToc) {
      steps.push({ type: STEP_TYPES.TOC, title: '目次', icon: FiList, number: 4 });
      steps.push({ type: STEP_TYPES.GENERATE, title: 'EPUB生成', icon: FiBook, number: 5 });
    } else {
      steps.push({ type: STEP_TYPES.GENERATE, title: 'EPUB生成', icon: FiBook, number: 4 });
    }

    return steps;
  };

  const stepConfig = getStepConfig();
  const currentStep = stepConfig.find(step => step.type === currentStepType);
  const currentStepNumber = currentStep ? currentStep.number : 1;

  // Debug log
  useEffect(() => {
    console.log('=== Step State ===');
    console.log('Current Step Type:', currentStepType);
    console.log('Current Step Number:', currentStepNumber);
    console.log('TOC Enabled:', bookSettings.enableToc);
    console.log('Total Steps:', stepConfig.length);
    console.log('Step Config:', stepConfig.map(s => `${s.number}: ${s.type}`));
    console.log('==================');
  }, [currentStepType, bookSettings.enableToc, stepConfig, currentStepNumber]);

  const handleImagesUpload = useCallback((newImages) => {
    setImages(prev => {
      const allImages = [...prev, ...newImages];
      
      // Initialize page layouts for new images
      const newLayouts = allImages.map((_, index) => ({
        id: index,
        type: index === 0 ? 'cover' : 'content',
        spread: false,
        readingDirection: bookSettings.pageDirection || 'rtl'
      }));

      setBookSettings(prevSettings => ({
        ...prevSettings,
        pageLayouts: newLayouts
      }));

      return allImages;
    });
  }, [bookSettings.pageDirection]);

  const handleImageRemove = useCallback((index) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      
      // Update page layouts
      const newLayouts = newImages.map((_, i) => ({
        id: i,
        type: i === 0 ? 'cover' : 'content',
        spread: false,
        readingDirection: bookSettings.pageDirection || 'rtl'
      }));

      setBookSettings(prevSettings => ({
        ...prevSettings,
        pageLayouts: newLayouts
      }));

      return newImages;
    });
  }, [bookSettings.pageDirection]);

  const handleImageReorder = useCallback((fromIndex, toIndex) => {
    setImages(prev => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      
      // Update page layouts after reordering
      const newLayouts = newImages.map((_, i) => ({
        id: i,
        type: i === 0 ? 'cover' : 'content',
        spread: bookSettings.pageLayouts?.[i]?.spread || false,
        readingDirection: bookSettings.pageDirection || 'rtl'
      }));

      setBookSettings(prevSettings => ({
        ...prevSettings,
        pageLayouts: newLayouts
      }));

      return newImages;
    });
  }, [bookSettings.pageLayouts, bookSettings.pageDirection]);

  // Navigation functions
  const goToNextStep = () => {
    const currentIndex = stepConfig.findIndex(step => step.type === currentStepType);
    if (currentIndex < stepConfig.length - 1) {
      const nextStep = stepConfig[currentIndex + 1];
      console.log(`Moving from ${currentStepType} (${currentStepNumber}) to ${nextStep.type} (${nextStep.number})`);
      setCurrentStepType(nextStep.type);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = stepConfig.findIndex(step => step.type === currentStepType);
    if (currentIndex > 0) {
      const prevStep = stepConfig[currentIndex - 1];
      console.log(`Moving from ${currentStepType} (${currentStepNumber}) to ${prevStep.type} (${prevStep.number})`);
      setCurrentStepType(prevStep.type);
    }
  };

  // Step-specific handlers
  const handleUploadNext = () => {
    console.log('Upload step: Next clicked');
    goToNextStep();
  };

  const handleLayoutNext = () => {
    console.log('Layout step: Next clicked');
    goToNextStep();
  };

  const handleLayoutBack = () => {
    console.log('Layout step: Back clicked');
    goToPreviousStep();
  };

  const handleSettingsNext = () => {
    console.log('Settings step: Next clicked, enableToc:', bookSettings.enableToc);
    goToNextStep();
  };

  const handleSettingsBack = () => {
    console.log('Settings step: Back clicked');
    goToPreviousStep();
  };

  const handleTocNext = () => {
    console.log('TOC step: Next clicked');
    goToNextStep();
  };

  const handleTocBack = () => {
    console.log('TOC step: Back clicked');
    goToPreviousStep();
  };

  const handleGenerateBack = () => {
    console.log('Generate step: Back clicked');
    goToPreviousStep();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStepType) {
      case STEP_TYPES.UPLOAD:
        return (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <ImageUploader onImagesUpload={handleImagesUpload} />
            
            {images.length > 0 && (
              <ImagePreview
                images={images}
                onImageRemove={handleImageRemove}
                onImageReorder={handleImageReorder}
              />
            )}
            
            {images.length > 0 && (
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUploadNext}
                  className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  次へ進む
                </motion.button>
              </div>
            )}
          </motion.div>
        );

      case STEP_TYPES.LAYOUT:
        return (
          <motion.div
            key="layout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PageLayoutEditor
              images={images}
              settings={bookSettings}
              onSettingsChange={setBookSettings}
              onBack={handleLayoutBack}
              onNext={handleLayoutNext}
            />
          </motion.div>
        );

      case STEP_TYPES.SETTINGS:
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <BookSettings
              settings={bookSettings}
              onSettingsChange={setBookSettings}
              onBack={handleSettingsBack}
              onNext={handleSettingsNext}
              images={images}
            />
          </motion.div>
        );

      case STEP_TYPES.TOC:
        return (
          <motion.div
            key="toc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <TableOfContentsEditor
              images={images}
              settings={bookSettings}
              onSettingsChange={setBookSettings}
              onBack={handleTocBack}
              onNext={handleTocNext}
            />
          </motion.div>
        );

      case STEP_TYPES.GENERATE:
        return (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EpubGenerator
              images={images}
              settings={bookSettings}
              onBack={handleGenerateBack}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-4">
          <SafeIcon icon={FiBook} className="text-4xl text-primary-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800">
            Enhanced EPUB3 Converter
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          画像ファイルから高品質な電子書籍（EPUB3）を作成 - Kindle Comic Creator風のレイアウト設定
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-center space-x-4 md:space-x-8">
          {stepConfig.map((step, index) => (
            <motion.div
              key={step.type}
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStepNumber >= step.number
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <SafeIcon icon={step.icon} className="text-xl" />
              </div>
              <span
                className={`ml-3 font-medium hidden sm:block ${
                  currentStepNumber >= step.number ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {step.title}
              </span>
              {index < stepConfig.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 ml-3 sm:ml-6 ${
                    currentStepNumber > step.number ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="font-semibold">Current Step:</span> {currentStepNumber} ({currentStepType})
          </div>
          <div>
            <span className="font-semibold">TOC Enabled:</span> {bookSettings.enableToc ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-semibold">Total Steps:</span> {stepConfig.length}
          </div>
          <div>
            <span className="font-semibold">Images:</span> {images.length}
          </div>
        </div>
        <div className="mt-2">
          <span className="font-semibold">Step Flow:</span> {stepConfig.map(s => `${s.number}:${s.type}`).join(' → ')}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {renderStepContent()}
      </AnimatePresence>
    </div>
  );
};

export default ImageToEpubConverter;