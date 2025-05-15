// test/testChatbot.js
import 'dotenv/config';
import { createEmbeddings, retrieveEmbeddings } from './service/embedding.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Read transcript chunks from file
const transcriptPath = path.resolve('./testTranscript.txt');
const transcriptRaw = fs.readFileSync(transcriptPath, 'utf8').trim();
const transcriptChunks = eval(`(${transcriptRaw})`);

// Cache for embeddings to avoid creating them multiple times
let cachedEmbeddings = null;

/**
 * Query the transcript with a user-provided query
 * @param {string} query - The query to search the transcript
 * @returns {Promise<Object>} Object containing answer and relevant chunks
 */
export async function queryTranscript(query) {
  try {
    // Validate input
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query: must be a non-empty string');
    }

    // Use cached embeddings or create new ones if not available
    const embedded = cachedEmbeddings || (cachedEmbeddings = await createEmbeddings(transcriptChunks));
    
    // Retrieve relevant chunks for the query
    const scored = await retrieveEmbeddings(query, embedded, embedded.length);
    
    // Print the top embeddings retrieved for debugging
    console.log('\nTop embeddings retrieved:');
    scored.slice(0, 5).forEach((chunk, idx) => {
      console.log(`  #${idx+1} • sim=${chunk.similarity.toFixed(4)} • [${chunk.start.toFixed(1)}-${chunk.end.toFixed(1)}s] → ${chunk.text.slice(0, 70)}...`);
    });
    
    // Prepare Gemini AI for generating a response
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Combine top chunks as context (use top 5 chunks with highest similarity)
    const contextChunks = scored.slice(0, 5);
    const context = contextChunks.map(c => `[${c.start.toFixed(1)}-${c.end.toFixed(1)}s] ${c.text}`).join('\n\n');
    
    // Prepare the prompt
    const prompt = `
Context from the transcript:
${context}

User Query: ${query}

Answer the user's query. Be concise but thorough. Include relevant timestamp references from the transcript in your answer (in the format [XX.X-XX.Xs]) to help the user find the exact points in the video where the information appears.
`.trim();
    
    // Generate response using Gemini
    const res = await model.generateContent(prompt, {
      generationConfig: { 
        temperature: 0, 
        maxOutputTokens: 1024
      }
    });
    
    const answer = typeof res.response.text === 'function'
      ? await res.response.text()
      : res.response.text;
    
    return {
      answer,
      relevantChunks: scored.map(chunk => ({
        text: chunk.text,
        start: chunk.start,
        end: chunk.end,
        similarity: chunk.similarity
      }))
    };
  } catch (error) {
    console.error('Error querying transcript:', error);
    throw error;
  }
}

// Set your query here - change this value to test different queries
const testQuery = "What are buffer overflow attacks?";

// Automatically run the test query when this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Process the query
  queryTranscript(testQuery)
    .then(result => {
      console.log('\nQuery Result:\n-----------------');
      console.log('Answer:', result.answer);
      console.log('\nRelevant Chunks:');
      result.relevantChunks.slice(0, 5).forEach((chunk, i) => {
        console.log(`#${i+1} • sim=${chunk.similarity.toFixed(4)} • [${chunk.start.toFixed(1)}-${chunk.end.toFixed(1)}s] → ${chunk.text.slice(0,70)}...`);
      });
    })
    .catch(console.error);
}