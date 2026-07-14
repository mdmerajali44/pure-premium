/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, sortProductSizes } from '../types';
import { motion } from 'motion/react';
import { 
  Star, 
  ShoppingCart, 
  ShoppingBag, 
  ArrowLeft, 
  Minus, 
  Plus, 
  Phone, 
  Truck, 
  Check, 
  MessageCircle,
  Sparkles,
  Info,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  isVerified?: boolean;
  phone?: string;
}

const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.length < 6) return trimmed;
  return trimmed.substring(0, 3) + '******' + trimmed.substring(trimmed.length - 2);
};

const getSeedReviews = (product: Product): Review[] => {
  const honeyReviews: Review[] = [
    {
      id: 'rev-1',
      name: 'আরিফুর রহমান',
      rating: 5,
      comment: 'মধুটির স্বাদ অসাধারণ, একদম খাঁটি সুন্দরবনের মধুর আসল গন্ধ পাওয়া যাচ্ছে। এর আগেরবার অন্য জায়গা থেকে নিয়েছিলাম, কিন্তু আপনাদের কোয়ালিটি অনেক বেশি ভালো লেগেছে। ধন্যবাদ!',
      date: '০৩ জুলাই, ২০২৬',
      isVerified: true
    },
    {
      id: 'rev-2',
      name: 'উম্মে হাবিবা',
      rating: 5,
      comment: 'বাচ্চাদের জন্য নিয়েছিলাম, ওরা খুব পছন্দ করেছে। কোনো চিনি বা ভেজাল নেই মনে হচ্ছে। প্যাকিং খুব চমৎকার ছিল, একটুও গড়ায়নি।',
      date: '২৮ জুন, ২০২৬',
      isVerified: true
    },
    {
      id: 'rev-3',
      name: 'মো: জাহিদ হাসান',
      rating: 4,
      comment: 'খুবই খাঁটি মধু। সুন্দর ফ্লেভার। রাজশাহী থেকে খুব সুন্দর প্যাকিংয়ে দ্রুত হোম ডেলিভারি পেয়েছি।',
      date: '২৫ জুন, ২০২৬',
      isVerified: true
    }
  ];

  const gheeReviews: Review[] = [
    {
      id: 'rev-1',
      name: 'আশরাফুল ইসলাম',
      rating: 5,
      comment: 'আহা! ঘিয়েস সুবাস আসলেই চমৎকার। ডাল বা পোলাওয়ের সাথে দিয়ে খেলে এর সুবাসে ঘর ভরে যায়। সিরাজগঞ্জের খাঁটি গাওয়া ঘিয়ের খাঁটি স্বাদ পেলাম।',
      date: '০৪ জুলাই, ২০২৬',
      isVerified: true
    },
    {
      id: 'rev-2',
      name: 'সুলতানা পারভীন',
      rating: 5,
      comment: 'ঘি এর মান খুবই উন্নত। রঙ এবং টেক্সচার দেখে বোঝাই যায় এটা অরগানিক উপায়ে তৈরি। পুনরায় অর্ডার করব ইনশাল্লাহ।',
      date: '৩০ জুন, ২০২৬',
      isVerified: true
    }
  ];

  const mangoReviews: Review[] = [
    {
      id: 'rev-1',
      name: 'শাফায়েত হোসেন',
      rating: 5,
      comment: 'গাছপাকা ফ্রেশ আম! কোনো প্রকার রাসায়নিক বা ফরমালিন ছাড়া যে আম পাওয়া সম্ভব আপনাদের থেকে না কিনলে বিশ্বাস হতো না। অনেক মিষ্টি আম।',
      date: '০৫ জুলাই, ২০২৬',
      isVerified: true
    },
    {
      id: 'rev-2',
      name: 'তাসনিম আরা',
      rating: 5,
      comment: 'কুরিয়ারে আসার পরেও একটা আমও নষ্ট হয়নি। সুন্দর কাঠের বা শক্ত ক্যারেট প্যাকিং ছিল। হিমসাগর আমের দারুণ মিষ্টি স্বাদ!',
      date: '০২ জুলাই, ২০২৬',
      isVerified: true
    }
  ];

  const defaultReviews: Review[] = [
    {
      id: 'rev-1',
      name: 'ফারহান আহমেদ',
      rating: 5,
      comment: 'পণ্যের মান খুবই চমৎকার ও একদম খাঁটি। অর্গানিক জিনিস খুঁজতেছিলাম অনেকদিন ধরে, অবশেষে আপনাদের এখানে সঠিক জিনিস পেলাম।',
      date: '০২ জুলাই, ২০২৬',
      isVerified: true
    },
    {
      id: 'rev-2',
      name: 'সাবিহা ইয়াসমিন',
      rating: 5,
      comment: 'খুবই ভালো সার্ভিস। ডেলিভারির সময় পণ্য দেখে নেয়ার সুযোগ থাকায় অর্ডার করতে কোনো ভয় লাগেনি। প্রোডাক্ট ১০০% অরিজিনাল।',
      date: '২৮ জুন, ২০২৬',
      isVerified: true
    }
  ];

  const catLower = (product.category || '').toLowerCase();
  if (catLower.includes('মধু') || product.id.startsWith('h') || product.id === 'p1') {
    return honeyReviews;
  }
  if (catLower.includes('তেল') || catLower.includes('ঘি') || product.id === 'p2' || product.id === 'p3') {
    return gheeReviews;
  }
  if (catLower.includes('আম') || product.id === 'p4' || product.id.startsWith('m')) {
    return mangoReviews;
  }
  return defaultReviews;
};

const getBengaliDateString = () => {
  const date = new Date();
  const day = date.getDate();
  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const toBengaliNum = (num: number | string): string => {
    const map: Record<string, string> = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return String(num).replace(/[0-9]/g, (char) => map[char] || char);
  };

  return `${toBengaliNum(day)} ${month}, ${toBengaliNum(year)}`;
};

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, size?: string) => void;
  onDirectBuy: (product: Product, quantity: number, size?: string) => void;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onRequestProduct?: (product: Product) => void;
  onViewImage?: (url: string) => void;
  sellerName?: string;
}

