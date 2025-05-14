// test/testChatbot.js
import 'dotenv/config';
import { createEmbeddings, retrieveEmbeddings } from './service/embedding.js'; // Update path as needed
import { GoogleGenerativeAI } from '@google/generative-ai';

// Sample transcript chunks for testing
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
    // Step 1: Create embeddings for all transcript chunks
    console.log('Creating embeddings for transcript chunks...');
    const embedded = await createEmbeddings(transcriptChunks);
    console.log(`Created embeddings for ${embedded.length} chunks successfully.`);
    
    // For testing different queries
    const queries = [
      "What are CNNs?",
      "How do neural networks work?",
      "What is reinforcement learning?"
    ];
    
    // Process each query
    for (const query of queries) {
      console.log(`\n=== Processing query: "${query}" ===`);
      
      // Step 2: Retrieve relevant chunks for the query
      console.log('Retrieving relevant chunks...');
      const scored = await retrieveEmbeddings(query, embedded, 3); // Get top 3 relevant chunks
      
      // Display results
      scored.forEach((c, i) => {
        console.log(`#${i+1} • sim=${c.similarity.toFixed(4)} → ${c.text.slice(0,70)}...`);
      });
      
      // Step 3: Generate response using Gemini AI with context
      if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set in environment variables');
        console.log('Skipping Gemini response generation...');
        continue;
      }
      
      // Combine top chunks as context (use top 2 for better context)
      const contextChunks = scored.slice(0, 2);
      const context = contextChunks.map(c => c.text).join('\n\n');
      
      // Prepare the prompt with retrieved context
      const prompt = `
Context from the transcript:
${context}

User Query: ${query}

Answer the user's query based on the provided context. Be concise but thorough.
      `.trim();
      
      // Generate response using Gemini
      console.log('Generating response with Gemini AI...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const res = await model.generateContent(prompt, {
        generationConfig: { 
          temperature: 0.2, 
          maxOutputTokens: 1024,
          topP: 0.8,
        }
      });
      
      const answer = typeof res.response.text === 'function'
        ? await res.response.text()
        : res.response.text;
        
      console.log('\nGenerated Answer:');
      console.log('-----------------');
      console.log(answer);
      console.log('-----------------');
    }
    
    console.log('\nTest completed successfully');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

testChatbot();