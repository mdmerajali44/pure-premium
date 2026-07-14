import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Phone, 
  MessageCircle,
  HelpCircle,
  Headphones
} from "lucide-react";
import { Product, SiteConfig } from "../types";

interface ChatWidgetProps {
  siteConfig: SiteConfig;
  products: Product[];
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ siteConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footerElement = document.querySelector('footer');
    if (!footerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.05, // Trigger as soon as the footer starts to appear
      }
    );

    observer.observe(footerElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  const storeName = siteConfig?.storeName || "ম্যাংগো লাভার";
  const contactPhone = siteConfig?.contactPhone || "01301-636461";
  const messengerUrl = siteConfig?.messengerLink || "https://m.me/61556942953282";
  
  // WhatsApp Configuration
  const whatsAppNumber = "8801902454972";
  const encodedWhatsAppMsg = encodeURIComponent(
    `আসসালামু আলাইকুম! আমি ${storeName} থেকে কিছু প্রোডাক্ট সম্পর্কে জানতে চাচ্ছি।`
  );
  const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodedWhatsAppMsg}`;

  return (
    <motion.div 
      initial={{ opacity: 1, y: 0 }}
      animate={{ 
        opacity: isFooterVisible ? 0 : 1, 
        y: isFooterVisible ? 40 : 0,
        scale: isFooterVisible ? 0.95 : 1,
        pointerEvents: isFooterVisible ? "none" : "auto"
      }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end font-sans"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="support-chat-window"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[350px] sm:w-[380px] md:w-[400px] h-[480px] bg-white rounded-3xl shadow-2xl border border-orange-100 flex flex-col overflow-hidden mb-4 relative z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-4 pb-5 text-white relative flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse"></span>
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">{storeName} হেল্পলাইন</h3>
                  <p className="text-[10px] text-orange-100 flex items-center gap-1 font-medium">
                    সরাসরি যোগাযোগ ও কাস্টমার কেয়ার
                  </p>
                </div>
              </div>
              <button
                id="close-chat-widget"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 active:bg-white/20 rounded-full transition-all text-white/90 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Contact Links */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between bg-slate-50/50">
              <div className="space-y-6">
                {/* Waving hand emoji and header */}
                <div className="text-center space-y-2 mt-2">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, repeatDelay: 1 }}
                    className="inline-block text-4xl mb-1"
                  >
                    👋
                  </motion.div>
                  <h4 className="font-bold text-slate-800 text-sm">যেকোনো প্রয়োজনে যোগাযোগ করুন</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium px-2">
                    খাঁটি ও নিরাপদ পণ্য এবং অর্ডার সংক্রান্ত যেকোনো প্রয়োজনে আমাদের সাথে সরাসরি যোগাযোগ করুন।
                  </p>
                </div>

                {/* Direct Contact Buttons List */}
                <div className="space-y-3">
                  {/* WhatsApp Button */}
                  <motion.a
                    id="whatsapp-contact-button"
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 transition-all text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-[#25D366] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform p-2.5">
                      <svg className="w-full h-full fill-current text-white" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.989-1.874-1.875-4.353-2.907-6.992-2.908-5.441 0-9.87 4.422-9.873 9.867-.001 1.77.464 3.495 1.349 5.03l-.43 1.571.026.026.012-.045.385-1.408zm12.355-6.84c-.27-.135-1.602-.79-1.85-.882-.25-.09-.431-.135-.612.135-.18.27-.7.88-.857 1.06-.157.18-.315.2-.585.065-.27-.135-1.14-.42-2.17-1.34-.802-.715-1.343-1.6-1.5-1.87-.158-.27-.017-.415.118-.55.122-.121.27-.315.405-.473.135-.157.18-.27.27-.45.09-.18.045-.338-.022-.473-.068-.135-.612-1.474-.838-2.016-.22-.53-.44-.457-.612-.466-.158-.008-.338-.01-.52-.01-.18 0-.473.067-.72.338-.25.27-.945.924-.945 2.254 0 1.33.967 2.614 1.102 2.8.135.18 1.9 2.901 4.604 4.07.643.277 1.145.443 1.535.567.646.205 1.233.176 1.7.106.52-.078 1.602-.655 1.827-1.286.225-.63.225-1.17.157-1.286-.067-.116-.248-.18-.518-.315z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-700 text-xs tracking-wide">হোয়াটসঅ্যাপ মেসেজ (WhatsApp)</h5>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">সবসময় মেসেজ করতে পারেন</p>
                    </div>
                  </motion.a>

                  {/* Messenger button */}
                  <motion.a
                    id="messenger-contact-button"
                    href={messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 transition-all text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform p-2.5 bg-gradient-to-tr from-[#006AFF] via-[#A100FF] to-[#FF007A]">
                      {/* Messenger Icon */}
                      <svg className="w-full h-full fill-current text-white" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.448 5.518 3.717 7.151.196.142.31.368.312.61l.013 2.12c.001.272.235.49.507.472l2.486-.168a.82.82 0 01.554.18c1.385.903 3.037 1.43 4.811 1.43 5.523 0 10-4.146 10-9.258C22 6.145 17.523 2 12 2zm1.095 12.186l-2.434-2.597-4.756 2.597 5.231-5.553 2.502 2.597 4.688-2.597-5.231 5.553z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-700 text-xs tracking-wide">ফেসবুক মেসেঞ্জার (Messenger)</h5>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">সবসময় মেসেজ করতে পারেন</p>
                    </div>
                  </motion.a>

                  {/* Hotline phone call button */}
                  <motion.a
                    id="phone-contact-button"
                    href={`tel:${contactPhone}`}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 transition-all text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-700 text-xs tracking-wide">সরাসরি কল করুন - {contactPhone}</h5>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">(সকাল ১০:০০ টা - রাত ০৮:০০ টা)</p>
                    </div>
                  </motion.a>
                </div>
              </div>

              {/* Bottom reassurance text */}
              <div className="text-center p-3 border-t border-slate-100/80 mt-4">
                <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  ২৪ ঘণ্টার যেকোনো সময় মেসেজ পাঠাতে পারেন
                </p>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating collapsed Support Button */}
      <div className="relative">
        <span className="absolute -inset-1.5 bg-orange-500 rounded-full blur-xs opacity-35 animate-pulse pointer-events-none"></span>
        <span className="absolute -inset-1.5 bg-amber-400 rounded-full animate-ping opacity-15 pointer-events-none"></span>
        
        <motion.button
          id="toggle-chat-widget"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="w-16 h-16 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white rounded-full flex flex-col items-center justify-center shadow-2xl cursor-pointer hover:shadow-orange-500/30 border-2 border-white relative z-10 transition-all duration-300"
          title="হেল্পলাইন"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Headphones className="w-6 h-6 animate-pulse" />
              <span className="text-[10px] font-black tracking-tighter leading-none">হেল্পলাইন</span>
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
