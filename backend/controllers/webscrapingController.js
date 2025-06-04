import WebscrapingOrchestrator from '../service/webscrapingOrchestrator.js';

// Create a singleton instance
const orchestrator = new WebscrapingOrchestrator();

/**
 * Start a full scraping cycle for specified departments
 */
export const startFullScraping = async (req, res) => {
    try {
        const { departments, termCode, termName } = req.body;

        if (!departments || !Array.isArray(departments) || departments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Departments array is required'
            });
        }

        // Check if scraping is already running
        if (orchestrator.isRunning) {
            return res.status(409).json({
                success: false,
                message: 'Scraping is already in progress'
            });
        }

        // Start scraping asynchronously
        orchestrator.performFullScrape(departments, termCode, termName)
            .then(results => {
                console.log('Full scraping completed:', results.summary);
            })
            .catch(error => {
                console.error('Full scraping failed:', error);
            });

        res.json({
            success: true,
            message: 'Scraping started successfully',
            departments: departments,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error starting full scraping:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start scraping',
            error: error.message
        });
    }
};

/**
 * Scrape specific courses by course codes
 */
export const scrapeSpecificCourses = async (req, res) => {
    try {
        const { courseCodes, termCode, termName } = req.body;

        if (!courseCodes || !Array.isArray(courseCodes) || courseCodes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Course codes array is required'
            });
        }

        const results = await orchestrator.scrapeSpecificCourses(courseCodes, termCode, termName);

        res.json({
            success: true,
            message: 'Course scraping completed',
            results: results,
            coursesProcessed: results.length
        });

    } catch (error) {
        console.error('Error scraping specific courses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to scrape courses',
            error: error.message
        });
    }
};

/**
 * Update professor ratings only
 */
export const updateProfessorRatings = async (req, res) => {
    try {
        const { filter } = req.body || {};

        const results = await orchestrator.updateProfessorRatingsOnly(filter);

        res.json({
            success: true,
            message: 'Professor ratings updated',
            results: results
        });

    } catch (error) {
        console.error('Error updating professor ratings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update professor ratings',
            error: error.message
        });
    }
};

/**
 * Get scraping statistics and status
 */
export const getScrapingStats = async (req, res) => {
    try {
        const stats = await orchestrator.getScrapingStats();

        res.json({
            success: true,
            stats: stats,
            isCurrentlyRunning: orchestrator.isRunning
        });

    } catch (error) {
        console.error('Error getting scraping stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get scraping statistics',
            error: error.message
        });
    }
};

/**
 * Schedule automatic scraping
 */
export const scheduleAutomaticScraping = async (req, res) => {
    try {
        const { cronExpression, departments, options } = req.body;

        if (!cronExpression || !departments) {
            return res.status(400).json({
                success: false,
                message: 'Cron expression and departments are required'
            });
        }

        // Validate cron expression (basic validation)
        const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

        if (!cronRegex.test(cronExpression)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cron expression format'
            });
        }

        const jobId = orchestrator.scheduleAutomaticScraping(cronExpression, departments, options);

        res.json({
            success: true,
            message: 'Automatic scraping scheduled successfully',
            jobId: jobId,
            cronExpression: cronExpression,
            departments: departments
        });

    } catch (error) {
        console.error('Error scheduling automatic scraping:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule automatic scraping',
            error: error.message
        });
    }
};

/**
 * Stop a scheduled scraping job
 */
export const stopScheduledJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: 'Job ID is required'
            });
        }

        const stopped = orchestrator.stopScheduledJob(jobId);

        if (stopped) {
            res.json({
                success: true,
                message: 'Scheduled job stopped successfully',
                jobId: jobId
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Scheduled job not found',
                jobId: jobId
            });
        }

    } catch (error) {
        console.error('Error stopping scheduled job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop scheduled job',
            error: error.message
        });
    }
};

/**
 * Get status of all scheduled jobs
 */
export const getScheduledJobs = async (req, res) => {
    try {
        const jobs = orchestrator.getScheduledJobsStatus();

        res.json({
            success: true,
            jobs: jobs,
            totalJobs: jobs.length
        });

    } catch (error) {
        console.error('Error getting scheduled jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get scheduled jobs',
            error: error.message
        });
    }
};

/**
 * Get common department sets for easy selection
 */
export const getCommonDepartments = async (req, res) => {
    try {
        const departmentSets = WebscrapingOrchestrator.getCommonDepartmentSets();

        res.json({
            success: true,
            departmentSets: departmentSets
        });

    } catch (error) {
        console.error('Error getting common departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get common departments',
            error: error.message
        });
    }
};

/**
 * Get available UCLA terms
 */
export const getAvailableTerms = async (req, res) => {
    try {
        const terms = await orchestrator.uclaScraper.getAvailableTerms();

        res.json({
            success: true,
            terms: terms
        });

    } catch (error) {
        console.error('Error getting available terms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get available terms',
            error: error.message
        });
    }
};

/**
 * Test professor search functionality
 */
export const testProfessorSearch = async (req, res) => {
    try {
        const { professorName } = req.body;

        if (!professorName) {
            return res.status(400).json({
                success: false,
                message: 'Professor name is required'
            });
        }

        const professorData = await orchestrator.rmpScraper.searchProfessor(professorName);

        res.json({
            success: true,
            professorName: professorName,
            data: professorData
        });

    } catch (error) {
        console.error('Error testing professor search:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search professor',
            error: error.message
        });
    }
}; 