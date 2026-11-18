import type React from 'react';
import {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Boxes,
  Check,
  Eye,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ALL_SIZES,
  type DemoInquiry,
  type InventoryLog,
  type Order,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SEQUENCE,
  type OrderStatus,
  type Product,
  type ProductCategory,
  type ProductReview,
  type StoreSettings,
} from '../../shared/types';
import {InventoryDashboard} from '../InventoryDashboard';
import {ResilientImage} from '../ResilientImage';
import {StarRatingDisplay} from '../StarRating';

export type AdminSection =
  | 'overview'
  | 'orders'
  | 'inventory'
  | 'products'
  | 'reviews'
  | 'settings';

interface AdminPortalProps {
  products: Product[];
  orders: Order[];
  logs: InventoryLog[];
  reviews: ProductReview[];
  storeSettings: StoreSettings;
  demoInquiries: DemoInquiry[];
  onUpdateStoreSettings: (settings: StoreSettings) => void;
  onClearDemoInquiries: () => void;
  onExitAdmin: () => void;
  onRefreshAll: () => void;
  onUpdateData: (data: {
    products?: Product[];
    orders?: Order[];
    logs?: InventoryLog[];
    reviews?: ProductReview[];
  }) => void;
}

const STUDIO_ASSET_PRESETS = [
  {
    label: 'Obsidian Boxy Studio',
    url: '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
  },
  {
    label: 'Chalk Graphic Flat',
    url: '/src/assets/images/tee_vintage_chalk_1795015673960.jpg',
  },
  {
    label: 'Washed Olive Oversized',
    url: '/src/assets/images/tee_olive_oversized_1795015674006.jpg',
  },
  {
    label: 'Atelier Campaign Look',
    url: '/src/assets/images/hero_tshirt_studio_1795015673323.jpg',
  },
  {
    label: 'DTG Press Detail',
    url: '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
  },
];

const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Heavyweight',
  'Oversized',
  'Graphic Drops',
  'Custom Blanks',
];

const SECTION_META: Record<AdminSection, {title: string; subtitle: string}> = {
  overview: {
    title: 'Executive Overview',
    subtitle: 'Storefront revenue, custom print volume, and fulfillment pipeline',
  },
  orders: {
    title: 'Orders & Custom Proofs',
    subtitle: 'Manage customer orders, inspect uploaded artwork, and advance print stages',
  },
  inventory: {
    title: 'Inventory & Auto-Restock',
    subtitle: 'Live SKU stock matrix, threshold triggers, and automated warehouse ledger',
  },
  products: {
    title: 'Product Catalog Manager',
    subtitle: 'Edit garment pricing, specs, or publish new blank & graphic T-shirts',
  },
  reviews: {
    title: 'Review Moderation',
    subtitle: 'Inspect verified buyer ratings, customer photos, and moderate submissions',
  },
  settings: {
    title: 'Demo & Store Settings',
    subtitle: 'Configure WhatsApp owner contact or run in built-in Demo Mode with inquiry inbox',
  },
};

