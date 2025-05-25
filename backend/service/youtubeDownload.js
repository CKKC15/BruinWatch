import ytdl from 'ytdl-core';
import stream from 'stream';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';

const pipeline = promisify(stream.pipeline);

/**
 * Converts a YouTube link to an MP4 buffer
 * @param {string} youtubeUrl - The YouTube video URL
 * @returns {Promise<Buffer>} - MP4 file buffer
 */
export async function convertYouTubeToMP4(youtubeUrl) {
  if (!ytdl.validateURL(youtubeUrl)) {
    throw new Error('Invalid YouTube URL');
  }

  const videoStream = ytdl(youtubeUrl, {
    filter: 'audioandvideo',
    quality: 'highest'
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    
    ffmpeg()
      .input(videoStream)
      .audioCodec('aac')
      .videoCodec('libx264')
      .format('mp4')
      .outputOptions([
        '-movflags frag_keyframe+empty_moov',
        '-f mp4',
        '-preset ultrafast'
      ])
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', reject)
      .pipe(stream.PassThrough());
  });
}
