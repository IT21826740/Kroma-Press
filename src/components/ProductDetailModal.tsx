import {useEffect, useState} from 'react';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Heart,
  Maximize2,
  MessageCircle,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Upload,
  X,
} from 'lucide-react';
import {
  ALL_SIZES,
  buildWhatsAppUrl,
  type CartItem,
  type GarmentColor,
  type Product,
  type ProductReview,
  type SizeCode,
} from '../shared/types';
import {ResilientImage} from './ResilientImage';
import {StarRatingDisplay} from './StarRating';
import {TshirtSvgMockup} from './TshirtSvgMockup';

interface ProductDetailModalProps {
  product: Product | null;
  reviews: ProductReview[];
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onClose: () => void;
  onAddToBag: (item: CartItem) => void;
  onCustomizeBlank: (product: Product, color: GarmentColor, size: SizeCode) => void;
  onOpenProductReviews: (productId: string) => void;
}

const SIZE_CHART: {size: SizeCode; chest: string; length: string; shoulder: string}[] = [
  {size: 'S', chest: '41.0"', length: '27.5"', shoulder: '19.5"'},
  {size: 'M', chest: '43.5"', length: '28.5"', shoulder: '20.5"'},
  {size: 'L', chest: '46.0"', length: '29.5"', shoulder: '21.5"'},
  {size: 'XL', chest: '48.5"', length: '30.5"', shoulder: '22.5"'},
  {size: '2XL', chest: '51.0"', length: '31.5"', shoulder: '23.5"'},
];

