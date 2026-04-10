// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { UserProfile, Block, SocialLink } from '../types';
import { 
  Instagram, Facebook, MessageCircle, Send, 
  MapPin, Mail, Phone, ExternalLink, Play,
  Youtube, Twitter, Linkedin, Menu, X, Globe,
  ChevronLeft, ChevronRight, HelpCircle, Tag,
  Minus, Quote, Timer, FileText, Download,
  QrCode, BarChart3
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PublicPageProps {
  profile: UserProfile;
  previewBlocks?: Block[];
  isMobilePreview?: boolean;
}

const Countdown = ({ targetDate, title, color, contrastColor }: { targetDate: any, title: string, color: string, contrastColor: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate && (targetDate as any).toDate ? (targetDate as any).toDate().getTime() : new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;

  return (
    <div className="flex flex-col items-center gap-2 p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
      {title && <div className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: contrastColor }}>{title}</div>}
      <div className="flex gap-4">
        {[
          { label: 'D', value: timeLeft.days },
          { label: 'H', value: timeLeft.hours },
          { label: 'M', value: timeLeft.minutes },
          { label: 'S', value: timeLeft.seconds }
        ].map((unit, i) => (
          <div key={i} className="flex flex-col items-center min-w-[60px]">
            <div className="text-4xl font-black tabular-nums tracking-tighter" style={{ color: contrastColor }}>
              {unit.value.toString().padStart(2, '0')}
            </div>
            <div className="text-[10px] font-black uppercase opacity-40 tracking-widest" style={{ color: contrastColor }}>
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCounter = ({ value, label, suffix, color, contrastColor }: { value: number, label: string, suffix: string, color: string, contrastColor: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 2000; // 2 seconds

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="text-3xl font-black mb-1" style={{ color: color }}>
        {count}{suffix}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: contrastColor }}>
        {label}
      </div>
    </div>
  );
};

const publicTranslations = {
  en: { createdWith: 'Created with LinkBuilder', sendMessage: 'Send Message', name: 'Name', email: 'Email', message: 'Message', invalidVideo: 'Invalid Video URL', noAddress: 'No address set' },
  ru: { createdWith: 'Создано в LinkBuilder', sendMessage: 'Отправить сообщение', name: 'Имя', email: 'Email', message: 'Сообщение', invalidVideo: 'Неверная ссылка на видео', noAddress: 'Адрес не указан' },
  az: { createdWith: 'LinkBuilder ilə yaradılıb', sendMessage: 'Mesaj göndər', name: 'Ad', email: 'Email', message: 'Mesaj', invalidVideo: 'Yanlış video linki', noAddress: 'Ünvan qeyd edilməyib' }
};

export default function PublicPage({ profile, previewBlocks, isMobilePreview }: PublicPageProps) {
  const [blocks, setBlocks] = useState<Block[]>(previewBlocks || []);
  const [quotaError, setQuotaError] = useState(false);
  const [currentLang, setCurrentLang] = useState(profile.language || 'az');
  const t = publicTranslations[currentLang as keyof typeof publicTranslations];

  console.log('[PublicPage] Render', { 
    slug: profile.slug, 
    uid: profile.uid, 
    blocksCount: blocks.length,
    hasPreviewBlocks: !!previewBlocks 
  });

  useEffect(() => {
    setCurrentLang(profile.language || 'az');
  }, [profile.language]);

  useEffect(() => {
    if (previewBlocks) {
      setBlocks(previewBlocks);
      return;
    }

    const q = query(collection(db, 'blocks', profile.uid, 'items'), orderBy('order', 'asc'));
    console.log(`[PublicPage] Setting up blocks listener for: blocks/${profile.uid}/items`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Block));
      console.log(`[PublicPage] [onSnapshot] Received ${items.length} blocks for profile ${profile.uid}`);
      if (items.length > 0) {
        console.log(`[PublicPage] First block content preview:`, items[0].content);
      }
      setBlocks(items);
      setQuotaError(false);
    }, (err) => {
      console.error('[PublicPage] Error fetching blocks:', err);
      if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
        setQuotaError(true);
      }
      handleFirestoreError(err, OperationType.GET, `blocks/${profile.uid}/items`);
    });

    return () => unsubscribe();
  }, [profile.uid, previewBlocks]);

  const handleBlockClick = async (blockId: string) => {
    if (previewBlocks) return;
    try {
      const blockRef = doc(db, 'blocks', profile.uid, 'items', blockId);
      await updateDoc(blockRef, {
        clicks: increment(1)
      });
    } catch (err) {
      console.error('Analytics error:', err);
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const alignmentClass = profile.theme.textAlign === 'center' ? 'text-center' : profile.theme.textAlign === 'right' ? 'text-right' : 'text-left';
  const flexAlignment = profile.theme.textAlign === 'center' ? 'items-center justify-center' : profile.theme.textAlign === 'right' ? 'items-end justify-end' : 'items-start justify-start';

  const leftBlocks = blocks.filter(b => b.column === 'left');
  const rightBlocks = blocks.filter(b => b.column !== 'left');

  // If mobile preview, we ignore the column distribution and show everything in one list
  const allBlocks = isMobilePreview ? [...leftBlocks, ...rightBlocks] : blocks;

  const fontFamily = profile.theme.fontFamily || 'inherit';
  const googleFontName = fontFamily.includes('"') ? fontFamily.split('"')[1] : null;

  const animationProps = profile.theme.animationEnabled !== false ? {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  } : {};

  return (
    <div 
      className="min-h-screen w-full transition-colors duration-500 flex flex-col relative"
      style={{ 
        backgroundColor: profile.theme.backgroundColor,
        fontFamily: fontFamily
      }}
    >
      {quotaError && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2 text-center text-xs font-bold">
          Page is in read-only mode due to high traffic (Quota Exceeded).
        </div>
      )}
      {/* SEO Meta Tags */}
      {profile.seoTitle && <title>{profile.seoTitle}</title>}
      {profile.seoDescription && <meta name="description" content={profile.seoDescription} />}
      {googleFontName && (
        <link 
          rel="stylesheet" 
          href={`https://fonts.googleapis.com/css2?family=${googleFontName.replace(/ /g, '+')}:wght@400;500;700;900&display=swap`} 
        />
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-black/5" style={{ backgroundColor: `${profile.theme.backgroundColor}cc` }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold overflow-hidden ${!profile.avatar ? 'bg-blue-600' : ''}`}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.displayName?.charAt(0) || 'L'
              )}
            </div>
            <span className="font-bold hidden sm:block" style={{ color: getContrastColor(profile.theme.backgroundColor) }}>
              {profile.displayName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: getContrastColor(profile.theme.backgroundColor) }}
              >
                {currentLang === 'az' ? 'Ana Səhifə' : currentLang === 'ru' ? 'Главная' : 'Home'}
              </button>
              {blocks.some(b => b.type === 'form') && (
                <button 
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: getContrastColor(profile.theme.backgroundColor) }}
                >
                  {currentLang === 'az' ? 'Əlaqə' : currentLang === 'ru' ? 'Контакт' : 'Contact'}
                </button>
              )}
            </nav>

            {/* Language Switcher */}
            <div className="hidden sm:flex bg-black/5 rounded-lg p-1">
              {(['az', 'ru', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCurrentLang(lang)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                    currentLang === lang 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={currentLang === lang ? { color: profile.theme.buttonColor } : {}}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
              style={{ color: getContrastColor(profile.theme.backgroundColor) }}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 w-full bg-white shadow-xl border-b border-gray-100 p-6 space-y-6 z-50"
            style={{ backgroundColor: profile.theme.backgroundColor }}
          >
            <nav className="flex flex-col gap-4">
              <button 
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMenuOpen(false); }}
                className="text-left font-bold text-lg"
                style={{ color: getContrastColor(profile.theme.backgroundColor) }}
              >
                {currentLang === 'az' ? 'Ana Səhifə' : currentLang === 'ru' ? 'Главная' : 'Home'}
              </button>
              {blocks.some(b => b.type === 'form') && (
                <button 
                  onClick={() => { document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); }}
                  className="text-left font-bold text-lg"
                  style={{ color: getContrastColor(profile.theme.backgroundColor) }}
                >
                  {currentLang === 'az' ? 'Əlaqə' : currentLang === 'ru' ? 'Контакт' : 'Contact'}
                </button>
              )}
            </nav>
            
            <div className="pt-6 border-t border-black/5">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40" style={{ color: getContrastColor(profile.theme.backgroundColor) }}>
                {currentLang === 'az' ? 'Dil seçin' : currentLang === 'ru' ? 'Выберите язык' : 'Select Language'}
              </p>
              <div className="flex gap-2">
                {(['az', 'ru', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setCurrentLang(lang); setIsMenuOpen(false); }}
                    className={`flex-1 py-3 rounded-xl font-bold uppercase transition-all border ${
                      currentLang === lang 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-black/10'
                    }`}
                    style={currentLang === lang ? {} : { color: getContrastColor(profile.theme.backgroundColor) }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Cover Image */}
      {profile.coverImage && (
        <div className={`w-full max-w-6xl mx-auto overflow-hidden relative z-20 shadow-lg aspect-[4/1] ${isMobilePreview ? 'px-4 pt-4' : 'md:rounded-b-3xl'}`}>
          <div className={`w-full h-full overflow-hidden ${isMobilePreview ? 'rounded-2xl' : 'md:rounded-b-3xl'}`}>
            <img 
              src={profile.coverImage} 
              className="w-full h-full object-cover" 
              alt="Cover" 
              style={{ objectPosition: `center ${profile.coverImagePosition ?? 50}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
            
            {/* Animated Straight Line Separator */}
            {profile.showSeparator !== false && (
              <motion.div 
                key={profile.separatorAnimation || 'none'}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute bottom-0 left-0 w-full h-[4px] z-30 origin-left overflow-hidden ${
                  profile.separatorAnimation === 'rainbow' ? 'animate-rainbow' : ''
                }`}
                style={{ 
                  backgroundColor: profile.separatorAnimation === 'rainbow' ? undefined : profile.theme.backgroundColor,
                  boxShadow: profile.separatorAnimation === 'pulse' ? `0 0 20px ${profile.theme.backgroundColor}` : undefined
                }}
              >
                {profile.separatorAnimation === 'pulse' && (
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                    style={{ backgroundColor: profile.theme.backgroundColor }}
                  />
                )}
                {profile.separatorAnimation === 'flow' && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "loop",
                      ease: "linear" 
                    }}
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  />
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      <div className={`flex-1 w-full max-w-6xl mx-auto px-4 pb-12 relative ${isMobilePreview ? 'pt-12' : 'md:px-8 lg:px-12 pt-12'}`}>
        <div className={`flex flex-col gap-8 items-start ${isMobilePreview ? '' : 'lg:flex-row lg:gap-16'}`}>
          
          {/* Profile Sidebar (Sticky on Desktop) */}
          <div className={`w-full flex flex-col ${flexAlignment} space-y-8 z-30 ${isMobilePreview ? '' : `lg:w-1/3 lg:sticky lg:top-24 ${profile.coverImage ? '-mt-6 md:-mt-12' : ''}`}`}>
            <div className={`flex flex-col ${flexAlignment} space-y-6`}>
              <div className="relative group">
                <div 
                  className={`overflow-hidden border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105 bg-gray-100 flex items-center justify-center ${
                    profile.avatarShape === 'square' ? 'rounded-2xl' : 
                    profile.avatarShape === 'rectangle' ? 'rounded-2xl aspect-[3/4]' : 
                    'rounded-full'
                  }`}
                  style={{ 
                    width: isMobilePreview ? `${(profile.avatarSize || 100) * 0.8}px` : `${profile.avatarSize || 100}px`,
                    height: profile.avatarShape === 'rectangle' 
                      ? (isMobilePreview ? `${(profile.avatarSize || 100) * 0.8 * 1.33}px` : `${(profile.avatarSize || 100) * 1.33}px`)
                      : (isMobilePreview ? `${(profile.avatarSize || 100) * 0.8}px` : `${profile.avatarSize || 100}px`)
                  }}
                >
                  <img
                    src={profile.avatar || 'https://via.placeholder.com/150'}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${profile.avatarImageScale || 1})` }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg" />
              </div>
              
              <div className={`space-y-2 ${alignmentClass}`}>
                <h1 className={`font-black tracking-tight ${isMobilePreview ? 'text-3xl' : 'text-3xl md:text-5xl'}`} style={{ color: getContrastColor(profile.theme.backgroundColor) }}>
                  {profile.displayName}
                </h1>
                {profile.showSlug !== false && (
                  <p className={`opacity-60 font-medium ${isMobilePreview ? 'text-xl' : 'text-xl'}`} style={{ color: getContrastColor(profile.theme.backgroundColor) }}>
                    @{profile.slug}
                  </p>
                )}
              </div>
            </div>

            {/* Left Column Blocks */}
            {!isMobilePreview && leftBlocks.length > 0 && (
              <div className="w-full space-y-6">
                {leftBlocks.map((block) => (
                  <motion.div key={block.id} className={`w-full ${alignmentClass}`} {...animationProps}>
                    <RenderBlock block={block} theme={profile.theme} t={t} profile={profile} onBlockClick={() => handleBlockClick(block.id)} currentLang={currentLang} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* QR Code Section */}
            {profile.qrCodeEnabled && (
              <motion.div 
                className="p-6 bg-white rounded-3xl shadow-xl flex flex-col items-center gap-4 w-full max-w-[240px] mx-auto lg:mx-0"
                {...animationProps}
              >
                <QRCodeSVG 
                  value={
                    profile.qrCodeType === 'vcard' 
                      ? [
                          'BEGIN:VCARD',
                          'VERSION:3.0',
                          `FN:${profile.displayName}`,
                          profile.contactEmail ? `EMAIL:${profile.contactEmail}` : '',
                          profile.phoneNumber ? `TEL:${profile.phoneNumber}` : '',
                          `URL:${window.location.href}`,
                          'END:VCARD'
                        ].filter(Boolean).join('\n')
                      : window.location.href
                  } 
                  size={160}
                  level="H"
                  includeMargin={true}
                />
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scan Me</div>
              </motion.div>
            )}
          </div>

          {/* Main Content Area (Right Blocks) */}
          <div className={`w-full space-y-8 relative z-10 ${isMobilePreview ? '' : 'lg:w-2/3'}`}>
            <div className="space-y-6">
              {(isMobilePreview ? allBlocks : rightBlocks).map((block) => (
                <motion.div 
                  key={block.id} 
                  className={`w-full transform transition-all duration-500 hover:translate-x-1 ${alignmentClass}`}
                  {...animationProps}
                >
                  <RenderBlock block={block} theme={profile.theme} t={t} profile={profile} onBlockClick={() => handleBlockClick(block.id)} currentLang={currentLang} />
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-12 pb-6 border-t border-black/5">
              <p className={`text-xs text-gray-400 font-bold tracking-widest uppercase text-center ${isMobilePreview ? '' : 'lg:text-left'}`}>
                {t.createdWith}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Contact Button */}
      {profile.floatingContact?.enabled && profile.floatingContact.value && (
        <motion.a
          href={
            profile.floatingContact.platform === 'whatsapp' ? `https://wa.me/${profile.floatingContact.value.replace(/\D/g, '')}` :
            profile.floatingContact.platform === 'telegram' ? `https://t.me/${profile.floatingContact.value.startsWith('@') ? profile.floatingContact.value.slice(1) : profile.floatingContact.value}` :
            `tel:${profile.floatingContact.value}`
          }
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-[100] flex items-center justify-center text-white"
          style={{ 
            backgroundColor: profile.floatingContact.platform === 'whatsapp' ? '#25D366' : 
                             profile.floatingContact.platform === 'telegram' ? '#0088cc' : 
                             profile.theme.buttonColor 
          }}
        >
          {profile.floatingContact.platform === 'whatsapp' && <MessageCircle className="w-8 h-8" />}
          {profile.floatingContact.platform === 'telegram' && <Send className="w-8 h-8" />}
          {profile.floatingContact.platform === 'phone' && <Phone className="w-8 h-8" />}
        </motion.a>
      )}
    </div>
  );
}

