import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

/**
 * Converts a YouTube link to an MP4 file buffer.
 * @param {string} youtubeUrl - The YouTube video URL.
 * @returns {Promise<{buffer: Buffer, title: string}>} - MP4 file buffer and video title.
 */
export async function convertYouTubeToMP4(youtubeUrl) {
  // Validate YouTube URL
  if (!ytdl.validateURL(youtubeUrl)) {
    throw new Error('Invalid YouTube URL');
  }

  // Get video info
  const info = await ytdl.getInfo(youtubeUrl);

  // Create temporary file paths
  const tempDir = path.join(__dirname, '..', '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempInput = path.join(tempDir, 'temp_input');
  const tempOutput = path.join(tempDir, 'temp_output.mp4');

  try {
    // Download video to temporary file
    const videoStream = ytdl(youtubeUrl, {
      quality: 'highestvideo',
      filter: 'audioandvideo'
    });

    // Write to temporary file
    const writeStream = fs.createWriteStream(tempInput);
    videoStream.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', async () => {
        try {
          // Use FFmpeg to convert to MP4
          await new Promise((resolve, reject) => {
            ffmpeg(tempInput)
              .output(tempOutput)
              .outputOptions('-c:v copy', '-c:a copy')
              .on('end', resolve)
              .on('error', reject)
              .run();
          });

          // Read the MP4 file as buffer
          const buffer = await promisify(fs.readFile)(tempOutput);
          
          // Clean up temporary files
          fs.unlinkSync(tempInput);
          fs.unlinkSync(tempOutput);

          resolve({
            buffer,
            title: info.videoDetails.title
          });
        } catch (error) {
          // Clean up on error
          if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
          reject(error);
        }
      });

      writeStream.on('error', reject);
    });
  } catch (error) {
    // Clean up any existing temp files on error
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    throw error;
  }

}
