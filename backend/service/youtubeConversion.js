import ytdl from 'ytdl-core';
import youtubeDl from 'youtube-dl-exec';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts a YouTube video to MP4 format
 * @param {string} youtubeUrl - The YouTube video URL
 * @returns {Promise<Buffer>} - The video buffer in MP4 format
 */
export async function convertYouTubeToMP4(youtubeUrl) {
    if (!ytdl.validateURL(youtubeUrl)) {
        throw new Error('Invalid YouTube URL');
    }

    try {
        console.log('Processing YouTube video:', youtubeUrl);

        return new Promise((resolve, reject) => {
            const chunks = [];
            let errorOutput = '';

            // Find the yt-dlp binary from the youtube-dl-exec package
            const ytDlpPath = path.join(__dirname, '../../node_modules/youtube-dl-exec/bin/yt-dlp');

            // Spawn yt-dlp process with the correct path
            const ytDlpProcess = spawn(ytDlpPath, [
                youtubeUrl,
                '--format', 'best[ext=mp4]/best',
                '--output', '-',
                '--no-warnings',
                '--no-check-certificate',
                '--no-playlist',
                '--quiet'
            ]);

            // Collect video data
            ytDlpProcess.stdout.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // Collect error output
            ytDlpProcess.stderr.on('data', (chunk) => {
                errorOutput += chunk.toString();
            });

            // Handle process completion
            ytDlpProcess.on('close', (code) => {
                if (code === 0) {
                    const videoBuffer = Buffer.concat(chunks);
                    if (videoBuffer.length === 0) {
                        reject(new Error('No video data received'));
                    } else {
                        console.log('Download completed successfully, video size:', videoBuffer.length);
                        resolve(videoBuffer);
                    }
                } else {
                    console.error('yt-dlp error output:', errorOutput);
                    reject(new Error(`yt-dlp failed with exit code ${code}: ${errorOutput}`));
                }
            });

            // Handle process errors
            ytDlpProcess.on('error', (error) => {
                reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
            });
        });

    } catch (error) {
        console.error('YouTube conversion error:', error);
        throw new Error(`Failed to process YouTube video: ${error.message}`);
    }
} 