const API_URL = 'https://jesus-travel-back.onrender.com/api/v1';

// Check authentication
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = 'admin.html';
}

// Global state
let currentPage = 0;
const pageSize = 20;
let allEnquiries = [];
let filteredEnquiries = [];
let currentQuoteEnquiry = null;
let activeStatusFilter = null; // 'pending_quote', 'quoted', 'confirmed', or null for all
let currentSortBy = 'date-desc';
let googleMapsLoaded = false;
let googleMapsApiKey = '';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadEnquiries();
  setupEventListeners();
  loadGoogleMapsAPI();

  // Set "All" filter as active by default
  setStatusFilter(null);
});

// Load Google Maps API
async function loadGoogleMapsAPI() {
  try {
    const response = await fetch(`${API_URL}/settings/maps-api-key`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      googleMapsApiKey = data.data.apiKey;

      if (googleMapsApiKey) {
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          googleMapsLoaded = true;
          console.log('Google Maps API loaded');
        };
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
        };
        document.head.appendChild(script);
      }
    }
  } catch (error) {
    console.error('Error loading Google Maps API key:', error);
  }
}

// Load admin user info
function loadAdminInfo() {
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  document.getElementById('adminName').textContent = user.email || 'Admin';
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('refreshBtn').addEventListener('click', loadEnquiries);
  document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
  document.getElementById('sortBy').addEventListener('change', (e) => {
    currentSortBy = e.target.value;
    applyFilters();
  });

  // Filter buttons
  document.getElementById('filterAll').addEventListener('click', () => setStatusFilter(null));
  document
    .getElementById('filterPendingQuote')
    .addEventListener('click', () => setStatusFilter('pending_quote'));
  document
    .getElementById('filterQuoted')
    .addEventListener('click', () => setStatusFilter('quoted'));
  document
    .getElementById('filterConfirmed')
    .addEventListener('click', () => setStatusFilter('confirmed'));

  // Pagination
  document.getElementById('prevBtn').addEventListener('click', () => changePage(-1));
  document.getElementById('nextBtn').addEventListener('click', () => changePage(1));

  // Quote modal
  document.getElementById('cancelQuote').addEventListener('click', closeQuoteModal);
  document.getElementById('quoteForm').addEventListener('submit', submitQuote);

  // Column sorting
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const sortKey = th.getAttribute('data-sort');
      handleColumnSort(sortKey);
    });
  });

  // Documentation dropdown toggle
  document.getElementById('docsBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('docsDropdown');
    dropdown.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('docsDropdown');
    const button = document.getElementById('docsBtn');
    if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

// Set status filter and update UI
function setStatusFilter(status) {
  activeStatusFilter = status;

  // Update button styles
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.remove('bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-yellow-600');
    btn.classList.add('bg-gray-700');
  });

  if (status === null) {
    document.getElementById('filterAll').classList.remove('bg-gray-700');
    document.getElementById('filterAll').classList.add('bg-yellow-600');
  } else if (status === 'pending_quote') {
    document.getElementById('filterPendingQuote').classList.remove('bg-gray-700');
    document.getElementById('filterPendingQuote').classList.add('bg-blue-600');
  } else if (status === 'quoted') {
    document.getElementById('filterQuoted').classList.remove('bg-gray-700');
    document.getElementById('filterQuoted').classList.add('bg-purple-600');
  } else if (status === 'confirmed') {
    document.getElementById('filterConfirmed').classList.remove('bg-gray-700');
    document.getElementById('filterConfirmed').classList.add('bg-green-600');
  }

  applyFilters();
}

// Handle column sorting
function handleColumnSort(sortKey) {
  const sortMap = {
    ref: 'date-desc',
    customer: 'customer-asc',
    date: 'date-desc',
    status: 'status-asc',
  };

  currentSortBy = sortMap[sortKey] || 'date-desc';
  document.getElementById('sortBy').value = currentSortBy;
  applyFilters();
}

// Logout
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = 'admin.html';
}

