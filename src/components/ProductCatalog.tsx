import {useMemo, useState} from 'react';
import {ArrowUpRight, Heart, SlidersHorizontal} from 'lucide-react';
import {motion} from 'motion/react';
import {
  ALL_SIZES,
  type Product,
  type ProductCategory,
  type ProductReview,
} from '../shared/types';
import {ResilientImage} from './ResilientImage';
import {StarRatingDisplay} from './StarRating';

interface ProductCatalogProps {
  products: Product[];
  reviews: ProductReview[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onCustomizeProduct: (product: Product) => void;
  onOpenProductReviews: (productId: string) => void;
}

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Heavyweight',
  'Oversized',
  'Graphic Drops',
  'Custom Blanks',
];

export function ProductCatalog({
  products,
  reviews,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onCustomizeProduct,
  onOpenProductReviews,
}: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const filteredProducts = useMemo(() => {
    const list =
      selectedCategory === 'All'
        ? [...products]
        : products.filter((p) => p.category === selectedCategory);
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, selectedCategory, sortBy]);

  const getTotalStock = (p: Product) =>
    ALL_SIZES.reduce((sum, s) => sum + (p.stock[s] ?? 0), 0);

  return (
    <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Curated Apparel &amp; Custom Blanks
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Studio Collection
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive Category Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-zinc-950'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="catalog-category-pill"
                      transition={{type: 'spring', stiffness: 440, damping: 34}}
                      className="absolute inset-0 bg-white rounded-md shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span className="sr-only">Sort products</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
              }
              className="bg-transparent text-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>
      </div>

      {/* 3-Column Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-300 rounded-xl mt-8 bg-white">
          <p className="text-sm font-medium text-zinc-900">
            No garments match this category filter.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="mt-3 text-xs font-semibold text-[#E63918] hover:underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
          {filteredProducts.map((product, idx) => {
            const totalStock = getTotalStock(product);
            const hasLowSize = ALL_SIZES.some(
              (s) => product.stock[s] > 0 && product.stock[s] <= product.reorderPoint,
            );
            const isWishlisted = wishlistIds.includes(product.id);
            const productReviews = reviews.filter((r) => r.productId === product.id);
            const avgRating =
              productReviews.length > 0
                ? productReviews.reduce((s, r) => s + r.rating, 0) /
                  productReviews.length
                : 0;
            return (
              <motion.article
                key={product.id}
                layout
                initial={{opacity: 0, y: 18}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.12}}
                transition={{
                  duration: 0.45,
                  delay: (idx % 3) * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{y: -3}}
                className="group flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-[0_12px_28px_rgba(9,9,11,0.07)]"
              >
                {/* Product Gallery Image (4:3 uniform aspect ratio) */}
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

                  {/* Wishlist Heart Toggle */}
                  <button
                    type="button"
                    aria-label={
                      isWishlisted
                        ? `Remove ${product.name} from wishlist`
                        : `Save ${product.name} to wishlist`
                    }
                    aria-pressed={isWishlisted}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 hover:bg-white border border-zinc-200 shadow-sm inline-flex items-center justify-center transition-transform duration-150 hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors duration-150 ${
                        isWishlisted
                          ? 'fill-[#E63918] text-[#E63918]'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Quiet unboxed metadata line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-2">
                      <span className="truncate">
                        {product.category} <span aria-hidden="true">·</span>{' '}
                        {product.fabricWeight}
                      </span>
                      <span className="font-mono tabular-nums shrink-0 text-zinc-600">
                        {totalStock === 0
                          ? 'Out of Stock'
                          : hasLowSize
                            ? `${totalStock} units · Low sizes`
                            : `${totalStock} in stock`}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-4 mb-3">
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

                    {/* Rating & Color Swatch Dots */}
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div className="flex items-center gap-2">
                        {product.colors.map((c) => (
                          <span
                            key={c.name}
                            title={c.name}
                            style={{backgroundColor: c.hex}}
                            className="w-4 h-4 rounded-full border border-zinc-300 inline-block"
                          />
                        ))}
                        <span className="text-xs text-zinc-500 ml-1">
                          {product.colors.length} colorways
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenProductReviews(product.id)}
                        className="hover:underline cursor-pointer"
                        aria-label={`View reviews for ${product.name}`}
                      >
                        <StarRatingDisplay
                          rating={avgRating}
                          count={productReviews.length}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer min-h-[40px]"
                    >
                      <span>View Gallery</span>
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
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}
