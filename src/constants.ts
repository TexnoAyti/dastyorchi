import { DocumentTemplate } from "./types";

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    "id": "qarz_undirish",
    "name": {
      "uz_lat": "Qarz Undirish",
      "uz_cyr": "Qarz Undirish",
      "ru": "Qarz Undirish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Undirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Undirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Undirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "zarar_undirish",
    "name": {
      "uz_lat": "Zarar Undirish",
      "uz_cyr": "Zarar Undirish",
      "ru": "Zarar Undirish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Zarar Undirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Zarar Undirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Zarar Undirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ma'naviy_zarar",
    "name": {
      "uz_lat": "Ma'naviy Zarar",
      "uz_cyr": "Ma'naviy Zarar",
      "ru": "Ma'naviy Zarar"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ma'naviy Zarar masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ma'naviy Zarar масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ma'naviy Zarar.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_shartnoma_nizo",
    "name": {
      "uz_lat": "Qarz Shartnoma Nizo",
      "uz_cyr": "Qarz Shartnoma Nizo",
      "ru": "Qarz Shartnoma Nizo"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Shartnoma Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Shartnoma Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Shartnoma Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "mulkiy_huquqni_tan_olish",
    "name": {
      "uz_lat": "Mulkiy Huquqni Tan Olish",
      "uz_cyr": "Mulkiy Huquqni Tan Olish",
      "ru": "Mulkiy Huquqni Tan Olish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Mulkiy Huquqni Tan Olish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Mulkiy Huquqni Tan Olish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Mulkiy Huquqni Tan Olish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "egalikdan_chiqarish",
    "name": {
      "uz_lat": "Egalikdan Chiqarish",
      "uz_cyr": "Egalikdan Chiqarish",
      "ru": "Egalikdan Chiqarish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Egalikdan Chiqarish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Egalikdan Chiqarish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Egalikdan Chiqarish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "noqonuniy_egallash",
    "name": {
      "uz_lat": "Noqonuniy Egallash",
      "uz_cyr": "Noqonuniy Egallash",
      "ru": "Noqonuniy Egallash"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Noqonuniy Egallash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Noqonuniy Egallash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Noqonuniy Egallash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarzni_foiz_bilan_undirish",
    "name": {
      "uz_lat": "Qarzni Foiz Bilan Undirish",
      "uz_cyr": "Qarzni Foiz Bilan Undirish",
      "ru": "Qarzni Foiz Bilan Undirish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarzni Foiz Bilan Undirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarzni Foiz Bilan Undirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarzni Foiz Bilan Undirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "da'vo_rad_etish",
    "name": {
      "uz_lat": "Da'vo Rad Etish",
      "uz_cyr": "Da'vo Rad Etish",
      "ru": "Da'vo Rad Etish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Da'vo Rad Etish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Da'vo Rad Etish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Da'vo Rad Etish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_muddati_uzaytirish",
    "name": {
      "uz_lat": "Qarz Muddati Uzaytirish",
      "uz_cyr": "Qarz Muddati Uzaytirish",
      "ru": "Qarz Muddati Uzaytirish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Muddati Uzaytirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Muddati Uzaytirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Muddati Uzaytirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_qayta_hisoblash",
    "name": {
      "uz_lat": "Qarz Qayta Hisoblash",
      "uz_cyr": "Qarz Qayta Hisoblash",
      "ru": "Qarz Qayta Hisoblash"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Qayta Hisoblash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Qayta Hisoblash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Qayta Hisoblash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarzni_bo'lib_to'lash",
    "name": {
      "uz_lat": "Qarzni Bo'lib To'lash",
      "uz_cyr": "Qarzni Bo'lib To'lash",
      "ru": "Qarzni Bo'lib To'lash"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarzni Bo'lib To'lash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarzni Bo'lib To'lash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarzni Bo'lib To'lash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarzni_kechiktirish",
    "name": {
      "uz_lat": "Qarzni Kechiktirish",
      "uz_cyr": "Qarzni Kechiktirish",
      "ru": "Qarzni Kechiktirish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarzni Kechiktirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarzni Kechiktirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarzni Kechiktirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "da'vo_ariza_qaytarish",
    "name": {
      "uz_lat": "Da'vo Ariza Qaytarish",
      "uz_cyr": "Da'vo Ariza Qaytarish",
      "ru": "Da'vo Ariza Qaytarish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Da'vo Ariza Qaytarish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Da'vo Ariza Qaytarish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Da'vo Ariza Qaytarish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "da'vo_ozgartirish",
    "name": {
      "uz_lat": "Da'vo Ozgartirish",
      "uz_cyr": "Da'vo Ozgartirish",
      "ru": "Da'vo Ozgartirish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Da'vo Ozgartirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Da'vo Ozgartirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Da'vo Ozgartirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_tan_olish",
    "name": {
      "uz_lat": "Qarz Tan Olish",
      "uz_cyr": "Qarz Tan Olish",
      "ru": "Qarz Tan Olish"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Tan Olish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Tan Olish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Tan Olish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarzni_undirish_bank_orqali",
    "name": {
      "uz_lat": "Qarzni Undirish Bank Orqali",
      "uz_cyr": "Qarzni Undirish Bank Orqali",
      "ru": "Qarzni Undirish Bank Orqali"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarzni Undirish Bank Orqali masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarzni Undirish Bank Orqali масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarzni Undirish Bank Orqali.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_kafillik_nizo",
    "name": {
      "uz_lat": "Qarz Kafillik Nizo",
      "uz_cyr": "Qarz Kafillik Nizo",
      "ru": "Qarz Kafillik Nizo"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Kafillik Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Kafillik Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Kafillik Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_meros_nizo",
    "name": {
      "uz_lat": "Qarz Meros Nizo",
      "uz_cyr": "Qarz Meros Nizo",
      "ru": "Qarz Meros Nizo"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Meros Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Meros Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Meros Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_notarial",
    "name": {
      "uz_lat": "Qarz Notarial",
      "uz_cyr": "Qarz Notarial",
      "ru": "Qarz Notarial"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Notarial masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Notarial масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Notarial.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_tadbirkorlik",
    "name": {
      "uz_lat": "Qarz Tadbirkorlik",
      "uz_cyr": "Qarz Tadbirkorlik",
      "ru": "Qarz Tadbirkorlik"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Tadbirkorlik masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Tadbirkorlik масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Tadbirkorlik.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_sud_buyruq",
    "name": {
      "uz_lat": "Qarz Sud Buyruq",
      "uz_cyr": "Qarz Sud Buyruq",
      "ru": "Qarz Sud Buyruq"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Sud Buyruq masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Sud Buyruq масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Sud Buyruq.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_sud_ijro",
    "name": {
      "uz_lat": "Qarz Sud Ijro",
      "uz_cyr": "Qarz Sud Ijro",
      "ru": "Qarz Sud Ijro"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Sud Ijro masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Sud Ijro масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Sud Ijro.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_kafolat",
    "name": {
      "uz_lat": "Qarz Kafolat",
      "uz_cyr": "Qarz Kafolat",
      "ru": "Qarz Kafolat"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Kafolat masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Kafolat масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Kafolat.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarz_dalil_taqdim",
    "name": {
      "uz_lat": "Qarz Dalil Taqdim",
      "uz_cyr": "Qarz Dalil Taqdim",
      "ru": "Qarz Dalil Taqdim"
    },
    "category": "fuqarolik",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarz Dalil Taqdim masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarz Dalil Taqdim масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarz Dalil Taqdim.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "aliment_undirish",
    "name": {
      "uz_lat": "Aliment Undirish",
      "uz_cyr": "Aliment Undirish",
      "ru": "Aliment Undirish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Aliment Undirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Aliment Undirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Aliment Undirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "aliment_oshirish",
    "name": {
      "uz_lat": "Aliment Oshirish",
      "uz_cyr": "Aliment Oshirish",
      "ru": "Aliment Oshirish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Aliment Oshirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Aliment Oshirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Aliment Oshirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "aliment_kamaytirish",
    "name": {
      "uz_lat": "Aliment Kamaytirish",
      "uz_cyr": "Aliment Kamaytirish",
      "ru": "Aliment Kamaytirish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Aliment Kamaytirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Aliment Kamaytirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Aliment Kamaytirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "aliment_qarzdorlik",
    "name": {
      "uz_lat": "Aliment Qarzdorlik",
      "uz_cyr": "Aliment Qarzdorlik",
      "ru": "Aliment Qarzdorlik"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Aliment Qarzdorlik masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Aliment Qarzdorlik масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Aliment Qarzdorlik.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "aliment_to'lashdan_ozod",
    "name": {
      "uz_lat": "Aliment To'lashdan Ozod",
      "uz_cyr": "Aliment To'lashdan Ozod",
      "ru": "Aliment To'lashdan Ozod"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Aliment To'lashdan Ozod masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Aliment To'lashdan Ozod масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Aliment To'lashdan Ozod.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "nikohni_bekor_qilish",
    "name": {
      "uz_lat": "Nikohni Bekor Qilish",
      "uz_cyr": "Nikohni Bekor Qilish",
      "ru": "Nikohni Bekor Qilish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Nikohni Bekor Qilish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Nikohni Bekor Qilish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Nikohni Bekor Qilish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "nikohni_haqiqiy_emas",
    "name": {
      "uz_lat": "Nikohni Haqiqiy Emas",
      "uz_cyr": "Nikohni Haqiqiy Emas",
      "ru": "Nikohni Haqiqiy Emas"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Nikohni Haqiqiy Emas masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Nikohni Haqiqiy Emas масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Nikohni Haqiqiy Emas.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "farzandni_olib_qolish",
    "name": {
      "uz_lat": "Farzandni Olib Qolish",
      "uz_cyr": "Farzandni Olib Qolish",
      "ru": "Farzandni Olib Qolish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Farzandni Olib Qolish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Farzandni Olib Qolish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Farzandni Olib Qolish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ota_onalikni_belgilash",
    "name": {
      "uz_lat": "Ota Onalikni Belgilash",
      "uz_cyr": "Ota Onalikni Belgilash",
      "ru": "Ota Onalikni Belgilash"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ota Onalikni Belgilash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ota Onalikni Belgilash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ota Onalikni Belgilash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ota_onalikni_rad",
    "name": {
      "uz_lat": "Ota Onalikni Rad",
      "uz_cyr": "Ota Onalikni Rad",
      "ru": "Ota Onalikni Rad"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ota Onalikni Rad masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ota Onalikni Rad масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ota Onalikni Rad.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "farzand_bilan_uchrashuv",
    "name": {
      "uz_lat": "Farzand Bilan Uchrashuv",
      "uz_cyr": "Farzand Bilan Uchrashuv",
      "ru": "Farzand Bilan Uchrashuv"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Farzand Bilan Uchrashuv masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Farzand Bilan Uchrashuv масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Farzand Bilan Uchrashuv.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "vasiylik_tayinlash",
    "name": {
      "uz_lat": "Vasiylik Tayinlash",
      "uz_cyr": "Vasiylik Tayinlash",
      "ru": "Vasiylik Tayinlash"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Vasiylik Tayinlash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Vasiylik Tayinlash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Vasiylik Tayinlash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "vasiylikni_bekor",
    "name": {
      "uz_lat": "Vasiylikni Bekor",
      "uz_cyr": "Vasiylikni Bekor",
      "ru": "Vasiylikni Bekor"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Vasiylikni Bekor masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Vasiylikni Bekor масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Vasiylikni Bekor.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bolani_olib_qolish",
    "name": {
      "uz_lat": "Bolani Olib Qolish",
      "uz_cyr": "Bolani Olib Qolish",
      "ru": "Bolani Olib Qolish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bolani Olib Qolish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bolani Olib Qolish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bolani Olib Qolish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bola_tarbiya_huquqi",
    "name": {
      "uz_lat": "Bola Tarbiya Huquqi",
      "uz_cyr": "Bola Tarbiya Huquqi",
      "ru": "Bola Tarbiya Huquqi"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bola Tarbiya Huquqi masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bola Tarbiya Huquqi масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bola Tarbiya Huquqi.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bola_yashash_joyi",
    "name": {
      "uz_lat": "Bola Yashash Joyi",
      "uz_cyr": "Bola Yashash Joyi",
      "ru": "Bola Yashash Joyi"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bola Yashash Joyi masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bola Yashash Joyi масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bola Yashash Joyi.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bola_xorijga_chiqish",
    "name": {
      "uz_lat": "Bola Xorijga Chiqish",
      "uz_cyr": "Bola Xorijga Chiqish",
      "ru": "Bola Xorijga Chiqish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bola Xorijga Chiqish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bola Xorijga Chiqish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bola Xorijga Chiqish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bola_familiya_ozgartirish",
    "name": {
      "uz_lat": "Bola Familiya Ozgartirish",
      "uz_cyr": "Bola Familiya Ozgartirish",
      "ru": "Bola Familiya Ozgartirish"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bola Familiya Ozgartirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bola Familiya Ozgartirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bola Familiya Ozgartirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "aliment_penalty",
    "name": {
      "uz_lat": "Aliment Penalty",
      "uz_cyr": "Aliment Penalty",
      "ru": "Aliment Penalty"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Aliment Penalty masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Aliment Penalty масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Aliment Penalty.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "aliment_sud_buyruq",
    "name": {
      "uz_lat": "Aliment Sud Buyruq",
      "uz_cyr": "Aliment Sud Buyruq",
      "ru": "Aliment Sud Buyruq"
    },
    "category": "oila",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Aliment Sud Buyruq masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Aliment Sud Buyruq масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Aliment Sud Buyruq.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ish_haqi_undirish",
    "name": {
      "uz_lat": "Ish Haqi Undirish",
      "uz_cyr": "Ish Haqi Undirish",
      "ru": "Ish Haqi Undirish"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ish Haqi Undirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ish Haqi Undirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ish Haqi Undirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ishdan_noqonuniy_boshatish",
    "name": {
      "uz_lat": "Ishdan Noqonuniy Boshatish",
      "uz_cyr": "Ishdan Noqonuniy Boshatish",
      "ru": "Ishdan Noqonuniy Boshatish"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ishdan Noqonuniy Boshatish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ishdan Noqonuniy Boshatish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ishdan Noqonuniy Boshatish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ishga_tiklash",
    "name": {
      "uz_lat": "Ishga Tiklash",
      "uz_cyr": "Ishga Tiklash",
      "ru": "Ishga Tiklash"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ishga Tiklash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ishga Tiklash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ishga Tiklash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "mehnat_shartnoma_nizo",
    "name": {
      "uz_lat": "Mehnat Shartnoma Nizo",
      "uz_cyr": "Mehnat Shartnoma Nizo",
      "ru": "Mehnat Shartnoma Nizo"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Mehnat Shartnoma Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Mehnat Shartnoma Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Mehnat Shartnoma Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ish_vaqti_nizo",
    "name": {
      "uz_lat": "Ish Vaqti Nizo",
      "uz_cyr": "Ish Vaqti Nizo",
      "ru": "Ish Vaqti Nizo"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ish Vaqti Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ish Vaqti Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ish Vaqti Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ortiqcha_ish_haqi",
    "name": {
      "uz_lat": "Ortiqcha Ish Haqi",
      "uz_cyr": "Ortiqcha Ish Haqi",
      "ru": "Ortiqcha Ish Haqi"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ortiqcha Ish Haqi masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ortiqcha Ish Haqi масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ortiqcha Ish Haqi.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ta'til_puli",
    "name": {
      "uz_lat": "Ta'til Puli",
      "uz_cyr": "Ta'til Puli",
      "ru": "Ta'til Puli"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ta'til Puli masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ta'til Puli масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ta'til Puli.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "kompensatsiya",
    "name": {
      "uz_lat": "Kompensatsiya",
      "uz_cyr": "Kompensatsiya",
      "ru": "Kompensatsiya"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Kompensatsiya masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Kompensatsiya масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Kompensatsiya.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "mehnat_daftarchasi",
    "name": {
      "uz_lat": "Mehnat Daftarchasi",
      "uz_cyr": "Mehnat Daftarchasi",
      "ru": "Mehnat Daftarchasi"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Mehnat Daftarchasi masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Mehnat Daftarchasi масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Mehnat Daftarchasi.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ish_beruvchi_shikoyat",
    "name": {
      "uz_lat": "Ish Beruvchi Shikoyat",
      "uz_cyr": "Ish Beruvchi Shikoyat",
      "ru": "Ish Beruvchi Shikoyat"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ish Beruvchi Shikoyat masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ish Beruvchi Shikoyat масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ish Beruvchi Shikoyat.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "mehnat_intizomi",
    "name": {
      "uz_lat": "Mehnat Intizomi",
      "uz_cyr": "Mehnat Intizomi",
      "ru": "Mehnat Intizomi"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Mehnat Intizomi masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Mehnat Intizomi масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Mehnat Intizomi.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ish_jarohati",
    "name": {
      "uz_lat": "Ish Jarohati",
      "uz_cyr": "Ish Jarohati",
      "ru": "Ish Jarohati"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ish Jarohati masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ish Jarohati масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ish Jarohati.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ishdan_majburiy_ketish",
    "name": {
      "uz_lat": "Ishdan Majburiy Ketish",
      "uz_cyr": "Ishdan Majburiy Ketish",
      "ru": "Ishdan Majburiy Ketish"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ishdan Majburiy Ketish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ishdan Majburiy Ketish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ishdan Majburiy Ketish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ishdan_bo'shatish_nizo",
    "name": {
      "uz_lat": "Ishdan Bo'shatish Nizo",
      "uz_cyr": "Ishdan Bo'shatish Nizo",
      "ru": "Ishdan Bo'shatish Nizo"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ishdan Bo'shatish Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ishdan Bo'shatish Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ishdan Bo'shatish Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "mehnat_sud",
    "name": {
      "uz_lat": "Mehnat Sud",
      "uz_cyr": "Mehnat Sud",
      "ru": "Mehnat Sud"
    },
    "category": "mehnat",
    "fields": [
      {
        "id": "xodim",
        "label": {
          "uz_lat": "Xodim",
          "uz_cyr": "Ходим",
          "ru": "Работник"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "ish_beruvchi",
        "label": {
          "uz_lat": "Ish beruvchi",
          "uz_cyr": "Иш берувчи",
          "ru": "Работодатель"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Mehnat Sud masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Mehnat Sud масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Mehnat Sud.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "jarima_bekor",
    "name": {
      "uz_lat": "Jarima Bekor",
      "uz_cyr": "Jarima Bekor",
      "ru": "Jarima Bekor"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Jarima Bekor masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Jarima Bekor масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Jarima Bekor.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "jarima_kamaytirish",
    "name": {
      "uz_lat": "Jarima Kamaytirish",
      "uz_cyr": "Jarima Kamaytirish",
      "ru": "Jarima Kamaytirish"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Jarima Kamaytirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Jarima Kamaytirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Jarima Kamaytirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "jarima_shikoyat",
    "name": {
      "uz_lat": "Jarima Shikoyat",
      "uz_cyr": "Jarima Shikoyat",
      "ru": "Jarima Shikoyat"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Jarima Shikoyat masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Jarima Shikoyat масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Jarima Shikoyat.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "organ_qarori_shikoyat",
    "name": {
      "uz_lat": "Organ Qarori Shikoyat",
      "uz_cyr": "Organ Qarori Shikoyat",
      "ru": "Organ Qarori Shikoyat"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Organ Qarori Shikoyat masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Organ Qarori Shikoyat масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Organ Qarori Shikoyat.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "yo'l_harakati_jarima",
    "name": {
      "uz_lat": "Yo'l Harakati Jarima",
      "uz_cyr": "Yo'l Harakati Jarima",
      "ru": "Yo'l Harakati Jarima"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Yo'l Harakati Jarima masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Yo'l Harakati Jarima масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Yo'l Harakati Jarima.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "soliq_jarima",
    "name": {
      "uz_lat": "Soliq Jarima",
      "uz_cyr": "Soliq Jarima",
      "ru": "Soliq Jarima"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Soliq Jarima masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Soliq Jarima масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Soliq Jarima.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bojxona_nizo",
    "name": {
      "uz_lat": "Bojxona Nizo",
      "uz_cyr": "Bojxona Nizo",
      "ru": "Bojxona Nizo"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bojxona Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bojxona Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bojxona Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "huquqbuzarlik_rad",
    "name": {
      "uz_lat": "Huquqbuzarlik Rad",
      "uz_cyr": "Huquqbuzarlik Rad",
      "ru": "Huquqbuzarlik Rad"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Huquqbuzarlik Rad masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Huquqbuzarlik Rad масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Huquqbuzarlik Rad.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "protokol_bekor",
    "name": {
      "uz_lat": "Protokol Bekor",
      "uz_cyr": "Protokol Bekor",
      "ru": "Protokol Bekor"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Protokol Bekor masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Protokol Bekor масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Protokol Bekor.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "litsenziya_nizo",
    "name": {
      "uz_lat": "Litsenziya Nizo",
      "uz_cyr": "Litsenziya Nizo",
      "ru": "Litsenziya Nizo"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Litsenziya Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Litsenziya Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Litsenziya Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ruxsatnoma_nizo",
    "name": {
      "uz_lat": "Ruxsatnoma Nizo",
      "uz_cyr": "Ruxsatnoma Nizo",
      "ru": "Ruxsatnoma Nizo"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ruxsatnoma Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ruxsatnoma Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ruxsatnoma Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "davlat_organ_shikoyat",
    "name": {
      "uz_lat": "Davlat Organ Shikoyat",
      "uz_cyr": "Davlat Organ Shikoyat",
      "ru": "Davlat Organ Shikoyat"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Davlat Organ Shikoyat masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Davlat Organ Shikoyat масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Davlat Organ Shikoyat.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ma'muriy_ish_yopish",
    "name": {
      "uz_lat": "Ma'muriy Ish Yopish",
      "uz_cyr": "Ma'muriy Ish Yopish",
      "ru": "Ma'muriy Ish Yopish"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ma'muriy Ish Yopish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ma'muriy Ish Yopish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ma'muriy Ish Yopish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "jarima_kechiktirish",
    "name": {
      "uz_lat": "Jarima Kechiktirish",
      "uz_cyr": "Jarima Kechiktirish",
      "ru": "Jarima Kechiktirish"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Jarima Kechiktirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Jarima Kechiktirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Jarima Kechiktirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "jarima_bo'lib_to'lash",
    "name": {
      "uz_lat": "Jarima Bo'lib To'lash",
      "uz_cyr": "Jarima Bo'lib To'lash",
      "ru": "Jarima Bo'lib To'lash"
    },
    "category": "ma'muriy",
    "fields": [
      {
        "id": "shaxs",
        "label": {
          "uz_lat": "Shaxs",
          "uz_cyr": "Шахс",
          "ru": "Лицо"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "organ",
        "label": {
          "uz_lat": "Tashkilot/Organ",
          "uz_cyr": "Ташкилот/Орган",
          "ru": "Организация/Орган"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Jarima Bo'lib To'lash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Jarima Bo'lib To'lash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Jarima Bo'lib To'lash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "uydan_chiqarish",
    "name": {
      "uz_lat": "Uydan Chiqarish",
      "uz_cyr": "Uydan Chiqarish",
      "ru": "Uydan Chiqarish"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Uydan Chiqarish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Uydan Chiqarish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Uydan Chiqarish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "uyga_kiritish",
    "name": {
      "uz_lat": "Uyga Kiritish",
      "uz_cyr": "Uyga Kiritish",
      "ru": "Uyga Kiritish"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Uyga Kiritish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Uyga Kiritish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Uyga Kiritish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ijara_nizo",
    "name": {
      "uz_lat": "Ijara Nizo",
      "uz_cyr": "Ijara Nizo",
      "ru": "Ijara Nizo"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ijara Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ijara Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ijara Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "kommunal_qarz",
    "name": {
      "uz_lat": "Kommunal Qarz",
      "uz_cyr": "Kommunal Qarz",
      "ru": "Kommunal Qarz"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Kommunal Qarz masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Kommunal Qarz масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Kommunal Qarz.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "uy_egalik_nizo",
    "name": {
      "uz_lat": "Uy Egalik Nizo",
      "uz_cyr": "Uy Egalik Nizo",
      "ru": "Uy Egalik Nizo"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Uy Egalik Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Uy Egalik Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Uy Egalik Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "kvartira_taqsimlash",
    "name": {
      "uz_lat": "Kvartira Taqsimlash",
      "uz_cyr": "Kvartira Taqsimlash",
      "ru": "Kvartira Taqsimlash"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Kvartira Taqsimlash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Kvartira Taqsimlash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Kvartira Taqsimlash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "uy_foydalanish",
    "name": {
      "uz_lat": "Uy Foydalanish",
      "uz_cyr": "Uy Foydalanish",
      "ru": "Uy Foydalanish"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Uy Foydalanish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Uy Foydalanish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Uy Foydalanish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qo'shni_nizo",
    "name": {
      "uz_lat": "Qo'shni Nizo",
      "uz_cyr": "Qo'shni Nizo",
      "ru": "Qo'shni Nizo"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qo'shni Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qo'shni Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qo'shni Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "uy_buzish",
    "name": {
      "uz_lat": "Uy Buzish",
      "uz_cyr": "Uy Buzish",
      "ru": "Uy Buzish"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Uy Buzish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Uy Buzish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Uy Buzish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "uy_ta'mirlash",
    "name": {
      "uz_lat": "Uy Ta'mirlash",
      "uz_cyr": "Uy Ta'mirlash",
      "ru": "Uy Ta'mirlash"
    },
    "category": "uy-joy",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "javobgar",
        "label": {
          "uz_lat": "Javobgar",
          "uz_cyr": "Жавобгар",
          "ru": "Ответчик"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Uy Ta'mirlash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Uy Ta'mirlash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Uy Ta'mirlash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "kredit_nizo",
    "name": {
      "uz_lat": "Kredit Nizo",
      "uz_cyr": "Kredit Nizo",
      "ru": "Kredit Nizo"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Kredit Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Kredit Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Kredit Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "foiz_kamaytirish",
    "name": {
      "uz_lat": "Foiz Kamaytirish",
      "uz_cyr": "Foiz Kamaytirish",
      "ru": "Foiz Kamaytirish"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Foiz Kamaytirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Foiz Kamaytirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Foiz Kamaytirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarzni_qayta_tuzish",
    "name": {
      "uz_lat": "Qarzni Qayta Tuzish",
      "uz_cyr": "Qarzni Qayta Tuzish",
      "ru": "Qarzni Qayta Tuzish"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarzni Qayta Tuzish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarzni Qayta Tuzish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarzni Qayta Tuzish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bank_xatolik",
    "name": {
      "uz_lat": "Bank Xatolik",
      "uz_cyr": "Bank Xatolik",
      "ru": "Bank Xatolik"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bank Xatolik masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bank Xatolik масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bank Xatolik.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "hisob_bloklash",
    "name": {
      "uz_lat": "Hisob Bloklash",
      "uz_cyr": "Hisob Bloklash",
      "ru": "Hisob Bloklash"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Hisob Bloklash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Hisob Bloklash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Hisob Bloklash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "kredit_shartnoma_bekor",
    "name": {
      "uz_lat": "Kredit Shartnoma Bekor",
      "uz_cyr": "Kredit Shartnoma Bekor",
      "ru": "Kredit Shartnoma Bekor"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Kredit Shartnoma Bekor masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Kredit Shartnoma Bekor масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Kredit Shartnoma Bekor.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "kredit_kechiktirish",
    "name": {
      "uz_lat": "Kredit Kechiktirish",
      "uz_cyr": "Kredit Kechiktirish",
      "ru": "Kredit Kechiktirish"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Kredit Kechiktirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Kredit Kechiktirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Kredit Kechiktirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "mikroqarz_nizo",
    "name": {
      "uz_lat": "Mikroqarz Nizo",
      "uz_cyr": "Mikroqarz Nizo",
      "ru": "Mikroqarz Nizo"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Mikroqarz Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Mikroqarz Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Mikroqarz Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "bank_shikoyat",
    "name": {
      "uz_lat": "Bank Shikoyat",
      "uz_cyr": "Bank Shikoyat",
      "ru": "Bank Shikoyat"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Bank Shikoyat masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Bank Shikoyat масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Bank Shikoyat.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "qarzni_restrukturizatsiya",
    "name": {
      "uz_lat": "Qarzni Restrukturizatsiya",
      "uz_cyr": "Qarzni Restrukturizatsiya",
      "ru": "Qarzni Restrukturizatsiya"
    },
    "category": "bank",
    "fields": [
      {
        "id": "mijoz",
        "label": {
          "uz_lat": "Mijoz",
          "uz_cyr": "Мижоз",
          "ru": "Клиент"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "bank",
        "label": {
          "uz_lat": "Bank",
          "uz_cyr": "Банк",
          "ru": "Банк"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Qarzni Restrukturizatsiya masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Qarzni Restrukturizatsiya масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Qarzni Restrukturizatsiya.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "merosni_qabul",
    "name": {
      "uz_lat": "Merosni Qabul",
      "uz_cyr": "Merosni Qabul",
      "ru": "Merosni Qabul"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Merosni Qabul masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Merosni Qabul масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Merosni Qabul.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "merosni_rad",
    "name": {
      "uz_lat": "Merosni Rad",
      "uz_cyr": "Merosni Rad",
      "ru": "Merosni Rad"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Merosni Rad masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Merosni Rad масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Merosni Rad.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "meros_talash",
    "name": {
      "uz_lat": "Meros Talash",
      "uz_cyr": "Meros Talash",
      "ru": "Meros Talash"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Meros Talash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Meros Talash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Meros Talash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "meros_muddat_tiklash",
    "name": {
      "uz_lat": "Meros Muddat Tiklash",
      "uz_cyr": "Meros Muddat Tiklash",
      "ru": "Meros Muddat Tiklash"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Meros Muddat Tiklash masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Meros Muddat Tiklash масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Meros Muddat Tiklash.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "meros_huquq_tan_olish",
    "name": {
      "uz_lat": "Meros Huquq Tan Olish",
      "uz_cyr": "Meros Huquq Tan Olish",
      "ru": "Meros Huquq Tan Olish"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Meros Huquq Tan Olish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Meros Huquq Tan Olish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Meros Huquq Tan Olish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "vasiyatnoma_nizo",
    "name": {
      "uz_lat": "Vasiyatnoma Nizo",
      "uz_cyr": "Vasiyatnoma Nizo",
      "ru": "Vasiyatnoma Nizo"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Vasiyatnoma Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Vasiyatnoma Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Vasiyatnoma Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "vasiyatnoma_bekor",
    "name": {
      "uz_lat": "Vasiyatnoma Bekor",
      "uz_cyr": "Vasiyatnoma Bekor",
      "ru": "Vasiyatnoma Bekor"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Vasiyatnoma Bekor masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Vasiyatnoma Bekor масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Vasiyatnoma Bekor.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "meros_ulush",
    "name": {
      "uz_lat": "Meros Ulush",
      "uz_cyr": "Meros Ulush",
      "ru": "Meros Ulush"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Meros Ulush masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Meros Ulush масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Meros Ulush.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "meros_mulk",
    "name": {
      "uz_lat": "Meros Mulk",
      "uz_cyr": "Meros Mulk",
      "ru": "Meros Mulk"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Meros Mulk masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Meros Mulk масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Meros Mulk.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "meros_notarial",
    "name": {
      "uz_lat": "Meros Notarial",
      "uz_cyr": "Meros Notarial",
      "ru": "Meros Notarial"
    },
    "category": "meros",
    "fields": [
      {
        "id": "da_vogar",
        "label": {
          "uz_lat": "Da'vogar",
          "uz_cyr": "Даъвогар",
          "ru": "Истец"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Meros Notarial masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Meros Notarial масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Meros Notarial.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "shartnoma_bekor",
    "name": {
      "uz_lat": "Shartnoma Bekor",
      "uz_cyr": "Shartnoma Bekor",
      "ru": "Shartnoma Bekor"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Shartnoma Bekor masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Shartnoma Bekor масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Shartnoma Bekor.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "shartnoma_buzilish",
    "name": {
      "uz_lat": "Shartnoma Buzilish",
      "uz_cyr": "Shartnoma Buzilish",
      "ru": "Shartnoma Buzilish"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Shartnoma Buzilish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Shartnoma Buzilish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Shartnoma Buzilish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "shartnoma_nizo",
    "name": {
      "uz_lat": "Shartnoma Nizo",
      "uz_cyr": "Shartnoma Nizo",
      "ru": "Shartnoma Nizo"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Shartnoma Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Shartnoma Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Shartnoma Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "jarima_undirish",
    "name": {
      "uz_lat": "Jarima Undirish",
      "uz_cyr": "Jarima Undirish",
      "ru": "Jarima Undirish"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Jarima Undirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Jarima Undirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Jarima Undirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "majburiyat_bajarmaslik",
    "name": {
      "uz_lat": "Majburiyat Bajarmaslik",
      "uz_cyr": "Majburiyat Bajarmaslik",
      "ru": "Majburiyat Bajarmaslik"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Majburiyat Bajarmaslik masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Majburiyat Bajarmaslik масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Majburiyat Bajarmaslik.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "oldi_sotdi_nizo",
    "name": {
      "uz_lat": "Oldi Sotdi Nizo",
      "uz_cyr": "Oldi Sotdi Nizo",
      "ru": "Oldi Sotdi Nizo"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Oldi Sotdi Nizo masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Oldi Sotdi Nizo масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Oldi Sotdi Nizo.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "ijara_shartnoma",
    "name": {
      "uz_lat": "Ijara Shartnoma",
      "uz_cyr": "Ijara Shartnoma",
      "ru": "Ijara Shartnoma"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Ijara Shartnoma masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Ijara Shartnoma масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Ijara Shartnoma.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "xizmat_shartnoma",
    "name": {
      "uz_lat": "Xizmat Shartnoma",
      "uz_cyr": "Xizmat Shartnoma",
      "ru": "Xizmat Shartnoma"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Xizmat Shartnoma masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Xizmat Shartnoma масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Xizmat Shartnoma.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "shartnoma_ozgartirish",
    "name": {
      "uz_lat": "Shartnoma Ozgartirish",
      "uz_cyr": "Shartnoma Ozgartirish",
      "ru": "Shartnoma Ozgartirish"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Shartnoma Ozgartirish masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Shartnoma Ozgartirish масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Shartnoma Ozgartirish.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  },
  {
    "id": "shartnoma_dalil",
    "name": {
      "uz_lat": "Shartnoma Dalil",
      "uz_cyr": "Shartnoma Dalil",
      "ru": "Shartnoma Dalil"
    },
    "category": "shartnoma",
    "fields": [
      {
        "id": "tomon1",
        "label": {
          "uz_lat": "1-tomon",
          "uz_cyr": "1-томон",
          "ru": "Сторона 1"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "tomon2",
        "label": {
          "uz_lat": "2-tomon",
          "uz_cyr": "2-томон",
          "ru": "Сторона 2"
        },
        "type": "text",
        "required": true
      },
      {
        "id": "mazmun",
        "label": {
          "uz_lat": "Ariza mazmuni",
          "uz_cyr": "Ариза мазмуни",
          "ru": "Содержание заявления"
        },
        "type": "textarea",
        "required": true
      }
    ],
    "variants": [
      {
        "uz_lat": "Ushbu ariza orqali Shartnoma Dalil masalasida murojaat qilaman.\n\nMazmuni: {mazmun}\n\nSuddan ushbu masalani qonuniy hal qilib berishni so'rayman.",
        "uz_cyr": "Ушбу ариза орқали Shartnoma Dalil масаласида мурожаат қиламан.\n\nМазмуни: {mazmun}\n\nСуддан ушбу масалани қонуний ҳал қилиб беришни сўрайман.",
        "ru": "Настоящим заявлением обращаюсь по вопросу Shartnoma Dalil.\n\nСодержание: {mazmun}\n\nПрошу суд решить данный вопрос в законном порядке."
      }
    ]
  }
];
