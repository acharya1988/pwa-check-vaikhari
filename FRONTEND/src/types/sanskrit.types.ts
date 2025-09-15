
// This file is based on the comprehensive list provided by the user.

export const BOOK_SUBJECTS = [
  { id: 'shastra-samhita', label: 'Shastra Samhita (e.g., Ayurveda, Vedanta, Nyaya)' },
  { id: 'puranic-grantha', label: 'Puranic Grantha (e.g., Garuda Purana)' },
  { id: 'kavya-poetic-work', label: 'Kavya/Poetic Work' },
  { id: 'commentary', label: 'Commentary (Bhashya, Vritti)' },
  { id: 'research-paper', label: 'Research Paper / Academic Article' },
  { id: 'story-upakhyana', label: 'Story / Upakhyana' },
  { id: 'modern-transcreation', label: 'Modern Transcreation / Simplified Guide' },
  { id: 'translation-annotations', label: 'Translation & Annotations' },
  { id: 'manuscript-editing', label: 'Manuscript Reconstruction / Editing' },
];

export const SANSKRIT_TEXT_TYPE_GROUPS = {
  'Primary Text': [
    { id: 'shloka', sanskrit: 'श्लोक', iast: 'Śloka' },
    { id: 'sutra', sanskrit: 'सूत्र', iast: 'Sūtra' },
    { id: 'gadya', sanskrit: 'गद्य', iast: 'Gadya' },
    { id: 'padya', sanskrit: 'पद्य', iast: 'Padya' },
    { id: 'prakarana', sanskrit: 'प्रकरण', iast: 'Prakaraṇa' },
    { id: 'smriti', sanskrit: 'स्मृति', iast: 'Smṛti' },
    { id: 'shruti', sanskrit: 'श्रुति', iast: 'Śruti' },
    { id: 'upanishad', sanskrit: 'उपनिषद्', iast: 'Upaniṣad' },
  ],
  'Commentary & Explanation': [
    { id: 'bhashya', sanskrit: 'भाष्य', iast: 'Bhāṣya' },
    { id: 'tika', sanskrit: 'टीका', iast: 'Tīkā' },
    { id: 'vyakhya', sanskrit: 'व्याख्या', iast: 'Vyākhyā' },
    { id: 'anuvada', sanskrit: 'अनुवाद', iast: 'Anuvāda' },
    { id: 'nirukti', sanskrit: 'निरुक्ति', iast: 'Nirukti' },
    { id: 'lakshana', sanskrit: 'लक्षण', iast: 'Lakṣaṇa' },
    { id: 'paribhasha', sanskrit: 'परिभाषा', iast: 'Paribhāṣā' },
    { id: 'vritti', sanskrit: 'वृत्ति', iast: 'Vṛtti' },
    { id: 'tippani', sanskrit: 'टिप्पणी', iast: 'Ṭippaṇī' },
  ],
  'Mantric or Vedic Class': [
    { id: 'mantra', sanskrit: 'मन्त्र', iast: 'Mantra' },
    { id: 'richa', sanskrit: 'ऋच्', iast: 'Ṛcha' },
    { id: 'sutragadya', sanskrit: 'सूत्र-गद्य', iast: 'Sūtra-Gadya' },
  ],
  'Structural / Logical': [
    { id: 'anubandha', sanskrit: 'अनुबन्ध', iast: 'Anubandha' },
    { id: 'title', sanskrit: 'शीर्षक', iast: 'Title' },
    { id: 'subtitle', sanskrit: 'उपशीर्षक', iast: 'Subtitle' },
    { id: 'pratijna_vakya', sanskrit: 'प्रतिज्ञा वाक्य', iast: 'Pratijñā Vākya' },
    { id: 'upodghata', sanskrit: 'उपोद्घात / प्रस्तावना', iast: 'Introduction' },
    { id: 'sangraha', sanskrit: 'सङ्ग्रह', iast: 'Summary' },
    { id: 'udaharana', sanskrit: 'उदाहरण', iast: 'Examples' },
    { id: 'siddhanta', sanskrit: 'सिद्धान्त', iast: 'Conclusion' },
    { id: 'purva_paksha', sanskrit: 'पूर्वपक्ष', iast: 'Opposing View' },
    { id: 'uttara_paksha', sanskrit: 'उत्तरपक्ष', iast: 'Rebuttal' },
  ],
};


export const SANSKRIT_COMMENTARY_TYPES = SANSKRIT_TEXT_TYPE_GROUPS['Commentary & Explanation'].map(i => ({...i, label: `${i.iast} (${i.sanskrit})`}));

const SOURCE_GROUP_NAMES = ['Primary Text', 'Mantric or Vedic Class', 'Structural / Logical'];
const COMMENTARY_GROUP_NAMES = ['Commentary & Explanation'];

export const SOURCE_TYPE_GROUPS = Object.fromEntries(
  Object.entries(SANSKRIT_TEXT_TYPE_GROUPS).filter(([key]) => SOURCE_GROUP_NAMES.includes(key))
    .map(([group, items]) => [group, items.map(i => ({...i, label: `${i.iast} (${i.sanskrit})`}))])
);

export const COMMENTARY_TYPE_GROUPS = Object.fromEntries(
  Object.entries(SANSKRIT_TEXT_TYPE_GROUPS).filter(([key]) => COMMENTARY_GROUP_NAMES.includes(key))
    .map(([group, items]) => [group, items.map(i => ({...i, label: `${i.iast} (${i.sanskrit})`}))])
);

export const ALL_SOURCE_TYPES = Object.values(SOURCE_TYPE_GROUPS).flat().map(item => item.id);
export const ALL_COMMENTARY_TYPES = Object.values(COMMENTARY_TYPE_GROUPS).flat().map(item => item.id);

const allTypes = Object.values(SANSKRIT_TEXT_TYPE_GROUPS).flat();
const typeMap = new Map(allTypes.map(item => [item.id, { sanskrit: item.sanskrit, iast: item.iast }]));

export const getTypeLabelById = (id: string) => {
    const type = typeMap.get(id);
    return type ? `${type.iast} (${type.sanskrit})` : id;
}

export const getSanskritLabelById = (id: string) => {
    const type = typeMap.get(id);
    return type ? type.sanskrit : id;
}

export const getIastLabelById = (id: string) => {
    const type = typeMap.get(id);
    return type ? type.iast : id;
}
