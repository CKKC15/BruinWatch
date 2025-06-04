import WebscrapingOrchestrator from '../service/webscrapingOrchestrator.js';
import connectDB from '../db/mongo.js';

// Connect to database
await connectDB();

const orchestrator = new WebscrapingOrchestrator();

console.log('🧪 Starting webscraping tests...\n');

async function runTests() {
    try {
        // Test 1: Get available terms
        console.log('📅 Test 1: Getting available terms...');
        try {
            const terms = await orchestrator.uclaScraper.getAvailableTerms();
            console.log(`✅ Found ${terms.length} terms:`, terms.slice(0, 3));
        } catch (error) {
            console.log('❌ Terms test failed:', error.message);
        }

        // Test 2: Test professor search
        console.log('\n⭐ Test 2: Testing professor search...');
        try {
            const professorData = await orchestrator.rmpScraper.searchProfessor('Carey Nachenberg');
            if (professorData) {
                console.log('✅ Professor found:', {
                    name: professorData.name,
                    rating: professorData.professorRating,
                    difficulty: professorData.professorDifficulty
                });
            } else {
                console.log('❌ Professor not found');
            }
        } catch (error) {
            console.log('❌ Professor search failed:', error.message);
        }

        // Test 3: Test course scraping (small sample)
        console.log('\n🎯 Test 3: Testing specific course scraping...');
        try {
            const courseCodes = ['CS 31'];
            const results = await orchestrator.scrapeSpecificCourses(courseCodes);
            console.log(`✅ Scraped ${results.length} course sections`);

            if (results.length > 0) {
                const sample = results[0];
                console.log('Sample course data:', {
                    name: sample.name,
                    courseCode: sample.courseCode,
                    professor: sample.professor,
                    units: sample.units
                });
            }
        } catch (error) {
            console.log('❌ Course scraping failed:', error.message);
        }

        // Test 4: Get common departments
        console.log('\n📚 Test 4: Getting common departments...');
        const departments = WebscrapingOrchestrator.getCommonDepartmentSets();
        console.log('✅ Available department sets:', Object.keys(departments));

        // Test 5: Get scraping stats
        console.log('\n📊 Test 5: Getting scraping statistics...');
        try {
            const stats = await orchestrator.getScrapingStats();
            console.log('✅ Current statistics:', {
                totalClasses: stats.totalClasses,
                classesWithRatings: stats.classesWithRatings,
                ratingCoverage: stats.ratingCoverage
            });
        } catch (error) {
            console.log('❌ Stats failed:', error.message);
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test suite failed:', error);
    } finally {
        process.exit(0);
    }
}

// Run the tests
runTests(); 