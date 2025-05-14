import ytdl from 'ytdl-core';

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

  // Stream video
  const videoStream = ytdl(youtubeUrl, { 
    quality: 'highestvideo', 
    filter: 'audioandvideo' 
  });

  return new Promise((resolve, reject) => {
    const chunks = [];

    videoStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    videoStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve({
        buffer,
        title: info.videoDetails.title
      });
    });

    videoStream.on('error', reject);
  });
}
