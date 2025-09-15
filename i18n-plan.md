
# Internationalization (i18n) Plan for VakyaVerse

This document outlines the strategy for adding multi-language support to the VakyaVerse application, enabling the user interface (UI) to be displayed in various Indic languages, including Sanskrit.

## 1. Core Technology

We will use the `next-intl` library, which is the standard and recommended solution for internationalization in Next.js applications using the App Router. It provides a robust and scalable way to manage translations and locale routing.

## 2. Directory Structure

The following directory structure will be implemented to manage translation files and i18n-related code:

```
src/
|-- app/
|   |-- [locale]/
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   `-- (protected)/
|       `-- ... (your existing admin routes)
|-- i18n/
|   |-- locales/
|   |   |-- en.json  (English)
|   |   |-- hi.json  (Hindi)
|   |   |-- sa.json  (Sanskrit)
|   |   `-- kn.json  (Kannada)
|   |   `-- ... (other languages)
|   `-- index.ts     (i18n configuration)
|-- middleware.ts   (To handle locale detection and routing)
```

## 3. Implementation Steps

### Step 1: Install Dependencies
The first step is to add `next-intl` to the project's dependencies in `package.json`.

```json
"dependencies": {
  // ... other dependencies
  "next-intl": "^3.15.3"
}
```

### Step 2: Create Translation Files
I will create JSON files for each target language in `src/i18n/locales/`. These files will store key-value pairs for all UI strings.

**Example `en.json`:**
```json
{
  "Sidebar": {
    "dashboard": "Dashboard",
    "activity": "Activity",
    "people": "People"
  }
}
```

**Example `hi.json`:**
```json
{
  "Sidebar": {
    "dashboard": "tableau de bord",
    "activity": "activité",
    "people": "personnes"
  }
}
```

### Step 3: Configure `next-intl`
An `i18n/index.ts` file will be created to configure the library, define supported locales, and set up how translations are loaded.

### Step 4: Implement Middleware
A `middleware.ts` file at the root of `src/` will handle detecting the user's preferred language and routing them to the correct locale-specific URL (e.g., `/en/dashboard`, `/hi/dashboard`).

### Step 5: Update App Layout
The root layout at `src/app/[locale]/layout.tsx` will be created to provide the `next-intl` context to the entire application. The existing content of `src/app/layout.tsx` will be moved here.

### Step 6: Refactor Components to Use Translations
Components containing UI text, such as the main sidebar in `src/app/admin/layout-client.tsx`, will be updated to use hooks provided by `next-intl` to display the correct translated strings based on the current locale.

**Before:**
```tsx
<MenuItem href="/admin/dashboard" label="Dashboard" ... />
```

**After:**
```tsx
import { useTranslations } from 'next-intl';

// ... inside the component
const t = useTranslations('Sidebar');

<MenuItem href="/admin/dashboard" label={t('dashboard')} ... />
```

## 4. Review and Approval
Once you approve this plan, I will proceed with generating the code changes for all the necessary files. This approach ensures the internationalization is scalable, maintainable, and integrated seamlessly with the Next.js framework.
