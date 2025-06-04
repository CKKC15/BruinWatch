import BaseScraper from './baseScraper.js';
import Class from '../models/class.js';

class RateMyProfessorScraper extends BaseScraper {
    constructor() {
        super({
            rateLimitDelay: 2000, // Be respectful to RMP servers
            retryAttempts: 3
        });

        this.baseUrl = 'https://www.ratemyprofessors.com';
        this.searchUrl = 'https://www.ratemyprofessors.com/search/professors';
        this.uclaSchoolId = '1077'; // UCLA's school ID on RateMyProfessor
    }

    /**
     * Search for a professor on RateMyProfessor
     */
    async searchProfessor(professorName, schoolId = this.uclaSchoolId) {
        try {
            console.log(`Searching for professor: ${professorName} at UCLA...`);

            // Clean professor name (remove titles, middle initials, etc.)
            const cleanName = this.cleanProfessorName(professorName);

            if (!cleanName) {
                console.log('No valid professor name provided');
                return null;
            }

            // Build search URL
            const searchUrl = `${this.searchUrl}?q=${encodeURIComponent(cleanName)}&sid=${schoolId}`;

            // Use Puppeteer since RMP has dynamic content
            const html = await this.fetchWithPuppeteer(searchUrl, {
                waitForSelector: '.TeacherCard__StyledTeacherCard-syjs0d-0, .ResultsPage__StyledResultsPage-sc-19xmgf-1',
                selectorTimeout: 10000
            });

            const $ = this.parseHTML(html);

            // Look for professor cards
            const professorCards = $('.TeacherCard__StyledTeacherCard-syjs0d-0');

            if (professorCards.length === 0) {
                console.log(`No professors found for "${cleanName}"`);
                return null;
            }

            // Find the best match
            let bestMatch = null;
            let bestScore = 0;

            professorCards.each((i, card) => {
                const cardName = this.cleanText($(card).find('.CardName__StyledCardName-sc-1gyrgim-0').text());
                const department = this.cleanText($(card).find('.CardSchool__Department-sc-19lmz2k-0').text());

                // Calculate similarity score
                const score = this.calculateNameSimilarity(cleanName, cardName);

                if (score > bestScore && score > 0.6) { // Minimum similarity threshold
                    bestScore = score;

                    // Extract professor data from card
                    const professorUrl = $(card).find('a').attr('href');
                    const ratingText = this.cleanText($(card).find('.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2').text());
                    const difficultyText = this.cleanText($(card).find('.CardFeedback__CardFeedbackNumber-lq6nix-2').text());

                    bestMatch = {
                        name: cardName,
                        department: department,
                        url: professorUrl ? `${this.baseUrl}${professorUrl}` : null,
                        rating: this.extractNumber(ratingText),
                        difficulty: this.extractNumber(difficultyText),
                        searchScore: score
                    };
                }
            });

            if (bestMatch) {
                console.log(`Found professor: ${bestMatch.name} (score: ${bestScore.toFixed(2)})`);

                // Get detailed information from professor page
                if (bestMatch.url) {
                    const detailedInfo = await this.getProfessorDetails(bestMatch.url);
                    return { ...bestMatch, ...detailedInfo };
                }
            }

            return bestMatch;

        } catch (error) {
            console.error(`Error searching for professor ${professorName}:`, error);
            return null;
        }
    }

    /**
     * Get detailed professor information from their RMP page
     */
    async getProfessorDetails(professorUrl) {
        try {
            console.log(`Fetching detailed info from: ${professorUrl}`);

            const html = await this.fetchWithPuppeteer(professorUrl, {
                waitForSelector: '.RatingValue__Numerator-qw8sqy-2, .TeacherInfo__StyledTeacher-ti1fio-1',
                selectorTimeout: 10000
            });

            const $ = this.parseHTML(html);

            // Extract detailed ratings
            const overallRating = this.extractNumber(
                this.cleanText($('.RatingValue__Numerator-qw8sqy-2').first().text())
            );

            const difficulty = this.extractNumber(
                this.cleanText($('.FeedbackItem__FeedbackNumber-uof32n-1').first().text())
            );

            // Extract "would take again" percentage
            const wouldTakeAgainText = this.cleanText($('.FeedbackItem__FeedbackDescription-uof32n-0:contains("Would take again")').parent().find('.FeedbackItem__FeedbackNumber-uof32n-1').text());
            const wouldTakeAgain = this.extractNumber(wouldTakeAgainText);

            // Extract number of ratings
            const numRatingsText = this.cleanText($('.RatingValue__NumRatings-qw8sqy-0').text());
            const numRatings = this.extractNumber(numRatingsText);

            // Extract department
            const department = this.cleanText($('.TeacherDepartment__StyledDepartmentLink-fl79e8-0').text());

            // Extract recent reviews/comments (optional)
            const recentComments = [];
            $('.Comments__StyledComments-dzzyvm-0').slice(0, 5).each((i, elem) => {
                const comment = this.cleanText($(elem).text());
                if (comment && comment.length > 10) {
                    recentComments.push(comment);
                }
            });

            return {
                professorRating: overallRating,
                professorDifficulty: difficulty,
                professorWouldTakeAgain: wouldTakeAgain,
                numRatings: numRatings,
                department: department,
                recentComments: recentComments,
                lastScraped: new Date(),
                scrapedFrom: ['ratemyprofessor']
            };

        } catch (error) {
            console.error(`Error fetching professor details from ${professorUrl}:`, error);
            return {};
        }
    }

