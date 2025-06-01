import Video from '../models/video.js';
import { retrieveEmbeddings } from '../service/embedding.js';
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

    console.log(`Processing query for video ${videoId}: "${query}"`);
    
    // Check if embeddings exist in the video object
    if (!video.embeddings || !Array.isArray(video.embeddings) || video.embeddings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No embeddings available for this video. Please regenerate the video with embeddings.'
      });
    }
    
    // Fix embeddings if needed (handle potential Buffer conversion and missing fields)
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
    
    // Retrieve most relevant chunks based on query similarity
    const topChunks = await retrieveEmbeddings(query, fixedEmbeddings, 12);
    
    // Debug output for retrieved chunks
    console.log(`Retrieved ${topChunks.length} chunks for query: "${query}"`);
    
    if (!topChunks.length) {
      return res.status(200).json({
        answer: "I couldn't find any relevant information in the video transcript to answer your query.",
      });
    }
    
    // Verify all required fields are present
    const validChunks = topChunks.every(chunk => 
      chunk && 
      typeof chunk.start === 'number' && 
      typeof chunk.end === 'number' && 
      typeof chunk.text === 'string' && 
      Array.isArray(chunk.embedding)
    );
    
    if (!validChunks) {
      console.error('Invalid chunk structure:', topChunks);
      return res.status(500).json({
        message: 'Invalid chunk structure received from embeddings service'
      });
    }
    
    // Print the top embeddings retrieved for debugging
    console.log('\nTop embeddings retrieved:');
    topChunks.slice(0, 10).forEach((chunk, idx) => {
      console.log(`  #${idx+1} • sim=${chunk.similarity.toFixed(4)} • [${formatTimestamp(chunk.start)}-${formatTimestamp(chunk.end)}] → ${chunk.text.slice(0, 70)}...`);
    });
    
    // Combine top chunks as context (use top 10 chunks with highest similarity)
    const contextChunks = topChunks.slice(0, 10);
    const context = contextChunks.map(c => `[${formatTimestamp(c.start)}-${formatTimestamp(c.end)}] ${c.text}`).join('\n\n');
    
    // Prepare the prompt with the same structure as testChatbot.js
    const prompt = `
    You are an expert summarizer helping answer user questions using transcript excerpts.
    
    Transcript Context:
    ${context}
    
    User Question:
    ${query}
    
    Based only on the context, answer the question as clearly and directly as possible.
    Make your answer sound like you are answering a question and make it sound smooth and understandable.
    Reference timestamps in the context to provide a more accurate answer.
    If the context doesnt provide the right answers to the question or a direct answer, explain it the best you can.
    
    Be factual, concise, and helpful.
    `.trim();

    // open ai code
    // if (!process.env.OPENAI_API_KEY) {
    //   throw new Error('OPENAI_API_KEY environment variable not set');
    // }
    
    // const openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY,
    // });
    
    // const result = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo", // You can use "gpt-4" for better quality if available
    //   messages: [
    //     {
    //       role: "system",
    //       content: "You are an expert summarizer that answers questions based on video transcripts."
    //     },
    //     {
    //       role: "user",
    //       content: prompt
    //     }
    //   ],
    //   temperature: 0.3,
    //   max_tokens: 1024,
    // });
    
    // const answer = result.choices[0].message.content;
    
    // Initialize Gemini and generate response
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent(prompt, {
      generationConfig: { 
        temperature: 0.3,
        maxOutputTokens: 1024
      }
    });
    
    const answer = typeof result.response.text === 'function'
      ? await result.response.text()
      : result.response.text;
    
    // Return the answer along with the relevant chunks
    res.json({
      answer
    });
  } catch (err) {
    console.error('Error in chat controller:', err);
    res.status(500).json({ 
      message: 'An error occurred while processing your request'
    });
  }
};

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