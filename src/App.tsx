/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Order, OrderStatus, SiteConfig, ProductRequest, getEmbedMapUrl, User, Category, matchesSearchWithNumerals, sortProductSizes, WithdrawRequest } from './types';
import { CATEGORIES, INITIAL_PRODUCTS } from './data';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard, { FaqSection } from './components/AdminDashboard';
import ProductDetails from './components/ProductDetails';
import AuthModal from './components/AuthModal';
import { ChatWidget } from './components/ChatWidget';
import SellerDashboard from './components/SellerDashboard';
import OrderTrackingModal from './components/OrderTrackingModal';
import { 
  Search, ShoppingCart, ShieldAlert, X, Star, CheckCircle, 
  Plus, Minus, ShoppingBag, Clock, HelpCircle, Store, ChevronRight, ChevronLeft,
  Home, Droplet, Cookie, Candy, Waves, Leaf, Sprout, Sun, Wheat, Sparkles, Loader2,
  Truck, ShieldCheck, Headphones, Facebook, Instagram, Youtube, AlertTriangle, Info,
  MapPin, Map, User as UserIcon, LogOut, LogIn, UserPlus, ChevronDown, Bell, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pre-seeded initial orders for simulation
const SEEDED_ORDERS: Order[] = [
  {
    id: 'ML-581932',
    customerName: 'রফিক উল্লাহ',
    customerPhone: '01712345678',
    deliveryAddress: 'বাসা #১০, রোড #২, সেক্টর #৪',
    district: 'ঢাকা',
    area: 'উত্তরা',
    paymentMethod: 'cod',
    items: [
      {
        productId: 'p1',
        productName: 'সুন্দরবনের খাঁটি মধু (Pure Sundarban Honey)',
        price: 850,
        quantity: 1,
        unit: '১ কেজি',
        image: '/src/assets/images/sundarban_honey_jar_1782453470122.jpg',
      }
    ],
    totalAmount: 910,
    deliveryCharge: 60,
    status: 'pending',
    createdAt: '২৫ জুন, ২০২৬',
  },
  {
    id: 'ML-392104',
    customerName: 'তাহমিনা বেগম',
    customerPhone: '01876543210',
    deliveryAddress: 'জিইসি মোড়, লালখান বাজার',
    district: 'চট্টগ্রাম',
    area: 'কোতোয়ালী',
    paymentMethod: 'bkash',
    bkashNumber: '01876543210',
    trxId: 'BK89XJ12L',
    items: [
      {
        productId: 'p8',
        productName: 'নিউট্রিটিয়াস হানি নাটস (Mixed Nuts with Honey)',
        price: 550,
        quantity: 2,
        unit: '৪০০ গ্রাম',
        image: 'https://images.unsplash.com/photo-1511117461117-573522c1b4ec?auto=format&fit=crop&w=600&q=80',
      }
    ],
    totalAmount: 1220,
    deliveryCharge: 120,
    status: 'delivered',
    createdAt: '২৪ জুন, ২০২৬',
  }
];

// Pre-seeded initial users for demo and simulation
const INITIAL_USERS: User[] = [
  {
    id: 'U-581932',
    name: 'রফিক উল্লাহ',
    phone: '01712345678',
    password: 'password123',
    address: 'বাসা #১০, রোড #২, সেক্টর #৪',
    district: 'ঢাকা',
    area: 'উত্তরা',
    role: 'user',
    status: 'active',
    createdAt: '২৫ জুন, ২০২৬',
  },
  {
    id: 'U-392104',
    name: 'তাহমিনা বেগম',
    phone: '01876543210',
    password: 'password123',
    address: 'জিইসি মোড়, লালখান বাজার',
    district: 'চট্টগ্রাম',
    area: 'কোতোয়ালী',
    role: 'user',
    status: 'active',
    createdAt: '২৪ জুন, ২০২৬',
  },
  {
    id: 'U-130163',
    name: 'মুরাদ পারভেজ (অ্যাডমিন)',
    phone: '01301636461',
    password: 'password123',
    address: 'নওহাটা, পবা',
    district: 'রাজশাহী',
    area: 'পবা',
    role: 'admin',
    status: 'active',
    createdAt: '০১ জুলাই, ২০২৬',
  }
];

const bnMonths: Record<string, number> = {
  'জানুয়ারি': 0, 'জানুয়ারি': 0,
  'ফেব্রুয়ারি': 1, 'ফেব্রুয়ারি': 1,
  'মার্চ': 2,
  'এপ্রিল': 3,
  'মে': 4,
  'জুন': 5,
  'জুলাই': 6,
  'আগস্ট': 7, 'আগষ্ট': 7,
  'সেপ্টেম্বর': 8, 'সেপ্টেম্বার': 8,
  'অক্টোবর': 9, 'অক্টোবার': 9,
  'নভেম্বর': 10, 'নভেম্বার': 10,
  'ডিসেম্বর': 11, 'ডিসেম্বার': 11
};

const safeParseDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? new Date() : dateVal;
  }
  
  const parsed = new Date(dateVal);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  if (typeof dateVal === 'string') {
    try {
      const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      let normalized = dateVal;
      for (let i = 0; i < 10; i++) {
        normalized = normalized.replace(new RegExp(bengaliDigits[i], 'g'), englishDigits[i]);
      }
      
      normalized = normalized.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      const parts = normalized.split(' ');
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1];
        const year = parseInt(parts[2], 10);
        
        const monthIndex = bnMonths[monthStr] !== undefined ? bnMonths[monthStr] : 5;
        if (!isNaN(day) && !isNaN(year)) {
          return new Date(year, monthIndex, day);
        }
      }
    } catch (e) {
      console.error("Error parsing Bengali date:", e);
    }
  }
  
  return new Date();
};

const getBengaliTimeAgo = (dateVal: any): string => {
  const date = safeParseDate(dateVal);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) {
    return 'এইমাত্র';
  }
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  const toBengaliNumber = (num: number): string => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(digit => {
      const idx = parseInt(digit, 10);
      return !isNaN(idx) ? bengaliDigits[idx] : digit;
    }).join('');
  };
  
  if (diffMins < 1) {
    return 'এইমাত্র';
  }
  if (diffMins < 60) {
    return `${toBengaliNumber(diffMins)} মিনিট আগে`;
  }
  if (diffHours < 24) {
    return `${toBengaliNumber(diffHours)} ঘণ্টা আগে`;
  }
  if (diffDays < 30) {
    return `${toBengaliNumber(diffDays)} দিন আগে`;
  }
  if (diffMonths < 12) {
    return `${toBengaliNumber(diffMonths)} মাস আগে`;
  }
  return `${toBengaliNumber(diffYears)} বছর আগে`;
};

const formatBengaliDateTime = (dateVal: any): string => {
  const date = safeParseDate(dateVal);
  try {
    const timeStr = date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    return `${timeStr} - ${dateStr}`;
  } catch {
    return '';
  }
};

const isProductVisibleToCustomer = (product: Product): boolean => {
  if (product.status === 'Inactive') {
    return false;
  }
  if (product.sellerId && product.sellerProductStatus !== 'approved') {
    return false;
  }
  return true;
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  homemade: <Home className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
  honey: <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
  'oil-ghee': <Droplet className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
  'jaggery-sugar': <Cookie className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
  'laccha-semai': <Waves className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
  'fresh-mango': <Leaf className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
  dates: <Sun className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
  'pure-grains': <Wheat className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />,
};

const getProductSKU = (id: string, name: string, product?: Product) => {
  if (product && product.sku) return product.sku;
  const customMap: Record<string, string> = {
    'p1': 'SUNDARBAN-HONEY-1KG',
    'p2': 'GAWA-GHEE',
    'p3': 'MUSTARD-OIL',
    'p4': 'KHEJUR-GUR-1KG',
    'p5': 'JOWAR-AATA-1KG',
    'p6': 'HANDMADE-NUDULS-500G',
    'p7': 'AMROPALI-MANGO-5KG',
    'p8': 'HONEY-NUTS-400G',
    'm1': 'AMROPALI-MANGO',
    'm2': 'GOPALVOG-MANGO',
    'm3': 'GAVINDAVOG-MANGO',
    'm4': 'LANGRA-MANGO',
    'm5': 'HARIVANGA-MANGO',
    'm6': 'HIMSAHOR-MANGO',
    'd1': 'MARYAM-DATES',
  };
  if (customMap[id]) return customMap[id];
  return name.replace(/[^\w\s-]/g, '').trim().toUpperCase().replace(/\s+/g, '-').substring(0, 15) || `ML-${id.toUpperCase()}`;
};

const getProductSizes = (id: string, product?: Product) => {
  let sizes: string[] = [];
  if (product && product.sizes && product.sizes.length > 0) {
    sizes = product.sizes;
  } else {
    const sizeMap: Record<string, string[]> = {
      'p1': ['0.5 KG', '1 KG'],
      'p2': ['0.5 KG', '1 KG', '2 KG'],
      'p3': ['1 Liter', '2 Liter', '5 Liter'],
      'p4': ['1 KG'],
      'p5': ['1 KG'],
      'p6': ['500G'],
      'p7': ['5 KG', '10 KG'],
      'p8': ['400G'],
      'h1': ['0.5 KG', '1 KG'],
      'h2': ['0.5 KG', '1 KG', '2 KG'],
      'h3': ['0.5 KG', '1 KG'],
      'h4': ['0.5 KG', '1 KG'],
      'm1': ['12 KG', '24 KG'],
      'm2': ['12 KG', '24 KG'],
      'm3': ['12 KG', '24 KG'],
      'm4': ['12 KG', '24 KG'],
      'm5': ['12 KG', '24 KG'],
      'm6': ['12 KG', '24 KG'],
      'd1': ['0.5 KG', '1 KG'],
    };
    sizes = sizeMap[id] || (product && product.unit ? [product.unit] : ['1 KG']);
  }
  return sortProductSizes(sizes);
};

const DEFAULT_SITE_CONFIG: SiteConfig = {
  storeName: 'ম্যাংগো লাভার',
  storeSlogan: 'Pure & Organic Food',
  storeLogo: '/src/assets/images/mango_lover_logo_1782453485561.jpg',
  leftBannerImage: '/src/assets/images/mango_farmer_orchard_1782453455911.jpg',
  leftBannerTitle: 'আমবাগান থেকে সরাসরি আপনার দোরগোড়ায়',
  leftBannerSubtitle: 'রাজশাহীর নিজস্ব বাগান থেকে কেমিক্যাল ছাড়া ফরমালিন মুক্ত একদম তাজা পাকা ও মিষ্টি আম সরবরাহ করছি।',
  leftBannerBtnText: 'Shop Now',
  leftBannerCategory: 'ফ্রেশ আম',
  rightBannerImage: '/src/assets/images/sundarban_honey_jar_1782453470122.jpg',
  rightBannerTitle: 'টাকা দিয়ে কিনবেন যেহেতু, খাঁটি-টাই নিন',
  rightBannerSubtitle: 'সুন্দরবনের খাঁটি মধু যা সরাসরি বন থেকে মৌয়ালদের সাহায্যে সংগ্রহ করা হয়। গুণগত মানে একদম খাঁটি।',
  rightBannerBtnText: 'Shop Now',
  rightBannerTagline: 'শতভাগ ন্যাচারাল হানি',
  rightBannerCategory: 'মধু',
  tickerItems: [
    '🚚 অগ্রীম ছাড়াই অর্ডার করতে পারবেন',
    '🛡️ ডেলিভারির সময় প্রোডাক্ট দেখে নিতে পারবেন',
    '🍯 সিজন ফ্রেশ সুন্দরবনের খাঁটি মধু চলে এসেছে',
    '📦 সারাদেশে ৩ দিনে দ্রুত হোম ডেলিভারি সুবিধা',
    '💯 শতভাগ ন্যাচারাল ও কেমিক্যালমুক্ত ফ্রেশ আম',
    '📞 যেকোনো প্রয়োজনে সরাসরি কল করুন আমাদের হটলাইনে'
  ],
  categoryImages: {},
  categoryBanners: {},
  categoryNames: {},
  aboutTitle: 'আমাদের সম্পর্কে?',
  aboutSubtitle: 'এই যে আপনি আজ আমাদের সম্পর্কে জানতে চাচ্ছেন, এই পথটা সহজ ছিল না। অনেক চড়াই-উতরাই পেরিয়ে আজকের অবস্থানে আপনাদের পছন্দের এই ম্যাংগো লাভার। আমাদের এই পথচলায় সকল প্রিয় গ্রাহক ও শুভাকাঙ্ক্ষীদের কাছে আমরা চিরকৃতজ্ঞ।',
  aboutOwnerImage: '/src/assets/images/mango_farmer_orchard_1782453455911.jpg',
  aboutHighlightText: 'নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের পুষ্টি বিভাগ থেকে স্নাতক সম্পন্ন করা এক তরুণ - নাম তার মুরাদ পারভেজ।',
  aboutParagraph1: 'যার শৈশব ও বেড়ে ওঠা নিভৃত পল্লীগাঁয়ে। উচ্চশিক্ষার উদ্দেশ্যে গ্রাম ছেড়ে তিনি পাড়ি জমান নোয়াখালীতে। সেখানে গিয়ে নিজের প্রয়োজনে কেনা খেজুরের গুড়, ঘি কিংবা আম - সবকিছুতেই কৃত্রিমতার ছাপ লক্ষ্য করেন। যেহেতু তার শৈশব কেটেছে গ্রামে, তাই খাঁটি খাদ্যদ্রব্য চিনতে তার ভুল হওয়ার কথা নয়; তার ওপর নিজের পড়াশোনাও ছিল \'নিরাপদ খাদ্য\' নিয়ে।',
  aboutParagraph2: 'ক্যাম্পাসে পরিচিতদের জন্য গুড় ও ঘি এনে প্রশংসা পাওয়ার পর তার মনে হয়েছিল—নিজে উদ্যোক্তা হয়ে দেশজুড়ে মানুষের কাছে খাঁটি খাদ্য পৌঁছে দিলে কেমন হয়? সেই ভাবনা থেকেই পরিবারের দেওয়া সামান্য আর্থিক পুঁজি নিয়ে তিনি এই সংকল্পে নামলেন যে - যতটুকু সম্ভব, ততটুকুই খাঁটি জিনিস তিনি গ্রাহকদের কাছে পৌঁছে দেবেন। অনেক নির্ঘুম রাত আর অক্লান্ত পরিশ্রমে তিনি নিজের প্রচেষ্টা অব্যাহত রেখে প্রমাণ করলেন যে, একাগ্রতা থাকলে সবই সম্ভব। কোনো কিছু অর্জন করতে হলে আগে সেটি দৃঢ়ভাবে চাইতে হয়।',
  aboutParagraph3: 'পরবর্তীতে কয়েক লক্ষ গ্রাহকের দোরগোড়ায় তিনি পৌঁছে দিয়েছেন তার এই \'ম্যাংগো লাভার\'-এর পণ্য। তৈরি হয়েছে বিশাল এক অনুগত গ্রাহক শ্রেণি। সেই সঙ্গে নিরবিচ্ছিন্ন সেবা নিশ্চিত করতে তিনি গড়ে তুলেছেন দক্ষ সাপোর্ট টিম। আজ ৬০ জনেরও বেশি কর্মী নিয়ে তিনি সফলতার সাথে এগিয়ে যাচ্ছেন।',
  aboutFacebookLink: 'https://facebook.com',
  contactOffice: 'Nowhata, Paba, Rajshahi, Bangladesh, 6213',
  contactPhone: '+880 1301-636461',
  contactEmail: 'info AT mangolover.com.bd',
  refundPolicyText: 'আমাদের মূল লক্ষ্য গ্রাহকের সন্তুষ্টি। যদি কোনো কারণে আপনি পণ্য পেয়ে অসন্তুষ্ট হন, তবে নিম্নলিখিত নীতি অনুযায়ী আমরা পণ্য পরিবর্তন বা মূল্য ফেরত দিয়ে থাকি:\n\n১. ডেলিভারির সময় পণ্য দেখে নেওয়ার সুযোগ রয়েছে। কোনো প্রকার ক্রটি থাকলে ডেলিভারি ম্যানের কাছেই ফেরত দিতে পারবেন।\n\n২. আমরা রাজশাহী থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ।\n\n৩. রিটার্ন করার পর ৩ কার্যদিবসের মধ্যে আপনার বিকাশ/রকেট/নগদ অথবা ব্যাংক অ্যাকাউন্টে টাকা রিফান্ড করা হবে।',
  privacyPolicyText: 'আপনার গোপনীয়তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। ম্যাংগো লাভার গ্রাহকদের ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা নিশ্চিত করে:\n\n১. আমরা শুধুমাত্র অর্ডার প্রসেসিং এবং পণ্য ডেলিভারির সুবিধার্থে গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা সংগ্রহ করি।\n\n২. সংগৃহীত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রয় বা হস্তান্তর করা হয় না।\n\n৩. আমাদের ওয়েবসাইট এবং গ্রাহক ডেটাবেজ সুরক্ষিত রাখতে আমরা আধুনিক সিকিউরিটি প্রোটোকল ব্যবহার করি।',
  coupons: [
    { code: 'MANGO10', type: 'percentage', value: 10 },
    { code: 'MANGO100', type: 'flat', value: 100 },
    { code: 'FREE50', type: 'flat', value: 50 }
  ],
  promoActive: true,
  promoImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
  promoLink: '',
  faqItems: [
    {
      question: 'আমের ডেলিভারি কীভাবে দেওয়া হয় এবং কতদিন সময় লাগে?',
      answer: 'আমরা নিজস্ব তত্ত্বাবধানে কুরিয়ারের মাধ্যমে অর্ডার পাওয়ার পর রাজশাহীর বাগান থেকে সরাসরি তাজা আম পেড়ে সর্বোচ্চ ৩ দিনের মধ্যে দেশজুড়ে হোম ডেলিভারি নিশ্চিত করি।'
    },
    {
      question: 'আম কি সম্পূর্ণ কেমিক্যাল ও ফরমালিন মুক্ত?',
      answer: 'হ্যাঁ, ম্যাংগো লাভার-এর প্রতিটি আম রাজশাহীর বাগান থেকে শতভাগ কেমিক্যাল ও ফরমালিন ছাড়াই প্রাকৃতিকভাবে পাকানো অবস্থায় গাছ থেকে পেড়ে সরাসরি পাঠানো হয়।'
    },
    {
      question: 'ডেলিভারি পাওয়ার পর আম বা অন্য পণ্য নষ্ট বের হলে কী করণীয়?',
      answer: 'ডেলিভারি পাওয়ার পর কোনো আম বা পণ্য নষ্ট বের হলে অনুগ্রহ করে আমাদের হটলাইনে (+৮৮০ ১৩০১-৬৩৬৪৬১) যোগাযোগ করুন অথবা ছবি তুলে জানান। আমরা নষ্ট হওয়া অংশের সমপরিমাণ রিফান্ড অথবা নতুন আম একদম ফ্রিতে পাঠিয়ে দেবো।'
    },
    {
      question: 'আপনাদের কি কোনো অফলাইন শোরুম আছে নাকি শুধু অনলাইনেই সার্ভিস দেন?',
      answer: 'আমাদের মূল বাগান ও সংগ্রহ কেন্দ্র রাজশাহীর পবা ও বাঘায় অবস্থিত। বর্তমানে আমরা শুধু অনলাইনের মাধ্যমে সরাসরি বাগান থেকে ফ্রেশ পণ্য গ্রাহকের দোরগোড়ায় পৌঁছে দেওয়ার সেবা দিয়ে আসছি।'
    }
  ]
};

