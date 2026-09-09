import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, 
  AlertTriangle, Bell, Check, Trash2, Briefcase, Filter, Activity, CheckCircle2, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { logActivity } from "../services/activityService";
import { Deadline, Case } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

const LOCAL_TRANSLATIONS = {
  uz_lat: {
    system_tag: "Kalendar Tizimi",
    title: "Protsessual Muddatlar Nazorati",
    subtitle: "Sud majlisi, apellyatsiya muddatlari va raddiyalarni kalendar ko'rinishida real-time nazorat qiling hamda ogohlantirishlarni muddatidan oldin oling.",
    add_deadline: "Yangi muddat qo'shish",
    filter_label: "Filtrlash:",
    all_types: "Sohalar: Barchasi",
    all_cases: "Ishlar: Barchasi",
    cases_count_sfx: "ish",
    total_tasks_prefix: "Jami topshiriqlar:",
    today: "Bugun",
    prev_month: "O'tgan oy",
    next_month: "Kelgusi oy",
    types: "Turlar:",
    type_hearing: "Sud majlisi",
    type_appeal: "Apellyatsiya",
    type_submission: "Hujjat topshirish",
    type_custom: "Ixtiyoriy muddat",
    risk_alerts: "Xatarlar & Ogohlantirishlar",
    overdue_alert: "MUDDATI O'TGAN!",
    no_active_alerts: "Tizimda yaqin oradagi favqulodda ogohlantirishlar mavjud emas.",
    daily_details: "Kunlik Tafsilotlar",
    select_date: "Sana tanlang",
    no_deadlines_for_day: "Ushbu sana uchun rejalashtirilgan protsessual muhlatingiz yo'q.",
    new_deadline_lbl: "Yangi muddat belgilash",
    select_case_prompt: "Ishni tanlang...",
    task_obligation: "Kutilayotgan vazifa / Majburiyat",
    task_placeholder: "Masalan: Sud binosidagi ommaviy muzokara yig'ilishi",
    processual_type: "Protsessual muddat turi",
    due_date: "Oxirgi saqlash sanasi (Due Date)",
    cancel: "Bekor qilish",
    saving: "Saqlanmoqda...",
    save: "Saqlash",
    toast_updated: "Vazifa holati yangilandi!",
    toast_failed: "O'zgartirish muvaffaqiyatsiz tugadi",
    confirm_delete: "muddatini o'chirishni xohlaysizmi?",
    toast_deleted: "Muddat o'chirildi.",
    all_fields_err: "Iltimos, barcha maydonlarni to'ldiring.",
    toast_saved: "Yangi protsessual muddat saqlandi!",
    toast_no_case: "Ish topilmadi, oldin ish yarating.",
    toast_create_first: "Dastlab biron ish joriy eting!",
    months: [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ],
    weekdays: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
    case_folder_lbl: "Ish:",
    ta: "ta",
    urgencies: {
      overdue: "Muddati o'tgan",
      day1: "1 kun qoldi",
      days7: "7 kun qoldi",
      days30: "30 kun qoldi",
      future: "Xavfsiz muddat"
    }
  },
  uz_cyr: {
    system_tag: "Календар Тизими",
    title: "Протсессуал Муддатлар Назорати",
    subtitle: "Суд мажлиси, апелляция муддатлари ва раддияларни календар кўринишида реал-тиме назорат қилинг ҳамда огоҳлантиришларни муддатидан олдин олинг.",
    add_deadline: "Янги муддат қўшиш",
    filter_label: "Филтрлаш:",
    all_types: "Соҳалар: Барчаси",
    all_cases: "Ишлар: Барчаси",
    cases_count_sfx: "иш",
    total_tasks_prefix: "Жами топшириқлар:",
    today: "Бугун",
    prev_month: "Ўтган ой",
    next_month: "Келгуси ой",
    types: "Турлар:",
    type_hearing: "Суд мажлиси",
    type_appeal: "Апелляция",
    type_submission: "Ҳужжат топшириш",
    type_custom: "Ихтиёрий муддат",
    risk_alerts: "Хатарлар & Огоҳлантиришлар",
    overdue_alert: "МУДДАТИ ЎТГАН!",
    no_active_alerts: "Тизимда яқин орадаги фавқулодда огоҳлантиришлар мавжуд эмас.",
    daily_details: "Кунлик Тафсилотлар",
    select_date: "Сана танланг",
    no_deadlines_for_day: "Ушбу сана учун режалаштирилган протсессуал муҳлатингиз йўқ.",
    new_deadline_lbl: "Янги муддат белгилаш",
    select_case_prompt: "Ишни танланг...",
    task_obligation: "Кутилаётган вазифа / Мажбурият",
    task_placeholder: "Масалан: Суд биносидаги оммавий музокара йиғилиши",
    processual_type: "Протсессуал муддат тури",
    due_date: "Охирги сақлаш санаси (Дуе Дате)",
    cancel: "Бекор қилиш",
    saving: "Сақланмоқда...",
    save: "Сақлаш",
    toast_updated: "Вазифа ҳолати янгиланди!",
    toast_failed: "Ўзгартириш муваффақиятсиз тугади",
    confirm_delete: "муддатини ўчиришни хоҳлайсизми?",
    toast_deleted: "Муддат ўчирилди.",
    all_fields_err: "Илтимос, барча майдонларни тўлдиринг.",
    toast_saved: "Янги протсессуал муддат сақланди!",
    toast_no_case: "Иш топилмати, олдин иш яратинг.",
    toast_create_first: "Дастлаб бирон иш жорий этинг!",
    months: [
      "Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
      "Июл", "Август", "Сентябр", "Октябр", "Ноябр", "Декабр"
    ],
    weekdays: ["Ду", "Се", "Чо", "Па", "Жу", "Ша", "Як"],
    case_folder_lbl: "Иш:",
    ta: "та",
    urgencies: {
      overdue: "Муддати ўтган",
      day1: "1 кун қолди",
      days7: "7 кун қолди",
      days30: "30 кун қолди",
      future: "Хавфсиз муддат"
    }
  },
  ru: {
    system_tag: "Календарь Дел",
    title: "Контроль процессуальных сроков",
    subtitle: "Интерактивный контроль судебных заседаний, апелляционных сроков и подачи процессуальных документов.",
    add_deadline: "Добавить срок",
    filter_label: "Фильтрация:",
    all_types: "Тип: Все",
    all_cases: "Дела: Все",
    cases_count_sfx: "дел",
    total_tasks_prefix: "Всего задач:",
    today: "Сегодня",
    prev_month: "Предыдущий месяц",
    next_month: "Следующий месяц",
    types: "Категории:",
    type_hearing: "Судебное заседание",
    type_appeal: "Апелляция",
    type_submission: "Подача документов",
    type_custom: "Произвольный срок",
    risk_alerts: "Угрозы & Очередь предупреждений",
    overdue_alert: "ПРОСРОЧЕНО!",
    no_active_alerts: "В системе нет критических напоминаний о приближающихся сроках.",
    daily_details: "События дня",
    select_date: "Выберите дату",
    no_deadlines_for_day: "На этот день нет запланированных процессуальных сроков или дел.",
    new_deadline_lbl: "Новое процессуальное обязательство",
    select_case_prompt: "Выберите дело...",
    task_obligation: "Суть обязательства / Задачи",
    task_placeholder: "Например: Подача возражений в городской суд Ташкента",
    processual_type: "Процессуальный характер",
    due_date: "Срок выполнения (Due Date)",
    cancel: "Отмена",
    saving: "Сохранение...",
    save: "Сохранить",
    toast_updated: "Статус задачи успешно изменен!",
    toast_failed: "Не удалось сохранить изменения",
    confirm_delete: "Вы точно хотите удалить срок",
    toast_deleted: "Процессуальный срок удален из базы.",
    all_fields_err: "Пожалуйста, заполните все обязательные поля формы.",
    toast_saved: "Новое процессуальное обязательство сохранено!",
    toast_no_case: "Дела не найдены, сначала добавьте судебное дело в реестр.",
    toast_create_first: "Пожалуйста, сначала создайте хотя бы одно судебное дело!",
    months: [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ],
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    case_folder_lbl: "Дело:",
    ta: "",
    urgencies: {
      overdue: "Просрочено",
      day1: "Остался 1 день",
      days7: "Осталось 7 дней",
      days30: "Осталось 30 дней",
      future: "Запланировано"
    }
  },
  en: {
    system_tag: "Scheduler Hub",
    title: "Procedural Clock Control",
    subtitle: "Review upcoming court hearing sessions, appeals timelines, evidence discovery stages in an integrated central calendar UI.",
    add_deadline: "Add Milestone",
    filter_label: "Filter By:",
    all_types: "Category: All",
    all_cases: "Cases: All",
    cases_count_sfx: "cases",
    total_tasks_prefix: "Total Milestones:",
    today: "Today",
    prev_month: "Prev Month",
    next_month: "Next Month",
    types: "Legends:",
    type_hearing: "Court Hearing",
    type_appeal: "Appeals Stage",
    type_submission: "Submission Due",
    type_custom: "General Task",
    risk_alerts: "Compliance Risks Feed",
    overdue_alert: "OVERDUE DETECTED!",
    no_active_alerts: "Beautifully cleared! No upcoming compliance risks triggered within nearest range.",
    daily_details: "Daily Schedule",
    select_date: "Select Date",
    no_deadlines_for_day: "No scheduled procedural events or compliance milestones recorded on this day.",
    new_deadline_lbl: "Schedule Compliance Milestone",
    select_case_prompt: "Associate Case File...",
    task_obligation: "Task / Bound Obligation",
    task_placeholder: "e.g. File motion to dismiss for prosecution's case",
    processual_type: "Governing Category",
    due_date: "Obligation Target Date",
    cancel: "Cancel",
    saving: "Syncing data...",
    save: "Confirm Save",
    toast_updated: "Assigned target milestone updated!",
    toast_failed: "Execution failed to modify task status",
    confirm_delete: "Are you sure you want to remove milestone",
    toast_deleted: "Compliance milestone deleted.",
    all_fields_err: "Complete all input fields to securely log compliance sequence.",
    toast_saved: "New procedural event registered inside case folder!",
    toast_no_case: "Create a litigation case file to associate this milestone.",
    toast_create_first: "Please initialize at least one active litigation dossier first!",
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ],
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    case_folder_lbl: "Case:",
    ta: "",
    urgencies: {
      overdue: "Overdue",
      day1: "1 day left",
      days7: "7 days left",
      days30: "30 days left",
      future: "Secure range"
    }
  }
};

