import { useState, useRef, useEffect } from "react";
import { extractRawText } from "mammoth";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signOut } from "firebase/auth";
import { Send, Bot, User, Scale, AlertCircle, Mic, MicOff, FileText, Download, TrendingUp, X, Plus, MessageSquare, Paperclip, ListChecks, Ghost, Briefcase, ChevronDown, CheckCircle, Lock, AlertTriangle, LogOut, Settings, LayoutDashboard, Crown, Volume2, VolumeX, Bell, History, Zap } from "lucide-react";
import html2pdf from "html2pdf.js";
import { chatWithLawyer, generateHTMLDocument, generateChatTitle } from "../services/aiService";
import { Language, RiskAnalysis, Case, PersonProfile, ChatSession, ChatMessage } from "../types";
import Markdown from "react-markdown";
import { DocumentEditor } from "../components/DocumentEditor";
import { ChatInput, ChatInputRef } from "../components/ChatInput";
import { uploadChatFile } from "../services/storageService";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { cleanFirestoreData } from "../lib/cleanData";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, setDoc, doc, serverTimestamp, onSnapshot, orderBy, limit } from "firebase/firestore";
import { archiveOldChats, archiveOldMessages } from "../services/dbArchiveService";
import { useNotification } from "../contexts/NotificationContext";
import { checkRequestQuota, incrementUserRequests, isFeatureAllowed } from "../services/subscriptionService";
import { usePaywall } from "../contexts/PaywallContext";
import { generateMeaningfulFilename } from "../utils/documentNaming";
import { performanceTracker } from "../utils/performanceTracker";
import { errorLogger } from "../services/errorLoggingService";
import { getFriendlyErrorMessage } from "../utils/errorFriendly";
import { useLanguage } from "../contexts/LanguageContext";

const LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  uz_lat: {
    new_chat: "Yangi Suhbat",
    private: "Maxfiy",
    private_tooltip: "Maxfiylik rejimi (Tarix saqlanmaydi)",
    business: "Biznes",
    business_tooltip: "Biznes rejim (Kompaniyalar uchun)",
    sound: "Ovozli",
    sound_active: "Ovozli bildirishnoma faol",
    sound_inactive: "Ovozli bildirishnoma o'chirilgan",
    notifications: "Ruxsat",
    notifications_active: "Bildirishnomalar faol",
    no_history: "Suhbatlar tarixi yo'q",
    welcome: "Assalomu alaykum! Men yuridik yordamchiman. Qanday hujjat tayyorlash kerakligini yozing yoki gapiring.",
    private_active_msg: "MAXFIYLIK REJIMI FAOL. Bu suhbat tarixi o'chib ketadi va serverda saqlanmaydi.",
    private_inactive_msg: "Suhbat tarixi qayta yozishni boshladi.",
    limits: "Kunlik Limitlar",
    ai_queries: "AI So'rovlar",
    unlimited: "Cheksiz",
    ai_assistant_title: "AI Yordamchi",
    hide_editor: "Muharrirni yashirish",
    show_editor: "Hujjat Muharriri",
    study_tab: "Tushuntirish (Muzokara)",
    doc_tab: "Hujjat Tahrirlash (Konstruktor)",
    placeholder: "Yuridik yordamchi bilan suhbatlashish...",
    send: "Yuborish",
    generating: "Hujjat tayyorlanmoqda...",
    save_to_cases: "Ishga saqlash",
    download_pdf: "PDF yuklash",
    download_docx: "DOCX yuklash",
    add_signature: "Raqamli imzo qo'shish",
    saving: "Saqlanmoqda...",
    save: "Saqlash",
    cancel: "Bekor qilish",
    win_prob: "Yutish foizi",
    risk_level: "Xavf darajasi",
    strengths: "Kuchli taraflar",
    weaknesses: "Zaif taraflar",
    risk_analysis: "Risk tahlili",
    strategy_plan: "Strategiya va reja",
    ai_expertise: "AI ekspertiza",
    full_analysis: "To'liq yuridik analiz",
    download_all: "Barchasini yuklash (PDF)",
    analysis_results: "Analiz Natijalari",
    toast_no_case: "Yuridik ish topilmadi, iltimos oldin ish yarating.",
    party_involved: "Nizodagi manfaatdor tomonlar",
    link_case: "Hujjatni yuridik ishga bog'lash",
    study_recommendations: "O'quv va Tahlil Rejimi bo'yicha tavsiyalar:",
    study_desc: "Bu rejimda siz qonunlar ma'nosini, yuridik konsepsiyalarni va keyslarni o'rganishingiz mumkin. Quyidagi mavzulardan birini tanlang yoki savolingizni yozing:",
    study_p1_btn: "Mehnat shartnomasini bekor qilish",
    study_p1_val: "Mehnat shartnomasini bekor qilish tartibini tushuntiring",
    study_p2_btn: "Bitim va Shartnoma farqi",
    study_p2_val: "Fuqarolik kodeksi bo'yicha bitim va shartnoma farqi nimada?",
    study_p3_btn: "Tadbirkorlikdagi xavflar",
    study_p3_val: "Tadbirkorlik faoliyatida duch keladigan asosiy huquqiy xavflar",
    study_p4_btn: "Apellyatsiya berish tartibi",
    study_p4_val: "Sud qaroridan norozi bo'lganda apellyatsiya berish muddati qancha?",
    doc_templates: "Hujjat Muharriri Rejimi andozalari:",
    doc_desc: "Bu rejimda siz professional shartnomalar, da'vo arizalari yoki shikoyatlar tuzishingiz mumkin. Quyidagi andozalardan boshlang:",
    doc_p1_btn: "Xonadon ijarasi shartnomasi",
    doc_p1_val: "Menga xonadon ijarasi uchun 1 yillik namunaviy shartnoma tayyorlab ber",
    doc_p2_btn: "Sudga da'vo ariza namunasi",
    doc_p2_val: "Qarz shartnomasi bo'yicha undiruv haqida sudga da'vo ariza yozib ber",
    doc_p3_btn: "Mehnat shartnomasi andozasi",
    doc_p3_val: "Mehnat shartnomasi (namunaviy shaklda xodim uchun)",
    doc_p4_btn: "Xizmat ko'rsatish shartnomasi",
    doc_p4_val: "Xizmat ko'rsatish shartnomasi loyihasini tayyorlash",
    unknown: "Yopiq",
    ai_assessed_risk: "AI tomonidan baholangan xavf darajasi:",
    risk_read_details: "Tafsilotlar uchun risk tahlilni o'qing.",
    not_detected: "Aniqlanmadi.",
    unlock_premium_analysis: "Premium tahlilni ochish →",
    unlock_premium_analysis_desc: "Hujjatlarning risk tahlilidan foydalanish uchun tarifingizni Pro Premiumga yangilang.",
    not_analyzed_yet: "Hali tahlil qilinmagan.",
    unlock_premium_strategy: "Premium strategiyani ochish →",
    unlock_premium_strategy_desc: "Strategiyalar va rejalarni topish bo'yicha ma'lumotlar olish uchun tarifingizni Pro Premiumga yangilang.",
    not_prepared_yet: "Hali tayyorlanmagan.",
    unlock_expertise: "Ekspertiza xulosalarini ochish →",
    unlock_expertise_desc: "Nizolarni baholash bo'yicha yuridik xulosalarni ochish uchun obunangizni Pro Premiumga yangilang.",
    not_studied_yet: "Hali o'rganilmagan.",
    unknown_literal: "Noma'lum",
    doc_settings_title: "Hujjat Sozlamalari",
    which_case: "Qaysi ishga tegishli? (Ixtiyoriy)",
    select_placeholder: "Tanlang...",
    involved_persons: "Qatnashuvchi shaxslar (Ixtiyoriy)",
    no_profiles_found: "Profillar topilmadi. Avval \"Profillar\" bo'limidan qo'shing.",
    creating_btn: "Yaratilmoqda...",
    confirm_create_btn: "Tasdiqlash va Yaratish",
  },
  uz_cyr: {
    new_chat: "Янги Суҳбат",
    private: "Махфий",
    private_tooltip: "Махфийлик режими (Тарих сақланмайди)",
    business: "Бизнес",
    business_tooltip: "Бизнес режим (Компаниялар учун)",
    sound: "Овозли",
    sound_active: "Овозли билдиришнома фаол",
    sound_inactive: "Овозли билдиришнома ўчирилган",
    notifications: "Рухсат",
    notifications_active: "Билдиришномалар фаол",
    no_history: "Суҳбатлар тарихи йўқ",
    welcome: "Ассалому алайкум! Мен юридик ёрдамчиман. Қандай ҳужжат тайёрлаш кераклигини ёзинг ёки гапиринг.",
    private_active_msg: "МАХФИЙЛИК РЕЖИМИ ФАОЛ. Бу суҳбат тарихи ўчиб кетади ва серверда сақланмайди.",
    private_inactive_msg: "Суҳбат тарихи қайта ёзишни бошлади.",
    limits: "Кунлик Лимитлар",
    ai_queries: "AI Сўровлар",
    unlimited: "Чексиз",
    ai_assistant_title: "AI Ёрдамчи",
    hide_editor: "Муҳаррирни яшириш",
    show_editor: "Ҳужжат Муҳаррири",
    study_tab: "Тушунтириш (Музокара)",
    doc_tab: "Ҳужжат Таҳрирлаш (Конструктор)",
    placeholder: "Юридик ёрдамчи билан суҳбатлашиш...",
    send: "Юбориш",
    generating: "Ҳужжат тайёрланмоқда...",
    save_to_cases: "Ишга сақлаш",
    download_pdf: "PDF юклаш",
    download_docx: "DOCX юклаш",
    add_signature: "Рақамли имзо қўшиш",
    saving: "Сақланмоқда...",
    save: "Сақлаш",
    cancel: "Бекор қилиш",
    win_prob: "Ютиш фоизи",
    risk_level: "Хавф даражаси",
    strengths: "Кучли тарафлар",
    weaknesses: "Заиф тарафлар",
    risk_analysis: "Риск таҳлили",
    strategy_plan: "Стратегия ва режа",
    ai_expertise: "AI экспертиза",
    full_analysis: "Тўлиқ юридик анализ",
    download_all: "Барчасини юклаш (PDF)",
    analysis_results: "Анализ Натижалари",
    toast_no_case: "Юридик иш топилмади, илтимос олдин иш яратинг.",
    party_involved: "Низодаги манфаатдор томонлар",
    link_case: "Ҳужжатни юридик ишга боғлаш",
    study_recommendations: "Ўқув ва Таҳлил Режими бўйича тавсиялар:",
    study_desc: "Бу режимда сиз қонунлар маъносини, юридик концепцияларни ва кейсларни ўрганишингиз мумкин. Қуйидаги мавзулардан бирини танланг ёки саволингизни ёзинг:",
    study_p1_btn: "Меҳнат шартномасини бекор қилиш",
    study_p1_val: "Меҳнат шартномасини бекор қилиш тартибини тушунтиринг",
    study_p2_btn: "Битим ва Шартнома фарқи",
    study_p2_val: "Фуқаролик кодекси бўйича битим ва шартнома фарқи нимада?",
    study_p3_btn: "Тадбиркорликдаги хавфлар",
    study_p3_val: "Тадбиркорлик фаолиятида дуч келадиган асосий ҳуқуқий хавфлар",
    study_p4_btn: "Апелляция бериш тартиби",
    study_p4_val: "Суд қароридан норози бўлганда апелляция бериш муддати қанча?",
    doc_templates: "Ҳужжат Муҳаррири Режими андозалари:",
    doc_desc: "Бу режимда сиз профессионал шартномалар, даъво аризалари ёки шикоятлар тузишингиз мумкин. Қуйидаги андозалардан бошланг:",
    doc_p1_btn: "Хонадон ижараси шартномаси",
    doc_p1_val: "Менга хонадон ижараси учун 1 йиллик намунавий шартнома тайёрлаб бер",
    doc_p2_btn: "Судга даъво ариза намунаси",
    doc_p2_val: "Қарз шартномаси бўйича ундирув ҳақида судга даъво ариза ёзиб бер",
    doc_p3_btn: "Меҳнат шартномаси андозаси",
    doc_p3_val: "Меҳнат шартномаси (намунавий шаклда ходим учун)",
    doc_p4_btn: "Хизмат кўрсатиш шартномаси",
    doc_p4_val: "Хизмат кўрсатиш шартномаси лойиҳасини тайёрлаш",
    unknown: "Ёпиқ",
    ai_assessed_risk: "AI томонидан баҳоланган хавф даражаси:",
    risk_read_details: "Тафсилотлар учун риск таҳлилни ўқинг.",
    not_detected: "Аниқланмади.",
    unlock_premium_analysis: "Премиум таҳлилни очиш →",
    unlock_premium_analysis_desc: "Ҳужжатларнинг риск таҳлилидан фойдаланиш учун тарифингизни Pro Premiumга янгиланг.",
    not_analyzed_yet: "Ҳали таҳлил қилинмаган.",
    unlock_premium_strategy: "Премиум стратегияни очиш →",
    unlock_premium_strategy_desc: "Стратегиялар ва режаларни топиш бўйича маълумотлар олиш учун тарифингизни Pro Premiumга янгиланг.",
    not_prepared_yet: "Ҳали тайёрланмаган.",
    unlock_expertise: "Экспертиза хулосаларини очиш →",
    unlock_expertise_desc: "Низоларни баҳолаш бўйича юридик хулосаларни очиш учун обунангизни Pro Premiumга янгиланг.",
    not_studied_yet: "Ҳали ўрганилмаган.",
    unknown_literal: "Номаълум",
    doc_settings_title: "Ҳужжат Созламалари",
    which_case: "Қайси ишга тегишли? (Ихтиёрий)",
    select_placeholder: "Танланг...",
    involved_persons: "Қатнашувчи шахслар (Ихтиёрий)",
    no_profiles_found: "Профиллар топилмади. Аввал «Профиллар» бўлимидан қўшинг.",
    creating_btn: "Яратилмоқда...",
    confirm_create_btn: "Тасдиқлаш ва Яратиш",
  },
  ru: {
    new_chat: "Новый Чат",
    private: "Приватный",
    private_tooltip: "Режим инкогнито (История не сохраняется)",
    business: "Бизнес",
    business_tooltip: "Бизнес-режим (Для компаний)",
    sound: "Звук",
    sound_active: "Звуковые уведомления включены",
    sound_inactive: "Звуковые уведомления выключены",
    notifications: "Допуск",
    notifications_active: "Уведомления включены",
    no_history: "История чатов пуста",
    welcome: "Здравствуйте! Я ваш юридический помощник. Напишите или расскажите, какой документ вам требуется составить.",
    private_active_msg: "РЕЖИМ ПРИВАТНОСТИ АКТИВЕН. История этого разговора не будет сохранена на сервере.",
    private_inactive_msg: "История чата начала перезаписываться.",
    limits: "Дневные лимиты",
    ai_queries: "AI Запросы",
    unlimited: "Безлимитно",
    ai_assistant_title: "AI Помощник",
    hide_editor: "Скрыть редактор",
    show_editor: "Редактор Документов",
    study_tab: "Обсуждение (Кейс)",
    doc_tab: "Редактор (Конструктор)",
    placeholder: "Задайте вопрос юридическому ассистенту...",
    send: "Отправить",
    generating: "Документ генерируется...",
    save_to_cases: "Сохранить в дело",
    download_pdf: "Скачать PDF",
    download_docx: "Скачать DOCX",
    add_signature: "Добавить ЭЦП",
    saving: "Сохранение...",
    save: "Сохранить",
    cancel: "Отмена",
    win_prob: "Шанс выигрыша",
    risk_level: "Уровень риска",
    strengths: "Сильные стороны",
    weaknesses: "Слабые стороны",
    risk_analysis: "Анализ рисков",
    strategy_plan: "Стратегия и План",
    ai_expertise: "AI Экспертиза",
    full_analysis: "Полный юрид. анализ",
    download_all: "Скачать всё (PDF)",
    analysis_results: "Результаты анализа",
    toast_no_case: "Юридическое дело не найдено. Пожалуйста, сначала создайте дело.",
    party_involved: "Заинтересованные стороны",
    link_case: "Связать документ с делом",
    study_recommendations: "Рекомендации по режиму Обучения и Анализа:",
    study_desc: "В этом режиме вы можете изучать смысл законов, юридические концепции и судебные дела. Выберите одну из тем ниже или введите свой вопрос:",
    study_p1_btn: "Расторжение трудового договора",
    study_p1_val: "Объясните порядок расторжения трудового договора",
    study_p2_btn: "Разница между сделкой и договором",
    study_p2_val: "В чем разница между сделкой и договором по Гражданскому кодексу?",
    study_p3_btn: "Риски в бизнесе",
    study_p3_val: "Основные юридические риски при ведении предпринимательской деятельности",
    study_p4_btn: "Порядок подачи апелляции",
    study_p4_val: "Каков срок подачи апелляции в случае несогласия с решением суда?",
    doc_templates: "Шаблоны режима Редактора Документов:",
    doc_desc: "В этом режиме вы можете составлять профессиональные договоры, исковые заявления или жалобы. Начните со следующих шаблонов:",
    doc_p1_btn: "Договор аренды квартиры",
    doc_p1_val: "Подготовь мне типовой договор аренды квартиры сроком на 1 год",
    doc_p2_btn: "Образец искового заявления в суд",
    doc_p2_val: "Напиши исковое заявление в суд о взыскании по договору займа",
    doc_p3_btn: "Шаблон трудового договора",
    doc_p3_val: "Трудовой договор (типовая форма для сотрудника)",
    doc_p4_btn: "Договор оказания услуг",
    doc_p4_val: "Подготовка проекта договора оказания возмездных услуг",
    unknown: "Закрыто",
    ai_assessed_risk: "Оцененный искусственным интеллектом уровень риска:",
    risk_read_details: "Для детальной информации прочтите анализ рисков.",
    not_detected: "Не обнаружено.",
    unlock_premium_analysis: "Открыть Премиум-анализ →",
    unlock_premium_analysis_desc: "Для доступа к анализу рисков документов обновите свой тариф до Pro Premium.",
    not_analyzed_yet: "Еще не анализировано.",
    unlock_premium_strategy: "Открыть Премиум-страгетию →",
    unlock_premium_strategy_desc: "Для получения рекомендаций по стратегиям и планам обновите свой тариф до Pro Premium.",
    not_prepared_yet: "Еще не подготовлено.",
    unlock_expertise: "Открыть экспертные заключения →",
    unlock_expertise_desc: "Для доступа к юридическим заключениям по оценке споров обновите свою подписку до Pro Premium.",
    not_studied_yet: "Еще не изучено.",
    unknown_literal: "Неизвестно",
    doc_settings_title: "Настройки документа",
    which_case: "К какому делу относится? (Необязательно)",
    select_placeholder: "Выберите...",
    involved_persons: "Участвующие лица (Необязательно)",
    no_profiles_found: "Профили не найдены. Сначала добавьте их в разделе «Профили».",
    creating_btn: "Создается...",
    confirm_create_btn: "Подтвердить и Создать",
  },
  en: {
    new_chat: "New Chat",
    private: "Private",
    private_tooltip: "Incognito mode (History is not saved)",
    business: "Business",
    business_tooltip: "Business mode (For companies)",
    sound: "Sound",
    sound_active: "Sound notification active",
    sound_inactive: "Sound notification disabled",
    notifications: "Access",
    notifications_active: "Notifications active",
    no_history: "No conversations history",
    welcome: "Hello! I am your legal assistant. Tell or write what kind of document you need to prepare.",
    private_active_msg: "PRIVACY MODE ACTIVE. This chat history will be automatically deleted and not saved on the server.",
    private_inactive_msg: "Chat history has started recording.",
    limits: "Daily Limits",
    ai_queries: "AI Queries",
    unlimited: "Unlimited",
    ai_assistant_title: "AI Assistant",
    hide_editor: "Hide Editor",
    show_editor: "Document Editor",
    study_tab: "Discussion (Exploratory)",
    doc_tab: "Edit Document (Builder)",
    placeholder: "Ask something to your legal assistant...",
    send: "Send",
    generating: "Preparing document...",
    save_to_cases: "Save to Cases",
    download_pdf: "Download PDF",
    download_docx: "Download DOCX",
    add_signature: "Add Digital Signature",
    saving: "Saving...",
    save: "Save",
    cancel: "Cancel",
    win_prob: "Win rate",
    risk_level: "Risk level",
    strengths: "Strengths",
    weaknesses: "Weaknesses",
    risk_analysis: "Risk analysis",
    strategy_plan: "Strategy & plan",
    ai_expertise: "AI expertise",
    full_analysis: "Full legal analysis",
    download_all: "Download all (PDF)",
    analysis_results: "Analysis Results",
    toast_no_case: "No matching legal case found. Please create a case first.",
    party_involved: "Involved Parties",
    link_case: "Link document to judicial case",
    study_recommendations: "Study & Analysis Mode Recommendations:",
    study_desc: "In this mode, you can study legal codes, principles, and judicial cases. Select one of the topics below or type your query:",
    study_p1_btn: "Termination of Labor Contract",
    study_p1_val: "Explain the procedure of termination of a labor contract",
    study_p2_btn: "Deed vs Contract",
    study_p2_val: "What is the difference between a deed and contract under CC?",
    study_p3_btn: "Business Legal Risks",
    study_p3_val: "Primary legal risks encountered when running a business",
    study_p4_btn: "Appeals Procedure",
    study_p4_val: "What is the timeline of filing an appeal in case of court decision disagreement?",
    doc_templates: "Document Builder Mode Templates:",
    doc_desc: "In this mode, you can write professional contracts, statements of claim, or petitions. Start with the templates below:",
    doc_p1_btn: "Apartment Rent Agreement",
    doc_p1_val: "Prepare a template for apartment lease contract for a duration of 1 year",
    doc_p2_btn: "Statement of Claim Template",
    doc_p2_val: "Draft a statement of claim to court regarding debt recovery on loan contract",
    doc_p3_btn: "Employment Contract Template",
    doc_p3_val: "Labor agreement (standard template for employee)",
    doc_p4_btn: "Services Service Agreement",
    doc_p4_val: "Draft a service provision agreement contract",
    unknown: "Hidden",
    ai_assessed_risk: "AI assessed risk level:",
    risk_read_details: "Read the risk analysis for details.",
    not_detected: "Not detected.",
    unlock_premium_analysis: "Unlock Premium Analysis →",
    unlock_premium_analysis_desc: "To gain utility of risk analysis for documents, upgrade your tier to Pro Premium.",
    not_analyzed_yet: "Not analyzed yet.",
    unlock_premium_strategy: "Unlock Premium Strategy →",
    unlock_premium_strategy_desc: "To find actionable strategies and plans, upgrade your plan to Pro Premium.",
    not_prepared_yet: "Not prepared yet.",
    unlock_expertise: "Unlock AI Expertise →",
    unlock_expertise_desc: "To access detailed legal reports assessing disputes, upgrade your tier to Pro Premium.",
    not_studied_yet: "Not studied yet.",
    unknown_literal: "Unknown",
    doc_settings_title: "Document Settings",
    which_case: "Which case does this belong to? (Optional)",
    select_placeholder: "Select...",
    involved_persons: "Involved parties (Optional)",
    no_profiles_found: "No profiles found. Add them in the \"Profiles\" section first.",
    creating_btn: "Creating...",
    confirm_create_btn: "Confirm & Create",
  }
};

