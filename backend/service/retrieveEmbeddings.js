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
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
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
  const extractor = await EmbeddingRetriever.getExtractor();
  // embed query
  const out = await extractor(query);
  const queryVec = Array.from(out.data[0]);
  // score each chunk
  const scored = embeddedChunks.map(chunk => ({
    ...chunk,
    similarity: EmbeddingRetriever.cosineSimilarity(queryVec, chunk.embedding)
  }));
  // sort and take topK
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}