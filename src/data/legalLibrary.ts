export interface LegalArticle {
  id: string;
  codeId: "constitution" | "civil" | "civil_proc" | "criminal" | "criminal_proc" | "admin" | "labour" | "tax" | "family" | "economic_proc";
  codeName: string;
  articleNumber: string;
  articleTitle: string;
  content: string;
  keywords: string[];
}

export const LEGAL_CODES = [
  { id: "constitution", name: "Konstitutsiya", fullName: "O'zbekiston Respublikasi Konstitutsiyasi" },
  { id: "civil", name: "Fuqarolik kodeksi", fullName: "O'zbekiston Respublikasining Fuqarolik kodeksi" },
  { id: "civil_proc", name: "Fuqarolik protsessual kodeksi", fullName: "O'zbekiston Respublikasining Fuqarolik protsessual kodeksi" },
  { id: "criminal", name: "Jinoyat kodeksi", fullName: "O'zbekiston Respublikasining Jinoyat kodeksi" },
  { id: "criminal_proc", name: "Jinoyat-protsessual kodeksi", fullName: "O'zbekiston Respublikasining Jinoyat-protsessual kodeksi" },
  { id: "admin", name: "Ma'muriy javobgarlik k.", fullName: "O'zbekiston Respublikasining Ma'muriy javobgarlik to'g'risidagi kodeksi" },
  { id: "labour", name: "Mehnat kodeksi", fullName: "O'zbekiston Respublikasining Mehnat kodeksi" },
  { id: "tax", name: "Soliq kodeksi", fullName: "O'zbekiston Respublikasining Soliq kodeksi" },
  { id: "family", name: "Oila kodeksi", fullName: "O'zbekiston Respublikasining Oila kodeksi" },
  { id: "economic_proc", name: "Iqtisodiy protsessual k.", fullName: "O'zbekiston Respublikasining Iqtisodiy protsessual kodeksi" }
] as const;

