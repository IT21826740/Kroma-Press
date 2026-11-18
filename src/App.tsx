import {useCallback, useEffect, useState} from 'react';
import {ShieldCheck} from 'lucide-react';
import {AnimatePresence, motion, MotionConfig} from 'motion/react';
import {AdminPortal} from './components/admin/AdminPortal';
import {CartDrawer} from './components/CartDrawer';
import {CheckoutModal} from './components/CheckoutModal';
import {CraftSection} from './components/CraftSection';
import {CustomStudio} from './components/CustomStudio';
import {HeroSection} from './components/HeroSection';
import {type ActiveTab, Navbar} from './components/Navbar';
import {OrderTrackingView} from './components/OrderTrackingView';
import {ProductCatalog} from './components/ProductCatalog';
import {ProductDetailModal} from './components/ProductDetailModal';
import {ReviewsView} from './components/ReviewsView';
import {WhatsAppContactWidget} from './components/WhatsAppContactWidget';
import {WishlistView} from './components/WishlistView';
import {
  buildWhatsAppUrl,
  type CartItem,
  type GarmentColor,
  type InventoryLog,
  type Order,
  type Product,
  type ProductReview,
  type SizeCode,
} from './shared/types';

const CART_STORAGE_KEY = 'kroma_press_cart_v1';
const WISHLIST_STORAGE_KEY = 'kroma_press_wishlist_v1';
const MY_ORDERS_STORAGE_KEY = 'kroma_press_my_orders_v1';

type PortalMode = 'customer' | 'admin';

