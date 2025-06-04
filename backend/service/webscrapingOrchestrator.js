import UCLAClassScraper from './uclaClassScraper.js';
import RateMyProfessorScraper from './rateMyProfessorScraper.js';
import Class from '../models/class.js';
import cron from 'node-cron';

class WebscrapingOrchestrator {
    constructor() {
        this.uclaScraper = new UCLAClassScraper();
        this.rmpScraper = new RateMyProfessorScraper();
        this.isRunning = false;
        this.scheduledJobs = new Map();
    }

    /**
     * Perform a full scraping cycle for specified departments
     */
    async performFullScrape(departments, termCode = null, termName = null) {
        if (this.isRunning) {
            throw new Error('Scraping is already in progress');
        }

        this.isRunning = true;
        const startTime = new Date();

        try {
            console.log('🚀 Starting full webscraping cycle...');
            console.log(`Departments: ${departments.join(', ')}`);

            // Step 1: Get available terms if not provided
            if (!termCode || !termName) {
                console.log('\n📅 Fetching available terms...');
                const terms = await this.uclaScraper.getAvailableTerms();

                if (terms.length > 0) {
                    // Use the most recent term
                    const currentTerm = terms[0];
                    termCode = currentTerm.code;
                    termName = currentTerm.name;
                    console.log(`Using current term: ${termName} (${termCode})`);
                } else {
                    throw new Error('No available terms found');
                }
            }

            // Step 2: Scrape UCLA class data
            console.log('\n🏫 Scraping UCLA class schedules...');
            const uclaResults = await this.uclaScraper.scrapeMultipleDepartments(
                departments,
                termCode,
                termName
            );

            // Step 3: Update professor ratings
            console.log('\n⭐ Updating professor ratings...');
            const rmpResults = await this.rmpScraper.updateClassProfessorRatings({
                term: termName,
                department: { $in: departments }
            });

            // Step 4: Generate summary report
            const summary = this.generateScrapingSummary(uclaResults, rmpResults, startTime);

            console.log('\n✅ Full scraping cycle completed!');
            console.log(summary);

            return {
                success: true,
                summary,
                uclaResults,
                rmpResults,
                startTime,
                endTime: new Date()
            };

        } catch (error) {
            console.error('❌ Scraping cycle failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Scrape specific courses by course codes
     */
    async scrapeSpecificCourses(courseCodes, termCode = null, termName = null) {
        try {
            console.log(`🎯 Scraping specific courses: ${courseCodes.join(', ')}`);

            // Get term info if not provided
            if (!termCode || !termName) {
                const terms = await this.uclaScraper.getAvailableTerms();
                if (terms.length > 0) {
                    termCode = terms[0].code;
                    termName = terms[0].name;
                }
            }

            const results = [];

            for (const courseCode of courseCodes) {
                try {
                    const [department, courseNumber] = courseCode.split(' ');

                    console.log(`\nProcessing ${courseCode}...`);

                    // Search for the specific course
                    const classData = await this.uclaScraper.searchClasses(department, termCode, {
                        course_number: courseNumber
                    });

                    if (classData.length > 0) {
                        // Get course details
                        const courseDetails = await this.uclaScraper.getCourseDetails(department, courseNumber);

                        for (const classInfo of classData) {
                            const completeInfo = {
                                ...classInfo,
                                ...courseDetails,
                                term: termName,
                                department: department
                            };

                            // Save or update class
                            const savedClass = await this.saveOrUpdateClass(completeInfo);

                            // Update professor rating if professor exists
                            if (savedClass.professor) {
                                const professorData = await this.rmpScraper.searchProfessor(savedClass.professor);
                                if (professorData) {
                                    savedClass.professorRating = professorData.professorRating;
                                    savedClass.professorDifficulty = professorData.professorDifficulty;
                                    savedClass.professorWouldTakeAgain = professorData.professorWouldTakeAgain;
                                    if (!savedClass.scrapedFrom.includes('ratemyprofessor')) {
                                        savedClass.scrapedFrom.push('ratemyprofessor');
                                    }
                                    await savedClass.save();
                                }
                            }

                            results.push(savedClass);
                        }
                    } else {
                        console.log(`❌ No classes found for ${courseCode}`);
                    }

                } catch (error) {
                    console.error(`Error processing ${courseCode}:`, error);
                    results.push({ courseCode, error: error.message });
                }
            }

            return results;

        } catch (error) {
            console.error('Error scraping specific courses:', error);
            throw error;
        }
    }

    /**
     * Update only professor ratings for existing classes
     */
    async updateProfessorRatingsOnly(filter = {}) {
        try {
            console.log('⭐ Updating professor ratings only...');

            return await this.rmpScraper.updateClassProfessorRatings(filter);

        } catch (error) {
            console.error('Error updating professor ratings:', error);
            throw error;
        }
    }

    /**
     * Save or update a class in the database
     */
    async saveOrUpdateClass(classInfo) {
        const query = {
            courseCode: classInfo.courseCode,
            term: classInfo.term
        };

        // Add class number to query if available for more specific matching
        if (classInfo.classNumber) {
            query.classNumber = classInfo.classNumber;
        }

        const existingClass = await Class.findOne(query);

        if (existingClass) {
            // Update existing class
            Object.assign(existingClass, classInfo);
            return await existingClass.save();
        } else {
            // Create new class
            const newClass = new Class(classInfo);
            return await newClass.save();
        }
    }

    /**
     * Generate scraping summary report
     */
    generateScrapingSummary(uclaResults, rmpResults, startTime) {
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);

        let totalClassesProcessed = 0;
        let totalDepartments = 0;
        const departmentSummary = {};

        // Process UCLA results
        for (const [department, classes] of Object.entries(uclaResults)) {
            if (Array.isArray(classes)) {
                totalClassesProcessed += classes.length;
                totalDepartments++;
                departmentSummary[department] = {
                    classes: classes.length,
                    status: 'success'
                };
            } else if (classes.error) {
                departmentSummary[department] = {
                    classes: 0,
                    status: 'failed',
                    error: classes.error
                };
            }
        }

        return {
            duration: `${duration} seconds`,
            totalDepartments,
            totalClassesProcessed,
            professorRatings: {
                updated: rmpResults?.updated || 0,
                notFound: rmpResults?.notFound || 0,
                failed: rmpResults?.failed || 0
            },
            departmentSummary,
            timestamp: endTime.toISOString()
        };
    }

    /**
     * Schedule automatic scraping
     */
    scheduleAutomaticScraping(cronExpression, departments, options = {}) {
        const jobId = `auto-scrape-${Date.now()}`;

        console.log(`📅 Scheduling automatic scraping: ${cronExpression}`);
        console.log(`Departments: ${departments.join(', ')}`);

        const job = cron.schedule(cronExpression, async () => {
            try {
                console.log('\n🕐 Scheduled scraping starting...');

                await this.performFullScrape(departments, options.termCode, options.termName);

                console.log('✅ Scheduled scraping completed successfully');

            } catch (error) {
                console.error('❌ Scheduled scraping failed:', error);

                // Optionally send notification or alert
                if (options.onError) {
                    options.onError(error);
                }
            }
        }, {
            scheduled: false // Don't start immediately
        });

        this.scheduledJobs.set(jobId, {
            job,
            cronExpression,
            departments,
            options,
            createdAt: new Date()
        });

        // Start the job
        job.start();

        console.log(`✅ Scheduled job created with ID: ${jobId}`);
        return jobId;
    }

    /**
     * Stop a scheduled job
     */
    stopScheduledJob(jobId) {
        const scheduledJob = this.scheduledJobs.get(jobId);

        if (scheduledJob) {
            scheduledJob.job.stop();
            this.scheduledJobs.delete(jobId);
            console.log(`🛑 Stopped scheduled job: ${jobId}`);
            return true;
        }

        return false;
    }

    /**
     * Get status of all scheduled jobs
     */
    getScheduledJobsStatus() {
        const jobs = [];

        for (const [jobId, jobInfo] of this.scheduledJobs.entries()) {
            jobs.push({
                id: jobId,
                cronExpression: jobInfo.cronExpression,
                departments: jobInfo.departments,
                createdAt: jobInfo.createdAt,
                isRunning: jobInfo.job.running || false
            });
        }

        return jobs;
    }

    /**
     * Get scraping statistics
     */
    async getScrapingStats() {
        try {
            const totalClasses = await Class.countDocuments();
            const classesWithRatings = await Class.countDocuments({
                professorRating: { $exists: true, $ne: null }
            });
            const recentlyScraped = await Class.countDocuments({
                lastScraped: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });

            const departmentStats = await Class.aggregate([
                {
                    $group: {
                        _id: '$department',
                        count: { $sum: 1 },
                        avgRating: { $avg: '$professorRating' },
                        lastScraped: { $max: '$lastScraped' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            return {
                totalClasses,
                classesWithRatings,
                ratingCoverage: totalClasses > 0 ? (classesWithRatings / totalClasses * 100).toFixed(1) + '%' : '0%',
                recentlyScraped,
                departmentStats,
                scheduledJobs: this.getScheduledJobsStatus()
            };

        } catch (error) {
            console.error('Error getting scraping stats:', error);
            throw error;
        }
    }

    /**
     * Common department configurations
     */
    static getCommonDepartmentSets() {
        return {
            'stem': ['COM SCI', 'MATH', 'PHYSICS', 'CHEM', 'ENGR'],
            'business': ['MGMT', 'ECON', 'STATS', 'ACCOUNTING'],
            'humanities': ['ENGLISH', 'HIST', 'PHIL', 'ART'],
            'social-sciences': ['PSYCH', 'SOC', 'POLI SCI', 'ANTHRO'],
            'life-sciences': ['LIFESCI', 'BIOL', 'BIOCHEM', 'PHYSCI'],
            'popular': ['COM SCI', 'PSYCH', 'ECON', 'MATH', 'ENGLISH']
        };
    }
}

export default WebscrapingOrchestrator; 