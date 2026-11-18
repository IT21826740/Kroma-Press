export type SizeCode = 'S' | 'M' | 'L' | 'XL' | '2XL';

export const ALL_SIZES: SizeCode[] = ['S', 'M', 'L', 'XL', '2XL'];

export interface GarmentColor {
  name: string;
  hex: string;
  textOnHex: string;
}

export type ProductCategory =
  | 'Heavyweight'
  | 'Oversized'
  | 'Graphic Drops'
  | 'Custom Blanks';

export interface ProductGalleryImage {
  url: string;
  label: string;
  caption: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  fabricWeight: string;
  fit: string;
  price: number;
  description: string;
  gallery: ProductGalleryImage[];
  colors: GarmentColor[];
  stock: Record<SizeCode, number>;
  reorderPoint: number;
  reorderQuantity: number;
  autoRestock: boolean;
  customizable: boolean;
  printMethodDefault: string;
  specs: ProductSpec[];
}

export type PrintMethod = 'dtg' | 'puff' | 'foil';
export type PlacementSide = 'front' | 'back';

export interface CustomArtworkLayer {
  side: PlacementSide;
  imageDataUrl: string | null;
  fileName: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CustomTextLayer {
  side: PlacementSide;
  text: string;
  font: 'display' | 'mono' | 'serif';
  color: string;
  fontSize: number;
  letterSpacing: number;
  x: number;
  y: number;
}

export interface CustomDesignConfig {
  baseProductId: string;
  baseProductName: string;
  color: GarmentColor;
  size: SizeCode;
  printMethod: PrintMethod;
  frontArtwork: CustomArtworkLayer;
  backArtwork: CustomArtworkLayer;
  frontText: CustomTextLayer;
  backText: CustomTextLayer;
  previewDataUrl: string;
  hasBackPrint: boolean;
}

export interface CartItem {
  cartItemId: string;
  type: 'catalog' | 'custom';
  productId: string;
  sku: string;
  name: string;
  colorName: string;
  colorHex: string;
  size: SizeCode;
  quantity: number;
  unitPrice: number;
  thumbnailUrl: string;
  customSummary?: string;
  customConfig?: CustomDesignConfig;
}

export type OrderStatus =
  | 'confirmed'
  | 'prepress'
  | 'printing'
  | 'quality_check'
  | 'shipped'
  | 'delivered';

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'confirmed',
  'prepress',
  'printing',
  'quality_check',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Order Confirmed',
  prepress: 'Pre-Press Verification',
  printing: 'DTG Printing',
  quality_check: 'Quality Inspection',
  shipped: 'Shipped & In Transit',
  delivered: 'Delivered',
};

export interface OrderTimelineEvent {
  status: OrderStatus;
  title: string;
  detail: string;
  timestamp: string;
}

export type PaymentMethod = 'card' | 'express_wallet' | 'cod';
export type ShippingMethod = 'standard' | 'express' | 'rush';

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface Order {
  id: string;
  trackingCode: string;
  carrierTracking: string;
  createdAt: string;
  estimatedDelivery: string;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  paymentLast4?: string;
  shippingMethod: ShippingMethod;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export type InventoryLogReason =
  | 'order_deduction'
  | 'auto_restock'
  | 'manual_adjustment'
  | 'low_stock_alert';

export interface InventoryLog {
  id: string;
  timestamp: string;
  productId: string;
  sku: string;
  productName: string;
  size: SizeCode;
  delta: number;
  newStock: number;
  reason: InventoryLogReason;
  note: string;
}

export interface CheckoutPayload {
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  paymentLast4?: string;
  shippingMethod: ShippingMethod;
  promoCode?: string;
  items: CartItem[];
}

export interface SavedCustomDesign {
  id: string;
  title: string;
  savedAt: string;
  config: CustomDesignConfig;
}

export const MAX_REVIEW_IMAGES = 3;

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  verifiedPurchase: boolean;
  createdAt: string;
}

export const OWNER_WHATSAPP_NUMBER = '15035550199';

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

