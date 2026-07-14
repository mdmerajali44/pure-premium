/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User as UserType, SiteConfig } from '../types';
import { DISTRICTS } from '../data';
import { X, Phone, Lock, User, Mail, MapPin, Eye, EyeOff, ShieldCheck, Store, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  onRegister: (newUser: UserType) => void;
  onLogin: (user: UserType) => void;
  onNotify: (message: string, type: 'success' | 'info' | 'error') => void;
  initialMode?: 'login' | 'register';
  isAdminRoute?: boolean;
  onAdminLoginFail?: () => void;
  siteConfig?: SiteConfig;
}

export default function AuthModal({
  isOpen,
  onClose,
  users,
  onRegister,
  onLogin,
  onNotify,
  initialMode = 'login',
  isAdminRoute = false,
  onAdminLoginFail,
  siteConfig,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      if (isAdminRoute) {
        setMode('login');
      } else {
        setMode(initialMode);
      }
    }
  }, [isOpen, isAdminRoute, initialMode]);
  
  // Show/Hide password
  const [showPassword, setShowPassword] = useState(false);

  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDistrict, setRegDistrict] = useState(DISTRICTS[0].name);
  const [regArea, setRegArea] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState('male');
  const [regRole, setRegRole] = useState<'user' | 'seller'>('user');
  const [shopName, setShopName] = useState('');
  const [regPaymentMethod, setRegPaymentMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [regPaymentDetails, setRegPaymentDetails] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!loginPhone.trim()) {
      newErrors.loginPhone = 'মোবাইল নম্বর অথবা ইমেইল লিখুন';
    }
    if (!loginPassword.trim()) {
      newErrors.loginPassword = 'পাসওয়ার্ড লিখুন';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check if user exists at all
    const inputClean = loginPhone.trim();
    const inputPhoneClean = inputClean.replace(/\s+/g, '');
    const userExists = users.some(
      (u) => 
        u.phone === inputClean || 
        u.phone.replace(/\s+/g, '') === inputPhoneClean || 
        u.email?.toLowerCase() === inputClean.toLowerCase()
    );

    if (!userExists) {
      onNotify('এই নম্বরে কোন অ্যাকাউন্ট নেই, রেজিস্ট্রেশন করুন।', 'error');
      setMode('register');
      if (/^(?:\+88|88)?(01[3-9]\d{8})$/.test(inputPhoneClean)) {
        setRegPhone(inputClean);
      }
      return;
    }

    // Find user with password
    const foundUser = users.find(
      (u) => 
        (u.phone === inputClean || u.phone.replace(/\s+/g, '') === inputPhoneClean || u.email?.toLowerCase() === inputClean.toLowerCase()) &&
        u.password === loginPassword
    );

    if (!foundUser) {
      if (isAdminRoute && onAdminLoginFail) {
        resetForm();
        onClose();
        onAdminLoginFail();
      } else {
        onNotify('ভুল পাসওয়ার্ড দিয়েছেন! দয়া করে সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।', 'error');
      }
      return;
    }

    if (foundUser.status === 'blocked') {
      onNotify('দুঃখিত, আপনার অ্যাকাউন্টটি ব্লক করা আছে। অ্যাডমিনের সাথে যোগাযোগ করুন!', 'error');
      return;
    }

    if (isAdminRoute && foundUser.role !== 'admin' && foundUser.role !== 'super-admin') {
      if (onAdminLoginFail) {
        resetForm();
        onClose();
        onAdminLoginFail();
      } else {
        onNotify('দুঃখিত, আপনি অ্যাডমিন নন! ভুল অ্যাক্সেস!', 'error');
      }
      return;
    }

    onLogin(foundUser);
    onNotify(`${foundUser.name} হিসেবে সফলভাবে লগইন হয়েছে!`, 'success');
    resetForm();
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!regName.trim()) newErrors.regName = 'আপনার সম্পূর্ণ নাম লিখুন';
    
    const phoneClean = regPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneClean) {
      newErrors.regPhone = 'মোবাইল নম্বর লিখুন';
    } else if (!phoneRegex.test(phoneClean)) {
      newErrors.regPhone = '১১ সংখ্যার সঠিক মোবাইল নম্বর দিন';
    } else {
      // Check duplicate phone
      const duplicatePhone = users.some(u => u.phone.replace(/\s+/g, '') === phoneClean);
      if (duplicatePhone) {
        newErrors.regPhone = 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে!';
      }
    }

    if (regEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(regEmail.trim())) {
        newErrors.regEmail = 'সঠিক ইমেইল ফরম্যাট দিন';
      } else {
        const duplicateEmail = users.some(u => u.email?.toLowerCase() === regEmail.trim().toLowerCase());
        if (duplicateEmail) {
          newErrors.regEmail = 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে!';
        }
      }
    }

    if (!regPassword.trim()) {
      newErrors.regPassword = 'পাসওয়ার্ড সেট করুন';
    } else if (regPassword.length < 6) {
      newErrors.regPassword = 'পাসওয়ার্ড কমপক্ষে ৬ সংখ্যার হতে হবে';
    }

    if (!regAddress.trim()) {
      newErrors.regAddress = regRole === 'seller' ? 'দোকান/ব্যবসার সম্পূর্ণ ঠিকানা লিখুন' : 'ডেলিভারি ঠিকানা লিখুন';
    }
    if (!regArea.trim()) {
      newErrors.regArea = regRole === 'seller' ? 'দোকান/ব্যবসার জেলা লিখুন' : 'থানা বা এরিয়ার নাম লিখুন';
    }
    if (!regDob) newErrors.regDob = 'আপনার জন্ম তারিখ সিলেক্ট করুন';

    if (regRole === 'seller') {
      if (!shopName.trim()) newErrors.shopName = 'আপনার দোকানের নাম লিখুন';
      if (!regPaymentDetails.trim()) newErrors.regPaymentDetails = 'পেমেন্ট গ্রহণের নম্বর বা ব্যাংক হিসাবের বিবরণ দিন';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Success - create user
    const newUser: UserType = {
      id: 'U-' + Math.floor(1000 + Math.random() * 9000),
      name: regName.trim(),
      phone: phoneClean,
      email: regEmail.trim() || undefined,
      password: regPassword,
      address: regAddress.trim(),
      district: regDistrict,
      area: regArea.trim(),
      dob: regDob,
      gender: regGender,
      createdAt: new Date().toISOString(),
      status: 'active',
      role: regRole,
      ...(regRole === 'seller' ? {
        shopName: shopName.trim(),
        paymentMethod: regPaymentMethod,
        paymentDetails: regPaymentDetails.trim(),
        sellerStatus: 'pending',
        balance: 0
      } : {})
    };

    onRegister(newUser);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setLoginPhone('');
    setLoginPassword('');
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegPassword('');
    setRegAddress('');
    setRegDistrict(DISTRICTS[0].name);
    setRegArea('');
    setRegDob('');
    setRegGender('male');
    setRegRole('user');
    setShopName('');
    setRegPaymentMethod('bkash');
    setRegPaymentDetails('');
    setErrors({});
    setShowPassword(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-orange-100"
      >
        {/* Header Ribbon */}
        <div className="bg-linear-to-r from-orange-500 to-amber-500 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-200 animate-pulse" />
            <h3 className="font-extrabold text-sm md:text-base">
              {isAdminRoute 
                ? 'অ্যাডমিন লগইন প্যানেল' 
                : (mode === 'login' ? 'গ্রাহক লগইন প্যানেল' : 'নতুন অ্যাকাউন্ট তৈরি করুন')}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/15 rounded-full transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        {!isAdminRoute && (
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => { setMode('login'); setErrors({}); }}
              className={`flex-1 py-3.5 text-center font-extrabold text-xs md:text-sm transition-all border-b-2 cursor-pointer ${
                mode === 'login' 
                  ? 'text-orange-600 border-orange-500 bg-white' 
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              লগইন করুন
            </button>
            <button
              onClick={() => { setMode('register'); setErrors({}); }}
              className={`flex-1 py-3.5 text-center font-extrabold text-xs md:text-sm transition-all border-b-2 cursor-pointer ${
                mode === 'register' 
                  ? 'text-orange-600 border-orange-500 bg-white' 
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              রেজিস্ট্রেশন করুন
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  মোবাইল নম্বর অথবা ইমেইল <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="যেমন: 017XXXXXXXX অথবা user@email.com"
                    value={loginPhone}
                    onChange={(e) => {
                      setLoginPhone(e.target.value);
                      if (errors.loginPhone) setErrors(prev => ({ ...prev, loginPhone: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                      errors.loginPhone ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                    }`}
                  />
                </div>
                {errors.loginPhone && (
                  <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                    ⚠️ {errors.loginPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  পাসওয়ার্ড <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (errors.loginPassword) setErrors(prev => ({ ...prev, loginPassword: '' }));
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                      errors.loginPassword ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.loginPassword && (
                  <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                    ⚠️ {errors.loginPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-md hover:shadow-lg hover:brightness-105 active:scale-98 transition-all"
              >
                লগইন করুন
              </button>

              {!isAdminRoute && (
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-400 font-bold">অ্যাকাউন্ট নেই? </span>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrors({}); }}
                    className="text-xs text-orange-600 hover:underline font-black cursor-pointer"
                  >
                    রেজিস্ট্রেশন করুন
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {siteConfig?.sellerSystemActive !== false && (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                    অ্যাকাউন্টের ধরন সিলেক্ট করুন
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('user')}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        regRole === 'user'
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      সাধারণ গ্রাহক
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('seller')}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        regRole === 'seller'
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      উদ্যোক্তা (Seller)
                    </button>
                  </div>
                </div>
              )}

              {regRole === 'seller' && (
                <div className="space-y-4 border-l-2 border-orange-400 pl-3.5 py-1">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                      দোকানের নাম (Shop Name) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="আপনার শপের নাম দিন"
                        value={shopName}
                        onChange={(e) => {
                          setShopName(e.target.value);
                          if (errors.shopName) setErrors(prev => ({ ...prev, shopName: '' }));
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                          errors.shopName ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                        }`}
                      />
                    </div>
                    {errors.shopName && (
                      <p className="text-red-500 text-[11px] font-bold mt-1.5">
                        ⚠️ {errors.shopName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                        পেমেন্ট নেওয়ার মাধ্যম
                      </label>
                      <select
                        value={regPaymentMethod}
                        onChange={(e) => setRegPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-hidden cursor-pointer"
                      >
                        <option value="bkash">বিকাশ (bKash)</option>
                        <option value="nagad">নগদ (Nagad)</option>
                        <option value="bank">ব্যাংক হিসাব (Bank Transfer)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                        পেমেন্ট নম্বর/বিবরণ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="যেমন: হিসাব নম্বর বা ফোন নম্বর"
                          value={regPaymentDetails}
                          onChange={(e) => {
                            setRegPaymentDetails(e.target.value);
                            if (errors.regPaymentDetails) setErrors(prev => ({ ...prev, regPaymentDetails: '' }));
                          }}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                            errors.regPaymentDetails ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                          }`}
                        />
                      </div>
                      {errors.regPaymentDetails && (
                        <p className="text-red-500 text-[11px] font-bold mt-1.5">
                          ⚠️ {errors.regPaymentDetails}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  আপনার নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="আপনার নাম লিখুন"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (errors.regName) setErrors(prev => ({ ...prev, regName: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                      errors.regName ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                    }`}
                  />
                </div>
                {errors.regName && (
                  <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                    ⚠️ {errors.regName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="যেমন: 017XXXXXXXX"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (errors.regPhone) setErrors(prev => ({ ...prev, regPhone: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                        errors.regPhone ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                      }`}
                    />
                  </div>
                  {errors.regPhone && (
                    <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                      ⚠️ {errors.regPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    ইমেইল (ঐচ্ছিক)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (errors.regEmail) setErrors(prev => ({ ...prev, regEmail: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                        errors.regEmail ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                      }`}
                    />
                  </div>
                  {errors.regEmail && (
                    <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                      ⚠️ {errors.regEmail}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  পাসওয়ার্ড সেট করুন <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="ন্যূনতম ৬ অক্ষরের পাসওয়ার্ড"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (errors.regPassword) setErrors(prev => ({ ...prev, regPassword: '' }));
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                      errors.regPassword ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.regPassword && (
                  <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                    ⚠️ {errors.regPassword}
                  </p>
                )}
              </div>

              {/* Birth Date & Gender Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    জন্ম তারিখ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => {
                      setRegDob(e.target.value);
                      if (errors.regDob) setErrors(prev => ({ ...prev, regDob: '' }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                      errors.regDob ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                    }`}
                  />
                  {errors.regDob && (
                    <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                      ⚠️ {errors.regDob}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    জেন্ডার <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 focus:border-orange-400 cursor-pointer"
                  >
                    <option value="male">পুরুষ (Male)</option>
                    <option value="female">মহিলা (Female)</option>
                    <option value="other">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

               <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                    {regRole === 'seller' ? 'দোকান/ব্যবসার জেলা' : 'জেলা'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={regRole === 'seller' ? 'আপনার শপের জেলা বা এলাকা লিখুন' : 'আপনার জেলা লিখুন'}
                      value={regArea}
                      onChange={(e) => {
                        setRegArea(e.target.value);
                        if (errors.regArea) setErrors(prev => ({ ...prev, regArea: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                        errors.regArea ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                      }`}
                    />
                  </div>
                  {errors.regArea && (
                    <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                      ⚠️ {errors.regArea}
                    </p>
                  )}
                </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                  {regRole === 'seller' ? 'দোকান/ব্যবসার সম্পূর্ণ ঠিকানা' : 'সম্পূর্ণ ডেলিভারি ঠিকানা'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder={regRole === 'seller' ? 'যেমন: শপের ঠিকানা, গ্রাম, ইউনিয়ন, উপজেলা, জেলা ...' : 'যেমন: গ্রাম, ইউনিয়ন, উপজেলা, জেলা ...'}
                  value={regAddress}
                  onChange={(e) => {
                    setRegAddress(e.target.value);
                    if (errors.regAddress) setErrors(prev => ({ ...prev, regAddress: '' }));
                  }}
                  rows={2}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-orange-100 ${
                    errors.regAddress ? 'border-red-400 bg-red-50/20' : 'border-gray-200 focus:border-orange-400'
                  }`}
                />
                {errors.regAddress && (
                  <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                    ⚠️ {errors.regAddress}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-md hover:shadow-lg hover:brightness-105 active:scale-98 transition-all"
              >
                অ্যাকাউন্ট তৈরি করুন
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-400 font-bold">ইতিমধ্যে অ্যাকাউন্ট আছে? </span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrors({}); }}
                  className="text-xs text-orange-600 hover:underline font-black cursor-pointer"
                >
                  লগইন করুন
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
