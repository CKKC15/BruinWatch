import { pipeline } from '@xenova/transformers';

class EmbeddingRetriever {
  static extractor = null;

  static async getExtractor() {
    if (!this.extractor) {
      this.extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }
    return this.extractor;
  }

  static cosineSimilarity(a, b) {
    // Ensure vectors are the same length
    if (a.length !== b.length) {
      console.error(`Cosine similarity: Vector length mismatch (${a.length} vs ${b.length})`);
      return NaN;
    }
    
    // Compute dot product
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    
    // Compute magnitudes
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    // Handle zero magnitude
    if (magA === 0 || magB === 0) {
      return 0; // Orthogonal vectors
    }
    
    return dot / (magA * magB);
  }
}

/**
 * Retrieve top-K transcript chunks by similarity to a query
 * @param {string} query
 * @param {Array<{start:number,end:number,text:string,embedding:number[]}>} embeddedChunks
 * @param {number} topK
 * @returns {Promise<Array<{start:number,end:number,text:string,embedding:number[],similarity:number}>>}
 */
export async function retrieveEmbeddings(query, embeddedChunks, topK = 5) {
  console.log('Query:', query);
  console.log('Number of embedded chunks:', embeddedChunks.length);
  
  // Validate input embeddings
  const embeddingLengths = embeddedChunks.map(chunk => chunk.embedding.length);
  const uniqueLengths = [...new Set(embeddingLengths)];
  
  if (uniqueLengths.length > 1) {
    console.error('Inconsistent chunk embedding dimensions:', uniqueLengths);
    throw new Error(`Chunk embeddings have inconsistent dimensions: ${uniqueLengths.join(', ')}`);
  }
  
  // Get extractor and create query embedding
  const extractor = await EmbeddingRetriever.getExtractor();
  const output = await extractor(query);
  
  // Flatten and process query embedding
  let queryEmbedding = output.data;
  while (Array.isArray(queryEmbedding) && Array.isArray(queryEmbedding[0])) {
    queryEmbedding = queryEmbedding[0];
  }
  queryEmbedding = Array.from(queryEmbedding);
  
  // Validate query embedding
  if (!queryEmbedding.every(x => typeof x === 'number' && !isNaN(x))) {
    console.error('Non-numeric query embedding detected');
    throw new Error('Query embedding contains non-numeric values');
  }
  
  // Ensure query embedding matches chunk embedding dimension
  const expectedDimension = embeddedChunks[0].embedding.length;
  if (queryEmbedding.length !== expectedDimension) {
    console.warn(`Truncating/padding query embedding from ${queryEmbedding.length} to ${expectedDimension}`);
    
    if (queryEmbedding.length > expectedDimension) {
      // Truncate
      queryEmbedding = queryEmbedding.slice(0, expectedDimension);
    } else {
      // Pad with zeros
      const padding = new Array(expectedDimension - queryEmbedding.length).fill(0);
      queryEmbedding = [...queryEmbedding, ...padding];
    }
  }
  
  // Score each chunk
  const scored = embeddedChunks.map(chunk => {
    const similarity = EmbeddingRetriever.cosineSimilarity(queryEmbedding, chunk.embedding);
    return { ...chunk, similarity };
  });
  
  // Sort and return top K
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}