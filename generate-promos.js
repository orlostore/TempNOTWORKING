const fs = require('fs');

// ═══════════════════════════════════════════
// PRODUCT DATA
// ═══════════════════════════════════════════
const products = [
  {
    fileSlug: 'vintage-rotary-telephone',
    titleEn: 'Vintage Rotary Telephone',
    titleAr: 'هاتف دوّار كلاسيكي',
    price: 63,
    category: 'home',
    taglineEn: 'Dial Back<br>in <span>Time</span>',
    taglineAr: 'عُد بالزمن إلى الوراء',
    introEn: 'Handmade With Love',
    introAr: 'صُنعت يدوياً... بكل حب',
    lifetextEn: 'A statement piece for any shelf',
    lifetextAr: 'قطعة مميزة لأي رف',
    mainImage: 'https://lh3.googleusercontent.com/d/1j7U1UnIqoWB5ceyd7sO_KXdqDn-YUhmD',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1Is33tFoIb8BGBrCRLVUSlVcJDZnFzeR1',
    variants: []
  },
  {
    fileSlug: 'vintage-red-tv',
    titleEn: 'Miniature Vintage Red TV',
    titleAr: 'مجسم تلفزيون أحمر كلاسيكي',
    price: 29,
    category: 'home',
    taglineEn: 'Tiny Screen,<br>Big <span>Charm</span>',
    taglineAr: 'شاشة صغيرة، سحر كبير',
    introEn: 'Handmade With Love',
    introAr: 'صُنعت يدوياً... بكل حب',
    lifetextEn: 'Retro vibes for your desk',
    lifetextAr: 'أجواء ريترو لمكتبك',
    mainImage: 'https://lh3.googleusercontent.com/d/1N1y_QydjwRI7iebdrL1ziRkQlIqJOJ7u',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1_-KlFFhKOgXz3g_S-2grd2FCa_buXUAh',
    variants: []
  },
  {
    fileSlug: 'vintage-piano',
    titleEn: 'Vintage Upright Piano',
    titleAr: 'بيانو مصغر أنتيك',
    price: 29,
    category: 'home',
    taglineEn: 'A Melody in<br><span>Miniature</span>',
    taglineAr: 'لحن مصغّر',
    introEn: 'Handmade With Love',
    introAr: 'صُنعت يدوياً... بكل حب',
    lifetextEn: 'Timeless elegance, pocket-sized',
    lifetextAr: 'أناقة خالدة بحجم الجيب',
    mainImage: 'https://lh3.googleusercontent.com/d/1qnGqruaDVnEBL9NwdfyghWw-FsphbfPg',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1I4zem9I6LNCJY46B4CI8QctRP8GqI4Dg',
    variants: []
  },
  {
    fileSlug: 'vintage-radio',
    titleEn: 'Vintage Miniature Radio',
    titleAr: 'راديو صغير كلاسيكي',
    price: 27,
    category: 'home',
    taglineEn: 'Tune Into<br><span>Nostalgia</span>',
    taglineAr: 'موجة من الحنين',
    introEn: 'Handmade With Love',
    introAr: 'صُنعت يدوياً... بكل حب',
    lifetextEn: 'Old-school charm, new favorite decor',
    lifetextAr: 'سحر كلاسيكي، ديكور مفضّل جديد',
    mainImage: 'https://lh3.googleusercontent.com/d/1fo5-3SD-z1vbGtwCr_PV4iRRdfayxJ3k',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1jmbtn8jqYmIdv3joXdYJ3o9NhJIIn9GH',
    variants: []
  },
  {
    fileSlug: 'vintage-gramophone',
    titleEn: 'Miniature Vintage Gramophone',
    titleAr: 'غرامافون مصغّر كلاسيكي',
    price: 61,
    category: 'home',
    taglineEn: 'Music From<br>Another <span>Era</span>',
    taglineAr: 'موسيقى من زمن آخر',
    introEn: 'Handmade With Love',
    introAr: 'صُنعت يدوياً... بكل حب',
    lifetextEn: 'Elegant nostalgia for any room',
    lifetextAr: 'حنين أنيق لأي غرفة',
    mainImage: 'https://lh3.googleusercontent.com/d/1djWzrv98v-ory6pxJ88iyACmlwEt74EA',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1GK-0zparAlJTmJiC0YPQKvwhfTWrRo0u',
    variants: []
  },
  {
    fileSlug: 'dreamer-wall-hanging',
    titleEn: 'Dreamer Wall Hanging',
    titleAr: 'لوحة أنتَ مميز المعلّقة',
    price: 40,
    category: 'home',
    taglineEn: 'Words That Lift<br>Little <span>Hearts</span>',
    taglineAr: 'كلمات تُلهم القلوب الصغيرة',
    introEn: 'Handmade With Love',
    introAr: 'صُنعت يدوياً... بكل حب',
    lifetextEn: 'Inspire them every day',
    lifetextAr: 'ألهمهم كل يوم',
    mainImage: 'https://lh3.googleusercontent.com/d/1149qBolmVukonwQz_ne4tMfarNJcvsza',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1vYeZcn9qr8f_0Jfg80O2rgYGiGDSz7vX',
    variants: []
  },
  {
    fileSlug: 'vintage-rotary-phone-2styles',
    titleEn: 'Vintage Rotary Phone',
    titleAr: 'هاتف دوّار مصغّر',
    price: 32,
    category: 'home',
    taglineEn: 'Pick Your<br><span>Classic</span>',
    taglineAr: 'اختر كلاسيكيتك',
    introEn: 'Handmade With Love',
    introAr: 'صُنعت يدوياً... بكل حب',
    lifetextEn: 'Old charm, your style',
    lifetextAr: 'سحر قديم، بأسلوبك',
    sceneHeader: { en: 'Choose Your Style', ar: 'اختر طرازك' },
    mainImage: 'https://lh3.googleusercontent.com/d/1E_bPakA_j4RsyxDb3aXW_Nvu2yQUUYzq',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1AgOeq9HOr_tU3iZQGqVIMs4yM600FWyn',
    variants: [
      { en: 'Classic Green & Silver', ar: 'أخضر وفضي كلاسيكي', img: 'https://lh3.googleusercontent.com/d/1p73ZJtsihz1IQlBoKDwaxWqnAnNrp7nE' },
      { en: 'Antique Red & Gold', ar: 'أحمر وذهبي عتيق', img: 'https://lh3.googleusercontent.com/d/1E_bPakA_j4RsyxDb3aXW_Nvu2yQUUYzq' }
    ]
  },
  {
    fileSlug: 'prodesk-cable-kit',
    titleEn: 'ProDesk Cable Kit',
    titleAr: 'أدوات تنظيم الكابلات برو ديسك',
    price: 62,
    category: 'workspace',
    taglineEn: 'Tame the<br><span>Chaos</span>',
    taglineAr: 'رتّب الفوضى',
    introEn: 'Organize With Style',
    introAr: 'نظّم بأناقة',
    lifetextEn: '300 pieces, zero mess',
    lifetextAr: '٣٠٠ قطعة، صفر فوضى',
    mainImage: 'https://lh3.googleusercontent.com/d/1sBsD78oWUf6U1DYxCPbO1pxM3MPX0tLl',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1Z18_n-FHcUkbWPeb3oda1fjzydq49LyI',
    variants: []
  },
  {
    fileSlug: 'flexiwrap-multicolor',
    titleEn: 'FlexiWrap Velcro Straps',
    titleAr: 'أشرطة فليكسي راب ملون',
    price: 22,
    category: 'workspace',
    taglineEn: 'Wrap It.<br><span>Done.</span>',
    taglineAr: 'لفّها وخلاص',
    introEn: 'Organize With Style',
    introAr: 'نظّم بأناقة',
    lifetextEn: '50 straps, endless uses',
    lifetextAr: '٥٠ شريط، استخدامات لا تنتهي',
    mainImage: 'https://lh3.googleusercontent.com/d/1RNIMgIhDF2NBfM24NlsKuNF5RIHuM3jV',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/10op556DrK-BXA1uTYl-ZnEEpVy0OyRQF',
    variants: []
  },
  {
    fileSlug: 'flexiwrap-black',
    titleEn: 'FlexiWrap Velcro Straps',
    titleAr: 'أشرطة فليكسي راب أسود',
    price: 22,
    category: 'workspace',
    taglineEn: 'Clean Look,<br>Zero <span>Mess</span>',
    taglineAr: 'مظهر نظيف، بدون فوضى',
    introEn: 'Organize With Style',
    introAr: 'نظّم بأناقة',
    lifetextEn: 'Professional cable control',
    lifetextAr: 'تحكّم احترافي بالكابلات',
    mainImage: 'https://lh3.googleusercontent.com/d/1x0nZ9sqFPlw36mhBRbrwr0YM4Mx4T5MG',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1xgdTYgAM7XgEogzkg0MqeGcKXxnGjitt',
    variants: []
  },
  {
    fileSlug: 'silktie-multicolor',
    titleEn: 'SilkTie Cable Organizers',
    titleAr: 'منظم كابلات سيلك تاي ملون',
    price: 22,
    category: 'workspace',
    taglineEn: 'Soft Grip,<br>Strong <span>Hold</span>',
    taglineAr: 'ملمس ناعم، ثبات قوي',
    introEn: 'Organize With Style',
    introAr: 'نظّم بأناقة',
    lifetextEn: 'Silicone that lasts',
    lifetextAr: 'سيليكون يدوم',
    mainImage: 'https://lh3.googleusercontent.com/d/14YlqqxameQDM_HzxIKwpQG4uYHmwv6ah',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1Dx3cGrDR4N8YKbHGvj0ejRWpsrHpn6id',
    variants: []
  },
  {
    fileSlug: 'silktie-black',
    titleEn: 'SilkTie Cable Organizers',
    titleAr: 'منظم كابلات سيلك تاي أسود',
    price: 24,
    category: 'workspace',
    taglineEn: 'Sleek &amp; Silent<br><span>Organization</span>',
    taglineAr: 'ترتيب أنيق وهادئ',
    introEn: 'Organize With Style',
    introAr: 'نظّم بأناقة',
    lifetextEn: 'Premium black, zero compromise',
    lifetextAr: 'أسود فاخر، بدون تنازل',
    mainImage: 'https://lh3.googleusercontent.com/d/1tV-454eA8MxLNe9PDUlvSV3yzaeLqusJ',
    lifestyleImage: 'https://lh3.googleusercontent.com/d/1Ac4XQPFzwflc-fSp6FpRRWu40naxzGwa',
    variants: []
  }
];