export function CalendarPage() {
  const { language } = useLanguage();
  const lt = LOCAL_TRANSLATIONS[language] || LOCAL_TRANSLATIONS.uz_lat;

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCaseId, setFilterCaseId] = useState<string>("all");
  
  // Create deadline form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDateStr, setNewDateStr] = useState("");
  const [newType, setNewType] = useState<"hearing" | "appeal" | "submission" | "custom">("custom");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast notifications state
  const [toastMsg, setToastMsg] = useState("");

  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const q = query(collection(db, "cases"), where("userId", "==", uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Case[];
      setCases(items);
      setLoading(false);
    }, (error) => {
      console.error("Error loading cases for calendar:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Collect all deadlines from all cases
  const allDeadlines = cases.flatMap(c => 
    (c.deadlines || []).map(dl => ({
      ...dl,
      caseId: c.id,
      caseTitle: c.title,
    }))
  );

  // Filter deadlines based on selecting filters
  const filteredDeadlines = allDeadlines.filter(dl => {
    const matchesType = filterType === "all" || dl.type === filterType;
    const matchesCase = filterCaseId === "all" || dl.caseId === filterCaseId;
    return matchesType && matchesCase;
  });

  // Handle month switches
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Calendar Helper Logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday, etc. Adjust for Monday start:
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // standard European Monday start
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);
  const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // Calendar Cells list
  const calendarCells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Trailing previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    calendarCells.push({ date: d, isCurrentMonth: true });
  }

  // Leading next month days to complete 6 weeks (42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  // Get deadlines falling on a specific calendar day/date
  const getDeadlinesForDate = (date: Date) => {
    return filteredDeadlines.filter(dl => {
      const dlDate = new Date(dl.dueDate);
      return dlDate.getFullYear() === date.getFullYear() &&
             dlDate.getMonth() === date.getMonth() &&
             dlDate.getDate() === date.getDate();
    });
  };

  // Check deadline urgency/alarms
  const getDeadlineUrgency = (dueDate: number) => {
    const now = Date.now();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { key: "overdue", label: lt.urgencies.overdue, color: "text-rose-600 bg-rose-50 border-rose-100" };
    if (diffDays <= 1) return { key: "1_day", label: lt.urgencies.day1, color: "text-red-600 bg-red-100 border-red-200 animate-pulse" };
    if (diffDays <= 7) return { key: "7_days", label: lt.urgencies.days7, color: "text-orange-600 bg-orange-100 border-orange-200" };
    if (diffDays <= 30) return { key: "30_days", label: lt.urgencies.days30, color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { key: "future", label: lt.urgencies.future, color: "text-slate-500 bg-slate-50 border-slate-100" };
  };

  // Render type color code for dotted calendar cells
  const getTypeColor = (type?: string) => {
    switch (type) {
      case "hearing": return "bg-red-500";
      case "appeal": return "bg-purple-500";
      case "submission": return "bg-blue-500";
      default: return "bg-gray-400";
    }
  };

  const getTypeNameUz = (type?: string) => {
    switch (type) {
      case "hearing": return lt.type_hearing;
      case "appeal": return lt.type_appeal;
      case "submission": return lt.type_submission;
      default: return lt.type_custom;
    }
  };

  // Toggle deadline from Calendar view
  const handleToggleDeadlineDirect = async (dl: any) => {
    try {
      const targetCase = cases.find(c => c.id === dl.caseId);
      if (!targetCase) return;

      const list = (targetCase.deadlines || []).map(item => {
        if (item.id === dl.id) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });

      await updateDoc(doc(db, "cases", dl.caseId), {
        deadlines: list,
        updatedAt: Date.now()
      });

      await logActivity(
        "deadline_toggle",
        !dl.completed ? "Muddat bajarildi deb belgilandi" : "Muddat qayta tiklandi",
        `"${dl.title}" nomli muddat/vazifa holati taqvim orqali o'zgartirildi.`,
        dl.caseId,
        dl.caseTitle
      );

      // Check if we should trigger an immediate notification for 1, 7, 30 days
      const urgency = getDeadlineUrgency(dl.dueDate);
      if (urgency.key !== "overdue" && urgency.key !== "future" && !dl.completed && auth.currentUser) {
        // Safe check write notification doc
        await addDoc(collection(db, "users", auth.currentUser.uid, "notifications"), {
          title: `Deadline Bajarildi: ${dl.title}`,
          body: `Siz "${targetCase.title}" ishidagi ushbu protsessual muddatni yopdingiz: ${new Date(dl.dueDate).toLocaleDateString("UZ-uz")}`,
          type: "document",
          timestamp: new Date().toISOString(),
          read: false,
          userId: auth.currentUser.uid
        });
      }

      showToastMsg(lt.toast_updated);
    } catch (err) {
      console.error("Error toggling deadline from calendar:", err);
      showToastMsg(lt.toast_failed);
    }
  };

  // Delete deadline from Calendar view
  const handleDeleteDeadlineDirect = async (dl: any) => {
    if (!window.confirm(`"${dl.title}" ${lt.confirm_delete}`)) return;

    try {
      const targetCase = cases.find(c => c.id === dl.caseId);
      if (!targetCase) return;

      const list = (targetCase.deadlines || []).filter(item => item.id !== dl.id);
      await updateDoc(doc(db, "cases", dl.caseId), {
        deadlines: list,
        updatedAt: Date.now()
      });

      await logActivity(
        "deadline_delete",
        "Muddat o'chirildi",
        `"${dl.title}" nomli protsessual muddat taqvim orqali o'chirildi.`,
        dl.caseId,
        dl.caseTitle
      );

      showToastMsg(lt.toast_deleted);
    } catch (err) {
      console.error("Error deleting deadline from calendar:", err);
    }
  };

  // Create new deadline
  const handleCreateDeadlineDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !newTitle.trim() || !newDateStr) {
      showToastMsg(lt.all_fields_err);
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCase = cases.find(c => c.id === selectedCaseId);
      if (!targetCase) return;

      const newDl: Deadline = {
        id: "dl_" + Math.random().toString(36).substring(2, 9),
        title: newTitle.trim(),
        dueDate: new Date(newDateStr).getTime(),
        completed: false,
        type: newType
      };

      const list = [...(targetCase.deadlines || []), newDl];
      await updateDoc(doc(db, "cases", selectedCaseId), {
        deadlines: list,
        updatedAt: Date.now()
      });

      await logActivity(
        "deadline_create",
        "Taqvim muddat qo'shish",
        `"${newTitle.trim()}" (${getTypeNameUz(newType)}) taqvim orqali "${targetCase.title}" ishiga biriktirildi.`,
        selectedCaseId,
        targetCase.title
      );

      // Create an automatic notification if the deadline is within notification ranges (30 days, 7 days, 1 day)
      const urgency = getDeadlineUrgency(newDl.dueDate);
      if ((urgency.key === "1_day" || urgency.key === "7_days" || urgency.key === "30_days") && auth.currentUser) {
        await addDoc(collection(db, "users", auth.currentUser.uid, "notifications"), {
          title: `Taqvimda yaqinlashayotgan muhim sana!`,
          body: `"${newTitle.trim()}" (${getTypeNameUz(newType)}) sanasiga ${urgency.label === "1 kun qoldi" ? "1 kun" : urgency.label === "7 kun qoldi" ? "7 kun" : "30 kun"} qoldi. Ish: "${targetCase.title}"`,
          type: "analysis",
          timestamp: new Date().toISOString(),
          read: false,
          userId: auth.currentUser.uid
        });
      }

      setNewTitle("");
      setNewDateStr("");
      setNewType("custom");
      setIsCreateOpen(false);
      showToastMsg(lt.toast_saved);
    } catch (err) {
      console.error("Error creating deadline in calendar integration:", err);
      showToastMsg(lt.toast_failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open creation modal with pre-selected date
  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    setNewDateStr(`${yyyy}-${mm}-${dd}`);
  };

  // Generate automated check upon loading to push active notifications in Firestore
  useEffect(() => {
    if (loading || allDeadlines.length === 0 || !auth.currentUser) return;
    
    // Scan only uncompleted alerts
    const activeAlerts = allDeadlines.filter(dl => !dl.completed);
    activeAlerts.forEach(async (dl) => {
      const urgency = getDeadlineUrgency(dl.dueDate);
      if (urgency.key === "1_day" || urgency.key === "7_days" || urgency.key === "30_days") {
        // Prevent recurring spam by saving track lists in localStorage
        const alarmKey = `notif_logged_${dl.id}_${urgency.key}`;
        if (!localStorage.getItem(alarmKey)) {
          try {
            await addDoc(collection(db, "users", auth.currentUser!.uid, "notifications"), {
              title: `Muddat yaqinlashmoqda: ${dl.title}`,
              body: `Diqqat, protsessual qonun muddatiga jiddiy ogohlantirish! "${dl.title}" (${getTypeNameUz(dl.type)}) yaqinlashmoqda: ${urgency.label}. Ish: ${dl.caseTitle}`,
              type: "analysis",
              timestamp: new Date().toISOString(),
              read: false,
              userId: auth.currentUser!.uid
            });
            localStorage.setItem(alarmKey, "true");
          } catch (e) {
            console.error("Auto alert trigger failing:", e);
          }
        }
      }
    });
  }, [loading, cases]);

  // Calendar translation arrays
  const monthsUz = lt.months;
  const weekDaysUz = lt.weekdays;

  // Selected Date deadlines for secondary list
  const selectedDateDeadlines = selectedDate ? getDeadlinesForDate(selectedDate) : [];

  // Filter out soon upcoming active deadlines (reminders box)
  const upcomingActiveDeadlines = allDeadlines
    .filter(dl => !dl.completed)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 5);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] overflow-hidden leading-normal font-sans text-sm">
      {/* Background patterns */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-100/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[38vw] h-[38vw] rounded-full bg-purple-100/15 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Header Breadcrumbs */}
        <div className="backdrop-blur-xl bg-white/50 border border-white/60 p-6 md:p-8 rounded-3xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <CalendarIcon className="w-3.5 h-3.5" /> {lt.system_tag}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
                {lt.title}
              </h1>
              <p className="mt-1 text-slate-500 text-xs">
                {lt.subtitle}
              </p>
            </div>
            
            <button
              onClick={() => {
                if (cases.length === 0) {
                  showToastMsg(lt.toast_create_first);
                  return;
                }
                setSelectedCaseId(cases[0].id);
                if (selectedDate) {
                  handleDaySelect(selectedDate);
                } else {
                  handleDaySelect(new Date());
                }
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 border border-transparent text-xs font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm self-start md:self-center"
            >
              <Plus className="w-4 h-4" />
              {lt.add_deadline}
            </button>
          </div>
        </div>

        {/* Outer Filters Section */}
        <div className="bg-white/75 backdrop-blur-md border border-white p-4 rounded-2xl shadow-xs mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> {lt.filter_label}
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-300"
            >
              <option value="all">{lt.all_types}</option>
              <option value="hearing">{lt.type_hearing}</option>
              <option value="appeal">{lt.type_appeal}</option>
              <option value="submission">{lt.type_submission}</option>
              <option value="custom">{lt.type_custom}</option>
            </select>

            {/* Filter by Case */}
            <select
              value={filterCaseId}
              onChange={(e) => setFilterCaseId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold max-w-xs focus:outline-none focus:border-slate-300"
            >
              <option value="all">{lt.all_cases} ({cases.length} {lt.cases_count_sfx})</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-bold">
              {lt.total_tasks_prefix} {filteredDeadlines.length} {lt.ta}
            </span>
          </div>
        </div>

        {/* Dashboard Alerts / Reminder Grid on 30, 7, 1 days before */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Left Side - Interactive Calendar */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* The Monthly Grid Block */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              
              {/* Calendar Navigator Bar */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-800">
                    {monthsUz[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button 
                    onClick={handleToday}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100/70"
                  >
                    {lt.today}
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1 px-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition"
                    title={lt.prev_month}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1 px-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition"
                    title={lt.next_month}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Labels of week */}
              <div className="grid grid-cols-7 gap-1 text-center select-none mb-2">
                {weekDaysUz.map((day, ix) => (
                  <div key={day} className={`text-xs font-extrabold py-2 text-slate-400 uppercase ${ix >= 5 ? "text-rose-500/70" : ""}`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100/60">
                {calendarCells.map((cell, idx) => {
                  const dayDeadlines = getDeadlinesForDate(cell.date);
                  const isToday = new Date().toDateString() === cell.date.toDateString();
                  const isSelected = selectedDate && selectedDate.toDateString() === cell.date.toDateString();
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDaySelect(cell.date)}
                      className={`min-h-[90px] p-2 bg-white rounded-xl border transition-all flex flex-col justify-between cursor-pointer select-none relative ${
                        cell.isCurrentMonth ? "text-slate-800" : "text-slate-300 opacity-45 bg-slate-50/50"
                      } ${
                        isSelected 
                          ? "border-blue-500 shadow-sm ring-1 ring-blue-500/30" 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {/* Top row showing cell day number */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black p-1.5 rounded-md min-w-[24px] min-h-[24px] inline-flex items-center justify-center font-mono ${
                          isToday 
                            ? "bg-slate-900 text-white shadow-xs" 
                            : isSelected ? "text-blue-600 bg-blue-50" : ""
                        }`}>
                          {cell.date.getDate()}
                        </span>

                        {dayDeadlines.length > 0 && (
                          <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
                            {dayDeadlines.length}
                          </span>
                        )}
                      </div>

                      {/* Display dot/small highlights of deadlines on this cell */}
                      <div className="space-y-1 mt-1.5 overflow-hidden max-h-[48px]">
                        {dayDeadlines.slice(0, 3).map((dl) => (
                          <div 
                            key={dl.id}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold leading-none truncate ${
                              dl.completed 
                                ? "bg-gray-50 text-gray-400 line-through" 
                                : dl.type === "hearing" ? "bg-red-50 text-red-600 border border-red-100"
                                : dl.type === "appeal" ? "bg-purple-50 text-purple-600 border border-purple-100"
                                : dl.type === "submission" ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : "bg-gray-50 text-slate-600 border border-slate-100"
                            }`}
                            title={dl.title}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getTypeColor(dl.type)}`} />
                            <span className="truncate">{dl.title}</span>
                          </div>
                        ))}
                        {dayDeadlines.length > 3 && (
                          <p className="text-[8px] text-slate-400 font-bold pl-1">
                            +{dayDeadlines.length - 3} {language === "ru" || language === "en" ? "" : "ta"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend row */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium">
                <span className="text-slate-400">{lt.types}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-slate-600">{lt.type_hearing}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-600">{lt.type_appeal}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-600">{lt.type_submission}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span className="text-slate-600">{lt.type_custom}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column - Compliance Alarms & Reminders feed */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. COMPLIANCE ALERTS WINDOW (30, 7, 1 days checks) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
                <Bell className="w-4.5 h-4.5 text-orange-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  {lt.risk_alerts}
                </h3>
              </div>

              <div className="space-y-3">
                {/* Check warning statuses inside our active deadlines */}
                {allDeadlines.filter(dl => !dl.completed).map((dl) => {
                  const urgency = getDeadlineUrgency(dl.dueDate);
                  if (urgency.key === "future" || urgency.key === "overdue") return null;
                  
                  return (
                    <div 
                      key={dl.id}
                      className={`p-3.5 rounded-2xl border flex gap-3 ${urgency.color}`}
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div className="text-xs">
                        <div className="flex items-center gap-2 font-bold leading-tight">
                          <span>{urgency.label.toUpperCase()}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white rounded border border-current opacity-80">
                            {getTypeNameUz(dl.type)}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-800 tracking-tight mt-1">
                          {dl.title}
                        </p>
                        <p className="text-[10.5px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                          {lt.case_folder_lbl} {dl.caseTitle}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Overdue dead level notifications */}
                {allDeadlines.filter(dl => !dl.completed && getDeadlineUrgency(dl.dueDate).key === "overdue").map((dl) => (
                  <div 
                    key={dl.id}
                    className="p-3.5 rounded-2xl border flex gap-3 text-rose-700 bg-rose-50 border-rose-200"
                  >
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold flex items-center gap-1">
                        <span>{lt.overdue_alert}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-rose-200/50 rounded">
                          {getTypeNameUz(dl.type)}
                        </span>
                      </div>
                      <p className="font-extrabold text-slate-900 mt-1">{dl.title}</p>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">{lt.case_folder_lbl} {dl.caseTitle}</p>
                    </div>
                  </div>
                ))}

                {/* Fallback if no notifications exist in 30, 7 or 1 days ranges */}
                {allDeadlines.filter(dl => {
                  const ug = getDeadlineUrgency(dl.dueDate).key;
                  return !dl.completed && (ug === "1_day" || ug === "7_days" || ug === "30_days" || ug === "overdue");
                }).length === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold">{lt.no_active_alerts}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. SELECTED DAY'S TIMELINE DETAILS */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[300px]">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {lt.daily_details}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedDate ? selectedDate.toLocaleDateString(language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : lt.select_date}
                  </p>
                </div>
                {selectedDate && (
                  <button
                    onClick={() => {
                      if (cases.length === 0) {
                        showToastMsg(lt.toast_no_case);
                        return;
                      }
                      setSelectedCaseId(cases[0].id);
                      setIsCreateOpen(true);
                    }}
                    className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition"
                    title={lt.add_deadline}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex-1 mt-4 overflow-y-auto space-y-3">
                {selectedDateDeadlines.length > 0 ? (
                  selectedDateDeadlines.map((dl) => (
                    <div 
                      key={dl.id}
                      className={`p-3.5 rounded-2xl border transition flex items-start gap-3 justify-between ${
                        dl.completed ? "bg-slate-50/70 border-slate-100 opacity-60" : "bg-white border-slate-200 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <input
                          type="checkbox"
                          checked={dl.completed}
                          onChange={() => handleToggleDeadlineDirect(dl)}
                          className="rounded border-slate-300 w-4.5 h-4.5 text-slate-900 focus:ring-slate-900/30 cursor-pointer mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${dl.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {dl.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 shrink-0 bg-slate-50 border border-slate-100/70 inline-block px-1.5 py-0.5 rounded truncate">
                            {lt.case_folder_lbl} {dl.caseTitle}
                          </p>
                          
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                              dl.type === "hearing" ? "bg-red-50 text-red-600 border-red-100" :
                              dl.type === "appeal" ? "bg-purple-50 text-purple-600 border-purple-100" :
                              dl.type === "submission" ? "bg-blue-50 text-blue-600 border-blue-200" :
                              "bg-gray-50 text-gray-600 border-gray-200"
                            }`}>
                              {getTypeNameUz(dl.type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDeadlineDirect(dl)}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs">{lt.no_deadlines_for_day}</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* CREATE DEADLINE DIALOG / MODAL (AnimatePresence) */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider">
                  <CalendarIcon className="w-4.5 h-4.5 text-orange-500" />
                  {lt.new_deadline_lbl}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDeadlineDirect} className="p-6 space-y-4">
                
                {/* 1. Select Case (Every deadline belongs to a case) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lt.case_folder_lbl}
                  </label>
                  <select
                    required
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="" disabled>{lt.select_case_prompt}</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Headline / Title */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lt.task_obligation}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={lt.task_placeholder}
                    className="w-full px-4.5 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                {/* 3. Deadline Category/Type */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lt.processual_type}
                  </label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="hearing">{lt.type_hearing}</option>
                    <option value="appeal">{lt.type_appeal}</option>
                    <option value="submission">{lt.type_submission}</option>
                    <option value="custom">{lt.type_custom}</option>
                  </select>
                </div>

                {/* 4. Target Date */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lt.due_date}
                  </label>
                  <input
                    type="date"
                    required
                    value={newDateStr}
                    onChange={(e) => setNewDateStr(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 cursor-pointer text-slate-800 font-bold"
                  />
                </div>

                {/* Actions button */}
                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-extrabold rounded-xl transition"
                  >
                    {lt.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? lt.saving : lt.save}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic float toast alert message */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 shadow-2xl p-4.5 rounded-2xl flex items-center gap-3 text-white max-w-sm font-semibold"
          >
            <div className="p-1 px-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md shrink-0">
              ⚡
            </div>
            <p className="text-xs leading-relaxed">{toastMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
export default CalendarPage;
