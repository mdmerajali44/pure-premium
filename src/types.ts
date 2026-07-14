/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  unit: string;
  stock: number;
  isFeatured?: boolean;
  rating: number;
  reviewsCount: number;
  sku?: string;
  sizes?: string[];
  sizePrices?: Record<string, { price: number; originalPrice?: number }>;
  reorderLevel?: number;
  addedBy?: string;
  status?: string;
  purchasePrice?: number;
  badge?: 'none' | 'new' | 'restocked';
  tagline?: string;
  detailedTitle?: string;
  descriptionBullets?: string[];
  manufacturer?: string;
  sourceArea?: string;
  shelfLife?: string;
  organicCertificate?: string;
  sellerId?: string;
  sellerName?: string;
  sellerProductStatus?: 'pending' | 'approved' | 'rejected';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  district: string;
  area: string;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
  bkashNumber?: string;
  trxId?: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    unit: string;
    image: string;
    sellerId?: string;
  }[];
  totalAmount: number;
  deliveryCharge: number;
  status: OrderStatus;
  createdAt: string;
  couponCode?: string;
  discountAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  showInNavbar?: boolean;
}

export interface SiteConfig {
  storeName: string;
  storeSlogan: string;
  storeLogo: string;
  storeNameImage?: string;
  storeSloganImage?: string;
  
  // Left Banner (Hero Main)
  leftBannerImage: string;
  leftBannerTitle: string;
  leftBannerSubtitle: string;
  leftBannerBtnText: string;
  leftBannerCategory: string;

  // Right Banner (Hero Side)
  rightBannerImage: string;
  rightBannerTitle: string;
  rightBannerSubtitle: string;
  rightBannerBtnText: string;
  rightBannerTagline: string;
  rightBannerCategory: string;

  // Tickers/Bulletins
  tickerItems: string[];

  // Category visual overrides (maps category slug to custom image path)
  categoryImages?: Record<string, string>;
  categoryBanners?: Record<string, string>;
  categoryNames?: Record<string, string>;

  // Custom Pages content
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutOwnerImage?: string;
  aboutHighlightText?: string;
  aboutParagraph1?: string;
  aboutParagraph2?: string;
  aboutParagraph3?: string;
  aboutFacebookLink?: string;
  messengerLink?: string;
  facebookLink?: string;
  instagramLink?: string;
  youtubeLink?: string;

  borderWidth?: string;
  contactOffice?: string;
  contactPhone?: string;
  contactEmail?: string;
  googleMapUrl?: string;

  refundPolicyText?: string;
  privacyPolicyText?: string;
  coupons?: Coupon[];
  promoActive?: boolean;
  promoImage?: string;
  promoLink?: string;
  faqItems?: { question: string; answer: string }[];
  sellerSystemActive?: boolean;
  commissionPercentage?: number;
}

export interface Coupon {
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  limitPerPhone?: number; // 1 = once per phone number, 0/undefined = unlimited
  maxTotalUsage?: number; // total overall usage limit
  restrictedPhones?: string; // Comma-separated list of phone numbers allowed to use this coupon
}

export interface ProductRequest {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  quantity: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'contacted';
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  address?: string;
  district?: string;
  area?: string;
  dob?: string;
  gender?: string;
  createdAt: string;
  status: 'active' | 'blocked';
  role: 'user' | 'admin' | 'seller' | 'super-admin';
  permissions?: string[];
  shopName?: string;
  shopLogo?: string;
  shopDescription?: string;
  facebookPage?: string;
  contactPhone?: string;
  sellerStatus?: 'pending' | 'approved' | 'rejected';
  paymentMethod?: 'bkash' | 'nagad' | 'bank';
  paymentDetails?: string;
  balance?: number;
}

export interface WithdrawRequest {
  id: string;
  sellerId: string;
  shopName: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'bank';
  details: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'rejected';
}

