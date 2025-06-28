import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

const generateEpub = async (images, settings, onProgress = () => {}) => {
  const zip = new JSZip();
  const bookId = uuidv4();

  onProgress(5);

  // Get book size settings
  const bookSizes = {
    'kindle-standard': { width: 600, height: 800 },
    'kindle-large': { width: 758, height: 1024 },
    'kindle-paperwhite': { width: 758, height: 1024 },
    'ipad-standard': { width: 768, height: 1024 },
    'mobile-friendly': { width: 480, height: 640 },
    'custom': { width: settings.customWidth || 600, height: settings.customHeight || 800 }
  };

  const targetSize = bookSizes[settings.bookSize] || bookSizes['kindle-standard'];
  const pageLayouts = settings.pageLayouts || [];

  // EPUB structure
  zip.file('mimetype', 'application/epub+zip');

  // META-INF
  const metaInf = zip.folder('META-INF');
  metaInf.file('container.xml', generateContainerXml());

  // OEBPS
  const oebps = zip.folder('OEBPS');

  onProgress(10);

  // Add images
  const imageManifest = [];
  let pageIndex = 0;

  // Add front cover if specified
  if (settings.frontCover) {
    const coverData = settings.frontCover.url.split(',')[1];
    const coverExtension = settings.frontCover.type.split('/')[1];
    const coverFilename = `cover.${coverExtension}`;

    oebps.file(`images/${coverFilename}`, coverData, { base64: true });
    imageManifest.push({
      id: 'cover',
      href: `images/${coverFilename}`,
      mediaType: settings.frontCover.type,
      pageNumber: ++pageIndex,
      isCover: true,
      spread: false
    });
  }

  // Add main content images with layout information
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const layout = pageLayouts[i] || { spread: false, type: 'content' };
    const imageData = image.url.split(',')[1];
    const extension = image.type.split('/')[1];
    const filename = `image_${String(pageIndex + 1).padStart(4, '0')}.${extension}`;

    oebps.file(`images/${filename}`, imageData, { base64: true });
    imageManifest.push({
      id: `img${pageIndex + 1}`,
      href: `images/${filename}`,
      mediaType: image.type,
      pageNumber: ++pageIndex,
      originalIndex: i,
      spread: layout.spread || false,
      pageType: layout.type || 'content'
    });

    onProgress(10 + (i / images.length) * 40);
  }

  // Add back cover if specified
  if (settings.backCover) {
    const backCoverData = settings.backCover.url.split(',')[1];
    const backCoverExtension = settings.backCover.type.split('/')[1];
    const backCoverFilename = `back_cover.${backCoverExtension}`;

    oebps.file(`images/${backCoverFilename}`, backCoverData, { base64: true });
    imageManifest.push({
      id: 'back-cover',
      href: `images/${backCoverFilename}`,
      mediaType: settings.backCover.type,
      pageNumber: ++pageIndex,
      isBackCover: true,
      spread: false
    });
  }

  onProgress(50);

  // Generate XHTML pages
  for (let i = 0; i < imageManifest.length; i++) {
    const imageInfo = imageManifest[i];
    let pageContent;

    if (imageInfo.isCover) {
      pageContent = generateCoverXhtml(imageInfo, settings, targetSize);
    } else if (imageInfo.isBackCover) {
      pageContent = generateBackCoverXhtml(imageInfo, settings, targetSize);
    } else {
      pageContent = generatePageXhtml(imageInfo, settings, targetSize);
    }

    const pageFilename = imageInfo.isCover
      ? 'cover.xhtml'
      : imageInfo.isBackCover
        ? 'back_cover.xhtml'
        : `page_${String(imageInfo.pageNumber).padStart(4, '0')}.xhtml`;

    oebps.file(pageFilename, pageContent);
  }

  onProgress(70);

  // Generate Table of Contents if enabled
  if (settings.enableToc && settings.chapters?.length > 0) {
    const tocContent = generateTocXhtml(settings.chapters, settings);
    oebps.file('toc.xhtml', tocContent);
  }

  // CSS with spread support
  oebps.file('styles/style.css', generateCSS(settings, targetSize));

  // OPF (package document) with spread metadata
  oebps.file('content.opf', generateOPF(settings, imageManifest, bookId));

  // NCX (navigation)
  oebps.file('toc.ncx', generateNCX(settings, imageManifest, bookId));

  onProgress(90);

  // Generate ZIP
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  });

  onProgress(100);
  return blob;
};

