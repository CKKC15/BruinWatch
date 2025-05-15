// chunkTranscript.js

import fs from 'fs';
import path from 'path';

/**
 * Split a transcript into 15-second chunks of 1–2 sentences each.
 *
 * @param {string} transcript   The full transcript text.
 * @param {number} chunkLength  Chunk duration in seconds (default 15).
 * @returns {Array<{start:number,end:number,text:string}>}
 */
function chunkTranscript(transcript, chunkLength = 15) {
  const sentences = transcript
    .match(/[^\.!\?]+[\.!\?]+(?:\s|$)/g)
    ?.map(s => s.trim())
    || [];

  const chunks = [];
  let currentStart = 0.0;

  for (let i = 0; i < sentences.length; i += 2) {
    const slice = sentences.slice(i, i + 2).join(' ');
    chunks.push({
      start: Number(currentStart.toFixed(1)),
      end:   Number((currentStart + chunkLength).toFixed(1)),
      text:  slice
    });
    currentStart += chunkLength;
  }

  return chunks;
}

/**
 * Read inputPath, chunk it, and write a JS-array literal to outputPath.
 *
 * Usage: node chunkTranscript.js input.txt output.js
 */
function chunkTranscriptToFile(inputPath, outputPath, chunkLength = 15) {
  const transcript = fs.readFileSync(inputPath, 'utf-8');
  const chunks = chunkTranscript(transcript, chunkLength);

  // Build an array literal without 'export const ...'
  const lines = [];
  lines.push('[');
  for (const c of chunks) {
    const safeText = c.text.replace(/"/g, '\\"');
    lines.push(
      `  { start: ${c.start.toFixed(1)}, end: ${c.end.toFixed(1)}, text: "${safeText}" },`
    );
  }
  lines.push(']');

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  console.log(`✅ Wrote ${chunks.length} chunks to ${outputPath}`);
}

// If run directly from CLI, parse args
if (import.meta.url === `file://${process.argv[1]}`) {
  const [ , , inFile, outFile ] = process.argv;
  if (!inFile || !outFile) {
    console.error('Usage: node chunkTranscript.js <input.txt> <output.js>');
    process.exit(1);
  }
  chunkTranscriptToFile(path.resolve(inFile), path.resolve(outFile));
}

export { chunkTranscript, chunkTranscriptToFile };
