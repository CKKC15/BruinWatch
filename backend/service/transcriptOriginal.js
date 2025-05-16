// original transcript file


import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

function convertMp4ToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

async function transcribe(fileStream) {
  const formData = new FormData();
  formData.append('file', fileStream);
  formData.append('model', 'whisper-1');

  const { data } = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );
  return data.text;
}

async function main() {
  // Accept a file path from the command line: `node index.js <file>`
  const inputPath = 'test.mp3';
  if (!inputPath) {
    console.error('Please supply a media file path (mp3 or mp4).');
    process.exit(1);
  }

  const ext = path.extname(inputPath).toLowerCase();
  let fileForWhisper = inputPath;   // default = original file
  let tempCreated = false;          // track if we need to delete later

  try {
    if (ext === '.mp4') {
      // build temp path next to the original file
      const basename = path.basename(inputPath, '.mp4');
      fileForWhisper = path.join(path.dirname(inputPath), `${basename}-tmp.mp3`);
      console.log('Converting MP4 → MP3 …');
      await convertMp4ToMp3(inputPath, fileForWhisper);
      tempCreated = true;
    } else if (ext !== '.mp3') {
      console.error('Unsupported file type. Provide .mp3 or .mp4.');
      process.exit(1);
    }

    const stream = fs.createReadStream(fileForWhisper);
    console.log('Transcribing …');
    const text = await transcribe(stream);
    console.log('\n Transcript:\n', text);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    // Cleanup temp mp3 if we created one
    if (tempCreated) {
      fs.unlink(fileForWhisper, () => {});
    }
  }
}
main();

