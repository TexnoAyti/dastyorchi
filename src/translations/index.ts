export type Language = "uz_lat" | "uz_cyr" | "ru" | "en";

export interface TranslationSchema {
  nav: {
    dashboard: string;
    consultation: string;
    cases: string;
    templates: string;
    research: string;
    documentCenter: string;
    calendar: string;
    activityLog: string;
    languageCenter: string;
    settings: string;
    profile: string;
    adminPanel: string;
    signOut: string;
    signIn: string;
  };
  dashboard: {
    greeting: string;
    subGreeting: string;
    summary: string;
    totalCases: string;
    activeCases: string;
    generatedDocs: string;
    winProbability: string;
    quickActions: string;
    consultLawyerSub: string;
    newCaseSub: string;
    templatesLibrarySub: string;
    researchSub: string;
    recentActivity: string;
    noActivity: string;
    viewAll: string;
    weeklyOverview: string;
    performanceStats: string;
  };
  chat: {
    lawyerTitle: string;
    lawyerSub: string;
    placeholder: string;
    startNewChat: string;
    businessMode: string;
    privateMode: string;
    uploadFiles: string;
    micStart: string;
    micStop: string;
    generating: string;
    suggestions: string;
    suggestion1: string;
    suggestion2: string;
    suggestion3: string;
    suggestion4: string;
    noChats: string;
    anonymousNotice: string;
    attachedFiles: string;
  };
  editor: {
    titlePlaceholder: string;
    actions: string;
    saveToCases: string;
    exportPdf: string;
    exportDocx: string;
    addSignature: string;
    signatureRequired: string;
    signedText: string;
    clearSignature: string;
    placeholder: string;
    loadingExport: string;
  };
  cases: {
    title: string;
    sub: string;
    createNew: string;
    caseName: string;
    category: string;
    courtType: string;
    region: string;
    status: string;
    description: string;
    analyze: string;
    analysisReport: string;
    strengths: string;
    weaknesses: string;
    riskMatrix: string;
    strategy: string;
    expertise: string;
    evidence: string;
    addEvidence: string;
    evidenceCategory: string;
    uploadedAt: string;
    buildPackage: string;
    packageSub: string;
    winningProbability: string;
    riskLevel: string;
    noCases: string;
    noEvidence: string;
    exportPackage: string;
    deadlines: string;
    addDeadline: string;
    dueDate: string;
  };
  templates: {
    title: string;
    sub: string;
    search: string;
    categories: string;
    generateDoc: string;
    requiredFields: string;
    preview: string;
    downloadAs: string;
    civil: string;
    criminal: string;
    administrative: string;
    business: string;
    family: string;
    noTemplates: string;
  };
  research: {
    title: string;
    sub: string;
    askQuestion: string;
    askPlaceholder: string;
    category: string;
    generateReport: string;
    legalQuestions: string;
    principles: string;
    supportingArguments: string;
    opposingArguments: string;
    missingEvidence: string;
    riskLevel: string;
    reportSummary: string;
    noReports: string;
  };
  admin: {
    title: string;
    sub: string;
    totalUsers: string;
    totalRevenue: string;
    totalConversions: string;
    systemLogsTitle: string;
    userManagement: string;
    payments: string;
    announcements: string;
    errorMonitor: string;
    commonErrors: string;
    clientEmail: string;
    role: string;
    subTier: string;
    actions: string;
    auditLogs: string;
    timestamp: string;
    errorType: string;
    message: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    confirm: string;
    success: string;
    error: string;
    loading: string;
    empty: string;
    offlineMode: string;
    offlineNotice: string;
    proRequired: string;
    upgradeNow: string;
    searchPlaceholder: string;
    language: string;
    all: string;
    none: string;
  };
  profile: {
    title: string;
    subtitle: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  uz_lat: {
    nav: {
      dashboard: "Bosh sahifa",
      consultation: "AI Konsultatsiya",
      cases: "Sud ishlari",
      templates: "Shablonlar kutubxonasi",
      research: "Huquqiy tahlil (Research)",
      documentCenter: "Hujjatlar markazi",
      calendar: "Taqvim & Muddatlar",
      activityLog: "Harakatlar jurnali",
      languageCenter: "Til & Tarjima",
      settings: "Sozlamalar",
      profile: "Profil",
      adminPanel: "Admin panel",
      signOut: "Tizimdan chiqish",
      signIn: "Kirish",
    },
    dashboard: {
      greeting: "Assalomu alaykum",
      subGreeting: "Professional sud va huquqiy tahlil platformasiga xush kelibsiz.",
      summary: "Ishlar tahlili",
      totalCases: "Jami ishlar",
      activeCases: "Faol ishlar",
      generatedDocs: "Yaratilgan hujjatlar",
      winProbability: "Yutuq ehtimoli (O'rtacha)",
      quickActions: "Tezkor amallar",
      consultLawyerSub: "AI Advokat bilan onlayn maslahatlashish",
      newCaseSub: "Yangi sud ishini yaratish va tahlil qilish",
      templatesLibrarySub: "Tayyor yuridik shablonlardan foydalanish",
      researchSub: "Huquqiy muammoni chuqur tahlil qilish",
      recentActivity: "Yaqindagi harakatlar",
      noActivity: "Harakatlar mavjud emas",
      viewAll: "Barchasini ko'rish",
      weeklyOverview: "Haftalik hisobot",
      performanceStats: "Samaradorlik ko'rsatkichlari",
    },
    chat: {
      lawyerTitle: "AI Advokat & Konsultant",
      lawyerSub: "O'zbekiston Respublikasi qonunlariga asoslangan huquqiy yordam",
      placeholder: "Savolingizni yoki huquqiy muammoni batafsil yozing...",
      startNewChat: "Yangi suhbat boshlash",
      businessMode: "Biznes rejim (Tadbirkorlar uchun)",
      privateMode: "Shaxsiy rejim (Konfidentsial)",
      uploadFiles: "Hujjat ilova qilish",
      micStart: "Ovozli yozishni boshlash",
      micStop: "Ovozni to'xtatish",
      generating: "AI javob tayyorlamoqda...",
      suggestions: "Tavsiya etilgan savollar:",
      suggestion1: "Mehnat shartnomasini bekor qilish tartibini tushuntiring",
      suggestion2: "Fuqarolik kodeksi bo'yicha bitim va shartnoma farqi nimada?",
      suggestion3: "Tadbirkorlik faoliyatida duch keladigan asosiy huquqiy xavflar",
      suggestion4: "Sud qaroridan norozi bo'lganda apellyatsiya berish muddati qancha?",
      noChats: "Suhbatlar tarixi mavjud emas",
      anonymousNotice: "Siz anonim rejimdasiz. Ma'lumotlaringiz xavfsiz saqlanadi.",
      attachedFiles: "Ilova qilingan fayllar",
    },
    editor: {
      titlePlaceholder: "Hujjat sarlavhasi...",
      actions: "Amallar",
      saveToCases: "Ishga biriktirish",
      exportPdf: "PDF-ga eksport",
      exportDocx: "Word (DOCX) eksport",
      addSignature: "Raqamli imzo qo'yish",
      signatureRequired: "Imzo talab qilinadi",
      signedText: "Raqamli imzo biriktirildi",
      clearSignature: "Imzoni tozalash",
      placeholder: "Hujjat matnini yozing...",
      loadingExport: "Fayl tayyorlanmoqda...",
    },
    cases: {
      title: "Sud ishlari portali",
      sub: "Sud ishlarini boshqarish, dalillarni tahlil qilish va yutuq ehtimolini hisoblash.",
      createNew: "Yangi ish ochish",
      caseName: "Ish sarlavhasi",
      category: "Ish toifasi",
      courtType: "Sud turi",
      region: "Hudud (Viloyat)",
      status: "Holati",
      description: "Ishning batafsil tavsifi",
      analyze: "AI bilan tahlil qilish",
      analysisReport: "AI Analitika Hisoboti",
      strengths: "Kuchli tomonlar",
      weaknesses: "Zaif tomonlar",
      riskMatrix: "Xavflar matritsasi",
      strategy: "Sud strategiyasi",
      expertise: "Ekspert maslahati",
      evidence: "Dalillar va hujjatlar",
      addEvidence: "Dalil yuklash",
      evidenceCategory: "Kategoriya",
      uploadedAt: "Yuklangan vaqt",
      buildPackage: "Sud paketini yig'ish",
      packageSub: "Dalillar va arizalarni tizimli tartiblash",
      winningProbability: "Tayyorgarlik darajasi",
      riskLevel: "Xavf darajasi",
      noCases: "Hozircha sud ishlari yaratilmagan.",
      noEvidence: "Ushbu ish bo'yicha dalillar yuklanmagan.",
      exportPackage: "Sud paketini yuklab olish (ZIP)",
      deadlines: "Muhim muddatlar",
      addDeadline: "Yangi muddat qo'shish",
      dueDate: "Muddat sanasi",
    },
    templates: {
      title: "Yuridik shablonlar kutubxonasi",
      sub: "O'zbekiston Respublikasining rasmiy namunaviy shartnomalari, da'vo arizalari va qarorlar loyihalari.",
      search: "Shablonlardan qidirish...",
      categories: "Kategoriyalar",
      generateDoc: "Hujjatni shakllantirish",
      requiredFields: "So'ralgan ma'lumotlarni to'ldiring",
      preview: "Hujjatni oldindan ko'rish",
      downloadAs: "Yuklab olish",
      civil: "Fuqarolik ishlari",
      criminal: "Jinoyat ishlari",
      administrative: "Ma'muriy ishlar",
      business: "Tadbirkorlik & Shartnomalar",
      family: "Oila huquqi",
      noTemplates: "Mos keluvchi shablonlar topilmadi.",
    },
    research: {
      title: "Ilmiy va huquqiy tahlil (Research)",
      sub: "Murakkab huquqiy muammolarga qonunchilik va sud amaliyoti asosida to'liq tahliliy hisobot tayyorlash.",
      askQuestion: "Tahlil uchun huquqiy savol",
      askPlaceholder: "Masalan: Qarz shartnomasi bo'yicha jismoniy shaxsdan undiruv tartibi qanday?",
      category: "Toifa",
      generateReport: "Tahlil hisobotini yaratish",
      legalQuestions: "Asosiy huquqiy savollar",
      principles: "Normativ-huquqiy asoslar",
      supportingArguments: "Sizning foydangizga vajlar",
      opposingArguments: "Raqib tomonning ehtimoliy vajlari",
      missingEvidence: "Yetishmayotgan hujjatlar",
      riskLevel: "Huquqiy xavf",
      reportSummary: "Tahlilning qisqacha mazmuni",
      noReports: "Hozircha tahliliy hisobotlar yo'q.",
    },
    admin: {
      title: "Tizim boshqaruvi (Admin Panel)",
      sub: "Platformadagi moliyaviy foydalanish dinamikasi, yangi foydalanuvchilar va tizim auditini kuzatib boring.",
      totalUsers: "Jami foydalanuvchilar",
      totalRevenue: "Jami tushum",
      totalConversions: "Tarjimalar soni",
      systemLogsTitle: "So'nggi tizim jurnallari",
      userManagement: "Foydalanuvchilar nazorati",
      payments: "To'lovlar hisoboti",
      announcements: "E'lonlar tarqatish",
      errorMonitor: "Xatoliklar monitori",
      commonErrors: "Ko'p qayd etilgan xatoliklar",
      clientEmail: "Mijoz emaili",
      role: "Rol",
      subTier: "Tarif",
      actions: "Amallar",
      auditLogs: "Audit jurnallari",
      timestamp: "Vaqt",
      errorType: "Xato turi",
      message: "Tafsilotlar",
    },
    common: {
      save: "Saqlash",
      cancel: "Bekor qilish",
      delete: "O'chirish",
      edit: "Tahrirlash",
      close: "Yopish",
      back: "Orqaga",
      next: "Keyingisi",
      confirm: "Tasdiqlash",
      success: "Muvaffaqiyatli bajarildi",
      error: "Xatolik yuz berdi",
      loading: "Yuklanmoqda...",
      empty: "Ma'lumot mavjud emas",
      offlineMode: "Oflayn rejim",
      offlineNotice: "Internet aloqasi uzildi. Ishingiz xavfsiz saqlanmoqda.",
      proRequired: "PRO tarif talab etiladi",
      upgradeNow: "Tarifni yangilash",
      searchPlaceholder: "Qidirish...",
      language: "Til",
      all: "Barchasi",
      none: "Hech qanday",
    },
    profile: {
      title: "Foydalanuvchi Profili",
      subtitle: "Shaxsiy ma'lumotlar va tarifingizni boshqaring",
    },
  },
  uz_cyr: {
    nav: {
      dashboard: "Бош саҳифа",
      consultation: "АИ Консультация",
      cases: "Суд ишлари",
      templates: "Шаблонлар кутубхонаси",
      research: "Ҳуқуқий таҳлил (Research)",
      documentCenter: "Ҳужжатлар маркази",
      calendar: "Тақвим & Муддатлар",
      activityLog: "Ҳаракатлар журнали",
      languageCenter: "Тил & Таржима",
      settings: "Созламалар",
      profile: "Профил",
      adminPanel: "Админ панел",
      signOut: "Тизимдан чиқиш",
      signIn: "Кириш",
    },
    dashboard: {
      greeting: "Ассалому алайкум",
      subGreeting: "Профессионал суд ва ҳуқуқий таҳлил платформасига хуш келибсиз.",
      summary: "Ишлар таҳлили",
      totalCases: "Жами ишлар",
      activeCases: "Фаол ишлар",
      generatedDocs: "Яратилган ҳужжатлар",
      winProbability: "Ютуқ эҳтимоли (Ўртача)",
      quickActions: "Тезкор амаллар",
      consultLawyerSub: "АИ Адвокат билан онлайн маслаҳатлашиш",
      newCaseSub: "Янги суд ишини яратиш ва таҳлил қилиш",
      templatesLibrarySub: "Тайёр юридик шаблонлардан фойдаланиш",
      researchSub: "Ҳуқуқий муаммони чуқур таҳлил қилиш",
      recentActivity: "Яқиндаги ҳаракатлар",
      noActivity: "Ҳаракатлар мавжуд эмас",
      viewAll: "Барчасини кўриш",
      weeklyOverview: "Ҳафталик ҳисобот",
      performanceStats: "Самарадорлик кўрсаткичлари",
    },
    chat: {
      lawyerTitle: "АИ Адвокат & Консультант",
      lawyerSub: "Ўзбекистон Республикаси қонунларига асосланган ҳуқуқий ёрдам",
      placeholder: "Саволингизни ёки ҳуқуқий муаммони батафсил ёзинг...",
      startNewChat: "Янги суҳбат бошлаш",
      businessMode: "Бизнес режим (Тадбиркорлар учун)",
      privateMode: "Шахсий режим (Конфиденциал)",
      uploadFiles: "Ҳужжат илова қилиш",
      micStart: "Овозли ёзишни бошлаш",
      micStop: "Овозни тўхтатиш",
      generating: "АИ жавоб тайёрламоқда...",
      suggestions: "Тавсия этилган саволлар:",
      suggestion1: "Меҳнат шартномасини бекор қилиш тартибини тушунтиринг",
      suggestion2: "Фуқаролик кодекси бўйича битим ва шартнома фарқи нимада?",
      suggestion3: "Тадбиркорлик фаолиятида дуч келадиган асосий ҳуқуқий хавфлар",
      suggestion4: "Суд қароридан норози бўлганда апелляция бериш муддати қанча?",
      noChats: "Суҳбатлар тарихи мавжуд эмас",
      anonymousNotice: "Сиз аноним режимдасиз. Маълумотларингиз хавфсиз сақланади.",
      attachedFiles: "Илова қилинган файллар",
    },
    editor: {
      titlePlaceholder: "Ҳужжат сарлавҳаси...",
      actions: "Амаллар",
      saveToCases: "Ишга бириктириш",
      exportPdf: "ПДФ-га экспорт",
      exportDocx: "Wорд (ДОЦX) экспорт",
      addSignature: "Рақамли имзо қўйиш",
      signatureRequired: "Имзо талаб қилинади",
      signedText: "Рақамли имзо бириктирилди",
      clearSignature: "Имзони тозалаш",
      placeholder: "Ҳужжат матнини ёзинг...",
      loadingExport: "Файл тайёрланмоқда...",
    },
    cases: {
      title: "Суд ишлари портали",
      sub: "Суд ишларини бошқариш, далилларни таҳлил қилиш ва ютуқ эҳтимолини ҳисоблаш.",
      createNew: "Янги иш очиш",
      caseName: "Иш сарлавҳаси",
      category: "Иш тоифаси",
      courtType: "Суд тури",
      region: "Ҳудуд (Вилоят)",
      status: "Ҳолати",
      description: "Ишнинг батафсил тавсифи",
      analyze: "АИ билан таҳлил қилиш",
      analysisReport: "АИ Аналитика Ҳисоботи",
      strengths: "Кучли томонлар",
      weaknesses: "Заиф томонлар",
      riskMatrix: "Хавфлар матрицаси",
      strategy: "Суд стратегияси",
      expertise: "Эксперт маслаҳати",
      evidence: "Далиллар ва ҳужжатлар",
      addEvidence: "Далил юклаш",
      evidenceCategory: "Категория",
      uploadedAt: "Юкланган вақт",
      buildPackage: "Суд пакетини йиғиш",
      packageSub: "Далиллар ва аризаларни тизимли тартиблаш",
      winningProbability: "Тайёргарлик даражаси",
      riskLevel: "Хавф даражаси",
      noCases: "Ҳозирча суд ишлари яратилмаган.",
      noEvidence: "Ушбу иш бўйича далиллар юкланмаган.",
      exportPackage: "Суд пакетини юклаб олиш (ЗИП)",
      deadlines: "Муҳим муддатлар",
      addDeadline: "Янги муддат қўшиш",
      dueDate: "Муддат санаси",
    },
    templates: {
      title: "Юридик шаблонлар кутубхонаси",
      sub: "Ўзбекистон Республикасининг расмий намунавий шартномалари, даъво аризалари ва қарорлар лойиҳалари.",
      search: "Шаблонлардан қидириш...",
      categories: "Категориялар",
      generateDoc: "Ҳужжатни шакллантириш",
      requiredFields: "Сўралган маълумотларни тўлдиринг",
      preview: "Ҳужжатни олдиндан кўриш",
      downloadAs: "Юклаб олиш",
      civil: "Фуқаролик ишлари",
      criminal: "Жиноят ишлари",
      administrative: "Маъмурий ишлар",
      business: "Тадбиркорлик & Шартномалар",
      family: "Оила ҳуқуқи",
      noTemplates: "Мос келувчи шаблонлар топилмади.",
    },
    research: {
      title: "Илмий ва ҳуқуқий таҳлил (Research)",
      sub: "Мураккаб ҳуқуқий муаммоларга қонунчилик ва суд амалиёти асосида тўлиқ таҳлилий ҳисобот тайёрлаш.",
      askQuestion: "Таҳлил учун ҳуқуқий савол",
      askPlaceholder: "Масалан: Қарз шартномаси бўйича жисмоний шахсдан ундирув тартиби қандай?",
      category: "Тоифа",
      generateReport: "Таҳлил ҳисоботини яратиш",
      legalQuestions: "Асосий ҳуқуқий саволлар",
      principles: "Норматив-ҳуқуқий асослар",
      supportingArguments: "Сизнинг фойдангизга важлар",
      opposingArguments: "Рақиб томоннинг эҳтимолий важлари",
      missingEvidence: "Йетишмаётган ҳужжатлар",
      riskLevel: "Ҳуқуқий хавф",
      reportSummary: "Таҳлилнинг қисқача мазмуни",
      noReports: "Ҳозирча таҳлилий ҳисоботлар йўқ.",
    },
    admin: {
      title: "Тизим бошқаруви (Admin Panel)",
      sub: "Платформадаги молиявий фойдаланиш динамикаси, янги фойдаланувчилар ва тизим аудитини кузатиб боринг.",
      totalUsers: "Жами фойдаланувчилар",
      totalRevenue: "Жами тушум",
      totalConversions: "Таржималар сони",
      systemLogsTitle: "Соўнгги тизим журналлари",
      userManagement: "Фойдаланувчилар назорати",
      payments: "Тўловлар ҳисоботи",
      announcements: "Эълонлар тарқатиш",
      errorMonitor: "Хатоликлар монитори",
      commonErrors: "Кўп қайд этилган хатоликлар",
      clientEmail: "Мижоз емаили",
      role: "Рол",
      subTier: "Тариф",
      actions: "Амаллар",
      auditLogs: "Аудит журналлари",
      timestamp: "Вақт",
      errorType: "Хато тури",
      message: "Тафсилотлар",
    },
    common: {
      save: "Сақлаш",
      cancel: "Бекор қилиш",
      delete: "Ўчириш",
      edit: "Таҳрирлаш",
      close: "Ёпиш",
      back: "Орқага",
      next: "Кейингиси",
      confirm: "Тасдиқлаш",
      success: "Муваффақиятли бажарилди",
      error: "Хатолик юз берди",
      loading: "Юкланмоқда...",
      empty: "Маълумот мавжуд эмас",
      offlineMode: "Офлайн режим",
      offlineNotice: "Интернет алоқаси узилди. Ишингиз хавфсиз сақланмоқда.",
      proRequired: "ПРО тариф талаб этилади",
      upgradeNow: "Тарифни янгилаш",
      searchPlaceholder: "Қидириш...",
      language: "Тил",
      all: "Барчаси",
      none: "Ҳеч қандай",
    },
    profile: {
      title: "Фойдаланувчи Профили",
      subtitle: "Шахсий маълумотлар ва тарифингизни бошқаринг",
    },
  },
  ru: {
    nav: {
      dashboard: "Дашборд",
      consultation: "ИИ Консультация",
      cases: "Судебные дела",
      templates: "Библиотека шаблонов",
      research: "Юридический анализ",
      documentCenter: "Центр документов",
      calendar: "Календарь и Сроки",
      activityLog: "Журнал действий",
      languageCenter: "Язык и Перевод",
      settings: "Настройки",
      profile: "Профиль",
      adminPanel: "Админ-панель",
      signOut: "Выйти из системы",
      signIn: "Войти",
    },
    dashboard: {
      greeting: "Здравствуйте",
      subGreeting: "Добро пожаловать в профессиональную платформу судебной аналитики.",
      summary: "Анализ судебных дел",
      totalCases: "Всего дел",
      activeCases: "Активные дела",
      generatedDocs: "Создано документов",
      winProbability: "Вероятность успеха (Средняя)",
      quickActions: "Быстрые действия",
      consultLawyerSub: "Онлайн консультация с ИИ-Адвокатом",
      newCaseSub: "Создать новое дело и провести ИИ-аналитику",
      templatesLibrarySub: "Использовать готовые юридические шаблоны",
      researchSub: "Глубокий анализ юридической проблемы",
      recentActivity: "Последние действия",
      noActivity: "Нет недавних действий",
      viewAll: "Посмотреть все",
      weeklyOverview: "Еженедельный отчет",
      performanceStats: "Показатели эффективности",
    },
    chat: {
      lawyerTitle: "ИИ-Адвокат и Консультант",
      lawyerSub: "Юридическая помощь на основе законодательства Республики Узбекистан",
      placeholder: "Опишите ваш юридический вопрос или проблему подробно...",
      startNewChat: "Начать новый диалог",
      businessMode: "Бизнес режим (Для бизнеса)",
      privateMode: "Приватный режим (Конфиденциально)",
      uploadFiles: "Прикрепить файл",
      micStart: "Начать запись голоса",
      micStop: "Остановить запись",
      generating: "ИИ готовит ответ...",
      suggestions: "Рекомендуемые вопросы:",
      suggestion1: "Объясните процедуру расторжения трудового договора",
      suggestion2: "В чем разница между сделкой и договором по Гражданскому кодексу?",
      suggestion3: "Основные юридические риски в предпринимательской деятельности",
      suggestion4: "Каков срок подачи апелляции при несогласии с решением суда?",
      noChats: "История диалогов пуста",
      anonymousNotice: "Вы находитесь в анонимном режиме. Данные защищены.",
      attachedFiles: "Прикрепленные файлы",
    },
    editor: {
      titlePlaceholder: "Заголовок документа...",
      actions: "Действия",
      saveToCases: "Прикрепить к делу",
      exportPdf: "Экспорт в PDF",
      exportDocx: "Экспорт в Word (DOCX)",
      addSignature: "Прикрепить цифровую подпись",
      signatureRequired: "Требуется подпись",
      signedText: "Цифровая подпись прикреплена",
      clearSignature: "Очистить подпись",
      placeholder: "Начните вводить текст документа...",
      loadingExport: "Файл готовится к экспорту...",
    },
    cases: {
      title: "Судебный портал",
      sub: "Управляйте судебными делами, анализируйте доказательства и прогнозируйте вероятность выигрыша.",
      createNew: "Открыть новое дело",
      caseName: "Заголовок дела",
      category: "Категория",
      courtType: "Тип суда",
      region: "Регион",
      status: "Статус",
      description: "Подробное описание дела",
      analyze: "Проанализировать с ИИ",
      analysisReport: "Аналитический отчет ИИ",
      strengths: "Сильные стороны",
      weaknesses: "Слабые стороны",
      riskMatrix: "Матрица рисков",
      strategy: "Судебная стратегия",
      expertise: "Совет эксперта",
      evidence: "Доказательства и документы",
      addEvidence: "Загрузить доказательство",
      evidenceCategory: "Категория",
      uploadedAt: "Дата загрузки",
      buildPackage: "Собрать судебный пакет",
      packageSub: "Систематизация документов и доказательств",
      winningProbability: "Процессуальная готовность",
      riskLevel: "Уровень риска",
      noCases: "Судебные дела еще не созданы.",
      noEvidence: "Доказательства по этому делу еще не добавлены.",
      exportPackage: "Скачать судебный пакет (ZIP)",
      deadlines: "Критические сроки",
      addDeadline: "Добавить срок",
      dueDate: "Крайний срок",
    },
    templates: {
      title: "Библиотека шаблонов",
      sub: "Официальные типовые договоры, исковые заявления и проекты решений Республики Узбекистан.",
      search: "Поиск шаблонов...",
      categories: "Категории",
      generateDoc: "Сформировать документ",
      requiredFields: "Заполните необходимые поля",
      preview: "Предварительный просмотр",
      downloadAs: "Скачать как",
      civil: "Гражданские дела",
      criminal: "Уголовные дела",
      administrative: "Административные дела",
      business: "Бизнес и Договоры",
      family: "Семейное право",
      noTemplates: "Соответствующие шаблоны не найдены.",
    },
    research: {
      title: "Юридические исследования",
      sub: "Подготовка полных аналитических отчетов по сложным правовым вопросам на основе законов и судебной практики.",
      askQuestion: "Юридический вопрос для исследования",
      askPlaceholder: "Пример: Каков порядок взыскания долга с физического лица по договору займа?",
      category: "Категория",
      generateReport: "Создать аналитический отчет",
      legalQuestions: "Основные правовые вопросы",
      principles: "Нормативно-правовая база",
      supportingArguments: "Аргументы в вашу пользу",
      opposingArguments: "Ожидаемые аргументы оппонента",
      missingEvidence: "Недостающие документы",
      riskLevel: "Правой риск",
      reportSummary: "Краткое содержание исследования",
      noReports: "Аналитические отчеты отсутствуют.",
    },
    admin: {
      title: "Панель администратора",
      sub: "Мониторинг финансовой активности, пользователей и аудит системных ошибок.",
      totalUsers: "Всего пользователей",
      totalRevenue: "Общий доход",
      totalConversions: "Количество переводов",
      systemLogsTitle: "Последние системные логи",
      userManagement: "Управление пользователями",
      payments: "Отчет по платежам",
      announcements: "Рассылка объявлений",
      errorMonitor: "Мониторинг ошибок",
      commonErrors: "Частые ошибки",
      clientEmail: "Email клиента",
      role: "Роль",
      subTier: "Тариф",
      actions: "Действия",
      auditLogs: "Логи аудита",
      timestamp: "Время",
      errorType: "Тип ошибки",
      message: "Детали",
    },
    common: {
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      close: "Закрыть",
      back: "Назад",
      next: "Далее",
      confirm: "Подтвердить",
      success: "Успешно выполнено",
      error: "Произошла ошибка",
      loading: "Загрузка...",
      empty: "Данные отсутствуют",
      offlineMode: "Автономный режим",
      offlineNotice: "Подключение к Интернету потеряно. Ваша работа в безопасности.",
      proRequired: "Требуется PRO тариф",
      upgradeNow: "Обновить тариф",
      searchPlaceholder: "Поиск...",
      language: "Язык",
      all: "Все",
      none: "Нет",
    },
    profile: {
      title: "Профиль Пользователя",
      subtitle: "Управление личными данными и тарифом подписки",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      consultation: "AI Consultation",
      cases: "Court Cases",
      templates: "Templates Library",
      research: "Legal Analysis",
      documentCenter: "Document Center",
      calendar: "Calendar & Deadlines",
      activityLog: "Activity Log",
      languageCenter: "Language & Translation",
      settings: "Settings",
      profile: "Profile",
      adminPanel: "Admin Panel",
      signOut: "Sign Out",
      signIn: "Sign In",
    },
    dashboard: {
      greeting: "Welcome",
      subGreeting: "Welcome to professional court and legal analysis platform.",
      summary: "Case Analysis Summary",
      totalCases: "Total Cases",
      activeCases: "Active Cases",
      generatedDocs: "Generated Docs",
      winProbability: "Win Rate (Average)",
      quickActions: "Quick Actions",
      consultLawyerSub: "Online consultation with AI Lawyer",
      newCaseSub: "Create a new court case and run AI analytics",
      templatesLibrarySub: "Generate standard legal drafts and paperwork",
      researchSub: "Conduct in-depth legal and analytical research",
      recentActivity: "Recent Activity",
      noActivity: "No activity records found",
      viewAll: "View All",
      weeklyOverview: "Weekly Overview",
      performanceStats: "Performance Metrics",
    },
    chat: {
      lawyerTitle: "AI Lawyer & Consultant",
      lawyerSub: "Expert assistance based on the legislation of the Republic of Uzbekistan",
      placeholder: "Ask details about your case or legal issues...",
      startNewChat: "Start New Consultation",
      businessMode: "Business Mode (For Enterprises)",
      privateMode: "Private Mode (Confidential)",
      uploadFiles: "Attach Files",
      micStart: "Start Voice Input",
      micStop: "Stop Voice Input",
      generating: "AI is crafting response...",
      suggestions: "Frequently Asked Questions:",
      suggestion1: "Explain the procedure of employment contract termination",
      suggestion2: "What is the difference between agreement and transaction in Civil Code?",
      suggestion3: "What are the key legal risks in entrepreneurial activities?",
      suggestion4: "What is the exact deadline to file an appeal when disagreeing with a verdict?",
      noChats: "No advisory logs found",
      anonymousNotice: "You are currently anonymous. No public records are saved.",
      attachedFiles: "Attached files",
    },
    editor: {
      titlePlaceholder: "Document Title...",
      actions: "Actions",
      saveToCases: "Add to Case File",
      exportPdf: "Export PDF",
      exportDocx: "Export DOCX Word",
      addSignature: "Insert Digital Signature",
      signatureRequired: "Signature mandatory",
      signedText: "Digitally signed",
      clearSignature: "Clear Signature",
      placeholder: "Write document content here...",
      loadingExport: "Preparing export package...",
    },
    cases: {
      title: "Court Docket Center",
      sub: "Manage courtroom cases, structure evidence packages, and estimate winning probability.",
      createNew: "Initiate Case Filings",
      caseName: "Case Name",
      category: "Category",
      courtType: "Court Class",
      region: "Region",
      status: "Status",
      description: "Brief Case Description",
      analyze: "Analyze with Legal AI",
      analysisReport: "AI Analytical Advisory",
      strengths: "Core Strengths",
      weaknesses: "Case Vulnerabilities",
      riskMatrix: "Risk Mitigation Matrix",
      strategy: "Litigation Strategy",
      expertise: "Expert Guidance",
      evidence: "Physical Evidence & Media",
      addEvidence: "Add Evidence",
      evidenceCategory: "Category",
      uploadedAt: "Uploaded",
      buildPackage: "Synthesize Court Package",
      packageSub: "Package all files and declarations cleanly",
      winningProbability: "Procedural Readiness",
      riskLevel: "Risk Level",
      noCases: "No judicial cases created yet.",
      noEvidence: "No evidence loaded for this active file.",
      exportPackage: "Download Court Package (ZIP)",
      deadlines: "Advisory Milestones",
      addDeadline: "Schedule Deadline",
      dueDate: "Due Date",
    },
    templates: {
      title: "Legal Library and Templates",
      sub: "Official contracts, legal statements, and judicial acts of the Republic of Uzbekistan.",
      search: "Search templates...",
      categories: "Categories",
      generateDoc: "Build Document",
      requiredFields: "Complete fields to synthesize document",
      preview: "Document Preview",
      downloadAs: "Download As",
      civil: "Civil Disputes",
      criminal: "Criminal Law",
      administrative: "Administrative Proceedings",
      business: "Business and Corporate",
      family: "Family Disputes",
      noTemplates: "No matching templates found.",
    },
    research: {
      title: "Legal Research Hub",
      sub: "Detailed analysis on legal matters backed by state laws and judicial precedents.",
      askQuestion: "Legal Research Inquiry",
      askPlaceholder: "e.g., What is the procedure for debt collection from an individual under loan contracts?",
      category: "Discipline",
      generateReport: "Perform Legal Analysis",
      legalQuestions: "Primary Legal Issues",
      principles: "Statutory Frameworks",
      supportingArguments: "Favorable Legal Claims",
      opposingArguments: "Expected Opposition Claims",
      missingEvidence: "Missing Documentation",
      riskLevel: "Incurred Legal Risk",
      reportSummary: "Research Brief Summary",
      noReports: "No scholarly analyses compiled yet.",
    },
    admin: {
      title: "Super Administration",
      sub: "System-wide tracking of user registrations, premium metrics, and core stability metrics.",
      totalUsers: "Active User Base",
      totalRevenue: "Gross Revenue",
      totalConversions: "Interactions Handled",
      systemLogsTitle: "Real-time System Logs",
      userManagement: "User Control Suite",
      payments: "Ledger Accounts",
      announcements: "Dispatch Broadcasts",
      errorMonitor: "Hardware & App Error Logs",
      commonErrors: "Most Frequent Exceptions",
      clientEmail: "Client Email",
      role: "System Role",
      subTier: "Current Plan",
      actions: "Actions",
      auditLogs: "Core Audit Logs",
      timestamp: "Timestamp",
      errorType: "Error Class",
      message: "Exception Details",
    },
    common: {
      save: "Save Changes",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit Profile",
      close: "Dismiss",
      back: "Navigate Back",
      next: "Continue",
      confirm: "Acknowledge",
      success: "Task Executed Successfully",
      error: "Technical Issue Enrolled",
      loading: "Processing background metrics...",
      empty: "Records section is empty",
      offlineMode: "Disconnected Mode",
      offlineNotice: "Local session enabled. Synchronizing assets upon connection.",
      proRequired: "PRO Subscription Required",
      upgradeNow: "Unlock Pro Package",
      searchPlaceholder: "Query registry...",
      language: "Preferred Language",
      all: "All Fields",
      none: "None",
    },
    profile: {
      title: "User Profile",
      subtitle: "Manage your personal details and subscription tier",
    },
  },
};
