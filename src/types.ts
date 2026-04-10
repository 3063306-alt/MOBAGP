export type BlockType = 
  | 'header' | 'text' | 'button' | 'image' | 'video' | 'socials' 
  | 'form' | 'map' | 'carousel' | 'faq' | 'priceList' | 'divider' 
  | 'spacer' | 'testimonials' | 'countdown' | 'file' | 'stats';

export interface Theme {
  backgroundColor: string;
  buttonColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontFamily?: string;
  animationEnabled?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  avatar?: string;
  avatarSize?: number;
  avatarImageScale?: number;
  avatarShape?: 'circle' | 'square' | 'rectangle';
  coverImage?: string;
  coverImagePosition?: number;
  slug: string;
  language: 'ru' | 'az' | 'en';
  contactEmail?: string;
  phoneNumber?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  showSlug?: boolean;
  showSeparator?: boolean;
  separatorAnimation?: 'none' | 'pulse' | 'rainbow' | 'flow';
  seoTitle?: string;
  seoDescription?: string;
  floatingContact?: {
    enabled: boolean;
    platform: 'whatsapp' | 'telegram' | 'phone';
    value: string;
  };
  qrCodeEnabled?: boolean;
  qrCodeType?: 'url' | 'vcard';
  theme: Theme;
  createdAt: any;
}

export interface Block {
  id: string;
  type: BlockType;
  content: any;
  order: number;
  column?: 'left' | 'right';
  clicks?: number;
  createdAt: any;
}

export interface SocialLink {
  platform: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'tiktok';
  value: string;
}
