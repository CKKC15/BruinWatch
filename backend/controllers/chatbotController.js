import Video from '../models/video.js';
import { createEmbeddings, retrieveEmbeddings } from '../service/embedding.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Handle chat requests by finding relevant transcript chunks and generating responses
 * @route POST /api/videos/:videoId/chat
 */
export const chat = async (req, res) => {
  try {
    // Validate request
    const { videoId } = req.params;
    const { query } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing or invalid query parameter' 
      });
    }

    // Get video and associated transcript
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ 
        success: false,
        message: 'Video not found' 
      });
    }
    
    // Check if transcript exists
    if (!video.transcript || !Array.isArray(video.transcript) || video.transcript.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transcript available for this video'
      });
    }

    // Create embeddings for transcript chunks if needed
    // For production, consider caching embeddings for performance
    console.log(`Processing query for video ${videoId}: "${query}"`);
    const transcriptChunks = video.transcript;
    const embedded = await createEmbeddings(transcriptChunks);
    
    // Retrieve most relevant chunks based on query similarity
    const topChunks = await retrieveEmbeddings(query, embedded, 5);
    if (!topChunks.length) {
      return res.status(200).json({
        success: true,
        answer: 'I couldn\'t find any relevant information in the video transcript to answer your query.',
        sources: []
      });
    }

    // Format context for LLM prompt with timestamps
    const contextText = topChunks
      .map(c => `Timestamp ${formatTimestamp(c.start)} - ${formatTimestamp(c.end)}: ${c.text}`)
      .join('\n');

    // Create prompt for Gemini
    const prompt = `
    You are an expert summarizer helping answer user questions using transcript excerpts.
    
    Transcript Context:
    ${contextText}
    
    User Question:
    ${query}
    
    Based only on the context, answer the question as clearly and directly as possible.
    Make your answer sound like you are answering a question and make it sound smooth and understandable.
    Reference timestamps in the context to provide a more accurate answer.
    If the context doesnt provide the right answers to the question, explain it the best you can.
    If the context does not contain a direct answer, briefly explain that and provide a possible answer.
    
    Be factual, concise, and helpful.
    `.trim();

    // Call Gemini API to generate response
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent(prompt, {
      generationConfig: { 
        temperature: 0.3, // Lower temperature for more factual responses
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      }
    });
    
    // Extract text response
    const answer = typeof result.response.text === 'function'
      ? await result.response.text()
      : result.response.text;

    // Format sources for client consumption (exclude embedding vectors to reduce payload size)
    const formattedSources = topChunks.map(({ start, end, text, similarity }) => ({
      start,
      end,
      text,
      similarity: parseFloat(similarity.toFixed(4)), // Round to 4 decimal places
      formattedTimespan: `${formatTimestamp(start)} - ${formatTimestamp(end)}`
    }));

    // Return successful response
    res.json({ 
      success: true,
      answer, 
      sources: formattedSources 
    });
  } catch (err) {
    console.error('Error in chat controller:', err);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred while processing your request',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Format seconds as MM:SS timestamp
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}