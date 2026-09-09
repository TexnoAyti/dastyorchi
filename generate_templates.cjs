const fs = require('fs');

const categories = {
  "fuqarolik": [
    "qarz_undirish", "zarar_undirish", "ma'naviy_zarar", "qarz_shartnoma_nizo",
    "mulkiy_huquqni_tan_olish", "egalikdan_chiqarish", "noqonuniy_egallash",
    "qarzni_foiz_bilan_undirish", "da'vo_rad_etish", "qarz_muddati_uzaytirish",
    "qarz_qayta_hisoblash", "qarzni_bo'lib_to'lash", "qarzni_kechiktirish",
    "da'vo_ariza_qaytarish", "da'vo_ozgartirish", "qarz_tan_olish",
    "qarzni_undirish_bank_orqali", "qarz_kafillik_nizo", "qarz_meros_nizo",
    "qarz_notarial", "qarz_tadbirkorlik", "qarz_sud_buyruq", "qarz_sud_ijro",
    "qarz_kafolat", "qarz_dalil_taqdim"
  ],
  "oila": [
    "aliment_undirish", "aliment_oshirish", "aliment_kamaytirish",
    "aliment_qarzdorlik", "aliment_to'lashdan_ozod", "nikohni_bekor_qilish",
    "nikohni_haqiqiy_emas", "farzandni_olib_qolish", "ota_onalikni_belgilash",
    "ota_onalikni_rad", "farzand_bilan_uchrashuv", "vasiylik_tayinlash",
    "vasiylikni_bekor", "bolani_olib_qolish", "bola_tarbiya_huquqi",
    "bola_yashash_joyi", "bola_xorijga_chiqish", "bola_familiya_ozgartirish",
    "aliment_penalty", "aliment_sud_buyruq"
  ],
  "mehnat": [
    "ish_haqi_undirish", "ishdan_noqonuniy_boshatish", "ishga_tiklash",
    "mehnat_shartnoma_nizo", "ish_vaqti_nizo", "ortiqcha_ish_haqi",
    "ta'til_puli", "kompensatsiya", "mehnat_daftarchasi", "ish_beruvchi_shikoyat",
    "mehnat_intizomi", "ish_jarohati", "ishdan_majburiy_ketish",
    "ishdan_bo'shatish_nizo", "mehnat_sud"
  ],
  "ma'muriy": [
    "jarima_bekor", "jarima_kamaytirish", "jarima_shikoyat",
    "organ_qarori_shikoyat", "yo'l_harakati_jarima", "soliq_jarima",
    "bojxona_nizo", "huquqbuzarlik_rad", "protokol_bekor", "litsenziya_nizo",
    "ruxsatnoma_nizo", "davlat_organ_shikoyat", "ma'muriy_ish_yopish",
    "jarima_kechiktirish", "jarima_bo'lib_to'lash"
  ],
  "uy-joy": [
    "uydan_chiqarish", "uyga_kiritish", "ijara_nizo", "kommunal_qarz",
    "uy_egalik_nizo", "kvartira_taqsimlash", "uy_foydalanish", "qo'shni_nizo",
    "uy_buzish", "uy_ta'mirlash"
  ],
  "bank": [
    "kredit_nizo", "foiz_kamaytirish", "qarzni_qayta_tuzish", "bank_xatolik",
    "hisob_bloklash", "kredit_shartnoma_bekor", "kredit_kechiktirish",
    "mikroqarz_nizo", "bank_shikoyat", "qarzni_restrukturizatsiya"
  ],
  "meros": [
    "merosni_qabul", "merosni_rad", "meros_talash", "meros_muddat_tiklash",
    "meros_huquq_tan_olish", "vasiyatnoma_nizo", "vasiyatnoma_bekor",
    "meros_ulush", "meros_mulk", "meros_notarial"
  ],
  "shartnoma": [
    "shartnoma_bekor", "shartnoma_buzilish", "shartnoma_nizo", "jarima_undirish",
    "majburiyat_bajarmaslik", "oldi_sotdi_nizo", "ijara_shartnoma",
    "xizmat_shartnoma", "shartnoma_ozgartirish", "shartnoma_dalil"
  ]
};