// Timing configs
const TIMING = {
  tiktok: { intro: 1800, product: 2200, charEach: 900, lifestyle: 2000, cta: 2800 },
  insta:  { intro: 2500, product: 3000, charEach: 1200, lifestyle: 2800, cta: 3500 }
};

// ═══════════════════════════════════════════
// SHARED CSS
// ═══════════════════════════════════════════
const sharedCSS = `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100vw; height: 100vh;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  background: #ffffff !important;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.canvas {
  width: 100vw; height: 100vh;
  position: relative; overflow: hidden;
  background: #ffffff;
}

/* ═══════════════════════════════════════════
   MODE SELECTOR
   ═══════════════════════════════════════════ */
.mode-select {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 4vh; z-index: 100;
  background: #ffffff !important;
}
.mode-select.gone { opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }
.mode-logo { width: 22vw; max-width: 130px; margin-bottom: 1vh; }
.mode-title {
  font-size: clamp(14px, 3vw, 22px); font-weight: 300;
  color: #2c4a5c; letter-spacing: 0.4em; text-transform: uppercase;
}
.mode-subtitle {
  font-size: clamp(22px, 5.5vw, 36px); font-weight: 800;
  color: #2c4a5c; text-align: center; line-height: 1.3; margin-top: -1vh;
}
.mode-subtitle span { color: #e07856; }
.mode-btns { display: flex; flex-direction: column; gap: 2.5vh; margin-top: 2vh; }
.mode-btn {
  width: 72vw; max-width: 340px; padding: 3.5vh 0;
  border-radius: 2.5vw; border: none; cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: clamp(17px, 4.2vw, 24px); font-weight: 700;
  letter-spacing: 0.05em; color: #fff;
  transition: transform 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 3vw;
}
.mode-btn:active { transform: scale(0.95); }
.btn-tiktok {
  background: linear-gradient(135deg, #010101 0%, #1a1a1a 100%);
  border: 2px solid #333;
}
.btn-insta {
  background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
  box-shadow: 0 4px 30px rgba(225,48,108,0.25);
}
.btn-icon { font-size: clamp(22px, 5vw, 30px); }

.scene {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  will-change: opacity, transform;
}

/* ─── Scene 1: Logo Intro ─── */
.scene-intro { background: #ffffff !important; }
.intro-glow {
  width: 36vw; height: 36vw; max-width: 220px; max-height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(224,120,86,0.1) 0%, transparent 70%);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transform: scale(0.5);
}
.intro-glow img { width: 65%; }
.intro-line {
  width: 12vw; height: 2px; background: #e07856; margin-top: 3vh;
  opacity: 0; transform: scaleX(0);
}
.intro-en {
  margin-top: 2.5vh;
  font-size: clamp(15px, 3.2vw, 22px); font-weight: 300;
  color: #2c4a5c; letter-spacing: 0.35em; text-transform: uppercase;
  opacity: 0; transform: translateY(15px);
}
.intro-ar {
  margin-top: 1.5vh;
  font-size: clamp(16px, 3.5vw, 24px); font-weight: 500;
  color: #e07856; direction: rtl; font-family: 'Almarai', sans-serif;
  opacity: 0; transform: translateY(15px);
}

/* ─── Scene 3: Lifestyle ─── */
.scene-lifestyle { background: #ffffff !important; }
.lifestyle-frame {
  width: 88vw; max-width: 440px;
  height: 55vh; max-height: 600px;
  border-radius: 4vw;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(44,74,92,0.12), 0 0 0 1px rgba(44,74,92,0.06);
  opacity: 0; transform: scale(0.88);
}
.lifestyle-frame img { width: 100%; height: 100%; object-fit: cover; }
.life-label {
  margin-top: 4vh; text-align: center;
  opacity: 0; transform: translateY(15px);
}
.life-en { font-size: clamp(18px, 4.5vw, 28px); font-weight: 700; color: #2c4a5c; }
.life-ar {
  font-size: clamp(14px, 3.2vw, 20px); font-weight: 500; color: #e07856;
  direction: rtl; margin-top: 0.5vh; font-family: 'Almarai', sans-serif;
}

/* ─── Scene 4: CTA Outro ─── */
.scene-cta { background: #ffffff !important; gap: 2.5vh; }
.cta-logo { width: 14vw; max-width: 80px; opacity: 0; }
.cta-head {
  font-size: clamp(22px, 5.5vw, 38px); font-weight: 900;
  color: #2c4a5c; text-align: center; line-height: 1.3;
  opacity: 0; transform: translateY(25px);
}
.cta-head span { color: #e07856; }
.cta-head-ar {
  font-size: clamp(18px, 4.5vw, 28px); font-weight: 700;
  color: rgba(44,74,92,0.6); direction: rtl; text-align: center;
  font-family: 'Almarai', sans-serif; margin-top: -1vh;
  opacity: 0; transform: translateY(20px);
}
.cta-box {
  background: rgba(224,120,86,0.08); border: 2px solid rgba(224,120,86,0.2);
  border-radius: 4vw; padding: 3vh 8vw; text-align: center;
  opacity: 0; transform: scale(0.85);
}
.cta-price {
  font-size: clamp(36px, 9vw, 60px); font-weight: 900; color: #e07856; line-height: 1;
}
.cta-price sub { font-size: 0.4em; font-weight: 400; color: #7a8f9c; vertical-align: baseline; }
.cta-url {
  font-size: clamp(22px, 5.5vw, 36px); font-weight: 800;
  color: #e07856; letter-spacing: 0.08em;
  opacity: 0; transform: translateY(15px);
}
.cta-badges { display: flex; gap: 5vw; opacity: 0; }
.cta-badge {
  display: flex; flex-direction: column; align-items: center; gap: 0.5vh;
  font-size: clamp(10px, 2.5vw, 14px); color: #6a8090; font-weight: 500;
}
.cta-badge-icon {
  width: 8vw; height: 8vw; max-width: 44px; max-height: 44px;
  border-radius: 50%; background: rgba(224,120,86,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: clamp(16px, 4vw, 24px);
}

/* ─── Progress Bar ─── */
.progress-bar {
  position: absolute; bottom: 0; left: 0;
  height: 4px; width: 0%;
  background: linear-gradient(90deg, #e07856, #f4a261);
  z-index: 50;
}

/* ─── Floating Dots ─── */
.dots { position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
.dot {
  position: absolute; border-radius: 50%;
  background: rgba(224,120,86,0.15);
  animation: floatDot linear infinite;
}
@keyframes floatDot {
  0%   { transform: translateY(100vh) scale(0); opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.6; }
  100% { transform: translateY(-10vh) scale(1); opacity: 0; }
}
`;