    /**
     * Clean professor name for better matching
     */
    cleanProfessorName(name) {
        if (!name) return null;

        return name
            .replace(/Prof\.|Professor|Dr\.|Mr\.|Ms\.|Mrs\./gi, '') // Remove titles
            .replace(/\b[A-Z]\b\.?/g, '') // Remove middle initials
            .replace(/[,;]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Calculate similarity between two names using Levenshtein distance
     */
    calculateNameSimilarity(name1, name2) {
        const clean1 = name1.toLowerCase().replace(/[^a-z\s]/g, '');
        const clean2 = name2.toLowerCase().replace(/[^a-z\s]/g, '');

        const distance = this.levenshteinDistance(clean1, clean2);
        const maxLength = Math.max(clean1.length, clean2.length);

        return maxLength === 0 ? 0 : (maxLength - distance) / maxLength;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Update professor ratings for existing classes
     */
    async updateClassProfessorRatings(classQuery = {}) {
        try {
            console.log('Updating professor ratings for classes...');

            // Find classes with professors but no ratings
            const classes = await Class.find({
                professor: { $exists: true, $ne: null, $ne: '' },
                professorRating: { $exists: false },
                ...classQuery
            });

            console.log(`Found ${classes.length} classes to update`);

            const results = {
                updated: 0,
                failed: 0,
                notFound: 0
            };

            for (const classObj of classes) {
                try {
                    console.log(`\nProcessing: ${classObj.courseCode} - ${classObj.professor}`);

                    const professorData = await this.searchProfessor(classObj.professor);

                    if (professorData && professorData.professorRating) {
                        // Update class with professor data
                        classObj.professorRating = professorData.professorRating;
                        classObj.professorDifficulty = professorData.professorDifficulty;
                        classObj.professorWouldTakeAgain = professorData.professorWouldTakeAgain;

                        // Update scraped metadata
                        if (!classObj.scrapedFrom) classObj.scrapedFrom = [];
                        if (!classObj.scrapedFrom.includes('ratemyprofessor')) {
                            classObj.scrapedFrom.push('ratemyprofessor');
                        }
                        classObj.lastScraped = new Date();

                        await classObj.save();

                        console.log(`✓ Updated ${classObj.courseCode}: Rating ${professorData.professorRating}/5`);
                        results.updated++;

                    } else {
                        console.log(`✗ No rating found for ${classObj.professor}`);
                        results.notFound++;
                    }

                    // Rate limiting delay
                    await this.delay(2000);

                } catch (error) {
                    console.error(`Error updating ${classObj.courseCode}:`, error);
                    results.failed++;
                }
            }

            console.log('\n--- Update Summary ---');
            console.log(`Updated: ${results.updated}`);
            console.log(`Not found: ${results.notFound}`);
            console.log(`Failed: ${results.failed}`);

            return results;

        } catch (error) {
            console.error('Error updating class professor ratings:', error);
            throw error;
        }
    }

    /**
     * Update ratings for specific professors
     */
    async updateSpecificProfessors(professorNames) {
        const results = [];

        for (const professorName of professorNames) {
            try {
                console.log(`\nFetching data for: ${professorName}`);

                const professorData = await this.searchProfessor(professorName);

                if (professorData) {
                    // Update all classes taught by this professor
                    const updatedClasses = await Class.updateMany(
                        { professor: { $regex: new RegExp(professorName, 'i') } },
                        {
                            $set: {
                                professorRating: professorData.professorRating,
                                professorDifficulty: professorData.professorDifficulty,
                                professorWouldTakeAgain: professorData.professorWouldTakeAgain,
                                lastScraped: new Date()
                            },
                            $addToSet: { scrapedFrom: 'ratemyprofessor' }
                        }
                    );

                    results.push({
                        professor: professorName,
                        data: professorData,
                        classesUpdated: updatedClasses.modifiedCount
                    });

                    console.log(`✓ Updated ${updatedClasses.modifiedCount} classes for ${professorName}`);
                } else {
                    results.push({
                        professor: professorName,
                        data: null,
                        classesUpdated: 0
                    });

                    console.log(`✗ No data found for ${professorName}`);
                }

                // Rate limiting
                await this.delay(2000);

            } catch (error) {
                console.error(`Error processing ${professorName}:`, error);
                results.push({
                    professor: professorName,
                    error: error.message,
                    classesUpdated: 0
                });
            }
        }

        return results;
    }
}

export default RateMyProfessorScraper; 