function Carousel({ items, theme }: { items: any[], theme: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const next = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className="relative group w-full overflow-hidden rounded-2xl shadow-lg bg-black/5">
      <div className="flex transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className="w-full flex-shrink-0 aspect-video cursor-pointer"
            onClick={() => {
              setLightboxIndex(idx);
              setIsLightboxOpen(true);
            }}
          >
            <img src={item.url} className="w-full h-full object-cover" alt={`Slide ${idx}`} referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button 
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-2 h-2 rounded-full transition-all ${currentIndex === idx ? 'bg-white w-4' : 'bg-white/50'}`}
          />
        ))}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-8 right-8 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={() => setLightboxIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          
          <img 
            src={items[lightboxIndex].url} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            alt="Enlarged"
            referrerPolicy="no-referrer"
          />
          
          <button 
            onClick={() => setLightboxIndex((prev) => (prev + 1) % items.length)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  );
}

function ContactForm({ theme, t, profile }: { theme: any, t: any, profile: UserProfile }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If Telegram is configured, use it. Otherwise fallback to mailto
    if (profile.telegramBotToken && profile.telegramChatId) {
      setStatus('sending');
      try {
        const text = `🔔 *New Message from LinkBuilder*\n\n👤 *Name:* ${formData.name}\n📧 *Email:* ${formData.email}\n\n💬 *Message:*\n${formData.message}`;
        
        const response = await fetch(`https://api.telegram.org/bot${profile.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: profile.telegramChatId,
            text: text,
            parse_mode: 'Markdown'
          })
        });

        if (response.ok) {
          setStatus('sent');
          setFormData({ name: '', email: '', message: '' });
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          throw new Error('Failed to send to Telegram');
        }
      } catch (error) {
        console.error('Telegram error:', error);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
      return;
    }

    // Fallback to mailto if no Telegram configured
    if (!profile.contactEmail) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('sending');
    const subject = encodeURIComponent(`New message from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    
    setTimeout(() => {
      window.location.href = `mailto:${profile.contactEmail}?subject=${subject}&body=${body}`;
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 3000);
    }, 800);
  };

  if (status === 'sent') {
    return (
      <div className="bg-green-500/10 backdrop-blur-sm p-8 rounded-2xl border border-green-500/20 shadow-sm text-center space-y-2">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-600 font-bold">Message Sent!</p>
        <p className="text-green-600/70 text-sm">Thank you for reaching out.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-sm space-y-4">
      <input 
        required 
        type="text" 
        placeholder={t.name} 
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-3 rounded-xl bg-white/50 border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
      />
      <input 
        required 
        type="email" 
        placeholder={t.email} 
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-3 rounded-xl bg-white/50 border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
      />
      <textarea 
        required 
        placeholder={t.message} 
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        className="w-full px-4 py-3 rounded-xl bg-white/50 border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24" 
      />
      <button 
        disabled={status === 'sending'}
        className="w-full py-4 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2" 
        style={{ backgroundColor: theme.buttonColor, color: getContrastColor(theme.buttonColor) }}
      >
        {status === 'sending' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : t.sendMessage}
      </button>
      {status === 'error' && <p className="text-xs text-red-500 text-center">Failed to send. Try again later.</p>}
    </form>
  );
}

function RenderBlock({ block, theme, t, profile, onBlockClick, currentLang }: { block: Block, theme: any, t: any, profile: UserProfile, onBlockClick: () => void, currentLang: string }) {
  const contrastColor = getContrastColor(theme.backgroundColor);
  const lang = currentLang;
  
  // Robust content selection:
  // 1. Check if content is already in multi-lang format
  const isMultiLang = block.content && typeof block.content === 'object' && 
    (block.content.az || block.content.ru || block.content.en);
  
  const contentMap = isMultiLang ? block.content : { az: block.content || {} };

  // 2. Pick the best available language
  const content = contentMap[lang] || contentMap.az || contentMap.en || contentMap.ru || {};

  switch (block.type) {
    case 'header':
      return (
        <div className="space-y-2">
          <h2 
            className="font-bold leading-tight" 
            style={{ 
              color: contrastColor,
              fontSize: content.titleSize ? `${content.titleSize}px` : '1.25rem'
            }}
          >
            {content.title}
          </h2>
          <p 
            className="leading-relaxed" 
            style={{ 
              color: contrastColor, 
              opacity: 0.8,
              fontSize: content.descriptionSize ? `${content.descriptionSize}px` : '1rem'
            }}
          >
            {content.description}
          </p>
        </div>
      );
    case 'text':
      return (
        <p 
          className="whitespace-pre-wrap leading-relaxed" 
          style={{ 
            color: contrastColor,
            fontSize: content.fontSize ? `${content.fontSize}px` : '1rem'
          }}
        >
          {content.text}
        </p>
      );
    case 'button':
      return (
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onBlockClick}
          className="block w-full py-4 px-6 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
          style={{ backgroundColor: theme.buttonColor, color: getContrastColor(theme.buttonColor) }}
        >
          {content.label}
        </a>
      );
    case 'image':
      return (
        <div className="rounded-2xl overflow-hidden shadow-md" onClick={onBlockClick}>
          <img src={content.url} alt="Content" className="w-full h-auto object-cover" />
        </div>
      );
    case 'video':
      const youtubeId = getYoutubeId(content.url);
      return youtubeId ? (
        <div className="aspect-video rounded-2xl overflow-hidden shadow-md" onClick={onBlockClick}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="p-8 bg-gray-100 rounded-2xl text-center text-gray-400">
          <Play className="w-8 h-8 mx-auto mb-2" /> {t.invalidVideo}
        </div>
      );
    case 'socials':
      return (
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(content).map(([platform, value]) => {
            if (!value) return null;
            const url = getSocialUrl(platform as any, value as string);
            const Icon = getSocialIcon(platform as any);
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onBlockClick}
                className="p-3 rounded-full shadow-sm hover:shadow-md transition-all hover:scale-110 active:scale-95 hover:-translate-y-1"
                style={{ backgroundColor: theme.buttonColor, color: getContrastColor(theme.buttonColor) }}
              >
                <Icon className="w-6 h-6" />
              </a>
            );
          })}
        </div>
      );
    case 'map': {
      const getMapUrl = (address: string) => {
        if (!address) return '';
        if (address.includes('<iframe')) {
          const match = address.match(/src="([^"]+)"/);
          if (match && match[1]) return match[1];
        }
        if (address.startsWith('http')) return address;
        return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
      };

      const mapUrl = getMapUrl(content.address);

      return (
        <div className="space-y-3" onClick={onBlockClick}>
          {content.title && (
            <h3 className="text-lg font-bold text-gray-900 px-2">{content.title}</h3>
          )}
          <div className="aspect-video rounded-2xl overflow-hidden shadow-md bg-gray-100">
            {mapUrl ? (
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400 mr-2" />
                <span className="text-gray-600 font-medium">{t.noAddress}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    case 'carousel':
      return <Carousel items={content.items || []} theme={theme} />;
    case 'faq':
      return (
        <div className="space-y-3">
          {(content.items || []).map((item: any, idx: number) => (
            <details key={idx} className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden transition-all hover:bg-white/20">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold" style={{ color: contrastColor }}>
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 opacity-50" />
                  {item.question}
                </span>
                <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90 opacity-50" />
              </summary>
              <div className="px-4 pb-4 text-sm opacity-80 leading-relaxed" style={{ color: contrastColor }}>
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      );
    case 'priceList':
      return (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl overflow-hidden shadow-sm">
          {(content.items || []).map((item: any, idx: number) => (
            <div key={idx} className={`p-5 flex items-start justify-between gap-4 ${idx !== 0 ? 'border-t border-white/10' : ''}`}>
              <div className="flex-1 space-y-1">
                <div className="font-bold flex items-center gap-2" style={{ color: contrastColor }}>
                  <Tag className="w-4 h-4 opacity-50" />
                  {item.title}
                </div>
                {item.description && (
                  <p className="text-xs opacity-60 leading-relaxed" style={{ color: contrastColor }}>{item.description}</p>
                )}
              </div>
              <div className="text-lg font-black whitespace-nowrap" style={{ color: theme.buttonColor }}>
                {item.price}{item.currency}
              </div>
            </div>
          ))}
        </div>
      );
    case 'divider':
      return (
        <div 
          className="w-full" 
          style={{ 
            height: `${content.thickness || 1}px`, 
            backgroundColor: content.color || '#e5e7eb',
            margin: `${content.margin || 20}px 0`
          }} 
        />
      );
    case 'spacer':
      return <div style={{ height: `${content.height || 40}px` }} />;
    case 'testimonials':
      return (
        <div className="grid grid-cols-1 gap-4">
          {(content.items || []).map((item: any, idx: number) => (
            <div key={idx} className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl shadow-sm space-y-4 relative">
              <Quote className="absolute top-4 right-4 w-8 h-8 opacity-10" style={{ color: contrastColor }} />
              <p className="italic leading-relaxed" style={{ color: contrastColor }}>"{item.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold" style={{ color: contrastColor }}>
                  {item.name?.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: contrastColor }}>{item.name}</div>
                  <div className="text-[10px] opacity-50 uppercase font-bold tracking-wider" style={{ color: contrastColor }}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    case 'countdown':
      console.log('Rendering countdown block:', { targetDate: content.targetDate, title: content.title });
      return <Countdown targetDate={content.targetDate} title={content.title} color={theme.buttonColor} contrastColor={contrastColor} />;
    case 'file':
      return (
        <a
          href={content.url}
          download={content.fileName || 'download'}
          onClick={onBlockClick}
          className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl transition-all hover:bg-white/20 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" style={{ color: contrastColor }} />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm" style={{ color: contrastColor }}>{content.label || 'Download File'}</div>
              <div className="text-[10px] opacity-50" style={{ color: contrastColor }}>{content.fileName}</div>
            </div>
          </div>
          <Download className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: contrastColor }} />
        </a>
      );
    case 'stats':
      return (
        <div className="grid grid-cols-2 gap-4">
          {(content.items || []).map((item: any, idx: number) => (
            <StatCounter 
              key={idx} 
              value={item.value || 0} 
              label={item.label || ''} 
              suffix={item.suffix || ''} 
              color={theme.buttonColor} 
              contrastColor={contrastColor} 
            />
          ))}
        </div>
      );
    case 'form':
      return (
        <div id="contact-form">
          <ContactForm theme={theme} t={t} profile={profile} />
        </div>
      );
    default:
      return null;
  }
}

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getSocialUrl(platform: string, value: string) {
  switch (platform) {
    case 'whatsapp': return `https://wa.me/${value.replace(/\D/g, '')}`;
    case 'telegram': return `https://t.me/${value.startsWith('@') ? value.slice(1) : value}`;
    case 'instagram': return value.startsWith('http') ? value : `https://instagram.com/${value}`;
    case 'facebook': return value.startsWith('http') ? value : `https://facebook.com/${value}`;
    case 'tiktok': return value.startsWith('http') ? value : `https://tiktok.com/@${value}`;
    case 'youtube': return value.startsWith('http') ? value : `https://youtube.com/@${value}`;
    case 'twitter': return value.startsWith('http') ? value : `https://twitter.com/${value}`;
    case 'linkedin': return value.startsWith('http') ? value : `https://linkedin.com/in/${value}`;
    default: return value;
  }
}

