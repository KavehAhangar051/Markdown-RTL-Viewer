# معماری سیستم و راهنمای توسعه (System Architecture)

مرجع فنی معماری، جریان داده، ساختار ماژول‌ها و بهینه‌سازی‌های وب و دسکتاپ پروژه **RTL Markdown Studio**.

---

## ۱. اصول بنیادین معماری

1. **تک‌مسئولیتی و ماژولار (SRP & Modularity):** هر فایل یک وظیفه مشخص دارد و سقف کدهای اجرایی هر فایل ۲۰۰ تا ۳۰۰ خط است (حداکثر ۴۰۰ خط در صورت خوانایی کامل).
2. **حریم خصوصی ۱۰۰٪ سمت کلاینت (Zero-Backend Privacy):** تمام پردازش‌های متن، آمارگیری و رندرینگ در حافظه محلی انجام می‌شود و هیچ داده‌ای به سرور ارسال نمی‌شود.
3. **خط لوله واکنشی معوق (60 FPS Deferred Pipeline):** جداسازی `StudioUIContext` از `PreviewDocumentContext` به همراه `useDeferredValue` و پنجره تجمیع تایپ `90ms` باعث می‌شود تایپ در ادیتور همیشه بدون ری‌رندر اضافی و با نرخ ۶۰ فریم بر ثانیه انجام شود.
4. **هسته دامنه خالص (Pure Domain Core):** توابع `services/markdownEngine.ts` و `utils/` بدون وابستگی به React یا DOM نوشته شده‌اند.
5. **پلتفرم دوگانه وب و دسکتاپ بومی ویندوز (Next.js + TinyJS WebView2):** خروجی پروژه هم به‌عنوان وب‌اپلیکیشن (GitHub Pages) و هم به‌عنوان برنامه بومی پرتابل ویندوز (`1920x1080`) با TinyJS و `txiki.js` اجرا می‌شود.

---

## ۲. جریان داده (Data Flow)

```text
[ ورودی کاربر در ادیتور / باز کردن فایل بومی ویندوز یا وب ]
                     │
                     ▼
          [ store/MarkdownContext ]
     ├── StudioUIContext (تم، زبان، وضعیت نماها — بدون ری‌رندر هنگام تایپ)
     └── PreviewDocumentContext (متن، عنوان، آمار و خروجی معوق)
                     │
                     ▼
       [ services/markdownEngine.ts ]
     ├── utils/rtlConverter (راست‌چین‌سازی هوشمند و ایزولاسیون کدهای LTR)
     ├── utils/statsCalculator (محاسبه کلمات، کاراکترها و زمان مطالعه)
     └── کش LRU کراندار برای جلوگیری از پردازش تکراری
                     │
                     ▼
         [ components/views/preview-view ]
     ├── ReactMarkdown + remark-gfm + remark-math + rehype-katex
     ├── هایلایت کد دوجهته (Highlight.js + cFamilyEnhancer + typographySegmenter)
     └── جداول و بلوک‌های ریاضی ایزوله‌شده
```

---

## ۳. ساختار دایرکتوری‌ها

```text
/
├── app/                      # روت Next.js 15 App Router، چیدمان و استایل‌های سراسری (globals.css)
├── src/backend/              # بک‌اند بومی دسکتاپ ویندوز روی موتور txiki.js (main.js)
├── scripts/                  # اسکریپت‌های بیلد دسکتاپ و تولید مانیفست بروزرسانی تفاضلی
│   ├── prepare-tinyjs-frontend.mjs # نسبی‌سازی مسیرهای استاتیک برای پروتکل file:// در WebView2
│   └── generate-delta-manifest.mjs # تولید هش SHA-256 فایل‌ها در delta-manifest.json
├── services/                 # موتور پردازش مارک‌داون و خروجی سند (markdownEngine.ts)
├── store/                    # کانتکست‌های تفکیک‌شده وضعیت برنامه (MarkdownContext.tsx)
├── components/
│   ├── layout/               # هدر، داک شناور، تایتل‌بار سفارشی دسکتاپ (desktop-titlebar.tsx) و FocusBar
│   ├── views/                # ادیتور، پیش‌نمایش زنده، مودال‌ها و ویترین
│   ├── ui/                   # کامپوننت‌های پایه (Dock، CodeBlock، MathBlock، Table، Modal)
│   ├── motion/               # ترنزیشن‌ها و انیمیشن‌های React 19 ViewTransition
│   ├── custom-cursor/        # نشانگر سه‌بعدی ماوس با همگام‌سازی rAF و حفظ نشانگر بومی در حالت غیرفعال
│   └── providers/            # ارائه‌دهنده‌های تم و موشن (LazyMotion domMax)
├── hooks/                    # هوک‌های تخصصی (اسکرول همگام، خط فعال، اتصال دسکتاپ TinyJS)
├── utils/                    # ابزارهای خالص (پل دسکتاپ tinyDesktopBridge، بروزرسان تفاضلی tinyDesktopUpdater، تشخیص سخت‌افزار deviceDetector)
├── types/                    # تایپ‌های TypeScript (شامل تایپ‌های پل بومی و مانیفست دلتا در tiny.ts)
└── constants/                # دیکشنری دوزبانه (fa/en)، مقادیر پیش‌فرض و نمونه مارک‌داون
```

