import type React from 'react';
import {useState} from 'react';
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Lock,
  Smartphone,
  Truck,
  X,
} from 'lucide-react';
import type {
  CartItem,
  InventoryLog,
  Order,
  PaymentMethod,
  Product,
  ShippingMethod,
} from '../shared/types';
import {ResilientImage} from './ResilientImage';

interface CheckoutModalProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onOrderSuccess: (data: {
    order: Order;
    products: Product[];
    inventoryLogs: InventoryLog[];
  }) => void;
  onTrackOrder: (trackingCode: string) => void;
}

export function CheckoutModal({
  open,
  items,
  onClose,
  onOrderSuccess,
  onTrackOrder,
}: CheckoutModalProps) {
  const [name, setName] = useState('Jordan Rivera');
  const [email, setEmail] = useState('jordan.rivera@example.com');
  const [phone, setPhone] = useState('+1 (503) 555-0174');
  const [address, setAddress] = useState('742 NW Flanders St');
  const [city, setCity] = useState('Portland');
  const [state, setState] = useState('OR');
  const [postalCode, setPostalCode] = useState('97209');

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('842');

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!open) return null;

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const bundleDiscount = totalCount >= 3 ? Number((subtotal * 0.1).toFixed(2)) : 0;
  let promoDiscount = 0;
  if (appliedPromo === 'STUDIO10') {
    promoDiscount = Number(((subtotal - bundleDiscount) * 0.1).toFixed(2));
  } else if (appliedPromo === 'WELCOME15' && subtotal >= 80) {
    promoDiscount = 15;
  }
  const discount = Number((bundleDiscount + promoDiscount).toFixed(2));
  const afterDiscount = Math.max(0, subtotal - discount);

  const shippingCost =
    shippingMethod === 'standard'
      ? afterDiscount >= 95
        ? 0
        : 8
      : shippingMethod === 'express'
        ? 14
        : 24;
  const tax = Number((afterDiscount * 0.08).toFixed(2));
  const total = Number((afterDiscount + shippingCost + tax).toFixed(2));

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    setPromoError(null);
    if (!code) return;
    if (code === 'STUDIO10') {
      setAppliedPromo('STUDIO10');
      setPromoInput('');
      return;
    }
    if (code === 'WELCOME15') {
      if (subtotal < 80) {
        setPromoError('WELCOME15 requires a subtotal of at least $80.00.');
        return;
      }
      setAppliedPromo('WELCOME15');
      setPromoInput('');
      return;
    }
    setPromoError('Invalid promo code. Try STUDIO10 or WELCOME15.');
  };

  const formatCardInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !address.trim() || !postalCode.trim()) {
      setErrorMsg('Please complete all required shipping fields.');
      return;
    }

    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\s/g, '');
      if (digits.length < 13 || cardExpiry.length < 4 || cardCvc.length < 3) {
        setErrorMsg('Please enter valid card details.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          customer: {name, email, phone, address, city, state, postalCode},
          paymentMethod,
          paymentLast4:
            paymentMethod === 'card'
              ? cardNumber.replace(/\s/g, '').slice(-4)
              : undefined,
          shippingMethod,
          promoCode: appliedPromo || undefined,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Checkout failed. Please review your bag.');
        return;
      }
      setConfirmedOrder(data.order);
      onOrderSuccess(data);
    } catch {
      setErrorMsg('Network error while processing payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-700" />
            <h2 className="font-display text-lg font-bold text-zinc-950">
              {confirmedOrder ? 'Order Confirmation Receipt' : 'Secure Studio Checkout'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            aria-label="Close checkout"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8">
          {confirmedOrder ? (
            <div className="max-w-xl mx-auto py-4 space-y-6">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-zinc-50 border border-zinc-200">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-zinc-500">
                    Order #{confirmedOrder.trackingCode} · Inventory Auto-Synced
                  </p>
                  <h3 className="font-display text-xl font-bold text-zinc-950 mt-1">
                    Confirmed — Preparing Print &amp; Dispatch
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    Receipt sent to <span className="font-medium text-zinc-900">{confirmedOrder.customer.email}</span>. Estimated delivery: <span className="font-medium text-zinc-900">{confirmedOrder.estimatedDelivery}</span>.
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-200">
                {confirmedOrder.items.map((item) => (
                  <div key={item.cartItemId} className="p-4 flex items-center gap-4">
                    <div className="w-14 h-16 rounded-md bg-zinc-100 overflow-hidden shrink-0">
                      <ResilientImage
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-950 truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {item.colorName} · Size {item.size} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-sm font-semibold">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="p-4 bg-zinc-50 flex justify-between text-sm font-bold text-zinc-950">
                  <span>Total Paid</span>
                  <span className="font-mono tabular-nums">${confirmedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const code = confirmedOrder.trackingCode;
                    setConfirmedOrder(null);
                    onClose();
                    onTrackOrder(code);
                  }}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 px-5 bg-[#E63918] hover:bg-[#cf3012] text-white text-sm font-semibold rounded-lg cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Live Order ({confirmedOrder.trackingCode})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    onClose();
                  }}
                  className="h-11 px-5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-900 text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Form (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 mb-3">
                    01. Customer &amp; Delivery Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="pt-4 border-t border-zinc-200">
                  <h3 className="text-sm font-bold text-zinc-950 mb-3">
                    02. Production &amp; Shipping Speed
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        {
                          id: 'standard',
                          label: 'Standard Ground',
                          eta: '4–5 Business Days',
                          cost: afterDiscount >= 95 ? 'Free' : '$8.00',
                        },
                        {
                          id: 'express',
                          label: 'Express 2-Day',
                          eta: '2–3 Business Days',
                          cost: '$14.00',
                        },
                        {
                          id: 'rush',
                          label: 'Studio Rush 24h',
                          eta: 'Priority Press + Air',
                          cost: '$24.00',
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setShippingMethod(opt.id)}
                        className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                          shippingMethod === opt.id
                            ? 'border-zinc-950 bg-zinc-50'
                            : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-zinc-950">{opt.label}</span>
                          <span className="font-mono tabular-nums text-xs font-semibold">
                            {opt.cost}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">{opt.eta}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-4 border-t border-zinc-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-bold text-zinc-950">
                      03. Payment Method (Demo)
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Test mode · No real card charged
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(
                      [
                        {id: 'card', label: 'Card', icon: CreditCard},
                        {id: 'express_wallet', label: 'Express Pay', icon: Smartphone},
                        {id: 'cod', label: 'Cash on Delivery', icon: Banknote},
                      ] as const
                    ).map((pm) => {
                      const Icon = pm.icon;
                      const active = paymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`py-2.5 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            active
                              ? 'bg-zinc-950 text-white border-zinc-950'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3 py-2 font-mono text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1">
                            Expiration (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 font-mono text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                            placeholder="123"
                            className="w-full px-3 py-2 font-mono text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'express_wallet' && (
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                      Instant tokenized authorization via Apple Pay / Shop Pay upon order submission.
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-1">
                      <p className="font-semibold text-zinc-950">
                        Pay ${total.toFixed(2)} upon courier delivery
                      </p>
                      <p className="text-zinc-500">
                        Courier verification requires recipient phone ({phone}) and postal code ({postalCode}).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Order Summary (5 cols) */}
              <div className="lg:col-span-5">
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4 sticky top-0">
                  <h3 className="text-sm font-bold text-zinc-950">Order Summary</h3>
                  <div className="divide-y divide-zinc-200 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="py-3 flex items-center gap-3">
                        <div className="w-12 h-14 rounded bg-white border border-zinc-200 overflow-hidden shrink-0">
                          <ResilientImage
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-950 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {item.colorName} · {item.size} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono tabular-nums text-xs font-semibold">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code */}
                  <div className="pt-3 border-t border-zinc-200 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Promo code (STUDIO10 or WELCOME15)"
                        className="flex-1 h-9 px-3 text-xs font-mono uppercase bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="h-9 px-3.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedPromo && (
                      <div className="flex items-center justify-between text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-lg">
                        <span className="font-mono font-semibold">
                          Promo {appliedPromo} applied (-${promoDiscount.toFixed(2)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setAppliedPromo(null)}
                          className="underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-[11px] text-red-600">{promoError}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                    {bundleDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Bundle Discount (10%)</span>
                        <span className="font-mono tabular-nums">-${bundleDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Promo ({appliedPromo})</span>
                        <span className="font-mono tabular-nums">-${promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-600">
                      <span>Shipping</span>
                      <span className="font-mono tabular-nums">
                        {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Estimated Tax (8%)</span>
                      <span className="font-mono tabular-nums">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                      <span>Total</span>
                      <span className="font-mono tabular-nums">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || items.length === 0}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#E63918] hover:bg-[#cf3012] disabled:bg-zinc-300 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Authorizing & Reserving Stock...'
                        : paymentMethod === 'cod'
                          ? `Place COD Order · $${total.toFixed(2)}`
                          : `Pay $${total.toFixed(2)} & Place Order`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