// Load enquiries from API
async function loadEnquiries() {
  try {
    const response = await fetch(`${API_URL}/enquiries?limit=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();

    if (data.success) {
      allEnquiries = data.data.enquiries || [];
      applyFilters();
      updateStats();
    }
  } catch (error) {
    console.error('Error loading enquiries:', error);
    showError('Failed to load enquiries');
  }
}

// Apply filters
function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  // Filter
  filteredEnquiries = allEnquiries.filter((enquiry) => {
    const matchesStatus = !activeStatusFilter || enquiry.status === activeStatusFilter;
    const matchesSearch =
      !searchTerm ||
      enquiry.customerName?.toLowerCase().includes(searchTerm) ||
      enquiry.customerPhone?.toLowerCase().includes(searchTerm) ||
      enquiry.customerEmail?.toLowerCase().includes(searchTerm) ||
      enquiry.referenceNumber?.toLowerCase().includes(searchTerm) ||
      enquiry.pickupLocation?.toLowerCase().includes(searchTerm) ||
      enquiry.dropoffLocation?.toLowerCase().includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  // Sort
  filteredEnquiries.sort((a, b) => {
    switch (currentSortBy) {
      case 'date-desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'date-asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'customer-asc':
        return (a.customerName || '').localeCompare(b.customerName || '');
      case 'customer-desc':
        return (b.customerName || '').localeCompare(a.customerName || '');
      case 'price-desc':
        return (b.quotedPrice || 0) - (a.quotedPrice || 0);
      case 'price-asc':
        return (a.quotedPrice || 0) - (b.quotedPrice || 0);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  currentPage = 0;
  renderEnquiries();
}

// Render enquiries table
function renderEnquiries() {
  const tbody = document.getElementById('enquiriesTableBody');
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageEnquiries = filteredEnquiries.slice(start, end);

  if (pageEnquiries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500">
          No enquiries found
        </td>
      </tr>
    `;
    updatePagination();
    return;
  }

  tbody.innerHTML = pageEnquiries
    .map(
      (enquiry) => `
    <tr class="hover:bg-gray-800 transition-colors">
      <td class="px-6 py-4">
        <div class="font-mono text-sm text-yellow-500">${enquiry.referenceNumber}</div>
      </td>
      <td class="px-6 py-4">
        <div class="font-semibold">${escapeHtml(enquiry.customerName)}</div>
        <div class="text-sm text-gray-400">${escapeHtml(enquiry.customerPhone)}</div>
        ${
          enquiry.customerEmail
            ? `<div class="text-sm text-gray-400">${escapeHtml(enquiry.customerEmail)}</div>`
            : ''
        }
      </td>
      <td class="px-6 py-4">
        <div class="text-sm">
          <div class="text-green-400">📍 ${escapeHtml(enquiry.pickupLocation)}</div>
          <div class="text-red-400">📍 ${escapeHtml(enquiry.dropoffLocation)}</div>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          ${enquiry.passengers} pax • ${escapeHtml(enquiry.vehicleType)}
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm">${formatDate(enquiry.pickupDate)}</div>
        <div class="text-sm text-gray-400">${enquiry.pickupTime}</div>
      </td>
      <td class="px-6 py-4">
        ${getStatusBadge(enquiry.status, enquiry.quotedPrice)}
      </td>
      <td class="px-6 py-4">
        ${getSourceBadge(enquiry.source)}
      </td>
      <td class="px-6 py-4">
        <div class="flex space-x-2 flex-wrap gap-1">
          <button onclick="viewEnquiry('${
            enquiry.id
          }')" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-semibold transition-colors">
            View
          </button>
          ${
            enquiry.status === 'pending_quote'
              ? `<button onclick='openQuoteModal(${JSON.stringify(enquiry).replace(
                  /'/g,
                  '&#39;'
                )})' class="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-semibold transition-colors">
            Quote
          </button>`
              : ''
          }
          ${
            !enquiry.forwardedToPartner && enquiry.status !== 'cancelled'
              ? `<button onclick='openForwardModal(${JSON.stringify(enquiry).replace(
                  /'/g,
                  '&#39;'
                )})' class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-semibold transition-colors">
            → Partner
          </button>`
              : ''
          }
          <button onclick="deleteEnquiry('${enquiry.id}', '${enquiry.referenceNumber}')"
                  class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition-colors">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  updatePagination();
}

// Update statistics
function updateStats() {
  document.getElementById('totalEnquiries').textContent = allEnquiries.length;
  document.getElementById('pendingQuotes').textContent = allEnquiries.filter(
    (e) => e.status === 'pending_quote'
  ).length;
  document.getElementById('quotedCount').textContent = allEnquiries.filter(
    (e) => e.status === 'quoted'
  ).length;
  document.getElementById('confirmedCount').textContent = allEnquiries.filter(
    (e) => e.status === 'confirmed'
  ).length;
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredEnquiries.length / pageSize);
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, filteredEnquiries.length);

  document.getElementById(
    'paginationInfo'
  ).textContent = `Showing ${start}-${end} of ${filteredEnquiries.length} enquiries`;
  document.getElementById('prevBtn').disabled = currentPage === 0;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages - 1;
}

// Change page
function changePage(direction) {
  currentPage += direction;
  renderEnquiries();
}

// View enquiry details
function viewEnquiry(id) {
  const enquiry = allEnquiries.find((e) => e.id === id);
  if (!enquiry) return;

  const modal = document.createElement('div');
  modal.className =
    'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
      <div class="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-2xl font-serif text-yellow-500">Enquiry Details</h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>

      <div class="p-6 space-y-6">
        <!-- Reference -->
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="text-sm text-gray-400">Reference Number</div>
          <div class="text-2xl font-mono text-yellow-500">${enquiry.referenceNumber}</div>
        </div>

        <!-- Customer Info -->
        <div>
          <h3 class="text-lg font-semibold text-yellow-500 mb-3">Customer Information</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-gray-400">Name</div>
              <div class="font-semibold">${escapeHtml(enquiry.customerName)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Date</div>
              <div class="font-semibold">${formatDate(enquiry.pickupDate)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Pickup Location</div>
              <div class="font-semibold text-green-400">📍 ${escapeHtml(
                enquiry.pickupLocation
              )}</div>
            </div>
            ${
              enquiry.customerEmail
                ? `
            <div>
              <div class="text-sm text-gray-400">Email</div>
              <div class="font-semibold">${escapeHtml(enquiry.customerEmail)}</div>
            </div>
            `
                : ''
            }
            <div>
              <div class="text-sm text-gray-400">Time</div>
              <div class="font-semibold">${enquiry.pickupTime}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Dropoff Location</div>
              <div class="font-semibold text-red-400">📍 ${escapeHtml(
                enquiry.dropoffLocation
              )}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Phone</div>
              <div class="font-semibold">${escapeHtml(enquiry.customerPhone)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Passengers</div>
              <div class="font-semibold">${enquiry.passengers}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Vehicle Type</div>
              <div class="font-semibold">${escapeHtml(enquiry.vehicleType)}</div>
            </div>
          </div>
        </div>

        ${
          enquiry.specialRequests
            ? `
        <!-- Special Requests -->
        <div>
          <h3 class="text-lg font-semibold text-yellow-500 mb-3">Special Requests</h3>
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="text-gray-300 mb-3">${escapeHtml(enquiry.specialRequests)}</div>
          </div>
        </div>
        `
            : ''
        }

        <!-- Status & Source -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-gray-400 mb-2">Status</div>
            ${getStatusBadge(enquiry.status)}
          </div>
          <div>
            <div class="text-sm text-gray-400 mb-2">Source</div>
            ${getSourceBadge(enquiry.source)}
          </div>
        </div>

        <!-- Distance, Duration & Price -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="text-sm text-gray-400">Distance</div>
            <div id="routeDistance" class="text-2xl font-bold text-yellow-500">--</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="text-sm text-gray-400">Estimated Duration</div>
            <div id="routeDuration" class="text-2xl font-bold text-yellow-500">--</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="text-sm text-gray-400">Estimated Price</div>
            <div id="estimatedPrice" class="text-2xl font-bold text-yellow-500">--</div>
          </div>
        </div>

        <!-- Route Map -->
        <div>
          <h3 class="text-lg font-semibold text-yellow-500 mb-3">Route Map</h3>
          <div id="routeMap" class="w-full h-96 bg-gray-800 rounded-lg border border-gray-700 relative">
            <div class="absolute inset-0 flex items-center justify-center text-gray-500">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-3"></div>
                <div>Loading map...</div>
              </div>
            </div>
          </div>
        </div>

        ${
          enquiry.quotedPrice
            ? `
        <!-- Quote Information -->
        <div>
          <h3 class="text-lg font-semibold text-yellow-500 mb-3">Quote Information</h3>
          <div class="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 rounded-lg p-4 border border-yellow-700/50">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-400">Quoted Price</div>
                <div class="text-2xl font-bold text-yellow-400">£${enquiry.quotedPrice}</div>
              </div>
              <div>
                <div class="text-sm text-gray-400">Valid Until</div>
                <div class="font-semibold text-gray-300">${
                  enquiry.quoteValidUntil
                    ? new Date(enquiry.quoteValidUntil).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'N/A'
                }</div>
              </div>
            </div>
            ${
              enquiry.quoteBreakdown
                ? `
            <div class="mt-3 pt-3 border-t border-yellow-700/30">
              <div class="text-sm text-gray-400 mb-1">Breakdown/Notes</div>
              <div class="text-gray-300 whitespace-pre-wrap">${escapeHtml(
                enquiry.quoteBreakdown
              )}</div>
            </div>
            `
                : ''
            }
            <div class="mt-3 pt-3 border-t border-yellow-700/30 text-xs text-gray-400">
              Quoted by: ${enquiry.quotedBy || 'N/A'} • ${
                enquiry.quotedAt ? new Date(enquiry.quotedAt).toLocaleString() : 'N/A'
              }
            </div>
          </div>
        </div>
        `
            : ''
        }

        <!-- Driver Information -->
        <div>
          <h3 class="text-lg font-semibold text-yellow-500 mb-3">Driver Information</h3>
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="font-semibold text-white">Not assigned as yet</div>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="text-xs text-gray-500 border-t border-gray-800 pt-4">
          <div>Created: ${new Date(enquiry.createdAt).toLocaleString()}</div>
          <div>Updated: ${new Date(enquiry.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize map after modal is in DOM
  setTimeout(() => {
    initializeRouteMap(enquiry.pickupLocation, enquiry.dropoffLocation, enquiry.vehicleType);
  }, 100);
}

// Pricing rules (matching backend)
const PRICING_RULES = {
  'Standard Sedan': { base_fare: 50.0, per_km_rate: 2.0 },
  'Executive Sedan': { base_fare: 60.0, per_km_rate: 2.5 },
  'Luxury Sedan': { base_fare: 80.0, per_km_rate: 3.0 },
  'Executive MPV': { base_fare: 100.0, per_km_rate: 3.8 },
  'Luxury MPV': { base_fare: 120.0, per_km_rate: 4.5 },
  mpv: { base_fare: 100.0, per_km_rate: 3.8 }, // Fallback for lowercase
  sedan: { base_fare: 50.0, per_km_rate: 2.0 }, // Fallback for lowercase
};

// Calculate estimated price based on distance and vehicle type
function calculateEstimatedPrice(distanceKm, vehicleType) {
  const pricing = PRICING_RULES[vehicleType] || PRICING_RULES['Standard Sedan'];
  const baseFare = pricing.base_fare;
  const distanceCharge = distanceKm * pricing.per_km_rate;
  const subtotal = baseFare + distanceCharge;

  // Round to nearest 0.50
  const total = Math.round(subtotal / 0.5) * 0.5;

  return total.toFixed(2);
}

// Initialize Google Maps with route
function initializeRouteMap(pickupAddress, dropoffAddress, vehicleType = 'Standard Sedan') {
  const mapElement = document.getElementById('routeMap');
  const distanceElement = document.getElementById('routeDistance');
  const durationElement = document.getElementById('routeDuration');
  const priceElement = document.getElementById('estimatedPrice');

  if (!mapElement) {
    console.error('Map element not available');
    return;
  }

  // Check if Google Maps is loaded
  if (!window.google || !window.google.maps) {
    mapElement.innerHTML = `
      <div class="flex items-center justify-center h-full text-gray-400">
        <div class="text-center">
          <div class="text-2xl mb-2">🗺️</div>
          <div>Map not available</div>
          <div class="text-sm text-gray-500 mt-1">Google Maps API not configured</div>
        </div>
      </div>
    `;
    return;
  }

  // Initialize geocoder and directions service
  const geocoder = new google.maps.Geocoder();
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: '#EAB308', // Yellow color
      strokeWeight: 4,
    },
  });

  // Initialize map centered on UK
  const map = new google.maps.Map(mapElement, {
    zoom: 8,
    center: { lat: 51.5074, lng: -0.1278 }, // London
    styles: [
      {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }],
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }],
      },
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
      },
    ],
  });

  directionsRenderer.setMap(map);

  // Calculate and display route
  directionsService.route(
    {
      origin: pickupAddress,
      destination: dropoffAddress,
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);

        // Display route information
        const route = result.routes[0].legs[0];
        const distanceKm = route.distance.value / 1000; // Convert meters to km

        if (distanceElement) {
          distanceElement.textContent = route.distance.text;
        }
        if (durationElement) {
          durationElement.textContent = route.duration.text;
        }
        if (priceElement) {
          const estimatedPrice = calculateEstimatedPrice(distanceKm, vehicleType);
          priceElement.textContent = `£${estimatedPrice}`;
        }
      } else {
        console.error('Directions request failed:', status);
        mapElement.innerHTML = `
          <div class="flex items-center justify-center h-full text-red-400">
            <div class="text-center">
              <div class="text-2xl mb-2">⚠️</div>
              <div>Unable to load route</div>
              <div class="text-sm text-gray-500 mt-1">${status}</div>
            </div>
          </div>
        `;
        if (distanceElement) {
          distanceElement.textContent = 'N/A';
        }
        if (durationElement) {
          durationElement.textContent = 'N/A';
        }
        if (priceElement) {
          priceElement.textContent = 'N/A';
        }
      }
    }
  );
}

// Helper functions
function getStatusBadge(status, quotedPrice) {
  const badges = {
    pending_quote:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-900 text-blue-300">Pending Quote</span>',
    quoted: quotedPrice
      ? `<div class="flex flex-col items-start gap-1">
           <div class="text-xl font-bold text-green-400">£${quotedPrice}</div>
           <span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900 text-purple-300">Quoted</span>
         </div>`
      : '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900 text-purple-300">Quoted</span>',
    confirmed:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">Confirmed</span>',
    forwarded:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-orange-900 text-orange-300">→ Forwarded</span>',
    cancelled:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-900 text-red-300">Cancelled</span>',
  };
  return badges[status] || status;
}

function getSourceBadge(source) {
  const badges = {
    web: '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-900 text-indigo-300">🌐 Web</span>',
    whatsapp:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">💬 WhatsApp</span>',
    phone:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-900 text-yellow-300">📞 Phone</span>',
  };
  return badges[source] || source;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showError(message) {
  alert(message);
}

// Quote submission functions
function openQuoteModal(enquiry) {
  currentQuoteEnquiry = enquiry;

  // Populate enquiry details
  document.getElementById('quoteEnquiryDetails').innerHTML = `
    <div class="space-y-1">
      <p><strong>Reference:</strong> ${enquiry.referenceNumber}</p>
      <p><strong>Customer:</strong> ${enquiry.customerName}</p>
      <p><strong>Route:</strong> ${enquiry.pickupLocation} → ${enquiry.dropoffLocation}</p>
      <p><strong>Date:</strong> ${enquiry.pickupDate} at ${enquiry.pickupTime}</p>
      <p><strong>Vehicle:</strong> ${enquiry.vehicleType}</p>
      <p><strong>Passengers:</strong> ${enquiry.passengers}</p>
    </div>
  `;

  // Reset form
  document.getElementById('quoteForm').reset();
  document.getElementById('quoteError').classList.add('hidden');
  document.getElementById('quoteSuccess').classList.add('hidden');

  // Set default valid until (48 hours from now)
  const defaultValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const localDateTime = new Date(
    defaultValidUntil.getTime() - defaultValidUntil.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);
  document.getElementById('quoteValidUntil').value = localDateTime;

  // Show modal
  document.getElementById('quoteModal').classList.remove('hidden');
}

function closeQuoteModal() {
  document.getElementById('quoteModal').classList.add('hidden');
  currentQuoteEnquiry = null;
}

async function submitQuote(e) {
  e.preventDefault();

  if (!currentQuoteEnquiry) return;

  const price = parseFloat(document.getElementById('quotePrice').value);
  const breakdown = document.getElementById('quoteBreakdown').value.trim();
  const notes = document.getElementById('quoteNotes').value.trim();
  const validUntil = document.getElementById('quoteValidUntil').value;

  const errorEl = document.getElementById('quoteError');
  const successEl = document.getElementById('quoteSuccess');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  try {
    const body = {
      price,
      currency: 'GBP',
    };

    if (breakdown) body.breakdown = breakdown;
    if (notes) body.notes = notes;
    if (validUntil) body.validUntil = new Date(validUntil).toISOString();

    const response = await fetch(`${API_URL}/enquiries/${currentQuoteEnquiry.id}/quote`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Show the quote message that needs to be sent
      const quoteMessage = data.data.quoteMessage;
      const customerPhone = data.data.customerPhone;

      successEl.innerHTML = `
        ✅ Quote submitted successfully!<br><br>
        <strong>Customer Phone:</strong> ${customerPhone}<br><br>
        <strong>Message to send:</strong><br>
        <textarea readonly class="w-full bg-gray-800 text-white p-2 rounded mt-2 text-sm" rows="10">${quoteMessage}</textarea>
        <button onclick="navigator.clipboard.writeText(\`${quoteMessage.replace(
          /`/g,
          '\\`'
        )}\`).then(() => alert('Quote message copied! Send it to ${customerPhone}'))"
                class="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded">
          📋 Copy Message to Send
        </button>
      `;
      successEl.classList.remove('hidden');

      // Reload enquiries after 5 seconds
      setTimeout(() => {
        closeQuoteModal();
        loadEnquiries();
      }, 5000);
    } else {
      errorEl.textContent = data.error?.message || 'Failed to submit quote';
      errorEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error submitting quote:', error);
    errorEl.textContent = 'Network error. Please try again.';
    errorEl.classList.remove('hidden');
  }
}

