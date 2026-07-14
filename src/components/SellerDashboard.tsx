/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Order, SiteConfig, User, WithdrawRequest, Category, sortProductSizes } from '../types';
import { 
  Plus, Edit, Trash2, Check, X, DollarSign, CreditCard,
  Package, ShoppingCart, TrendingUp, Search, Eye, Filter, RefreshCw,
  Upload, Phone, MapPin, Store, ArrowLeft, Loader2, ListOrdered, Settings, Wallet, AlertCircle,
  Link, ImageIcon, Truck, HelpCircle, Info, Printer, FileText, Bell, CheckCircle
} from 'lucide-react';

const compressAndSetImage = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
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

interface SellerDashboardProps {
  products: Product[];
  orders: Order[];
  siteConfig: SiteConfig;
  loggedInUser: User;
  withdrawRequests: WithdrawRequest[];
  onAddProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onClose: () => void;
  onAddWithdrawRequest: (request: Omit<WithdrawRequest, 'id' | 'createdAt' | 'status'>) => void;
  onNotify: (message: string, type?: 'success' | 'info' | 'error') => void;
  categories: Category[];
  onUpdateUser: (updatedUser: User) => void;
  initialTab?: 'overview' | 'products' | 'orders' | 'payouts' | 'settings';
}

export default function SellerDashboard({
  products,
  orders,
  siteConfig,
  loggedInUser,
  withdrawRequests,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onClose,
  onAddWithdrawRequest,
  onNotify,
  categories,
  onUpdateUser,
  initialTab,
}: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'payouts' | 'settings'>('overview');
  const [showOrdersGuide, setShowOrdersGuide] = useState(true);
  const [selectedMemoOrder, setSelectedMemoOrder] = useState<Order | null>(null);

  // Notifications State & Logic
  interface DashboardNotification {
    id: string;
    type: 'order' | 'product_active' | 'product_inactive' | 'payout_approved' | 'payout_pending';
    title: string;
    message: string;
    date: Date;
    isRead: boolean;
  }

  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`read_notifications_${loggedInUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markAsRead = (id: string) => {
    const updated = [...readNotifications, id];
    setReadNotifications(updated);
    localStorage.setItem(`read_notifications_${loggedInUser.id}`, JSON.stringify(updated));
  };

  const markAllAsRead = (ids: string[]) => {
    const updated = [...readNotifications, ...ids];
    setReadNotifications(updated);
    localStorage.setItem(`read_notifications_${loggedInUser.id}`, JSON.stringify(updated));
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Seller products
  const sellerProducts = products.filter(p => p.sellerId === loggedInUser.id);
  
  // Commission percentage
  const commissionPercent = siteConfig.commissionPercentage ?? 10;

  // Filter orders containing seller's products
  const sellerOrders = orders.filter(order => 
    order.items.some(item => item.sellerId === loggedInUser.id || sellerProducts.some(sp => sp.id === item.productId))
  );

  // Calculate earnings
  const getSellerOrderEarnings = (order: Order) => {
    let total = 0;
    order.items.forEach(item => {
      const isSellerProduct = item.sellerId === loggedInUser.id || sellerProducts.some(sp => sp.id === item.productId);
      if (isSellerProduct) {
        total += item.price * item.quantity;
      }
    });
    return total;
  };

  // Calculate stats
  // Total Sales of approved/delivered/processing/shipped items
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + getSellerOrderEarnings(order), 0);

  const totalDeliveredSales = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + getSellerOrderEarnings(order), 0);

  const totalCommission = Math.round((totalDeliveredSales * commissionPercent) / 100);
  const totalEarnedAfterCommission = totalDeliveredSales - totalCommission;

  // Total paid out (sum of completed withdraw requests for this seller)
  const sellerWithdraws = withdrawRequests.filter(w => w.sellerId === loggedInUser.id);

  // Dynamic Dashboard Notifications
  const dashboardNotifications = React.useMemo<DashboardNotification[]>(() => {
    const list: DashboardNotification[] = [];

    // 1. Orders Notifications
    sellerOrders.forEach(order => {
      list.push({
        id: `order-${order.id}-${order.createdAt}`,
        type: 'order',
        title: 'নতুন অর্ডার এসেছে! 🎉',
        message: `আপনার পণ্যের জন্য ১টি নতুন অর্ডার এসেছে (অর্ডার নং: ${order.id})। গ্রাহক: ${order.customerName}। অনুগ্রহ করে মেমো ও লেবেল প্রিন্ট করে পণ্যের গায়ে লাগিয়ে দিন।`,
        date: new Date(order.createdAt),
        isRead: readNotifications.includes(`order-${order.id}-${order.createdAt}`)
      });
    });

    // 2. Product Approval & Status Notifications
    sellerProducts.forEach(product => {
      if (product.status === 'Active') {
        list.push({
          id: `prod-active-${product.id}`,
          type: 'product_active',
          title: 'পণ্য লাইভ হয়েছে! ✅',
          message: `আপনার পণ্য "${product.name}" এডমিন কর্তৃক রিভিউ শেষে লাইভ করা হয়েছে এবং এখন ক্রেতারা এটি কিনতে পারবেন।`,
          date: new Date(),
          isRead: readNotifications.includes(`prod-active-${product.id}`)
        });
      } else if (product.status === 'Inactive' || product.status === 'Rejected') {
        list.push({
          id: `prod-inactive-${product.id}`,
          type: 'product_inactive',
          title: 'পণ্য ইনঅ্যাক্টিভ/বাতিল করা হয়েছে! ❌',
          message: `আপনার পণ্য "${product.name}" এডমিন কর্তৃক সাময়িকভাবে বাতিল বা ইনঅ্যাক্টিভ করা হয়েছে। বিস্তারিত জানতে বা পুনরায় সক্রিয় করতে অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।`,
          date: new Date(),
          isRead: readNotifications.includes(`prod-inactive-${product.id}`)
        });
      }
    });

    // 3. Payout Status Notifications
    sellerWithdraws.forEach(withdraw => {
      if (withdraw.status === 'completed') {
        list.push({
          id: `withdraw-appr-${withdraw.id}`,
          type: 'payout_approved',
          title: 'টাকার আবেদন সফল! 💰',
          message: `আপনার উইথড্র আবেদন (পরিমাণ: ${withdraw.amount}৳, মাধ্যম: ${withdraw.method.toUpperCase()}) সফলভাবে অনুমোদিত হয়েছে এবং টাকা পাঠানো হয়েছে।`,
          date: new Date(withdraw.createdAt),
          isRead: readNotifications.includes(`withdraw-appr-${withdraw.id}`)
        });
      } else if (withdraw.status === 'pending') {
        list.push({
          id: `withdraw-pend-${withdraw.id}`,
          type: 'payout_pending',
          title: 'টাকার আবেদন প্রক্রিয়াধীন ⏳',
          message: `আপনার ${withdraw.amount}৳-র উইথড্র আবেদনটি গৃহীত হয়েছে এবং বর্তমানে প্রক্রিয়াধীন রয়েছে।`,
          date: new Date(withdraw.createdAt),
          isRead: readNotifications.includes(`withdraw-pend-${withdraw.id}`)
        });
      }
    });

    // Sort by date descending
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sellerOrders, sellerProducts, withdrawRequests, readNotifications, loggedInUser.id]);

  const unreadNotifications = React.useMemo(() => {
    return dashboardNotifications.filter(n => !n.isRead);
  }, [dashboardNotifications]);
  const totalPaidOut = sellerWithdraws
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalPendingWithdraw = sellerWithdraws
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  // Available balance
  const availableBalance = Math.max(0, totalEarnedAfterCommission - totalPaidOut);

  // Get all sold items of this seller
  const getSellerSoldItems = () => {
    const list: {
      orderId: string;
      date: string;
      productName: string;
      image: string;
      price: number;
      quantity: number;
      totalPrice: number;
      commission: number;
      netEarnings: number;
      status: string;
    }[] = [];
    
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          const isSellerProduct = item.sellerId === loggedInUser.id || sellerProducts.some(sp => sp.id === item.productId);
          if (isSellerProduct) {
            const gross = item.price * item.quantity;
            const comm = Math.round((gross * commissionPercent) / 100);
            const net = gross - comm;
            list.push({
              orderId: order.id,
              date: order.createdAt,
              productName: item.productName,
              image: item.image,
              price: item.price,
              quantity: item.quantity,
              totalPrice: gross,
              commission: comm,
              netEarnings: net,
              status: order.status
            });
          }
        });
      }
    });
    // Sort by date newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const soldItems = getSellerSoldItems();

  // Product CRUD states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Image Selector Modal State
  const [imageSelectorTarget, setImageSelectorTarget] = useState<string | null>(null);

  // Product Form states
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number | ''>('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.name || '');
  const [prodUnit, setProdUnit] = useState('পিস');
  const [prodStock, setProdStock] = useState<number | ''>('');
  const [prodImages, setProdImages] = useState<string[]>(['', '', '', '', '']);
  const [prodTagline, setProdTagline] = useState('');
  const [prodDetailedTitle, setProdDetailedTitle] = useState('');
  
  // Extra detailed product states to match admin
  const [prodSKU, setProdSKU] = useState('');
  const [prodReorderLevel, setProdReorderLevel] = useState<number>(5);
  const [prodPurchasePrice, setProdPurchasePrice] = useState<number | ''>('');
  const [prodBadge, setProdBadge] = useState<'none' | 'new' | 'restocked'>('none');
  const [prodDescriptionBullets, setProdDescriptionBullets] = useState('');
  const [prodManufacturer, setProdManufacturer] = useState('');
  const [prodSourceArea, setProdSourceArea] = useState('');
  const [prodShelfLife, setProdShelfLife] = useState('');
  const [prodOrganicCertificate, setProdOrganicCertificate] = useState('');
  const [prodHasMultipleSizes, setProdHasMultipleSizes] = useState(false);
  const [prodSizesList, setProdSizesList] = useState<{ size: string; price: number; originalPrice?: number }[]>([]);
  
  // Size temporary inputs
  const [sizeVal, setSizeVal] = useState('');
  const [sizePriceVal, setSizePriceVal] = useState<number | ''>('');
  const [sizeOrigVal, setSizeOrigVal] = useState<number | ''>('');

  // Withdraw states
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad' | 'bank'>(loggedInUser.paymentMethod || 'bkash');
  const [withdrawDetails, setWithdrawDetails] = useState(loggedInUser.paymentDetails || '');

  // Profile Edit states
  const [shopName, setShopName] = useState(loggedInUser.shopName || '');
  const [shopLogo, setShopLogo] = useState(loggedInUser.shopLogo || '');
  const [sellerName, setSellerName] = useState(loggedInUser.name || '');
  const [sellerAddress, setSellerAddress] = useState(loggedInUser.address || '');
  const [shopDescription, setShopDescription] = useState(loggedInUser.shopDescription || '');
  const [facebookPage, setFacebookPage] = useState(loggedInUser.facebookPage || '');
  const [contactPhone, setContactPhone] = useState(loggedInUser.contactPhone || '');

  useEffect(() => {
    if (loggedInUser) {
      setShopName(loggedInUser.shopName || '');
      setShopLogo(loggedInUser.shopLogo || '');
      setSellerName(loggedInUser.name || '');
      setSellerAddress(loggedInUser.address || '');
      setWithdrawMethod(loggedInUser.paymentMethod || 'bkash');
      setWithdrawDetails(loggedInUser.paymentDetails || '');
      setShopDescription(loggedInUser.shopDescription || '');
      setFacebookPage(loggedInUser.facebookPage || '');
      setContactPhone(loggedInUser.contactPhone || '');
    }
  }, [loggedInUser]);

  const handleOpenAdd = () => {
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdOriginalPrice('');
    setProdCategory(categories[0]?.name || '');
    setProdUnit('পিস');
    setProdStock('');
    setProdImages(['', '', '', '', '']);
    setProdTagline('');
    setProdDetailedTitle('');
    setProdSKU('');
    setProdReorderLevel(5);
    setProdPurchasePrice('');
    setProdBadge('none');
    setProdDescriptionBullets('');
    setProdManufacturer('');
    setProdSourceArea('');
    setProdShelfLife('');
    setProdOrganicCertificate('');
    setProdHasMultipleSizes(false);
    setProdSizesList([]);
    setSizeVal('');
    setSizePriceVal('');
    setSizeOrigVal('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price || '');
    setProdOriginalPrice(p.originalPrice || '');
    setProdCategory(p.category);
    setProdUnit(p.unit);
    setProdStock(p.stock || '');
    
    const initialImages = p.images && p.images.length > 0 ? [...p.images] : [p.image || ''];
    while (initialImages.length < 5) {
      initialImages.push('');
    }
    setProdImages(initialImages);

    setProdTagline(p.tagline || '');
    setProdDetailedTitle(p.detailedTitle || '');
    setProdSKU(p.sku || '');
    setProdReorderLevel(p.reorderLevel || 5);
    setProdPurchasePrice(p.purchasePrice || '');
    setProdBadge(p.badge || 'none');
    setProdDescriptionBullets(p.descriptionBullets ? p.descriptionBullets.join('\n') : '');
    setProdManufacturer(p.manufacturer || '');
    setProdSourceArea(p.sourceArea || '');
    setProdShelfLife(p.shelfLife || '');
    setProdOrganicCertificate(p.organicCertificate || '');
    
    let initialSizes: string[] = p.sizes || [];
    if (initialSizes.length === 0 && p.sizePrices) {
      initialSizes = Object.keys(p.sizePrices);
    }
    const initialSizesList = initialSizes.map(sz => ({
      size: sz,
      price: p.sizePrices?.[sz]?.price ?? p.price,
      originalPrice: p.sizePrices?.[sz]?.originalPrice ?? p.originalPrice
    }));
    setProdSizesList(initialSizesList);
    setProdHasMultipleSizes(initialSizesList.length > 0);
    setSizeVal('');
    setSizePriceVal('');
    setSizeOrigVal('');
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!prodName.trim()) {
      onNotify('পণ্যের নাম লিখুন!', 'error');
      return;
    }
    const finalPrice = Number(prodPrice);
    if (!prodPrice || finalPrice <= 0) {
      onNotify('সঠিক মূল্য নির্ধারণ করুন!', 'error');
      return;
    }
    const finalStock = prodStock !== '' ? Number(prodStock) : 0;
    if (prodStock === '' || finalStock < 0) {
      onNotify('সঠিক স্টক পরিমাণ লিখুন!', 'error');
      return;
    }

    const finalImages = prodImages.filter(Boolean);
    const primaryImg = finalImages[0] || 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80';

    if (isEdit && editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: prodName.trim(),
        description: prodDesc.trim() || `${prodName.trim()}, আমাদের উৎপাদিত খাঁটি পণ্য।`,
        price: finalPrice,
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        category: prodCategory,
        unit: prodUnit,
        stock: finalStock,
        image: primaryImg,
        images: finalImages,
        tagline: prodTagline.trim() || undefined,
        detailedTitle: prodDetailedTitle.trim() || undefined,
        sku: prodSKU.trim() || undefined,
        reorderLevel: prodReorderLevel,
        purchasePrice: prodPurchasePrice ? Number(prodPurchasePrice) : undefined,
        badge: prodBadge !== 'none' ? prodBadge : undefined,
        descriptionBullets: prodDescriptionBullets ? prodDescriptionBullets.split('\n').map(b => b.trim()).filter(Boolean) : undefined,
        manufacturer: prodManufacturer.trim() || undefined,
        sourceArea: prodSourceArea.trim() || undefined,
        shelfLife: prodShelfLife.trim() || undefined,
        organicCertificate: prodOrganicCertificate.trim() || undefined,
        sizes: prodHasMultipleSizes ? sortProductSizes(prodSizesList.map(item => item.size)) : undefined,
        sizePrices: prodHasMultipleSizes ? prodSizesList.reduce((acc, item) => ({ ...acc, [item.size]: { price: Number(item.price), originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined } }), {}) : undefined,
        sellerProductStatus: 'pending' // Send back to pending on edit to allow admin review
      };
      onEditProduct(updated);
      onNotify('পণ্যটি সফলভাবে আপডেট হয়েছে এবং অনুমোদনের জন্য অপেক্ষমাণ আছে!', 'success');
      setIsEditModalOpen(false);
    } else {
      const newProd: Omit<Product, 'id' | 'rating' | 'reviewsCount'> = {
        name: prodName.trim(),
        description: prodDesc.trim() || `${prodName.trim()}, আমাদের উৎপাদিত খাঁটি পণ্য।`,
        price: finalPrice,
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        category: prodCategory,
        unit: prodUnit,
        stock: finalStock,
        image: primaryImg,
        images: finalImages,
        isFeatured: false,
        tagline: prodTagline.trim() || undefined,
        detailedTitle: prodDetailedTitle.trim() || undefined,
        sku: prodSKU.trim() || undefined,
        reorderLevel: prodReorderLevel,
        purchasePrice: prodPurchasePrice ? Number(prodPurchasePrice) : undefined,
        badge: prodBadge !== 'none' ? prodBadge : undefined,
        descriptionBullets: prodDescriptionBullets ? prodDescriptionBullets.split('\n').map(b => b.trim()).filter(Boolean) : undefined,
        manufacturer: prodManufacturer.trim() || undefined,
        sourceArea: prodSourceArea.trim() || undefined,
        shelfLife: prodShelfLife.trim() || undefined,
        organicCertificate: prodOrganicCertificate.trim() || undefined,
        sizes: prodHasMultipleSizes ? sortProductSizes(prodSizesList.map(item => item.size)) : undefined,
        sizePrices: prodHasMultipleSizes ? prodSizesList.reduce((acc, item) => ({ ...acc, [item.size]: { price: Number(item.price), originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined } }), {}) : undefined,
        sellerId: loggedInUser.id,
        sellerName: loggedInUser.shopName || loggedInUser.name,
        sellerProductStatus: 'pending' // Admin approval required
      };
      onAddProduct(newProd);
      onNotify('পণ্যটি সফলভাবে যোগ করা হয়েছে এবং অ্যাডমিন অনুমোদনের পর লাইভ হবে!', 'success');
      setIsAddModalOpen(false);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      onNotify('সঠিক উইথড্র পরিমাণ লিখুন!', 'error');
      return;
    }
    if (withdrawAmount > availableBalance) {
      onNotify('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!', 'error');
      return;
    }
    if (!withdrawDetails.trim()) {
      onNotify('উইথড্র অ্যাকাউন্ট ডিটেইলস লিখুন!', 'error');
      return;
    }

    onAddWithdrawRequest({
      sellerId: loggedInUser.id,
      shopName: loggedInUser.shopName || loggedInUser.name,
      amount: withdrawAmount,
      method: withdrawMethod,
      details: withdrawDetails.trim()
    });

    onNotify('উইথড্র রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!', 'success');
    setWithdrawAmount(0);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      onNotify('দোকানের নাম লিখুন!', 'error');
      return;
    }

    const updatedUser: User = {
      ...loggedInUser,
      name: sellerName.trim() || loggedInUser.name,
      shopName: shopName.trim(),
      shopLogo: shopLogo.trim() || undefined,
      address: sellerAddress.trim() || loggedInUser.address,
      paymentMethod: withdrawMethod,
      paymentDetails: withdrawDetails.trim(),
      shopDescription: shopDescription.trim(),
      facebookPage: facebookPage.trim(),
      contactPhone: contactPhone.trim()
    };

    onUpdateUser(updatedUser);
    onNotify('দোকানের প্রোফাইল সফলভাবে আপডেট হয়েছে!', 'success');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isLogo: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isLogo) {
          setShopLogo(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Render registration pending approval screen
  if (loggedInUser.sellerStatus === 'pending') {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-stone-200 p-8 rounded-3xl max-w-lg shadow-xl"
        >
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">আবেদনটি অনুমোদনের জন্য অপেক্ষমাণ আছে</h2>
          <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
            প্রিয় উদ্যোক্তা, <strong>{loggedInUser.shopName || loggedInUser.name}</strong> নামে আপনার বিক্রেতা (Seller) অ্যাকাউন্ট আবেদনটি আমাদের কাছে সফলভাবে পৌঁছেছে। আমাদের অ্যাডমিন প্যানেল আপনার দেওয়া তথ্য ও মোবাইল নম্বর যাচাই করে খুব শীঘ্রই অ্যাকাউন্টটি সক্রিয় করে দেবে।
          </p>
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 text-left mb-6">
            <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider mb-2">আপনার আবেদনকৃত তথ্য:</h4>
            <div className="text-xs font-semibold text-slate-700 space-y-1">
              <p><span className="text-slate-400">দোকানের নাম:</span> {loggedInUser.shopName}</p>
              <p><span className="text-slate-400">মোবাইল নম্বর:</span> {loggedInUser.phone}</p>
              <p><span className="text-slate-400">ঠিকানা:</span> {loggedInUser.address}</p>
              <p><span className="text-slate-400">পেমেন্ট মেথড:</span> {loggedInUser.paymentMethod === 'bank' ? 'ব্যাংক ট্রান্সফার' : loggedInUser.paymentMethod === 'nagad' ? 'নগদ' : 'বিকাশ'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer"
          >
            ওয়েবসাইটে ফিরে যান
          </button>
        </motion.div>
      </div>
    );
  }

  if (loggedInUser.sellerStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-stone-200 p-8 rounded-3xl max-w-lg shadow-xl"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-rose-600 mb-4">আবেদনটি নামঞ্জুর করা হয়েছে</h2>
          <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
            দুঃখিত, আপনার বিক্রেতা অ্যাকাউন্ট আবেদনটি আমাদের প্যানেল দ্বারা অনুমোদন করা সম্ভব হয়নি। অনুগ্রহ করে সঠিক তথ্যাদি দিয়ে পুনরায় আমাদের হেল্পলাইনের মাধ্যমে যোগাযোগ করুন।
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer"
          >
            ওয়েবসাইটে ফিরে যান
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Banner Header */}
      <div className="bg-linear-to-r from-[#006437] to-[#004d2a] text-white py-4.5 px-4 sm:px-6 md:px-8 border-b border-emerald-800">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Store className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight">{loggedInUser.shopName || 'সেলার প্যানেল'}</h1>
              <p className="text-xs text-emerald-200 font-bold">মার্কেটপ্লেস উদ্যোক্তা কন্ট্রোল প্যানেল</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition-all border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>মূল ওয়েবসাইটে ফিরুন</span>
          </button>
        </div>
      </div>

      <div className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-3 bg-white border border-stone-200 rounded-2xl p-4 h-fit space-y-1.5">
          <div className="flex items-center gap-2.5 px-3 py-2 border-b border-stone-100 mb-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
              {loggedInUser.shopLogo ? (
                <img src={loggedInUser.shopLogo} alt="Shop Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-stone-500" />
              )}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-black text-slate-800 truncate">{loggedInUser.shopName}</h4>
              <span className="text-[10px] text-emerald-600 font-black">● অনুমোদিত বিক্রেতা</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#006437] text-white' : 'text-slate-600 hover:bg-stone-50'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5" />
            <span>ওভারভিউ ও ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-[#006437] text-white' : 'text-slate-600 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4.5 h-4.5" />
            <span>আমার পণ্যসমূহ ({sellerProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'orders' ? 'bg-[#006437] text-white' : 'text-slate-600 hover:bg-stone-50'
            }`}
          >
            <ListOrdered className="w-4.5 h-4.5" />
            <span>অর্ডার ট্র্যাকিং ({sellerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'payouts' ? 'bg-[#006437] text-white' : 'text-slate-600 hover:bg-stone-50'
            }`}
          >
            <Wallet className="w-4.5 h-4.5" />
            <span>উপার্জন ও উইথড্র</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-[#006437] text-white' : 'text-slate-600 hover:bg-stone-50'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>দোকান সেটিংস</span>
          </button>
        </div>

        {/* Dynamic Content Frame */}
        <div className="md:col-span-9 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Financial Quick Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-stone-500 font-bold block uppercase tracking-wide">মোট বিক্রয় (ডেলিভারড)</span>
                          <span className="text-2xl font-black text-slate-800">{totalDeliveredSales}৳</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#006437]">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-3">
                        মোট পেমেন্ট সম্পন্ন হয়েছে
                      </div>
                    </div>

                    <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-stone-500 font-bold block uppercase tracking-wide">ওয়ালেট ব্যালেন্স ({commissionPercent}% কমিশন বাদে)</span>
                          <span className="text-2xl font-black text-emerald-600">{availableBalance}৳</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Wallet className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-[10px] text-[#006437] font-extrabold mt-3 flex items-center gap-1">
                        💸 উইথড্র করার জন্য প্রস্তুত
                      </div>
                    </div>

                    <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-stone-500 font-bold block uppercase tracking-wide">উইথড্র অপেক্ষমাণ</span>
                          <span className="text-2xl font-black text-amber-500">{totalPendingWithdraw}৳</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                          <CreditCard className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-3">
                        প্রসেসিং হচ্ছে
                      </div>
                    </div>
                  </div>

                  {/* Warning banner about commission */}
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-xs text-emerald-900">কমিশন পলিসি:</h4>
                      <p className="text-[11px] font-medium text-emerald-700 leading-relaxed mt-0.5">
                        অ্যাডমিন কমিশন পলিসি অনুযায়ী, আপনার সফলভাবে ডেলিভারকৃত প্রতিটি প্রোডাক্ট বিক্রয়ের উপর {commissionPercent}% কুরিয়ার ও গেটওয়ে কমিশন চার্জ প্রযোজ্য হবে। অর্ডারের অন্যান্য পণ্যে আপনার প্রোডাক্টের অংশটুকুর কমিশন বাদে বাকি অংশ সরাসরি আপনার ওয়ালেট ব্যালেন্সে যুক্ত হয়ে যাবে।
                      </p>
                    </div>
                  </div>

                  {/* Active Products lists */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                      <h3 className="font-black text-slate-800 text-sm">পণ্যসমূহের বর্তমান অবস্থা</h3>
                      <button 
                        onClick={() => setActiveTab('products')} 
                        className="text-xs text-[#006437] hover:underline font-extrabold cursor-pointer"
                      >
                        সবগুলো দেখুন
                      </button>
                    </div>
                    {sellerProducts.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 font-semibold text-xs">
                        আপনার এখনো কোনো পণ্য যোগ করা হয়নি। পণ্যের ট্যাবে গিয়ে পণ্য যোগ করুন।
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sellerProducts.slice(0, 4).map(p => (
                          <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-xl transition-all border border-stone-100">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold">{p.category} • {p.price}৳ / {p.unit}</span>
                            </div>
                            <div>
                              {p.sellerProductStatus === 'approved' ? (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">অনুমোদিত</span>
                              ) : p.sellerProductStatus === 'rejected' ? (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800">প্রত্যাখ্যাত</span>
                              ) : (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">অপেক্ষমাণ</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Products */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-800">আপনার নিজস্ব পণ্যসমূহ ({sellerProducts.length})</h2>
                    <button
                      onClick={handleOpenAdd}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#006437] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন পণ্য যোগ করুন</span>
                    </button>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
                    {sellerProducts.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 font-bold text-xs">
                        কোনো পণ্য খুঁজে পাওয়া যায়নি। উপরের বাটনে ক্লিক করে প্রথম পণ্যটি যোগ করুন!
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-stone-100 text-slate-600 border-b border-stone-200 font-black">
                              <th className="p-3">পণ্যের ছবি ও নাম</th>
                              <th className="p-3">ক্যাটাগরি</th>
                              <th className="p-3">দাম</th>
                              <th className="p-3">স্টক</th>
                              <th className="p-3">অবস্থা</th>
                              <th className="p-3 text-right">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-150 font-bold text-slate-700">
                            {sellerProducts.map(p => (
                              <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                                <td className="p-3 flex items-center gap-3">
                                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                                  <div className="min-w-0">
                                    <span className="block text-slate-800 font-black truncate">{p.name}</span>
                                    <span className="block text-[9px] text-slate-400 font-bold">ID: {p.id}</span>
                                  </div>
                                </td>
                                <td className="p-3">{p.category}</td>
                                <td className="p-3 text-[#006437] font-black">{p.price}৳ <span className="text-[10px] text-stone-400 font-bold">/ {p.unit}</span></td>
                                <td className="p-3">
                                  {p.stock > 0 ? (
                                    <span className="text-slate-800">{p.stock} {p.unit}</span>
                                  ) : (
                                    <span className="text-red-500 font-extrabold bg-red-50 px-1.5 py-0.5 rounded-sm">আউট অফ স্টক</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {p.sellerProductStatus === 'approved' ? (
                                    <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">অনুমোদিত</span>
                                  ) : p.sellerProductStatus === 'rejected' ? (
                                    <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">প্রত্যাখ্যাত</span>
                                  ) : (
                                    <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">অনুমোদন অপেক্ষমাণ</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenEdit(p)}
                                      className="p-1.5 text-stone-500 hover:text-[#006437] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                      title="সম্পাদনা করুন"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('আপনি কি এই পণ্যটি মুছে ফেলতে চান?')) {
                                          onDeleteProduct(p.id);
                                          onNotify('পণ্যটি সফলভাবে ডিলিট করা হয়েছে!', 'success');
                                        }
                                      }}
                                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="মুছে ফেলুন"
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

              {/* Tab: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-sm font-black text-slate-800 font-sans">আপনার পণ্য থাকা অর্ডারসমূহ ({sellerOrders.length})</h2>
                    <button
                      onClick={() => setShowOrdersGuide(!showOrdersGuide)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-extrabold text-[#006437] hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer border border-emerald-100"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showOrdersGuide ? 'নির্দেশিকালয় বন্ধ করুন' : 'অর্ডার ও শিপিং নির্দেশিকা দেখুন'}</span>
                    </button>
                  </div>

                  {showOrdersGuide && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#006437]" />
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-[#006437]" />
                        <h3 className="text-xs font-black text-emerald-900">উদ্যোক্তা অর্ডার প্রসেসিং ও শিপিং গাইডলাইন</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-1">
                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-250/30">
                          <div className="w-8 h-8 rounded-lg bg-[#006437]/10 text-[#006437] flex items-center justify-center font-black text-xs mb-2">১</div>
                          <h4 className="text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1">
                            <ListOrdered className="w-3.5 h-3.5 text-[#006437]" />
                            অর্ডার চেক ও ট্র্যাকিং
                          </h4>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            কোনো ক্রেতা আপনার পণ্য অর্ডার করলেই তা এই তালিকায় যোগ হবে। কাস্টমারের নাম, ফোন নম্বর এবং অর্ডার আইডিটি ড্যাশবোর্ডে দেখতে পাবেন।
                          </p>
                        </div>

                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-250/30">
                          <div className="w-8 h-8 rounded-lg bg-[#006437]/10 text-[#006437] flex items-center justify-center font-black text-xs mb-2">২</div>
                          <h4 className="text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-[#006437]" />
                            প্যাকেজিং ও লেবেলিং
                          </h4>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            আপনার স্টক থেকে অর্ডারকৃত পণ্যটি সুন্দর ও মজবুতভাবে প্যাক করুন। প্যাকেজের উপরে গ্রাহকের নাম, ফোন নম্বর এবং <b>অর্ডার আইডি (যেমন: {sellerOrders[0]?.id || 'ML-123456'})</b> স্পষ্টভাবে লিখে দিন।
                          </p>
                        </div>

                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-250/30">
                          <div className="w-8 h-8 rounded-lg bg-[#006437]/10 text-[#006437] flex items-center justify-center font-black text-xs mb-2">৩</div>
                          <h4 className="text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-[#006437]" />
                            এডমিন হাবে পণ্য পাঠানো
                          </h4>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            প্যাক করা পণ্যটি সুন্দরবন কুরিয়ার বা অন্য কুরিয়ার সার্ভিসের মাধ্যমে আমাদের এডমিন পয়েন্টে/হাবে পাঠিয়ে দিন অথবা এডমিন প্রতিনিধির সাথে সমন্বয় করে কুরিয়ার বুকিং নিশ্চিত করুন।
                          </p>
                        </div>

                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-250/30">
                          <div className="w-8 h-8 rounded-lg bg-[#006437]/10 text-[#006437] flex items-center justify-center font-black text-xs mb-2">৪</div>
                          <h4 className="text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-[#006437]" />
                            পেমেন্ট কালেকশন
                          </h4>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            এডমিন পণ্যটি ক্রেতার কাছে পৌঁছে দিয়ে টাকা সংগ্রহ করবেন। কাস্টমার পণ্যটি বুঝে নেওয়ার সাথে সাথে কমিশন বাদে বাকি টাকা সরাসরি আপনার ওয়ালেট ব্যালেন্সে যুক্ত হয়ে যাবে।
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 flex items-start gap-2 text-[11px] font-bold text-emerald-800 leading-relaxed">
                        <span className="shrink-0">💡</span>
                        <span><b>পরামর্শ:</b> কুরিয়ারে পণ্য বুকিং দেওয়ার পর বুকিং স্লিপ বা ট্র্যাকিং আইডি আমাদের অফিসিয়াল নম্বরে মেসেজ করে দিলে কাস্টমার এন্ডে প্যানেল আপডেট করা আরও সহজ ও দ্রুত হয়।</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
                    {sellerOrders.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 font-bold text-xs">
                        আপনার কোনো পণ্যের জন্য এখনো অর্ডার পাওয়া যায়নি।
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-stone-100 text-slate-600 border-b border-stone-200 font-black">
                              <th className="p-3">অর্ডার আইডি ও তারিখ</th>
                              <th className="p-3">গ্রাহকের নাম, ফোন ও ঠিকানা</th>
                              <th className="p-3">আপনার আইটেম ও পরিমাণ</th>
                              <th className="p-3">আপনার মোট মূল্য</th>
                              <th className="p-3">অবস্থা</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-150 font-bold text-slate-700">
                            {sellerOrders.map(order => {
                              const sellerItems = order.items.filter(item => sellerProducts.some(sp => sp.id === item.productId));
                              const sellerTotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

                              return (
                                <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="p-3">
                                    <span className="block text-slate-800 font-black">ID: {order.id}</span>
                                    <span className="block text-[10px] text-stone-400 font-semibold">{new Date(order.createdAt).toLocaleDateString('bn-BD')}</span>
                                    <button
                                      onClick={() => setSelectedMemoOrder(order)}
                                      className="mt-1.5 flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-[#006437] hover:text-[#004d2a] bg-[#006437]/5 hover:bg-[#006437]/10 rounded-lg transition-all cursor-pointer border border-[#006437]/10"
                                      title="মেমো ও লেবেল প্রিন্ট করুন"
                                    >
                                      <Printer className="w-3 h-3" />
                                      <span>মেমো প্রিন্ট</span>
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    <span className="block text-slate-800 font-extrabold">{order.customerName}</span>
                                    <span className="block text-[10px] text-stone-500 font-semibold">{order.customerPhone}</span>
                                    {order.deliveryAddress && (
                                      <div className="mt-1.5 text-[10px] bg-stone-50 border border-stone-200 p-2 rounded-xl text-stone-600 font-bold leading-relaxed max-w-[220px] break-words">
                                        <span className="font-extrabold text-[#006437] block text-[9px] mb-0.5">ডেলিভারি ঠিকানা:</span>
                                        {order.deliveryAddress}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 space-y-1">
                                    {sellerItems.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5">
                                        <img src={item.image} alt={item.productName} className="w-5 h-5 rounded object-cover border shrink-0" />
                                        <span className="truncate max-w-[150px]">{item.productName} ({item.quantity} x {item.price}৳)</span>
                                      </div>
                                    ))}
                                  </td>
                                  <td className="p-3">
                                    <span className="block text-slate-800 font-black">{sellerTotal}৳</span>
                                    <span className="block text-[10px] text-emerald-600">ওয়ালেট: {sellerTotal - Math.round(sellerTotal * commissionPercent / 100)}৳</span>
                                  </td>
                                  <td className="p-3">
                                    {order.status === 'delivered' ? (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">ডেলিভারড (ব্যালেন্স যুক্ত)</span>
                                    ) : order.status === 'cancelled' ? (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800">বাতিলকৃত</span>
                                    ) : (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">{order.status}</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Payouts */}
              {activeTab === 'payouts' && (
                <div className="space-y-6">
                  {/* Payout Stats Summary cards row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-stone-200/85 rounded-2xl p-4 shadow-xs">
                      <span className="text-[10px] text-stone-500 font-extrabold block uppercase tracking-wider mb-1">মোট বিক্রয় (ডেলিভারড)</span>
                      <span className="text-lg md:text-xl font-black text-slate-800">{totalDeliveredSales}৳</span>
                      <span className="text-[9px] text-stone-400 font-semibold block mt-1">সব ভ্যাট/ট্যাক্স সহ</span>
                    </div>
                    <div className="bg-white border border-stone-200/85 rounded-2xl p-4 shadow-xs">
                      <span className="text-[10px] text-stone-500 font-extrabold block uppercase tracking-wider mb-1">কমিশন কর্তন ({commissionPercent}%)</span>
                      <span className="text-lg md:text-xl font-black text-red-600">-{totalCommission}৳</span>
                      <span className="text-[9px] text-stone-400 font-semibold block mt-1">প্ল্যাটফর্ম কমিশন</span>
                    </div>
                    <div className="bg-white border border-stone-200/85 rounded-2xl p-4 shadow-xs">
                      <span className="text-[10px] text-stone-500 font-extrabold block uppercase tracking-wider mb-1">মোট পরিশোধিত উইথড্র</span>
                      <span className="text-lg md:text-xl font-black text-[#006437]">{totalPaidOut}৳</span>
                      <span className="text-[9px] text-stone-400 font-semibold block mt-1">সরাসরি বিকাশ/ব্যাংকে প্রেরিত</span>
                    </div>
                    <div className="bg-white border border-stone-200/85 rounded-2xl p-4 shadow-xs bg-emerald-50/20">
                      <span className="text-[10px] text-emerald-800 font-extrabold block uppercase tracking-wider mb-1">উত্তোলনযোগ্য ব্যালেন্স</span>
                      <span className="text-lg md:text-xl font-black text-emerald-600">{availableBalance}৳</span>
                      <span className="text-[9px] text-emerald-700 font-semibold block mt-1">💸 বর্তমানে ওয়ালেটে জমা</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Withdraw Form Column */}
                    <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                      <h3 className="font-extrabold text-xs text-stone-400 uppercase tracking-wide mb-3">টাকা উইথড্র ফরম</h3>
                      <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">উইথড্র করার পরিমাণ <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">৳</span>
                            <input
                              type="number"
                              placeholder="যেমন: ১০০০"
                              value={withdrawAmount || ''}
                              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                              max={availableBalance}
                              className="w-full pl-7 pr-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006437]/20 focus:border-[#006437]"
                            />
                          </div>
                          <span className="text-[10px] text-[#006437] font-bold mt-1.5 block">সর্বোচ্চ উত্তোলনযোগ্য: {availableBalance}৳</span>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">উত্তোলন মাধ্যম <span className="text-red-500">*</span></label>
                          <select
                            value={withdrawMethod}
                            onChange={(e) => setWithdrawMethod(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437] bg-white"
                          >
                            <option value="bkash">বিকাশ (bKash)</option>
                            <option value="nagad">নগদ (Nagad)</option>
                            <option value="bank">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">অ্যাকাউন্টের তথ্য বা বিবরণ <span className="text-red-500">*</span></label>
                          <textarea
                            placeholder="বিকাশ/নগদ নম্বর অথবা ব্যাংক হিসাবের নাম, ব্যাংক অ্যাকাউন্ট নম্বর, শাখা ইত্যাদি লিখুন।"
                            value={withdrawDetails}
                            onChange={(e) => setWithdrawDetails(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={availableBalance <= 0 || withdrawAmount <= 0 || withdrawAmount > availableBalance}
                          className="w-full py-2.5 bg-[#006437] hover:bg-emerald-700 disabled:bg-stone-200 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all disabled:cursor-not-allowed text-center"
                        >
                          উইথড্র রিকোয়েস্ট পাঠান
                        </button>
                      </form>
                    </div>

                    {/* Withdraw Requests History Column */}
                    <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                      <h3 className="font-extrabold text-xs text-stone-400 uppercase tracking-wide mb-3">লেনদেন ও পেমেন্ট হিস্ট্রি</h3>
                      {sellerWithdraws.length === 0 ? (
                        <div className="text-center py-12 text-stone-400 font-bold text-xs">
                          কোনো পূর্ববর্তী লেনদেন পাওয়া যায়নি।
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {sellerWithdraws.map(w => (
                            <div key={w.id} className="p-3 border border-stone-100 rounded-xl hover:bg-stone-50 transition-colors">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-slate-800">{w.amount}৳</span>
                                {w.status === 'completed' ? (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">পরিশোধিত</span>
                                ) : w.status === 'rejected' ? (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-800">বাতিলকৃত</span>
                                ) : (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">অপেক্ষমাণ</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold line-clamp-2">মাধ্যম: {w.method === 'bank' ? 'ব্যাংক' : w.method === 'nagad' ? 'নগদ' : 'বিকাশ'} • {w.details}</p>
                              <span className="text-[9px] text-slate-400 font-bold block mt-1">তারিখ: {new Date(w.createdAt).toLocaleDateString('bn-BD')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profit Sales Ledger Book */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                      <div>
                        <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wide">বিক্রয় খতিয়ান (প্রোডাক্ট বিক্রয় ও হিসাব খাতা)</h3>
                        <p className="text-[10px] text-stone-400 font-semibold mt-0.5">আপনার শপের প্রোডাক্ট বিক্রি হওয়ার পর এখানে প্রতিটি আইটেমের হিসাব যুক্ত হয়।</p>
                      </div>
                      <span className="bg-emerald-50 text-[#006437] font-black text-[10px] px-2.5 py-1 rounded-xl">
                        মোট বিক্রিত আইটেম: {soldItems.length}টি
                      </span>
                    </div>

                    {soldItems.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 font-bold text-xs">
                        আপনার কোনো প্রোডাক্ট বিক্রয়ের বিবরণী পাওয়া যায়নি। কাস্টমার অর্ডার সফলভাবে সাবমিট ও ডেলিভারি সম্পন্ন হলে এখানে হিসাব খাতা আপডেট হবে।
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-100">
                              <th className="py-2 px-3">অর্ডার তথ্য</th>
                              <th className="py-2 px-3">পণ্যের বিবরণ</th>
                              <th className="py-2 px-3 text-right">বিক্রয় মূল্য</th>
                              <th className="py-2 px-3 text-right">কমিশন কর্তন ({commissionPercent}%)</th>
                              <th className="py-2 px-3 text-right">নিট ক্রেডিটেড</th>
                              <th className="py-2 px-3 text-center">ব্যালেন্স স্ট্যাটাস</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 text-slate-700 font-semibold">
                            {soldItems.map((item, idx) => {
                              const isDelivered = item.status === 'delivered';
                              return (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-800">{item.orderId}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(item.date).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      {item.image && (
                                        <img src={item.image} alt={item.productName} className="w-8 h-8 rounded-lg object-cover border border-stone-100 shrink-0" referrerPolicy="no-referrer" />
                                      )}
                                      <div>
                                        <div className="font-bold text-slate-800 line-clamp-1">{item.productName}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">৳{item.price} × {item.quantity}টি</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold text-slate-800">৳{item.totalPrice}</td>
                                  <td className="py-3 px-3 text-right text-red-500">৳{item.commission}</td>
                                  <td className="py-3 px-3 text-right text-emerald-600 font-bold">৳{item.netEarnings}</td>
                                  <td className="py-3 px-3 text-center">
                                    {isDelivered ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        ● ওয়ালেটে যুক্ত
                                      </span>
                                    ) : item.status === 'cancelled' ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                        ● বাতিলকৃত
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800" title="ডেলিভারি সফল হলে এই নিট আয় ওয়ালেটে উইথড্রযোগ্য হয়ে যাবে">
                                        ● অর্ডার সক্রিয় (অপেক্ষমাণ)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Settings */}
              {activeTab === 'settings' && (
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs max-w-2xl">
                  <h2 className="text-sm font-black text-slate-800 mb-5 border-b border-stone-100 pb-3 flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#006437]" />
                    <span>উদ্যোক্তা শপ সেটিংস (Shop Settings)</span>
                  </h2>
                  
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Section 1: Branding & Profile */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#006437] uppercase tracking-wider border-l-2 border-[#006437] pl-2">
                        ১. শপের প্রোফাইল ও ব্র্যান্ডিং
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">দোকানের নাম (শপের নাম) <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="দোকানের নাম লিখুন"
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">মালিকের নাম</label>
                          <input
                            type="text"
                            value={sellerName}
                            onChange={(e) => setSellerName(e.target.value)}
                            placeholder="মালিকের নাম"
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">শপের সংক্ষিপ্ত স্লোগান বা পরিচিতি (Description)</label>
                        <textarea
                          value={shopDescription}
                          onChange={(e) => setShopDescription(e.target.value)}
                          placeholder="যেমন: আমরা দিচ্ছি রাজশাহীর বিষমুক্ত আম্রপালি ও ল্যাংড়া আম সরাসরি বাগান থেকে।"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                        />
                        <span className="text-[10px] text-gray-400 font-medium">কাস্টমাররা আপনার শপ দেখার সময় এই স্লোগানটি দেখতে পাবেন।</span>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">দোকানের লোগো (চিত্র লিঙ্ক অথবা আপলোড)</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl border bg-stone-50 flex items-center justify-center overflow-hidden shrink-0">
                            {shopLogo ? (
                              <img src={shopLogo} alt="Shop Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-6 h-6 text-stone-300" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={shopLogo}
                              onChange={(e) => setShopLogo(e.target.value)}
                              placeholder="যেমন: https://example.com/logo.png"
                              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                            />
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, true)}
                                className="hidden"
                                id="shop-logo-file"
                              />
                              <label
                                htmlFor="shop-logo-file"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer transition-all border border-stone-200"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>কম্পিউটার থেকে আপলোড</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Contact & Socials */}
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <h3 className="text-xs font-bold text-[#006437] uppercase tracking-wider border-l-2 border-[#006437] pl-2">
                        ২. যোগাযোগ ও সোশ্যাল মিডিয়া
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <span>যোগাযোগের ফোন নম্বর (Hotline)</span>
                          </label>
                          <input
                            type="text"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="যেমন: ০১৭XXXXXXXX"
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">ফেসবুক পেজ লিংক (Facebook Page)</label>
                          <input
                            type="text"
                            value={facebookPage}
                            onChange={(e) => setFacebookPage(e.target.value)}
                            placeholder="যেমন: https://facebook.com/yourshop"
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Location / Address */}
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <h3 className="text-xs font-bold text-[#006437] uppercase tracking-wider border-l-2 border-[#006437] pl-2">
                        ৩. শপ বা ব্যবসার ঠিকানা
                      </h3>

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span> সম্পূর্ণ ঠিকানা (যেখান থেকে পণ্য ডেলিভারি হবে)</span>
                        </label>
                        <textarea
                          value={sellerAddress}
                          onChange={(e) => setSellerAddress(e.target.value)}
                          placeholder="আপনার শপের বা গুদামের সম্পূর্ণ ঠিকানা লিখুন (যেমন: গ্রাম, উপজেলা, জেলা)"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                        />
                      </div>
                    </div>

                    {/* Section 4: Withdrawal / Payout info */}
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <h3 className="text-xs font-bold text-[#006437] uppercase tracking-wider border-l-2 border-[#006437] pl-2">
                        ৪. ডিফল্ট উইথড্র ও পেমেন্ট সেটিংস
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                            <span>পেমেন্ট মাধ্যম</span>
                          </label>
                          <select
                            value={withdrawMethod}
                            onChange={(e) => setWithdrawMethod(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437] bg-white cursor-pointer"
                          >
                            <option value="bkash">বিকাশ (bKash)</option>
                            <option value="nagad">নগদ (Nagad)</option>
                            <option value="bank">ব্যাংক হিসাব (Bank)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">একাউন্ট বিবরণ / নম্বর</label>
                          <input
                            type="text"
                            value={withdrawDetails}
                            onChange={(e) => setWithdrawDetails(e.target.value)}
                            placeholder="যেমন: বিকাশ পার্সোনাল নম্বর ০১৭XXXXXXXX অথবা ব্যাংক বিবরণ"
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden focus:border-[#006437]"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium block">
                        এই তথ্যটি আপনার উইথড্র রিকোয়েস্টের সময় স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে।
                      </span>
                    </div>

                    <div className="border-t border-stone-100 pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#006437] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                      >
                        প্রোফাইল পরিবর্তন সংরক্ষণ করুন
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Add / Edit Product Modals */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-slate-50/50">
                <h3 className="font-extrabold text-[#006437] text-sm md:text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <span>{isEditModalOpen ? 'পণ্যের বিবরণ পরিবর্তন করুন' : 'নতুন পণ্য যোগ করুন (অ্যাডমিন পর্যালোচনার জন্য)'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={(e) => handleSaveProduct(e, isEditModalOpen)} className="flex-grow overflow-y-auto p-6 space-y-4">
                {/* Row 1: পণ্যের নাম & ক্যাটাগরি */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-bold text-gray-700 mb-1">পণ্যের নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: সুন্দরবনের খলিশা ফুলের মধু"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">ক্যাটাগরি *</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-emerald-600"
                    >
                      <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
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
                      value={prodSKU}
                      onChange={(e) => setProdSKU(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">স্টক পরিমাণ *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="যেমন: ২৫"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                    />
                  </div>
                </div>

                {/* Row 3: পরিমাণ একক (Unit) & রিঅর্ডার লেভেল */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ইউনিট *</label>
                    <select
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-emerald-600"
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
                      value={prodReorderLevel}
                      onChange={(e) => setProdReorderLevel(Number(e.target.value))}
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
                      value={prodPurchasePrice}
                      onChange={(e) => setProdPurchasePrice(e.target.value !== '' ? Number(e.target.value) : '')}
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
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">পূর্বের মূল্য (৳)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="যেমন: ১০০০"
                      value={prodOriginalPrice}
                      onChange={(e) => setProdOriginalPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-600 font-medium bg-white text-gray-800"
                    />
                  </div>
                </div>

                {/* ক্রয় ও বিক্রয় মূল্যের স্পষ্টীকরণ নোট */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-[11px] text-emerald-800 font-medium leading-relaxed">
                  💡 <strong>একক মূল্য নোট:</strong> এখানে দেয়া ক্রয় ও বিক্রয় মূল্যটি প্রতি <strong>১ {prodUnit || 'একক'}</strong> এর জন্য প্রযোজ্য। গ্রাহক কার্টে বেশি পরিমাণ অর্ডার করলে এই মূল্য দিয়েই গুণ করে সর্বমোট মূল্য হিসাব করা হবে এবং হোয়াটসঅ্যাপ মেসেজেও সঠিক হিসাব চলে যাবে।
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ব্যাজ / স্টিকার (Badge)</label>
                    <select
                      value={prodBadge}
                      onChange={(e) => setProdBadge(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-600 focus:border-emerald-600"
                    >
                      <option value="none">কোনোটিই নয় (None)</option>
                      <option value="new">নতুন (New)</option>
                      <option value="restocked">স্টক এসেছে (Restocked)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ছোট বিবরণী (Detailed Description)</label>
                    <textarea
                      rows={2}
                      placeholder="পণ্য সম্পর্কে সংক্ষেপে বলুন..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white resize-none"
                    />
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
                        value={prodTagline}
                        onChange={(e) => setProdTagline(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">ডেসক্রিপশন টাইটেল (Detailed Title)</label>
                      <input
                        type="text"
                        placeholder="যেমন: রাজশাহীর খাঁটি আম (Premium Quality Himsagar)"
                        value={prodDetailedTitle}
                        onChange={(e) => setProdDetailedTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">কেন আমাদের পণ্যই সেরা? (প্রতি লাইনে একটি করে বুলেট পয়েন্ট লিখুন)</label>
                      <textarea
                        rows={3}
                        placeholder="যেমন:&#10;শতভাগ খাঁটি ও প্রাকৃতিক উপাদান&#10;কোনো ভেজাল বা প্রিজারভেティブ নেই"
                        value={prodDescriptionBullets}
                        onChange={(e) => setProdDescriptionBullets(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-hidden font-medium bg-white text-gray-800 font-sans leading-relaxed resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">প্রস্তুতকারক (Manufacturer)</label>
                        <input
                          type="text"
                          value={prodManufacturer}
                          onChange={(e) => setProdManufacturer(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">উৎস অঞ্চল (Source Area)</label>
                        <input
                          type="text"
                          value={prodSourceArea}
                          onChange={(e) => setProdSourceArea(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">মেয়াদকাল / Shelf Life</label>
                        <input
                          type="text"
                          value={prodShelfLife}
                          onChange={(e) => setProdShelfLife(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">অর্গানিক সার্টিফিকেট</label>
                        <input
                          type="text"
                          value={prodOrganicCertificate}
                          onChange={(e) => setProdOrganicCertificate(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ওজন/সাইজ ভিত্তিক মূল্য নির্ধারণ (Size-wise pricing) */}
                <div className="pt-4 border-t border-gray-100 space-y-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="block text-sm font-extrabold text-[#006437]">⚖️ ওজন/সাইজ ভিত্তিক ভিন্ন মূল্য?</span>
                    <input
                      type="checkbox"
                      checked={prodHasMultipleSizes}
                      onChange={(e) => setProdHasMultipleSizes(e.target.checked)}
                      className="w-5 h-5 text-[#006437] border-emerald-300 rounded focus:ring-[#006437] cursor-pointer"
                    />
                  </div>
                  
                  {prodHasMultipleSizes && (
                    <div className="space-y-3.5">
                      <span className="block text-xs text-emerald-800 font-semibold leading-normal">
                        এখানে আপনি পণ্যের বিভিন্ন ওজনের (যেমন: 0.5 KG, 1 KG) জন্য আলাদা বিক্রয় মূল্য ও পূর্বের মূল্য সেট করতে পারেন।
                      </span>
                      
                      {/* Sizes List view */}
                      {prodSizesList.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {prodSizesList.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 text-xs font-bold text-gray-700 shadow-xs">
                              <span className="font-extrabold text-[#006437] bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0 text-xs">{item.size}</span>
                              <div className="flex items-center gap-2.5 ml-auto">
                                <span className="text-gray-900 font-bold">বিক্রয়: ৳{item.price}</span>
                                {item.originalPrice ? (
                                  <span className="text-red-500 line-through text-[11px]">পূর্বের: ৳{item.originalPrice}</span>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => setProdSizesList(prodSizesList.filter((_, i) => i !== idx))}
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
                              value={sizeVal}
                              onChange={(e) => setSizeVal(e.target.value)}
                              placeholder="যেমন: 1 KG"
                              className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">বিক্রয় মূল্য (৳)</label>
                            <input
                              type="number"
                              value={sizePriceVal}
                              onChange={(e) => setSizePriceVal(e.target.value !== '' ? Number(e.target.value) : '')}
                              placeholder="যেমন: ৯৫০"
                              className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">আগের মূল্য (৳)</label>
                            <input
                              type="number"
                              value={sizeOrigVal}
                              onChange={(e) => setSizeOrigVal(e.target.value !== '' ? Number(e.target.value) : '')}
                              placeholder="যেমন: ১০০০"
                              className="w-full px-2.5 py-2 text-xs md:text-sm rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const sVal = sizeVal.trim();
                            if (!sVal || !sizePriceVal || Number(sizePriceVal) <= 0) {
                              onNotify('সাইজের নাম ও সঠিক বিক্রয় মূল্য দিতে হবে!', 'error');
                              return;
                            }
                            const item = {
                              size: sVal,
                              price: Number(sizePriceVal),
                              originalPrice: sizeOrigVal ? Number(sizeOrigVal) : undefined
                            };
                            setProdSizesList([...prodSizesList, item]);
                            setSizeVal('');
                            setSizePriceVal('');
                            setSizeOrigVal('');
                          }}
                          className="w-full bg-[#006437] hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-2 px-3 rounded-lg text-xs md:text-sm transition-all shadow-xs cursor-pointer"
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
                    {prodImages.map((imgUrl, imgIdx) => {
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
                                isPrimary ? 'bg-[#006437]' : isHover ? 'bg-orange-500' : 'bg-gray-600'
                              }`}>
                                {imgIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...prodImages];
                                  updated[imgIdx] = '';
                                  setProdImages(updated);
                                }}
                                className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold cursor-pointer transition-all shadow-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full p-0.5 gap-1 bg-white">
                              <span className={`text-[7px] font-black select-none px-1 rounded-xs ${
                                isPrimary ? 'bg-emerald-50 text-[#006437] font-extrabold' : isHover ? 'bg-orange-50 text-orange-700 font-extrabold' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {isPrimary ? 'প্রধান' : isHover ? 'হোভার' : `${imgIdx + 1}নং`}
                              </span>
                              
                              <div className="flex gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`seller-add-file-input-${imgIdx}`)?.click()}
                                  className="p-0.5 hover:bg-emerald-50 rounded text-[#006437] transition-colors cursor-pointer"
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
                                id={`seller-add-file-input-${imgIdx}`}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    compressAndSetImage(file, (base64) => {
                                      const updated = [...prodImages];
                                      updated[imgIdx] = base64;
                                      setProdImages(updated);
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

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                    className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-extrabold text-white bg-[#006437] hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    {isEditModalOpen ? 'Save Changes' : 'Submit Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    if (imageSelectorTarget.startsWith('product-add-slot-')) {
                      const idx = parseInt(imageSelectorTarget.replace('product-add-slot-', ''), 10);
                      const newImgs = [...prodImages];
                      newImgs[idx] = path;
                      setProdImages(newImgs);
                    } else if (imageSelectorTarget.startsWith('product-edit-slot-')) {
                      const idx = parseInt(imageSelectorTarget.replace('product-edit-slot-', ''), 10);
                      const newImgs = [...prodImages];
                      newImgs[idx] = path;
                      setProdImages(newImgs);
                    }
                    setImageSelectorTarget(null);
                  }}
                  className="bg-white p-3 rounded-2xl border border-gray-100 hover:border-[#006437] hover:shadow-lg transition-all cursor-pointer flex flex-col items-center gap-2 text-center group animate-fadeIn"
                >
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-100 relative">
                    <img referrerPolicy="no-referrer" src={img.path} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-[11px] font-extrabold text-gray-700 group-hover:text-[#006437] transition-colors line-clamp-1">{img.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Print Memo Modal */}
      {selectedMemoOrder !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fade-in print:bg-white print:p-0 print:static print:block print:z-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-scale-up print:shadow-none print:border-0 print:max-h-none print:bg-white print:static print:block">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50 no-print">
              <p className="text-gray-800 font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-5 h-5 text-orange-500" />
                <span>অর্ডার মেমো ও প্যাকেজিং লেবেল</span>
              </p>
              <button
                onClick={() => setSelectedMemoOrder(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Memo Body */}
            <div className="p-6 overflow-y-auto flex-grow bg-gray-50/50 space-y-6 print:p-0 print:bg-white print:overflow-visible">
              
              {/* This is the printed area */}
              <div 
                id="print-memo-area" 
                className="bg-white border border-stone-250 rounded-2xl p-6 md:p-8 shadow-xs space-y-6 print:border-0 print:shadow-none print:p-0"
              >
                {/* Print Header */}
                <div className="flex justify-between items-start border-b border-stone-200 pb-5">
                  <div>
                    <h2 className="text-lg font-black text-[#006437]">{loggedInUser.shopName || 'মার্কেটপ্লেস উদ্যোক্তা'}</h2>
                    <p className="text-[11px] text-stone-500 font-bold mt-1">ঠিকানা: {loggedInUser.address || 'বাংলাদেশ'}</p>
                    <p className="text-[11px] text-stone-500 font-bold">ফোন: {loggedInUser.phone || 'হেল্পলাইন'}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-lg border border-orange-100 print:hidden">
                      অফিশিয়াল মেমো
                    </span>
                    <h3 className="text-sm font-black text-slate-800 mt-2">অর্ডার আইডি: #{selectedMemoOrder.id}</h3>
                    <p className="text-[10px] text-stone-400 font-bold mt-0.5">তারিখ: {new Date(selectedMemoOrder.createdAt).toLocaleString('bn-BD')}</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <div>
                    <span className="text-[10px] text-stone-400 font-black block uppercase tracking-wider">প্রাপক / গ্রাহক</span>
                    <span className="text-xs font-black text-slate-800 block mt-1">{selectedMemoOrder.customerName}</span>
                    <span className="text-[11px] text-stone-500 font-bold block mt-0.5">ফোন: {selectedMemoOrder.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-black block uppercase tracking-wider">ডেলিভারি ঠিকানা</span>
                    <span className="text-xs font-bold text-slate-700 block mt-1 leading-relaxed">{selectedMemoOrder.deliveryAddress}</span>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 border-b border-stone-100 pb-1 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-stone-500" />
                    <span>আইটেম তালিকা (আপনার পণ্যসমূহ)</span>
                  </h4>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 font-black">
                        <th className="p-2">পণ্য</th>
                        <th className="p-2 text-center">পরিমাণ</th>
                        <th className="p-2 text-right">মূল্য</th>
                        <th className="p-2 text-right">মোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-150 font-bold text-slate-700">
                      {selectedMemoOrder.items
                        .filter(item => sellerProducts.some(sp => sp.id === item.productId) || item.sellerId === loggedInUser.id)
                        .map((item, idx) => (
                          <tr key={idx} className="border-b border-stone-100">
                            <td className="p-2 flex items-center gap-2">
                              <img src={item.image} alt={item.productName} className="w-6 h-6 rounded object-cover border shrink-0 print:hidden" />
                              <span>{item.productName}</span>
                            </td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">{item.price}৳</td>
                            <td className="p-2 text-right">{item.price * item.quantity}৳</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end border-t border-stone-100 pt-4">
                  <div className="w-64 space-y-1.5 text-right text-xs">
                    <div className="flex justify-between font-black text-slate-800">
                      <span>সাব-টোটাল:</span>
                      <span>
                        {selectedMemoOrder.items
                          .filter(item => sellerProducts.some(sp => sp.id === item.productId) || item.sellerId === loggedInUser.id)
                          .reduce((sum, item) => sum + item.price * item.quantity, 0)}৳
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-400 font-semibold text-[10px]">
                      <span>পেমেন্ট মাধ্যম:</span>
                      <span className="uppercase text-slate-700 font-bold">{selectedMemoOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Courier Notes */}
                {selectedMemoOrder.preferredCourier && (
                  <div className="bg-[#006437]/5 border border-[#006437]/10 p-3 rounded-xl">
                    <p className="text-[10px] text-[#006437] font-black">কুরিয়ার সংক্রান্ত নোট:</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedMemoOrder.preferredCourier}</p>
                  </div>
                )}

                {/* DASHED SHIPPING LABEL CARD FOR PACKAGING */}
                <div className="border-2 border-dashed border-stone-300 rounded-2xl p-5 space-y-3.5 bg-stone-50/50 select-none page-break-inside-avoid">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <span className="text-[10px] font-black text-[#006437] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>প্যাকেজিং ও শিপিং লেবেল</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-stone-400">মেমো নং: {selectedMemoOrder.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-xs text-left">
                    {/* Recipient Details */}
                    <div className="border-r border-stone-200 pr-4 space-y-1">
                      <span className="text-[9px] text-red-500 font-black uppercase tracking-wider block">প্রাপক (To)</span>
                      <p className="font-black text-slate-800 text-sm">{selectedMemoOrder.customerName}</p>
                      <p className="font-black text-slate-700">{selectedMemoOrder.customerPhone}</p>
                      <p className="text-stone-500 font-bold leading-relaxed">{selectedMemoOrder.deliveryAddress}</p>
                    </div>

                    {/* Sender Details */}
                    <div className="space-y-1 pl-2">
                      <span className="text-[9px] text-[#006437] font-black uppercase tracking-wider block">প্রেরক (From)</span>
                      <p className="font-black text-[#006437]">{loggedInUser.shopName || 'উদ্যোক্তা মার্কেটপ্লেস'}</p>
                      <p className="text-stone-500 font-bold">ফোন: {loggedInUser.phone}</p>
                      <p className="text-stone-400 font-semibold leading-relaxed">ঠিকানা: {loggedInUser.address || 'বাংলাদেশ'}</p>
                    </div>
                  </div>
                </div>

                {/* Footer terms */}
                <div className="text-center pt-4 border-t border-stone-100">
                  <p className="text-[9px] text-stone-400 font-semibold">আমাদের সাথে থাকার জন্য আপনাকে অনেক ধন্যবাদ। বিশুদ্ধতায় ভরপুর হোক আপনার জীবন।</p>
                </div>

              </div>
            </div>

            {/* Modal Footer (Buttons) */}
            <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-slate-50/50 no-print">
              <button
                type="button"
                onClick={() => setSelectedMemoOrder(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-extrabold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>মেমো ও লেবেল প্রিন্ট করুন</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Custom Style to Hide rest of page during print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-memo-area, #print-memo-area * {
            visibility: visible;
          }
          #print-memo-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 0px !important;
            margin: 0px !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          /* Prevent page break inside cards */
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
