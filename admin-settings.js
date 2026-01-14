const API_URL = 'https://jesus-travel-back.onrender.com/api/v1';

// Check authentication
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = 'admin.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadSettings();
  setupEventListeners();
});

// Load admin user info
function loadAdminInfo() {
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  document.getElementById('adminName').textContent = user.email || 'Admin';
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveButton').addEventListener('click', saveSettings);

  // Auto-quote mode toggle
  const autoQuoteToggle = document.getElementById('autoQuoteMode');
  const autoQuoteStatus = document.getElementById('autoQuoteModeStatus');

  autoQuoteToggle.addEventListener('change', () => {
    if (autoQuoteToggle.checked) {
      autoQuoteStatus.textContent = 'ON';
      autoQuoteStatus.classList.remove('text-gray-600');
      autoQuoteStatus.classList.add('text-yellow-600', 'font-bold');
    } else {
      autoQuoteStatus.textContent = 'OFF';
      autoQuoteStatus.classList.remove('text-yellow-600', 'font-bold');
      autoQuoteStatus.classList.add('text-gray-600');
    }
  });
}

// Load settings from API
async function loadSettings() {
  try {
    const response = await fetch(`${API_URL}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'admin.html';
        return;
      }
      throw new Error('Failed to load settings');
    }

    const result = await response.json();
    const settings = result.data;

    // Populate form fields
    document.getElementById('businessName').value = settings.business.name || '';
    document.getElementById('businessPhone').value = settings.business.phone || '';
    document.getElementById('businessEmail').value = settings.business.email || '';
    document.getElementById('businessWhatsapp').value = settings.business.whatsapp || '';

    document.getElementById('pricingTeamPhone').value = settings.pricingTeam.phone || '';
    document.getElementById('pricingTeamEmail').value = settings.pricingTeam.email || '';

    document.getElementById('quoteValidityDays').value = settings.quotes.validityDays || 2;
    document.getElementById('autoSendToCustomer').checked =
      settings.quotes.autoSendToCustomer !== false;

    // Auto-quote mode
    const autoQuoteMode = settings.quotes.autoQuoteMode === true;
    document.getElementById('autoQuoteMode').checked = autoQuoteMode;
    const autoQuoteStatus = document.getElementById('autoQuoteModeStatus');
    if (autoQuoteMode) {
      autoQuoteStatus.textContent = 'ON';
      autoQuoteStatus.classList.remove('text-gray-600');
      autoQuoteStatus.classList.add('text-yellow-600', 'font-bold');
    } else {
      autoQuoteStatus.textContent = 'OFF';
    }

    // Pricing rules
    const pricingRules = settings.pricingRules || {};
    const executiveSedan = pricingRules.executiveSedan || {};
    const luxurySedan = pricingRules.luxurySedan || {};
    const mpvExecutive = pricingRules.mpvExecutive || {};
    const luxurySUV = pricingRules.luxurySUV || {};
    const minibus = pricingRules.minibus || {};

    document.getElementById('pricingExecutiveSedanBase').value = executiveSedan.baseFare ?? 60.0;
    document.getElementById('pricingExecutiveSedanPerKm').value = executiveSedan.perKmRate ?? 2.5;
    document.getElementById('pricingLuxurySedanBase').value = luxurySedan.baseFare ?? 80.0;
    document.getElementById('pricingLuxurySedanPerKm').value = luxurySedan.perKmRate ?? 3.0;
    document.getElementById('pricingMpvExecutiveBase').value = mpvExecutive.baseFare ?? 100.0;
    document.getElementById('pricingMpvExecutivePerKm').value = mpvExecutive.perKmRate ?? 3.5;
    document.getElementById('pricingLuxurySuvBase').value = luxurySUV.baseFare ?? 90.0;
    document.getElementById('pricingLuxurySuvPerKm').value = luxurySUV.perKmRate ?? 3.2;
    document.getElementById('pricingMinibusBase').value = minibus.baseFare ?? 120.0;
    document.getElementById('pricingMinibusPerKm').value = minibus.perKmRate ?? 4.0;

    document.getElementById('emailEnabled').checked = settings.notifications.emailEnabled !== false;
    document.getElementById('whatsappEnabled').checked =
      settings.notifications.whatsappEnabled !== false;

    // Show form, hide loading
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('settingsForm').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading settings:', error);
    showError('Failed to load settings. Please refresh the page.');
    document.getElementById('loadingState').classList.add('hidden');
  }
}

// Save settings
async function saveSettings() {
  const saveButton = document.getElementById('saveButton');
  const originalText = saveButton.innerHTML;

  try {
    // Disable button and show loading
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    // Hide previous messages
    document.getElementById('successMessage').classList.add('hidden');
    document.getElementById('errorMessage').classList.add('hidden');

    // Collect form data
    const settings = {
      business: {
        name: document.getElementById('businessName').value.trim(),
        phone: document.getElementById('businessPhone').value.trim(),
        email: document.getElementById('businessEmail').value.trim(),
        whatsapp: document.getElementById('businessWhatsapp').value.trim(),
      },
      pricingTeam: {
        phone: document.getElementById('pricingTeamPhone').value.trim(),
        email: document.getElementById('pricingTeamEmail').value.trim(),
      },
      quotes: {
        validityDays: parseInt(document.getElementById('quoteValidityDays').value) || 2,
        autoSendToCustomer: document.getElementById('autoSendToCustomer').checked,
        autoQuoteMode: document.getElementById('autoQuoteMode').checked,
      },
      pricingRules: {
        executiveSedan: {
          baseFare: parseFloat(document.getElementById('pricingExecutiveSedanBase').value) || 0,
          perKmRate: parseFloat(document.getElementById('pricingExecutiveSedanPerKm').value) || 0,
        },
        luxurySedan: {
          baseFare: parseFloat(document.getElementById('pricingLuxurySedanBase').value) || 0,
          perKmRate: parseFloat(document.getElementById('pricingLuxurySedanPerKm').value) || 0,
        },
        mpvExecutive: {
          baseFare: parseFloat(document.getElementById('pricingMpvExecutiveBase').value) || 0,
          perKmRate: parseFloat(document.getElementById('pricingMpvExecutivePerKm').value) || 0,
        },
        luxurySUV: {
          baseFare: parseFloat(document.getElementById('pricingLuxurySuvBase').value) || 0,
          perKmRate: parseFloat(document.getElementById('pricingLuxurySuvPerKm').value) || 0,
        },
        minibus: {
          baseFare: parseFloat(document.getElementById('pricingMinibusBase').value) || 0,
          perKmRate: parseFloat(document.getElementById('pricingMinibusPerKm').value) || 0,
        },
      },
      notifications: {
        emailEnabled: document.getElementById('emailEnabled').checked,
        whatsappEnabled: document.getElementById('whatsappEnabled').checked,
      },
    };

    // Validate pricing team phone
    if (!settings.pricingTeam.phone) {
      showError('Pricing Team Phone is required');
      return;
    }

    // Send to API
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'admin.html';
        return;
      }
      throw new Error('Failed to save settings');
    }

    const result = await response.json();
    console.log('Settings saved:', result);

    // Show success message
    showSuccess();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Error saving settings:', error);
    showError('Failed to save settings. Please try again.');
  } finally {
    // Restore button
    saveButton.disabled = false;
    saveButton.innerHTML = originalText;
  }
}

// Show success message
function showSuccess() {
  const successMessage = document.getElementById('successMessage');
  successMessage.classList.remove('hidden');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    successMessage.classList.add('hidden');
  }, 5000);
}

// Show error message
function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 5000);
}
