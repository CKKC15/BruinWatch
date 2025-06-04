import BaseScraper from './baseScraper.js';
import Class from '../models/class.js';

class UCLAClassScraper extends BaseScraper {
    constructor() {
        super({
            rateLimitDelay: 2000, // Be respectful to UCLA servers
            retryAttempts: 3
        });

        // UCLA endpoints
        this.baseUrl = 'https://sa.ucla.edu/ro/public/soc';
        this.registrarUrl = 'https://registrar.ucla.edu';
        this.scheduledStudyUrl = 'https://www.registrar.ucla.edu/calendars/study-list';
    }

    /**
     * Get available terms from UCLA
     */
    async getAvailableTerms() {
        try {
            console.log('Fetching available terms...');

            // The UCLA Schedule of Classes page
            const html = await this.fetchHTML(`${this.baseUrl}/search`);
            const $ = this.parseHTML(html);

            const terms = [];

            // Extract terms from the dropdown
            $('#select_term option').each((i, elem) => {
                const value = $(elem).attr('value');
                const text = $(elem).text().trim();

                if (value && value !== '') {
                    terms.push({
                        code: value,
                        name: text
                    });
                }
            });

            console.log(`Found ${terms.length} available terms`);
            return terms;

        } catch (error) {
            console.error('Error fetching available terms:', error);
            throw new Error(`Failed to fetch available terms: ${error.message}`);
        }
    }

    /**
     * Search for classes by subject area and term
     */
    async searchClasses(subjectArea, termCode, options = {}) {
        try {
            console.log(`Searching for ${subjectArea} classes in term ${termCode}...`);

            const searchUrl = `${this.baseUrl}/search/searchclasses`;

            // Prepare search parameters
            const params = {
                term_cd: termCode,
                subj_area: subjectArea,
                search_type: 'subject',
                ...options
            };

            // Use Puppeteer for dynamic content
            const html = await this.fetchWithPuppeteer(searchUrl, {
                waitForSelector: '.class-result',
                selectorTimeout: 15000
            });

            const $ = this.parseHTML(html);
            const classes = [];

            // Parse each class result
            $('.class-result').each((i, elem) => {
                try {
                    const classData = this.parseClassElement($, elem);
                    if (classData) {
                        classes.push(classData);
                    }
                } catch (error) {
                    console.error('Error parsing class element:', error);
                }
            });

            console.log(`Found ${classes.length} classes for ${subjectArea}`);
            return classes;

        } catch (error) {
            console.error(`Error searching classes for ${subjectArea}:`, error);
            throw new Error(`Failed to search classes: ${error.message}`);
        }
    }

    /**
     * Parse individual class element from search results
     */
    parseClassElement($, elem) {
        const $elem = $(elem);

        // Extract basic information
        const courseTitle = this.cleanText($elem.find('.course-title').text());
        const courseCode = this.extractCourseCode(courseTitle);
        const classNumber = this.cleanText($elem.find('.class-number').text());

        // Extract units
        const unitsText = this.cleanText($elem.find('.units').text());
        const units = this.extractNumber(unitsText);

        // Extract instructor
        const instructor = this.cleanText($elem.find('.instructor').text());

        // Extract schedule information
        const scheduleData = this.parseScheduleFromElement($, $elem);

        // Extract enrollment data
        const enrollmentData = this.parseEnrollmentFromElement($, $elem);

        // Extract location
        const location = this.cleanText($elem.find('.location').text());

        return {
            name: courseTitle,
            courseCode: courseCode,
            classNumber: classNumber,
            units: units,
            professor: instructor,
            schedule: scheduleData,
            location: location,
            ...enrollmentData,
            lastScraped: new Date(),
            scrapedFrom: ['ucla-registrar']
        };
    }

    /**
     * Parse schedule information from class element
     */
    parseScheduleFromElement($, $elem) {
        const schedule = [];

        $elem.find('.schedule-entry').each((i, schedElem) => {
            const $sched = $(schedElem);

            const daysText = this.cleanText($sched.find('.days').text());
            const timeText = this.cleanText($sched.find('.time').text());
            const locationText = this.cleanText($sched.find('.location').text());
            const typeText = this.cleanText($sched.find('.type').text());

            // Parse time range
            const timeMatch = timeText.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
            const startTime = timeMatch ? timeMatch[1] : null;
            const endTime = timeMatch ? timeMatch[2] : null;

            if (daysText && timeText) {
                schedule.push({
                    days: this.parseDays(daysText),
                    startTime: startTime,
                    endTime: endTime,
                    location: locationText,
                    type: typeText || 'Lecture'
                });
            }
        });

        return schedule;
    }

