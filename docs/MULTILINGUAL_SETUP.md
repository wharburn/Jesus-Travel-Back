# Multilingual Website Setup Guide

Complete guide for implementing multi-language functionality on the JT Chauffeur Services website.

---

## Overview

The website supports **7 languages**:

- **English** (en) - Default
- **Spanish** (es) - Español
- **French** (fr) - Français
- **Portuguese** (pt) - Português
- **Chinese** (zh) - 中文
- **Japanese** (ja) - 日本語
- **Arabic** (ar) - العربية

---

## Files Created

1. **translations.js** - Contains all translations for the website
2. **language-switcher.html** - The language selector dropdown UI component
3. **MULTILINGUAL_SETUP.md** - This integration guide

---

## Integration Steps

### Step 1: Add Translation Script to All HTML Files

Add this line in the `<head>` section of each HTML file, **before** the closing `</head>` tag and **before** the `script.js` reference:

```html
<script src="./translations.js"></script>
<script src="./script.js"></script>
```

### Step 2: Add Language Switcher to Header

In each HTML file, add the language switcher component in the header section. Insert it **after** the "Book Now" button div:

```html
<!-- Book Now button below logo -->
<div class="absolute top-24 sm:top-28 md:top-32 right-4 sm:right-8 md:right-12">
  <a href="#contact" class="hidden sm:inline-block bg-transparent border-2 border-jt-gold text-jt-gold font-bold py-2 px-6 rounded hover:bg-jt-gold hover:text-black transition-all duration-300 uppercase tracking-widest text-sm">Book Now</a>
</div>

<!-- Language Switcher - ADD THIS -->
<div class="absolute top-36 sm:top-40 md:top-44 right-4 sm:right-8 md:right-12 z-50">
  <div class="relative">
    <button id="language-toggle" class="flex items-center space-x-2 bg-transparent border-2 border-jt-gold text-jt-gold font-bold py-2 px-4 rounded hover:bg-jt-gold hover:text-black transition-all duration-300 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
      </svg>
      <span id="current-language">English</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <div id="language-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-gray-900 border-2 border-jt-gold rounded-lg shadow-xl overflow-hidden">
      <button data-lang="en" class="w-full text-left px-4 py-3 text-white hover:bg-jt-gold hover:text-black transition-colors duration-200 flex items-center space-x-2">
        <span class="text-lg">🇬🇧</span>
        <span>English</span>
      </button>
      <button data-lang="es" class="w-full text-left px-4 py-3 text-white hover:bg-jt-gold hover:text-black transition-colors duration-200 flex items-center space-x-2">
        <span class="text-lg">🇪🇸</span>
        <span>Español</span>
      </button>
      <button data-lang="fr" class="w-full text-left px-4 py-3 text-white hover:bg-jt-gold hover:text-black transition-colors duration-200 flex items-center space-x-2">
        <span class="text-lg">🇫🇷</span>
        <span>Français</span>
      </button>
      <button data-lang="pt" class="w-full text-left px-4 py-3 text-white hover:bg-jt-gold hover:text-black transition-colors duration-200 flex items-center space-x-2">
        <span class="text-lg">🇵🇹</span>
        <span>Português</span>
      </button>
      <button data-lang="zh" class="w-full text-left px-4 py-3 text-white hover:bg-jt-gold hover:text-black transition-colors duration-200 flex items-center space-x-2">
        <span class="text-lg">🇨🇳</span>
        <span>中文</span>
      </button>
      <button data-lang="ja" class="w-full text-left px-4 py-3 text-white hover:bg-jt-gold hover:text-black transition-colors duration-200 flex items-center space-x-2">
        <span class="text-lg">🇯🇵</span>
        <span>日本語</span>
      </button>
      <button data-lang="ar" class="w-full text-left px-4 py-3 text-white hover:bg-jt-gold hover:text-black transition-colors duration-200 flex items-center space-x-2">
        <span class="text-lg">🇸🇦</span>
        <span>العربية</span>
      </button>
    </div>
  </div>
</div>
```

### Step 3: Add data-i18n Attributes to Translatable Text

Add the `data-i18n` attribute to any element that should be translated. The value should match the translation key in `translations.js`.

**Example for Navigation:**
```html
<a href="./index.html" data-i18n="nav_home">Home</a>
<a href="./transfers.html" data-i18n="nav_transfers">Transfers</a>
<a href="./business-corporate.html" data-i18n="nav_business">Business & Corporate</a>
```

