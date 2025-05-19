// backend/testing/testEmbedding.js
import 'dotenv/config';
import { retrieveEmbeddings } from '../service/embedding.js';
import Video from '../models/video.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

/**
 * Format seconds as MM:SS or HH:MM:SS timestamp
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(seconds) {
  // Handle undefined, null, or NaN values
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return "00:00";
  }
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  // Format as HH:MM:SS if hours > 0, otherwise MM:SS
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Load environment variables
dotenv.config({ path: '../.env' });
console.log('Environment loaded. MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function testEmbeddingRetrieval() {
  try {
    const videoId = '682ab778fcf3aa9a8f13d5fc';
    const query = "What roles are available to data scientists?";
    
    console.log('\n=== Starting Test ===');
    console.log(`Video ID: ${videoId}`);
    console.log(`Query: "${query}"`);
    
    // Get the video with embeddings
    console.log('\n🔍 Fetching video...');
    const video = await Video.findById(videoId);
    if (!video) {
      console.error('❌ Video not found');
      return;
    }
    console.log(`✅ Found video: ${video.title || 'Untitled'}`);

    // Check embeddings
    if (!video.embeddings || !Array.isArray(video.embeddings)) {
      console.error('❌ Invalid embeddings format');
      return;
    }
    console.log(`📊 Found ${video.embeddings.length} embeddings`);

    // Log first embedding structure without the embedding array
    if (video.embeddings.length > 0) {
      console.log('\n📝 First embedding structure:');
      const firstEmbedding = video.embeddings[0];
      const { embedding, ...metadata } = firstEmbedding.toObject ? 
        firstEmbedding.toObject() : 
        firstEmbedding;
      
      console.log('Embedding Metadata:', {
        ...metadata,
        embedding: `[Array of ${embedding?.length || 0} numbers]`
      });
      
      // Check if embedding exists and has the right structure
      console.log('Has text:', !!firstEmbedding.text);
      console.log('Has start:', typeof firstEmbedding.start !== 'undefined');
      console.log('Has end:', typeof firstEmbedding.end !== 'undefined');
      console.log('Embedding type:', typeof firstEmbedding.embedding);
      console.log('Is embedding array:', Array.isArray(firstEmbedding.embedding));
      
      if (firstEmbedding.embedding && !Array.isArray(firstEmbedding.embedding)) {
        console.log('⚠️ Embedding is not an array, might need conversion');
      }
    }

    // Fix embeddings if needed (handle potential Buffer conversion)
    console.log('\n🔧 Preparing embeddings for retrieval...');
    const fixedEmbeddings = video.embeddings.map(chunk => {
      // Check if embedding is a Buffer or needs conversion
      let embeddingArray = chunk.embedding;
      
      // Handle Buffer conversion if needed
      if (chunk.embedding && !Array.isArray(chunk.embedding) && chunk.embedding.buffer) {
        console.log('Converting Buffer to Array...');
        embeddingArray = Array.from(Buffer.from(chunk.embedding.buffer));
      }
      
      // Add missing fields if needed
      return {
        ...chunk,
        text: chunk.text || '',
        start: chunk.start || 0,
        end: chunk.end || 0,
        embedding: embeddingArray
      };
    });
    
    console.log(`Prepared ${fixedEmbeddings.length} embeddings for retrieval`);

    // Get top chunks with fixed embeddings
    console.log('\n🔍 Searching for relevant chunks...');
    const topChunks = await retrieveEmbeddings(query, fixedEmbeddings, 5);
    console.log(`✅ Found ${topChunks.length} relevant chunks`);

    // Log first result structure
    // if (topChunks.length > 0) {
    //   console.log('\n📄 First result structure:');
    //   console.log(JSON.stringify(topChunks[0], null, 2));
    // }

    // Display results
    console.log('\n🏆 Top embeddings retrieved:');
    topChunks.forEach((chunk, idx) => {
      const similarity = chunk.similarity?.toFixed(4) || 'N/A';
      const startTime = formatTimestamp(chunk.start);
      const endTime = formatTimestamp(chunk.end);
      const text = chunk.text ? chunk.text.slice(0, 70) + '...' : 'No text';
      console.log(`\n#${idx + 1} [${similarity}] [${startTime}-${endTime}]`);
      console.log(`   ${text}`);
    });

  } catch (error) {
    console.error('\n❌ Error in testEmbeddingRetrieval:');
    console.error(error.stack || error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await mongoose.disconnect();
    console.log('✅ Done');
    process.exit(0);
  }
}

// Run the test
testEmbeddingRetrieval();