// ═══════════════════════════════════════════
// SINGLE PRODUCT CSS (no variants)
// ═══════════════════════════════════════════
const singleProductCSS = `
/* ─── Scene 2: Product Showcase ─── */
.scene-product { background: #ffffff !important; }
.product-header {
  position: absolute; top: 5vh;
  text-align: center; z-index: 5;
}
.product-header-en {
  font-size: clamp(18px, 4.5vw, 30px); font-weight: 800; color: #2c4a5c;
  opacity: 0; transform: translateY(-15px);
}
.product-header-ar {
  font-size: clamp(14px, 3.2vw, 20px); font-weight: 600; color: #e07856;
  direction: rtl; margin-top: 0.5vh; font-family: 'Almarai', sans-serif;
  opacity: 0; transform: translateY(-15px);
}
.product-stage {
  position: relative;
  width: 65vw; height: 65vw; max-width: 400px; max-height: 400px;
  margin-top: -2vh;
}
.product-img {
  width: 100%; height: 100%; object-fit: contain;
  opacity: 0; transform: scale(0.75) translateY(20px);
  mix-blend-mode: multiply;
}
@keyframes productReveal {
  0%   { opacity: 0; transform: scale(0.75) translateY(20px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(-5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes productFloat {
  0%, 100% { transform: translateY(-4px); }
  50%      { transform: translateY(4px); }
}
.product-img.reveal {
  animation: productReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.product-img.float {
  opacity: 1;
  animation: productFloat 2.5s ease-in-out infinite;
}
.product-price {
  position: absolute; bottom: 7vh;
  background: #e07856; color: #fff;
  padding: 1.5vh 6vw; border-radius: 50px;
  font-size: clamp(16px, 4vw, 24px); font-weight: 800;
  box-shadow: 0 4px 20px rgba(224,120,86,0.4);
  opacity: 0; transform: scale(0.7);
}
`;