    /**
     * Parse enrollment data from class element
     */
    parseEnrollmentFromElement($, $elem) {
        const enrollmentText = this.cleanText($elem.find('.enrollment').text());

        // Look for patterns like "Enrolled: 45/50, Waitlist: 5"
        const enrolledMatch = enrollmentText.match(/enrolled:\s*(\d+)\/(\d+)/i);
        const waitlistMatch = enrollmentText.match(/waitlist:\s*(\d+)/i);

        let totalSeats = null;
        let enrolledSeats = null;
        let availableSeats = null;
        let waitlistTotal = null;

        if (enrolledMatch) {
            enrolledSeats = parseInt(enrolledMatch[1]);
            totalSeats = parseInt(enrolledMatch[2]);
            availableSeats = totalSeats - enrolledSeats;
        }

        if (waitlistMatch) {
            waitlistTotal = parseInt(waitlistMatch[1]);
        }

        return {
            totalSeats,
            availableSeats,
            waitlistTotal
        };
    }

    /**
     * Get detailed course information including description and prerequisites
     */
    async getCourseDetails(subjectArea, courseNumber) {
        try {
            console.log(`Fetching course details for ${subjectArea} ${courseNumber}...`);

            // Try UCLA course catalog
            const catalogUrl = `${this.registrarUrl}/catalog/course/${subjectArea}/${courseNumber}`;

            try {
                const html = await this.fetchHTML(catalogUrl);
                const $ = this.parseHTML(html);

                const description = this.cleanText($('.course-description').text());
                const prerequisites = this.parsePrerequisites($('.prerequisites').text());
                const corequisites = this.parsePrerequisites($('.corequisites').text());

                return {
                    description,
                    prerequisites,
                    corequisites
                };

            } catch (error) {
                console.warn(`Could not fetch from catalog, trying alternative source: ${error.message}`);
                return this.getCourseDetailsAlternative(subjectArea, courseNumber);
            }

        } catch (error) {
            console.error(`Error fetching course details for ${subjectArea} ${courseNumber}:`, error);
            return {
                description: null,
                prerequisites: [],
                corequisites: []
            };
        }
    }

    /**
     * Alternative method to get course details
     */
    async getCourseDetailsAlternative(subjectArea, courseNumber) {
        // Implementation for backup data sources
        // This could include department-specific pages or other UCLA resources
        return {
            description: null,
            prerequisites: [],
            corequisites: []
        };
    }

    /**
     * Parse prerequisites from text
     */
    parsePrerequisites(prereqText) {
        if (!prereqText) return [];

        const prerequisites = [];
        const cleanText = this.cleanText(prereqText);

        // Look for course codes in the text
        const coursePattern = /([A-Z]{2,4})\s*(\d+[A-Z]*)/g;
        let match;

        while ((match = coursePattern.exec(cleanText)) !== null) {
            const courseCode = `${match[1]} ${match[2]}`;
            if (!prerequisites.includes(courseCode)) {
                prerequisites.push(courseCode);
            }
        }

        return prerequisites;
    }

    /**
     * Scrape and save classes for a specific department and term
     */
    async scrapeAndSaveClasses(department, termCode, termName) {
        try {
            console.log(`Starting scrape for ${department} in ${termName}...`);

            // Search for classes
            const classData = await this.searchClasses(department, termCode);

            const savedClasses = [];

            for (const classInfo of classData) {
                try {
                    // Get detailed course information
                    if (classInfo.courseCode) {
                        const [subjectArea, courseNumber] = classInfo.courseCode.split(' ');
                        const courseDetails = await this.getCourseDetails(subjectArea, courseNumber);

                        // Merge class info with course details
                        const completeClassInfo = {
                            ...classInfo,
                            ...courseDetails,
                            term: termName,
                            department: department
                        };

                        // Check if class already exists
                        const existingClass = await Class.findOne({
                            courseCode: completeClassInfo.courseCode,
                            term: termName,
                            classNumber: completeClassInfo.classNumber
                        });

                        if (existingClass) {
                            // Update existing class
                            Object.assign(existingClass, completeClassInfo);
                            await existingClass.save();
                            savedClasses.push(existingClass);
                            console.log(`Updated class: ${completeClassInfo.courseCode}`);
                        } else {
                            // Create new class
                            const newClass = new Class(completeClassInfo);
                            await newClass.save();
                            savedClasses.push(newClass);
                            console.log(`Created class: ${completeClassInfo.courseCode}`);
                        }
                    }

                } catch (error) {
                    console.error(`Error saving class ${classInfo.courseCode}:`, error);
                }
            }

            console.log(`Successfully processed ${savedClasses.length} classes for ${department}`);
            return savedClasses;

        } catch (error) {
            console.error(`Error scraping classes for ${department}:`, error);
            throw error;
        }
    }

    /**
     * Scrape multiple departments
     */
    async scrapeMultipleDepartments(departments, termCode, termName) {
        const results = {};

        for (const department of departments) {
            try {
                console.log(`\n--- Scraping ${department} ---`);
                results[department] = await this.scrapeAndSaveClasses(department, termCode, termName);

                // Add delay between departments to be respectful
                await this.delay(3000);

            } catch (error) {
                console.error(`Failed to scrape ${department}:`, error);
                results[department] = { error: error.message };
            }
        }

        return results;
    }
}

export default UCLAClassScraper; 