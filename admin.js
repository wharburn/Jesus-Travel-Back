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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadEnquiries();
  setupEventListeners();
});

// Load admin user info
function loadAdminInfo() {
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  document.getElementById('adminName').textContent = user.email || 'Admin';
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('refreshBtn').addEventListener('click', loadEnquiries);
  document.getElementById('filterStatus').addEventListener('change', applyFilters);
  document.getElementById('filterSource').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 500));
  document.getElementById('prevBtn').addEventListener('click', () => changePage(-1));
  document.getElementById('nextBtn').addEventListener('click', () => changePage(1));
  document.getElementById('cancelQuote').addEventListener('click', closeQuoteModal);
  document.getElementById('quoteForm').addEventListener('submit', submitQuote);
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
  const statusFilter = document.getElementById('filterStatus').value;
  const sourceFilter = document.getElementById('filterSource').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  filteredEnquiries = allEnquiries.filter((enquiry) => {
    const matchesStatus = !statusFilter || enquiry.status === statusFilter;
    const matchesSource = !sourceFilter || enquiry.source === sourceFilter;
    const matchesSearch =
      !searchTerm ||
      enquiry.customerName?.toLowerCase().includes(searchTerm) ||
      enquiry.customerPhone?.toLowerCase().includes(searchTerm) ||
      enquiry.customerEmail?.toLowerCase().includes(searchTerm) ||
      enquiry.referenceNumber?.toLowerCase().includes(searchTerm);

    return matchesStatus && matchesSource && matchesSearch;
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
        <div class="flex space-x-2">
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
    <div class="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
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
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-400">Name</div>
              <div class="font-semibold">${escapeHtml(enquiry.customerName)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Phone</div>
              <div class="font-semibold">${escapeHtml(enquiry.customerPhone)}</div>
            </div>
            ${
              enquiry.customerEmail
                ? `
            <div class="col-span-2">
              <div class="text-sm text-gray-400">Email</div>
              <div class="font-semibold">${escapeHtml(enquiry.customerEmail)}</div>
            </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Journey Details -->
        <div>
          <h3 class="text-lg font-semibold text-yellow-500 mb-3">Journey Details</h3>
          <div class="space-y-3">
            <div>
              <div class="text-sm text-gray-400">Pickup Location</div>
              <div class="font-semibold text-green-400">📍 ${escapeHtml(
                enquiry.pickupLocation
              )}</div>
            </div>
            <div>
              <div class="text-sm text-gray-400">Dropoff Location</div>
              <div class="font-semibold text-red-400">📍 ${escapeHtml(
                enquiry.dropoffLocation
              )}</div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-400">Date</div>
                <div class="font-semibold">${formatDate(enquiry.pickupDate)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-400">Time</div>
                <div class="font-semibold">${enquiry.pickupTime}</div>
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
        </div>

        ${
          enquiry.specialRequests
            ? `
        <div>
          <h3 class="text-lg font-semibold text-yellow-500 mb-3">Special Requests</h3>
          <div class="bg-gray-800 rounded-lg p-4 text-gray-300">
            ${escapeHtml(enquiry.specialRequests)}
          </div>
        </div>
        `
            : ''
        }

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

        <!-- Status & Source -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-gray-400">Status</div>
            ${getStatusBadge(enquiry.status)}
          </div>
          <div>
            <div class="text-sm text-gray-400">Source</div>
            ${getSourceBadge(enquiry.source)}
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
}

// Helper functions
function getStatusBadge(status, quotedPrice) {
  const badges = {
    pending_quote:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-900 text-blue-300">Pending Quote</span>',
    quoted: quotedPrice
      ? `<div><span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900 text-purple-300">Quoted</span><div class="text-lg font-bold text-green-400 mt-1">£${quotedPrice}</div></div>`
      : '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900 text-purple-300">Quoted</span>',
    confirmed:
      '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">Confirmed</span>',
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

    console.log('Deleting enquiry:', enquiryId);
    console.log('API URL:', `${API_URL}/enquiries/${enquiryId}`);

    const response = await fetch(`${API_URL}/enquiries/${enquiryId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Delete response status:', response.status);

    const data = await response.json();
    console.log('Delete response data:', data);

    if (response.ok && data.success) {
      alert(`✅ Enquiry ${referenceNumber} deleted successfully`);
      loadEnquiries(); // Reload the list
    } else {
      alert(`❌ Failed to delete enquiry: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    alert(`❌ Network error: ${error.message}\n\nCheck console for details.`);
  }
}
