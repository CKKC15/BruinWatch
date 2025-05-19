// turn the old transcript code to a function we can call
// main function you call is transcribeMedia

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config();

/**
 * Convert an .mp4 file to .mp3, saving alongside the source.
 * @param {string} inputPath
 * @returns {Promise<string>} path to the .mp3 file
 */
function convertMp4ToMp3(inputPath) {
  const dir     = path.dirname(inputPath);
  const base    = path.basename(inputPath, '.mp4');
  const outPath = path.join(dir, `${base}-tmp.mp3`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .on('end', () => resolve(outPath))
      .on('error', reject)
      .save(outPath);
  });
}

/**
 * Send an audio stream to OpenAI Whisper and get back a transcript.
 * @param {fs.ReadStream} fileStream
 * @param {string} model
 * @returns {Promise<string>}
 */
async function whisperTranscribe(fileStream, model = 'whisper-1') {
  const form = new FormData();
  form.append('file', fileStream);
  form.append('model', model);

  const resp = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    { headers: { 
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );

  return resp.data.text;
}

/**
 * Given a path to an .mp3 or .mp4 file, returns the transcript string.
 * @param {string} inputPath
 * @returns {Promise<string>}
 */
export async function transcribeMedia(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  let toTranscribePath = inputPath;
  let cleanupTemp = false;

  if (ext === '.mp4') {
    toTranscribePath = await convertMp4ToMp3(inputPath);
    cleanupTemp = true;
  } else if (ext !== '.mp3') {
    throw new Error('Unsupported file type. Only .mp3 and .mp4 are allowed.');
  }

  try {
    const stream = fs.createReadStream(toTranscribePath);
    return await whisperTranscribe(stream);
  } finally {
    if (cleanupTemp) {
      fs.unlink(toTranscribePath, err => {
        if (err) console.warn('Failed to clean up temp file:', err);
      });
    }
  }
}
