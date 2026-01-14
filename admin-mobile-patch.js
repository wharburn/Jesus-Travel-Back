// Mobile Card Rendering Function - Add this to admin.js
// This function renders enquiries as cards for mobile view

function renderMobileCards() {
  const container = document.getElementById('enquiriesCardsContainer');
  if (!container) return; // Skip if container doesn't exist
  
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageEnquiries = filteredEnquiries.slice(start, end);

  if (pageEnquiries.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        No enquiries found
      </div>
    `;
    return;
  }

  container.innerHTML = pageEnquiries
    .map(
      (enquiry) => `
    <div class="enquiry-card">
      <div class="enquiry-card-header">
        <div>
          <div class="font-mono text-sm text-yellow-500 font-bold">${enquiry.referenceNumber}</div>
          <div class="text-xs text-gray-500 mt-1">${formatDate(enquiry.pickupDate)} at ${enquiry.pickupTime}</div>
        </div>
        <div>
          ${getStatusBadge(enquiry.status, enquiry.quotedPrice)}
        </div>
      </div>
      
      <div class="enquiry-card-body">
        <div class="enquiry-card-row">
          <span class="enquiry-card-label">Customer:</span>
          <span>${escapeHtml(enquiry.customerName)}</span>
        </div>
        <div class="enquiry-card-row">
          <span class="enquiry-card-label">Phone:</span>
          <span>${escapeHtml(enquiry.customerPhone)}</span>
        </div>
        ${
          enquiry.customerEmail
            ? `<div class="enquiry-card-row">
                <span class="enquiry-card-label">Email:</span>
                <span class="text-xs">${escapeHtml(enquiry.customerEmail)}</span>
              </div>`
            : ''
        }
        <div class="enquiry-card-row">
          <span class="enquiry-card-label">From:</span>
          <span class="text-green-400">📍 ${escapeHtml(enquiry.pickupLocation)}</span>
        </div>
        <div class="enquiry-card-row">
          <span class="enquiry-card-label">To:</span>
          <span class="text-red-400">📍 ${escapeHtml(enquiry.dropoffLocation)}</span>
        </div>
        <div class="enquiry-card-row">
          <span class="enquiry-card-label">Details:</span>
          <span>${enquiry.passengers} pax • ${escapeHtml(enquiry.vehicleType)}</span>
        </div>
        <div class="enquiry-card-row">
          <span class="enquiry-card-label">Source:</span>
          <span>${getSourceBadge(enquiry.source)}</span>
        </div>
      </div>

      <div class="enquiry-card-actions">
        <button onclick="viewEnquiry('${
          enquiry.id
        }')" class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold transition-colors">
          👁️ View
        </button>
        ${
          enquiry.status === 'pending_quote'
            ? `<button onclick='openQuoteModal(${JSON.stringify(enquiry).replace(
                /'/g,
                '&#39;'
              )})' class="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded text-sm font-semibold transition-colors">
          💰 Quote
        </button>`
            : ''
        }
        ${
          !enquiry.forwardedToPartner && enquiry.status !== 'cancelled'
            ? `<button onclick='openForwardModal(${JSON.stringify(enquiry).replace(
                /'/g,
                '&#39;'
              )})' class="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold transition-colors">
          🤝 Partner
        </button>`
            : ''
        }
        <button onclick="deleteEnquiry('${enquiry.id}', '${enquiry.referenceNumber}')"
                class="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-semibold transition-colors">
          🗑️ Delete
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

// Modify the original renderEnquiries function to call both desktop and mobile renders
// Replace the original renderEnquiries function with this:
/*
function renderEnquiries() {
  renderDesktopTable();
  renderMobileCards();
  updatePagination();
}

function renderDesktopTable() {
  const tbody = document.getElementById('enquiriesTableBody');
  // ... rest of the original renderEnquiries code ...
}
*/