const generateContainerXml = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
};

const generateOPF = (settings, imageManifest, bookId) => {
  const manifestItems = imageManifest.map(img =>
    `    <item id="${img.id}" href="${img.href}" media-type="${img.mediaType}"/>`
  ).join('\n');

  const pageItems = imageManifest.map((img) => {
    const filename = img.isCover
      ? 'cover.xhtml'
      : img.isBackCover
        ? 'back_cover.xhtml'
        : `page_${String(img.pageNumber).padStart(4, '0')}.xhtml`;

    const id = img.isCover
      ? 'cover-page'
      : img.isBackCover
        ? 'back-cover-page'
        : `page${img.pageNumber}`;

    // 見開きページの場合、適切なプロパティを設定
    const properties = [];
    if (img.spread) {
      // 見開きページは左右どちらのページかを判定
      const isLeftPage = settings.pageDirection === 'rtl' 
        ? (img.originalIndex % 2 === 1) 
        : (img.originalIndex % 2 === 0);
      
      if (isLeftPage) {
        properties.push('page-spread-left');
      } else {
        properties.push('page-spread-right');
      }
    }

    const propertiesAttr = properties.length > 0 ? ` properties="${properties.join(' ')}"` : '';

    return `    <item id="${id}" href="${filename}" media-type="application/xhtml+xml"${propertiesAttr}/>`;
  }).join('\n');

  // Add TOC item if enabled
  const tocItem = settings.enableToc && settings.chapters?.length > 0
    ? '    <item id="toc-page" href="toc.xhtml" media-type="application/xhtml+xml"/>'
    : '';

  const spineItems = [];

  // Add cover to spine
  if (settings.frontCover) {
    spineItems.push('    <itemref idref="cover-page"/>');
  }

  // Add TOC to spine if enabled
  if (settings.enableToc && settings.chapters?.length > 0) {
    spineItems.push('    <itemref idref="toc-page"/>');
  }

  // Add content pages with spread information
  imageManifest.forEach((img) => {
    if (!img.isCover && !img.isBackCover) {
      // 見開きページの場合は左右のプロパティを設定
      if (img.spread) {
        const isLeftPage = settings.pageDirection === 'rtl' 
          ? (img.originalIndex % 2 === 1) 
          : (img.originalIndex % 2 === 0);
        
        if (isLeftPage) {
          spineItems.push(`    <itemref idref="page${img.pageNumber}" properties="page-spread-left"/>`);
        } else {
          spineItems.push(`    <itemref idref="page${img.pageNumber}" properties="page-spread-right"/>`);
        }
      } else {
        spineItems.push(`    <itemref idref="page${img.pageNumber}"/>`);
      }
    }
  });

  // Add back cover
  if (settings.backCover) {
    spineItems.push('    <itemref idref="back-cover-page"/>');
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const coverImageId = settings.frontCover ? 'cover' : imageManifest.find(img => !img.isBackCover)?.id || '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>${escapeXml(settings.title)}</dc:title>
    <dc:creator>${escapeXml(settings.author)}</dc:creator>
    <dc:language>${settings.language}</dc:language>
    <dc:publisher>${escapeXml(settings.publisher)}</dc:publisher>
    <dc:description>${escapeXml(settings.description)}</dc:description>
    <dc:date>${currentDate}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
    ${coverImageId ? `<meta name="cover" content="${coverImageId}"/>` : ''}
    ${settings.pageDirection === 'rtl' ? '<meta property="page-progression-direction">rtl</meta>' : ''}
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:orientation">auto</meta>
    <meta property="rendition:spread">auto</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles/style.css" media-type="text/css"/>
${tocItem}
${manifestItems}
${pageItems}
  </manifest>
  <spine toc="ncx" page-progression-direction="${settings.pageDirection}">
${spineItems.join('\n')}
  </spine>
</package>`;
};

const generateNCX = (settings, imageManifest, bookId) => {
  const navPoints = [];
  let playOrder = 1;

  // Add cover navigation
  if (settings.frontCover) {
    navPoints.push(`    <navPoint id="navpoint-cover" playOrder="${playOrder++}">
      <navLabel>
        <text>表紙</text>
      </navLabel>
      <content src="cover.xhtml"/>
    </navPoint>`);
  }

  // Add TOC navigation if enabled
  if (settings.enableToc && settings.chapters?.length > 0) {
    navPoints.push(`    <navPoint id="navpoint-toc" playOrder="${playOrder++}">
      <navLabel>
        <text>目次</text>
      </navLabel>
      <content src="toc.xhtml"/>
    </navPoint>`);

    // Add chapter navigation
    settings.chapters.forEach((chapter) => {
      const adjustedPageIndex = settings.frontCover ? chapter.pageIndex + 1 : chapter.pageIndex;
      navPoints.push(`    <navPoint id="navpoint-${chapter.id}" playOrder="${playOrder++}">
        <navLabel>
          <text>${escapeXml(chapter.title)}</text>
        </navLabel>
        <content src="page_${String(adjustedPageIndex + 1).padStart(4, '0')}.xhtml"/>
      </navPoint>`);
    });
  } else {
    // Default page navigation
    imageManifest.forEach((img) => {
      if (!img.isCover && !img.isBackCover) {
        navPoints.push(`    <navPoint id="navpoint-${img.pageNumber}" playOrder="${playOrder++}">
          <navLabel>
            <text>Page ${img.pageNumber}</text>
          </navLabel>
          <content src="page_${String(img.pageNumber).padStart(4, '0')}.xhtml"/>
        </navPoint>`);
      }
    });
  }

  // Add back cover navigation
  if (settings.backCover) {
    navPoints.push(`    <navPoint id="navpoint-back-cover" playOrder="${playOrder++}">
      <navLabel>
        <text>裏表紙</text>
      </navLabel>
      <content src="back_cover.xhtml"/>
    </navPoint>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(settings.title)}</text>
  </docTitle>
  <navMap>
${navPoints.join('\n')}
  </navMap>
</ncx>`;
};

const generateTocXhtml = (chapters, settings) => {
  const chapterLinks = chapters.map(chapter => {
    const adjustedPageIndex = settings.frontCover ? chapter.pageIndex + 1 : chapter.pageIndex;
    return `      <li class="toc-item">
        <a href="page_${String(adjustedPageIndex + 1).padStart(4, '0')}.xhtml" class="toc-link">
          <span class="toc-title">${escapeXml(chapter.title)}</span>
          <span class="toc-dots"></span>
          <span class="toc-page">${chapter.pageNumber}</span>
        </a>
      </li>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
  <title>目次</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
</head>
<body class="toc-page">
  <div class="toc-container">
    <div class="toc-nav">
      <div class="toc-header">
        <h1 class="toc-title-main">${escapeXml(settings.title)}</h1>
        <div class="toc-subtitle">目次</div>
        <div class="toc-decoration"></div>
      </div>
      <ol class="toc-list">
${chapterLinks}
      </ol>
      <div class="toc-footer">
        <div class="toc-author">著者: ${escapeXml(settings.author)}</div>
        <div class="toc-publisher">${escapeXml(settings.publisher)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const generateCoverXhtml = (imageInfo, settings, targetSize) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
  <title>表紙</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
  <meta name="viewport" content="width=${targetSize.width},height=${targetSize.height}"/>
</head>
<body class="cover-page">
  <div class="page-container">
    <img src="${imageInfo.href}" alt="表紙" class="cover-image"/>
  </div>
</body>
</html>`;
};

const generateBackCoverXhtml = (imageInfo, settings, targetSize) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
  <title>裏表紙</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
  <meta name="viewport" content="width=${targetSize.width},height=${targetSize.height}"/>
</head>
<body class="back-cover-page">
  <div class="page-container">
    <img src="${imageInfo.href}" alt="裏表紙" class="back-cover-image"/>
  </div>
</body>
</html>`;
};

const generatePageXhtml = (imageInfo, settings, targetSize) => {
  // 見開きページでも通常サイズのページとして生成
  const spreadClass = imageInfo.spread ? ' spread-page' : '';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
  <title>Page ${imageInfo.pageNumber}</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
  <meta name="viewport" content="width=${targetSize.width},height=${targetSize.height}"/>
</head>
<body class="content-page${spreadClass}">
  <div class="page-container${spreadClass}">
    <img src="${imageInfo.href}" alt="Page ${imageInfo.pageNumber}" class="page-image${spreadClass}"/>
  </div>
</body>
</html>`;
};

const generateCSS = (settings, targetSize) => {
  return `/* Enhanced Kindle Compatible CSS with Proper Spread Support */

/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: serif;
  font-size: 1em;
  line-height: 1.4;
  color: #000;
  background: #fff;
  width: 100%;
  height: 100%;
}

/* Page Container Base */
.page-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

/* Single Page Styles */
.page-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* Spread Page Styles - 見開きページ用（通常サイズ） */
.spread-page .page-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spread-page .page-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* Cover Styles */
.cover-page .page-container {
  text-align: center;
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.cover-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* Back Cover Styles */
.back-cover-page .page-container {
  text-align: center;
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.back-cover-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* Table of Contents Styles */
.toc-page {
  padding: 2em 1em;
  font-family: serif;
  line-height: 1.6;
  color: #000;
}

.toc-container {
  max-width: 100%;
  margin: 0 auto;
}

.toc-nav {
  width: 100%;
}

.toc-header {
  text-align: center;
  margin-bottom: 2em;
  padding-bottom: 1em;
  border-bottom: 2px solid #333;
}

.toc-title-main {
  font-size: 1.8em;
  font-weight: bold;
  color: #000;
  margin: 0 0 0.5em 0;
  text-align: center;
}

.toc-subtitle {
  font-size: 1.2em;
  color: #666;
  margin-bottom: 1em;
  font-weight: normal;
  text-align: center;
}

.toc-decoration {
  width: 60px;
  height: 2px;
  background: #333;
  margin: 0 auto;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin: 1em 0;
  page-break-inside: avoid;
}

.toc-link {
  display: block;
  text-decoration: none;
  color: #000;
  padding: 0.8em 1em;
  border: 1px solid #ddd;
  background: #f9f9f9;
  position: relative;
}

.toc-link:hover {
  background: #f0f0f0;
}

.toc-title {
  font-size: 1em;
  font-weight: bold;
  display: block;
  margin-bottom: 0.2em;
}

.toc-dots {
  display: none;
}

.toc-page {
  font-size: 0.9em;
  font-weight: normal;
  color: #666;
  float: right;
  background: #e0e0e0;
  padding: 0.2em 0.5em;
  border-radius: 3px;
}

.toc-footer {
  margin-top: 2em;
  text-align: center;
  padding-top: 1em;
  border-top: 1px solid #ddd;
}

.toc-author {
  font-size: 1em;
  color: #333;
  margin-bottom: 0.5em;
  font-weight: bold;
}

.toc-publisher {
  font-size: 0.9em;
  color: #666;
  font-style: italic;
}

/* Kindle-specific optimizations */
@media amzn-kf8 {
  .page-image, .cover-image, .back-cover-image {
    width: 100%;
    height: auto;
    max-width: 100%;
  }
  
  .spread-page .page-image {
    width: 100%;
    height: auto;
    max-width: 100%;
  }
  
  .page-container, .cover-page .page-container, .back-cover-page .page-container {
    display: flex;
    height: 100vh;
  }
  
  .spread-page .page-container {
    width: 100%;
    display: flex;
  }
  
  .toc-link {
    display: block;
    overflow: hidden;
  }
  
  .toc-page {
    float: none;
    display: inline;
    margin-left: 1em;
  }
}

/* Kindle Paperwhite specific */
@media amzn-mobi {
  img {
    max-width: 100%;
    height: auto;
  }
  
  .spread-page img {
    max-width: 100%;
  }
  
  .toc-title-main {
    font-size: 1.5em;
  }
  
  .toc-subtitle {
    font-size: 1em;
  }
  
  .toc-link {
    padding: 0.5em;
  }
}

/* Print styles for compatibility */
@media print {
  .page-image, .cover-image, .back-cover-image {
    max-width: 100%;
    height: auto;
    page-break-inside: avoid;
  }
  
  .spread-page .page-image {
    max-width: 100%;
  }
  
  .toc-item {
    page-break-inside: avoid;
  }
}

/* Legacy support */
img {
  border: none;
  outline: none;
}

a {
  color: #000;
}

a:visited {
  color: #666;
}

/* Ensure compatibility with older e-readers */
div, p, h1, h2, h3, ol, li {
  margin: 0;
  padding: 0;
}

.toc-list li {
  list-style-type: none;
}`;
};

const escapeXml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export { generateEpub };