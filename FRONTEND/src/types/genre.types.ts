
export interface Genre {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
    genreId: string;
}

export interface SubCategory {
    id: string;
    name: string;
    categoryId: string;
}

export const GENRES: Genre[] = [
    { id: 'veda', name: 'Veda & Vedanga' },
    { id: 'darshana', name: 'Darshana (Philosophical Systems)' },
    { id: 'ayurveda', name: 'Ayurveda' },
    { id: 'shastra-of-language', name: 'Shastra of Language & Literature' },
    { id: 'itihasa-purana', name: 'Itihasa & Purana' },
    { id: 'jyotisha', name: 'Jyotisha (Astronomy & Astrology)' },
    { id: 'ganita-tarka', name: 'Ganita & Tarka (Mathematics & Logic)' },
    { id: 'artha-dharma', name: 'Arthashastra & Niti' },
    { id: 'dharma-shastra', name: 'Dharma Shastra' },
    { id: 'shilpa-vastu', name: 'Shilpa & Vastu Shastra' },
    { id: 'kalas', name: 'Kalas (Arts & Aesthetics)' },
    { id: 'tantra-mantra', name: 'Tantra, Mantra & Agama' },
    { id: 'lokavidya', name: 'Lokavidya (Folk & Regional Knowledge)' },
];