const getCategoryDisplayName = (categoryName: string) => {
  try {
    const savedConfigStr = localStorage.getItem('mango_lover_site_config');
    if (savedConfigStr) {
      const config = JSON.parse(savedConfigStr);
      if (config && config.categoryNames) {
        const slugMap: Record<string, string> = {
          'তেল ও ঘি': 'oil-ghee',
          'মধু': 'honey',
          'হোমমেড': 'homemade',
          'গুড় ও চিনি': 'jaggery-sugar',
          'খাঁটি শস্য': 'pure-grains',
          'খেজুর': 'dates',
          'ফ্রেশ আম': 'fresh-mango',
          'লাচ্ছা সেমাই': 'laccha-semai'
        };
        const slug = slugMap[categoryName];
        if (slug && config.categoryNames[slug]) {
          return config.categoryNames[slug];
        }
      }
    }
  } catch (e) {
    console.error("Failed to parse site config in ProductDetails", e);
  }
  return categoryName;
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
      'p3': ['0.5 KG', '1 KG'],
      'p4': ['1 KG'],
      'p5': ['1 KG'],
      'p6': ['500G'],
      'p7': ['5 KG', '10 KG'],
      'p8': ['400G'],
      'h1': ['0.5 KG', '1 KG'],
      'h2': ['0.5 KG', '1 KG', '2 KG'],
      'h3': ['0.5 KG', '1 KG'],
      'h4': ['0.5 KG', '1 KG'],
    };
    sizes = sizeMap[id] || (product && product.unit ? [product.unit] : ['1 KG']);
  }
  return sortProductSizes(sizes);
};

