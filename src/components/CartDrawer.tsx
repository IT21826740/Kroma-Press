import {ArrowRight, Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import type {CartItem} from '../shared/types';
import {ResilientImage} from './ResilientImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const discount = totalCount >= 3 ? Number((subtotal * 0.1).toFixed(2)) : 0;
  const afterDiscount = subtotal - discount;
  const freeShippingRemaining = Math.max(0, 95 - afterDiscount);

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col border-l border-zinc-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-zinc-950" />
            <h2 className="font-display text-lg font-bold text-zinc-950">
              Studio Bag
            </h2>
            <span className="font-mono tabular-nums text-xs text-zinc-500">
              ({totalCount})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress Strip */}
        <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 text-xs">
          {freeShippingRemaining === 0 ? (
            <p className="font-medium text-emerald-700">
              Complimentary standard shipping unlocked.
            </p>
          ) : (
            <p className="text-zinc-600">
              Add{' '}
              <span className="font-mono tabular-nums font-semibold text-zinc-950">
                ${freeShippingRemaining.toFixed(2)}
              </span>{' '}
              more for free standard shipping.
            </p>
          )}
          {totalCount < 3 && totalCount > 0 && (
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Studio bundle: add {3 - totalCount} more tee(s) for 10% off.
            </p>
          )}
        </div>

        {/* Bag Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-200">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-900">Your studio bag is empty</p>
              <p className="text-xs text-zinc-500 mt-1">
                Explore our heavyweight collection or upload custom artwork in the Studio.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="py-4 flex gap-4">
                <div className="w-20 h-24 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                  <ResilientImage
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    fallbackTitle={item.name}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-zinc-950 leading-snug">
                        {item.name}
                      </h3>
                      <span className="font-mono tabular-nums text-sm font-semibold text-zinc-950 shrink-0">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mt-1">
                      {item.colorName} <span aria-hidden="true">·</span> Size{' '}
                      <span className="font-mono font-medium text-zinc-800">{item.size}</span>
                    </p>
                    {item.customSummary && (
                      <p className="text-[11px] font-medium text-[#E63918] mt-1">
                        {item.customSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-zinc-200 rounded-md">
                      <button
                        type="button"
                        aria-label="Decrease item quantity"
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        className="w-7 h-7 inline-flex items-center justify-center hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono tabular-nums text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase item quantity"
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        className="w-7 h-7 inline-flex items-center justify-center hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      aria-label={`Remove ${item.name}`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totals & Checkout CTA */}
        {items.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Bundle Discount (10% · 3+ Tees)</span>
                  <span className="font-mono tabular-nums">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                <span>Estimated Total</span>
                <span className="font-mono tabular-nums">${afterDiscount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full h-12 inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