export const CATEGORIES: Category[] = [
    // Veda
    { id: 'rigveda', name: 'Rigveda', genreId: 'veda' },
    { id: 'yajurveda', name: 'Yajurveda', genreId: 'veda' },
    { id: 'samaveda', name: 'Samaveda', genreId: 'veda' },
    { id: 'atharvaveda', name: 'Atharvaveda', genreId: 'veda' },
    // Vedanga
    { id: 'shiksha', name: 'Shiksha (Phonetics)', genreId: 'veda' },
    { id: 'vyakarana', name: 'Vyakarana (Grammar)', genreId: 'veda' },
    { id: 'nirukta', name: 'Nirukta (Etymology)', genreId: 'veda' },
    { id: 'chandas', name: 'Chandas (Metrics)', genreId: 'veda' },
    { id: 'vedanga-jyotisha', name: 'Jyotisha (Vedanga)', genreId: 'veda' },
    { id: 'kalpa', name: 'Kalpa (Ritual manuals)', genreId: 'veda' },
    // Darshana
    { id: 'astika', name: 'Astika (Six Schools)', genreId: 'darshana' },
    { id: 'nastika', name: 'Nastika (Other Schools)', genreId: 'darshana' },
    // Ayurveda
    { id: 'kaya-chikitsa', name: 'Kaya Chikitsa (Internal Medicine)', genreId: 'ayurveda' },
    { id: 'shalya-tantra', name: 'Shalya Tantra (Surgery)', genreId: 'ayurveda' },
    { id: 'shalakya-tantra', name: 'Shalakya Tantra (ENT & Ophthalmology)', genreId: 'ayurveda' },
    { id: 'kaumarabhritya', name: 'Kaumarabhritya (Pediatrics & Gynecology)', genreId: 'ayurveda' },
    { id: 'agada-tantra', name: 'Agada Tantra (Toxicology)', genreId: 'ayurveda' },
    { id: 'rasayana', name: 'Rasayana (Rejuvenation)', genreId: 'ayurveda' },
    { id: 'vajikarana', name: 'Vajikarana (Aphrodisiac Science)', genreId: 'ayurveda' },
    { id: 'modern-extensions-ayurveda', name: 'Modern Extensions', genreId: 'ayurveda' },
    // Itihasa & Purana
    { id: 'itihasa', name: 'Itihasa', genreId: 'itihasa-purana' },
    { id: 'puranas', name: 'Puranas', genreId: 'itihasa-purana' },
    // Tantra, Mantra & Agama
    { id: 'shaiva-agama', name: 'Shaiva Agama', genreId: 'tantra-mantra' },
    { id: 'vaishnava-agama', name: 'Vaishnava Agama', genreId: 'tantra-mantra' },
    { id: 'shakta-tantra', name: 'Shakta Tantra', genreId: 'tantra-mantra' },
    { id: 'mantra-shastra', name: 'Mantra Shastra', genreId: 'tantra-mantra' },
    { id: 'yantra-shastra', name: 'Yantra Shastra', genreId: 'tantra-mantra' },
    // Jyotisha
    { id: 'ganita-jyotisha', name: 'Ganita (Mathematics of Astronomy)', genreId: 'jyotisha' },
    { id: 'hora', name: 'Hora (Astrology)', genreId: 'jyotisha' },
    { id: 'samhita', name: 'Samhita (Omens, Portents, Calendar)', genreId: 'jyotisha' },
    // Ganita & Tarka
    { id: 'ganita', name: 'Ganita (Mathematics)', genreId: 'ganita-tarka' },
    { id: 'vijnana', name: 'Vijnana (Sciences)', genreId: 'ganita-tarka' },
    // Kalas
    { id: 'natya-shastra', name: 'Natya Shastra (Drama & Theatre)', genreId: 'kalas' },
    { id: 'sangita', name: 'Sangita (Music)', genreId: 'kalas' },
    { id: 'nritya', name: 'Nritya (Dance)', genreId: 'kalas' },
    { id: 'shilpa', name: 'Shilpa Shastra (Sculpture, Architecture)', genreId: 'kalas' },
    { id: 'alankara-shastra', name: 'Alankara Shastra (Poetics)', genreId: 'kalas' },
    // Arthashastra & Niti
    { id: 'chanakya-arthashastra', name: 'Chanakya Arthashastra', genreId: 'artha-dharma' },
    { id: 'rajaniti', name: 'Rajaniti', genreId: 'artha-dharma' },
    { id: 'dandaniti', name: 'Dandaniti', genreId: 'artha-dharma' },
    { id: 'varta', name: 'Varta (Economics, Agriculture, Trade)', genreId: 'artha-dharma' },
    // Dharma Shastra
    { id: 'manusmriti', name: 'Manusmriti', genreId: 'dharma-shastra' },
    { id: 'yajnavalkya-smriti', name: 'Yajnavalkya Smriti', genreId: 'dharma-shastra' },
    { id: 'narada-smriti', name: 'Narada Smriti', genreId: 'dharma-shastra' },
    { id: 'parashara-smriti', name: 'Parashara Smriti', genreId: 'dharma-shastra' },
    { id: 'dharma-sections', name: 'Achara, Vyavahara, Prayashchitta', genreId: 'dharma-shastra' },
    // Lokavidya
    { id: 'oral-traditions', name: 'Oral Traditions', genreId: 'lokavidya' },
    { id: 'lokachara', name: 'Lokachara (Customs)', genreId: 'lokavidya' },
    { id: 'village-jyotishya', name: 'Jyotishya of Villages', genreId: 'lokavidya' },
    { id: 'local-healing', name: 'Ayurveda Deshiya Prayoga', genreId: 'lokavidya' },
    { id: 'tribal-wisdom', name: 'Tribal Wisdom', genreId: 'lokavidya' },
];

