import Video from '../models/video.js';
import { createEmbeddings } from '../service/createEmbeddings.js';
import { retrieveEmbeddings } from '../service/retrieveEmbeddings.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const chat = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Missing query' });

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // transcriptChunks should be JSON array of {start,end,text}
    const transcriptChunks = video.transcript;
    const embedded = await createEmbeddings(transcriptChunks);
    const topChunks = await retrieveEmbeddings(query, embedded, 5);

    const contextText = topChunks
      .map(c => `Timestamp ${c.start}-${c.end}: ${c.text}`)
      .join('\n');

    const prompt = `Context from the video:\n${contextText}\n\nUser Query: ${query}\n\nAnswer based on the above context:`;

    // Initialize Gemini and generate response
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt, {
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    });
    const answer = typeof result.response.text === 'function'
      ? await result.response.text()
      : result.response.text;
    res.json({ answer, sources: topChunks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};