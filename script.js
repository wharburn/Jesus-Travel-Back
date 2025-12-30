
document.addEventListener('DOMContentLoaded', () => {
  // Get current language from localStorage or default to 'en'
  let currentLang = localStorage.getItem('preferredLanguage') || 'en';
  
  // Mobile menu toggle logic
  const menuButton = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuContainer = document.getElementById('mobile-menu-container');
  
  // Icon elements
  const hamburgerIcon = document.getElementById('menu-hamburger');
  const closeIcon = document.getElementById('menu-close');

  if (menuButton && mobileMenu && menuContainer && hamburgerIcon && closeIcon) {
    const openMenu = () => {
      mobileMenu.classList.remove('-translate-x-full');
      document.body.style.overflow = 'hidden';
      hamburgerIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
    };

    const closeMenu = () => {
      mobileMenu.classList.add('-translate-x-full');
      document.body.style.overflow = '';
      hamburgerIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    };

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobileMenu.classList.contains('-translate-x-full')) {
            openMenu();
        } else {
            closeMenu();
        }
    });

    mobileMenu.addEventListener('click', closeMenu);
    menuContainer.addEventListener('click', (e) => e.stopPropagation());
    
    // Also close menu on link click
    const menuLinks = menuContainer.querySelectorAll('a');
    menuLinks.forEach(link => {
        // We don't need to add a click listener here as navigation will reload the page
        // and reset the menu state. This is sufficient for a static site.
        // If it were a single-page app (SPA), we would add: link.addEventListener('click', closeMenu);
    });
  }

  // Dynamic viewport height for mobile full-screen sections
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVh();
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
  
  // Language switching functionality
  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[currentLang] && translations[currentLang][key]) {
        element.textContent = translations[currentLang][key];
      }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : (lang === 'ja' ? 'ja' : (lang === 'ar' ? 'ar' : lang));
    
    // Update RTL for Arabic
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    // Update active language in dropdown
    updateLanguageDropdown(lang);
  }
  
  function updateLanguageDropdown(lang) {
    const langNames = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      pt: 'Português',
      zh: '中文',
      ja: '日本語',
      ar: 'العربية'
    };
    
    const currentLangBtn = document.getElementById('current-language');
    if (currentLangBtn) {
      currentLangBtn.textContent = langNames[lang] || 'English';
    }
  }
  
  // Toggle language dropdown
  const langToggle = document.getElementById('language-toggle');
  const langDropdown = document.getElementById('language-dropdown');
  
  if (langToggle && langDropdown) {
    let isProcessing = false;
    
    // Toggle dropdown function with debouncing for iOS compatibility
    const toggleDropdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isProcessing) return;
      isProcessing = true;
      
      langDropdown.classList.toggle('hidden');
      
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessing = false;
      }, 300);
    };
    
    // Use touchend instead of touchstart for better iOS compatibility
    langToggle.addEventListener('touchend', toggleDropdown, { passive: false });
    langToggle.addEventListener('click', (e) => {
      // Only handle click if it's not from a touch event
      if (e.detail !== 0 || !('ontouchstart' in window)) {
        toggleDropdown(e);
      }
    });
    
    // Close dropdown when clicking/touching outside
    const closeDropdown = (e) => {
      if (!langDropdown.classList.contains('hidden') && 
          !langToggle.contains(e.target) && 
          !langDropdown.contains(e.target)) {
        langDropdown.classList.add('hidden');
      }
    };
    
    document.addEventListener('click', closeDropdown);
    document.addEventListener('touchend', closeDropdown);
    
    // Prevent dropdown from closing when clicking/touching inside
    const preventClose = (e) => {
      e.stopPropagation();
    };
    
    langDropdown.addEventListener('click', preventClose);
    langDropdown.addEventListener('touchend', preventClose);
  }
  
  // Language selection handlers
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.addEventListener('click', () => {
      const lang = button.getAttribute('data-lang');
      setLanguage(lang);
      if (langDropdown) {
        langDropdown.classList.add('hidden');
      }
    });
  });
  
  // Initialize with saved language
  setLanguage(currentLang);
  
  // Smooth scroll for Book Now and other anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Only handle if it's a hash link (not just "#")
      if (href && href !== '#') {
        e.preventDefault();
        
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('-translate-x-full')) {
            mobileMenu.classList.add('-translate-x-full');
            document.body.style.overflow = '';
            if (hamburgerIcon && closeIcon) {
              hamburgerIcon.classList.remove('hidden');
              closeIcon.classList.add('hidden');
            }
          }
          
          // Smooth scroll to target
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update URL hash without jumping
          if (history.pushState) {
            history.pushState(null, null, href);
          } else {
            location.hash = href;
          }
        }
      }
    });
  });
});