**Example for Hero Section:**
```html
<h1 data-i18n="home_hero_title">Executive Travel, Redefined.</h1>
<p data-i18n="home_hero_subtitle">Offering premier chauffeur services...</p>
<a href="#services">
  <span data-i18n="home_explore_services">Explore Services</span>
</a>
```

**Example for Buttons:**
```html
<a href="#contact" data-i18n="book_now">Book Now</a>
```

## Translation Keys Reference

### Common Keys (Available on all pages)
- `nav_home` - "Home"
- `nav_transfers` - "Transfers"
- `nav_business` - "Business & Corporate"
- `nav_tours` - "Tours"
- `nav_security` - "Private Security"
- `book_now` - "Book Now"
- `view_more` - "View More"

### Home Page Keys
- `home_hero_title`
- `home_hero_subtitle`
- `home_services_title`
- `home_explore_services`
- `service_transfers_title`
- `service_transfers_desc`
- `service_business_title`
- `service_business_desc`
- `service_tours_title`
- `service_tours_desc`
- `service_security_title`
- `service_security_desc`
- `partners_title`
- `partners_subtitle`

### Transfers Page Keys
- `transfers_hero_title`
- `transfers_hero_subtitle`
- `transfers_intro_title`
- `transfers_intro_text`
- `transfers_fleet_title`
- `transfers_book_cta`
- `fleet_saloon_title`
- `fleet_saloon_desc`
- `fleet_mpv_title`
- `fleet_mpv_desc`
- `fleet_suv_title`
- `fleet_suv_desc`
- `fleet_minibus_title`
- `fleet_minibus_desc`

### Business & Corporate Page Keys
- `business_hero_title`
- `business_hero_subtitle`
- `business_intro_title`
- `business_intro_text`
- `business_book_cta`

### Tours Page Keys
- `tours_hero_title`
- `tours_hero_subtitle`
- `tours_intro_title`
- `tours_intro_text`
- `tours_popular_title`
- `tours_design_cta`
- `tour_london_title`
- `tour_london_desc`
- `tour_london_duration`
- `tour_countryside_title`
- `tour_countryside_desc`
- `tour_countryside_duration`
- `tour_shopping_title`
- `tour_shopping_desc`
- `tour_shopping_duration`

### Security Page Keys
- `security_hero_title`
- `security_hero_subtitle`
- `security_intro_title`
- `security_intro_text1`
- `security_intro_text2`
- `security_services_title`
- `security_consultation_cta`
- `security_executive_title`
- `security_executive_desc`
- `security_transport_title`
- `security_transport_desc`
- `security_asset_title`
- `security_asset_desc`
- `security_event_title`
- `security_event_desc`

### Footer Keys
- `footer_certified`
- `footer_company`
- `footer_contact_title`
- `footer_follow_title`
- `footer_copyright`

## How It Works

1. **Language Selection**: User clicks the language dropdown and selects their preferred language
2. **Storage**: The selection is saved to `localStorage` so it persists across page visits
3. **Translation**: All elements with `data-i18n` attributes are automatically updated
4. **RTL Support**: Arabic automatically switches to right-to-left layout
5. **Lang Attribute**: The HTML `lang` attribute is updated for accessibility

---

## Features

- **7 Languages Supported**
- **Persistent Language Selection** (localStorage)
- **RTL Support for Arabic**
- **Accessible** (proper lang attributes)
- **Smooth Transitions**
- **Mobile Responsive**
- **Clean UI Design**

---

## Testing

To test the implementation:

1. Open any page in your browser
2. Click the language selector (shows current language with globe icon)
3. Select a different language
4. Verify all text updates correctly
5. Refresh the page - language should persist
6. Navigate to another page - language should persist

---

## Troubleshooting

### Translation not appearing

- Check that the element has the correct `data-i18n` attribute
- Verify the key exists in `translations.js`
- Check browser console for errors

### Language not persisting

- Ensure localStorage is enabled in the browser
- Check browser console for errors

### Dropdown not opening

- Verify all IDs match (`language-toggle`, `language-dropdown`)
- Check that `script.js` is loaded after `translations.js`

---

## Browser Support

Works on all modern browsers that support:

- localStorage
- ES6 JavaScript
- CSS Flexbox
- CSS Grid

---

## Future Enhancements

Possible additions:

- Auto-detect browser language
- Add more languages
- Translate image alt text
- URL-based language selection (/en/, /es/, etc.)
