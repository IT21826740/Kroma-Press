import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {
  ALL_SIZES,
  type CheckoutPayload,
  type InventoryLog,
  MAX_REVIEW_IMAGES,
  type Order,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SEQUENCE,
  type OrderStatus,
  type Product,
  type ProductReview,
  type SizeCode,
} from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');

interface StoreData {
  products: Product[];
  orders: Order[];
  inventoryLogs: InventoryLog[];
  reviews: ProductReview[];
}

const GARMENT_COLORS = {
  obsidian: {name: 'Obsidian Black', hex: '#141416', textOnHex: '#FAFAFA'},
  chalk: {name: 'Chalk White', hex: '#F3F2EE', textOnHex: '#09090B'},
  olive: {name: 'Washed Olive', hex: '#68735B', textOnHex: '#FAFAFA'},
  slate: {name: 'Concrete Slate', hex: '#4B5058', textOnHex: '#FAFAFA'},
  cobalt: {name: 'Studio Cobalt', hex: '#1E3A8A', textOnHex: '#FAFAFA'},
  sand: {name: 'Warm Travertine', hex: '#D6CFC2', textOnHex: '#09090B'},
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'tee-boxy-obsidian',
    sku: 'KP-BXY-280',
    name: '280 GSM Boxy Architectural Tee',
    category: 'Heavyweight',
    fabricWeight: '280 GSM Combed Ring-Spun',
    fit: 'Boxy Drop-Shoulder',
    price: 48,
    description:
      'Cut from custom-milled 280 GSM organic ring-spun cotton with a thick 1.1-inch ribbed collar and structured boxy drape. Pre-shrunk and enzyme-washed for high-definition DTG and screen print fidelity.',
    gallery: [
      {
        url: '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
        label: 'Front Studio Print',
        caption: 'Sharp architectural linework printed at 1200 DPI on Obsidian Black.',
      },
      {
        url: '/src/assets/images/hero_tshirt_studio_1795015673323.jpg',
        label: 'Editorial Fit View',
        caption: 'Relaxed boxy drape with dropped shoulder seams.',
      },
      {
        url: '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
        label: 'Print & Textile Macro',
        caption: 'Water-based studio pigment cured onto dense 280 GSM combed cotton.',
      },
    ],
    colors: [GARMENT_COLORS.obsidian, GARMENT_COLORS.chalk, GARMENT_COLORS.slate],
    stock: {S: 18, M: 24, L: 14, XL: 6, '2XL': 9},
    reorderPoint: 8,
    reorderQuantity: 25,
    autoRestock: true,
    customizable: true,
    printMethodDefault: '1200 DPI Water-Based DTG',
    specs: [
      {label: 'Fabric Composition', value: '100% Organic Ring-Spun Cotton'},
      {label: 'Weight', value: '280 GSM / 8.2 oz Heavyweight'},
      {label: 'Collar Spec', value: '28mm Double-Needle Ribbed Crew'},
      {label: 'Shrinkage', value: '< 1.5% Pre-Shrunk Enzyme Wash'},
    ],
  },
  {
    id: 'tee-abstract-chalk',
    sku: 'KP-ABS-260',
    name: 'Abstract Form Studio Tee',
    category: 'Graphic Drops',
    fabricWeight: '260 GSM Supima Cotton',
    fit: 'Modern Relaxed',
    price: 54,
    description:
      'Limited studio edition pairing vermilion and charcoal water-based screen inks over a crisp chalk-white Supima jersey body. Engineered for soft hand-feel with zero plastic cracking.',
    gallery: [
      {
        url: '/src/assets/images/tee_vintage_chalk_1795015673960.jpg',
        label: 'Front Gallery View',
        caption: 'Multi-pass vermilion & charcoal abstract graphic on Chalk White.',
      },
      {
        url: '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
        label: 'Screen Ink Detail',
        caption: 'Hand-pulled soft-hand water-based ink penetration.',
      },
      {
        url: '/src/assets/images/hero_tshirt_studio_1795015673323.jpg',
        label: 'On-Model Drape',
        caption: 'Tailored shoulder width with clean straight hem.',
      },
    ],
    colors: [GARMENT_COLORS.chalk, GARMENT_COLORS.sand, GARMENT_COLORS.obsidian],
    stock: {S: 12, M: 7, L: 19, XL: 11, '2XL': 5},
    reorderPoint: 8,
    reorderQuantity: 20,
    autoRestock: true,
    customizable: true,
    printMethodDefault: 'Multi-Layer Water-Based Screen',
    specs: [
      {label: 'Fabric Composition', value: '100% American Supima Cotton'},
      {label: 'Weight', value: '260 GSM / 7.7 oz Mid-Heavy'},
      {label: 'Print Feel', value: 'Zero-Hand Breathable Pigment'},
      {label: 'Origin', value: 'Printed & Cured in Studio'},
    ],
  },
  {
    id: 'tee-olive-collective',
    sku: 'KP-OLV-300',
    name: '300 GSM Washed Oversized Tee',
    category: 'Oversized',
    fabricWeight: '300 GSM Garment-Dyed',
    fit: 'Oversized Street Cut',
    price: 58,
    description:
      'Our heaviest blank. Garment-dyed in small mineral batches for a rich washed olive patina, featuring elongated sleeves, wide chest proportion, and reinforced shoulder taping.',
    gallery: [
      {
        url: '/src/assets/images/tee_olive_oversized_1795015674006.jpg',
        label: 'Front Studio Shot',
        caption: 'Mineral garment-dyed Washed Olive with cream emblem chest print.',
      },
      {
        url: '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
        label: 'Print Studio Process',
        caption: 'High-opacity cream discharge ink on dyed heavyweight jersey.',
      },
      {
        url: '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
        label: 'Silhouette Reference',
        caption: 'Wide boxy hem and generous sleeve proportion.',
      },
    ],
    colors: [GARMENT_COLORS.olive, GARMENT_COLORS.obsidian, GARMENT_COLORS.sand],
    stock: {S: 15, M: 21, L: 4, XL: 14, '2XL': 8},
    reorderPoint: 6,
    reorderQuantity: 20,
    autoRestock: true,
    customizable: true,
    printMethodDefault: 'Discharge + High-Opacity Print',
    specs: [
      {label: 'Fabric Composition', value: '100% Heavyweight Carded Cotton'},
      {label: 'Weight', value: '300 GSM / 8.8 oz Ultra-Heavy'},
      {label: 'Dye Process', value: 'Mineral Pigment Garment Wash'},
      {label: 'Stitching', value: 'Single-Stitch Vintage Hem Detail'},
    ],
  },
  {
    id: 'tee-custom-blank-pro',
    sku: 'KP-BLK-280',
    name: 'Atelier Custom Print Blank (Pro)',
    category: 'Custom Blanks',
    fabricWeight: '280 GSM High-Density Jersey',
    fit: 'Universal Boxy',
    price: 38,
    description:
      'Specifically engineered smooth-surface jersey for creators and brands uploading custom artwork. High-density combed yarns eliminate surface fuzz so fine lines and gradients print razor-sharp.',
    gallery: [
      {
        url: '/src/assets/images/tee_vintage_chalk_1795015673960.jpg',
        label: 'Custom Print Canvas',
        caption: 'Smooth combed surface optimized for 1200 DPI custom artwork.',
      },
      {
        url: '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
        label: 'Obsidian Colorway',
        caption: 'Deep reactive-dyed black with white underbase support.',
      },
      {
        url: '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
        label: 'Press Calibration',
        caption: 'Pre-treated & cured for 50+ wash cycle durability.',
      },
    ],
    colors: [
      GARMENT_COLORS.chalk,
      GARMENT_COLORS.obsidian,
      GARMENT_COLORS.olive,
      GARMENT_COLORS.slate,
      GARMENT_COLORS.cobalt,
      GARMENT_COLORS.sand,
    ],
    stock: {S: 34, M: 42, L: 38, XL: 26, '2XL': 18},
    reorderPoint: 15,
    reorderQuantity: 40,
    autoRestock: true,
    customizable: true,
    printMethodDefault: 'Custom DTG / Puff / Foil',
    specs: [
      {label: 'Printable Area', value: 'Up to 14" × 18" Front & Back'},
      {label: 'Weight', value: '280 GSM Tight-Knit Combed'},
      {label: 'Tear-Away Tag', value: 'Ready for Private Label'},
      {label: 'Colorfastness', value: 'ISO 105-C06 Grade 4.5'},
    ],
  },
  {
    id: 'tee-metropolitan-drop',
    sku: 'KP-MET-270',
    name: 'Metropolitan Concrete Canyon Tee',
    category: 'Graphic Drops',
    fabricWeight: '270 GSM Organic Cotton',
    fit: 'Boxy Drop-Shoulder',
    price: 52,
    description:
      'Inspired by brutalist studio architecture. Features high-contrast duotone screen print graphics across the chest with subtle matte finish.',
    gallery: [
      {
        url: '/src/assets/images/hero_tshirt_studio_1795015673323.jpg',
        label: 'Campaign Lookbook',
        caption: 'Styled in Concrete Slate & Chalk White.',
      },
      {
        url: '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
        label: 'Studio Flat View',
        caption: 'Precision duotone chest placement.',
      },
      {
        url: '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
        label: 'Craftsmanship Detail',
        caption: 'Cured under dual infrared tunnels for crisp edge definition.',
      },
    ],
    colors: [GARMENT_COLORS.obsidian, GARMENT_COLORS.slate, GARMENT_COLORS.chalk],
    stock: {S: 9, M: 16, L: 12, XL: 3, '2XL': 7},
    reorderPoint: 6,
    reorderQuantity: 20,
    autoRestock: false,
    customizable: true,
    printMethodDefault: 'Duotone High-Build Screen',
    specs: [
      {label: 'Fabric Composition', value: '100% GOTS Organic Cotton'},
      {label: 'Weight', value: '270 GSM / 8.0 oz'},
      {label: 'Edition', value: 'Numbered Seasonal Run'},
      {label: 'Neckline', value: 'Bound Crew Collar'},
    ],
  },
  {
    id: 'tee-supima-essential',
    sku: 'KP-SUP-220',
    name: '220 GSM Supima Custom Essential',
    category: 'Custom Blanks',
    fabricWeight: '220 GSM Long-Staple Supima',
    fit: 'Tailored Everyday',
    price: 34,
    description:
      'Silky long-staple Supima cotton ideal for lightweight custom prints, subtle left-chest emblems, and multi-pack studio runs.',
    gallery: [
      {
        url: '/src/assets/images/tee_olive_oversized_1795015674006.jpg',
        label: 'Stone & Olive Finish',
        caption: 'Clean chest placement over fine-gauge Supima knit.',
      },
      {
        url: '/src/assets/images/tee_vintage_chalk_1795015673960.jpg',
        label: 'Chalk White Canvas',
        caption: 'Luminous optical white base for vibrant full-color DTG.',
      },
      {
        url: '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
        label: 'Atelier Ink Application',
        caption: 'Micro-droplet print adhesion on smooth long-staple cotton.',
      },
    ],
    colors: [
      GARMENT_COLORS.chalk,
      GARMENT_COLORS.obsidian,
      GARMENT_COLORS.cobalt,
      GARMENT_COLORS.olive,
    ],
    stock: {S: 28, M: 35, L: 31, XL: 22, '2XL': 14},
    reorderPoint: 12,
    reorderQuantity: 35,
    autoRestock: true,
    customizable: true,
    printMethodDefault: '1200 DPI DTG Full-Color',
    specs: [
      {label: 'Fabric Composition', value: '100% Extra-Long Staple Supima'},
      {label: 'Weight', value: '220 GSM / 6.5 oz All-Season'},
      {label: 'Seams', value: 'Side-Seamed Zero-Torque Construction'},
      {label: 'Care', value: 'Cold Wash Inside Out'},
    ],
  },
];