// ═══════════════════════════════════════════
// VARIANT PARADE CSS
// ═══════════════════════════════════════════
const variantParadeCSS = `
/* ─── Scene 2: Variant Parade ─── */
.scene-parade { background: #ffffff !important; }
.parade-header {
  position: absolute; top: 5vh;
  text-align: center; z-index: 5;
}
.parade-en {
  font-size: clamp(18px, 4.5vw, 30px); font-weight: 800; color: #2c4a5c;
  opacity: 0; transform: translateY(-15px);
}
.parade-ar {
  font-size: clamp(14px, 3.2vw, 20px); font-weight: 600; color: #e07856;
  direction: rtl; margin-top: 0.5vh; font-family: 'Almarai', sans-serif;
  opacity: 0; transform: translateY(-15px);
}
.char-stage {
  position: relative;
  width: 60vw; height: 60vw; max-width: 380px; max-height: 380px;
  margin-top: -2vh;
}
.char-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: contain;
  opacity: 0;
  mix-blend-mode: multiply;
}
@keyframes swingIn {
  0%   { opacity: 0; transform: rotate(-12deg) translateY(-25px) scale(0.7); }
  50%  { opacity: 1; transform: rotate(5deg) translateY(5px) scale(1.03); }
  70%  { transform: rotate(-3deg) translateY(-2px) scale(1); }
  85%  { transform: rotate(1.5deg) translateY(1px) scale(1); }
  100% { opacity: 1; transform: rotate(0deg) translateY(0) scale(1); }
}
@keyframes swingIdle {
  0%, 100% { transform: rotate(-1.5deg); }
  50% { transform: rotate(1.5deg); }
}
.char-img.swing-in {
  animation: swingIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.char-img.idle {
  opacity: 1;
  animation: swingIdle 2s ease-in-out infinite;
}
.char-img.exit-out {
  transition: all 0.35s ease-in;
  opacity: 0; transform: scale(1.08) translateY(10px);
}
.char-label {
  position: absolute; bottom: 16vh;
  text-align: center; z-index: 5;
  opacity: 0; transform: translateY(15px);
}
.char-label-en { font-size: clamp(20px, 5vw, 32px); font-weight: 700; color: #2c4a5c; }
.char-label-ar {
  font-size: clamp(15px, 3.5vw, 22px); font-weight: 500; color: #e07856;
  direction: rtl; margin-top: 0.3vh; font-family: 'Almarai', sans-serif;
}
.parade-price {
  position: absolute; bottom: 7vh;
  background: #e07856; color: #fff;
  padding: 1.5vh 6vw; border-radius: 50px;
  font-size: clamp(16px, 4vw, 24px); font-weight: 800;
  box-shadow: 0 4px 20px rgba(224,120,86,0.4);
  opacity: 0; transform: scale(0.7);
}
`;

// ═══════════════════════════════════════════
// SHARED JS HELPERS
// ═══════════════════════════════════════════
const sharedJS = `
function anim(el, props, ms, ease) {
  ease = ease || 'ease';
  return new Promise(function(resolve) {
    el.style.transition = 'all ' + ms + 'ms ' + ease;
    requestAnimationFrame(function() {
      Object.assign(el.style, props);
      setTimeout(resolve, ms);
    });
  });
}
function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function createDots() {
  var c = document.getElementById('dots');
  for (var i = 0; i < 20; i++) {
    var d = document.createElement('div');
    d.className = 'dot';
    d.style.left = Math.random() * 100 + '%';
    d.style.animationDuration = (5 + Math.random() * 7) + 's';
    d.style.animationDelay = Math.random() * 12 + 's';
    var size = 3 + Math.random() * 5;
    d.style.width = size + 'px';
    d.style.height = size + 'px';
    c.appendChild(d);
  }
}
`;

// ═══════════════════════════════════════════
// BADGE HTML
// ═══════════════════════════════════════════
function getBadgesHTML(category) {
  const thirdBadge = category === 'home'
    ? `<div class="cta-badge"><div class="cta-badge-icon">🎨</div>Handmade<br><span style="font-family:'Almarai',sans-serif">صناعة يدوية</span></div>`
    : `<div class="cta-badge"><div class="cta-badge-icon">✅</div>Quality<br><span style="font-family:'Almarai',sans-serif">جودة عالية</span></div>`;
  return `
      <div class="cta-badge"><div class="cta-badge-icon">🚚</div>Free Delivery Above 75 AED<br><span style="font-family:'Almarai',sans-serif">توصيل مجاني فوق 75 درهم</span></div>
      <div class="cta-badge"><div class="cta-badge-icon">🇦🇪</div>Ships from UAE<br><span style="font-family:'Almarai',sans-serif">شحن من الإمارات</span></div>
      ${thirdBadge}`;
}

// ═══════════════════════════════════════════
// GENERATE SINGLE PRODUCT HTML (with mode selector)
// ═══════════════════════════════════════════
function generateSingleProduct(p) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>ORLO – ${p.titleEn}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=Almarai:wght@400;700&display=swap" rel="stylesheet">
<style>
${sharedCSS}
${singleProductCSS}
</style>
</head>
<body>

<div class="canvas" id="canvas">
  <div class="progress-bar" id="progressBar"></div>
  <div class="dots" id="dots"></div>

  <!-- ── Mode Selector ── -->
  <div class="mode-select" id="modeSelect">
    <img src="logo.png" class="mode-logo" alt="ORLO">
    <div class="mode-title">Promo Reel</div>
    <div class="mode-subtitle">${p.titleEn.split(' ').slice(0, -1).join(' ')} <span>${p.titleEn.split(' ').slice(-1)[0]}</span></div>
    <div class="mode-btns">
      <button class="mode-btn btn-tiktok" onclick="startPromo('tiktok')">
        <span class="btn-icon">\u266A</span> TikTok
      </button>
      <button class="mode-btn btn-insta" onclick="startPromo('insta')">
        <span class="btn-icon">\u25CE</span> Instagram
      </button>
    </div>
  </div>

  <!-- Scene 1: Logo Intro -->
  <div class="scene scene-intro" id="scene1">
    <div class="intro-glow" id="introGlow"><img src="logo.png" alt="ORLO"></div>
    <div class="intro-line" id="introLine"></div>
    <div class="intro-en" id="introEn">${p.introEn}</div>
    <div class="intro-ar" id="introAr">${p.introAr}</div>
  </div>

  <!-- Scene 2: Product Showcase -->
  <div class="scene scene-product" id="scene2">
    <div class="product-header">
      <div class="product-header-en" id="headerEn">${p.titleEn}</div>
      <div class="product-header-ar" id="headerAr">${p.titleAr}</div>
    </div>
    <div class="product-stage">
      <img class="product-img" id="productImg" src="${p.mainImage}" alt="${p.titleEn}">
    </div>
    <div class="product-price" id="productPrice">${p.price} AED</div>
  </div>

  <!-- Scene 3: Lifestyle -->
  <div class="scene scene-lifestyle" id="scene3">
    <div class="lifestyle-frame" id="lifeFrame">
      <img id="lifeImg" src="${p.lifestyleImage}" alt="${p.titleEn}">
    </div>
    <div class="life-label" id="lifeLabel">
      <div class="life-en">${p.lifetextEn}</div>
      <div class="life-ar">${p.lifetextAr}</div>
    </div>
  </div>

  <!-- Scene 4: CTA Outro -->
  <div class="scene scene-cta" id="scene4">
    <img src="logo.png" class="cta-logo" id="ctaLogo" alt="ORLO">
    <div class="cta-head" id="ctaHead">${p.taglineEn}</div>
    <div class="cta-head-ar" id="ctaHeadAr">${p.taglineAr}</div>
    <div class="cta-box" id="ctaBox">
      <div class="cta-price">${p.price} <sub>AED / <span style="font-family:'Almarai',sans-serif">\u062F\u0631\u0647\u0645</span></sub></div>
    </div>
    <div class="cta-url" id="ctaUrl">orlostore.com</div>
    <div class="cta-badges" id="ctaBadges">
      ${getBadgesHTML(p.category)}
    </div>
  </div>