export function ProductDetailModal({
  product,
  reviews,
  isWishlisted,
  onToggleWishlist,
  onClose,
  onAddToBag,
  onCustomizeBlank,
  onOpenProductReviews,
}: ProductDetailModalProps) {
  const [selectedColor, setSelectedColor] = useState<GarmentColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeCode>('L');
  const [quantity, setQuantity] = useState(1);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [showColorwayPreview, setShowColorwayPreview] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [showSpecs, setShowSpecs] = useState(true);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    setSelectedColor(product.colors[0]);
    const firstInStock = ALL_SIZES.find((s) => product.stock[s] > 0) || 'M';
    setSelectedSize(firstInStock);
    setQuantity(1);
    setActiveGalleryIdx(0);
    setShowColorwayPreview(false);
    setZoomOpen(false);
    setJustAdded(false);
  }, [product]);

  if (!product || !selectedColor) return null;

  const availableForSize = product.stock[selectedSize] ?? 0;
  const activePhoto = product.gallery[activeGalleryIdx] || product.gallery[0];
  const productReviews = reviews.filter((r) => r.productId === product.id);
  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0;

  const handleAdd = () => {
    if (availableForSize <= 0) return;
    const safeQty = Math.min(quantity, availableForSize);
    onAddToBag({
      cartItemId: `cat-${product.id}-${selectedColor.name}-${selectedSize}-${Date.now()}`,
      type: 'catalog',
      productId: product.id,
      sku: product.sku,
      name: product.name,
      colorName: selectedColor.name,
      colorHex: selectedColor.hex,
      size: selectedSize,
      quantity: safeQty,
      unitPrice: product.price,
      thumbnailUrl: product.gallery[0]?.url || '',
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-zinc-200 bg-white shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{product.sku}</span>
            <span aria-hidden="true">·</span>
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.fit}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label={
                isWishlisted
                  ? `Remove ${product.name} from wishlist`
                  : `Save ${product.name} to wishlist`
              }
              aria-pressed={isWishlisted}
              className={`h-10 px-3.5 inline-flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                isWishlisted
                  ? 'border-[#E63918]/30 bg-[#E63918]/5 text-[#E63918]'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isWishlisted ? 'fill-[#E63918] text-[#E63918]' : ''
                }`}
              />
              <span>{isWishlisted ? 'Saved' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close product gallery"
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Two-Column Contiguous PDP Layout */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-5 sm:p-8">
            {/* Left: Multi-Angle Product Gallery (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[4/3] w-full rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                {showColorwayPreview ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-zinc-100">
                    <TshirtSvgMockup
                      color={selectedColor}
                      side="front"
                      className="w-full max-w-[320px]"
                    />
                    <span className="mt-2 text-xs font-medium text-zinc-600">
                      Interactive Blank Colorway Preview · {selectedColor.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <ResilientImage
                      src={activePhoto?.url || ''}
                      alt={`${product.name} — ${activePhoto?.label || 'Gallery view'}`}
                      className="w-full h-full object-cover"
                      fallbackTitle={product.name}
                    />
                    <button
                      type="button"
                      onClick={() => setZoomOpen(true)}
                      aria-label="Inspect high-resolution image"
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-zinc-900 text-xs font-medium rounded-lg border border-zinc-200 shadow-sm cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </>
                )}
              </div>

              {/* Active Photo Caption */}
              {!showColorwayPreview && activePhoto && (
                <div className="flex items-center justify-between text-xs text-zinc-600 px-1">
                  <span className="font-medium text-zinc-900">{activePhoto.label}</span>
                  <span>{activePhoto.caption}</span>
                </div>
              )}

              {/* Gallery Thumbnail Strip */}
              <div className="grid grid-cols-4 gap-3">
                {product.gallery.map((img, idx) => {
                  const isActive = !showColorwayPreview && activeGalleryIdx === idx;
                  return (
                    <button
                      key={img.label + idx}
                      type="button"
                      onClick={() => {
                        setShowColorwayPreview(false);
                        setActiveGalleryIdx(idx);
                      }}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isActive
                          ? 'border-zinc-950 ring-2 ring-zinc-950/20'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <ResilientImage
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover"
                        fallbackTitle={img.label}
                      />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowColorwayPreview(true)}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden border flex flex-col items-center justify-center p-2 bg-zinc-100 transition-all cursor-pointer ${
                    showColorwayPreview
                      ? 'border-zinc-950 ring-2 ring-zinc-950/20'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-zinc-300 mb-1"
                    style={{backgroundColor: selectedColor.hex}}
                  />
                  <span className="text-[11px] font-medium text-zinc-700 leading-tight text-center">
                    Live Color
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Contiguous Purchase Module (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="pb-5 border-b border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1.5">
                  {product.fabricWeight} <span aria-hidden="true">·</span>{' '}
                  {product.printMethodDefault}
                </p>
                <h2
                  id="pdp-title"
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 mb-2"
                >
                  {product.name}
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono tabular-nums text-2xl font-bold text-zinc-950">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Free shipping $95+
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenProductReviews(product.id)}
                    className="hover:underline cursor-pointer"
                  >
                    <StarRatingDisplay
                      rating={avgRating}
                      count={productReviews.length}
                      size="md"
                    />
                  </button>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed mt-3">
                  {product.description}
                </p>
              </div>

              {/* Colorway Selector */}
              <div className="py-5 border-b border-zinc-200">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-zinc-900">Garment Color</span>
                  <span className="text-zinc-600">{selectedColor.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {product.colors.map((color) => {
                    const active = selectedColor.name === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        aria-label={`Select color ${color.name}`}
                        onClick={() => {
                          setSelectedColor(color);
                          setShowColorwayPreview(true);
                        }}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-transform cursor-pointer ${
                          active
                            ? 'ring-2 ring-offset-2 ring-zinc-950 scale-105 border-zinc-400'
                            : 'border-zinc-300 hover:scale-105'
                        }`}
                        style={{backgroundColor: color.hex}}
                      >
                        {active && (
                          <Check
                            className="w-4 h-4"
                            style={{color: color.textOnHex}}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Matrix with Real-Time Stock Count */}
              <div className="py-5 border-b border-zinc-200">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-zinc-900">
                    Size &amp; Live Inventory
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-950 font-medium cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {ALL_SIZES.map((size) => {
                    const count = product.stock[size] ?? 0;
                    const active = selectedSize === size;
                    const soldOut = count <= 0;
                    const low = count > 0 && count <= product.reorderPoint;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          setSelectedSize(size);
                          setQuantity(1);
                        }}
                        className={`py-2.5 px-2 rounded-lg border text-center transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          active
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <div className="text-xs font-semibold">{size}</div>
                        <div
                          className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                            active
                              ? 'text-zinc-300'
                              : low
                                ? 'text-[#E63918] font-semibold'
                                : 'text-zinc-500'
                          }`}
                        >
                          {soldOut ? 'Out' : `${count} left`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {showSizeGuide && (
                  <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-zinc-500 border-b border-zinc-200">
                          <th className="py-1.5 font-medium">Size</th>
                          <th className="py-1.5 font-medium">Chest</th>
                          <th className="py-1.5 font-medium">Length</th>
                          <th className="py-1.5 font-medium">Shoulder</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono tabular-nums text-zinc-800">
                        {SIZE_CHART.map((row) => (
                          <tr key={row.size} className="border-b border-zinc-100 last:border-0">
                            <td className="py-1.5 font-semibold">{row.size}</td>
                            <td className="py-1.5">{row.chest}</td>
                            <td className="py-1.5">{row.length}</td>
                            <td className="py-1.5">{row.shoulder}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quantity & Purchase CTAs */}
              <div className="py-5 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Stepper */}
                  <div className="inline-flex items-center border border-zinc-300 rounded-lg bg-white h-11">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-full inline-flex items-center justify-center text-zinc-700 hover:bg-zinc-100 rounded-l-lg cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono tabular-nums text-sm font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        setQuantity((q) => Math.min(Math.max(1, availableForSize), q + 1))
                      }
                      className="w-10 h-full inline-flex items-center justify-center text-zinc-700 hover:bg-zinc-100 rounded-r-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Add to Bag */}
                  <button
                    type="button"
                    disabled={availableForSize <= 0}
                    onClick={handleAdd}
                    className="flex-1 h-11 inline-flex items-center justify-center gap-2 px-5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {availableForSize <= 0
                            ? 'Out of Stock'
                            : `Add to Bag · $${(product.price * quantity).toFixed(2)}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {product.customizable && (
                  <button
                    type="button"
                    onClick={() => onCustomizeBlank(product, selectedColor, selectedSize)}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 bg-[#E63918] hover:bg-[#cf3012] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Custom Art on This Blank</span>
                  </button>
                )}
              </div>

              {/* Specifications Accordion */}
              <div className="pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowSpecs((prev) => !prev)}
                  className="w-full flex items-center justify-between py-2.5 text-xs font-semibold text-zinc-900 cursor-pointer"
                >
                  <span>Garment &amp; Print Specifications</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showSpecs ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {showSpecs && (
                  <dl className="divide-y divide-zinc-100 text-xs mt-1">
                    {product.specs.map((spec) => (
                      <div key={spec.label} className="py-2 flex justify-between gap-4">
                        <dt className="text-zinc-500">{spec.label}</dt>
                        <dd className="font-medium text-zinc-900 text-right">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {/* Customer Reviews & WhatsApp Contact */}
              <div className="pt-4 mt-4 border-t border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900">
                    Customer Reviews ({productReviews.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenProductReviews(product.id)}
                    className="text-xs font-semibold text-[#E63918] hover:underline cursor-pointer"
                  >
                    Write or View All Reviews
                  </button>
                </div>

                {productReviews.length > 0 ? (
                  <div className="space-y-2.5">
                    {productReviews.slice(0, 2).map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <StarRatingDisplay rating={rev.rating} showNumeric={false} />
                          <span className="text-zinc-500">{rev.authorName}</span>
                        </div>
                        <p className="font-semibold text-zinc-900">{rev.title}</p>
                        <p className="text-zinc-600 line-clamp-2">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    No reviews yet. Share your print photos and rating in the Reviews page.
                  </p>
                )}

                <a
                  href={buildWhatsAppUrl(
                    `Hi Kroma Press, I have a question about the ${product.name} (${selectedColor.name}, size ${selectedSize}).`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                  <span>Ask Owner About This Tee on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Res Lightbox Zoom */}
      {zoomOpen && !showColorwayPreview && activePhoto && (
        <div
          className="fixed inset-0 z-[60] bg-zinc-950/90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setZoomOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoomed preview"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white text-zinc-950 inline-flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={activePhoto.url}
            alt={activePhoto.label}
            className="max-w-full max-h-[88vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