const nowIso = () => new Date().toISOString();
const hoursAgoIso = (h: number) =>
  new Date(Date.now() - h * 3600 * 1000).toISOString();
const daysFromNowFormatted = (days: number) =>
  new Date(Date.now() + days * 86400 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1042',
    trackingCode: 'KP-2026-1042',
    carrierTracking: 'UPS-1Z999AA101928374',
    createdAt: hoursAgoIso(34),
    estimatedDelivery: daysFromNowFormatted(2),
    status: 'printing',
    timeline: [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        detail: 'Payment authorized and inventory reserved for 2 garments.',
        timestamp: hoursAgoIso(34),
      },
      {
        status: 'prepress',
        title: 'Pre-Press Verification',
        detail: 'Custom 300 DPI PNG artwork color-profiled and pre-treated.',
        timestamp: hoursAgoIso(22),
      },
      {
        status: 'printing',
        title: 'DTG Printing',
        detail: 'Currently in Studio Press Bay #3 for dual-pass curing.',
        timestamp: hoursAgoIso(4),
      },
    ],
    customer: {
      name: 'Maya Lin-Vance',
      email: 'maya.vance@studio-client.com',
      phone: '+1 (415) 555-0192',
      address: '418 Valencia Street, Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
    },
    paymentMethod: 'card',
    paymentLast4: '4242',
    shippingMethod: 'express',
    items: [
      {
        cartItemId: 'seed-item-1',
        type: 'custom',
        productId: 'tee-custom-blank-pro',
        sku: 'KP-BLK-280',
        name: 'Custom Atelier Tee — Studio Crest',
        colorName: 'Obsidian Black',
        colorHex: '#141416',
        size: 'L',
        quantity: 2,
        unitPrice: 46,
        thumbnailUrl:
          '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
        customSummary: 'Front Center · High-Build Puff Print · 280 GSM',
      },
    ],
    subtotal: 92,
    discount: 0,
    shippingCost: 14,
    tax: 7.36,
    total: 113.36,
  },
  {
    id: 'ord-1089',
    trackingCode: 'KP-2026-1089',
    carrierTracking: 'FDX-774920184920',
    createdAt: hoursAgoIso(86),
    estimatedDelivery: daysFromNowFormatted(1),
    status: 'shipped',
    timeline: [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        detail: 'Order received and SKU inventory deducted automatically.',
        timestamp: hoursAgoIso(86),
      },
      {
        status: 'prepress',
        title: 'Pre-Press Verification',
        detail: 'Garment batch pulled and inspected.',
        timestamp: hoursAgoIso(74),
      },
      {
        status: 'printing',
        title: 'DTG Printing',
        detail: 'Water-based inks printed and infrared tunnel cured.',
        timestamp: hoursAgoIso(52),
      },
      {
        status: 'quality_check',
        title: 'Quality Inspection',
        detail: 'Passed color registration and stitch tolerance check.',
        timestamp: hoursAgoIso(36),
      },
      {
        status: 'shipped',
        title: 'Shipped & In Transit',
        detail: 'Dispatched via FedEx Express from Portland Print Hub.',
        timestamp: hoursAgoIso(18),
      },
    ],
    customer: {
      name: 'Marcus Thorne',
      email: 'm.thorne@arch-works.io',
      phone: '+1 (212) 555-0148',
      address: '89 Crosby Street, Floor 3',
      city: 'New York',
      state: 'NY',
      postalCode: '10012',
    },
    paymentMethod: 'express_wallet',
    shippingMethod: 'standard',
    items: [
      {
        cartItemId: 'seed-item-2',
        type: 'catalog',
        productId: 'tee-abstract-chalk',
        sku: 'KP-ABS-260',
        name: 'Abstract Form Studio Tee',
        colorName: 'Chalk White',
        colorHex: '#F3F2EE',
        size: 'M',
        quantity: 1,
        unitPrice: 54,
        thumbnailUrl:
          '/src/assets/images/tee_vintage_chalk_1795015673960.jpg',
      },
    ],
    subtotal: 54,
    discount: 0,
    shippingCost: 8,
    tax: 4.32,
    total: 66.32,
  },
  {
    id: 'ord-1015',
    trackingCode: 'KP-2026-1015',
    carrierTracking: 'UPS-1Z8842091234',
    createdAt: hoursAgoIso(168),
    estimatedDelivery: 'Delivered',
    status: 'delivered',
    timeline: [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        detail: 'Order authorized and 280 GSM Boxy blanks allocated.',
        timestamp: hoursAgoIso(168),
      },
      {
        status: 'prepress',
        title: 'Pre-Press Verification',
        detail: 'Artwork resolution checked at 1200 DPI and color-calibrated.',
        timestamp: hoursAgoIso(156),
      },
      {
        status: 'printing',
        title: 'DTG Printing',
        detail: 'Printed in Studio Press Bay #1 and tunnel cured.',
        timestamp: hoursAgoIso(140),
      },
      {
        status: 'quality_check',
        title: 'Quality Inspection',
        detail: 'Passed stitch, garment dimensions, and washfastness check.',
        timestamp: hoursAgoIso(128),
      },
      {
        status: 'shipped',
        title: 'Shipped & In Transit',
        detail: 'Dispatched via UPS Ground from Portland Print Studio.',
        timestamp: hoursAgoIso(112),
      },
      {
        status: 'delivered',
        title: 'Delivered',
        detail: 'Delivered and signed at front porch (Portland, OR 97205).',
        timestamp: hoursAgoIso(42),
      },
    ],
    customer: {
      name: 'Elena Rostova',
      email: 'elena.rostova@designmail.com',
      phone: '+1 (503) 555-0164',
      address: '1120 SW Alder St, Suite 204',
      city: 'Portland',
      state: 'OR',
      postalCode: '97205',
    },
    paymentMethod: 'card',
    paymentLast4: '8819',
    shippingMethod: 'standard',
    items: [
      {
        cartItemId: 'seed-item-3',
        type: 'catalog',
        productId: 'tee-boxy-obsidian',
        sku: 'KP-BXY-280',
        name: '280 GSM Boxy Architectural Tee',
        colorName: 'Obsidian Black',
        colorHex: '#141416',
        size: 'M',
        quantity: 2,
        unitPrice: 48,
        thumbnailUrl:
          '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
      },
    ],
    subtotal: 96,
    discount: 0,
    shippingCost: 0,
    tax: 7.68,
    total: 103.68,
  },
];

