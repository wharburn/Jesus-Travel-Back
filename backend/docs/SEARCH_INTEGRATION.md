# Upstash Search Integration

## Overview

The JT Chauffeur Services backend now includes **AI-powered semantic search** using Upstash Search. This allows you to search enquiries using natural language queries with intelligent ranking and filtering.

## ✅ What's Been Implemented

### 1. Search Configuration (`src/config/search.js`)
- Initializes Upstash Search client with credentials from environment variables
- Creates an `enquiries` index for storing and searching enquiry data
- Gracefully handles missing credentials

### 2. Search Service (`src/services/searchService.js`)
- **`indexEnquiry(enquiry)`** - Automatically indexes enquiries when created/updated
- **`removeEnquiryFromIndex(id)`** - Removes enquiries from index when deleted
- **`searchEnquiries(query, options)`** - Performs AI-powered semantic search
- **`isSearchAvailable()`** - Checks if search is configured and available

### 3. Automatic Indexing (`src/models/Enquiry.js`)
- Enquiries are automatically indexed when saved
- Enquiries are automatically removed from index when deleted
- Search method updated to use AI-powered search

### 4. Search API Endpoints (`src/routes/search.js`)
- `GET /api/v1/search/enquiries?q=<query>` - Search enquiries
- `GET /api/v1/search/status` - Check if search is available

### 5. Environment Variables
```bash
UPSTASH_SEARCH_REST_URL=https://live-wildcat-28816-eu1-search.upstash.io
UPSTASH_SEARCH_REST_TOKEN=ABYFMGxpdmUtd2lsZGNhdC0yODgxNi1ldTFhZG1pbk5qYzJOV0kzWWpndFlXSm1PQzAwTkRVeUxXRm1PV1l0WmpObU9HVXlNVEpoTW1ZNQ==
```

## 🔍 How to Use

### Search for Enquiries

**Basic search:**
```bash
curl "http://localhost:3000/api/v1/search/enquiries?q=airport+pickup"
```

**Search with limit:**
```bash
curl "http://localhost:3000/api/v1/search/enquiries?q=london&limit=5"
```

**Search with status filter:**
```bash
curl "http://localhost:3000/api/v1/search/enquiries?q=heathrow&status=pending_quote"
```

### Check Search Status

```bash
curl "http://localhost:3000/api/v1/search/status"
```

### Programmatic Usage

```javascript
import { searchEnquiries } from './src/services/searchService.js';

// Simple search
const results = await searchEnquiries('airport transfer', { limit: 10 });

// Search with filter
const results = await searchEnquiries('london', {
  limit: 10,
  filter: {
    '@metadata.status': {
      equals: 'pending_quote'
    }
  }
});
```

## 📊 What Gets Indexed

Each enquiry is indexed with:
- **Content**: Searchable text including customer name, email, phone, locations, vehicle type, reference number, and notes
- **Metadata**: Structured data for filtering
  - `referenceNumber`
  - `customerName`
  - `email`
  - `phone`
  - `pickupLocation`
  - `dropoffLocation`
  - `tripType`
  - `vehicleType`
  - `status`
  - `source`
  - `createdAt`

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm run test:search
```

This will:
1. Check if search is available
2. Index 3 test enquiries
3. Test search by location
4. Test search by customer name
5. Test search by vehicle type
6. Test search with status filter
7. Clean up test data

## 🚀 Features

### AI-Powered Search
- **Natural Language Queries**: Search using phrases like "airport pickup tomorrow"
- **Semantic Understanding**: Finds relevant results even with typos or synonyms
- **Intelligent Ranking**: Results are scored by relevance (0-1 scale)

### Advanced Filtering
Filter search results by metadata fields:
```javascript
{
  '@metadata.status': { equals: 'pending_quote' },
  '@metadata.vehicleType': { equals: 'Executive' }
}
```

### Automatic Indexing
- No manual indexing required
- Enquiries are indexed when created or updated
- Enquiries are removed from index when deleted

### Graceful Degradation
- If search is unavailable, the system falls back to basic listing
- Indexing failures don't break the main application flow

## 📝 Example Search Results

```json
{
  "success": true,
  "data": {
    "query": "heathrow",
    "count": 2,
    "results": [
      {
        "id": "855dd46a-daaa-42cb-a6be-c0c44717ab34",
        "content": {
          "text": "John Smith john@example.com +447700900001 Heathrow Airport Central London..."
        },
        "metadata": {
          "referenceNumber": "TEST001",
          "customerName": "John Smith",
          "pickupLocation": "Heathrow Airport",
          "status": "pending_quote"
        },
        "score": 0.98
      }
    ]
  }
}
```

## 🔧 Troubleshooting

### Search Not Available
- Check that `UPSTASH_SEARCH_REST_URL` and `UPSTASH_SEARCH_REST_TOKEN` are set in `.env`
- Verify credentials are correct in Upstash console
- Check server logs for initialization errors

### No Search Results
- Wait a few seconds after indexing for changes to propagate
- Try broader search terms
- Check that enquiries are being indexed (look for log messages)

### Indexing Errors
- Check Upstash console for quota limits
- Verify the enquiry data structure matches the expected format
- Review error logs for specific error messages

## 📚 Additional Resources

- [Upstash Search Documentation](https://upstash.com/docs/search)
- [Search API Reference](https://upstash.com/docs/search/sdks/ts/getting-started)
- [Filtering Guide](https://upstash.com/docs/search/features/content-and-metadata)

