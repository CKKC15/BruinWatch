import 'dotenv/config';
import { createEmbeddings } from './service/createEmbeddings.js';
import { retrieveEmbeddings } from './service/retrieveEmbeddings.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Change this query to test different prompts
const query = "What is machine learning?";

// Fake transcript chunks for testing
const transcriptChunks = [
  { start: 0.0,   end: 30.5,  text: "Machine learning is a subset of artificial intelligence that focuses on the ability of machines to learn from data without being explicitly programmed." },
  { start: 30.6,  end: 60.0,  text: "Neural networks are computational models inspired by the human brain, consisting of interconnected nodes or 'neurons' that process information." },
  { start: 60.1,  end: 90.0,  text: "Deep learning is an advanced technique in machine learning that uses multiple layers of neural networks to extract higher-level features from raw input." },
  { start: 90.1,  end: 120.0, text: "Supervised learning involves training a model on a labeled dataset, where the input data is paired with the correct output. Common algorithms include linear regression, logistic regression, and support vector machines." },
  { start: 120.1, end: 150.0, text: "Unsupervised learning deals with unlabeled data, focusing on finding patterns or structures within the data. Clustering algorithms like K-means and hierarchical clustering are key techniques." },
  { start: 150.1, end: 180.0, text: "Reinforcement learning is a type of machine learning where an agent learns to make decisions by performing actions in an environment to maximize a cumulative reward." },
  { start: 180.1, end: 210.0, text: "Convolutional Neural Networks (CNNs) are particularly effective in image recognition and computer vision tasks, using specialized layers to detect spatial hierarchies of features." },
  { start: 210.1, end: 240.0, text: "Recurrent Neural Networks (RNNs) and Long Short-Term Memory (LSTM) networks are designed to work with sequential data, making them ideal for natural language processing and time series analysis." },
  { start: 240.1, end: 270.0, text: "Transfer learning allows a model trained on one task to be repurposed for a related task, significantly reducing the amount of training data and computational resources needed." },
  { start: 270.1, end: 300.0, text: "Ethical considerations in AI include bias mitigation, transparency, and ensuring that machine learning models make fair and unbiased decisions across different demographic groups." }
];

async function testChatbot() {
  try {
    console.log('Creating embeddings...');
    const embedded = await createEmbeddings(transcriptChunks);

    console.log('Retrieving relevant chunks...');
    const topChunks = await retrieveEmbeddings(query, embedded, 5);

    const contextText = topChunks
      .map(c => `Timestamp ${c.start}-${c.end}: ${c.text}`)
      .join('\n');
    const prompt = `Context from the transcript:\n${contextText}\n\nUser Query: ${query}\n\nAnswer based on the above context:`;

    console.log('Initializing Gemini model...');
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in .env file');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    console.log('Generating response with Gemini...');
    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    });

    const answer = typeof result.response.text === 'function'
      ? await result.response.text()
      : result.response.text;

    console.log('Answer:', answer);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

testChatbot();
