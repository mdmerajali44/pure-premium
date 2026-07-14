import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import fs from "fs";
import multer from "multer";

// Load environment variables
dotenv.config();

// Imports from data file
import { CATEGORIES, INITIAL_PRODUCTS } from "./src/data";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "15mb" }));

  // Configure Multer for processing file uploads in memory (saves to MongoDB/Fallback as Base64)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB limit to accommodate larger images
    }
  });

  // Helper to parse product fields from JSON or FormData/Multipart requests robustly
  function parseProductFields(body: any, file?: any): any {
    const product = { ...body };

    // Parse _id robustly if passed from client
    if (product._id) {
      if (typeof product._id === "string") {
        if (product._id.startsWith("{")) {
          try {
            const parsedId = JSON.parse(product._id);
            if (parsedId && parsedId.$oid) {
              product._id = parsedId.$oid;
            }
          } catch (e) {
            // Keep original string if parsing fails
          }
        }
      }
    }

    // Convert numeric fields from strings if they came from FormData
    if (product.price !== undefined) {
      const val = Number(product.price);
      product.price = isNaN(val) ? 0 : val;
    }
    
    if (product.originalPrice !== undefined && product.originalPrice !== "" && product.originalPrice !== "null" && product.originalPrice !== "undefined") {
      const val = Number(product.originalPrice);
      if (isNaN(val) || val <= 0) {
        delete product.originalPrice;
      } else {
        product.originalPrice = val;
      }
    } else {
      delete product.originalPrice;
    }
    
    if (product.purchasePrice !== undefined && product.purchasePrice !== "" && product.purchasePrice !== "null" && product.purchasePrice !== "undefined") {
      const val = Number(product.purchasePrice);
      if (isNaN(val) || val <= 0) {
        delete product.purchasePrice;
      } else {
        product.purchasePrice = val;
      }
    } else {
      delete product.purchasePrice;
    }
    
    if (product.stock !== undefined) {
      const val = Number(product.stock);
      product.stock = isNaN(val) ? 0 : val;
    }
    if (product.reorderLevel !== undefined) {
      const val = Number(product.reorderLevel);
      product.reorderLevel = isNaN(val) ? 5 : val;
    }
    if (product.rating !== undefined) {
      const val = Number(product.rating);
      product.rating = isNaN(val) ? 4.5 : val;
    }
    if (product.reviewsCount !== undefined) {
      const val = Number(product.reviewsCount);
      product.reviewsCount = isNaN(val) ? 0 : val;
    }

    // Convert booleans
    if (product.isFeatured === "true") product.isFeatured = true;
    if (product.isFeatured === "false") product.isFeatured = false;
    if (product.hasMultipleSizes === "true") product.hasMultipleSizes = true;
    if (product.hasMultipleSizes === "false") product.hasMultipleSizes = false;

    // Parse array/object fields if they came from FormData as JSON strings
    if (typeof product.images === "string") {
      try {
        product.images = JSON.parse(product.images);
      } catch (e) {
        product.images = [product.images];
      }
    }
    if (typeof product.sizes === "string") {
      try {
        product.sizes = JSON.parse(product.sizes);
      } catch (e) {
        product.sizes = [];
      }
    }
    if (typeof product.sizePrices === "string") {
      try {
        product.sizePrices = JSON.parse(product.sizePrices);
      } catch (e) {
        product.sizePrices = {};
      }
    }
    if (typeof product.descriptionBullets === "string") {
      try {
        product.descriptionBullets = JSON.parse(product.descriptionBullets);
      } catch (e) {
        product.descriptionBullets = [];
      }
    }

    // If multi-sizes is explicitly false, clean sizes and sizePrices
    if (product.hasMultipleSizes === false) {
      product.sizes = [];
      product.sizePrices = {};
    }

    // Parse descriptionBullets if it was passed under other format
    if (product.descriptionBullets && !Array.isArray(product.descriptionBullets) && typeof product.descriptionBullets === "object") {
      product.descriptionBullets = Object.values(product.descriptionBullets);
    }

    // Process file if present
    if (file) {
      const base64Data = file.buffer.toString("base64");
      product.image = `data:${file.mimetype};base64,${base64Data}`;
    }

    return product;
  }

  const isProduction = process.env.NODE_ENV === "production";

  // --- Local Fallback Persistence Config ---
  const DB_DIR = path.join(process.cwd(), "db_fallback");
  if (!fs.existsSync(DB_DIR)) {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (e) {
      console.error("Failed to create DB_DIR:", e);
    }
  }

  function getFallbackData<T>(key: string, defaultData: T): T {
    const filePath = path.join(DB_DIR, `${key}.json`);
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf8");
      } catch (err) {
        console.error(`Failed to write default fallback data for ${key}:`, err);
      }
      return defaultData;
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      return defaultData;
    }
  }

  function saveFallbackData<T>(key: string, data: T): void {
    const filePath = path.join(DB_DIR, `${key}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error(`Failed to write fallback data for ${key}:`, err);
    }
  }

  // --- Pre-seeded Initial Data ---
  const SEEDED_ORDERS = [
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

  const INITIAL_USERS = [
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
      name: 'Mehedi Hasan',
      phone: '01837587551',
      password: 'password123',
      address: 'উজিরপুর, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা',
      district: 'সাতক্ষীরা',
      area: 'কালিগঞ্জ',
      role: 'admin',
      status: 'active',
      createdAt: '০১ জুলাই, ২০২৬',
    }
  ];

  const DEFAULT_SITE_CONFIG = {
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
    aboutParagraph1: 'যার শৈশব ও বেড়ে ওঠা নিভৃত পল্লীগাঁয়ে। উচ্চশিক্ষার উদ্দেশ্যে গ্রাম ছেড়ে তিনি পাড়ি জমান নোয়াখীতে। সেখানে গিয়ে নিজের প্রয়োজনে কেনা খেজুরের গুড়, ঘি কিংবা আম - সবকিছুতেই কৃত্রিমতার ছাপ লক্ষ্য করেন। যেহেতু তার শৈশব কেটেছে গ্রামে, তাই খাঁটি খাদ্যদ্রব্য চিনতে তার ভুল হওয়ার কথা নয়; তার ওপর নিজের পড়াশোনাও ছিল \'নিরাপদ খাদ্য\' নিয়ে।',
    aboutParagraph2: 'ক্যাম্পাসে পরিচিতদের জন্য গুড় ও ঘি এনে প্রশংসা পাওয়ার পর তার মনে হয়েছিল—নিজে উদ্যোক্তা হয়ে দেশজুড়ে মানুষের কাছে খাঁটি খাদ্য পৌঁছে দিলে কেমন হয়? সেই ভাবনা থেকেই পরিবারের দেওয়া সামান্য আর্থিক পুঁজি নিয়ে তিনি এই সংকল্পে নামলেন যে - যতটুকু সম্ভব, ততটুকুই খাঁটি জিনিস তিনি গ্রাহকদের কাছে পৌঁছে দেবেন। অনেক নির্ঘুম রাত আর অক্লান্ত পরিশ্রমে তিনি নিজের প্রচেষ্টা অব্যাহত রেখে প্রমাণ করলেন যে, একাগ্রতা থাকলে সবই সম্ভব। কোনো কিছু অর্জন করতে হলে আগে সেটি দৃঢ়ভাবে চাইতে হয়।',
    aboutParagraph3: 'পরবর্তীতে কয়েক লক্ষ গ্রাহকের দোরগোড়ায় তিনি পৌঁছে দিয়েছেন তার এই \'ম্যাংগো লাভার\'-এর পণ্য। তৈরি হয়েছে বিশাল এক অনুগত গ্রাহক শ্রেণি। সেই সঙ্গে নিরবিচ্ছিন্ন সেবা নিশ্চিত করতে তিনি গড়ে তুলেছেন দক্ষ সাপোর্ট টিম। আজ ৬০ জনেরও বেশি কর্মী নিয়ে তিনি সফলতার সাথে এগিয়ে যাচ্ছেন।',
    aboutFacebookLink: 'https://facebook.com',
    contactOffice: 'Nowhata, Paba, Rajshahi, Bangladesh, 6213',
    contactPhone: '+880 1301-636461',
    contactEmail: 'info@mangolover.com.bd',
    refundPolicyText: 'আমাদের মূল লক্ষ্য গ্রাহকের সন্তুষ্টি। যদি কোনো কারণে আপনি পণ্য পেয়ে অসन्तुষ্ট হন, তবে নিম্নলিখিত নীতি অনুযায়ী আমরা পণ্য পরিবর্তন বা মূল্য ফেরত দিয়ে থাকি:\n\n১. ডেলিভারির সময় পণ্য দেখে নেওয়ার সুযোগ রয়েছে। কোনো প্রকার ক্রটি থাকলে ডেলিভারি ম্যানের কাছেই ফেরত দিতে পারবেন।\n\n২. আমরা রাজশাহী থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ।\n\n৩. রিটার্ন করার পর ৩ কার্যদিবসের মধ্যে আপনার বিকাশ/রকেট/নগদ অথবা ব্যাংক অ্যাকাউন্টে টাকা রিফান্ড করা হবে।',
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

  // --- MongoDB Database Connection & Schema Config ---
  const MONGODB_URI = process.env.MONGODB_URI;
  let isMongoConnected = false;

  const productSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    stock: { type: Number, required: true },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5 },
    reviewsCount: { type: Number, default: 0 },
    sku: { type: String },
    sizes: { type: [String], default: [] },
    sizePrices: { type: Map, of: new Schema({ price: Number, originalPrice: Number }, { _id: false }) },
    reorderLevel: { type: Number, default: 5 },
    addedBy: { type: String },
    status: { type: String, default: "Active" },
    purchasePrice: { type: Number },
    badge: { type: String, default: "none" },
    tagline: { type: String },
    detailedTitle: { type: String },
    descriptionBullets: { type: [String], default: [] },
    manufacturer: { type: String },
    sourceArea: { type: String },
    shelfLife: { type: String },
    organicCertificate: { type: String },
    sellerId: { type: String },
    sellerName: { type: String },
    sellerProductStatus: { type: String, default: "approved" }
  }, { timestamps: true, toJSON: { flattenMaps: true }, toObject: { flattenMaps: true } });

  const categorySchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    icon: { type: String, required: true },
    showInNavbar: { type: Boolean, default: true }
  }, { timestamps: true });

  const siteConfigSchema = new Schema({
    key: { type: String, required: true, unique: true, default: "global" },
    config: { type: Schema.Types.Mixed, required: true }
  }, { timestamps: true });

  const orderSchema = new Schema({
    id: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    district: { type: String, required: true },
    area: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    bkashNumber: { type: String },
    trxId: { type: String },
    items: [{
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      image: { type: String, required: true },
      sellerId: { type: String }
    }],
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
    couponCode: { type: String },
    discountAmount: { type: Number }
  }, { timestamps: true });

  const userSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String },
    address: { type: String },
    district: { type: String },
    area: { type: String },
    dob: { type: String },
    gender: { type: String },
    createdAt: { type: String, required: true },
    status: { type: String, default: "active" },
    role: { type: String, default: "user" },
    permissions: { type: [String], default: [] },
    shopName: { type: String },
    shopLogo: { type: String },
    shopDescription: { type: String },
    facebookPage: { type: String },
    contactPhone: { type: String },
    sellerStatus: { type: String },
    paymentMethod: { type: String },
    paymentDetails: { type: String },
    balance: { type: Number, default: 0 }
  }, { timestamps: true });

  const withdrawSchema = new Schema({
    id: { type: String, required: true, unique: true },
    sellerId: { type: String, required: true },
    shopName: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    details: { type: String, required: true },
    createdAt: { type: String, required: true },
    status: { type: String, default: "pending" }
  }, { timestamps: true });

  const productRequestSchema = new Schema({
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productImage: { type: String },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    quantity: { type: String, required: true },
    createdAt: { type: String, required: true },
    status: { type: String, default: "pending" }
  }, { timestamps: true });

  const chatSessionSchema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    messages: [{
      id: { type: String, required: true },
      sender: { type: String, required: true },
      text: { type: String, required: true },
      timestamp: { type: String, required: true }
    }],
    lastUpdated: { type: String, required: true },
    unreadByAdmin: { type: Boolean, default: false }
  }, { timestamps: true });

  // Compile mongoose models
  const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);
  const CategoryModel = mongoose.models.Category || mongoose.model("Category", categorySchema);
  const SiteConfigModel = mongoose.models.SiteConfig || mongoose.model("SiteConfig", siteConfigSchema);
  const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
  const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
  const WithdrawModel = mongoose.models.Withdraw || mongoose.model("Withdraw", withdrawSchema);
  const ProductRequestModel = mongoose.models.ProductRequest || mongoose.model("ProductRequest", productRequestSchema);
  const ChatSessionModel = mongoose.models.ChatSession || mongoose.model("ChatSession", chatSessionSchema);

  // --- Database Initialization / Seeding ---
  async function seedDatabase() {
    try {
      console.log("Checking database seeds...");

      // Seed Products
      const prodCount = await ProductModel.countDocuments();
      if (prodCount === 0) {
        console.log("Seeding initial products to Mongo...");
        await ProductModel.insertMany(INITIAL_PRODUCTS as any);
      }

      // Seed Categories
      const catCount = await CategoryModel.countDocuments();
      if (catCount === 0) {
        console.log("Seeding categories to Mongo...");
        await CategoryModel.insertMany(CATEGORIES as any);
      }

      // Seed Config
      const configDoc = await SiteConfigModel.findOne({ key: "global" } as any);
      if (!configDoc) {
        console.log("Seeding default site config to Mongo...");
        await SiteConfigModel.create({ key: "global", config: DEFAULT_SITE_CONFIG } as any);
      }

      // Seed Users
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log("Seeding initial users to Mongo...");
        await UserModel.insertMany(INITIAL_USERS as any);
      } else {
        const adminUser = await UserModel.findOne({ role: "admin" } as any);
        if (!adminUser) {
          console.log("Seeding default admin user explicitly...");
          const defaultAdmin = INITIAL_USERS.find(u => u.role === "admin");
          if (defaultAdmin) {
            await UserModel.create(defaultAdmin as any);
          }
        }
      }

      // Seed Orders
      const orderCount = await OrderModel.countDocuments();
      if (orderCount === 0) {
        console.log("Seeding initial orders to Mongo...");
        await OrderModel.insertMany(SEEDED_ORDERS as any);
      }

      console.log("Seeding checks complete.");
    } catch (err) {
      console.error("Error during database seeding:", err);
    }
  }

  // Connect Mongo (Connected dynamically if MONGODB_URI is provided)
  if (MONGODB_URI) {
    console.log("Connecting to MongoDB...");
    mongoose.connect(MONGODB_URI)
      .then(() => {
        console.log("MongoDB connected successfully.");
        isMongoConnected = true;
        seedDatabase();
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        console.log("Falling back to server-side JSON files in `./db_fallback/` for permanent storage.");
        isMongoConnected = false;
      });
  } else {
    console.log("No MONGODB_URI found. Using server-side fallback JSON files in `./db_fallback/` for permanent storage.");
    isMongoConnected = false;
  }

  // --- Wrapper Functions to abstract DB interactions ---
  async function fetchProducts() {
    if (isMongoConnected) {
      try {
        const items = await ProductModel.find({} as any).sort({ createdAt: -1 } as any);
        if (items && items.length > 0) {
          return items.map(i => {
            const obj = i.toObject();
            if (obj.sizePrices) {
              if (obj.sizePrices instanceof Map) {
                obj.sizePrices = Object.fromEntries(obj.sizePrices);
              } else if (typeof obj.sizePrices.toJSON === "function") {
                obj.sizePrices = obj.sizePrices.toJSON();
              } else if (typeof obj.sizePrices.set === "function" || typeof obj.sizePrices.forEach === "function") {
                const plain: any = {};
                obj.sizePrices.forEach((val: any, key: string) => {
                  plain[key] = val;
                });
                obj.sizePrices = plain;
              }
            }
            return obj;
          });
        }
      } catch (e) {
        console.error("Mongo fetch products failed:", e);
      }
    }
    return getFallbackData("products", INITIAL_PRODUCTS);
  }

  async function saveProduct(product: any) {
    // Save to Fallback file
    const localList = getFallbackData<any[]>("products", INITIAL_PRODUCTS);
    const existingIdx = localList.findIndex(p => p.id === product.id);
    if (existingIdx > -1) {
      localList[existingIdx] = product;
    } else {
      localList.push(product);
    }
    saveFallbackData("products", localList);

    if (isMongoConnected) {
      try {
        const updateData = { ...product };
        const mongoId = product._id;
        delete updateData._id;
        delete updateData.__v;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        let updatedDoc = null;
        if (mongoId && mongoose.Types.ObjectId.isValid(mongoId)) {
          updatedDoc = await ProductModel.findByIdAndUpdate(
            mongoId,
            { $set: updateData },
            { new: true } as any
          );
        }

        if (!updatedDoc) {
          updatedDoc = await ProductModel.findOneAndUpdate(
            { id: product.id } as any,
            { $set: updateData } as any,
            { upsert: true, new: true } as any
          );
        }
      } catch (e) {
        console.error("Mongo save product failed:", e);
      }
    }
  }

  async function removeProduct(productId: string) {
    const localList = getFallbackData<any[]>("products", INITIAL_PRODUCTS);
    const updated = localList.filter(p => p.id !== productId);
    saveFallbackData("products", updated);

    if (isMongoConnected) {
      try {
        await ProductModel.deleteOne({ id: productId } as any);
      } catch (e) {
        console.error("Mongo delete product failed:", e);
      }
    }
  }

  async function fetchCategories() {
    if (isMongoConnected) {
      try {
        const items = await CategoryModel.find({} as any).sort({ id: 1 } as any);
        if (items && items.length > 0) return items.map(i => i.toObject());
      } catch (e) {
        console.error("Mongo fetch categories failed:", e);
      }
    }
    return getFallbackData("categories", CATEGORIES);
  }

  async function saveCategories(categoriesList: any[]) {
    saveFallbackData("categories", categoriesList);
    if (isMongoConnected) {
      try {
        await CategoryModel.deleteMany({} as any);
        await CategoryModel.insertMany(categoriesList as any);
      } catch (e) {
        console.error("Mongo save categories failed:", e);
      }
    }
  }

  async function fetchSiteConfig() {
    if (isMongoConnected) {
      try {
        const doc = await SiteConfigModel.findOne({ key: "global" } as any);
        if (doc && doc.config) return doc.config;
      } catch (e) {
        console.error("Mongo fetch siteConfig failed:", e);
      }
    }
    return getFallbackData("site_config", DEFAULT_SITE_CONFIG);
  }

  async function saveSiteConfig(config: any) {
    saveFallbackData("site_config", config);
    if (isMongoConnected) {
      try {
        await SiteConfigModel.findOneAndUpdate({ key: "global" } as any, { config } as any, { upsert: true } as any);
      } catch (e) {
        console.error("Mongo save siteConfig failed:", e);
      }
    }
  }

  async function fetchOrders() {
    if (isMongoConnected) {
      try {
        const items = await OrderModel.find({} as any).sort({ createdAt: -1 } as any);
        return items.map(i => i.toObject());
      } catch (e) {
        console.error("Mongo fetch orders failed:", e);
      }
    }
    return getFallbackData("orders", SEEDED_ORDERS);
  }

  async function saveOrder(order: any) {
    const localList = getFallbackData<any[]>("orders", SEEDED_ORDERS);
    const existingIdx = localList.findIndex(o => o.id === order.id);
    if (existingIdx > -1) {
      localList[existingIdx] = order;
    } else {
      localList.unshift(order);
    }
    saveFallbackData("orders", localList);

    if (isMongoConnected) {
      try {
        const updateData = { ...order };
        delete updateData._id;
        delete updateData.__v;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        await OrderModel.findOneAndUpdate(
          { id: order.id } as any,
          { $set: updateData } as any,
          { upsert: true, new: true } as any
        );
      } catch (e) {
        console.error("Mongo save order failed:", e);
      }
    }
  }

  async function removeOrder(orderId: string) {
    const localList = getFallbackData<any[]>("orders", SEEDED_ORDERS);
    const updated = localList.filter(o => o.id !== orderId);
    saveFallbackData("orders", updated);

    if (isMongoConnected) {
      try {
        await OrderModel.deleteOne({ id: orderId } as any);
      } catch (e) {
        console.error("Mongo delete order failed:", e);
      }
    }
  }

  async function fetchUsers() {
    if (isMongoConnected) {
      try {
        const items = await UserModel.find({} as any).sort({ createdAt: -1 } as any);
        if (items && items.length > 0) return items.map(i => i.toObject());
      } catch (e) {
        console.error("Mongo fetch users failed:", e);
      }
    }
    return getFallbackData("users", INITIAL_USERS);
  }

  async function saveUser(user: any) {
    const localList = getFallbackData<any[]>("users", INITIAL_USERS);
    const existingIdx = localList.findIndex(u => u.id === user.id);
    if (existingIdx > -1) {
      localList[existingIdx] = user;
    } else {
      localList.push(user);
    }
    saveFallbackData("users", localList);

    if (isMongoConnected) {
      try {
        const updateData = { ...user };
        delete updateData._id;
        delete updateData.__v;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        await UserModel.findOneAndUpdate(
          { id: user.id } as any,
          { $set: updateData } as any,
          { upsert: true, new: true } as any
        );
      } catch (e) {
        console.error("Mongo save user failed:", e);
      }
    }
  }

  async function removeUser(userId: string) {
    const localList = getFallbackData<any[]>("users", INITIAL_USERS);
    const updated = localList.filter(u => u.id !== userId);
    saveFallbackData("users", updated);

    if (isMongoConnected) {
      try {
        await UserModel.deleteOne({ id: userId } as any);
      } catch (e) {
        console.error("Mongo delete user failed:", e);
      }
    }
  }

  async function fetchWithdrawRequests() {
    if (isMongoConnected) {
      try {
        const items = await WithdrawModel.find({} as any).sort({ createdAt: -1 } as any);
        return items.map(i => i.toObject());
      } catch (e) {
        console.error("Mongo fetch withdraw requests failed:", e);
      }
    }
    return getFallbackData("withdraw_requests", []);
  }

  async function saveWithdrawRequest(req: any) {
    const localList = getFallbackData<any[]>("withdraw_requests", []);
    const existingIdx = localList.findIndex(w => w.id === req.id);
    if (existingIdx > -1) {
      localList[existingIdx] = req;
    } else {
      localList.unshift(req);
    }
    saveFallbackData("withdraw_requests", localList);

    if (isMongoConnected) {
      try {
        const updateData = { ...req };
        delete updateData._id;
        delete updateData.__v;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        await WithdrawModel.findOneAndUpdate(
          { id: req.id } as any,
          { $set: updateData } as any,
          { upsert: true, new: true } as any
        );
      } catch (e) {
        console.error("Mongo save withdraw failed:", e);
      }
    }
  }

  async function fetchProductRequests() {
    if (isMongoConnected) {
      try {
        const items = await ProductRequestModel.find({} as any).sort({ createdAt: -1 } as any);
        return items.map(i => i.toObject());
      } catch (e) {
        console.error("Mongo fetch product requests failed:", e);
      }
    }
    return getFallbackData("product_requests", []);
  }

  async function saveProductRequest(req: any) {
    const localList = getFallbackData<any[]>("product_requests", []);
    const existingIdx = localList.findIndex(r => r.id === req.id);
    if (existingIdx > -1) {
      localList[existingIdx] = req;
    } else {
      localList.unshift(req);
    }
    saveFallbackData("product_requests", localList);

    if (isMongoConnected) {
      try {
        const updateData = { ...req };
        delete updateData._id;
        delete updateData.__v;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        await ProductRequestModel.findOneAndUpdate(
          { id: req.id } as any,
          { $set: updateData } as any,
          { upsert: true, new: true } as any
        );
      } catch (e) {
        console.error("Mongo save product request failed:", e);
      }
    }
  }

  async function removeProductRequest(reqId: string) {
    const localList = getFallbackData<any[]>("product_requests", []);
    const updated = localList.filter(r => r.id !== reqId);
    saveFallbackData("product_requests", updated);

    if (isMongoConnected) {
      try {
        await ProductRequestModel.deleteOne({ id: reqId } as any);
      } catch (e) {
        console.error("Mongo delete product request failed:", e);
      }
    }
  }

  // --- DB-Backed Chat Session Syncing ---
  async function fetchChatSessions() {
    if (isMongoConnected) {
      try {
        const docs = await ChatSessionModel.find({} as any);
        const chatMap: Record<string, any> = {};
        docs.forEach(d => {
          chatMap[d.sessionId] = d.toObject();
        });
        return chatMap;
      } catch (e) {
        console.error("Mongo fetch chats failed:", e);
      }
    }
    return getFallbackData<Record<string, any>>("chat_sessions", {});
  }

  async function saveChatSession(session: any) {
    const sessions = await fetchChatSessions();
    sessions[session.sessionId] = session;
    saveFallbackData("chat_sessions", sessions);

    if (isMongoConnected) {
      try {
        const updateData = { ...session };
        delete updateData._id;
        delete updateData.__v;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        await ChatSessionModel.findOneAndUpdate(
          { sessionId: session.sessionId } as any,
          { $set: updateData } as any,
          { upsert: true } as any
        );
      } catch (e) {
        console.error("Mongo save chat failed:", e);
      }
    }
  }

  // --- API Routes ---

  // Health and connection check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      database: isMongoConnected ? "MongoDB Atlas" : "Persistent Server Files"
    });
  });

  // Main system initialization bundle
  app.get("/api/init", async (req, res) => {
    try {
      // Avoid caching by setting express headers
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const [products, categories, siteConfig, orders, users, withdrawRequests, productRequests] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchSiteConfig(),
        fetchOrders(),
        fetchUsers(),
        fetchWithdrawRequests(),
        fetchProductRequests()
      ]);

      res.json({
        products,
        categories,
        siteConfig,
        orders,
        users,
        withdrawRequests,
        productRequests
      });
    } catch (err) {
      console.error("Error during initial payload fetch:", err);
      res.status(500).json({ error: "Failed to initialize website data" });
    }
  });

  // --- Products Endpoints ---
  app.post("/api/products", upload.single("image"), async (req, res) => {
    try {
      const product = parseProductFields(req.body, req.file);
      if (!product.id) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      await saveProduct(product);
      res.json({ success: true, product });
    } catch (err) {
      console.error("Error creating/updating product:", err);
      res.status(500).json({ error: "Failed to create/update product" });
    }
  });

  app.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      const product = parseProductFields(req.body, req.file);
      product.id = req.params.id;
      await saveProduct(product);
      res.json({ success: true, product });
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await removeProduct(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // --- Categories Endpoints ---
  app.post("/api/categories", async (req, res) => {
    try {
      const categoriesList = req.body;
      if (!Array.isArray(categoriesList)) {
        return res.status(400).json({ error: "Body must be an array of categories" });
      }
      await saveCategories(categoriesList);
      res.json({ success: true, categories: categoriesList });
    } catch (err) {
      res.status(500).json({ error: "Failed to save categories" });
    }
  });

  // --- Site Config Endpoints ---
  app.post("/api/site-config", async (req, res) => {
    try {
      const config = req.body;
      await saveSiteConfig(config);
      res.json({ success: true, siteConfig: config });
    } catch (err) {
      res.status(500).json({ error: "Failed to save site config" });
    }
  });

  // --- Orders Endpoints ---
  app.post("/api/orders", async (req, res) => {
    try {
      const order = req.body;
      if (!order.id) {
        return res.status(400).json({ error: "Order ID is required" });
      }
      await saveOrder(order);
      res.json({ success: true, order });
    } catch (err) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const order = req.body;
      order.id = req.params.id;
      await saveOrder(order);
      res.json({ success: true, order });
    } catch (err) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await removeOrder(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // --- Users Endpoints ---
  app.post("/api/users", async (req, res) => {
    try {
      const user = req.body;
      if (!user.id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      await saveUser(user);
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ error: "Failed to save user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const user = req.body;
      user.id = req.params.id;
      await saveUser(user);
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await removeUser(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // --- Withdraw Requests Endpoints ---
  app.post("/api/withdraw-requests", async (req, res) => {
    try {
      const request = req.body;
      if (!request.id) {
        return res.status(400).json({ error: "Request ID is required" });
      }
      await saveWithdrawRequest(request);
      res.json({ success: true, withdrawRequest: request });
    } catch (err) {
      res.status(500).json({ error: "Failed to save withdraw request" });
    }
  });

  app.put("/api/withdraw-requests/:id", async (req, res) => {
    try {
      const request = req.body;
      request.id = req.params.id;
      await saveWithdrawRequest(request);
      res.json({ success: true, withdrawRequest: request });
    } catch (err) {
      res.status(500).json({ error: "Failed to update withdraw request" });
    }
  });

  // --- Product Requests Endpoints ---
  app.post("/api/product-requests", async (req, res) => {
    try {
      const request = req.body;
      if (!request.id) {
        return res.status(400).json({ error: "Request ID is required" });
      }
      await saveProductRequest(request);
      res.json({ success: true, productRequest: request });
    } catch (err) {
      res.status(500).json({ error: "Failed to save product request" });
    }
  });

  app.put("/api/product-requests/:id", async (req, res) => {
    try {
      const request = req.body;
      request.id = req.params.id;
      await saveProductRequest(request);
      res.json({ success: true, productRequest: request });
    } catch (err) {
      res.status(500).json({ error: "Failed to update product request" });
    }
  });

  app.delete("/api/product-requests/:id", async (req, res) => {
    try {
      await removeProductRequest(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product request" });
    }
  });

  // --- Chat Sync API ---
  app.get("/api/chat/sync", async (req, res) => {
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }
    const sessions = await fetchChatSessions();
    const session = sessions[sessionId];
    if (!session) {
      return res.json({ messages: [] });
    }
    res.json({ messages: session.messages });
  });

  app.get("/api/admin/chats", async (req, res) => {
    const sessions = await fetchChatSessions();
    const chatList = Object.values(sessions).sort(
      (a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
    res.json(chatList);
  });

  app.post("/api/admin/chats/reply", async (req, res) => {
    const { sessionId, text } = req.body;
    if (!sessionId || !text) {
      return res.status(400).json({ error: "sessionId and text are required" });
    }
    const sessions = await fetchChatSessions();
    const session = sessions[sessionId];
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const adminMsg = {
      id: Math.random().toString(36).substring(7),
      sender: "admin",
      text,
      timestamp: new Date().toISOString(),
    };

    session.messages.push(adminMsg);
    session.lastUpdated = new Date().toISOString();
    session.unreadByAdmin = false;

    await saveChatSession(session);
    res.json({ success: true, message: adminMsg });
  });

  app.post("/api/admin/chats/read", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }
    const sessions = await fetchChatSessions();
    const session = sessions[sessionId];
    if (session) {
      session.unreadByAdmin = false;
      await saveChatSession(session);
    }
    res.json({ success: true });
  });

  // AI Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId, customerName, siteConfig, products, image, imageMimeType } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const activeSessionId = sessionId || "default-session";
      const activeCustomerName = customerName || `কাস্টমার #${activeSessionId.substring(0, 5)}`;

      const storeName = siteConfig?.storeName || "ম্যাংগো লাভার";
      const contactPhone = siteConfig?.contactPhone || "+880 1301-636461";
      const contactOffice = siteConfig?.contactOffice || "Nowhata, Paba, Rajshahi, Bangladesh, 6213";
      const contactEmail = siteConfig?.contactEmail || "info@mangolover.com.bd";

      const fallbackReply = `আসসালামু আলাইকুম! আমাদের সাথে যোগাযোগের জন্য ধন্যবাদ। আমাদের একজন প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন। জরুরী প্রয়োজনে আমাদের কাস্টমার কেয়ার নম্বরে কল করুন: ${contactPhone}।`;

      const sessions = await fetchChatSessions();

      if (!sessions[activeSessionId]) {
        sessions[activeSessionId] = {
          sessionId: activeSessionId,
          customerName: activeCustomerName,
          messages: [
            {
              id: "welcome",
              sender: "bot",
              text: `আসসালামু আলাইকুম! ${storeName}-এ আপনাকে স্বাগতম। আমি আপনার এআই সহকারী। রাজশাহীর আমবাগান থেকে সরাসরি আম, মধু, ঘি, খেজুর সহ যেকোনো পণ্য, আমাদের শপ বা ডেলিভারি চার্জ সম্পর্কে যেকোনো প্রশ্ন করতে পারেন!`,
              timestamp: new Date().toISOString(),
            }
          ],
          lastUpdated: new Date().toISOString(),
          unreadByAdmin: false,
        };
      }

      const session = sessions[activeSessionId];

      const userMsg = {
        id: Math.random().toString(36).substring(7),
        sender: "user",
        text: message,
        timestamp: new Date().toISOString(),
      };
      session.messages.push(userMsg);
      session.lastUpdated = new Date().toISOString();
      session.unreadByAdmin = true;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        let replyText = "";
        const cleanMsg = message.toLowerCase();
        
        const isGeneralProductsInquiry = cleanMsg.includes("পণ্য") || cleanMsg.includes("প্রোডাক্ট") || cleanMsg.includes("আইটেম") || cleanMsg.includes("খাবার") || cleanMsg.includes("আছে কি") ||
          cleanMsg.includes("ponno") || cleanMsg.includes("purno") || cleanMsg.includes("product") || cleanMsg.includes("poduct") || cleanMsg.includes("item") || cleanMsg.includes("khabar") ||
          (cleanMsg.includes("কি কি") && !(cleanMsg.includes("আম") || cleanMsg.includes("মধু") || cleanMsg.includes("ঘি") || cleanMsg.includes("তেল") || cleanMsg.includes("খেজুর") || cleanMsg.includes("সেমাই") || cleanMsg.includes("চিনি") || cleanMsg.includes("গুড়")));

        const isPriceInquiry = cleanMsg.includes("দাম") || cleanMsg.includes("প্রাইস") || cleanMsg.includes("টাকা") || cleanMsg.includes("কত");
        const isDeliveryInquiry = cleanMsg.includes("ডেলিভারি") || cleanMsg.includes("চার্জ");
        const isContactInquiry = cleanMsg.includes("ঠিকানা") || cleanMsg.includes("অফিস") || cleanMsg.includes("যোগাযোগ") || cleanMsg.includes("ফোন") || cleanMsg.includes("কল");
        const isRefundInquiry = cleanMsg.includes("রিফান্ড") || cleanMsg.includes("ফেরত") || cleanMsg.includes("রিটার্ন");
        const isAboutInquiry = cleanMsg.includes("সম্পর্কে") || cleanMsg.includes("শপ") || cleanMsg.includes("ম্যাংগো লাভার");
        const isGreetingInquiry = cleanMsg.includes("হ্যালো") || cleanMsg.includes("hello") || cleanMsg.includes("hi") || cleanMsg.includes("হাই") || cleanMsg.includes("কেমন আছেন") || cleanMsg.includes("সালাম") || cleanMsg.includes("আসসালামু আলাইকুম");

        const fallbackProductsList = Array.isArray(products) ? products : await fetchProducts();
        let matchedCategoryKeyword = "";
        let matchedCategoryLabel = "";
        const catMap: Record<string, string[]> = {
          "আম": ["আম", "aam", "mango"],
          "মধু": ["মধু", "modhu", "honey"],
          "ঘি": ["ঘি", "ghee", "ghi"],
          "তেল": ["তেল", "oil", "tel"],
          "খেজুর": ["খেজুর", "date", "khejur"],
          "সেমাই": ["সেমাই", "semai"],
          "চিনি": ["চিনি", "chini", "sugar"],
          "গুড়": ["গুড়", "gur", "jaggery"]
        };
        for (const [label, keys] of Object.entries(catMap)) {
          if (keys.some(k => cleanMsg.includes(k))) {
            matchedCategoryKeyword = keys[0];
            matchedCategoryLabel = label;
            break;
          }
        }

        if (isGeneralProductsInquiry) {
          if (fallbackProductsList.length > 0) {
            const grouped: Record<string, any[]> = {};
            fallbackProductsList.forEach(p => {
              if (!grouped[p.category]) grouped[p.category] = [];
              grouped[p.category].push(p);
            });

            replyText = `আসসালামু আলাইকুম! আমাদের ${storeName}-এ চমৎকার সব অর্গানিক ও ফ্রেশ খাবার পাওয়া যায়। আমাদের বর্তমান প্রোডাক্ট লিস্ট নিচে দেওয়া হলো:\n\n`;
            for (const [catName, prodList] of Object.entries(grouped)) {
              replyText += `📁 **${catName}**:\n`;
              prodList.forEach(p => {
                replyText += `  - ✨ **${p.name}**\n`;
              });
              replyText += `\n`;
            }
            replyText += `\nআপনি আমাদের কোন পণ্যটি সম্পর্কে জানতে আগ্রহী? অনুগ্রহ করে জানালে আমি আপনাকে পুষ্টিগুণ সহ বিস্তারিত তথ্য দিতে পারব!`;
          } else {
            replyText = `আসসালামু আলাইকুম! আমাদের ${storeName}-এ চমৎকার সব অর্গানিক ও ফ্রেশ আম, মধু, ঘি, তেল, খেজুর এবং সেমাই পাওয়া যায়। আপনি নির্দিষ্ট কোনো ক্যাটাগরি বা পণ্যের উপকারিতা সম্পর্কে জানতে চাইলে আমাকে বলতে পারেন!`;
          }
        } 
        else if (isPriceInquiry) {
          let foundProduct = null;
          if (fallbackProductsList.length > 0) {
            for (const p of fallbackProductsList) {
              const cleanProdName = p.name.toLowerCase();
              if (cleanMsg.includes(cleanProdName) || cleanProdName.split(" ").some(word => word.length > 2 && cleanMsg.includes(word))) {
                foundProduct = p;
                break;
              }
            }
          }
          
          if (foundProduct) {
            replyText = `আমাদের **${foundProduct.name}** রাজশাহীর ঐতিহ্যবাহী বাগান থেকে সরাসরি সংগ্রহ করা হয়। এটি অত্যন্ত সুস্বাদু ও পুষ্টিকর। \n\n💰 এর বর্তমান মূল্য: **${foundProduct.price} টাকা** (${foundProduct.unit || "১ কেজি"})।\n\nআপনি কি এটি অর্ডার করতে চান?`;
          } else if (matchedCategoryKeyword) {
            const matchedProducts = fallbackProductsList.filter(p => p.category.toLowerCase().includes(matchedCategoryKeyword) || p.name.toLowerCase().includes(matchedCategoryKeyword) || p.category.includes(matchedCategoryLabel) || p.name.includes(matchedCategoryLabel));
            if (matchedProducts.length > 0) {
              replyText = `আমাদের কাছে অত্যন্ত সুস্বাদু ও পুষ্টিকর **${matchedCategoryLabel}** আইটেমগুলো পাওয়া যাচ্ছে। এগুলোর অফার মূল্য নিচে দেওয়া হলো:\n\n` +
                matchedProducts.map(p => `✨ **${p.name}** (${p.unit || "১টি"}): **${p.price} টাকা**`).join("\n") +
                `\n\nআপনি কি সরাসরি অর্ডার করতে চান?`;
            } else {
              replyText = `আমাদের কাছে বর্তমানে এই মুহূর্তে কোনো ${matchedCategoryLabel} স্টক নেই। তবে খুব শীঘ্রই স্টক চলে আসবে ইনশাআল্লাহ।`;
            }
          } else {
            const featuredList = fallbackProductsList.slice(0, 4);
            if (featuredList.length > 0) {
              replyText = `আমাদের রাজশাহীর নিজস্ব বাগান এবং বিশ্বস্ত উৎস থেকে সংগৃহীত সেরা পণ্যগুলোর দাম ও অফার নিচে দেওয়া হলো:\n\n` +
                featuredList.map(p => `✨ **${p.name}** (${p.unit || "১টি"}): **${p.price} টাকা**`).join("\n") +
                `\n\nআপনি নির্দিষ্ট কোনো পণ্যটির দাম জানতে চাচ্ছেন, অনুগ্রহ করে পণ্যটির নাম বলুন!`;
            } else {
              replyText = `আপনি কি আমাদের কোনো নির্দিষ্ট পণ্যের দাম জানতে চাচ্ছেন? অনুগ্রহ করে নির্দিষ্ট পণ্যটির সঠিক নাম বলুন (যেমন: "খাঁটি গাওয়া ঘি এর দাম কত?"), আমি আপনাকে সঠিক দামটি জানিয়ে দেব।`;
            }
          }
        }
        else if (matchedCategoryKeyword) {
          const matchedProducts = fallbackProductsList.filter(p => p.category.toLowerCase().includes(matchedCategoryKeyword) || p.name.toLowerCase().includes(matchedCategoryKeyword) || p.category.includes(matchedCategoryLabel) || p.name.includes(matchedCategoryLabel));
          if (matchedProducts.length > 0) {
            replyText = `আমাদের স্পেশাল **${matchedCategoryLabel}** আইটেমগুলো রাজশাহীর বাগান থেকে সরাসরি তাজা সংগ্রহ করা হয়। এগুলো অত্যন্ত সুস্বাদু এবং শতভাগ নিরাপদ:\n\n` +
              matchedProducts.map(p => `✨ **${p.name}**`).join("\n") +
              `\n\nআপনি কি এগুলোর পুষ্টিগুণ বা উপকারিতা সম্পর্কে জানতে চান? অনুগ্রহ করে বলুন!`;
          } else {
            replyText = `আমাদের কাছে বর্তমানে এই মুহূর্তে কোনো ${matchedCategoryLabel} স্টক নেই। তবে খুব শীঘ্রই স্টক চলে আসবে ইনশাআল্লাহ।`;
          }
        } 
        else if (isDeliveryInquiry) {
          replyText = `আমরা সরাসরি রাজশাহী থেকে শতভাগ খাঁটি ও নিরাপদ পণ্য পাঠাই। পরিবহণকালীন যেকোনো ক্ষয়ক্ষতিতির জন্য আমরা ১০০% দায়বদ্ধ। ডেলিভারির সময় আপনি পণ্য দেখে বুঝে নিতে পারবেন।`;
        } else if (isContactInquiry) {
          replyText = `আমাদের যোগাযোগের ঠিকানা:\n📍 ঠিকানা: ${contactOffice}\n📞 ফোন নম্বর: ${contactPhone}\n✉️ ইমেইল: ${contactEmail}`;
        } else if (isRefundInquiry) {
          replyText = siteConfig?.refundPolicyText || `আমরা রাজশাহী থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ। ডেলিভারির সময় পণ্য দেখে নিতে পারবেন।`;
        } else if (isAboutInquiry) {
          replyText = `${storeName} - ${siteConfig?.storeSlogan || "শতভাগ খাঁটি ও নিরাপদ অর্গানিক ফুড"}। ${siteConfig?.aboutTitle || "আমাদের সম্পর্কে"}: ${siteConfig?.aboutHighlightText || ""} ${siteConfig?.aboutParagraph1 || ""}`;
        } else if (isGreetingInquiry) {
          replyText = `আসসালামু আলাইকুম! ${storeName} সহকারী হিসেবে আপনাকে স্বাগত জানাচ্ছি। রাজশাহীর আম ও অন্যান্য সুস্বাদু পণ্য, ডেলিভারি চার্জ বা যেকোনো কিছু সম্পর্কে জানতে আমাকে প্রশ্ন করতে পারেন!`;
        } else {
          replyText = fallbackReply;
        }

        const botMsg = {
          id: Math.random().toString(36).substring(7),
          sender: "bot",
          text: replyText,
          timestamp: new Date().toISOString(),
        };
        session.messages.push(botMsg);
        session.lastUpdated = new Date().toISOString();
        await saveChatSession(session);
        return res.json({ reply: replyText });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const currentProductsList = await fetchProducts();

      const sysInstruction = `
You are the official AI Live Chat Assistant of the online shop "${storeName}". 
Your name is "Mango Lover Assistant". You must converse politely, warm, and strictly in Bengali.

CRITICAL INSTRUCTION ON USER INPUTS:
- The user may type their message in standard Bengali script OR in Banglish (Bengali written with the English alphabet, e.g., "apnadr thikana ki?", "dam koto?", "delivery fee koto?", "khejur ache?").
- You must perfectly comprehend and understand their Banglish messages as if they were written in pure Bengali.
- Keep your replies polite, warm, helpful, and written in elegant, readable Bengali (standard script), formatted with bullet points and friendly emojis.

Here is the current, up-to-date information of the website:
---
Store Name: ${storeName}
Slogan: ${siteConfig?.storeSlogan || "শতভাগ খাঁটি ও নিরাপদ অর্গানিক ফুড"}
About Us Section:
- Title: ${siteConfig?.aboutTitle || "আমাদের সম্পর্কে?"}
- Subtitle: ${siteConfig?.aboutSubtitle || ""}
- Story: ${siteConfig?.aboutParagraph1 || ""} ${siteConfig?.aboutParagraph2 || ""}

Contact Details:
- Address: ${contactOffice}
- Phone Number: ${contactPhone}
- Email: ${contactEmail}

Policies:
- Refund & Return Policy: ${siteConfig?.refundPolicyText || "আমরা রাজশাহী থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ।"}

Available Products in Store:
${
  Array.isArray(currentProductsList)
    ? currentProductsList
        .map(
          (p) =>
            `- Product Name: "${p.name}", Category is "${p.category}", Main Price is ${p.price} BDT (Sizes/Weight Options: ${
              p.sizes?.join(", ") || "None"
            }), Description: ${p.description || "N/A"}`
        )
        .join("\n")
    : "No products currently listed."
}
---

CRITICAL PRODUCT PRESENTATION & RESPONSE RULES:
1. Do NOT mention product prices unless explicitly asked.
2. If and only if the user asks for prices, provide BDT/টাকা clearly.
3. Our main location is Rajshahi (রাজশাহী), NOT Satkhira (সাতক্ষীরা).
4. Speak strictly in polite, warm, and professional Bengali (বাংলা).
`;

      const contents = [];
      const contextMessages = session.messages.slice(-8);
      for (const msg of contextMessages) {
        if (msg.id === "welcome") continue;
        if (msg.sender === "user") {
          contents.push({
            role: "user",
            parts: [{ text: msg.text }],
          });
        } else {
          contents.push({
            role: "model",
            parts: [{ text: msg.text }],
          });
        }
      }

      const lastContent = contents[contents.length - 1];
      if (!lastContent || lastContent.role !== "user" || lastContent.parts[0].text !== message) {
        const parts: any[] = [{ text: message }];
        if (image && imageMimeType) {
          const base64Data = image.includes(",") ? image.split(",")[1] : image;
          parts.push({
            inlineData: {
              mimeType: imageMimeType,
              data: base64Data,
            },
          });
        }
        contents.push({
          role: "user",
          parts: parts,
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.2,
        },
      });

      const replyText = response.text || fallbackReply;

      const botMsg = {
        id: Math.random().toString(36).substring(7),
        sender: "bot",
        text: replyText,
        timestamp: new Date().toISOString(),
      };
      session.messages.push(botMsg);
      session.lastUpdated = new Date().toISOString();

      await saveChatSession(session);

      return res.json({ reply: replyText });

    } catch (error) {
      console.error("Chat error:", error);
      const contactPhone = req.body?.siteConfig?.contactPhone || "+880 1301-636461";
      const fallbackReply = `আসসালামু আলাইকুম! আমাদের সাথে যোগাযোগের জন্য ধন্যবাদ। জরুরী প্রয়োজনে আমাদের কাস্টমার কেয়ার নম্বরে কল করুন: ${contactPhone}।`;
      return res.json({ reply: fallbackReply });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
