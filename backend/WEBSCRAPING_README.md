# BruinWatch Webscraping Module

This module provides comprehensive webscraping functionality for UCLA class schedules, course information, and professor ratings from RateMyProfessor.

## Features

### 🏫 UCLA Class Scraping
- **Class Schedules**: Scrape complete course schedules by department and term
- **Course Details**: Extract course descriptions, prerequisites, and corequisites
- **Enrollment Data**: Get current enrollment numbers and waitlist information
- **Schedule Information**: Parse meeting times, locations, and class types

### ⭐ Professor Rating Integration
- **RateMyProfessor Data**: Fetch professor ratings, difficulty scores, and reviews
- **Smart Matching**: Advanced name matching with Levenshtein distance algorithm
- **Automatic Updates**: Link professor ratings to existing class data

### 🤖 Automated Scheduling
- **Cron Jobs**: Schedule automatic scraping at specified intervals
- **Multiple Departments**: Batch process multiple departments efficiently
- **Error Handling**: Robust retry logic and error recovery

## Architecture

```
backend/service/
├── baseScraper.js              # Base scraping utilities and rate limiting
├── uclaClassScraper.js         # UCLA-specific scraping logic
├── rateMyProfessorScraper.js   # RateMyProfessor integration
└── webscrapingOrchestrator.js  # Main coordinator service

backend/controllers/
└── webscrapingController.js    # API endpoint handlers

backend/routes/
└── webscraping.js              # Route definitions

backend/models/
└── class.js                    # Enhanced class model with scraping fields
```

## API Endpoints

### Main Operations

#### `POST /webscraping/start-full-scraping`
Start a complete scraping cycle for specified departments.

**Request Body:**
```json
{
  "departments": ["COM SCI", "MATH", "PHYSICS"],
  "termCode": "23F",
  "termName": "Fall 2023"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scraping started successfully",
  "departments": ["COM SCI", "MATH", "PHYSICS"],
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

#### `POST /webscraping/scrape-specific-courses`
Scrape specific courses by course codes.

**Request Body:**
```json
{
  "courseCodes": ["CS 31", "CS 32", "MATH 31A"],
  "termCode": "23F",
  "termName": "Fall 2023"
}
```

#### `POST /webscraping/update-professor-ratings`
Update professor ratings for existing classes.

**Request Body:**
```json
{
  "filter": {
    "department": "COM SCI",
    "term": "Fall 2023"
  }
}
```

### Information & Status

#### `GET /webscraping/stats`
Get comprehensive scraping statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalClasses": 1250,
    "classesWithRatings": 890,
    "ratingCoverage": "71.2%",
    "recentlyScraped": 45,
    "departmentStats": [
      {
        "_id": "COM SCI",
        "count": 89,
        "avgRating": 3.8,
        "lastScraped": "2023-12-01T09:30:00.000Z"
      }
    ]
  },
  "isCurrentlyRunning": false
}
```

#### `GET /webscraping/available-terms`
Get available UCLA terms for scraping.

#### `GET /webscraping/common-departments`
Get predefined department sets (STEM, Business, Humanities, etc.).

### Scheduled Operations

#### `POST /webscraping/schedule`
Schedule automatic scraping with cron expressions.

**Request Body:**
```json
{
  "cronExpression": "0 2 * * 1",
  "departments": ["COM SCI", "MATH"],
  "options": {
    "termCode": "23F",
    "termName": "Fall 2023"
  }
}
```

#### `GET /webscraping/scheduled-jobs`
Get all scheduled scraping jobs.

#### `DELETE /webscraping/schedule/:jobId`
Stop a scheduled scraping job.

### Testing & Utilities

#### `POST /webscraping/test-professor-search`
Test professor search functionality.

**Request Body:**
```json
{
  "professorName": "Carey Nachenberg"
}
```

## Data Model

The enhanced Class model includes comprehensive fields for scraped data:

```javascript
{
  // Basic Information
  name: String,                    // Course title
  courseCode: String,              // "CS 31"
  units: Number,                   // Credit units
  term: String,                    // "Fall 2023"
  
  // Course Details
  description: String,             // Course description
  prerequisites: [String],         // ["CS 30", "MATH 31A"]
  corequisites: [String],         // Co-required courses
  
  // Professor Information
  professor: String,               // Professor name
  professorRating: Number,         // RMP overall rating (1-5)
  professorDifficulty: Number,     // RMP difficulty (1-5)
  professorWouldTakeAgain: Number, // Percentage
  
  // Schedule Information
  schedule: [{
    days: [String],                // ["M", "W", "F"]
    startTime: String,             // "10:00 AM"
    endTime: String,               // "11:50 AM"
    location: String,              // "BOELTER 5419"
    type: String                   // "Lecture", "Discussion"
  }],
  
  // Enrollment Data
  totalSeats: Number,              // Total capacity
  availableSeats: Number,          // Open spots
  waitlistTotal: Number,           // Waitlist size
  
  // Metadata
  lastScraped: Date,               // Last update time
  scrapedFrom: [String]            // ["ucla-registrar", "ratemyprofessor"]
}
```