const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'tee-boxy-obsidian',
    productName: '280 GSM Boxy Architectural Tee',
    authorName: 'Elena Rostova',
    rating: 5,
    title: 'Heavy collar and razor-sharp white linework',
    comment:
      'Ordered two for our architecture studio team. The 280 GSM cotton holds its boxy drape all day and the white print did not fade or crack after three washes.',
    images: [
      '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
      '/src/assets/images/atelier_dtg_craft_1795015675385.jpg',
    ],
    verifiedPurchase: true,
    createdAt: hoursAgoIso(28),
  },
  {
    id: 'rev-2',
    productId: 'tee-abstract-chalk',
    productName: 'Abstract Form Studio Tee',
    authorName: 'Marcus Thorne',
    rating: 5,
    title: 'Zero plastic feel on the print',
    comment:
      'The vermilion water-based ink blends directly into the Supima cotton fibers. Super breathable and crisp gallery look.',
    images: ['/src/assets/images/tee_vintage_chalk_1795015673960.jpg'],
    verifiedPurchase: true,
    createdAt: hoursAgoIso(62),
  },
  {
    id: 'rev-3',
    productId: 'tee-custom-blank-pro',
    productName: 'Atelier Custom Print Blank (Pro)',
    authorName: 'Maya Lin-Vance',
    rating: 5,
    title: 'Uploaded my own PNG and the puff print turned out unreal',
    comment:
      'Used the Custom Studio to upload a transparent PNG crest on the front chest. Placement matched the live preview to the millimeter.',
    images: ['/src/assets/images/hero_tshirt_studio_1795015673323.jpg'],
    verifiedPurchase: true,
    createdAt: hoursAgoIso(95),
  },
  {
    id: 'rev-4',
    productId: 'tee-olive-oversized',
    productName: '300 GSM Washed Oversized Tee',
    authorName: 'Devon Sato',
    rating: 4,
    title: 'Substantial 300 GSM weight and mineral wash tone',
    comment:
      'Proper heavyweight drape with vintage single-stitch hem detail. Runs generously oversized as described—size down if you prefer a standard fit.',
    images: ['/src/assets/images/tee_olive_oversized_1795015674006.jpg'],
    verifiedPurchase: true,
    createdAt: hoursAgoIso(120),
  },
];

