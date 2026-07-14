/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, sortProductSizes } from '../types';
import { Star, ShoppingCart, ShoppingBag, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product) => void;
  onSelect: (product: Product) => void;
  onDirectBuy: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onRequestProduct?: (product: Product) => void;
  onViewImage?: (url: string) => void;
  isCompact?: boolean;
  sellerName?: string;
}

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
  
  // Clean fallback
  const sanitized = name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
  return sanitized ? sanitized.substring(0, 15) : `ML-${id.toUpperCase()}`;
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

const getCategoryLabel = (product: Product) => {
  let categoryDisplayName = product.category;
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
        const slug = slugMap[product.category];
        if (slug && config.categoryNames[slug]) {
          categoryDisplayName = config.categoryNames[slug];
        }
      }
    }
  } catch (e) {
    console.error("Failed to parse site config in ProductCard", e);
  }

  // If there's an explicit tagline, use it!
  if (product.tagline && product.tagline.trim() !== '') {
    const tag = product.tagline.trim();
    if (tag.includes('আমাদের উৎপাদিত') || tag.includes('আমাদের আমদানিকৃত')) {
      return tag;
    }
    const suffix = product.category === 'খেজুর' ? 'আমাদের আমদানিকৃত' : 'আমাদের উৎপাদিত';
    return `${categoryDisplayName}, ${tag}, ${suffix}`;
  }

  // If the description is already short and contains commas (like default products)
  const desc = product.description || '';
  if (desc.includes(',') && desc.length < 60) {
    return desc;
  }

  // Otherwise, construct a beautiful, short tagline dynamically from category and clean name
  let cleanName = product.name;
  if (cleanName.includes('(')) {
    cleanName = cleanName.split('(')[0].trim();
  }
  
  const suffix = product.category === 'খেজুর' ? 'আমাদের আমদানিকৃত' : 'আমাদের উৎপাদিত';
  return `${categoryDisplayName}, ${cleanName}, ${suffix}`;
};