## Usage Examples

### 1. Quick Course Lookup
```javascript
// Scrape specific Computer Science courses
const response = await fetch('/webscraping/scrape-specific-courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseCodes: ['CS 31', 'CS 32', 'CS 33']
  })
});
```

### 2. Department-Wide Scraping
```javascript
// Scrape all STEM departments for current term
const response = await fetch('/webscraping/start-full-scraping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    departments: ['COM SCI', 'MATH', 'PHYSICS', 'CHEM']
  })
});
```

### 3. Scheduled Weekly Updates
```javascript
// Schedule weekly scraping every Monday at 2 AM
const response = await fetch('/webscraping/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cronExpression: '0 2 * * 1',  // Every Monday 2 AM
    departments: ['COM SCI', 'MATH']
  })
});
```

### 4. Professor Rating Updates
```javascript
// Update ratings for Computer Science classes only
const response = await fetch('/webscraping/update-professor-ratings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filter: { department: 'COM SCI' }
  })
});
```

## Configuration

### Environment Variables
```bash
# Rate limiting (optional)
SCRAPING_RATE_LIMIT=2000    # Delay between requests (ms)
SCRAPING_RETRY_ATTEMPTS=3   # Max retry attempts

# Puppeteer settings (optional)
PUPPETEER_HEADLESS=true     # Run browser in headless mode
PUPPETEER_TIMEOUT=30000     # Page load timeout (ms)
```

### Common Department Sets

The system includes predefined department groupings:

- **STEM**: Computer Science, Math, Physics, Chemistry, Engineering
- **Business**: Management, Economics, Statistics, Accounting
- **Humanities**: English, History, Philosophy, Art
- **Social Sciences**: Psychology, Sociology, Political Science, Anthropology
- **Life Sciences**: Life Sciences, Biology, Biochemistry, Physiological Science
- **Popular**: Most commonly scraped departments

## Error Handling

The system includes comprehensive error handling:

### Rate Limiting
- Automatic delays between requests
- Exponential backoff on failures
- Respect for server response times

### Retry Logic
- Multiple retry attempts with increasing delays
- Graceful fallback for failed requests
- Detailed error logging

### Data Validation
- Course code format validation
- Professor name normalization
- Schedule parsing with error recovery

## Testing

### Run Test Suite
```bash
cd backend
node testing/testWebscraping.js
```

### Test Individual Components
```javascript
import { RateMyProfessorScraper } from './service/rateMyProfessorScraper.js';

const scraper = new RateMyProfessorScraper();
const result = await scraper.searchProfessor('Carey Nachenberg');
console.log(result);
```

## Performance & Scalability

### Optimizations
- **Parallel Processing**: Multiple departments scraped concurrently
- **Intelligent Caching**: Avoid re-scraping recent data
- **Selective Updates**: Update only changed information
- **Database Indexing**: Optimized queries for course codes and professors

### Monitoring
- **Real-time Statistics**: Track scraping progress and success rates
- **Error Logging**: Comprehensive error tracking and reporting
- **Performance Metrics**: Monitor response times and data quality

## Common Issues & Solutions

### Issue: "spawn yt-dlp ENOENT" Error
**Solution**: Ensure all dependencies are installed with `npm install`

### Issue: Professor Not Found
**Solution**: Try variations of the professor's name or check the RateMyProfessor search manually

### Issue: Slow Scraping Performance
**Solution**: Adjust rate limiting settings or reduce concurrent operations

### Issue: UCLA Website Changes
**Solution**: Update CSS selectors in the UCLA scraper class

## Legal & Ethical Considerations

- **Rate Limiting**: Respectful request timing to avoid server overload
- **Public Data**: Only scrapes publicly available information
- **Terms of Service**: Complies with UCLA and RateMyProfessor ToS
- **Data Usage**: For educational and research purposes only

## Contributing

When adding new scraping targets:

1. Extend the `BaseScraper` class
2. Implement site-specific parsing logic
3. Add appropriate rate limiting
4. Include comprehensive error handling
5. Add tests for new functionality

## Support

For issues or questions:
1. Check the error logs for detailed information
2. Run the test suite to verify functionality
3. Review the API documentation for correct usage
4. Create an issue with reproduction steps 