export const getEmbedMapUrl = (url: string): { embedUrl: string; directUrl?: string } => {
  if (!url) {
    return { 
      embedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=88.5800%2C24.3600%2C88.6200%2C24.3900&amp;layer=mapnik&amp;marker=24.3750%2C88.6010" 
    };
  }

  let targetUrl = url.trim();

  // 1. If user pasted the whole iframe code, extract src
  if (targetUrl.startsWith('<iframe')) {
    const match = targetUrl.match(/src="([^"]+)"/);
    if (match && match[1]) {
      targetUrl = match[1];
    }
  }

  // If it's already an embed URL, return it
  if (
    targetUrl.includes('/embed') || 
    targetUrl.includes('openstreetmap.org') || 
    targetUrl.includes('google.com/maps/embed') ||
    targetUrl.includes('output=embed')
  ) {
    return { embedUrl: targetUrl.replace(/&amp;/g, '&') };
  }

  // 2. Try to convert standard Google Maps links into free search-based embed links
  // Pattern A: google.com/maps/place/Place+Name/@lat,lng,zoom...
  if (targetUrl.includes('google.com/maps/place/')) {
    const parts = targetUrl.split('google.com/maps/place/');
    if (parts.length > 1) {
      const placePart = parts[1].split('/')[0];
      if (placePart) {
        const decodedPlace = decodeURIComponent(placePart).replace(/\+/g, ' ');
        const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(decodedPlace)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        return { embedUrl, directUrl: targetUrl };
      }
    }
  }

  // Pattern B: google.com/maps/search/Search+Query/...
  if (targetUrl.includes('google.com/maps/search/')) {
    const parts = targetUrl.split('google.com/maps/search/');
    if (parts.length > 1) {
      const queryPart = parts[1].split('/')[0];
      if (queryPart) {
        const decodedQuery = decodeURIComponent(queryPart).replace(/\+/g, ' ');
        const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(decodedQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        return { embedUrl, directUrl: targetUrl };
      }
    }
  }

  // Pattern C: google.com/maps/query with ?q=... or ?daddr=...
  const urlObj = (() => {
    try {
      return new URL(targetUrl);
    } catch (e) {
      return null;
    }
  })();

  if (urlObj && (urlObj.hostname.includes('google.com') || urlObj.hostname.includes('maps.google'))) {
    const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('daddr');
    if (q) {
      const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return { embedUrl, directUrl: targetUrl };
    }
  }

  // If we can't convert it (e.g. maps.app.goo.gl or other short links),
  // we return it as directUrl so we can show a gorgeous Map Link card!
  return {
    embedUrl: '',
    directUrl: targetUrl
  };
};

/**
 * Normalizes all numbers in a string, mapping both English and Bengali numerals to English numerals.
 * Also converts to lowercase.
 */
export function normalizeForSearch(str: string | undefined | null): string {
  if (!str) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let normalized = str.toLowerCase();
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(bengaliDigits[i], 'g'), englishDigits[i]);
  }
  return normalized;
}

/**
 * Checks if a target string contains a query string, normalizing both first (handling Eng/Ben numbers seamlessly).
 */
export function matchesSearchWithNumerals(target: string | undefined | null, query: string | undefined | null): boolean {
  if (!query || query.trim() === '') return true;
  if (!target) return false;
  const normalizedTarget = normalizeForSearch(target);
  const normalizedQuery = normalizeForSearch(query.trim());
  return normalizedTarget.includes(normalizedQuery);
}

/**
 * Parses a size string (e.g. '0.5 KG', '১ কেজি', '400G', '5 Liter') to a numeric value in base units (grams, milliliters, etc.)
 * to allow accurate sorting from smallest to largest.
 */
export function parseSizeToWeight(sizeStr: string): number {
  if (!sizeStr) return 0;
  let str = sizeStr.toUpperCase().trim();
  
  // Convert Bengali digits to English
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(bengaliDigits[i], 'g'), englishDigits[i]);
  }

  // Determine multiplier
  let multiplier = 1000; // default to KG or Liter
  
  if (str.includes('MILI') || str.includes('ML')) {
    multiplier = 1;
  } else if (str.includes('GM') || str.includes('GRAM') || (str.includes('G') && !str.includes('KG'))) {
    multiplier = 1;
  } else if (str.includes('PIS') || str.includes('PCS') || str.includes('PIECE') || str.includes('টি') || str.includes('পিস')) {
    multiplier = 1;
  } else if (str.includes('KG') || str.includes('কেজি') || str.includes('KILO')) {
    multiplier = 1000;
  } else if (str.includes('LITER') || str.includes('LITRE') || str.includes('L') || str.includes('লিটার')) {
    multiplier = 1000;
  }
  
  // Extract number (including decimal)
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return val * multiplier;
  }
  
  return 0;
}

/**
 * Sorts an array of size/quantity strings from smallest to largest weight/amount.
 */
export function sortProductSizes(sizes: string[]): string[] {
  if (!sizes || sizes.length <= 1) return sizes;
  return [...sizes].sort((a, b) => {
    return parseSizeToWeight(a) - parseSizeToWeight(b);
  });
}


