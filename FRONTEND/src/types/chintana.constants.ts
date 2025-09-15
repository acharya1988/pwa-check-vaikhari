

export const CHINTANA_CATEGORIES = [
  { id: 'sastra', name: 'Śāstra' },
  { id: 'ayurveda', name: 'Ayurveda' },
  { id: 'vedanta', name: 'Vedānta' },
  { id: 'jyotisa', name: 'Jyotiṣa' },
  { id: 'tantra', name: 'Tantra' },
  { id: 'vakya-vicara', name: 'Vākya Vicāra' },
  { id: 'kalpana', name: 'Kalpanā' },
] as const;

export const CHINTANA_POST_TYPES = [
    { id: 'prashna', name: 'Prashna (Question)', color: 'bg-transparent' },
    { id: 'purva-paksha', name: 'Pūrva Paksha (Argument)', color: 'bg-orange-100 dark:bg-orange-900/50' },
    { id: 'uttara-paksha', name: 'Uttara Paksha (Counter-Argument)', color: 'bg-blue-100 dark:bg-blue-900/50' },
    { id: 'samadhana', name: 'Samādhāna (Reconciliation)', color: 'bg-green-100 dark:bg-green-900/50' },
    { id: 'siddhanta', name: 'Siddhānta (Conclusion)', color: 'bg-amber-100 dark:bg-amber-900/50' },
    { id: 'vicara', name: 'Vicāra (Musing)', color: 'bg-gray-100 dark:bg-gray-800/50' },
    { id: 'fallacy-flag', name: 'Fallacy Flag', color: 'bg-red-100 dark:bg-red-900/50' },
] as const;
