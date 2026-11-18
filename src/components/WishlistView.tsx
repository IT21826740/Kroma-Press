import {ArrowRight, ArrowUpRight, Heart, Trash2} from 'lucide-react';
import {ALL_SIZES, type Product} from '../shared/types';
import {ResilientImage} from './ResilientImage';

interface WishlistViewProps {
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onClearWishlist: () => void;
  onSelectProduct: (product: Product) => void;
  onCustomizeProduct: (product: Product) => void;
  onBrowseCatalog: () => void;
}

export function WishlistView({
  products,
  wishlistIds,
  onToggleWishlist,
  onClearWishlist,
  onSelectProduct,
  onCustomizeProduct,
  onBrowseCatalog,
}: WishlistViewProps) {
  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  const getTotalStock = (p: Product) =>
    ALL_SIZES.reduce((sum, s) => sum + (p.stock[s] ?? 0), 0);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            Saved Favorites · Synced Locally
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Your Wishlist{' '}
            <span className="font-mono tabular-nums text-zinc-500 font-medium text-xl">
              ({savedProducts.length})
            </span>
          </h1>
        </div>

        {savedProducts.length > 0 && (
          <button
            type="button"
            onClick={onClearWishlist}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-red-700 bg-white border border-zinc-200 hover:border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Wishlist</span>
          </button>
        )}
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-zinc-300 rounded-2xl mt-8 px-6">
          <Heart className="w-10 h-10 text-zinc-300 mx-auto mb-3 stroke-[1.5]" />
          <h2 className="font-display text-lg font-bold text-zinc-950">
            No saved T-shirts yet
          </h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1.5 mb-6">
            Tap the heart icon on any T-shirt in the catalog to bookmark blanks and graphic drops for quick customization or checkout later.
          </p>
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Browse Studio Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
          {savedProducts.map((product) => {
            const totalStock = getTotalStock(product);
            return (
              <article
                key={product.id}
                className="group flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(9,9,11,0.06)]"
              >
                <div className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="w-full h-full block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-950"
                  >
                    <ResilientImage
                      src={product.gallery[0]?.url || ''}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      fallbackTitle={product.name}
                    />
                  </button>

                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    aria-pressed={true}
                    onClick={() => onToggleWishlist(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 hover:bg-white border border-zinc-200 shadow-sm inline-flex items-center justify-center transition-transform duration-150 hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                  >
                    <Heart className="w-4 h-4 fill-[#E63918] text-[#E63918]" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-2">
                      <span className="truncate">
                        {product.category} <span aria-hidden="true">·</span>{' '}
                        {product.fabricWeight}
                      </span>
                      <span className="font-mono tabular-nums shrink-0 text-zinc-600">
                        {totalStock === 0 ? 'Out of Stock' : `${totalStock} in stock`}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="text-left font-display text-base font-semibold text-zinc-950 hover:text-[#E63918] transition-colors cursor-pointer"
                      >
                        {product.name}
                      </button>
                      <span className="font-mono tabular-nums text-[15px] font-semibold text-zinc-950 shrink-0">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer min-h-[40px]"
                    >
                      <span>Select Size</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    {product.customizable && (
                      <button
                        type="button"
                        onClick={() => onCustomizeProduct(product)}
                        className="px-3.5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                      >
                        Customize
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
