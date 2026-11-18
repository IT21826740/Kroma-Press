import type React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  History,
  MapPin,
  MessageCircle,
  Package,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import {
  buildWhatsAppUrl,
  type CartItem,
  type Order,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SEQUENCE,
  type OrderStatus,
} from '../shared/types';
import {ResilientImage} from './ResilientImage';

interface OrderTrackingViewProps {
  orders: Order[];
  initialTrackingCode?: string | null;
  myOrderCodes?: string[];
  ownerWhatsAppNumber?: string;
  onOpenSupport?: (prefillMessage: string, topic?: string) => void;
  onReorderItems?: (items: CartItem[]) => void;
}

const STAGE_ICONS: Record<OrderStatus, typeof Package> = {
  confirmed: CheckCircle2,
  prepress: ShieldCheck,
  printing: Printer,
  quality_check: Package,
  shipped: Truck,
  delivered: MapPin,
};

export function OrderTrackingView({
  orders,
  initialTrackingCode,
  myOrderCodes = [],
  ownerWhatsAppNumber,
  onOpenSupport,
  onReorderItems,
}: OrderTrackingViewProps) {
  const [query, setQuery] = useState(initialTrackingCode || '');
  const [historyFilter, setHistoryFilter] = useState<
    'all' | 'mine' | 'production' | 'shipped' | 'delivered'
  >('all');
  const [activeOrder, setActiveOrder] = useState<Order | null>(
    orders[0] || null,
  );
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrackingCode) {
      setQuery(initialTrackingCode);
      const found = orders.find(
        (o) =>
          o.trackingCode.toLowerCase() === initialTrackingCode.toLowerCase(),
      );
      if (found) {
        setActiveOrder(found);
        setErrorMsg(null);
      }
    } else if (activeOrder) {
      const updated = orders.find((o) => o.id === activeOrder.id);
      if (updated) setActiveOrder(updated);
    } else if (orders.length > 0) {
      setActiveOrder(orders[0]);
    }
  }, [initialTrackingCode, orders, activeOrder]);

  const filteredHistory = useMemo(() => {
    return orders.filter((ord) => {
      if (historyFilter === 'mine') {
        return myOrderCodes.includes(ord.trackingCode);
      }
      if (historyFilter === 'production') {
        return (
          ord.status === 'confirmed' ||
          ord.status === 'prepress' ||
          ord.status === 'printing' ||
          ord.status === 'quality_check'
        );
      }
      if (historyFilter === 'shipped') return ord.status === 'shipped';
      if (historyFilter === 'delivered') return ord.status === 'delivered';
      return true;
    });
  }, [orders, historyFilter, myOrderCodes]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok || !data.order) {
        setErrorMsg(`No order found matching "${trimmed}".`);
        return;
      }
      setActiveOrder(data.order);
    } catch {
      setErrorMsg('Unable to look up order right now.');
    } finally {
      setSearching(false);
    }
  };

  const handleReorder = (order: Order) => {
    if (!onReorderItems) return;
    onReorderItems(order.items);
    setReorderNotice(`Added items from ${order.trackingCode} to your studio bag.`);
    setTimeout(() => setReorderNotice(null), 2600);
  };

  const currentStageIndex = activeOrder
    ? ORDER_STATUS_SEQUENCE.indexOf(activeOrder.status)
    : 0;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            Order History · Live Print-to-Door Fulfillment
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Your Orders &amp; Live Tracking
          </h1>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-wrap items-center gap-2 w-full lg:w-auto"
        >
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order ID (e.g. KP-2026-1042) or email"
              className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="h-11 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {searching ? 'Locating...' : 'Track'}
          </button>
        </form>
      </div>

      {reorderNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
          {reorderNotice}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Customer Order History Table / List */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-800" />
            <h2 className="font-display text-base font-bold text-zinc-950">
              Order History
            </h2>
            <span className="font-mono tabular-nums text-xs text-zinc-500">
              ({filteredHistory.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
            {(
              [
                {id: 'all', label: 'All Orders'},
                ...(myOrderCodes.length > 0
                  ? [{id: 'mine', label: `Placed by Me (${myOrderCodes.length})`}]
                  : []),
                {id: 'production', label: 'In Production'},
                {id: 'shipped', label: 'Shipped'},
                {id: 'delivered', label: 'Delivered'},
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setHistoryFilter(
                    tab.id as
                      | 'all'
                      | 'mine'
                      | 'production'
                      | 'shipped'
                      | 'delivered',
                  )
                }
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                  historyFilter === tab.id
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-zinc-200 max-h-[340px] overflow-y-auto">
          {filteredHistory.map((ord) => {
            const isSelected = activeOrder?.id === ord.id;
            const totalUnits = ord.items.reduce((s, i) => s + i.quantity, 0);
            const firstItem = ord.items[0];
            return (
              <div
                key={ord.id}
                className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50/60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {firstItem && (
                    <div className="w-12 h-14 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                      <ResilientImage
                        src={firstItem.thumbnailUrl}
                        alt={firstItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-zinc-950">
                        {ord.trackingCode}
                      </span>
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-600">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-zinc-400">·</span>
                      <span
                        className={`font-semibold ${
                          ord.status === 'delivered'
                            ? 'text-emerald-700'
                            : 'text-[#E63918]'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[ord.status]}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-1 truncate">
                      {firstItem?.name}
                      {ord.items.length > 1
                        ? ` + ${ord.items.length - 1} more item(s)`
                        : ''}{' '}
                      · {totalUnits} garment{totalUnits === 1 ? '' : 's'} ·{' '}
                      <span className="font-mono tabular-nums font-semibold text-zinc-950">
                        ${ord.total.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(ord.trackingCode);
                      setActiveOrder(ord);
                      setErrorMsg(null);
                    }}
                    className={`h-9 px-3.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-950'
                    }`}
                  >
                    {isSelected ? 'Tracking Selected' : 'Track Live'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptOrder(ord)}
                    className="h-9 px-3 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white text-xs font-medium text-zinc-700 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>

                  {onReorderItems && (
                    <button
                      type="button"
                      onClick={() => handleReorder(ord)}
                      className="h-9 px-3 rounded-lg border border-zinc-200 hover:border-zinc-950 bg-white text-xs font-medium text-zinc-900 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredHistory.length === 0 && (
            <div className="py-12 text-center text-xs text-zinc-500">
              No orders found in this filter view.
            </div>
          )}
        </div>
      </div>

      {/* Selected Order Live Tracking Detail */}
      {activeOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Milestone Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-zinc-200">
                <div>
                  <p className="text-xs font-mono text-zinc-500">
                    Tracking Code {activeOrder.trackingCode}{' '}
                    <span aria-hidden="true">·</span> Carrier{' '}
                    {activeOrder.carrierTracking}
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-950 mt-1">
                    {ORDER_STATUS_LABELS[activeOrder.status]}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-zinc-500">
                    {activeOrder.status === 'delivered'
                      ? 'Delivery Status'
                      : 'Estimated Delivery'}
                  </p>
                  <p className="font-mono tabular-nums text-sm font-semibold text-zinc-950 mt-0.5">
                    {activeOrder.status === 'delivered'
                      ? 'Completed · Delivered'
                      : activeOrder.estimatedDelivery}
                  </p>
                </div>
              </div>

              {activeOrder.status === 'delivered' && (
                <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-900">
                      Order Delivered to {activeOrder.customer.city},{' '}
                      {activeOrder.customer.state}
                    </p>
                    <p className="text-emerald-800 mt-0.5">
                      {activeOrder.timeline.find((t) => t.status === 'delivered')
                        ?.detail ||
                        'Carrier confirmed package handoff at recipient address.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Horizontal 6-Step Progress Bar */}
              <div className="py-6 border-b border-zinc-200">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {ORDER_STATUS_SEQUENCE.map((stage, idx) => {
                    const Icon = STAGE_ICONS[stage];
                    const completed = idx <= currentStageIndex;
                    const current = idx === currentStageIndex;
                    return (
                      <div key={stage} className="flex flex-col items-start">
                        <div className="flex items-center gap-2 w-full mb-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                              current
                                ? 'bg-[#E63918] border-[#E63918] text-white'
                                : completed
                                  ? 'bg-zinc-950 border-zinc-950 text-white'
                                  : 'bg-zinc-50 border-zinc-300 text-zinc-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {idx < ORDER_STATUS_SEQUENCE.length - 1 && (
                            <div
                              className={`hidden sm:block h-[2px] flex-1 ${
                                idx < currentStageIndex
                                  ? 'bg-zinc-950'
                                  : 'bg-zinc-200'
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold leading-tight ${
                            completed ? 'text-zinc-950' : 'text-zinc-400'
                          }`}
                        >
                          {ORDER_STATUS_LABELS[stage]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chronological Event Feed */}
              <div className="pt-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Production &amp; Transit History
                </h3>
                <div className="space-y-4">
                  {[...activeOrder.timeline].reverse().map((ev) => (
                    <div
                      key={ev.status + ev.timestamp}
                      className="flex items-start gap-3.5 text-sm"
                    >
                      <Circle className="w-2.5 h-2.5 mt-1.5 fill-zinc-950 text-zinc-950 shrink-0" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-zinc-950">
                            {ev.title}
                          </span>
                          <span className="font-mono tabular-nums text-xs text-zinc-500">
                            {new Date(ev.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {ev.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Items & Shipping Destination (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-950">
                  Garments in This Order
                </h3>
                <button
                  type="button"
                  onClick={() => setReceiptOrder(activeOrder)}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-950 underline cursor-pointer"
                >
                  Receipt
                </button>
              </div>
              <div className="divide-y divide-zinc-200">
                {activeOrder.items.map((item) => (
                  <div key={item.cartItemId} className="py-3 flex gap-3">
                    <div className="w-16 h-20 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                      <ResilientImage
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-950">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {item.colorName} · Size {item.size} · Qty {item.quantity}
                      </p>
                      {item.customSummary && (
                        <p className="text-[11px] font-medium text-[#E63918] mt-1">
                          {item.customSummary}
                        </p>
                      )}
                      <p className="font-mono tabular-nums text-xs font-semibold text-zinc-900 mt-1">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-200 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    ${activeOrder.subtotal.toFixed(2)}
                  </span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discounts</span>
                    <span className="font-mono tabular-nums">
                      -${activeOrder.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span className="font-mono tabular-nums">
                    {activeOrder.shippingCost === 0
                      ? 'Free'
                      : `$${activeOrder.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-950 pt-1">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">
                    ${activeOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-xs space-y-2">
              <h3 className="text-sm font-bold text-zinc-950">
                Delivery Destination
              </h3>
              <p className="font-medium text-zinc-900">
                {activeOrder.customer.name}
              </p>
              <p className="text-zinc-600">{activeOrder.customer.address}</p>
              <p className="text-zinc-600">
                {activeOrder.customer.city}, {activeOrder.customer.state}{' '}
                {activeOrder.customer.postalCode}
              </p>
              <p className="text-zinc-500 pt-1">{activeOrder.customer.email}</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-sm font-bold text-zinc-950">
                  Need Order Support?
                </h3>
              </div>
              {(() => {
                const msg = `Hi Kroma Press, I'm checking on order ${activeOrder.trackingCode} (${ORDER_STATUS_LABELS[activeOrder.status]}).`;
                const waUrl = buildWhatsAppUrl(msg, ownerWhatsAppNumber);
                if (waUrl) {
                  return (
                    <>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Message the studio owner directly on WhatsApp with your
                        tracking ID pre-filled.
                      </p>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-10 inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp Owner ({activeOrder.trackingCode})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </>
                  );
                }
                return (
                  <>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Send a demo support inquiry about {activeOrder.trackingCode}{' '}
                      directly to the Admin Portal inbox.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenSupport?.(msg, 'Order Delivery & Tracking')
                      }
                      className="w-full h-10 inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Demo Support ({activeOrder.trackingCode})</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-sm text-zinc-500">
          Enter an order tracking code above to view live print and shipping
          status.
        </div>
      )}

      {/* Printable Order Receipt Modal */}
      {receiptOrder && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Order Receipt"
          onClick={() => setReceiptOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
              <div>
                <p className="font-display text-lg font-bold text-zinc-950">
                  Kroma Press Studio Receipt
                </p>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">
                  Order {receiptOrder.trackingCode} ·{' '}
                  {new Date(receiptOrder.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                aria-label="Close receipt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-zinc-600">
              <p className="font-semibold text-zinc-950">Billed &amp; Shipped To</p>
              <p>{receiptOrder.customer.name}</p>
              <p>{receiptOrder.customer.address}</p>
              <p>
                {receiptOrder.customer.city}, {receiptOrder.customer.state}{' '}
                {receiptOrder.customer.postalCode}
              </p>
              <p className="font-mono pt-1">
                Payment: {receiptOrder.paymentMethod.toUpperCase()}
                {receiptOrder.paymentLast4
                  ? ` ···· ${receiptOrder.paymentLast4}`
                  : ''}
              </p>
            </div>

            <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-200 text-xs">
              {receiptOrder.items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3.5 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-zinc-950">{item.name}</p>
                    <p className="text-zinc-500 mt-0.5">
                      {item.colorName} · Size {item.size} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-zinc-950">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-zinc-200">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  ${receiptOrder.subtotal.toFixed(2)}
                </span>
              </div>
              {receiptOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discounts</span>
                  <span className="font-mono tabular-nums">
                    -${receiptOrder.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span className="font-mono tabular-nums">
                  ${receiptOrder.shippingCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Tax</span>
                <span className="font-mono tabular-nums">
                  ${receiptOrder.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                <span>Total Paid</span>
                <span className="font-mono tabular-nums">
                  ${receiptOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="h-10 px-4 border border-zinc-300 hover:bg-zinc-100 text-zinc-900 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