const toBengaliNumber = (num: number | string): string => {
  const banglaDigits: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => banglaDigits[char] || char).join('');
};

const SEARCH_SUGGESTIONS = [
  'খাঁটি সুন্দরবনের মধু খুঁজুন...',
  'ঘানি ভাঙা সরিষার তেল খুঁজুন...',
  'ফরমালিন মুক্ত মিষ্টি আম খুঁজুন...',
  'খাঁটি গাওয়া ঘি খুঁজুন...',
  'অর্গানিক আখের গুড় খুঁজুন...',
  'ঘি-এ ভাজা লাচ্ছা সেমাই খুঁজুন...',
  'প্রিমিয়াম কোয়ালিটির খেজুর খুঁজুন...'
];

export default function App() {
  // --- Persistent Storage State (In-Memory Defaults, Dynamically Loaded from Server API) ---
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem('mango_lover_site_config');
      return saved ? JSON.parse(saved) : DEFAULT_SITE_CONFIG;
    } catch (e) {
      return DEFAULT_SITE_CONFIG;
    }
  });
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // --- Initial database load from Server API on mount ---
  useEffect(() => {
    fetch('/api/init')
      .then((res) => {
        if (!res.ok) throw new Error("API load error");
        return res.json();
      })
      .then((data) => {
        if (data.products && Array.isArray(data.products)) setProducts(data.products);
        if (data.siteConfig && typeof data.siteConfig === 'object') {
          setSiteConfig(data.siteConfig);
          localStorage.setItem('mango_lover_site_config', JSON.stringify(data.siteConfig));
        }
        if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
        if (data.orders && Array.isArray(data.orders)) setOrders(data.orders);
        if (data.users && Array.isArray(data.users)) setUsers(data.users);
        if (data.withdrawRequests && Array.isArray(data.withdrawRequests)) setWithdrawRequests(data.withdrawRequests);
        if (data.productRequests && Array.isArray(data.productRequests)) setProductRequests(data.productRequests);
      })
      .catch((err) => console.error("Failed to load initial database payload from server:", err));
  }, []);

  useEffect(() => {
    if (siteConfig && siteConfig.storeName) {
      localStorage.setItem('mango_lover_site_config', JSON.stringify(siteConfig));
    }
  }, [siteConfig]);

  const handleUpdateSiteConfig = (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    fetch('/api/site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    }).catch((err) => console.error("Failed to sync site config to server:", err));
  };

  const handleUpdateCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCategories)
    }).catch((err) => console.error("Failed to sync categories to server:", err));
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ml_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ml_logged_in_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [adminLoginErrorState, setAdminLoginErrorState] = useState<'error-only' | 'show-link' | null>(null);
  const [isSellerDashboardOpen, setIsSellerDashboardOpen] = useState(false);

  // --- Admin Login Error Multi-Step Timeout Flow ---
  useEffect(() => {
    if (adminLoginErrorState === 'error-only') {
      const timer = setTimeout(() => {
        setAdminLoginErrorState('show-link');
      }, 2000);
      return () => clearTimeout(timer);
    } else if (adminLoginErrorState === 'show-link') {
      const timer = setTimeout(() => {
        setAdminLoginErrorState(null);
        window.location.hash = ''; // Redirect to homepage
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [adminLoginErrorState]);

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('ml_logged_in_user', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('ml_logged_in_user');
    }
  }, [loggedInUser]);

  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    }).catch(err => console.error("Error adding user in API:", err));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u));
    if (loggedInUser && loggedInUser.id === updatedUser.id) {
      setLoggedInUser(updatedUser);
    }
    fetch(`/api/users/${updatedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    }).catch(err => console.error("Error updating user in API:", err));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (loggedInUser && loggedInUser.id === userId) {
      setLoggedInUser(null);
    }
    fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    }).catch(err => console.error("Error deleting user in API:", err));
  };

  const handleRegisterUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    setLoggedInUser(newUser);
    if (newUser.role === 'seller') {
      showNotification(`অভিনন্দন ${newUser.name}! আপনার উদ্যোক্তা অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে এবং এটি অনুমোদন অপেক্ষমাণ!`, 'success');
    } else {
      showNotification(`অভিনন্দন ${newUser.name}! আপনার অ্যাকাউন্টটি সফলভাবে তৈরি হয়েছে এবং স্বয়ংক্রিয়ভাবে লগইন সম্পন্ন হয়েছে।`, 'success');
    }
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    }).catch(err => console.error("Error registering user in API:", err));
  };

  const handleLoginUser = (user: User) => {
    if (user.status === 'blocked') {
      showNotification('দুঃখিত! আপনার একাউন্টটি ব্লকড রয়েছে। দয়া করে অ্যাডমিনের সাথে যোগাযোগ করুন।', 'error');
      return;
    }
    setLoggedInUser(user);
    showNotification(`স্বাগতম ${user.name}! লগইন সফল হয়েছে।`, 'success');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    showNotification('আপনি সফলভাবে লগআউট করেছেন।', 'info');
  };

  const [requestModalProduct, setRequestModalProduct] = useState<Product | null>(null);

  // Form states for the product request
  const [reqCustomerName, setReqCustomerName] = useState('');
  const [reqCustomerPhone, setReqCustomerPhone] = useState('');
  const [reqCustomerAddress, setReqCustomerAddress] = useState('');
  const [reqQuantity, setReqQuantity] = useState('1');

  const handleOpenRequestModal = (product: Product) => {
    setRequestModalProduct(product);
    setReqCustomerName('');
    setReqCustomerPhone('');
    setReqCustomerAddress('');
    setReqQuantity('1');
  };

  const handlePlaceProductRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalProduct) return;

    if (!reqCustomerName.trim() || !reqCustomerPhone.trim() || !reqCustomerAddress.trim() || !reqQuantity.trim()) {
      showNotification('সবগুলো তথ্য পূরণ করা বাধ্যতামূলক!', 'error');
      return;
    }

    const newRequest: ProductRequest = {
      id: 'REQ-' + Math.floor(100000 + Math.random() * 900000),
      productId: requestModalProduct.id,
      productName: requestModalProduct.name,
      productImage: requestModalProduct.image,
      customerName: reqCustomerName,
      customerPhone: reqCustomerPhone,
      deliveryAddress: reqCustomerAddress,
      quantity: reqQuantity,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    setProductRequests(prev => [newRequest, ...prev]);
    setRequestModalProduct(null);
    showNotification('আপনার রিকুয়েস্টটি সফলভাবে গ্রহণ করা হয়েছে! আমরা খুব শীঘ্রই যোগাযোগ করবো।', 'success');

    fetch('/api/product-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    }).catch(err => console.error("Error saving product request in API:", err));
  };

  const handleUpdateProductRequestStatus = (id: string, status: 'pending' | 'completed' | 'contacted') => {
    setProductRequests(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status } : r);
      const targetReq = updated.find(r => r.id === id);
      if (targetReq) {
        fetch(`/api/product-requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetReq)
        }).catch(err => console.error("Error updating product request in API:", err));
      }
      return updated;
    });
  };

  const handleDeleteProductRequest = (id: string) => {
    setProductRequests(prev => prev.filter(r => r.id !== id));
    fetch(`/api/product-requests/${id}`, {
      method: 'DELETE'
    }).catch(err => console.error("Error deleting product request in API:", err));
  };

  // --- UI Filter & Navigation State ---
  const [activePage, setActivePage] = useState<'home' | 'about' | 'contact' | 'privacy' | 'refund' | 'faq'>('home');
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [showAllProducts, setShowAllProducts] = useState<boolean>(false);
  const [showOnlyProduced, setShowOnlyProduced] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideSuggestions, setHideSuggestions] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewSize, setQuickViewSize] = useState<string>('');
  const [quickViewImageIndex, setQuickViewImageIndex] = useState<number>(0);
  const [viewingDetailsProduct, setViewingDetailsProduct] = useState<Product | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [selectedBannerProduct, setSelectedBannerProduct] = useState<Product | null>(null);
  const [globalLoadingProduct, setGlobalLoadingProduct] = useState<Product | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default');
  const [shopCurrentPage, setShopCurrentPage] = useState<number>(1);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Reset shopCurrentPage to 1 when filters change
  useEffect(() => {
    setShopCurrentPage(1);
  }, [currentCategory, searchQuery, showAllProducts, showOnlyProduced, sortBy]);

  const handleFooterFilter = (category: string, search: string = '') => {
    setActivePage('home');
    setCurrentCategory(category);
    setSearchQuery(search);
    setShowAllProducts(true);
    setShowOnlyProduced(false);
    setViewingDetailsProduct(null);
    setSelectedProduct(null);
    const el = document.getElementById('product-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const startProductLoadingTransition = (product: Product, toPage: 'details' | 'quick') => {
    setGlobalLoadingProduct(product);
    setTimeout(() => {
      setGlobalLoadingProduct(null);
      if (toPage === 'details') {
        setViewingDetailsProduct(product);
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSelectedProduct(product);
        setDetailQuantity(1);
      }
    }, 2000);
  };

  // Reset modal values when selectedProduct changes
  useEffect(() => {
    setQuickViewSize('');
    setDetailQuantity(1);
    setQuickViewImageIndex(0);
  }, [selectedProduct]);

  // --- Modal & Screen States ---
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'products' | 'orders' | 'marketing' | 'chats' | 'payments' | 'requests' | 'users' | 'sellers'>('overview');
  const [sellerInitialTab, setSellerInitialTab] = useState<'overview' | 'products' | 'orders' | 'payouts' | 'settings'>('overview');

  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('read_notifications_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (loggedInUser) {
      try {
        const saved = localStorage.getItem(`read_notifications_v3_${loggedInUser.id}`);
        setReadNotifications(saved ? JSON.parse(saved) : []);
      } catch {
        setReadNotifications([]);
      }
    } else {
      setReadNotifications([]);
    }
  }, [loggedInUser]);

  const markAsRead = (id: string) => {
    if (!loggedInUser) return;
    const updated = [...readNotifications, id];
    setReadNotifications(updated);
    localStorage.setItem(`read_notifications_v3_${loggedInUser.id}`, JSON.stringify(updated));
  };

  const markAllAsRead = (ids: string[]) => {
    if (!loggedInUser) return;
    const updated = Array.from(new Set([...readNotifications, ...ids]));
    setReadNotifications(updated);
    localStorage.setItem(`read_notifications_v3_${loggedInUser.id}`, JSON.stringify(updated));
  };

  interface AppNotification {
    id: string;
    type: 'order' | 'product_active' | 'product_inactive' | 'payout_approved' | 'payout_pending' | 'seller_signup_new';
    title: string;
    message: string;
    date: Date;
    isRead: boolean;
    targetTab: string;
    targetDashboard: 'admin' | 'seller';
  }

  const notifications = React.useMemo<AppNotification[]>(() => {
    if (!loggedInUser) return [];
    const list: AppNotification[] = [];

    // --- ADMIN NOTIFICATIONS ---
    if (loggedInUser.role === 'admin' || loggedInUser.role === 'super-admin') {
      // 1. New Orders
      orders.forEach(order => {
        list.push({
          id: `admin-order-${order.id}-${order.createdAt}`,
          type: 'order',
          title: 'নতুন অর্ডার এসেছে! 📦',
          message: `ওয়েবসাইটে ১টি নতুন অর্ডার করা হয়েছে (অর্ডার আইডি: ${order.id})। ক্রেতা: ${order.customerName}। মোট মূল্য: ${order.totalAmount}৳।`,
          date: safeParseDate(order.createdAt),
          isRead: readNotifications.includes(`admin-order-${order.id}-${order.createdAt}`),
          targetDashboard: 'admin',
          targetTab: 'orders'
        });
      });

      // 2. New Seller registration
      users.filter(u => u.role === 'seller' && u.sellerStatus === 'pending').forEach(user => {
        list.push({
          id: `admin-seller-pending-${user.id}`,
          type: 'seller_signup_new',
          title: 'নতুন উদ্যোক্তা আবেদন! 💼',
          message: `উদ্যোক্তা "${user.shopName || user.name}" ড্যাশবোর্ডে যোগদানের জন্য আবেদন করেছেন। অনুগ্রহ করে রিভিউ করে অনুমোদন দিন।`,
          date: safeParseDate(user.createdAt || Date.now() - 86400000),
          isRead: readNotifications.includes(`admin-seller-pending-${user.id}`),
          targetDashboard: 'admin',
          targetTab: 'sellers'
        });
      });

      // 3. New Payout requests
      withdrawRequests.filter(w => w.status === 'pending').forEach(withdraw => {
        list.push({
          id: `admin-withdraw-pending-${withdraw.id}-${withdraw.createdAt}`,
          type: 'payout_pending',
          title: 'নতুন উইথড্র রিকোয়েস্ট! 💰',
          message: `উদ্যোক্তা "${withdraw.shopName}" ${withdraw.amount}৳ উইথড্র করার আবেদন করেছেন। মাধ্যম: ${withdraw.method.toUpperCase()}।`,
          date: safeParseDate(withdraw.createdAt),
          isRead: readNotifications.includes(`admin-withdraw-pending-${withdraw.id}-${withdraw.createdAt}`),
          targetDashboard: 'admin',
          targetTab: 'payments'
        });
      });
    }

    // --- SELLER NOTIFICATIONS ---
    if (loggedInUser.role === 'seller') {
      const sellerProducts = products.filter(p => p.sellerId === loggedInUser.id);
      const sellerOrders = orders.filter(order =>
        order.items.some(item => sellerProducts.some(p => p.id === item.productId))
      );
      const sellerWithdraws = withdrawRequests.filter(w => w.sellerId === loggedInUser.id);

      // 1. Orders
      sellerOrders.forEach(order => {
        list.push({
          id: `seller-order-${order.id}-${order.createdAt}`,
          type: 'order',
          title: 'নতুন অর্ডার এসেছে! 🎉',
          message: `আপনার পণ্যের জন্য ১টি নতুন অর্ডার এসেছে (অর্ডার নং: ${order.id})। গ্রাহক: ${order.customerName}। অনুগ্রহ করে মেমো ও লেবেল প্রিন্ট করে পার্সেল রেডি করুন।`,
          date: safeParseDate(order.createdAt),
          isRead: readNotifications.includes(`seller-order-${order.id}-${order.createdAt}`),
          targetDashboard: 'seller',
          targetTab: 'orders'
        });
      });

      // 2. Product Status
      sellerProducts.forEach(product => {
        if (product.status === 'Active') {
          list.push({
            id: `seller-prod-active-${product.id}`,
            type: 'product_active',
            title: 'পণ্য লাইভ হয়েছে! ✅',
            message: `আপনার পণ্য "${product.name}" এডমিন কর্তৃক রিভিউ শেষে লাইভ করা হয়েছে। ক্রেতারা এখন এটি কিনতে পারবেন।`,
            date: new Date(),
            isRead: readNotifications.includes(`seller-prod-active-${product.id}`),
            targetDashboard: 'seller',
            targetTab: 'products'
          });
        } else if (product.status === 'Inactive' || product.status === 'Rejected') {
          list.push({
            id: `seller-prod-inactive-${product.id}`,
            type: 'product_inactive',
            title: 'পণ্য ইনঅ্যাক্টিভ করা হয়েছে! ❌',
            message: `আপনার পণ্য "${product.name}" এডমিন কর্তৃক সাময়িকভাবে বাতিল বা ইনঅ্যাক্টিভ করা হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।`,
            date: new Date(),
            isRead: readNotifications.includes(`seller-prod-inactive-${product.id}`),
            targetDashboard: 'seller',
            targetTab: 'products'
          });
        }
      });

      // 3. Withdraw
      sellerWithdraws.forEach(withdraw => {
        if (withdraw.status === 'completed') {
          list.push({
            id: `seller-withdraw-appr-${withdraw.id}-${withdraw.createdAt}`,
            type: 'payout_approved',
            title: 'টাকার আবেদন সফল! 💰',
            message: `আপনার উইথড্র আবেদন (পরিমাণ: ${withdraw.amount}৳, মাধ্যম: ${withdraw.method.toUpperCase()}) সফলভাবে সম্পন্ন হয়েছে এবং টাকা পাঠানো হয়েছে।`,
            date: safeParseDate(withdraw.createdAt),
            isRead: readNotifications.includes(`seller-withdraw-appr-${withdraw.id}-${withdraw.createdAt}`),
            targetDashboard: 'seller',
            targetTab: 'payouts'
          });
        } else if (withdraw.status === 'pending') {
          list.push({
            id: `seller-withdraw-pend-${withdraw.id}-${withdraw.createdAt}`,
            type: 'payout_pending',
            title: 'টাকার আবেদন প্রক্রিয়াধীন ⏳',
            message: `আপনার ${withdraw.amount}৳-র উইথড্র আবেদনটি ড্যাশবোর্ডে গৃহীত হয়েছে এবং বর্তমানে প্রক্রিয়াধীন রয়েছে।`,
            date: safeParseDate(withdraw.createdAt),
            isRead: readNotifications.includes(`seller-withdraw-pend-${withdraw.id}-${withdraw.createdAt}`),
            targetDashboard: 'seller',
            targetTab: 'payouts'
          });
        }
      });
    }

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders, withdrawRequests, users, products, readNotifications, loggedInUser]);

  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const handleNotificationClick = (noti: AppNotification) => {
    markAsRead(noti.id);
    if (noti.targetDashboard === 'admin') {
      setIsAdminMode(true);
      setIsSellerDashboardOpen(false);
      setAdminInitialTab(noti.targetTab as any);
    } else if (noti.targetDashboard === 'seller') {
      setIsSellerDashboardOpen(true);
      setIsAdminMode(false);
      setSellerInitialTab(noti.targetTab as any);
    }
    setIsNotificationsOpen(false);
  };

  // --- Hash Routing for Admin Panel ---
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        if (loggedInUser?.role === 'admin' || loggedInUser?.role === 'super-admin') {
          setIsAdminMode(true);
        } else {
          setIsAdminMode(false);
          // Do not open AuthModal automatically or show notification on load.
          // Simply clear the hash so the user remains on the homepage without any intrusive login popup.
          window.location.hash = '';
        }
      } else {
        setIsAdminMode(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check on initial mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [loggedInUser]);

  useEffect(() => {
    if (isAdminMode) {
      if (window.location.hash !== '#admin') {
        window.location.hash = 'admin';
      }
    } else {
      if (window.location.hash === '#admin') {
        window.location.hash = '';
      }
    }
  }, [isAdminMode]);

  // --- Promo Offer Modal State ---
  const [showPromoModal, setShowPromoModal] = useState<boolean>(true);

  const isPromoFirstRender = useRef(true);

  // Automatically show promo modal when admin updates the promo settings so they can see/test it instantly
  useEffect(() => {
    if (isPromoFirstRender.current) {
      isPromoFirstRender.current = false;
      return;
    }
    if (siteConfig.promoActive && siteConfig.promoImage) {
      setShowPromoModal(true);
    }
  }, [siteConfig.promoActive, siteConfig.promoImage]);

  // --- Toast Notification State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Direct Purchase (Single Item Buy) State ---
  const [directBuyItem, setDirectBuyItem] = useState<CartItem | null>(null);

  // Save cart to localStorage whenever cart state changes (shopper-specific preference)
  useEffect(() => {
    localStorage.setItem('ml_cart', JSON.stringify(cart));
  }, [cart]);

  // --- Cart Operations ---
  const handleAddToCart = (product: Product, quantity = 1, size?: string) => {
    if (product.stock === 0) return;
    
    const targetProduct = { ...product };
    if (size) {
      targetProduct.unit = size;
      if (product.sizePrices?.[size]) {
        targetProduct.price = product.sizePrices[size].price;
        targetProduct.originalPrice = product.sizePrices[size].originalPrice;
      }
    }
    
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === targetProduct.id && item.product.unit === targetProduct.unit);
      if (existing) {
        // Enforce stock limit
        const newQty = Math.min(existing.quantity + quantity, targetProduct.stock);
        return prevCart.map((item) =>
          (item.product.id === targetProduct.id && item.product.unit === targetProduct.unit) ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevCart, { product: targetProduct, quantity: Math.min(quantity, targetProduct.stock) }];
    });
    
    // Open cart drawer for feedback
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number, unit?: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        (item.product.id === productId && (!unit || item.product.unit === unit)) ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string, unit?: string) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.product.id === productId && (!unit || item.product.unit === unit))));
  };

  // --- Direct Purchase triggers ---
  const handleDirectBuy = (product: Product) => {
    setDirectBuyItem({ product, quantity: 1 });
    setIsCheckoutOpen(true);
  };

  const handleDetailsDirectBuy = () => {
    if (!selectedProduct) return;
    setDirectBuyItem({ product: selectedProduct, quantity: detailQuantity });
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  // --- Checkout Order Placement ---
  const handlePlaceOrder = (orderData: {
    id?: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    district: string;
    area: string;
    paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
    bkashNumber?: string;
    trxId?: string;
    deliveryCharge: number;
    couponCode?: string;
    discountAmount?: number;
  }) => {
    const itemsToOrder = directBuyItem ? [directBuyItem] : cart;
    const subtotal = itemsToOrder.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = orderData.discountAmount || 0;
    const totalAmount = Math.max(0, subtotal - discount + orderData.deliveryCharge);

    const newOrder: Order = {
      id: orderData.id || ('ML-' + Math.floor(100000 + Math.random() * 900000)),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      district: orderData.district,
      area: orderData.area,
      paymentMethod: orderData.paymentMethod,
      bkashNumber: orderData.bkashNumber,
      trxId: orderData.trxId,
      items: itemsToOrder.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        unit: item.product.unit,
        image: item.product.image,
        sellerId: item.product.sellerId,
      })),
      totalAmount,
      deliveryCharge: orderData.deliveryCharge,
      status: 'pending',
      createdAt: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
      couponCode: orderData.couponCode,
      discountAmount: discount,
    };

    // Update order state and API
    setOrders((prev) => [newOrder, ...prev]);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.error("Error saving new order in API:", err));

    // Deduct stock from products and sync each to API
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const orderedItem = itemsToOrder.find((item) => item.product.id === p.id);
        if (orderedItem) {
          const updatedProd = { ...p, stock: Math.max(0, p.stock - orderedItem.quantity) };
          fetch(`/api/products/${updatedProd.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProd)
          }).catch(err => console.error("Error syncing stock reduction in API:", err));
          return updatedProd;
        }
        return p;
      })
    );

    // Clear cart or direct buy state
    if (directBuyItem) {
      setDirectBuyItem(null);
    } else {
      setCart([]);
    }

    // Trigger excellent toast notification
    showNotification(`আপনার অর্ডারটি (${newOrder.id}) সফলভাবে নেওয়া হয়েছে! ক্যাশ মেমো জেনারেট করা হয়েছে।`, 'success');
  };

  // Helper to convert base64 image data into a binary Blob for FormData upload
  const base64ToBlob = (base64Data: string): Blob | null => {
    try {
      const parts = base64Data.split(',');
      if (parts.length !== 2) return null;
      const contentType = parts[0].split(':')[1].split(';')[0];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
      console.error("Failed to convert base64 to blob:", e);
      return null;
    }
  };

  // --- Admin Dashboard Callbacks ---
  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => {
    const productToAdd: Product = {
      ...newProduct,
      id: 'p' + (products.length + 10 + Math.floor(Math.random() * 1000)),
      rating: 5.0,
      reviewsCount: 1,
    };
    setProducts((prev) => [...prev, productToAdd]);

    const formData = new FormData();
    Object.entries(productToAdd).forEach(([key, value]) => {
      if (key === 'image' && typeof value === 'string' && value.startsWith('data:')) {
        const blob = base64ToBlob(value);
        if (blob) {
          formData.append('image', blob, 'image.jpg');
        } else {
          formData.append('image', value);
        }
      } else if (key === 'images' && Array.isArray(value)) {
        formData.append('images', JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    fetch('/api/products', {
      method: 'POST',
      body: formData
    }).catch(err => console.error("Error adding product in API:", err));
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));

    const formData = new FormData();
    Object.entries(updatedProduct).forEach(([key, value]) => {
      if (key === 'image' && typeof value === 'string' && value.startsWith('data:')) {
        const blob = base64ToBlob(value);
        if (blob) {
          formData.append('image', blob, 'image.jpg');
        } else {
          formData.append('image', value);
        }
      } else if (key === 'images' && Array.isArray(value)) {
        formData.append('images', JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    fetch(`/api/products/${updatedProduct.id}`, {
      method: 'PUT',
      body: formData
    }).catch(err => console.error("Error editing product in API:", err));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    }).catch(err => console.error("Error deleting product from API:", err));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const updatedOrder = { ...targetOrder, status };
      fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      }).catch(err => console.error("Error updating order status in API:", err));
    }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
    fetch(`/api/orders/${updatedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder)
    }).catch(err => console.error("Error updating order in API:", err));
  };

  const handleAddOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.error("Error adding order in API:", err));
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    fetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    }).catch(err => console.error("Error deleting order from API:", err));
  };

  const handleAddWithdrawRequest = (request: Omit<WithdrawRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: WithdrawRequest = {
      ...request,
      id: 'W-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setWithdrawRequests((prev) => [newRequest, ...prev]);
    fetch('/api/withdraw-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    }).catch(err => console.error("Error adding withdraw request in API:", err));
  };

  const handleUpdateWithdrawRequest = (id: string, status: 'pending' | 'completed' | 'rejected') => {
    setWithdrawRequests((prev) => {
      const updated = prev.map((req) => (req.id === id ? { ...req, status } : req));
      const targetReq = updated.find(w => w.id === id);
      if (targetReq) {
        fetch(`/api/withdraw-requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetReq)
        }).catch(err => console.error("Error updating withdraw request in API:", err));
      }
      return updated;
    });
  };

  // --- Filtering & Searching logic ---
  const filteredProducts = products.filter((product) => {
    // Filter out inactive and unapproved entrepreneur products
    if (!isProductVisibleToCustomer(product)) {
      return false;
    }
    // If showOnlyProduced is active, exclude Honey and Fresh Mango
    if (showOnlyProduced && (product.category === 'মধু' || product.category === 'ফ্রেশ আম')) {
      return false;
    }
    const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
    const matchesSearch =
      matchesSearchWithNumerals(product.name, searchQuery) ||
      matchesSearchWithNumerals(product.description, searchQuery) ||
      matchesSearchWithNumerals(product.category, searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getSortedProducts = (items: Product[]) => {
    const list = [...items];
    if (sortBy === 'price-low') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-high') {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'rating') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  };

  const displayedProducts = (currentCategory === 'all' && !searchQuery && !showAllProducts && !showOnlyProduced)
    ? filteredProducts.filter(p => p.category !== 'মধু' && p.category !== 'ফ্রেশ আম').slice(0, 6)
    : getSortedProducts(filteredProducts);

  const itemsPerPage = 12;
  const totalShopItems = displayedProducts.length;
  const totalShopPages = Math.ceil(totalShopItems / itemsPerPage) || 1;
  const shopCurrentPageSafe = Math.min(shopCurrentPage, totalShopPages);
  const paginatedDisplayedProducts = (currentCategory === 'all' && !searchQuery && !showAllProducts && !showOnlyProduced)
    ? displayedProducts
    : displayedProducts.slice((shopCurrentPageSafe - 1) * itemsPerPage, shopCurrentPageSafe * itemsPerPage);

  const isShopActive = currentCategory !== 'all' || showAllProducts || showOnlyProduced || !!searchQuery;

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick view product detail triggers
  const handleSelectProduct = (product: Product) => {
    setViewingDetailsProduct(product);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
  };

  if (isAdminMode && loggedInUser?.role !== 'admin' && loggedInUser?.role !== 'super-admin') {
    setIsAdminMode(false);
  }

  // Dynamic Home Page Sections List builder
  const otherCategories = categories.filter(cat => {
    if (cat.name === 'মধু' || cat.name === 'ফ্রেশ আম') return false;
    return products.some(p => p.category === cat.name && isProductVisibleToCustomer(p));
  });

  interface HomepageSection {
    id: string;
    title: string;
    subtitle: string;
    categoryName: string;
    btnText: string;
    isSpecialProduced?: boolean;
    bannerImage?: string;
    themeColor?: string;
  }

  const sectionsList: HomepageSection[] = [];

  // Section 1: আমাদের উৎপাদিত (index 0)
  sectionsList.push({
    id: 'section-produced',
    title: 'আমাদের উৎপাদিত',
    subtitle: 'Prepared by MangoLover',
    categoryName: 'all',
    btnText: 'সবগুলো দেখুন',
    isSpecialProduced: true,
    themeColor: 'orange'
  });

  // Section 2: আমাদের প্রাকৃতিক মধু (index 1)
  sectionsList.push({
    id: 'section-honey',
    title: 'আমাদের প্রাকৃতিক মধু',
    subtitle: 'Natural Honey',
    categoryName: 'মধু',
    btnText: 'সব মধু',
    bannerImage: siteConfig.categoryBanners?.['honey'] || '/src/assets/images/sundarban_honey_jar_1782453470122.jpg',
    themeColor: 'orange'
  });

  // Section 3: বছরের সেরা আম গুলো (index 2)
  sectionsList.push({
    id: 'section-mangoes',
    title: 'বছরের সেরা আম গুলো',
    subtitle: 'All Time Best',
    categoryName: 'ফ্রেশ আম',
    btnText: 'সবগুলো দেখুন',
    themeColor: 'emerald'
  });

  // Now dynamically push other categories starting from index 3
  otherCategories.forEach((cat, idx) => {
    let title = cat.name;
    let subtitle = 'Premium Collection';
    let bannerImage = '';
    let themeColor = 'orange';

    if (cat.name === 'তেল ও ঘি') {
      title = 'আমাদের খাঁটি তেল ও ঘি';
      subtitle = 'Pure Oil & Ghee';
      bannerImage = siteConfig.categoryBanners?.[cat.slug] || '/src/assets/images/gawa_ghee_1782456236375.jpg';
      themeColor = 'emerald';
    } else if (cat.name === 'হোমমেড') {
      title = 'স্পেশাল হোমমেড আচার ও সেমাই';
      subtitle = 'Homemade Specials';
      bannerImage = siteConfig.categoryBanners?.[cat.slug] || '/src/assets/images/amsotto_achar_1782456219512.jpg';
      themeColor = 'amber';
    } else if (cat.name === 'গুড় ও চিনি') {
      title = 'অর্গানিক গুড় ও চিনি';
      subtitle = 'Organic Jaggery & Sugar';
      bannerImage = siteConfig.categoryBanners?.[cat.slug] || '/src/assets/images/akher_gur_1782456206623.jpg';
      themeColor = 'orange';
    } else if (cat.name === 'লাচ্ছা সেমাই') {
      title = 'ঘি-এ ভাজা লাচ্ছা সেমাই';
      subtitle = 'Crispy Laccha Semai';
      bannerImage = siteConfig.categoryBanners?.[cat.slug] || '/src/assets/images/laccha_semai_1782456263350.jpg';
      themeColor = 'amber';
    } else if (cat.name === 'খেজুর') {
      title = 'প্রিমিয়াম কোয়ালিটির খেজুর';
      subtitle = 'Premium Dates';
      bannerImage = siteConfig.categoryBanners?.[cat.slug] || '/src/assets/images/lychee_honey_1782465883260.jpg';
      themeColor = 'orange';
    } else if (cat.name === 'খাঁটি শস্য') {
      title = 'খাঁটি ও পুষ্টিকর শস্য';
      subtitle = 'Pure Grains';
      bannerImage = siteConfig.categoryBanners?.[cat.slug] || '/src/assets/images/mustard_oil_1782456250479.jpg';
      themeColor = 'emerald';
    } else {
      title = `আমাদের খাঁটি ${cat.name}`;
      subtitle = 'Fresh & Organic';
      bannerImage = siteConfig.categoryBanners?.[cat.slug] || '';
      themeColor = idx % 2 === 0 ? 'emerald' : 'orange';
    }

    if (!bannerImage) {
      const firstProduct = products.find(p => p.category === cat.name && isProductVisibleToCustomer(p));
      bannerImage = firstProduct?.image || '/src/assets/images/mango_farmer_orchard_1782453455911.jpg';
    }

    sectionsList.push({
      id: `section-dynamic-${cat.slug}-${cat.id}`,
      title,
      subtitle,
      categoryName: cat.name,
      btnText: 'সবগুলো দেখুন',
      bannerImage,
      themeColor
    });
  });

  return (
    <div className="bg-white min-h-screen font-sans antialiased text-gray-800">
      {isAdminMode && (loggedInUser?.role === 'admin' || loggedInUser?.role === 'super-admin') ? (
        <AdminDashboard
          products={products}
          orders={orders}
          productRequests={productRequests}
          siteConfig={siteConfig}
          users={users}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateSiteConfig={handleUpdateSiteConfig}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onClose={() => setIsAdminMode(false)}
          onUpdateProductRequestStatus={handleUpdateProductRequestStatus}
          onDeleteProductRequest={handleDeleteProductRequest}
          onNotify={showNotification}
          categories={categories}
          onUpdateCategories={handleUpdateCategories}
          onAddOrder={handleAddOrder}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          loggedInUser={loggedInUser}
          withdrawRequests={withdrawRequests}
          onUpdateWithdrawRequest={handleUpdateWithdrawRequest}
          initialTab={adminInitialTab}
        />
      ) : isSellerDashboardOpen && loggedInUser?.role === 'seller' && siteConfig.sellerSystemActive !== false ? (
        <SellerDashboard
          products={products}
          orders={orders}
          siteConfig={siteConfig}
          loggedInUser={loggedInUser}
          withdrawRequests={withdrawRequests}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onClose={() => setIsSellerDashboardOpen(false)}
          onAddWithdrawRequest={handleAddWithdrawRequest}
          onNotify={showNotification}
          categories={categories}
          onUpdateUser={handleUpdateUser}
          initialTab={sellerInitialTab}
        />
      ) : (
        <>
          {/* 1. Header (ম্যাংগো লাভার) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => { setActivePage('home'); setCurrentCategory('all'); setShowAllProducts(false); setShowOnlyProduced(false); setSearchQuery(''); setViewingDetailsProduct(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 md:gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="relative w-11 h-11 md:w-14 md:h-14 flex items-center justify-center">
              {/* Spinning decorative outline ring (clockwise) */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-orange-500 opacity-80"
              />
              {/* Secondary opposite spinning ring for extra luxury depth (counter-clockwise) */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute inset-1 rounded-full border border-dotted border-emerald-500 opacity-60"
              />
              {/* Store Logo Circle Container */}
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white shadow-md z-10">
                <img 
                  src={siteConfig.storeLogo} 
                  alt={`${siteConfig.storeName} Logo`} 
                  className="w-full h-full object-cover scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              {siteConfig.storeNameImage ? (
                <img 
                  src={siteConfig.storeNameImage} 
                  alt={siteConfig.storeName} 
                  className="h-7 md:h-10 object-contain" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <span className="font-extrabold text-lg md:text-2xl tracking-tight bg-linear-to-r from-orange-500 via-amber-500 to-green-600 bg-clip-text text-transparent flex items-center gap-1.5 font-sans">
                    {siteConfig.storeName}
                  </span>
                  {siteConfig.storeSloganImage ? (
                    <img 
                      src={siteConfig.storeSloganImage} 
                      alt={siteConfig.storeSlogan} 
                      className="h-3 md:h-4.5 object-contain mt-0.5" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-wider -mt-0.5 uppercase">
                      {siteConfig.storeSlogan}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Large Interactive Search Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setHideSuggestions(true);
              const element = document.getElementById('product-section');
              element?.scrollIntoView({ behavior: 'smooth' });
              (document.activeElement as HTMLElement)?.blur();
            }}
            className="hidden md:flex flex-grow max-w-xl relative"
          >
            <input
              type="text"
              placeholder={isSearchFocused ? "খাঁটি মধু, ঘানি ভাঙা তেল, ফ্রেশ আম ইত্যাদি খুঁজুন..." : ""}
              value={searchQuery}
              onChange={(e) => { 
                setSearchQuery(e.target.value); 
                setHideSuggestions(false);
                setViewingDetailsProduct(null); 
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 text-sm pl-4 pr-12 py-2.5 rounded-full border border-gray-200 focus:outline-hidden focus:ring-3 focus:ring-orange-100 focus:border-orange-400 focus:bg-white transition-all font-medium relative z-10"
            />
            
            {!isSearchFocused && !searchQuery && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 overflow-hidden w-[calc(100%-3.5rem)] z-20">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0 animate-pulse" />
                <div className="relative h-5 w-full flex items-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={suggestionIndex}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "max-content", opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        width: { duration: 1.8, ease: "easeInOut" },
                        opacity: { duration: 0.25 }
                      }}
                      className="overflow-hidden whitespace-nowrap border-r-2 border-orange-500 text-gray-400 text-sm font-medium flex items-center pr-1 h-5"
                    >
                      {SEARCH_SUGGESTIONS[suggestionIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

            <motion.button 
              type="submit" 
              className="absolute right-1 top-1/2 -translate-y-1/2 z-30 cursor-pointer flex items-center justify-center"
              whileHover="hover"
              whileTap="tap"
              initial="rest"
            >
              <div className="relative flex items-center justify-center w-9 h-9">
                {/* Dynamic Aura Ripple */}
                <motion.div 
                  className="absolute inset-0 rounded-full bg-orange-500/25"
                  variants={{
                    rest: { scale: 1, opacity: 0.3 },
                    hover: { scale: 1.4, opacity: 0, transition: { repeat: Infinity, duration: 1.5, ease: "easeOut" } }
                  }}
                />
                
                {/* Beautiful Gradient Rounded Button */}
                <motion.div 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center relative overflow-hidden"
                  variants={{
                    rest: { scale: 1 },
                    hover: { scale: 1.1, boxShadow: "0 4px 12px rgba(249, 115, 22, 0.4)" },
                    tap: { scale: 0.92 }
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-white/20 -translate-x-full"
                    variants={{
                      hover: { x: "100%", transition: { duration: 0.6, ease: "easeInOut" } }
                    }}
                  />
                  <motion.div
                    variants={{
                      rest: { rotate: 0, scale: 1 },
                      hover: { rotate: 15, scale: 1.12 }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 12 }}
                  >
                    <Search className="w-4 h-4 text-white" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.button>
 
            {/* Desktop Live Search Suggestions Popup */}
            {searchQuery.trim().length >= 1 && !hideSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 max-h-96 overflow-y-auto">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 px-1 pb-1 border-b border-gray-50 flex justify-between items-center">
                  <span>খোঁজা হচ্ছে: "{searchQuery}"</span>
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-slate-800 font-extrabold text-xs cursor-pointer"
                  >
                    বন্ধ করুন ×
                  </button>
                </div>
                {products.filter(p => 
                  isProductVisibleToCustomer(p) && (
                    matchesSearchWithNumerals(p.name, searchQuery.trim()) ||
                    matchesSearchWithNumerals(p.category, searchQuery.trim()) ||
                    matchesSearchWithNumerals(p.description, searchQuery.trim())
                  )
                ).slice(0, 5).length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-400 font-medium">
                    কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি! 🔍
                  </div>
                ) : (
                  <div className="space-y-1">
                    {products.filter(p => 
                      isProductVisibleToCustomer(p) && (
                        matchesSearchWithNumerals(p.name, searchQuery.trim()) ||
                        matchesSearchWithNumerals(p.category, searchQuery.trim()) ||
                        matchesSearchWithNumerals(p.description, searchQuery.trim())
                      )
                    ).slice(0, 5).map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setViewingDetailsProduct(p);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50 cursor-pointer transition-colors border border-transparent hover:border-orange-100 group/suggest"
                      >
                        <div className="w-9 h-9 bg-gray-50 rounded-lg p-1 shrink-0 flex items-center justify-center border border-gray-100">
                          <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 group-hover/suggest:text-orange-600 transition-colors truncate py-1 leading-normal">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {p.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-orange-600 block">
                            {p.price}৳
                          </span>
                          <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                            {p.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Action Navigation Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Notification Bell Badge */}
            {loggedInUser && (
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2.5 bg-orange-50 hover:bg-orange-100/80 text-orange-600 rounded-xl border border-orange-100 cursor-pointer transition-all focus:outline-hidden focus:ring-2 focus:ring-orange-200 select-none flex items-center justify-center shrink-0"
                  title="নোটিফিকেশন সেন্টার"
                >
                  <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      {/* Backdrop for easy closing */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsNotificationsOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 text-left overflow-hidden origin-top-right"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2.5">
                          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Bell className="w-4 h-4 text-orange-500" />
                            <span>নোটিফিকেশন বার</span>
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead(notifications.map(n => n.id))}
                              className="text-[10px] font-extrabold text-[#006437] hover:underline cursor-pointer"
                            >
                              সব পঠিত মার্ক করুন
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          {notifications.length === 0 ? (
                            <div className="text-center py-8 text-stone-400 font-bold text-[11px]">
                              কোনো নোটিফিকেশন নেই।
                            </div>
                          ) : (
                            notifications.map(noti => {
                              let iconBg = 'bg-orange-50 text-orange-600';
                              let iconEl = <Bell className="w-4 h-4" />;
                              
                              if (noti.type === 'order') {
                                iconBg = 'bg-emerald-50 text-emerald-600';
                                iconEl = <ShoppingBag className="w-4 h-4" />;
                              } else if (noti.type === 'seller_signup_new') {
                                iconBg = 'bg-blue-50 text-blue-600';
                                iconEl = <Store className="w-4 h-4" />;
                              } else if (noti.type === 'payout_pending') {
                                iconBg = 'bg-amber-50 text-amber-600';
                                iconEl = <Clock className="w-4 h-4" />;
                              } else if (noti.type === 'payout_approved' || noti.type === 'product_active') {
                                iconBg = 'bg-[#e6f4ea] text-[#006437]';
                                iconEl = <CheckCircle className="w-4 h-4" />;
                              } else if (noti.type === 'product_inactive') {
                                iconBg = 'bg-rose-50 text-rose-600';
                                iconEl = <AlertCircle className="w-4 h-4" />;
                              }

                              const relativeTime = getBengaliTimeAgo(noti.date);
                              const formattedTime = formatBengaliDateTime(noti.date);

                              return (
                                <div
                                  key={noti.id}
                                  onClick={() => handleNotificationClick(noti)}
                                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all duration-200 flex gap-3 ${
                                    noti.isRead
                                      ? 'bg-stone-50/60 border-stone-100 text-stone-500 hover:bg-stone-100/50'
                                      : 'bg-orange-50/25 border-orange-100 text-slate-800 hover:bg-orange-50/50'
                                  }`}
                                >
                                  <div className={`p-2 rounded-xl shrink-0 h-fit ${iconBg}`}>
                                    {iconEl}
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-extrabold text-[11px] text-slate-900 leading-snug block truncate pr-1">
                                        {noti.title}
                                      </span>
                                      <span className="text-[9px] text-[#006437] font-extrabold whitespace-nowrap shrink-0 bg-emerald-50/80 px-1.5 py-0.5 rounded-md">
                                        {relativeTime}
                                      </span>
                                    </div>
                                    <p className="text-[10px] leading-relaxed mt-1 font-semibold text-slate-600">
                                      {noti.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-dotted border-stone-200">
                                      <span className="text-[9px] text-gray-400 font-bold block">
                                        {formattedTime}
                                      </span>
                                      {!noti.isRead && (
                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0 animate-pulse" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User Auth Section */}
            {loggedInUser ? (
              <div className="relative">
                {/* Profile Pill Badge (Dropdown trigger) */}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onBlur={() => {
                    // Slight delay to allow clicks on dropdown items
                    setTimeout(() => setIsUserMenuOpen(false), 180);
                  }}
                  className="flex items-center gap-2 bg-emerald-50 text-[#006437] hover:bg-emerald-100/70 font-extrabold text-[11px] px-3 py-2.5 rounded-xl border border-emerald-100 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-200 select-none"
                  title={loggedInUser.name}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
                    {loggedInUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[70px] sm:max-w-[120px] truncate">{loggedInUser.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Elegant Dropdown Card */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 text-left overflow-hidden origin-top-right"
                    >
                      {/* User metadata header inside dropdown */}
                      <div className="px-3 py-2.5 border-b border-gray-50 mb-1.5">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">লগইন করা অ্যাকাউন্ট</span>
                        <span className="block text-xs font-black text-slate-800 truncate leading-tight mt-0.5">{loggedInUser.name}</span>
                        <span className="inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                          {loggedInUser.role === 'super-admin'
                            ? '👑 সুপার অ্যাডমিন'
                            : loggedInUser.role === 'admin' 
                              ? '🛡️ অ্যাডমিন' 
                              : loggedInUser.role === 'seller' 
                                ? (loggedInUser.sellerStatus === 'approved' 
                                  ? '💼 উদ্যোক্তা (অনুমোদিত)' 
                                  : loggedInUser.sellerStatus === 'rejected'
                                    ? '❌ উদ্যোক্তা (প্রত্যাখ্যাত)'
                                    : '⏳ উদ্যোক্তা (আবেদন অপেক্ষমাণ)')
                                : '👤 কাস্টমার'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {/* Admin Dashboard Option */}
                        {(loggedInUser.role === 'admin' || loggedInUser.role === 'super-admin') && (
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevents button blur closing the menu before click runs
                              setIsAdminMode(true);
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                          >
                            <ShieldAlert className="w-4 h-4 text-orange-500" />
                            <span>অ্যাডমিন ড্যাশবোর্ড</span>
                          </button>
                        )}

                        {/* Seller Dashboard Option */}
                        {loggedInUser.role === 'seller' && siteConfig.sellerSystemActive !== false && (
                          loggedInUser.sellerStatus === 'approved' ? (
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setIsSellerDashboardOpen(true);
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                            >
                              <Store className="w-4 h-4 text-orange-500" />
                              <span>উদ্যোক্তা ড্যাশবোর্ড</span>
                            </button>
                          ) : (
                            <div className="px-3 py-2 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-xl mb-1 border border-amber-100">
                              {loggedInUser.sellerStatus === 'rejected'
                                ? '⚠️ আপনার উদ্যোক্তা আবেদনটি নামঞ্জুর করা হয়েছে।'
                                : '⏳ আপনার উদ্যোক্তা অ্যাকাউন্টটি অনুমোদনের জন্য অপেক্ষা করছে।'}
                            </div>
                          )
                        )}

                        {/* Logout Option */}
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>লগআউট করুন</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setAuthInitialMode('login');
                    setIsAuthOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
                  title="লগইন / রেজিস্টার"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন / রেজিস্টার</span>
                </button>
              </div>
            )}

            {/* Order Tracking Button */}
            <button
              onClick={() => setIsTrackOrderOpen(true)}
              className="relative p-2.5 bg-[#e6f4ea] hover:bg-[#d2ebd9] text-[#006437] rounded-xl border border-emerald-100/80 transition-colors cursor-pointer flex items-center gap-1.5"
              title="অর্ডার ট্র্যাকিং"
            >
              <Truck className="w-5 h-5" />
              <span className="hidden lg:inline text-[11px] font-black">অর্ডার ট্র্যাকিং</span>
            </button>

            {/* Cart Icon with badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-orange-50 hover:bg-orange-100/80 active:bg-orange-200 text-orange-600 rounded-xl transition-colors cursor-pointer"
              title="শপিং কার্ট"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[10px] w-5.5 h-5.5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3 pt-1 relative">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setHideSuggestions(true);
              const element = document.getElementById('product-section');
              element?.scrollIntoView({ behavior: 'smooth' });
              (document.activeElement as HTMLElement)?.blur();
            }}
            className="relative"
          >
            <input
              type="text"
              placeholder={isMobileSearchFocused ? "খাদ্যসামগ্রী খুঁজুন..." : ""}
              value={searchQuery}
              onChange={(e) => { 
                setSearchQuery(e.target.value); 
                setHideSuggestions(false);
                setViewingDetailsProduct(null); 
              }}
              onFocus={() => setIsMobileSearchFocused(true)}
              onBlur={() => setIsMobileSearchFocused(false)}
              className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 text-xs pl-3 pr-10 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all font-medium relative z-10"
            />

            {!isMobileSearchFocused && !searchQuery && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5 overflow-hidden w-[calc(100%-3rem)] z-20">
                <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-pulse" />
                <div className="relative h-4 w-full flex items-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={suggestionIndex}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "max-content", opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        width: { duration: 1.8, ease: "easeInOut" },
                        opacity: { duration: 0.25 }
                      }}
                      className="overflow-hidden whitespace-nowrap border-r-2 border-orange-500 text-gray-400 text-xs font-medium flex items-center pr-1 h-4"
                    >
                      {SEARCH_SUGGESTIONS[suggestionIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

            <motion.button 
              type="submit" 
              className="absolute right-1 top-1/2 -translate-y-1/2 z-30 cursor-pointer flex items-center justify-center"
              whileHover="hover"
              whileTap="tap"
              initial="rest"
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                {/* Dynamic Aura Ripple */}
                <motion.div 
                  className="absolute inset-0 rounded-full bg-orange-500/25"
                  variants={{
                    rest: { scale: 1, opacity: 0.3 },
                    hover: { scale: 1.4, opacity: 0, transition: { repeat: Infinity, duration: 1.5, ease: "easeOut" } }
                  }}
                />
                
                {/* Beautiful Gradient Rounded Button */}
                <motion.div 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white w-7 h-7 rounded-full shadow-xs flex items-center justify-center relative overflow-hidden"
                  variants={{
                    rest: { scale: 1 },
                    hover: { scale: 1.1, boxShadow: "0 3px 8px rgba(249, 115, 22, 0.4)" },
                    tap: { scale: 0.92 }
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-white/20 -translate-x-full"
                    variants={{
                      hover: { x: "100%", transition: { duration: 0.6, ease: "easeInOut" } }
                    }}
                  />
                  <motion.div
                    variants={{
                      rest: { rotate: 0, scale: 1 },
                      hover: { rotate: 15, scale: 1.12 }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 12 }}
                  >
                    <Search className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.button>
          </form>

          {/* Mobile Live Search Suggestions Popup */}
          {searchQuery.trim().length >= 1 && !hideSuggestions && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 max-h-80 overflow-y-auto">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 px-1 pb-1 border-b border-gray-50 flex justify-between items-center">
                <span>খোঁজা হচ্ছে: "{searchQuery}"</span>
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-slate-800 font-extrabold text-xs cursor-pointer"
                >
                  ×
                </button>
              </div>
              {products.filter(p => 
                isProductVisibleToCustomer(p) && (
                  matchesSearchWithNumerals(p.name, searchQuery.trim()) ||
                  matchesSearchWithNumerals(p.category, searchQuery.trim()) ||
                  matchesSearchWithNumerals(p.description, searchQuery.trim())
                )
              ).slice(0, 5).length === 0 ? (
                <div className="text-center py-3 text-xs text-gray-400 font-medium">
                  কোনো প্রোডাক্ট মেলেনি! 🔍
                </div>
              ) : (
                <div className="space-y-1">
                  {products.filter(p => 
                    isProductVisibleToCustomer(p) && (
                      matchesSearchWithNumerals(p.name, searchQuery.trim()) ||
                      matchesSearchWithNumerals(p.category, searchQuery.trim()) ||
                      matchesSearchWithNumerals(p.description, searchQuery.trim())
                    )
                  ).slice(0, 5).map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setViewingDetailsProduct(p);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-50 rounded-lg p-0.5 shrink-0 flex items-center justify-center border border-gray-100">
                        <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-extrabold text-slate-900 truncate py-0.5 leading-normal">
                          {p.name}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-bold">
                          {p.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-black text-orange-600 block">
                          {p.price}৳
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Category List Links with interactive dropdown on hover */}
        <div className="bg-gray-50 border-t border-gray-100 overflow-x-auto md:overflow-visible">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-5 md:gap-0 md:justify-between py-2.5 text-xs font-bold text-gray-600 whitespace-nowrap relative md:overflow-visible">
            <button
              onClick={() => { setActivePage('home'); setCurrentCategory('all'); setShowAllProducts(true); setShowOnlyProduced(false); setSearchQuery(''); setViewingDetailsProduct(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`pb-1 px-1 transition-all cursor-pointer ${
                activePage === 'home' && currentCategory === 'all' && showAllProducts && !showOnlyProduced
                  ? 'text-orange-600 border-b-2 border-orange-500 font-extrabold' 
                  : 'hover:text-orange-500 text-gray-700'
              }`}
            >
              সবগুলো পণ্য
            </button>
            {categories.filter(cat => cat.showInNavbar !== false).slice(0, 11).map((cat) => {
              const catProducts = products.filter(p => p.category === cat.name && isProductVisibleToCustomer(p));
              return (
                <div 
                  key={cat.id} 
                  className="relative group md:py-1"
                  onMouseEnter={() => setHoveredCategory(cat.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <button
                    onClick={() => { setActivePage('home'); setCurrentCategory(cat.name); setShowAllProducts(false); setShowOnlyProduced(false); setSearchQuery(''); setViewingDetailsProduct(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`pb-1 px-1 transition-all cursor-pointer flex items-center gap-1 ${
                      activePage === 'home' && currentCategory === cat.name && !showOnlyProduced
                        ? 'text-orange-600 border-b-2 border-orange-500 font-extrabold' 
                        : 'hover:text-orange-500 text-gray-700'
                    }`}
                  >
                    <span>{siteConfig.categoryNames?.[cat.slug] || cat.name}</span>
                    <span className="text-[10px] text-gray-400 font-normal">⌵</span>
                  </button>

                  {/* Dropdown Menu - only show on desktop hover */}
                  <AnimatePresence>
                    {hoveredCategory === cat.name && catProducts.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 w-80 whitespace-normal text-left"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                            {siteConfig.categoryNames?.[cat.slug] || cat.name}
                          </span>
                          <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded-full">
                            সরাসরি দেখুন
                          </span>
                        </div>
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {catProducts.map((p) => (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setViewingDetailsProduct(p);
                                setHoveredCategory(null);
                              }}
                              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-orange-50/50 cursor-pointer transition-colors border border-transparent hover:border-orange-100 group/item"
                            >
                              <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 shrink-0 flex items-center justify-center border border-gray-100">
                                <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-extrabold text-slate-900 group-hover/item:text-orange-600 transition-colors truncate">
                                  {p.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black text-orange-500">
                                    {p.price}৳
                                  </span>
                                  {p.originalPrice && (
                                    <span className="text-[10px] text-red-500 line-through font-medium">
                                      {p.originalPrice}৳
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                                    {p.unit}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-gray-50 flex justify-center">
                          <button
                            onClick={() => {
                              setCurrentCategory(cat.name);
                              setShowAllProducts(false);
                              setShowOnlyProduced(false);
                              setSearchQuery('');
                              setViewingDetailsProduct(null);
                              setHoveredCategory(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-[11px] font-black text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>সবগুলো {siteConfig.categoryNames?.[cat.slug] || cat.name} দেখুন</span>
                            <span>→</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Announcement Ticker Banner */}
      <section className="bg-emerald-800 text-emerald-50 text-xs py-2.5 shadow-inner font-sans relative overflow-hidden flex items-center h-10 select-none">
        {/* Static Prefix Title */}
        <div className="absolute left-0 top-0 bottom-0 bg-emerald-900 px-4 flex items-center z-20 shadow-[4px_0_8px_rgba(0,0,0,0.15)]">
          <span className="bg-emerald-950 px-2 py-0.5 rounded text-[10px] md:text-xs font-black tracking-wide text-amber-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
            ট্রাস্ট ফ্যাক্টর
          </span>
        </div>

        {/* Scrolling content */}
        <div className="w-full overflow-hidden flex items-center relative pl-32 md:pl-40">
          <div className="flex gap-12 md:gap-20 animate-marquee py-0.5 whitespace-nowrap">
            {/* Repeated three times to ensure infinite smooth seamless looping */}
            {Array.from({ length: 3 }).map((_, i) => (
              <React.Fragment key={i}>
                {(siteConfig.tickerItems && siteConfig.tickerItems.length > 0 ? siteConfig.tickerItems : [
                  '🚚 অগ্রীম ছাড়াই অর্ডার করতে পারবেন',
                  '🛡️ ডেলিভারির সময় প্রোডাক্ট দেখে নিতে পারবেন',
                  '🍯 সিজন ফ্রেশ সুন্দরবনের খাঁটি মধু চলে এসেছে',
                  '📦 সারাদেশে ৩ দিনে দ্রুত হোম ডেলিভারি সুবিধা',
                  '💯 শতভাগ ন্যাচারাল ও কেমিক্যালমুক্ত ফ্রেশ আম',
                  '📞 যেকোনো প্রয়োজনে সরাসরি কল করুন আমাদের হটলাইনে'
                ]).filter(Boolean).map((item, idx) => (
                  <div key={`${i}-${idx}`} className="flex items-center gap-2 text-[11px] md:text-sm font-bold text-emerald-50">
                    <span className="text-amber-400">✦</span>
                    <span>{item}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {activePage === 'about' ? (
          <div className="w-full space-y-8 py-4">
            {/* Title block */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
                {siteConfig.aboutTitle || 'আমাদের সম্পর্কে?'}
              </h1>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium">
                {siteConfig.aboutSubtitle}
              </p>
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left image of owner */}
                <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-md border border-gray-100">
                  <img 
                    src={siteConfig.aboutOwnerImage || siteConfig.leftBannerImage} 
                    alt="মুরাদ পারভেজ" 
                    className="w-full h-auto object-cover aspect-[4/3] sm:aspect-square lg:aspect-[4/5] hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Right content of owner */}
                <div className="lg:col-span-7 space-y-5">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    ছবিতে যাকে দেখতে পাচ্ছেন, তিনি হচ্ছেন...
                  </h3>

                  {/* Highlight text */}
                  {siteConfig.aboutHighlightText && (
                    <div className="bg-emerald-50 border border-emerald-100/60 rounded-2xl p-4 md:p-5 text-emerald-900 text-sm md:text-base font-bold leading-relaxed">
                      {siteConfig.aboutHighlightText}
                    </div>
                  )}

                  {/* Paragraph 1 */}
                  {siteConfig.aboutParagraph1 && (
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                      {siteConfig.aboutParagraph1}
                    </p>
                  )}

                  {/* Paragraph 2 */}
                  {siteConfig.aboutParagraph2 && (
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                      {siteConfig.aboutParagraph2}
                    </p>
                  )}

                  {/* Paragraph 3 */}
                  {siteConfig.aboutParagraph3 && (
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                      {siteConfig.aboutParagraph3}
                    </p>
                  )}

                  {/* Facebook Page link */}
                  <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs md:text-sm font-extrabold text-gray-800">
                      সংযুক্ত হোন আমাদের ভেরিফাইড ফেইসবুক পেইজে
                    </span>
                    <a 
                      href={siteConfig.aboutFacebookLink || "https://facebook.com"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-extrabold text-xs px-5 py-2.5 rounded-lg border border-gray-200 transition-colors shadow-xs uppercase tracking-wider"
                    >
                      <Facebook className="w-4 h-4 text-blue-600 fill-blue-600" />
                      facebook
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Back to Home Button */}
            <div className="text-center pt-4">
              <button 
                onClick={() => setActivePage('home')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer hover:scale-102 transition-all"
              >
                হোম পেইজে ফিরে যান
              </button>
            </div>
          </div>
        ) : activePage === 'contact' ? (
          <div className="w-full space-y-8 py-4">
            {/* Title block */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
                যোগাযোগ
              </h1>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
              {/* Left Side: Intro message */}
              <div className="md:col-span-5 bg-emerald-50/50 border border-emerald-100/40 p-6 md:p-8 rounded-3xl flex flex-col justify-center space-y-4">
                <h2 className="text-lg md:text-2xl font-black text-emerald-950 leading-snug">
                  আমরা আপনার প্রশ্নগুলোর উত্তর দেয়ার জন্য প্রস্তুত আছি। উল্লেখিত উপায়ে আমাদের সাথে যোগাযোগ করতে পারবেন।
                </h2>
                <p className="text-xs md:text-sm text-emerald-800 font-bold leading-relaxed">
                  দ্রুত উত্তর পেতে অফিস আওয়ার সকাল ১০টা থেকে সন্ধ্যা ৭টা পর্যন্ত যোগাযোগ করার অনুরোধ রইলো।
                </p>
              </div>

              {/* Right Side: Contact Cards */}
              <div className="md:col-span-7 bg-[#fffcf8] border border-amber-100/50 p-6 md:p-8 rounded-3xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Office Info */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                      অফিস
                    </h4>
                    <p className="text-xs md:text-sm text-gray-700 font-bold leading-snug">
                      {siteConfig.contactOffice || 'Nowhata, Paba, Rajshahi, Bangladesh, 6213'}
                    </p>
                  </div>

                  {/* Call Center Info */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                      কল সেন্টার
                    </h4>
                    <a 
                      href={`tel:${siteConfig.contactPhone || '+8801301636461'}`}
                      className="text-xs md:text-sm text-gray-700 font-bold hover:text-orange-500 transition-colors"
                    >
                      {siteConfig.contactPhone || '+880 1301-636461'}
                    </a>
                  </div>

                  {/* Email Info */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                      ইমেইল
                    </h4>
                    <a 
                      href={`mailto:${siteConfig.contactEmail || 'info@mangolover.com.bd'}`}
                      className="text-xs md:text-sm text-gray-700 font-bold hover:text-orange-500 transition-colors break-all"
                    >
                      {siteConfig.contactEmail || 'info AT mangolover.com.bd'}
                    </a>
                  </div>

                  {/* Social Media Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                      সোশ্যাল মিডিয়া
                    </h4>
                    <div className="flex items-center gap-3">
                      <a 
                        href="https://facebook.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Facebook className="w-4 h-4 fill-white text-orange-500" />
                      </a>
                      <a 
                        href="https://instagram.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Instagram className="w-4 h-4 text-white" />
                      </a>
                      <a 
                        href="https://youtube.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Youtube className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* OpenStreetMap / Google Maps Location Map */}
                <div className="pt-4 border-t border-amber-100/30">
                  <div className="relative rounded-2xl overflow-hidden border border-amber-100 shadow-xs h-64 bg-slate-50 flex flex-col justify-center items-center p-4">
                    {(() => {
                      const mapData = getEmbedMapUrl(siteConfig.googleMapUrl || "");
                      if (mapData.embedUrl) {
                        return (
                          <>
                            <iframe 
                              title="Mango Lover Location Map"
                              src={mapData.embedUrl} 
                              className="absolute inset-0 w-full h-full border-0"
                              allowFullScreen
                            />
                            <div className="absolute bottom-2 right-2 bg-white/95 px-3 py-1 rounded-lg text-[10px] font-extrabold text-emerald-900 border border-emerald-100 shadow-sm pointer-events-none uppercase tracking-wide">
                              {siteConfig.storeName || "Mango Lover"}
                            </div>
                          </>
                        );
                      } else if (mapData.directUrl) {
                        return (
                          <div className="text-center space-y-3 z-10 max-w-sm px-4">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                              <MapPin className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-slate-800 text-xs">আমাদের গুগল ম্যাপস ঠিকানা</h5>
                              <p className="text-[10px] text-gray-500 font-bold mt-0.5 leading-relaxed">
                                ম্যাপটি সরাসরি ব্রাউজারে দেখতে বা নেভিগেট করতে নিচের বাটনে ক্লিক করুন।
                              </p>
                            </div>
                            <a 
                              href={mapData.directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              <Map className="w-3.5 h-3.5" />
                              গুগল ম্যাপে দেখুন
                            </a>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center text-gray-400 text-xs font-bold">
                            কোনো ম্যাপ লিংক যুক্ত করা হয়নি
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Home Button */}
            <div className="text-center pt-4">
              <button 
                onClick={() => setActivePage('home')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer hover:scale-102 transition-all"
              >
                হোম পেইজে ফিরে যান
              </button>
            </div>
          </div>
        ) : activePage === 'privacy' ? (
          <div className="w-full space-y-8 py-2 max-w-4xl mx-auto">
            {/* Elegant Header Banner */}
            <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-3xl p-8 md:p-12 text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
                Privacy Policy
              </h1>
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-emerald-800">
                <button onClick={() => setActivePage('home')} className="hover:text-orange-500 cursor-pointer">Home</button>
                <span className="text-gray-400">/</span>
                <span className="text-emerald-900">Privacy Policy</span>
              </div>
            </div>

            {/* Page Content */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-xs space-y-6">
              <div className="text-xs md:text-sm text-gray-700 leading-relaxed font-semibold whitespace-pre-line space-y-4">
                {siteConfig.privacyPolicyText}
              </div>
            </div>

            {/* Back to Home Button */}
            <div className="text-center pt-4">
              <button 
                onClick={() => setActivePage('home')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer hover:scale-102 transition-all"
              >
                হোম পেইজে ফিরে যান
              </button>
            </div>
          </div>
        ) : activePage === 'refund' ? (
          <div className="w-full space-y-8 py-2 max-w-4xl mx-auto">
            {/* Elegant Header Banner */}
            <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-3xl p-8 md:p-12 text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
                Refund And Returns Policy
              </h1>
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-emerald-800">
                <button onClick={() => setActivePage('home')} className="hover:text-orange-500 cursor-pointer">Home</button>
                <span className="text-gray-400">/</span>
                <span className="text-emerald-900">Refund and Returns Policy</span>
              </div>
            </div>

            {/* Page Content */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-xs space-y-6">
              <div className="text-xs md:text-sm text-gray-700 leading-relaxed font-semibold whitespace-pre-line space-y-4">
                {siteConfig.refundPolicyText}
              </div>
            </div>

            {/* Back to Home Button */}
            <div className="text-center pt-4">
              <button 
                onClick={() => setActivePage('home')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer hover:scale-102 transition-all"
              >
                হোম পেইজে ফিরে যান
              </button>
            </div>
          </div>
        ) : activePage === 'faq' ? (
          <div className="w-full space-y-8 py-2 max-w-4xl mx-auto">
            {/* Elegant Header Banner */}
            <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-3xl p-8 md:p-12 text-center space-y-3 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
                সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)
              </h1>
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-emerald-800">
                <button onClick={() => setActivePage('home')} className="hover:text-orange-500 cursor-pointer">Home</button>
                <span className="text-gray-400">/</span>
                <span className="text-emerald-900">FAQ</span>
              </div>
            </div>

            <FaqSection siteConfig={siteConfig} />

            {/* Back to Home Button */}
            <div className="text-center pt-4">
              <button 
                onClick={() => setActivePage('home')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer hover:scale-102 transition-all"
              >
                হোম পেইজে ফিরে যান
              </button>
            </div>
          </div>
        ) : viewingDetailsProduct ? (
          <ProductDetails
            product={viewingDetailsProduct}
            onBack={() => setViewingDetailsProduct(null)}
            onAddToCart={(p, qty, size) => {
              handleAddToCart(p, qty, size);
              setIsCartOpen(true);
            }}
            onDirectBuy={(p, qty, size) => {
              const targetProduct = { ...p };
              if (size) {
                targetProduct.unit = size;
                if (p.sizePrices?.[size]) {
                  targetProduct.price = p.sizePrices[size].price;
                  targetProduct.originalPrice = p.sizePrices[size].originalPrice;
                }
              }
              setDirectBuyItem({ product: targetProduct, quantity: qty });
              setIsCheckoutOpen(true);
            }}
            allProducts={products.filter(p => isProductVisibleToCustomer(p))}
            onSelectProduct={(p) => setViewingDetailsProduct(p)}
            onRequestProduct={handleOpenRequestModal}
            onViewImage={setZoomImage}
            sellerName={viewingDetailsProduct.sellerId ? (users.find(u => u.id === viewingDetailsProduct.sellerId)?.shopName || users.find(u => u.id === viewingDetailsProduct.sellerId)?.name) : undefined}
          />
        ) : (
          <>
        {/* 3. Double Split Hero Banner Grid */}
        {!isShopActive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Hero Banner - Gardener/Farmer (Larger) */}
            <div className="relative rounded-3xl overflow-hidden aspect-[16:9] md:aspect-auto md:h-[320px] lg:h-[420px] xl:h-[480px] md:col-span-2 shadow-md group border border-gray-100">
              <img 
                src={siteConfig.leftBannerImage || "/src/assets/images/mango_farmer_orchard_1782453455911.jpg"} 
                alt="Left Hero Banner" 
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              {/* Soft gradient bottom vignette */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
              
              {/* Header branding overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 flex flex-col justify-end text-white text-center">
                <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight mb-2 md:mb-3 font-sans">
                  {siteConfig.leftBannerTitle}
                </h2>
                <p className="text-xs text-gray-200 max-w-md mx-auto mb-4 font-medium leading-relaxed hidden sm:block">
                  {siteConfig.leftBannerSubtitle}
                </p>
                <div>
                  <button 
                    onClick={() => {
                      setCurrentCategory(siteConfig.leftBannerCategory || 'ফ্রেশ আম');
                      setShowAllProducts(false);
                      setShowOnlyProduced(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-xs md:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
                  >
                    {siteConfig.leftBannerBtnText}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Hero Banner - Honey jar on stump (Smaller) */}
            <div className="relative rounded-3xl overflow-hidden aspect-[16:9] md:aspect-auto md:h-[320px] lg:h-[420px] xl:h-[480px] md:col-span-1 shadow-md group border border-gray-100">
              <img 
                src={siteConfig.rightBannerImage || "/src/assets/images/sundarban_honey_jar_1782453470122.jpg"} 
                alt="Right Hero Banner" 
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />
              
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 flex flex-col justify-end text-white text-center">
                <span className="text-[10px] md:text-xs text-amber-400 font-extrabold uppercase tracking-widest mb-1 font-sans">
                  {siteConfig.rightBannerTagline}
                </span>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight leading-tight mb-2 md:mb-3 font-sans">
                  {siteConfig.rightBannerTitle}
                </h2>
                <p className="text-xs text-gray-200 max-w-xs mx-auto mb-4 font-medium leading-relaxed hidden lg:block">
                  {siteConfig.rightBannerSubtitle}
                </p>
                <div>
                  <button 
                    onClick={() => {
                      setCurrentCategory(siteConfig.rightBannerCategory || 'মধু');
                      setShowAllProducts(false);
                      setShowOnlyProduced(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-xs md:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
                  >
                    {siteConfig.rightBannerBtnText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Horizontal Category Round Grid */}
        {!isShopActive && (
          <section className="space-y-4">
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg border-l-4 border-orange-500 pl-2.5">
              ক্যাটাগরি সমূহ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const icon = CATEGORY_ICONS[cat.slug] || <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-slate-950 stroke-[1.75]" />;
                const isActive = currentCategory === cat.name;
                return (
                  <div
                    key={cat.id}
                    onClick={() => { setCurrentCategory(isActive ? 'all' : cat.name); setShowAllProducts(false); setShowOnlyProduced(false); setSearchQuery(''); setViewingDetailsProduct(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none group ${
                      isActive
                        ? 'border-[#ff9800] bg-orange-50/20 ring-2 ring-orange-100/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-[#ff9800]/50 hover:shadow-xs hover:scale-[1.01]'
                    }`}
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 bg-[#ff9800] rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                      {siteConfig.categoryImages?.[cat.slug] ? (
                        <img 
                          src={siteConfig.categoryImages[cat.slug]} 
                          alt={siteConfig.categoryNames?.[cat.slug] || cat.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        icon
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                        {siteConfig.categoryNames?.[cat.slug] || cat.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Main Product Listing Section */}
        {isShopActive ? (
          <section id="product-section" className="space-y-6 pt-2">
            <div className="space-y-6">
              {/* Premium Category Banner Block */}
              <div className="bg-[#f0f4f2] border border-emerald-500/5 rounded-3xl py-8 md:py-12 px-4 text-center relative overflow-hidden shadow-xs">
                {/* Decorative subtle background elements */}
                <div className="absolute -left-12 -top-12 w-48 h-48 bg-emerald-200/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-orange-200/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 max-w-xl mx-auto">
                  {/* Breadcrumbs */}
                  <div className="text-gray-400 text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 mb-2.5">
                    <span className="hover:text-orange-500 transition-colors cursor-pointer" onClick={() => { setCurrentCategory('all'); setShowAllProducts(false); setShowOnlyProduced(false); setSearchQuery(''); }}>Home</span>
                    <span className="text-gray-300">/</span>
                    <span className="hover:text-orange-500 transition-colors cursor-pointer" onClick={() => { setCurrentCategory('all'); setShowAllProducts(true); setShowOnlyProduced(false); setSearchQuery(''); }}>Shop</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-emerald-700 font-extrabold">
                      {showOnlyProduced ? 'আমাদের উৎপাদিত' : (showAllProducts && currentCategory === 'all' ? 'সবগুলো পণ্য' : currentCategory)}
                    </span>
                  </div>
                  
                  {/* Big Beautiful Title */}
                  <h2 className="font-black text-[#006437] text-3xl md:text-5xl tracking-tight mt-1 mb-2">
                    {showOnlyProduced ? 'আমাদের উৎপাদিত' : (showAllProducts && currentCategory === 'all' ? 'সবগুলো পণ্য' : currentCategory)}
                  </h2>
                </div>
              </div>

              {/* Toolbar Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-y border-gray-100 py-3.5 gap-4 px-1">
                {/* Left: Filters label with icon */}
                <div className="flex items-center gap-2 text-slate-800 text-xs md:text-sm font-black uppercase tracking-wider">
                  <span className="p-1.5 bg-gray-100 rounded-lg text-slate-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                  </span>
                  <span>Filters</span>
                </div>

                {/* Right: Show choices, grid icons, and sorting select dropdown */}
                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 flex-wrap">


                  {/* Grid/Layout Choice Icons */}
                  <div className="hidden xs:flex items-center gap-1.5 text-gray-300">
                    <button className="p-1 hover:text-slate-800 transition-colors cursor-pointer" title="List View">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button className="p-1 text-slate-800 transition-colors cursor-pointer" title="Grid 4x4">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                    </button>
                  </div>

                  {/* Interactive Styled sorting dropdown select */}
                  <div className="relative min-w-[150px]">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 focus:outline-none focus:border-orange-500 appearance-none pr-8 cursor-pointer shadow-3xs"
                    >
                      <option value="default">Default sorting</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Sort by Rating</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty search/filter state */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
                  <p className="text-gray-700 text-sm md:text-base font-bold">বর্তমানে আমাদের কাছে এ ধরনের কোন প্রোডাক্ট নেই।</p>
                  <div>
                    <button
                      onClick={() => { 
                        setCurrentCategory('all'); 
                        setShowAllProducts(false); 
                        setShowOnlyProduced(false); 
                        setSearchQuery(''); 
                        setSortBy('default');
                        setViewingDetailsProduct(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-extrabold px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-102"
                    >
                      আমাদের অন্যান্য প্রোডাক্ট নিতে বা দেখতে ক্লিক করুন
                    </button>
                  </div>
                </div>
              ) : (
                /* Premium 4-Column Grid layout on desktop, 3 columns on tablet, 2 columns on mobile */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {paginatedDisplayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={(p) => handleAddToCart(p)}
                        onSelect={handleSelectProduct}
                        onDirectBuy={handleDirectBuy}
                        onQuickView={handleQuickView}
                        onRequestProduct={handleOpenRequestModal}
                        onViewImage={setZoomImage}
                        sellerName={product.sellerId ? (users.find(u => u.id === product.sellerId)?.shopName || users.find(u => u.id === product.sellerId)?.name) : undefined}
                      />
                    ))}
                  </div>

                  {/* Pagination Bar */}
                  {totalShopPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 text-xs font-bold text-gray-500 mt-8">
                      <div>
                        <span>মোট পণ্য: <strong className="text-gray-800">{toBengaliNumber(totalShopItems)}</strong> টি | পৃষ্ঠা: <strong className="text-gray-800">{toBengaliNumber(shopCurrentPageSafe)}/{toBengaliNumber(totalShopPages)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Previous Button */}
                        <button
                          type="button"
                          disabled={shopCurrentPageSafe === 1}
                          onClick={() => {
                            setShopCurrentPage(shopCurrentPageSafe - 1);
                            document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            shopCurrentPageSafe === 1
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : 'bg-white hover:bg-orange-50 text-gray-700 border-gray-200 cursor-pointer hover:border-gray-300'
                          }`}
                        >
                          পূর্ববর্তী
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalShopPages }, (_, i) => i + 1).map((page) => {
                          const isCurrent = page === shopCurrentPageSafe;
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => {
                                setShopCurrentPage(page);
                                document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                                isCurrent
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                                  : 'bg-white hover:bg-orange-50 text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {toBengaliNumber(page)}
                            </button>
                          );
                        })}

                        {/* Next Button */}
                        <button
                          type="button"
                          disabled={shopCurrentPageSafe === totalShopPages}
                          onClick={() => {
                            setShopCurrentPage(shopCurrentPageSafe + 1);
                            document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            shopCurrentPageSafe === totalShopPages
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : 'bg-white hover:bg-orange-50 text-gray-700 border-gray-200 cursor-pointer hover:border-gray-300'
                          }`}
                        >
                          পরবর্তী
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        ) : (
          <div id="product-section" className="space-y-12 pt-2">
            {/* Dynamic Home Page Sections Loop */}
            {sectionsList.map((sec, index) => {
              const layoutPattern = index % 4; // 0, 1, 2, 3
              const isSubsequent = index >= 3;
              
              // Filter products for this section
              let secProducts: Product[] = [];
              if (sec.isSpecialProduced) {
                secProducts = products
                  .filter((p) => p.category !== 'মধু' && p.category !== 'ফ্রেশ আম' && isProductVisibleToCustomer(p))
                  .slice(0, 6);
              } else {
                secProducts = products
                  .filter((p) => p.category === sec.categoryName && isProductVisibleToCustomer(p));
              }

              // If there are no products in this section, we skip rendering it
              if (secProducts.length === 0) return null;

              // For banner layouts (layoutPattern === 1 or 3), slice products to 4, otherwise to 6
              const displayLimit = (layoutPattern === 1 || layoutPattern === 3) ? 4 : 6;
              const productsToRender = secProducts.slice(0, displayLimit);

              // Let's implement the 4 layout designs:
              if (layoutPattern === 0) {
                // 1st design: plain products only (index 0, 4, 8, etc.)
                return (
                  <section key={sec.id} className="space-y-6">
                    <div className="flex items-end justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400 text-xs md:text-[13px] font-semibold tracking-wider uppercase">
                          {sec.subtitle}
                        </span>
                        <h2 className="font-extrabold text-slate-900 text-xl md:text-3.5xl tracking-tight">
                          {sec.title}
                        </h2>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (sec.isSpecialProduced) {
                            setShowOnlyProduced(true);
                            setShowAllProducts(false);
                          } else {
                            setCurrentCategory(sec.categoryName);
                            setShowAllProducts(false);
                            setShowOnlyProduced(false);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="font-bold text-xs md:text-sm px-5 py-2.5 rounded-lg transition-all cursor-pointer bg-orange-50/50 hover:bg-orange-50 text-orange-600 border border-orange-100"
                      >
                        {sec.btnText}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                      {productsToRender.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={(p) => handleAddToCart(p)}
                          onSelect={handleSelectProduct}
                          onDirectBuy={handleDirectBuy}
                          onQuickView={handleQuickView}
                          onRequestProduct={handleOpenRequestModal}
                          onViewImage={setZoomImage}
                          isCompact={isSubsequent}
                          sellerName={product.sellerId ? (users.find(u => u.id === product.sellerId)?.shopName || users.find(u => u.id === product.sellerId)?.name) : undefined}
                        />
                      ))}
                    </div>
                  </section>
                );
              } else if (layoutPattern === 1) {
                // 2nd design: banner on the left (index 1, 5, 9, etc.)
                const borderClass = sec.themeColor === 'emerald' ? 'border-emerald-500' : 'border-[#ff9800]';
                const bgBtnClass = sec.themeColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#ff9800] hover:bg-[#e08600]';
                return (
                  <section key={sec.id} className={`border-2 ${borderClass} rounded-3xl p-4 sm:p-6 bg-white shadow-xs relative overflow-hidden`}>
                    <div className="flex flex-col md:flex-row gap-6 items-stretch">
                      {/* Left Big Banner */}
                      <div className="w-full md:w-[28%] lg:w-[25%] shrink-0 relative rounded-2xl overflow-hidden border border-orange-100/30 h-64 sm:h-80 md:h-auto min-h-[300px]">
                        <img 
                          src={sec.bannerImage} 
                          alt={sec.title} 
                          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500 rounded-2xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Right content containing header & 4 cards */}
                      <div className="flex-grow flex flex-col justify-between">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs md:text-[13px] font-semibold tracking-wider uppercase">
                              {sec.subtitle}
                            </span>
                            <h2 className="font-extrabold text-slate-900 text-xl md:text-3.5xl tracking-tight mt-0.5 leading-normal">
                              {sec.title}
                            </h2>
                          </div>
                          
                          <button
                            onClick={() => {
                              setCurrentCategory(sec.categoryName);
                              setShowAllProducts(false);
                              setShowOnlyProduced(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`${bgBtnClass} active:scale-98 text-white font-extrabold text-xs md:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0`}
                          >
                            {sec.btnText}
                          </button>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                          {productsToRender.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={(p) => handleAddToCart(p)}
                              onSelect={handleSelectProduct}
                              onDirectBuy={handleDirectBuy}
                              onQuickView={handleQuickView}
                              onRequestProduct={handleOpenRequestModal}
                              onViewImage={setZoomImage}
                              isCompact={isSubsequent}
                              sellerName={product.sellerId ? (users.find(u => u.id === product.sellerId)?.shopName || users.find(u => u.id === product.sellerId)?.name) : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              } else if (layoutPattern === 2) {
                // 3rd design: plain products only (index 2, 6, 10, etc.)
                const bgClass = sec.themeColor === 'emerald' ? 'bg-emerald-50/10' : 'bg-slate-50/50';
                const borderClass = sec.themeColor === 'emerald' ? 'border-emerald-500/10' : 'border-orange-500/10';
                const btnClass = sec.themeColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#ff9800] hover:bg-[#e08600]';
                return (
                  <section key={sec.id} className={`border ${borderClass} rounded-3xl p-4 sm:p-6 ${bgClass} shadow-xs relative overflow-hidden`}>
                    {/* Decorative background circle */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs md:text-[13px] font-semibold tracking-wider uppercase">
                          {sec.subtitle}
                        </span>
                        <h2 className="font-extrabold text-slate-900 text-xl md:text-3.5xl tracking-tight mt-0.5">
                          {sec.title}
                        </h2>
                      </div>
                      
                      <button
                        onClick={() => {
                          setCurrentCategory(sec.categoryName);
                          setShowAllProducts(false);
                          setShowOnlyProduced(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`${btnClass} active:scale-98 text-white font-extrabold text-xs md:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5`}
                      >
                        <span>{sec.btnText}</span>
                        <span>→</span>
                      </button>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 relative z-10">
                      {productsToRender.map((product) => (
                        <div key={product.id} className="col-span-1">
                          <ProductCard
                            product={product}
                            onAddToCart={(p) => handleAddToCart(p)}
                            onSelect={handleSelectProduct}
                            onDirectBuy={handleDirectBuy}
                            onQuickView={handleQuickView}
                            onRequestProduct={handleOpenRequestModal}
                            onViewImage={setZoomImage}
                            isCompact={isSubsequent}
                            sellerName={product.sellerId ? (users.find(u => u.id === product.sellerId)?.shopName || users.find(u => u.id === product.sellerId)?.name) : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              } else {
                // 4th design: banner on the right (index 3, 7, 11, etc.)
                const borderClass = sec.themeColor === 'emerald' ? 'border-emerald-500' : 'border-[#ff9800]';
                const bgBtnClass = sec.themeColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#ff9800] hover:bg-[#e08600]';
                return (
                  <section key={sec.id} className={`border-2 ${borderClass} rounded-3xl p-4 sm:p-6 bg-white shadow-xs relative overflow-hidden`}>
                    <div className="flex flex-col md:flex-row gap-6 items-stretch">
                      {/* Left content containing header & 4 cards */}
                      <div className="flex-grow flex flex-col justify-between order-2 md:order-1">
                        {/* Header row with button on the left and title on the right */}
                        <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
                          <button
                            onClick={() => {
                              setCurrentCategory(sec.categoryName);
                              setShowAllProducts(false);
                              setShowOnlyProduced(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`${bgBtnClass} active:scale-98 text-white font-extrabold text-xs md:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0`}
                          >
                            {sec.btnText}
                          </button>

                          <div className="flex flex-col text-right">
                            <span className="text-gray-400 text-xs md:text-[13px] font-semibold tracking-wider uppercase">
                              {sec.subtitle}
                            </span>
                            <h2 className="font-extrabold text-slate-900 text-xl md:text-3.5xl tracking-tight mt-0.5 leading-normal">
                              {sec.title}
                            </h2>
                          </div>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                          {productsToRender.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={(p) => handleAddToCart(p)}
                              onSelect={handleSelectProduct}
                              onDirectBuy={handleDirectBuy}
                              onQuickView={handleQuickView}
                              onRequestProduct={handleOpenRequestModal}
                              onViewImage={setZoomImage}
                              isCompact={isSubsequent}
                              sellerName={product.sellerId ? (users.find(u => u.id === product.sellerId)?.shopName || users.find(u => u.id === product.sellerId)?.name) : undefined}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Right Big Banner */}
                      <div className="w-full md:w-[28%] lg:w-[25%] shrink-0 relative rounded-2xl overflow-hidden border border-orange-100/30 h-64 sm:h-80 md:h-auto min-h-[300px] order-1 md:order-2 group">
                        <img 
                          src={sec.bannerImage} 
                          alt={sec.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </section>
                );
              }
            })}
          </div>
        )}
          </>
        )}
      </main>

      {/* 6. Footer Information section */}
      <footer className="w-full mt-12 shrink-0 font-sans">
        {/* Top Highlight/Contact Banner in Green */}
        <div className="bg-[#006437] text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-[#00522c]">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Left Block: Heading & Subtitle */}
            <div className="flex flex-col gap-2 w-full lg:w-auto flex-grow max-w-3xl">
              <h3 className="font-extrabold text-lg md:text-2xl text-white tracking-tight">
                বিশুদ্ধতায় ভরা আমাদের প্রতিটি প্রোডাক্ট
              </h3>
              <p className="text-xs md:text-sm text-emerald-100 font-extrabold opacity-95">
                যেকোনো পণ্য সম্পর্কে তথ্য বা সহায়তার জন্য স্ক্রিনের নিচে থাকা হেল্পলাইন আইকনে ক্লিক করুন।
              </p>
            </div>

            {/* Right Block: Order note & 3 Features */}
            <div className="w-full lg:w-auto space-y-4">
              <h4 className="text-xs md:text-sm font-extrabold text-white text-center lg:text-left opacity-95">
                নিদ্বিধায় অর্ডার করুন, পণ্য বুঝে নিয়ে মূল্য পরিশোধ করুন
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 justify-center items-center">
                {/* Feature 1 */}
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Truck className="w-6 h-6 text-emerald-100 stroke-[1.5]" />
                  </div>
                  <div className="text-xs font-bold text-white leading-tight text-left">
                    সারাদেশে দ্রুত <br />ডেলিভারি
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-emerald-100 stroke-[1.5]" />
                  </div>
                  <div className="text-xs font-bold text-white leading-tight text-left">
                    সব থেকে সাশ্রয়ী <br />প্রাইসিং
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Headphones className="w-6 h-6 text-emerald-100 stroke-[1.5]" />
                  </div>
                  <div className="text-xs font-bold text-white leading-tight text-left">
                    রয়েছে সার্বক্ষণিক <br />সাপোর্ট
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Detailed Footer in Dark Emerald / Black */}
        <div className="bg-[#011a0f] text-gray-300 text-xs md:text-sm pt-12 pb-5 px-4 sm:px-6 lg:px-8 border-t border-emerald-950/20">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 md:gap-6 lg:gap-8 pb-4">
            
            {/* Column 1: Store Bio */}
            <div className="space-y-4 md:pr-4 flex flex-col items-start">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                  {/* Spinning decorative outline ring (clockwise) */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-dashed border-orange-500 opacity-80"
                  />
                  {/* Store Logo Circle Container */}
                  <img 
                    src={siteConfig.storeLogo} 
                    alt="Logo" 
                    className="w-7 h-7 object-cover rounded-full border border-white shadow-xs z-10" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="flex flex-col">
                  {siteConfig.storeNameImage ? (
                    <img 
                      src={siteConfig.storeNameImage} 
                      alt={siteConfig.storeName} 
                      className="h-6 md:h-8 object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <span className="font-black text-lg md:text-xl text-orange-500 tracking-tight font-sans">
                        {siteConfig.storeName}
                      </span>
                      {siteConfig.storeSloganImage ? (
                        <img 
                          src={siteConfig.storeSloganImage} 
                          alt={siteConfig.storeSlogan} 
                          className="h-3 md:h-4 object-contain mt-0.5 self-start" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[9px] text-gray-400 font-bold tracking-wider uppercase">
                          {siteConfig.storeSlogan}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p className="leading-relaxed text-[11px] font-semibold text-gray-400">
                সাধ্যের মধ্যে সেরা মানের পণ্য আপনার ও আপনার পরিবারের জন্য, যা আমরা পাঠাই একদম মাঠ পর্যায় থেকে, তাই পাচ্ছেন সাশ্রয়ী দামে সেরা মানের পণ্যের নিশ্চয়তা।
              </p>
            </div>

            {/* Column 2: Fresh Mangos */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-white text-xs md:text-sm tracking-wider uppercase border-l-2 border-orange-500 pl-2">
                Fresh Mangos
              </h4>
              <ul className="space-y-2 text-[11px] font-semibold text-gray-400">
                <li>
                  <button 
                    onClick={() => handleFooterFilter('ফ্রেশ আম', 'গোপালভোগ')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    গোপালভোগ আম
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleFooterFilter('ফ্রেশ আম', 'গোবিন্দভোগ')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    গোবিন্দভোগ আম
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleFooterFilter('ফ্রেশ আম', 'হিমসাগর')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    হিমসাগর আম
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleFooterFilter('ফ্রেশ আম', 'হাড়িভাঙা')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    হাড়িভাঙা আম
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Best Categories */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-white text-xs md:text-sm tracking-wider uppercase border-l-2 border-orange-500 pl-2">
                Best Categories
              </h4>
              <ul className="space-y-2 text-[11px] font-semibold text-gray-400">
                <li>
                  <button 
                    onClick={() => handleFooterFilter('মধু')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    অর্গানিক মধু
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleFooterFilter('তেল ও ঘি')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    তেল ও ঘি
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleFooterFilter('গুড় ও চিনি')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    গুড় ও চিনি
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleFooterFilter('হোমমেড')} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    হোমমেড
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Navigation */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-white text-xs md:text-sm tracking-wider uppercase border-l-2 border-orange-500 pl-2">
                Navigation
              </h4>
              <ul className="space-y-2 text-[11px] font-semibold text-gray-400">
                <li>
                  <button 
                    onClick={() => { setActivePage('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    আমাদের সম্পর্কে
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActivePage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    যোগাযোগ
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActivePage('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    প্রাইভেসি পলিসি
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActivePage('refund'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden"
                  >
                    রিটার্ন-রিফান্ড পলিসি
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActivePage('faq'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left focus:outline-hidden text-orange-400 font-bold"
                  >
                    প্রশ্নোউত্তর (FAQ)
                  </button>
                </li>
                {siteConfig.sellerSystemActive !== false && (
                  <li>
                    <button 
                      onClick={() => {
                        if (loggedInUser) {
                          if (loggedInUser.role === 'seller') {
                            setIsSellerDashboardOpen(true);
                          } else {
                            showNotification('আপনি ইতিমধ্যে কাস্টমার হিসেবে লগইন আছেন। নতুন উদ্যোক্তা অ্যাকাউন্ট তৈরি করতে লগআউট করে রেজিস্ট্রেশন করুন!', 'info');
                          }
                        } else {
                          setAuthInitialMode('register');
                          setIsAuthOpen(true);
                        }
                      }} 
                      className="text-orange-400 font-extrabold hover:text-orange-300 hover:underline transition-colors cursor-pointer text-left focus:outline-hidden"
                    >
                      🤝 উদ্যোক্তা হিসেবে যোগ দিন
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 5: Stay Connected */}
            <div id="footer-contact" className="space-y-4">
              <h4 className="font-extrabold text-white text-xs md:text-sm tracking-wider uppercase border-l-2 border-orange-500 pl-2">
                আমাদের সাথেই থাকুন
              </h4>
              <p className="text-[11px] text-gray-400 font-semibold leading-tight">
                সোশ্যাল মিডিয়াতে আমাদের ফলো করুন
              </p>
              
              <div className="flex items-center gap-3.5 pt-1">
                {/* Facebook */}
                <a 
                  href={siteConfig.facebookLink || "https://facebook.com"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 bg-white/5 hover:bg-orange-500 text-gray-300 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 border border-white/5 hover:border-orange-400"
                >
                  <Facebook className="w-4.5 h-4.5" />
                </a>

                {/* Instagram */}
                <a 
                  href={siteConfig.instagramLink || "https://instagram.com"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 bg-white/5 hover:bg-orange-500 text-gray-300 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 border border-white/5 hover:border-orange-400"
                >
                  <Instagram className="w-4.5 h-4.5" />
                </a>

                {/* Youtube */}
                <a 
                  href={siteConfig.youtubeLink || "https://youtube.com"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 bg-white/5 hover:bg-orange-500 text-gray-300 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 border border-white/5 hover:border-orange-400"
                >
                  <Youtube className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Verified Payments Trust Badges */}
          <div className="mt-6 mb-4 px-4 w-full text-center">
            <div className="flex flex-row flex-wrap items-center justify-center gap-x-6 gap-y-3.5 text-center">
              
              {/* Title with Shield Icon */}
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs shrink-0">
                <svg 
                  className="w-4.5 h-4.5 text-emerald-400 shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" 
                  />
                </svg>
                <span className="tracking-wider text-gray-200">
                  যাচাইকৃত নিরাপদ পেমেন্ট চ্যানেল:
                </span>
              </div>

              {/* Logos on the same line */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* bKash */}
                <div className="bg-white hover:bg-[#FFF0F5] border border-stone-200 hover:border-pink-300 px-3 py-1.5 rounded-xl select-none transition-all duration-300 flex items-center justify-center gap-1.5 h-9 hover:shadow-md cursor-pointer group">
                  <img 
                    src="https://abcd-bd.org/assets/img/bkash.png" 
                    alt="bKash" 
                    referrerPolicy="no-referrer"
                    className="h-4.5 w-auto object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = "https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg";
                    }}
                  />
                  <span className="text-[11px] font-black text-[#D12053] tracking-tight">বিকাশ</span>
                </div>

                {/* Nagad */}
                <div className="bg-white hover:bg-[#FFF5EE] border border-stone-200 hover:border-orange-300 px-3 py-1.5 rounded-xl select-none transition-all duration-300 flex items-center justify-center gap-1.5 h-9 hover:shadow-md cursor-pointer group">
                  <img 
                    src="https://abcd-bd.org/assets/img/nagad.png" 
                    alt="Nagad" 
                    referrerPolicy="no-referrer"
                    className="h-4.5 w-auto object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = "https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg";
                    }}
                  />
                  <span className="text-[11px] font-black text-[#F15A22] tracking-tight">নগদ</span>
                </div>

                {/* Rocket */}
                <div className="bg-white hover:bg-[#F8F0FC] border border-stone-200 hover:border-purple-300 px-3 py-1.5 rounded-xl select-none transition-all duration-300 flex items-center justify-center gap-1.5 h-9 hover:shadow-md cursor-pointer group">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/f/f7/Rocket_mobile_banking_logo.svg" 
                    alt="Rocket" 
                    referrerPolicy="no-referrer"
                    className="h-4.5 w-auto object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = "https://abcd-bd.org/assets/img/rocket.png";
                    }}
                  />
                  <span className="text-[11px] font-black text-[#8C3494] tracking-tight">রকেট</span>
                </div>

                {/* Visa Card */}
                <div className="bg-white hover:bg-[#F0F4FC] border border-stone-200 hover:border-blue-300 px-3 py-1.5 rounded-xl select-none transition-all duration-300 flex items-center justify-center gap-1.5 h-9 hover:shadow-md cursor-pointer group">
                  <img 
                    src="https://static.vecteezy.com/system/resources/thumbnails/020/975/570/small/visa-logo-visa-icon-transparent-free-png.png" 
                    alt="Visa" 
                    referrerPolicy="no-referrer"
                    className="h-3.5 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[11px] font-black text-[#1A1F71] tracking-tight">ভিসা</span>
                </div>

                {/* Mastercard */}
                <div className="bg-white hover:bg-[#FCF5F0] border border-stone-200 hover:border-amber-300 px-3 py-1.5 rounded-xl select-none transition-all duration-300 flex items-center justify-center gap-1.5 h-9 hover:shadow-md cursor-pointer group">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
                    alt="Mastercard" 
                    referrerPolicy="no-referrer"
                    className="h-4 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[11px] font-black text-[#F79E1B] tracking-tight">মাস্টারকার্ড</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Rights Bar */}
          <div className="border-t border-emerald-950/40 mt-4 pt-4 flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-400 text-center">
            <div>
              @ 2026 <span className="text-white font-extrabold">MangoLover</span>, All Right Reserved
            </div>
            <span className="text-emerald-800/60 font-normal">|</span>
            <div className="flex items-center justify-center gap-1">
              <span>Developed by</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <a 
                href="https://www.facebook.com/mehedihasan.sakib.1656" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white font-extrabold hover:text-orange-400 hover:underline transition-all cursor-pointer"
                title="MEHEDI HASAN SAKIB Facebook Profile"
              >
                MEHEDI HASAN SAKIB
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* 7. Product Detail Quick View Modal Popup */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const sizes = getProductSizes(selectedProduct.id, selectedProduct);
          const sku = getProductSKU(selectedProduct.id, selectedProduct.name);
          return (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 md:p-6 bg-black/50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="fixed inset-0 bg-black/25 cursor-pointer"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-none shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-2 max-h-[95vh]"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-full cursor-pointer transition-colors shadow-xs z-30 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Left Column: Image Box */}
                {(() => {
                  const activeImages = selectedProduct.images && selectedProduct.images.length > 0 
                    ? selectedProduct.images 
                    : [selectedProduct.image];
                  const currentImg = activeImages[quickViewImageIndex] || selectedProduct.image;
                  return (
                    <div className="group relative bg-[#f7f8f9] flex flex-col items-center justify-center p-0 border-b md:border-b-0 md:border-r border-gray-100 min-h-[250px] md:min-h-[400px] pb-16 overflow-hidden select-none">
                      {/* Image Display */}
                      <div className="w-full h-full flex items-center justify-center min-h-[180px] md:min-h-[280px]">
                        <img
                          src={currentImg}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover mx-auto mix-blend-multiply transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Navigation Arrows */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeImages.length > 1) {
                            setQuickViewImageIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
                          }
                        }}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer text-slate-800 ${
                          activeImages.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        title="Previous Image"
                      >
                        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeImages.length > 1) {
                            setQuickViewImageIndex((prev) => (prev + 1) % activeImages.length);
                          }
                        }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer text-slate-800 ${
                          activeImages.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        title="Next Image"
                      >
                        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                      </button>

                      {/* Dot indicators */}
                      {activeImages.length > 1 && (
                        <div className="absolute bottom-14 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
                          {activeImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickViewImageIndex(idx);
                              }}
                              className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${
                                idx === quickViewImageIndex ? 'bg-[#006437] w-3.5' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* "View Details" Bar that slides up from the bottom and turns caramel colored on hover */}
                      <div 
                        onClick={() => {
                          setViewingDetailsProduct(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        className="absolute bottom-0 left-0 right-0 h-11 bg-[#006437] hover:bg-[#f59e0b] active:bg-[#d97706] text-white font-extrabold text-xs flex items-center justify-center select-none cursor-pointer transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20"
                      >
                        View Details
                      </div>
                    </div>
                  );
                })()}

                {/* Right Column: Information/Actions */}
                <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[90vh] space-y-4">
                  <div className="space-y-3">
                    <h2 className="text-lg md:text-2xl font-extrabold text-slate-900 leading-tight">
                      {selectedProduct.name}
                    </h2>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl md:text-2xl font-black text-orange-600">
                        {(quickViewSize && selectedProduct.sizePrices?.[quickViewSize]) ? selectedProduct.sizePrices[quickViewSize].price : selectedProduct.price}৳
                      </span>
                      {((quickViewSize && selectedProduct.sizePrices?.[quickViewSize]) ? selectedProduct.sizePrices[quickViewSize].originalPrice : selectedProduct.originalPrice) !== undefined && (
                        <span className="text-xs md:text-sm text-red-500 line-through font-medium">
                          {(quickViewSize && selectedProduct.sizePrices?.[quickViewSize]) ? selectedProduct.sizePrices[quickViewSize].originalPrice : selectedProduct.originalPrice}৳
                        </span>
                      )}
                    </div>

                    {/* Size/Ozon Selector */}
                    {sizes.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">ওজন:</span>
                          {quickViewSize && (
                            <button
                              onClick={() => setQuickViewSize('')}
                              className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5 font-bold text-[10px]"
                            >
                              ✕ Clear
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sizes.map((size) => {
                            const isActive = quickViewSize === size;
                            return (
                              <button
                                key={size}
                                onClick={() => setQuickViewSize(size)}
                                className={`px-3 py-1.5 text-xs font-bold border rounded-md transition-all relative ${
                                  isActive
                                    ? 'bg-emerald-50/70 text-emerald-800 border-emerald-500 shadow-sm animate-pulse-weight'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                }`}
                              >
                                <span>{size}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Stock Status */}
                    <div className="flex items-center gap-1.5 text-xs font-bold pt-1.5 text-gray-500">
                      <span>উপলব্ধতা:</span>
                      <span className={`font-black ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                        {selectedProduct.stock > 0 ? `✓ ${selectedProduct.stock} in stock` : 'স্টক নেই'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-3 border-t border-gray-100">
                    {/* Quantity controls & Add to Cart button */}
                    <div className="flex items-center gap-3">
                      {/* Qty Selector */}
                      <div className="flex items-center justify-between border border-gray-200 bg-gray-50 p-2 rounded-md shrink-0 w-28">
                        <button
                          onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                          disabled={detailQuantity <= 1}
                          className="p-1 hover:bg-white text-gray-600 rounded disabled:opacity-30 transition-all cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-xs text-gray-800">{detailQuantity}</span>
                        <button
                          onClick={() => setDetailQuantity(q => Math.min(selectedProduct.stock, q + 1))}
                          disabled={detailQuantity >= selectedProduct.stock}
                          className="p-1 hover:bg-white text-gray-600 rounded disabled:opacity-30 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Add To Cart */}
                      <button
                        onClick={() => {
                          if (sizes.length > 1 && !quickViewSize) {
                            showNotification('অনুগ্রহ করে একটি ওজন/পরিমাণ সিলেক্ট করুন!', 'error');
                            return;
                          }
                          handleAddToCart(selectedProduct, detailQuantity, quickViewSize);
                          setSelectedProduct(null);
                        }}
                        disabled={selectedProduct.stock === 0}
                        className="flex-grow bg-[#006437] hover:bg-[#004d2a] active:bg-[#00381e] text-white font-bold text-xs md:text-sm py-3 px-4 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add To Cart</span>
                      </button>
                    </div>

                    {/* Metadata Footer: SKU, Categories */}
                    <div className="text-[10px] space-y-1 text-gray-400 font-bold border-t border-gray-100 pt-3">
                      <div>SKU: <span className="text-gray-600 font-mono">{sku}</span></div>
                      <div>Categories: <span className="text-[#006437]">{selectedProduct.category}, {selectedProduct.name.split(' ')[0]}, আমাদের উৎপাদিত</span></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 8. Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setDirectBuyItem(null); // use full cart items
          setIsCheckoutOpen(true);
        }}
      />

      {/* 9. Seamless Order Checkout Popup Form */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setDirectBuyItem(null);
        }}
        cartItems={directBuyItem ? [directBuyItem] : cart}
        onPlaceOrder={handlePlaceOrder}
        siteConfig={siteConfig}
        currentUser={loggedInUser}
        orders={orders}
      />

      {/* 9.1. Secure Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          if (window.location.hash === '#admin' && loggedInUser?.role !== 'admin') {
            window.location.hash = '';
          }
        }}
        users={users}
        onRegister={handleRegisterUser}
        onLogin={handleLoginUser}
        onNotify={showNotification}
        initialMode={authInitialMode}
        isAdminRoute={window.location.hash === '#admin'}
        onAdminLoginFail={() => setAdminLoginErrorState('error-only')}
        siteConfig={siteConfig}
      />

      {/* 9.2. Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        orders={orders}
        siteConfig={siteConfig}
      />

      {/* 10. Beautiful Loading Overlay with 2-second timeout */}
      <AnimatePresence>
        {globalLoadingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
          >
            <div className="text-center space-y-6 max-w-md">
              {/* Spinning Ring & Image */}
              <div className="relative flex items-center justify-center mx-auto w-24 h-24">
                {/* Decorative background glow */}
                <div className="absolute inset-0 bg-[#006437]/5 rounded-full blur-xl animate-pulse" />
                
                {/* Rotating Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-[#006437] border-r-[#ff9800]"
                />
                
                {/* Product thumbnail bouncing or fading */}
                <motion.img
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: [0.8, 1, 0.8], opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  src={globalLoadingProduct.image}
                  alt={globalLoadingProduct.name}
                  className="w-14 h-14 object-contain mix-blend-multiply rounded-full relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h3 className="font-black text-slate-800 text-lg md:text-xl flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-[#006437] animate-spin" />
                  <span>পণ্য লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন</span>
                </h3>
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">
                  Loading {globalLoadingProduct.name}...
                </p>
                <div className="w-32 h-1 bg-gray-100 rounded-full mx-auto overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-[#006437] to-[#ff9800]"
                  />
                </div>
              </div>

              {/* Tagline */}
              <p className="text-[11px] text-[#006437] font-semibold tracking-wider">
                ম্যাংগো লাভার — শতভাগ খাঁটি ও নিরাপদ অর্গানিক ফুড
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Product Request Form Modal */}
      <AnimatePresence>
        {requestModalProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRequestModalProduct(null)}
              className="fixed inset-0 bg-black/30 cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-gray-100 flex flex-col font-sans"
            >
              {/* Header */}
              <div className="bg-[#006437] text-white p-5 relative">
                <button
                  onClick={() => setRequestModalProduct(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl p-1.5 shrink-0 flex items-center justify-center border border-[#004d2a]">
                    <img 
                      src={requestModalProduct.image} 
                      alt={requestModalProduct.name} 
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest block">পণ্য রিকুয়েস্ট (স্টক আউট)</span>
                    <h3 className="font-extrabold text-sm md:text-base text-white leading-tight">
                      {requestModalProduct.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handlePlaceProductRequest} className="p-6 space-y-4">
                <p className="text-xs text-gray-500 font-bold leading-normal text-left border-b border-gray-100 pb-3">
                  ⚠️ এই পণ্যটি বর্তমানে স্টকে নেই। আপনার প্রয়োজনীয় চাহিদা আমাদের জানিয়ে রাখুন। পণ্যটি স্টকে আসামাত্র আমরা আপনার সাথে যোগাযোগ করে ডেলিভারি নিশ্চিত করবো। (সবগুলো তথ্য পূরণ করা বাধ্যতামূলক)
                </p>

                {/* Name */}
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-black text-gray-700">আপনার নাম <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={reqCustomerName}
                    onChange={(e) => setReqCustomerName(e.target.value)}
                    placeholder="যেমন: রফিকুল ইসলাম"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006437]/20 focus:border-[#006437] transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-black text-gray-700">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={reqCustomerPhone}
                    onChange={(e) => setReqCustomerPhone(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006437]/20 focus:border-[#006437] transition-all"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-black text-gray-700">প্রয়োজনীয় পরিমাণ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(e.target.value)}
                    placeholder="যেমন: ৫ কেজি, ২ পিস ইত্যাদি"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006437]/20 focus:border-[#006437] transition-all"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-black text-gray-700">ডেলিভারি ঠিকানা <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={2}
                    value={reqCustomerAddress}
                    onChange={(e) => setReqCustomerAddress(e.target.value)}
                    placeholder="যেমন: বাসা নং, রোড নং, এলাকা, থানা, জেলা"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006437]/20 focus:border-[#006437] transition-all resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setRequestModalProduct(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer text-center shadow-md active:scale-98"
                  >
                    রিকুয়েস্ট সাবমিট করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
        </>
      )}
      
      {/* 24/7 AI Live Chat System */}
      {!isAdminMode && !isSellerDashboardOpen && <ChatWidget siteConfig={siteConfig} products={products.filter(p => isProductVisibleToCustomer(p))} />}

      {/* Admin Login Error Flow Overlay */}
      <AnimatePresence>
        {adminLoginErrorState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center border border-gray-100 shadow-2xl relative overflow-hidden"
            >
              {/* Animated Accent Background Decoration */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
              
              {/* Step 1 or Step 2 Icons */}
              <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-5 relative">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
                <div className="absolute inset-0 rounded-full border border-rose-500/20 animate-ping" />
              </div>

              {/* Dynamic Messages */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 leading-snug">
                  ভুল নম্বর ও পাসওয়ার্ড দিয়েছেন।<br />
                  <span className="text-red-500 text-xs font-extrabold mt-1 inline-block">অ্যাডমিন লগইন সম্ভব নয়।</span>
                </h3>

                <AnimatePresence>
                  {adminLoginErrorState === 'show-link' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="pt-4 border-t border-gray-50 mt-4"
                    >
                      <p className="text-[11px] text-gray-400 font-bold mb-3">অথবা আপনি কি একজন কাস্টমার?</p>
                      <button
                        onClick={() => {
                          setAdminLoginErrorState(null);
                          window.location.hash = ''; // clear hash
                          setAuthInitialMode('login');
                          setIsAuthOpen(true);
                        }}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>কাস্টমার হিসেবে লগইন করুন ও কেনাকাটা করুন</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Small Auto-redirect progress note at the very bottom */}
              <div className="mt-6 flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold">
                <Clock className="w-3 h-3 text-gray-300 animate-pulse" />
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beautiful Custom Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white pl-4 pr-5 py-3.5 rounded-xl shadow-2xl max-w-sm pointer-events-auto overflow-hidden ${
              toast.type === 'error' ? 'border-l-4 border-l-red-500' :
              toast.type === 'info' ? 'border-l-4 border-l-sky-500' :
              'border-l-4 border-l-emerald-500'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'error' ? 'bg-red-500/10 text-red-400' :
              toast.type === 'info' ? 'bg-sky-500/10 text-sky-400' :
              'bg-emerald-500/10 text-emerald-400'
            }`}>
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 font-bold" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 font-bold" />
              ) : (
                <CheckCircle className="w-4 h-4 font-bold" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                {toast.type === 'error' ? 'সতর্কবার্তা' : toast.type === 'info' ? 'তথ্য' : 'সফল হয়েছে'}
              </p>
              <p className="text-xs font-bold text-slate-100 leading-snug mt-0.5">{toast.message}</p>
            </div>
            
            <button 
              onClick={() => setToast(null)} 
              className="text-slate-400 hover:text-white ml-2 text-xs font-black cursor-pointer bg-transparent border-0 transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              ✕
            </button>

            {/* Animated timer progress bar */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-[3px] ${
                toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'info' ? 'bg-sky-500' :
                'bg-emerald-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎁 Promo Offer Modal (shown on load) */}
      <AnimatePresence>
        {showPromoModal && siteConfig.promoActive && siteConfig.promoImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative max-w-[95vw] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl w-full bg-transparent flex items-center justify-center"
            >
              {/* Close Button at top-right (absolute) */}
              <button
                onClick={() => {
                  setShowPromoModal(false);
                }}
                className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-50 p-2 rounded-full bg-black/80 hover:bg-black text-white transition-all hover:scale-110 shadow-lg cursor-pointer flex items-center justify-center border border-white/20"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Offer Image */}
              {siteConfig.promoLink ? (
                <a
                  href={siteConfig.promoLink}
                  onClick={() => {
                    setShowPromoModal(false);
                  }}
                  className="block w-full relative overflow-hidden group rounded-2xl shadow-2xl border border-white/10"
                >
                  <img
                    src={siteConfig.promoImage}
                    alt="Current Offer"
                    className="w-full h-auto object-contain max-h-[85vh] rounded-2xl transition-transform duration-300 group-hover:scale-[1.015]"
                    referrerPolicy="no-referrer"
                  />
                </a>
              ) : (
                <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-black/20">
                  <img
                    src={siteConfig.promoImage}
                    alt="Current Offer"
                    className="w-full h-auto object-contain max-h-[85vh] rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Full-Screen Zoomable Image Lightbox */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center select-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setZoomImage(null);
                setZoomScale(1);
              }
            }}
            tabIndex={0}
          >
            {/* Top Bar with Product Image Size Label & Close button */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-6 z-10">
              <div className="flex flex-col text-left">
                <span className="text-white text-sm font-extrabold tracking-wide uppercase">হাই-রেজোলিউশন প্রিভিউ</span>
                <span className="text-gray-400 text-[10px] font-mono mt-0.5">রিয়েল-টাইম ১২০০ × ১২০০ পিক্সেল প্রিভিউ • পিঞ্চ / স্ক্রল করুন</span>
              </div>
              
              <button
                onClick={() => {
                  setZoomImage(null);
                  setZoomScale(1);
                }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-all border border-white/10 shadow-lg"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Interactive Zoom and Drag stage */}
            <div className="relative w-full h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
              <motion.div
                className="relative max-w-[90%] max-h-[90%] aspect-square flex items-center justify-center bg-white/5 rounded-3xl p-4 border border-white/5 shadow-2xl"
                style={{ width: 'min(85vw, 85vh, 650px)' }}
              >
                <motion.img
                  key={zoomImage}
                  src={zoomImage}
                  alt="জুম করা প্রোডাক্ট ছবি"
                  className="max-w-full max-h-full object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                  drag={zoomScale > 1}
                  dragElastic={0.15}
                  dragConstraints={{
                    left: -200 * (zoomScale - 1),
                    right: 200 * (zoomScale - 1),
                    top: -200 * (zoomScale - 1),
                    bottom: 200 * (zoomScale - 1)
                  }}
                  animate={{ scale: zoomScale }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                />
              </motion.div>
            </div>

            {/* Bottom Floating Premium Controller Bar */}
            <div className="absolute bottom-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 z-10">
              {/* Zoom Out Button */}
              <button
                onClick={() => setZoomScale(s => Math.max(1, s - 0.5))}
                disabled={zoomScale <= 1}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer transition-all border border-slate-700/80 active:scale-90"
                title="জুম আউট"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Dynamic Zoom Percentage Badge */}
              <div className="flex flex-col items-center justify-center min-w-[70px]">
                <span className="text-white text-[13px] font-black tracking-wider font-mono">
                  {Math.round(zoomScale * 100)}%
                </span>
                <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mt-0.5">
                  {zoomScale > 1 ? 'প্যান করুন' : 'জুম'}
                </span>
              </div>

              {/* Zoom In Button */}
              <button
                onClick={() => setZoomScale(s => Math.min(4, s + 0.5))}
                disabled={zoomScale >= 4}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer transition-all border border-slate-700/80 active:scale-90"
                title="জুম ইন"
              >
                <Plus className="w-4 h-4" />
              </button>

              <div className="h-6 w-[1px] bg-slate-800" />

              {/* Reset to 100% Button */}
              <button
                onClick={() => setZoomScale(1)}
                className="px-4 py-1.5 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-black tracking-wide border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                title="রিসেট করুন"
              >
                রিসেট
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
