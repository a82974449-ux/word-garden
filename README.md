# مزرعة الكلمات — دليل النشر

## الخطوة 1: رفع الكود على GitHub
1. اذهب إلى github.com → اضغط **New repository**
2. اختر اسمًا (مثلاً `word-garden`) → اجعله **Public** أو **Private** كما تحب → **Create repository**
3. من صفحة المستودع الفارغ، اضغط **uploading an existing file**
4. اسحب/ارفع **كل الملفات والمجلدات** الموجودة هنا (بما فيها مجلد `api` و `src`) — تأكد أن البنية تبقى كما هي (لا تضغطها في ملف zip واحد، ارفعها كملفات فعلية)
5. اكتب أي رسالة commit → **Commit changes**

## الخطوة 2: ربط المشروع بـ Vercel
1. اذهب إلى vercel.com → **Sign up** أو **Log in** باستخدام حساب GitHub نفسه
2. اضغط **Add New... → Project**
3. اختر المستودع (`word-garden`) من القائمة → **Import**
4. اتركه على الإعدادات الافتراضية (Vercel يكتشف Vite تلقائيًا)

## الخطوة 3: أضف مفتاح Gemini كسر (لا تضعه في الكود أبدًا)
قبل الضغط على Deploy:
1. افتح قسم **Environment Variables** في نفس صفحة الإعداد
2. أضف متغيرًا:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: المفتاح الذي حصلت عليه من aistudio.google.com/apikey
3. اضغط **Add**، ثم **Deploy**

## الخطوة 4: احصل على رابطك
بعد انتهاء البناء (دقيقة أو دقيقتين)، سيعطيك Vercel رابطًا مثل:
`https://word-garden-xxxx.vercel.app`

هذا رابطك النهائي — شاركه مع من تريد.

## الخطوة 5 (مهمة أمنيًا): فعّل قواعد Firestore
1. افتح Firebase Console → مشروعك → **Firestore Database** → تبويب **Rules**
2. الصق محتوى ملف `firestore.rules` الموجود هنا بدل القاعدة الافتراضية (التي تسمح للجميع بالقراءة/الكتابة مؤقتًا في "test mode")
3. اضغط **Publish**

هذا يضمن أن كل مستخدم يرى ويعدّل بيانات مزرعته فقط، لا أحد غيره.

## الخطوة 6: أضف نطاق Vercel إلى قائمة Firebase المصرّح لها (Authorized domains)
1. Firebase Console → **Authentication** → تبويب **Settings** → **Authorized domains**
2. اضغط **Add domain** والصق نطاق Vercel الخاص بك (مثل `word-garden-xxxx.vercel.app`)
بدون هذه الخطوة، تسجيل الدخول بجوجل سيفشل على الرابط المنشور رغم عمله محليًا.

---

## ملاحظات
- أي تعديل تطلبه مني لاحقًا: أعطيك الملف المحدّث فقط، وترفعه لنفس المكان في GitHub (Vercel يعيد النشر تلقائيًا خلال ثوانٍ من كل تحديث).
