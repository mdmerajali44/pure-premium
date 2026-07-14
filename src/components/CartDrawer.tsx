/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CartItem } from '../types';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, unit?: string) => void;
  onRemoveItem: (productId: string, unit?: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[100] cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[100] flex flex-col h-full"
            id="cart-drawer-panel"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">আপনার শপিং কার্ট</h2>
                  <p className="text-xs text-gray-500">মোট আইটেম: {cartItems.length} টি</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-24 h-24 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                  <h3 className="font-bold text-gray-700 text-lg mb-1">কার্টটি সম্পূর্ণ খালি!</h3>
                  <p className="text-sm text-gray-400 max-w-xs mb-6">
                    আমাদের তাজা আম, খাঁটি মধু ও পুষ্টিকর খাবারগুলো কার্টে যোগ করুন।
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    কেনাকাটা শুরু করুন
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.div
                    key={`${item.product.id}-${item.product.unit || 'default'}`}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex gap-3 bg-gray-50/50 hover:bg-gray-50 p-3 rounded-2xl border border-gray-100 transition-all group"
                  >
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-gray-100 shrink-0 relative">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-400 mb-1">
                          পরিমাণ: {item.product.unit} | স্টক: {item.product.stock} টি
                        </p>
                      </div>

                      {/* Controls and Price */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 border border-gray-200 bg-white rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.product.unit)}
                            className="p-1 hover:bg-gray-100 text-gray-600 rounded-md transition-colors disabled:opacity-35 cursor-pointer"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.product.unit)}
                            className="p-1 hover:bg-gray-100 text-gray-600 rounded-md transition-colors disabled:opacity-35 cursor-pointer"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price & Delete */}
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-800 text-sm">
                            ৳{item.product.price * item.quantity}
                          </span>
                          <button
                            onClick={() => onRemoveItem(item.product.id, item.product.unit)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors opacity-80 hover:opacity-100 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-white space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>পণ্যের উপ-মোট (Subtotal)</span>
                    <span className="font-semibold text-gray-800">৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>ডেলিভারি চার্জ (হোম ডেলিভারি)</span>
                    <span className="text-orange-600 font-medium">পরবর্তী ধাপে হিসাব করা হবে</span>
                  </div>
                  <div className="border-t border-dashed border-gray-100 my-2 pt-2 flex justify-between text-gray-800 font-extrabold text-base">
                    <span>মোট টাকা</span>
                    <span className="text-orange-600 text-lg">৳{subtotal}</span>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm"
                >
                  <span>অর্ডার করতে এগিয়ে যান</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-[10px] text-gray-400 text-center">
                  * অগ্রীম পেমেন্ট ছাড়াই অর্ডার নিশ্চিত করতে পারেন। আমাদের ডেলিভারি টিম পণ্য আপনার দোরগোড়ায় পৌঁছে দেবে।
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
