/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartItem, Order, OrderStatus } from '../types';
import { DISTRICTS } from '../data';
import { X, Phone, User, MapPin, CheckCircle, Copy, Check, ShoppingBag, CreditCard, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onPlaceOrder: (orderData: {
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
  }) => void;
  siteConfig?: any;
  currentUser?: any;
  orders?: Order[];
}


const BANGLADESH_DATA: Record<string, { districts: Record<string, string[]> }> = {
  'ঢাকা': {
    districts: {
      'ঢাকা': ['মিরপুর', 'গুলশান', 'উত্তরা', 'ধানমন্ডি', 'মোহাম্মদপুর', 'বাড্ডা', 'খিলগাঁও', 'তেজগাঁও', 'লালবাগ', 'মতিঝিল', 'রমনা', 'ডেমরা', 'পল্টন', 'সাভার', 'ধামরাই', 'কেরানীগঞ্জ', 'দোহার', 'নবাবগঞ্জ'],
      'গাজীপুর': ['গাজীপুর সদর', 'কালীগঞ্জ', 'কালিয়াকৈর', 'কাপাসিয়া', 'শ্রীপুর'],
      'নারায়ণগঞ্জ': ['নারায়ণগঞ্জ সদর', 'বন্দর', 'আড়াইহাজার', 'রূপগঞ্জ', 'সোনারগাঁও'],
      'নরসিংদী': ['নরসিংদী সদর', 'বেলাবো', 'মনোহরদী', 'পলাশ', 'রায়পুরা', 'শিবপুর'],
      'মানিকগঞ্জ': ['মানিকগঞ্জ সদর', 'সিংগাইর', 'শিবালয়', 'সাটুরিয়া', 'হরিরামপুর', 'ঘিওর', 'দৌলতপুর'],
      'মুन्সিগঞ্জ': ['মুন্সিগঞ্জ সদর', 'টংগিবাড়ী', 'শ্রীনগর', 'লৌহজং', 'গজারিয়া', 'সিরাজদিখান'],
      'ফরিদপুর': ['ফরিদপুর সদর', 'মধুখালী', 'বোয়ালমারী', 'আলফাডাঙ্গা', 'সালথা', 'ভাঙ্গা', 'সদরপুর', 'চরভদ্রাসন', 'নগরকান্দা'],
      'গোপালগঞ্জ': ['গোপালগঞ্জ সদর', 'টুঙ্গিপাড়া', 'কোটালীপাড়া', 'কাশিয়ানী', 'মুকসুদপুর'],
      'মাদারীপুর': ['মাদারীপুর সদর', 'শিবচর', 'কালকিনি', 'রাজৈর'],
      'শরীয়তপুর': ['শরীয়তপুর সদর', 'ডামুড্যা', 'নড়িয়া', 'জাজিরা', 'ভেদরগঞ্জ', 'গোসাইরহাট'],
      'রাজবাড়ী': ['রাজবাড়ী সদর', 'গোয়ালন্দ', 'পাংশা', 'বালিয়াকান্দি', 'কালুখালী'],
      'টাঙ্গাইল': ['টাঙ্গাইল সদর', 'কালিহাতী', 'ঘাটাইল', 'বাসাইল', 'মির্জাপুর', 'দেলদুয়ার', 'নাগরপুর', 'সখিপুর', 'মধুপুর', 'ধনবাড়ী', 'গোপালপুর', 'ভূঞাপুর'],
      'কিশোরগঞ্জ': ['কিশোরগঞ্জ সদর', 'হোসেনপুর', 'করিমগঞ্জ', 'তাড়াইল', 'পাকুন্দিয়া', 'কটিয়াদী', 'ভৈরব', 'নিকলী', 'বাজিতপুর', 'ইটনা', 'মিঠামইন', 'অষ্টগ্রাম', 'কুলিয়ারচর']
    }
  },
  'রাজশাহী': {
    districts: {
      'রাজশাহী': ['বোয়ালিয়া', 'রাজপাড়া', 'চন্দ্রিমা', 'মতিহার', 'শাহ মখদুম', 'পবা', 'গোদাগাড়ী', 'তানোর', 'মোহনপুর', 'বাগমারা', 'দুর্গাপুর', 'পুঠিয়া', 'চারঘাট', 'বাঘা'],
      'সিরাজগঞ্জ': ['সিরাজগঞ্জ সদর', 'বেলকুচি', 'চৌহালী', 'কামারখন্দ', 'কাজীপুর', 'রায়গঞ্জ', 'শাহজাদপুর', 'তাড়াশ', 'উল্লাপাড়া'],
      'পাবনা': ['পাবনা সদর', 'ঈশ্বরদী', 'চাটমোহর', 'আটঘরিয়া', 'বেড়া', 'ভাঙ্গুড়া', 'ফরিদপুর', 'সুজানগর', 'সাঁথিয়া'],
      'বগুড়া': ['বগুড়া সদর', 'আদমদীঘি', 'শেরপুর', 'শিবগঞ্জ', 'ধুনট', 'গাবতলী', 'দুপচাঁচিয়া', 'নন্দীগ্রাম', 'সারিয়াকান্দি', 'সোনাতলা', 'শাজাহানপুর', 'কাহালু'],
      'নাটোর': ['নাটোর সদর', 'বাগাতিপাড়া', 'বড়াইগ্রাম', 'লালপুর', 'সিংড়া', 'গুরুদাসপুর', 'নলডাঙ্গা'],
      'নওগাঁ': ['নওগাঁ সদর', 'মহাদেবপুর', 'আত্রাই', 'বদলগাছী', 'ধামইরহাট', 'পত্নীতলা', 'পোরশা', 'সাপাহার', 'নিয়ামতপুর', 'রানীনগর', 'মান্দা'],
      'চাঁপাইনবাবগঞ্জ': ['চাঁপাইনবাবগঞ্জ সদর', 'শিবগঞ্জ', 'গোমস্তাপুর', 'নাচোল', 'ভোলাহাট'],
      'জয়পুরহাট': ['জয়পুরহাট সদর', 'পাঁচবিবি', 'আক্কেলপুর', 'ক্ষেতলাল', 'কালাই']
    }
  },
  'চট্টগ্রাম': {
    districts: {
      'চট্টগ্রাম': ['কোতোয়ালী', 'ডবলমুরিং', 'পাঁচলাইশ', 'হালিশহর', 'বন্দর', 'পাহাড়তলী', 'পতেঙ্গা', 'হাটহাজারী', 'পটিয়া', 'রাঙ্গুনিয়া', 'সীতাকুণ্ড', 'মিরসরাই', 'বোয়ালখালী', 'বাঁশখালী', 'আনোয়ারা', 'সন্দ্বীপ', 'সাতকানিয়া', 'লোহাগাড়া', 'চন্দনাইশ', 'ফটিকছড়ি', 'রাউজান'],
      'কক্সবাজার': ['কক্সবাজার সদর', 'চকরিয়া', 'মহেশখালী', 'টেকনাফ', 'উখিয়া', 'রামু', 'পেকুয়া', 'কুতুবদিয়া'],
      'কুমিল্লা': ['কুমিল্লা সদর', 'চৌদ্দগ্রাম', 'লাকসাম', 'বরুড়া', 'চান্দিনা', 'দেবিদ্বার', 'মুরাদনগর', 'দাউদকান্দি', 'হোমনা', 'বুড়িচং', 'ব্রাহ্মণপাড়া', 'মনোহরগঞ্জ', 'মেঘনা', 'তিতাস', 'নাঙ্গলকোট', 'লালমাই'],
      'ফেনী': ['ফেনী সদর', 'দাগনভূঞা', 'ছাগলনাইয়া', 'সোনাগাজী', 'পরশুরাম', 'ফুলগাজী'],
      'নোয়াখালী': ['নোয়াখালী সদর', 'বেগমগঞ্জ', 'চাটখিল', 'সেনবাগ', 'কোম্পানীগঞ্জ', 'হাতিয়া', 'সুবর্ণচর', 'সোনাইমুড়ী', 'কবিরহাট'],
      'লক্ষ্মীপুর': ['লক্ষ্মীপুর সদর', 'রায়পুর', 'রামগঞ্জ', 'রামগতি', 'কমলনগর'],
      'ব্রাহ্মণবাড়িয়া': ['ব্রাহ্মণবাড়িয়া সদর', 'কসবা', 'আখাউড়া', 'আশুগঞ্জ', 'বাঞ্ছারামপুর', 'নবীনগর', 'সরাইল', 'নাসিরনগর', 'বিজয়নগর'],
      'চাঁদপুর': ['চাঁদপুর সদর', 'হাজীগঞ্জ', 'শাহরাস্তি', 'ফরিদগঞ্জ', 'হাইমচর', 'কচুয়া', 'মতলব উত্তর', 'মতলব দক্ষিণ'],
      'রাঙ্গামাটি': ['রাঙ্গামাটি সদর', 'কাপ্তাই', 'কাউখালী', 'বাঘাইছড়ি', 'লংগদু', 'নানিয়ারচর', 'রাজস্থলী', 'বিলাইছড়ি', 'জুরাছড়ি'],
      'বান্দরবান': ['বান্দরবান সদর', 'রুমা', 'থানচি', 'রোয়াংছড়ি', 'লামা', 'আলীকদম', 'নাইক্ষ্যংছড়ি'],
      'খাগড়াছড়ি': ['খাগড়াছড়ি সদর', 'দীঘিনালা', 'পানছড়ি', 'মহালছড়ি', 'মাটিরাঙ্গা', 'গুইমারা', 'রামগড়', 'মানিকছড়ি', 'লক্ষ্মীছড়ি']
    }
  },
  'খুলনা': {
    districts: {
      'খুলনা': ['খুলনা সদর', 'দৌলতপুর', 'খালিশপুর', 'সোনাডাঙ্গা', 'ডুমুরিয়া', 'রূপসা', 'ফুলতলা', 'বটিয়াঘাটা', 'পাইকগাছা', 'কয়রা', 'দাকোপ', 'তেরখাদা'],
      'যশোর': ['যশোর সদর', 'চৌগাছা', 'ঝিকরগাছা', 'বাঘারপাড়া', 'অভয়নগর', 'মনিরামপুর', 'কেশবপুর', 'শার্শা'],
      'সাতক্ষীরা': ['সাতক্ষীরা সদর', 'কলারোয়া', 'তালা', 'দেবহাটা', 'কালীগঞ্জ', 'আশাশুনি', 'শ্যামনগর'],
      'বাগেরহাট': ['বাগেরহাট সদর', 'চিতলমারী', 'ফকিরহাট', 'মোল্লাহাট', 'কচুয়া', 'রামপাল', 'মোংলা', 'মোড়েলগঞ্জ', 'শরণখোলা'],
      'কুষ্টিয়া': ['কুষ্টিয়া সদর', 'কুমারখালী', 'খোকসা', 'মিরপুর', 'ভেড়ামারা', 'দৌলতপুর'],
      'মেহেরপুর': ['মেহেরপুর সদর', 'মুজিবনগর', 'গাংনী'],
      'চুয়াডাঙ্গা': ['চুয়াডাঙ্গা সদর', 'আলমডাঙ্গা', 'দামুড়হুদা', 'জীবননগর'],
      'ঝিনাইদহ': ['ঝিনাইদহ সদর', 'শৈলকুপা', 'হরিণাকুণ্ডু', 'কালীগঞ্জ', 'কোটচাঁদপুর', 'মহেশপুর'],
      'মাগুরা': ['মাগুরা সদর', 'শ্রীপুর', 'শালিখা', 'মহম্মদপুর'],
      'নড়াইল': ['নড়াইল সদর', 'লোহাগড়া', 'কালিয়া']
    }
  },
  'বরিশাল': {
    districts: {
      'বরিশাল': ['বরিশাল সদর', 'বাকেরগঞ্জ', 'বাবুগঞ্জ', 'উজিরপুর', 'বানারীপাড়া', 'গৌরনদী', 'মোলাদী', 'হিজলা', 'মেহেন্দিগঞ্জ', 'আগৈলঝাড়া'],
      'পটুয়াখালী': ['পটুয়াখালী সদর', 'বাউফল', 'গলাচিপা', 'দশমিনা', 'কলাপাড়া', 'মির্জাগঞ্জ', 'দুমকি', 'রাঙ্গাবালী'],
      'ভোলা': ['ভোলা সদর', 'বোরহানউদ্দিন', 'চরফ্যাশন', 'দৌলতখান', 'লালমোহন', 'তজুমদ্দিন', 'মনপুরা'],
      'পিরোজপুর': ['পিরোজপুর সদর', 'কাউখালী', 'ভান্ডারিয়া', 'মঠবাড়িয়া', 'নেছারাবাদ', 'নাজিরপুর', 'জিয়ানগর'],
      'বরগুনা': ['বরগুনা সদর', 'আমতলী', 'পাথরঘাটা', 'বামনা', 'বেতাগী', 'তালতলী'],
      'ঝালকাঠি': ['ঝালকাঠি সদর', 'নলছিটি', 'রাজাপুর', 'কাঠালিয়া']
    }
  },
  'সিলেট': {
    districts: {
      'সিলেট': ['সিলেট সদর', 'বিয়ানীবাজার', 'গোলাপগঞ্জ', 'ফেঞ্চুগঞ্জ', 'বালাগঞ্জ', 'বিশ্বনাথ', 'গোয়াইনঘাট', 'জৈন্তাপুর', 'কানাইঘাট', 'জকিগঞ্জ', 'কোম্পানীগঞ্জ', 'দক্ষিণ সুরমা', 'ওসমানীনগর'],
      'মৌলভীবাজার': ['মৌলভীবাজার সদর', 'শ্রীমঙ্গল', 'রাজনগর', 'কুলাউড়া', 'বড়লেখা', 'কমলগঞ্জ', 'জুড়ী'],
      'হবিগঞ্জ': ['হবিগঞ্জ সদর', 'নবীগঞ্জ', 'বাহুবল', 'আজমিরীগঞ্জ', 'বানিয়াচং', 'লাখাই', 'চুনারুঘাট', 'মাধবপুর', 'শায়েস্তাগঞ্জ'],
      'সুনামগঞ্জ': ['সুনামগঞ্জ সদর', 'ছাতক', 'জগন্নাথপুর', 'দিরাই', 'শাল্লা', 'ধর্মপাশা', 'জামালগঞ্জ', 'তাহিরপুর', 'বিশ্বম্ভরপুর', 'দোয়ারাবাজার', 'দক্ষিণ সুনামগঞ্জ']
    }
  },
  'রংপুর': {
    districts: {
      'রংপুর': ['রংপুর সদর', 'মিঠাপুকুর', 'পীরগঞ্জ', 'পীরগাছা', 'কাউনিয়া', 'তারাগঞ্জ', 'বদরগঞ্জ', 'গঙ্গাচড়া'],
      'দিনাজপুর': ['দিনাজপুর সদর', 'বিরল', 'বোচাগঞ্জ', 'কাহারোল', 'বীরগঞ্জ', 'চিরিরবন্দর', 'পার্বতীপুর', 'ফুলবাড়ী', 'বিরামপুর', 'নবাবগঞ্জ', 'হাকিমপুর', 'ঘোড়াঘাট', 'খানসামা'],
      'কুড়িগ্রাম': ['কুড়িগ্রাম সদর', 'উলিপুর', 'চিলমারী', 'রুমারী', 'চর রাজিবপুর', 'নাগেশ্বরী', 'ভুরুঙ্গামারী', 'ফুলবাড়ী', 'রাজারহাট'],
      'গাইবান্ধা': ['গাইবান্ধা সদর', 'সাদুল্লাপুর', 'পলাশবাড়ী', 'সুন্দরগঞ্জ', 'সাঘাটা', 'ফুলছড়ি', 'গোবিন্দগঞ্জ'],
      'নীলফামারী': ['নীলফামারী সদর', 'সৈয়দপুর', 'ডোমার', 'ডিমলা', 'জলঢাকা', 'কিশোরগঞ্জ'],
      'লালমনিরহাট': ['লালমনিরহাট সদর', 'কালীগঞ্জ', 'আদিতমারী', 'হাতীবান্ধা', 'পাটগ্রাম'],
      'পঞ্চগড়': ['পঞ্চগড় সদর', 'তেঁতুলিয়া', 'দেবীগঞ্জ', 'বোদা', 'আটোয়ারী'],
      'ঠাকুরগাঁও': ['ঠাকুরগাঁও সদর', 'পীরগঞ্জ', 'রাণীশংকৈল', 'হরিপুর', 'বاليةডাঙ্গী']
    }
  },
  'ময়মনসিংহ': {
    districts: {
      'ময়মনসিংহ': ['ময়মনসিংহ সদর', 'ফুলপুর', 'হালুয়াঘাট', 'ধোবাউড়া', 'নান্দাইল', 'ঈশ্বরগঞ্জ', 'গফরগাঁও', 'ত্রিশাল', 'ভালুকা', 'মুক্তাগাছা', 'ফুলবাড়ীয়া', 'গৌরীপুর', 'তারাকান্দা'],
      'নেত্রকোণা': ['নেত্রকোণা সদর', 'বারহাট্টা', 'কলমাকান্দা', 'দুর্গাপুর', 'পূর্বধলা', 'কেন্দুয়া', 'মদন', 'খালিয়াজুরী', 'আটপাড়া', 'মোহনগঞ্জ'],
      'শেরপুর': ['শেরপুর সদর', 'নালিতাবাড়ী', 'শ্রীবরদী', 'ঝিনাইগাতী', 'নকলা'],
      'জামালপুর': ['জামালপুর সদর', 'সরিষাবাড়ী', 'মেলান্দহ', 'মাদারগঞ্জ', 'ইসলামপুর', 'দেওয়ানগঞ্জ', 'বকশীগঞ্জ']
    }
  }
};

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onPlaceOrder,
  siteConfig,
  currentUser,
  orders = [],
}: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ঢাকা');
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা');
  const [selectedUpazila, setSelectedUpazila] = useState('মিরপুর');
  const [address2, setAddress2] = useState('');
  const [shippingArea, setShippingArea] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  
  // Coupon and Discount states
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Mobile payment fields
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);

  // Success screen state
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Form validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittedRef = React.useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      isSubmittedRef.current = false;
    }
  }, [isOpen]);

  const deliveryCharge = shippingArea === 'inside_dhaka' ? 60 : 120;
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount + deliveryCharge);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setErrors(prev => ({ ...prev, coupon: 'অনুগ্রহ করে কুপন কোডটি লিখুন!' }));
      return;
    }

    const normInput = phone.replace(/\D/g, '');
    if (!normInput || normInput.length < 10) {
      setErrors(prev => ({ ...prev, coupon: 'কুপন অ্যাপ্লাই করার পূর্বে অনুগ্রহ করে সঠিক মোবাইল নম্বরটি লিখুন!' }));
      return;
    }
    
    // Supported coupon codes: read dynamically from siteConfig or fallback to default ones
    const couponsList = siteConfig?.coupons || [
      { code: 'MANGO10', type: 'percentage', value: 10 },
      { code: 'MANGO100', type: 'flat', value: 100 },
      { code: 'FREE50', type: 'flat', value: 50 }
    ];

    const coupon = couponsList.find((c: any) => c.code.toUpperCase() === code);

    if (coupon) {
      // Check restricted phone numbers
      if (coupon.restrictedPhones && coupon.restrictedPhones.trim()) {
        const allowedNumbers = coupon.restrictedPhones.split(',')
          .map((p: string) => p.replace(/\D/g, ''))
          .filter((p: string) => p.length > 0);
        
        if (allowedNumbers.length > 0) {
          const matched = allowedNumbers.some((allowedNum: string) => normInput.includes(allowedNum) || allowedNum.includes(normInput));
          if (!matched) {
            setErrors(prev => ({ ...prev, coupon: 'দুঃখিত, এই কুপনটি শুধুমাত্র নির্দিষ্ট কিছু গ্রাহকের মোবাইল নম্বরের জন্য প্রযোজ্য!' }));
            return;
          }
        }
      }

      // Check limit per phone number
      const isLimitPerPhone = coupon.limitPerPhone === 1 || coupon.limitPerPhone === '1' || coupon.limitPerPhone === true;
      if (isLimitPerPhone) {
        const alreadyUsed = orders.some(o => {
          const normOrderPhone = o.customerPhone.replace(/\D/g, '');
          return normOrderPhone.includes(normInput) && o.couponCode?.toUpperCase() === code;
        });
        if (alreadyUsed) {
          setErrors(prev => ({ ...prev, coupon: 'দুঃখিত, এই মোবাইল নম্বর দিয়ে এই কুপনটি ইতিমধ্যে ব্যবহার করা হয়েছে!' }));
          return;
        }
      }

      // Check max total usage
      if (coupon.maxTotalUsage && Number(coupon.maxTotalUsage) > 0) {
        const timesUsed = orders.filter(o => o.couponCode?.toUpperCase() === code).length;
        if (timesUsed >= Number(coupon.maxTotalUsage)) {
          setErrors(prev => ({ ...prev, coupon: 'দুঃখিত, এই কুপনটির সর্বোচ্চ ব্যবহারের সীমা অতিক্রম হয়েছে!' }));
          return;
        }
      }

      let calculatedDiscount = 0;
      if (coupon.type === 'percentage') {
        calculatedDiscount = Math.round(subtotal * (coupon.value / 100));
      } else {
        calculatedDiscount = Math.min(coupon.value, subtotal);
      }
      setDiscount(calculatedDiscount);
      setAppliedCoupon(coupon.code);
      setErrors(prev => {
        const { coupon, ...rest } = prev;
        return rest;
      });
    } else {
      setErrors(prev => ({ ...prev, coupon: 'ভুল বা মেয়াদোত্তীর্ণ কুপন কোড!' }));
    }
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDivisionChange = (divisionName: string) => {
    setSelectedDivision(divisionName);
    const districts = Object.keys(BANGLADESH_DATA[divisionName].districts);
    const defaultDistrict = districts[0];
    setSelectedDistrict(defaultDistrict);
    const upazilas = BANGLADESH_DATA[divisionName].districts[defaultDistrict];
    setSelectedUpazila(upazilas[0]);
  };

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    const upazilas = BANGLADESH_DATA[selectedDivision].districts[districtName];
    setSelectedUpazila(upazilas[0]);
  };

  const inputClasses = `w-full px-4 py-3 rounded-md border border-orange-200 bg-[#fdfcfb] text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all font-medium text-sm placeholder-gray-400`;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'আপনার নাম লিখুন';
    
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    const phoneClean = phone.trim().replace(/\s+/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'আপনার ফোন নম্বর লিখুন';
    } else if (!phoneRegex.test(phoneClean)) {
      newErrors.phone = 'সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
    }

    if (altPhone.trim()) {
      const altClean = altPhone.trim().replace(/\s+/g, '');
      if (!phoneRegex.test(altClean)) {
        newErrors.altPhone = 'সঠিক বিকল্প মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
      }
    }

    if (!address2.trim()) newErrors.address2 = 'সম্পূর্ণ ঠিকানা লিখুন';

    if (paymentMethod !== 'cod') {
      if (!senderNumber.trim()) {
        newErrors.senderNumber = 'যে নাম্বার থেকে টাকা পাঠিয়েছেন তা লিখুন';
      } else if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(senderNumber.trim().replace(/\s+/g, ''))) {
        newErrors.senderNumber = 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন';
      }
      if (!trxId.trim()) newErrors.trxId = 'Transaction ID (TrxID) লিখুন';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittedRef.current) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    isSubmittedRef.current = true;

    const uniqueId = 'ML-' + Math.floor(100000 + Math.random() * 900000);

    // Construct full address including all dropdown details
    const fullAddress = `বিভাগ: ${selectedDivision}, জেলা: ${selectedDistrict}, থানা: ${selectedUpazila} | সম্পূর্ণ ঠিকানা: ${address2}${altPhone.trim() ? ` (বিকল্প ফোন: ${altPhone})` : ''}`;
    const phoneWithAlt = altPhone.trim() ? `${phone} (বিকল্প: ${altPhone})` : phone;

    onPlaceOrder({
      id: uniqueId,
      customerName: name,
      customerPhone: phoneWithAlt,
      deliveryAddress: fullAddress,
      district: selectedDistrict,
      area: selectedUpazila,
      paymentMethod,
      bkashNumber: paymentMethod !== 'cod' ? senderNumber : undefined,
      trxId: paymentMethod !== 'cod' ? trxId : undefined,
      deliveryCharge,
      couponCode: appliedCoupon || undefined,
      discountAmount: discount || undefined,
    });

    // Create the exact receipt for the checkout success screen
    const mockOrder: Order = {
      id: uniqueId,
      customerName: name,
      customerPhone: phoneWithAlt,
      deliveryAddress: fullAddress,
      district: selectedDistrict,
      area: selectedUpazila,
      paymentMethod,
      bkashNumber: paymentMethod !== 'cod' ? senderNumber : undefined,
      trxId: paymentMethod !== 'cod' ? trxId : undefined,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        unit: item.product.unit,
        image: item.product.image,
      })),
      totalAmount: total,
      deliveryCharge,
      status: 'pending',
      createdAt: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
      couponCode: appliedCoupon || undefined,
      discountAmount: discount || undefined,
    };

    setOrderSuccess(mockOrder);
  };

  const handleClose = () => {
    // Reset state
    setName('');
    setPhone('');
    setAltPhone('');
    setAddress1('');
    setAddress2('');
    setSelectedDivision('ঢাকা');
    setSelectedDistrict('ঢাকা');
    setSelectedUpazila('মিরপুর');
    setShippingArea('inside_dhaka');
    setPaymentMethod('cod');
    setSenderNumber('');
    setTrxId('');
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon('');
    setErrors({});
    setOrderSuccess(null);
    setIsSubmitting(false);
    isSubmittedRef.current = false;
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-xs">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={orderSuccess ? handleClose : onClose}
            className="fixed inset-0 cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="bg-[#f7f8fa] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[95vh]"
            id="checkout-modal-panel"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={orderSuccess ? handleClose : onClose}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-full cursor-pointer transition-colors shadow-xs z-30 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Canvas */}
            <div className="flex-grow overflow-y-auto px-4 py-6 md:p-10 space-y-6">
              {!orderSuccess ? (
                <>
                  {/* Brand Header & Logo (Matches screenshot) */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-orange-100 shadow-xs mb-3">
                      <img 
                        src="/src/assets/images/mango_lover_logo_1782453485561.jpg" 
                        alt="Mango Lover Logo" 
                        className="w-full h-full object-cover scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="font-extrabold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-green-600 bg-clip-text text-transparent">
                      ম্যাংগো লাভার
                    </span>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 mt-2">অর্ডার ফর্ম</h2>
                  </div>

                  {/* Warning Alert Box (Dotted border, orange background) */}
                  <div className="max-w-3xl mx-auto p-4 md:p-5 rounded-md border border-dashed border-[#ffb74d] bg-[#fffbf4] text-center">
                    <p className="text-xs md:text-sm text-amber-950 leading-relaxed font-bold">
                      সম্মানিত গ্রাহক, দয়া করে নিশ্চিত না হয়ে, শুধু মজার উদ্দেশ্যে অর্ডার করে আমাদের কষ্ট দিবেন না প্লিজ। আপনার অজানায় কেউ কষ্ট পাক, নিশ্চয় আপনি তা চাইবেন না, কেননা আপনি একজন চমৎকার ব্যক্তিত্বের মানুষ ❤️
                    </p>
                  </div>
                  <p className="text-center text-xs md:text-sm font-bold text-slate-700">
                    অনুগ্রহ করে ডেলিভারির জন্য নিচের ফর্মটি পূরণ করুন।
                  </p>

                  {/* Progress Tracker (Matches screenshot wizard) */}
                  <div className="flex items-center justify-center gap-2 md:gap-4 text-xs font-bold text-gray-400 max-w-xl mx-auto py-2">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px]"></span>
                      <span>কার্ট</span>
                    </div>
                    <div className="w-12 md:w-20 h-px bg-gray-200"></div>
                    <div className="flex items-center gap-1.5 text-orange-600">
                      <span className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center bg-orange-50">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                      </span>
                      <span>আপনার তথ্য</span>
                    </div>
                    <div className="w-12 md:w-20 h-px bg-gray-200"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px]"></span>
                      <span>কনফার্ম</span>
                    </div>
                  </div>

                  {/* Main Form container - Rounded White Card (Matches screenshot) */}
                  <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200/80 p-5 md:p-8 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left Column: Billing Details */}
                    <div className="md:col-span-7 space-y-5">
                      <h3 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight mb-2">
                        Billing details (ডেলিভারির তথ্য)
                      </h3>

                      {/* 1. Name Field */}
                      <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                          আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="আপনার নাম লিখুন"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`${inputClasses} ${errors.name ? 'border-red-500 ring-2 ring-red-100 bg-red-50/10' : ''}`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                      </div>

                      {/* 2. Phone Field */}
                      <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                          আপনার ফোন নম্বর <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="যেমন: ০১৭XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`${inputClasses} ${errors.phone ? 'border-red-500 ring-2 ring-red-100 bg-red-50/10' : ''}`}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
                      </div>

                      {/* 3. Alternative Phone Field */}
                      <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                          বিকল্প নম্বর <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="যেমন: ০১৮XXXXXXXX"
                          value={altPhone}
                          onChange={(e) => setAltPhone(e.target.value)}
                          className={`${inputClasses} ${errors.altPhone ? 'border-red-500 ring-2 ring-red-100 bg-red-50/10' : ''}`}
                        />
                        {errors.altPhone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.altPhone}</p>}
                      </div>

                      {/* 4. First Complete Address Field */}

                      {/* Dropdown selectors in a beautiful clean layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* 5. Division (Dropdown) */}
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                            বিভাগ <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedDivision}
                            onChange={(e) => handleDivisionChange(e.target.value)}
                            className={`${inputClasses}`}
                          >
                            {Object.keys(BANGLADESH_DATA).map((div) => (
                              <option key={div} value={div}>
                                {div}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 6. District (Dropdown) */}
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                            জেলা <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedDistrict}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className={`${inputClasses}`}
                          >
                            {Object.keys(BANGLADESH_DATA[selectedDivision].districts).map((dist) => (
                              <option key={dist} value={dist}>
                                {dist}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 7. Upazila/Thana (Dropdown) */}
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                            উপজেলা/থানা <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedUpazila}
                            onChange={(e) => setSelectedUpazila(e.target.value)}
                            className={`${inputClasses}`}
                          >
                            {BANGLADESH_DATA[selectedDivision].districts[selectedDistrict].map((upz) => (
                              <option key={upz} value={upz}>
                                {upz}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 8. Detailed Address Field */}
                      <div>
                        <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                          সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="ডেলিভারি পাওয়ার জন্য আপনার পূর্ণাঙ্গ ঠিকানা এখানে পুনরায় লিখুন"
                          value={address2}
                          onChange={(e) => setAddress2(e.target.value)}
                          className={`${inputClasses} resize-none ${errors.address2 ? 'border-red-500 ring-2 ring-red-100 bg-red-50/10' : ''}`}
                        />
                        {errors.address2 && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address2}</p>}
                      </div>

                      {/* Grid for Shipping and Payment Method dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* 9. Shipping (Dropdown) */}
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                            Shipping <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={shippingArea}
                            onChange={(e) => setShippingArea(e.target.value as 'inside_dhaka' | 'outside_dhaka')}
                            className={`${inputClasses}`}
                          >
                            <option value="inside_dhaka">ঢাকার ভিতরে</option>
                            <option value="outside_dhaka">ঢাকার বাহিরে</option>
                          </select>
                        </div>

                        {/* 10. Payment Method (Dropdown) */}
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                            Payment Method <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'bkash' | 'nagad')}
                            className={`${inputClasses}`}
                          >
                            <option value="cod">Cash on Delivery (COD)</option>
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                          </select>
                        </div>
                      </div>

                      {/* Dynamic info boxes based on Dropdown selections */}
                      <div className="border border-orange-100 bg-[#fdfcfb] px-4 py-3 rounded-md text-sm font-bold text-gray-700 flex justify-between items-center mt-2">
                        <span>ডেলিভারি চার্জ:</span>
                        <span className="text-orange-600 font-extrabold text-base">{deliveryCharge}৳ ({shippingArea === 'inside_dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাহিরে'})</span>
                      </div>

                      {/* Sender Mobile Payment details (Visible only if bkash/nagad selected) */}
                      {paymentMethod !== 'cod' && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                          <p className="text-xs font-bold text-gray-800">
                            {paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} সেন্ড মানি করুন: <span className="text-orange-600 font-mono">০১৭৭৬৪৫২৩১২</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block font-bold mb-1">আপনার নম্বর *</label>
                              <input
                                type="tel"
                                placeholder="01XXXXXXXXX"
                                value={senderNumber}
                                onChange={(e) => setSenderNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none"
                              />
                              {errors.senderNumber && <p className="text-red-500 text-[10px] mt-1">{errors.senderNumber}</p>}
                            </div>
                            <div>
                              <label className="block font-bold mb-1">Transaction ID (TrxID) *</label>
                              <input
                                type="text"
                                placeholder="যেমন: 8N7X2W8K"
                                value={trxId}
                                onChange={(e) => setTrxId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none"
                              />
                              {errors.trxId && <p className="text-red-500 text-[10px] mt-1">{errors.trxId}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Your Order & Payment details */}
                    <div className="md:col-span-5 flex flex-col justify-between space-y-6">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight mb-4">
                          Your order
                        </h3>

                        {/* Order Details Grid Structure */}
                        <div className="border-b border-gray-200 pb-2 flex justify-between text-xs font-bold text-gray-500">
                          <span>Product</span>
                          <span>Subtotal</span>
                        </div>

                        {/* Order Items Table (Matches screenshot table style) */}
                        <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                          {cartItems.map((item) => (
                            <div key={`${item.product.id}-${item.product.unit || 'default'}`} className="py-3 flex items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-md border border-gray-100 bg-[#f7f8f9] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                  <img 
                                    src={item.product.image} 
                                    alt={item.product.name} 
                                    className="max-w-full max-h-full object-contain" 
                                    referrerPolicy="no-referrer" 
                                  />
                                </div>
                                <div className="truncate pr-2">
                                  <span className="font-semibold text-slate-800 block truncate">{item.product.name}</span>
                                  <span className="text-gray-400 font-bold block mt-0.5">× {item.quantity}</span>
                                </div>
                              </div>
                              <span className="font-bold text-slate-800 shrink-0">{item.product.price * item.quantity}৳</span>
                            </div>
                          ))}
                        </div>

                        {/* Pricing lines */}
                        <div className="border-t border-gray-100 pt-3.5 space-y-2.5 text-xs font-bold text-gray-600 font-sans">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="text-slate-800">{subtotal}৳</span>
                          </div>
                          
                          {/* Conditional Discount Line (যদি discount এর ভ্যালু ০ থেকে বেশি হয়) */}
                          {typeof discount !== 'undefined' && discount > 0 && (
                            <div className="flex justify-between text-green-600 border-t border-dashed border-gray-100 pt-2">
                              <span>Discount</span>
                              <span>-{discount}৳</span>
                            </div>
                          )}

                          <div className="flex justify-between border-t border-dashed border-gray-200 pt-2.5 text-slate-900 text-sm font-black">
                            <span>Total</span>
                            <span className="text-slate-900">{total}৳</span>
                          </div>
                        </div>

                        {/* Cash on Delivery Indicator Box (Bubble with centered triangle arrow) */}
                        {paymentMethod === 'cod' && (
                          <div className="mt-6">
                            <h4 className="font-bold text-xs text-slate-700 mb-2">ক্যাশ অন ডেলিভারি (COD)</h4>
                            <div className="bg-[#f8fcf9] border border-green-100/60 p-4 rounded-md text-xs text-[#006437] font-bold relative shadow-xs">
                              <span className="absolute -top-2 left-6 w-3 h-3 bg-[#f8fcf9] border-t border-l border-green-100/60 rotate-45"></span>
                              অবশ্যই আমি প্রোডাক্ট হাতে পেয়ে মূল্য পরিশোধ করবো, ইন-শা-আল্লাহ।
                            </div>
                          </div>
                        )}

                        {/* Apply Discount Code Section (লাল মার্ক করা জায়গায় যুক্ত করা হলো) */}
                        <div className="mt-4">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Apply Discount Code</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="কুপন কোড লিখুন"
                              value={couponCode || ''}
                              onChange={(e) => setCouponCode && setCouponCode(e.target.value)}
                              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:border-green-600"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-md transition-all cursor-pointer shrink-0"
                            >
                              Apply
                            </button>
                          </div>
                          {errors.coupon && <p className="text-red-500 text-[10px] mt-1">{errors.coupon}</p>}
                        </div>
                      </div>

                      {/* Forest Green Confirm Order Button (Matches screenshot lock button) */}
                      <div>
                        <button
                          type="submit"
                          className="w-full bg-[#006437] hover:bg-[#004d2a] active:bg-[#00381e] text-white font-extrabold py-3.5 px-4 rounded-md shadow-xs transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4 text-white/90" />
                          <span>Confirm Order {total}৳</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                /* Beautiful Clean invoice / Memo (Success state) */
                <div className="text-center py-6 max-w-md mx-auto space-y-6 bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xl">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-md">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900">আপনার অর্ডার নিশ্চিত হয়েছে!</h3>
                    <div className="mt-2.5 flex flex-col items-center justify-center gap-1 bg-orange-50/50 border border-orange-100/60 p-2.5 rounded-2xl max-w-xs mx-auto">
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">আপনার ট্র্যাকিং অর্ডার নম্বর</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-orange-600 text-base font-mono">{orderSuccess.id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(orderSuccess.id);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-orange-200 text-gray-400 hover:text-orange-600 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                          title="অর্ডার আইডি কপি করুন"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {copied && (
                        <span className="text-[9px] text-green-600 font-bold block">অর্ডার নম্বরটি কপি হয়েছে!</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2.5 font-bold">
                      💡 উপরে ডানপাশে <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black">'অর্ডার ট্র্যাকিং'</span> অপশন থেকে যেকোনো সময় আপনার অর্ডারটি ট্র্যাক করতে পারবেন।
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">আমাদের টিম খুব শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করবে।</p>
                  </div>

                  {/* Memo Card Details with soft Amber background */}
                  <div className="bg-[#fdfcfb] border border-[#ffb74d]/30 rounded-2xl p-4 text-left space-y-3.5 text-xs text-slate-700">
                    <h4 className="font-extrabold text-slate-900 border-b border-gray-100 pb-2 text-center text-sm">
                      মেমো / ইনভয়েস
                    </h4>
                    <div className="space-y-1.5 font-medium">
                      <p><span className="font-bold text-gray-500">গ্রাহকের নাম:</span> {orderSuccess.customerName}</p>
                      <p><span className="font-bold text-gray-500">মোবাইল নম্বর:</span> {orderSuccess.customerPhone || 'প্রদান করা হয়নি'}</p>
                      <p>
                        <span className="font-bold text-gray-500">ডেলিভারি ঠিকানা:</span>{' '}
                        {orderSuccess.deliveryAddress}, {orderSuccess.area}, {orderSuccess.district}
                      </p>
                      <p>
                        <span className="font-bold text-gray-500">পেমেন্ট পদ্ধতি:</span>{' '}
                        {orderSuccess.paymentMethod === 'cod'
                          ? 'ক্যাশ অন ডেলিভারি (COD)'
                          : orderSuccess.paymentMethod === 'bkash'
                          ? 'বিকাশ'
                          : 'নগদ'}
                      </p>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                      {orderSuccess.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-gray-600 text-[11px] font-medium">
                          <span>
                            {item.productName} ({item.unit}) × {item.quantity}
                          </span>
                          <span className="font-bold text-slate-800">{item.price * item.quantity}৳</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-2.5 flex justify-between font-bold text-slate-800">
                      <span>ডেলিভারি চার্জ:</span>
                      <span>{orderSuccess.deliveryCharge}৳</span>
                    </div>

                    <div className="border-t border-gray-200 pt-2.5 flex justify-between font-black text-orange-600 text-sm md:text-base">
                      <span>মোট পরিশোধিত:</span>
                      <span>{orderSuccess.totalAmount}৳</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full bg-[#006437] hover:bg-[#004d2a] text-white font-extrabold py-3.5 px-4 rounded-md transition-all cursor-pointer text-sm shadow-xs"
                  >
                    কেনাকাটা বজায় রাখুন
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}