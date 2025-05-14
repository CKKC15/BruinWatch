import { pipeline } from '@xenova/transformers';

class EmbeddingExtractor {
  static extractor = null;

  static async getExtractor() {
    if (!this.extractor) {
      // Use a specific model with a fixed embedding dimension
      this.extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { quantized: false } // Ensure full precision
      );
    }
    return this.extractor;
  }
}
/**
 * Create embeddings for given transcript chunks
 * @param {Array<{start:number,end:number,text:string}>} transcriptChunks
 * @returns {Promise<Array<{start:number,end:number,text:string,embedding:number[]}>>}
 */
export async function createEmbeddings(transcriptChunks) {
  const extractor = await EmbeddingExtractor.getExtractor();
  const results = await Promise.all(
    transcriptChunks.map(async (chunk) => {
      const output = await extractor(chunk.text);
      
      // Flatten the embedding array consistently
      let embeddingArr = output.data;
      while (Array.isArray(embeddingArr) && Array.isArray(embeddingArr[0])) {
        embeddingArr = embeddingArr[0];
      }
      embeddingArr = Array.from(embeddingArr);
      
      // Validate and log embedding details
      console.log(`Embedding for chunk: length=${embeddingArr.length}, first 5 values=${embeddingArr.slice(0, 5)}`);
      
      if (!embeddingArr.every(x => typeof x === 'number' && !isNaN(x))) {
        throw new Error('Non-numeric embedding detected: ' + JSON.stringify(embeddingArr));
      }
      
      return {
        ...chunk,
        embedding: embeddingArr
      };
    })
  );
  
  // Verify all embeddings have the same dimension
  const embeddingDimensions = results.map(r => r.embedding.length);
  const uniqueDimensions = [...new Set(embeddingDimensions)];
  
  if (uniqueDimensions.length > 1) {
    console.error('Inconsistent embedding dimensions:', uniqueDimensions);
    throw new Error(`Embeddings have inconsistent dimensions: ${uniqueDimensions.join(', ')}`);
  }
  
  return results;
}