const getDetailedContent = (product: Product) => {
  if (product.detailedTitle || product.tagline || product.descriptionBullets) {
    return {
      title: product.detailedTitle || `${product.name} (আমাদের উৎপাদিত)`,
      tagline: product.tagline || `শতভাগ নিরাপদ ও মজাদার ${product.name}ই আমরা আপনার ঠিকানায় পাঠাবো, এটি আমাদের ওয়াদা! ❤️`,
      bullets: product.descriptionBullets && product.descriptionBullets.length > 0 ? product.descriptionBullets : [
        "শতভাগ খাঁটি ও প্রাকৃতিক উপাদানে তৈরি পণ্য।",
        "কোনো ক্ষতিকর কেমিক্যাল, ভেজাল বা কৃত্রিম প্রিজারভেটিভ নেই।",
        "পরিষ্কার ও অত্যন্ত স্বাস্থ্যকর পরিবেশে তৈরি করা হয়।",
        "শরীরের রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিতে সহায়ক পুষ্টিকর খাবার।"
      ]
    };
  }

  const defaultTitle = `${product.name} (আমাদের উৎপাদিত)`;
  const defaultTagline = `শতভাগ নিরাপদ ও মজাদার ${product.name}ই আমরা আপনার ঠিকানায় পাঠাবো, এটি আমাদের ওয়াদা! ❤️`;
  const defaultBullets = [
    "শতভাগ খাঁটি ও প্রাকৃতিক উপাদানে তৈরি পণ্য।",
    "কোনো ক্ষতিকর কেমিক্যাল, ভেজাল বা কৃত্রিম প্রিজারভেটিভ নেই।",
    "পরিষ্কার ও অত্যন্ত স্বাস্থ্যকর পরিবেশে তৈরি করা হয়।",
    "শরীরের রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিতে সহায়ক পুষ্টিকর খাবার।"
  ];

  const map: Record<string, { title: string; tagline: string; bullets: string[] }> = {
    'p1': {
      title: "সুন্দরবনের খাঁটি খলিশা ফুলের মধু (Pure Sundarban Honey)",
      tagline: "সুন্দরবনের গভীর জঙ্গল থেকে মৌয়ালদের মাধ্যমে সংগৃহীত শতভাগ খাঁটি ও প্রাকৃতিক খলিশা ফুলের মধু।",
      bullets: [
        "শতভাগ খাঁটি ও প্রাকৃতিক: সরাসরি সুন্দরবন থেকে সংগৃহীত এবং কোনো প্রকার কেমিক্যাল বা কৃত্রিম চিনি মুক্ত।",
        "রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি: খলিশা ফুলের মধু নিয়মিত সেবনে শরীরের রোগ প্রতিরোধ ক্ষমতা বহুগুণ বাড়ে।",
        "প্রাকৃতিক গুণাগুণ অক্ষুণ্ন: বৈজ্ঞানিক উপায়ে ফিল্টার করা হয় যাতে মধুর পুষ্টিগুণ নষ্ট না হয়।"
      ]
    },
    'p2': {
      title: "খাঁটি গাওয়া ঘি (Premium Cow Ghee)",
      tagline: "সিরাজগঞ্জের ঐতিহ্যবাহী খাঁটি গরুর দুধের মাখন থেকে তৈরি সুগন্ধি গাওয়া ঘি।",
      bullets: [
        "শতভাগ খাঁটি মাখন থেকে প্রস্তুত: কোনো প্রকার ডালডা বা ভেজাল তেল মুক্ত খাঁটি ঘি।",
        "অতুলনীয় সুবাস ও স্বাদ: ঐতিহ্যবাহী উপায়ে জাল দিয়ে তৈরি যা খাবারের স্বাদ দ্বিগুণ বাড়িয়ে দেয়।",
        "পুষ্টিগুণে ভরপুর: শারীরিক শক্তি, এনার্জি ও পুষ্টির জন্য অত্যন্ত সহায়ক।"
      ]
    },
    'p3': {
      title: "কাঠের ঘানির খাঁটি সরিষার তেল (Mustard Oil)",
      tagline: "বাছাইকৃত লাল সরিষা দানা থেকে কাঠের ঘানিতে ভাঙানো প্রথম চাপের ঝাঁঝালো খাঁটি সরিষার তেল।",
      bullets: [
        "কাঠের ঘানির প্রথম চাপ: কোল্ড প্রেস পদ্ধতিতে তৈরি হওয়ায় সরিষার আসল গুণ ও ঝাঁঝ অক্ষুণ্ন থাকে।",
        "সম্পূর্ণ ভেজালমুক্ত: কোনো প্রকার কৃত্রিম ঝাঁঝ বা ক্ষতিকর কেমিক্যাল মেশানো হয় না।",
        "বহুমুখী ব্যবহার: রান্নায়, ভর্তায় ও আচার তৈরিতে অতুলনীয় স্বাদ এনে দেয়।"
      ]
    },
    'p4': {
      title: "রাজশাহী হিমসাগর আম (Himsagar Mango)",
      tagline: "সরাসরি রাজশাহীর নিজস্ব বাগান থেকে ফরমালিন মুক্ত একদম তাজা ও মিষ্টি হিমসাগর আম।",
      bullets: [
        "রাসায়নিক ও ফরমালিন মুক্ত: সরাসরি গাছ থেকে পেড়ে প্রাকৃতিকভাবে পাকানো আম সরবরাহ করা হয়।",
        "সেরা স্বাদ ও মিষ্টি গন্ধ: হিমসাগর আম তার অতুলনীয় মিষ্টি স্বাদ ও চমৎকার ফাইবারহীন আঁশের জন্য বিখ্যাত।",
        "নিরাপদ প্যাকিং: উন্নত ক্যারেট প্যাকিংয়ের মাধ্যমে অক্ষত অবস্থায় আপনার বাসায় পৌঁছানো হয়।"
      ]
    },
    'p5': {
      title: "প্রিমিয়াম মরিয়ম খেজুর (Maryam Dates)",
      tagline: "সৌদি আরব থেকে আমদানিকৃত নরম, রসালো এবং সুস্বাদু প্রিমিয়াম কোয়ালিটির মরিয়ম খেজুর।",
      bullets: [
        "সরাসরি আমদানি করা: মধ্যপ্রাচ্যের সেরা বাগান থেকে আমদানিকৃত প্রিমিয়াম গ্রেডের খেজুর।",
        "প্রাকৃতিক মিষ্টি ও পুষ্টি: ক্যালসিয়াম, আয়রন ও ফাইবারের চমৎকার উৎস যা তাৎক্ষণিক শক্তি জোগায়।",
        "শতভাগ তাজা ও নরম: স্বাস্থ্যসম্মত উপায়ে সংরক্ষিত ও কোনো কৃত্রিম প্রলেপ মুক্ত।"
      ]
    },
    'p6': {
      title: "ঘি-এ ভাজা লাচ্ছা সেমাই (Laccha Semai)",
      tagline: "খাঁটি গাওয়া ঘিয়ে ভাজা ময়দার স্পেশাল লাচ্ছা সেমাই।",
      bullets: [
        "খাঁটি ঘিয়ে ভাজা: উন্নত মানের গাওয়া ঘিয়ে ভাজা যার ফলে চমৎকার সুবাস ও স্বাদ পাওয়া যায়।",
        "পরিষ্কার ও স্বাস্থ্যকর পরিবেশ: সম্পূর্ণ পরিষ্কার-পরিচ্ছন্ন কারখানায় নিজস্ব তত্ত্বাবধানে প্রস্তুতকৃত।",
        "পারফেক্ট টেক্সচার: মুখে দিলেই গলে যাওয়া ক্রিস্পি ও নরম টেক্সচার যা উৎসবের আমেজ বাড়ায়।"
      ]
    },
    'p7': {
      title: "অর্গানিক খাঁটি আখের গুড় (Pure Sugarcane Jaggery)",
      tagline: "ঐতিহ্যবাহী পদ্ধতিতে আখের রস জ্বাল দিয়ে তৈরি কেমিক্যাল মুক্ত নরম পাটালি আখের গুড়।",
      bullets: [
        "সম্পূর্ণ অরগানিক: কোনো হাইড্রোজ বা কেমিক্যাল ছাড়াই সনাতন পদ্ধতিতে তৈরি খাঁটি গুড়।",
        "চমৎকার স্বাদ ও মিষ্টি গন্ধ: পিঠা, পায়েস, চা বা সাধারণ খাবারের সাথে অতুলনীয়।",
        "আয়রণ ও মিনারেল সমৃদ্ধ: রক্তস্বল্পতা দূর করতে ও হজমশক্তি বাড়াতে অত্যন্ত কার্যকরী।"
      ]
    },
    'p8': {
      title: "নিউট্রিটিয়াস হানি নাটস (Mixed Nuts with Honey)",
      tagline: "প্রিমিয়াম বাদাম ও ড্রাই ফ্রুটসের সাথে সুন্দরবনের খাঁটি মধু মিশ্রিত করে তৈরি অবিশ্বাস্য পুষ্টিকর খাদ্য।",
      bullets: [
        "হানি নাটসের প্রিমিয়াম মিক্স: কাজু, কাঠবাদাম, পেস্তা, আখরোট, কিশমিশ এবং প্রিমিয়াম খেজুরের অপূর্ব সমন্বয়।",
        "১০০% সুন্দরবনের মধু: কোনো সুগার সিরাপ ছাড়াই শুধুমাত্র খাঁটি মধু দিয়ে ভিজিয়ে রাখা হয়।",
        "সুপার এনার্জি বুস্টার: শরীর ও মেধার কার্যক্ষমতা বাড়াতে এবং ক্লান্তি দূর করতে জাদুকরী খাবার।"
      ]
    },
    'p9': {
      title: "লাল চালের চিঁড়া (Organic Red Rice Flakes)",
      tagline: "ঐতিহ্যবাহী ঢেঁকি ছাঁটা লাল চাল থেকে প্রস্তুতকৃত স্বাস্থ্যসম্মত ফাইবার ও পুষ্টি সমৃদ্ধ চিঁড়া।",
      bullets: [
        "ঢেঁকি ছাঁটা লাল চাল: চালের উপরের পুষ্টিকর লাল আবরণ অক্ষুণ্ন রেখে চিঁড়া তৈরি করা হয়।",
        "সহজপাচ্য ও ফাইবার সমৃদ্ধ: ডায়াবেটিস ও ওয়ান নিয়ন্ত্রণে চমৎকার ডায়েট ফুড।",
        "প্রাকৃতিক উপায়ে প্রস্তুত: সম্পূর্ণ কেমিক্যাল ও প্রিজারভেটিভ মুক্ত শতভাগ অর্গানিক পণ্য।"
      ]
    }
  };

  return map[product.id] || { title: defaultTitle, tagline: defaultTagline, bullets: defaultBullets };
};