export const SUB_CATEGORIES: SubCategory[] = [
    // Rigveda
    { id: 'rigveda-hymns', name: 'Hymns', categoryId: 'rigveda' },
    { id: 'rigveda-commentaries', name: 'Commentaries', categoryId: 'rigveda' },
    { id: 'rigveda-rituals', name: 'Rituals & Applications', categoryId: 'rigveda' },
    // Yajurveda
    { id: 'yajurveda-mantras', name: 'Mantras for Yajna', categoryId: 'yajurveda' },
    { id: 'yajurveda-kalpa', name: 'Kalpa & Ritual System', categoryId: 'yajurveda' },
    // Samaveda
    { id: 'samaveda-chants', name: 'Chants & Musicology', categoryId: 'samaveda' },
    { id: 'samaveda-gana', name: 'Sama Gana Traditions', categoryId: 'samaveda' },
    // Atharvaveda
    { id: 'atharvaveda-ayurveda', name: 'Ayurveda & Healing', categoryId: 'atharvaveda' },
    { id: 'atharvaveda-rituals', name: 'Atharvana Rituals & Tantra', categoryId: 'atharvaveda' },
    // Shiksha
    { id: 'shiksha-pronunciation', name: 'Pronunciation', categoryId: 'shiksha' },
    { id: 'shiksha-recitation', name: 'Recitation Rules', categoryId: 'shiksha' },
    // Vyakarana
    { id: 'vyakarana-panini', name: 'Panini', categoryId: 'vyakarana' },
    { id: 'vyakarana-katyayana', name: 'Katyayana', categoryId: 'vyakarana' },
    { id: 'vyakarana-patanjali', name: 'Patanjali', categoryId: 'vyakarana' },
    // Astika
    { id: 'nyaya-school', name: 'Nyaya', categoryId: 'astika' },
    { id: 'vaisheshika-school', name: 'Vaisheshika', categoryId: 'astika' },
    { id: 'samkhya-school', name: 'Samkhya', categoryId: 'astika' },
    { id: 'yoga-school', name: 'Yoga', categoryId: 'astika' },
    { id: 'mimamsa-school', name: 'Mimamsa', categoryId: 'astika' },
    { id: 'vedanta-school', name: 'Vedanta', categoryId: 'astika' },
    // Nastika
    { id: 'buddhism-school', name: 'Buddhism', categoryId: 'nastika' },
    { id: 'jainism-school', name: 'Jainism', categoryId: 'nastika' },
    { id: 'charvaka-school', name: 'Charvaka', categoryId: 'nastika' },
    // Itihasa
    { id: 'ramayana-itihasa', name: 'Ramayana', categoryId: 'itihasa' },
    { id: 'mahabharata-itihasa', name: 'Mahabharata', categoryId: 'itihasa' },
    // Puranas
    { id: 'vishnu-purana', name: 'Vishnu Purana', categoryId: 'puranas' },
    { id: 'shiva-purana', name: 'Shiva Purana', categoryId: 'puranas' },
    { id: 'devi-bhagavata-purana', name: 'Devi Bhagavata Purana', categoryId: 'puranas' },
    { id: 'bhagavata-purana', name: 'Bhagavata Purana', categoryId: 'puranas' },
    { id: 'skanda-purana', name: 'Skanda Purana', categoryId: 'puranas' },
    // Modern Ayurveda Extensions
    { id: 'manovijnana', name: 'Manovijnana (Psychology)', categoryId: 'modern-extensions-ayurveda' },
    { id: 'roga-vigyana', name: 'Roga Vigyana (Pathology)', categoryId: 'modern-extensions-ayurveda' },
    { id: 'panchakarma', name: 'Panchakarma', categoryId: 'modern-extensions-ayurveda' },
    { id: 'integrative-ayurveda', name: 'Integrative Ayurveda', categoryId: 'modern-extensions-ayurveda' },
    // Ganita
    { id: 'arithmetic', name: 'Arithmetic (Ganitam)', categoryId: 'ganita' },
    { id: 'algebra', name: 'Algebra (Bija Ganita)', categoryId: 'ganita' },
    { id: 'geometry', name: 'Geometry (Rekha Ganita)', categoryId: 'ganita' },
    { id: 'combinatorics', name: 'Combinatorics (Chandas-linked)', categoryId: 'ganita' },
    // Vijnana
    { id: 'rasayana-shastra', name: 'Rasayana Shastra (Chemistry)', categoryId: 'vijnana' },
    { id: 'bhautikashastra', name: 'Bhautikashastra (Physics)', categoryId: 'vijnana' },
    { id: 'jeevashastra', name: 'Jeevashastra (Biology)', categoryId: 'vijnana' },
    { id: 'krishi-shastra', name: 'Krishi Shastra (Agriculture)', categoryId: 'vijnana' },
];

    