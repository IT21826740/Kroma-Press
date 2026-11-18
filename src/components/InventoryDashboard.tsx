import {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  ALL_SIZES,
  type InventoryLog,
  type Order,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SEQUENCE,
  type OrderStatus,
  type Product,
  type SizeCode,
} from '../shared/types';

interface InventoryDashboardProps {
  products: Product[];
  orders: Order[];
  logs: InventoryLog[];
  onRefreshData: (data: {
    products?: Product[];
    orders?: Order[];
    logs?: InventoryLog[];
  }) => void;
}

export function InventoryDashboard({
  products,
  orders,
  logs,
  onRefreshData,
}: InventoryDashboardProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'auto'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sweepNotice, setSweepNotice] = useState<string | null>(null);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let lowSizeCount = 0;
    let autoEnabledProducts = 0;

    for (const p of products) {
      if (p.autoRestock) autoEnabledProducts += 1;
      for (const s of ALL_SIZES) {
        const count = p.stock[s] ?? 0;
        totalUnits += count;
        if (count <= p.reorderPoint) lowSizeCount += 1;
      }
    }

    const activeOrders = orders.filter((o) => o.status !== 'delivered').length;
    return {totalUnits, lowSizeCount, autoEnabledProducts, activeOrders};
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    if (filterMode === 'low') {
      return products.filter((p) =>
        ALL_SIZES.some((s) => (p.stock[s] ?? 0) <= p.reorderPoint),
      );
    }
    if (filterMode === 'auto') {
      return products.filter((p) => p.autoRestock);
    }
    return products;
  }, [products, filterMode]);

  const handleAdjustStock = async (
    productId: string,
    size: SizeCode,
    delta: number,
  ) => {
    setBusyId(`${productId}-${size}`);
    try {
      const res = await fetch(`/api/inventory/${productId}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({size, delta}),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        onRefreshData({
          products: products.map((p) =>
            p.id === data.product.id ? data.product : p,
          ),
          logs: data.logs,
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleAutoRestock = async (product: Product) => {
    setBusyId(`auto-${product.id}`);
    try {
      const res = await fetch(`/api/inventory/${product.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({autoRestock: !product.autoRestock}),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        onRefreshData({
          products: products.map((p) =>
            p.id === data.product.id ? data.product : p,
          ),
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRunAutoSweep = async () => {
    setBusyId('sweep');
    setSweepNotice(null);
    try {
      const res = await fetch('/api/inventory/auto-replenish', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        onRefreshData({products: data.products, logs: data.logs});
        setSweepNotice(
          data.replenishedCount > 0
            ? `Replenished ${data.replenishedCount} low-stock SKU size(s) automatically.`
            : 'All auto-restock SKUs are currently above threshold.',
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setBusyId(`ord-${orderId}`);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status}),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        onRefreshData({
          orders: orders.map((o) => (o.id === data.order.id ? data.order : o)),
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
      {/* Header & Automated Sweep Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            Automated Warehouse &amp; Print Queue Sync
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Inventory &amp; Fulfillment Console
          </h1>
        </div>

        <button
          type="button"
          disabled={busyId === 'sweep'}
          onClick={handleRunAutoSweep}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
        >
          <RefreshCw
            className={`w-4 h-4 ${busyId === 'sweep' ? 'animate-spin' : ''}`}
          />
          <span>Run Automated Restock Sweep</span>
        </button>
      </div>

      {sweepNotice && (
        <div className="p-3.5 rounded-xl bg-zinc-100 border border-zinc-300 text-xs font-medium text-zinc-900 flex items-center justify-between">
          <span>{sweepNotice}</span>
          <button
            type="button"
            onClick={() => setSweepNotice(null)}
            className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Total Units in Stock</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-zinc-950">
            {stats.totalUnits}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Size SKUs Below Threshold</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#E63918]">
            {stats.lowSizeCount}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Auto-Restock Enabled</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-zinc-950">
            {stats.autoEnabledProducts} / {products.length}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Active Print Orders</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-zinc-950">
            {stats.activeOrders}
          </p>
        </div>
      </div>

      {/* SKU Inventory Matrix */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-zinc-950">
            Live SKU Stock Matrix
          </h2>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
            {(
              [
                {id: 'all', label: 'All SKUs'},
                {id: 'low', label: 'Low Stock'},
                {id: 'auto', label: 'Auto-Restock On'},
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-6">Garment &amp; SKU</th>
                <th className="py-3 px-3">Status</th>
                {ALL_SIZES.map((s) => (
                  <th key={s} className="py-3 px-2 text-center">
                    {s}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Threshold</th>
                <th className="py-3 px-6 text-right">Auto-Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {filteredProducts.map((product) => {
                const total = ALL_SIZES.reduce(
                  (sum, s) => sum + (product.stock[s] ?? 0),
                  0,
                );
                const hasOut = ALL_SIZES.some((s) => (product.stock[s] ?? 0) === 0);
                const hasLow = ALL_SIZES.some(
                  (s) =>
                    (product.stock[s] ?? 0) > 0 &&
                    (product.stock[s] ?? 0) <= product.reorderPoint,
                );

                return (
                  <tr key={product.id} className="hover:bg-zinc-50/70">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-zinc-950">{product.name}</p>
                      <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
                        {product.sku} · {total} total units
                      </p>
                    </td>

                    <td className="py-4 px-3 whitespace-nowrap">
                      {hasOut ? (
                        <span className="inline-flex items-center gap-1.5 text-red-700 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Out Alert</span>
                        </span>
                      ) : hasLow ? (
                        <span className="inline-flex items-center gap-1.5 text-[#E63918] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Healthy</span>
                        </span>
                      )}
                    </td>

                    {ALL_SIZES.map((size) => {
                      const qty = product.stock[size] ?? 0;
                      const low = qty <= product.reorderPoint;
                      return (
                        <td key={size} className="py-4 px-2 text-center">
                          <div className="inline-flex items-center gap-1 border border-zinc-200 rounded-md bg-white px-1.5 py-1">
                            <button
                              type="button"
                              aria-label={`Decrease ${product.name} ${size}`}
                              disabled={busyId === `${product.id}-${size}` || qty <= 0}
                              onClick={() => handleAdjustStock(product.id, size, -1)}
                              className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-600 cursor-pointer disabled:opacity-40"
                            >
                              -
                            </button>
                            <span
                              className={`w-7 font-mono tabular-nums font-semibold ${
                                qty === 0
                                  ? 'text-red-700'
                                  : low
                                    ? 'text-[#E63918]'
                                    : 'text-zinc-900'
                              }`}
                            >
                              {qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Restock ${product.name} ${size} by 5`}
                              disabled={busyId === `${product.id}-${size}`}
                              onClick={() => handleAdjustStock(product.id, size, 5)}
                              className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-700 font-semibold cursor-pointer"
                              title="Add 5 units"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-4 px-4 text-right font-mono tabular-nums text-zinc-700">
                      ≤ {product.reorderPoint} / +{product.reorderQuantity}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        disabled={busyId === `auto-${product.id}`}
                        onClick={() => handleToggleAutoRestock(product)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          product.autoRestock
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        {product.autoRestock ? 'Enabled' : 'Paused'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 2-Col Split: Order Fulfillment Queue & Automated Inventory Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Fulfillment Queue (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-zinc-900" />
              <h2 className="font-display text-base font-bold text-zinc-950">
                Order Fulfillment Queue
              </h2>
            </div>
            <span className="font-mono tabular-nums text-xs text-zinc-500">
              {orders.length} orders
            </span>
          </div>

          <div className="divide-y divide-zinc-200 max-h-[420px] overflow-y-auto">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-950">
                      {ord.trackingCode}
                    </span>
                    <span className="text-xs text-zinc-500">·</span>
                    <span className="text-xs font-medium text-zinc-800">
                      {ord.customer.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)} garment(s) ·{' '}
                    <span className="font-mono tabular-nums">
                      ${ord.total.toFixed(2)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${ord.id}`}>
                    Order status
                  </label>
                  <select
                    id={`status-${ord.id}`}
                    value={ord.status}
                    disabled={busyId === `ord-${ord.id}`}
                    onChange={(e) =>
                      handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                  >
                    {ORDER_STATUS_SEQUENCE.map((st) => (
                      <option key={st} value={st}>
                        {ORDER_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automated Inventory Audit Log (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-zinc-950">
              Automated Stock Audit Log
            </h2>
            <span className="text-xs text-zinc-500">Live Ledger</span>
          </div>

          <div className="divide-y divide-zinc-200 max-h-[420px] overflow-y-auto">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="px-6 py-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-950 flex items-center gap-1.5">
                    {log.delta < 0 ? (
                      <ArrowDownRight className="w-3.5 h-3.5 text-zinc-600" />
                    ) : log.delta > 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#E63918]" />
                    )}
                    <span>
                      {log.sku} ({log.size})
                    </span>
                  </span>

                  <span className="font-mono tabular-nums font-semibold">
                    {log.delta > 0 ? `+${log.delta}` : log.delta === 0 ? 'Alert' : log.delta}{' '}
                    → {log.newStock}
                  </span>
                </div>
                <p className="text-zinc-600 mt-1">{log.note}</p>
                <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                  {new Date(log.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