export default function App() {
  const [portalMode, setPortalMode] = useState<PortalMode>(() =>
    window.location.hash === '#admin' ? 'admin' : 'customer',
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewProductFilter, setReviewProductFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [studioPreset, setStudioPreset] = useState<{
    product: Product | null;
    color: GarmentColor | null;
    size: SizeCode | null;
  }>({product: null, color: null, size: null});

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [myOrderCodes, setMyOrderCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MY_ORDERS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackCodeTarget, setTrackCodeTarget] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setPortalMode(window.location.hash === '#admin' ? 'admin' : 'customer');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const switchPortal = (mode: PortalMode) => {
    setPortalMode(mode);
    window.location.hash = mode === 'admin' ? '#admin' : '';
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors for large custom images
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(MY_ORDERS_STORAGE_KEY, JSON.stringify(myOrderCodes));
    } catch {
      // Ignore storage quota errors
    }
  }, [myOrderCodes]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [prodRes, ordRes, logRes, revRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/inventory/logs'),
        fetch('/api/reviews'),
      ]);
      if (!prodRes.ok || !ordRes.ok || !logRes.ok || !revRes.ok) {
        throw new Error('Failed to load storefront data');
      }
      const [prodData, ordData, logData, revData] = await Promise.all([
        prodRes.json(),
        ordRes.json(),
        logRes.json(),
        revRes.json(),
      ]);
      setProducts(prodData.products || []);
      setOrders(ordData.orders || []);
      setLogs(logData.logs || []);
      setReviews(revData.reviews || []);
    } catch {
      setLoadError('Unable to reach the Kroma Press studio API. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddToBag = (item: CartItem) => {
    setCart((prev) => {
      if (item.type === 'catalog') {
        const existingIdx = prev.findIndex(
          (i) =>
            i.type === 'catalog' &&
            i.productId === item.productId &&
            i.colorName === item.colorName &&
            i.size === item.size,
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + item.quantity,
          };
          return updated;
        }
      }
      return [...prev, item];
    });
    setSelectedProduct(null);
    setCartOpen(true);
  };

  const handleReorderItems = (orderItems: CartItem[]) => {
    setCart((prev) => {
      const next = [...prev];
      for (const item of orderItems) {
        const cloned: CartItem = {
          ...item,
          cartItemId: `reorder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        if (cloned.type === 'catalog') {
          const existingIdx = next.findIndex(
            (i) =>
              i.type === 'catalog' &&
              i.productId === cloned.productId &&
              i.colorName === cloned.colorName &&
              i.size === cloned.size,
          );
          if (existingIdx >= 0) {
            next[existingIdx] = {
              ...next[existingIdx],
              quantity: next[existingIdx].quantity + cloned.quantity,
            };
            continue;
          }
        }
        next.push(cloned);
      }
      return next;
    });
    setCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? {...item, quantity: Math.max(0, item.quantity + delta)}
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleOpenStudioWithProduct = (
    product: Product,
    color?: GarmentColor,
    size?: SizeCode,
  ) => {
    setSelectedProduct(null);
    setStudioPreset({
      product,
      color: color || product.colors[0],
      size: size || 'L',
    });
    setActiveTab('studio');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleOrderSuccess = (data: {
    order: Order;
    products: Product[];
    inventoryLogs: InventoryLog[];
  }) => {
    setOrders((prev) => [data.order, ...prev]);
    setMyOrderCodes((prev) =>
      prev.includes(data.order.trackingCode)
        ? prev
        : [data.order.trackingCode, ...prev],
    );
    setProducts(data.products);
    setLogs(data.inventoryLogs);
    setCart([]);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleClearWishlist = () => {
    setWishlistIds([]);
  };

  const handleOpenProductReviews = (productId: string) => {
    setSelectedProduct(null);
    setReviewProductFilter(productId);
    setActiveTab('reviews');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const totalBagCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (portalMode === 'admin') {
    return (
      <MotionConfig reducedMotion="user">
        {loading ? (
          <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center">
            <p className="text-sm font-medium text-zinc-600">
              Loading Kroma Press Admin Studio...
            </p>
          </div>
        ) : (
          <AdminPortal
            products={products}
            orders={orders}
            logs={logs}
            reviews={reviews}
            onExitAdmin={() => switchPortal('customer')}
            onRefreshAll={fetchAllData}
            onUpdateData={(data) => {
              if (data.products) setProducts(data.products);
              if (data.orders) setOrders(data.orders);
              if (data.logs) setLogs(data.logs);
              if (data.reviews) setReviews(data.reviews);
            }}
          />
        )}
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          cartCount={totalBagCount}
          wishlistCount={wishlistIds.length}
          onOpenCart={() => setCartOpen(true)}
        />

        <main className="flex-1">
          {loading ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
              <p className="text-sm font-medium text-zinc-600">
                Loading Kroma Press storefront &amp; live inventory...
              </p>
            </div>
          ) : loadError ? (
            <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
              <p className="text-sm font-medium text-red-600">{loadError}</p>
              <button
                type="button"
                onClick={fetchAllData}
                className="px-5 py-2.5 bg-zinc-950 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -6}}
                transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
              >
                {activeTab === 'catalog' && (
                  <>
                    <HeroSection
                      onOpenStudio={() => {
                        setActiveTab('studio');
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }}
                      onBrowseCatalog={() => {
                        document
                          .getElementById('catalog-section')
                          ?.scrollIntoView({behavior: 'smooth'});
                      }}
                    />
                    <ProductCatalog
                      products={products}
                      reviews={reviews}
                      wishlistIds={wishlistIds}
                      onToggleWishlist={handleToggleWishlist}
                      onSelectProduct={(p) => setSelectedProduct(p)}
                      onCustomizeProduct={(p) => handleOpenStudioWithProduct(p)}
                      onOpenProductReviews={handleOpenProductReviews}
                    />
                    <CraftSection
                      onOpenStudio={() => {
                        setActiveTab('studio');
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }}
                    />
                  </>
                )}

                {activeTab === 'studio' && (
                  <CustomStudio
                    products={products}
                    initialProduct={studioPreset.product}
                    initialColor={studioPreset.color}
                    initialSize={studioPreset.size}
                    onAddToBag={handleAddToBag}
                  />
                )}

                {activeTab === 'reviews' && (
                  <ReviewsView
                    products={products}
                    reviews={reviews}
                    initialProductFilter={reviewProductFilter}
                    onReviewSubmitted={(updatedReviews) =>
                      setReviews(updatedReviews)
                    }
                  />
                )}

                {activeTab === 'wishlist' && (
                  <WishlistView
                    products={products}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleToggleWishlist}
                    onClearWishlist={handleClearWishlist}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                    onCustomizeProduct={(p) => handleOpenStudioWithProduct(p)}
                    onBrowseCatalog={() => {
                      setActiveTab('catalog');
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrderTrackingView
                    orders={orders}
                    initialTrackingCode={trackCodeTarget}
                    myOrderCodes={myOrderCodes}
                    onReorderItems={handleReorderItems}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Clean Customer Footer with Dedicated Admin Portal Entry */}
        <footer className="border-t border-zinc-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-zinc-950 text-sm">
                Kroma Press
              </span>
              <span aria-hidden="true">·</span>
              <span>Custom Heavyweight Apparel &amp; Print Studio</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('catalog');
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="hover:text-zinc-950 cursor-pointer whitespace-nowrap"
              >
                Catalog
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('studio');
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="hover:text-zinc-950 cursor-pointer whitespace-nowrap"
              >
                Custom Studio
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewProductFilter('all');
                  setActiveTab('reviews');
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="hover:text-zinc-950 cursor-pointer whitespace-nowrap"
              >
                Reviews
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('wishlist');
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="hover:text-zinc-950 cursor-pointer whitespace-nowrap"
              >
                Wishlist
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('orders');
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="hover:text-zinc-950 cursor-pointer whitespace-nowrap"
              >
                Orders &amp; Tracking
              </button>
              <a
                href={buildWhatsAppUrl(
                  'Hi Kroma Press, I would like to chat with the store owner.',
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#15803D] hover:underline whitespace-nowrap"
              >
                WhatsApp Owner
              </a>
              <button
                type="button"
                onClick={() => switchPortal('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-zinc-50 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 text-zinc-900 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            </div>
          </div>
        </footer>

        {/* Modals & Drawers */}
        <ProductDetailModal
          product={selectedProduct}
          reviews={reviews}
          isWishlisted={
            selectedProduct ? wishlistIds.includes(selectedProduct.id) : false
          }
          onToggleWishlist={handleToggleWishlist}
          onClose={() => setSelectedProduct(null)}
          onAddToBag={handleAddToBag}
          onCustomizeBlank={(p, c, s) => handleOpenStudioWithProduct(p, c, s)}
          onOpenProductReviews={handleOpenProductReviews}
        />

        <CartDrawer
          open={cartOpen}
          items={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedToCheckout={() => {
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
        />

        <CheckoutModal
          open={checkoutOpen}
          items={cart}
          onClose={() => setCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
          onTrackOrder={(code) => {
            setTrackCodeTarget(code);
            setActiveTab('orders');
            window.scrollTo({top: 0, behavior: 'smooth'});
          }}
        />

        <WhatsAppContactWidget />
      </div>
    </MotionConfig>
  );
}
