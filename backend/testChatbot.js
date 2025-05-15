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
 * Format seconds as HH:MM:SS or MM:SS timestamp depending on length
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(seconds) {
  // Check if we need hours format
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

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
    scored.slice(0, 10).forEach((chunk, idx) => {
      console.log(`  #${idx+1} • sim=${chunk.similarity.toFixed(4)} • [${formatTimestamp(chunk.start)}-${formatTimestamp(chunk.end)}] → ${chunk.text.slice(0, 70)}...`);
    });
    
    // Prepare Gemini AI for generating a response
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Combine top chunks as context (use top 5 chunks with highest similarity)
    const contextChunks = scored.slice(0, 10);
    const context = contextChunks.map(c => `[${formatTimestamp(c.start)}-${formatTimestamp(c.end)}] ${c.text}`).join('\n\n');
    
    // Prepare the prompt
    const prompt = `
    You are an expert summarizer helping answer user questions using transcript excerpts.
    
    Transcript Context:
    ${context}
    
    User Question:
    ${query}
    
    Based only on the context, answer the question as clearly and directly as possible.
    Make your answer sound like you are answering a question and make it sound smooth and understandable.
    Reference timestamps in the context to provide a more accurate answer.
    If the context doesnt provide the right answers to the question, explain it the best you can.
    If the context does not contain a direct answer, briefly explain that and provide a possible answer.
    
    Be factual, concise, and helpful.
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
const testQuery = "How does the computer turn code into assembly?";

// Automatically run the test query when this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Process the query
  queryTranscript(testQuery)
    .then(result => {
      console.log('\nQuery Result:\n-----------------');
      console.log('Answer:', result.answer);
      console.log('\nRelevant Chunks:');
      result.relevantChunks.slice(0, 10).forEach((chunk, i) => {
        console.log(`#${i+1} • sim=${chunk.similarity.toFixed(4)} • [${formatTimestamp(chunk.start)}-${formatTimestamp(chunk.end)}] → ${chunk.text.slice(0,70)}...`);
      });
    })
    .catch(console.error);
}