// Delete enquiry with confirmation
async function deleteEnquiry(enquiryId, referenceNumber) {
  const confirmed = confirm(
    `⚠️ Are you sure you want to delete enquiry ${referenceNumber}?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');

    const response = await fetch(`${API_URL}/enquiries/${enquiryId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Successfully deleted
      await loadEnquiries(); // Reload the list first
      alert(`✅ Enquiry ${referenceNumber} deleted successfully`);
    } else {
      // Failed to delete
      alert(`❌ Failed to delete enquiry: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    alert(`❌ Network error: ${error.message}`);
  }
}

// Partner forwarding functions
let currentForwardEnquiry = null;

function openForwardModal(enquiry) {
  currentForwardEnquiry = enquiry;

  const modal = document.createElement('div');
  modal.id = 'forwardModal';
  modal.className =
    'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-800">
      <div class="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-2xl font-serif text-yellow-500">Forward to Partner</h2>
        <button onclick="closeForwardModal()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>

      <div class="p-6 space-y-4">
        <!-- Enquiry Details -->
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 class="text-lg font-semibold text-yellow-500 mb-2">Booking Details</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div><span class="text-gray-400">Reference:</span> <span class="font-mono text-yellow-500">${
              enquiry.referenceNumber
            }</span></div>
            <div><span class="text-gray-400">Customer:</span> ${escapeHtml(
              enquiry.customerName
            )}</div>
            <div class="col-span-2"><span class="text-gray-400">Route:</span> ${escapeHtml(
              enquiry.pickupLocation
            )} → ${escapeHtml(enquiry.dropoffLocation)}</div>
            <div><span class="text-gray-400">Date:</span> ${enquiry.pickupDate}</div>
            <div><span class="text-gray-400">Time:</span> ${enquiry.pickupTime}</div>
            <div><span class="text-gray-400">Vehicle:</span> ${escapeHtml(
              enquiry.vehicleType
            )}</div>
            <div><span class="text-gray-400">Passengers:</span> ${enquiry.passengers}</div>
            ${
              enquiry.quotedPrice
                ? `<div class="col-span-2"><span class="text-gray-400">Quoted Price:</span> <span class="text-xl font-bold text-green-400">£${enquiry.quotedPrice}</span></div>`
                : ''
            }
          </div>
        </div>

        <!-- Partner Selection Form -->
        <form id="forwardForm" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Partner Name *</label>
            <select id="partnerName" required class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none">
              <option value="">Select Partner...</option>
              <option value="Addison Lee">Addison Lee</option>
              <option value="Uber">Uber</option>
              <option value="Bolt">Bolt</option>
              <option value="Local Operator">Local Operator</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Commission Rate (%)</label>
            <input type="number" id="commissionRate" min="0" max="100" step="0.1" placeholder="e.g., 15" class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none" />
            ${
              enquiry.quotedPrice
                ? `<div class="text-sm text-gray-400 mt-1">Commission will be calculated from quoted price: £${enquiry.quotedPrice}</div>`
                : ''
            }
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Partner Booking Reference</label>
            <input type="text" id="bookingReference" placeholder="Partner's booking reference number" class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
            <textarea id="partnerNotes" rows="3" placeholder="Any additional notes..." class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"></textarea>
          </div>

          <div id="forwardError" class="hidden bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm"></div>
          <div id="forwardSuccess" class="hidden bg-green-900/30 border border-green-700 rounded p-3 text-green-300 text-sm"></div>

          <div class="flex space-x-3">
            <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded transition-colors">
              → Forward to Partner
            </button>
            <button type="button" onclick="closeForwardModal()" class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle form submission
  document.getElementById('forwardForm').addEventListener('submit', submitForward);
}

function closeForwardModal() {
  const modal = document.getElementById('forwardModal');
  if (modal) {
    modal.remove();
  }
  currentForwardEnquiry = null;
}

async function submitForward(e) {
  e.preventDefault();

  const partnerName = document.getElementById('partnerName').value;
  const commissionRate = document.getElementById('commissionRate').value;
  const bookingReference = document.getElementById('bookingReference').value;
  const notes = document.getElementById('partnerNotes').value;

  const errorEl = document.getElementById('forwardError');
  const successEl = document.getElementById('forwardSuccess');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  try {
    const response = await fetch(
      `${API_URL}/enquiries/${currentForwardEnquiry.id}/forward-to-partner`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerName,
          commissionRate: commissionRate ? parseFloat(commissionRate) : null,
          bookingReference: bookingReference || null,
          notes: notes || null,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      // Show export data
      const exportData = data.data.exportData;
      const exportText = `
BOOKING EXPORT FOR ${partnerName.toUpperCase()}
${'='.repeat(50)}

Reference: ${exportData.referenceNumber}
Customer: ${exportData.customerName}
Phone: ${exportData.customerPhone}
Email: ${exportData.customerEmail || 'N/A'}

JOURNEY DETAILS:
Pickup: ${exportData.pickupLocation}
Dropoff: ${exportData.dropoffLocation}
Date: ${exportData.pickupDate}
Time: ${exportData.pickupTime}

VEHICLE & PASSENGERS:
Vehicle Type: ${exportData.vehicleType}
Passengers: ${exportData.passengers}
Special Requests: ${exportData.specialRequests || 'None'}

PRICING:
Quoted Price: £${exportData.quotedPrice || 'N/A'}
${exportData.commissionRate ? `Commission Rate: ${exportData.commissionRate}%` : ''}
${
  exportData.commissionAmount ? `Commission Amount: £${exportData.commissionAmount.toFixed(2)}` : ''
}
      `.trim();

      successEl.innerHTML = `
        ✅ Booking forwarded to ${partnerName} successfully!<br><br>
        <textarea readonly class="w-full bg-gray-800 text-white p-3 rounded mt-2 text-sm font-mono" rows="20">${exportText}</textarea>
        <button onclick="navigator.clipboard.writeText(\`${exportText.replace(
          /`/g,
          '\\`'
        )}\`).then(() => alert('Booking details copied!'))"
                class="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded">
          📋 Copy Booking Details
        </button>
        <button onclick="closeForwardModal(); loadEnquiries();"
                class="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded">
          ✓ Done
        </button>
      `;
      successEl.classList.remove('hidden');

      // Hide form
      document.getElementById('forwardForm').querySelector('button[type="submit"]').disabled = true;
    } else {
      errorEl.textContent = data.error?.message || 'Failed to forward booking';
      errorEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error forwarding to partner:', error);
    errorEl.textContent = `Network error: ${error.message}`;
    errorEl.classList.remove('hidden');
  }
}
