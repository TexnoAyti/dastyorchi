export interface TemplateField {
  id: string; // matches placeholder, e.g. "PLAINTIFF_NAME" -> [PLAINTIFF_NAME]
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "date" | "number";
  required: boolean;
}

export interface LegalTemplate {
  id: string;
  title: string;
  description: string;
  category: "Civil Law" | "Criminal Law" | "Administrative Law" | "Labour Law" | "Contract Law";
  popularity: number; // For popularity sorting (e.g., 98, 85, 74...)
  fields: TemplateField[];
  textTemplate: string;
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  // --- CIVIL LAW ---
  {
    id: "civil_statement_of_claim",
    title: "Da'vo ariza (Statement of Claim)",
    description: "Fuqarolik ishlari bo'yicha tuman sudlariga moddiy va ma'naviy zarar, qarz undirish yoki boshqa majburiyatlarni bajarish uchun taqdim etiladigan rasmiy da'vo ariza.",
    category: "Civil Law",
    popularity: 98,
    fields: [
      { id: "COURT_NAME", label: "Sud nomi", placeholder: "Masalan: Fuqarolik ishlari bo'yicha Shayxontohur tuman sudi", type: "text", required: true },
      { id: "PLAINTIFF_NAME", label: "Da'vogar (F.I.SH. yoki Tashkilot nomi)", placeholder: "Masalan: Karimov Alisher Anvarovich", type: "text", required: true },
      { id: "PLAINTIFF_ADDRESS", label: "Da'vogar manzili va telefoni", placeholder: "Toshkent sh., Yunusobod tumani, 4-mavze, 12-uy. Tel: +998 90 123-4567", type: "text", required: true },
      { id: "DEFENDANT_NAME", label: "Javobgar (F.I.SH. yoki Tashkilot nomi)", placeholder: "Masalan: Rustamov Baxtiyor G'ofurovich", type: "text", required: true },
      { id: "DEFENDANT_ADDRESS", label: "Javobgar manzili", placeholder: "Tashkent sh., Shayxontohur tumani, Navoiy ko'chasi, 45-uy", type: "text", required: true },
      { id: "CLAIM_SUM", label: "Da'vo bahosi (so'mda)", placeholder: "Masalan: 15,000,000 so'm", type: "text", required: false },
      { id: "DISPUTE_DETAILS", label: "Nizo tafsilotlari (qisqacha)", placeholder: "Javobgar 2025-yil aprel oyida olingan qarzni va'da qilingan muddatda qaytarib bermadi.", type: "textarea", required: true },
      { id: "LEGAL_DEMANDS", label: "Suddan so'raladigan talabingiz", placeholder: "Javobgardan 15,000,000 so'm asosiy qarz va 1,500,000 so'm davlat boji undirishingizni so'rayman", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Da'vogar: [PLAINTIFF_NAME]
Manzil: [PLAINTIFF_ADDRESS]

Javobgar: [DEFENDANT_NAME]
Manzil: [DEFENDANT_ADDRESS]

Da'vo bahosi: [CLAIM_SUM]

DA'VO ARIZA
(Shartnoma majburiyatlarini bajarmaslik va moddiy zarar undirish to'g'risida)

Men va javobgar [DEFENDANT_NAME] o'rtasida vujudga kelgan huquqiy munosabatlar natijasida quyidagilarni ma'lum qilaman:
[DISPUTE_DETAILS]

O'zbekiston Respublikasining Fuqarolik Kodeksi hamda Fuqarolik Protsessual Kodeksiga muvofiq, taraflar o'rtasidagi kelishuvlar qonuniy kuchga ega va taraflar majburiyatlarni lozim darajada bajarishlari shart. Biroq, javobgar o'z majburiyatlarini bajarishdan bo'yin tovlab kelmoqda. Bu holat mening huquq va manfaatlarimning to'g'ridan-to'g'ri buzilishiga olib keldi.

Yuqoridagilardan kelib chiqib, O'zbekiston Respublikasi FPKning 188, 189, 191-moddalariga asosan,

SUDDAN SO'RAYMAN:

1. [LEGAL_DEMANDS]
2. Ushbu ishni ko'rib chiqish jarayonida kiritilgan davlat boji xarajatlarini javobgar zimmasiga yuklashingizni.

Ilova qilinayotgan hujjatlar:
1. Da'vogar pasporti nusxasi
2. Shartnoma yoki qarz olinganligi haqidagi tilxat nusxasi
3. Davlat boji to'langanligi to'g'risidagi kvitansiya
4. Da'vo arizaning javobgarga yuborilganligini tasdiqlovchi pochta kvitansiyasi

Sana: [DATE]
Da'vogar imzosi: _________________ ([PLAINTIFF_NAME])`
  },
  {
    id: "civil_appeal_complaint",
    title: "Apellyatsiya shikoyati (Appeal Complaint)",
    description: "Birinchi instansiya sudining qonuniy kuchga kirmagan hal qiluv qaroridan norozi bo'lganda, apellyatsiya instansiyasiga taqdim etiladigan rasmiy shikoyat.",
    category: "Civil Law",
    popularity: 88,
    fields: [
      { id: "COURT_NAME", label: "Apellyatsiya sudi nomi", placeholder: "Masalan: Toshkent shahar sudi fuqarolik ishlari bo'yicha sudlov hay'atiga", type: "text", required: true },
      { id: "PLAINTIFF_NAME", label: "Shikoyat beruvchi (F.I.SH.)", placeholder: "Masalan: Karimov Alisher Anvarovich", type: "text", required: true },
      { id: "DEFENDANT_NAME", label: "Ikkinchi taraf (F.I.SH. yoki Tashkilot)", placeholder: "Masalan: Rustamov Baxtiyor G'ofurovich", type: "text", required: true },
      { id: "ORIGINAL_COURT_NAME", label: "Qaror chiqargan tuman sudi", placeholder: "Masalan: Fuqarolik ishlari bo'yicha Shayxontohur tuman sudi", type: "text", required: true },
      { id: "CASE_NUMBER", label: "Ish (qaror) raqami", placeholder: "Masalan: No 2-1002-2401/45", type: "text", required: true },
      { id: "DECISION_DATE", label: "Hal qiluv qarori sanasi", placeholder: "2026-05-15", type: "date", required: true },
      { id: "DECISION_SUMMARY", label: "Qarorning qisqacha mazmuni", placeholder: "Masalan: Sud javobgardan pul undirish haqidagi da'voyimni asossiz rad etgan.", type: "textarea", required: true },
      { id: "GROUNDS_FOR_APPEAL", label: "Shikoyat asoslari (Kamchiliklar)", placeholder: "Birinchi instansiya sudi vaziyatga oid muhim guvohlar va yozma dalillarni hisobga olmasdan asossiz qaror chiqargan.", type: "textarea", required: true },
      { id: "DEMANDS", label: "Sizning talabingiz (Nima so'raysiz)", placeholder: "Birinchi instansiya sudining qarorini bekor qilib, da'vo talablarimni qanoatlantirishingizni so'rayman.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "25.05.2026", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Shikoyat beruvchi: [PLAINTIFF_NAME]
Ikkinchi taraf: [DEFENDANT_NAME]

APELLYATSIYA SHIKOYATI
(Birinchi instansiya sudining hal qiluv qaroridan norozilik haqida)

[ORIGINAL_COURT_NAME] tomonidan [DECISION_DATE] yilda ko'rib chiqilgan, [CASE_NUMBER] sonli fuqarolik ishi bo'yicha sud quyidagicha hal qiluv qarori chiqargan:
[DECISION_SUMMARY]

Men ushbu hal qiluv qaroridan to'liq noroziman va uni asossiz hamda qonuniy normalarga zid ravishta chiqarilgan deb hisoblayman, chunki:
[GROUNDS_FOR_APPEAL]

O'zbekiston Respublikasi FPKning 383, 385, 386-moddalariga asosan, sud ish hujjatlarini har tomonlama tekshirmasdan va moddiy huquq normalarini noto'g'ri qo'llagan holda qaror chiqargan.

Yuqoridagilardan kelib chiqib, Rossiya / O'zbekiston Respublikasi FPKning tegishli moddalariga asosan,

SUNDAN SO'RAYMAN:

1. [DEMANDS]
2. Ish hujjatlarini apellyatsiya instansiyasida qayta ko'rib chiqishingizni.

Ilova qilinayotgan hujjatlar:
1. Apellyatsiya shikoyati nusxasi
2. Birinchi instansiya sudi chiqargan qaror nusxasi
3. Davlat boji to'langanligi kvitansiyasi
4. Ikkinchi tarafga shikoyat nusxasi yuborilganligini tasdiqlovchi pochta hujjatlari

Sana: [DATE]
Imzo: _________________ ([PLAINTIFF_NAME])`
  },
  {
    id: "civil_cassation_complaint",
    title: "Kassatsiya shikoyati (Cassation Complaint)",
    description: "Qonuniy kuchga kirgan sud qarorlaridan norozi bo'lganda, O'zbekiston Respublikasi Oliy sudiga taqdim etiladigan oliy shikoyat formati.",
    category: "Civil Law",
    popularity: 76,
    fields: [
      { id: "COURT_NAME", label: "Kassatsiya sudi nomi", placeholder: "O'zbekiston Respublikasi Oliy Sudining fuqarolik ishlari bo'yicha sudlov hay'atiga", type: "text", required: true },
      { id: "PLAINTIFF_NAME", label: "Shikoyatchi (F.I.SH. yoki Tashkilot)", placeholder: "Masalan: Usmonov Rustam", type: "text", required: true },
      { id: "DEFENDANT_NAME", label: "Javobgar (F.I.SH.)", placeholder: "Masalan: Toshkent Qurilish MCHJ", type: "text", required: true },
      { id: "PRIOR_COURT_DECISIONS", label: "Oldingi sud qarorlari haqida", placeholder: "Fuqarolik ishlari bo'yicha Mirzo Ulug'bek tuman sudining 2025-yil 12-noyabrdagi hamda Toshkent shahar sudi apellyatsiya hay'atining 2026-yil 15-fevraldagi qarorlari.", type: "textarea", required: true },
      { id: "CASSATION_GROUNDS", label: "Qonun buzilishlari (Nima noto'g'ri)", placeholder: "Moddiy va protsessual huquq normalari jiddiy ravishda buzilgan, tuman sudi va apellyatsiya instansiyasi dalillarni biryoqlama o'rgangan.", type: "textarea", required: true },
      { id: "REQUESTS", label: "Tizimdan talabingiz", placeholder: "Qarorlarni butunlay bekor qilib, ishni yangitdan ko'rib chiqish uchun yuborishingizni yoki yangi qaror qabul qilishingizni so'rayman", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Shikoyat beruvchi: [PLAINTIFF_NAME]
Ikkinchi taraf: [DEFENDANT_NAME]

KASSATSIYA SHIKOYATI
(Sud qarorlarini kassatsiya tartibida qayta ko'rib chiqish to'g'risida)

Fuqarolik ishlari bo'yicha nizoli masala yuzasidan sudlarda ko'rib chiqilgan qarorlar ro'yxati:
[PRIOR_COURT_DECISIONS]

Men mazkur qaror va ajrimlardan to'laqonli jiddiy noroziman. Ularni qonun normalarining chuqur buzilishi, haqiqiy vaziyatni asossiz talqin qilish oqibati deb hisoblayman. Jumladan:
[CASSATION_GROUNDS]

O'zbekiston Respublikasi FPKning 403, 405-moddalari talablariga binoan moddiy huquq normalarining noto'g'ri qo'llanilishi va protsessual huquq buzilishlari sud hujjatlarini kassatsiya tartibida bekor qilishga asos bo'lib xizmat qiladi.

Shunga muvofiq, O'zbekiston Respublikasi FPKning 407, 410-moddalariga tayanib,

OLANDAN SO'RAYMAN:

1. [REQUESTS]
2. Ish bo_yicha quyi instansiya sudlarining yakuniy hal qiluv choralarini bekor qilishni.

Ilova qilinadigan hujjatlar ro'yxati:
1. Kassatsiya shikoyati nusxasi
2. Tuman hamda shahar sudi qaror va ajrimlarining asl muhrli nusxalari
3. Davlat boji va pochta xarajatlari to'langani tasdiqlari

Sana: [DATE]
Muloqotchi: _________________ ([PLAINTIFF_NAME])`
  },
  {
    id: "civil_petition",
    title: "Iltimosnoma (Petition)",
    description: "Sud jarayonida guvohlarni chaqirish, ekspertiza tayinlash, yoki hujjatlarni talab qilish uchun topshiriladigan rasmiy iltimosnoma shakli.",
    category: "Civil Law",
    popularity: 91,
    fields: [
      { id: "COURT_NAME", label: "Sud nomi", placeholder: "Fuqarolik ishlari bo'yicha tuman sudi", type: "text", required: true },
      { id: "CASE_TITLE", label: "Ish nomi / Mavzusi", placeholder: "Masalan: Qobilovning pul undirish haqidagi ishi yuzasidan", type: "text", required: true },
      { id: "PETITIONER_NAME", label: "Iltimosnoma beruvchi tarafi", placeholder: "Masalan: Karimov Alisher Anvarovich (Da'vogar)", type: "text", required: true },
      { id: "PETITION_SUBJECT", label: "Iltimosnomaning maqsadi", placeholder: "Guvoh chaqirish / Qo'shimcha ekspertiza tayinlash to'g'risida", type: "text", required: true },
      { id: "REASON_DETAILS", label: "Asosli sabablar", placeholder: "Nizo bo'yicha asosiy hisob-kitoblar va imzolarni tasdiqlash uchun xatshunoslik ekspertizasi o'tkazish zarur.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga
Ish: [CASE_TITLE]
Iltimosnoma beruvchi: [PETITIONER_NAME]

ILTIMOSNOMA
([PETITION_SUBJECT])

Hozirda sud ko'rayotgan [CASE_TITLE] bo'yicha adolatli va qonuniy qaror qabul qilinishini ta'minlash, barcha holat hamda haqiqatni to'liq o'rganish maqsadida quyidagilarni bildirishni lozim topdim:
[REASON_DETAILS]

O'zbekiston Respublikasi Fuqarolik protsessual kodeksining 40-moddasiga binoan, ishda ishtirok etuvchi shaxslar iltimosnomalar taqdim etish hamda o'z dalillarining asosiyligini himoyalash huquqiga egadirlar.

Yuqoridagilarga tayangan holda va qonun talablaridan kelib chiqib,

SUDDAN ILTIMOS QILAMAN:

Mening mazkur [PETITION_SUBJECT] to'g'risidagi so'rovimni inobatga olib, sud majlisida ko'rib chiqishingizni hamda tegishli protsessual ajrim chiqarishingizni.

Sana: [DATE]
Ariza topshiruvchi: _________________ ([PETITIONER_NAME])`
  },
  {
    id: "civil_response_to_claim",
    title: "Da'voga raddiya (Response to Claim)",
    description: "Javobgarning da'vogar tomonidan taqdim etilgan da'vo arizasiga nisbatan o'z e'tirozi, asosi va raddiyalarini rasman ko'rsatuvchi hujjat.",
    category: "Civil Law",
    popularity: 81,
    fields: [
      { id: "COURT_NAME", label: "Sud nomi", placeholder: "Fuqarolik ishlari bo'yicha tuman sudi", type: "text", required: true },
      { id: "DEFENDANT_NAME", label: "Javobgar (F.I.SH. - Raddiya beruvchi)", placeholder: "Masalan: Solihov Akmal", type: "text", required: true },
      { id: "PLAINTIFF_NAME", label: "Da'vogar (F.I.SH.)", placeholder: "Masalan: Karimov Alisher Anvarovich", type: "text", required: true },
      { id: "CASE_NUMBER", label: "Fuqarolik ishi raqami", placeholder: "Masalan: № 2-2301-26-88", type: "text", required: true },
      { id: "REJECTION_ARGUMENTS", label: "Raddiya e'tirozlari tushuntirishi", placeholder: "Men aslidagi qarzning 10,000,000 so'm qismini kvitansiya orqali qaytarganman, qolgan asossiz foizlar va jarimalarga mutlaqo qo'shilmayman.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "10.06.2026", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Javobgardan: [DEFENDANT_NAME]
Da'vogar: [PLAINTIFF_NAME]
Ish raqami: [CASE_NUMBER]

DA'VO ARIZASI YUZASIDAN YOZMA RADDIYA / E'TIROZNOMA

[PLAINTIFF_NAME] tomonidan menga nisbatan qo'zg'atilgan [CASE_NUMBER] sonli fuqarolik ishi yuzasidan taqdim etilgan da'vo arizasidagi barcha da'volarni asossiz va noqonuniy deb hisoblab, ularga nisbatan quyidagi raddiyalarimni yozma taqdim etaman:
[REJECTION_ARGUMENTS]

Mazkur holatlar bo'yicha menda yetarli dalil, bank to'lov kvitansiyalari va guvohlik ko'rsatmalari mavjud bo'lib, da'vogarning talablari noo'rin va haqiqatga to'g'ri kelmaydi. FPKning normalariga ko'ra har bir taraf o'z talab va raddiyalarini dalillar bilan isbotlashi lozimdir.

Yuqoridagilardan kelib chiqib, FPKning 201-moddasi raddiya tartibiga tayanib,

SUDDAN SO'RAYMAN:

Da'vogar [PLAINTIFF_NAME]ning menga nisbatan kiritgan da'vo arizasi talablarini To'liq asossiz deb topib, qanoatlantirishni rad etishingizni so'rayman.

Ilovalar:
1. To'lov kvitansiyalari nusxalari
2. Guvohlik bayonotlari
3. Yozma raddiya nusxasi

Sana: [DATE]
Javobgar imzosi: _________________ ([DEFENDANT_NAME])`
  },

  // --- CRIMINAL LAW ---
  {
    id: "crim_complaint",
    title: "Jinoyat haqida ariza/shikoyat (Complaint)",
    description: "Huquqni muhofaza qilish organlariga (Ichki ishlar yoki Prokuratura) jinoyat sodir etilganligi to'g'risida beriladigan shikoyat-arizasi.",
    category: "Criminal Law",
    popularity: 94,
    fields: [
      { id: "ORGAN_NAME", label: "Organ nomi (IIB yoki Prokuratura)", placeholder: "Masalan: Shayxontohur tumani Prokuraturasiga", type: "text", required: true },
      { id: "VICTIM_NAME", label: "Jabrlanuvchi / Ariza beruvchi (F.I.SH.)", placeholder: "Azimov Sardor Shokirovich", type: "text", required: true },
      { id: "VICTIM_CONTACTS", label: "Manzil va Telefon", placeholder: "Yashnobod tumani, Sadosh ko'chasi 33-uy. Tel: +998 93 555-4422", type: "text", required: true },
      { id: "OFFENDER_NAME", label: "Gumon qilinuvchi / Huquqbuzar", placeholder: "Masalan: Noma'lum shaxs yoki Nosirov Jamil", type: "text", required: true },
      { id: "CRIME_DETAILS", label: "Jinoyat tafsilotlari", placeholder: "Shaxs aldov yo'li bilan plastik kartamdagi 12,500,000 so'm mablag'ni o'zlashtirib, firibgarlik sodir etdi.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[ORGAN_NAME] boshlig'iga

Ariza beruvchi: [VICTIM_NAME]
Manzil va aloqa: [VICTIM_CONTACTS]

JINOYAT SODIR ETILGANLIGI HAQIDA ARIZA

Men ushbu ariza orqali yozma ravishda quyidagilar haqida xabar beraman. [DATE] kuni taxminan quyidagi voqealar sodir bo'ldi:
[CRIME_DETAILS]

Ushbu qilmishda O'zbekiston Respublikasi Jinoyat kodeksining tegishli moddalari (firibgarlik, o'g'rilik yoki o'zgalar mulkiga zarar yetkazish) alomatlari yaqqol aks etmoqda. Shuningdek, ushbu holat menga katta miqdorda moddiy va ma'naviy zarar yetkazdi.

O'zbekiston Respublikasi Jinoyat-protsessual kodeksining 320, 321, 327-moddalariga asosan, jinoyat to'g'risidagi arizalar tergovga qadar tekshiruv va jinoyat ishi qo'zg'atish uchun asos bo'ladi. Men bilasizmi yolg'on ko'rsatma berganlik uchun O'zbekiston Respublikasi JK 237, 238-moddasiga ko'ra jinoiy javobgarlikka tortilishim haqida ogohlantirildim.

Yuqoridagilarni inobatga olgan holda,

SO'RAYMAN:

1. Gumonlanuvchi [OFFENDER_NAME]ga nisbatan qonuniy tergov harakatlari olib borib, tergov yakunida jinoyat ishi qo'zg'atishingizni.
2. Menga yetkazilgan moddiy va ma'naviy zararlarni to'liq undirish choralarni ko'rishingizni.

Ilovalar:
1. Plastik karta ko'chirmalari / Skrinshotlar
2. Sub'ektiv suhbat yozuvlari nusxasi

Sana: [DATE]
Ariza beruvchi imzosi: ______________ ([VICTIM_NAME])`
  },
  {
    id: "crim_petition",
    title: "Jinoyat ishi bo'yicha iltimosnoma (Petition)",
    description: "Tergov bosqichi yoki jinoyat sudi davomida himoyachi (advokat) yoki sudlanuvchi tomonidan kiritiladigan turli prosessual iltimosnomalar.",
    category: "Criminal Law",
    popularity: 84,
    fields: [
      { id: "COURT_NAME", label: "Tergov organi yoki Sud nomi", placeholder: "Masalan: Jinoyat ishlari bo'yicha Uchtepa tuman sudi", type: "text", required: true },
      { id: "CASE_TITLE", label: "Jinoyat ishi tafsiloti", placeholder: "Masalan: Nosirov Jamilga nisbatan JK 168-moddasi bo'yicha jinoyat ishi yuzasidan", type: "text", required: true },
      { id: "PETITIONER_NAME", label: "Murojaat qiluvchi (Advokat yoki Ayblanuvchi F.I.SH)", placeholder: "Masalan: Advokat Rahmonov Elyor (Ayblanuvchi himoyachisi)", type: "text", required: true },
      { id: "PETITION_OBJECTIVE", label: "Iltimosnoma predmeti", placeholder: "Kardinal dalillarni ilova qilish / Ekspertizani asossiz rad etishga e'tiroz", type: "text", required: true },
      { id: "REASON_DETAILS", label: "Iltimos qilishning asosli sabablari", placeholder: "Ish materiallaridagi video tasmalar montaj qilinmaganligini tasdiqlash uchun mustaqil fono-videotexnika ekspertizasi o'tkazishni so'raymiz.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga
Ish bo'yicha: [CASE_TITLE]
Kimdan: [PETITIONER_NAME]

ILTIMOSNOMA
([PETITION_OBJECTIVE] to'g'risida)

Mazkur ko'rib chiqilayotgan [CASE_TITLE] bo'yicha quyidagilarni bildiramiz. Jinoyat sodir etilganligi taxmin qilinayotgan muddatda ayblanuvchining aslidagi aybsizligini yoki ish uchun favqulodda o'ta muhim ahamiyat kasb etuvchi faktlarni tasdiqlash uchun:
[REASON_DETAILS]

O'zbekiston Respublikasi JPKning 85, 90, JPKning 121-moddasi normalariga asosan, himoyachi va gumon qilinuvchi o'z so'rovlarini isbotlash, ekspertizalar o'tkazishni so'rash kabi protsessual huquqlarga ega.

Yuqoridagilardan kelib chiqib,

ILTIMOS QILAMIZ:

Qonunda belgilangan tartibda ushbu [PETITION_OBJECTIVE] bo'yicha keltirilgan so'rovlarimizni qanoatlantirib, tegishli protsessual choralarni belgilashingizni so'rayman.

Sana: [DATE]
Muxbirlar imzosi: _________________ ([PETITIONER_NAME])`
  },
  {
    id: "crim_appeal",
    title: "Jinoyat ishi yuzasidan apellyatsiya (Appeal)",
    description: "Jinoyat ishlari bo'yicha birinchi instansiya sudining hukmi ustidan yuqori sud hay'atiga kiritiladigan apellyatsiya shikoyati.",
    category: "Criminal Law",
    popularity: 79,
    fields: [
      { id: "COURT_NAME", label: "Yuqori sud (Apellyatsiya organi)", placeholder: "Masalan: Toshkent shahar sudi jinoyat ishlari bo'yicha sudlov hay'atiga", type: "text", required: true },
      { id: "APPELLANT_NAME", label: "Shikoyat beruvchi ayblanuvchi/advokat", placeholder: "Nosirov Jamil (yoki uning advokati Tursunov)", type: "text", required: true },
      { id: "ORIGINAL_COURT", label: "Hukm chiqargan quyi sud", placeholder: "Jinoyat ishlari bo'yicha Uchtepa tuman sudi", type: "text", required: true },
      { id: "SENTENCE_DATE", label: "Sud hukmi chiqqan sana", placeholder: "2026-05-10", type: "date", required: true },
      { id: "SENTENCE_SUMMARY", label: "Hukm qisqacha mazmuni", placeholder: "Menga nisbatan JK 168-moddasi 2-qismi bilan asossiz 3 yil muddatga ozodlikdan mahrum qilish jazosi tayinlangan.", type: "textarea", required: true },
      { id: "DISAGREEMENT_ARGUMENTS", label: "Norozilik sabablari va xatolar", placeholder: "Sud ishni biryoqlama o'rgangan, tergov bosqichidagi jismoniy tazyiqlar va asossiz ko'rsatmalarga asolanib hukm chiqargan. Advokat taqdim etgan ishonchli alibi inobatga olinmagan.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Shikoyat beruvchi (mahkum yoki uning himoyachisi): [APPELLANT_NAME]

APELLYATSIYA SHIKOYATI
(Jinoyat sudi hukmidan norozilik to'g'risida)

[ORIGINAL_COURT] tomonidan sudlanuvchiga nisbatan [SENTENCE_DATE] yilda e'lon qilingan asossiz sud hukmiga muvofiq quyidagi ayblov choralari ko'rilgan:
[SENTENCE_SUMMARY]

Ushbu hukmdan mutlaqo asossiz, noqonuniy deb hisoblaganim sababli qisman yoki to'liq noroziman. Sud jarayonida O'zbekiston Respublikasi JPKning qator protsessual moddalari jiddiy ravishda buzildi va dalillar ishonchli o'rganilmadi:
[DISAGREEMENT_ARGUMENTS]

O'zbekiston Respublikasi JPKning 497-1, 497-2 va 497-4 moddalari talablariga binoan mahkum hamda uning advokati sud hukmi ustidan uning qonuniy kuchga kirgunga qadar apellyatsiya tartibida shikoyat bildirish imkoniyatiga egadirlar.

Shunga tayanib,

SUNDAN SO'RAYMAN:

1. [ORIGINAL_COURT]ning [SENTENCE_DATE] kungi asossiz sud hukmini butunlay bekor qilib, oqlov hukmi chiqarishingizni yoki jazo chorasini yengillashtirishingizni.

Ilova qilinayotgan ashyolar:
1. Apellyatsiya shikoyati nusxalari
2. Sud hukmi nusxasi
3. Ishga taalluqli qo'shimcha yangi dalillar

Sana: [DATE]
Imzo: _________________ ([APPELLANT_NAME])`
  },

  // --- ADMINISTRATIVE LAW ---
  {
    id: "admin_complaint",
    title: "Ma'muriy shikoyat (Administrative Complaint)",
    description: "Davlat idorasi yoki mansabdor shaxsining noqonuniy xatti-harakati yoki asossiz qarorlari ustidan ma'muriy sudga yuboriladigan ariza-shikoyat.",
    category: "Administrative Law",
    popularity: 90,
    fields: [
      { id: "COURT_NAME", label: "Ma'muriy sud nomi", placeholder: "Masalan: Toshkent tumanlararo ma'muriy sudi", type: "text", required: true },
      { id: "APPLICANT_NAME", label: "Ariza beruvchi (F.I.SH. yoki Firma)", placeholder: "Masalan: Bobomurodov Shavkat", type: "text", required: true },
      { id: "RESPONDENT_AGENCY", label: "Javobgar davlat idorasi / Mansabdor", placeholder: "Masalan: Kadastr agentligi tuman bo'limi", type: "text", required: true },
      { id: "ILLEGAL_COMPLAINT_DETAILS", label: "Noqonuniy qaror yoki harakat tafsiloti", placeholder: "Kadastr idorasi asossiz va taqdim etilgan mulk hujjatlariga qaramay tuman hokimining qaroriga asosan yer uchastkasiga kadastr pasporti berishni rad etdi.", type: "textarea", required: true },
      { id: "LEGAL_VIOLATIONS", label: "Buzilgan qonuniy me'yorlar", placeholder: "Bu holat O'zbekiston Respublikasi Ma'muriy tartib-taomillar to'g'risidagi qonuni hamda fuqarolar huquqlarini jiddiy buzmoqda.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Ariza topshiruvchi: [APPLICANT_NAME]
Javobgar (Ma'muriy organ): [RESPONDENT_AGENCY]

MA'MURIY ARIZA
(Davlat organi yoki mansabdor shaxsining g'ayriqonuniy harakatlarini (qarorlarini) haqiqiy emas deb topish to'g'risida)

Men quyidagi asosiylarni bayon qilaman. [RESPONDENT_AGENCY] tomonidan mening qonuniy manfaatlarim hamda erkinliklarimga putur yetkazuchi quyidagi g'ayriqonuniy qaror/harakat sodir etildi:
[ILLEGAL_COMPLAINT_DETAILS]

Ushbu amaliyotlar mutlaqo noqonuniy, haqiqiy holatga asosan bo'lib, davlat idorasining vakolati asossiz ishlatilgan:
[LEGAL_VIOLATIONS]

O'zbekiston Respublikasining MSIPK (Ma'muriy sud ishlarini yuritish to'g'risidagi kodeks) 128 va 129-moddalariga binoan, fuqarolar va yuridik shaxslar o'zlarining huquqlari hamda qonun bilan qo'riqlanadigan manfaatlari buzilgan deb hisoblasalar, sudga murojaat qilishga to'liq haqlidirlar.

Yuqoridagilarga tayanib,

SUDDAN SO'RAYMAN:

1. [RESPONDENT_AGENCY]ning yuqoridagi noqonuniy qarorini (rad etish harakatlarini) haqiqiy emas deb topib, mening arizamni qanoatlantirish majburiyatini yuklashingizni.

Ilova:
1. Ariza nusxasi
2. Nizoli qaror yoki rad etish xatining nusxasi
3. Mulk va shaxsiy hujjatlar tasdiqlari
4. Davlat boji isboti

Sana: [DATE]
Ariza beruvchi: _________________ ([APPLICANT_NAME])`
  },
  {
    id: "admin_appeal",
    title: "Ma'muriy apellyatsiya (Administrative Appeal)",
    description: "Ma'muriy sudning hal qiluv qaroridan norozi bo'lgan taqdirda yuqori instansiya ma'muriy sud hay'atiga yuboriladigan apellyatsiya.",
    category: "Administrative Law",
    popularity: 78,
    fields: [
      { id: "COURT_NAME", label: "Yuqori ma'muriy sud nomi", placeholder: "Masalan: Toshkent shahar ma'muriy sudi apellyatsiya instantsiyasiga", type: "text", required: true },
      { id: "APPLICANT_NAME", label: "Apellyatsiya beruvchi", placeholder: "Masalan: Bobomurodov Shavkat", type: "text", required: true },
      { id: "ORIGINAL_COURT", label: "Qaror chiqargan birinchi sud", placeholder: "Tashkent tumanlararo ma'muriy sudi", type: "text", required: true },
      { id: "DECISION_DATE", label: "Birinchi sud qarori chiqarilgan sana", placeholder: "2026-05-10", type: "date", required: true },
      { id: "DECISION_SUMMARY", label: "Sud chiqargan qaror mazmuni", placeholder: "Sud kadastr idorasining noqonuniy rad javobini asossiz ravishda to'g'ri deb baholagan da'voyimni rad etish qarorini chiqardi.", type: "textarea", required: true },
      { id: "APPEAL_BASIS", label: "Qarorning xato va asossiz joylari", placeholder: "Sud ishdagi asosiy mulkka egalik huquqini belgilovchi arxiv hujjatlariga asossiz baho berib, qonunni biryoqlama talqin qilgan.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Apellyant (Shikoyatchi): [APPLICANT_NAME]

APELLYATSIYA SHIKOYATI
(Ma'muriy sud qaroridan tushirilgan shikoyat)

[ORIGINAL_COURT] tomonidan ko'rib chiqilgan, [DECISION_DATE] yildagi ma'muriy nizo bo'yicha quyidagicha adolatsiz hal qiluv qarori e'lon qilingan edi:
[DECISION_SUMMARY]

Ushbu qarordan mutlaqo noroziman va uning noqonuniyligini ko'rsatuvchi asoslarni quyidagicha taqdim etaman:
[APPEAL_BASIS]

O'zbekiston Respublikasi MSIPK normativ moddalariga muvofiq, taraflar birinchi instansiya sudining qonuniy kuchga kirmagan hal qiluv qaroridan norozi bo'lgan taqdirda, apellyatsiya tartibida yuqori mudofaa sudiga murojaat qilish imkoniyatlariga egadirlar.

Yuqoridagilarni hisobga olib,

SUDDAN SO'RAYMAN:

[ORIGINAL_COURT]ning [DECISION_DATE] yildagi hal qiluv qarorini butunlay o'zgartirib yoki bekor qilib, yangi adolatli qaror qabul qilishingizni so'rayman.

Sana: [DATE]
Imzo: _________________ ([APPLICANT_NAME])`
  },

  // --- LABOUR LAW ---
  {
    id: "labour_employment_complaint",
    title: "Mehnat nizosi bo'yicha shikoyat (Employment Complaint)",
    description: "Mehnat inspeksiyasiga yoki sudga ish beruvchining oylik maoshni bermasligi, noqonuniy muddatdan ortiq ishlatishi kabi huquqbuzarliklardan shikoyat qilish.",
    category: "Labour Law",
    popularity: 92,
    fields: [
      { id: "ORGAN_NAME", label: "Siyosiy organ yoki Sud nomi", placeholder: "Masalan: Bandlik va mehnat munosabatlari vazirligi tuman inspeksiyasiga", type: "text", required: true },
      { id: "EMPLOYEE_NAME", label: "Xodim (Ariza beruvchi)", placeholder: "Masalan: To'rayev Bekzod Baxtiyorovich", type: "text", required: true },
      { id: "EMPLOYER_NAME", label: "Ish beruvchi korxona nomi", placeholder: "Masalan: Techno Soft MCHJ direktori", type: "text", required: true },
      { id: "VIOLATION_DETAILS", label: "Mehnat huquqlari buzilishi choralari", placeholder: "Ish beruvchi so'nggi 3 oy mobaynida qonuniy belgilangan oylik maoshlarimni to'lamasdan asossiz kechiktirib kelmoqda hamda ish vaqtidan tashqari majburiy mehnatga jalb qilgan.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[ORGAN_NAME] boshlig'iga

Xodimdan: [EMPLOYEE_NAME]
Murojaat qilingan ish beruvchi: [EMPLOYER_NAME]

MEHNAT HUQUQLARI BUZILGANLIGI BO'YICHA ARIZAVIY SHIKOYAT

Men [EMPLOYER_NAME] tarkibida mehnat shartnomasiga asosan faoliyat ko'rsatib kelaman. Ushbu mehnat faoliyatim jarayonida ish beruvchi tomonidan amaldagi Mehnat Kodeksi talablarini buzuvchi quyidagi salbiy harakatlar sodir etildi:
[VIOLATION_DETAILS]

O'zbekiston Respublikasi yangi tahrirdagi Mehnat kodeksiga asosan ish beruvchilar oylik ish haqlarini belgilangan muddatlarda to'lashga va ishchilarni qulona yoki asossiz mehnat rejimlariga majburlamaslikka qat'iyan javobgardirlar.

Yuqoridagilardan kelib chiqib,

SO'RAYMAN:

1. [EMPLOYER_NAME] faoliyatini zudlik bilan qonuniy tekshiruvdan o'tkazib, menga berilmagan oylik maoshlarim va unga tegishli kompensatsiyalarni majburiy undirish choralarni ko'rishingizni.
2. Ish beruvchini mehnat qonunchiligini buzganligi uchun ma'muriy javobgarlikka tortishingizni.

Sana: [DATE]
Xodim imzosi: _________________ ([EMPLOYEE_NAME])`
  },
  {
    id: "labour_reinstatement_claim",
    title: "Ishga tiklash to'g'risida da'vo (Reinstatement Claim)",
    description: "Noqonuniy ravishda bo'shatilgan xodimni avvalgi ish o'rniga qayta tiklash, majburiy bo'sh yurgan kunlari uchun haq va ma'naviy zarar undirish da'vosi.",
    category: "Labour Law",
    popularity: 87,
    fields: [
      { id: "COURT_NAME", label: "Fuqarolik sudi nomi", placeholder: "Fuqarolik ishlari bo'yicha tuman sudi", type: "text", required: true },
      { id: "EMPLOYEE_NAME", label: "Da'vogar (Xodim)", placeholder: "Masalan: To'rayev Bekzod Baxtiyorovich", type: "text", required: true },
      { id: "EMPLOYER_NAME", label: "Javobgar (Ish beruvchi firma)", placeholder: "Masalan: Techno Soft MCHJ", type: "text", required: true },
      { id: "DISMISSAL_INFO", label: "Bo'shatilish asosi va sanasi", placeholder: "Ish beruvchining 2026-yil 12-maydagi № 44-sonli buyrug'i bilan noqonuniy ravishda MK 161-moddasi bilan ishdan bo'shatildim.", type: "textarea", required: true },
      { id: "DISPUTE_REASONS", label: "Nega bo'shatilish asossiz", placeholder: "Kompaniya shtat qisqartirildi deb bahona ko'rsatgan, lekin amalda mening o'rnimga begona xodim ishga qabul qilindi. Bo'shatishdan oldin kasaba uyushmasi roziligi asossiz olinmagan.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `[COURT_NAME]ga

Da'vogar: [EMPLOYEE_NAME]
Javobgar (Ish beruvchi): [EMPLOYER_NAME]

DA'VO ARIZASI
(Ishga tiklash, majburiy bo'sh yurgan kunlar uchun o'rtacha oylik ish haqi hamda ma'naviy zararlarni undirish haqida)

Men javobgar tashkilot [EMPLOYER_NAME] tomonidan nohaq quyidagi sharoitda ishdan chetlatildim:
[DISMISSAL_INFO]

Ushbu ish beruvchi buyrug'ini mutlaqo asossiz va qonunga zid deb hisoblashimning qonuniy sabablari quyidagilardan iborat:
[DISPUTE_REASONS]

O'zbekiston Respublikasi Mehnat kodeksining tegishli normalariga muvofiq, ishdan asossiz bo'shatilgan xodimlar sud tartibida o'z lavozimlariga qayta tiklanish, majburiy ravishda bo'sh qolgan kunlariga to'lov undirish va moddiy/ma'naviy haq-huquqlarini tiklash huquqiga mo'ljallangan.

Yuqoridagilarga asosan va FPK talablariga tayanib,

SUDDAN SO'RAYMAN:

1. Meni [EMPLOYER_NAME]dagi avvalgi lavozimimga qayta tiklashingizni.
2. Ish beruvchidan majburiy bo'sh yurgan kunlarim uchun o'rtacha hisoblangan oylik ish haqimni hamda menga yetkazilgan ziyonlarni to'liq undirishingizni.

Sana: [DATE]
Da'vogar xodim signature: _________________ ([EMPLOYEE_NAME])`
  },

  // --- CONTRACT LAW ---
  {
    id: "contract_service_agreement",
    title: "Xizmat ko'rsatish shartnomasi (Service Agreement)",
    description: "Buyurtmachi va Ijrochi o'rtasida pullik xizmatlar (IT, konsalting, logistika va boshqalar) ko'rsatish to'g'risidagi ikki tomonlama shartnoma.",
    category: "Contract Law",
    popularity: 95,
    fields: [
      { id: "CLIENT_NAME", label: "Buyurtmachi (Kompaniya yoki shaxs)", placeholder: "Masalan: Universal Trading MCHJ", type: "text", required: true },
      { id: "PROVIDER_NAME", label: "Ijrochi (Kompaniya yoki mutaxassis)", placeholder: "Masalan: Karimov Mansur (YTT)", type: "text", required: true },
      { id: "SERVICES_SCOPE", label: "Xizmatlar to'liq mazmuni", placeholder: "Mijozning veb-saytini optimizatsiya qilish, dasturiy yechimlar va oylik texnik qo'llab-quvvatlash xizmati.", type: "textarea", required: true },
      { id: "SERVICE_FEE", label: "Xizmat haqi va to'lov tartibi", placeholder: "Har oyda 5,000,000 so'm, hisob-faktura imzolangandan so'ng 5 ish kunida.", type: "text", required: true },
      { id: "START_DATE", label: "Boshlanish sanasi", placeholder: "2026-06-15", type: "date", required: true },
      { id: "END_DATE", label: "Tugash sanasi (Muddat)", placeholder: "25.12.2026", type: "date", required: true },
      { id: "DATE", label: "Shartnoma tuzilgan sana", placeholder: "10.06.2026", type: "date", required: true }
    ],
    textTemplate: `XIZMAT KO'RSATISH SHARTNOMASI

Tuzilgan joyi: Toshkent shahri       Sana: [DATE]

Bir tomondan Buyurtmachi: [CLIENT_NAME] hamda ikkinchi tomondan Ijrochi: [PROVIDER_NAME] o'rtasida quyidagicha shartnoma shartlari qabul qilindi.

1. SHARTNOMA MAZMUNI
1.1. Ijrochi buyurtmachining topshirig'iga ko'ra o'z majburiyatiga muvofiq quyidagi tizimli xizmatlarni amalga oshiradi:
[SERVICES_SCOPE]
1.2. Xizmatlar [START_DATE] sanasidan boshlanib, [END_DATE] sanasigacha davom etadi.

2. MOLIYAVIY TARTIB VA TO'LOV
2.1. Buyurtmachi ko'rsatilgan haqiqiy xizmatlar uchun Ijrochiga quyidagi hisobda to'lov to'lashni o'z zimmasiga oladi:
[SERVICE_FEE]

3. TARAFLARNING JAVOBGARLIGI
3.1. Majburiyatlarni bajarmagan taraf ikkinchi tarafga yetkazilgan zararni amaldagi O'zbekiston Respublikasi FK moddalariga ko'ra to'liq qoplab berishi shart.
3.2. Fors-major holatlari vujudga kelganda taraflar javobgarlikdan tegishli tartibda ozod etiladilar.

TARAFLAR REKVIZITLARI:

BUYURTMACHI:
Nomi: [CLIENT_NAME]
Imzo: _____________________

IJROCHI:
Nomi: [PROVIDER_NAME]
Imzo: _____________________`
  },
  {
    id: "contract_employment_agreement",
    title: "Mehnat shartnomasi (Employment Agreement)",
    description: "Xodim va Ish beruvchi tashkilot o'rtasidagi rasmiy ishga qabul qilish mehnat kontraktining namunaviy andozasi.",
    category: "Contract Law",
    popularity: 90,
    fields: [
      { id: "EMPLOYER_NAME", label: "Ish beruvchi tashkilot (Kompaniya)", placeholder: "Masalan: Smart System Development MCHJ Direktori", type: "text", required: true },
      { id: "EMPLOYEE_NAME", label: "Xodim F.I.SH.", placeholder: "Masalan: Yo'ldoshev Kamoliddin", type: "text", required: true },
      { id: "POSITION", label: "Ish lavozimi (Mutaxassislik)", placeholder: "Katta dasturchi (Senior Developer)", type: "text", required: true },
      { id: "SALARY", label: "Ish haqi (Oylik maoshi)", placeholder: "Masalan: 12,000,000 so'm sof maosh", type: "text", required: true },
      { id: "START_DATE", label: "Ish boshlash sanasi", placeholder: "2026-06-15", type: "date", required: true },
      { id: "DATE", label: "Shartnoma sanasi", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `MEHNAT SHARTNOMASI

Toshkent sh.                                              Sana: [DATE]

Ish beruvchi [EMPLOYER_NAME] nomidan uning rahlari hamda Xodim [EMPLOYEE_NAME] o'rtasida yangi tahrirdagi O'zbekiston Respublikasi Mehnat Kodeksiga muvofiq mehnat shartnomasi imzolandi.

1. SHARTNOMA MAQSADI VA ISH JOYI
1.1. Xodim [POSITION] lavozimiga ishga qabul qilinadi.
1.2. Ishning boshlanish sanasi: [START_DATE].

2. MEHNATGA HAK TO'LASH TARTIBI
2.1. Xodimga amalga oshirgan ishlari uchun har oyda quyidagi miqdorda ish haqi belgilanadi:
[SALARY]
2.2. Qo'shimcha ustamalarni to'lash korxona ichki nizo va nizomlariga ko'ra tartibga solinadi.

3. ISH VAQTI VA DAM OLISHLAR
3.1. Xodim uchun haftalik 40 soatlik ish rejimi hamda qonun hujjatlariga asosan har yili kamida 24 ish kunidan iborat mehnat ta'tili kafolatlanadi.

TARAFLAR IMZOLARI:

ISH BERUVCHI:
[EMPLOYER_NAME]
Imzo: _____________________

XODIM:
[EMPLOYEE_NAME]
Imzo: _____________________`
  },
  {
    id: "contract_nda_agreement",
    title: "Sir saqlash to'g'risidagi kelishuv (NDA)",
    description: "Kompaniya va hamkor (yoki xodim) o'rtasida tijorat sirlari va maxfiy ma'lumotlarni tashqariga chiqarmaslik to'g'risidagi huquqiy kelishuv.",
    category: "Contract Law",
    popularity: 86,
    fields: [
      { id: "PARTY_A", label: "Birinchi taraf (Misol: Kompaniya)", placeholder: "System Intellect MCHJ", type: "text", required: true },
      { id: "PARTY_B", label: "Ikkinchi taraf (Misol: Mustaqil mutaxassis)", placeholder: "Karimov Sherzod", type: "text", required: true },
      { id: "CONFIDENTIAL_INFO", label: "Maxfiy hisoblanadigan ma'lumotlar", placeholder: "Kompaniya dasturiy ta'minot kodlari, mijozlar ma'lumotlar bazasi va yangi chiqarilayotgan yuridik algoritm tizimlari.", type: "textarea", required: true },
      { id: "PENALTY_AMOUNT", label: "Jarimalar miqdori (Sirlar oshkor etilganda)", placeholder: "Masalan: 50,000,000 so'm jarima to'laydi", type: "text", required: true },
      { id: "VALIDITY_PERIOD", label: "Kelishuv amal qilish muddati", placeholder: "Shartnoma tugagandan so'ng 3 yil davomida", type: "text", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `MAXFIYLIKNI SAQLASH TO'G'RISIDAGI BITIM (NDA)

Toshkent shahri                                                   Sana: [DATE]

Mazkur kelishuv bir tomondan [PARTY_A] hamda ikkinchi tomondan [PARTY_B] o'rtasida tijorat sirlarini asrash maqsadida imzolandi.

1. MAXFIY MA'LUMOTLAR TUSHUNCHASI
1.1. Shartnomaga muvofiq quyidagi ma'lumotlar strictly maxfiy hisoblanadi va [PARTY_B] ularni uchinchi shaxslarga bera olmaydi:
[CONFIDENTIAL_INFO]

2. TARAFLAR MAJBURIYATI
2.1. Qabul qiluvchi taraf mazkur maxfiy ma'lumotlarni jamoatga ma'lum qilmaslik hamda tijorat maqsadlarida suiiste'mol qilmaslik majburiyatini to'liq bo'yniga oladi. Kelishuv [VALIDITY_PERIOD] amal qiladi.

3. JAVOBGARLIK VA SANKTSIYALAR
3.1. Maxfiy ma'lumotlarni tarqatishi natijasida yetkazilgan barcha zarardan tashqari, aybdor taraf jarima sifatida quyidagini to'laydi:
[PENALTY_AMOUNT]

TARAFLAR TANTRALARI:

Taraf A: [PARTY_A]
Imzo: _____________________

Taraf B: [PARTY_B]
Imzo: _____________________`
  },
  {
    id: "contract_partnership_agreement",
    title: "Hamkorlik shartnomasi (Partnership Agreement)",
    description: "Ikki yoki undan ortiq tomonlarning hamkorlikda loyihalarni amalga oshirishi va daromadlarni taqsimlashi haqidagi kelishuv shartnomasi.",
    category: "Contract Law",
    popularity: 83,
    fields: [
      { id: "PARTNER_A", label: "Hamkor A", placeholder: "Masalan: Tech Spark MCHJ", type: "text", required: true },
      { id: "PARTNER_B", label: "Hamkor B", placeholder: "Masalan: Global Logistic MCHJ", type: "text", required: true },
      { id: "PROJECT_GOAL", label: "Hamkorlik loyihasi maqsadi", placeholder: "Birgalikda yuridik tizimlar uchun integratsion dastur ishlab chiqish va bozorga chiqarish", type: "textarea", required: true },
      { id: "PROFIT_SPLIT", label: "Daromad va Majburiyatlarning taqsimlanishi", placeholder: "Loyiha daromadi 55% Hamkor A va 45% Hamkor B ulushida teng taqsimlanadi.", type: "textarea", required: true },
      { id: "DATE", label: "Sana", placeholder: "2026-06-10", type: "date", required: true }
    ],
    textTemplate: `HAMKORLIK VA BIRGALIKDA FAOLIYAT OLIB BORISH SHARTNOMASI

Sana: [DATE]

Tadbirkorlik faoliyati hamkorlari [PARTNER_A] va [PARTNER_B] o'zaro ishonch asosida quyidagi hamkorlik shartnomasini tasdiqlaydilar:

1. SHARTNOMA MAQSADI
1.1. Taraflar quyidagi o'zaro manfaatli loyihani amalga oshirishda birlashadilar:
[PROJECT_GOAL]

2. MAJBURIYAT VA TAIMINOTLAR
2.1. Taraflarning qo'shgan hissalari, daromadlar va loyiha xarajatlarini taqsimlash tartibi quyidagicha kelishildi:
[PROFIT_SPLIT]

3. NIZOLARINI HAL ETISH
3.1. Shartnoma yuzasidan vujudga keladigan barcha kelishmovchiliklar muzokaralar yo'li bilan hal etiladi. Hal bo'lmasa, ma'muriy/iqtisodiy sudlar tartibida hal qilinadi.

HAMKOR A:
Nomi: [PARTNER_A]
Imzo: _______________________

HAMKOR B:
Nomi: [PARTNER_B]
Imzo: _______________________`
  }
];
