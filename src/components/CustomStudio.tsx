import type React from 'react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Bookmark,
  Check,
  Eye,
  EyeOff,
  FolderOpen,
  ImagePlus,
  Layers,
  RotateCcw,
  ShoppingBag,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import {
  ALL_SIZES,
  type CartItem,
  type CustomArtworkLayer,
  type CustomDesignConfig,
  type CustomTextLayer,
  type GarmentColor,
  type PlacementSide,
  type PrintMethod,
  type Product,
  type SavedCustomDesign,
  type SizeCode,
} from '../shared/types';
import {renderDesignCompositePng, TshirtSvgMockup} from './TshirtSvgMockup';

const SAVED_DESIGNS_STORAGE_KEY = 'kroma_press_saved_designs_v1';

interface CustomStudioProps {
  products: Product[];
  initialProduct?: Product | null;
  initialColor?: GarmentColor | null;
  initialSize?: SizeCode | null;
  onAddToBag: (item: CartItem) => void;
}

const PRINT_METHOD_OPTIONS: {
  id: PrintMethod;
  label: string;
  sub: string;
  surcharge: number;
}[] = [
  {
    id: 'dtg',
    label: '1200 DPI Water-Based DTG',
    sub: 'Full-color gradients · Zero-hand feel',
    surcharge: 0,
  },
  {
    id: 'puff',
    label: 'High-Build Puff Screen',
    sub: 'Raised 3D matte tactile ink',
    surcharge: 8,
  },
  {
    id: 'foil',
    label: 'Metallic Studio Foil',
    sub: 'Precision heat-pressed chrome sheen',
    surcharge: 12,
  },
];

