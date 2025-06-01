import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import stream from 'stream';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config({path: '../.env'});

/**
 * Convert MP4 buffer to MP3 stream (no files written)
 */
function convertMp4BufferToMp3Stream(mp4Buffer) {
  return new Promise((resolve, reject) => {
    const inputStream = new stream.PassThrough();
    inputStream.end(mp4Buffer);

    const outputStream = new stream.PassThrough();

    ffmpeg(inputStream)
      .inputFormat('mp4')
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .format('mp3')
      .on('error', reject)
      .pipe(outputStream, { end: true });

    resolve(outputStream);
  });
}

/**
 * Send MP3 stream to Whisper
 */
async function transcribeMp3Stream(mp3Stream) {
  const formData = new FormData();
  formData.append('file', mp3Stream, {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg'
  });
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  console.log('📤 Uploading to OpenAI Whisper...');

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  console.log(`✅ Received ${response.data.segments.length} segments`);
  return response.data;
}

/**
 * Main function – takes an MP4 buffer, returns transcript
 */
export async function transcribeMedia(mp4Buffer) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key');
  }

  try {
    console.log('🎬 Converting MP4 buffer to MP3 stream...');
    const mp3Stream = await convertMp4BufferToMp3Stream(mp4Buffer);

    const data = await transcribeMp3Stream(mp3Stream);
    const fullText = data.segments.map(s => s.text).join(' ');
    
    // Extract only the needed properties from each segment
    const segments = data.segments.map(({ start, end, text }) => ({
      start,
      end,
      text: text.trim()
    }));

    console.log('📝 Transcript segments:');
    console.log(segments);

    return {
      fullText,
      segments
    };
  } catch (err) {
    console.error('❌ Error during transcription:', err.message);
    throw err;
  }
}
