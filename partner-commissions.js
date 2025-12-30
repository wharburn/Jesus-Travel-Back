const API_URL = 'https://jesus-travel-back.onrender.com/api/v1';

// Check authentication
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = 'admin.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadForwardedEnquiries();
});

// Logout
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = 'admin.html';
}

// Load forwarded enquiries
async function loadForwardedEnquiries() {
  try {
    const response = await fetch(`${API_URL}/enquiries?limit=1000`, {
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
      const allEnquiries = data.data.enquiries || [];
      const forwarded = allEnquiries.filter((e) => e.forwardedToPartner);

      updateStats(forwarded);
      updatePartnerBreakdown(forwarded);
      renderForwardedTable(forwarded);
    }
  } catch (error) {
    console.error('Error loading forwarded enquiries:', error);
  }
}

// Update summary stats
function updateStats(forwarded) {
  const totalForwarded = forwarded.length;
  const totalValue = forwarded.reduce((sum, e) => sum + (e.quotedPrice || 0), 0);
  const totalCommission = forwarded.reduce((sum, e) => sum + (e.partnerCommissionAmount || 0), 0);
  const avgRate =
    forwarded.filter((e) => e.partnerCommissionRate).length > 0
      ? forwarded.reduce((sum, e) => sum + (e.partnerCommissionRate || 0), 0) /
        forwarded.filter((e) => e.partnerCommissionRate).length
      : 0;

  document.getElementById('totalForwarded').textContent = totalForwarded;
  document.getElementById('totalValue').textContent = `£${totalValue.toFixed(2)}`;
  document.getElementById('totalCommission').textContent = `£${totalCommission.toFixed(2)}`;
  document.getElementById('avgRate').textContent = `${avgRate.toFixed(1)}%`;
}

// Update partner breakdown
function updatePartnerBreakdown(forwarded) {
  const partnerStats = {};

  forwarded.forEach((e) => {
    const partner = e.partnerName || 'Unknown';
    if (!partnerStats[partner]) {
      partnerStats[partner] = {
        count: 0,
        totalValue: 0,
        totalCommission: 0,
      };
    }
    partnerStats[partner].count++;
    partnerStats[partner].totalValue += e.quotedPrice || 0;
    partnerStats[partner].totalCommission += e.partnerCommissionAmount || 0;
  });

  const container = document.getElementById('partnerBreakdown');

  if (Object.keys(partnerStats).length === 0) {
    container.innerHTML = '<div class="col-span-3 text-center text-gray-500 py-8">No forwarded bookings yet</div>';
    return;
  }

  container.innerHTML = Object.entries(partnerStats)
    .map(
      ([partner, stats]) => `
    <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 class="text-lg font-semibold text-yellow-500 mb-2">${escapeHtml(partner)}</h3>
      <div class="space-y-1 text-sm">
        <div><span class="text-gray-400">Bookings:</span> <span class="font-semibold">${stats.count}</span></div>
        <div><span class="text-gray-400">Total Value:</span> <span class="font-semibold text-green-400">£${stats.totalValue.toFixed(2)}</span></div>
        <div><span class="text-gray-400">Commission:</span> <span class="font-semibold text-yellow-400">£${stats.totalCommission.toFixed(2)}</span></div>
      </div>
    </div>
  `
    )
    .join('');
}

// Render forwarded bookings table
function renderForwardedTable(forwarded) {
  const tbody = document.getElementById('forwardedTableBody');

  if (forwarded.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500">
          No forwarded bookings yet
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = forwarded
    .sort((a, b) => new Date(b.forwardedAt) - new Date(a.forwardedAt))
    .map(
      (e) => `
    <tr class="hover:bg-gray-800 transition-colors">
      <td class="px-6 py-4">
        <div class="font-mono text-sm text-yellow-500">${e.referenceNumber}</div>
        ${e.partnerBookingReference ? `<div class="text-xs text-gray-500">Partner: ${escapeHtml(e.partnerBookingReference)}</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <div class="font-semibold">${escapeHtml(e.customerName)}</div>
        <div class="text-sm text-gray-400">${escapeHtml(e.customerPhone)}</div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm">
          <div class="text-green-400">📍 ${escapeHtml(e.pickupLocation)}</div>
          <div class="text-red-400">📍 ${escapeHtml(e.dropoffLocation)}</div>
        </div>
        <div class="text-xs text-gray-500 mt-1">${e.pickupDate} at ${e.pickupTime}</div>
      </td>
      <td class="px-6 py-4">
        <div class="font-semibold text-purple-400">${escapeHtml(e.partnerName || 'N/A')}</div>
        ${e.partnerNotes ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(e.partnerNotes)}</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <div class="font-bold text-green-400">${e.quotedPrice ? `£${e.quotedPrice}` : 'N/A'}</div>
      </td>
      <td class="px-6 py-4">
        ${
          e.partnerCommissionAmount
            ? `<div class="font-bold text-yellow-400">£${e.partnerCommissionAmount.toFixed(2)}</div>
               <div class="text-xs text-gray-500">${e.partnerCommissionRate}%</div>`
            : '<div class="text-gray-500">N/A</div>'
        }
      </td>
      <td class="px-6 py-4">
        <div class="text-sm">${formatDate(e.forwardedAt)}</div>
        <div class="text-xs text-gray-500">${e.forwardedBy || 'N/A'}</div>
      </td>
    </tr>
  `
    )
    .join('');
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