</div>

<script>
${sharedJS}

var T = {
  tiktok: { intro: 1800, product: 2200, lifestyle: 2000, cta: 2800 },
  insta:  { intro: 2500, product: 3000, lifestyle: 2800, cta: 3500 }
};

// Preload images
(function() {
  var urls = ['${p.mainImage}', '${p.lifestyleImage}'];
  urls.forEach(function(u) { var img = new Image(); img.src = u; });
})();

// ═══════════════════════════════════════════
// MAIN ANIMATION
// ═══════════════════════════════════════════
async function startPromo(mode) {
  var t = T[mode];
  var totalDuration = t.intro + t.product + t.lifestyle + t.cta + 2000;

  // Hide mode selector
  document.getElementById('modeSelect').classList.add('gone');
  await wait(400);

  var bar = document.getElementById('progressBar');
  var startTime = Date.now();
  var progressTick = setInterval(function() {
    var pct = Math.min(((Date.now() - startTime) / totalDuration) * 100, 100);
    bar.style.width = pct + '%';
    bar.style.transition = 'width 80ms linear';
    if (pct >= 100) clearInterval(progressTick);
  }, 80);

  // ── SCENE 1 — Logo Intro ──
  var s1 = document.getElementById('scene1');
  s1.style.opacity = '1';
  await anim(document.getElementById('introGlow'),
    { opacity: '1', transform: 'scale(1)' }, 600, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
  await anim(document.getElementById('introLine'),
    { opacity: '1', transform: 'scaleX(1)' }, 400);
  await wait(150);
  await anim(document.getElementById('introEn'),
    { opacity: '1', transform: 'translateY(0)' }, 500, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('introAr'),
    { opacity: '1', transform: 'translateY(0)' }, 450, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(t.intro - 1700);
  await anim(s1, { opacity: '0' }, 400);

  // ── SCENE 2 — Product Showcase ──
  var s2 = document.getElementById('scene2');
  await anim(s2, { opacity: '1' }, 300);
  await anim(document.getElementById('headerEn'),
    { opacity: '1', transform: 'translateY(0)' }, 400, 'cubic-bezier(0.16, 1, 0.3, 1)');
  anim(document.getElementById('headerAr'),
    { opacity: '1', transform: 'translateY(0)' }, 350, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(200);

  var productImg = document.getElementById('productImg');
  productImg.classList.add('reveal');
  await wait(800);
  productImg.classList.remove('reveal');
  productImg.classList.add('float');

  anim(document.getElementById('productPrice'),
    { opacity: '1', transform: 'scale(1)' }, 500, 'cubic-bezier(0.34, 1.56, 0.64, 1)');

  await wait(t.product - 1300);
  await anim(s2, { opacity: '0' }, 400);

  // ── SCENE 3 — Lifestyle ──
  var s3 = document.getElementById('scene3');
  await anim(s3, { opacity: '1' }, 300);
  await anim(document.getElementById('lifeFrame'),
    { opacity: '1', transform: 'scale(1)' }, 800, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(350);
  await anim(document.getElementById('lifeLabel'),
    { opacity: '1', transform: 'translateY(0)' }, 600, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(t.lifestyle - 1750);
  await anim(s3, { opacity: '0' }, 400);

  // ── SCENE 4 — CTA ──
  var s4 = document.getElementById('scene4');
  await anim(s4, { opacity: '1' }, 300);
  await anim(document.getElementById('ctaLogo'), { opacity: '1' }, 350);
  await anim(document.getElementById('ctaHead'),
    { opacity: '1', transform: 'translateY(0)' }, 600, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('ctaHeadAr'),
    { opacity: '1', transform: 'translateY(0)' }, 450, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(150);
  await anim(document.getElementById('ctaBox'),
    { opacity: '1', transform: 'scale(1)' }, 550, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
  await wait(200);
  await anim(document.getElementById('ctaUrl'),
    { opacity: '1', transform: 'translateY(0)' }, 400, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('ctaBadges'), { opacity: '1' }, 500);

  clearInterval(progressTick);
  bar.style.width = '100%';
  bar.style.transition = 'width 300ms linear';
}

createDots();
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════
// GENERATE VARIANT PARADE HTML
// ═══════════════════════════════════════════
function generateVariantProduct(p) {
  const headerEn = p.sceneHeader ? p.sceneHeader.en : p.titleEn;
  const headerAr = p.sceneHeader ? p.sceneHeader.ar : p.titleAr;
  const charsJSON = JSON.stringify(p.variants);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>ORLO – ${p.titleEn}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=Almarai:wght@400;700&display=swap" rel="stylesheet">
<style>
${sharedCSS}
${variantParadeCSS}
</style>
</head>
<body>

<div class="canvas" id="canvas">
  <div class="progress-bar" id="progressBar"></div>
  <div class="dots" id="dots"></div>

  <!-- ── Mode Selector ── -->
  <div class="mode-select" id="modeSelect">
    <img src="logo.png" class="mode-logo" alt="ORLO">
    <div class="mode-title">Promo Reel</div>
    <div class="mode-subtitle">${p.titleEn.split(' ').slice(0, -1).join(' ')} <span>${p.titleEn.split(' ').slice(-1)[0]}</span></div>
    <div class="mode-btns">
      <button class="mode-btn btn-tiktok" onclick="startPromo('tiktok')">
        <span class="btn-icon">\u266A</span> TikTok
      </button>
      <button class="mode-btn btn-insta" onclick="startPromo('insta')">
        <span class="btn-icon">\u25CE</span> Instagram
      </button>
    </div>
  </div>

  <!-- Scene 1: Logo Intro -->
  <div class="scene scene-intro" id="scene1">
    <div class="intro-glow" id="introGlow"><img src="logo.png" alt="ORLO"></div>
    <div class="intro-line" id="introLine"></div>
    <div class="intro-en" id="introEn">${p.introEn}</div>
    <div class="intro-ar" id="introAr">${p.introAr}</div>
  </div>

  <!-- Scene 2: Variant Parade -->
  <div class="scene scene-parade" id="scene2">
    <div class="parade-header">
      <div class="parade-en" id="paradeEn">${headerEn}</div>
      <div class="parade-ar" id="paradeAr">${headerAr}</div>
    </div>
    <div class="char-stage" id="charStage"></div>
    <div class="char-label" id="charLabel">
      <div class="char-label-en" id="charLabelEn"></div>
      <div class="char-label-ar" id="charLabelAr"></div>
    </div>
    <div class="parade-price" id="paradePrice">${p.price} AED</div>
  </div>

  <!-- Scene 3: Lifestyle -->
  <div class="scene scene-lifestyle" id="scene3">
    <div class="lifestyle-frame" id="lifeFrame">
      <img id="lifeImg" src="${p.lifestyleImage}" alt="${p.titleEn}">
    </div>
    <div class="life-label" id="lifeLabel">
      <div class="life-en">${p.lifetextEn}</div>
      <div class="life-ar">${p.lifetextAr}</div>
    </div>
  </div>

  <!-- Scene 4: CTA Outro -->
  <div class="scene scene-cta" id="scene4">
    <img src="logo.png" class="cta-logo" id="ctaLogo" alt="ORLO">
    <div class="cta-head" id="ctaHead">${p.taglineEn}</div>
    <div class="cta-head-ar" id="ctaHeadAr">${p.taglineAr}</div>
    <div class="cta-box" id="ctaBox">
      <div class="cta-price">${p.price} <sub>AED / <span style="font-family:'Almarai',sans-serif">\u062F\u0631\u0647\u0645</span></sub></div>
    </div>
    <div class="cta-url" id="ctaUrl">orlostore.com</div>
    <div class="cta-badges" id="ctaBadges">
      ${getBadgesHTML(p.category)}
    </div>
  </div>
</div>

<script>
${sharedJS}

var T = {
  tiktok: { intro: 1800, charEach: 900, lifestyle: 2000, cta: 2800 },
  insta:  { intro: 2500, charEach: 1200, lifestyle: 2800, cta: 3500 }
};

var CHARS = ${charsJSON};

// Build char img elements
function buildCharStage() {
  var stage = document.getElementById('charStage');
  CHARS.forEach(function(c, i) {
    var img = document.createElement('img');
    img.className = 'char-img';
    img.src = c.img;
    img.alt = c.en;
    img.id = 'charImg' + i;
    stage.appendChild(img);
  });
}

// Preload images
(function() {
  var urls = CHARS.map(function(c) { return c.img; });
  urls.push('${p.lifestyleImage}');
  urls.forEach(function(u) { var img = new Image(); img.src = u; });
})();

// ═══════════════════════════════════════════
// MAIN ANIMATION
// ═══════════════════════════════════════════
async function startPromo(mode) {
  var t = T[mode];
  var charTotal = CHARS.length * t.charEach;
  var totalDuration = t.intro + charTotal + t.lifestyle + t.cta + 2000;

  // Hide mode selector
  document.getElementById('modeSelect').classList.add('gone');
  await wait(400);

  var bar = document.getElementById('progressBar');
  var startTime = Date.now();
  var progressTick = setInterval(function() {
    var pct = Math.min(((Date.now() - startTime) / totalDuration) * 100, 100);
    bar.style.width = pct + '%';
    bar.style.transition = 'width 80ms linear';
    if (pct >= 100) clearInterval(progressTick);
  }, 80);

  // ── SCENE 1 — Logo Intro ──
  var s1 = document.getElementById('scene1');
  s1.style.opacity = '1';
  await anim(document.getElementById('introGlow'),
    { opacity: '1', transform: 'scale(1)' }, 600, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
  await anim(document.getElementById('introLine'),
    { opacity: '1', transform: 'scaleX(1)' }, 400);
  await wait(150);
  await anim(document.getElementById('introEn'),
    { opacity: '1', transform: 'translateY(0)' }, 500, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('introAr'),
    { opacity: '1', transform: 'translateY(0)' }, 450, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(t.intro - 1700);
  await anim(s1, { opacity: '0' }, 400);

  // ── SCENE 2 — Variant Parade ──
  var s2 = document.getElementById('scene2');
  await anim(s2, { opacity: '1' }, 300);
  await anim(document.getElementById('paradeEn'),
    { opacity: '1', transform: 'translateY(0)' }, 400, 'cubic-bezier(0.16, 1, 0.3, 1)');
  anim(document.getElementById('paradeAr'),
    { opacity: '1', transform: 'translateY(0)' }, 350, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(200);
  anim(document.getElementById('paradePrice'),
    { opacity: '1', transform: 'scale(1)' }, 500, 'cubic-bezier(0.34, 1.56, 0.64, 1)');

  var charLabel = document.getElementById('charLabel');
  var charLabelEn = document.getElementById('charLabelEn');
  var charLabelAr = document.getElementById('charLabelAr');

  for (var i = 0; i < CHARS.length; i++) {
    var c = CHARS[i];
    var img = document.getElementById('charImg' + i);
    charLabelEn.textContent = c.en;
    charLabelAr.textContent = c.ar;
    img.classList.add('swing-in');
    await anim(charLabel,
      { opacity: '1', transform: 'translateY(0)' }, 300, 'cubic-bezier(0.16, 1, 0.3, 1)');
    await wait(t.charEach - 600);
    charLabel.style.transition = 'all 200ms ease';
    charLabel.style.opacity = '0';
    charLabel.style.transform = 'translateY(15px)';
    await wait(200);
    if (i < CHARS.length - 1) {
      img.classList.remove('swing-in');
      img.classList.add('exit-out');
      await wait(250);
      img.classList.remove('exit-out');
      img.style.opacity = '0';
    } else {
      img.classList.remove('swing-in');
      img.classList.add('idle');
      await wait(300);
    }
  }
  await anim(s2, { opacity: '0' }, 400);

  // ── SCENE 3 — Lifestyle ──
  var s3 = document.getElementById('scene3');
  await anim(s3, { opacity: '1' }, 300);
  await anim(document.getElementById('lifeFrame'),
    { opacity: '1', transform: 'scale(1)' }, 800, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(350);
  await anim(document.getElementById('lifeLabel'),
    { opacity: '1', transform: 'translateY(0)' }, 600, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(t.lifestyle - 1750);
  await anim(s3, { opacity: '0' }, 400);

  // ── SCENE 4 — CTA ──
  var s4 = document.getElementById('scene4');
  await anim(s4, { opacity: '1' }, 300);
  await anim(document.getElementById('ctaLogo'), { opacity: '1' }, 350);
  await anim(document.getElementById('ctaHead'),
    { opacity: '1', transform: 'translateY(0)' }, 600, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('ctaHeadAr'),
    { opacity: '1', transform: 'translateY(0)' }, 450, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(150);
  await anim(document.getElementById('ctaBox'),
    { opacity: '1', transform: 'scale(1)' }, 550, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
  await wait(200);
  await anim(document.getElementById('ctaUrl'),
    { opacity: '1', transform: 'translateY(0)' }, 400, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('ctaBadges'), { opacity: '1' }, 500);

  clearInterval(progressTick);
  bar.style.width = '100%';
  bar.style.transition = 'width 300ms linear';
}

createDots();
buildCharStage();
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════
// GENERATE ALL-PRODUCTS MEGA PAGE
// ═══════════════════════════════════════════
function generateAllProducts() {
  const allItems = [
    { en: 'Dangling Buddies', ar: 'رفاق الثلاجة', price: 16, img: 'https://lh3.googleusercontent.com/d/1qR0UfZ_kQh8CckPEVgvAwmxYSXiJOWmj' },
    ...products.map(function(p) {
      return { en: p.titleEn, ar: p.titleAr, price: p.price, img: p.mainImage };
    })
  ];
  const itemsJSON = JSON.stringify(allItems);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>ORLO – All Products</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=Almarai:wght@400;700&display=swap" rel="stylesheet">
<style>
${sharedCSS}

/* ─── Scene 2: Quick Product Parade ─── */
.scene-parade { background: #ffffff !important; }
.parade-header {
  position: absolute; top: 5vh;
  text-align: center; z-index: 5;
}
.parade-en {
  font-size: clamp(18px, 4.5vw, 30px); font-weight: 800; color: #2c4a5c;
  opacity: 0; transform: translateY(-15px);
}
.parade-ar {
  font-size: clamp(14px, 3.2vw, 20px); font-weight: 600; color: #e07856;
  direction: rtl; margin-top: 0.5vh; font-family: 'Almarai', sans-serif;
  opacity: 0; transform: translateY(-15px);
}
.product-stage {
  position: relative;
  width: 55vw; height: 55vw; max-width: 340px; max-height: 340px;
  margin-top: -2vh;
}
.product-stage img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: contain;
  opacity: 0; mix-blend-mode: multiply;
}
@keyframes quickIn {
  0%   { opacity: 0; transform: scale(0.7) translateY(15px); }
  50%  { opacity: 1; transform: scale(1.04) translateY(-3px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.product-stage img.show {
  animation: quickIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.product-stage img.hide {
  transition: all 0.25s ease-in;
  opacity: 0; transform: scale(1.05) translateY(8px);
}
.item-label {
  position: absolute; bottom: 14vh;
  text-align: center; z-index: 5;
  opacity: 0; transform: translateY(15px);
}
.item-label-en { font-size: clamp(17px, 4.2vw, 28px); font-weight: 700; color: #2c4a5c; }
.item-label-ar {
  font-size: clamp(13px, 3vw, 20px); font-weight: 500; color: #e07856;
  direction: rtl; margin-top: 0.3vh; font-family: 'Almarai', sans-serif;
}
.item-price {
  position: absolute; bottom: 7vh;
  background: #e07856; color: #fff;
  padding: 1.2vh 5vw; border-radius: 50px;
  font-size: clamp(14px, 3.5vw, 22px); font-weight: 800;
  box-shadow: 0 4px 20px rgba(224,120,86,0.4);
  opacity: 0; transform: scale(0.7);
}
</style>
</head>
<body>

<div class="canvas" id="canvas">
  <div class="progress-bar" id="progressBar"></div>
  <div class="dots" id="dots"></div>

  <!-- ── Mode Selector ── -->
  <div class="mode-select" id="modeSelect">
    <img src="logo.png" class="mode-logo" alt="ORLO">
    <div class="mode-title">Promo Reel</div>
    <div class="mode-subtitle">All <span>Products</span></div>
    <div class="mode-btns">
      <button class="mode-btn btn-tiktok" onclick="startPromo('tiktok')">
        <span class="btn-icon">\u266A</span> TikTok
      </button>
      <button class="mode-btn btn-insta" onclick="startPromo('insta')">
        <span class="btn-icon">\u25CE</span> Instagram
      </button>
    </div>
  </div>

  <!-- Scene 1: Logo Intro -->
  <div class="scene scene-intro" id="scene1">
    <div class="intro-glow" id="introGlow"><img src="logo.png" alt="ORLO"></div>
    <div class="intro-line" id="introLine"></div>
    <div class="intro-en" id="introEn">Unique Finds, Delivered</div>
    <div class="intro-ar" id="introAr">\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0645\u064A\u0632\u0629... \u062A\u0648\u0635\u0644\u0643 \u0644\u0628\u0627\u0628 \u0628\u064A\u062A\u0643</div>
  </div>

  <!-- Scene 2: Quick Product Parade -->
  <div class="scene scene-parade" id="scene2">
    <div class="parade-header">
      <div class="parade-en" id="paradeEn">Our Collection</div>
      <div class="parade-ar" id="paradeAr">\u0645\u062C\u0645\u0648\u0639\u062A\u0646\u0627</div>
    </div>
    <div class="product-stage" id="productStage"></div>
    <div class="item-label" id="itemLabel">
      <div class="item-label-en" id="itemLabelEn"></div>
      <div class="item-label-ar" id="itemLabelAr"></div>
    </div>
    <div class="item-price" id="itemPrice"></div>
  </div>

  <!-- Scene 4: CTA Outro -->
  <div class="scene scene-cta" id="scene4">
    <img src="logo.png" class="cta-logo" id="ctaLogo" alt="ORLO">
    <div class="cta-head" id="ctaHead">Unique Finds for<br>Your <span>Home</span></div>
    <div class="cta-head-ar" id="ctaHeadAr">\u0645\u0646\u062A\u062C\u0627\u062A \u0641\u0631\u064A\u062F\u0629 \u0644\u0628\u064A\u062A\u0643</div>
    <div class="cta-box" id="ctaBox">
      <div class="cta-price" style="font-size:clamp(24px,6vw,40px);">Starting from 16 <sub>AED</sub></div>
    </div>
    <div class="cta-url" id="ctaUrl">orlostore.com</div>
    <div class="cta-badges" id="ctaBadges">
      <div class="cta-badge"><div class="cta-badge-icon">\uD83D\uDE9A</div>Free Delivery Above 75 AED<br><span style="font-family:'Almarai',sans-serif">\u062A\u0648\u0635\u064A\u0644 \u0645\u062C\u0627\u0646\u064A \u0641\u0648\u0642 75 \u062F\u0631\u0647\u0645</span></div>
      <div class="cta-badge"><div class="cta-badge-icon">\uD83C\uDDE6\uD83C\uDDEA</div>Ships from UAE<br><span style="font-family:'Almarai',sans-serif">\u0634\u062D\u0646 \u0645\u0646 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A</span></div>
      <div class="cta-badge"><div class="cta-badge-icon">\uD83C\uDF81</div>Unique Gifts<br><span style="font-family:'Almarai',sans-serif">\u0647\u062F\u0627\u064A\u0627 \u0645\u0645\u064A\u0632\u0629</span></div>
    </div>
  </div>
</div>

<script>
${sharedJS}

var T = {
  tiktok: { intro: 1800, eachTime: 1200, cta: 2800 },
  insta:  { intro: 2500, eachTime: 1600, cta: 3500 }
};

var ITEMS = ${itemsJSON};

// Build product images
function buildStage() {
  var stage = document.getElementById('productStage');
  ITEMS.forEach(function(item, i) {
    var img = document.createElement('img');
    img.src = item.img;
    img.alt = item.en;
    img.id = 'pImg' + i;
    stage.appendChild(img);
  });
}

// Preload
(function() {
  ITEMS.forEach(function(item) { var img = new Image(); img.src = item.img; });
})();

// ═══════════════════════════════════════════
// MAIN ANIMATION
// ═══════════════════════════════════════════
async function startPromo(mode) {
  var t = T[mode];
  var paradeTime = ITEMS.length * t.eachTime;
  var totalDuration = t.intro + paradeTime + t.cta + 2000;

  // Hide mode selector
  document.getElementById('modeSelect').classList.add('gone');
  await wait(400);

  var bar = document.getElementById('progressBar');
  var startTime = Date.now();
  var progressTick = setInterval(function() {
    var pct = Math.min(((Date.now() - startTime) / totalDuration) * 100, 100);
    bar.style.width = pct + '%';
    bar.style.transition = 'width 80ms linear';
    if (pct >= 100) clearInterval(progressTick);
  }, 80);

  // ── SCENE 1 — Logo Intro ──
  var s1 = document.getElementById('scene1');
  s1.style.opacity = '1';
  await anim(document.getElementById('introGlow'),
    { opacity: '1', transform: 'scale(1)' }, 600, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
  await anim(document.getElementById('introLine'),
    { opacity: '1', transform: 'scaleX(1)' }, 400);
  await wait(150);
  await anim(document.getElementById('introEn'),
    { opacity: '1', transform: 'translateY(0)' }, 500, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('introAr'),
    { opacity: '1', transform: 'translateY(0)' }, 450, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(t.intro - 1700);
  await anim(s1, { opacity: '0' }, 400);

  // ── SCENE 2 — Quick Product Parade ──
  var s2 = document.getElementById('scene2');
  await anim(s2, { opacity: '1' }, 300);
  await anim(document.getElementById('paradeEn'),
    { opacity: '1', transform: 'translateY(0)' }, 400, 'cubic-bezier(0.16, 1, 0.3, 1)');
  anim(document.getElementById('paradeAr'),
    { opacity: '1', transform: 'translateY(0)' }, 350, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(200);

  var itemLabel = document.getElementById('itemLabel');
  var itemLabelEn = document.getElementById('itemLabelEn');
  var itemLabelAr = document.getElementById('itemLabelAr');
  var itemPrice = document.getElementById('itemPrice');

  for (var i = 0; i < ITEMS.length; i++) {
    var item = ITEMS[i];
    var img = document.getElementById('pImg' + i);
    itemLabelEn.textContent = item.en;
    itemLabelAr.textContent = item.ar;
    itemPrice.textContent = item.price + ' AED';
    img.classList.add('show');
    anim(itemLabel, { opacity: '1', transform: 'translateY(0)' }, 250, 'cubic-bezier(0.16, 1, 0.3, 1)');
    anim(itemPrice, { opacity: '1', transform: 'scale(1)' }, 300, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
    await wait(t.eachTime - 400);
    itemLabel.style.transition = 'all 150ms ease';
    itemLabel.style.opacity = '0';
    itemLabel.style.transform = 'translateY(15px)';
    itemPrice.style.transition = 'all 150ms ease';
    itemPrice.style.opacity = '0';
    itemPrice.style.transform = 'scale(0.7)';
    await wait(150);
    if (i < ITEMS.length - 1) {
      img.classList.remove('show');
      img.classList.add('hide');
      await wait(200);
      img.classList.remove('hide');
      img.style.opacity = '0';
    }
  }
  await wait(300);
  await anim(s2, { opacity: '0' }, 400);

  // ── SCENE 4 — CTA ──
  var s4 = document.getElementById('scene4');
  await anim(s4, { opacity: '1' }, 300);
  await anim(document.getElementById('ctaLogo'), { opacity: '1' }, 350);
  await anim(document.getElementById('ctaHead'),
    { opacity: '1', transform: 'translateY(0)' }, 600, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('ctaHeadAr'),
    { opacity: '1', transform: 'translateY(0)' }, 450, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await wait(150);
  await anim(document.getElementById('ctaBox'),
    { opacity: '1', transform: 'scale(1)' }, 550, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
  await wait(200);
  await anim(document.getElementById('ctaUrl'),
    { opacity: '1', transform: 'translateY(0)' }, 400, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await anim(document.getElementById('ctaBadges'), { opacity: '1' }, 500);

  clearInterval(progressTick);
  bar.style.width = '100%';
  bar.style.transition = 'width 300ms linear';
}

createDots();
buildStage();
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════
// GENERATE ALL FILES
// ═══════════════════════════════════════════
let count = 0;

// Single file per product (with mode selector inside)
products.forEach(function(p) {
  const filename = `promo-${p.fileSlug}.html`;
  const html = p.variants.length > 0
    ? generateVariantProduct(p)
    : generateSingleProduct(p);
  fs.writeFileSync(filename, html);
  count++;
  console.log(`\u2713 ${filename}`);
});

// Single mega page (with mode selector inside)
const megaFilename = 'promo-all-products.html';
fs.writeFileSync(megaFilename, generateAllProducts());
count++;
console.log(`\u2713 ${megaFilename}`);

console.log(`\n\u2705 Done! Generated ${count} promo files.`);
