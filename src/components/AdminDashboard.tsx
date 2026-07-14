/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Order, OrderStatus, SiteConfig, ProductRequest, User, Coupon, Category, matchesSearchWithNumerals, sortProductSizes, WithdrawRequest } from '../types';
import { DISTRICTS } from '../data';
import { 
  Plus, Edit, Trash2, Check, Copy, X, ShieldAlert, DollarSign, CreditCard,
  Package, ShoppingCart, TrendingUp, Search, Eye, Filter, RefreshCw,
  Image as ImageIcon, Palette, Sliders, Volume2, Upload, MessageSquare, Printer,
  Users, Key, Shield, ShieldCheck, Mail, Phone, MapPin, UserCheck, Share2, Facebook, Instagram, Youtube, HelpCircle, ChevronDown, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESET_IMAGES = [
  { name: 'আখের জুস পাউডার', path: '/src/assets/images/juice_powder_1782456192648.jpg' },
  { name: 'আখের দানাদার ঝোলা গুড়', path: '/src/assets/images/akher_gur_1782456206623.jpg' },
  { name: 'আমসত্ত্বের আচার', path: '/src/assets/images/amsotto_achar_1782456219512.jpg' },
  { name: 'খাঁটি গাওয়া ঘি', path: '/src/assets/images/gawa_ghee_1782456236375.jpg' },
  { name: 'খাঁটি সরিষার তেল', path: '/src/assets/images/mustard_oil_1782456250479.jpg' },
  { name: 'ঘিয়ে ভাজা লাচ্ছা সেমাই', path: '/src/assets/images/laccha_semai_1782456263350.jpg' },
  { name: 'কালোজিরা ফুলের মধু', path: '/src/assets/images/kalojira_honey_1782465866977.jpg' },
  { name: 'লিচু ফুলের মধু', path: '/src/assets/images/lychee_honey_1782465883260.jpg' },
  { name: 'সরিষা ফুলের মধু', path: '/src/assets/images/mustard_honey_1782465897931.jpg' },
  { name: 'সুন্দরবনের চাকের মধু', path: '/src/assets/images/sundarban_honey_1782465914163.jpg' },
  { name: 'সুন্দরবনের মধু বোতল', path: '/src/assets/images/sundarban_honey_jar_1782453470122.jpg' },
  { name: 'আম্রপালি আম', path: '/src/assets/images/green_mangoes_1_1782466276525.jpg' },
  { name: 'আমবাগান চাষী', path: '/src/assets/images/mango_farmer_orchard_1782453455911.jpg' },
  { name: 'ম্যাংগো লাভার লোগো', path: '/src/assets/images/mango_lover_logo_1782453485561.jpg' },
];

const compressAndSetImage = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Limit to max 800px width/height to make it extremely fast and lightweight for localStorage
      const MAX_SIZE = 800;
      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG with 0.7 quality (typically generates 30KB - 80KB size)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
      } else {
        callback(event.target?.result as string);
      }
    };
  };
  reader.onerror = (err) => {
    console.error("Error reading file:", err);
  };
  reader.readAsDataURL(file);
};

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  productRequests: ProductRequest[];
  siteConfig: SiteConfig;
  onAddProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateSiteConfig: (config: SiteConfig) => void;
  onClose: () => void;
  onUpdateProductRequestStatus: (id: string, status: 'pending' | 'completed' | 'contacted') => void;
  onDeleteProductRequest: (id: string) => void;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
  users: User[];
  onUpdateUser: (updatedUser: User) => void;
  onAddUser: (newUser: User) => void;
  onDeleteUser: (userId: string) => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  onAddOrder?: (order: Order) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  loggedInUser?: User | null;
  withdrawRequests?: WithdrawRequest[];
  onUpdateWithdrawRequest?: (id: string, status: 'pending' | 'completed' | 'rejected') => void;
  initialTab?: 'overview' | 'products' | 'orders' | 'marketing' | 'chats' | 'payments' | 'requests' | 'users' | 'sellers';
}

export const AVAILABLE_PERMISSIONS = [
  { id: 'overview', name: 'ড্যাশবোর্ড ওভারভিউ', desc: 'আয়, বিক্রয় গ্রাফ ও ড্যাশবোর্ড ওভারভিউ দেখার এক্সেস।' },
  { id: 'products', name: 'পণ্য ব্যবস্থাপনা', desc: 'নতুন পণ্য যোগ, এডিটিং, ডিলিট এবং ক্যাটাগরি ও স্টক পরিবর্তনের এক্সেস।' },
  { id: 'orders', name: 'অর্ডার ব্যবস্থাপনা', desc: 'অর্ডার লিস্ট দেখা, ডেলিভারি স্ট্যাটাস পরিবর্তন এবং অর্ডার প্রসেসিংয়ের এক্সেস।' },
  { id: 'payments', name: 'পেমেন্ট ভেরিফিকেশন', desc: 'ম্যানুয়াল পেমেন্ট (বিকাশ/নগদ/রকেট) ট্রানজেকশন অ্যাপ্রুভাল ও ভেরিফিকেশনের এক্সেস।' },
  { id: 'marketing', name: 'মার্কেটিং ও নোটিশ', desc: 'স্ক্রলিং নোটিশ টিকেট, ডিসকাউন্ট কুপন কোড এবং ব্যানার পরিবর্তনের এক্সেস।' },
  { id: 'requests', name: 'গ্রাহক রিকুয়েস্ট', desc: 'স্টক-আউট পণ্য সমূহের জন্য কাস্টমার রিকুয়েস্ট তালিকা ও যোগাযোগের স্ট্যাটাস এক্সেস।' },
  { id: 'users', name: 'ইউজার ও নিরাপত্তা', desc: 'গ্রাহক বা অ্যাডমিনদের তথ্য, পাসওয়ার্ড পরিবর্তন, ব্লক এবং পারমিশন অ্যাসাইনমেন্টের এক্সেস।' },
];

const toEnglishWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  };

  let number = Math.floor(num);
  let result = '';

  const crore = Math.floor(number / 10000000);
  number %= 10000000;
  if (crore > 0) result += convertLessThanThousand(crore) + 'Crore ';

  const lakh = Math.floor(number / 100000);
  number %= 100000;
  if (lakh > 0) result += convertLessThanThousand(lakh) + 'Lakh ';

  const thousand = Math.floor(number / 1000);
  number %= 1000;
  if (thousand > 0) result += convertLessThanThousand(thousand) + 'Thousand ';

  if (number > 0) result += convertLessThanThousand(number);

  return result.trim();
};

const toBengaliWords = (num: number): string => {
  if (num === 0) return 'শূন্য';
  
  const singleDigits = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const banglaNumbers = [
    '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
    'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
    'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'উনত্রিশ', 'ত্রিশ',
    'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাতাশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
    'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চৌয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
    'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চৌয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
    'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
    'একাত্তর', 'বাহাত্তর', 'তেহাত্তর', 'চৌহাত্তর', 'পঁচাত্তর', 'ছেয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
    'একাশি', 'বিরাশি', 'তেরাশি', 'চৌরাশি', 'পঁচাশি', 'ছেঁড়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই', 'নব্বই',
    'একানব্বই', 'বিরানব্বই', 'তেরানব্বই', 'চৌরানব্বই', 'পঁচানব্বই', 'ছেয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
  ];

  const convertLessThanThousandBengali = (n: number): string => {
    let str = '';
    if (n >= 100) {
      const hundredDigit = Math.floor(n / 100);
      if (hundredDigit === 1) {
        str += 'একশত ';
      } else {
        str += singleDigits[hundredDigit] + 'শত ';
      }
      n %= 100;
    }
    if (n > 0) {
      str += banglaNumbers[n] + ' ';
    }
    return str;
  };

  let number = Math.floor(num);
  let result = '';

  const crore = Math.floor(number / 10000000);
  number %= 10000000;
  if (crore > 0) {
    result += (crore < 100 ? banglaNumbers[crore] : convertLessThanThousandBengali(crore)) + ' কোটি ';
  }

  const lakh = Math.floor(number / 100000);
  number %= 100000;
  if (lakh > 0) {
    result += (lakh < 100 ? banglaNumbers[lakh] : convertLessThanThousandBengali(lakh)) + ' লাখ ';
  }

  const thousand = Math.floor(number / 1000);
  number %= 1000;
  if (thousand > 0) {
    result += (thousand < 100 ? banglaNumbers[thousand] : convertLessThanThousandBengali(thousand)) + ' হাজার ';
  }

  if (number > 0) {
    result += convertLessThanThousandBengali(number);
  }

  return result.trim();
};

const getBengaliDate = (createdStr: string) => {
  if (!createdStr) return '';
  // If it's already preformatted Bengali date like '২৫ জুন, ২০২৬', return it
  if (createdStr.includes('জুন') || createdStr.includes('জুলাই') || createdStr.includes('আগস্ট') || createdStr.includes('মে') || createdStr.includes('এপ্রিল')) {
    return createdStr;
  }
  try {
    const d = new Date(createdStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('bn-BD');
    }
  } catch(e) {}
  return createdStr;
};

const getBengaliTime = (createdStr: string) => {
  if (!createdStr) return '';
  // If it's already preformatted Bengali date, it doesn't have an ISO timestamp, so return empty or look for a match
  if (createdStr.includes('জুন') || createdStr.includes('জুলাই') || createdStr.includes('আগস্ট') || createdStr.includes('মে') || createdStr.includes('এপ্রিল')) {
    return '';
  }
  try {
    const d = new Date(createdStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'});
    }
  } catch(e) {}
  return '';
};

const getProductSizes = (id: string, product?: Product) => {
  if (product && product.sizes && product.sizes.length > 0) return product.sizes;
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
  return sizeMap[id] || (product?.unit ? [product.unit] : ['1 KG']);
};