function getSocialIcon(platform: string) {
  const iconProps = { className: "w-6 h-6" };
  
  switch (platform) {
    case 'whatsapp':
      return () => (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      );
    case 'telegram':
      return () => (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0C5.346 0 0 5.346 0 11.944c0 6.597 5.346 11.944 11.944 11.944 6.598 0 11.944-5.347 11.944-11.944C23.888 5.346 18.542 0 11.944 0zm5.206 8.19c-.178 1.868-.955 6.434-1.345 8.52-.165.882-.49 1.178-.805 1.207-.693.064-1.218-.456-1.889-.895-1.05-.687-1.644-1.113-2.663-1.784-1.178-.776-.415-1.202.257-1.898.176-.182 3.23-2.962 3.288-3.21.007-.03.014-.145-.054-.205-.068-.06-.168-.04-.24-.023-.102.023-1.722 1.096-4.858 3.217-.46.316-.876.472-1.246.463-.408-.01-1.192-.232-1.774-.42-.714-.23-1.28-.353-1.23-.746.026-.205.308-.416.846-.634 3.31-1.44 5.518-2.39 6.623-2.85 3.155-1.31 3.81-1.538 4.238-1.545.094-.002.305.02.44.13.114.093.145.218.153.306.008.09.01.258.005.346z"/>
        </svg>
      );
    case 'instagram': return Instagram;
    case 'facebook': return Facebook;
    case 'tiktok':
      return () => (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.74-3.91-1.71-.09-.07-.17-.15-.24-.22v8.1c0 1.57-.2 3.17-1.02 4.53-1.12 1.92-3.28 3.17-5.49 3.2-2.39.04-4.73-1.18-5.91-3.25-1.11-1.91-1.11-4.43 0-6.34 1.18-2.07 3.52-3.29 5.91-3.25.13 0 .26.01.39.02v4.13c-.89-.14-1.85.12-2.54.72-.88.77-1.1 2.12-.51 3.13.51 1.02 1.75 1.54 2.85 1.25 1.01-.25 1.75-1.18 1.75-2.22V.02z"/>
        </svg>
      );
    case 'youtube': return Youtube;
    case 'twitter': return Twitter;
    case 'linkedin': return Linkedin;
    default: return ExternalLink;
  }
}

function getContrastColor(hexcolor: string) {
  if (!hexcolor) return '#000000';
  let cleanHex = hexcolor.replace("#", "");
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';
  
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}