function formatName(id) {
  return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getFields(category) {
  const defaultFields = [
    { id: "da_vogar", label: { uz_lat: "Da'vogar", uz_cyr: "Даъвогар", ru: "Истец" }, type: "text", required: true },
    { id: "javobgar", label: { uz_lat: "Javobgar", uz_cyr: "Жавобгар", ru: "Ответчик" }, type: "text", required: true },
    { id: "mazmun", label: { uz_lat: "Ariza mazmuni", uz_cyr: "Ариза мазмуни", ru: "Содержание заявления" }, type: "textarea", required: true }
  ];

  if (category === 'mehnat') {
    return [
      { id: "xodim", label: { uz_lat: "Xodim", uz_cyr: "Ходим", ru: "Работник" }, type: "text", required: true },
      { id: "ish_beruvchi", label: { uz_lat: "Ish beruvchi", uz_cyr: "Иш берувчи", ru: "Работодатель" }, type: "text", required: true },
      { id: "mazmun", label: { uz_lat: "Ariza mazmuni", uz_cyr: "Ариза мазмуни", ru: "Содержание заявления" }, type: "textarea", required: true }
    ];
  }
  if (category === "ma'muriy") {
    return [
      { id: "shaxs", label: { uz_lat: "Shaxs", uz_cyr: "Шахс", ru: "Лицо" }, type: "text", required: true },
      { id: "organ", label: { uz_lat: "Tashkilot/Organ", uz_cyr: "Ташкилот/Орган", ru: "Организация/Орган" }, type: "text", required: true },
      { id: "mazmun", label: { uz_lat: "Ariza mazmuni", uz_cyr: "Ариза мазмуни", ru: "Содержание заявления" }, type: "textarea", required: true }
    ];
  }
  if (category === 'bank') {
    return [
      { id: "mijoz", label: { uz_lat: "Mijoz", uz_cyr: "Мижоз", ru: "Клиент" }, type: "text", required: true },
      { id: "bank", label: { uz_lat: "Bank", uz_cyr: "Банк", ru: "Банк" }, type: "text", required: true },
      { id: "mazmun", label: { uz_lat: "Ariza mazmuni", uz_cyr: "Ариза мазмуни", ru: "Содержание заявления" }, type: "textarea", required: true }
    ];
  }
  if (category === 'shartnoma') {
    return [
      { id: "tomon1", label: { uz_lat: "1-tomon", uz_cyr: "1-томон", ru: "Сторона 1" }, type: "text", required: true },
      { id: "tomon2", label: { uz_lat: "2-tomon", uz_cyr: "2-томон", ru: "Сторона 2" }, type: "text", required: true },
      { id: "mazmun", label: { uz_lat: "Ariza mazmuni", uz_cyr: "Ариза мазмуни", ru: "Содержание заявления" }, type: "textarea", required: true }
    ];
  }
  if (category === 'meros') {
    return [
      { id: "da_vogar", label: { uz_lat: "Da'vogar", uz_cyr: "Даъвогар", ru: "Истец" }, type: "text", required: true },
      { id: "mazmun", label: { uz_lat: "Ariza mazmuni", uz_cyr: "Ариза мазмуни", ru: "Содержание заявления" }, type: "textarea", required: true }
    ];
  }

  return defaultFields;
}

function getVariants(id, name, category) {
  return [
    {
      uz_lat: `Ushbu ariza orqali ${name} masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.`,
      uz_cyr: `Ушбу ариза орқали ${name} масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.`,
      ru: `Настоящим заявлением обращаюсь по вопросу ${name}.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке.`
    }
  ];
}

const templates = [];

for (const [category, ids] of Object.entries(categories)) {
  for (const id of ids) {
    const name = formatName(id);
    templates.push({
      id,
      name: {
        uz_lat: name,
        uz_cyr: name,
        ru: name
      },
      category,
      fields: getFields(category),
      variants: getVariants(id, name, category)
    });
  }
}

const fileContent = `import { DocumentTemplate } from "./types";\n\nexport const DOCUMENT_TEMPLATES: DocumentTemplate[] = ${JSON.stringify(templates, null, 2)};\n`;

fs.writeFileSync('src/constants.ts', fileContent);
console.log('Generated constants.ts');