export function AdminPortal({
  products,
  orders,
  logs,
  reviews,
  storeSettings,
  demoInquiries,
  onUpdateStoreSettings,
  onClearDemoInquiries,
  onExitAdmin,
  onRefreshAll,
  onUpdateData,
}: AdminPortalProps) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [whatsAppInput, setWhatsAppInput] = useState(
    storeSettings.ownerWhatsAppNumber,
  );
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Orders filter & inspection
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<
    'all' | 'active' | 'delivered' | 'custom'
  >('all');
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Products catalog management
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Custom Blanks');
  const [newWeight, setNewWeight] = useState('280 GSM Organic Ring-Spun');
  const [newFit, setNewFit] = useState('Boxy Drop-Shoulder');
  const [newPrice, setNewPrice] = useState('44');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState(STUDIO_ASSET_PRESETS[0].url);
  const [newCustomizable, setNewCustomizable] = useState(true);
  const [productNotice, setProductNotice] = useState<string | null>(null);

  // Reviews filter
  const [reviewProductId, setReviewProductId] = useState<string>('all');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number>(0);

  const metrics = useMemo(() => {
    const grossRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const customOrders = orders.filter((o) =>
      o.items.some((i) => i.type === 'custom'),
    );
    const totalUnitsOrdered = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );
    let lowStockCount = 0;
    let totalWarehouseUnits = 0;
    for (const p of products) {
      for (const s of ALL_SIZES) {
        const qty = p.stock[s] ?? 0;
        totalWarehouseUnits += qty;
        if (qty <= p.reorderPoint) lowStockCount += 1;
      }
    }
    const pipelineCounts = ORDER_STATUS_SEQUENCE.reduce(
      (acc, st) => {
        acc[st] = orders.filter((o) => o.status === st).length;
        return acc;
      },
      {} as Record<OrderStatus, number>,
    );

    const avgOrderValue = orders.length > 0 ? grossRevenue / orders.length : 0;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

    return {
      grossRevenue,
      customOrderCount: customOrders.length,
      customSharePct:
        orders.length > 0
          ? Math.round((customOrders.length / orders.length) * 100)
          : 0,
      totalUnitsOrdered,
      lowStockCount,
      totalWarehouseUnits,
      pipelineCounts,
      avgOrderValue,
      avgRating,
    };
  }, [orders, products, reviews]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderFilter === 'active' && o.status === 'delivered') return false;
      if (orderFilter === 'delivered' && o.status !== 'delivered') return false;
      if (
        orderFilter === 'custom' &&
        !o.items.some((i) => i.type === 'custom')
      ) {
        return false;
      }
      if (!q) return true;
      return (
        o.trackingCode.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderFilter]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (reviewProductId !== 'all' && r.productId !== reviewProductId) {
        return false;
      }
      if (reviewRatingFilter > 0 && r.rating !== reviewRatingFilter) {
        return false;
      }
      return true;
    });
  }, [reviews, reviewProductId, reviewRatingFilter]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
  ) => {
    setBusyKey(`ord-${orderId}`);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status}),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        onUpdateData({
          orders: orders.map((o) => (o.id === data.order.id ? data.order : o)),
        });
        if (inspectedOrder?.id === data.order.id) {
          setInspectedOrder(data.order);
        }
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveProductPrice = async (product: Product) => {
    const numeric = Number(priceDraft);
    if (!Number.isFinite(numeric) || numeric < 5) return;
    setBusyKey(`price-${product.id}`);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({price: numeric}),
      });
      const data = await res.json();
      if (res.ok && data.products) {
        onUpdateData({products: data.products});
        setEditingPriceId(null);
        setProductNotice(`Updated ${product.name} price to $${numeric.toFixed(2)}.`);
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleCustomizable = async (product: Product) => {
    setBusyKey(`cust-${product.id}`);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({customizable: !product.customizable}),
      });
      const data = await res.json();
      if (res.ok && data.products) {
        onUpdateData({products: data.products});
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(newPrice);
    if (!newName.trim() || !newSku.trim() || !Number.isFinite(numericPrice)) {
      return;
    }
    setBusyKey('create-product');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: newName.trim(),
          sku: newSku.trim().toUpperCase(),
          category: newCategory,
          fabricWeight: newWeight.trim(),
          fit: newFit.trim(),
          price: numericPrice,
          description: newDescription.trim(),
          customizable: newCustomizable,
          gallery: [
            {
              url: newImageUrl,
              label: 'Studio Primary View',
              caption: `${newName.trim()} — ${newWeight.trim()}`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.products) {
        onUpdateData({products: data.products});
        setShowCreateProduct(false);
        setNewName('');
        setNewSku('');
        setNewDescription('');
        setProductNotice(`Published "${data.product.name}" (${data.product.sku}) to catalog.`);
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setBusyKey(`del-rev-${reviewId}`);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.reviews) {
        onUpdateData({reviews: data.reviews});
      }
    } finally {
      setBusyKey(null);
    }
  };

  const navLinks: {
    id: AdminSection;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: string | number;
  }[] = [
    {id: 'overview', label: 'Overview', icon: LayoutDashboard},
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: orders.filter((o) => o.status !== 'delivered').length,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      badge: metrics.lowStockCount > 0 ? metrics.lowStockCount : undefined,
    },
    {id: 'products', label: 'Products', icon: Shirt, badge: products.length},
    {
      id: 'reviews',
      label: 'Reviews',
      icon: MessageSquareText,
      badge: reviews.length,
    },
    {
      id: 'settings',
      label: 'Demo & Settings',
      icon: Settings,
      badge: demoInquiries.length > 0 ? demoInquiries.length : undefined,
    },
  ];

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E4E4E7]">
      <div className="h-16 px-5 border-b border-[#E4E4E7] flex items-center justify-between">
        <div>
          <span className="font-display text-base font-bold tracking-tight text-zinc-950 block leading-none">
            Kroma Press
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-1 block">
            Studio Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer"
          aria-label="Close admin sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav aria-label="Admin sections" className="flex-1 p-3 space-y-1">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {item.badge !== undefined && (
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    active ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#E4E4E7] space-y-2">
        <div className="px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600">
          <p className="font-semibold text-zinc-950">Operator Session</p>
          <p className="mt-0.5 font-mono">Portland Print Hub #01</p>
        </div>
        <button
          type="button"
          onClick={onExitAdmin}
          className="w-full h-10 inline-flex items-center justify-center gap-2 px-3 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View Customer Storefront</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-zinc-950 flex">
      {/* Persistent Desktop 240px Sidebar */}
      <aside className="hidden lg:block w-[240px] shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-zinc-950/50 flex"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="w-[240px] h-full" onClick={(e) => e.stopPropagation()}>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Admin Utility Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E4E4E7] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              aria-label="Open admin menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs sm:text-sm truncate">
              <span className="text-zinc-500">Kroma Press Admin</span>
              <span className="mx-2 text-zinc-400">/</span>
              <span className="font-semibold text-zinc-950">
                {SECTION_META[section].title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefreshAll}
              className="h-9 px-3 inline-flex items-center gap-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-xs font-medium text-zinc-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
            <button
              type="button"
              onClick={onExitAdmin}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Page Intro */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                {SECTION_META[section].title}
              </h1>
              <p className="text-sm text-zinc-600 mt-1">
                {SECTION_META[section].subtitle}
              </p>
            </div>
            {section === 'products' && (
              <button
                type="button"
                onClick={() => setShowCreateProduct((prev) => !prev)}
                className="h-10 px-4 inline-flex items-center gap-2 bg-[#E63918] hover:bg-[#cf3012] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{showCreateProduct ? 'Close Form' : 'Add New T-Shirt'}</span>
              </button>
            )}
          </div>

          {/* SECTION 1: OVERVIEW */}
          {section === 'overview' && (
            <div className="space-y-6">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E4E4E7] rounded-xl p-5">
                  <p className="text-xs font-medium text-zinc-500">Gross Revenue</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-zinc-950 mt-2">
                    ${metrics.grossRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 font-mono tabular-nums">
                    Avg order ${metrics.avgOrderValue.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white border border-[#E4E4E7] rounded-xl p-5">
                  <p className="text-xs font-medium text-zinc-500">Total Print Orders</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-zinc-950 mt-2">
                    {orders.length}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 font-mono tabular-nums">
                    {metrics.totalUnitsOrdered} total garments ordered
                  </p>
                </div>

                <div className="bg-white border border-[#E4E4E7] rounded-xl p-5">
                  <p className="text-xs font-medium text-zinc-500">Custom Artwork Orders</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-zinc-950 mt-2">
                    {metrics.customOrderCount}
                  </p>
                  <p className="text-xs text-[#E63918] font-medium mt-1 font-mono tabular-nums">
                    {metrics.customSharePct}% custom studio share
                  </p>
                </div>

                <div className="bg-white border border-[#E4E4E7] rounded-xl p-5">
                  <p className="text-xs font-medium text-zinc-500">Low Stock Alerts</p>
                  <p
                    className={`font-mono tabular-nums text-2xl font-bold mt-2 ${
                      metrics.lowStockCount > 0 ? 'text-[#E63918]' : 'text-emerald-700'
                    }`}
                  >
                    {metrics.lowStockCount}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 font-mono tabular-nums">
                    {metrics.totalWarehouseUnits} blank units available
                  </p>
                </div>
              </div>

              {/* 6-Stage Order Pipeline Strip */}
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-zinc-700" />
                    <h2 className="font-display text-base font-bold text-zinc-950">
                      6-Stage Fulfillment Pipeline
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('orders')}
                    className="text-xs font-semibold text-[#E63918] hover:underline cursor-pointer"
                  >
                    Manage Queue →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {ORDER_STATUS_SEQUENCE.map((st) => (
                    <div
                      key={st}
                      className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200"
                    >
                      <p className="text-[11px] font-medium text-zinc-500 truncate">
                        {ORDER_STATUS_LABELS[st]}
                      </p>
                      <p className="font-mono tabular-nums text-xl font-bold text-zinc-950 mt-1">
                        {metrics.pipelineCounts[st] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 2-Col Split: Latest Orders & Low-Stock Watch */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                    <h2 className="font-display text-sm font-bold text-zinc-950">
                      Recent Customer Orders
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSection('orders')}
                      className="text-xs font-medium text-zinc-600 hover:text-zinc-950 cursor-pointer"
                    >
                      View all
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-200">
                    {orders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id}
                        className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-zinc-950">
                              {ord.trackingCode}
                            </span>
                            <span className="text-zinc-400">·</span>
                            <span className="font-medium text-zinc-800 truncate">
                              {ord.customer.name}
                            </span>
                          </div>
                          <p className="text-zinc-500 mt-0.5">
                            {ORDER_STATUS_LABELS[ord.status]} ·{' '}
                            {ord.items.some((i) => i.type === 'custom')
                              ? 'Custom Print'
                              : 'Catalog Drop'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono tabular-nums font-semibold text-zinc-950">
                            ${ord.total.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedOrder(ord)}
                            className="px-2.5 py-1 rounded border border-zinc-200 hover:border-zinc-400 text-xs font-medium cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                    <h2 className="font-display text-sm font-bold text-zinc-950">
                      Warehouse Threshold Watch
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSection('inventory')}
                      className="text-xs font-medium text-zinc-600 hover:text-zinc-950 cursor-pointer"
                    >
                      Open matrix
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-200">
                    {products
                      .filter((p) =>
                        ALL_SIZES.some((s) => (p.stock[s] ?? 0) <= p.reorderPoint),
                      )
                      .slice(0, 5)
                      .map((p) => {
                        const lowSizes = ALL_SIZES.filter(
                          (s) => (p.stock[s] ?? 0) <= p.reorderPoint,
                        );
                        return (
                          <div
                            key={p.id}
                            className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-zinc-950">{p.name}</p>
                              <p className="text-zinc-500 mt-0.5 font-mono">
                                Low sizes: {lowSizes.map((s) => `${s}(${p.stock[s]})`).join(', ')}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[#E63918] font-semibold shrink-0">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Alert</span>
                            </span>
                          </div>
                        );
                      })}
                    {metrics.lowStockCount === 0 && (
                      <div className="px-5 py-8 text-center text-xs text-zinc-500">
                        All garment sizes are stocked above reorder thresholds.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ORDERS & CUSTOM ART PROOF INSPECTION */}
          {section === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
                  {(
                    [
                      {id: 'all', label: 'All Orders'},
                      {id: 'active', label: 'Active Production'},
                      {id: 'custom', label: 'Custom Prints'},
                      {id: 'delivered', label: 'Delivered'},
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                        orderFilter === tab.id
                          ? 'bg-white text-zinc-950 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-950'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, name, or email"
                    className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        <th className="py-3 px-5">Order</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Garments</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4">Fulfillment Stage</th>
                        <th className="py-3 px-5 text-right">Proof &amp; Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-xs">
                      {filteredOrders.map((ord) => {
                        const hasCustom = ord.items.some((i) => i.type === 'custom');
                        const totalItems = ord.items.reduce(
                          (s, i) => s + i.quantity,
                          0,
                        );
                        return (
                          <tr key={ord.id} className="hover:bg-zinc-50/70">
                            <td className="py-3.5 px-5">
                              <p className="font-mono font-semibold text-zinc-950">
                                {ord.trackingCode}
                              </p>
                              <p className="text-[11px] text-zinc-500 font-mono">
                                {new Date(ord.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-medium text-zinc-900">
                                {ord.customer.name}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {ord.customer.city}, {ord.customer.state}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-medium text-zinc-900">
                                {totalItems} tee{totalItems === 1 ? '' : 's'}
                              </p>
                              <p
                                className={`text-[11px] ${
                                  hasCustom
                                    ? 'text-[#E63918] font-medium'
                                    : 'text-zinc-500'
                                }`}
                              >
                                {hasCustom ? 'Custom Artwork' : 'Standard Catalog'}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-600 uppercase font-mono text-[11px]">
                              {ord.paymentMethod}
                              {ord.paymentLast4 ? ` · ${ord.paymentLast4}` : ''}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-950">
                              ${ord.total.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                aria-label={`Status for ${ord.trackingCode}`}
                                value={ord.status}
                                disabled={busyKey === `ord-${ord.id}`}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(
                                    ord.id,
                                    e.target.value as OrderStatus,
                                  )
                                }
                                className="px-2.5 py-1.5 text-xs font-semibold bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                              >
                                {ORDER_STATUS_SEQUENCE.map((st) => (
                                  <option key={st} value={st}>
                                    {ORDER_STATUS_LABELS[st]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => setInspectedOrder(ord)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-zinc-950 text-xs font-semibold text-zinc-900 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 text-center text-xs text-zinc-500"
                          >
                            No orders match your current search or filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: INVENTORY (REUSING LIVE SKU MATRIX & AUDIT LEDGER) */}
          {section === 'inventory' && (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
              <InventoryDashboard
                products={products}
                orders={orders}
                logs={logs}
                onRefreshData={onUpdateData}
              />
            </div>
          )}

          {/* SECTION 4: PRODUCT CATALOG MANAGER */}
          {section === 'products' && (
            <div className="space-y-6">
              {productNotice && (
                <div className="p-3.5 rounded-xl bg-white border border-zinc-300 text-xs font-medium text-zinc-900 flex items-center justify-between">
                  <span>{productNotice}</span>
                  <button
                    type="button"
                    onClick={() => setProductNotice(null)}
                    className="text-zinc-500 hover:text-zinc-950 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {showCreateProduct && (
                <form
                  onSubmit={handleCreateProduct}
                  className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <h2 className="font-display text-base font-bold text-zinc-950">
                      Publish New T-Shirt SKU
                    </h2>
                    <span className="text-xs text-zinc-500">
                      Auto-initializes S–2XL stock &amp; storefront visibility
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. 310 GSM Studio Acid Tee"
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1">
                        SKU Code
                      </label>
                      <input
                        type="text"
                        required
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value)}
                        placeholder="e.g. KP-ACD-310"
                        className="w-full px-3 py-2 font-mono uppercase border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) =>
                          setNewCategory(e.target.value as ProductCategory)
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      >
                        {PRODUCT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1">
                        Fabric Weight
                      </label>
                      <input
                        type="text"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1">
                        Garment Fit
                      </label>
                      <input
                        type="text"
                        value={newFit}
                        onChange={(e) => setNewFit(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1">
                        Unit Price (USD)
                      </label>
                      <input
                        type="number"
                        min={10}
                        step="0.01"
                        required
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Describe cotton mill, collar rib width, and print finish..."
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-800 mb-1.5">
                        Primary Studio Photography
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {STUDIO_ASSET_PRESETS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setNewImageUrl(preset.url)}
                            className={`rounded-lg overflow-hidden border-2 aspect-[4/5] cursor-pointer ${
                              newImageUrl === preset.url
                                ? 'border-[#E63918]'
                                : 'border-zinc-200 hover:border-zinc-400'
                            }`}
                            title={preset.label}
                          >
                            <ResilientImage
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-200">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCustomizable}
                        onChange={(e) => setNewCustomizable(e.target.checked)}
                        className="rounded accent-[#E63918]"
                      />
                      <span>Enable Custom Print Studio blank selection</span>
                    </label>
                    <button
                      type="submit"
                      disabled={busyKey === 'create-product'}
                      className="h-10 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      {busyKey === 'create-product' ? 'Publishing...' : 'Publish to Storefront'}
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        <th className="py-3 px-5">Garment</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Fabric &amp; Fit</th>
                        <th className="py-3 px-4 text-right">Stock</th>
                        <th className="py-3 px-4 text-center">Custom Studio</th>
                        <th className="py-3 px-5 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-xs">
                      {products.map((product) => {
                        const totalStock = ALL_SIZES.reduce(
                          (s, sz) => s + (product.stock[sz] ?? 0),
                          0,
                        );
                        const isEditing = editingPriceId === product.id;
                        return (
                          <tr key={product.id} className="hover:bg-zinc-50/70">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-14 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                                  <ResilientImage
                                    src={product.gallery[0]?.url || ''}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold text-zinc-950">
                                    {product.name}
                                  </p>
                                  <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
                                    {product.sku}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-700 font-medium">
                              {product.category}
                            </td>
                            <td className="py-3.5 px-4 text-zinc-600">
                              <p>{product.fabricWeight}</p>
                              <p className="text-[11px] text-zinc-500">{product.fit}</p>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-900">
                              {totalStock}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                disabled={busyKey === `cust-${product.id}`}
                                onClick={() => handleToggleCustomizable(product)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                                  product.customizable
                                    ? 'bg-zinc-950 text-white border-zinc-950'
                                    : 'bg-white text-zinc-600 border-zinc-300'
                                }`}
                              >
                                {product.customizable ? 'Customizable' : 'Drop Only'}
                              </button>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {isEditing ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={5}
                                    step="0.01"
                                    value={priceDraft}
                                    onChange={(e) => setPriceDraft(e.target.value)}
                                    className="w-20 px-2 py-1 text-right font-mono border border-zinc-400 rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveProductPrice(product)}
                                    className="p-1.5 bg-zinc-950 text-white rounded cursor-pointer"
                                    aria-label="Save price"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPriceId(null)}
                                    className="p-1.5 border border-zinc-300 rounded cursor-pointer"
                                    aria-label="Cancel price edit"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPriceId(product.id);
                                    setPriceDraft(String(product.price));
                                  }}
                                  className="font-mono tabular-nums font-semibold text-zinc-950 hover:text-[#E63918] underline decoration-zinc-300 underline-offset-4 cursor-pointer"
                                  title="Click to edit price"
                                >
                                  ${product.price.toFixed(2)}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: REVIEW MODERATION */}
          {section === 'reviews' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <select
                    value={reviewProductId}
                    onChange={(e) => setReviewProductId(e.target.value)}
                    aria-label="Filter reviews by product"
                    className="h-9 px-3 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900"
                  >
                    <option value="all">All T-Shirts ({reviews.length})</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(Number(e.target.value))}
                    aria-label="Filter reviews by rating"
                    className="h-9 px-3 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900"
                  >
                    <option value={0}>All Ratings</option>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} Stars Only
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-zinc-600 font-mono tabular-nums">
                  Avg Rating: <strong className="text-zinc-950">{metrics.avgRating.toFixed(1)}</strong> / 5.0
                </div>
              </div>

              <div className="space-y-3">
                {filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white border border-[#E4E4E7] rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StarRatingDisplay rating={rev.rating} size="sm" showNumeric={false} />
                        <span className="text-xs font-semibold text-zinc-950">
                          {rev.title}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="text-[11px] font-medium text-emerald-700">
                            · Verified Buyer
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {rev.comment}
                      </p>
                      {rev.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rev.images.map((img, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100"
                            >
                              <ResilientImage
                                src={img}
                                alt={`Review photo ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-zinc-500 font-mono pt-1">
                        {rev.authorName} · {rev.productName} ·{' '}
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={busyKey === `del-rev-${rev.id}`}
                      onClick={() => handleDeleteReview(rev.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-red-300 hover:bg-red-50 text-xs font-medium text-red-700 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}

                {filteredReviews.length === 0 && (
                  <div className="bg-white border border-[#E4E4E7] rounded-xl p-10 text-center text-xs text-zinc-500">
                    No customer reviews match the selected filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: DEMO & STORE SETTINGS */}
          {section === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-5">
                <div>
                  <h2 className="font-display text-base font-bold text-zinc-950">
                    WhatsApp Owner Contact Configuration
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    Leave blank to run in <strong className="text-zinc-950">Demo Support Mode</strong> (messages stay safely inside the site without opening external phone numbers). Add your WhatsApp number anytime to enable direct <code className="font-mono">wa.me</code> links.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="block font-semibold text-zinc-800">
                    Owner WhatsApp Number (optional, country code + digits)
                  </label>
                  <input
                    type="text"
                    value={whatsAppInput}
                    onChange={(e) => setWhatsAppInput(e.target.value)}
                    placeholder="Leave empty for Demo Mode (e.g. 15551234567)"
                    className="w-full h-10 px-3 font-mono bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStoreSettings({
                        ownerWhatsAppNumber: whatsAppInput.replace(/\D/g, ''),
                      });
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 2200);
                    }}
                    className="h-10 px-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {settingsSaved ? 'Settings Saved' : 'Save Settings'}
                  </button>
                  {whatsAppInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsAppInput('');
                        onUpdateStoreSettings({ownerWhatsAppNumber: ''});
                      }}
                      className="h-10 px-4 border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Use Demo Mode
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-200 text-xs text-zinc-600 space-y-1.5">
                  <p className="font-semibold text-zinc-950">Active Demo Features</p>
                  <p>· Checkout runs in Test Mode (simulated card, Express Pay &amp; COD — no real charges).</p>
                  <p>· Promo codes available for testing: <span className="font-mono font-semibold">STUDIO10</span> and <span className="font-mono font-semibold">WELCOME15</span>.</p>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white border border-[#E4E4E7] rounded-xl overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold text-zinc-950">
                      Demo Customer Support Inbox ({demoInquiries.length})
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      Messages submitted via the storefront Studio Support widget
                    </p>
                  </div>
                  {demoInquiries.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearDemoInquiries}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Clear Inbox
                    </button>
                  )}
                </div>

                <div className="divide-y divide-zinc-200 max-h-[360px] overflow-y-auto">
                  {demoInquiries.map((inq) => (
                    <div key={inq.id} className="p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-950">
                          {inq.topic}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {new Date(inq.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-zinc-600 leading-relaxed">{inq.message}</p>
                    </div>
                  ))}
                  {demoInquiries.length === 0 && (
                    <div className="p-10 text-center text-xs text-zinc-500">
                      No demo support inquiries yet. Messages sent from the storefront Studio Support widget will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ORDER INSPECTION & CUSTOM PROOF MODAL */}
      {inspectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Inspect order details"
          onClick={() => setInspectedOrder(null)}
        >
          <div
            className="w-full max-w-3xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-zinc-500">
                  {inspectedOrder.trackingCode} · Carrier {inspectedOrder.carrierTracking}
                </p>
                <h3 className="font-display text-lg font-bold text-zinc-950">
                  Order Production Sheet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedOrder(null)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Status Bar & Stage Control */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs">
                  <p className="text-zinc-500">Current Stage</p>
                  <p className="font-semibold text-sm text-zinc-950 mt-0.5">
                    {ORDER_STATUS_LABELS[inspectedOrder.status]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600">Advance to:</span>
                  <select
                    value={inspectedOrder.status}
                    disabled={busyKey === `ord-${inspectedOrder.id}`}
                    onChange={(e) =>
                      handleUpdateOrderStatus(
                        inspectedOrder.id,
                        e.target.value as OrderStatus,
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-300 rounded-lg text-zinc-950 cursor-pointer"
                  >
                    {ORDER_STATUS_SEQUENCE.map((st) => (
                      <option key={st} value={st}>
                        {ORDER_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer & Payment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-zinc-200 space-y-1">
                  <p className="font-semibold text-zinc-950 mb-1.5">
                    Recipient &amp; Shipping Address
                  </p>
                  <p className="font-medium text-zinc-900">
                    {inspectedOrder.customer.name}
                  </p>
                  <p className="text-zinc-600">{inspectedOrder.customer.address}</p>
                  <p className="text-zinc-600">
                    {inspectedOrder.customer.city}, {inspectedOrder.customer.state}{' '}
                    {inspectedOrder.customer.postalCode}
                  </p>
                  <p className="text-zinc-500 pt-1">
                    {inspectedOrder.customer.email} · {inspectedOrder.customer.phone}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 space-y-1.5">
                  <p className="font-semibold text-zinc-950 mb-1.5">
                    Billing &amp; Totals
                  </p>
                  <div className="flex justify-between text-zinc-600">
                    <span>Payment Method</span>
                    <span className="font-mono uppercase text-zinc-900">
                      {inspectedOrder.paymentMethod}
                      {inspectedOrder.paymentLast4
                        ? ` ···· ${inspectedOrder.paymentLast4}`
                        : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">
                      ${inspectedOrder.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {inspectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discounts</span>
                      <span className="font-mono tabular-nums">
                        -${inspectedOrder.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600">
                    <span>Shipping ({inspectedOrder.shippingMethod})</span>
                    <span className="font-mono tabular-nums">
                      ${inspectedOrder.shippingCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-zinc-950 pt-1 border-t border-zinc-200">
                    <span>Total</span>
                    <span className="font-mono tabular-nums">
                      ${inspectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Garment & Custom Proof Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Garments &amp; Print Specifications ({inspectedOrder.items.length})
                </h4>
                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl">
                  {inspectedOrder.items.map((item) => (
                    <div key={item.cartItemId} className="p-4 flex gap-4">
                      <div className="w-20 h-24 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                        <ResilientImage
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-zinc-950">
                            {item.name}
                          </p>
                          <span className="font-mono tabular-nums font-semibold text-zinc-950">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-zinc-600">
                          SKU <span className="font-mono">{item.sku}</span> ·{' '}
                          {item.colorName} · Size {item.size} · Qty {item.quantity}
                        </p>
                        {item.customSummary && (
                          <div className="mt-2 inline-flex items-center gap-1.5 text-[#E63918] font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{item.customSummary}</span>
                          </div>
                        )}
                        {item.customConfig && (
                          <div className="mt-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 space-y-0.5 font-mono">
                            <p>
                              Print Method: {item.customConfig.printMethod.toUpperCase()}
                            </p>
                            {item.customConfig.frontArtwork.fileName && (
                              <p>
                                Front Art: {item.customConfig.frontArtwork.fileName} (Scale{' '}
                                {item.customConfig.frontArtwork.scale}%)
                              </p>
                            )}
                            {item.customConfig.frontText.text && (
                              <p>Front Text: &quot;{item.customConfig.frontText.text}&quot;</p>
                            )}
                            {item.customConfig.backArtwork.fileName && (
                              <p>
                                Back Art: {item.customConfig.backArtwork.fileName} (Scale{' '}
                                {item.customConfig.backArtwork.scale}%)
                              </p>
                            )}
                            {item.customConfig.backText.text && (
                              <p>Back Text: &quot;{item.customConfig.backText.text}&quot;</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