export default function ProductCard({ product, onAddToCart, onSelect, onDirectBuy, onQuickView, onRequestProduct, onViewImage, isCompact = false, sellerName }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const sizeOptions = getProductSizes(product.id, product);
  const buttonLabel = sizeOptions.length > 1 ? "সিলেক্ট করুন" : "কার্টে যোগ করুন";
  const categoriesLabel = getCategoryLabel(product);

  const secondImage = product.images && Array.isArray(product.images) && product.images.length > 1
    ? product.images[1]
    : null;

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-gray-100 transition-all duration-300 flex flex-col h-full overflow-hidden relative hover:border-[#ff9800] hover:shadow-md cursor-pointer"
      id={`product-card-${product.id}`}
    >
      {/* Badges Overlay */}
      {product.stock === 0 ? (
        <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
          Stock Out
        </div>
      ) : product.badge === 'new' ? (
        <div className="absolute top-4 left-4 z-10 bg-[#00b050] text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase shadow-xs">
          নতুন
        </div>
      ) : product.badge === 'restocked' ? (
        <div className="absolute top-4 left-4 z-10 bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase shadow-xs">
          Restocked
        </div>
      ) : discount > 0 ? (
        <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-[#ffcc00] text-black flex items-center justify-center text-xs font-black shadow-xs">
          -{discount}%
        </div>
      ) : (
        (product.isFeatured || ['p2', 'p3', 'p8', 'm3'].includes(product.id)) && (
          <div className="absolute top-4 left-4 z-10 bg-[#00b050] text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase shadow-xs">
            NEW
          </div>
        )
      )}

      {/* Magnifying Glass Quick View Button (Top Right) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuickView(product);
        }}
        className="absolute top-4 right-4 z-20 w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-xs hover:bg-orange-50 active:scale-95 transition-opacity opacity-0 group-hover:opacity-100 duration-200 cursor-pointer text-slate-800"
        title="Quick View"
      >
        <Search className="w-5 h-5 text-slate-800 stroke-[2.25]" />
      </button>

      {/* Product Image Section */}
      <div 
        className={`w-full bg-[#f7f8f9] overflow-hidden relative flex items-center justify-center border-b border-gray-100 ${
          isCompact ? 'h-36 sm:h-40 md:h-44' : 'aspect-square'
        }`}
      >
        <img 
          src={product.image} 
          alt={product.name}
          className={`w-full h-full object-cover mx-auto group-hover:scale-105 transition-all duration-500 ${
            secondImage ? 'group-hover:opacity-0' : ''
          }`}
          referrerPolicy="no-referrer"
        />
        {secondImage && (
          <img 
            src={secondImage} 
            alt={`${product.name} - View 2`}
            className="absolute inset-0 w-full h-full object-cover mx-auto scale-100 group-hover:scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Product Details Section */}
      <div className={`${isCompact ? 'p-3 pt-1.5 pb-2.5' : 'p-4 pt-2'} flex flex-col flex-grow text-center items-center`}>
        {/* Sizes Badges */}
        <div className={`flex items-center justify-center gap-1.5 ${isCompact ? 'mb-1' : 'mb-2'}`}>
          {sizeOptions.map((size) => (
            <span 
              key={size} 
              className="border border-gray-100 bg-gray-50 rounded-md px-2 py-0.5 text-[9px] md:text-[10px] font-extrabold text-gray-500 whitespace-nowrap shadow-3xs"
            >
              {size}
            </span>
          ))}
        </div>

        {/* Product Title */}
        <h3 
          className={`font-extrabold text-[#006437] text-sm md:text-[15px] leading-normal hover:text-orange-500 hover:underline cursor-pointer transition-colors line-clamp-1 text-center w-full ${
            isCompact ? 'mb-0.5 pt-0.5 pb-0.5' : 'pt-1 pb-1 mb-1'
          }`}
          onClick={() => onSelect(product)}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Seller/Entrepreneur Badge */}
        {sellerName && (
          <div className="mb-1.5 bg-emerald-50 text-[#006437] text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100/50 flex items-center gap-1.5 select-none shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>উদ্যোক্তা: {sellerName}</span>
          </div>
        )}

        {/* Categories / Tags Subtitle */}
        <p className={`text-[10px] md:text-[11px] text-gray-400 font-bold leading-normal line-clamp-1 h-5 py-0.5 text-center truncate w-full ${
          isCompact ? 'mb-1' : 'mb-1.5'
        }`} title={categoriesLabel}>
          {categoriesLabel}
        </p>

        {/* SKU & Rating line */}
        <div className={`text-[9px] font-mono text-gray-400 font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 ${
          isCompact ? 'mb-1.5' : 'mb-2'
        }`}>
          <span>SKU: {getProductSKU(product.id, product.name, product)}</span>
          <span className="text-gray-200">|</span>
          <div className="flex items-center gap-0.5 text-amber-500">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Pricing Block */}
        <div className={`flex items-baseline justify-center gap-1.5 font-black mt-auto ${
          isCompact ? 'mb-2.5' : 'mb-3.5'
        }`}>
          <span className="text-orange-600 text-base md:text-lg">
            {product.price}৳
          </span>
          {product.originalPrice && (
            <span className="text-xs text-red-500 line-through font-medium">
              {product.originalPrice}৳
            </span>
          )}
        </div>

        {/* Animatable Hover Action Button (Solid Forest Green to Vibrant Orange Cart transition) */}
        <motion.button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (product.stock === 0) {
              onRequestProduct?.(product);
              return;
            }
            if (sizeOptions.length > 1) {
              onSelect(product);
            } else {
              onAddToCart(product);
            }
          }}
          className="w-full relative overflow-hidden text-white text-xs md:text-sm font-bold py-2.5 px-3 rounded-lg text-center shadow-xs cursor-pointer mb-1 flex items-center justify-center h-10 border-0"
          animate={{
            backgroundColor: product.stock === 0 
              ? (isHovered ? "#be123c" : "#e11d48") 
              : isHovered 
                ? "#ff9800" 
                : "#006437"
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {product.stock === 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Text sliding out to the top on hover */}
              <motion.div
                className="absolute flex items-center gap-1.5 whitespace-nowrap"
                initial={false}
                animate={{
                  y: isHovered ? -35 : 0,
                  opacity: isHovered ? 0 : 1
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <span>রিকুয়েস্ট করুন</span>
              </motion.div>

              {/* Request icon/text sliding in from bottom to center on hover */}
              <motion.div
                className="absolute flex items-center justify-center text-xs text-white"
                initial={{ y: 35, opacity: 0 }}
                animate={{
                  y: isHovered ? 0 : 35,
                  opacity: isHovered ? 1 : 0
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <span>শীঘ্রই রিস্টক - রিকুয়েস্ট</span>
              </motion.div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Text sliding out to the top on hover */}
              <motion.div
                className="absolute flex items-center gap-1.5 whitespace-nowrap"
                initial={false}
                animate={{
                  y: isHovered ? -35 : 0,
                  opacity: isHovered ? 0 : 1
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <span>{buttonLabel}</span>
              </motion.div>

              {/* Shopping Cart Icon sliding in from bottom to center on hover */}
              <motion.div
                className="absolute flex items-center justify-center"
                initial={{ y: 35, opacity: 0 }}
                animate={{
                  y: isHovered ? 0 : 35,
                  opacity: isHovered ? 1 : 0
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <ShoppingCart className="w-5 h-5 text-white stroke-[2.5]" />
              </motion.div>
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}