const getProductImages = (product: Product): string[] => {
  if (product.images && product.images.length > 1) {
    return product.images;
  }
  
  // Return tailored beautiful organic food images based on category or ID so every product has multiple premium preview options
  const defaultImages: Record<string, string[]> = {
    'p1': [
      '/src/assets/images/juice_powder_1782456192648.jpg',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80'
    ],
    'p2': [
      '/src/assets/images/akher_gur_1782456206623.jpg',
      'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
    ],
    'p3': [
      '/src/assets/images/amsotto_achar_1782456219512.jpg',
      'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80'
    ],
    'p4': [
      '/src/assets/images/gawa_ghee_1782456236375.jpg',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=600&q=80'
    ],
    'p5': [
      '/src/assets/images/mustard_oil_1782456250479.jpg',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80'
    ],
    'p6': [
      '/src/assets/images/laccha_semai_1782456263350.jpg',
      'https://images.unsplash.com/photo-1612966608997-30d411b48230?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80'
    ],
    'p6_alt': [
      'https://images.unsplash.com/photo-1612966608997-30d411b48230?auto=format&fit=crop&w=600&q=80',
      '/src/assets/images/laccha_semai_1782456263350.jpg',
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80'
    ],
    'p7': [
      'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
      '/src/assets/images/akher_gur_1782456206623.jpg',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
    ],
    'p8': [
      'https://images.unsplash.com/photo-1511117461117-573522c1b4ec?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80'
    ],
    'p9': [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511117461117-573522c1b4ec?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80'
    ],
    'h1': [
      '/src/assets/images/kalojira_honey_1782465866977.jpg',
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80'
    ],
    'h2': [
      '/src/assets/images/lychee_honey_1782465883260.jpg',
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80'
    ],
    'h3': [
      '/src/assets/images/mustard_honey_1782465897931.jpg',
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80'
    ],
    'h4': [
      '/src/assets/images/sundarban_honey_1782465914163.jpg',
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80'
    ],
    'm1': ['/src/assets/images/green_mangoes_1_1782466276525.jpg'],
    'm2': ['/src/assets/images/green_mangoes_1_1782466276525.jpg'],
    'm3': ['/src/assets/images/green_mangoes_1_1782466276525.jpg'],
    'm4': ['/src/assets/images/green_mangoes_1_1782466276525.jpg'],
    'm5': ['/src/assets/images/green_mangoes_1_1782466276525.jpg'],
    'm6': ['/src/assets/images/green_mangoes_1_1782466276525.jpg'],
    'd1': ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80']
  };

  return defaultImages[product.id] || [
    product.image,
    'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80'
  ];
};