---

## ۴. معماری نسخه دسکتاپ ویندوز (TinyJS) و بروزرسانی تفاضلی (Delta Updater)

1. **تایتل‌بار سفارشی بدون نوار سفید کلاسیک ویندوز:**
   - در `tinyjs.json` و `src/backend/main.js`، فریم و منوی سفید کلاسیک Win32 (`frame: false, menu: false`) غیرفعال شده و کامپوننت `DesktopTitlebar` با قابلیت جابه‌جایی پنجره (`data-tiny-drag`)، دکمه‌های فایل و کنترل‌های پنجره ویندوز ۱۱ جایگزین آن شده است.
   - رزولوشن پیش‌فرض برنامه دسکتاپ روی **`1920 × 1080`** تنظیم شده است.
2. **سیستم بروزرسانی تفاضلی کم‌حجم (`utils/tinyDesktopUpdater.ts`):**
   - در زمان بیلد، هش `SHA-256` و حجم تمام فایل‌های استاتیک در `delta-manifest.json` ذخیره می‌شود.
   - برنامه دسکتاپ هنگام اجرا، مانیفست محلی خود را با مانیفست منتشرشده در گیت‌هاب مقایسه می‌کند (`computeDeltaUpdatePlan`).
   - در صورت انتشار نسخه جدید، دکمه **`بروزرسانی vX.Y.Z`** در تایتل‌بار دسکتاپ ظاهر می‌شود و با کلیک کاربر، **فقط فایل‌های تغییریافته** (چند کیلوبایت) دانلود و در `%LOCALAPPDATA%/rtl-markdown-studio/delta-cache` ذخیره می‌شوند.

---

## ۵. بهینه‌سازی 60 FPS در ویندوز و دستگاه‌های ضعیف

1. **شتاب‌دهی سطح بازی و اپلیکیشن‌های بومی ویندوز در WebView2 (`src/backend/main.js`):**
   - تزریق پرچم‌های سخت‌افزاری کرومیوم (`--enable-gpu-rasterization`، `--enable-zero-copy`، `--ignore-gpu-blocklist`، `--enable-hardware-overlays` و `DirectCompositionUseNV12DecodeSwapChain`) برای رندر مستقیم روی SwapChain کارت گرافیک.
   - ارتقای اولویت پردازش `rtl-markdown-studio` و `msedgewebview2` به `AboveNormal` در زمان‌بند ویندوز.
2. **حفظ ۱۰۰٪ انیمیشن‌ها در دستگاه‌های ضعیف (`deviceDetector.ts` و `globals.css`):**
   - تشخیص خودکار سیستم‌های ضعیف (تعداد هسته `<= 4`، رم `<= 4GB`، گرافیک‌های مجتمع ضعیف در WebGL یا افت نرخ فریم زیر 45 FPS).
   - در حالت `reduce-motion-low-end` و `tiny-desktop-gpu`، تمام انیمیشن‌ها فعال می‌مانند؛ اما فیلترهای سنگین `backdrop-filter: blur()` حذف شده و بزرگ‌نمایی داک (`DockItem`) به جای تغییر `width/height` از `scale` روی GPU استفاده می‌کند تا Layout Reflow صفر شود.
3. **ایمنی نشانگر ماوس (`CustomCursor`):**
   - استایل `cursor: none !important` منحصراً به کلاس `html.custom-cursor-active` محدود است. روی دستگاه‌های ضعیف در وب، نشانگر سفارشی غیرفعال شده و نشانگر سخت‌افزاری سیستم‌عامل بدون هیچ تداخلی نمایش داده می‌شود.

---

## ۶. قوانین اجرایی و CI/CD

- **اعتبارسنجی کد:** پس از هر تغییر، دستور `npm run check` (`tsc --noEmit && eslint . && npm run lint:oxlint`) باید بدون خطا اجرا شود. (پروژه از فایل‌های تست استفاده نمی‌کند).
- **ورژن‌بندی پویا:** شماره نسخه در `package.json` و `tinyjs.json` باید همگام باشد؛ ورک‌فلو `.github/workflows/windows-desktop.yml` به‌طور خودکار تگ ریلیز `v<version>-windows` و فایل پرتابل زیپ را بر اساس `tinyjs.json` می‌سازد و منتشر می‌کند.
