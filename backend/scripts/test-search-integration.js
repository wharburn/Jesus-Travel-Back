import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { enquiryIndex } from '../src/config/search.js';
import { indexEnquiry, searchEnquiries, removeEnquiryFromIndex, isSearchAvailable } from '../src/services/searchService.js';

console.log('\n🔍 Testing Upstash Search Integration...\n');

// Test data
const testEnquiries = [
  {
    id: uuidv4(),
    referenceNumber: 'TEST001',
    customerName: 'John Smith',
    email: 'john@example.com',
    phone: '+447700900001',
    pickupLocation: 'Heathrow Airport',
    dropoffLocation: 'Central London',
    tripType: 'Airport Transfer',
    vehicleType: 'Saloon',
    status: 'pending_quote',
    source: 'web',
    notes: 'Need child seat',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    referenceNumber: 'TEST002',
    customerName: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+447700900002',
    pickupLocation: 'Gatwick Airport',
    dropoffLocation: 'Brighton',
    tripType: 'Airport Transfer',
    vehicleType: 'MPV',
    status: 'quoted',
    source: 'whatsapp',
    notes: 'Large luggage',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    referenceNumber: 'TEST003',
    customerName: 'Michael Brown',
    email: 'michael@example.com',
    phone: '+447700900003',
    pickupLocation: 'London Bridge',
    dropoffLocation: 'Stansted Airport',
    tripType: 'Airport Transfer',
    vehicleType: 'Executive',
    status: 'confirmed',
    source: 'phone',
    notes: 'Early morning pickup',
    createdAt: new Date().toISOString(),
  },
];

async function runTests() {
  try {
    // Test 1: Check if search is available
    console.log('1️⃣  Checking if search is available...');
    if (!isSearchAvailable()) {
      console.error('❌ Search is not available. Check your environment variables.');
      process.exit(1);
    }
    console.log('✅ Search is available\n');

    // Test 2: Index test enquiries
    console.log('2️⃣  Indexing test enquiries...');
    for (const enquiry of testEnquiries) {
      await indexEnquiry(enquiry);
      console.log(`   ✅ Indexed: ${enquiry.referenceNumber} - ${enquiry.customerName}`);
    }
    console.log('');

    // Wait a bit for indexing to complete
    console.log('⏳ Waiting for indexing to complete...\n');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: Search by location
    console.log('3️⃣  Testing search by location (Heathrow)...');
    const heathrowResults = await searchEnquiries('Heathrow', { limit: 5 });
    console.log(`   Found ${heathrowResults.length} results:`);
    heathrowResults.forEach((result) => {
      console.log(`   - ${result.metadata.referenceNumber}: ${result.metadata.customerName} (Score: ${result.score.toFixed(2)})`);
    });
    console.log('');

    // Test 4: Search by customer name
    console.log('4️⃣  Testing search by customer name (Sarah)...');
    const sarahResults = await searchEnquiries('Sarah', { limit: 5 });
    console.log(`   Found ${sarahResults.length} results:`);
    sarahResults.forEach((result) => {
      console.log(`   - ${result.metadata.referenceNumber}: ${result.metadata.customerName} (Score: ${result.score.toFixed(2)})`);
    });
    console.log('');

    // Test 5: Search by vehicle type
    console.log('5️⃣  Testing search by vehicle type (Executive)...');
    const executiveResults = await searchEnquiries('Executive', { limit: 5 });
    console.log(`   Found ${executiveResults.length} results:`);
    executiveResults.forEach((result) => {
      console.log(`   - ${result.metadata.referenceNumber}: ${result.metadata.vehicleType} (Score: ${result.score.toFixed(2)})`);
    });
    console.log('');

    // Test 6: Search with filter
    console.log('6️⃣  Testing search with status filter (pending_quote)...');
    const pendingResults = await searchEnquiries('airport', {
      limit: 5,
      filter: {
        '@metadata.status': {
          equals: 'pending_quote',
        },
      },
    });
    console.log(`   Found ${pendingResults.length} results:`);
    pendingResults.forEach((result) => {
      console.log(`   - ${result.metadata.referenceNumber}: ${result.metadata.status} (Score: ${result.score.toFixed(2)})`);
    });
    console.log('');

    // Test 7: Cleanup - remove test enquiries
    console.log('7️⃣  Cleaning up test data...');
    for (const enquiry of testEnquiries) {
      await removeEnquiryFromIndex(enquiry.id);
      console.log(`   ✅ Removed: ${enquiry.referenceNumber}`);
    }
    console.log('');

    console.log('🎉 All tests passed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();