const INITIAL_LOGS: InventoryLog[] = [
  {
    id: 'log-seed-1',
    timestamp: hoursAgoIso(34),
    productId: 'tee-custom-blank-pro',
    sku: 'KP-BLK-280',
    productName: 'Atelier Custom Print Blank (Pro)',
    size: 'L',
    delta: -2,
    newStock: 38,
    reason: 'order_deduction',
    note: 'Auto-deducted for Order KP-2026-1042',
  },
  {
    id: 'log-seed-2',
    timestamp: hoursAgoIso(20),
    productId: 'tee-olive-oversized',
    sku: 'KP-OLV-300',
    productName: '300 GSM Washed Oversized Tee',
    size: 'L',
    delta: 0,
    newStock: 4,
    reason: 'low_stock_alert',
    note: 'Size L dropped below reorder threshold (6 units)',
  },
  {
    id: 'log-seed-3',
    timestamp: hoursAgoIso(12),
    productId: 'tee-boxy-obsidian',
    sku: 'KP-BXY-280',
    productName: '280 GSM Boxy Architectural Tee',
    size: 'XL',
    delta: 0,
    newStock: 6,
    reason: 'low_stock_alert',
    note: 'Size XL dropped below reorder threshold (8 units)',
  },
];

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreData = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      inventoryLogs: INITIAL_LOGS,
      reviews: INITIAL_REVIEWS,
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    if (!parsed.products || !parsed.orders || !parsed.inventoryLogs) {
      throw new Error('Invalid store format');
    }
    let dirty = false;
    if (!parsed.reviews) {
      parsed.reviews = INITIAL_REVIEWS;
      dirty = true;
    }
    if (!parsed.orders.some((o) => o.status === 'delivered')) {
      const deliveredSeed = INITIAL_ORDERS.find((o) => o.status === 'delivered');
      if (deliveredSeed && !parsed.orders.some((o) => o.id === deliveredSeed.id)) {
        parsed.orders.push(deliveredSeed);
        dirty = true;
      }
    }
    const hydrated = parsed as StoreData;
    if (dirty) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(hydrated, null, 2), 'utf-8');
    }
    return hydrated;
  } catch {
    const fallback: StoreData = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      inventoryLogs: INITIAL_LOGS,
      reviews: INITIAL_REVIEWS,
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveStore(store: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function generateOrderCode(): string {
  const randomNum = Math.floor(1100 + Math.random() * 8899);
  return `KP-2026-${randomNum}`;
}

function generateCarrierCode(): string {
  const digits = Math.floor(1000000000 + Math.random() * 8999999999);
  return `UPS-1Z${digits}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '15mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', timestamp: nowIso()});
  });

  app.get('/api/products', (_req, res) => {
    const store = ensureStore();
    res.json({products: store.products});
  });

  app.get('/api/products/:id', (req, res) => {
    const store = ensureStore();
    const product = store.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({error: 'Product not found'});
      return;
    }
    res.json({product});
  });

  app.post('/api/products', (req, res) => {
    const body = req.body as Partial<Product>;
    if (!body.name?.trim() || !body.sku?.trim() || typeof body.price !== 'number') {
      res.status(400).json({error: 'Product name, SKU, and price are required.'});
      return;
    }
    const store = ensureStore();
    const newProduct: Product = {
      id: `tee-${Date.now().toString(36)}`,
      sku: body.sku.trim().toUpperCase(),
      name: body.name.trim(),
      category: body.category || 'Custom Blanks',
      fabricWeight: body.fabricWeight?.trim() || '280 GSM Combed Ring-Spun',
      fit: body.fit?.trim() || 'Boxy Drop-Shoulder',
      price: Math.max(10, Number(body.price.toFixed(2))),
      description:
        body.description?.trim() ||
        'Heavyweight studio cotton blank engineered for 1200 DPI water-based custom printing.',
      gallery:
        body.gallery && body.gallery.length > 0
          ? body.gallery
          : [
              {
                url: '/src/assets/images/tee_heavyweight_obsidian_1795015673701.jpg',
                label: 'Front Studio View',
                caption: 'Studio flat view.',
              },
            ],
      colors:
        body.colors && body.colors.length > 0
          ? body.colors
          : [GARMENT_COLORS.obsidian, GARMENT_COLORS.chalk, GARMENT_COLORS.olive],
      stock: body.stock || {S: 20, M: 25, L: 25, XL: 15, '2XL': 10},
      reorderPoint: typeof body.reorderPoint === 'number' ? body.reorderPoint : 8,
      reorderQuantity:
        typeof body.reorderQuantity === 'number' ? body.reorderQuantity : 25,
      autoRestock: typeof body.autoRestock === 'boolean' ? body.autoRestock : true,
      customizable:
        typeof body.customizable === 'boolean' ? body.customizable : true,
      printMethodDefault: body.printMethodDefault || '1200 DPI Water-Based DTG',
      specs: body.specs || [
        {label: 'Fabric Composition', value: '100% Organic Ring-Spun Cotton'},
        {label: 'Weight', value: body.fabricWeight?.trim() || '280 GSM'},
      ],
    };
    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json({product: newProduct, products: store.products});
  });

  app.patch('/api/products/:id', (req, res) => {
    const store = ensureStore();
    const product = store.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({error: 'Product not found'});
      return;
    }
    const patch = req.body as Partial<Product>;
    if (patch.name?.trim()) product.name = patch.name.trim();
    if (typeof patch.price === 'number' && patch.price > 0) {
      product.price = Number(patch.price.toFixed(2));
    }
    if (patch.category) product.category = patch.category;
    if (patch.fabricWeight?.trim()) product.fabricWeight = patch.fabricWeight.trim();
    if (patch.fit?.trim()) product.fit = patch.fit.trim();
    if (patch.description?.trim()) product.description = patch.description.trim();
    if (typeof patch.customizable === 'boolean') {
      product.customizable = patch.customizable;
    }
    saveStore(store);
    res.json({product, products: store.products});
  });

  app.get('/api/orders', (_req, res) => {
    const store = ensureStore();
    const sorted = [...store.orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json({orders: sorted});
  });

  app.get('/api/orders/:query', (req, res) => {
    const store = ensureStore();
    const q = decodeURIComponent(req.params.query).trim().toLowerCase();
    const matches = store.orders.filter(
      (o) =>
        o.trackingCode.toLowerCase() === q ||
        o.id.toLowerCase() === q ||
        o.customer.email.toLowerCase() === q,
    );
    if (matches.length === 0) {
      res.status(404).json({error: 'No matching order found'});
      return;
    }
    const sorted = [...matches].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json({order: sorted[0], matches: sorted});
  });

  app.post('/api/checkout', (req, res) => {
    const payload = req.body as CheckoutPayload;
    if (
      !payload ||
      !payload.customer ||
      !payload.items ||
      payload.items.length === 0
    ) {
      res.status(400).json({error: 'Invalid checkout payload or empty bag.'});
      return;
    }

    const store = ensureStore();

    // 1. Validate inventory for every item atomically before mutating
    const requiredByKey = new Map<string, {product: Product; size: SizeCode; qty: number}>();
    for (const item of payload.items) {
      const product = store.products.find((p) => p.id === item.productId);
      if (!product) {
        res.status(400).json({error: `Product ${item.name} is no longer available.`});
        return;
      }
      const key = `${product.id}:${item.size}`;
      const existing = requiredByKey.get(key);
      if (existing) {
        existing.qty += item.quantity;
      } else {
        requiredByKey.set(key, {product, size: item.size, qty: item.quantity});
      }
    }

    for (const {product, size, qty} of requiredByKey.values()) {
      const available = product.stock[size] ?? 0;
      if (available < qty) {
        res.status(409).json({
          error: `Insufficient stock for ${product.name} (${size}). Only ${available} unit(s) remaining.`,
        });
        return;
      }
    }

    // 2. Deduct stock & run automated inventory threshold checks
    const ts = nowIso();
    let trackingCode = generateOrderCode();
    while (store.orders.some((o) => o.trackingCode === trackingCode)) {
      trackingCode = generateOrderCode();
    }

    for (const {product, size, qty} of requiredByKey.values()) {
      product.stock[size] = Math.max(0, product.stock[size] - qty);
      store.inventoryLogs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: ts,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        size,
        delta: -qty,
        newStock: product.stock[size],
        reason: 'order_deduction',
        note: `Auto-deducted for Order ${trackingCode}`,
      });

      if (product.stock[size] <= product.reorderPoint) {
        store.inventoryLogs.unshift({
          id: `log-alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: ts,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          size,
          delta: 0,
          newStock: product.stock[size],
          reason: 'low_stock_alert',
          note: `Size ${size} at ${product.stock[size]} units (threshold: ${product.reorderPoint}).`,
        });

        // If automated restocking is enabled and stock hits critical (<= 2), trigger immediate batch replenishment
        if (product.autoRestock && product.stock[size] <= 2) {
          const restockQty = product.reorderQuantity;
          product.stock[size] += restockQty;
          store.inventoryLogs.unshift({
            id: `log-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: ts,
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            size,
            delta: restockQty,
            newStock: product.stock[size],
            reason: 'auto_restock',
            note: `Automated replenishment triggered (+${restockQty} units added to ${size}).`,
          });
        }
      }
    }

    // 3. Calculate authoritative totals
    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const totalCount = payload.items.reduce((sum, item) => sum + item.quantity, 0);
    const bundleDiscount = totalCount >= 3 ? Number((subtotal * 0.1).toFixed(2)) : 0;
    const promo = (payload.promoCode || '').trim().toUpperCase();
    let promoDiscount = 0;
    if (promo === 'STUDIO10') {
      promoDiscount = Number(((subtotal - bundleDiscount) * 0.1).toFixed(2));
    } else if (promo === 'WELCOME15' && subtotal >= 80) {
      promoDiscount = 15;
    }
    const discount = Number((bundleDiscount + promoDiscount).toFixed(2));
    const discountedSubtotal = Math.max(0, subtotal - discount);

    let shippingCost = 0;
    let deliveryDays = 5;
    if (payload.shippingMethod === 'standard') {
      shippingCost = discountedSubtotal >= 95 ? 0 : 8;
      deliveryDays = 5;
    } else if (payload.shippingMethod === 'express') {
      shippingCost = 14;
      deliveryDays = 3;
    } else {
      shippingCost = 24;
      deliveryDays = 2;
    }

    const tax = Number((discountedSubtotal * 0.08).toFixed(2));
    const total = Number((discountedSubtotal + shippingCost + tax).toFixed(2));

    const hasCustom = payload.items.some((i) => i.type === 'custom');
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      trackingCode,
      carrierTracking: generateCarrierCode(),
      createdAt: ts,
      estimatedDelivery: daysFromNowFormatted(deliveryDays),
      status: 'confirmed',
      timeline: [
        {
          status: 'confirmed',
          title: 'Order Confirmed',
          detail: hasCustom
            ? 'Payment verified. Custom artwork queued for pre-press inspection and stock reserved.'
            : 'Payment verified. Garments allocated from studio warehouse.',
          timestamp: ts,
        },
      ],
      customer: payload.customer,
      paymentMethod: payload.paymentMethod,
      paymentLast4: payload.paymentLast4,
      shippingMethod: payload.shippingMethod,
      items: payload.items,
      subtotal,
      discount,
      shippingCost,
      tax,
      total,
    };

    store.orders.unshift(newOrder);
    store.inventoryLogs = store.inventoryLogs.slice(0, 120);
    saveStore(store);

    res.status(201).json({
      order: newOrder,
      products: store.products,
      inventoryLogs: store.inventoryLogs,
    });
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const {status} = req.body as {status: OrderStatus};
    if (!ORDER_STATUS_SEQUENCE.includes(status)) {
      res.status(400).json({error: 'Invalid order status'});
      return;
    }
    const store = ensureStore();
    const order = store.orders.find(
      (o) => o.id === req.params.id || o.trackingCode === req.params.id,
    );
    if (!order) {
      res.status(404).json({error: 'Order not found'});
      return;
    }

    const detailMessages: Record<OrderStatus, string> = {
      confirmed: 'Payment authorized and inventory reserved.',
      prepress: 'Artwork resolution verified at 300+ DPI and garment pre-treated.',
      printing: 'In DTG Press Bay — pigment curing and heat-set underway.',
      quality_check: 'Passed optical color calibration and seam inspection.',
      shipped: `Handed off to carrier (${order.carrierTracking}).`,
      delivered: 'Package delivered to recipient shipping address.',
    };

    order.status = status;
    const existingIdx = order.timeline.findIndex((t) => t.status === status);
    const event = {
      status,
      title: ORDER_STATUS_LABELS[status],
      detail: detailMessages[status],
      timestamp: nowIso(),
    };
    if (existingIdx >= 0) {
      order.timeline[existingIdx] = event;
    } else {
      order.timeline.push(event);
    }

    saveStore(store);
    res.json({order});
  });

  app.get('/api/inventory/logs', (_req, res) => {
    const store = ensureStore();
    res.json({logs: store.inventoryLogs});
  });

  app.patch('/api/inventory/:productId', (req, res) => {
    const store = ensureStore();
    const product = store.products.find((p) => p.id === req.params.productId);
    if (!product) {
      res.status(404).json({error: 'Product not found'});
      return;
    }

    const {size, delta, setStock, reorderPoint, reorderQuantity, autoRestock} =
      req.body as {
        size?: SizeCode;
        delta?: number;
        setStock?: number;
        reorderPoint?: number;
        reorderQuantity?: number;
        autoRestock?: boolean;
      };

    if (typeof reorderPoint === 'number' && reorderPoint >= 0) {
      product.reorderPoint = reorderPoint;
    }
    if (typeof reorderQuantity === 'number' && reorderQuantity >= 1) {
      product.reorderQuantity = reorderQuantity;
    }
    if (typeof autoRestock === 'boolean') {
      product.autoRestock = autoRestock;
    }

    if (size && ALL_SIZES.includes(size)) {
      const prev = product.stock[size];
      let next = prev;
      if (typeof setStock === 'number') {
        next = Math.max(0, Math.round(setStock));
      } else if (typeof delta === 'number') {
        next = Math.max(0, prev + Math.round(delta));
      }
      const actualDelta = next - prev;
      product.stock[size] = next;

      if (actualDelta !== 0) {
        store.inventoryLogs.unshift({
          id: `log-adj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: nowIso(),
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          size,
          delta: actualDelta,
          newStock: next,
          reason: 'manual_adjustment',
          note:
            actualDelta > 0
              ? `Manual restock (+${actualDelta} units)`
              : `Manual inventory adjustment (${actualDelta} units)`,
        });
      }
    }

    store.inventoryLogs = store.inventoryLogs.slice(0, 120);
    saveStore(store);
    res.json({product, logs: store.inventoryLogs});
  });

  app.post('/api/inventory/auto-replenish', (_req, res) => {
    const store = ensureStore();
    const ts = nowIso();
    let replenishedCount = 0;

    for (const product of store.products) {
      if (!product.autoRestock) continue;
      for (const size of ALL_SIZES) {
        if (product.stock[size] <= product.reorderPoint) {
          const qty = product.reorderQuantity;
          product.stock[size] += qty;
          replenishedCount += 1;
          store.inventoryLogs.unshift({
            id: `log-sweep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: ts,
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            size,
            delta: qty,
            newStock: product.stock[size],
            reason: 'auto_restock',
            note: `Automated replenishment sweep (+${qty} units for Size ${size})`,
          });
        }
      }
    }

    store.inventoryLogs = store.inventoryLogs.slice(0, 120);
    saveStore(store);
    res.json({
      replenishedCount,
      products: store.products,
      logs: store.inventoryLogs,
    });
  });

  app.get('/api/reviews', (req, res) => {
    const store = ensureStore();
    const productId =
      typeof req.query.productId === 'string' ? req.query.productId : null;
    const list = productId
      ? store.reviews.filter((r) => r.productId === productId)
      : store.reviews;
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json({reviews: sorted});
  });

  app.post('/api/reviews', (req, res) => {
    const {productId, authorName, rating, title, comment, images} = req.body as {
      productId?: string;
      authorName?: string;
      rating?: number;
      title?: string;
      comment?: string;
      images?: string[];
    };

    if (!productId || !authorName?.trim() || !comment?.trim()) {
      res.status(400).json({
        error: 'Product, your name, and review comment are required.',
      });
      return;
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({error: 'Rating must be between 1 and 5 stars.'});
      return;
    }

    const safeImages = Array.isArray(images)
      ? images.filter((img) => typeof img === 'string' && img.length > 0).slice(0, MAX_REVIEW_IMAGES)
      : [];

    if (Array.isArray(images) && images.length > MAX_REVIEW_IMAGES) {
      res.status(400).json({
        error: `You can attach up to ${MAX_REVIEW_IMAGES} images per review.`,
      });
      return;
    }

    const store = ensureStore();
    const product = store.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({error: 'Selected product was not found.'});
      return;
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      authorName: authorName.trim().slice(0, 60),
      rating: Math.round(numericRating),
      title: (title || '').trim().slice(0, 100) || `${Math.round(numericRating)}-Star Review`,
      comment: comment.trim().slice(0, 1200),
      images: safeImages,
      verifiedPurchase: store.orders.some(
        (o) =>
          o.customer.name.toLowerCase() === authorName.trim().toLowerCase() ||
          o.items.some((i) => i.productId === product.id),
      ),
      createdAt: nowIso(),
    };

    store.reviews.unshift(newReview);
    saveStore(store);
    res.status(201).json({review: newReview, reviews: store.reviews});
  });

  app.delete('/api/reviews/:id', (req, res) => {
    const store = ensureStore();
    const before = store.reviews.length;
    store.reviews = store.reviews.filter((r) => r.id !== req.params.id);
    if (store.reviews.length === before) {
      res.status(404).json({error: 'Review not found'});
      return;
    }
    saveStore(store);
    res.json({reviews: store.reviews});
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Kroma Press server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