// Cache data outside component to persist across unmount/remount
let cachedCases: Case[] | null = null;
let cachedProfiles: PersonProfile[] | null = null;

export function Consultation({ user }: { user: any }) {
  const { t, language: globalLang, setLanguage: setGlobalLang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryChatId = searchParams.get("chatId");
  const { triggerNotification } = useNotification();
  const { openPaywall } = usePaywall();

  // Track consecutive-render counts for performance audits
  useEffect(() => {
    performanceTracker.trackRender("Consultation");
  });

  // Track Chat Initialization timer
  const hasCompletedInit = useRef(false);
  useEffect(() => {
    performanceTracker.startChatInit();
  }, []);

  const [language, setLanguage] = useState<Language | "en">(() => {
    const saved = localStorage.getItem("preferredLanguage");
    return (saved as Language | "en") || "uz_lat";
  });

  const currentLang = language === "en" ? "en" : (language || "uz_lat");
  const lt = LOCAL_TRANSLATIONS[currentLang] || LOCAL_TRANSLATIONS.uz_lat;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Assalomu alaykum! Men yuridik yordamchiman. Qanday hujjat tayyorlash kerakligini yozing yoki gapiring.",
      createdAt: Date.now()
    }
  ]);

  useEffect(() => {
    if (globalLang) {
      setLanguage(globalLang as any);
    }
  }, [globalLang]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length > 0 && prev[0].id === "1") {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          content: lt.welcome
        };
        return updated;
      }
      return prev;
    });
  }, [language, lt.welcome]);

  const chatInputRef = useRef<ChatInputRef>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isFetchingModalData, setIsFetchingModalData] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string>("");
  const [analysis, setAnalysis] = useState({
    winningProbability: 0,
    riskLevel: "",
    strengths: [] as string[],
    weaknesses: [] as string[],
    risk: "",
    strategy: "",
    expertise: ""
  });
  const [activePanel, setActivePanel] = useState<"none" | "winning" | "riskLevel" | "strengths" | "weaknesses" | "risk" | "strategy" | "expertise">("none");
  
  const [cases, setCases] = useState<Case[]>([]);
  const [profiles, setProfiles] = useState<PersonProfile[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("ai_notification_sound") !== "false";
  });
  const [notificationGranted, setNotificationGranted] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  });

  const toggleSoundAlert = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem("ai_notification_sound", String(newValue));
    if (newValue) {
      import("../services/notificationService").then(m => m.playNotificationSound());
    }
  };

  const handleRequestNotification = async () => {
    const perm = await import("../services/notificationService").then(m => m.requestNotificationPermission());
    setNotificationGranted(perm === "granted");
  };
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    if (queryChatId) {
      localStorage.setItem("activeChatId", queryChatId);
      return queryChatId;
    }
    return localStorage.getItem("activeChatId");
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const downloadAll = async () => {
    try {
      const container = document.createElement("div");
      
      let htmlString = `<div style="font-family: sans-serif; padding: 20px;">`;
      htmlString += `<h1 style="text-align: center; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">To'liq Yuridik Analiz</h1>`;
      
      if (analysis.winningProbability !== undefined && analysis.winningProbability > 0) {
        htmlString += `
          <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px;">
            <h2 style="color: #166534; font-size: 18px; margin-bottom: 5px;">Yutish Foizi</h2>
            <p style="font-size: 24px; font-weight: bold; color: #15803d; margin: 0;">${analysis.winningProbability}%</p>
          </div>
        `;
      }

      if (analysis.riskLevel) {
        const bg = analysis.riskLevel.toLowerCase() === 'high' ? '#fef2f2' : analysis.riskLevel.toLowerCase() === 'medium' ? '#fffbeb' : '#f0fdf4';
        const color = analysis.riskLevel.toLowerCase() === 'high' ? '#b91c1c' : analysis.riskLevel.toLowerCase() === 'medium' ? '#b45309' : '#15803d';
        htmlString += `
          <div style="margin-top: 10px; padding: 15px; background: ${bg}; border-radius: 8px;">
            <h2 style="color: ${color}; font-size: 18px; margin-bottom: 5px;">Xavf Darajasi</h2>
            <p style="font-size: 18px; font-weight: 500; margin: 0;">${analysis.riskLevel}</p>
          </div>
        `;
      }

      const markedParse = (window as any).marked?.parse || ((t: string) => t);
      
      if (analysis.strengths && analysis.strengths.length > 0) {
        htmlString += `
          <div style="margin-top: 20px;">
            <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Kuchli Taraflar</h2>
            <ul style="color: #374151; line-height: 1.6;">
              ${analysis.strengths.map(s => `<li>${s.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      if (analysis.weaknesses && analysis.weaknesses.length > 0) {
        htmlString += `
          <div style="margin-top: 20px;">
            <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Zaif Taraflar</h2>
            <ul style="color: #374151; line-height: 1.6;">
              ${analysis.weaknesses.map(s => `<li>${s.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      if (analysis.risk) {
        htmlString += `
          <div style="margin-top: 20px;">
            <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Risk Tahlili</h2>
            <div style="color: #374151; line-height: 1.6;">${markedParse(analysis.risk)}</div>
          </div>
        `;
      }

      if (analysis.strategy) {
        htmlString += `
          <div style="margin-top: 20px;">
            <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Strategiya va Reja</h2>
            <div style="color: #374151; line-height: 1.6;">${markedParse(analysis.strategy)}</div>
          </div>
        `;
      }
      
      if (analysis.expertise) {
        htmlString += `
          <div style="margin-top: 20px;">
            <h2 style="color: #1f2937; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">AI Ekspertiza</h2>
            <div style="color: #374151; line-height: 1.6;">${markedParse(analysis.expertise)}</div>
          </div>
        `;
      }

      if (documentContent) {
        htmlString += `
          <div style="margin-top: 40px; page-break-before: always;">
            <h1 style="text-align: center; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Asosiy Hujjat</h1>
            <div style="font-family: serif; font-size: 14pt; line-height: 1.5; padding: 20px; border: 1px solid #ccc; border-radius: 4px; color: #000;">
              ${documentContent}
            </div>
          </div>
        `;
      }
      
      htmlString += `</div>`;
      container.innerHTML = htmlString;
      
      const pdfFilename = generateMeaningfulFilename({
        content: documentContent || "",
        title: chatSessions.find(s => s.id === currentChatId)?.title || "",
        userRequest: messages.find(m => m.role === "user")?.content || "",
        type: "analysis",
        extension: "pdf"
      });

      const options = {
        margin: 10,
        filename: pdfFilename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      html2pdf().set(options).from(container).save();
      
    } catch (error) {
      console.error("PDF yaratishda xato:", error);
      alert("PDF yaratishda xatolik yuz berdi");
    }
  };

  const downloadSingleReport = async (reportType: "risk" | "strategy" | "expertise") => {
    try {
      const container = document.createElement("div");
      let title = "";
      let content = "";
      
      if (reportType === "risk") {
        title = "Risk Tahlili";
        content = analysis.risk || "";
      } else if (reportType === "strategy") {
        title = "Strategiya va Reja";
        content = analysis.strategy || "";
      } else if (reportType === "expertise") {
        title = "AI Ekspertiza";
        content = analysis.expertise || "";
      }
      
      if (!content) {
        alert("Yuklab olish uchun ma'lumot mavjud emas.");
        return;
      }
      
      const markedParse = (window as any).marked?.parse || ((t: string) => t);
      const htmlContent = markedParse(content);
      
      const containerHtml = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="text-align: center; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">${title}</h1>
          <div style="color: #374151; line-height: 1.6; margin-top: 20px;">
            ${htmlContent}
          </div>
        </div>
      `;
      
      container.innerHTML = containerHtml;
      
      const pdfFilename = generateMeaningfulFilename({
        content: content,
        title: chatSessions.find(s => s.id === currentChatId)?.title || "",
        userRequest: messages.find(m => m.role === "user")?.content || "",
        type: reportType,
        extension: "pdf"
      });
      
      const options = {
        margin: 10,
        filename: pdfFilename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      html2pdf().set(options).from(container).save();
    } catch (error) {
      console.error(`Error exporting ${reportType} PDF:`, error);
      alert("Hujjat yuklab olishda xatolik yuz berdi.");
    }
  };

  const [userTier, setUserTier] = useState<"free" | "pro" | "business">("free");
  const [requestsCountToday, setRequestsCountToday] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(user?.aiCreditsRemaining ?? 10);
  const [creditsDailyLimit, setCreditsDailyLimit] = useState<number>(user?.aiCreditsDailyLimit ?? 10);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        setUserTier("business"); // Unlock all features for admin
      } else {
        setUserTier(user.subscriptionTier || "free");
      }
      setRequestsCountToday(user.requestsToday || 0);
      if (typeof user.aiCreditsRemaining === "number") setCreditsRemaining(user.aiCreditsRemaining);
      if (typeof user.aiCreditsDailyLimit === "number") setCreditsDailyLimit(user.aiCreditsDailyLimit);
    }
  }, [user]);

  useEffect(() => {
    const handleCreditsUpdate = (e: any) => {
      if (e.detail) {
        if (typeof e.detail.creditsRemaining === "number") setCreditsRemaining(e.detail.creditsRemaining);
        if (typeof e.detail.creditsDailyLimit === "number") setCreditsDailyLimit(e.detail.creditsDailyLimit);
      }
    };
    window.addEventListener("ai-credits-updated", handleCreditsUpdate);
    return () => window.removeEventListener("ai-credits-updated", handleCreditsUpdate);
  }, []);

  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [aiMode, setAiMode] = useState<"study" | "document">("study");
  const [editorOpen, setEditorOpen] = useState(true);

  // Separate states for study and document modes to prevent state sharing
  const [studyModeState, setStudyModeState] = useState<{
    editorOpen: boolean;
    activeDocument: string | null;
  }>({
    editorOpen: false,
    activeDocument: null,
  });

  const [documentModeState, setDocumentModeState] = useState<{
    editorOpen: boolean;
    activeDocument: string | null;
  }>({
    editorOpen: true,
    activeDocument: null,
  });

  // Track document backups between mode entry and exits
  const [lastSavedDocument, setLastSavedDocument] = useState<string | null>(null);

  // Automatically update states when documentContent changes in Document Mode
  useEffect(() => {
    if (aiMode === "document" && documentContent) {
      setLastSavedDocument(documentContent);
      setDocumentModeState(prev => ({
        ...prev,
        activeDocument: documentContent,
      }));
    }
  }, [documentContent, aiMode]);

  // Clean mode switcher with design-driven transitions
  const handleModeSwitch = (newMode: "study" | "document") => {
    if (newMode === aiMode) return;

    if (newMode === "study") {
      // 1. Entering Study Mode:
      // Store current document backup
      if (documentContent) {
        setLastSavedDocument(documentContent);
        setDocumentModeState(prev => ({
          ...prev,
          activeDocument: documentContent,
        }));
      }

      setStudyModeState({
        editorOpen: false,
        activeDocument: null,
      });

      setAiMode("study");
      setEditorOpen(false);
      setDocumentContent(""); // Clear active document state for a clean chat view
    } else {
      // 2. Entering Document Mode:
      // Restore previous document draft/backup if any
      const docToRestore = documentModeState.activeDocument || lastSavedDocument || "";
      
      setDocumentModeState(prev => ({
        ...prev,
        editorOpen: true,
        activeDocument: docToRestore || null,
      }));

      setAiMode("document");
      setEditorOpen(true);
      setDocumentContent(docToRestore);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        // Check for pre-filled consultation prompt from legal kutubxona
        const prefill = localStorage.getItem("prefill_consultation_prompt");
        if (prefill) {
          localStorage.removeItem("prefill_consultation_prompt");
          setTimeout(() => {
            chatInputRef.current?.setInputValue(prefill);
            chatInputRef.current?.focus();
          }, 400);
        }
      } catch (error) {
        console.error("Error checking prefilled prompt:", error);
      }
    };
    fetchData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    let isFirstLoad = true;
    
    const chatsQuery = query(
      collection(db, "chats"), 
      where("userId", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc"),
      limit(50)
    );
    
    performanceTracker.trackListenerActive("Consultation_chatsQuery");
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      performanceTracker.trackFirestoreRead("chats (chatsQuery onSnapshot)", snapshot.docs.length || 1);
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      setChatSessions(sessions);
      
      const targetChatId = queryChatId || localStorage.getItem("activeChatId");
      if (!targetChatId && !hasCompletedInit.current) {
        performanceTracker.endChatInit();
        hasCompletedInit.current = true;
      }
      
      if (targetChatId) {
        const activeSession = sessions.find(s => s.id === targetChatId);
        if (activeSession) {
          setCurrentChatId(targetChatId);
          setLanguage(activeSession.language);
          if (activeSession.messages && activeSession.messages.length > 0) {
             setMessages(activeSession.messages);
          }
          if (queryChatId) {
            localStorage.setItem("activeChatId", queryChatId);
            setSearchParams({}, { replace: true });
          }
        } else if (sessions.length > 0) {
          const mostRecent = sessions[0];
          localStorage.setItem("activeChatId", mostRecent.id);
          setCurrentChatId(mostRecent.id);
          setLanguage(mostRecent.language);
          if (mostRecent.messages && mostRecent.messages.length > 0) {
             setMessages(mostRecent.messages);
          }
        } else {
          localStorage.removeItem("activeChatId");
          setCurrentChatId(null);
        }
      } else if (isFirstLoad && sessions.length > 0) {
        const mostRecent = sessions[0];
        localStorage.setItem("activeChatId", mostRecent.id);
        setCurrentChatId(mostRecent.id);
        setLanguage(mostRecent.language);
        if (mostRecent.messages && mostRecent.messages.length > 0) {
           setMessages(mostRecent.messages);
        }
      }
      isFirstLoad = false;
    }, (error: any) => {
      if (error?.code === "permission-denied" || error?.message?.includes("insufficient permissions")) {
        console.warn("Chats query notice: Permissions syncing or unauthenticated in Firestore.", error?.message || error);
      } else {
        console.error("Error fetching chats:", error);
      }
    });

    return () => {
      unsubscribe();
      performanceTracker.trackListenerInactive("Consultation_chatsQuery");
    };
  }, []);

  // Fetch messages subcollection optimally matching scalable chat patterns
  useEffect(() => {
    if (!currentChatId || isPrivateMode || !auth.currentUser) return;
    
    const messagesQuery = query(
      collection(db, "chats", currentChatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
    
    performanceTracker.trackListenerActive(`Consultation_messagesQuery_${currentChatId}`);
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      performanceTracker.trackFirestoreRead(`chats/${currentChatId}/messages (messagesQuery onSnapshot)`, snapshot.docs.length || 1);
      
      const subMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toMillis === 'function') {
          createdAt = createdAt.toMillis();
        } else if (!createdAt) {
          createdAt = Date.now();
        }
        return { id: doc.id, ...data, createdAt } as ChatMessage;
      });
      if (subMessages.length > 0) {
        setMessages(prev => {
          const map = new Map();
          prev.forEach(m => map.set(m.id, m));
          subMessages.forEach(m => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
        });
      }
      if (!hasCompletedInit.current) {
        performanceTracker.endChatInit();
        hasCompletedInit.current = true;
      }
    }, (error) => {
      console.warn("Messages stream subscription warn:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, `chats/${currentChatId}/messages`);
      } catch (e) {
        console.warn("[Consultation] Logged firestore subscription error:", e);
      }
    });

    return () => {
      unsubscribeMessages();
      performanceTracker.trackListenerInactive(`Consultation_messagesQuery_${currentChatId}`);
    };
  }, [currentChatId, isPrivateMode]);

  const handleLanguageChange = (newLang: Language | "en") => {
    setLanguage(newLang);
    localStorage.setItem("preferredLanguage", newLang);
    if (newLang !== "en") {
      setGlobalLang(newLang as any);
    }
  };

  const togglePrivateMode = () => {
    const newMode = !isPrivateMode;
    setIsPrivateMode(newMode);
    
    // HARD WIPE ENFORCEMENT: Destroy context when shifting security boundaries
    setCurrentChatId(null);
    localStorage.removeItem("activeChatId");
    setMessages([
      {
        id: (Date.now() + Math.random()).toString(),
        role: "assistant",
        content: newMode ? lt.private_active_msg : lt.private_inactive_msg,
        createdAt: Date.now()
      }
    ]);
    setDocumentContent("");
    setAnalysis({ winningProbability: 0, riskLevel: "", strengths: [], weaknesses: [], risk: "", strategy: "", expertise: "" });
    chatInputRef.current?.clear();
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    localStorage.removeItem("activeChatId");
    setMessages([
      {
        id: (Date.now() + Math.random()).toString(),
        role: "assistant",
        content: lt.welcome,
        createdAt: Date.now()
      }
    ]);
    setDocumentContent("");
    setAiMode("study");
    setAnalysis({ winningProbability: 0, riskLevel: "", strengths: [], weaknesses: [], risk: "", strategy: "", expertise: "" });
  };

  const handleDocumentChange = async (newContent: string) => {
    setDocumentContent(newContent);
    if (currentChatId && !isPrivateMode) {
      try {
        await updateDoc(doc(db, "chats", currentChatId), {
          document: newContent,
          updatedAt: serverTimestamp()
        });
      } catch (error: any) {
        console.error("Faylni saqlashda xatolik:", error);
        alert(`Signature save failed during 'save' step. Error details: ${error.message || error}`);
        throw error;
      }
    }
  };

  const openChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id);
    localStorage.setItem("activeChatId", chat.id);
    if (chat.messages && chat.messages.length > 0) setMessages(chat.messages);
    setLanguage(chat.language);
    localStorage.setItem("preferredLanguage", chat.language);
    
    // Load saved document and metadata from the chat session
    const chatDoc = chat.document || "";
    const chatMode = (chat as any).aiMode || "study";

    if (chatMode === "study") {
      setAiMode("study");
      setEditorOpen(false);
      setDocumentContent("");
      setStudyModeState({
        editorOpen: false,
        activeDocument: null,
      });
      setDocumentModeState({
        editorOpen: true,
        activeDocument: chatDoc || null,
      });
      if (chatDoc) setLastSavedDocument(chatDoc);
    } else {
      setAiMode("document");
      setEditorOpen(true);
      setDocumentContent(chatDoc);
      setStudyModeState({
        editorOpen: false,
        activeDocument: null,
      });
      setDocumentModeState({
        editorOpen: true,
        activeDocument: chatDoc || null,
      });
      if (chatDoc) setLastSavedDocument(chatDoc);
    }
    setAnalysis({
      winningProbability: chat.winningProbability || 0,
      riskLevel: chat.riskLevel || "",
      strengths: chat.strengths || [],
      weaknesses: chat.weaknesses || [],
      risk: chat.risk || "",
      strategy: chat.strategy || "",
      expertise: chat.expertise || ""
    });
    
  };

  const handleSubmit = async (text: string, files: Array<{ name: string; type: string; data: string }>) => {
    if ((!text.trim() && files.length === 0) || isLoading) return;

    if (auth.currentUser) {
      const quota = await checkRequestQuota(auth.currentUser.uid);
      if (!quota.allowed) {
        openPaywall("requests");
        return;
      }
    }

    const userMessage: any = {
      id: (Date.now() + Math.random()).toString(),
      role: "user",
      content: text.trim(),
      createdAt: Date.now()
    };
    
    // UI state message gets base64 to display immediately
    if (files.length > 0) {
      userMessage.files = files.map(f => ({ ...f, data: f.data }));
    }

    const newMessages = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
    
    const filesToSend = [...files];
    setIsLoading(true);
    setRetryMessage("");

    let activeChatId = currentChatId;

    try {
      // Create DB-safe version of the chat history
      const dbSafeMessages = [...messages];
      const dbSafeUserMessage = { ...userMessage };
      
      const shouldSaveToDb = !isPrivateMode && auth.currentUser;
      
      // 1. Immediate save of user message
      if (shouldSaveToDb) {
        
        // If it's the very first message, we must create the parent chat doc before saving files or messages
        if (!activeChatId) {
          const tempTitle = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : "");
          const newChatRef = await addDoc(collection(db, "chats"), cleanFirestoreData({
            userId: auth.currentUser!.uid,
            title: tempTitle,
            language,
            isPrivate: false,
            isBusinessMode,
            aiMode, // Persist selection
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }));
          activeChatId = newChatRef.id;
          setCurrentChatId(newChatRef.id);
          localStorage.setItem("activeChatId", newChatRef.id);
          
          // Asynchronously check and archive old chats for the user if limit (50) is exceeded
          archiveOldChats(auth.currentUser!.uid).catch((err) => {
            console.error("Non-blocking error archiving old chats:", err);
          });
        }

        if (filesToSend.length > 0) {
           try {
             // activeChatId is guaranteed to exist now
             const uploadedFiles = await Promise.all(filesToSend.map(async (file) => {
               const { fileUrl, storagePath } = await uploadChatFile(auth.currentUser!.uid, activeChatId || "temp", file.name, file.data);
               return { name: file.name, type: file.type, fileUrl, storagePath };
             }));
             dbSafeUserMessage.files = uploadedFiles;
           } catch (uploadError: any) {
             if (uploadError.message !== "Storage_Not_Configured") {
               console.error("Chat file upload error: ", uploadError);
             }
             dbSafeUserMessage.content = "[Fayl ilova qilingan, lekin xotiraga saqlanmadi.]\n" + dbSafeUserMessage.content;
           }
        }

        dbSafeMessages.push(dbSafeUserMessage);

        if (activeChatId) {
          await setDoc(doc(db, "chats", activeChatId, "messages", dbSafeUserMessage.id), cleanFirestoreData({
             ...dbSafeUserMessage,
             createdAt: serverTimestamp()
          }));
          await updateDoc(doc(db, "chats", activeChatId), {
            updatedAt: serverTimestamp(),
            aiMode // Stay in sync
          });
        }

        // Generate title asynchronously if it's a new chat (non-blocking)
        if (!currentChatId) {
          performanceTracker.trackApiCall("generateChatTitle");
          generateChatTitle(userMessage.content, language).then(title => {
            if (activeChatId) {
              updateDoc(doc(db, "chats", activeChatId), { title });
            }
          }).catch(console.error);
        }
      }

      // 2. Fetch AI response
      const history = messages.length > 1 ? messages.map(m => ({ role: m.role, content: m.content })) : [];
      performanceTracker.trackApiCall("chatWithLawyer");
      const response: any = await chatWithLawyer(userMessage.content, language, history, filesToSend, undefined, undefined, isBusinessMode, aiMode, setRetryMessage);
      
      if (auth.currentUser) {
        await incrementUserRequests(auth.currentUser.uid);
        setRequestsCountToday(prev => prev + 1);
      }

      const isDocument = response?.type === "document";
      const chatContent = isDocument 
        ? "Hujjat yaratildi (o'ng tomondagi panelga qarang)." 
        : (response?.content || "Kechirasiz, xatolik yuz berdi.");
        
      if (isDocument && response?.content) {
        setDocumentContent(response.content);
        setEditorOpen(true);
        setAiMode("document");
      }
      
      setAnalysis(prev => ({
        winningProbability: response?.analysis?.winningProbability ?? prev.winningProbability,
        riskLevel: response?.analysis?.riskLevel || prev.riskLevel,
        strengths: response?.analysis?.strengths || prev.strengths,
        weaknesses: response?.analysis?.weaknesses || prev.weaknesses,
        risk: response?.analysis?.risk || prev.risk,
        strategy: response?.analysis?.strategy || prev.strategy,
        expertise: response?.analysis?.expertise || prev.expertise
      }));
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + Math.random()).toString(),
        role: "assistant",
        content: chatContent,
        createdAt: Date.now() + 1
      };
      
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(prev => [...prev, assistantMessage]);

      // Cross-tab notification trigger (Non-blocking)
      try {
        if (isDocument) {
          triggerNotification("document", language, { chatId: activeChatId || undefined });
        } else if (response?.analysis && (response.analysis.winningProbability != null || response.analysis.riskLevel)) {
          triggerNotification("analysis", language, { chatId: activeChatId || undefined, analysisId: activeChatId || undefined });
        } else {
          triggerNotification("chat", language, { chatId: activeChatId || undefined });
        }
      } catch (notifyErr) {
        console.error("Non-blocking notification error:", notifyErr);
      }

      if (shouldSaveToDb && activeChatId) {
        dbSafeMessages.push(assistantMessage);
        await setDoc(doc(db, "chats", activeChatId, "messages", assistantMessage.id), cleanFirestoreData({
          ...assistantMessage,
          createdAt: serverTimestamp()
        }));
        const updateData: any = {
          updatedAt: serverTimestamp(),
          aiMode // Stay in sync
        };
        if (isDocument && response?.content) updateData.document = response.content;
        if (response?.analysis?.winningProbability != null) updateData.winningProbability = response.analysis.winningProbability;
        if (response?.analysis?.riskLevel) updateData.riskLevel = response.analysis.riskLevel;
        if (response?.analysis?.strengths) updateData.strengths = response.analysis.strengths;
        if (response?.analysis?.weaknesses) updateData.weaknesses = response.analysis.weaknesses;
        if (response?.analysis?.risk) updateData.risk = response.analysis.risk;
        if (response?.analysis?.strategy) updateData.strategy = response.analysis.strategy;
        if (response?.analysis?.expertise) updateData.expertise = response.analysis.expertise;
        
        await updateDoc(doc(db, "chats", activeChatId), updateData);

        // Asynchronously check and archive old messages in this chat if limit (100) is exceeded
        archiveOldMessages(activeChatId, auth.currentUser!.uid).catch((err) => {
          console.error("Non-blocking error archiving old messages:", err);
        });
      }

    } catch (error: any) {
      errorLogger.log("chat_with_lawyer_submit", "GeminiAPIError", error, `Chat prompt submission failed: ${error.message || error}`);
      
      const friendlyMessage = getFriendlyErrorMessage(error, language);
      const errorMessage: ChatMessage = {
        id: (Date.now() + Math.random()).toString(),
        role: "assistant",
        content: `**Xatolik:** ${friendlyMessage}`,
        createdAt: Date.now() + 1
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Keep user's entered message in input box so they don't lose it!
      if (text) {
        chatInputRef.current?.setInputValue(text);
      }
      
      if (!isPrivateMode && auth.currentUser && activeChatId) {
        await setDoc(doc(db, "chats", activeChatId, "messages", errorMessage.id), cleanFirestoreData({
          ...errorMessage,
          createdAt: serverTimestamp()
        }));
        
        // Asynchronously check and archive old messages to ensure max 100 limit is respected
        archiveOldMessages(activeChatId, auth.currentUser.uid).catch((err) => {
          console.error("Non-blocking error archiving old messages:", err);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openDocModal = async () => {
    if (messages.length < 2) {
      alert("Iltimos, avval qanday hujjat kerakligini yozing.");
      return;
    }
    setIsDocModalOpen(true);

    if (!cachedCases || !cachedProfiles) {
      setIsFetchingModalData(true);
      if (!auth.currentUser) return;
      try {
        console.log("[Lazy Loading] Fetching active cases...");
        const casesQuery = query(collection(db, "cases"), where("userId", "==", auth.currentUser.uid), where("status", "==", "active"));
        performanceTracker.trackFirestoreRead("cases (lazy load docs)");
        const casesSnapshot = await getDocs(casesQuery);
        const mappedCases = casesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
        cachedCases = mappedCases;
        setCases(mappedCases);

        console.log("[Lazy Loading] Fetching person profiles...");
        const profilesQuery = query(collection(db, "profiles"), where("userId", "==", auth.currentUser.uid));
        performanceTracker.trackFirestoreRead("profiles (lazy load docs)");
        const profilesSnapshot = await getDocs(profilesQuery);
        const mappedProfiles = profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonProfile));
        cachedProfiles = mappedProfiles;
        setProfiles(mappedProfiles);
      } catch (err) {
        console.error("Error lazy-loading modal data:", err);
      } finally {
        setIsFetchingModalData(false);
      }
    } else {
      setCases(cachedCases);
      setProfiles(cachedProfiles);
    }
  };

  const handleGenerateDocument = async () => {
    setIsDocModalOpen(false);
    setIsGeneratingDoc(true);
    setRetryMessage("");
    try {
      const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n');
      
      const selectedCase = cases.find(c => c.id === selectedCaseId);
      const selectedProfilesData = profiles.filter(p => selectedProfileIds.includes(p.id));
      
      let contextAddition = "";
      if (selectedCase) {
        contextAddition += `\nCase Context: Title: ${selectedCase.title}, Category: ${selectedCase.category}`;
      }
      if (selectedProfilesData.length > 0) {
        contextAddition += `\nParties involved:\n` + selectedProfilesData.map(p => `- Full Name: ${p.fullName}, Passport: ${p.passport || 'N/A'}, Address: ${p.address || 'N/A'}, Phone: ${p.phone || 'N/A'}`).join('\n');
      }
      
      const promptWithContext = `Based on the following conversation history, generate the requested legal document.\n\nConversation History:\n${chatHistory}\n\nAdditional Context:${contextAddition}`;
      
      performanceTracker.trackApiCall("generateHTMLDocument");
      const htmlDoc = await generateHTMLDocument(promptWithContext, language, setRetryMessage);
      setDocumentContent(htmlDoc);

      // Cross-tab notification trigger for document generation (Non-blocking)
      try {
        triggerNotification("document", language);
      } catch (notifyErr) {
        console.error("Non-blocking notification error:", notifyErr);
      }
    } catch (error: any) {
      alert(error.message || "Hujjat yaratishda xatolik yuz berdi.");
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-gray-50 dark:bg-zinc-950 flex items-center justify-center font-sans tracking-tight overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] left-[5%] w-[50vw] h-[50vw] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
        <div className="absolute top-[15%] right-[5%] w-[45vw] h-[45vw] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60vw] h-[60vw] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-[1800px] mx-auto p-2 sm:p-4 lg:p-6 xl:p-8 h-full flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 overflow-hidden box-border">
        {/* Desktop Sidebar: Chat History */}
        <div className="hidden lg:flex lg:w-[280px] flex-shrink-0 flex-col bg-white/40 backdrop-blur-[24px] rounded-[32px] border border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden lg:h-full transition-all duration-500">
          <div className="flex flex-col gap-3 p-5 border-b border-white/30">
            <button
              onClick={startNewChat}
              className="w-full py-3 px-4 bg-white/50 backdrop-blur-sm text-blue-600 font-medium rounded-2xl hover:bg-white/80 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {lt.new_chat}
            </button>
            <div className="flex gap-2">
              <button 
                onClick={togglePrivateMode}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm ${isPrivateMode ? 'bg-gray-800 text-white' : 'bg-white/50 text-gray-600 hover:bg-white/80'}`}
                title={lt.private_tooltip}
              >
                <Ghost className="w-3 h-3" />
                {lt.private}
              </button>
              <button 
                onClick={() => {
                  if (!isFeatureAllowed(userTier, "advancedLegalAnalysis")) {
                    openPaywall("advanced");
                  } else {
                    setIsBusinessMode(!isBusinessMode);
                  }
                }}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm ${isBusinessMode ? 'bg-indigo-600 text-white' : 'bg-white/50 text-gray-600 hover:bg-white/80'}`}
                title={lt.business_tooltip}
              >
                <Briefcase className="w-3 h-3" />
                {lt.business}
              </button>
            </div>

            {/* Notification and sound controls */}
            <div className="flex gap-2 border-t border-white/30 pt-2.5 mt-0.5">
              <button
                onClick={toggleSoundAlert}
                className={`flex-1 py-1.5 px-1.5 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${soundEnabled ? 'bg-white/70 text-blue-600 border border-blue-100' : 'bg-white/20 text-gray-500 border border-transparent hover:bg-white/40'}`}
                title={soundEnabled ? lt.sound_active : lt.sound_inactive}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
                <span>{lt.sound}</span>
              </button>
              <button
                onClick={handleRequestNotification}
                className={`flex-1 py-1.5 px-1.5 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${notificationGranted ? 'bg-white/70 text-green-600 border border-green-100' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-transparent'}`}
                title={notificationGranted ? lt.notifications_active : lt.notifications}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{notificationGranted ? lt.notifications_active : lt.notifications}</span>
              </button>
            </div>

            {/* Daily Usage Telemetry Bar */}
            <div className="border-t border-white/20 pt-2 text-left">
              <div className="flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                <span>AI KREDITLAR</span>
                <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{userTier.toUpperCase()}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-gray-700">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  Qoldiq:
                </span>
                <span>{creditsRemaining} / {creditsDailyLimit} kr</span>
              </div>
              <div className="w-full bg-gray-200/50 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${creditsRemaining <= 2 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(100, Math.max(0, (creditsRemaining / (creditsDailyLimit || 10)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 glass-scrollbar">
          {chatSessions.length === 0 ? (
            <div className="text-center p-4 text-sm text-gray-500 font-medium">
              {lt.no_history}
            </div>
          ) : (
            chatSessions.map(chat => (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all flex items-center gap-3 backdrop-blur-sm ${
                  currentChatId === chat.id ? "bg-white/70 text-blue-700 shadow-sm font-semibold" : "text-gray-600 hover:bg-white/40"
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </button>
            ))
          )}
        </div>

        {/* Profile UI at the Bottom of Left Sidebar */}
        <div className="p-4 border-t border-white/30 bg-white/20 backdrop-blur-md flex flex-col gap-3">
          {user ? (
            <div className="flex flex-col gap-3">
              {/* User Identity Info */}
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || "Profil"}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200/80 shadow-sm flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-600 shadow-sm flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <span className="text-sm font-bold text-gray-800 truncate block max-w-[130px]">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                    {user.subscriptionTier === "pro" && (
                      <span className="p-0.5 bg-amber-100 text-amber-700 rounded-md shrink-0" title="Pro Premium">
                        <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 truncate block">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Dashboard, Settings, Logout */}
              <div className="grid grid-cols-3 gap-1 bg-white/40 p-1 rounded-xl border border-white/50 shadow-inner">
                <Link
                  to="/dashboard"
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white/80 rounded-lg transition-all flex items-center justify-center"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </Link>
                <Link
                  to="/settings"
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white/80 rounded-lg transition-all flex items-center justify-center"
                  title="Profil sozlamalari"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await signOut(auth);
                      navigate("/");
                    } catch (e) {
                      console.error("Logout error", e);
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                  title="Chiqish"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-center p-1">
              <p className="text-xs text-gray-500 font-medium">Xizmatlardan to'liq foydalanish uchun tizimga kiring</p>
              <Link
                to="/login"
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm font-sans"
              >
                <User className="w-3.5 h-3.5" />
                Tizimga kirish
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile History Drawer */}
      {mobileHistoryOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileHistoryOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative z-10 w-[85vw] max-w-[320px] bg-[#f8fafc]/95 backdrop-blur-2xl border-r border-white/60 shadow-2xl h-full flex flex-col p-4 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500 text-white rounded-xl shadow-xs">
                  <History className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-900 text-sm">{lt.history || "Suhbatlar Tarixi"}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <button
                type="button"
                onClick={() => {
                  startNewChat();
                  setMobileHistoryOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {lt.new_chat}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 glass-scrollbar">
              {chatSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 font-medium">
                  {lt.no_history}
                </div>
              ) : (
                chatSessions.map(chat => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => {
                      openChat(chat);
                      setMobileHistoryOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                      currentChatId === chat.id 
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-xs" 
                        : "text-gray-600 hover:bg-gray-100/60"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))
              )}
            </div>

            {/* Drawer Footer info */}
            <div className="pt-3 border-t border-gray-200/50 text-[11px] text-gray-500 font-medium">
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-1 font-bold">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  AI Kreditlar:
                </span>
                <span className="font-bold text-gray-800">{creditsRemaining} / {creditsDailyLimit} kr</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${creditsRemaining <= 2 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(100, Math.max(0, (creditsRemaining / (creditsDailyLimit || 10)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wrapper for Chat and Editor to manage dynamic split layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 min-w-0 h-full">
        {/* Middle Panel: Chat */}
        <div className={`w-full ${aiMode === "study" || !editorOpen ? "lg:flex-1" : "lg:w-[40%] shrink-0"} flex-1 flex flex-col bg-white/40 backdrop-blur-[24px] rounded-[28px] sm:rounded-[32px] border border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden h-full min-h-0 relative transition-all duration-300`}>
          <div className="p-4 sm:p-5 border-b border-white/30 bg-white/20 flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileHistoryOpen(true)}
                  className="lg:hidden p-2 bg-white/70 hover:bg-white text-gray-700 rounded-xl border border-white/60 shadow-xs flex items-center justify-center transition-all cursor-pointer"
                  title="Suhbatlar tarixi"
                >
                  <History className="w-4 h-4 text-blue-600" />
                </button>
                <div className="p-2 bg-blue-500 text-white rounded-xl shadow-sm">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 className="font-bold text-gray-900 tracking-tight text-xs sm:text-base truncate max-w-[130px] sm:max-w-none">{lt.ai_assistant_title}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Editor Toggle and Language Select */}
                {aiMode === "document" && (
                  <button
                    type="button"
                    onClick={() => setEditorOpen(!editorOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 shadow-sm cursor-pointer whitespace-nowrap"
                    title={editorOpen ? lt.hide_editor : lt.show_editor}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{editorOpen ? lt.hide_editor : lt.show_editor}</span>
                  </button>
                )}
                
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Language | "en")}
                  className="px-2.5 py-1.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
                >
                  <option value="uz_lat">O'zbek (Lotin)</option>
                  <option value="uz_cyr">O'zbek (Kirill)</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
              <button
                type="button"
                onClick={() => handleModeSwitch("study")}
                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  aiMode === "study"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/20"
                }`}
              >
                <ListChecks className="w-4 h-4" />
                {lt.study_tab}
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("document")}
                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  aiMode === "document"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/20"
                }`}
              >
                <FileText className="w-4 h-4" />
                {lt.doc_tab}
              </button>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 glass-scrollbar">
          {/* Study Components (Only render when mode is "study" and messages are few) */}
          {aiMode === "study" && messages.length <= 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-blue-50/60 rounded-3xl border border-blue-100/80 backdrop-blur-md shadow-sm mb-4"
            >
              <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-blue-600" />
                {lt.study_recommendations}
              </h3>
              <p className="text-xs text-blue-700/95 leading-relaxed mb-3">
                {lt.study_desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.study_p1_val)}
                  className="p-2.5 bg-white hover:bg-blue-100/50 text-left rounded-xl border border-blue-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                  {lt.study_p1_btn}
                </button>
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.study_p2_val)}
                  className="p-2.5 bg-white hover:bg-blue-100/50 text-left rounded-xl border border-blue-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                  {lt.study_p2_btn}
                </button>
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.study_p3_val)}
                  className="p-2.5 bg-white hover:bg-blue-100/50 text-left rounded-xl border border-blue-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                  {lt.study_p3_btn}
                </button>
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.study_p4_val)}
                  className="p-2.5 bg-white hover:bg-blue-100/50 text-left rounded-xl border border-blue-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                  {lt.study_p4_btn}
                </button>
              </div>
            </motion.div>
          )}

          {/* Document Components (Only render when mode is "document" and messages are few) */}
          {aiMode === "document" && messages.length <= 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-indigo-50/60 rounded-3xl border border-indigo-100/80 backdrop-blur-md shadow-sm mb-4"
            >
              <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                {lt.doc_templates}
              </h3>
              <p className="text-xs text-indigo-700/95 leading-relaxed mb-3">
                {lt.doc_desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.doc_p1_val)}
                  className="p-2.5 bg-white hover:bg-indigo-100/50 text-left rounded-xl border border-indigo-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                  {lt.doc_p1_btn}
                </button>
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.doc_p2_val)}
                  className="p-2.5 bg-white hover:bg-indigo-100/50 text-left rounded-xl border border-indigo-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                  {lt.doc_p2_btn}
                </button>
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.doc_p3_val)}
                  className="p-2.5 bg-white hover:bg-indigo-100/50 text-left rounded-xl border border-indigo-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                  {lt.doc_p3_btn}
                </button>
                <button
                  type="button"
                  onClick={() => chatInputRef.current?.setInputValue(lt.doc_p4_val)}
                  className="p-2.5 bg-white hover:bg-indigo-100/50 text-left rounded-xl border border-indigo-100/60 transition-all text-xs text-gray-700 font-medium shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                  {lt.doc_p4_btn}
                </button>
              </div>
            </motion.div>
          )}

          {messages.slice().sort((a, b) => a.createdAt - b.createdAt).map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`px-5 py-4 rounded-[24px] shadow-sm text-sm/relaxed ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-sm" 
                    : "bg-white/80 backdrop-blur-md text-gray-800 rounded-bl-sm border border-white/50"
                }`}>
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.files.map((file, idx) => (
                        <div key={idx} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${msg.role === "user" ? "bg-blue-700 text-blue-100" : "bg-gray-200 text-gray-700"}`}>
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-gray-100 rounded-tl-none flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%]">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
                {retryMessage && (
                  <span className="text-xs text-orange-600 font-medium animate-pulse whitespace-pre-wrap">{retryMessage}</span>
                )}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          ref={chatInputRef}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          language={language}
          aiMode={aiMode}
          openDocModal={openDocModal}
          isGeneratingDoc={isGeneratingDoc}
          messagesLength={messages.length}
          retryMessage={retryMessage}
        />
      </div>

        {/* Right Panel: Editor / Risk Analyzer */}
        {aiMode === "document" && editorOpen && (
          <div 
            className="w-full h-full fixed inset-0 z-50 bg-[#f8fafc]/98 lg:relative lg:inset-auto lg:z-30 lg:w-[60%] lg:flex-1 flex flex-col bg-white/40 backdrop-blur-[24px] lg:rounded-[32px] border border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-y-auto glass-scrollbar min-h-0 p-4 sm:p-6 lg:p-8 transition-all duration-300 animate-in fade-in slide-in-from-right-5"
            style={{ minHeight: "600px", display: "flex", flexDirection: "column", visibility: "visible", opacity: 1 }}
          >
            {/* Top bar */}
            <div className="flex justify-between items-center mb-6 bg-white/40 p-2 rounded-2xl backdrop-blur-md shadow-sm border border-white/50">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 ml-2 sm:ml-4 tracking-tight">Hujjat Muharriri</h2>
              <div className="flex items-center gap-2 mr-1">
                <button 
                  onClick={downloadAll} 
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-gray-900/20 transition-all whitespace-nowrap"
                  title="Barcha natijalarni PDF shaklida yuklab olish"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF Yuklash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all border border-red-200 whitespace-nowrap cursor-pointer"
                  title="Hujjat muharririni vaqtincha yopish"
                >
                  <X className="w-4 h-4" />
                  <span>Yopish</span>
                </button>
              </div>
            </div>

            {/* Document Editor Area */}
            <div 
              className="flex-1 min-h-[450px] bg-white/50 backdrop-blur-md border border-white/50 shadow-inner rounded-[24px] overflow-hidden glass-scrollbar relative mb-4 flex flex-col"
              style={{ minHeight: "450px", display: "flex", flexDirection: "column", visibility: "visible", opacity: 1 }}
            >
              <DocumentEditor 
                content={documentContent || ""} 
                onChange={handleDocumentChange} 
                title={chatSessions.find(s => s.id === currentChatId)?.title || "Hujjat"}
                userRequest={messages.find(m => m.role === "user")?.content || ""}
              />
            </div>

        {/* Accordions */}
        <div className="flex flex-col gap-3 shrink-0">
          
          {/* Yutish Foizi */}
          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activePanel === "winning" ? 'bg-white shadow-lg border-white/80' : 'bg-white/40 border-white/50 hover:bg-white/60 backdrop-blur-md'}`}>
            <button
              onClick={() => setActivePanel(activePanel === "winning" ? "none" : "winning")}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-xl shadow-sm"><TrendingUp className="w-5 h-5" /></div>
                <span className="font-bold text-gray-800 tracking-tight">{lt.win_prob}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${analysis.winningProbability && analysis.winningProbability > 50 ? 'text-green-600' : 'text-gray-600'}`}>{analysis.winningProbability || 0}%</span>
                <div className={`transition-transform duration-300 text-gray-400 ${activePanel === "winning" ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </button>
            <motion.div initial={false} animate={{ height: activePanel === "winning" ? 'auto' : 0, opacity: activePanel === "winning" ? 1 : 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-1 flex justify-center items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" className="text-gray-200 stroke-current" strokeWidth="12" fill="transparent" />
                    <circle cx="64" cy="64" r="56" className="text-green-500 stroke-current" strokeWidth="12" fill="transparent" strokeDasharray="351.858" strokeDashoffset={351.858 - (351.858 * (analysis.winningProbability || 0)) / 100} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
                  </svg>
                  <span className="absolute text-3xl font-black text-gray-800">{analysis.winningProbability || 0}%</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Xavf Darajasi */}
          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activePanel === "riskLevel" ? 'bg-white shadow-lg border-white/80' : 'bg-white/40 border-white/50 hover:bg-white/60 backdrop-blur-md'}`}>
            <button
              onClick={() => setActivePanel(activePanel === "riskLevel" ? "none" : "riskLevel")}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shadow-sm"><AlertCircle className="w-5 h-5" /></div>
                <span className="font-bold text-gray-800 tracking-tight">{lt.risk_level}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-medium px-3 py-1 rounded-full text-sm ${analysis.riskLevel?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' : analysis.riskLevel?.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-700' : analysis.riskLevel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {analysis.riskLevel || lt.unknown_literal}
                </span>
                <div className={`transition-transform duration-300 text-gray-400 ${activePanel === "riskLevel" ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </button>
            <motion.div initial={false} animate={{ height: activePanel === "riskLevel" ? 'auto' : 0, opacity: activePanel === "riskLevel" ? 1 : 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-1 text-center text-gray-600">
                <p>{lt.ai_assessed_risk} <b>{analysis.riskLevel || lt.unknown_literal}</b></p>
                <p className="text-sm mt-2 opacity-70">{lt.risk_read_details}</p>
              </div>
            </motion.div>
          </div>

          {/* Kuchli va Zaif Taraflar (Bento grid style split or two panels, let's make them two panels to keep accordion simple) */}
          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activePanel === "strengths" ? 'bg-white shadow-lg border-white/80' : 'bg-white/40 border-white/50 hover:bg-white/60 backdrop-blur-md'}`}>
            <button
              onClick={() => setActivePanel(activePanel === "strengths" ? "none" : "strengths")}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm"><CheckCircle className="w-5 h-5" /></div>
                <span className="font-bold text-gray-800 tracking-tight">{lt.strengths}</span>
              </div>
              <div className={`transition-transform duration-300 text-gray-400 ${activePanel === "strengths" ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            <motion.div initial={false} animate={{ height: activePanel === "strengths" ? 'auto' : 0, opacity: activePanel === "strengths" ? 1 : 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-1">
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm text-center py-4">{lt.not_detected}</p>
                )}
              </div>
            </motion.div>
          </div>

          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activePanel === "weaknesses" ? 'bg-white shadow-lg border-white/80' : 'bg-white/40 border-white/50 hover:bg-white/60 backdrop-blur-md'}`}>
            <button
              onClick={() => setActivePanel(activePanel === "weaknesses" ? "none" : "weaknesses")}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl shadow-sm"><AlertTriangle className="w-5 h-5" /></div>
                <span className="font-bold text-gray-800 tracking-tight">{lt.weaknesses}</span>
              </div>
              <div className={`transition-transform duration-300 text-gray-400 ${activePanel === "weaknesses" ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            <motion.div initial={false} animate={{ height: activePanel === "weaknesses" ? 'auto' : 0, opacity: activePanel === "weaknesses" ? 1 : 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-1">
                {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm text-center py-4">{lt.not_detected}</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Risk Tahlili */}
          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activePanel === "risk" ? 'bg-white shadow-lg border-white/80' : 'bg-white/40 border-white/50 hover:bg-white/60 backdrop-blur-md'}`}>
            <button
              onClick={() => setActivePanel(activePanel === "risk" ? "none" : "risk")}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl shadow-sm"><AlertCircle className="w-5 h-5" /></div>
                <span className="font-bold text-gray-800 tracking-tight">{lt.risk_analysis}</span>
              </div>
              <div className={`transition-transform duration-300 text-gray-400 ${activePanel === "risk" ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            <motion.div initial={false} animate={{ height: activePanel === "risk" ? 'auto' : 0, opacity: activePanel === "risk" ? 1 : 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-1">
                {!isFeatureAllowed(userTier, "riskAnalysis") ? (
                  <div 
                    onClick={(e) => { e.stopPropagation(); openPaywall("advanced"); }}
                    className="p-5 text-center bg-amber-500/5 border border-dashed border-amber-500/35 rounded-xl my-2 cursor-pointer hover:bg-amber-500/10 transition-all group"
                  >
                    <Lock className="w-5 h-5 text-amber-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform animate-bounce" />
                    <p className="text-xs font-bold text-amber-900 group-hover:underline">{lt.unlock_premium_analysis}</p>
                    <p className="text-[10px] text-amber-700 mt-1 max-w-xs mx-auto">
                      {lt.unlock_premium_analysis_desc}
                    </p>
                  </div>
                ) : analysis.risk ? (
                  <div>
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => downloadSingleReport("risk")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-lg transition-colors animate-fade-in"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lt.download_pdf}
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none prose-red"><Markdown>{analysis.risk}</Markdown></div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm text-center py-4">{lt.not_analyzed_yet}</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Strategiya va Reja */}
          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activePanel === "strategy" ? 'bg-white shadow-lg border-white/80' : 'bg-white/40 border-white/50 hover:bg-white/60 backdrop-blur-md'}`}>
            <button
              onClick={() => setActivePanel(activePanel === "strategy" ? "none" : "strategy")}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm"><ListChecks className="w-5 h-5" /></div>
                <span className="font-bold text-gray-800 tracking-tight">{lt.strategy_plan}</span>
              </div>
              <div className={`transition-transform duration-300 text-gray-400 ${activePanel === "strategy" ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            <motion.div initial={false} animate={{ height: activePanel === "strategy" ? 'auto' : 0, opacity: activePanel === "strategy" ? 1 : 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-1">
                {!isFeatureAllowed(userTier, "strategyPlan") ? (
                  <div 
                    onClick={(e) => { e.stopPropagation(); openPaywall("advanced"); }}
                    className="p-5 text-center bg-amber-500/5 border border-dashed border-amber-500/35 rounded-xl my-2 cursor-pointer hover:bg-amber-500/10 transition-all group"
                  >
                    <Lock className="w-5 h-5 text-amber-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform animate-bounce" />
                    <p className="text-xs font-bold text-amber-900 group-hover:underline">{lt.unlock_premium_strategy}</p>
                    <p className="text-[10px] text-amber-700 mt-1 max-w-xs mx-auto">
                      {lt.unlock_premium_strategy_desc}
                    </p>
                  </div>
                ) : analysis.strategy ? (
                  <div>
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => downloadSingleReport("strategy")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg transition-colors animate-fade-in"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lt.download_pdf}
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none prose-emerald"><Markdown>{analysis.strategy}</Markdown></div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm text-center py-4">{lt.not_prepared_yet}</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* AI Ekspertiza */}
          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activePanel === "expertise" ? 'bg-white shadow-lg border-white/80' : 'bg-white/40 border-white/50 hover:bg-white/60 backdrop-blur-md'}`}>
            <button
              onClick={() => setActivePanel(activePanel === "expertise" ? "none" : "expertise")}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl shadow-sm"><Scale className="w-5 h-5" /></div>
                <span className="font-bold text-gray-800 tracking-tight">{lt.ai_expertise}</span>
              </div>
              <div className={`transition-transform duration-300 text-gray-400 ${activePanel === "expertise" ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            <motion.div initial={false} animate={{ height: activePanel === "expertise" ? 'auto' : 0, opacity: activePanel === "expertise" ? 1 : 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 pt-1">
                {!isFeatureAllowed(userTier, "aiExpertise") ? (
                  <div 
                    onClick={(e) => { e.stopPropagation(); openPaywall("advanced"); }}
                    className="p-5 text-center bg-amber-500/5 border border-dashed border-amber-500/35 rounded-xl my-2 cursor-pointer hover:bg-amber-500/10 transition-all group"
                  >
                    <Lock className="w-5 h-5 text-amber-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform animate-bounce" />
                    <p className="text-xs font-bold text-amber-900 group-hover:underline">{lt.unlock_expertise}</p>
                    <p className="text-[10px] text-amber-700 mt-1 max-w-xs mx-auto">
                      {lt.unlock_expertise_desc}
                    </p>
                  </div>
                ) : analysis.expertise ? (
                  <div>
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => downloadSingleReport("expertise")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/50 rounded-lg transition-colors animate-fade-in"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lt.download_pdf}
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none prose-purple"><Markdown>{analysis.expertise}</Markdown></div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm text-center py-4">{lt.not_studied_yet}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      )}
      </div> {/* Closing wrapping container */}

      {/* Document Settings Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-overlay-fallback">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl shadow-xl-fallback">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{lt.doc_settings_title}</h2>
              <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Case Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{lt.which_case}</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">{lt.select_placeholder}</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Profiles Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{lt.involved_persons}</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {profiles.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">{lt.no_profiles_found}</p>
                  ) : (
                    profiles.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProfileIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProfileIds([...selectedProfileIds, p.id]);
                            } else {
                              setSelectedProfileIds(selectedProfileIds.filter(id => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{p.fullName}</span>
                          {p.passport && <span className="text-xs text-gray-500">{p.passport}</span>}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerateDocument}
                disabled={isGeneratingDoc}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 flex-col"
              >
                <div className="flex items-center justify-center gap-2">
                  {isGeneratingDoc ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {lt.creating_btn}
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      {lt.confirm_create_btn}
                    </>
                  )}
                </div>
                {isGeneratingDoc && retryMessage && (
                  <span className="text-xs text-blue-200 mt-1 animate-pulse whitespace-pre-wrap px-2 text-center">{retryMessage}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
