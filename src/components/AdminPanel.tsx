// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc, query, orderBy, writeBatch, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Block, BlockType } from '../types';
import { 
  LogOut, Settings, Plus, Trash2, GripVertical, Image as ImageIcon, 
  Type, Link as LinkIcon, Video, Share2, MapPin, MessageSquare, 
  Palette, Smartphone, Monitor, RefreshCw, Loader2, Save, X,
  Instagram, Facebook, Youtube, Twitter, Linkedin, Send,
  HelpCircle, Tag, Minus, MoveVertical, Quote, Timer, FileText, BarChart3
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PublicPage from './PublicPage';

interface AdminPanelProps {
  user: User;
}

const translations = {
  en: {
    editor: 'Editor',
    blocks: 'Blocks',
    design: 'Design',
    profile: 'Profile',
    preview: 'Preview',
    viewLive: 'View Live Page',
    signOut: 'Sign Out',
    header: 'Header',
    text: 'Text',
    button: 'Button',
    image: 'Image',
    video: 'Video',
    socials: 'Socials',
    form: 'Form',
    map: 'Map',
    bgColor: 'Background Color',
    btnColor: 'Button Color',
    alignment: 'Text Alignment',
    displayName: 'Display Name',
    slug: 'URL Slug',
    avatar: 'Avatar',
    coverImage: 'Cover Image',
    contactEmail: 'Contact Form Email',
    telegramBotToken: 'Telegram Bot Token',
    telegramChatId: 'Telegram Chat ID',
    language: 'Language',
    fontFamily: 'Font Family',
    showSlug: 'Show URL Slug on Page',
    save: 'Save Changes',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading your editor...',
    profileNotFound: 'Profile not found',
    goBack: 'Go back to Login',
    title: 'Title',
    description: 'Description',
    textPlaceholder: 'Your text here...',
    btnLabel: 'Button Label',
    urlPlaceholder: 'URL (https://...)',
    uploadImage: 'Upload Image',
    pasteUrl: 'Or paste image URL',
    videoUrl: 'YouTube URL',
    phone: 'Phone number',
    userLink: 'Username/Link',
    mapPlaceholder: 'Address or Google Maps Embed URL',
    mapTitle: 'Location Title (Optional)',
    formInfo: 'This will add a contact form to your page. Messages will be sent to your email.',
    column: 'Desktop Column',
    left: 'Left (Sidebar)',
    right: 'Right (Main)',
    clicks: 'clicks',
    fontSize: 'Font Size',
    titleSize: 'Title Size',
    descSize: 'Description Size',
    showSeparator: 'Show Animated Separator',
    carousel: 'Carousel',
    addPhoto: 'Add Photo',
    adjustPosition: 'Adjust Vertical Position',
    avatarSize: 'Avatar Size',
    imageScale: 'Image Scale',
    shape: 'Shape',
    circle: 'Circle',
    square: 'Square',
    rectangle: 'Rectangle',
    separatorAnimation: 'Separator Animation',
    animNone: 'None',
    animPulse: 'Pulse (Glow)',
    animRainbow: 'Rainbow (Color)',
    animFlow: 'Flow (Movement)',
    faq: 'FAQ',
    priceList: 'Price List',
    divider: 'Divider',
    spacer: 'Spacer',
    testimonials: 'Testimonials',
    countdown: 'Countdown',
    file: 'File',
    seoTitle: 'SEO Title',
    seoDescription: 'SEO Description',
    floatingContact: 'Floating Contact Button',
    qrCode: 'QR Code',
    qrCodeType: 'QR Code Content',
    qrTypeUrl: 'Page URL',
    qrTypeVcard: 'Contact Info (vCard)',
    phoneNumber: 'Phone Number',
    animationEnabled: 'Enable Scroll Animations',
    addQuestion: 'Add Question',
    addItem: 'Add Item',
    price: 'Price',
    currency: 'Currency',
    targetDate: 'Target Date',
    uploadFile: 'Upload File',
    testimonialName: 'Name',
    testimonialRole: 'Role/Company',
    testimonialText: 'Testimonial',
    question: 'Question',
    answer: 'Answer',
    itemTitle: 'Item Name',
    itemDesc: 'Item Description',
    stats: 'Statistics',
    statValue: 'Value (Number)',
    statSuffix: 'Suffix (e.g. % or +)',
  },
  ru: {
    editor: 'Редактор',
    blocks: 'Блоки',
    design: 'Дизайн',
    profile: 'Профиль',
    preview: 'Предпросмотр',
    viewLive: 'Открыть страницу',
    signOut: 'Выйти',
    header: 'Заголовок',
    text: 'Текст',
    button: 'Кнопка',
    image: 'Изображение',
    video: 'Видео',
    socials: 'Соцсети',
    form: 'Форма',
    map: 'Карта',
    bgColor: 'Цвет фона',
    btnColor: 'Цвет кнопок',
    alignment: 'Выравнивание текста',
    displayName: 'Отображаемое имя',
    slug: 'Адрес страницы (Slug)',
    avatar: 'Аватар',
    coverImage: 'Обложка',
    contactEmail: 'Email для формы контактов',
    telegramBotToken: 'Токен Telegram бота',
    telegramChatId: 'ID чата Telegram',
    language: 'Язык',
    fontFamily: 'Шрифт',
    showSlug: 'Показывать адрес страницы под именем',
    save: 'Сохранить изменения',
    edit: 'Редактировать',
    delete: 'Удалить',
    loading: 'Загрузка редактора...',
    profileNotFound: 'Профиль не найден',
    goBack: 'Вернуться ко входу',
    title: 'Заголовок',
    description: 'Описание',
    textPlaceholder: 'Ваш текст здесь...',
    btnLabel: 'Текст кнопки',
    urlPlaceholder: 'Ссылка (https://...)',
    uploadImage: 'Загрузить изображение',
    pasteUrl: 'Или вставьте ссылку',
    videoUrl: 'Ссылка на YouTube',
    phone: 'Номер телефона',
    userLink: 'Имя пользователя/Ссылка',
    mapPlaceholder: 'Адрес или ссылка на встраивание Google Карт',
    mapTitle: 'Название места (необязательно)',
    formInfo: 'Это добавит контактную форму. Сообщения будут приходить на ваш email.',
    column: 'Колонка (Десктоп)',
    left: 'Слева (Сайдбар)',
    right: 'Справа (Основная)',
    clicks: 'кликов',
    fontSize: 'Размер шрифта',
    titleSize: 'Размер заголовка',
    descSize: 'Размер описания',
    showSeparator: 'Показывать анимированный разделитель',
    carousel: 'Карусель',
    addPhoto: 'Добавить фото',
    adjustPosition: 'Настроить положение по вертикали',
    avatarSize: 'Размер аватара',
    imageScale: 'Масштаб фото',
    shape: 'Форма',
    circle: 'Круг',
    square: 'Квадрат',
    rectangle: 'Прямоугольник',
    separatorAnimation: 'Анимация разделителя',
    animNone: 'Нет',
    animPulse: 'Пульсация (Подсветка)',
    animRainbow: 'Радуга (Цвет)',
    animFlow: 'Поток (Форма/Движение)',
    faq: 'FAQ (Вопросы)',
    priceList: 'Прайс-лист',
    divider: 'Разделитель',
    spacer: 'Отступ',
    testimonials: 'Отзывы',
    countdown: 'Таймер',
    file: 'Файл',
    seoTitle: 'SEO Заголовок',
    seoDescription: 'SEO Описание',
    floatingContact: 'Плавающая кнопка связи',
    qrCode: 'QR-код страницы',
    qrCodeType: 'Содержимое QR-кода',
    qrTypeUrl: 'Ссылка на страницу',
    qrTypeVcard: 'Контактная информация (vCard)',
    phoneNumber: 'Номер телефона',
    animationEnabled: 'Анимация при прокрутке',
    addQuestion: 'Добавить вопрос',
    addItem: 'Добавить позицию',
    price: 'Цена',
    currency: 'Валюта',
    targetDate: 'Дата окончания',
    uploadFile: 'Загрузить файл',
    testimonialName: 'Имя',
    testimonialRole: 'Должность/Компания',
    testimonialText: 'Текст отзыва',
    question: 'Вопрос',
    answer: 'Ответ',
    itemTitle: 'Название позиции',
    itemDesc: 'Описание позиции',
    stats: 'Статистика',
    statValue: 'Значение (Число)',
    statSuffix: 'Суффикс (напр. % или +)',
  },
  az: {
    editor: 'Redaktor',
    blocks: 'Bloklar',
    design: 'Dizayn',
    profile: 'Profil',
    preview: 'Ön baxış',
    viewLive: 'Səhifəyə bax',
    signOut: 'Çıxış',
    header: 'Başlıq',
    text: 'Mətn',
    button: 'Düymə',
    image: 'Şəkil',
    video: 'Video',
    socials: 'Sosial şəbəkələr',
    form: 'Forma',
    map: 'Xəritə',
    bgColor: 'Arxa fon rəngi',
    btnColor: 'Düymə rəngi',
    alignment: 'Mətnin düzləndirilməsi',
    displayName: 'Görünən ad',
    slug: 'Səhifə ünvanı (Slug)',
    avatar: 'Profil şəkli',
    coverImage: 'Kaver şəkli',
    contactEmail: 'Əlaqə forması üçün email',
    telegramBotToken: 'Telegram Bot Tokeni',
    telegramChatId: 'Telegram Çat ID-si',
    language: 'Dil',
    fontFamily: 'Şrift',
    showSlug: 'Səhifə ünvanını göstər',
    save: 'Dəyişiklikləri yadda saxla',
    edit: 'Redaktə et',
    delete: 'Sil',
    loading: 'Redaktor yüklənir...',
    profileNotFound: 'Profil tapılmadı',
    goBack: 'Giriş səhifəsinə qayıt',
    title: 'Başlıq',
    description: 'Təsvir',
    textPlaceholder: 'Mətniniz buraya...',
    btnLabel: 'Düymə mətni',
    urlPlaceholder: 'Link (https://...)',
    uploadImage: 'Şəkil yüklə',
    pasteUrl: 'Və ya linki yapışdırın',
    videoUrl: 'YouTube linki',
    phone: 'Telefon nömrəsi',
    userLink: 'İstifadəçi adı/Link',
    mapPlaceholder: 'Ünvan və ya Google Xəritə yerləşdirmə linki',
    mapTitle: 'Məkanın adı (istəyə bağlı)',
    formInfo: 'Bu, səhifənizə əlaqə forması əlavə edəcək. Mesajlar emailinizə göndəriləcək.',
    column: 'Sütun (Masaüstü)',
    left: 'Sol (Sidebar)',
    right: 'Sağ (Əsas)',
    clicks: 'klik',
    fontSize: 'Şrift ölçüsü',
    titleSize: 'Başlıq ölçüsü',
    descSize: 'Təsvir ölçüsü',
    showSeparator: 'Animasiyalı ayırıcı göstər',
    carousel: 'Karusel',
    addPhoto: 'Şəkil əlavə et',
    adjustPosition: 'Şaquli mövqeyi tənzimləyin',
    avatarSize: 'Profil şəkli ölçüsü',
    imageScale: 'Şəkil miqyası',
    shape: 'Forma',
    circle: 'Dairə',
    square: 'Kvadrat',
    rectangle: 'Düzbucaqlı',
    separatorAnimation: 'Ayırıcı animasiyası',
    animNone: 'Yoxdur',
    animPulse: 'Pulsasiya (İşıqlandırma)',
    animRainbow: 'Göy qurşağı (Rəng)',
    animFlow: 'Axın (Forma/Hərəkət)',
    faq: 'FAQ (Suallar)',
    priceList: 'Qiymət siyahısı',
    divider: 'Ayırıcı',
    spacer: 'Boşluq',
    testimonials: 'Rəylər',
    countdown: 'Taymer',
    file: 'Fayl',
    seoTitle: 'SEO Başlığı',
    seoDescription: 'SEO Təsviri',
    floatingContact: 'Üzən əlaqə düyməsi',
    qrCode: 'Səhifənin QR kodu',
    qrCodeType: 'QR Kod Məzmunu',
    qrTypeUrl: 'Səhifə Linki',
    qrTypeVcard: 'Əlaqə Məlumatı (vCard)',
    phoneNumber: 'Telefon nömrəsi',
    animationEnabled: 'Sürüşdürmə animasiyası',
    addQuestion: 'Sual əlavə et',
    addItem: 'Məhsul əlavə et',
    price: 'Qiymət',
    currency: 'Valyuta',
    targetDate: 'Hədəf tarixi',
    uploadFile: 'Fayl yüklə',
    testimonialName: 'Ad',
    testimonialRole: 'Vəzifə/Şirkət',
    testimonialText: 'Rəy mətni',
    question: 'Sual',
    answer: 'Cavab',
    itemTitle: 'Məhsul adı',
    itemDesc: 'Məhsul təsviri',
    stats: 'Statistika',
    statValue: 'Qiymət (Rəqəm)',
    statSuffix: 'Sufiks (məs. % və ya +)',
  }
};

const FONT_FAMILIES = [
  { name: 'Default', value: 'inherit' },
  { name: 'Inter', value: '"Inter", sans-serif' },
  { name: 'Roboto', value: '"Roboto", sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Montserrat', value: '"Montserrat", sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Oswald', value: '"Oswald", sans-serif' },
  { name: 'Raleway', value: '"Raleway", sans-serif' },
  { name: 'Poppins', value: '"Poppins", sans-serif' },
  { name: 'Lato', value: '"Lato", sans-serif' },
  { name: 'Merriweather', value: '"Merriweather", serif' },
  { name: 'Nunito', value: '"Nunito", sans-serif' },
  { name: 'Ubuntu', value: '"Ubuntu", sans-serif' },
  { name: 'Lora', value: '"Lora", serif' },
  { name: 'Quicksand', value: '"Quicksand", sans-serif' },
];

export default function AdminPanel({ user }: AdminPanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'blocks' | 'design' | 'profile'>('blocks');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isSaving, setIsSaving] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [adminLanguage, setAdminLanguage] = useState<'az' | 'en' | 'ru'>('az');

  const t = translations[adminLanguage];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!user?.uid) {
      console.warn('[AdminPanel] No user UID in useEffect');
      return;
    }
    console.log(`[AdminPanel] Setting up listeners for UID: ${user.uid}`);
    console.log(`[AdminPanel] Connection status: ${navigator.onLine ? 'Online' : 'Offline'}`);

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('[AdminPanel] Profile snapshot received for slug:', data.slug);
        setProfile({ 
          uid: doc.id, 
          ...data,
          language: data.language || 'az'
        } as UserProfile);
      } else {
        console.warn('[AdminPanel] Profile document does not exist for UID:', user.uid);
      }
      setLoading(false);
    }, (err) => {
      console.error("[AdminPanel] Profile snapshot error:", err);
      if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
        setQuotaError(true);
      }
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    const q = query(collection(db, 'blocks', user.uid, 'items'), orderBy('order', 'asc'));
    const unsubBlocks = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Block));
      console.log(`[AdminPanel] Blocks snapshot received: ${items.length} items`);
      setBlocks(items);
      
      // CRITICAL: Update editingBlock if it's currently open to prevent stale data overwrites
      setEditingBlock(current => {
        if (!current) return null;
        const latest = items.find(b => b.id === current.id);
        return latest || null;
      });
    }, (err) => {
      console.error("[AdminPanel] Blocks snapshot error:", err);
      if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
        setQuotaError(true);
      }
      handleFirestoreError(err, OperationType.LIST, `blocks/${user.uid}/items`);
    });

    const handleStatusChange = () => {
      console.log(`[AdminPanel] Connection status changed: ${navigator.onLine ? 'Online' : 'Offline'}`);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      console.log('[AdminPanel] Cleaning up listeners');
      unsubProfile();
      unsubBlocks();
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [user.uid]);

  const handleAddBlock = async (type: BlockType) => {
    if (!user?.uid) {
      console.error('[AdminPanel] Cannot add block: No user UID');
      return;
    }
    setIsSaving(true);
    const path = `blocks/${user.uid}/items`;
    console.log(`[AdminPanel] Adding block of type: ${type} to ${path}`);
    
    // Safety timeout for the UI state
    const timeoutId = setTimeout(() => {
      console.warn('[AdminPanel] Add block operation timed out in UI');
      setIsSaving(false);
    }, 10000);

    try {
      const defaultContent = getDefaultContent(type);
      const newBlock = {
        type,
        content: {
          az: defaultContent,
          en: defaultContent,
          ru: defaultContent
        },
        order: blocks.length,
        createdAt: new Date(), // Use local date for faster local sync and testing
        column: 'right'
      };
      
      const docRef = await addDoc(collection(db, 'blocks', user.uid, 'items'), newBlock);
      console.log(`[AdminPanel] Block added successfully with ID: ${docRef.id}`);
      clearTimeout(timeoutId);
      setQuotaError(false);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[AdminPanel] Add block error:', err);
      if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
        setQuotaError(true);
      }
      // Don't throw, just log and handle
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch (e) {
        // handleFirestoreError throws, we catch it here to prevent crash
        const msg = e.message?.includes('Quota') ? "Firestore Quota Exceeded. Please try again tomorrow." : err.message;
        alert("Error saving: " + msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    setIsSaving(true);
    const path = `blocks/${user.uid}/items/${id}`;
    
    const timeoutId = setTimeout(() => {
      console.warn('[AdminPanel] Delete block operation timed out');
      setIsSaving(false);
    }, 10000);

    try {
      await deleteDoc(doc(db, 'blocks', user.uid, 'items', id));
      clearTimeout(timeoutId);
      setQuotaError(false);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Delete block error:', err);
      if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
        setQuotaError(true);
      }
      handleFirestoreError(err, OperationType.DELETE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBlock = async (id: string, content: any, column?: 'left' | 'right') => {
    if (!user?.uid) return;
    setIsSaving(true);
    const path = `blocks/${user.uid}/items/${id}`;
    console.log(`[AdminPanel] Updating block at ${path}`, { content, column });
    
    const timeoutId = setTimeout(() => {
      console.warn('[AdminPanel] Update block operation timed out in UI');
      setIsSaving(false);
    }, 10000);

    try {
      await updateDoc(doc(db, 'blocks', user.uid, 'items', id), { 
        content,
        column: column || 'right'
      });
      console.log(`[AdminPanel] Block ${id} updated successfully on server`);
      clearTimeout(timeoutId);
      setQuotaError(false);
      setEditingBlock(null);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[AdminPanel] Block update error:', err);
      if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
        setQuotaError(true);
      }
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch (e) {
        const msg = e.message?.includes('Quota') ? "Firestore Quota Exceeded. Please try again tomorrow." : err.message;
        alert("Error updating: " + msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = event.active.id;
    const overId = event.over?.id;
    if (overId && activeId !== overId) {
      setIsSaving(true);
      const oldIndex = (blocks as any).findIndex((item: any) => item.id === activeId);
      const newIndex = (blocks as any).findIndex((item: any) => item.id === overId);
      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      
      const timeoutId = setTimeout(() => {
        console.warn('[AdminPanel] Reorder operation timed out');
        setIsSaving(false);
      }, 10000);

      try {
        // Update order in Firestore
        const batch = writeBatch(db);
        newBlocks.forEach((block, index) => {
          const ref = doc(db, 'blocks', user.uid, 'items', block.id);
          batch.update(ref, { order: index });
        });
        await batch.commit();
        clearTimeout(timeoutId);
        setQuotaError(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Reorder error:', err);
        if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
          setQuotaError(true);
        }
        handleFirestoreError(err, OperationType.UPDATE, `blocks/${user.uid}/items (batch order update)`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setIsSaving(true);
    const path = `users/${user.uid}`;
    console.log(`[AdminPanel] Updating profile at ${path}`, updates);
    
    const timeoutId = setTimeout(() => {
      console.warn('[AdminPanel] Profile update timed out');
      setIsSaving(false);
    }, 10000);

    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      console.log(`[AdminPanel] Profile updated successfully on server`);
      clearTimeout(timeoutId);
      setQuotaError(false);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[AdminPanel] Profile update error:', err);
      if (err.message?.includes('resource-exhausted') || err.message?.includes('Quota exceeded')) {
        setQuotaError(true);
      }
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        console.error('File is too large (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">{translations.en.loading}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{translations.en.profileNotFound}</h2>
          <p className="text-gray-600 mb-6">We couldn't find your profile. This might happen if registration was interrupted.</p>
          <button 
            onClick={() => auth.signOut()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {translations.en.goBack}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar / Editor */}
      <div className="lg:w-[25%] w-full p-4 md:p-8 overflow-y-auto border-r border-gray-200">
        {quotaError && (
          <div className="mb-4 p-3 bg-red-600 text-white rounded-xl text-center text-xs font-bold animate-pulse">
            Firestore Quota Exceeded. Writes are disabled until reset (usually tomorrow).
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{t.editor}</h1>
              {isSaving && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {(['az', 'en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setAdminLanguage(lang)}
                  className={`text-[10px] font-bold px-2 py-1 rounded uppercase transition-all ${
                    adminLanguage === lang 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => auth.signOut()}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title={t.signOut}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-8">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'blocks' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.blocks}
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'design' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.design}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'profile' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.profile}
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'blocks' && (
            <>
              {/* Add Block Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <AddBlockButton icon={<Type />} label={t.header} onClick={() => handleAddBlock('header')} />
                <AddBlockButton icon={<Type />} label={t.text} onClick={() => handleAddBlock('text')} />
                <AddBlockButton icon={<LinkIcon />} label={t.button} onClick={() => handleAddBlock('button')} />
                <AddBlockButton icon={<ImageIcon />} label={t.image} onClick={() => handleAddBlock('image')} />
                <AddBlockButton icon={<Video />} label={t.video} onClick={() => handleAddBlock('video')} />
                <AddBlockButton icon={<Share2 />} label={t.socials} onClick={() => handleAddBlock('socials')} />
                <AddBlockButton icon={<MessageSquare />} label={t.form} onClick={() => handleAddBlock('form')} />
                <AddBlockButton icon={<MapPin />} label={t.map} onClick={() => handleAddBlock('map')} />
                <AddBlockButton icon={<ImageIcon />} label={t.carousel} onClick={() => handleAddBlock('carousel')} />
                <AddBlockButton icon={<HelpCircle />} label={t.faq} onClick={() => handleAddBlock('faq')} />
                <AddBlockButton icon={<Tag />} label={t.priceList} onClick={() => handleAddBlock('priceList')} />
                <AddBlockButton icon={<Minus />} label={t.divider} onClick={() => handleAddBlock('divider')} />
                <AddBlockButton icon={<MoveVertical />} label={t.spacer} onClick={() => handleAddBlock('spacer')} />
                <AddBlockButton icon={<Quote />} label={t.testimonials} onClick={() => handleAddBlock('testimonials')} />
                <AddBlockButton icon={<Timer />} label={t.countdown} onClick={() => handleAddBlock('countdown')} />
                <AddBlockButton icon={<FileText />} label={t.file} onClick={() => handleAddBlock('file')} />
                <AddBlockButton icon={<BarChart3 />} label={t.stats} onClick={() => handleAddBlock('stats')} />
              </div>

              {/* Blocks List */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4 mt-8">
                    {blocks.map((block) => (
                      <div key={block.id}>
                        <SortableBlockItem 
                          block={block} 
                          onDelete={() => handleDeleteBlock(block.id)} 
                          onEdit={() => setEditingBlock(block)}
                          adminLanguage={adminLanguage}
                          profile={profile}
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}

          {activeTab === 'design' && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.bgColor}</label>
                <input
                  type="color"
                  value={profile.theme.backgroundColor}
                  onChange={(e) => handleUpdateProfile({ theme: { ...profile.theme, backgroundColor: e.target.value } })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.btnColor}</label>
                <input
                  type="color"
                  value={profile.theme.buttonColor}
                  onChange={(e) => handleUpdateProfile({ theme: { ...profile.theme, buttonColor: e.target.value } })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.alignment}</label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => handleUpdateProfile({ theme: { ...profile.theme, textAlign: align as any } })}
                      className={`flex-1 py-2 rounded-lg border ${
                        profile.theme.textAlign === align ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.fontFamily}</label>
                <select
                  value={profile.theme.fontFamily || 'inherit'}
                  onChange={(e) => handleUpdateProfile({ theme: { ...profile.theme, fontFamily: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center pt-2">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={profile.showSeparator !== false} // Default to true
                      onChange={(e) => handleUpdateProfile({ showSeparator: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${profile.showSeparator !== false ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.showSeparator !== false ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-700">
                    {t.showSeparator}
                  </div>
                </label>
              </div>

              {profile.showSeparator !== false && (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium text-gray-700">{t.separatorAnimation}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'pulse', 'rainbow', 'flow'] as const).map((anim) => (
                      <button
                        key={anim}
                        onClick={() => handleUpdateProfile({ separatorAnimation: anim })}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                          (profile.separatorAnimation || 'none') === anim 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t[`anim${anim.charAt(0).toUpperCase() + anim.slice(1)}` as keyof typeof t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center pt-2">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={profile.theme.animationEnabled !== false} 
                      onChange={(e) => handleUpdateProfile({ theme: { ...profile.theme, animationEnabled: e.target.checked } })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${profile.theme.animationEnabled !== false ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.theme.animationEnabled !== false ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-700">
                    {t.animationEnabled}
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">{t.coverImage}</label>
                <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden group aspect-[4/1]">
                  {profile.coverImage ? (
                    <img 
                      src={profile.coverImage} 
                      className="w-full h-full object-cover" 
                      alt="Cover" 
                      style={{ objectPosition: `center ${profile.coverImagePosition ?? 50}%` }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  
                  {/* Real Overlap Preview in Admin */}
                  {profile.coverImage && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-white bg-white translate-y-1/2 z-10 shadow-lg flex items-center justify-center overflow-hidden">
                      {profile.avatar ? (
                        <img src={profile.avatar} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                  )}

                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-20">
                    <Plus className="w-6 h-6 mr-2" /> {t.coverImage}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleUpdateProfile({ coverImage: reader.result as string, coverImagePosition: 50 });
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
                {profile.coverImage && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-500 mb-2">{t.adjustPosition}</label>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={profile.coverImagePosition ?? 50}
                      onChange={(e) => handleUpdateProfile({ coverImagePosition: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pt-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div 
                      className={`overflow-hidden border-4 border-white shadow-md relative z-10 bg-gray-100 flex items-center justify-center ${
                        profile.avatarShape === 'square' ? 'rounded-xl' : 
                        profile.avatarShape === 'rectangle' ? 'rounded-xl aspect-[3/4]' : 
                        'rounded-full'
                      }`}
                      style={{ 
                        width: `${profile.avatarSize || 100}px`, 
                        height: profile.avatarShape === 'rectangle' ? `${(profile.avatarSize || 100) * 1.33}px` : `${profile.avatarSize || 100}px` 
                      }}
                    >
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          style={{ transform: `scale(${profile.avatarImageScale || 1})` }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-20">
                        <ImageIcon className="w-6 h-6" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.avatarSize}</label>
                      <input 
                        type="range"
                        min="60"
                        max="160"
                        value={profile.avatarSize || 100}
                        onChange={(e) => handleUpdateProfile({ avatarSize: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.imageScale}</label>
                      <input 
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={profile.avatarImageScale || 1}
                        onChange={(e) => handleUpdateProfile({ avatarImageScale: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.shape}</label>
                      <div className="flex gap-2">
                        {(['circle', 'square', 'rectangle'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleUpdateProfile({ avatarShape: s })}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                              (profile.avatarShape || 'circle') === s 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {t[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.displayName}</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => handleUpdateProfile({ displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Smart Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{t.seoTitle}</label>
                    <input
                      type="text"
                      value={profile.seoTitle || ''}
                      onChange={(e) => handleUpdateProfile({ seoTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{t.seoDescription}</label>
                    <input
                      type="text"
                      value={profile.seoDescription || ''}
                      onChange={(e) => handleUpdateProfile({ seoDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-700">{t.qrCode}</div>
                      <div className="text-xs text-gray-500">Generate QR for your page</div>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={profile.qrCodeEnabled || false}
                        onChange={(e) => handleUpdateProfile({ qrCodeEnabled: e.target.checked })}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${profile.qrCodeEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.qrCodeEnabled ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </div>

                {profile.qrCodeEnabled && (
                  <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t.qrCodeType}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateProfile({ qrCodeType: 'url' })}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          (profile.qrCodeType || 'url') === 'url' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {t.qrTypeUrl}
                      </button>
                      <button
                        onClick={() => handleUpdateProfile({ qrCodeType: 'vcard' })}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          profile.qrCodeType === 'vcard' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {t.qrTypeVcard}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold text-gray-700">{t.floatingContact}</div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={profile.floatingContact?.enabled || false}
                          onChange={(e) => handleUpdateProfile({ floatingContact: { ...(profile.floatingContact || { platform: 'whatsapp', value: '' }), enabled: e.target.checked } })}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${profile.floatingContact?.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.floatingContact?.enabled ? 'translate-x-4' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                  
                  {profile.floatingContact?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                      <select
                        value={profile.floatingContact.platform}
                        onChange={(e) => handleUpdateProfile({ floatingContact: { ...profile.floatingContact, platform: e.target.value as any } })}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="telegram">Telegram</option>
                        <option value="phone">Phone</option>
                      </select>
                      <input
                        type="text"
                        placeholder={profile.floatingContact.platform === 'phone' ? t.phone : t.userLink}
                        value={profile.floatingContact.value}
                        onChange={(e) => handleUpdateProfile({ floatingContact: { ...profile.floatingContact, value: e.target.value } })}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.slug}</label>
                  <input
                    type="text"
                    value={profile.slug}
                    onChange={(e) => handleUpdateProfile({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={profile.showSlug !== false} // Default to true
                        onChange={(e) => handleUpdateProfile({ showSlug: e.target.checked })}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${profile.showSlug !== false ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.showSlug !== false ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-700">
                      {t.showSlug}
                    </div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.language}</label>
                  <select
                    value={profile.language}
                    onChange={(e) => handleUpdateProfile({ language: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="az">Azərbaycan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contactEmail}</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={profile.contactEmail || ''}
                    onChange={(e) => handleUpdateProfile({ contactEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.phoneNumber}</label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={profile.phoneNumber || ''}
                    onChange={(e) => handleUpdateProfile({ phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.telegramBotToken}</label>
                  <input
                    type="text"
                    placeholder="123456:ABC-DEF..."
                    value={profile.telegramBotToken || ''}
                    onChange={(e) => handleUpdateProfile({ telegramBotToken: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.telegramChatId}</label>
                  <input
                    type="text"
                    placeholder="123456789"
                    value={profile.telegramChatId || ''}
                    onChange={(e) => handleUpdateProfile({ telegramChatId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="hidden lg:flex flex-1 bg-gray-100 p-8 flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">{t.preview}</h2>
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              {(['az', 'en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleUpdateProfile({ language: lang })}
                  className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition-all ${
                    profile?.language === lang 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md ${previewMode === 'mobile' ? 'bg-gray-100 text-blue-600' : 'text-gray-400'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md ${previewMode === 'desktop' ? 'bg-gray-100 text-blue-600' : 'text-gray-400'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`transition-all duration-500 mx-auto bg-white shadow-2xl overflow-hidden relative ${
          previewMode === 'mobile' 
            ? 'w-[320px] h-[650px] rounded-[3rem] border-[12px] border-gray-900' 
            : 'w-full flex-1 rounded-xl border border-gray-200'
        }`}>
          <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
            <PublicPage profile={profile} previewBlocks={blocks} isMobilePreview={previewMode === 'mobile'} />
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1"
          >
            {t.viewLive} <RefreshCw className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Edit Block Modal */}
      {editingBlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{t.edit} {t[editingBlock.type] || editingBlock.type}</h3>
              <button onClick={() => setEditingBlock(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <BlockEditor 
                block={editingBlock} 
                onSave={(content, column) => handleUpdateBlock(editingBlock.id, content, column)} 
                t={t} 
                adminLanguage={adminLanguage}
                setAdminLanguage={setAdminLanguage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddBlockButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-gray-200 rounded-xl border border-gray-300 hover:border-blue-500 hover:bg-gray-300 transition-all group shadow-sm"
    >
      <div className="text-gray-700 group-hover:text-blue-600 mb-2">{icon}</div>
      <span className="text-xs font-medium text-gray-800 group-hover:text-blue-700">{label}</span>
    </button>
  );
}

interface SortableBlockItemProps {
  block: Block;
  onDelete: () => void | Promise<void>;
  onEdit: () => void;
}

function getBlockIcon(type: BlockType) {
  switch (type) {
    case 'header': return <Type className="w-4 h-4" />;
    case 'text': return <Type className="w-4 h-4" />;
    case 'button': return <LinkIcon className="w-4 h-4" />;
    case 'image': return <ImageIcon className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'socials': return <Share2 className="w-4 h-4" />;
    case 'form': return <MessageSquare className="w-4 h-4" />;
    case 'map': return <MapPin className="w-4 h-4" />;
    case 'carousel': return <ImageIcon className="w-4 h-4" />;
    case 'stats': return <BarChart3 className="w-4 h-4" />;
    default: return null;
  }
}

function SortableBlockItem({ block, onDelete, onEdit, adminLanguage, profile }: SortableBlockItemProps & { adminLanguage: string, profile: UserProfile }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  // For the list view, we show the current language or fallback to AZ/EN/RU
  const isMultiLang = block.content && typeof block.content === 'object' && 
    (block.content.az || block.content.ru || block.content.en);
  
  const contentMap = isMultiLang ? block.content : { az: block.content || {} };
  const content = contentMap[adminLanguage] || contentMap.az || contentMap.en || contentMap.ru || {};

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-100 p-4 rounded-xl border border-gray-300 shadow-sm flex items-center gap-4 group">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400">
        {getBlockIcon(block.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 capitalize">
          {translations[adminLanguage][block.type] || block.type}
        </p>
        <p className="text-xs text-gray-600 truncate">
          {block.type === 'text' ? content.text : 
           block.type === 'button' ? content.label : 
           block.type === 'carousel' ? `${content.items?.length || 0} photos` :
           block.type === 'stats' ? `${content.items?.length || 0} items` :
           block.type}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {block.clicks !== undefined && (
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-200 px-2 py-1 rounded-md">
            {block.clicks} {translations[adminLanguage].clicks}
          </div>
        )}
        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg">
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }} 
            className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-100 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onSave, t, adminLanguage, setAdminLanguage }: { 
  block: Block, 
  onSave: (content: any, column: 'left' | 'right') => void, 
  t: any, 
  adminLanguage: string,
  setAdminLanguage: (lang: 'az' | 'en' | 'ru') => void
}) {
  // Helper to get the content map safely
  const getContentMap = (b: Block) => {
    if (b.content && typeof b.content === 'object' && (b.content.az || b.content.ru || b.content.en)) {
      return b.content;
    }
    // Fallback for old flat format: treat it as Azerbaijani
    return { az: b.content || {} };
  };

  // State for the entire content map
  const [contentMap, setContentMap] = useState<any>(getContentMap(block));
  const [column, setColumn] = useState<'left' | 'right'>(block.column || 'right');

  // Sync only when the block ID changes (opening a different block)
  useEffect(() => {
    setContentMap(getContentMap(block));
    setColumn(block.column || 'right');
  }, [block.id]);

  // Get content for the current language from our local map
  const currentContent = contentMap[adminLanguage] || getDefaultContent(block.type);

  const updateContent = (updates: any) => {
    setContentMap((prev: any) => {
      const prevLangContent = prev[adminLanguage] || getDefaultContent(block.type);
      return {
        ...prev,
        [adminLanguage]: { ...prevLangContent, ...updates }
      };
    });
  };

  const handleSave = () => {
    onSave(contentMap, column);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("Image is too large. Please use an image smaller than 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateContent({ url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Language Switcher inside Editor */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Dil / Язык</span>
        <div className="flex gap-1">
          {(['az', 'en', 'ru'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setAdminLanguage(lang)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase transition-all ${
                adminLanguage === lang 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {block.type === 'header' && (
        <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.title}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t.title}
                value={currentContent.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <div className="w-24">
                <input
                  type="number"
                  min="8"
                  max="120"
                  value={currentContent.titleSize || 24}
                  onChange={(e) => updateContent({ titleSize: parseInt(e.target.value) })}
                  className="w-full px-2 py-2 border rounded-lg text-center"
                  title={t.titleSize}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.description}</label>
            <div className="flex gap-2">
              <textarea
                placeholder={t.description}
                value={currentContent.description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg h-24"
              />
              <div className="w-24">
                <input
                  type="number"
                  min="8"
                  max="120"
                  value={currentContent.descriptionSize || 16}
                  onChange={(e) => updateContent({ descriptionSize: parseInt(e.target.value) })}
                  className="w-full px-2 py-2 border rounded-lg text-center"
                  title={t.descSize}
                />
              </div>
            </div>
          </div>
        </>
      )}
      {block.type === 'text' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">{t.text}</label>
          <div className="flex gap-2">
            <textarea
              placeholder={t.textPlaceholder}
              value={currentContent.text || ''}
              onChange={(e) => updateContent({ text: e.target.value })}
              className="flex-1 px-4 py-2 border rounded-lg h-32"
            />
            <div className="w-24">
              <input
                type="number"
                min="8"
                max="120"
                value={currentContent.fontSize || 16}
                onChange={(e) => updateContent({ fontSize: parseInt(e.target.value) })}
                className="w-full px-2 py-2 border rounded-lg text-center"
                title={t.fontSize}
              />
            </div>
          </div>
        </div>
      )}
      {block.type === 'button' && (
        <>
          <input
            type="text"
            placeholder={t.btnLabel}
            value={currentContent.label || ''}
            onChange={(e) => updateContent({ label: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="url"
            placeholder={t.urlPlaceholder}
            value={currentContent.url || ''}
            onChange={(e) => updateContent({ url: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </>
      )}
      {block.type === 'image' && (
        <>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            {currentContent.url ? (
              <img src={currentContent.url} alt="Preview" className="max-h-48 mx-auto rounded-lg mb-4" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            )}
            <label className="cursor-pointer text-blue-600 font-medium hover:underline">
              {t.uploadImage}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
          <input
            type="text"
            placeholder={t.pasteUrl}
            value={currentContent.url || ''}
            onChange={(e) => updateContent({ url: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </>
      )}
      {block.type === 'video' && (
        <input
          type="url"
          placeholder={t.videoUrl}
          value={currentContent.url || ''}
          onChange={(e) => updateContent({ url: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
        />
      )}
      {block.type === 'socials' && (
        <div className="space-y-3">
          {[
            { id: 'whatsapp', icon: <MessageSquare className="w-4 h-4 text-green-600" /> },
            { id: 'telegram', icon: <Send className="w-4 h-4 text-blue-500" /> },
            { id: 'instagram', icon: <Instagram className="w-4 h-4 text-pink-600" /> },
            { id: 'facebook', icon: <Facebook className="w-4 h-4 text-blue-700" /> },
            { id: 'tiktok', icon: <Share2 className="w-4 h-4 text-black" /> },
            { id: 'youtube', icon: <Youtube className="w-4 h-4 text-red-600" /> },
            { id: 'twitter', icon: <Twitter className="w-4 h-4 text-gray-900" /> },
            { id: 'linkedin', icon: <Linkedin className="w-4 h-4 text-blue-800" /> },
          ].map(({ id, icon }) => (
            <div key={id} className="flex items-center gap-3">
              <div className="w-8 flex justify-center">{icon}</div>
              <span className="w-20 text-xs font-medium capitalize text-gray-500">{id}</span>
              <input
                type="text"
                placeholder={id === 'whatsapp' || id === 'telegram' ? t.phone : t.userLink}
                value={currentContent[id] || ''}
                onChange={(e) => updateContent({ [id]: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      )}
      {block.type === 'map' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t.mapTitle}
            value={currentContent.title || ''}
            onChange={(e) => updateContent({ title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea
            placeholder={t.mapPlaceholder}
            value={currentContent.address || ''}
            onChange={(e) => updateContent({ address: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg h-24"
          />
        </div>
      )}
      {block.type === 'carousel' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(currentContent.items || []).map((item: any, idx: number) => (
              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={item.url} className="w-full h-full object-cover" />
                <button 
                  onClick={() => {
                    const newItems = [...currentContent.items];
                    newItems.splice(idx, 1);
                    updateContent({ items: newItems });
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
              <Plus className="w-6 h-6 text-gray-400" />
              <span className="text-[10px] font-medium text-gray-500 mt-1">{t.addPhoto}</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const newItems = [...(currentContent.items || []), { url: reader.result as string }];
                      updateContent({ items: newItems });
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.pasteUrl}</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="https://..."
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      const newItems = [...(currentContent.items || []), { url }];
                      updateContent({ items: newItems });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {block.type === 'faq' && (
        <div className="space-y-4">
          {(currentContent.items || []).map((item: any, idx: number) => (
            <div key={idx} className="p-3 border rounded-lg space-y-2 relative group">
              <button 
                onClick={() => {
                  const newItems = [...currentContent.items];
                  newItems.splice(idx, 1);
                  updateContent({ items: newItems });
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3 h-3" />
              </button>
              <input
                type="text"
                placeholder={t.question}
                value={item.question || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].question = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm font-medium"
              />
              <textarea
                placeholder={t.answer}
                value={item.answer || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].answer = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm h-20"
              />
            </div>
          ))}
          <button 
            onClick={() => updateContent({ items: [...(currentContent.items || []), { question: '', answer: '' }] })}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t.addQuestion}
          </button>
        </div>
      )}
      {block.type === 'priceList' && (
        <div className="space-y-4">
          {(currentContent.items || []).map((item: any, idx: number) => (
            <div key={idx} className="p-3 border rounded-lg space-y-2 relative group">
              <button 
                onClick={() => {
                  const newItems = [...currentContent.items];
                  newItems.splice(idx, 1);
                  updateContent({ items: newItems });
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3 h-3" />
              </button>
              <input
                type="text"
                placeholder={t.itemTitle}
                value={item.title || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].title = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm font-medium"
              />
              <textarea
                placeholder={t.itemDesc}
                value={item.description || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].description = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm h-16"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.price}
                  value={item.price || ''}
                  onChange={(e) => {
                    const newItems = [...currentContent.items];
                    newItems[idx].price = e.target.value;
                    updateContent({ items: newItems });
                  }}
                  className="flex-1 px-3 py-1.5 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder={t.currency}
                  value={item.currency || '$'}
                  onChange={(e) => {
                    const newItems = [...currentContent.items];
                    newItems[idx].currency = e.target.value;
                    updateContent({ items: newItems });
                  }}
                  className="w-16 px-3 py-1.5 border rounded text-sm text-center"
                />
              </div>
            </div>
          ))}
          <button 
            onClick={() => updateContent({ items: [...(currentContent.items || []), { title: '', description: '', price: '', currency: '$' }] })}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t.addItem}
          </button>
        </div>
      )}
      {block.type === 'divider' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Color</label>
            <input 
              type="color" 
              value={currentContent.color || '#e5e7eb'} 
              onChange={(e) => updateContent({ color: e.target.value })}
              className="w-12 h-8 rounded cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Thickness (px)</label>
            <input 
              type="range" min="1" max="10" 
              value={currentContent.thickness || 1} 
              onChange={(e) => updateContent({ thickness: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Margin (px)</label>
            <input 
              type="range" min="0" max="100" 
              value={currentContent.margin || 20} 
              onChange={(e) => updateContent({ margin: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
      {block.type === 'spacer' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Height (px)</label>
          <input 
            type="range" min="10" max="200" step="10"
            value={currentContent.height || 40} 
            onChange={(e) => updateContent({ height: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-center text-xs text-gray-400">{currentContent.height || 40}px</div>
        </div>
      )}
      {block.type === 'testimonials' && (
        <div className="space-y-4">
          {(currentContent.items || []).map((item: any, idx: number) => (
            <div key={idx} className="p-3 border rounded-lg space-y-2 relative group">
              <button 
                onClick={() => {
                  const newItems = [...currentContent.items];
                  newItems.splice(idx, 1);
                  updateContent({ items: newItems });
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3 h-3" />
              </button>
              <input
                type="text"
                placeholder={t.testimonialName}
                value={item.name || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].name = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm font-medium"
              />
              <input
                type="text"
                placeholder={t.testimonialRole}
                value={item.role || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].role = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <textarea
                placeholder={t.testimonialText}
                value={item.text || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].text = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm h-20"
              />
            </div>
          ))}
          <button 
            onClick={() => updateContent({ items: [...(currentContent.items || []), { name: '', role: '', text: '' }] })}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t.addItem}
          </button>
        </div>
      )}
      {block.type === 'countdown' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t.title}
            value={currentContent.title || ''}
            onChange={(e) => updateContent({ title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.targetDate}</label>
            <input
              type="datetime-local"
              value={(() => {
                if (!currentContent.targetDate) return '';
                const date = currentContent.targetDate.toDate ? currentContent.targetDate.toDate() : new Date(currentContent.targetDate);
                try {
                  return date.toISOString().slice(0, 16);
                } catch (e) {
                  return '';
                }
              })()}
              onChange={(e) => updateContent({ targetDate: new Date(e.target.value).toISOString() })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      )}
      {block.type === 'file' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t.btnLabel}
            value={currentContent.label || ''}
            onChange={(e) => updateContent({ label: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            {currentContent.url ? (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium truncate max-w-[200px]">{currentContent.fileName || 'File uploaded'}</span>
              </div>
            ) : (
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            )}
            <label className="cursor-pointer text-blue-600 font-medium hover:underline block text-sm">
              {t.uploadFile}
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateContent({ url: reader.result as string, fileName: file.name });
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </label>
          </div>
        </div>
      )}
      {block.type === 'stats' && (
        <div className="space-y-4">
          {(currentContent.items || []).map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative">
              <button 
                onClick={() => {
                  const newItems = [...currentContent.items];
                  newItems.splice(idx, 1);
                  updateContent({ items: newItems });
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
              <input
                type="text"
                placeholder={t.title}
                value={item.label || ''}
                onChange={(e) => {
                  const newItems = [...currentContent.items];
                  newItems[idx].label = e.target.value;
                  updateContent({ items: newItems });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm font-medium"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={t.statValue}
                  value={item.value || ''}
                  onChange={(e) => {
                    const newItems = [...currentContent.items];
                    newItems[idx].value = parseInt(e.target.value) || 0;
                    updateContent({ items: newItems });
                  }}
                  className="flex-1 px-3 py-1.5 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder={t.statSuffix}
                  value={item.suffix || ''}
                  onChange={(e) => {
                    const newItems = [...currentContent.items];
                    newItems[idx].suffix = e.target.value;
                    updateContent({ items: newItems });
                  }}
                  className="w-24 px-3 py-1.5 border rounded text-sm"
                />
              </div>
            </div>
          ))}
          <button 
            onClick={() => updateContent({ items: [...(currentContent.items || []), { label: '', value: 0, suffix: '' }] })}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t.addItem}
          </button>
        </div>
      )}
      {block.type === 'form' && (
        <div className="p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
          {t.formInfo}
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.column}</label>
        <div className="flex gap-2">
          <button
            onClick={() => setColumn('left')}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
              column === 'left' ? 'bg-blue-100 border-blue-700 text-blue-700' : 'bg-gray-200 border-gray-300 text-gray-700'
            }`}
          >
            {t.left}
          </button>
          <button
            onClick={() => setColumn('right')}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
              column === 'right' ? 'bg-blue-100 border-blue-700 text-blue-700' : 'bg-gray-200 border-gray-300 text-gray-700'
            }`}
          >
            {t.right}
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" /> {t.save}
      </button>
    </div>
  );
}

function getDefaultContent(type: BlockType) {
  switch (type) {
    case 'header': return { title: 'My Page', description: 'Welcome to my site', titleSize: 24, descriptionSize: 16 };
    case 'text': return { text: 'Write something about yourself...', fontSize: 16 };
    case 'button': return { label: 'Click Me', url: 'https://google.com' };
    case 'image': return { url: '' };
    case 'video': return { url: '' };
    case 'socials': return { whatsapp: '', telegram: '', instagram: '', facebook: '', tiktok: '' };
    case 'form': return { enabled: true };
    case 'map': return { address: '' };
    case 'carousel': return { items: [] };
    case 'faq': return { items: [{ question: 'Question 1', answer: 'Answer 1' }] };
    case 'priceList': return { items: [{ title: 'Service 1', description: 'Description', price: '100', currency: '$' }] };
    case 'divider': return { color: '#e5e7eb', thickness: 1, margin: 20 };
    case 'spacer': return { height: 40 };
    case 'testimonials': return { items: [{ name: 'John Doe', role: 'CEO', text: 'Great service!' }] };
    case 'countdown': return { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), title: 'Sale Ends In:' };
    case 'file': return { label: 'Download PDF', url: '', fileName: 'document.pdf' };
    case 'stats': return { items: [{ label: 'Happy Clients', value: 100, suffix: '+' }, { label: 'Projects', value: 50, suffix: '' }] };
    default: return {};
  }
}
