import { pipeline } from '@xenova/transformers';

class EmbeddingExtractor {
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
      return {
        ...chunk,
        embedding: Array.from(output.data[0])
      };
    })
  );
  return results;
}