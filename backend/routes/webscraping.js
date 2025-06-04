import express from 'express';
import * as webscrapingController from '../controllers/webscrapingController.js';

const router = express.Router();

// Main scraping operations
router.post('/start-full-scraping', webscrapingController.startFullScraping);
router.post('/scrape-specific-courses', webscrapingController.scrapeSpecificCourses);
router.post('/update-professor-ratings', webscrapingController.updateProfessorRatings);

// Status and statistics
router.get('/stats', webscrapingController.getScrapingStats);
router.get('/available-terms', webscrapingController.getAvailableTerms);
router.get('/common-departments', webscrapingController.getCommonDepartments);

// Scheduled scraping
router.post('/schedule', webscrapingController.scheduleAutomaticScraping);
router.delete('/schedule/:jobId', webscrapingController.stopScheduledJob);
router.get('/scheduled-jobs', webscrapingController.getScheduledJobs);

// Testing and utilities
router.post('/test-professor-search', webscrapingController.testProfessorSearch);

export default router; 