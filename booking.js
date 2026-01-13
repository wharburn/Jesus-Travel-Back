// Booking Form Handler
const API_URL = 'https://jesus-travel-back.onrender.com/api/v1';
const LOCAL_API_URL = 'http://localhost:3000/api/v1';

// Use local API if on localhost, otherwise use production
const ACTIVE_API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? LOCAL_API_URL
    : API_URL;

// Global variables for autocomplete
let pickupAutocomplete;
let dropoffAutocomplete;

// Initialize Google Places Autocomplete
window.initAutocomplete = function () {
  console.log('🗺️ Initializing Google Places Autocomplete...');

  const pickupInput = document.getElementById('pickup');
  const dropoffInput = document.getElementById('dropoff');

  if (!pickupInput || !dropoffInput) {
    console.warn('Pickup or dropoff input not found');
    return;
  }

  // Configure autocomplete options
  const options = {
    componentRestrictions: { country: ['uk', 'pt'] }, // Restrict to UK and Portugal
    fields: ['formatted_address', 'geometry', 'name', 'place_id'],
    types: ['establishment', 'geocode'], // Allow both places and addresses
  };

  // Initialize autocomplete for pickup
  pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
  pickupAutocomplete.addListener('place_changed', function () {
    const place = pickupAutocomplete.getPlace();
    if (place.formatted_address) {
      pickupInput.value = place.formatted_address;
      console.log('✅ Pickup location selected:', place.formatted_address);
    }
  });

  // Initialize autocomplete for dropoff
  dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, options);
  dropoffAutocomplete.addListener('place_changed', function () {
    const place = dropoffAutocomplete.getPlace();
    if (place.formatted_address) {
      dropoffInput.value = place.formatted_address;
      console.log('✅ Dropoff location selected:', place.formatted_address);
    }
  });

  console.log('✅ Google Places Autocomplete initialized');
};

document.addEventListener('DOMContentLoaded', function () {
  const bookingForm = document.getElementById('booking-form');
  const quoteResult = document.getElementById('quote-result');
  const bookingSummary = document.getElementById('booking-summary');

  // Exit if not on booking page
  if (!bookingForm) {
    return;
  }

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form values
    const formData = {
      name: document.getElementById('clientName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      passengers: document.getElementById('passengers').value,
      date: document.getElementById('date').value,
      time: document.getElementById('time').value,
      pickup: document.getElementById('pickup').value.trim(),
      dropoff: document.getElementById('dropoff').value.trim(),
      flight: document.getElementById('flight').value.trim(),
      vehicle: document.getElementById('vehicleType').value,
      notes: document.getElementById('notes').value.trim(),
    };

    // Validate required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.date ||
      !formData.time ||
      !formData.pickup ||
      !formData.dropoff ||
      !formData.vehicle
    ) {
      alert(getTranslation('booking.validation.required'));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert(getTranslation('booking.validation.email'));
      return;
    }

    // Build booking summary
    let summaryHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.name"></p>
                        <p class="font-semibold">${escapeHtml(formData.name)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.email"></p>
                        <p class="font-semibold">${escapeHtml(formData.email)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.phone"></p>
                        <p class="font-semibold">${escapeHtml(formData.phone)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.passengers"></p>
                        <p class="font-semibold">${formData.passengers}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.date"></p>
                        <p class="font-semibold">${formatDate(formData.date)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.time"></p>
                        <p class="font-semibold">${formData.time}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.pickup"></p>
                        <p class="font-semibold">${escapeHtml(formData.pickup)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.dropoff"></p>
                        <p class="font-semibold">${escapeHtml(formData.dropoff)}</p>
                    </div>
        `;

    if (formData.flight) {
      summaryHTML += `
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.flight"></p>
                        <p class="font-semibold">${escapeHtml(formData.flight)}</p>
                    </div>
            `;
    }

    summaryHTML += `
                    <div>
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.vehicle"></p>
                        <p class="font-semibold" data-i18n="booking.vehicle.${formData.vehicle}"></p>
                    </div>
        `;

    if (formData.notes) {
      summaryHTML += `
                    <div class="md:col-span-2">
                        <p class="text-sm text-gray-600" data-i18n="booking.summary.notes"></p>
                        <p class="font-semibold">${escapeHtml(formData.notes)}</p>
                    </div>
            `;
    }

    summaryHTML += `
                </div>
            </div>
        `;

    // Display summary
    bookingSummary.innerHTML = summaryHTML;

    // Show result section
    quoteResult.classList.remove('hidden');

    // Apply translations to new content
    if (typeof updatePageLanguage === 'function') {
      updatePageLanguage(localStorage.getItem('language') || 'en');
    }

    // Scroll to result
    quoteResult.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Send to backend
    sendBookingToBackend(formData);
  });

  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const lang = localStorage.getItem('language') || 'en';
    return date.toLocaleDateString(lang, options);
  }

  // Helper function to get translation
  function getTranslation(key) {
    const lang = localStorage.getItem('language') || 'en';
    const keys = key.split('.');
    let value = window.translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return value || key;
  }

  // Function to send booking data to backend
  function sendBookingToBackend(data) {
    // Show loading state
    const submitButton = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    fetch(`${ACTIVE_API_URL}/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        pickupLocation: data.pickup,
        dropoffLocation: data.dropoff,
        pickupDate: data.date,
        pickupTime: data.time,
        passengers: parseInt(data.passengers),
        vehicleType: data.vehicle,
        specialRequests: data.notes + (data.flight ? `\nFlight: ${data.flight}` : ''),
        source: 'web',
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log('Booking submitted successfully:', result);
        // Show success message
        alert('Booking request submitted successfully! We will contact you shortly with a quote.');
        // Reset form
        bookingForm.reset();
      })
      .catch((error) => {
        console.error('Error submitting booking:', error);
        alert('Failed to submit booking. Please try again or contact us directly.');
      })
      .finally(() => {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      });
  }
});
