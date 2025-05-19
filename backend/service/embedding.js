// service/embedding.js
import { pipeline } from '@xenova/transformers';

// Singleton extractor promise to ensure consistent model loading
let _extractorPromise = null;
async function getExtractor() {
  if (!_extractorPromise) {
    console.log('Loading embedding model...');
    _extractorPromise = pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: false }
    );
  }
  return _extractorPromise;
}

/**
 * Recursively flatten arrays (including TypedArrays) into a standard number[].
 * This handles various output formats from the transformer model.
 * @param {any} value - The value to flatten (array, TypedArray, or primitive)
 * @returns {number[]} A flat array of numbers
 */
function flattenToNumbers(value) {
  const out = [];
  const recurse = (v) => {
    // handle plain JS arrays
    if (Array.isArray(v)) {
      v.forEach(recurse);
    }
    // handle TypedArrays (Float32Array, etc.)
    else if (ArrayBuffer.isView(v) && !(v instanceof DataView)) {
      for (let i = 0, n = v.length; i < n; i++) {
        out.push(Number(v[i])); // Explicitly convert to Number
      }
    }
    // push numbers
    else if (typeof v === 'number') {
      out.push(v);
    }
    // ignore everything else
  };
  recurse(value);
  return out;
}

/**
 * Normalizes a vector to unit length (L2 normalization)
 * @param {number[]} vector - The vector to normalize
 * @returns {number[]} The normalized vector
 */
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector; // Avoid division by zero
  return vector.map(val => val / magnitude);
}

/**
 * Embed a single piece of text, with output normalization.
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} A normalized embedding vector
 */
async function embedText(text) {
  const extractor = await getExtractor();
  
  // Use pooling to get a fixed-size embedding
  const result = await extractor(text, {
    pooling: 'mean',
    normalize: true
  });

  // Handle different output formats
  const raw = result.data || result;
  let embedding = flattenToNumbers(raw);

  if (embedding.length === 0) {
    throw new Error(`Empty embedding for text "${text.slice(0,30)}…"`);
  }

  // Sanitize any non-finite values
  embedding = embedding.map((x, i) => {
    if (!Number.isFinite(x)) {
      console.warn(
        `embeddingSanitize: non-finite at idx=${i}, text="${text.slice(0,20)}…", replacing with 0`
      );
      return 0;
    }
    return x;
  });

  // Normalize the embedding vector
  return normalizeVector(embedding);
}

/**
 * Create embeddings for an array of transcript chunks.
 * @param {Array<{start: number, end: number, text: string}>} transcriptChunks - Chunks to embed
 * @returns {Promise<Array<{start: number, end: number, text: string, embedding: number[]}>>} Chunks with embeddings
 */
export async function createEmbeddings(transcriptChunks) {
  console.log(`Creating embeddings for ${transcriptChunks.length} chunks...`);
  const enriched = await Promise.all(
    transcriptChunks.map(async (chunk) => ({
      ...chunk,
      embedding: await embedText(chunk.text),
    }))
  );

  // Verify embedding dimensions are consistent
  const dims = [...new Set(enriched.map((c) => c.embedding.length))];
  if (dims.length > 1) {
    console.error(`Found inconsistent embedding sizes: ${dims}`);
    throw new Error(`Inconsistent embedding sizes: ${dims.join(', ')}`);
  }
  
  console.log(`Successfully created ${enriched.length} embeddings with dimension ${dims[0]}`);
  return enriched;
}

/**
 * Calculate cosine similarity between two normalized vectors.
 * @param {number[]} a - First vector (must be normalized)
 * @param {number[]} b - Second vector (must be normalized)
 * @returns {number} Cosine similarity (-1 to 1, where 1 is most similar)
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }
  
  // Since we're using normalized vectors, dot product equals cosine similarity
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Retrieve the most relevant chunks based on embedding similarity.
 * @param {string} query - The query text to compare against chunks
 * @param {Array<{start: number, end: number, text: string, embedding: number[]}>} embeddedChunks - Chunks with embeddings
 * @param {number} topK - Number of top matches to return
 * @returns {Promise<Array<{start: number, end: number, text: string, embedding: number[], similarity: number}>>} Top matches with similarity scores
 */
export async function retrieveEmbeddings(query, embeddedChunks, topK = 5) {
  if (embeddedChunks.length === 0) return [];
  console.log(`Retrieving top ${topK} chunks for query: "${query}"`);

  const expectedDim = embeddedChunks[0].embedding.length;
  console.log(`Expected embedding dimension: ${expectedDim}`);
  
  // Embed the query using the same method as the chunks
  const qEmb = await embedText(query);
  
  // Verify dimensions match
  if (qEmb.length !== expectedDim) {
    console.warn(`Query embedding dimension (${qEmb.length}) doesn't match chunks (${expectedDim})`);
    // For production, you might want to handle this more gracefully
    // e.g., by padding/truncating instead of throwing an error
    throw new Error(`Query embedding dimension mismatch: expected ${expectedDim}, got ${qEmb.length}`);
  }

  // Score chunks by similarity
  const scored = embeddedChunks.map((c) => {
    try {
      return {
        ...c,
        similarity: cosineSimilarity(qEmb, c.embedding),
      };
    } catch (err) {
      console.warn(`Skipping chunk due to embedding error: ${err.message}`);
      return { ...c, similarity: -1 }; // Use -1 to indicate error (will be sorted to bottom)
    }
  });
  
  // Filter out any chunks that had errors during scoring
  const validScores = scored.filter(c => c.similarity !== -1);

  // Sort by similarity (highest first) and take top K
  return validScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}