// Clean vector studio stamps encoded as SVG data URLs so users can test placement immediately
const STUDIO_PRESET_STAMPS: {name: string; dataUrl: string}[] = [
  {
    name: 'Architectural Monolith',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect x="20" y="20" width="200" height="200" fill="none" stroke="#E63918" stroke-width="5"/><line x1="20" y1="90" x2="220" y2="90" stroke="#E63918" stroke-width="3"/><rect x="55" y="110" width="55" height="90" fill="#E63918"/><circle cx="165" cy="145" r="28" fill="none" stroke="#E63918" stroke-width="4"/></svg>`,
      ),
  },
  {
    name: 'Meridian Grid',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><circle cx="120" cy="120" r="95" fill="none" stroke="#ffffff" stroke-width="4"/><ellipse cx="120" cy="120" rx="45" ry="95" fill="none" stroke="#ffffff" stroke-width="3"/><line x1="25" y1="120" x2="215" y2="120" stroke="#ffffff" stroke-width="3"/><line x1="40" y1="70" x2="200" y2="70" stroke="#ffffff" stroke-width="2"/><line x1="40" y1="170" x2="200" y2="170" stroke="#ffffff" stroke-width="2"/></svg>`,
      ),
  },
  {
    name: 'Kroma Brutalist',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 180"><rect x="8" y="8" width="244" height="164" fill="#18181B" stroke="#FAFAFA" stroke-width="4"/><text x="130" y="78" text-anchor="middle" fill="#FAFAFA" font-family="sans-serif" font-weight="700" font-size="34" letter-spacing="4">KROMA</text><line x1="36" y1="98" x2="224" y2="98" stroke="#E63918" stroke-width="4"/><text x="130" y="132" text-anchor="middle" fill="#D4D4D8" font-family="monospace" font-size="16" letter-spacing="3">ATELIER PRESS</text></svg>`,
      ),
  },
  {
    name: 'Contour Wave',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><path d="M20 75 Q 70 25, 120 75 T 220 75" fill="none" stroke="#18181B" stroke-width="6"/><path d="M20 120 Q 70 70, 120 120 T 220 120" fill="none" stroke="#E63918" stroke-width="6"/><path d="M20 165 Q 70 115, 120 165 T 220 165" fill="none" stroke="#18181B" stroke-width="6"/></svg>`,
      ),
  },
];

const emptyArtwork = (side: PlacementSide): CustomArtworkLayer => ({
  side,
  imageDataUrl: null,
  fileName: null,
  x: 50,
  y: 44,
  scale: 66,
  rotation: 0,
});

const emptyText = (side: PlacementSide, defaultColor: string): CustomTextLayer => ({
  side,
  text: '',
  font: 'display',
  color: defaultColor,
  fontSize: 20,
  letterSpacing: 1,
  x: 50,
  y: 74,
});

export function CustomStudio({
  products,
  initialProduct,
  initialColor,
  initialSize,
  onAddToBag,
}: CustomStudioProps) {
  const customizableProducts = useMemo(
    () => products.filter((p) => p.customizable),
    [products],
  );

  const defaultBlank =
    initialProduct ||
    customizableProducts.find((p) => p.id === 'tee-custom-blank-pro') ||
    customizableProducts[0] ||
    products[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultBlank?.id || '',
  );
  const selectedProduct = useMemo(
    () =>
      products.find((p) => p.id === selectedProductId) ||
      defaultBlank ||
      products[0],
    [products, selectedProductId, defaultBlank],
  );

  const [selectedColor, setSelectedColor] = useState<GarmentColor>(
    initialColor || selectedProduct?.colors[0] || {name: 'Chalk White', hex: '#F3F2EE', textOnHex: '#09090B'},
  );
  const [selectedSize, setSelectedSize] = useState<SizeCode>(initialSize || 'L');
  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState<PlacementSide>('front');
  const [activeToolTab, setActiveToolTab] = useState<'garment' | 'artwork' | 'text' | 'print'>('artwork');
  const [printMethod, setPrintMethod] = useState<PrintMethod>('dtg');
  const [showGuides, setShowGuides] = useState(true);
  const [activeLayerFocus, setActiveLayerFocus] = useState<'artwork' | 'text'>('artwork');

  const [frontArtwork, setFrontArtwork] = useState<CustomArtworkLayer>(emptyArtwork('front'));
  const [backArtwork, setBackArtwork] = useState<CustomArtworkLayer>(emptyArtwork('back'));
  const [frontText, setFrontText] = useState<CustomTextLayer>(
    emptyText('front', selectedColor.textOnHex),
  );
  const [backText, setBackText] = useState<CustomTextLayer>(
    emptyText('back', selectedColor.textOnHex),
  );

  const [uploadMeta, setUploadMeta] = useState<{width: number; height: number} | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [draftSavedNotice, setDraftSavedNotice] = useState(false);
  const [showSavedDrafts, setShowSavedDrafts] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedCustomDesign[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_DESIGNS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedCustomDesign[]) : [];
    } catch {
      return [];
    }
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_DESIGNS_STORAGE_KEY, JSON.stringify(savedDrafts));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedDrafts]);

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setSelectedColor(initialColor || initialProduct.colors[0]);
      if (initialSize) setSelectedSize(initialSize);
    }
  }, [initialProduct, initialColor, initialSize]);

  useEffect(() => {
    if (!selectedProduct) return;
    if (!selectedProduct.colors.some((c) => c.name === selectedColor.name)) {
      setSelectedColor(selectedProduct.colors[0]);
    }
  }, [selectedProduct, selectedColor.name]);

  const currentArtwork = activeSide === 'front' ? frontArtwork : backArtwork;
  const setCurrentArtwork = activeSide === 'front' ? setFrontArtwork : setBackArtwork;
  const currentText = activeSide === 'front' ? frontText : backText;
  const setCurrentText = activeSide === 'front' ? setFrontText : setBackText;

  const hasFrontDesign =
    Boolean(frontArtwork.imageDataUrl) || Boolean(frontText.text.trim());
  const hasBackDesign =
    Boolean(backArtwork.imageDataUrl) || Boolean(backText.text.trim());
  const hasAnyDesign = hasFrontDesign || hasBackDesign;

  const printSurcharge =
    PRINT_METHOD_OPTIONS.find((m) => m.id === printMethod)?.surcharge ?? 0;
  const dualSideFee = hasFrontDesign && hasBackDesign ? 10 : 0;
  const unitPrice = (selectedProduct?.price ?? 38) + printSurcharge + dualSideFee;

  const availableStock = selectedProduct?.stock[selectedSize] ?? 0;

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a PNG, JPG, SVG, or WebP artwork file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Artwork file exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        setUploadMeta({width: img.naturalWidth, height: img.naturalHeight});
      };
      img.src = dataUrl;

      setCurrentArtwork((prev) => ({
        ...prev,
        imageDataUrl: dataUrl,
        fileName: file.name,
      }));
      setActiveLayerFocus('artwork');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const applyPresetPosition = (preset: 'center' | 'left-chest' | 'full') => {
    setActiveLayerFocus('artwork');
    if (preset === 'center') {
      setCurrentArtwork((prev) => ({...prev, x: 50, y: 42, scale: 65, rotation: 0}));
    } else if (preset === 'left-chest') {
      setCurrentArtwork((prev) => ({...prev, x: 70, y: 24, scale: 32, rotation: 0}));
    } else {
      setCurrentArtwork((prev) => ({...prev, x: 50, y: 48, scale: 90, rotation: 0}));
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedProduct) return;
    if (!hasAnyDesign) {
      setErrorMsg('Add artwork or custom text before saving a draft.');
      return;
    }
    setErrorMsg(null);
    const previewSide = hasFrontDesign ? 'front' : 'back';
    const previewDataUrl = await renderDesignCompositePng({
      colorHex: selectedColor.hex,
      artwork: previewSide === 'front' ? frontArtwork : backArtwork,
      textLayer: previewSide === 'front' ? frontText : backText,
    });
    const draftTitle =
      frontText.text.trim() ||
      frontArtwork.fileName?.replace(/\.[^/.]+$/, '') ||
      `${selectedProduct.name} Draft`;
    const newDraft: SavedCustomDesign = {
      id: `draft-${Date.now().toString(36)}`,
      title: draftTitle,
      savedAt: new Date().toISOString(),
      config: {
        baseProductId: selectedProduct.id,
        baseProductName: selectedProduct.name,
        color: selectedColor,
        size: selectedSize,
        printMethod,
        frontArtwork,
        backArtwork,
        frontText,
        backText,
        previewDataUrl,
        hasBackPrint: hasBackDesign,
      },
    };
    setSavedDrafts((prev) => [newDraft, ...prev].slice(0, 12));
    setDraftSavedNotice(true);
    setTimeout(() => setDraftSavedNotice(false), 2000);
  };

  const handleLoadDraft = (draft: SavedCustomDesign) => {
    const cfg = draft.config;
    setSelectedProductId(cfg.baseProductId);
    setSelectedColor(cfg.color);
    setSelectedSize(cfg.size);
    setPrintMethod(cfg.printMethod);
    setFrontArtwork(cfg.frontArtwork);
    setBackArtwork(cfg.backArtwork);
    setFrontText(cfg.frontText);
    setBackText(cfg.backText);
    setShowSavedDrafts(false);
    setErrorMsg(null);
  };

  const handleDeleteDraft = (draftId: string) => {
    setSavedDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleAddCustomToBag = async () => {
    if (!selectedProduct || availableStock < quantity) {
      setErrorMsg(`Only ${availableStock} units available in size ${selectedSize}.`);
      return;
    }
    if (!hasAnyDesign) {
      setErrorMsg('Upload artwork, select a studio graphic, or add custom text first.');
      return;
    }

    setAdding(true);
    setErrorMsg(null);
    try {
      const previewSide = hasFrontDesign ? 'front' : 'back';
      const previewDataUrl = await renderDesignCompositePng({
        colorHex: selectedColor.hex,
        artwork: previewSide === 'front' ? frontArtwork : backArtwork,
        textLayer: previewSide === 'front' ? frontText : backText,
      });

      const methodLabel =
        PRINT_METHOD_OPTIONS.find((m) => m.id === printMethod)?.label || 'DTG';
      const sidesLabel =
        hasFrontDesign && hasBackDesign
          ? 'Front & Back Print'
          : hasFrontDesign
            ? 'Front Print'
            : 'Back Print';

      const customConfig: CustomDesignConfig = {
        baseProductId: selectedProduct.id,
        baseProductName: selectedProduct.name,
        color: selectedColor,
        size: selectedSize,
        printMethod,
        frontArtwork,
        backArtwork,
        frontText,
        backText,
        previewDataUrl,
        hasBackPrint: hasBackDesign,
      };

      onAddToBag({
        cartItemId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'custom',
        productId: selectedProduct.id,
        sku: selectedProduct.sku,
        name: `Custom ${selectedProduct.name}`,
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        size: selectedSize,
        quantity,
        unitPrice,
        thumbnailUrl: previewDataUrl || selectedProduct.gallery[0]?.url || '',
        customSummary: `${sidesLabel} · ${methodLabel}`,
        customConfig,
      });

      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2200);
    } finally {
      setAdding(false);
    }
  };

  if (!selectedProduct) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Studio Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            Interactive Design Workbench · Live DPI &amp; Placement
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Custom T-Shirt Print Studio
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-600">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-9 px-3 inline-flex items-center gap-1.5 bg-white border border-zinc-300 hover:border-zinc-950 rounded-lg text-xs font-semibold text-zinc-900 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{draftSavedNotice ? 'Draft Saved' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSavedDrafts((prev) => !prev)}
            className="h-9 px-3 inline-flex items-center gap-1.5 bg-white border border-zinc-300 hover:border-zinc-950 rounded-lg text-xs font-semibold text-zinc-900 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Saved Drafts ({savedDrafts.length})</span>
          </button>
          <span className="hidden sm:inline font-mono tabular-nums font-medium text-zinc-900">
            · {availableStock} in stock ({selectedSize})
          </span>
        </div>
      </div>

      {showSavedDrafts && (
        <div className="mb-8 p-5 bg-white border border-zinc-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-zinc-950">
              Your Saved Custom Design Drafts
            </h2>
            <button
              type="button"
              onClick={() => setShowSavedDrafts(false)}
              className="text-xs text-zinc-500 hover:text-zinc-950 cursor-pointer"
            >
              Close
            </button>
          </div>
          {savedDrafts.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              No saved drafts yet. Upload artwork or add custom typography and click Save Draft.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {savedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border border-zinc-200 rounded-xl p-3 flex flex-col justify-between gap-3 bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    {draft.config.previewDataUrl ? (
                      <img
                        src={draft.config.previewDataUrl}
                        alt={draft.title}
                        className="w-12 h-14 object-cover rounded-lg border border-zinc-200 bg-white shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-14 rounded-lg border border-zinc-200 shrink-0"
                        style={{backgroundColor: draft.config.color.hex}}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-950 truncate">
                        {draft.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {draft.config.color.name} · {draft.config.size}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400">
                        {new Date(draft.savedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadDraft(draft)}
                      className="flex-1 h-8 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Load Design
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(draft.id)}
                      aria-label={`Delete draft ${draft.title}`}
                      className="w-8 h-8 inline-flex items-center justify-center border border-zinc-200 hover:border-red-300 text-red-600 rounded-lg bg-white cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main 12-Col Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Center Canvas Stage (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-100 border border-zinc-200 rounded-2xl p-4 sm:p-6">
          {/* Top Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* Front / Back Switch */}
            <div className="inline-flex items-center p-1 bg-white border border-zinc-200 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeSide === 'front'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Front {hasFrontDesign ? '· Edited' : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeSide === 'back'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Back {hasBackDesign ? '· Edited' : ''}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuides((g) => !g)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-400 rounded-lg text-xs font-medium text-zinc-800 cursor-pointer"
              >
                {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showGuides ? 'Guides On' : 'Guides Off'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentArtwork(emptyArtwork(activeSide));
                  setCurrentText(emptyText(activeSide, selectedColor.textOnHex));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-400 rounded-lg text-xs font-medium text-zinc-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear {activeSide}</span>
              </button>
            </div>
          </div>

          {/* Interactive Garment Mockup */}
          <div className="py-2 sm:py-4">
            <TshirtSvgMockup
              color={selectedColor}
              side={activeSide}
              artwork={currentArtwork}
              textLayer={currentText}
              showPrintGuides={showGuides}
              interactiveDrag={true}
              activeLayer={activeLayerFocus}
              onMoveArtwork={(x, y) => {
                setActiveLayerFocus('artwork');
                setCurrentArtwork((prev) => ({...prev, x, y}));
              }}
              onMoveText={(x, y) => {
                setActiveLayerFocus('text');
                setCurrentText((prev) => ({...prev, x, y}));
              }}
            />
          </div>

          {/* Canvas Print Readout Strip */}
          <div className="mt-4 pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <span className="font-medium text-zinc-900">
                {selectedProduct.name} ({selectedColor.name})
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedProduct.fabricWeight}</span>
            </div>
            <div className="font-mono tabular-nums">
              {uploadMeta ? (
                <span
                  className={
                    uploadMeta.width >= 800 ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'
                  }
                >
                  {uploadMeta.width}×{uploadMeta.height}px ·{' '}
                  {uploadMeta.width >= 800 ? '300 DPI Print-Ready' : 'Low-Res Warning'}
                </span>
              ) : (
                <span>Max Print Area: 12&quot; × 16&quot;</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          {/* Segmented Workbench Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-200 bg-zinc-50">
            {(
              [
                {id: 'artwork', label: 'Artwork', icon: ImagePlus},
                {id: 'text', label: 'Text', icon: Type},
                {id: 'garment', label: 'Garment', icon: Layers},
                {id: 'print', label: 'Finish', icon: Check},
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeToolTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveToolTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-[#E63918] bg-white text-zinc-950'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* TAB 1: ARTWORK UPLOAD & PLACEMENT */}
            {activeToolTab === 'artwork' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-900">
                      Upload Custom Design ({activeSide === 'front' ? 'Front' : 'Back'})
                    </span>
                    <span className="text-[11px] text-zinc-500">PNG, SVG, JPG · 10MB max</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                      dragOver
                        ? 'border-[#E63918] bg-[#E63918]/5'
                        : 'border-zinc-300 hover:border-zinc-500 bg-zinc-50'
                    }`}
                  >
                    <Upload className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-zinc-900">
                      {currentArtwork.fileName
                        ? `Replace: ${currentArtwork.fileName}`
                        : 'Drop artwork here or click to upload'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Transparent PNG or SVG recommended for crisp edge curing
                    </p>
                  </div>
                </div>

                {/* Studio Graphic Presets */}
                <div>
                  <p className="text-xs font-semibold text-zinc-900 mb-2.5">
                    Or Try a Studio Graphic Stamp
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {STUDIO_PRESET_STAMPS.map((stamp) => (
                      <button
                        key={stamp.name}
                        type="button"
                        onClick={() => {
                          setUploadMeta({width: 1200, height: 1200});
                          setActiveLayerFocus('artwork');
                          setCurrentArtwork((prev) => ({
                            ...prev,
                            imageDataUrl: stamp.dataUrl,
                            fileName: `${stamp.name}.svg`,
                          }));
                        }}
                        className="p-2 rounded-lg border border-zinc-200 hover:border-zinc-900 bg-zinc-100 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                        title={stamp.name}
                      >
                        <img
                          src={stamp.dataUrl}
                          alt={stamp.name}
                          className="w-10 h-10 object-contain"
                        />
                        <span className="text-[10px] text-zinc-700 truncate w-full text-center">
                          {stamp.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Artwork Transform Controls */}
                {currentArtwork.imageDataUrl && (
                  <div className="pt-4 border-t border-zinc-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900">
                        Quick Placement Presets
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentArtwork(emptyArtwork(activeSide))
                        }
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Art</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => applyPresetPosition('center')}
                        className="px-2.5 py-2 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-100 cursor-pointer"
                      >
                        Center Chest
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetPosition('left-chest')}
                        className="px-2.5 py-2 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-100 cursor-pointer"
                      >
                        Left Pocket
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetPosition('full')}
                        className="px-2.5 py-2 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-100 cursor-pointer"
                      >
                        Oversized Full
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-600">Artwork Scale</span>
                        <span className="font-mono tabular-nums font-medium">
                          {currentArtwork.scale}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={currentArtwork.scale}
                        onChange={(e) => {
                          setActiveLayerFocus('artwork');
                          setCurrentArtwork((prev) => ({
                            ...prev,
                            scale: Number(e.target.value),
                          }));
                        }}
                        className="w-full accent-[#E63918] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-600">Rotation</span>
                        <span className="font-mono tabular-nums font-medium">
                          {currentArtwork.rotation}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-45}
                        max={45}
                        value={currentArtwork.rotation}
                        onChange={(e) => {
                          setActiveLayerFocus('artwork');
                          setCurrentArtwork((prev) => ({
                            ...prev,
                            rotation: Number(e.target.value),
                          }));
                        }}
                        className="w-full accent-[#E63918] cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOM TEXT LAYER */}
            {activeToolTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                    Custom Typography ({activeSide === 'front' ? 'Front' : 'Back'})
                  </label>
                  <input
                    type="text"
                    value={currentText.text}
                    maxLength={28}
                    placeholder="e.g. ATELIER EDITION 04"
                    onChange={(e) => {
                      setActiveLayerFocus('text');
                      setCurrentText((prev) => ({...prev, text: e.target.value}));
                    }}
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {id: 'display', label: 'Grotesk'},
                      {id: 'mono', label: 'Monospace'},
                      {id: 'serif', label: 'Editorial'},
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setActiveLayerFocus('text');
                        setCurrentText((prev) => ({...prev, font: f.id}));
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                        currentText.font === f.id
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div>
                  <span className="block text-xs font-semibold text-zinc-900 mb-2">
                    Ink Color
                  </span>
                  <div className="flex items-center gap-2">
                    {['#FAFAFA', '#09090B', '#E63918', '#D97706', '#2563EB', '#A3E635'].map(
                      (inkHex) => (
                        <button
                          key={inkHex}
                          type="button"
                          aria-label={`Ink color ${inkHex}`}
                          onClick={() => {
                            setActiveLayerFocus('text');
                            setCurrentText((prev) => ({...prev, color: inkHex}));
                          }}
                          style={{backgroundColor: inkHex}}
                          className={`w-8 h-8 rounded-full border cursor-pointer ${
                            currentText.color === inkHex
                              ? 'ring-2 ring-offset-2 ring-zinc-950 border-zinc-400'
                              : 'border-zinc-300'
                          }`}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-600">Font Size</span>
                    <span className="font-mono tabular-nums font-medium">
                      {currentText.fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={36}
                    value={currentText.fontSize}
                    onChange={(e) => {
                      setActiveLayerFocus('text');
                      setCurrentText((prev) => ({
                        ...prev,
                        fontSize: Number(e.target.value),
                      }));
                    }}
                    className="w-full accent-[#E63918] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-600">Letter Tracking</span>
                    <span className="font-mono tabular-nums font-medium">
                      {currentText.letterSpacing}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    value={currentText.letterSpacing}
                    onChange={(e) => {
                      setActiveLayerFocus('text');
                      setCurrentText((prev) => ({
                        ...prev,
                        letterSpacing: Number(e.target.value),
                      }));
                    }}
                    className="w-full accent-[#E63918] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: GARMENT BLANK, COLOR & SIZE */}
            {activeToolTab === 'garment' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-2">
                    Select Blank Silhouette
                  </label>
                  <div className="space-y-2">
                    {customizableProducts.map((p) => {
                      const active = p.id === selectedProduct.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProductId(p.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            active
                              ? 'border-zinc-950 bg-zinc-50'
                              : 'border-zinc-200 hover:border-zinc-400 bg-white'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-zinc-950">{p.name}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {p.fabricWeight} · {p.fit}
                            </p>
                          </div>
                          <span className="font-mono tabular-nums text-xs font-semibold text-zinc-950">
                            ${p.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold text-zinc-900">Garment Color</span>
                    <span className="text-zinc-600">{selectedColor.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedProduct.colors.map((color) => {
                      const active = color.name === selectedColor.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          aria-label={color.name}
                          onClick={() => setSelectedColor(color)}
                          style={{backgroundColor: color.hex}}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${
                            active
                              ? 'ring-2 ring-offset-2 ring-zinc-950 border-zinc-400'
                              : 'border-zinc-300'
                          }`}
                        >
                          {active && (
                            <Check className="w-4 h-4" style={{color: color.textOnHex}} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-zinc-900 mb-2">
                    Size &amp; Stock
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {ALL_SIZES.map((size) => {
                      const stock = selectedProduct.stock[size] ?? 0;
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={stock <= 0}
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 rounded-lg border text-center cursor-pointer disabled:opacity-40 ${
                            active
                              ? 'bg-zinc-950 text-white border-zinc-950'
                              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <div className="text-xs font-semibold">{size}</div>
                          <div className="text-[10px] font-mono tabular-nums opacity-75">
                            {stock}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PRINT METHOD & FINISH */}
            {activeToolTab === 'print' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-zinc-900">
                  Select Studio Print Technique
                </p>
                <div className="space-y-2.5">
                  {PRINT_METHOD_OPTIONS.map((opt) => {
                    const active = printMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrintMethod(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          active
                            ? 'border-zinc-950 bg-zinc-50'
                            : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-zinc-950">{opt.label}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{opt.sub}</p>
                        </div>
                        <span className="font-mono tabular-nums text-xs font-semibold text-zinc-900">
                          {opt.surcharge === 0 ? 'Included' : `+$${opt.surcharge}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Persistent Pricing & Add to Bag Footer */}
            <div className="pt-5 border-t border-zinc-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Base Blank ({selectedSize} · {selectedColor.name})</span>
                  <span className="font-mono tabular-nums">${selectedProduct.price.toFixed(2)}</span>
                </div>
                {printSurcharge > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Specialty Print Finish</span>
                    <span className="font-mono tabular-nums">+${printSurcharge.toFixed(2)}</span>
                  </div>
                )}
                {dualSideFee > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Dual-Side Front &amp; Back Print</span>
                    <span className="font-mono tabular-nums">+${dualSideFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-zinc-950 pt-1.5 border-t border-zinc-100">
                  <span>Custom Unit Price</span>
                  <span className="font-mono tabular-nums">${unitPrice.toFixed(2)}</span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center gap-2.5">
                <div className="flex items-center border border-zinc-300 rounded-lg h-11">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-full text-sm font-semibold hover:bg-zinc-100 rounded-l-lg cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono tabular-nums text-xs font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1))
                    }
                    className="w-9 h-full text-sm font-semibold hover:bg-zinc-100 rounded-r-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={adding || availableStock <= 0}
                  onClick={handleAddCustomToBag}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 px-5 bg-[#E63918] hover:bg-[#cf3012] disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Custom Tee Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {adding
                          ? 'Rendering Proof...'
                          : `Add Custom Tee · $${(unitPrice * quantity).toFixed(2)}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