export const LEGAL_LIBRARY: LegalArticle[] = [
  // Constitution
  {
    id: "const_13",
    codeId: "constitution",
    codeName: "O'zbekiston Respublikasi Konstitutsiyasi",
    articleNumber: "13-modda",
    articleTitle: "Demokratiya va insonparvarlik prinsiplari",
    content: "O‘zbekiston Respublikasida demokratiya umuminsoniy prinsiplarga asoslanadi, ularga ko‘ra inson, uning hayoti, erkinligi, sha’ni, qadr-qimmati va boshqa daxlsiz huquqlari oliy qadriyat hisoblanadi. Demokratik huquq va erkinliklar Konstitutsiya va qonunlar bilan himoya qilinadi.",
    keywords: ["demokratiya", "inson huquqlari", "erkinlik", "sharaf", "qadr-qimmat", "daxlsizlik"]
  },
  {
    id: "const_18",
    codeId: "constitution",
    codeName: "O'zbekiston Respublikasi Konstitutsiyasi",
    articleNumber: "18-modda",
    articleTitle: "Teng huquqlilik prinsipi",
    content: "O‘zbekiston Respublikasida barcha fuqarolar bir xil huquq va erkinliklarga ega bo‘lib, jinsi, irqi, millati, tili, dini, ijtimoiy kelib chiqishi, e’tiqodi, shaxsi va ijtimoiy mavqeyidan qat’i nazar, qonun oldida tengdirlar. Imtiyozlar faqat qonun bilan belgilanadi va ijtimoiy adolat prinsiplariga mos bo‘lishi shart.",
    keywords: ["tenglik", "kamsitish", "jins", "millat", "din", "qonun oldida tenglik"]
  },
  {
    id: "const_54",
    codeId: "constitution",
    codeName: "O'zbekiston Respublikasi Konstitutsiyasi",
    articleNumber: "54-modda",
    articleTitle: "Xususiy mulk huquqi va kafolatlari",
    content: "Mulkdor mulkiga o‘z xohishicha egalik qiladi, undan foydalanadi va uni tasarruf etadi. Mulkdan foydalanish ekologik muhitga zarar yetkazmasligi, fuqarolar, yuridik shaxslar va davlatning huquqlarini hamda qonun bilan qo‘riqlanadigan manfaatlarini buzmasligi kerak.",
    keywords: ["mulk", "xususiy mulk", "egas", "tasarruf qilish", "ekologiya", "mulkdor"]
  },
  {
    id: "const_41",
    codeId: "constitution",
    codeName: "O'zbekiston Respublikasi Konstitutsiyasi",
    articleNumber: "41-modda",
    articleTitle: "Mehnat qilish huquqi va sharoitlari",
    content: "Har bir shaxs munosib mehnat qilish, kasbni va faoliyat turini erkin tanlash, xavfsizlik va gigiyena talablariga javob beradigan qulay mehnat sharoitlarida ishlash, mehnati uchun hech qanday kamsitishlarsiz va belgilangan mehnatga haq to‘lashning eng kam miqdoridan kam bo‘lmagan miqdorda adolatli haq olish huquqiga ega.",
    keywords: ["mehnat", "ish", "maosh", "kamsitish", "minimal oylik", "xavfsizlik"]
  },

  // Civil Code
  {
    id: "civil_8",
    codeId: "civil",
    codeName: "Fuqarolik kodeksi",
    articleNumber: "8-modda",
    articleTitle: "Fuqarolik huquqlari va burchlarining vujudga kelish asoslari",
    content: "Fuqarolik huquqlari va burchlari qonun hujjatlarida nazarda tutilgan asoslardan, shuningdek fuqarolar va yuridik shaxslarning qonunda nazarda tutilgan bo‘lsa-da, lekin unga zid bo‘lmagan harakatlaridan vujudga keladi. Jumladan: shartnomalar va boshqa bitimlardan; sud qarorlaridan; zarar yetkazish natijasida.",
    keywords: ["huquq", "majburiyat", "bitim", "shartnoma", "sud qarori", "vujudga kelish"]
  },
  {
    id: "civil_99",
    codeId: "civil",
    codeName: "Fuqarolik kodeksi",
    articleNumber: "99-modda",
    articleTitle: "Nomoddiy ne'matlar himoyasi",
    content: "Insonning hayoti va sog‘lig‘i, shaxsiy daxlsizligi, sha’ni va qadr-qimmati, shaxsiy hayotining daxlsizligi, sir saqlanishi, mualliflik huquqi va boshqa nomoddiy ne‘matlar qonun bilan himoya qilinadi hamda daxlsizdir. Nomoddiy ne‘matlarni buzganlik uchun ma'naviy zarar undirilishi mumkin.",
    keywords: ["shaxsiy hayot", "sir", "sha'n", "qadr-qimmat", "nomoddiy ne'mat", "ma'naviy zarar"]
  },
  {
    id: "civil_354",
    codeId: "civil",
    codeName: "Fuqarolik kodeksi",
    articleNumber: "354-modda",
    articleTitle: "Shartnoma tuzish erkinligi",
    content: "Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar. Shartnoma tuzishga majburlashga yo‘l qo‘yilmaydi, shartnoma tuzish majburiyati ushbu Kodeksda, qonunlarda yoki qabul qilingan majburiyatda nazarda tutilgan hollar bundan mustasno. Taraflar qonunda nazarda tutilmagan shartnomalarni ham tuzishlari mumkin.",
    keywords: ["shartnoma erkinligi", "majburlash", "bitim", "taraflar erkinligi", "shartnoma tuzish"]
  },
  {
    id: "civil_985",
    codeId: "civil",
    codeName: "Fuqarolik kodeksi",
    articleNumber: "985-modda",
    articleTitle: "Zarar yetkazganlik uchun javobgarlikning umumiy asoslari",
    content: "G‘ayriqonuniy harakat (harakatsizlik) tufayli fuqaroning shaxsiga yoki mol-mulkiga yetkazilgan zarar, shuningdek yuridik shaxsga yetkazilgan zarar uni yetkazgan shaxs tomonidan to‘liq hajmda qoplanishi shart. Zarar yetkazgan shaxs, agar zarar o‘z aybi bilan yetkazilmaganini isbotlasa, zarar qoplashdan ozod qilinadi.",
    keywords: ["zarar", "g'ayriqonuniy harakat", "kompensatsiya", "zarar to'lash", "aybsiz zarar"]
  },
  {
    id: "civil_1021",
    codeId: "civil",
    codeName: "Fuqarolik kodeksi",
    articleNumber: "1021-modda",
    articleTitle: "Ma'naviy zararni qoplash usullari va miqdori",
    content: "Ma’naviy zarar pul shaklida qoplanadi. Ma’naviy zararni qoplash miqdori jabrlanuvchiga yetkazilgan jismoniy va ruhiy azoblarning xususiyatiga, shuningdek zarar yetkazuvchining aybi darajasiga qarab sud tomonidan belgilanadi. Ma’naviy zarar mulkiy zarardan qat'i nazar qoplanadi.",
    keywords: ["ma'naviy zarar", "ruhiy azob", "shikastlanish", "ayb darajasi", "pul shaklida qoplash"]
  },

  // Civil Procedure Code
  {
    id: "civil_proc_3",
    codeId: "civil_proc",
    codeName: "Fuqarolik protsessual kodeksi",
    articleNumber: "3-modda",
    articleTitle: "Sudga murojaat qilish huquqi",
    content: "Har qanday manfaatdor shaxs buzilgan yoki nizolashilayotgan huquqi yoxud qonun bilan qo‘riqlanadigan manfaatini himoya qilish uchun qonunda belgilangan tartibda fuqarolik ishlari bo‘yicha sudga murojaat qilishga haqli. Sudga murojaat qilish huquqidan voz kechish haqidagi kelishuv haqiqiy emas.",
    keywords: ["sudga murojaat", "manfaatdor shaxs", "himoya", "huquqdan voz kechish", "nizo"]
  },
  {
    id: "civil_proc_139",
    codeId: "civil_proc",
    codeName: "Fuqarolik protsessual kodeksi",
    articleNumber: "139-modda",
    articleTitle: "Da'vo arizasining shakli va mazmuni",
    content: "Da’vo arizasi sudga yozma shaklda yoki elektron hujjat tarzida taqdim etiladi. Arizada: sudning nomi, da’vogarning F.I.O. va manzili, javobgarning nomi va manzili, da’vogarning huquqlari buzilganligi nimadan iboratligi, da’vo talabi va unga asos bo‘lgan holatlar, shuningdek ilova qilinayotgan hujjatlar ro‘yxati ko‘rsatilishi kerak.",
    keywords: ["da'vo arizasi", "ariza mazmuni", "ilova", "da'vogar", "javobgar", "sud nomi"]
  },

  // Criminal Code
  {
    id: "crim_167",
    codeId: "criminal",
    codeName: "Jinoyat kodeksi",
    articleNumber: "167-modda",
    articleTitle: "O‘zlashtirish yoki rastrata yo‘li bilan talon-toroj qilish",
    content: "Aybdorga ishonib topshirilgan yoki uning ixtiyorida bo‘lgan o‘zganing mulkini o‘zlashtirish yoki rastrata qilish yo‘li bilan talon-toroj qilish — bazaviy hisoblash miqdorining yetmish besh baravarigacha miqdorda jarima yoki ikki yuz qirq soatgacha majburiy jamoat ishlari yoxud bir yilgacha axloq tuzatish ishlari bilan jazolanadi.",
    keywords: ["o'zlashtirish", "rastrata", "talon-toroj", "ishonib topshirilgan mulk", "jarima"]
  },
  {
    id: "crim_168",
    codeId: "criminal",
    codeName: "Jinoyat kodeksi",
    articleNumber: "168-modda",
    articleTitle: "Firibgarlik",
    content: "Firibgarlik, ya’ni aldash yoki ishonchni suiiste’mol qilish yo‘li bilan o‘zganing mulkini yoki o‘zganing mulkiga bo‘lgan huquqni qo‘lga kiritish — bazaviy hisoblash miqdorining ellik baravaridan yuz baravarigacha miqdorda jarima yoki ikki yilgacha axloq tuzatish ishlari yoxud bir yildan uch yilgacha ozodlikni cheklash yoki ozodlikdan mahrum qilish bilan jazolanadi.",
    keywords: ["firibgarlik", "aldash", "ishonchni suiiste'mol qilish", "jarima", "ozodlikdan mahrum qilish"]
  },
  {
    id: "crim_228",
    codeId: "criminal",
    codeName: "Jinoyat kodeksi",
    articleNumber: "228-modda",
    articleTitle: "Hujjatlarni qalbakilashtirish va ulardan foydalanish",
    content: "Sotish yoki foydalanish maqsadida soxta hujjatlar, muhrlar, blankalar tayyorlash yoxud qalbaki hujjatdan bila turib foydalanish — muayyan huquqdan mahrum qilish yoki bazaviy hisoblash miqdorining ellik baravarigacha jarima yoxud uch yuz soatgacha majburiy jamoat ishlari yoki ikki yilgacha axloq tuzatish ishlari bilan jazolanadi.",
    keywords: ["qalbakilashtirish", "soxta hujjat", "muhr", "blanka", "soxtakorlik", "bila turib foydalanish"]
  },

  // Criminal Procedure Code
  {
    id: "crim_proc_22",
    codeId: "criminal_proc",
    codeName: "Jinoyat-protsessual kodeksi",
    articleNumber: "22-modda",
    articleTitle: "Aybsizlik prezumpsiyasi va haqiqatni aniqlash",
    content: "Hech bir shaxs jinoyat sodir qilishda aybdorligi qonunda nazarda tutilgan tartibda isbotlanmaguncha va sudning qonuniy kuchga kirgan hukmi bilan aniqlanmaguncha aybsiz hisoblanadi. Aybdorlikka oid barcha shubhalar, agar ularni bartaraf etish imkoniyati tugatilgan bo‘lsa, gumon qilinuvchi, ayblanuvchi yoki sudlanuvchining foydasiga hal qilinadi.",
    keywords: ["aybsizlik prezumpsiyasi", "shubha", "isbotlash", "sud hukmi", "gumonlanuvchi"]
  },
  {
    id: "crim_proc_224",
    codeId: "criminal_proc",
    codeName: "Jinoyat-protsessual kodeksi",
    articleNumber: "224-modda",
    articleTitle: "Gumon qilinuvchini ushlab turish asoslari",
    content: "Militsiya yoki boshqa vakolatli organlar shaxsni jinoyat ustida yoki bevosita uni sodir etgandan keyin ko‘rgan bo‘lsa, guvohlar uni jinoyat sodir etgan shaxs deb ko‘rsatgan bo‘lsa yoxud uning yonida yoki uyida jinoyat asoratlari topilgan bo‘lsa, uni ushlab turishga haqlidirlar. Ushlab turilgan kundan 24 soat ichida bayonnoma tuziladi.",
    keywords: ["ushlab turish", "gumonlanuvchi", "bayonnoma", "jinoyat asoratlari", "militsiya"]
  },

  // Administrative Code
  {
    id: "admin_40",
    codeId: "admin",
    codeName: "Ma'muriy javobgarlik k.",
    articleNumber: "40-modda",
    articleTitle: "Tuhmat",
    content: "Tuhmat, ya’ni bila turib boshqa shaxsni obro‘sizlantiradigan yolg‘on uydirmalarni tarqatish — bazaviy hisoblash miqdorining yigirma baravaridan oltmish baravarigacha miqdorda jarima solishga sabab bo‘ladi.",
    keywords: ["tuhmat", "yolg'on", "uydirma", "obro'sizlantirish", "jarima"]
  },
  {
    id: "admin_41",
    codeId: "admin",
    codeName: "Ma'muriy javobgarlik k.",
    articleNumber: "41-modda",
    articleTitle: "Haqorat qilish",
    content: "Haqorat qilish, ya’ni shaxsning sha’ni va qadr-qimmatini qasddan beodoblik bilan tahqirlash — bazaviy hisoblash miqdorining yigirma baravaridan qirq baravarigacha miqdorda jarima solishga sabab bo‘ladi.",
    keywords: ["haqorat", "beodoblik", "tahqirlash", "sha'n", "qadr-qimmat"]
  },
  {
    id: "admin_135",
    codeId: "admin",
    codeName: "Ma'muriy javobgarlik k.",
    articleNumber: "135-modda",
    articleTitle: "Hujjatlarsiz transport vositalarini boshqarish",
    content: "Transport vositalarini boshqarish huquqi bo‘lmagan shaxslarning ushbu vositalarni boshqarishi, xuddi shuningdek transport vositasini boshqarish huquqi bo‘lmagan shaxsga boshqaruvning topshirilishi — bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.",
    keywords: ["transport", "guvohnomasiz haydash", "prava", "mashina boshqarish", "jarima"]
  },

  // Labour Code
  {
    id: "labour_153",
    codeId: "labour",
    codeName: "Mehnat kodeksi",
    articleNumber: "153-modda",
    articleTitle: "Mehnat shartnomasining taraflari va mazmuni",
    content: "Mehnat shartnomasi xodim bilan ish beruvchi o‘rtasidagi kelishuv bo‘lib, unga muvofiq xodim muayyan mutaxassislik yoki lavozim bo‘yicha topshirilgan ishni amalga oshirish majburiyatini oladi, ish beruvchi esa o‘z vaqtida va to‘liq miqdorda ish haqi to‘lash hamda qulay ish sharoitlarini ta'minlash majburiyatini oladi.",
    keywords: ["mehnat shartnomasi", "ish beruvchi", "ish haqi", "mutaxassislik", "ishchi majburiyati"]
  },
  {
    id: "labour_161",
    codeId: "labour",
    codeName: "Mehnat kodeksi",
    articleNumber: "161-modda",
    articleTitle: "Mehnat shartnomasini ish beruvchining tashabbusi bilan bekor qilish",
    content: "Mehnat shartnomasini ish beruvchining tashabbusi bilan bekor qilish quyidagi asoslar bo‘yicha amalga oshirilishi mumkin: texnologiyadagi o‘zgarishlar, shtatlar qisqarishi, xodimning o‘z vazifalarini muntazam ravishda bajarmasligi yoki o‘ta qo‘pol ravishda buzishi. Bekor qilishdan oldin kasaba uyushmasi bilan kelishilishi kerak.",
    keywords: ["shtat qisqarishi", "ishdan bo'shatish", "tashabbus", "kasaba uyushmasi", "mehnat majburiyati"]
  },
  {
    id: "labour_97",
    codeId: "labour",
    codeName: "Mehnat kodeksi",
    articleNumber: "97-modda",
    articleTitle: "Mehnat shartnomasini bekor qilish asoslari",
    content: "Mehnat shartnomasi quyidagi asoslar bo‘yicha bekor qilinishi mumkin: taraflarning kelishuvi bo‘yicha; mehnat shartnomasi muddatining tugashi bilan; xodimning tashabbusi bilan (ariza asosida); ish beruvchining tashabbusi bilan; taraflar ixtiyoriga bog‘liq bo‘lmagan holatlar bo‘yicha.",
    keywords: ["shartnomani bekor qilish", "kelishuv", "muddat tugashi", "ishdan ketish", "ariza"]
  },

  // Tax Code
  {
    id: "tax_34",
    codeId: "tax",
    codeName: "Soliq kodeksi",
    articleNumber: "34-modda",
    articleTitle: "Soliq to'lovchining majburiyatlari",
    content: "Soliq to‘lovchi qonunda belgilangan soliqlar va yig‘imlarni o‘z vaqtida va to‘liq hajmda to‘lashi, soliq hisobini yuritishi, soliq hisobotlarini soliq organlariga belgilangan muddatlarda topshirishi, shuningdek tekshirishlar davomida soliq organlarining qonuniy talablarini bajarishi shart.",
    keywords: ["soliq to'lash", "soliq hisoboti", "deklaratsiya", "majburiyat", "organlar", "tekshiruv"]
  },
  {
    id: "tax_369",
    codeId: "tax",
    codeName: "Soliq kodeksi",
    articleNumber: "369-modda",
    articleTitle: "Jismoniy shaxslardan olinadigan daromad solig'i ob'ekti",
    content: "O‘zbekiston Respublikasining rezidenti bo‘lgan jismoniy shaxslar uchun daromad solig‘i solish ob’ekti ularning O‘zbekiston Respublikasidagi manbalardan va uning tashqarisidagi manbalardan olgan daromadlari hisoblanadi. Rezident bo‘lmaganlar uchun esa faqat O'zbekistondagi manbalardan olingan daromadlar.",
    keywords: ["daromad solig'i", "jismoniy shaxslar", "rezident", "manba", "soliq solish ob'ekti"]
  },

  // Family Code
  {
    id: "family_2",
    codeId: "family",
    codeName: "Oila kodeksi",
    articleNumber: "2-modda",
    articleTitle: "Oila to'g'risidagi qonunchilik asoslari",
    content: "Oila to‘g‘risidagi qonunchilik nikoh tuzish, nikohning tugatilishi va uni haqiqiy emas deb topish shartlari va tartibini belgilaydi, oila a’zolari o‘rtasidagi shaxsiy nomulkiy va mulkiy munosabatlarni tartibga soladi.",
    keywords: ["nikoh", "oila", "er-xotin", "mulkiy munosabatlar", "nikoh tuzish", "vasiylik"]
  },
  {
    id: "family_15",
    codeId: "family",
    codeName: "Oila kodeksi",
    articleNumber: "15-modda",
    articleTitle: "Nikoh yoshi",
    content: "Nikoh yoshi erkaklar va ayollar uchun o‘n sakkiz yosh qilib belgilanadi. Uzrli sabablar bo‘lganda, tuman, shahar hokimi nikoh yoshini ko‘pi bilan bir yilga kamaytirishi mumkin.",
    keywords: ["nikoh yoshi", "voyaga yetmagan", "nikoh", "hokim", "uzrli sabab"]
  },

  // Economic Procedure Code
  {
    id: "economic_proc_3",
    codeId: "economic_proc",
    codeName: "Iqtisodiy protsessual kodeksi",
    articleNumber: "3-modda",
    articleTitle: "Iqtisodiy sudga murojaat qilish huquqi",
    content: "Har qanday manfaatdor shaxs o‘zining buzilgan yoki nizolashilayotgan huquqlari yoxud qonun bilan qo‘riqlanadigan manfaatlarini himoya qilish uchun iqtisodiy sudga murojaat qilishga haqli.",
    keywords: ["iqtisodiy sud", "tadbirkorlik", "sudga murojaat", "manfaatdor shaxs", "nizo"]
  },
  {
    id: "economic_proc_149",
    codeId: "economic_proc",
    codeName: "Iqtisodiy protsessual kodeksi",
    articleNumber: "149-modda",
    articleTitle: "Da'vo arizasining shakli va mazmuni",
    content: "Da’vo arizasi iqtisodiy sudga yozma ravishda yoki elektron hujjat ko'rinishida taqdim etiladi. Arizada ishda ishtirok etuvchi shaxslarning nomi, da’voning predmeti hamda asoslari, talablar keltiriladi.",
    keywords: ["iqtisodiy da'vo", "ariza", "shakl", "mazmuni", "sud", "talablar"]
  }
];