export default function AdminDashboard({
  products,
  orders,
  productRequests,
  siteConfig,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateSiteConfig,
  onClose,
  onUpdateProductRequestStatus,
  onDeleteProductRequest,
  onNotify,
  users,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  categories,
  onUpdateCategories,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  loggedInUser,
  withdrawRequests = [],
  onUpdateWithdrawRequest,
  initialTab,
}: AdminDashboardProps) {
  const hasPermission = (permissionId: string): boolean => {
    if (!loggedInUser) return true;
    if (loggedInUser.role === 'super-admin') return true; // Bypass all checks unconditionally for super-admin
    if (loggedInUser.role !== 'admin') return false;
    const perms = loggedInUser.permissions || ['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users', 'sellers'];
    return perms.includes(permissionId);
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'marketing' | 'chats' | 'payments' | 'requests' | 'users' | 'sellers'>(() => {
    if (!loggedInUser) return 'overview';
    if (loggedInUser.role === 'super-admin') return 'overview'; // Fallback for super-admin
    const tabs = ['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users', 'sellers'] as const;
    for (const t of tabs) {
      const perms = loggedInUser.permissions || ['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users', 'sellers'];
      if (perms.includes(t)) return t;
    }
    return 'overview';
  });

  useEffect(() => {
    if (initialTab && hasPermission(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // --- Search and Size Selection states for Editing Orders ---
  const [productToAddSearchQuery, setProductToAddSearchQuery] = useState('');
  const [showProductToAddDropdown, setShowProductToAddDropdown] = useState(false);
  const [selectedSizeToAdd, setSelectedSizeToAdd] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState(1);

  // --- Search and Size Selection states for Manual Orders ---
  const [manProductSearchQuery, setManProductSearchQuery] = useState('');
  const [showManProductDropdown, setShowManProductDropdown] = useState(false);
  const [manSelectedSize, setManSelectedSize] = useState('');

  // Close search dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#product-add-selector')) {
        setShowProductToAddDropdown(false);
      }
      if (!target.closest('#man-product-add-selector')) {
        setShowManProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleUpdateItemSize = (index: number, newSize: string) => {
    if (!selectedOrderDetails) return;
    
    const updatedItems = selectedOrderDetails.items.map((item, idx) => {
      if (idx === index) {
        const prod = products.find(p => p.id === item.productId);
        let newPrice = item.price;
        if (prod && prod.sizePrices?.[newSize]) {
          newPrice = prod.sizePrices[newSize].price;
        }
        return {
          ...item,
          unit: newSize,
          price: newPrice
        };
      }
      return item;
    });

    const deliveryCharge = selectedOrderDetails.deliveryCharge;
    const discountAmount = selectedOrderDetails.discountAmount || 0;
    const totalAmount = recalculateOrderTotals(updatedItems, deliveryCharge, discountAmount);

    setSelectedOrderDetails({
      ...selectedOrderDetails,
      items: updatedItems,
      totalAmount
    });
    
    notify('আইটেমের ওজন/সাইজ এবং মূল্য আপডেট করা হয়েছে!', 'success');
  };
  
  // Custom elegant notification helper
  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onNotify) {
      onNotify(msg, type);
    } else {
      console.log(`[Notification fallback] ${type}: ${msg}`);
    }
  };

  const handlePrint = (elementId: string, title: string) => {
    const printEl = document.getElementById(elementId);
    if (!printEl) {
      notify('প্রিন্ট করার কোনো উপাদান পাওয়া যায়নি!', 'error');
      return;
    }

    // Set custom print title
    const originalTitle = document.title;
    document.title = title;

    const printContent = printEl.outerHTML;
    console.log("printEl ID:", printEl.id);
    console.log("printContent length:", printContent.length);

    // Try window.open first as requested by the user
    const win = window.open('', '', 'height=800,width=600');
    if (win) {
      win.document.write('<html><head><title>' + title + '</title>');
      
      if (elementId === 'printable-thermal-memo') {
        // Inject specific CSS for POS Thermal Printer (80mm / 3 inch)
        win.document.write(`
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page { margin: 0; size: auto; }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
              font-size: 10px;
              line-height: 1.2;
              background-color: #fff;
              color: #000;
            }
            .printer-container {
              width: 72mm; /* Fits standard 80mm thermal paper */
              margin: 0 auto;
              padding: 5px;
              background: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            
            .header { margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #000; }
            .logo { max-width: 40px; height: auto; display: block; margin: 0 auto 2px auto; }
            .shop-name { font-size: 14px; font-weight: bold; margin: 0; }
            .shop-meta { font-size: 9px; margin: 0; }
            
            .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            th { border-bottom: 1px solid #000; font-weight: bold; font-size: 9px; text-align: left; padding: 2px 0; }
            td { border-bottom: 1px dashed #ccc; font-size: 10px; padding: 2px 0; vertical-align: top; }
            .col-qty { width: 15%; text-align: center; }
            .col-rate { width: 20%; text-align: right; }
            .col-total { width: 20%; text-align: right; }
            
            .totals-section { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 1px; }
            .grand-total { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2px 0; font-size: 12px; font-weight: bold; margin: 2px 0; }
            
            .footer { margin-top: 8px; text-align: center; font-size: 9px; border-top: 1px dotted #ccc; padding-top: 4px; }
            .no-print { display: none !important; }
          </style>
        `);
        win.document.write('</head><body>');
        win.document.write('<div class="printer-container">');
        win.document.write(printContent);
        win.document.write('</div>');
      } else {
        // Standard (Traditional Cash Memo, request slip, etc.)
        let stylesHtml = '';
        document.querySelectorAll('link[rel="stylesheet"], style').forEach((styleNode) => {
          stylesHtml += styleNode.outerHTML;
        });
        win.document.write(stylesHtml);
        win.document.write(`
          <style>
            @media print {
              body {
                background: white !important;
                color: black !important;
                padding: 20px !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              color: black;
              padding: 15px;
            }
          </style>
        `);
        win.document.write('</head><body>');
        win.document.write('<div>');
        win.document.write(printContent);
        win.document.write('</div>');
      }
      win.document.write('</body></html>');
      win.document.close();

      setTimeout(() => {
        win.focus();
        win.print();
        win.close();
        document.title = originalTitle;
      }, 500);

    } else {
      // Fallback to hidden iframe if window.open is blocked
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!iframeDoc) {
          throw new Error('Could not access iframe document');
        }

        iframeDoc.open();
        if (elementId === 'printable-thermal-memo') {
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title}</title>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                  @page { margin: 0; size: auto; }
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Noto Sans Bengali', sans-serif;
                    font-size: 10px;
                    line-height: 1.2;
                    background-color: #fff;
                    color: #000;
                  }
                  .printer-container {
                    width: 72mm;
                    margin: 0 auto;
                    padding: 5px;
                    background: #fff;
                  }
                  .text-center { text-align: center; }
                  .text-right { text-align: right; }
                  .text-left { text-align: left; }
                  .font-bold { font-weight: bold; }
                  .header { margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #000; }
                  .logo { max-width: 40px; height: auto; display: block; margin: 0 auto 2px auto; }
                  .shop-name { font-size: 14px; font-weight: bold; margin: 0; }
                  .shop-meta { font-size: 9px; margin: 0; }
                  .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                  table { width: 100%; border-collapse: collapse; margin: 5px 0; }
                  th { border-bottom: 1px solid #000; font-weight: bold; font-size: 9px; text-align: left; padding: 2px 0; }
                  td { border-bottom: 1px dashed #ccc; font-size: 10px; padding: 2px 0; vertical-align: top; }
                  .col-qty { width: 15%; text-align: center; }
                  .col-rate { width: 20%; text-align: right; }
                  .col-total { width: 20%; text-align: right; }
                  .totals-section { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
                  .total-row { display: flex; justify-content: space-between; margin-bottom: 1px; }
                  .grand-total { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2px 0; font-size: 12px; font-weight: bold; margin: 2px 0; }
                  .footer { margin-top: 8px; text-align: center; font-size: 9px; border-top: 1px dotted #ccc; padding-top: 4px; }
                  .no-print { display: none !important; }
                </style>
              </head>
              <body>
                <div class="printer-container">
                  ${printContent}
                </div>
                <script>
                  window.addEventListener('load', () => {
                    setTimeout(() => {
                      window.focus();
                      window.print();
                    }, 350);
                  });
                </script>
              </body>
            </html>
          `);
        } else {
          let stylesHtml = '';
          document.querySelectorAll('link[rel="stylesheet"], style').forEach((styleNode) => {
            stylesHtml += styleNode.outerHTML;
          });

          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title}</title>
                ${stylesHtml}
                <style>
                  @media print {
                    body {
                      background: white !important;
                      color: black !important;
                      padding: 20px !important;
                      margin: 0 !important;
                    }
                    .no-print {
                      display: none !important;
                    }
                  }
                  body {
                    font-family: system-ui, -apple-system, sans-serif;
                    background: white;
                    color: black;
                    padding: 15px;
                  }
                </style>
              </head>
              <body>
                <div>
                  ${printContent}
                </div>
                <script>
                  window.addEventListener('load', () => {
                    setTimeout(() => {
                      window.focus();
                      window.print();
                    }, 350);
                  });
                </script>
              </body>
            </html>
          `);
        }
        iframeDoc.close();

        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          document.title = originalTitle;
        }, 5000);
      } catch (err) {
        console.error('Iframe printing failed, falling back to direct print:', err);
        window.print();
        document.title = originalTitle;
      }
    }

    // Restore title backup
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const [requestToDelete, setRequestToDelete] = useState<ProductRequest | null>(null);

  // --- Manual Order Form States ---
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [manCustomerName, setManCustomerName] = useState('');
  const [manCustomerPhone, setManCustomerPhone] = useState('');
  const [manDeliveryAddress, setManDeliveryAddress] = useState('');
  const [manDistrict, setManDistrict] = useState('রাজশাহী');
  const [manArea, setManArea] = useState('');
  const [manPaymentMethod, setManPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket'>('cod');
  const [manTrxId, setManTrxId] = useState('');
  const [manSelectedProduct, setManSelectedProduct] = useState('');
  const [manSelectedQty, setManSelectedQty] = useState(1);
  const [manOrderItems, setManOrderItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [manDeliveryCharge, setManDeliveryCharge] = useState(60);
  const [manDiscount, setManDiscount] = useState(0);

  const handleManAddItem = () => {
    if (!manSelectedProduct) {
      notify('দয়া করে একটি পণ্য সিলেক্ট করুন!', 'error');
      return;
    }
    const prod = products.find(p => p.id === manSelectedProduct);
    if (!prod) return;

    // Create a copy of the product with the selected size & price
    const finalSize = manSelectedSize || prod.unit || 'পিস';
    let finalPrice = prod.price;
    if (manSelectedSize && prod.sizePrices?.[manSelectedSize]) {
      finalPrice = prod.sizePrices[manSelectedSize].price;
    }

    const customProduct: Product = {
      ...prod,
      unit: finalSize,
      price: finalPrice
    };

    // Check if same product with same size is already in order items
    const exists = manOrderItems.find(item => item.product.id === prod.id && item.product.unit === finalSize);
    if (exists) {
      setManOrderItems(manOrderItems.map(item => 
        (item.product.id === prod.id && item.product.unit === finalSize)
          ? { ...item, quantity: item.quantity + Number(manSelectedQty) } 
          : item
      ));
    } else {
      setManOrderItems([...manOrderItems, { product: customProduct, quantity: Number(manSelectedQty) }]);
    }
    
    // Clear selections
    setManSelectedProduct('');
    setManSelectedSize('');
    setManSelectedQty(1);
    setManProductSearchQuery('');
    notify('পণ্যটি অর্ডারে যোগ করা হয়েছে।');
  };

  const handleManRemoveItem = (prodId: string, unit: string) => {
    setManOrderItems(manOrderItems.filter(item => !(item.product.id === prodId && item.product.unit === unit)));
    notify('পণ্যটি অর্ডার থেকে বাদ দেওয়া হয়েছে।', 'info');
  };

  const handleCreateManualOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manCustomerName.trim()) {
      notify('দয়া করে গ্রাহকের নাম লিখুন!', 'error');
      return;
    }
    if (!manCustomerPhone.trim()) {
      notify('দয়া করে মোবাইল নম্বর লিখুন!', 'error');
      return;
    }
    if (!manDeliveryAddress.trim()) {
      notify('দয়া করে ডেলিভারি ঠিকানা লিখুন!', 'error');
      return;
    }
    if (manOrderItems.length === 0) {
      notify('দয়া করে অর্ডারে অন্তত একটি পণ্য যোগ করুন!', 'error');
      return;
    }

    // Calculate subtotal
    const subtotal = manOrderItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const totalAmount = subtotal + Number(manDeliveryCharge) - Number(manDiscount);

    // Prepare new order object
    const newOrder: Order = {
      id: 'm-' + Date.now().toString().slice(-6), // Random-ish numeric ID
      customerName: manCustomerName.trim(),
      customerPhone: manCustomerPhone.trim(),
      deliveryAddress: manDeliveryAddress.trim(),
      district: manDistrict,
      area: manArea.trim() || 'Thana',
      paymentMethod: manPaymentMethod,
      bkashNumber: manPaymentMethod !== 'cod' ? manCustomerPhone : undefined,
      trxId: manTrxId.trim() || undefined,
      items: manOrderItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        unit: item.product.unit,
        image: item.product.image
      })),
      totalAmount: Math.max(0, totalAmount),
      deliveryCharge: Number(manDeliveryCharge),
      status: 'pending',
      createdAt: new Date().toISOString(),
      discountAmount: Number(manDiscount) || undefined
    };

    if (onAddOrder) {
      onAddOrder(newOrder);
      notify('অভিনন্দন! ম্যানুয়াল অর্ডারটি সফলভাবে তৈরি করা হয়েছে।', 'success');
      
      // Reset states
      setManCustomerName('');
      setManCustomerPhone('');
      setManDeliveryAddress('');
      setManDistrict('রাজশাহী');
      setManArea('');
      setManPaymentMethod('cod');
      setManTrxId('');
      setManSelectedProduct('');
      setManSelectedQty(1);
      setManOrderItems([]);
      setManDeliveryCharge(60);
      setManDiscount(0);
      setShowCreateOrderModal(false);
    } else {
      notify('অর্ডার যোগ করার প্রপ্স পাওয়া যায়নি!', 'error');
    }
  };

  // --- User & Security Management State ---
  const [userSubTab, setUserSubTab] = useState<'list' | 'security'>('list');
  const [sellerSubTab, setSellerSubTab] = useState<'applications' | 'products' | 'withdraws' | 'settings'>('applications');
  const [sellerAppTab, setSellerAppTab] = useState<'pending' | 'active'>('pending');
  const [viewingSellerProduct, setViewingSellerProduct] = useState<Product | null>(null);
  const [userViewMode, setUserViewMode] = useState<'list' | 'grid'>('list');
  const [otpLoginEnabled, setOtpLoginEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [lockoutThreshold, setLockoutThreshold] = useState(5);
  const [minPasswordLength, setMinPasswordLength] = useState(6);
  const [securityLogs, setSecurityLogs] = useState<{ id: string; timestamp: string; action: string; user: string; status: 'success' | 'warning' | 'error'; ip: string }[]>([
    { id: '1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), action: 'অ্যাডমিন প্যানেল লগইন', user: 'mhasansakib35@gmail.com', status: 'success', ip: '103.114.172.5' },
    { id: '2', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), action: 'অ্যাডমিন পাসওয়ার্ড পরিবর্তন', user: 'mhasansakib35@gmail.com', status: 'success', ip: '103.114.172.5' },
    { id: '3', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), action: 'ভুল পাসওয়ার্ড দিয়ে লগইন চেষ্টা', user: 'unknown_user', status: 'error', ip: '182.43.15.98' },
    { id: '4', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), action: 'গ্রাহক আইডি স্ট্যাটাস পরিবর্তন', user: 'mhasansakib35@gmail.com', status: 'warning', ip: '103.114.172.5' },
  ]);
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [adminEditingUser, setAdminEditingUser] = useState<User | null>(null);
  const [isAdminAddUserOpen, setIsAdminAddUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // New User Form States (Admin creating a user)
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserDistrict, setNewUserDistrict] = useState('ঢাকা');
  const [newUserArea, setNewUserArea] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');

  // Edit User Form States
  const [editUserName, setEditUserName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserDistrict, setEditUserDistrict] = useState('ঢাকা');
  const [editUserArea, setEditUserArea] = useState('');
  const [editUserRole, setEditUserRole] = useState<'user' | 'admin'>('user');
  const [editUserStatus, setEditUserStatus] = useState<'active' | 'blocked'>('active');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>(['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users']);
  const [editUserPermissions, setEditUserPermissions] = useState<string[]>([]);

  // Image Selector Modal State
  const [imageSelectorTarget, setImageSelectorTarget] = useState<string | null>(null);

  
  // Product state management
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 1500);
  };

  // New product form inputs (Left side static form)
  const [pName, setPName] = useState('');
  const [pSKU, setPSKU] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState<number | ''>('');
  const [pPurchasePrice, setPPurchasePrice] = useState<number | ''>('');
  const [pOriginalPrice, setPOriginalPrice] = useState<number | ''>('');
  const [pCategory, setPCategory] = useState(categories[0]?.name || '');
  const [pUnit, setPUnit] = useState('পিস');
  const [pStock, setPStock] = useState<number | ''>('');
  const [pReorderLevel, setPReorderLevel] = useState<number>(5);
  const [pStatus, setPStatus] = useState('Active');
  const [pBadge, setPBadge] = useState<'none' | 'new' | 'restocked'>('none');
  const [pImages, setPImages] = useState<string[]>(['', '', '', '', '']);
  const pImage = pImages[0] || '';
  const setPImage = (val: string) => {
    pImages[0] = val;
    setPImages([...pImages]);
  };

  // Customizable Detailed Fields for New Product
  const [pTagline, setPTagline] = useState('');
  const [pDetailedTitle, setPDetailedTitle] = useState('');
  const [pDescriptionBullets, setPDescriptionBullets] = useState('');
  const [pManufacturer, setPManufacturer] = useState('ম্যাংগো লাভার (MangoLover)');
  const [pSourceArea, setPSourceArea] = useState('রাজশাহী, বাংলাদেশ');
  const [pShelfLife, setPShelfLife] = useState('১২ মাস (শুকনো ও ঠাণ্ডা জায়গায় সংরক্ষণ করুন)');
  const [pOrganicCertificate, setPOrganicCertificate] = useState('১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত পরীক্ষিত');

  // New product multiple sizes list with custom pricing
  const [pHasMultipleSizes, setPHasMultipleSizes] = useState(false);
  interface SizePriceItem {
    size: string;
    price: number;
    originalPrice?: number;
  }
  const [pSizesList, setPSizesList] = useState<SizePriceItem[]>([]);

  // Edit product form inputs (Modal popup)
  const [editName, setEditName] = useState('');
  const [editSKU, setEditSKU] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editOriginalPrice, setEditOriginalPrice] = useState<number | ''>('');
  const [editCategory, setEditCategory] = useState(categories[0]?.name || '');
  const [editUnit, setEditUnit] = useState('পিস');
  const [editStock, setEditStock] = useState<number>(0);
  const [editReorderLevel, setEditReorderLevel] = useState<number>(5);
  const [editStatus, setEditStatus] = useState('Active');
  const [editBadge, setEditBadge] = useState<'none' | 'new' | 'restocked'>('none');
  const [editImages, setEditImages] = useState<string[]>(['', '', '', '', '']);
  const editImage = editImages[0] || '';
  const setEditImage = (val: string) => {
    setEditImages(prev => {
      const next = [...prev];
      next[0] = val;
      return next;
    });
  };

  // Customizable Detailed Fields for Editing Product
  const [editTagline, setEditTagline] = useState('');
  const [editDetailedTitle, setEditDetailedTitle] = useState('');
  const [editDescriptionBullets, setEditDescriptionBullets] = useState('');
  const [editManufacturer, setEditManufacturer] = useState('ম্যাংগো লাভার (MangoLover)');
  const [editSourceArea, setEditSourceArea] = useState('রাজশাহী, বাংলাদেশ');
  const [editShelfLife, setEditShelfLife] = useState('১২ মাস (শুকনো ও ঠাণ্ডা জায়গায় সংরক্ষণ করুন)');
  const [editOrganicCertificate, setEditOrganicCertificate] = useState('১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত পরীক্ষিত');

  // Editing product multiple sizes list with custom pricing
  const [editHasMultipleSizes, setEditHasMultipleSizes] = useState(false);
  const [editSizesList, setEditSizesList] = useState<SizePriceItem[]>([]);

  // Products filter & search
  const [prodSearchQuery, setProdSearchQuery] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
  const [prodCurrentPage, setProdCurrentPage] = useState(1);

  // Marketing & Theme sub-tab partition
  const [marketingSubTab, setMarketingSubTab] = useState<'brand_banners' | 'ticker_categories' | 'about_page' | 'contact_info' | 'policies' | 'coupons' | 'promo_offer' | 'faq'>('brand_banners');

  const [cfgPromoActive, setCfgPromoActive] = useState<boolean>(siteConfig?.promoActive ?? true);
  const [cfgPromoImage, setCfgPromoImage] = useState<string>(siteConfig?.promoImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80');
  const [cfgPromoLink, setCfgPromoLink] = useState<string>(siteConfig?.promoLink || '');

  // Marketing Config Form inputs
  const [cfgStoreName, setCfgStoreName] = useState(siteConfig?.storeName || 'ম্যাংগো লাভার');
  const [cfgStoreSlogan, setCfgStoreSlogan] = useState(siteConfig?.storeSlogan || 'Pure & Organic Food');
  const [cfgStoreLogo, setCfgStoreLogo] = useState(siteConfig?.storeLogo || '/src/assets/images/mango_lover_logo_1782453485561.jpg');
  const [cfgStoreNameImage, setCfgStoreNameImage] = useState(siteConfig?.storeNameImage || '');
  const [cfgStoreSloganImage, setCfgStoreSloganImage] = useState(siteConfig?.storeSloganImage || '');
  
  const [cfgLeftImage, setCfgLeftImage] = useState(siteConfig?.leftBannerImage || '/src/assets/images/mango_farmer_orchard_1782453455911.jpg');
  const [cfgLeftTitle, setCfgLeftTitle] = useState(siteConfig?.leftBannerTitle || 'আমবাগান থেকে সরাসরি আপনার দোরগোড়ায়');
  const [cfgLeftSubtitle, setCfgLeftSubtitle] = useState(siteConfig?.leftBannerSubtitle || 'রাজশাহীর নিজস্ব বাগান থেকে কেমিক্যাল ছাড়া ফরমালিন মুক্ত একদম তাজা পাকা ও মিষ্টি আম সরবরাহ করছি।');
  const [cfgLeftBtnText, setCfgLeftBtnText] = useState(siteConfig?.leftBannerBtnText || 'Shop Now');
  const [cfgLeftCategory, setCfgLeftCategory] = useState(siteConfig?.leftBannerCategory || 'ফ্রেশ আম');

  const [cfgRightImage, setCfgRightImage] = useState(siteConfig?.rightBannerImage || '/src/assets/images/sundarban_honey_jar_1782453470122.jpg');
  const [cfgRightTitle, setCfgRightTitle] = useState(siteConfig?.rightBannerTitle || 'টাকা দিয়ে কিনবেন যেহেতু, খাঁটি-টাই নিন');
  const [cfgRightSubtitle, setCfgRightSubtitle] = useState(siteConfig?.rightBannerSubtitle || 'সুন্দরবনের খাঁটি মধু যা সরাসরি বন থেকে মৌয়ালদের সাহায্যে সংগ্রহ করা হয়। গুণগত মানে একদম খাঁটি।');
  const [cfgRightBtnText, setCfgRightBtnText] = useState(siteConfig?.rightBannerBtnText || 'Shop Now');
  const [cfgRightTagline, setCfgRightTagline] = useState(siteConfig?.rightBannerTagline || 'শতভাগ ন্যাচারাল হানি');
  const [cfgRightCategory, setCfgRightCategory] = useState(siteConfig?.rightBannerCategory || 'মধু');

  const [cfgTicker1, setCfgTicker1] = useState(siteConfig?.tickerItems?.[0] || '🚚 অগ্রীম ছাড়াই অর্ডার করতে পারবেন');
  const [cfgTicker2, setCfgTicker2] = useState(siteConfig?.tickerItems?.[1] || '🛡️ ডেলিভারির সময় প্রোডাক্ট দেখে নিতে পারবেন');
  const [cfgTicker3, setCfgTicker3] = useState(siteConfig?.tickerItems?.[2] || '🍯 সিজন ফ্রেশ সুন্দরবনের খাঁটি মধু চলে এসেছে');
  const [cfgTicker4, setCfgTicker4] = useState(siteConfig?.tickerItems?.[3] || '📦 সারাদেশে ৩ দিনে দ্রুত হোম ডেলিভারি সুবিধা');
  const [cfgTicker5, setCfgTicker5] = useState(siteConfig?.tickerItems?.[4] || '💯 শতভাগ ন্যাচারাল ও কেমিক্যালমুক্ত ফ্রেশ আম');
  const [cfgTicker6, setCfgTicker6] = useState(siteConfig?.tickerItems?.[5] || '📞 যেকোনো প্রয়োজনে সরাসরি কল করুন আমাদের হটলাইনে');

  const [cfgCategoryImages, setCfgCategoryImages] = useState<Record<string, string>>(siteConfig?.categoryImages || {});
  const [cfgCategoryBanners, setCfgCategoryBanners] = useState<Record<string, string>>(siteConfig?.categoryBanners || {});
  const [cfgCategoryNames, setCfgCategoryNames] = useState<Record<string, string>>(siteConfig?.categoryNames || {});

  // Custom pages editable state
  const [cfgAboutTitle, setCfgAboutTitle] = useState(siteConfig?.aboutTitle || 'আমাদের সম্পর্কে?');
  const [cfgAboutSubtitle, setCfgAboutSubtitle] = useState(siteConfig?.aboutSubtitle || 'এই যে আপনি আজ আমাদের সম্পর্কে জানতে চাচ্ছেন, এই পথটা সহজ ছিল না। অনেক চড়াই-উতরাই পেরিয়ে আজকের অবস্থানে আপনাদের পছন্দের এই ম্যাংগো লাভার। আমাদের এই পথচলায় সকল প্রিয় গ্রাহক ও শুভাকাঙ্ক্ষীদের কাছে আমরা চিরকৃতজ্ঞ।');
  const [cfgAboutOwnerImage, setCfgAboutOwnerImage] = useState(siteConfig?.aboutOwnerImage || siteConfig?.leftBannerImage || '/src/assets/images/mango_farmer_orchard_1782453455911.jpg');
  const [cfgAboutHighlightText, setCfgAboutHighlightText] = useState(siteConfig?.aboutHighlightText || 'নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের পুষ্টি বিভাগ থেকে স্নাতক সম্পন্ন করা এক তরুণ - নাম তার মুরাদ পারভেজ।');
  const [cfgAboutParagraph1, setCfgAboutParagraph1] = useState(siteConfig?.aboutParagraph1 || 'যার শৈশব ও বেড়ে ওঠা নিভৃত পল্লীগাঁয়ে। উচ্চশিক্ষার উদ্দেশ্যে গ্রাম ছেড়ে তিনি পাড়ি জমান নোয়াখালীতে। সেখানে গিয়ে নিজের প্রয়োজনে কেনা খেজুরের গুড়, ঘি কিংবা আম - সবকিছুতেই কৃত্রিমতার ছাপ লক্ষ্য করেন। যেহেতু তার শৈশব কেটেছে গ্রামে, তাই খাঁটি খাদ্যদ্রব্য চিনতে তার ভুল হওয়ার কথা নয়; তার ওপর নিজের পড়াশোনাও ছিল \'নিরাপদ খাদ্য\' নিয়ে।');
  const [cfgAboutParagraph2, setCfgAboutParagraph2] = useState(siteConfig?.aboutParagraph2 || 'ক্যাম্পাসে পরিচিতদের জন্য গুড় ও ঘি এনে প্রশংসা পাওয়ার পর তার মনে হয়েছিল—নিজে উদ্যোক্তা হয়ে দেশজুড়ে মানুষের কাছে খাঁটি খাদ্য পৌঁছে দিলে কেমন হয়? সেই ভাবনা থেকেই পরিবারের দেওয়া সামান্য আর্থিক পুঁজি নিয়ে তিনি এই সংকল্পে নামলেন যে - যতটুকু সম্ভব, ততটুকুই খাঁটি জিনিস তিনি গ্রাহকদের কাছে পৌঁছে দেবেন। অনেক নির্ঘুম রাত আর অক্লান্ত পরিশ্রমে তিনি নিজের প্রচেষ্টা অব্যাহত রেখে প্রমাণ করলেন যে, একাগ্রতা থাকলে সবই সম্ভব। কোনো কিছু অর্জন করতে হলে আগে সেটি দৃঢ়ভাবে চাইতে হয়।');
  const [cfgAboutParagraph3, setCfgAboutParagraph3] = useState(siteConfig?.aboutParagraph3 || 'পরবর্তীতে কয়েক লক্ষ গ্রাহকের দোরগোড়ায় তিনি পৌঁছে দিয়েছেন তার এই \'ম্যাংগো লাভার\'-এর পণ্য। তৈরি হয়েছে বিশাল এক অনুগত গ্রাহক শ্রেণি। সেই সঙ্গে নিরবিচ্ছিন্ন সেবা নিশ্চিত করতে তিনি গড়ে তুলেছেন দক্ষ সাপোর্ট টিম। আজ ৬০ জনেরও বেশি কর্মী নিয়ে তিনি সফলতার সাথে এগিয়ে যাচ্ছেন।');
  const [cfgAboutFacebookLink, setCfgAboutFacebookLink] = useState(siteConfig?.aboutFacebookLink || 'https://facebook.com');
  const [cfgMessengerLink, setCfgMessengerLink] = useState(siteConfig?.messengerLink || 'https://m.me/61556942953282');
  const [cfgFacebookLink, setCfgFacebookLink] = useState(siteConfig?.facebookLink || 'https://facebook.com');
  const [cfgInstagramLink, setCfgInstagramLink] = useState(siteConfig?.instagramLink || 'https://instagram.com');
  const [cfgYoutubeLink, setCfgYoutubeLink] = useState(siteConfig?.youtubeLink || 'https://youtube.com');

  const [cfgContactOffice, setCfgContactOffice] = useState(siteConfig?.contactOffice || 'Nowhata, Paba, Rajshahi, Bangladesh, 6213');
  const [cfgContactPhone, setCfgContactPhone] = useState(siteConfig?.contactPhone || '+880 1301-636461');
  const [cfgContactEmail, setCfgContactEmail] = useState(siteConfig?.contactEmail || 'info AT mangolover.com.bd');
  const [cfgGoogleMapUrl, setCfgGoogleMapUrl] = useState(siteConfig?.googleMapUrl || 'https://www.openstreetmap.org/export/embed.html?bbox=88.5800%2C24.3600%2C88.6200%2C24.3900&amp;layer=mapnik&amp;marker=24.3750%2C88.6010');

  const [selectedRequestDetails, setSelectedRequestDetails] = useState<ProductRequest | null>(null);

  const [cfgRefundPolicyText, setCfgRefundPolicyText] = useState(siteConfig?.refundPolicyText || 'আমাদের মূল লক্ষ্য গ্রাহকের সন্তুষ্টি। যদি কোনো কারণে আপনি পণ্য পেয়ে অসন্তুষ্ট হন, তবে নিম্নলিখিত নীতি অনুযায়ী আমরা পণ্য পরিবর্তন বা মূল্য ফেরত দিয়ে থাকি:\n\n১. ডেলিভারির সময় পণ্য দেখে নেওয়ার সুযোগ রয়েছে। কোনো প্রকার ক্রটি থাকলে ডেলিভারি ম্যানের কাছেই ফেরত দিতে পারবেন।\n\n২. আমরা রাজশাহী থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ।\n\n৩. রিটার্ন করার পর ৩ কার্যদিবসের মধ্যে আপনার বিকাশ/রকেট/নগদ অথবা ব্যাংক অ্যাকাউন্টে টাকা রিফান্ড করা হবে।');
  const [cfgPrivacyPolicyText, setCfgPrivacyPolicyText] = useState(siteConfig?.privacyPolicyText || 'আপনার গোপনীয়তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। ম্যাংগো লাভার গ্রাহকদের ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা নিশ্চিত করে:\n\n১. আমরা শুধুমাত্র অর্ডার প্রসেসিং এবং পণ্য ডেলিভারির সুবিধার্থে গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা সংগ্রহ করি।\n\n২. সংগৃহীত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রয় বা হস্তান্তর করা হয় না।\n\n৩. আমাদের ওয়েবসাইট এবং গ্রাহক ডেটাবেজ সুরক্ষিত রাখতে আমরা আধুনিক সিকিউরিটি প্রোটোকল ব্যবহার করি।');

  const [cfgFaqItems, setCfgFaqItems] = useState<{ question: string; answer: string }[]>(siteConfig?.faqItems || [
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
  ]);

  useEffect(() => {
    if (siteConfig?.faqItems) {
      setCfgFaqItems(siteConfig.faqItems);
    }
  }, [siteConfig?.faqItems]);

  // Coupon configuration states
  const [cfgCoupons, setCfgCoupons] = useState<Coupon[]>(siteConfig?.coupons || [
    { code: 'MANGO10', type: 'percentage', value: 10 },
    { code: 'MANGO100', type: 'flat', value: 100 },
    { code: 'FREE50', type: 'flat', value: 50 }
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'flat' | 'percentage'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number | ''>('');
  const [newCouponLimitPerPhone, setNewCouponLimitPerPhone] = useState<string>('1'); // '1' = 1 time per phone, '0' = unlimited
  const [newCouponMaxTotalUsage, setNewCouponMaxTotalUsage] = useState<number | ''>('');
  const [newCouponRestrictedPhones, setNewCouponRestrictedPhones] = useState<string>('');

  useEffect(() => {
    if (siteConfig?.coupons) {
      setCfgCoupons(siteConfig.coupons);
    }
  }, [siteConfig?.coupons]);


  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Order editing states
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [orderEditBackup, setOrderEditBackup] = useState<Order | null>(null);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');

  useEffect(() => {
    setIsEditingOrder(false);
    setOrderEditBackup(null);
    setSelectedProductToAdd('');
  }, [selectedOrderDetails?.id]);

  const recalculateOrderTotals = (items: Order['items'], deliveryCharge: number, discountAmount: number): number => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return Math.max(0, subtotal + deliveryCharge - (discountAmount || 0));
  };

  const handleStartEditOrder = () => {
    if (!selectedOrderDetails) return;
    setOrderEditBackup(JSON.parse(JSON.stringify(selectedOrderDetails)));
    setIsEditingOrder(true);
  };

  const handleCancelEditOrder = () => {
    if (orderEditBackup) {
      setSelectedOrderDetails(orderEditBackup);
    }
    setIsEditingOrder(false);
    setOrderEditBackup(null);
  };

  const handleSaveEditOrder = () => {
    if (!selectedOrderDetails) return;
    if (onUpdateOrder) {
      onUpdateOrder(selectedOrderDetails);
    }
    setIsEditingOrder(false);
    setOrderEditBackup(null);
    notify('মেমো সফলভাবে আপডেট করা হয়েছে!', 'success');
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (!selectedOrderDetails) return;
    if (newQty <= 0) return;
    
    const updatedItems = selectedOrderDetails.items.map((item, idx) => {
      if (idx === index) {
        return { ...item, quantity: newQty };
      }
      return item;
    });

    const deliveryCharge = selectedOrderDetails.deliveryCharge;
    const discountAmount = selectedOrderDetails.discountAmount || 0;
    const totalAmount = recalculateOrderTotals(updatedItems, deliveryCharge, discountAmount);

    setSelectedOrderDetails({
      ...selectedOrderDetails,
      items: updatedItems,
      totalAmount
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!selectedOrderDetails) return;
    if (selectedOrderDetails.items.length <= 1) {
      notify('অর্ডারে কমপক্ষে একটি পণ্য অবশ্যই থাকতে হবে!', 'error');
      return;
    }

    const updatedItems = selectedOrderDetails.items.filter((_, idx) => idx !== index);
    const deliveryCharge = selectedOrderDetails.deliveryCharge;
    const discountAmount = selectedOrderDetails.discountAmount || 0;
    const totalAmount = recalculateOrderTotals(updatedItems, deliveryCharge, discountAmount);

    setSelectedOrderDetails({
      ...selectedOrderDetails,
      items: updatedItems,
      totalAmount
    });
  };

  const handleUpdateDeliveryCharge = (charge: number) => {
    if (!selectedOrderDetails) return;
    const deliveryCharge = Math.max(0, charge);
    const discountAmount = selectedOrderDetails.discountAmount || 0;
    const totalAmount = recalculateOrderTotals(selectedOrderDetails.items, deliveryCharge, discountAmount);

    setSelectedOrderDetails({
      ...selectedOrderDetails,
      deliveryCharge,
      totalAmount
    });
  };

  const handleUpdateDiscountAmount = (discount: number) => {
    if (!selectedOrderDetails) return;
    const discountAmount = Math.max(0, discount);
    const deliveryCharge = selectedOrderDetails.deliveryCharge;
    const totalAmount = recalculateOrderTotals(selectedOrderDetails.items, deliveryCharge, discountAmount);

    setSelectedOrderDetails({
      ...selectedOrderDetails,
      discountAmount,
      totalAmount
    });
  };

  const handleAddProductToOrder = (productId: string, selectedSize?: string, quantity: number = 1) => {
    if (!selectedOrderDetails || !productId) return;
    
    const productToAdd = products.find(p => p.id === productId);
    if (!productToAdd) return;

    // Determine target size/weight
    const finalSize = selectedSize || productToAdd.unit || 'পিস';
    
    // Determine price for this specific size
    let finalPrice = productToAdd.price;
    if (selectedSize && productToAdd.sizePrices?.[selectedSize]) {
      finalPrice = productToAdd.sizePrices[selectedSize].price;
    }

    const existingIndex = selectedOrderDetails.items.findIndex(
      item => item.productId === productId && item.unit === finalSize
    );
    
    let updatedItems;
    if (existingIndex > -1) {
      updatedItems = selectedOrderDetails.items.map((item, idx) => {
        if (idx === existingIndex) {
          return { ...item, quantity: item.quantity + quantity };
        }
        return item;
      });
    } else {
      updatedItems = [
        ...selectedOrderDetails.items,
        {
          productId: productToAdd.id,
          productName: productToAdd.name,
          price: finalPrice,
          quantity: quantity,
          unit: finalSize,
          image: productToAdd.image
        }
      ];
    }

    const deliveryCharge = selectedOrderDetails.deliveryCharge;
    const discountAmount = selectedOrderDetails.discountAmount || 0;
    const totalAmount = recalculateOrderTotals(updatedItems, deliveryCharge, discountAmount);

    setSelectedOrderDetails({
      ...selectedOrderDetails,
      items: updatedItems,
      totalAmount
    });
    
    setSelectedProductToAdd('');
    setSelectedSizeToAdd('');
    setQtyToAdd(1);
    setProductToAddSearchQuery('');
    notify('অর্ডারে পণ্যটি যুক্ত করা হয়েছে!', 'success');
  };

  // Payments tab states
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [pendingConfirmOrderId, setPendingConfirmOrderId] = useState<string | null>(null);
  const [confirmCodeInput, setConfirmCodeInput] = useState<string>('');

  // Stats Calculations
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  const completedRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditSKU(product.sku || '');
    setEditDescription(product.description || '');
    setEditPrice(product.price);
    setEditPurchasePrice(product.purchasePrice || 0);
    setEditOriginalPrice(product.originalPrice || '');
    setEditCategory(product.category);
    setEditUnit(product.unit || 'পিস');
    setEditStock(product.stock);
    setEditReorderLevel(product.reorderLevel ?? 5);
    setEditStatus(product.status || 'Active');
    setEditBadge(product.badge || 'none');
    
    // Detailed tabs custom states
    const defaultDetailsMap: Record<string, { title: string; tagline: string; bullets: string[] }> = {
      'p1': {
        title: "সুন্দরবনের খাঁটি খলিশা ফুলের মধু (Pure Sundarban Honey)",
        tagline: "সুন্দরবনের গভীর জঙ্গল থেকে মৌয়ালদের মাধ্যমে সংগৃহীত শতভাগ খাঁটি ও প্রাকৃতিক খলিশা ফুলের মধু।",
        bullets: [
          "শতভাগ খাঁটি ও প্রাকৃতিক: সরাসরি সুন্দরবন থেকে সংগৃহীত এবং কোনো প্রকার কেমিক্যাল বা কৃত্রিম চিনি মুক্ত।",
          "রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি: খলিশা ফুলের মধু নিয়মিত সেবনে শরীরের রোগ প্রতিরোধ ক্ষমতা বহুণ বাড়ে।",
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

    const details = defaultDetailsMap[product.id] || {
      title: `${product.name} (আমাদের উৎপাদিত)`,
      tagline: `শতভাগ নিরাপদ ও মজাদার ${product.name}ই আমরা আপনার ঠিকানায় পাঠাবো, এটি আমাদের ওয়াদা! ❤️`,
      bullets: [
        "শতভাগ খাঁটি ও প্রাকৃতিক উপাদানে তৈরি পণ্য।",
        "কোনো ক্ষতিকর কেমিক্যাল, ভেজাল বা কৃত্রিম প্রিজারভেটিভ নেই।",
        "পরিষ্কার ও অত্যন্ত স্বাস্থ্যকর পরিবেশে তৈরি করা হয়।",
        "শরীরের রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিতে সহায়ক পুষ্টিকর খাবার।"
      ]
    };

    setEditTagline(product.tagline || details.tagline);
    setEditDetailedTitle(product.detailedTitle || details.title);
    setEditDescriptionBullets(product.descriptionBullets ? product.descriptionBullets.join('\n') : details.bullets.join('\n'));
    setEditManufacturer(product.manufacturer || 'ম্যাংগো লাভার (MangoLover)');
    setEditSourceArea(product.sourceArea || (product.category === 'মধু' ? 'সুন্দরবন গভীর অরণ্য' : 'রাজশাহী ও সিরাজগঞ্জ, বাংলাদেশ'));
    setEditShelfLife(product.shelfLife || '১২ মাস (শুকনো ও ঠাণ্ডা জায়গায় সংরক্ষণ করুন)');
    setEditOrganicCertificate(product.organicCertificate || '১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত পরীক্ষিত');
    
    // Populate 5 slots
    const initialImages = Array(5).fill('');
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      for (let i = 0; i < Math.min(5, product.images.length); i++) {
        initialImages[i] = product.images[i];
      }
    } else if (product.image) {
      initialImages[0] = product.image;
    }
    setEditImages(initialImages);

    // Populate sizes and custom size prices
    let initialSizes: string[] = product.sizes || [];
    if (initialSizes.length === 0) {
      const defaultSizeMap: Record<string, string[]> = {
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
      initialSizes = defaultSizeMap[product.id] || [];
    }

    initialSizes = sortProductSizes(initialSizes);

    const initialSizesList = initialSizes.map(sz => ({
      size: sz,
      price: product.sizePrices?.[sz]?.price ?? product.price,
      originalPrice: product.sizePrices?.[sz]?.originalPrice ?? product.originalPrice
    }));

    setEditSizesList(initialSizesList);
    setEditHasMultipleSizes(initialSizesList.length > 0);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || pPrice === '' || pPrice <= 0 || !pUnit || pStock === '' || pStock < 0) {
      notify('সবগুলো প্রয়োজনীয় ফিল্ড পূরণ করুন সঠিকভাবে!', 'error');
      return;
    }

    const finalImages = pImages.filter(Boolean);
    const primaryImg = finalImages[0] || 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80';

    const payload = {
      name: pName,
      sku: pSKU || undefined,
      description: pDescription || `${pName}, আমাদের উৎপাদিত খাঁটি পণ্য।`,
      price: Number(pPrice),
      originalPrice: pOriginalPrice ? Number(pOriginalPrice) : undefined,
      purchasePrice: pPurchasePrice ? Number(pPurchasePrice) : undefined,
      category: pCategory,
      unit: pUnit,
      stock: Number(pStock),
      reorderLevel: pReorderLevel,
      status: pStatus,
      badge: pBadge,
      addedBy: 'Owner',
      image: primaryImg,
      images: finalImages,
      tagline: pTagline || undefined,
      detailedTitle: pDetailedTitle || undefined,
      descriptionBullets: pDescriptionBullets ? pDescriptionBullets.split('\n').map(b => b.trim()).filter(Boolean) : undefined,
      manufacturer: pManufacturer || undefined,
      sourceArea: pSourceArea || undefined,
      shelfLife: pShelfLife || undefined,
      organicCertificate: pOrganicCertificate || undefined,
      sizes: pHasMultipleSizes ? sortProductSizes(pSizesList.map(item => item.size)) : undefined,
      sizePrices: pHasMultipleSizes ? pSizesList.reduce((acc, item) => ({ ...acc, [item.size]: { price: Number(item.price), originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined } }), {}) : undefined,
    };

    onAddProduct(payload);

    // Reset Form
    setPName('');
    setPSKU('');
    setPDescription('');
    setPPrice('');
    setPPurchasePrice('');
    setPOriginalPrice('');
    setPImages(['', '', '', '', '']);
    setPUnit('পিস');
    setPStock('');
    setPReorderLevel(5);
    setPStatus('Active');
    setPBadge('none');
    setPTagline('');
    setPDetailedTitle('');
    setPDescriptionBullets('');
    setPManufacturer('ম্যাংগো লাভার (MangoLover)');
    setPSourceArea('রাজশাহী, বাংলাদেশ');
    setPShelfLife('১২ মাস (শুকনো ও ঠাণ্ডা জায়গায় সংরক্ষণ করুন)');
    setPOrganicCertificate('১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত পরীক্ষিত');
    setPHasMultipleSizes(false);
    setPSizesList([]);
    setShowAddProductModal(false);
    notify('অভিনন্দন! নতুন পণ্যটি সফলভাবে যোগ করা হয়েছে।', 'success');
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName || editPrice <= 0 || !editUnit || editStock < 0) {
      notify('সবগুলো প্রয়োজনীয় ফিল্ড পূরণ করুন সঠিকভাবে!', 'error');
      return;
    }

    const finalImages = editImages.filter(Boolean);
    const primaryImg = finalImages[0] || 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80';

    onEditProduct({
      ...editingProduct,
      name: editName,
      sku: editSKU || undefined,
      description: editDescription,
      price: Number(editPrice),
      originalPrice: editOriginalPrice ? Number(editOriginalPrice) : undefined,
      purchasePrice: editPurchasePrice ? Number(editPurchasePrice) : undefined,
      category: editCategory,
      unit: editUnit,
      stock: Number(editStock),
      reorderLevel: editReorderLevel,
      status: editStatus,
      badge: editBadge,
      addedBy: 'Owner',
      image: primaryImg,
      images: finalImages,
      tagline: editTagline || undefined,
      detailedTitle: editDetailedTitle || undefined,
      descriptionBullets: editDescriptionBullets ? editDescriptionBullets.split('\n').map(b => b.trim()).filter(Boolean) : undefined,
      manufacturer: editManufacturer || undefined,
      sourceArea: editSourceArea || undefined,
      shelfLife: editShelfLife || undefined,
      organicCertificate: editOrganicCertificate || undefined,
      sizes: editHasMultipleSizes ? sortProductSizes(editSizesList.map(item => item.size)) : undefined,
      sizePrices: editHasMultipleSizes ? editSizesList.reduce((acc, item) => ({ ...acc, [item.size]: { price: Number(item.price), originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined } }), {}) : undefined,
    });

    setEditingProduct(null);
    notify('অভিনন্দন! পণ্য সংশোধন সফলভাবে সম্পন্ন হয়েছে।', 'success');
  };

  // --- Admin User Management Helpers ---
  const handleOpenEditUser = (u: User) => {
    setAdminEditingUser(u);
    setEditUserName(u.name);
    setEditUserPhone(u.phone);
    setEditUserEmail(u.email || '');
    setEditUserPassword(u.password);
    setEditUserAddress(u.address);
    setEditUserDistrict(u.district || 'ঢাকা');
    setEditUserArea(u.area || '');
    setEditUserRole(u.role);
    setEditUserStatus(u.status);
    setEditUserPermissions(u.permissions || (u.role === 'admin' ? ['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users'] : []));
  };

  const handleSaveEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEditingUser) return;

    if (!editUserName.trim() || !editUserPhone.trim() || !editUserPassword.trim() || !editUserAddress.trim() || !editUserArea.trim()) {
      notify('দয়া করে সবগুলো প্রয়োজনীয় তথ্য পূরণ করুন!', 'error');
      return;
    }

    const phoneClean = editUserPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(phoneClean)) {
      notify('মোবাইল নম্বরটি সঠিক ১১ সংখ্যার বাংলাদেশী নম্বর নয়!', 'error');
      return;
    }

    const duplicatePhone = users.some(u => u.id !== adminEditingUser.id && u.phone.replace(/\s+/g, '') === phoneClean);
    if (duplicatePhone) {
      notify('এই মোবাইল নম্বর দিয়ে অন্য একজন গ্রাহকের অ্যাকাউন্ট রয়েছে!', 'error');
      return;
    }

    const updated: User = {
      ...adminEditingUser,
      name: editUserName.trim(),
      phone: phoneClean,
      email: editUserEmail.trim() || undefined,
      password: editUserPassword,
      address: editUserAddress.trim(),
      district: editUserDistrict,
      area: editUserArea.trim(),
      role: editUserRole,
      status: editUserStatus,
      permissions: editUserRole === 'admin' ? editUserPermissions : [],
    };

    onUpdateUser(updated);
    setAdminEditingUser(null);
    notify('গ্রাহকের তথ্য সফলভাবে আপডেট করা হয়েছে।', 'success');
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim() || !newUserPassword.trim() || !newUserAddress.trim() || !newUserArea.trim()) {
      notify('দয়া করে সবগুলো প্রয়োজনীয় তথ্য পূরণ করুন!', 'error');
      return;
    }

    const phoneClean = newUserPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(phoneClean)) {
      notify('মোবাইল নম্বরটি সঠিক ১১ সংখ্যার বাংলাদেশী নম্বর নয়!', 'error');
      return;
    }

    const duplicatePhone = users.some(u => u.phone.replace(/\s+/g, '') === phoneClean);
    if (duplicatePhone) {
      notify('এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে!', 'error');
      return;
    }

    const newUser: User = {
      id: 'U-' + Math.floor(1000 + Math.random() * 9000),
      name: newUserName.trim(),
      phone: phoneClean,
      email: newUserEmail.trim() || undefined,
      password: newUserPassword,
      address: newUserAddress.trim(),
      district: newUserDistrict,
      area: newUserArea.trim(),
      createdAt: new Date().toISOString(),
      status: 'active',
      role: newUserRole,
      permissions: newUserRole === 'admin' ? newUserPermissions : [],
    };

    onAddUser(newUser);
    setIsAdminAddUserOpen(false);
    
    setNewUserName('');
    setNewUserPhone('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserAddress('');
    setNewUserDistrict('ঢাকা');
    setNewUserArea('');
    setNewUserRole('user');
    setNewUserPermissions(['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users']);

    notify(`নতুন ${newUserRole === 'admin' ? 'অ্যাডমিন' : 'গ্রাহক'} অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।`, 'success');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      matchesSearchWithNumerals(order.customerName, orderSearch) ||
      matchesSearchWithNumerals(order.customerPhone, orderSearch) ||
      matchesSearchWithNumerals(order.id, orderSearch);
    
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800 flex flex-col font-sans">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl text-white">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-lg tracking-tight">ম্যাংগো লাভার - কন্ট্রোল প্যানেল</h1>
            <p className="text-xs text-slate-400 font-medium">অ্যাডমিন ড্যাশবোর্ড</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          স্টোরফ্রন্টে ফিরে যান
        </button>
      </div>

      {/* Main Body Grid */}
      <div className="flex-grow max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Rail / Sidebar */}
        <div className="md:col-span-3 bg-white p-4 rounded-2xl border border-gray-200 h-fit space-y-2">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider px-3 mb-2">মেনু</h3>
          {hasPermission('overview') && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5" />
              <span>ড্যাশবোর্ড ওভারভিউ</span>
            </button>
          )}
          {hasPermission('products') && (
            <button
              onClick={() => {
                setActiveTab('products');
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4.5 h-4.5" />
              <span>পণ্য ব্যবস্থাপনা ({products.length})</span>
            </button>
          )}
          {hasPermission('orders') && (
            <button
              onClick={() => {
                setActiveTab('orders');
                setSelectedOrderDetails(null);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              <span>অর্ডারসমূহ ({orders.length})</span>
              {pendingOrdersCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          )}
          {hasPermission('payments') && (
            <button
              onClick={() => {
                setActiveTab('payments');
                setSelectedOrderDetails(null);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="w-4.5 h-4.5" />
              <span>পেমেন্টসমূহ</span>
              {orders.filter(o => o.paymentMethod !== 'cod' && o.status === 'pending').length > 0 && (
                <span className="ml-auto bg-pink-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {orders.filter(o => o.paymentMethod !== 'cod' && o.status === 'pending').length}
                </span>
              )}
            </button>
          )}
          {hasPermission('marketing') && (
            <button
              onClick={() => {
                setActiveTab('marketing');
                setSelectedOrderDetails(null);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'marketing'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Palette className="w-4.5 h-4.5" />
              <span>মার্কেটিং ও থিম</span>
            </button>
          )}
          {hasPermission('requests') && (
            <button
              onClick={() => {
                setActiveTab('requests');
                setSelectedOrderDetails(null);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className="w-4.5 h-4.5" />
              <span>প্রোডাক্ট রিকুয়েস্ট ({productRequests.length})</span>
              {productRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                  {productRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          )}
          {hasPermission('users') && (
            <button
              onClick={() => {
                setActiveTab('users');
                setSelectedOrderDetails(null);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>ইউজার ও সিকিউরিটি ({users ? users.length : 0})</span>
            </button>
          )}
          {hasPermission('sellers') && (
            <button
              onClick={() => {
                setActiveTab('sellers');
                setSelectedOrderDetails(null);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'sellers'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4.5 h-4.5" />
              <span>উদ্যোক্তা (Multi-Vendor)</span>
              {((users?.filter(u => u.role === 'seller' && u.sellerStatus === 'pending').length || 0) +
                (products?.filter(p => p.sellerId && p.sellerProductStatus === 'pending').length || 0) +
                (withdrawRequests?.filter(w => w.status === 'pending').length || 0)) > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
                  {(users?.filter(u => u.role === 'seller' && u.sellerStatus === 'pending').length || 0) +
                   (products?.filter(p => p.sellerId && p.sellerProductStatus === 'pending').length || 0) +
                   (withdrawRequests?.filter(w => w.status === 'pending').length || 0)}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content Section */}
        <div className="md:col-span-9 space-y-6">
          {!hasPermission(activeTab) && (
            <div className="bg-white p-12 text-center rounded-3xl border border-red-100/50 flex flex-col items-center justify-center space-y-4 shadow-sm animate-in fade-in zoom-in-95">
              <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-gray-800 text-sm md:text-base">অ্যাক্সেস সংরক্ষিত (Access Restricted)</h3>
                <p className="text-[11px] text-gray-500 font-bold max-w-md leading-relaxed">
                  দুঃখিত, এই ড্যাশবোর্ড ট্যাবটি দেখার জন্য আপনার অ্যাডমিন অ্যাকাউন্টের অনুমতি নেই। প্রয়োজনীয় পারমিশন পেতে মূল অ্যাডমিনের সাথে যোগাযোগ করুন।
                </p>
              </div>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {hasPermission('overview') && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
                  <div className="bg-orange-100 text-orange-600 p-2.5 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">মোট বিক্রয়</p>
                    <h3 className="font-extrabold text-gray-800 text-base md:text-lg">৳{totalRevenue}</h3>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
                  <div className="bg-green-100 text-green-600 p-2.5 rounded-xl">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">পরিশোধিত আয়</p>
                    <h3 className="font-extrabold text-gray-800 text-base md:text-lg">৳{completedRevenue}</h3>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">মোট অর্ডার</p>
                    <h3 className="font-extrabold text-gray-800 text-base md:text-lg">{orders.length} টি</h3>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
                  <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">নতুন অর্ডার</p>
                    <h3 className="font-extrabold text-gray-800 text-base md:text-lg">{pendingOrdersCount} টি</h3>
                  </div>
                </div>
              </div>

              {/* Bottom Quick lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Out of Stock Warning */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-gray-100 pb-2">
                    🚨 স্টক এলার্ট (কম পরিমাণ)
                  </h3>
                  <div className="divide-y divide-gray-100 overflow-y-auto max-h-60 pr-1 space-y-2">
                    {products.filter(p => p.stock <= 5).length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">সব পণ্যের পর্যাপ্ত স্টক আছে!</p>
                    ) : (
                      products
                        .filter(p => p.stock <= 5)
                        .map(p => (
                          <div key={p.id} className="flex items-center justify-between text-xs py-2">
                            <div className="flex gap-2 items-center">
                              <img src={p.image} className="w-8 h-8 rounded-md object-cover border" referrerPolicy="no-referrer" />
                              <div>
                                <h4 className="font-bold text-gray-700 truncate max-w-[150px]">{p.name}</h4>
                                <p className="text-[10px] text-gray-400">{p.category}</p>
                              </div>
                            </div>
                            <span className={`font-extrabold px-2 py-0.5 rounded-full ${
                              p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              স্টক: {p.stock} টি
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Recent Orders List */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-800 text-sm md:text-base">
                      📦 সাম্প্রতিক ৪টি অর্ডার
                    </h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
                    >
                      সব দেখুন
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100 space-y-2.5">
                    {orders.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">কোন অর্ডার প্লেস করা হয়নি এখনও।</p>
                    ) : (
                      orders.slice(-4).reverse().map(order => (
                        <div key={order.id} className="flex items-center justify-between text-xs py-1.5">
                          <div>
                            <h4 className="font-bold text-gray-700">{order.customerName}</h4>
                            <p className="text-[10px] text-gray-400">{order.customerPhone} | {order.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-gray-800">৳{order.totalAmount}</p>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status === 'pending' ? 'অপেক্ষমাণ' :
                               order.status === 'processing' ? 'প্রসেসিং' :
                               order.status === 'shipped' ? 'শিপড্' :
                               order.status === 'delivered' ? 'ডেলিভার্ড' : 'বাতিল'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS MANAGEMENT */}
          {hasPermission('products') && activeTab === 'products' && (
            <div className="space-y-6">
              {/* 2-Column Split: Form (Left, xl:col-span-4) and Product Cards Grid (Right, xl:col-span-8) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN WRAPPER */}
                <div className="xl:col-span-4 flex flex-col gap-6 sticky top-24">
                  {/* ADD NEW PRODUCT FORM */}
                  <div id="add-product-form-card" className="hidden">
                  <h3 className="font-extrabold text-emerald-800 text-base flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <span>নতুন আইটেম যোগ করুন</span>
                  </h3>
                  <form onSubmit={handleAddProductSubmit} className="space-y-4">
                    {/* আইটেম নাম */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">আইটেম নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: সুন্দরবনের খলিশা ফুলের মধু"
                        value={pName}
                        onChange={(e) => setPName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                      />
                    </div>

                    {/* SKU / কোড & কেনার পরিমাণ */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">SKU / কোড</label>
                        <input
                          type="text"
                          placeholder="যেমন: HONEY-1KG"
                          value={pSKU}
                          onChange={(e) => setPSKU(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">কেনার পরিমাণ *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="যেমন: ২৫"
                          value={pStock}
                          onChange={(e) => setPStock(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                        />
                      </div>
                    </div>

                    {/* পরিমাণ একক (Dropdown) & রিঅর্ডার লেভেল */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ইউনিট *</label>
                        <select
                          value={pUnit}
                          onChange={(e) => setPUnit(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                        >
                          <option value="পিস">পিস (Pcs)</option>
                          <option value="বক্স">বক্স (Box)</option>
                          <option value="প্যাক">প্যাক (Pack)</option>
                          <option value="লিটার">লিটার (Liter)</option>
                          <option value="কেজি">কেজি (Kg)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">রিঅর্ডার লেভেল</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="যেমন: ৫"
                          value={pReorderLevel}
                          onChange={(e) => setPReorderLevel(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                        />
                      </div>
                    </div>

                    {/* ক্রয় মূল্য, বিক্রয় মূল্য & পূর্বের মূল্য */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">ক্রয় মূল্য (৳) *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="যেমন: ৮০০"
                          value={pPurchasePrice}
                          onChange={(e) => setPPurchasePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">বিক্রয় মূল্য (৳) *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="যেমন: ৯৫০"
                          value={pPrice}
                          onChange={(e) => setPPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">পূর্বের মূল্য (৳)</label>
                        <input
                          type="number"
                          min={1}
                          placeholder="যেমন: ১০০০"
                          value={pOriginalPrice}
                          onChange={(e) => setPOriginalPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                        />
                      </div>
                    </div>

                    {/* ক্রয় ও বিক্রয় মূল্যের স্পষ্টীকরণ নোট */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-[10px] text-emerald-800 font-medium leading-relaxed">
                      💡 <strong>একক মূল্য নোট:</strong> এখানে দেয়া ক্রয় ও বিক্রয় মূল্যটি প্রতি <strong>১ {pUnit || 'একক'}</strong> এর জন্য প্রযোজ্য। গ্রাহক কার্টে বা ডিরেক্ট অর্ডারে বেশি পরিমাণ পছন্দ করলে এই মূল্য দিয়েই গুণ করে সর্বমোট মূল্য হিসাব করা হবে এবং হোয়াটসঅ্যাপ মেসেজেও সঠিক হিসাব চলে যাবে।
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ক্যাটাগরি *</label>
                      <select
                        value={pCategory}
                        onChange={(e) => setPCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-600"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cfgCategoryNames[cat.slug] || cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status & Badge in 2-column grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">স্ট্যাটাস</label>
                        <select
                          value={pStatus}
                          onChange={(e) => setPStatus(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-600"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ব্যাজ / স্টিকার (Badge)</label>
                        <select
                          value={pBadge}
                          onChange={(e) => setPBadge(e.target.value as 'none' | 'new' | 'restocked')}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-600"
                        >
                          <option value="none">কোনোটিই নয় (None)</option>
                          <option value="new">নতুন (New)</option>
                          <option value="restocked">রিস্টক (Restocked)</option>
                        </select>
                      </div>
                    </div>

                    {/* ওজন/সাইজ ভিত্তিক মূল্য নির্ধারণ (Size-wise pricing) */}
                    <div className="pt-4 border-t border-gray-100 space-y-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="block text-sm font-extrabold text-emerald-950">⚖️ ওজন/সাইজ ভিত্তিক ভিন্ন মূল্য?</span>
                        <input
                          type="checkbox"
                          checked={pHasMultipleSizes}
                          onChange={(e) => setPHasMultipleSizes(e.target.checked)}
                          className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                      
                      {pHasMultipleSizes && (
                        <div className="space-y-3.5">
                          <span className="block text-xs text-emerald-800 font-semibold leading-normal">
                            এখানে আপনি পণ্যের বিভিন্ন ওজনের (যেমন: 0.5 KG, 1 KG) জন্য আলাদা বিক্রয় মূল্য ও পূর্বের মূল্য সেট করতে পারেন।
                          </span>
                          
                          {/* Sizes List */}
                          {pSizesList.length > 0 && (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {pSizesList.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 text-xs font-bold text-gray-700 shadow-xs">
                                  <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0 text-xs">{item.size}</span>
                                  <div className="flex items-center gap-2.5 ml-auto">
                                    <span className="text-gray-900 font-bold">বিক্রয়: ৳{item.price}</span>
                                    {item.originalPrice ? (
                                      <span className="text-red-500 line-through text-[11px]">পূর্বের: ৳{item.originalPrice}</span>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => setPSizesList(pSizesList.filter((_, i) => i !== idx))}
                                      className="text-red-500 hover:text-red-700 p-1 ml-1.5 font-bold text-sm"
                                      title="মুছে ফেলুন"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add New Size-Price Form */}
                          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-xs">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">ওজন/সাইজ</label>
                                <input
                                  type="text"
                                  id="add-size-name"
                                  placeholder="যেমন: 1 KG"
                                  className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">বিক্রয় মূল্য (৳)</label>
                                <input
                                  type="number"
                                  id="add-size-price"
                                  placeholder="যেমন: ৯৫০"
                                  className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">আগের মূল্য (৳)</label>
                                <input
                                  type="number"
                                  id="add-size-orig-price"
                                  placeholder="যেমন: ১২০০"
                                  className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const sizeInp = document.getElementById('add-size-name') as HTMLInputElement;
                                const priceInp = document.getElementById('add-size-price') as HTMLInputElement;
                                const origInp = document.getElementById('add-size-orig-price') as HTMLInputElement;
                                
                                const sizeVal = sizeInp?.value?.trim();
                                const priceVal = Number(priceInp?.value);
                                const origVal = origInp?.value ? Number(origInp.value) : undefined;
                                
                                if (!sizeVal || !priceVal || priceVal <= 0) {
                                  notify('ওজন এবং বিক্রয় মূল্য সঠিকভাবে লিখুন!', 'error');
                                  return;
                                }
                                
                                if (pSizesList.some(item => item.size.toLowerCase() === sizeVal.toLowerCase())) {
                                  notify('এই ওজনটি ইতিমধ্যে যোগ করা হয়েছে!', 'error');
                                  return;
                                }
                                
                                setPSizesList([...pSizesList, { size: sizeVal, price: priceVal, originalPrice: origVal }]);
                                
                                // Clear inputs
                                if (sizeInp) sizeInp.value = '';
                                if (priceInp) priceInp.value = '';
                                if (origInp) origInp.value = '';
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-2 px-3 rounded-lg text-xs md:text-sm transition-all shadow-xs cursor-pointer"
                            >
                              + এই ওজন ও দাম যোগ করুন
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* tab options custom info */}
                    <div className="pt-3 border-t border-gray-100 space-y-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <span className="block text-xs font-bold text-gray-700">📄 বিস্তারিত তথ্য (Tabs Customization - Description & Additional Info)</span>
                      
                      {/* Tagline */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">ছোট ট্যাগলাইন (Tagline)</label>
                        <input
                          type="text"
                          placeholder="যেমন: শতভাগ নিরাপদ ও সুস্বাদু আমাদের নিজস্ব বাগানের আম..."
                          value={pTagline}
                          onChange={(e) => setPTagline(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                        />
                      </div>

                      {/* Detailed Description Title */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">বিস্তারিত ডেসক্রিপশন টাইটেল (Detailed Title)</label>
                        <input
                          type="text"
                          placeholder="যেমন: রাজশাহীর খাঁটি আম (Premium Quality Himsagar)"
                          value={pDetailedTitle}
                          onChange={(e) => setPDetailedTitle(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                        />
                      </div>

                      {/* Bullets */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">কেন আমাদের পণ্যই সেরা? (প্রতি লাইনে একটি করে বুলেট পয়েন্ট লিখুন)</label>
                        <textarea
                          placeholder="যেমন:&#10;শতভাগ খাঁটি ও প্রাকৃতিক উপাদান&#10;কোনো ভেজাল বা প্রিজারভেটিভ নেই"
                          value={pDescriptionBullets}
                          onChange={(e) => setPDescriptionBullets(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Manufacturer */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">প্রস্তুতকারক (Manufacturer)</label>
                          <input
                            type="text"
                            placeholder="ম্যাংগো লাভার (MangoLover)"
                            value={pManufacturer}
                            onChange={(e) => setPManufacturer(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                          />
                        </div>

                        {/* Source Area */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">উৎস অঞ্চল (Source Area)</label>
                          <input
                            type="text"
                            placeholder="রাজশাহী, বাংলাদেশ"
                            value={pSourceArea}
                            onChange={(e) => setPSourceArea(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Shelf Life */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">শেল্ফ লাইফ (Shelf Life)</label>
                          <input
                            type="text"
                            placeholder="১২ মাস"
                            value={pShelfLife}
                            onChange={(e) => setPShelfLife(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                          />
                        </div>

                        {/* Organic Certificate */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">সার্টিফিকেট (Organic Cert.)</label>
                          <input
                            type="text"
                            placeholder="১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত"
                            value={pOrganicCertificate}
                            onChange={(e) => setPOrganicCertificate(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white"
                          />
                        </div>
                      </div>
                    </div>

                     {/* Beautiful 5-Slot Image Upload & Gallery Grid */}
                    <div className="pt-2 border-t border-gray-100 bg-gray-50/50 p-2.5 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="block text-[10px] font-bold text-gray-700">পণ্যের ছবিসমূহ (সর্বোচ্চ ৫টি)</span>
                        <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">৪০০×৪০০ px</span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 1, 2, 3, 4].map((index) => {
                          const imgUrl = pImages[index];
                          const isPrimary = index === 0;
                          const isHover = index === 1;
                          
                          return (
                            <div 
                              key={index} 
                              className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative overflow-hidden transition-all bg-white ${
                                imgUrl 
                                  ? 'border-gray-200' 
                                  : isPrimary
                                    ? 'border-dashed border-emerald-300 hover:border-emerald-500'
                                    : isHover
                                      ? 'border-dashed border-orange-300 hover:border-orange-500'
                                      : 'border-dashed border-gray-300 hover:border-gray-400'
                              }`}
                              title={isPrimary ? 'প্রধান ছবি (Primary)' : isHover ? '২নং ছবি (হোভার ইফেক্ট)' : `ছবি ${index + 1}`}
                            >
                              {imgUrl ? (
                                <div className="w-full h-full relative group/img">
                                  <img 
                                    src={imgUrl} 
                                    alt={`Product ${index + 1}`} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className={`absolute top-0.5 left-0.5 px-1 py-0.2 rounded-md text-[7px] font-black tracking-tighter text-white select-none ${
                                    isPrimary ? 'bg-emerald-600' : isHover ? 'bg-orange-500' : 'bg-gray-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImgs = [...pImages];
                                      newImgs[index] = '';
                                      setPImages(newImgs);
                                    }}
                                    className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-all cursor-pointer shadow-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full p-0.5 gap-1 bg-white">
                                  <span className={`text-[7px] font-black select-none px-1 rounded-xs ${
                                    isPrimary ? 'bg-emerald-50 text-emerald-700 font-extrabold' : isHover ? 'bg-orange-50 text-orange-700 font-extrabold' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {isPrimary ? 'প্রধান' : isHover ? 'হোভার' : `${index + 1}নং`}
                                  </span>
                                  
                                  <div className="flex gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => document.getElementById(`p-file-input-${index}`)?.click()}
                                      className="p-0.5 hover:bg-emerald-50 rounded text-emerald-600 transition-colors cursor-pointer"
                                      title="কম্পিউটার থেকে আপলোড"
                                    >
                                      <Upload className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setImageSelectorTarget(`product-slot-${index}`)}
                                      className="p-0.5 hover:bg-orange-50 rounded text-orange-500 transition-colors cursor-pointer"
                                      title="গ্যালারি থেকে সিলেক্ট"
                                    >
                                      <ImageIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                  
                                  <input
                                    type="file"
                                    id={`p-file-input-${index}`}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        compressAndSetImage(file, (base64) => {
                                          const newImgs = [...pImages];
                                          newImgs[index] = base64;
                                          setPImages(newImgs);
                                        });
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[8px] text-gray-400 font-bold mt-1.5 text-center leading-normal">
                        * ২নং ছবি হোভার করলে জুম হয়ে দেখাবে। লিংক ছাড়া শুধু আপলোড/গ্যালারি ব্যবহার করুন।
                      </p>
                    </div>

                    {/* Add Product Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-red-700 hover:bg-red-800 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Product</span>
                    </button>
                  </form>
                </div>

                {/* CATEGORY MANAGEMENT PANEL */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-orange-600 text-sm md:text-base flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Palette className="w-5 h-5 text-orange-500" />
                    <span>ক্যাটাগরি ম্যানেজমেন্ট</span>
                  </h3>
                  
                  {/* Category Add Form */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-700 text-xs">নতুন ক্যাটাগরি যুক্ত করুন</h4>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">ক্যাটাগরির নাম (বাংলায়)</label>
                      <input
                        type="text"
                        placeholder="যেমন: ড্রাই ফ্রুটস"
                        id="new-category-name"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^\u0980-\u09FFa-zA-Z0-9-]/g, '');
                              const id = 'cat-' + Date.now();
                              const newCat: Category = { id, name: val, slug, icon: '' };
                              onUpdateCategories([...categories, newCat]);
                              (e.target as HTMLInputElement).value = '';
                              notify('ক্যাটাগরি সফলভাবে যুক্ত করা হয়েছে!', 'success');
                            }
                          }
                        }}
                      />
                      <p className="text-[9px] text-gray-400 font-bold mt-1">নাম লিখে Enter চাপুন অথবা নিচের যুক্ত করুন বাটনে ক্লিক করুন।</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const inputEl = document.getElementById('new-category-name') as HTMLInputElement;
                        const val = inputEl?.value.trim();
                        if (val) {
                          const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^\u0980-\u09FFa-zA-Z0-9-]/g, '');
                          const id = 'cat-' + Date.now();
                          const newCat: Category = { id, name: val, slug, icon: '' };
                          onUpdateCategories([...categories, newCat]);
                          inputEl.value = '';
                          notify('ক্যাটাগরি সফলভাবে যুক্ত করা হয়েছে!', 'success');
                        } else {
                          notify('দয়া করে ক্যাটাগরির নাম লিখুন!', 'error');
                        }
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] py-2 rounded-lg transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>যুক্ত করুন</span>
                    </button>
                  </div>

                  {/* Current Categories List with delete option */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 text-xs">বর্তমান ক্যাটাগরি সমূহ ({categories.length})</h4>
                    <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-xs gap-4">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-slate-800 truncate block">{cfgCategoryNames[cat.slug] || cat.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={cat.showInNavbar !== false}
                                  onChange={(e) => {
                                    const updated = categories.map(c => c.id === cat.id ? { ...c, showInNavbar: e.target.checked } : c);
                                    onUpdateCategories(updated);
                                  }}
                                  className="rounded text-orange-600 focus:ring-orange-500 w-3 h-3 cursor-pointer"
                                />
                                <span className="text-[10px] text-gray-500 font-semibold">শীর্ষ বারে দেখান</span>
                              </label>
                            </div>
                          </div>
                          {categories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryToDelete(cat);
                              }}
                              className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PRODUCTS GRID WITH FILTER/SEARCH (8 cols) */}
              <div className="xl:col-span-8 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-gray-800 text-base">সব পণ্য</h3>
                      <button
                        type="button"
                        onClick={() => {
                          // Clear inputs & show add product modal
                          setPName('');
                          setPSKU('');
                          setPDescription('');
                          setPPrice('');
                          setPPurchasePrice('');
                          setPOriginalPrice('');
                          setPImages(['', '', '', '', '']);
                          setPUnit('পিস');
                          setPStock('');
                          setPReorderLevel(5);
                          setPStatus('Active');
                          setPBadge('none');
                          setPTagline('');
                          setPDetailedTitle('');
                          setPDescriptionBullets('');
                          setPManufacturer('ম্যাংগো লাভার (MangoLover)');
                          setPSourceArea('রাজশাহী, বাংলাদেশ');
                          setPShelfLife('১২ মাস (শুকনো ও ঠাণ্ডা জায়গায় সংরক্ষণ করুন)');
                          setPOrganicCertificate('১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত পরীক্ষিত');
                          setPHasMultipleSizes(false);
                          setPSizesList([]);
                          setShowAddProductModal(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>নতুন আইটেম যোগ করুন</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      {/* Category Filter */}
                      <select
                        value={prodCategoryFilter}
                        onChange={(e) => {
                          setProdCategoryFilter(e.target.value);
                          setProdCurrentPage(1);
                        }}
                        className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden font-bold text-gray-600 bg-white"
                      >
                        <option value="all">সব ক্যাটাগরি</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cfgCategoryNames[cat.slug] || cat.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Search input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="অনুসন্ধান করুন..."
                          value={prodSearchQuery}
                          onChange={(e) => {
                            setProdSearchQuery(e.target.value);
                            setProdCurrentPage(1);
                          }}
                          className="pl-3 pr-8 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-hidden font-medium w-40 sm:w-48 bg-white"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>



                  {/* Grid view of Products as in Image 1 with Pagination */}
                  {(() => {
                    const filtered = products.filter(p => {
                      const matchesSearch = matchesSearchWithNumerals(p.name, prodSearchQuery) || 
                                            (p.sku && matchesSearchWithNumerals(p.sku, prodSearchQuery));
                      const matchesCategory = prodCategoryFilter === 'all' || p.category === prodCategoryFilter;
                      return matchesSearch && matchesCategory;
                    });
                    const itemsPerPage = 12;
                    const totalItems = filtered.length;
                    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                    const currentPageSafe = Math.min(prodCurrentPage, totalPages);
                    const displayed = filtered.slice((currentPageSafe - 1) * itemsPerPage, currentPageSafe * itemsPerPage);

                    // Local helper for Bengali numbers
                    const toBengaliNumber = (num: number | string): string => {
                      const banglaDigits: Record<string, string> = {
                        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
                        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
                      };
                      return String(num).split('').map(char => banglaDigits[char] || char).join('');
                    };

                    if (totalItems === 0) {
                      return (
                        <div className="text-center py-12 text-gray-400 font-medium text-xs">
                          কোনো পণ্য পাওয়া যায়নি।
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="max-h-[580px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {displayed.map((p) => {
                              const itemSKU = p.sku || `SKU-${p.id}`;
                              const isInactive = p.status === 'Inactive';
                              return (
                                <div key={p.id} className="border border-gray-200 rounded-2xl p-4 bg-white hover:shadow-xs transition-all relative flex flex-col justify-between">
                                  <div>
                                    {/* Product Info Row with image next to title */}
                                    <div className="flex gap-3 items-start">
                                      {/* Small Product Image */}
                                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {p.image ? (
                                          <img 
                                            src={p.image} 
                                            alt={p.name} 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <ImageIcon className="w-5 h-5 text-gray-300" />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-1.5">
                                          <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-gray-950 text-xs md:text-sm truncate animate-none" title={p.name}>{p.name}</h4>
                                            <span className="text-[9px] md:text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                                              {p.category}
                                            </span>
                                          </div>
                                          <div className="text-right flex-shrink-0">
                                            <span className="font-extrabold text-emerald-800 text-xs md:text-sm">৳{p.price}</span>
                                            {p.purchasePrice !== undefined && (
                                              <span className="block text-[9px] text-gray-400 mt-0.5">
                                                ক্রয়: ৳{p.purchasePrice}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* SKU and Status Row */}
                                    <div className="flex justify-between items-center mt-2.5 text-[11px] text-gray-500 font-medium">
                                      <span>SKU: {itemSKU}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isInactive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                      }`}>
                                        {p.status || 'Active'}
                                      </span>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-100 my-2.5"></div>

                                    {/* Stock & Unit Row */}
                                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                                      <span className="flex items-center gap-1">
                                        স্টক পরিমাণ: 
                                        {p.reorderLevel !== undefined && p.stock <= p.reorderLevel && (
                                          <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold">Low</span>
                                        )}
                                      </span>
                                      <span className="text-gray-900 font-bold">{p.stock} {p.unit || 'পিস'}</span>
                                    </div>
                                  </div>

                                  {/* Edit and Delete Buttons exactly like Image 1 */}
                                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                                    <button
                                      onClick={() => handleOpenEdit(p)}
                                      className="flex-1 flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs py-1.5 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => setProductToDelete(p)}
                                      className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 rounded-lg border border-red-100 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs font-bold text-gray-500">
                            <div>
                              <span>মোট পণ্য: <strong className="text-gray-800">{toBengaliNumber(totalItems)}</strong> টি | পৃষ্ঠা: <strong className="text-gray-800">{toBengaliNumber(currentPageSafe)}/{toBengaliNumber(totalPages)}</strong></span>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Previous Button */}
                              <button
                                type="button"
                                disabled={currentPageSafe === 1}
                                onClick={() => setProdCurrentPage(currentPageSafe - 1)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  currentPageSafe === 1
                                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                    : 'bg-white hover:bg-slate-50 text-gray-700 border-gray-200 cursor-pointer hover:border-gray-300'
                                }`}
                              >
                                পূর্ববর্তী
                              </button>

                              {/* Page numbers */}
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                const isCurrent = page === currentPageSafe;
                                return (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => setProdCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                                      isCurrent
                                        ? 'bg-red-700 text-white border-red-700 shadow-xs'
                                        : 'bg-white hover:bg-slate-50 text-gray-700 border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {toBengaliNumber(page)}
                                  </button>
                                );
                              })}

                              {/* Next Button */}
                              <button
                                type="button"
                                disabled={currentPageSafe === totalPages}
                                onClick={() => setProdCurrentPage(currentPageSafe + 1)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  currentPageSafe === totalPages
                                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                    : 'bg-white hover:bg-slate-50 text-gray-700 border-gray-200 cursor-pointer hover:border-gray-300'
                                }`}
                              >
                                পরবর্তী
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS LIST */}
          {hasPermission('orders') && activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm md:text-base">অর্ডার ট্র্যাকিং ও তালিকা</h3>
                    <p className="text-xs text-gray-400">গ্রাহকদের থেকে আগত সমস্ত অর্ডারের স্ট্যাটাস পরিবর্তন করুন</p>
                  </div>

                  {/* Filter Status Selector */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCreateOrderModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>মেমো কাটুন / নতুন অর্ডার</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden font-bold text-gray-600 bg-white"
                      >
                        <option value="all">সবগুলো অর্ডার</option>
                        <option value="pending">অপেক্ষমাণ (Pending)</option>
                        <option value="processing">প্রসেসিং (Processing)</option>
                        <option value="shipped">শিপড্ (Shipped)</option>
                        <option value="delivered">ডেলিভার্ড (Delivered)</option>
                        <option value="cancelled">বাতিল (Cancelled)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Search orders */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="অর্ডার আইডি, গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              {/* Selected Order Details View modal overlay */}
              {selectedOrderDetails && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-2xl relative space-y-4 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer no-print"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>

                  <h4 className="font-extrabold text-orange-600 text-sm md:text-base flex items-center gap-1.5 border-b pb-2 border-orange-100 no-print">
                    <Eye className="w-5 h-5" />
                    অর্ডার বিবরণী ও ক্যাশ মেমো (ID: {selectedOrderDetails.id})
                  </h4>

                  {/* Two Column Grid: Left for controls, Right for Cash Memo preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    {/* Left Column: Management Panel */}
                    <div className="space-y-4 text-xs no-print">
                      <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-3">
                        <h5 className="font-bold text-orange-800 text-xs uppercase tracking-wider border-b border-orange-100 pb-1.5">১. গ্রাহকের তথ্য</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                          <p><span className="font-bold text-gray-400">গ্রাহকের নাম:</span> <strong className="text-gray-900">{selectedOrderDetails.customerName}</strong></p>
                          <p><span className="font-bold text-gray-400">মোবাইল নম্বর:</span> <strong className="text-gray-900 font-sans">{selectedOrderDetails.customerPhone}</strong></p>
                          <p className="sm:col-span-2"><span className="font-bold text-gray-400">ডেলিভারি ঠিকানা:</span> <strong className="text-gray-800">{selectedOrderDetails.deliveryAddress}, {selectedOrderDetails.area}, {selectedOrderDetails.district}</strong></p>
                          <p><span className="font-bold text-gray-400">অর্ডার সময়:</span> <strong className="text-gray-800">{selectedOrderDetails.createdAt}</strong></p>
                        </div>
                      </div>

                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-b border-gray-200 pb-1.5">২. পেমেন্ট ও স্ট্যাটাস</h5>
                        <div className="space-y-2">
                          <p className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                            <span className="font-bold text-gray-500">পেমেন্ট পদ্ধতি:</span> 
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                              selectedOrderDetails.paymentMethod === 'cod' ? 'bg-slate-100 text-slate-700' :
                              selectedOrderDetails.paymentMethod === 'bkash' ? 'bg-pink-100 text-pink-700' :
                              selectedOrderDetails.paymentMethod === 'nagad' ? 'bg-red-100 text-red-700' :
                              selectedOrderDetails.paymentMethod === 'rocket' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {selectedOrderDetails.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি (COD)' :
                               selectedOrderDetails.paymentMethod === 'bkash' ? 'বিকাশ (bKash)' :
                               selectedOrderDetails.paymentMethod === 'nagad' ? 'নগদ (Nagad)' :
                               selectedOrderDetails.paymentMethod === 'rocket' ? 'রকেট (Rocket)' : selectedOrderDetails.paymentMethod}
                            </span>
                          </p>
                          {selectedOrderDetails.bkashNumber && (
                            <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                              <span className="font-bold text-gray-500">
                                {selectedOrderDetails.paymentMethod === 'bkash' ? 'বিকাশ নম্বর:' :
                                 selectedOrderDetails.paymentMethod === 'nagad' ? 'নগদ নম্বর:' :
                                 selectedOrderDetails.paymentMethod === 'rocket' ? 'রকেট নম্বর:' : 'টাকা পাঠানো নম্বর:'}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-800">{selectedOrderDetails.bkashNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedOrderDetails.bkashNumber!, 'phone')}
                                  className="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                                  title="কপি করুন"
                                >
                                  {copiedTextId === 'phone' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          {selectedOrderDetails.trxId && (
                            <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                              <span className="font-bold text-gray-500">Transaction ID (TrxID):</span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono bg-white px-1.5 py-0.5 border rounded text-gray-800 font-bold">{selectedOrderDetails.trxId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedOrderDetails.trxId!, 'trxId')}
                                  className="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                                  title="কপি করুন"
                                >
                                  {copiedTextId === 'trxId' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="font-bold text-gray-700">স্ট্যাটাস পরিবর্তন করুন:</span>
                            <select
                              value={selectedOrderDetails.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as OrderStatus;
                                onUpdateOrderStatus(selectedOrderDetails.id, newStatus);
                                setSelectedOrderDetails({
                                  ...selectedOrderDetails,
                                  status: newStatus
                                });
                                notify(`অর্ডার #${selectedOrderDetails.id} এর স্ট্যাটাস সফলভাবে পরিবর্তন করা হয়েছে!`, 'success');
                              }}
                              className="border border-gray-200 bg-white rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 focus:outline-hidden cursor-pointer"
                            >
                              <option value="pending">অপেক্ষমাণ (Pending)</option>
                              <option value="processing">প্রসেসিং (Processing)</option>
                              <option value="shipped">শিপড্ (Shipped)</option>
                              <option value="delivered">ডেলিভার্ড (Delivered)</option>
                              <option value="cancelled">বাতিল (Cancelled)</option>
                            </select>
                          </div>

                          <div className="pt-2 border-t border-gray-200 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(selectedOrderDetails)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-red-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>মেমোটি ডিলিট করুন</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="border border-gray-100 p-4 rounded-xl space-y-2 animate-none">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-gray-800 flex items-center gap-1">
                            📦 অর্ডার করা পণ্যসমূহ:
                          </p>
                          {!isEditingOrder ? (
                            <button
                              type="button"
                              onClick={handleStartEditOrder}
                              className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-200 font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>এডিট করুন</span>
                            </button>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={handleCancelEditOrder}
                                className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-extrabold transition-all cursor-pointer"
                              >
                                বাতিল
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEditOrder}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md font-extrabold flex items-center gap-0.5 transition-all cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                সংরক্ষণ
                              </button>
                            </div>
                          )}
                        </div>

                        {!isEditingOrder ? (
                          <>
                            {/* Static View of Items */}
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {selectedOrderDetails.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <img src={item.image} className="w-8 h-8 rounded-md object-cover" referrerPolicy="no-referrer" />
                                    <div>
                                      <p className="font-bold text-gray-700 leading-tight">{item.productName}</p>
                                      <p className="text-[10px] text-gray-400 font-sans">৳{item.price} × {item.quantity} {item.unit}</p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-gray-800 font-sans">৳{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-100 pt-2 text-xs">
                              <div className="space-y-0.5">
                                <p className="text-gray-500 font-medium">ডেলিভারি চার্জ: <span className="font-bold text-gray-800 font-sans">৳{selectedOrderDetails.deliveryCharge}</span></p>
                                {selectedOrderDetails.discountAmount && selectedOrderDetails.discountAmount > 0 ? (
                                  <p className="text-red-500 font-medium">ডিসকাউন্ট: <span className="font-bold font-sans">৳{selectedOrderDetails.discountAmount}</span></p>
                                ) : null}
                              </div>
                              <p className="font-extrabold text-gray-800">সর্বমোট মূল্য: <span className="text-orange-600 font-sans">৳{selectedOrderDetails.totalAmount}</span></p>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Interactive Editing View of Items */}
                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 py-1">
                              {selectedOrderDetails.items.map((item, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-orange-50/20 p-2 rounded-lg border border-orange-100 gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <img src={item.image} className="w-8 h-8 rounded-md object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-gray-800 leading-tight text-xs break-words" title={item.productName}>{item.productName}</p>
                                      <p className="text-[10px] text-gray-400 font-sans mt-0.5">মূল্য: ৳{item.price} / {item.unit}</p>
                                      {(() => {
                                        const prod = products.find(p => p.id === item.productId);
                                        if (!prod) return null;
                                        const sizes = getProductSizes(prod.id, prod);
                                        if (sizes.length <= 1) return null;
                                        return (
                                          <div className="flex items-center gap-1 mt-1 bg-white border border-gray-100 rounded-md px-1.5 py-0.5 w-fit">
                                            <span className="text-[9px] text-gray-500 font-extrabold">সাইজ/ওজন:</span>
                                            <select
                                              value={item.unit}
                                              onChange={(e) => {
                                                handleUpdateItemSize(index, e.target.value);
                                              }}
                                              className="bg-transparent border-0 p-0 text-[9px] font-extrabold text-orange-600 focus:outline-hidden focus:ring-0 cursor-pointer ml-1 font-sans"
                                            >
                                              {sizes.map(sz => (
                                                <option key={sz} value={sz}>{sz}</option>
                                              ))}
                                            </select>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                                    {/* Quantity adjustments */}
                                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5 shadow-3xs">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemQty(index, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-45 rounded-md cursor-pointer transition-colors"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 1;
                                          handleUpdateItemQty(index, val);
                                        }}
                                        className="w-8 text-center font-sans font-extrabold text-xs text-gray-800 focus:outline-hidden bg-transparent"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemQty(index, item.quantity + 1)}
                                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Subtotal & Delete */}
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-800 font-sans text-xs w-14 text-right">
                                        ৳{item.price * item.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded-lg cursor-pointer transition-colors"
                                        title="আইটেমটি ডিলিট করুন"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add Product To Order block */}
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1.5 relative" id="product-add-selector">
                              <label className="block text-[10px] font-extrabold text-gray-600">
                                ➕ নতুন পণ্য যোগ করুন:
                              </label>
                              
                              <div className="flex gap-1.5 relative">
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    placeholder="পণ্য খুঁজুন (নাম বা আইডি লিখে)..."
                                    value={productToAddSearchQuery}
                                    onChange={(e) => {
                                      setProductToAddSearchQuery(e.target.value);
                                      setShowProductToAddDropdown(true);
                                    }}
                                    onFocus={() => setShowProductToAddDropdown(true)}
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-6 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                                  />
                                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                  {productToAddSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductToAddSearchQuery('');
                                        setSelectedProductToAdd('');
                                        setSelectedSizeToAdd('');
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-[10px] p-1"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddProductToOrder(selectedProductToAdd, selectedSizeToAdd, qtyToAdd)}
                                  disabled={!selectedProductToAdd}
                                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                >
                                  যোগ করুন
                                </button>
                              </div>

                              {/* Autocomplete Dropdown overlay */}
                              {showProductToAddDropdown && (
                                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-xs">
                                  {(() => {
                                    const query = productToAddSearchQuery.toLowerCase().trim();
                                    const filtered = products.filter(p => {
                                      if (p.status === 'Inactive') return false;
                                      if (!query) return true;
                                      return (
                                        p.name.toLowerCase().includes(query) ||
                                        p.id.toLowerCase().includes(query) ||
                                        (p.category && p.category.toLowerCase().includes(query))
                                      );
                                    });

                                    if (filtered.length === 0) {
                                      return <div className="px-3 py-2 text-gray-500 italic">কোনো পণ্য পাওয়া যায়নি</div>;
                                    }

                                    return filtered.map(p => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedProductToAdd(p.id);
                                          const sizes = getProductSizes(p.id, p);
                                          if (sizes && sizes.length > 0) {
                                            setSelectedSizeToAdd(sizes[0]);
                                          } else {
                                            setSelectedSizeToAdd(p.unit || 'পিস');
                                          }
                                          setProductToAddSearchQuery(p.name);
                                          setShowProductToAddDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-orange-50 flex justify-between items-center border-b border-gray-50 last:border-b-0 ${selectedProductToAdd === p.id ? 'bg-orange-50 font-bold text-orange-700' : 'text-slate-700'}`}
                                      >
                                        <span className="font-medium">{p.name}</span>
                                        <span className="font-mono text-gray-500 text-[10px]">৳{p.price}</span>
                                      </button>
                                    ));
                                  })()}
                                </div>
                              )}

                              {/* Variant/Size & Quantity configuration */}
                              {selectedProductToAdd && (() => {
                                const p = products.find(prod => prod.id === selectedProductToAdd);
                                if (!p) return null;
                                const sizes = getProductSizes(p.id, p);
                                
                                return (
                                  <div className="mt-2 p-2 bg-orange-50/40 border border-orange-100 rounded-lg space-y-2 animate-fadeIn text-[11px]">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-gray-500 font-bold">আইটেম সেটিংস:</span>
                                      <span className="text-orange-700 font-black">
                                        মূল্য: ৳{selectedSizeToAdd && p.sizePrices?.[selectedSizeToAdd] ? p.sizePrices[selectedSizeToAdd].price : p.price}
                                      </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                                      {sizes.length > 1 && (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-gray-500 font-bold">ওজন/সাইজ:</span>
                                          <select
                                            value={selectedSizeToAdd}
                                            onChange={(e) => setSelectedSizeToAdd(e.target.value)}
                                            className="bg-white border border-gray-200 rounded-md px-2 py-0.5 text-[10px] font-bold text-gray-700 cursor-pointer"
                                          >
                                            {sizes.map(size => (
                                              <option key={size} value={size}>
                                                {size} {p.sizePrices?.[size] ? `(৳${p.sizePrices[size].price})` : ''}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-1.5">
                                        <span className="text-gray-500 font-bold">পরিমাণ:</span>
                                        <div className="flex items-center border border-gray-200 bg-white rounded-md p-0.5">
                                          <button
                                            type="button"
                                            onClick={() => setQtyToAdd(Math.max(1, qtyToAdd - 1))}
                                            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            min="1"
                                            value={qtyToAdd}
                                            onChange={(e) => setQtyToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-8 text-center text-[10px] font-sans font-black bg-transparent border-0 p-0 focus:outline-hidden"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setQtyToAdd(qtyToAdd + 1)}
                                            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Charge & Discount inputs */}
                            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2 text-xs">
                              <div className="space-y-1">
                                <label className="block text-[10px] font-extrabold text-gray-500 font-bold">
                                  ডেলিভারি চার্জ (৳):
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={selectedOrderDetails.deliveryCharge}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    handleUpdateDeliveryCharge(val);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 font-sans font-bold text-gray-700 focus:outline-hidden"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] font-extrabold text-gray-500 font-bold">
                                  ডিসকাউন্ট (৳):
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={selectedOrderDetails.discountAmount || 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    handleUpdateDiscountAmount(val);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 font-sans font-bold text-gray-700 focus:outline-hidden"
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-100 pt-2 text-xs">
                              <span className="font-bold text-gray-500">সর্বমোট প্রদেয়:</span>
                              <span className="font-extrabold text-orange-600 font-sans text-sm">৳{selectedOrderDetails.totalAmount}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Beautiful printable and viewable traditional Cash Memo */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between no-print mb-1 flex-wrap gap-2">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-100">
                          📄 ক্যাশ মেমো লাইভ প্রিভিউ (Live Preview)
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handlePrint('printable-thermal-memo', `POS Invoice #${selectedOrderDetails.id}`);
                            }}
                            className="bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>থার্মাল প্রিন্ট (80mm)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handlePrint('printable-memo', `Cash Memo #${selectedOrderDetails.id}`);
                            }}
                            className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>মেমো প্রিন্ট করুন</span>
                          </button>
                        </div>
                      </div>

                      {/* BEAUTIFUL PRINTABLE CASH MEMO */}
                      <div id="printable-memo" className="text-black bg-white p-6 border-4 border-double border-slate-800 rounded-xl space-y-6 max-w-2xl mx-auto font-sans relative overflow-hidden shadow-xs print:shadow-none print:border-none print:p-0 print:m-0">
                        
                        {/* Diagonal Watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none select-none opacity-[0.05] text-center w-full z-0 flex flex-col items-center justify-center gap-2">
                          {siteConfig.storeLogo && (
                            <img 
                              src={siteConfig.storeLogo} 
                              alt="Watermark Logo" 
                              className="w-32 h-32 object-contain filter grayscale" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {siteConfig.storeNameImage ? (
                            <img 
                              src={siteConfig.storeNameImage} 
                              alt="Watermark Name" 
                              className="h-10 object-contain filter grayscale" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <h2 className="text-3xl font-black uppercase tracking-widest">{siteConfig.storeName || "ম্যাংগো লাভার"}</h2>
                          )}
                          {siteConfig.storeSloganImage && (
                            <img 
                              src={siteConfig.storeSloganImage} 
                              alt="Watermark Slogan" 
                              className="h-5 object-contain filter grayscale" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Diagonal Stamp Badge based on status */}
                        <div className="absolute top-20 right-6 rotate-12 pointer-events-none select-none opacity-40 border-4 border-double px-3 py-1.5 rounded-lg text-center font-black text-xs z-10 uppercase tracking-widest leading-none">
                          {selectedOrderDetails.status === 'delivered' ? (
                            <span className="text-emerald-600 border-emerald-600">PAID & DELIVERED</span>
                          ) : selectedOrderDetails.status === 'cancelled' ? (
                            <span className="text-red-600 border-red-600">CANCELLED</span>
                          ) : selectedOrderDetails.paymentMethod === 'cod' ? (
                            <span className="text-amber-600 border-amber-600">CASH ON DELIVERY</span>
                          ) : (
                            <span className="text-sky-600 border-sky-600">ONLINE PAID</span>
                          )}
                        </div>

                        {/* Header */}
                        <div className="text-center space-y-1 pb-4 border-b-2 border-slate-300 relative z-10 flex flex-col items-center justify-center">
                          {siteConfig?.storeLogo && (
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 mx-auto mb-1.5 shadow-2xs">
                              <img 
                                src={siteConfig.storeLogo} 
                                alt="Store Logo" 
                                className="w-full h-full object-cover scale-105" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          {siteConfig.storeNameImage ? (
                            <img 
                              src={siteConfig.storeNameImage} 
                              alt={siteConfig.storeName} 
                              className="h-10 md:h-12 object-contain mx-auto" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <>
                              <h1 className="text-2xl font-black text-slate-950">{siteConfig.storeName || "ম্যাংগো লাভার"}</h1>
                              {siteConfig.storeSloganImage ? (
                                <img 
                                  src={siteConfig.storeSloganImage} 
                                  alt={siteConfig.storeSlogan} 
                                  className="h-4 md:h-5 object-contain mx-auto mt-1" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <p className="text-xs font-bold text-slate-600">{siteConfig.storeSlogan || "শতভাগ খাঁটি ও নিরাপদ অর্গানিক ফুড শপ"}</p>
                              )}
                            </>
                          )}
                          <p className="text-[10px] text-slate-500 font-semibold mt-1">অফিস: {siteConfig.contactOffice || "Nowhata, Paba, Rajshahi"}</p>
                          <p className="text-[10px] text-slate-500 font-semibold font-sans">মোবাইল: {siteConfig.contactPhone || "01301-636461"} | ইমেইল: {siteConfig.contactEmail || "info@mangolover.com"}</p>
                        </div>

                        <div className="text-center py-1 relative z-10">
                          <span className="border-2 border-slate-950 px-3 py-1 text-xs font-black uppercase bg-slate-100 tracking-wider">ক্যাশ মেমো / CASH RECEIPT</span>
                        </div>

                        {/* Meta info */}
                        <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200 relative z-10">
                          <div className="space-y-1">
                            <p><span className="font-bold text-slate-500">মেমো নম্বর:</span> <strong className="font-sans text-slate-900">#{selectedOrderDetails.id}</strong></p>
                            <p><span className="font-bold text-slate-500">মেমো তারিখ:</span> <strong className="text-slate-800">{selectedOrderDetails.createdAt}</strong></p>
                            <p>
                              <span className="font-bold text-slate-500">পেমেন্ট পদ্ধতি:</span> 
                              <strong className="uppercase text-slate-800 ml-1">
                                {selectedOrderDetails.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : selectedOrderDetails.paymentMethod}
                              </strong>
                            </p>
                            {selectedOrderDetails.trxId && (
                              <p><span className="font-bold text-slate-500">TrxID:</span> <strong className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{selectedOrderDetails.trxId}</strong></p>
                            )}
                          </div>
                          <div className="space-y-1 border-l border-slate-200 pl-4">
                            <p><span className="font-bold text-slate-500">গ্রাহকের নাম:</span> <strong className="text-slate-900">{selectedOrderDetails.customerName}</strong></p>
                            <p><span className="font-bold text-slate-500">মোবাইল নম্বর:</span> <strong className="text-slate-900 font-sans">{selectedOrderDetails.customerPhone}</strong></p>
                            <p><span className="font-bold text-slate-500">ডেলিভারি ঠিকানা:</span> <strong className="text-slate-800 leading-snug">{selectedOrderDetails.deliveryAddress}, {selectedOrderDetails.area}, {selectedOrderDetails.district}</strong></p>
                          </div>
                        </div>

                        {/* Table */}
                        <table className="w-full border-collapse text-xs relative z-10">
                          <thead>
                            <tr className="border-b-2 border-slate-300 text-left bg-slate-100 font-bold">
                              <th className="py-2 px-1 text-slate-900">ক্রমিক</th>
                              <th className="py-2 px-1 text-slate-900">পণ্যের বিবরণ</th>
                              <th className="py-2 px-1 text-center text-slate-900">পরিমাণ</th>
                              <th className="py-2 px-1 text-right text-slate-900 font-sans">একক মূল্য</th>
                              <th className="py-2 px-1 text-right text-slate-900 font-sans">মোট মূল্য</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {selectedOrderDetails.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-1 font-bold text-slate-500">{idx + 1}</td>
                                <td className="py-2 px-1 font-bold text-slate-900">{item.productName}</td>
                                <td className="py-2 px-1 text-center font-bold text-slate-800">{item.quantity} {item.unit}</td>
                                <td className="py-2 px-1 text-right font-bold font-sans text-slate-700">৳{item.price}</td>
                                <td className="py-2 px-1 text-right font-black font-sans text-slate-900">৳{item.price * item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pricing calculations */}
                        <div className="flex justify-end pt-2 border-t-2 border-slate-300 relative z-10">
                          <div className="w-64 space-y-1 text-xs">
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-bold text-slate-600">উপ-মোট (Subtotal):</span>
                              <span className="font-black font-sans text-slate-800">৳{selectedOrderDetails.totalAmount - selectedOrderDetails.deliveryCharge}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-bold text-slate-600">ডেলিভারি চার্জ (Shipping):</span>
                              <span className="font-black font-sans text-slate-800">৳{selectedOrderDetails.deliveryCharge}</span>
                            </div>
                            <div className="flex justify-between pt-1 text-sm">
                              <span className="font-black text-slate-900">সর্বমোট প্রদেয় (Grand Total):</span>
                              <span className="font-black text-orange-600 font-sans text-base border-b-2 border-slate-900">৳{selectedOrderDetails.totalAmount}</span>
                            </div>
                          </div>
                        </div>

                        {/* In Words */}
                        <div className="text-center pt-2 text-[11px] font-bold text-slate-700 border-t border-slate-100 relative z-10 space-y-0.5">
                          <div>কথায়: {toBengaliWords(selectedOrderDetails.totalAmount)} টাকা মাত্র।</div>
                          <div className="text-[10px] text-slate-500 font-medium font-sans italic">In Words: {toEnglishWords(selectedOrderDetails.totalAmount)} Taka Only.</div>
                        </div>

                        {/* Message */}
                        <div className="text-center pt-6 text-[11px] font-bold text-slate-500 italic relative z-10">
                          "আমাদের থেকে পণ্য ক্রয়ের জন্য আপনাকে আন্তরিক ধন্যবাদ। ম্যাংগো লাভার-এর সাথে থাকুন!"
                        </div>

                        {/* Barcode Graphic */}
                        <div className="flex flex-col items-center justify-center pt-2 opacity-80 relative z-10">
                          <div className="h-7 w-48 bg-slate-950 flex items-center justify-between px-3 text-[6px] text-white tracking-widest font-mono">
                            ||||||||||||||||||||||||||||||||||||||||||||||||||||||
                          </div>
                          <span className="text-[8px] font-mono text-slate-500 mt-0.5">ORDER-ID-#{selectedOrderDetails.id}</span>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs text-slate-800 relative z-10">
                          <div>
                            <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">ক্রেতার স্বাক্ষর</div>
                          </div>
                          <div>
                            <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">অনুমোদিত স্বাক্ষর</div>
                          </div>
                        </div>
                      </div>

                      {/* POS THERMAL INVOICE (80mm) */}
                      <div
                        id="printable-thermal-memo"
                        className="hidden"
                      >
                        {/* Header */}
                        <div className="header text-center">
                          {siteConfig.storeLogo && (
                            <img
                              src={siteConfig.storeLogo}
                              alt="logo"
                              className="logo"
                              referrerPolicy="no-referrer"
                              style={{ maxWidth: '40px', height: 'auto', display: 'block', margin: '0 auto 2px auto' }}
                            />
                          )}
                          <h1 className="shop-name" style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>
                            {siteConfig.storeName || "ম্যাংগো লাভার"}
                          </h1>
                          <p className="shop-meta" style={{ fontSize: '9px', margin: '0' }}>
                            {siteConfig.contactOffice || "Nowhata, Paba, Rajshahi"}
                          </p>
                          <p className="shop-meta" style={{ fontSize: '9px', margin: '0' }}>
                            ফোন: {siteConfig.contactPhone || "01301-636461"}
                          </p>
                        </div>

                        {/* Customer & Invoice Info */}
                        <div style={{ fontSize: '9px', marginBottom: '4px', marginTop: '5px', borderTop: '1px dashed #000', paddingTop: '4px' }}>
                          <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>ইনভয়েস: <b>{selectedOrderDetails.id}</b></span>
                            <span>তারিখ: {getBengaliDate(selectedOrderDetails.createdAt)}</span>
                          </div>
                          <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>গ্রাহক: {selectedOrderDetails.customerName}</span>
                            {getBengaliTime(selectedOrderDetails.createdAt) && (
                              <span>সময়: {getBengaliTime(selectedOrderDetails.createdAt)}</span>
                            )}
                          </div>
                        </div>

                        {/* Items Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '5px 0' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                              <th style={{ fontSize: '9px', textAlign: 'left', padding: '2px 0' }}>বিবরণ</th>
                              <th className="col-qty" style={{ width: '15%', textAlign: 'center', fontSize: '9px', padding: '2px 0' }}>সং</th>
                              <th className="col-rate" style={{ width: '20%', textAlign: 'right', fontSize: '9px', padding: '2px 0' }}>দর</th>
                              <th className="col-total" style={{ width: '20%', textAlign: 'right', fontSize: '9px', padding: '2px 0' }}>মোট</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrderDetails.items.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px dashed #ccc' }}>
                                <td style={{ fontSize: '10px', padding: '2px 0', verticalAlign: 'top' }}>{item.productName}</td>
                                <td className="col-qty" style={{ width: '15%', textAlign: 'center', fontSize: '10px', padding: '2px 0' }}>{item.quantity}</td>
                                <td className="col-rate" style={{ width: '20%', textAlign: 'right', fontSize: '10px', padding: '2px 0' }}>{item.price}</td>
                                <td className="col-total" style={{ width: '20%', textAlign: 'right', fontSize: '10px', padding: '2px 0' }}>{item.price * item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Totals */}
                        <div className="totals-section" style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
                          <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                            <span>সাব-টোটাল:</span>
                            <span>৳{selectedOrderDetails.totalAmount - selectedOrderDetails.deliveryCharge}</span>
                          </div>
                          {selectedOrderDetails.deliveryCharge > 0 && (
                            <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                              <span>ডেলিভারি চার্জ:</span>
                              <span>+{selectedOrderDetails.deliveryCharge}</span>
                            </div>
                          )}
                          <div className="total-row grand-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '2px 0', fontSize: '12px', fontWeight: 'bold', margin: '2px 0' }}>
                            <span>মোট বিল:</span>
                            <span>{selectedOrderDetails.totalAmount}</span>
                          </div>
                          <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                            <span>জমা:</span>
                            <span>{
                              selectedOrderDetails.status === 'delivered' || selectedOrderDetails.paymentMethod !== 'cod'
                                ? selectedOrderDetails.totalAmount
                                : 0
                            }</span>
                          </div>
                          {(selectedOrderDetails.status !== 'delivered' && selectedOrderDetails.paymentMethod === 'cod') && (
                            <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                              <span>বাকি:</span>
                              <span>{selectedOrderDetails.totalAmount}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '9px', marginTop: '4px', textAlign: 'center', borderTop: '1px dotted #ccc', paddingTop: '2px' }}>
                          কথায়: {toBengaliWords(selectedOrderDetails.totalAmount)} টাকা মাত্র।
                        </div>

                        {/* Footer */}
                        <div className="footer" style={{ marginTop: '8px', textAlign: 'center', fontSize: '9px', borderTop: '1px dotted #ccc', paddingTop: '4px' }}>
                          <p>আমাদের থেকে পণ্য ক্রয়ের জন্য আপনাকে আন্তরিক ধন্যবাদ। ম্যাংগো লাভার-এর সাথে থাকুন!</p>
                          <p style={{ fontSize: '8px', color: '#666' }}>Sold by: {selectedOrderDetails.items[0]?.addedBy || "মুরাদ পারভেজ"}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              )}

              {/* Manual Order Creation Modal */}
              {showCreateOrderModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 shadow-2xl relative space-y-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setShowCreateOrderModal(false)}
                      className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5 text-gray-500" />
                    </button>

                    <h4 className="font-extrabold text-emerald-700 text-sm md:text-base flex items-center gap-1.5 border-b pb-2 border-emerald-100">
                      <Plus className="w-5 h-5 text-emerald-600" />
                      ম্যানুয়াল অর্ডার তৈরি করুন / ক্যাশ মেমো কাটুন
                    </h4>

                    <form onSubmit={handleCreateManualOrderSubmit} className="space-y-4 text-xs">
                      {/* Grid for Customer details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                        <div className="md:col-span-2">
                          <h5 className="font-extrabold text-emerald-800 border-b border-emerald-100 pb-1 mb-2">১. গ্রাহকের বিবরণ</h5>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">গ্রাহকের নাম *</label>
                          <input
                            type="text"
                            required
                            value={manCustomerName}
                            onChange={(e) => setManCustomerName(e.target.value)}
                            placeholder="যেমন: মো: রহিম আলী"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">মোবাইল নম্বর *</label>
                          <input
                            type="text"
                            required
                            value={manCustomerPhone}
                            onChange={(e) => setManCustomerPhone(e.target.value)}
                            placeholder="যেমন: 017XXXXXXXX"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">ডেলিভারি ঠিকানা *</label>
                          <textarea
                            required
                            rows={2}
                            value={manDeliveryAddress}
                            onChange={(e) => setManDeliveryAddress(e.target.value)}
                            placeholder="যেমন: হাউজ নং- ১২, রোড নং- ৫, নওহাটা"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">জেলা *</label>
                          <select
                            value={manDistrict}
                            onChange={(e) => {
                              const d = e.target.value;
                              setManDistrict(d);
                              // Auto set delivery charge based on Rajshahi or not
                              setManDeliveryCharge(d === 'রাজশাহী' ? 60 : 120);
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                          >
                            <option value="রাজশাহী">রাজশাহী (Rajshahi)</option>
                            <option value="ঢাকা">ঢাকা (Dhaka)</option>
                            <option value="চট্টগ্রাম">চট্টগ্রাম (Chattogram)</option>
                            <option value="খুলনা">খুলনা (Khulna)</option>
                            <option value="বরিশাল">বরিশাল (Barishal)</option>
                            <option value="সিলেট">সিলেট (Sylhet)</option>
                            <option value="রংপুর">রংপুর (Rangpur)</option>
                            <option value="ময়মনসিংহ">ময়মনসিংহ (Mymensingh)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">থানা / উপজেলা / এলাকা</label>
                          <input
                            type="text"
                            value={manArea}
                            onChange={(e) => setManArea(e.target.value)}
                            placeholder="যেমন: পবা"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                          />
                        </div>
                      </div>

                      {/* Add products to manual order */}
                      <div className="bg-orange-50/20 p-4 rounded-xl border border-orange-100 space-y-3">
                        <h5 className="font-extrabold text-orange-800 border-b border-orange-100 pb-1">২. পণ্য নির্বাচন ও পরিমাণ</h5>
                        
                        <div className="space-y-3 relative" id="man-product-add-selector">
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 relative">
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">পণ্য খুঁজুন ও সিলেক্ট করুন</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="পণ্য খুঁজুন (নাম বা আইডি লিখে)..."
                                  value={manProductSearchQuery}
                                  onChange={(e) => {
                                    setManProductSearchQuery(e.target.value);
                                    setShowManProductDropdown(true);
                                  }}
                                  onFocus={() => setShowManProductDropdown(true)}
                                  className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-6 py-2 text-xs font-semibold focus:outline-hidden focus:border-orange-500 text-slate-800 font-medium"
                                />
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                {manProductSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setManProductSearchQuery('');
                                      setManSelectedProduct('');
                                      setManSelectedSize('');
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-[10px] p-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="w-24">
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">পরিমাণ</label>
                              <input
                                type="number"
                                min="1"
                                value={manSelectedQty}
                                onChange={(e) => setManSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                              />
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleManAddItem}
                              disabled={!manSelectedProduct}
                              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer h-[38px] transition-colors shrink-0"
                            >
                              + যুক্ত করুন
                            </button>
                          </div>

                          {/* Search dropdown list */}
                          {showManProductDropdown && (
                            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-xs">
                              {(() => {
                                const query = manProductSearchQuery.toLowerCase().trim();
                                const filtered = products.filter(p => {
                                  if (p.status === 'Inactive') return false;
                                  if (!query) return true;
                                  return (
                                    p.name.toLowerCase().includes(query) ||
                                    p.id.toLowerCase().includes(query) ||
                                    (p.category && p.category.toLowerCase().includes(query))
                                  );
                                });

                                if (filtered.length === 0) {
                                  return <div className="px-3 py-2 text-gray-500 italic">কোনো পণ্য পাওয়া যায়নি</div>;
                                }

                                return filtered.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setManSelectedProduct(p.id);
                                      const sizes = getProductSizes(p.id, p);
                                      if (sizes && sizes.length > 0) {
                                        setManSelectedSize(sizes[0]);
                                      } else {
                                        setManSelectedSize(p.unit || 'পিস');
                                      }
                                      setManProductSearchQuery(p.name);
                                      setShowManProductDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-orange-50 flex justify-between items-center border-b border-gray-50 last:border-b-0 ${manSelectedProduct === p.id ? 'bg-orange-50 font-bold text-orange-700' : 'text-slate-700'}`}
                                  >
                                    <span className="font-medium">{p.name} {p.stock <= 0 ? <span className="text-red-500 text-[9px] font-bold ml-1">(স্টক শেষ)</span> : <span className="text-emerald-600 text-[9px] font-bold ml-1">(স্টক: {p.stock})</span>}</span>
                                    <span className="font-mono text-gray-500 text-[10px]">৳{p.price}</span>
                                  </button>
                                ));
                              })()}
                            </div>
                          )}

                          {/* Selected product details/variants */}
                          {manSelectedProduct && (() => {
                            const p = products.find(prod => prod.id === manSelectedProduct);
                            if (!p) return null;
                            const sizes = getProductSizes(p.id, p);

                            return (
                              <div className="p-2 bg-orange-50/40 border border-orange-100 rounded-lg space-y-1.5 text-[11px] flex flex-wrap gap-x-4 gap-y-2 items-center justify-between">
                                <div className="text-gray-600">
                                  নির্বাচিত পণ্য: <strong className="text-gray-800">{p.name}</strong>
                                </div>
                                <div className="flex items-center gap-4">
                                  {sizes.length > 1 && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-500 font-bold">ওজন/সাইজ:</span>
                                      <select
                                        value={manSelectedSize}
                                        onChange={(e) => setManSelectedSize(e.target.value)}
                                        className="bg-white border border-gray-200 rounded-md px-2 py-0.5 text-[10px] font-bold text-gray-700 cursor-pointer"
                                      >
                                        {sizes.map(size => (
                                          <option key={size} value={size}>
                                            {size} {p.sizePrices?.[size] ? `(৳${p.sizePrices[size].price})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                  <span className="text-orange-700 font-black">
                                    একক মূল্য: ৳{manSelectedSize && p.sizePrices?.[manSelectedSize] ? p.sizePrices[manSelectedSize].price : p.price}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Order Items List Table */}
                        {manOrderItems.length > 0 && (
                          <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
                                  <th className="p-2">ছবি</th>
                                  <th className="p-2">পণ্যের নাম</th>
                                  <th className="p-2 text-center">পরিমাণ</th>
                                  <th className="p-2 text-right">একক মূল্য</th>
                                  <th className="p-2 text-right">মোট মূল্য</th>
                                  <th className="p-2 text-center">মুছুন</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {manOrderItems.map((item, index) => (
                                  <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="p-2">
                                      <img src={item.product.image} alt={item.product.name} className="w-8 h-8 object-cover rounded-md border" referrerPolicy="no-referrer" />
                                    </td>
                                    <td className="p-2 font-bold text-gray-800">{item.product.name}</td>
                                    <td className="p-2 text-center font-bold">{item.quantity} {item.product.unit}</td>
                                    <td className="p-2 text-right font-semibold font-sans">৳{item.product.price}</td>
                                    <td className="p-2 text-right font-bold font-sans text-orange-600">৳{item.product.price * item.quantity}</td>
                                    <td className="p-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleManRemoveItem(item.product.id, item.product.unit)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Payment, Delivery charge and Discounts */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">পেমেন্ট পদ্ধতি</label>
                          <select
                            value={manPaymentMethod}
                            onChange={(e) => setManPaymentMethod(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                          >
                            <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
                            <option value="bkash">বিকাশ (bKash)</option>
                            <option value="nagad">নগদ (Nagad)</option>
                            <option value="rocket">রকেট (Rocket)</option>
                          </select>
                        </div>
                        {manPaymentMethod !== 'cod' && (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Transaction ID (TrxID)</label>
                            <input
                              type="text"
                              value={manTrxId}
                              onChange={(e) => setManTrxId(e.target.value)}
                              placeholder="যেমন: MP876HJ980"
                              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">ডেলিভারি চার্জ (টাকায়)</label>
                          <input
                            type="number"
                            value={manDeliveryCharge}
                            onChange={(e) => setManDeliveryCharge(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">ডিসকাউন্ট বা ছাড় (টাকায়)</label>
                          <input
                            type="number"
                            value={manDiscount}
                            onChange={(e) => setManDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800 bg-white"
                          />
                        </div>
                      </div>

                      {/* Total Calculations summary */}
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                        <div className="text-emerald-800">
                          <p className="font-bold">সাব-মোট: ৳{manOrderItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)}</p>
                          <p className="text-[10px]">ডেলিভারি চার্জ: +৳{manDeliveryCharge} | ছাড়: -৳{manDiscount}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block font-bold">সর্বমোট প্রদেয় বিল</span>
                          <span className="text-lg font-black text-emerald-700 font-sans">
                            ৳{Math.max(0, manOrderItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) + Number(manDeliveryCharge) - Number(manDiscount))}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateOrderModal(false)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-2.5 rounded-xl text-center cursor-pointer transition-colors"
                        >
                          বাতিল করুন
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-center cursor-pointer transition-colors shadow-sm"
                        >
                          অর্ডার তৈরি করুন ও মেমো কাটুন
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    কোন অর্ডার পাওয়া যায়নি!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-extrabold uppercase">
                          <th className="p-4">অর্ডার আইডি</th>
                          <th className="p-4">গ্রাহকের নাম ও ফোন</th>
                          <th className="p-4">জেলা</th>
                          <th className="p-4">মোট টাকা</th>
                          <th className="p-4">পেমেন্ট</th>
                          <th className="p-4">স্ট্যাটাস</th>
                          <th className="p-4 text-center">বিশদ বিবরণ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-orange-600">{order.id}</td>
                            <td className="p-4">
                              <h4 className="font-bold text-gray-800 text-xs">{order.customerName}</h4>
                              <p className="text-[10px] text-gray-400">{order.customerPhone}</p>
                            </td>
                            <td className="p-4">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-md font-bold">{order.district}</span>
                            </td>
                            <td className="p-4 font-bold text-gray-800">৳{order.totalAmount}</td>
                            <td className="p-4 text-[10px]">
                              <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                                order.paymentMethod === 'cod' ? 'bg-slate-100 text-slate-700' :
                                order.paymentMethod === 'bkash' ? 'bg-pink-100 text-pink-700' :
                                order.paymentMethod === 'nagad' ? 'bg-red-100 text-red-700' :
                                order.paymentMethod === 'rocket' ? 'bg-purple-100 text-purple-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {order.paymentMethod === 'cod' ? 'COD' :
                                 order.paymentMethod === 'bkash' ? 'বিকাশ' :
                                 order.paymentMethod === 'nagad' ? 'নগদ' :
                                 order.paymentMethod === 'rocket' ? 'রকেট' : order.paymentMethod}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                order.status === 'processing' ? 'bg-indigo-100 text-indigo-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {order.status === 'pending' ? 'অপেক্ষমাণ' :
                                 order.status === 'processing' ? 'প্রসেসিং' :
                                 order.status === 'shipped' ? 'শিপড্' :
                                 order.status === 'delivered' ? 'ডেলিভার্ড' : 'বাতিল'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="p-1.5 bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-600 rounded-lg transition-colors cursor-pointer"
                                  title="অর্ডার বিবরণ"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOrderToDelete(order)}
                                  className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="মেমো ডিলিট করুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MARKETING & BRANDING */}
          {hasPermission('marketing') && activeTab === 'marketing' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-800 text-sm md:text-base">মার্কেটিং ও ব্র্যান্ড কাস্টমাইজেশন</h3>
                <p className="text-xs text-gray-400">আপনার শপের নাম, লোগো, ডাবল হিরো ব্যানার এবং এনাউন্সমেন্ট নোটিশগুলো পরিবর্তন করুন</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                onUpdateSiteConfig({
                  storeName: cfgStoreName,
                  storeSlogan: cfgStoreSlogan,
                  storeLogo: cfgStoreLogo,
                  storeNameImage: cfgStoreNameImage,
                  storeSloganImage: cfgStoreSloganImage,
                  leftBannerImage: cfgLeftImage,
                  leftBannerTitle: cfgLeftTitle,
                  leftBannerSubtitle: cfgLeftSubtitle,
                  leftBannerBtnText: cfgLeftBtnText,
                  leftBannerCategory: cfgLeftCategory,
                  rightBannerImage: cfgRightImage,
                  rightBannerTitle: cfgRightTitle,
                  rightBannerSubtitle: cfgRightSubtitle,
                  rightBannerBtnText: cfgRightBtnText,
                  rightBannerTagline: cfgRightTagline,
                  rightBannerCategory: cfgRightCategory,
                  tickerItems: [cfgTicker1, cfgTicker2, cfgTicker3, cfgTicker4, cfgTicker5, cfgTicker6],
                  categoryImages: cfgCategoryImages,
                  categoryBanners: cfgCategoryBanners,
                  categoryNames: cfgCategoryNames,
                  aboutTitle: cfgAboutTitle,
                  aboutSubtitle: cfgAboutSubtitle,
                  aboutOwnerImage: cfgAboutOwnerImage,
                  aboutHighlightText: cfgAboutHighlightText,
                  aboutParagraph1: cfgAboutParagraph1,
                  aboutParagraph2: cfgAboutParagraph2,
                  aboutParagraph3: cfgAboutParagraph3,
                  aboutFacebookLink: cfgAboutFacebookLink,
                  messengerLink: cfgMessengerLink,
                  facebookLink: cfgFacebookLink,
                  instagramLink: cfgInstagramLink,
                  youtubeLink: cfgYoutubeLink,
                  contactOffice: cfgContactOffice,
                  contactPhone: cfgContactPhone,
                  contactEmail: cfgContactEmail,
                  googleMapUrl: cfgGoogleMapUrl,
                  refundPolicyText: cfgRefundPolicyText,
                  privacyPolicyText: cfgPrivacyPolicyText,
                  coupons: cfgCoupons,
                  promoActive: cfgPromoActive,
                  promoImage: cfgPromoImage,
                  promoLink: cfgPromoLink,
                  faqItems: cfgFaqItems,
                });
                notify('অভিনন্দন! আপনার শপ কাস্টমাইজেশন সফলভাবে আপডেট করা হয়েছে।', 'success');
              }} className="space-y-6">

                {/* Marketing & Theme Sub-Tabs Switcher */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('brand_banners')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'brand_banners'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>১. ব্র্যান্ড ও ব্যানার</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('ticker_categories')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'ticker_categories'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>২. ঘোষণা ও ক্যাটাগরি</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('about_page')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'about_page'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>৩. আমাদের সম্পর্কে</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('contact_info')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'contact_info'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>৪. যোগাযোগ ও ম্যাপ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('policies')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'policies'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>৫. পলিসি ও শর্তাবলী</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('coupons')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'coupons'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>৬. কুপন ম্যানেজমেন্ট</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('promo_offer')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'promo_offer'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>৭. অফার পপআপ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingSubTab('faq')}
                    className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                      marketingSubTab === 'faq'
                        ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>৮. এফএকিউ (FAQ)</span>
                  </button>
                </div>

                {marketingSubTab === 'brand_banners' && (
                  <div className="space-y-6">
                    {/* Card 1: Brand Profile */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    ১. ব্র্যান্ড আইডেন্টিটি (Brand Identity)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">স্টোরের নাম (Store Name)</label>
                      <input
                        type="text"
                        required
                        value={cfgStoreName}
                        onChange={(e) => setCfgStoreName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">স্লোগান (Slogan)</label>
                      <input
                        type="text"
                        required
                        value={cfgStoreSlogan}
                        onChange={(e) => setCfgStoreSlogan(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">স্টোর লোগো URL (Logo Image URL)</label>
                          <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: বর্গাকার লোগো (যেমন 200×200 px) দেখতে সুন্দর লাগবে।</span>
                        </div>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কম্পিউটার থেকে আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setCfgStoreLogo(base64);
                                  });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setImageSelectorTarget('logo')}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>গ্যালারি থেকে বেছে নিন</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          required
                          value={cfgStoreLogo}
                          onChange={(e) => setCfgStoreLogo(e.target.value)}
                          className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                        {cfgStoreLogo && (
                          <img src={cfgStoreLogo} className="w-10 h-10 object-cover rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>

                    {/* Brand Name Image */}
                    <div className="md:col-span-2 border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">ব্র্যান্ডের নাম ছবি (Brand Name Image URL) - ঐচ্ছিক</label>
                          <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: নামের ছবি দিলে সেটি টেক্সটের পরিবর্তে ব্যবহার হবে। আড়াআড়ি ও পিএনজি হওয়া ভালো (প্রস্তাবিত সাইজ: ৩০০×৮০ পিক্সেল বা এর কাছাকাছি)।</span>
                        </div>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কম্পিউটার থেকে আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setCfgStoreNameImage(base64);
                                  });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setImageSelectorTarget('storeNameImage')}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>গ্যালারি থেকে বেছে নিন</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="ছবি লিংক বা আপলোড করুন..."
                          value={cfgStoreNameImage}
                          onChange={(e) => setCfgStoreNameImage(e.target.value)}
                          className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                        {cfgStoreNameImage && (
                          <img src={cfgStoreNameImage} className="h-10 object-contain border border-gray-200 bg-gray-50 p-1 rounded" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>

                    {/* Store Slogan Image */}
                    <div className="md:col-span-2 border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">স্লোগান ছবি (Slogan Image URL) - ঐচ্ছিক</label>
                          <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: স্লোগানের ছবি দিলে সেটি টেক্সটের পরিবর্তে ব্যবহার হবে। আড়াআড়ি ও পিএনজি হওয়া ভালো (প্রস্তাবিত সাইজ: ২০০×৪০ পিক্সেল বা এর কাছাকাছি)।</span>
                        </div>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কম্পিউটার থেকে আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setCfgStoreSloganImage(base64);
                                  });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setImageSelectorTarget('storeSloganImage')}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>গ্যালারি থেকে বেছে নিন</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="ছবি লিংক বা আপলোড করুন..."
                          value={cfgStoreSloganImage}
                          onChange={(e) => setCfgStoreSloganImage(e.target.value)}
                          className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                        {cfgStoreSloganImage && (
                          <img src={cfgStoreSloganImage} className="h-6 object-contain border border-gray-200 bg-gray-50 p-1 rounded" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Left Hero Banner */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    ২. হিরো ব্যানার - বাম পাশ (Left Hero Banner - Large)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">ব্যানার ছবি লিংক (Banner Image URL)</label>
                          <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: আড়াআড়ি ব্যানার ছবি (যেমন 1200×600 px বা 16:9 রেশিও) দেখতে সুন্দর লাগবে।</span>
                        </div>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কম্পিউটার থেকে আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setCfgLeftImage(base64);
                                  });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setImageSelectorTarget('leftBanner')}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>গ্যালারি থেকে বেছে নিন</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          required
                          value={cfgLeftImage}
                          onChange={(e) => setCfgLeftImage(e.target.value)}
                          className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                        {cfgLeftImage && (
                          <img src={cfgLeftImage} className="w-14 h-9 object-cover rounded-md border border-gray-200" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার টাইটেল (Title)</label>
                      <input
                        type="text"
                        required
                        value={cfgLeftTitle}
                        onChange={(e) => setCfgLeftTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার সাবটাইটেল (Subtitle/Description)</label>
                      <input
                        type="text"
                        required
                        value={cfgLeftSubtitle}
                        onChange={(e) => setCfgLeftSubtitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">বাটন টেক্সট (Button Text)</label>
                      <input
                        type="text"
                        required
                        value={cfgLeftBtnText}
                        onChange={(e) => setCfgLeftBtnText(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">বাটন লিঙ্ক ক্যাটাগরি (Target Category)</label>
                      <select
                        value={cfgLeftCategory}
                        onChange={(e) => setCfgLeftCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden"
                      >
                        <option value="all">সব পণ্য</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cfgCategoryNames[cat.slug] || cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Card 3: Right Hero Banner */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    ৩. হিরো ব্যানার - ডান পাশ (Right Hero Banner - Small)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">ব্যানার ছবি লিংক (Banner Image URL)</label>
                          <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: আড়াআড়ি ছোট ব্যানার ছবি (যেমন 800×600 px বা 4:3 / 16:9 রেশিও) দেখতে সুন্দর লাগবে।</span>
                        </div>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কম্পিউটার থেকে আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setCfgRightImage(base64);
                                  });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setImageSelectorTarget('rightBanner')}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>গ্যালারি থেকে বেছে নিন</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          required
                          value={cfgRightImage}
                          onChange={(e) => setCfgRightImage(e.target.value)}
                          className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                        {cfgRightImage && (
                          <img src={cfgRightImage} className="w-14 h-9 object-cover rounded-md border border-gray-200" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ট্যাগলাইন (Tagline / Badge text)</label>
                      <input
                        type="text"
                        required
                        value={cfgRightTagline}
                        onChange={(e) => setCfgRightTagline(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার টাইটেল (Title)</label>
                      <input
                        type="text"
                        required
                        value={cfgRightTitle}
                        onChange={(e) => setCfgRightTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার সাবটাইটেল (Subtitle/Description)</label>
                      <input
                        type="text"
                        required
                        value={cfgRightSubtitle}
                        onChange={(e) => setCfgRightSubtitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">বাটন টেক্সট (Button Text)</label>
                      <input
                        type="text"
                        required
                        value={cfgRightBtnText}
                        onChange={(e) => setCfgRightBtnText(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">বাটন লিঙ্ক ক্যাটাগরি (Target Category)</label>
                      <select
                        value={cfgRightCategory}
                        onChange={(e) => setCfgRightCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden"
                      >
                        <option value="all">সব পণ্য</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cfgCategoryNames[cat.slug] || cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                </div>
                )}

                {marketingSubTab === 'ticker_categories' && (
                  <div className="space-y-6">
                    {/* Card 4: Announcement Bulletins */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-orange-500" />
                    ৪. এনাউন্সমেন্ট নোটিশ বার (Announcement Ticker)
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">এখানে ৪ থেকে ৬ টি আকর্ষণীয় নোটিশ বা অফার লিখে দিন যা পেজের উপরে অনবরত স্ক্রল করবে।</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">নোটিশ ১</label>
                      <input
                        type="text"
                        required
                        value={cfgTicker1}
                        onChange={(e) => setCfgTicker1(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">নোটিশ ২</label>
                      <input
                        type="text"
                        required
                        value={cfgTicker2}
                        onChange={(e) => setCfgTicker2(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">নোটিশ ৩</label>
                      <input
                        type="text"
                        required
                        value={cfgTicker3}
                        onChange={(e) => setCfgTicker3(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">নোটিশ ৪</label>
                      <input
                        type="text"
                        required
                        value={cfgTicker4}
                        onChange={(e) => setCfgTicker4(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">নোটিশ ৫</label>
                      <input
                        type="text"
                        required
                        value={cfgTicker5}
                        onChange={(e) => setCfgTicker5(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">নোটিশ ৬</label>
                      <input
                        type="text"
                        required
                        value={cfgTicker6}
                        onChange={(e) => setCfgTicker6(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 5: Category Overrides */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-500" />
                    ৫. ক্যাটাগরি নাম ও ছবি কাস্টমাইজেশন (Category Custom Name & Icons/Images)
                  </h4>
                  <p className="text-xs text-gray-400 leading-normal font-medium">
                    এখানে ক্যাটাগরি গুলোর জন্য কাস্টম নাম এবং ছবি সেট করতে পারেন। যদি কোন কাস্টম নাম দেওয়া থাকে, তবে শপের সব জায়গায় সেই ক্যাটাগরির নাম হিসেবে সেটি প্রদর্শিত হবে। <strong className="text-emerald-700">পরামর্শ: বর্গাকার আইকন বা লোগো ছবি (যেমন 200×200 px বা 1:1 রেশিও) ব্যবহার করলে সবচেয়ে পারফেক্ট দেখাবে।</strong>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="border border-gray-100 p-3.5 rounded-xl space-y-3 bg-slate-50/30">
                        <div className="flex justify-between items-center gap-2 flex-wrap pb-1.5 border-b border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-800">{cat.name}</span>
                            {cfgCategoryNames[cat.slug] && (
                              <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                                ({cfgCategoryNames[cat.slug]})
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <label className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all border border-emerald-100">
                              <Upload className="w-3 h-3 text-emerald-600" />
                              <span>আপলোড</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    compressAndSetImage(file, (base64) => {
                                      const updated = { ...cfgCategoryImages, [cat.slug]: base64 };
                                      setCfgCategoryImages(updated);
                                    });
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setImageSelectorTarget('category-' + cat.slug)}
                              className="text-[10px] text-orange-600 hover:text-orange-700 font-extrabold bg-orange-50 px-2 py-0.5 rounded-md cursor-pointer border border-orange-100"
                            >
                              গ্যালারি
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-gray-500">ক্যাটাগরির কাস্টম নাম (Custom Name)</label>
                          <input
                            type="text"
                            placeholder={`ডিফল্ট: ${cat.name}`}
                            value={cfgCategoryNames[cat.slug] || ''}
                            onChange={(e) => {
                              const updated = { ...cfgCategoryNames, [cat.slug]: e.target.value };
                              setCfgCategoryNames(updated);
                            }}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white focus:border-orange-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-gray-500">ক্যাটাগরি ছবি লিঙ্ক (Image Link)</label>
                          <div className="flex gap-2 items-center font-medium">
                            <input
                              type="text"
                              placeholder="যেমন: /src/assets/images/..."
                              value={cfgCategoryImages[cat.slug] || ''}
                              onChange={(e) => {
                                const updated = { ...cfgCategoryImages, [cat.slug]: e.target.value };
                                setCfgCategoryImages(updated);
                              }}
                              className="flex-grow px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden bg-white focus:border-orange-400"
                            />
                            {cfgCategoryImages[cat.slug] ? (
                              <img src={cfgCategoryImages[cat.slug]} className="w-7 h-7 object-cover rounded-md border border-gray-200 animate-fade-in shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-7 h-7 bg-gray-100 flex items-center justify-center rounded-md text-[9px] text-gray-400 font-bold border border-gray-100 shrink-0">Default</div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 bg-amber-50/40 border border-amber-100/70 p-2.5 rounded-xl">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider">সেকশন ব্যানার ছবি (Section Banner Image)</label>
                            <div className="flex gap-1.5">
                              <label className="text-[9px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded transition-all border border-emerald-100">
                                <Upload className="w-2.5 h-2.5 text-emerald-600" />
                                <span>আপলোড</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      compressAndSetImage(file, (base64) => {
                                        const updated = { ...cfgCategoryBanners, [cat.slug]: base64 };
                                        setCfgCategoryBanners(updated);
                                      });
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setImageSelectorTarget('catbanner-' + cat.slug)}
                                className="text-[9px] text-orange-600 hover:text-orange-700 font-extrabold bg-orange-50 px-1.5 py-0.5 rounded cursor-pointer border border-orange-100"
                              >
                                গ্যালারি
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center font-medium">
                            <input
                              type="text"
                              placeholder="যেমন: /src/assets/images/..."
                              value={cfgCategoryBanners[cat.slug] || ''}
                              onChange={(e) => {
                                const updated = { ...cfgCategoryBanners, [cat.slug]: e.target.value };
                                setCfgCategoryBanners(updated);
                              }}
                              className="flex-grow px-2 py-1.5 text-xs rounded-lg border border-amber-200/60 focus:outline-hidden bg-white focus:border-amber-400 font-medium text-slate-700"
                            />
                            {cfgCategoryBanners[cat.slug] ? (
                              <img src={cfgCategoryBanners[cat.slug]} className="w-9 h-7 object-cover rounded-md border border-amber-200 animate-fade-in shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-9 h-7 bg-amber-100/40 text-amber-600/70 flex items-center justify-center rounded-md text-[9px] font-black border border-amber-100/30 shrink-0">Default</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
                )}

                {marketingSubTab === 'about_page' && (
                  <div className="space-y-6">
                    {/* Card 6: About Us Customization */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-500" />
                    ৬. আমাদের সম্পর্কে পেজ কাস্টমাইজেশন (About Us Page Settings)
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">আমাদের সম্পর্কে - প্রধান শিরোনাম (Title)</label>
                        <input
                          type="text"
                          required
                          value={cfgAboutTitle}
                          onChange={(e) => setCfgAboutTitle(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ফেইসবুক লিংক (Facebook Page Link)</label>
                        <input
                          type="text"
                          required
                          value={cfgAboutFacebookLink}
                          onChange={(e) => setCfgAboutFacebookLink(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">মেসেঞ্জার লিংক (Facebook Messenger Link)</label>
                        <input
                          type="text"
                          required
                          value={cfgMessengerLink}
                          onChange={(e) => setCfgMessengerLink(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                          placeholder="e.g. https://m.me/yourpage"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">উপ-শিরোনাম বা সংক্ষিপ্ত বিবরণ (Subtitle / Intro)</label>
                      <textarea
                        required
                        rows={3}
                        value={cfgAboutSubtitle}
                        onChange={(e) => setCfgAboutSubtitle(e.target.value)}
                        className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700">প্রতিষ্ঠাতা / ওনারের ছবি বা ব্যানার ছবি (Owner Image URL)</label>
                          <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: এই ছবিটি আমাদের সম্পর্কে পেজের ডানপাশে শোভা পাবে।</span>
                        </div>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কম্পিউটার থেকে আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setCfgAboutOwnerImage(base64);
                                  });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setImageSelectorTarget('aboutOwner')}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>গ্যালারি থেকে বেছে নিন</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          required
                          value={cfgAboutOwnerImage}
                          onChange={(e) => setCfgAboutOwnerImage(e.target.value)}
                          className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                        {cfgAboutOwnerImage && (
                          <img src={cfgAboutOwnerImage} className="w-14 h-9 object-cover rounded-md border border-gray-200" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">হাইলাইটেড প্যারাগ্রাফ (Highlighted Info/Intro Bullet)</label>
                      <input
                        type="text"
                        required
                        value={cfgAboutHighlightText}
                        onChange={(e) => setCfgAboutHighlightText(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-semibold text-emerald-700"
                      />
                    </div>

                    <div className="space-y-3 border-t border-gray-100 pt-3">
                      <h5 className="text-xs font-bold text-slate-700">সংক্ষিপ্ত গল্প প্যারাগ্রাফসমূহ (Our Story Paragraphs):</h5>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">প্যারাগ্রাফ ১ (শৈশব ও অনুপ্রেরণা)</label>
                        <textarea
                          required
                          rows={4}
                          value={cfgAboutParagraph1}
                          onChange={(e) => setCfgAboutParagraph1(e.target.value)}
                          className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">প্যারাগ্রাফ ২ (চ্যালেঞ্জ ও উদ্যোগের শুরু)</label>
                        <textarea
                          required
                          rows={4}
                          value={cfgAboutParagraph2}
                          onChange={(e) => setCfgAboutParagraph2(e.target.value)}
                          className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">প্যারাগ্রাফ ৩ (সাফল্য ও বর্তমান অবস্থান)</label>
                        <textarea
                          required
                          rows={4}
                          value={cfgAboutParagraph3}
                          onChange={(e) => setCfgAboutParagraph3(e.target.value)}
                          className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

                {marketingSubTab === 'contact_info' && (
                  <div className="space-y-6">
                    {/* Card 7: Contact Information */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    ৭. যোগাযোগের বিবরণী ও ঠিকানা (Contact Settings)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">অফিসের ঠিকানা (Office Address)</label>
                      <input
                        type="text"
                        required
                        value={cfgContactOffice}
                        onChange={(e) => setCfgContactOffice(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ফোন নম্বর (Contact Phone)</label>
                      <input
                        type="text"
                        required
                        value={cfgContactPhone}
                        onChange={(e) => setCfgContactPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">ইমেইল ঠিকানা (Contact Email)</label>
                      <input
                        type="email"
                        required
                        value={cfgContactEmail}
                        onChange={(e) => setCfgContactEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">গুগল ম্যাপ / ওপেনস্ট্রিটম্যাপ এমবেড লিংক (Map Embed URL - iframe src)</label>
                      <input
                        type="text"
                        value={cfgGoogleMapUrl}
                        onChange={(e) => setCfgGoogleMapUrl(e.target.value)}
                        placeholder="যেমন: https://www.google.com/maps/embed?pb=..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 mt-2 space-y-1.5 text-amber-900">
                        <span className="text-xs font-black block">📍 গুগল ম্যাপস থেকে সঠিক লিংক বের করার নিয়ম (Step-by-Step Guide):</span>
                        <ol className="text-[11px] list-decimal list-inside space-y-1 font-semibold leading-relaxed">
                          <li>গুগল ম্যাপস (<a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-950">maps.google.com</a>) এ আপনার ঠিকানা লিখে সার্চ করুন।</li>
                          <li>সেখানকার <span className="font-black">"Share" (শেয়ার)</span> বাটনে ক্লিক করুন।</li>
                          <li>পপ-আপ উইন্ডো থেকে <span className="font-black">"Embed a map" (মানচিত্র এম্বেড করুন)</span> ট্যাবটি সিলেক্ট করুন।</li>
                          <li>সেখানে থাকা <span className="font-black">"Copy HTML" (HTML কপি করুন)</span> বাটনে ক্লিক করুন।</li>
                          <li>কপি করা কোড থেকে শুধুমাত্র <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">src="..."</code> এর ভেতরের অংশটুকু (https://... দিয়ে শুরু হওয়া লিংকটি) কপি করে এই ইনপুট বক্সে বসিয়ে দিন।</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 7.5: Social Media Links */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-orange-500" />
                    ৭.৫. সোশ্যাল মিডিয়া লিংক কাস্টমাইজেশন (Social Media Settings)
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">এখানে আপনার সোশ্যাল মিডিয়া অ্যাকাউন্ট/পেজের লিংকগুলো বসিয়ে দিন, যা ওয়েবসাইটের নিচের অংশে (Footer) প্রদর্শিত হবে।</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-blue-600" />
                        <span>ফেইসবুক লিংক (Facebook Link)</span>
                      </label>
                      <input
                        type="url"
                        value={cfgFacebookLink}
                        onChange={(e) => setCfgFacebookLink(e.target.value)}
                        placeholder="যেমন: https://facebook.com/yourpage"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-600" />
                        <span>ইনস্টাগ্রাম লিংক (Instagram Link)</span>
                      </label>
                      <input
                        type="url"
                        value={cfgInstagramLink}
                        onChange={(e) => setCfgInstagramLink(e.target.value)}
                        placeholder="যেমন: https://instagram.com/yourprofile"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-red-600" />
                        <span>ইউটিউব লিংক (YouTube Link)</span>
                      </label>
                      <input
                        type="url"
                        value={cfgYoutubeLink}
                        onChange={(e) => setCfgYoutubeLink(e.target.value)}
                        placeholder="যেমন: https://youtube.com/c/yourchannel"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>
                </div>
                )}

                {marketingSubTab === 'policies' && (
                  <div className="space-y-6">
                    {/* Card 8: Policies */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    ৮. পলিসি ও শর্তাবলী (Policies)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">রিফান্ড পলিসি (Refund Policy Text)</label>
                      <textarea
                        rows={4}
                        required
                        value={cfgRefundPolicyText}
                        onChange={(e) => setCfgRefundPolicyText(e.target.value)}
                        className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">প্রাইভেসি পলিসি (Privacy Policy Text)</label>
                      <textarea
                        rows={4}
                        required
                        value={cfgPrivacyPolicyText}
                        onChange={(e) => setCfgPrivacyPolicyText(e.target.value)}
                        className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>
                </div>
                )}

                {marketingSubTab === 'coupons' && (
                  <div className="space-y-6">
                    {/* Card 9: Coupon Management */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                      <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-orange-500" />
                        ৯. কুপন কোড ও ডিসকাউন্ট সেটিংস (Coupon & Discount Settings)
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Add Coupon Form */}
                        <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                          <h5 className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            নতুন কুপন কোড তৈরি করুন
                          </h5>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">কুপন কোড (ইংরেজি বড় অক্ষরের করুন)</label>
                            <input
                              type="text"
                              placeholder="যেমন: MANGO15"
                              value={newCouponCode}
                              onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-slate-800"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">ডিসকাউন্ট টাইপ</label>
                              <select
                                value={newCouponType}
                                onChange={(e) => setNewCouponType(e.target.value as 'flat' | 'percentage')}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-700"
                              >
                                <option value="percentage">শতাংশ (%)</option>
                                <option value="flat">ফ্ল্যাট টাকা (TK)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">ডিসকাউন্ট পরিমাণ</label>
                              <input
                                type="number"
                                placeholder={newCouponType === 'percentage' ? 'যেমন: 15' : 'যেমন: 150'}
                                value={newCouponValue}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setNewCouponValue(val);
                                }}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">মোবাইল প্রতি ব্যবহার</label>
                              <select
                                value={newCouponLimitPerPhone}
                                onChange={(e) => setNewCouponLimitPerPhone(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-700"
                              >
                                <option value="1">সর্বোচ্চ ১ বার</option>
                                <option value="0">সীমাহীন (Unlimited)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">মোট সর্বোচ্চ ব্যবহার (ঐচ্ছিক)</label>
                              <input
                                type="number"
                                placeholder="যেমন: ১০০"
                                value={newCouponMaxTotalUsage}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setNewCouponMaxTotalUsage(val);
                                }}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">নির্দিষ্ট মোবাইল নম্বরসমূহ (ঐচ্ছিক - কমা দিয়ে একাধিক লিখতে পারেন)</label>
                            <input
                              type="text"
                              placeholder="যেমন: 01712345678, 01837587551"
                              value={newCouponRestrictedPhones}
                              onChange={(e) => setNewCouponRestrictedPhones(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                            />
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">খালি রাখলে যেকোনো মোবাইল নম্বর দিয়ে ব্যবহার করা যাবে।</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const code = newCouponCode.trim().toUpperCase();
                              if (!code) {
                                notify('অনুগ্রহ করে একটি কুপন কোড দিন!', 'error');
                                return;
                              }
                              if (newCouponValue === '' || newCouponValue <= 0) {
                                notify('অনুগ্রহ করে সঠিক ডিসকাউন্ট পরিমাণ দিন!', 'error');
                                return;
                              }
                              if (newCouponType === 'percentage' && newCouponValue > 100) {
                                notify('শতাংশ ডিসকাউন্ট ১০০% এর বেশি হতে পারবে না!', 'error');
                                return;
                              }
                              
                              // Check if exists
                              if (cfgCoupons.some(c => c.code === code)) {
                                notify('এই কুপন কোডটি ইতিমধ্যেই আছে!', 'error');
                                return;
                              }

                              const newCoupon: Coupon = {
                                code,
                                type: newCouponType,
                                value: newCouponValue,
                                limitPerPhone: newCouponLimitPerPhone === '1' ? 1 : undefined,
                                maxTotalUsage: newCouponMaxTotalUsage !== '' ? Number(newCouponMaxTotalUsage) : undefined,
                                restrictedPhones: newCouponRestrictedPhones.trim() ? newCouponRestrictedPhones.trim() : undefined
                              };

                              const updatedCoupons = [...cfgCoupons, newCoupon];
                              setCfgCoupons(updatedCoupons);
                              onUpdateSiteConfig({
                                ...siteConfig,
                                coupons: updatedCoupons
                              });
                              
                              setNewCouponCode('');
                              setNewCouponValue('');
                              setNewCouponMaxTotalUsage('');
                              setNewCouponRestrictedPhones('');
                              notify(`নতুন কুপন "${code}" সফলভাবে যুক্ত ও সেভ করা হয়েছে!`, 'success');
                            }}
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>কুপন কোড যুক্ত করুন</span>
                          </button>
                        </div>

                        {/* Existing Coupons list */}
                        <div className="md:col-span-7 space-y-3">
                          <h5 className="font-bold text-gray-700 text-xs">বিদ্যমান কুপন সমূহের তালিকা ({cfgCoupons.length})</h5>
                          {cfgCoupons.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                              <p className="text-xs text-slate-400 font-bold">কোনো সচল কুপন কোড পাওয়া যায়নি।</p>
                              <p className="text-[10px] text-slate-400 mt-1">বামদিকের ফর্মটি ব্যবহার করে নতুন কুপন যুক্ত করুন।</p>
                            </div>
                          ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white max-h-[250px] overflow-y-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-3 py-2 text-[10px] font-black text-gray-500">কুপন কোড</th>
                                    <th className="px-3 py-2 text-[10px] font-black text-gray-500">ধরন</th>
                                    <th className="px-3 py-2 text-[10px] font-black text-gray-500">ছাড়ের পরিমাণ</th>
                                    <th className="px-3 py-2 text-[10px] font-black text-gray-500">ব্যবহারের সীমা</th>
                                    <th className="px-3 py-2 text-right px-4 text-[10px] font-black text-gray-500">অ্যাকশন</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {cfgCoupons.map((coupon, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="px-3 py-2.5 text-xs font-black text-emerald-800">{coupon.code}</td>
                                      <td className="px-3 py-2.5 text-[11px] font-bold text-slate-600">
                                        {coupon.type === 'percentage' ? 'শতকরা ছাড় (%)' : 'ফ্ল্যাট ছাড় (৳)'}
                                      </td>
                                      <td className="px-3 py-2.5 text-xs font-black text-slate-800">
                                        {coupon.type === 'percentage' ? `${coupon.value}%` : `৳ ${coupon.value}`}
                                      </td>
                                      <td className="px-3 py-2.5 text-[10px] font-medium text-slate-700">
                                        <div className="space-y-0.5 font-bold">
                                          <div>{coupon.limitPerPhone === 1 || coupon.limitPerPhone === '1' || coupon.limitPerPhone === true ? '📱 প্রতি নম্বরে ১ বার' : '📱 সীমাহীন'}</div>
                                          {coupon.maxTotalUsage ? <div>🎯 মোট সর্বোচ্চ {coupon.maxTotalUsage} বার</div> : null}
                                          {coupon.restrictedPhones ? (
                                            <div className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[9px] mt-1 font-extrabold flex items-center gap-1 w-max" title={coupon.restrictedPhones}>
                                              <span>🔒 শুধু:</span>
                                              <span className="truncate max-w-[100px]">{coupon.restrictedPhones}</span>
                                            </div>
                                          ) : (
                                            <div className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] mt-1 font-extrabold w-max">
                                              <span>🔓 সবার জন্য উন্মুক্ত</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 text-right px-4">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedCoupons = cfgCoupons.filter(c => c.code !== coupon.code);
                                            setCfgCoupons(updatedCoupons);
                                            onUpdateSiteConfig({
                                              ...siteConfig,
                                              coupons: updatedCoupons
                                            });
                                            notify(`"${coupon.code}" কুপনটি বাদ দিয়ে সেভ করা হয়েছে।`, 'info');
                                          }}
                                          className="p-1 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md transition-all cursor-pointer"
                                          title="মুছে ফেলুন"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-2.5 text-[10px] text-amber-800 flex gap-1.5 leading-relaxed">
                            <span className="font-extrabold text-amber-700">💡 তথ্য:</span>
                            <span>গ্রাহকরা কার্টে বা চেকআউট পেজে কুপন কোডগুলো এপ্লাই করে ইনস্ট্যান্ট ডিসকাউন্ট সুবিধা উপভোগ করতে পারবেন। যেকোনো কুপন যুক্ত বা ডিলিট করার পর অবশ্যই নিচের <strong className="text-red-700">"কাস্টমাইজেশন সেভ করুন"</strong> বাটনে ক্লিক করবেন।</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {marketingSubTab === 'promo_offer' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Card 10: Promo Popup Management */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                      <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-orange-500" />
                        ১০. বর্তমান স্পেশাল অফার পপআপ (Promo Offer Popup)
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed font-bold">
                        ওয়েবসাইটে প্রবেশের সাথে সাথে গ্রাহকদের জন্য একটি আকর্ষণীয় ডিসকাউন্ট বা অফারের ছবি-সংবলিত পপআপ উইন্ডো প্রদর্শন করুন। গ্রাহক চাইলে এটি কেটে দিতে পারবেন।
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                        {/* Settings inputs */}
                        <div className="md:col-span-7 space-y-5">
                          {/* 1. Toggle */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <label className="block text-xs font-black text-gray-700">পপআপ স্ট্যাটাস (Popup Status)</label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                <input
                                  type="radio"
                                  name="promoActive"
                                  checked={cfgPromoActive === true}
                                  onChange={() => setCfgPromoActive(true)}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">অফিসিয়ালি চালু (Show Popup)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                <input
                                  type="radio"
                                  name="promoActive"
                                  checked={cfgPromoActive === false}
                                  onChange={() => setCfgPromoActive(false)}
                                  className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                                />
                                <span className="text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">সাময়িকভাবে বন্ধ (Hide Popup)</span>
                              </label>
                            </div>
                          </div>

                          {/* 2. Image URL & selection */}
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-700 flex items-center justify-between">
                              <span>অফার ব্যানার ইমেজ (Offer Banner Image) *</span>
                              <span className="text-[11px] text-orange-600 font-extrabold bg-orange-50 px-2 py-0.5 rounded">সাইজ: 800x800 px (Square) অথবা 800x1000 px (Portrait) সবচেয়ে ভালো দেখাবে</span>
                            </label>

                            <div className="flex gap-3">
                              <input
                                type="text"
                                placeholder="ছবির ডিরেক্ট লিংক (যেমন: https://...)"
                                value={cfgPromoImage}
                                onChange={(e) => setCfgPromoImage(e.target.value)}
                                className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => setImageSelectorTarget('promo')}
                                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>গ্যালারি</span>
                              </button>
                            </div>

                            {/* Direct Base64 File upload */}
                            <div>
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-md cursor-pointer transition-colors border border-slate-200/50">
                                <Upload className="w-3 h-3 text-slate-500" />
                                <span>সরাসরি কম্পিউটার/মোবাইল থেকে আপলোড করুন</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === 'string') {
                                          setCfgPromoImage(reader.result);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-1.5">
                                📌 <span className="text-orange-600 font-black">প্রস্তাবিত সাইজ:</span> স্কয়ার বা চারকোনা ছবির জন্য <span className="text-[#006437] font-extrabold">800 × 800 পিক্সেল (1:1)</span> অথবা খাড়া/লম্বা ছবির জন্য <span className="text-[#006437] font-extrabold">800 × 1000 পিক্সেল (4:5)</span> ব্যবহার করুন। এতে মোবাইল ও কম্পিউটার দুই স্ক্রিনেই অফারটি চমৎকার দেখাবে।
                              </p>
                            </div>
                          </div>

                        {/* Preview panel */}
                        <div className="md:col-span-5 flex flex-col justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div>
                            <h5 className="font-bold text-gray-700 text-xs mb-3 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                              <span>লাইভ প্রিভিউ (Popup Preview)</span>
                              {cfgPromoActive ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-md font-black">সচল</span>
                              ) : (
                                <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-md font-black">বন্ধ</span>
                              )}
                            </h5>

                            {cfgPromoImage ? (
                              <div className="relative max-w-[200px] mx-auto rounded-xl shadow-md border border-gray-200 bg-white overflow-hidden group">
                                <img
                                  src={cfgPromoImage}
                                  alt="Live Preview"
                                  className="w-full h-auto object-contain rounded-xl max-h-[220px]"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white text-[8px] font-black pointer-events-none">
                                  ✕
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-[4/5] bg-gray-200 rounded-xl flex items-center justify-center text-[11px] text-gray-400 font-bold border border-dashed border-gray-300">
                                কোনো অফার ছবি সিলেক্ট করা নেই
                              </div>
                            )}
                          </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {marketingSubTab === 'faq' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Card FAQ Management */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                      <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-orange-500" />
                        ১১. সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ) ম্যানেজমেন্ট
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed font-bold">
                        আপনার শপের কাস্টমারদের সাহায্য করার জন্য ঘন ঘন জিজ্ঞাসিত প্রশ্ন এবং তাদের উত্তরগুলো এখান থেকে সহজে সাজিয়ে নিন। পরিবর্তনের পর পেইজের নিচে থাকা "কাস্টমাইজেশন সেভ করুন" বাটনে ক্লিক করুন।
                      </p>

                      {/* Add New FAQ Section */}
                      <div className="bg-emerald-50/30 p-4 md:p-5 rounded-2xl border border-emerald-100/60 space-y-3">
                        <h5 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">+</span>
                          নতুন প্রশ্ন ও উত্তর যুক্ত করুন
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-emerald-900">প্রশ্ন (Question)</label>
                            <input
                              type="text"
                              id="new-faq-q"
                              placeholder="যেমন: আপনাদের ডেলিভারি চার্জ কত?"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden font-semibold text-slate-800 bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-emerald-900">উত্তর (Answer)</label>
                            <textarea
                              id="new-faq-a"
                              rows={2}
                              placeholder="যেমন: সারা বাংলাদেশে আমাদের ডেলিভারি চার্জ মাত্র ৫০ টাকা।"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden font-semibold text-slate-800 bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const qInput = document.getElementById('new-faq-q') as HTMLInputElement;
                              const aInput = document.getElementById('new-faq-a') as HTMLTextAreaElement;
                              const q = qInput?.value?.trim();
                              const a = aInput?.value?.trim();
                              if (!q || !a) {
                                alert('দয়া করে প্রশ্ন ও উত্তর দুটোই লিখুন!');
                                return;
                              }
                              setCfgFaqItems([...cfgFaqItems, { question: q, answer: a }]);
                              if (qInput) qInput.value = '';
                              if (aInput) aInput.value = '';
                            }}
                            className="bg-[#006437] hover:bg-emerald-800 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            প্রশ্নটি তালিকায় যোগ করুন
                          </button>
                        </div>
                      </div>

                      {/* Current FAQs List */}
                      <div className="space-y-3 pt-2">
                        <h5 className="font-bold text-gray-700 text-xs flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                          <span>বর্তমানে সচল প্রশ্ন ও উত্তর সমূহ ({cfgFaqItems.length} টি)</span>
                        </h5>

                        {cfgFaqItems.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-xs text-gray-400 font-bold">কোনো প্রশ্ন যুক্ত করা নেই। উপরের ফরম ব্যবহার করে প্রথম প্রশ্নটি যোগ করুন।</p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {cfgFaqItems.map((faq, idx) => (
                              <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-2 flex-grow">
                                    <div className="flex items-start gap-2">
                                      <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 mt-0.5">প্রশ্ন {idx + 1}</span>
                                      <input
                                        type="text"
                                        value={faq.question}
                                        onChange={(e) => {
                                          const updated = [...cfgFaqItems];
                                          updated[idx].question = e.target.value;
                                          setCfgFaqItems(updated);
                                        }}
                                        className="w-full bg-white px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-slate-800"
                                      />
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 mt-0.5">উত্তর {idx + 1}</span>
                                      <textarea
                                        rows={2}
                                        value={faq.answer}
                                        onChange={(e) => {
                                          const updated = [...cfgFaqItems];
                                          updated[idx].answer = e.target.value;
                                          setCfgFaqItems(updated);
                                        }}
                                        className="w-full bg-white px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-semibold text-slate-700"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm('আপনি কি নিশ্চিতভাবে এই প্রশ্ন ও উত্তরটি মুছে ফেলতে চান?')) {
                                        setCfgFaqItems(cfgFaqItems.filter((_, fidx) => fidx !== idx));
                                      }
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer shrink-0 mt-1"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    কাস্টমাইজেশন সেভ করুন
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {hasPermission('payments') && activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-5.5 h-5.5 text-orange-600" />
                    <span>পেমেন্ট ও ট্রানজেকশন ট্র্যাকিং</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-bold mt-0.5">গ্রাহকের বিকাশ/নগদ পেমেন্ট ট্রানজেকশন এবং অর্ডার ভেরিফিকেশন প্যানেল।</p>
                </div>
              </div>

              {/* Search & Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6 relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="অর্ডার আইডি, কাস্টমার নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-medium"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-bold text-gray-600"
                  >
                    <option value="all">সকল পেমেন্ট পদ্ধতি</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="rocket">রকেট (Rocket)</option>
                    <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-bold text-gray-600"
                  >
                    <option value="all">সকল পেমেন্ট অবস্থা</option>
                    <option value="pending">পেন্ডিং / যাচাইয়ের অপেক্ষায়</option>
                    <option value="approved">অনুমোদিত পেমেন্ট</option>
                    <option value="cancelled">বাতিলকৃত ট্রানজেকশন</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="p-4">অর্ডার আইডি ও তারিখ</th>
                        <th className="p-4">গ্রাহকের নাম ও ফোন</th>
                        <th className="p-4">পেমেন্ট পদ্ধতি</th>
                        <th className="p-4">টাকা পাঠানো নম্বর</th>
                        <th className="p-4">ট্রানজেকশন আইডি (TrxID)</th>
                        <th className="p-4 text-right">টাকার পরিমাণ</th>
                        <th className="p-4 text-center">স্ট্যাটাস</th>
                        <th className="p-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {orders.filter((order) => {
                        const matchesSearch = 
                          matchesSearchWithNumerals(order.id, paymentSearch) ||
                          matchesSearchWithNumerals(order.customerName, paymentSearch) ||
                          matchesSearchWithNumerals(order.customerPhone, paymentSearch) ||
                          (order.bkashNumber && matchesSearchWithNumerals(order.bkashNumber, paymentSearch)) ||
                          (order.trxId && matchesSearchWithNumerals(order.trxId, paymentSearch));

                        const matchesMethod = 
                          paymentMethodFilter === 'all' || 
                          order.paymentMethod === paymentMethodFilter;

                        let matchesStatus = true;
                        if (paymentStatusFilter === 'pending') {
                          matchesStatus = order.status === 'pending';
                        } else if (paymentStatusFilter === 'approved') {
                          matchesStatus = order.status !== 'pending' && order.status !== 'cancelled';
                        } else if (paymentStatusFilter === 'cancelled') {
                          matchesStatus = order.status === 'cancelled';
                        }
                        return matchesSearch && matchesMethod && matchesStatus;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">
                            কোন ট্রানজেকশন বা পেমেন্ট পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        orders.filter((order) => {
                          const matchesSearch = 
                            matchesSearchWithNumerals(order.id, paymentSearch) ||
                            matchesSearchWithNumerals(order.customerName, paymentSearch) ||
                            matchesSearchWithNumerals(order.customerPhone, paymentSearch) ||
                            (order.bkashNumber && matchesSearchWithNumerals(order.bkashNumber, paymentSearch)) ||
                            (order.trxId && matchesSearchWithNumerals(order.trxId, paymentSearch));

                          const matchesMethod = 
                            paymentMethodFilter === 'all' || 
                            order.paymentMethod === paymentMethodFilter;

                          let matchesStatus = true;
                          if (paymentStatusFilter === 'pending') {
                            matchesStatus = order.status === 'pending';
                          } else if (paymentStatusFilter === 'approved') {
                            matchesStatus = order.status !== 'pending' && order.status !== 'cancelled';
                          } else if (paymentStatusFilter === 'cancelled') {
                            matchesStatus = order.status === 'cancelled';
                          }
                          return matchesSearch && matchesMethod && matchesStatus;
                        }).map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-gray-800">#{order.id}</span>
                                <span className="text-[10px] text-gray-400 font-bold mt-0.5">{order.createdAt}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-800">{order.customerName}</span>
                                <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{order.customerPhone}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold uppercase text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md text-[10px]">
                                {order.paymentMethod}
                              </span>
                            </td>
                            <td className="p-4">
                              {order.bkashNumber ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-800 font-mono">{order.bkashNumber}</span>
                                  <button
                                    onClick={() => handleCopy(order.bkashNumber!, `num-${order.id}`)}
                                    className="text-gray-400 hover:text-orange-500 transition-colors p-0.5 cursor-pointer"
                                    title="নম্বর কপি করুন"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  {copiedTextId === `num-${order.id}` && (
                                    <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 rounded border border-emerald-100 font-extrabold">কপিড!</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 font-bold">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              {order.trxId ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono bg-slate-50 px-1.5 py-0.5 border rounded text-slate-700 font-bold text-[11px] select-all">
                                    {order.trxId}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(order.trxId!, `trx-${order.id}`)}
                                    className="text-gray-400 hover:text-orange-500 transition-colors p-0.5 cursor-pointer"
                                    title="TrxID কপি করুন"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  {copiedTextId === `trx-${order.id}` && (
                                    <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 rounded border border-emerald-100 font-extrabold">কপিড!</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 font-bold">—</span>
                              )}
                            </td>
                            <td className="p-4 font-extrabold text-gray-800 text-right text-sm">
                              ৳{order.totalAmount}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-block ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {order.status === 'pending' ? 'যাচাইযোগ্য / পেন্ডিং' :
                                 order.status === 'processing' ? 'প্রসেসিং / কনফার্মড' :
                                 order.status === 'shipped' ? 'শিপড' :
                                 order.status === 'delivered' ? 'ডেলিভার্ড' : 'বাতিলকৃত'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {order.status === 'pending' ? (
                                  pendingConfirmOrderId === order.id ? (
                                    <div className="flex flex-col items-center gap-1 bg-orange-50 border border-orange-200 p-1.5 rounded-lg max-w-[140px] mx-auto">
                                      <div className="flex gap-1 items-center">
                                        <input
                                          type="text"
                                          placeholder="কোড"
                                          value={confirmCodeInput}
                                          onChange={(e) => setConfirmCodeInput(e.target.value)}
                                          className="w-12 px-1 py-0.5 border border-orange-300 rounded text-[10px] bg-white text-center font-extrabold focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                                        />
                                        <button
                                          onClick={() => {
                                            if (confirmCodeInput === '247') {
                                              onUpdateOrderStatus(order.id, 'processing');
                                              notify(`অর্ডার ${order.id}-এর পেমেন্ট সফলভাবে যাচাই করে অর্ডারটি কনফার্ম (প্রসেসিং) করা হয়েছে।`, 'success');
                                              setPendingConfirmOrderId(null);
                                              setConfirmCodeInput('');
                                            } else {
                                              notify('ভুল কোড! সঠিক কোড দিন।', 'error');
                                            }
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                                        >
                                          যাচাই
                                        </button>
                                        <button
                                          onClick={() => {
                                            setPendingConfirmOrderId(null);
                                            setConfirmCodeInput('');
                                          }}
                                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[9px] font-black px-1 py-0.5 rounded cursor-pointer shrink-0"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setPendingConfirmOrderId(order.id);
                                        setConfirmCodeInput('');
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md transition-all shadow-xs cursor-pointer"
                                    >
                                      পেমেন্ট কনফার্ম করুন
                                    </button>
                                  )
                                ) : (
                                  <button
                                    onClick={() => setSelectedPaymentOrder(order)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                                  >
                                    বিবরণী দেখুন
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUCT REQUESTS */}
          {hasPermission('requests') && activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Header block with search */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg md:text-xl">
                    🛍️ গ্রাহক প্রোডাক্ট রিকুয়েস্ট সমূহ
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    স্টক আউট পণ্যের জন্য কাস্টমারদের পাঠানো রিকুয়েস্টের তালিকা এবং তাদের সাথে যোগাযোগের স্ট্যাটাস।
                  </p>
                </div>
              </div>

              {/* Stats overview row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
                  <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl">
                    <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">অপেক্ষমাণ রিকুয়েস্ট</p>
                    <h3 className="font-extrabold text-gray-800 text-base md:text-lg">
                      {productRequests.filter(r => r.status === 'pending').length} টি
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">যোগাযোগ করা হয়েছে</p>
                    <h3 className="font-extrabold text-gray-800 text-base md:text-lg">
                      {productRequests.filter(r => r.status === 'contacted').length} টি
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">সম্পন্ন রিকুয়েস্ট</p>
                    <h3 className="font-extrabold text-gray-800 text-base md:text-lg">
                      {productRequests.filter(r => r.status === 'completed').length} টি
                    </h3>
                  </div>
                </div>
              </div>

              {/* Main table view */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    সর্বমোট {productRequests.length} টি রিকুয়েস্ট পাওয়া গেছে
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="p-4">অনুরোধকৃত পণ্য বিবরণ</th>
                        <th className="p-4">গ্রাহকের বিবরণী</th>
                        <th className="p-4">তারিখ ও আইডি</th>
                        <th className="p-4 text-center">অবস্থা / স্ট্যাটাস</th>
                        <th className="p-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                      {productRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                            কোন প্রোডাক্ট রিকুয়েস্ট পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        productRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 shrink-0 flex items-center justify-center border border-gray-100">
                                  <img 
                                    src={req.productImage} 
                                    alt={req.productName} 
                                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-gray-800 text-sm leading-snug">
                                    {req.productName}
                                  </h4>
                                  <p className="text-[10px] text-[#006437] font-bold mt-0.5">
                                    পরিমাণ: <span className="text-orange-600 text-xs font-black">{req.quantity}</span>
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-gray-800 text-xs">
                                  {req.customerName}
                                </h4>
                                <p className="text-[11px] font-mono font-bold text-gray-600">
                                  📞 {req.customerPhone}
                                </p>
                                <p className="text-[10px] text-gray-400 leading-normal max-w-[200px] truncate" title={req.deliveryAddress}>
                                  🏠 {req.deliveryAddress}
                                </p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold text-[10px]">
                                  {req.id}
                                </span>
                                <p className="text-[10px] text-gray-400 font-bold">
                                  {new Date(req.createdAt).toLocaleString('bn-BD', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block border ${
                                req.status === 'pending'
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : req.status === 'contacted'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              }`}>
                                {req.status === 'pending' ? 'পেন্ডিং' :
                                 req.status === 'contacted' ? 'যোগাযোগ করা হয়েছে' : 'সম্পন্ন / ডেলিভার্ড'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[200px] mx-auto">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRequestDetails(req)}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-amber-200 shadow-3xs"
                                  title="স্লিপ ও বিস্তারিত দেখুন"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>স্লিপ দেখুন</span>
                                </button>

                                {req.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateProductRequestStatus(req.id, 'contacted');
                                      notify('রিকুয়েস্টের অবস্থা "যোগাযোগ করা হয়েছে" এ পরিবর্তন করা হয়েছে।', 'success');
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer shadow-3xs"
                                    title="যোগাযোগ করা হয়েছে চিহ্নিত করুন"
                                  >
                                    যোগাযোগ করেছি
                                  </button>
                                )}
                                {req.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateProductRequestStatus(req.id, 'completed');
                                      notify('রিকুয়েস্টটি সফলভাবে "সম্পন্ন" চিহ্নিত করা হয়েছে।', 'success');
                                    }}
                                    className="bg-[#006437] hover:bg-[#004d2a] text-white text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer shadow-3xs"
                                    title="সম্পন্ন চিহ্নিত করুন"
                                  >
                                    সম্পন্ন করুন
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRequestToDelete(req);
                                  }}
                                  className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-400 p-1.5 rounded-lg transition-colors cursor-pointer border-0"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USER MANAGEMENT */}
          {hasPermission('users') && activeTab === 'users' && (
            <div className="space-y-5 font-sans">
              {/* Sub-tab selection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-3xs">
                <div className="flex gap-1.5 p-1 bg-gray-100/80 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setUserSubTab('list')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs md:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      userSubTab === 'list'
                        ? 'bg-white text-orange-600 shadow-xs'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>ইউজার ও গ্রাহক তালিকা ({users?.length || 0} জন)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserSubTab('security')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs md:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      userSubTab === 'security'
                        ? 'bg-white text-orange-600 shadow-xs'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>নিরাপত্তা ও অডিট লগ</span>
                  </button>
                </div>

                {userSubTab === 'list' && (
                  <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    {/* View Switcher Pills */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setUserViewMode('list')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          userViewMode === 'list'
                            ? 'bg-white text-gray-800 shadow-3xs'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        তালিকা (List)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          userViewMode === 'grid'
                            ? 'bg-white text-gray-800 shadow-3xs'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        গ্রিড (Grid)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAdminAddUserOpen(true)}
                      className="bg-[#006437] hover:bg-[#004d2a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন গ্রাহক</span>
                    </button>
                  </div>
                )}
              </div>

              {userSubTab === 'list' && (
                <>
                  {/* User Stats Panel */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-3xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট ইউজার</p>
                        <p className="text-lg font-extrabold text-gray-800 mt-0.5">{users?.length || 0} জন</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-3xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">সক্রিয় গ্রাহক</p>
                        <p className="text-lg font-extrabold text-gray-800 mt-0.5">
                          {users?.filter(u => u.role === 'user' && u.status === 'active').length || 0} জন
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-3xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">অ্যাডমিনিস্ট্রেটর</p>
                        <p className="text-lg font-extrabold text-gray-800 mt-0.5">
                          {users?.filter(u => u.role === 'admin').length || 0} জন
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-3xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ব্লকড্ ইউজার</p>
                        <p className="text-lg font-extrabold text-gray-800 mt-0.5">
                          {users?.filter(u => u.status === 'blocked').length || 0} জন
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter Row */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-3xs flex flex-col md:flex-row gap-3">
                    {/* Search Input */}
                    <div className="flex-grow relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="নাম, মোবাইল নম্বর, ইমেইল অথবা ঠিকানা দিয়ে খুঁজুন..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-100/50 transition-all placeholder-gray-400 bg-gray-50/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:flex gap-3 shrink-0">
                      {/* Filter Role */}
                      <div className="w-full md:w-48">
                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white font-bold text-gray-600 focus:outline-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <option value="all">সকল রোল (User/Admin)</option>
                          <option value="user">গ্রাহক (Regular User)</option>
                          <option value="admin">অ্যাডমিন (Administrator)</option>
                        </select>
                      </div>

                      {/* Filter Status */}
                      <div className="w-full md:w-48">
                        <select
                          value={userStatusFilter}
                          onChange={(e) => setUserStatusFilter(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white font-bold text-gray-600 focus:outline-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <option value="all">সকল অবস্থা (Active/Blocked)</option>
                          <option value="active">সক্রিয় গ্রাহক (Active)</option>
                          <option value="blocked">ব্লকড্ আইডি (Blocked)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {userViewMode === 'grid' ? (
                    /* User Cards Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const filtered = (users || []).filter((u) => {
                          const matchesSearch = 
                            matchesSearchWithNumerals(u.name, userSearch) ||
                            matchesSearchWithNumerals(u.phone, userSearch) ||
                            (u.email && matchesSearchWithNumerals(u.email, userSearch)) ||
                            matchesSearchWithNumerals(u.address, userSearch) ||
                            (u.area && matchesSearchWithNumerals(u.area, userSearch)) ||
                            (u.district && matchesSearchWithNumerals(u.district, userSearch));

                          const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                          const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;

                          return matchesSearch && matchesRole && matchesStatus;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-200/80 text-gray-400 font-bold">
                              কোনো গ্রাহক বা ইউজারের তথ্য পাওয়া যায়নি!
                            </div>
                          );
                        }

                        return filtered.map((u) => {
                          // Simple safe initials generation
                          const nameParts = u.name ? u.name.trim().split(' ') : [];
                          const initials = nameParts.length >= 2 
                            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                            : (u.name ? u.name.substring(0, 2).toUpperCase() : 'US');

                          return (
                            <div 
                              key={u.id} 
                              className="bg-white rounded-2xl border border-gray-200/80 shadow-3xs p-5 hover:shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between gap-4 group"
                            >
                              <div className="space-y-3">
                                {/* Card Header with Avatar and Role */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shadow-3xs border transition-transform group-hover:scale-105 ${
                                        u.role === 'admin'
                                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                                          : 'bg-orange-50 text-orange-600 border-orange-100'
                                      }`}>
                                        {initials}
                                      </div>
                                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                        u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                                      }`} />
                                    </div>
                                    <div>
                                      <div className="font-mono text-[9px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/50 w-fit">
                                        ID: {u.id}
                                      </div>
                                      <h4 className="font-extrabold text-gray-800 text-sm mt-1">{u.name}</h4>
                                    </div>
                                  </div>
                                  
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider shrink-0 ${
                                    u.role === 'admin' 
                                      ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  }`}>
                                    {u.role === 'admin' ? 'অ্যাডমিন' : 'গ্রাহক'}
                                  </span>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-1.5 pt-2.5 border-t border-gray-100 text-xs font-bold text-gray-600">
                                  <div className="flex items-center gap-2 font-mono">
                                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span>{u.phone}</span>
                                  </div>
                                  {u.email && (
                                    <div className="flex items-center gap-2 font-sans text-gray-500">
                                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                      <span className="truncate max-w-[180px]" title={u.email}>{u.email}</span>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2 leading-relaxed pt-1.5 border-t border-gray-50 font-sans">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                      <p className="text-gray-700 font-extrabold text-xs" title={u.address}>{u.address}</p>
                                      <p className="text-[10px] text-gray-400 font-bold">
                                        Thana: <strong className="text-gray-500 font-bold">{u.area}</strong> | Dist: <strong className="text-gray-500 font-bold">{u.district}</strong>
                                      </p>
                                    </div>
                                  </div>

                                  {u.role === 'admin' && (
                                    <div className="pt-2 border-t border-gray-100">
                                      <span className="text-[9px] font-black text-slate-400 block uppercase mb-1">অনুমতিসমূহ:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {(() => {
                                          const perms = u.permissions || ['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users'];
                                          if (perms.length === 0) {
                                            return <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded font-bold">কোনো অনুমতি নেই</span>;
                                          }
                                          if (perms.length === AVAILABLE_PERMISSIONS.length) {
                                            return <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md font-bold">সকল অনুমতি (Full Access)</span>;
                                          }
                                          return perms.map(pId => {
                                            const pObj = AVAILABLE_PERMISSIONS.find(ap => ap.id === pId);
                                            return (
                                              <span key={pId} className="text-[8px] bg-slate-50 text-slate-600 border border-slate-200/60 px-1.5 py-0.5 rounded-md font-bold" title={pObj?.desc}>
                                                {pObj?.name || pId}
                                              </span>
                                            );
                                          });
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Registration Date and Actions Footer */}
                              <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-gray-400 font-bold font-sans">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('bn-BD', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : 'আগের অ্যাকাউন্ট'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditUser(u)}
                                    className="bg-orange-50 hover:bg-orange-100 text-orange-700 p-1.5 rounded-lg border border-orange-200/50 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                    title="গ্রাহকের তথ্য ও পাসওয়ার্ড এডিট করুন"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>এডিট</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      const nextStatus = u.status === 'active' ? 'blocked' : 'active';
                                      onUpdateUser({ ...u, status: nextStatus });
                                      notify(`গ্রাহক "${u.name}"-এর আইডিটি সফলভাবে ${nextStatus === 'blocked' ? 'ব্লক' : 'আনব্লক'} করা হয়েছে!`, nextStatus === 'blocked' ? 'error' : 'success');
                                      setSecurityLogs([
                                        {
                                          id: String(securityLogs.length + 1),
                                          timestamp: new Date().toISOString(),
                                          action: `গ্রাহক "${u.name}" আইডি ${nextStatus === 'blocked' ? 'ব্লক' : 'আনব্লক'} করা হয়েছে`,
                                          user: 'mhasansakib35@gmail.com',
                                          status: nextStatus === 'blocked' ? 'warning' : 'success',
                                          ip: '103.114.172.5'
                                        },
                                        ...securityLogs
                                      ]);
                                    }}
                                    className={`p-1.5 rounded-lg transition-all border text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                                      u.status === 'active'
                                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200/50'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/50'
                                    }`}
                                    title={u.status === 'active' ? 'আইডি ব্লক করুন' : 'আইডি আনব্লক করুন'}
                                  >
                                    {u.status === 'active' ? (
                                      <ShieldAlert className="w-3.5 h-3.5" />
                                    ) : (
                                      <UserCheck className="w-3.5 h-3.5" />
                                    )}
                                    <span>{u.status === 'active' ? 'ব্লক' : 'আনব্লক'}</span>
                                  </button>

                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 p-1.5 rounded-lg border border-gray-200/40 transition-all cursor-pointer"
                                    title="গ্রাহক আইডি ডিলিট করুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    /* User Elegant Table View */
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-3xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              <th className="p-4">গ্রাহক আইডি ও রোল</th>
                              <th className="p-4">নাম ও কন্টাক্ট তথ্য</th>
                              <th className="p-4">ডেলিভারি ঠিকানা ও জেলা</th>
                              <th className="p-4">রেজিস্ট্রেশন ডেট</th>
                              <th className="p-4 text-center">স্ট্যাটাস</th>
                              <th className="p-4 text-center">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {(() => {
                              const filtered = (users || []).filter((u) => {
                                const matchesSearch = 
                                  matchesSearchWithNumerals(u.name, userSearch) ||
                                  matchesSearchWithNumerals(u.phone, userSearch) ||
                                  (u.email && matchesSearchWithNumerals(u.email, userSearch)) ||
                                  matchesSearchWithNumerals(u.address, userSearch) ||
                                  (u.area && matchesSearchWithNumerals(u.area, userSearch)) ||
                                  (u.district && matchesSearchWithNumerals(u.district, userSearch));

                                const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                                const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;

                                return matchesSearch && matchesRole && matchesStatus;
                              });

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 font-bold">
                                      কোনো গ্রাহক বা ইউজারের তথ্য পাওয়া যায়নি!
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                  {/* ID & Role */}
                                  <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold text-[10px] w-fit">
                                        {u.id}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black w-fit uppercase border ${
                                        u.role === 'admin' 
                                          ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                      }`}>
                                        {u.role === 'admin' ? 'অ্যাডমিন' : 'গ্রাহক'}
                                      </span>

                                      {u.role === 'admin' && (
                                        <div className="mt-1.5 space-y-1">
                                          <span className="text-[9px] font-bold text-slate-400 block uppercase">অনুমতিসমূহ:</span>
                                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {(() => {
                                              const perms = u.permissions || ['overview', 'products', 'orders', 'payments', 'marketing', 'requests', 'users'];
                                              if (perms.length === 0) {
                                                return <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded font-bold">কোনো অনুমতি নেই</span>;
                                              }
                                              if (perms.length === AVAILABLE_PERMISSIONS.length) {
                                                return <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md font-bold">সকল অনুমতি</span>;
                                              }
                                              return perms.map(pId => {
                                                const pObj = AVAILABLE_PERMISSIONS.find(ap => ap.id === pId);
                                                return (
                                                  <span key={pId} className="text-[8px] bg-slate-50 text-slate-600 border border-slate-200/60 px-1 py-0.5 rounded-md font-bold" title={pObj?.desc}>
                                                    {pObj?.name || pId}
                                                  </span>
                                                );
                                              });
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  {/* Name & Contact */}
                                  <td className="p-4">
                                    <div className="flex flex-col space-y-1">
                                      <span className="font-extrabold text-gray-800 text-sm">{u.name}</span>
                                      <span className="text-[11px] font-mono font-bold text-gray-600 font-sans">📞 {u.phone}</span>
                                      {u.email && (
                                        <span className="text-[10px] text-gray-400 font-semibold font-sans">✉️ {u.email}</span>
                                      )}
                                    </div>
                                  </td>
                                  {/* Address & District */}
                                  <td className="p-4">
                                    <div className="space-y-1 max-w-[220px]">
                                      <p className="font-bold text-gray-700 truncate" title={u.address}>{u.address}</p>
                                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                        📍 Thana: <strong className="text-gray-600">{u.area}</strong> | Dist: <strong className="text-gray-600">{u.district}</strong>
                                      </p>
                                    </div>
                                  </td>
                                  {/* Registration Date */}
                                  <td className="p-4 font-semibold text-gray-500 font-sans">
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('bn-BD', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'আগের অ্যাকাউন্ট'}
                                  </td>
                                  {/* Status badge */}
                                  <td className="p-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-block border ${
                                      u.status === 'active' 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                        : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                      {u.status === 'active' ? 'সক্রিয় (Active)' : 'ব্লকড্ (Blocked)'}
                                    </span>
                                  </td>
                                  {/* Actions */}
                                  <td className="p-4">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditUser(u)}
                                        className="bg-orange-50 hover:bg-orange-100 text-orange-700 p-1.5 rounded-lg border border-orange-200 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                        title="গ্রাহকের তথ্য ও পাসওয়ার্ড এডিট করুন"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>এডিট</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          const nextStatus = u.status === 'active' ? 'blocked' : 'active';
                                          onUpdateUser({ ...u, status: nextStatus });
                                          notify(`গ্রাহক "${u.name}"-এর আইডিটি সফলভাবে ${nextStatus === 'blocked' ? 'ব্লক' : 'আনব্লক'} করা হয়েছে!`, nextStatus === 'blocked' ? 'error' : 'success');
                                          setSecurityLogs([
                                            {
                                              id: String(securityLogs.length + 1),
                                              timestamp: new Date().toISOString(),
                                              action: `গ্রাহক "${u.name}" আইডি ${nextStatus === 'blocked' ? 'ব্লক' : 'আনব্লক'} করা হয়েছে`,
                                              user: 'mhasansakib35@gmail.com',
                                              status: nextStatus === 'blocked' ? 'warning' : 'success',
                                              ip: '103.114.172.5'
                                            },
                                            ...securityLogs
                                          ]);
                                        }}
                                        className={`p-1.5 rounded-lg transition-all border text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                                          u.status === 'active'
                                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                        }`}
                                        title={u.status === 'active' ? 'আইডি ব্লক করুন' : 'আইডি আনব্লক করুন'}
                                      >
                                        {u.status === 'active' ? (
                                          <>
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            <span>ব্লক</span>
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>আনব্লক</span>
                                          </>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => {
                                          setUserToDelete(u);
                                        }}
                                        className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-400 p-1.5 rounded-lg transition-colors cursor-pointer border-0"
                                        title="গ্রাহক আইডি ডিলিট করুন"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {userSubTab === 'security' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Security Policy Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-3xs space-y-5">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-sm md:text-base flex items-center gap-1.5 border-b border-gray-100 pb-3">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          <span>সিস্টেম সিকিউরিটি পলিসি</span>
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-bold">পুরো ওয়েবসাইটের লগইন ও পাসওয়ার্ড সুরক্ষার নিয়মাবলী নির্ধারণ করুন</p>
                      </div>

                      <div className="space-y-4">
                        {/* OTP Verification Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 transition-all hover:bg-slate-50">
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold text-gray-800 block font-bold">ওটিপি (OTP) লগইন ভেরিফিকেশন</span>
                            <span className="text-[10px] text-gray-400 font-bold block">লগইন করার সময় মোবাইল নম্বরে ৬ ডিজিটের OTP কোড পাঠানো হবে</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpLoginEnabled(!otpLoginEnabled);
                              const action = !otpLoginEnabled ? 'ওটিপি (OTP) লগইন ভেরিফিকেশন চালু করা হয়েছে' : 'ওটিপি (OTP) লগইন ভেরিফিকেশন বন্ধ করা হয়েছে';
                              notify(action, !otpLoginEnabled ? 'success' : 'info');
                              setSecurityLogs([
                                {
                                  id: String(securityLogs.length + 1),
                                  timestamp: new Date().toISOString(),
                                  action,
                                  user: 'mhasansakib35@gmail.com',
                                  status: !otpLoginEnabled ? 'success' : 'warning',
                                  ip: '103.114.172.5'
                                },
                                ...securityLogs
                              ]);
                            }}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${otpLoginEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                          >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${otpLoginEnabled ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>

                        {/* 2-Factor Authentication Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 transition-all hover:bg-slate-50">
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold text-gray-800 block font-bold">২-ফ্যাক্টর অ্যাডমিন নিরাপত্তা</span>
                            <span className="text-[10px] text-gray-400 font-bold block">অ্যাডমিন প্যানেলে প্রবেশের জন্য অতিরিক্ত সিকিউরিটি পিন লাগবে</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTwoFactorEnabled(!twoFactorEnabled);
                              const action = !twoFactorEnabled ? '২-ফ্যাক্টর নিরাপত্তা সিকিউরিটি পিন চালু করা হয়েছে' : '২-ফ্যাক্টর নিরাপত্তা সিকিউরিটি পিন বন্ধ করা হয়েছে';
                              notify(action, !twoFactorEnabled ? 'success' : 'info');
                              setSecurityLogs([
                                {
                                  id: String(securityLogs.length + 1),
                                  timestamp: new Date().toISOString(),
                                  action,
                                  user: 'mhasansakib35@gmail.com',
                                  status: !twoFactorEnabled ? 'success' : 'warning',
                                  ip: '103.114.172.5'
                                },
                                ...securityLogs
                              ]);
                            }}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${twoFactorEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                          >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${twoFactorEnabled ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>

                        {/* Min Password Length */}
                        <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-gray-800 font-bold">সর্বনিম্ন পাসওয়ার্ড দৈর্ঘ্য</span>
                            <span className="text-xs font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg">{minPasswordLength} টি ক্যারেক্টার</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="16"
                            value={minPasswordLength}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setMinPasswordLength(val);
                            }}
                            className="w-full accent-orange-500 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Fail Lockout Threshold */}
                        <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-gray-800 font-bold">ভুল পাসওয়ার্ড ট্রাই লিমিট (লকআউট)</span>
                            <span className="text-xs font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg">{lockoutThreshold} বার</span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="10"
                            value={lockoutThreshold}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setLockoutThreshold(val);
                            }}
                            className="w-full accent-orange-500 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                          />
                          <p className="text-[9px] text-gray-400 font-bold">লগইন করার সময় পর পর এতবার ভুল পাসওয়ার্ড দিলে আইডি ৩০ মিনিটের জন্য ব্লকড হবে</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          notify('সিকিউরিটি পলিসি সফলভাবে সেভ করা হয়েছে!', 'success');
                          setSecurityLogs([
                            {
                              id: String(securityLogs.length + 1),
                              timestamp: new Date().toISOString(),
                              action: 'সিকিউরিটি পলিসি সেটিংস আপডেট করা হয়েছে',
                              user: 'mhasansakib35@gmail.com',
                              status: 'success',
                              ip: '103.114.172.5'
                            },
                            ...securityLogs
                          ]);
                        }}
                        className="w-full py-2.5 bg-[#006437] hover:bg-[#004d2a] text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        পলিসি সেটিংস সংরক্ষণ করুন
                      </button>
                    </div>

                    {/* Change Password Panel */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-3xs space-y-5">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-sm md:text-base flex items-center gap-1.5 border-b border-gray-100 pb-3">
                          <Key className="w-5 h-5 text-orange-600" />
                          <span>পাসওয়ার্ড পরিবর্তন ও রিসেট</span>
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-bold">অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন অথবা অন্য ইউজারদের পাসওয়ার্ড রিসেট করুন</p>
                      </div>

                      <div className="space-y-4">
                        {/* Select Admin account */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">অ্যাকাউন্ট নির্বাচন করুন *</label>
                          <select
                            id="security-target-user-select"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-extrabold bg-white text-gray-700 focus:outline-hidden"
                          >
                            {users.filter(u => u.role === 'admin').map(admin => (
                              <option key={admin.id} value={admin.id}>
                                {admin.name} ({admin.phone} - {admin.role === 'admin' ? 'অ্যাডমিন' : 'গ্রাহক'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">বর্তমান পাসওয়ার্ড (নিরাপত্তার জন্য) *</label>
                          <input
                            type="password"
                            placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                            value={adminCurrentPass}
                            onChange={(e) => setAdminCurrentPass(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">নতুন পাসওয়ার্ড *</label>
                          <input
                            type="password"
                            placeholder="কমপক্ষে ৬টি অক্ষরের নতুন পাসওয়ার্ড"
                            value={adminNewPass}
                            onChange={(e) => setAdminNewPass(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-xs"
                          />

                          {/* Password Strength Indicator */}
                          {adminNewPass.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-gray-400">পাসওয়ার্ডের শক্তি:</span>
                                <span className={
                                  adminNewPass.length < minPasswordLength 
                                    ? 'text-red-500' 
                                    : adminNewPass.length < 10 
                                      ? 'text-amber-500' 
                                      : 'text-emerald-500'
                                }>
                                  {adminNewPass.length < minPasswordLength 
                                    ? 'দুর্বল' 
                                    : adminNewPass.length < 10 
                                      ? 'মাঝারি শক্তিশালী' 
                                      : 'অত্যন্ত শক্তিশালী'}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                                <div className={`h-full transition-all ${
                                  adminNewPass.length < minPasswordLength 
                                    ? 'w-1/3 bg-red-500' 
                                    : adminNewPass.length < 10 
                                      ? 'w-2/3 bg-amber-500' 
                                      : 'w-full bg-emerald-500'
                                }`} />
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন *</label>
                          <input
                            type="password"
                            placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                            value={adminConfirmPass}
                            onChange={(e) => setAdminConfirmPass(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const selectEl = document.getElementById('security-target-user-select') as HTMLSelectElement;
                          const selectedUserId = selectEl?.value;
                          const targetUser = users.find(u => u.id === selectedUserId);

                          if (!targetUser) {
                            notify('কোনো অ্যাকাউন্ট নির্বাচন করা হয়নি!', 'error');
                            return;
                          }

                          if (!adminCurrentPass) {
                            notify('নিরাপত্তার স্বার্থে বর্তমান পাসওয়ার্ডটি লিখতে হবে!', 'error');
                            return;
                          }

                          if (targetUser.password !== adminCurrentPass) {
                            notify('বর্তমান পাসওয়ার্ডটি সঠিক নয়! দয়া করে আবার চেষ্টা করুন।', 'error');
                            return;
                          }

                          if (adminNewPass.length < minPasswordLength) {
                            notify(`নতুন পাসওয়ার্ডটি কমপক্ষে ${minPasswordLength} অক্ষরের হতে হবে!`, 'error');
                            return;
                          }

                          if (adminNewPass !== adminConfirmPass) {
                            notify('নতুন পাসওয়ার্ড ও পাসওয়ার্ড নিশ্চিতকরণ মিলছে না!', 'error');
                            return;
                          }

                          // Success! Call the actual prop function to update user password
                          onUpdateUser({
                            ...targetUser,
                            password: adminNewPass
                          });

                          notify(`অ্যাডমিন "${targetUser.name}" এর পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!`, 'success');
                          
                          // Reset form
                          setAdminCurrentPass('');
                          setAdminNewPass('');
                          setAdminConfirmPass('');

                          // Append Audit log
                          setSecurityLogs([
                            {
                              id: String(securityLogs.length + 1),
                              timestamp: new Date().toISOString(),
                              action: `পাসওয়ার্ড পরিবর্তন করা হয়েছে (${targetUser.name})`,
                              user: 'mhasansakib35@gmail.com',
                              status: 'success',
                              ip: '103.114.172.5'
                            },
                            ...securityLogs
                          ]);
                        }}
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        পাসওয়ার্ড আপডেট করুন
                      </button>
                    </div>
                  </div>

                  {/* Audit Logs Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-sm md:text-base flex items-center gap-1.5">
                          <ShieldAlert className="w-5 h-5 text-rose-500" />
                          <span>সিকিউরিটি অডিট ট্রেইল (নিরাপত্তা ও অ্যাক্টিভিটি লগ)</span>
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">অ্যাডমিন প্যানেলে করা সব ধরনের নিরাপত্তা পরিবর্তনের রিয়েল-টাইম রিপোর্ট</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityLogs([
                            {
                              id: String(securityLogs.length + 1),
                              timestamp: new Date().toISOString(),
                              action: 'অডিট লগ তালিকা ক্লিন করা হয়েছে (সিমুলেশন)',
                              user: 'mhasansakib35@gmail.com',
                              status: 'info' as any,
                              ip: '103.114.172.5'
                            },
                            ...securityLogs
                          ]);
                          notify('নিরাপত্তা লগ রিফ্রেশ করা হয়েছে!', 'info');
                        }}
                        className="text-xs bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>লগ রিফ্রেশ</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-sans">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            <th className="p-4">তারিখ ও সময়</th>
                            <th className="p-4">অ্যাকশন / বিবরণ</th>
                            <th className="p-4">অপারেটর ইউজার</th>
                            <th className="p-4">আইপি এড্রেস</th>
                            <th className="p-4 text-center">স্ট্যাটাস</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                          {securityLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-4 font-mono text-gray-400 text-[10px]">
                                {new Date(log.timestamp).toLocaleString('bn-BD', {
                                  hour12: true,
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </td>
                              <td className="p-4 font-extrabold text-slate-800 text-xs">{log.action}</td>
                              <td className="p-4 font-sans text-gray-500 font-bold">{log.user}</td>
                              <td className="p-4 font-mono text-gray-400 text-[11px]">{log.ip}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-block border ${
                                  log.status === 'success'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    : log.status === 'warning'
                                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                                      : 'bg-red-50 text-red-600 border-red-200'
                                }`}>
                                  {log.status === 'success' ? 'সফল (Success)' : log.status === 'warning' ? 'সতর্কতা (Warning)' : 'ব্যর্থ (Failed)'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN ADD USER MODAL OVERLAY */}
              {isAdminAddUserOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-linear-to-r from-orange-500 to-amber-500 p-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <h3 className="font-extrabold text-sm md:text-base">নতুন গ্রাহক/অ্যাডমিন অ্যাকাউন্ট তৈরি করুন</h3>
                      </div>
                      <button 
                        onClick={() => setIsAdminAddUserOpen(false)}
                        className="p-1.5 hover:bg-white/15 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">সম্পূর্ণ নাম *</label>
                        <input
                          type="text"
                          required
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="যেমন: রফিকুল ইসলাম"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">মোবাইল নম্বর *</label>
                          <input
                            type="tel"
                            required
                            value={newUserPhone}
                            onChange={(e) => setNewUserPhone(e.target.value)}
                            placeholder="যেমন: 017XXXXXXXX"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-mono font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                          <input
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">লগইন পাসওয়ার্ড *</label>
                          <input
                            type="text"
                            required
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="পাসওয়ার্ড লিখুন"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-orange-600 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">রোল সিলেক্ট করুন *</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-hidden font-bold text-gray-700 cursor-pointer text-sm"
                          >
                            <option value="user">গ্রাহক (Regular User)</option>
                            <option value="admin">অ্যাডমিনিস্ট্রেটর (Admin)</option>
                          </select>
                        </div>
                      </div>

                      {newUserRole === 'admin' && (
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <Shield className="w-4 h-4 text-[#006437]" />
                            <span className="font-extrabold text-xs text-gray-800">অ্যাডমিন পারমিশন নির্ধারণ করুন</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold leading-normal">
                            এই অ্যাডমিন কোন কোন ড্যাশবোর্ড ট্যাব এবং ফিচার অ্যাক্সেস করতে পারবেন তা সিলেক্ট করুন:
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {AVAILABLE_PERMISSIONS.map((perm) => {
                              const isChecked = newUserPermissions.includes(perm.id);
                              return (
                                <label key={perm.id} className="flex items-start gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer transition-all border border-transparent hover:border-slate-100">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setNewUserPermissions(newUserPermissions.filter((id) => id !== perm.id));
                                      } else {
                                        setNewUserPermissions([...newUserPermissions, perm.id]);
                                      }
                                    }}
                                    className="mt-0.5 rounded text-[#006437] focus:ring-[#006437] cursor-pointer"
                                  />
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-gray-700 block">{perm.name}</span>
                                    <span className="text-[9px] text-gray-400 leading-normal block">{perm.desc}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">জেলা *</label>
                          <select
                            value={newUserDistrict}
                            onChange={(e) => setNewUserDistrict(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-hidden font-bold text-gray-700 cursor-pointer text-sm"
                          >
                            {DISTRICTS.map((d) => (
                              <option key={d.name} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">থানা / এরিয়া *</label>
                          <input
                            type="text"
                            required
                            value={newUserArea}
                            onChange={(e) => setNewUserArea(e.target.value)}
                            placeholder="যেমন: উত্তরা / ডেমরা"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">সম্পূর্ণ ডেলিভারি ঠিকানা *</label>
                        <textarea
                          required
                          value={newUserAddress}
                          onChange={(e) => setNewUserAddress(e.target.value)}
                          placeholder="বাসা নং, রোড নং, এলাকা..."
                          rows={2}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:outline-hidden font-semibold text-gray-700 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setIsAdminAddUserOpen(false)}
                          className="px-4 py-2 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-xs"
                        >
                          বাতিল (Cancel)
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 font-black text-white bg-[#006437] hover:bg-[#004d2a] rounded-xl transition-colors cursor-pointer shadow-sm text-xs"
                        >
                          অ্যাকাউন্ট তৈরি করুন
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ADMIN EDIT USER MODAL OVERLAY */}
              {adminEditingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-orange-500" />
                        <div>
                          <h3 className="font-extrabold text-sm md:text-base">গ্রাহক তথ্য ও পাসওয়ার্ড সংশোধন</h3>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">আইডি: {adminEditingUser.id}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAdminEditingUser(null)}
                        className="p-1.5 hover:bg-white/15 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditUserSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">সম্পূর্ণ নাম *</label>
                        <input
                          type="text"
                          required
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">মোবাইল নম্বর *</label>
                          <input
                            type="tel"
                            required
                            value={editUserPhone}
                            onChange={(e) => setEditUserPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-mono font-bold text-orange-600 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                          <input
                            type="email"
                            value={editUserEmail}
                            onChange={(e) => setEditUserEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">পাসওয়ার্ড পরিবর্তন *</label>
                          <input
                            type="text"
                            required
                            value={editUserPassword}
                            onChange={(e) => setEditUserPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-rose-600 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">রোল সিলেক্ট করুন *</label>
                          <select
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-hidden font-bold text-gray-700 cursor-pointer text-sm"
                          >
                            <option value="user">গ্রাহক (User)</option>
                            <option value="admin">অ্যাডমিনিস্ট্রেটর (Admin)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">স্ট্যাটাস *</label>
                          <select
                            value={editUserStatus}
                            onChange={(e) => setEditUserStatus(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-hidden font-bold text-gray-700 cursor-pointer text-sm"
                          >
                            <option value="active">Active (সক্রিয়)</option>
                            <option value="blocked">Blocked (ব্লকড্)</option>
                          </select>
                        </div>
                      </div>

                      {editUserRole === 'admin' && (
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <Shield className="w-4 h-4 text-[#006437]" />
                            <span className="font-extrabold text-xs text-gray-800">অ্যাডমিন পারমিশন পরিবর্তন করুন</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold leading-normal">
                            এই অ্যাডমিন কোন কোন ড্যাশবোর্ড ট্যাব এবং ফিচার অ্যাক্সেস করতে পারবেন তা সিলেক্ট করুন:
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {AVAILABLE_PERMISSIONS.map((perm) => {
                              const isChecked = editUserPermissions.includes(perm.id);
                              return (
                                <label key={perm.id} className="flex items-start gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer transition-all border border-transparent hover:border-slate-100">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setEditUserPermissions(editUserPermissions.filter((id) => id !== perm.id));
                                      } else {
                                        setEditUserPermissions([...editUserPermissions, perm.id]);
                                      }
                                    }}
                                    className="mt-0.5 rounded text-[#006437] focus:ring-[#006437] cursor-pointer"
                                  />
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-gray-700 block">{perm.name}</span>
                                    <span className="text-[9px] text-gray-400 leading-normal block">{perm.desc}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">জেলা *</label>
                          <select
                            value={editUserDistrict}
                            onChange={(e) => setEditUserDistrict(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-hidden font-bold text-gray-700 cursor-pointer text-sm"
                          >
                            {DISTRICTS.map((d) => (
                              <option key={d.name} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">থানা / এরিয়া *</label>
                          <input
                            type="text"
                            required
                            value={editUserArea}
                            onChange={(e) => setEditUserArea(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">সম্পূর্ণ ডেলিভারি ঠিকানা *</label>
                        <textarea
                          required
                          value={editUserAddress}
                          onChange={(e) => setEditUserAddress(e.target.value)}
                          rows={2}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:outline-hidden font-semibold text-gray-700 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setAdminEditingUser(null)}
                          className="px-4 py-2 font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-xs"
                        >
                          বাতিল (Cancel)
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 font-black text-white bg-[#006437] hover:bg-[#004d2a] rounded-xl transition-colors cursor-pointer shadow-sm text-xs"
                        >
                          তথ্য আপডেট করুন
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ADMIN USER DELETE CONFIRMATION MODAL */}
              {userToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                  <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-50 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                      <ShieldAlert className="w-6 h-6 animate-bounce" />
                    </div>
                    
                    <div className="text-center space-y-1.5">
                      <h3 className="font-extrabold text-gray-900 text-sm md:text-base">ইউজার আইডি মুছে ফেলতে চান?</h3>
                      <p className="text-xs text-gray-500 leading-normal font-medium">
                        আপনি কি নিশ্চিতভাবে গ্রাহক <strong className="text-gray-800 font-bold">"{userToDelete.name}"</strong>-এর আইডিটি সম্পূর্ণ মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব হবে না!
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setUserToDelete(null)}
                        className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                      >
                        বাতিল (Cancel)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteUser(userToDelete.id);
                          setUserToDelete(null);
                          notify('গ্রাহক আইডি সফলভাবে ডিলিট করা হয়েছে।', 'error');
                        }}
                        className="flex-1 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        হ্যাঁ, ডিলিট করুন
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MULTI-VENDOR MANAGEMENT */}
          {hasPermission('sellers') && activeTab === 'sellers' && (
            <div className="space-y-5 font-sans">
              {/* Sub-tab selection */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSellerSubTab('applications')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all flex items-center gap-2 ${
                    sellerSubTab === 'applications'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>উদ্যোক্তা আবেদন ({users?.filter(u => u.role === 'seller' && u.sellerStatus === 'pending').length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerSubTab('products')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all flex items-center gap-2 ${
                    sellerSubTab === 'products'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>পণ্য অনুমোদন ({products?.filter(p => p.sellerId && p.sellerProductStatus === 'pending').length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerSubTab('withdraws')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all flex items-center gap-2 ${
                    sellerSubTab === 'withdraws'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>টাকা উত্তোলন ({withdrawRequests?.filter(w => w.status === 'pending').length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerSubTab('settings')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all flex items-center gap-2 ml-auto ${
                    sellerSubTab === 'settings'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>সেলার সিস্টেম সেটিংস</span>
                </button>
              </div>

              {/* Sub-tab 1: Applications */}
              {sellerSubTab === 'applications' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <h3 className="font-black text-slate-800 text-sm">উদ্যোক্তা (Seller) অ্যাকাউন্ট ব্যবস্থাপনা</h3>
                    
                    {/* Internal tabs for Seller Applications & Active Sellers */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSellerAppTab('pending')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${sellerAppTab === 'pending' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-slate-700'}`}
                      >
                        উদ্যোক্তা আবেদন ({users?.filter(u => u.role === 'seller' && u.sellerStatus !== 'approved').length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellerAppTab('active')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${sellerAppTab === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-slate-700'}`}
                      >
                        চলমান উদ্যোক্তা ({users?.filter(u => u.role === 'seller' && u.sellerStatus === 'approved').length || 0})
                      </button>
                    </div>
                  </div>
                  
                  {(() => {
                    const filteredUsers = users?.filter(u => {
                      if (u.role !== 'seller') return false;
                      if (sellerAppTab === 'active') {
                        return u.sellerStatus === 'approved';
                      } else {
                        return u.sellerStatus !== 'approved';
                      }
                    }) || [];

                    if (filteredUsers.length === 0) {
                      return (
                        <p className="text-center py-8 text-xs text-gray-400 font-bold">
                          {sellerAppTab === 'active' ? 'কোনো চলমান উদ্যোক্তা অ্যাকাউন্ট পাওয়া যায়নি।' : 'কোনো নতুন আবেদন পাওয়া যায়নি।'}
                        </p>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-stone-50 border-b border-stone-150 text-stone-500 font-black">
                              <th className="p-3">দোকানের লোগো ও নাম</th>
                              <th className="p-3">মালিকের নাম ও ফোন</th>
                              <th className="p-3">পেমেন্ট মেথড</th>
                              <th className="p-3">ঠিকানা</th>
                              <th className="p-3">অবস্থা</th>
                              <th className="p-3 text-right">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-bold text-slate-700">
                            {filteredUsers.map(u => (
                              <tr key={u.id} className="hover:bg-stone-50/50">
                                <td className="p-3 flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg border bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
                                    {u.shopLogo ? (
                                      <img src={u.shopLogo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                      <Store className="w-4.5 h-4.5 text-stone-400" />
                                    )}
                                  </div>
                                  <span className="font-black text-slate-800">{u.shopName || 'দোকানের নাম নেই'}</span>
                                </td>
                                <td className="p-3">
                                  <span className="block text-slate-800">{u.name}</span>
                                  <span className="block text-[10px] text-slate-400">{u.phone}</span>
                                </td>
                                <td className="p-3">
                                  <span className="uppercase text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{u.paymentMethod || 'বিকাশ'}</span>
                                  <span className="block text-[10px] text-slate-500 mt-1">{u.paymentDetails || 'কোনো বিবরণ নেই'}</span>
                                </td>
                                <td className="p-3 max-w-[150px] truncate" title={u.address}>{u.address || 'ঠিকানা নেই'}</td>
                                <td className="p-3">
                                  {u.sellerStatus === 'approved' ? (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">অনুমোদিত (চলমান)</span>
                                  ) : u.sellerStatus === 'rejected' ? (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800">নামঞ্জুরকৃত</span>
                                  ) : (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">অনুমোদন অপেক্ষমাণ</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    {u.sellerStatus !== 'approved' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated: User = { ...u, sellerStatus: 'approved' };
                                          onUpdateUser(updated);
                                          notify(`"${u.shopName}" এর বিক্রেতা অ্যাকাউন্ট অনুমোদন করা হয়েছে!`, 'success');
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2 py-1 rounded transition-colors cursor-pointer"
                                      >
                                        অনুমোদন দিন
                                      </button>
                                    )}
                                    {u.sellerStatus !== 'rejected' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated: User = { ...u, sellerStatus: 'rejected' };
                                          onUpdateUser(updated);
                                          notify(`"${u.shopName}" এর বিক্রেতা অ্যাকাউন্ট নামঞ্জুর করা হয়েছে।`, 'error');
                                        }}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-extrabold px-2 py-1 rounded transition-colors cursor-pointer"
                                      >
                                        বাতিল করুন
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Sub-tab 2: Seller Products Approval */}
              {sellerSubTab === 'products' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="font-black text-slate-800 text-sm">উদ্যোক্তাদের পণ্য অনুমোদন প্যানেল</h3>
                  
                  {products?.filter(p => p.sellerId).length === 0 ? (
                    <p className="text-center py-8 text-xs text-gray-400 font-bold">উদ্যোক্তাদের কোনো পণ্য পাওয়া যায়নি।</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-150 text-stone-500 font-black">
                            <th className="p-3">পণ্যের ছবি ও নাম</th>
                            <th className="p-3">উদ্যোক্তা / দোকান</th>
                            <th className="p-3">দাম ও ক্যাটাগরি</th>
                            <th className="p-3">স্টক</th>
                            <th className="p-3">অবস্থা</th>
                            <th className="p-3 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-bold text-slate-700">
                          {products?.filter(p => p.sellerId).map(p => (
                            <tr key={p.id} className="hover:bg-stone-50/50">
                              <td className="p-3 flex items-center gap-2.5">
                                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                                <div className="min-w-0">
                                  <span className="block text-slate-800 font-black truncate">{p.name}</span>
                                  <span className="block text-[10px] text-slate-400 font-medium">ক্যাটাগরি: {p.category}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-[#006437] font-black">{p.sellerName || 'অজানা বিক্রেতা'}</span>
                                <span className="block text-[9px] text-slate-400">ID: {p.sellerId}</span>
                              </td>
                              <td className="p-3">
                                <span className="font-black text-slate-800">{p.price}৳</span>
                                <span className="text-[10px] text-stone-400"> / {p.unit}</span>
                              </td>
                              <td className="p-3">{p.stock} {p.unit}</td>
                              <td className="p-3">
                                {p.sellerProductStatus === 'approved' ? (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">অনুমোদিত</span>
                                ) : p.sellerProductStatus === 'rejected' ? (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800">প্রত্যাখ্যাত</span>
                                ) : (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">অনুমোদন অপেক্ষমাণ</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setViewingSellerProduct(p)}
                                    className="bg-stone-100 hover:bg-stone-200 text-slate-700 text-[10px] font-extrabold px-2 py-1 rounded transition-colors cursor-pointer"
                                  >
                                    বিস্তারিত দেখুন
                                  </button>
                                  {p.sellerProductStatus !== 'approved' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated: Product = { ...p, sellerProductStatus: 'approved' };
                                        onEditProduct(updated);
                                        notify(`"${p.name}" পণ্যটি সফলভাবে অনুমোদন করা হয়েছে!`, 'success');
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2 py-1 rounded transition-colors cursor-pointer"
                                    >
                                      অনুমোদন দিন
                                    </button>
                                  )}
                                  {p.sellerProductStatus !== 'rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated: Product = { ...p, sellerProductStatus: 'rejected' };
                                        onEditProduct(updated);
                                        notify(`"${p.name}" পণ্যটি বাতিল করা হয়েছে।`, 'error');
                                      }}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-extrabold px-2 py-1 rounded transition-colors cursor-pointer"
                                    >
                                      বাতিল করুন
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Withdrawal requests */}
              {sellerSubTab === 'withdraws' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="font-black text-slate-800 text-sm">উদ্যোক্তা টাকা উত্তোলন (Payout Withdrawal Ledger)</h3>
                  
                  {withdrawRequests?.length === 0 ? (
                    <p className="text-center py-8 text-xs text-gray-400 font-bold">কোনো টাকা উত্তোলনের রিকোয়েস্ট পাওয়া যায়নি।</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-150 text-stone-500 font-black">
                            <th className="p-3">দোকানের নাম</th>
                            <th className="p-3">পরিমাণ (৳)</th>
                            <th className="p-3">উত্তোলন মাধ্যম ও বিবরণ</th>
                            <th className="p-3">তারিখ</th>
                            <th className="p-3">অবস্থা</th>
                            <th className="p-3 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-bold text-slate-700">
                          {withdrawRequests?.map(w => (
                            <tr key={w.id} className="hover:bg-stone-50/50">
                              <td className="p-3 font-black text-slate-800">{w.shopName}</td>
                              <td className="p-3 text-orange-600 font-black text-sm">{w.amount}৳</td>
                              <td className="p-3">
                                <span className="uppercase text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">{w.method === 'bank' ? 'ব্যাংক' : w.method === 'nagad' ? 'নগদ' : 'বিকাশ'}</span>
                                <span className="block text-[10px] text-slate-500 font-semibold mt-1 max-w-[200px] whitespace-normal leading-relaxed">{w.details}</span>
                              </td>
                              <td className="p-3 text-slate-400">{new Date(w.createdAt).toLocaleDateString('bn-BD')}</td>
                              <td className="p-3">
                                {w.status === 'completed' ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">পরিশোধিত</span>
                                ) : w.status === 'rejected' ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">বাতিলকৃত</span>
                                ) : (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">উত্তোলন অপেক্ষমাণ</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  {w.status === 'pending' && onUpdateWithdrawRequest && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateWithdrawRequest(w.id, 'completed');
                                          notify(`"${w.shopName}" কে ${w.amount}৳ পেমেন্ট সফলভাবে পরিশোধ চিহ্নিত করা হয়েছে!`, 'success');
                                        }}
                                        className="bg-[#006437] hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                                      >
                                        পরিশোধ করেছি
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateWithdrawRequest(w.id, 'rejected');
                                          notify(`"${w.shopName}" এর টাকা উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে।`, 'error');
                                        }}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                                      >
                                        বাতিল
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 4: Multi-Vendor Settings */}
              {sellerSubTab === 'settings' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs max-w-xl space-y-5">
                  <h3 className="font-black text-slate-800 text-sm border-b border-stone-100 pb-3">মাল্টি-ভেন্ডর (উদ্যোক্তা) সিস্টেম সেটিংস</h3>
                  
                  <div className="space-y-4">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 block">উদ্যোক্তা (Seller System) চালু রাখুন</span>
                        <span className="text-[10px] text-gray-400 font-bold leading-normal block mt-0.5">নিষ্ক্রিয় থাকলে কাস্টমাররা সেলার হতে পারবেন না এবং সেলার শপ হাইড হয়ে যাবে।</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const val = siteConfig.sellerSystemActive !== false ? false : true;
                          onUpdateSiteConfig({ ...siteConfig, sellerSystemActive: val });
                          notify(val ? 'সেলার সিস্টেম অন করা হয়েছে!' : 'সেলার সিস্টেম অফ করা হয়েছে!', val ? 'success' : 'error');
                        }}
                        className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                          siteConfig.sellerSystemActive !== false ? 'bg-[#006437]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4.5 h-4.5 rounded-full transition-transform shadow-xs ${
                          siteConfig.sellerSystemActive !== false ? 'translate-x-5.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Commission Rate */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">সেলার পেমেন্ট কমিশন হার (%)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={siteConfig.commissionPercentage ?? 10}
                          onChange={(e) => {
                            onUpdateSiteConfig({ ...siteConfig, commissionPercentage: Number(e.target.value) });
                          }}
                          placeholder="যেমন: ১০"
                          className="w-32 px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                        />
                        <span className="text-xs text-gray-400 font-bold">শতকরা এই অংশটুকু প্রতিটি সফল ডেলিভারি থেকে অ্যাডমিন গেটওয়ে ফি হিসেবে কেটে নেওয়া হবে।</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRODUCT REQUEST DETAILS SLIP MODAL OVERLAY */}
          {selectedRequestDetails && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-xl w-full relative flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-1.5 font-sans">
                      🛍️ প্রোডাক্ট রিকুয়েস্ট স্লিপ (ID: {selectedRequestDetails.id})
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">গ্রাহকের স্টক-আউট পণ্য চাহিদার বিবরণী ও স্লিপ</p>
                  </div>
                  <button
                    onClick={() => setSelectedRequestDetails(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Modal Scrollable Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                  
                  {/* Visual Slip block (Looks like a real ticket) */}
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-3xs relative text-left">
                    <div className="absolute -top-3 left-4 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Request Details Slip
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left: Product Info */}
                      <div className="space-y-3">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">অনুরোধকৃত প্রোডাক্ট বিবরণ</span>
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center border border-gray-200 shadow-3xs">
                            <img 
                              src={selectedRequestDetails.productImage} 
                              alt={selectedRequestDetails.productName} 
                              className="max-h-full max-w-full object-contain" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-800 text-sm leading-snug">
                              {selectedRequestDetails.productName}
                            </h4>
                            <p className="text-xs text-[#006437] font-black">
                              পরিমাণ: <span className="text-orange-600 text-sm font-black">{selectedRequestDetails.quantity}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Customer Info */}
                      <div className="space-y-1.5 sm:border-l sm:border-amber-200 sm:pl-4">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">গ্রাহকের যোগাযোগের বিবরণী</span>
                        <p className="text-sm font-extrabold text-slate-800">{selectedRequestDetails.customerName}</p>
                        <p className="text-xs font-mono font-bold text-slate-700">📞 {selectedRequestDetails.customerPhone}</p>
                        <p className="text-xs text-slate-500 leading-normal font-medium">
                          🏠 {selectedRequestDetails.deliveryAddress}
                        </p>
                      </div>
                    </div>

                    {/* Date and Status Bar */}
                    <div className="pt-3 border-t border-dashed border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">অনুরোধের সময়কাল:</span>
                        <span className="font-bold text-gray-600">
                          {new Date(selectedRequestDetails.createdAt).toLocaleString('bn-BD', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block sm:text-right">বর্তমান অবস্থা:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block border mt-0.5 ${
                          selectedRequestDetails.status === 'pending'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : selectedRequestDetails.status === 'contacted'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          {selectedRequestDetails.status === 'pending' ? 'পেন্ডিং' :
                           selectedRequestDetails.status === 'contacted' ? 'যোগাযোগ করা হয়েছে' : 'সম্পন্ন / ডেলিভার্ড'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar Inside Modal */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-left">
                    <p className="text-xs font-bold text-slate-700">অবস্থা পরিবর্তন ও নিয়ন্ত্রণ করুন:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequestDetails.status === 'pending' && (
                        <button
                          onClick={() => {
                            onUpdateProductRequestStatus(selectedRequestDetails.id, 'contacted');
                            setSelectedRequestDetails({ ...selectedRequestDetails, status: 'contacted' });
                            notify('রিকুয়েস্টের অবস্থা "যোগাযোগ করা হয়েছে" এ পরিবর্তন করা হয়েছে।', 'success');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                        >
                          <span>যোগাযোগ করেছি</span>
                        </button>
                      )}
                      {selectedRequestDetails.status !== 'completed' && (
                        <button
                          onClick={() => {
                            onUpdateProductRequestStatus(selectedRequestDetails.id, 'completed');
                            setSelectedRequestDetails({ ...selectedRequestDetails, status: 'completed' });
                            notify('রিকুয়েস্টটি সফলভাবে "সম্পন্ন" চিহ্নিত করা হয়েছে।', 'success');
                          }}
                          className="bg-[#006437] hover:bg-[#004d2a] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                        >
                          <span>সম্পন্ন হয়েছে</span>
                        </button>
                      )}
                      
                      {/* SAFE STATE-BASED DELETE BUTTON (NO BLOCKING CONFIRM) */}
                      <button
                        onClick={() => {
                          setRequestToDelete(selectedRequestDetails);
                          setSelectedRequestDetails(null);
                        }}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ml-auto flex items-center gap-1 border border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>রিকুয়েস্টটি মুছে দিন</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Modal Footer Controls */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-slate-50 rounded-b-3xl text-xs font-bold">
                  <button
                    onClick={() => setSelectedRequestDetails(null)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    onClick={() => {
                      if (selectedRequestDetails) {
                        handlePrint('printable-request-slip', `Request Slip #${selectedRequestDetails.id}`);
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
                  >
                    <span>🖨️ স্লিপটি প্রিন্ট করুন</span>
                  </button>
                </div>
              </div>

              {/* PRINT ELEMENT */}
              <div id="printable-request-slip" className="hidden print:block bg-white p-6 text-black font-sans border-4 border-double border-slate-800 rounded-xl space-y-6 max-w-xl mx-auto text-left">
                {/* Header */}
                <div className="text-center space-y-1 pb-4 border-b-2 border-slate-300 animate-none flex flex-col items-center justify-center">
                  {siteConfig?.storeLogo && (
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 mx-auto mb-1.5 shadow-2xs">
                      <img 
                        src={siteConfig.storeLogo} 
                        alt="Store Logo" 
                        className="w-full h-full object-cover scale-105" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  {siteConfig.storeNameImage ? (
                    <img 
                      src={siteConfig.storeNameImage} 
                      alt={siteConfig.storeName} 
                      className="h-10 object-contain mx-auto" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <h1 className="text-xl font-black text-slate-950">{siteConfig.storeName || "ম্যাংগো লাভার"}</h1>
                      {siteConfig.storeSloganImage ? (
                        <img 
                          src={siteConfig.storeSloganImage} 
                          alt={siteConfig.storeSlogan} 
                          className="h-4 object-contain mx-auto mt-1" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <p className="text-xs font-bold text-slate-600">{siteConfig.storeSlogan || "Pure & Organic Food Shop"}</p>
                      )}
                    </>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">মোবাইল: {siteConfig.contactPhone || "01301-636461"} | ঠিকানা: {siteConfig.contactOffice || "Rajshahi"}</p>
                </div>

                <div className="text-center py-1">
                  <span className="border-2 border-slate-950 px-3 py-1 text-xs font-black uppercase bg-slate-100">স্টক আউট প্রোডাক্ট রিকুয়েস্ট স্লিপ</span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200">
                  <div className="space-y-1">
                    <p><span className="font-bold">স্লিপ আইডি:</span> <strong className="font-sans">#{selectedRequestDetails.id}</strong></p>
                    <p><span className="font-bold">অনুরোধের সময়:</span> <strong>{selectedRequestDetails.createdAt}</strong></p>
                    <p><span className="font-bold">অবস্থা:</span> <strong>{selectedRequestDetails.status === 'pending' ? 'Pending' : selectedRequestDetails.status === 'contacted' ? 'Contacted' : 'Completed'}</strong></p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="font-bold">গ্রাহকের নাম:</span> <strong>{selectedRequestDetails.customerName}</strong></p>
                    <p><span className="font-bold">ফোন নম্বর:</span> <strong>{selectedRequestDetails.customerPhone}</strong></p>
                    <p><span className="font-bold">ডেলিভারি ঠিকানা:</span> <strong>{selectedRequestDetails.deliveryAddress}</strong></p>
                  </div>
                </div>

                {/* Product Requested */}
                <div className="space-y-2 text-xs">
                  <p className="font-black text-slate-800">অনুরোধকৃত প্রোডাক্ট ও বিবরণী:</p>
                  <div className="flex items-center justify-between border-2 border-slate-300 bg-slate-50 p-3 rounded-lg">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-950">{selectedRequestDetails.productName}</h4>
                      <p className="text-slate-500 mt-0.5 font-sans">প্রোডাক্ট আইডি: {selectedRequestDetails.productId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-600">চাহিদার পরিমাণ</p>
                      <p className="text-base font-black text-orange-600">{selectedRequestDetails.quantity}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-8 text-[10px] text-slate-500 italic">
                  "গ্রাহকের চাহিদা অনুযায়ী পণ্যটি স্টকে আসার সাথে সাথে এই স্লিপটি ব্যবহার করে অতিসত্বর যোগাযোগ করুন।"
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs text-slate-800">
                  <div>
                    <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">প্রতিনিধির স্বাক্ষর</div>
                  </div>
                  <div>
                    <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">ম্যানেজার স্বাক্ষর</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

          {/* Selected Payment Detail Overlay Modal */}
          {selectedPaymentOrder && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 p-6 animate-scale-up space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-orange-600 text-base flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    <span>পেমেন্ট বিস্তারিত (ID: {selectedPaymentOrder.id})</span>
                  </h3>
                  <button
                    onClick={() => setSelectedPaymentOrder(null)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-medium">
                  {/* Customer Summary */}
                  <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 border">
                    <p className="font-extrabold text-gray-800 border-b border-gray-200 pb-1 mb-1">গ্রাহকের বিবরণী</p>
                    <p><span className="text-gray-400 font-bold">নাম:</span> <strong className="text-gray-800">{selectedPaymentOrder.customerName}</strong></p>
                    <p><span className="text-gray-400 font-bold">মোবাইল:</span> <strong className="text-gray-800">{selectedPaymentOrder.customerPhone}</strong></p>
                    <p><span className="text-gray-400 font-bold">ঠিকানা:</span> <strong className="text-gray-800">{selectedPaymentOrder.deliveryAddress}, {selectedPaymentOrder.area}, {selectedPaymentOrder.district}</strong></p>
                  </div>

                  {/* Transaction Summary */}
                  <div className="bg-orange-50/50 p-3 rounded-xl space-y-1.5 border border-orange-100">
                    <p className="font-extrabold text-orange-700 border-b border-orange-100 pb-1 mb-1 font-sans">পেমেন্ট ট্রানজেকশন বিবরণী</p>
                    <p><span className="text-gray-500">পদ্ধতি:</span> <span className="font-bold uppercase text-orange-600">{selectedPaymentOrder.paymentMethod}</span></p>
                    {selectedPaymentOrder.bkashNumber && (
                      <p><span className="text-gray-500">টাকা পাঠানো নম্বর:</span> <strong className="text-gray-800 font-mono">{selectedPaymentOrder.bkashNumber}</strong></p>
                    )}
                    {selectedPaymentOrder.trxId && (
                      <p><span className="text-gray-500">TrxID:</span> <strong className="text-slate-800 font-mono bg-white px-1 border rounded">{selectedPaymentOrder.trxId}</strong></p>
                    )}
                    <p><span className="text-gray-500">অর্ডার সময়:</span> <span className="text-gray-600 font-bold">{selectedPaymentOrder.createdAt}</span></p>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-gray-800 border-b border-gray-100 pb-1">পণ্যের বিবরণী</p>
                    <div className="max-h-28 overflow-y-auto divide-y divide-gray-50 space-y-1">
                      {selectedPaymentOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 py-1">
                          <img src={item.image} alt="" className="w-8 h-8 rounded-md object-cover border" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{item.productName}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{item.quantity} x ৳{item.price} ({item.unit})</p>
                          </div>
                          <p className="font-bold text-gray-800">৳{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price summary */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col items-end space-y-1">
                    <p className="text-gray-400 text-[10px] font-bold">ডেলিভারি চার্জ: ৳{selectedPaymentOrder.shippingCharge}</p>
                    <p className="text-gray-900 font-extrabold text-sm font-sans">সর্বমোট পরিশোধিত: ৳{selectedPaymentOrder.totalAmount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preset Image Selection Modal */}
          {imageSelectorTarget !== null && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fade-in">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-scale-up">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                  <p className="text-gray-800 font-extrabold text-sm flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-orange-500" />
                    <span>গ্যালারি থেকে ছবি সেট করুন</span>
                  </p>
                  <button
                    onClick={() => setImageSelectorTarget(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 flex-grow bg-gray-50">
              {PRESET_IMAGES.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const path = img.path;
                    if (imageSelectorTarget === 'product') {
                      setPImage(path);
                    } else if (imageSelectorTarget === 'product-edit') {
                      setEditImage(path);
                    } else if (imageSelectorTarget === 'logo') {
                      setCfgStoreLogo(path);
                    } else if (imageSelectorTarget === 'storeNameImage') {
                      setCfgStoreNameImage(path);
                    } else if (imageSelectorTarget === 'storeSloganImage') {
                      setCfgStoreSloganImage(path);
                    } else if (imageSelectorTarget === 'leftBanner') {
                      setCfgLeftImage(path);
                    } else if (imageSelectorTarget === 'rightBanner') {
                      setCfgRightImage(path);
                    } else if (imageSelectorTarget === 'aboutOwner') {
                      setCfgAboutOwnerImage(path);
                    } else if (imageSelectorTarget === 'promo') {
                      setCfgPromoImage(path);
                    } else if (imageSelectorTarget.startsWith('category-')) {
                      const slug = imageSelectorTarget.replace('category-', '');
                      setCfgCategoryImages({
                        ...cfgCategoryImages,
                        [slug]: path,
                      });
                    } else if (imageSelectorTarget.startsWith('catbanner-')) {
                      const slug = imageSelectorTarget.replace('catbanner-', '');
                      setCfgCategoryBanners({
                        ...cfgCategoryBanners,
                        [slug]: path,
                      });
                    } else if (imageSelectorTarget.startsWith('product-edit-slot-')) {
                      const idx = parseInt(imageSelectorTarget.replace('product-edit-slot-', ''), 10);
                      const newImgs = [...editImages];
                      newImgs[idx] = path;
                      setEditImages(newImgs);
                    } else if (imageSelectorTarget.startsWith('product-add-slot-')) {
                      const idx = parseInt(imageSelectorTarget.replace('product-add-slot-', ''), 10);
                      const newImgs = [...pImages];
                      newImgs[idx] = path;
                      setPImages(newImgs);
                    } else if (imageSelectorTarget.startsWith('product-slot-')) {
                      const idx = parseInt(imageSelectorTarget.replace('product-slot-', ''), 10);
                      const newImgs = [...pImages];
                      newImgs[idx] = path;
                      setPImages(newImgs);
                    } else if (imageSelectorTarget.startsWith('add-')) {
                      const idx = parseInt(imageSelectorTarget.replace('add-', ''), 10);
                      const newImgs = [...pImages];
                      newImgs[idx] = path;
                      setPImages(newImgs);
                    }
                    setImageSelectorTarget(null);
                  }}
                  className="bg-white rounded-2xl p-2 border border-gray-200 shadow-3xs hover:border-orange-400 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative mb-2">
                    <img
                      src={img.path}
                      alt={img.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h5 className="text-[10px] font-black text-slate-800 text-center truncate px-1">
                    {img.name}
                  </h5>
                  <p className="text-[8px] text-gray-400 font-mono text-center truncate mt-0.5">
                    {img.path.split('/').pop()}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setImageSelectorTarget(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Edit Product Modal (Popup Window exactly like Image 2) */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-extrabold text-gray-800 text-sm md:text-base">পণ্য এডিট করুন</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row 1: পণ্যের নাম & SKU / কোড */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="block text-xs font-bold text-gray-500 mb-1">পণ্যের নাম</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium focus:border-red-700 bg-white"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1">SKU / কোড</label>
                  <input
                    type="text"
                    value={editSKU}
                    onChange={(e) => setEditSKU(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium focus:border-red-700 bg-white"
                  />
                </div>
              </div>

              {/* Row 2: ক্যাটাগরি, ইউনিট, স্ট্যাটাস & ব্যাজ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ক্যাটাগরি</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-red-700"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cfgCategoryNames[cat.slug] || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ইউনিট</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white focus:border-red-700"
                  >
                    <option value="পিস">পিস (Pcs)</option>
                    <option value="বক্স">বক্স (Box)</option>
                    <option value="প্যাক">প্যাক (Pack)</option>
                    <option value="লিটার">লিটার (Liter)</option>
                    <option value="কেজি">কেজি (Kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">স্ট্যাটাস</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-red-700"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ব্যাজ / স্টিকার (Badge)</label>
                  <select
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value as 'none' | 'new' | 'restocked')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-red-700"
                  >
                    <option value="none">কোনোটিই নয় (None)</option>
                    <option value="new">নতুন (New)</option>
                    <option value="restocked">রিস্টক (Restocked)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: ক্রয় মূল্য, বিক্রয় মূল্য & পূর্বের মূল্য */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPurchasePrice}
                    onChange={(e) => setEditPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium focus:border-red-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium focus:border-red-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">পূর্বের মূল্য (৳)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="যেমন: ১০০০"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium focus:border-red-700 bg-white"
                  />
                </div>
              </div>

              {/* ক্রয় ও বিক্রয় মূল্যের স্পষ্টীকরণ নোট */}
              <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2.5 text-[11px] text-amber-800 font-medium leading-relaxed">
                💡 <strong>একক মূল্য নোট:</strong> এখানে দেয়া ক্রয় ও বিক্রয় মূল্যটি প্রতি <strong>১ {editUnit || 'একক'}</strong> এর জন্য প্রযোজ্য। গ্রাহক কার্টে বেশি পরিমাণ অর্ডার করলে এই মূল্য দিয়েই গুণ করে সর্বমোট মূল্য হিসাব করা হবে এবং হোয়াটসঅ্যাপ মেসেজেও সঠিক হিসাব চলে যাবে।
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">বর্তমান স্টক</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium focus:border-red-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">রিঅর্ডার লেভেল</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editReorderLevel}
                    onChange={(e) => setEditReorderLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium focus:border-red-700 bg-white"
                  />
                </div>
              </div>

              {/* ওজন/সাইজ ভিত্তিক মূল্য নির্ধারণ (Size-wise pricing) */}
              <div className="pt-4 border-t border-gray-100 space-y-4 bg-red-50/60 p-4 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-extrabold text-red-950">⚖️ ওজন/সাইজ ভিত্তিক ভিন্ন মূল্য?</span>
                  <input
                    type="checkbox"
                    checked={editHasMultipleSizes}
                    onChange={(e) => setEditHasMultipleSizes(e.target.checked)}
                    className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 cursor-pointer"
                  />
                </div>
                
                {editHasMultipleSizes && (
                  <div className="space-y-3.5">
                    <span className="block text-xs text-red-800 font-semibold leading-normal">
                      এখানে আপনি এই পণ্যের বিভিন্ন ওজনের (যেমন: 0.5 KG, 1 KG) জন্য আলাদা বিক্রয় মূল্য ও পূর্বের মূল্য সেট করতে পারেন।
                    </span>
                    
                    {/* Sizes List */}
                    {editSizesList.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {editSizesList.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-red-100 text-xs font-bold text-gray-700 shadow-xs">
                            <span className="font-extrabold text-red-800 bg-red-50 px-2.5 py-1 rounded-lg shrink-0 text-xs">{item.size}</span>
                            <div className="flex items-center gap-2.5 ml-auto">
                              <span className="text-gray-900 font-bold">বিক্রয়: ৳{item.price}</span>
                              {item.originalPrice ? (
                                <span className="text-red-500 line-through text-[11px]">পূর্বের: ৳{item.originalPrice}</span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setEditSizesList(editSizesList.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 p-1 ml-1.5 font-bold text-sm"
                                title="মুছে ফেলুন"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Size-Price Form */}
                    <div className="bg-white p-3.5 rounded-xl border border-red-200 space-y-3 shadow-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">ওজন/সাইজ</label>
                          <input
                            type="text"
                            id="edit-size-name"
                            placeholder="যেমন: 1 KG"
                            className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">বিক্রয় মূল্য (৳)</label>
                          <input
                            type="number"
                            id="edit-size-price"
                            placeholder="যেমন: ৯৫০"
                            className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">আগের মূল্য (৳)</label>
                          <input
                            type="number"
                            id="edit-size-orig-price"
                            placeholder="যেমন: ১২০০"
                            className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sizeInp = document.getElementById('edit-size-name') as HTMLInputElement;
                          const priceInp = document.getElementById('edit-size-price') as HTMLInputElement;
                          const origInp = document.getElementById('edit-size-orig-price') as HTMLInputElement;
                          
                          const sizeVal = sizeInp?.value?.trim();
                          const priceVal = Number(priceInp?.value);
                          const origVal = origInp?.value ? Number(origInp.value) : undefined;
                          
                          if (!sizeVal || !priceVal || priceVal <= 0) {
                            notify('ওজন এবং বিক্রয় মূল্য সঠিকভাবে লিখুন!', 'error');
                            return;
                          }
                          
                          if (editSizesList.some(item => item.size.toLowerCase() === sizeVal.toLowerCase())) {
                            notify('এই ওজনটি ইতিমধ্যে যোগ করা হয়েছে!', 'error');
                            return;
                          }
                          
                          setEditSizesList([...editSizesList, { size: sizeVal, price: priceVal, originalPrice: origVal }]);
                          
                          // Clear inputs
                          if (sizeInp) sizeInp.value = '';
                          if (priceInp) priceInp.value = '';
                          if (origInp) origInp.value = '';
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold py-2 px-3 rounded-lg text-xs md:text-sm transition-all shadow-xs cursor-pointer"
                      >
                        + এই ওজন ও দাম যোগ করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Description (Full Width) */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 mb-1">বিস্তারিত বিবরণী</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white"
                />
              </div>

              {/* tab options custom info */}
              <div className="pt-3 border-t border-gray-100 space-y-3 bg-slate-50 p-3.5 rounded-xl border border-gray-200">
                <span className="block text-xs font-bold text-gray-700">📄 বিস্তারিত তথ্য এডিট (Tabs Customization - Description & Additional Info)</span>
                
                {/* Tagline */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">ছোট ট্যাগলাইন (Tagline)</label>
                  <input
                    type="text"
                    placeholder="যেমন: শতভাগ নিরাপদ ও সুস্বাদু আমাদের নিজস্ব বাগানের আম..."
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-700 font-medium bg-white"
                  />
                </div>

                {/* Detailed Description Title */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">বিস্তারিত ডেসক্রিপশন টাইটেল (Detailed Title)</label>
                  <input
                    type="text"
                    placeholder="যেমন: রাজশাহীর খাঁটি আম (Premium Quality Himsagar)"
                    value={editDetailedTitle}
                    onChange={(e) => setEditDetailedTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-700 font-medium bg-white"
                  />
                </div>

                {/* Bullets */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">কেন আমাদের পণ্যই সেরা? (প্রতি লাইনে একটি করে বুলেট পয়েন্ট লিখুন)</label>
                  <textarea
                    placeholder="যেমন:&#10;শতভাগ খাঁটি ও প্রাকৃতিক উপাদান&#10;কোনো ভেজাল বা প্রিজারভেটিভ নেই"
                    value={editDescriptionBullets}
                    onChange={(e) => setEditDescriptionBullets(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-700 font-medium bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Manufacturer */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">প্রস্তুতকারক (Manufacturer)</label>
                    <input
                      type="text"
                      placeholder="ম্যাংগো লাভার (MangoLover)"
                      value={editManufacturer}
                      onChange={(e) => setEditManufacturer(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-700 font-medium bg-white"
                    />
                  </div>

                  {/* Source Area */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">উৎস অঞ্চল (Source Area)</label>
                    <input
                      type="text"
                      placeholder="রাজশাহী, বাংলাদেশ"
                      value={editSourceArea}
                      onChange={(e) => setEditSourceArea(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-700 font-medium bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Shelf Life */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">শেল্ফ লাইফ (Shelf Life)</label>
                    <input
                      type="text"
                      placeholder="১২ মাস"
                      value={editShelfLife}
                      onChange={(e) => setEditShelfLife(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-700 font-medium bg-white"
                    />
                  </div>

                  {/* Organic Certificate */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">সার্টিফিকেট (Organic Cert.)</label>
                    <input
                      type="text"
                      placeholder="১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত"
                      value={editOrganicCertificate}
                      onChange={(e) => setEditOrganicCertificate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-red-700 font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5-Slot Image Upload & Gallery Grid (Full Width) */}
              <div className="pt-2 border-t border-gray-100 bg-gray-50/50 p-2.5 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="block text-[11px] font-bold text-gray-700">পণ্যের ছবিসমূহ (সর্বোচ্চ ৫টি)</span>
                  <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">৪০০×৪০০ px (ঐচ্ছিক)</span>
                </div>
                
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const imgUrl = editImages[index];
                    const isPrimary = index === 0;
                    const isHover = index === 1;
                    
                    return (
                      <div 
                        key={index} 
                        className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative overflow-hidden transition-all bg-white ${
                          imgUrl 
                            ? 'border-gray-200' 
                            : isPrimary
                              ? 'border-dashed border-emerald-300 hover:border-emerald-500'
                              : isHover
                                ? 'border-dashed border-orange-300 hover:border-orange-500'
                                : 'border-dashed border-gray-300 hover:border-gray-400'
                        }`}
                        title={isPrimary ? 'প্রধান ছবি (Primary)' : isHover ? '২নং ছবি (হোভার ইফেক্ট)' : `ছবি ${index + 1}`}
                      >
                        {imgUrl ? (
                          <div className="w-full h-full relative group/img">
                            <img 
                              src={imgUrl} 
                              alt={`Edit Product ${index + 1}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute top-0.5 left-0.5 px-1 py-0.2 rounded-md text-[7px] font-black tracking-tighter text-white select-none ${
                              isPrimary ? 'bg-emerald-600' : isHover ? 'bg-orange-500' : 'bg-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newImgs = [...editImages];
                                newImgs[index] = '';
                                setEditImages(newImgs);
                              }}
                              className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-all cursor-pointer shadow-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full p-0.5 gap-1 bg-white">
                            <span className={`text-[7px] font-black select-none px-1 rounded-xs ${
                              isPrimary ? 'bg-emerald-50 text-emerald-700 font-extrabold' : isHover ? 'bg-orange-50 text-orange-700 font-extrabold' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isPrimary ? 'প্রধান' : isHover ? 'হোভার' : `${index + 1}নং`}
                            </span>
                            
                            <div className="flex gap-0.5">
                              <button
                                type="button"
                                onClick={() => document.getElementById(`edit-file-input-${index}`)?.click()}
                                className="p-0.5 hover:bg-emerald-50 rounded text-emerald-600 transition-colors cursor-pointer"
                                title="কম্পিউটার থেকে আপলোড"
                              >
                                <Upload className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageSelectorTarget(`product-edit-slot-${index}`)}
                                className="p-0.5 hover:bg-orange-50 rounded text-orange-500 transition-colors cursor-pointer"
                                title="গ্যালারি থেকে সিলেক্ট"
                              >
                                <ImageIcon className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <input
                              type="file"
                              id={`edit-file-input-${index}`}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    const newImgs = [...editImages];
                                    newImgs[index] = base64;
                                    setEditImages(newImgs);
                                  });
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[8px] text-gray-400 font-bold mt-1.5 text-center leading-normal">
                  * ২নং ছবি হোভার করলে জুম হয়ে দেখাবে। লিংক ছাড়া শুধু আপলোড/গ্যালারি ব্যবহার করুন।
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-slate-50/50">
              <h3 className="font-extrabold text-emerald-800 text-sm md:text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span>নতুন আইটেম যোগ করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row 1: আইটেম নাম & ক্যাটাগরি */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="block text-xs font-bold text-gray-700 mb-1">আইটেম নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: সুন্দরবনের খলিশা ফুলের মধু"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">ক্যাটাগরি *</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-emerald-600"
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cfgCategoryNames[cat.slug] || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: SKU & পরিমাণ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">SKU / কোড</label>
                  <input
                    type="text"
                    placeholder="যেমন: HONEY-1KG"
                    value={pSKU}
                    onChange={(e) => setPSKU(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">কেনার পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="যেমন: ২৫"
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                  />
                </div>
              </div>

              {/* Row 3: পরিমাণ একক (Unit) & রিঅর্ডার লেভেল */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ইউনিট *</label>
                  <select
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-emerald-600"
                  >
                    <option value="পিস">পিস (Pcs)</option>
                    <option value="কেজি">কেজি (KG)</option>
                    <option value="গ্রাম">গ্রাম (Gram)</option>
                    <option value="লিটার">লিটার (Liter)</option>
                    <option value="প্যাক">প্যাক (Pack)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">রিঅর্ডার লেভেল</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pReorderLevel}
                    onChange={(e) => setPReorderLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                  />
                </div>
              </div>

              {/* Row 4: মূল্যের হিসাব: ক্রয় মূল্য, বিক্রয় মূল্য, পূর্বের মূল্য */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="যেমন: ৮০০"
                    value={pPurchasePrice}
                    onChange={(e) => setPPurchasePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="যেমন: ৯৫০"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">পূর্বের মূল্য (৳)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="যেমন: ১০০০"
                    value={pOriginalPrice}
                    onChange={(e) => setPOriginalPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                  />
                </div>
              </div>

              {/* ক্রয় ও বিক্রয় মূল্যের স্পষ্টীকরণ নোট */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-[11px] text-emerald-800 font-medium leading-relaxed">
                💡 <strong>একক মূল্য নোট:</strong> এখানে দেয়া ক্রয় ও বিক্রয় মূল্যটি প্রতি <strong>১ {pUnit || 'একক'}</strong> এর জন্য প্রযোজ্য। গ্রাহক কার্টে বা ডিরেক্ট অর্ডারে বেশি পরিমাণ পছন্দ করলে এই মূল্য দিয়েই গুণ করে সর্বমোট মূল্য হিসাব করা হবে এবং হোয়াটসঅ্যাপ মেসেজেও সঠিক হিসাব চলে যাবে।
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">স্ট্যাটাস</label>
                  <select
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-emerald-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ব্যাজ / স্টিকার (Badge)</label>
                  <select
                    value={pBadge}
                    onChange={(e) => setPBadge(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-emerald-600"
                  >
                    <option value="none">কোনোটিই নয় (None)</option>
                    <option value="new">নতুন (New)</option>
                    <option value="restocked">স্টক এসেছে (Restocked)</option>
                  </select>
                </div>
              </div>

              {/* Detailed Customization Tab Info Container */}
              <div className="pt-2 border-t border-gray-150">
                <p className="text-[11px] text-gray-500 font-extrabold flex items-center gap-1 mb-2">
                  <span>📝 বিস্তারিত তথ্য (Tabs Customization - Description & Additional Info)</span>
                </p>

                <div className="space-y-3 p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">ছোট ট্যাগলাইন (Tagline)</label>
                    <input
                      type="text"
                      placeholder="যেমন: শতভাগ নিরাপদ ও সুস্বাদু আমাদের নিজস্ব বাগানের আম"
                      value={pTagline}
                      onChange={(e) => setPTagline(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1"> can-ডেসক্রিপশন টাইটেল (Detailed Title)</label>
                    <input
                      type="text"
                      placeholder="যেমন: রাজশাহীর খাঁটি আম (Premium Quality Himsagar)"
                      value={pDetailedTitle}
                      onChange={(e) => setPDetailedTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">কেন আমাদের পণ্যই সেরা? (প্রতি লাইনে একটি করে বুলেট পয়েন্ট লিখুন)</label>
                    <textarea
                      rows={3}
                      placeholder="যেমন:&#10;শতভাগ খাঁটি ও প্রাকৃতিক উপাদান&#10;কোনো ভেজাল বা প্রিজারভেটিভ নেই"
                      value={pDescriptionBullets}
                      onChange={(e) => setPDescriptionBullets(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-800 font-sans leading-relaxed resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 mb-1">প্রস্তুতকারক (Manufacturer)</label>
                      <input
                        type="text"
                        value={pManufacturer}
                        onChange={(e) => setPManufacturer(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 mb-1">উৎস অঞ্চল (Source Area)</label>
                      <input
                        type="text"
                        value={pSourceArea}
                        onChange={(e) => setPSourceArea(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 mb-1">মেয়াদকাল / Shelf Life</label>
                      <input
                        type="text"
                        value={pShelfLife}
                        onChange={(e) => setPShelfLife(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 mb-1">অর্গানিক সার্টিফিকেট</label>
                      <input
                        type="text"
                        value={pOrganicCertificate}
                        onChange={(e) => setPOrganicCertificate(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ওজন/সাইজ ভিত্তিক মূল্য নির্ধারণ (Size-wise pricing) */}
              <div className="pt-4 border-t border-gray-100 space-y-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-extrabold text-emerald-950">⚖️ ওজন/সাইজ ভিত্তিক ভিন্ন মূল্য?</span>
                  <input
                    type="checkbox"
                    checked={pHasMultipleSizes}
                    onChange={(e) => setPHasMultipleSizes(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                
                {pHasMultipleSizes && (
                  <div className="space-y-3.5">
                    <span className="block text-xs text-emerald-800 font-semibold leading-normal">
                      এখানে আপনি পণ্যের বিভিন্ন ওজনের (যেমন: 0.5 KG, 1 KG) জন্য আলাদা বিক্রয় মূল্য ও পূর্বের মূল্য সেট করতে পারেন।
                    </span>
                    
                    {/* Sizes List view */}
                    {pSizesList.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {pSizesList.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 text-xs font-bold text-gray-700 shadow-xs">
                            <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0 text-xs">{item.size}</span>
                            <div className="flex items-center gap-2.5 ml-auto">
                              <span className="text-gray-900 font-bold">বিক্রয়: ৳{item.price}</span>
                              {item.originalPrice ? (
                                <span className="text-red-500 line-through text-[11px]">পূর্বের: ৳{item.originalPrice}</span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setPSizesList(pSizesList.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 p-1 ml-1.5 font-bold text-sm cursor-pointer"
                                title="মুছে ফেলুন"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Size-Price Form */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 shadow-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">ওজন/সাইজ</label>
                          <input
                            type="text"
                            id="add-size-name-modal"
                            placeholder="যেমন: 1 KG"
                            className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">বিক্রয় মূল্য (৳)</label>
                          <input
                            type="number"
                            id="add-size-price-modal"
                            placeholder="যেমন: ৯৫০"
                            className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">আগের মূল্য (৳)</label>
                          <input
                            type="number"
                            id="add-size-orig-price-modal"
                            placeholder="যেমন: ১০০০"
                            className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sizeInp = document.getElementById('add-size-name-modal') as HTMLInputElement;
                          const priceInp = document.getElementById('add-size-price-modal') as HTMLInputElement;
                          const origInp = document.getElementById('add-size-orig-price-modal') as HTMLInputElement;
                          const sVal = sizeInp?.value.trim();
                          const pVal = priceInp?.value.trim();
                          const oVal = origInp?.value.trim();
                          if (!sVal || !pVal || Number(pVal) <= 0) {
                            notify('সাইজের নাম ও সঠিক বিক্রয় মূল্য দিতে হবে!', 'error');
                            return;
                          }
                          const item: SizePriceItem = {
                            size: sVal,
                            price: Number(pVal),
                            originalPrice: oVal ? Number(oVal) : undefined
                          };
                          setPSizesList([...pSizesList, item]);
                          if (sizeInp) sizeInp.value = '';
                          if (priceInp) priceInp.value = '';
                          if (origInp) origInp.value = '';
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-2 px-3 rounded-lg text-xs md:text-sm transition-all shadow-xs cursor-pointer"
                      >
                        + এই ওজন ও দাম যোগ করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ৫টি প্রোডাক্ট ইমেজ লিংক আপলোড */}
              <div className="pt-2 border-t border-gray-150 space-y-2">
                <label className="block text-[11px] font-extrabold text-gray-700">🖼️ প্রোডাক্ট ইমেজ আপলোড (৫টি ছবি যুক্ত করার সুযোগ)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {pImages.map((imgUrl, imgIdx) => {
                    const hasImg = !!imgUrl;
                    const isPrimary = imgIdx === 0;
                    const isHover = imgIdx === 1;

                    return (
                      <div 
                        key={imgIdx} 
                        className={`aspect-square rounded-xl overflow-hidden bg-slate-50 border flex flex-col items-center justify-center relative transition-all ${
                          hasImg 
                            ? 'border-gray-200' 
                            : isPrimary
                              ? 'border-dashed border-emerald-300 hover:border-emerald-500'
                              : isHover
                                ? 'border-dashed border-orange-300 hover:border-orange-500'
                                : 'border-dashed border-gray-300 hover:border-gray-400'
                        }`}
                        title={isPrimary ? 'প্রধান ছবি (Primary)' : isHover ? '২নং ছবি (হোভার ইফেক্ট)' : `ছবি ${imgIdx + 1}`}
                      >
                        {hasImg ? (
                          <div className="w-full h-full relative group/img">
                            <img referrerPolicy="no-referrer" src={imgUrl} alt={`Product ${imgIdx + 1}`} className="w-full h-full object-cover" />
                            <span className={`absolute top-0.5 left-0.5 px-1 py-0.2 rounded-md text-[7px] font-black tracking-tighter text-white select-none ${
                              isPrimary ? 'bg-emerald-600' : isHover ? 'bg-orange-500' : 'bg-gray-600'
                            }`}>
                              {imgIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...pImages];
                                updated[imgIdx] = '';
                                setPImages(updated);
                              }}
                              className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold cursor-pointer transition-all shadow-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full p-0.5 gap-1 bg-white">
                            <span className={`text-[7px] font-black select-none px-1 rounded-xs ${
                              isPrimary ? 'bg-emerald-50 text-emerald-700 font-extrabold' : isHover ? 'bg-orange-50 text-orange-700 font-extrabold' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isPrimary ? 'প্রধান' : isHover ? 'হোভার' : `${imgIdx + 1}নং`}
                            </span>
                            
                            <div className="flex gap-0.5">
                              <button
                                type="button"
                                onClick={() => document.getElementById(`add-file-input-modal-${imgIdx}`)?.click()}
                                className="p-0.5 hover:bg-emerald-50 rounded text-emerald-600 transition-colors cursor-pointer"
                                title="কম্পিউটার থেকে আপলোড"
                              >
                                <Upload className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageSelectorTarget(`product-add-slot-${imgIdx}`)}
                                className="p-0.5 hover:bg-orange-50 rounded text-orange-500 transition-colors cursor-pointer"
                                title="গ্যালারি থেকে সিলেক্ট"
                              >
                                <ImageIcon className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <input
                              type="file"
                              id={`add-file-input-modal-${imgIdx}`}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    const updated = [...pImages];
                                    updated[imgIdx] = base64;
                                    setPImages(updated);
                                  });
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[8px] text-gray-400 font-bold mt-1.5 text-center leading-normal">
                  * ২নং ছবি হোভার করলে জুম হয়ে দেখাবে। লিংক ছাড়া শুধু আপলোড/গ্যালারি ব্যবহার করুন।
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  + Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Order/Memo Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-50 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-gray-900 text-sm md:text-base">মেমো/অর্ডারটি ডিলিট করতে চান?</h3>
              <p className="text-xs text-gray-500 leading-normal font-medium font-sans">
                আপনি কি নিশ্চিতভাবে <strong className="text-gray-800 font-bold">ID: {orderToDelete.id}</strong> (গ্রাহক: {orderToDelete.customerName}) মেমোটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder) {
                    onDeleteOrder(orderToDelete.id);
                  }
                  setOrderToDelete(null);
                  if (selectedOrderDetails?.id === orderToDelete.id) {
                    setSelectedOrderDetails(null);
                  }
                  if (onNotify) {
                    onNotify('সফলভাবে মেমোটি ডিলিট করা হয়েছে।', 'success');
                  }
                }}
                className="flex-1 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-50 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-gray-900 text-sm md:text-base">পণ্যটি ডিলিট করতে চান?</h3>
              <p className="text-xs text-gray-500 leading-normal font-medium">
                আপনি কি নিশ্চিতভাবে <strong className="text-gray-800 font-bold">"{productToDelete.name}"</strong> প্রোডাক্টটি আপনার তালিকা থেকে মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                  notify('সফলভাবে পণ্যটি ডিলিট করা হয়েছে।', 'success');
                }}
                className="flex-1 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Category Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-50 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-gray-900 text-sm md:text-base">ক্যাটাগরি ডিলিট করতে চান?</h3>
              <p className="text-xs text-gray-500 leading-normal font-medium">
                আপনি কি নিশ্চিতভাবে <strong className="text-gray-800 font-bold">"{cfgCategoryNames[categoryToDelete.slug] || categoryToDelete.name}"</strong> ক্যাটাগরি মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = categories.filter(c => c.id !== categoryToDelete.id);
                  onUpdateCategories(updated);
                  setCategoryToDelete(null);
                  notify('ক্যাটাগরি মুছে ফেলা হয়েছে!', 'info');
                }}
                className="flex-1 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Request Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-50 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-gray-900 text-sm md:text-base">অনুরোধটি ডিলিট করতে চান?</h3>
              <p className="text-xs text-gray-500 leading-normal font-medium">
                আপনি কি নিশ্চিতভাবে ক্রেতা <strong className="text-gray-800 font-bold">"{requestToDelete.customerName}"</strong>-এর প্রোডাক্ট রিকুয়েস্টটি মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProductRequest(requestToDelete.id);
                  setRequestToDelete(null);
                  notify('রিকুয়েস্টটি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
                }}
                className="flex-1 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Product Approval Modal */}
      <AnimatePresence>
        {viewingSellerProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4 font-sans text-xs text-slate-700 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-black text-slate-800">📦 উদ্যোক্তার পণ্যের বিস্তারিত বিবরণ</h3>
                <button
                  type="button"
                  onClick={() => setViewingSellerProduct(null)}
                  className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <img src={viewingSellerProduct.image} alt={viewingSellerProduct.name} className="w-32 h-32 rounded-2xl object-cover border shrink-0 mx-auto sm:mx-0" />
                <div className="space-y-1 flex-1">
                  <span className="inline-block bg-emerald-50 text-[#006437] font-extrabold px-2 py-0.5 rounded text-[10px]">{viewingSellerProduct.category}</span>
                  <h4 className="text-base font-black text-slate-900 leading-tight">{viewingSellerProduct.name}</h4>
                  {viewingSellerProduct.detailedTitle && (
                    <p className="text-slate-500 font-bold leading-normal">{viewingSellerProduct.detailedTitle}</p>
                  )}
                  {viewingSellerProduct.tagline && (
                    <p className="text-[#006437] font-extrabold text-[11px] italic">"{viewingSellerProduct.tagline}"</p>
                  )}
                  <div className="text-slate-400 font-bold text-[10px] pt-1">
                    <span>দোকান: </span><span className="text-[#006437]">{viewingSellerProduct.sellerName || 'অজানা'}</span> (ID: {viewingSellerProduct.sellerId})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl border font-bold">
                <div>
                  <span className="block text-slate-400 text-[10px]">বিক্রয় মূল্য</span>
                  <span className="text-slate-900 text-sm font-black">{viewingSellerProduct.price}৳ / {viewingSellerProduct.unit}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px]">পূর্বের মূল্য</span>
                  <span className="text-slate-500 text-sm font-black">{viewingSellerProduct.originalPrice ? `${viewingSellerProduct.originalPrice}৳` : 'নাই'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px]">ক্রয় মূল্য / খরচ</span>
                  <span className="text-slate-900 text-sm font-black">{viewingSellerProduct.purchasePrice ? `${viewingSellerProduct.purchasePrice}৳` : 'নাই'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px]">স্টক পরিমাণ</span>
                  <span className="text-slate-950 text-sm font-black">{viewingSellerProduct.stock} {viewingSellerProduct.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-bold">
                <div className="space-y-1.5">
                  <div><span className="text-slate-400">SKU/কোড:</span> <span className="text-slate-800">{viewingSellerProduct.sku || 'নাই'}</span></div>
                  <div><span className="text-slate-400">রিঅর্ডার লেভেল:</span> <span className="text-slate-800">{viewingSellerProduct.reorderLevel ?? 1}</span></div>
                  <div><span className="text-slate-400">প্রস্তুতকারক:</span> <span className="text-slate-800">{viewingSellerProduct.manufacturer || 'নাই'}</span></div>
                </div>
                <div className="space-y-1.5">
                  <div><span className="text-slate-400">উৎস অঞ্চল:</span> <span className="text-slate-800">{viewingSellerProduct.sourceArea || 'নাই'}</span></div>
                  <div><span className="text-slate-400">মেয়াদকাল:</span> <span className="text-slate-800">{viewingSellerProduct.shelfLife || 'নাই'}</span></div>
                  <div><span className="text-slate-400">সার্টিফিকেট:</span> <span className="text-slate-800">{viewingSellerProduct.organicCertificate || 'নাই'}</span></div>
                </div>
              </div>

              {/* Sizes / Price variations */}
              {viewingSellerProduct.sizes && viewingSellerProduct.sizes.length > 0 && (
                <div className="space-y-1.5 bg-emerald-50/30 p-3.5 rounded-xl border border-emerald-100 font-bold">
                  <span className="text-xs font-black text-[#006437]">⚖️ ওজন/সাইজ ভিত্তিক মূল্য তালিকা:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {viewingSellerProduct.sizes.map((sz, i) => {
                      const priceInfo = viewingSellerProduct.sizePrices?.[sz];
                      return (
                        <div key={i} className="bg-white px-2.5 py-1.5 rounded-lg border flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-[#006437]">{sz}</span>
                          <div className="flex gap-2">
                            <span>বিক্রয়: ৳{priceInfo?.price ?? viewingSellerProduct.price}</span>
                            {priceInfo?.originalPrice && <span className="line-through text-red-500">৳{priceInfo.originalPrice}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description bullets */}
              {viewingSellerProduct.descriptionBullets && viewingSellerProduct.descriptionBullets.length > 0 && (
                <div className="space-y-1.5 font-bold">
                  <span className="text-slate-800 font-black">🌟 কেন আমাদের পণ্যই সেরা:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1.5">
                    {viewingSellerProduct.descriptionBullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1.5 font-bold">
                <span className="text-slate-800 font-black">📝 বিস্তারিত বিবরণ:</span>
                <p className="text-slate-600 bg-stone-50 p-3 rounded-xl border leading-relaxed whitespace-pre-line">{viewingSellerProduct.description || 'কোনো বিবরণ নেই।'}</p>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <span className="font-black text-slate-500">স্ট্যাটাস: 
                  {viewingSellerProduct.sellerProductStatus === 'approved' ? (
                    <span className="ml-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">অনুমোদিত</span>
                  ) : viewingSellerProduct.sellerProductStatus === 'rejected' ? (
                    <span className="ml-1.5 text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">বাতিলকৃত</span>
                  ) : (
                    <span className="ml-1.5 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">অনুমোদন অপেক্ষমাণ</span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingSellerProduct(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                  {viewingSellerProduct.sellerProductStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Product = { ...viewingSellerProduct, sellerProductStatus: 'rejected' };
                        onEditProduct(updated);
                        notify(`"${viewingSellerProduct.name}" পণ্যটি বাতিল করা হয়েছে।`, 'error');
                        setViewingSellerProduct(null);
                      }}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold rounded-xl transition-colors cursor-pointer"
                    >
                      বাতিল করুন
                    </button>
                  )}
                  {viewingSellerProduct.sellerProductStatus !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Product = { ...viewingSellerProduct, sellerProductStatus: 'approved' };
                        onEditProduct(updated);
                        notify(`"${viewingSellerProduct.name}" পণ্যটি সফলভাবে অনুমোদন করা হয়েছে!`, 'success');
                        setViewingSellerProduct(null);
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-colors cursor-pointer"
                    >
                      অনুমোদন দিন
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FaqSectionProps {
  siteConfig: SiteConfig;
}

export function FaqSection({ siteConfig }: FaqSectionProps) {
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Fallback default FAQs if siteConfig doesn't have any configured yet
  const faqs = siteConfig?.faqItems || [
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
  ];

  // Filter FAQs based on search input
  const filteredFaqs = faqs.filter(faq => 
    faq && (
      (faq.question || '').toLowerCase().includes((faqSearchQuery || '').toLowerCase()) || 
      (faq.answer || '').toLowerCase().includes((faqSearchQuery || '').toLowerCase())
    )
  );

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

return (
  <div className="space-y-6">
    {/* FAQ Accordion */}
    <div className="bg-white border border-gray-100 rounded-3xl p-4 md:p-8 shadow-xs max-w-3xl mx-auto space-y-3">
      {faqs.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-400 font-bold">
            কোনো প্রশ্ন বা উত্তর পাওয়া যায়নি!
          </p>
        </div>
      ) : (
        faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className={`border rounded-2xl transition-all duration-300 ${
                isOpen
                  ? "border-emerald-200 bg-emerald-50/20 shadow-xs"
                  : "border-gray-100 bg-white hover:bg-gray-50/50"
              }`}
            >
              {/* Question */}
              <button
                type="button"
                onClick={() => toggleIndex(index)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left gap-4 focus:outline-none"
              >
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-100 text-orange-600 text-[10px] md:text-xs font-black shrink-0 mt-0.5">
                    Q
                  </span>

                  <span className="text-xs md:text-sm font-extrabold text-gray-900 leading-snug">
                    {faq.question}
                  </span>
                </div>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown
                    className={`w-4 h-4 md:w-5 md:h-5 ${
                      isOpen ? "text-emerald-600" : "text-gray-400"
                    }`}
                  />
                </motion.div>
              </button>

              {/* Answer */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 md:px-5 pb-5 md:pb-6 border-t border-emerald-50/50 pl-12">
                      <div className="bg-white border border-emerald-100 rounded-xl p-3 md:p-4 text-xs md:text-sm text-gray-600 leading-relaxed font-semibold">
                        {faq.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  </div>
);
}