export default function ProductDetails({
  product,
  onBack,
  onAddToCart,
  onDirectBuy,
  allProducts,
  onSelectProduct,
  onRequestProduct,
  onViewImage,
  sellerName
}: ProductDetailsProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'info' | 'reviews'>('desc');
  const [showAllRelated, setShowAllRelated] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Reviews Tab States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewName, setNewReviewName] = useState<string>('');
  const [newReviewPhone, setNewReviewPhone] = useState<string>('');
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const productSizes = getProductSizes(product.id, product);
    setSelectedSize(productSizes[0] || '');
    setQuantity(1);
    setShowAllRelated(false);
    setActiveImageIndex(0);
  }, [product]);

  // Load and seed reviews
  useEffect(() => {
    const key = `mango_lover_reviews_${product.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setReviews(JSON.parse(saved));
    } else {
      const seedReviews = getSeedReviews(product);
      setReviews(seedReviews);
      localStorage.setItem(key, JSON.stringify(seedReviews));
    }
    setReviewSubmitSuccess(false);
    setNewReviewName('');
    setNewReviewPhone('');
    setNewReviewComment('');
    setNewReviewRating(5);
    setHoveredRating(null);
    setShowReviewForm(false);
  }, [product.id, product]);

  const images = getProductImages(product);

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const sizes = getProductSizes(product.id, product);
  const sku = getProductSKU(product.id, product.name, product);
  const details = getDetailedContent(product);

  const discountedPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Retrieve matching category products first, then other products, excluding current active product
  const getSortedRelatedProducts = () => {
    const sameCategory = allProducts.filter((p) => p.category === product.category && p.id !== product.id);
    const otherCategories = allProducts.filter((p) => p.category !== product.category && p.id !== product.id);
    return [...sameCategory, ...otherCategories];
  };

  const allRelatedProducts = getSortedRelatedProducts();
  const relatedProducts = showAllRelated ? allRelatedProducts : allRelatedProducts.slice(0, 6);

  const handlePhoneOrder = () => {
    window.open('tel:01776452312', '_self');
  };

  const handleWhatsAppOrder = () => {
    const unitPrice = (selectedSize && product.sizePrices?.[selectedSize]) ? product.sizePrices[selectedSize].price : product.price;
    const totalPrice = unitPrice * quantity;
    
    let storeName = 'ম্যাংগো লাভার';
    let whatsAppNum = '8801902454972';
    try {
      const savedConfigStr = localStorage.getItem('mango_lover_site_config');
      if (savedConfigStr) {
        const config = JSON.parse(savedConfigStr);
        if (config) {
          if (config.storeName) {
            storeName = config.storeName;
          }
          if (config.contactPhone) {
            const cleanPhone = config.contactPhone.replace(/[^\d]/g, '');
            if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
              whatsAppNum = `88${cleanPhone}`;
            } else if (cleanPhone) {
              whatsAppNum = cleanPhone;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    const toBengaliNumber = (num: number | string): string => {
      const englishToBengaliMap: Record<string, string> = {
        '0': '০',
        '1': '১',
        '2': '২',
        '3': '৩',
        '4': '৪',
        '5': '৫',
        '6': '৬',
        '7': '৭',
        '8': '৮',
        '9': '৯'
      };
      return String(num).replace(/[0-9]/g, (char) => englishToBengaliMap[char] || char);
    };

    const getBengaliUnitSuffix = (unitStr: string): string => {
      if (!unitStr) return 'টি';
      const unitLower = unitStr.toLowerCase().trim();
      if (unitLower === 'pcs' || unitLower === 'piece' || unitLower === 'pieces' || unitLower === 'পিস' || unitLower === 'টি') {
        return 'টি';
      }
      if (unitLower === 'kg' || unitLower === 'kilo' || unitLower === 'kilogram' || unitLower === 'কেজি') {
        return 'কেজি';
      }
      if (unitLower === 'gm' || unitLower === 'gram' || unitLower === 'grams' || unitLower === 'গ্রাম') {
        return 'গ্রাম';
      }
      if (unitLower === 'l' || unitLower === 'liter' || unitLower === 'liters' || unitLower === 'litre' || unitLower === 'litres' || unitLower === 'লিটার') {
        return 'লিটার';
      }
      if (unitLower === 'ml' || unitLower === 'milliliter' || unitLower === 'মিলি') {
        return 'মিলি';
      }
      if (unitLower === 'box' || unitLower === 'boxes' || unitLower === 'বক্স') {
        return 'বক্স';
      }
      if (unitLower === 'pack' || unitLower === 'packet' || unitLower === 'packets' || unitLower === 'প্যাক' || unitLower === 'প্যাকেট') {
        return 'প্যাক';
      }
      if (unitLower === 'হালি') {
        return 'হালি';
      }
      if (unitLower === 'ডজন' || unitLower === 'dozen') {
        return 'ডজন';
      }
      return unitStr;
    };

    const formatSizeBengali = (size: string): string => {
      if (!size) return '';
      let text = size;
      text = text.replace(/k?g/i, 'কেজি');
      text = text.replace(/gm|gram/i, 'গ্রাম');
      text = text.replace(/l|liter/i, 'লিটার');
      text = text.replace(/ml/i, 'মিলি');
      text = text.replace(/pcs|piece/i, 'পিস');
      return toBengaliNumber(text);
    };

    const sizeText = selectedSize ? ` (${formatSizeBengali(selectedSize)})` : '';
    
    // Determine quantity text according to the selected unit
    let qtyBengali = '';
    if (selectedSize) {
      qtyBengali = `${toBengaliNumber(quantity)}টি`;
    } else {
      const unitSuffix = getBengaliUnitSuffix(product.unit || 'টি');
      qtyBengali = `${toBengaliNumber(quantity)}${unitSuffix}`;
    }

    const message = `হ্যালো ${storeName},\n\nআমি এই প্রোডাক্টটি অর্ডার করতে চাই।\n\n📦 পণ্য: ${product.name}${sizeText}\n🔢 পরিমাণ: ${qtyBengali}\n💰 একক মূল্য: ${toBengaliNumber(unitPrice)}৳\n🧾 সর্বমোট মূল্য: ${toBengaliNumber(totalPrice)}৳\n🏷️ SKU: ${sku}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsAppNum}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id={`product-details-${product.id}`}>
      {/* Breadcrumbs / Back button */}
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 font-medium">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-[#006437] hover:underline font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ফিরে যান</span>
        </button>
        <span>/</span>
        <span className="hover:underline cursor-pointer" onClick={onBack}>হোম</span>
        <span>/</span>
        <span>{getCategoryDisplayName(product.category)}</span>
        <span>/</span>
        <span className="text-gray-800 font-semibold line-clamp-1">{product.name}</span>
      </div>

      {/* Main product configuration layout (Image & Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-gray-100 p-4 md:p-8 rounded-none">
        {/* Left Column: Product Image Gallery with Left Vertical Thumbnails and Main Image Slider */}
        <div className="flex flex-row gap-3 md:gap-4 h-[350px] sm:h-[450px] md:h-[500px] w-full items-stretch">
          {/* Thumbnails list on the left of the large image */}
          {images.length > 1 && (
            <div className="flex flex-col w-[70px] sm:w-[85px] md:w-[95px] h-full justify-between items-center bg-gray-50/50 p-1.5 md:p-2 border border-gray-100 rounded-2xl shrink-0">
              {/* Thumbnails Container */}
              <div className="flex flex-col gap-2 w-full overflow-y-auto no-scrollbar scroll-smooth flex-1 py-1">
                {images.map((imgUrl, idx) => {
                  const isSelected = idx === activeImageIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-full aspect-square border-2 rounded-xl overflow-hidden cursor-pointer bg-white transition-all duration-200 focus:outline-none shrink-0 ${
                        isSelected 
                          ? 'border-[#ff9800] shadow-sm scale-[1.02]' 
                          : 'border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} preview ${idx + 1}`}
                        className="w-full h-full object-contain p-1 mix-blend-multiply rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Navigation arrows at the bottom of thumbnail list */}
              <div className="flex items-center gap-1.5 w-full pt-2 border-t border-gray-200/50 justify-center shrink-0">
                <button
                  onClick={handlePrevImage}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 hover:border-orange-400 text-gray-600 hover:text-orange-500 active:scale-90 flex items-center justify-center cursor-pointer transition-all shadow-xs"
                  title="Previous Image"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 hover:border-orange-400 text-gray-600 hover:text-orange-500 active:scale-90 flex items-center justify-center cursor-pointer transition-all shadow-xs"
                  title="Next Image"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Right/Center Area: Main Large Product Image with overlay arrows */}
          <div 
            onClick={() => onViewImage?.(images[activeImageIndex])}
            className="relative flex-1 bg-[#f7f8f9] rounded-2xl flex items-center justify-center p-0 border border-gray-100 overflow-hidden h-full select-none cursor-zoom-in group/mainimg"
            title="ছবি জুম করতে ক্লিক করুন"
          >
            {/* Discount Badge */}
            {product.stock === 0 ? (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm tracking-wider uppercase z-10">
                Stock Out
              </div>
            ) : product.badge === 'new' ? (
              <div className="absolute top-4 left-4 bg-[#00b050] text-white text-[10px] font-black px-3 py-1 rounded-sm tracking-wider z-10 shadow-md">
                নতুন
              </div>
            ) : product.badge === 'restocked' ? (
              <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-sm tracking-wider z-10 shadow-md">
                Restocked
              </div>
            ) : discountedPct > 0 ? (
              <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-[#ffcc00] text-black flex items-center justify-center text-[13px] font-black shadow-md z-10">
                -{discountedPct}%
              </div>
            ) : (
              (product.isFeatured || ['p2', 'p3', 'p8'].includes(product.id)) && (
                <div className="absolute top-4 left-4 bg-[#00b050] text-white text-[10px] font-black px-3 py-1 rounded-sm tracking-wider uppercase z-10 shadow-md">
                  NEW
                </div>
              )
            )}

            {/* Left navigation arrow on the side of main image */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/90 hover:bg-white text-rose-500 hover:text-rose-600 active:scale-90 shadow-md flex items-center justify-center cursor-pointer transition-all border border-gray-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
              </button>
            )}

            {/* Right navigation arrow on the side of main image */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/90 hover:bg-white text-rose-500 hover:text-rose-600 active:scale-90 shadow-md flex items-center justify-center cursor-pointer transition-all border border-gray-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
              </button>
            )}

            {/* Big product image with rounded corners - 1:1 Aspect ratio representing 1200x1200px display */}
            <div className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden p-0">
              <img 
                src={images[activeImageIndex]} 
                alt={`${product.name} view ${activeImageIndex + 1}`}
                className="w-full h-full object-cover mx-auto rounded-2xl transition-all duration-300 group-hover/mainimg:scale-103 mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Interactive Zoom Overlay indicator */}
            <div className="absolute inset-0 bg-black/0 group-hover/mainimg:bg-black/5 transition-colors duration-250 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-black/60 text-white rounded-full p-3 opacity-0 scale-90 group-hover/mainimg:opacity-100 group-hover/mainimg:scale-100 transition-all duration-250 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, pricing & checkout selectors */}
        <div className="flex flex-col space-y-5">
          <div>
            <h1 className="text-xl md:text-3.5xl font-extrabold text-slate-900 leading-normal pt-1 pb-1">
              {product.name}
            </h1>
            
            {/* Seller/Entrepreneur Badge */}
            {sellerName && (
              <div className="inline-flex items-center gap-1.5 mt-2.5 bg-emerald-50 text-[#006437] text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-100/70 select-none">
                <Store className="w-3.5 h-3.5 text-[#006437]" />
                <span>উদ্যোক্তা: {sellerName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                <span className="text-[10px] text-emerald-600 font-extrabold">(অনুমোদিত বিক্রেতা)</span>
              </div>
            )}
            
            {/* Tagline */}
            <p className="text-sm text-gray-500 font-semibold mt-2 leading-relaxed">
              {details.tagline}
            </p>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl md:text-3xl font-black text-orange-600">
              {(selectedSize && product.sizePrices?.[selectedSize]) ? product.sizePrices[selectedSize].price : product.price}৳
            </span>
            {((selectedSize && product.sizePrices?.[selectedSize]) ? product.sizePrices[selectedSize].originalPrice : product.originalPrice) !== undefined && (
              <span className="text-sm md:text-base text-red-500 line-through font-semibold">
                {(selectedSize && product.sizePrices?.[selectedSize]) ? product.sizePrices[selectedSize].originalPrice : product.originalPrice}৳
              </span>
            )}
          </div>

          {/* Ozon/Size Selector (If available) */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="font-bold text-slate-800">ওজন:</span>
                {selectedSize && (
                  <button 
                    onClick={() => setSelectedSize('')}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-bold text-[11px]"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isActive = selectedSize === size;
                  return (
                    <motion.button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 text-xs font-bold border rounded-md transition-all relative cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50/70 text-emerald-800 border-emerald-500 shadow-sm animate-pulse-weight'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 animate-pulse-weight-inactive'
                      }`}
                    >
                      <span>{size}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock availability */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-gray-500">উপলব্ধতা:</span>
            <span className={`flex items-center gap-1 font-bold ${product.stock > 0 ? 'text-green-600' : 'text-rose-600'}`}>
              {product.stock > 0 ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{product.stock} in stock</span>
                </>
              ) : (
                'শীঘ্রই রিস্টক করা হবে'
              )}
            </span>
          </div>

          {/* Quantity and core checkout buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            {/* Quantity control */}
            <div className="flex items-center justify-between border border-gray-200 bg-gray-50 p-2 rounded-md shrink-0 w-full sm:w-32">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-1 hover:bg-white text-gray-600 rounded disabled:opacity-30 transition-all cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-sm text-gray-800">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="p-1 hover:bg-white text-gray-600 rounded disabled:opacity-30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Core buttons */}
            <div className="grid grid-cols-2 gap-3 flex-grow">
              {product.stock === 0 ? (
                <button
                  onClick={() => onRequestProduct?.(product)}
                  className="col-span-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs md:text-sm py-3 px-4 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-rose-100" />
                  <span>রিকুয়েস্ট করুন (শীঘ্রই রিস্টক করা হবে)</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onAddToCart(product, quantity, selectedSize)}
                    className="bg-[#006437] hover:bg-[#004d2a] active:bg-[#00381e] text-white font-bold text-xs md:text-sm py-3 px-4 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add To Cart</span>
                  </button>

                  <button
                    onClick={() => onDirectBuy(product, quantity, selectedSize)}
                    className="bg-[#232323] hover:bg-[#1a1a1a] active:bg-black text-white font-bold text-xs md:text-sm py-3 px-4 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer animate-shake-buynow"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buy Now</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Social Order Quick Hotlines */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePhoneOrder}
              className="bg-[#004080] hover:bg-[#003060] text-white font-bold text-xs md:text-sm py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>ফোন অর্ডার</span>
            </button>
            <button
              onClick={handleWhatsAppOrder}
              className="bg-[#25D366] hover:bg-[#20ba56] text-white font-extrabold text-xs md:text-sm py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>হোয়াটসঅ্যাপে যোগাযোগ ও অর্ডার</span>
            </button>
          </div>

          {/* Delivery Trust factor card info */}
          <div className="flex items-start gap-3 p-4 bg-[#f8faf9] border border-[#e2ece8] rounded-md mt-2">
            <div className="p-2 bg-[#006437]/10 text-[#006437] rounded-md shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm">
                অগ্রীম ছাড়াই অর্ডার করুন
              </h4>
              <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed">
                অর্ডারের পর, ডেলিভারির সময় আমাদের প্রোডাক্ট টেস্ট করে মূল্য পরিশোধের সুযোগ রয়েছে।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs section (Description / Additional info / Reviews) */}
      <div className="bg-white border border-gray-100 p-4 md:p-8 rounded-none">
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 font-extrabold text-xs md:text-sm tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'desc'
                ? 'border-[#006437] text-[#006437]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            DESCRIPTION
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 font-extrabold text-xs md:text-sm tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#006437] text-[#006437]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            ADDITIONAL INFORMATION
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 font-extrabold text-xs md:text-sm tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#006437] text-[#006437]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            REVIEWS ({reviews.length})
          </button>
        </div>

        {activeTab === 'desc' ? (
          <div className="space-y-4 text-slate-700 leading-relaxed text-xs md:text-sm">
            <h3 className="font-bold text-[#006437] text-sm md:text-lg">
              {details.title}
            </h3>
            <p className="font-medium text-gray-600 italic">
              — সম্পূর্ণ নিরাপদ ও স্বাস্থ্যসম্মত উপায়ে প্রস্তুতকৃত।
            </p>
            <p>
              আমাদের সকল পণ্য সরাসরি আমাদের নিজস্ব তত্ত্বাবধানে রাজশাহী এবং সুন্দরবনের আসল উৎস থেকে নিখুঁত পরিচ্ছন্ন পরিবেশে প্রস্তুত করা হয়। পরিবারের স্বাস্থ্য রক্ষায় ও খাবারে শতভাগ খাঁটি ও বিশুদ্ধ স্বাদ নিশ্চিত করতে আমাদের জুড়ি মেলা ভার।
            </p>
            
            <div className="space-y-2 pt-2">
              <p className="font-bold text-slate-800">কেন আমাদের পণ্যই সেরা?</p>
              <ul className="list-disc pl-5 space-y-2">
                {details.bullets.map((bullet, idx) => (
                  <li key={idx} className="font-medium">{bullet}</li>
                ))}
              </ul>
            </div>
            
            <p className="text-gray-500 font-semibold text-[11px] md:text-xs pt-4 border-t border-gray-100 mt-4">
              ম্যাংগো লাভার-এর অঙ্গীকার: আপনার এবং আপনার পরিবারের জন্য— কেবল শতভাগ ফ্রেশ এবং অরগানিক খাবারই আমরা আপনার ঠিকানায় পাঠাবো, এটিই আমাদের ওয়াদা।
            </p>
          </div>
        ) : activeTab === 'info' ? (
          <div className="divide-y divide-gray-100 text-xs md:text-sm">
            <div className="grid grid-cols-3 py-3 font-medium">
              <span className="text-gray-400 font-bold">ওজন/সাইজ</span>
              <span className="col-span-2 text-slate-800 font-semibold">{sizes.join(', ')}</span>
            </div>
            <div className="grid grid-cols-3 py-3 font-medium">
              <span className="text-gray-400 font-bold">প্রস্তুতকারক</span>
              <span className="col-span-2 text-slate-800 font-semibold">{product.manufacturer || "ম্যাংগো লাভার (MangoLover)"}</span>
            </div>
            <div className="grid grid-cols-3 py-3 font-medium">
              <span className="text-gray-400 font-bold">উৎস অঞ্চল</span>
              <span className="col-span-2 text-slate-800 font-semibold">
                {product.sourceArea || (product.category === 'মধু' ? 'সুন্দরবন গভীর অরণ্য' : 'রাজশাহী ও সিরাজগঞ্জ, বাংলাদেশ')}
              </span>
            </div>
            <div className="grid grid-cols-3 py-3 font-medium">
              <span className="text-gray-400 font-bold">শেল্ফ লাইফ</span>
              <span className="col-span-2 text-slate-800 font-semibold">{product.shelfLife || "১২ মাস (শুকনো ও ঠাণ্ডা জায়গায় সংরক্ষণ করুন)"}</span>
            </div>
            <div className="grid grid-cols-3 py-3 font-medium">
              <span className="text-gray-400 font-bold">অর্গানিক সার্টিফিকেট</span>
              <span className="col-span-2 text-slate-800 font-semibold">{product.organicCertificate || "১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত পরীক্ষিত"}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in text-xs md:text-sm text-left">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Rating Statistics Summary */}
              <div className="md:col-span-5 bg-gray-50 border border-gray-100/70 p-6 rounded-2xl flex flex-col items-center text-center">
                <span className="text-sm font-extrabold text-gray-500">গড় কাস্টমার রেটিং</span>
                <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight mt-2 mb-1">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : '5.0'}
                </span>
                
                {/* Gold Stars row */}
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const avg = reviews.length > 0 
                      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
                      : 5;
                    return (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.round(avg) ? 'fill-current text-amber-500' : 'text-gray-300'}`} 
                      />
                    );
                  })}
                </div>
                
                <span className="text-xs font-bold text-gray-400 mb-6">
                  {reviews.length}টি ভেরিফাইড কাস্টমার রিভিউ এর ভিত্তিতে
                </span>

                {/* Rating breakdown bars */}
                <div className="w-full space-y-2.5 border-t border-gray-200/50 pt-6">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => r.rating === stars).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-10 text-right">{stars} স্টার</span>
                        <div className="flex-1 h-2 bg-gray-200/60 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-400 w-8 text-left">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Reviews List & Submit Form */}
              <div className="md:col-span-7 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h4 className="font-extrabold text-base text-slate-800">
                    কাস্টমার রিভিউ সমূহ ({reviews.length})
                  </h4>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-[#006437] hover:bg-[#004d2a] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer hover:scale-102 active:scale-98"
                  >
                    {showReviewForm ? 'রিভিউ তালিকা দেখুন' : 'একটি রিভিউ লিখুন'}
                  </button>
                </div>

                {showReviewForm ? (
                  /* Write Review Form */
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newReviewName.trim() || !newReviewPhone.trim() || !newReviewComment.trim()) return;
                      const newReviewObj: Review = {
                        id: `rev-${Date.now()}`,
                        name: newReviewName.trim(),
                        phone: newReviewPhone.trim(),
                        rating: newReviewRating,
                        comment: newReviewComment.trim(),
                        date: getBengaliDateString(),
                        isVerified: true
                      };
                      const updated = [newReviewObj, ...reviews];
                      setReviews(updated);
                      localStorage.setItem(`mango_lover_reviews_${product.id}`, JSON.stringify(updated));
                      setNewReviewName('');
                      setNewReviewPhone('');
                      setNewReviewComment('');
                      setNewReviewRating(5);
                      setHoveredRating(null);
                      setReviewSubmitSuccess(true);
                      setTimeout(() => setReviewSubmitSuccess(false), 5000);
                      setShowReviewForm(false);
                    }}
                    className="bg-[#fffdf9] border border-amber-100 rounded-2xl p-6 space-y-4 shadow-3xs text-left"
                  >
                    <h5 className="font-black text-sm text-amber-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>আপনার মূল্যবান কাস্টমার রিভিউ লিখুন</span>
                    </h5>

                    {/* Name & Phone Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="block text-xs font-black text-slate-700">আপনার নাম <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          placeholder="যেমন: সাকিব আল হাসান"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1">
                        <label className="block text-xs font-black text-slate-700">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          required
                          value={newReviewPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9+\-\s০-৯]/g, '');
                            setNewReviewPhone(val);
                          }}
                          placeholder="যেমন: 017XXXXXXXX"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Rating star interactive row to match screenshot style */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-black text-slate-700">রেটিং <span className="text-red-500">*</span></label>
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isHighlighted = (hoveredRating !== null ? star <= hoveredRating : star <= newReviewRating);
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReviewRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(null)}
                                className="p-0.5 hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-none"
                              >
                                <Star 
                                  className={`w-8 h-8 transition-colors duration-150 ${
                                    isHighlighted 
                                      ? 'fill-amber-400 text-amber-500' 
                                      : 'text-slate-400 fill-slate-50'
                                  }`} 
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">একটি স্টার নির্বাচন করুন</span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-black text-slate-700">রিভিউ মন্তব্য <span className="text-red-500">*</span></label>
                      <textarea
                        required
                        rows={3}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="পণ্যের গুণগত মান, স্বাদ বা সার্ভিস সম্পর্কে আপনার অনুভূতি লিখুন..."
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        বাতিল করুন
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#006437] hover:bg-[#004d2a] text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-950/10"
                      >
                        রিভিউ জমা দিন
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Review List */
                  <div className="space-y-4 text-left">
                    {reviewSubmitSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>আপনার কাস্টমার রিভিউটি সফলভাবে সাবমিট হয়েছে! ধন্যবাদ।</span>
                      </div>
                    )}

                    {reviews.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-2">
                        <span className="text-3xl">💬</span>
                        <p className="text-xs text-gray-400 font-bold">এই পণ্যে এখনও কোনো রিভিউ দেওয়া হয়নি। প্রথম রিভিউটি লিখুন!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 no-scrollbar">
                        {reviews.map((rev) => (
                          <div 
                            key={rev.id} 
                            className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 text-left space-y-2 hover:border-amber-100/60 transition-colors shadow-3xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs uppercase shadow-3xs">
                                  {rev.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <h5 className="font-extrabold text-slate-800 text-xs leading-none flex flex-wrap items-center gap-1.5">
                                    <span>{rev.name}</span>
                                    {rev.phone && (
                                      <span className="text-[9px] text-slate-400 font-semibold bg-slate-100 px-1 py-0.5 rounded">
                                        {maskPhone(rev.phone)}
                                      </span>
                                    )}
                                  </h5>
                                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                                    {rev.date}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Verified Purchase Badge */}
                              {rev.isVerified && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100/60 rounded-full text-[9px] font-extrabold select-none">
                                  <Check className="w-2.5 h-2.5 stroke-[4]" />
                                  <span>Verified Buyer</span>
                                </div>
                              )}
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current text-amber-500' : 'text-gray-200'}`} 
                                />
                              ))}
                            </div>

                            {/* Comment */}
                            <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed">
                              {rev.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Grid */}
      <div className="space-y-5">
        <h3 className="text-lg md:text-xl font-extrabold text-slate-900 border-l-4 border-[#006437] pl-3 leading-none">
          Related products
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {relatedProducts.map((p) => {
            const relDiscount = p.originalPrice
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : 0;
            const relSizes = getProductSizes(p.id, p);
            const relSku = getProductSKU(p.id, p.name, p);
            const relButtonLabel = relSizes.length > 1 ? "Select Options" : "Add To Cart";
            const relCategoriesLabel = `${getCategoryDisplayName(p.category)}, ${p.name.split(' ')[0]}, আমাদের উৎপাদিত`;

            return (
              <div
                key={p.id}
                className="group bg-white rounded-none border border-gray-200 transition-all duration-300 flex flex-col h-full overflow-hidden relative hover:border-[#ff9800] hover:shadow-xs cursor-pointer"
                onClick={() => onSelectProduct(p)}
              >
                {/* Badges */}
                {relDiscount > 0 ? (
                  <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-[#ffcc00] text-black flex items-center justify-center text-[10px] font-black shadow-xs">
                    -{relDiscount}%
                  </div>
                ) : (
                  (p.isFeatured || ['p2', 'p3', 'p8'].includes(p.id)) && (
                    <div className="absolute top-3 left-3 z-10 bg-[#00b050] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm tracking-wider uppercase">
                      NEW
                    </div>
                  )
                )}

                {/* Product Image (1:1 square ratio, represents 1200x1200px format) */}
                <div 
                  className="w-full aspect-square bg-[#f7f8f9] overflow-hidden relative flex items-center justify-center p-3 border-b border-gray-100"
                >
                  <img 
                    src={p.image} 
                    alt={p.name}
                    className="max-h-full max-w-full object-contain mx-auto mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Details */}
                <div className="p-3 flex flex-col flex-grow">
                  <h4 className="font-bold text-[#006437] text-xs md:text-sm leading-normal hover:underline line-clamp-1 pt-0.5 pb-0.5 mb-1">
                    {p.name}
                  </h4>
                  
                  <p className="text-[10px] text-gray-400 font-semibold mb-2 line-clamp-1">
                    {relCategoriesLabel}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-baseline gap-1 font-bold text-xs md:text-sm">
                      <span className="text-orange-600">{p.price}৳</span>
                      {p.originalPrice && (
                        <span className="text-[10px] text-red-500 line-through font-medium">{p.originalPrice}৳</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 overflow-hidden">
                      {relSizes.slice(0, 2).map((sz) => (
                        <span key={sz} className="border border-gray-100 bg-white rounded px-0.5 py-0.2 text-[8px] font-bold text-gray-400">
                          {sz}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Add To Cart button / Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (p.stock === 0) {
                        onRequestProduct?.(p);
                        return;
                      }
                      if (relSizes.length > 1) {
                        onSelectProduct(p);
                      } else {
                        onAddToCart(p, 1);
                      }
                    }}
                    className={`w-full text-white text-[10px] font-bold py-1.5 px-2 rounded transition-colors text-center shadow-xs cursor-pointer border-0 ${
                      p.stock === 0
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-[#006437] hover:bg-[#004d2a] active:bg-[#00381e]"
                    }`}
                  >
                    {p.stock === 0 ? "রিকুয়েস্ট করুন" : relButtonLabel}
                  </button>

                  <div className="text-[8px] font-mono text-gray-400 font-bold tracking-wider pt-1.5 border-t border-gray-100 mt-1.5 uppercase flex items-center justify-between">
                    <span>SKU: {relSku}</span>
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[9px]">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{p.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expander Button to see remaining products below */}
        {!showAllRelated && allRelatedProducts.length > 6 && (
          <div className="flex justify-center pt-6">
            <button
              onClick={() => setShowAllRelated(true)}
              className="px-8 py-3 bg-[#006437] hover:bg-[#ff9800] hover:text-white active:scale-95 text-white font-extrabold text-xs md:text-sm rounded-md transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg flex items-center gap-2 border border-emerald-700/30 uppercase tracking-widest"
            >
              <span>বিস্তারিত দেখুন ও বাকি পণ্যগুলো নিচে দেখুন (Show Remaining Products)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
