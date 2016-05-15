'use strict';

const fs            = require('fs');
const http          = require('http');
const child_process = require('child_process'); // eslint-disable-line camelcase
const ecg           = require('echoprint-codegen');
const models        = require('../models');

class trackRecognition {
  constructor() {}

  buildStreamUrl(track) {
    const apiUrl = process.env.NODE_ENV === 'production' ? 'http://api.monolist.co' : `http://localhost:${process.env.PORT || 3000}`;

    return new Promise((resolve) => {
      let url = `${apiUrl}/stream/${track.source}/`;

      if ( track.source === 'audiomack' ) {
        url += encodeURIComponent(track.sourceUrl);
      } else {
        url += encodeURIComponent(track.sourceParam);
      }

      resolve(trackId, url);
    });
  }

  buildFilePath(trackId) {
    return path.resolve(__dirname, 'audio_files/', `${trackId}`);
  }

  retrieveTrack(trackId) {
    return new Promise((resolve, reject) => {
      models.Track.find({
        where: { id: trackId }
      }).then(resolve).catch(reject);
    });
  }

  downloadTrack(trackId, streamUrl) {
    const destPath = this.buildFilePath(trackId);
    const destFile = fs.createWriteStream(destPath);

    return new Promise((resolve, reject) => {
      http.get(streamUrl, (response) => {
        response.pipe(destFile);

        destFile.on('finish', () => {
          destFile.close();

          resolve(trackId);
        });
      }).on('error', (err) => {
        fs.unlink(dest);

        reject(err.message);
      });
    });
  }

  generateFingerprint(trackId) {
    const filePath = this.buildFilePath(trackId);
    const duration = 30;                 // Length of clip to extract
    const numSamples = 11025 * duration; // Number of samples to read
    const songOffset = 0;                // Start time of clip in seconds
    const bytesPerSample = 4;            // Samples are 32 bit floats
    const bufferSize = numSamples * bytesPerSample;

    return new Promise((resolve, reject) => {
      const ffmpeg = child_process.spawn('ffmpeg', [ // eslint-disable-line camelcase
        '-i', filePath,       // MP3 file
        '-f', 'f32le',        // 32 bit float PCM LE
        '-ar', '11025',       // Sampling rate
        '-ac', 1,             // Mono
        '-t', duration,       // Duration in seconds
        '-ss', songOffset,    // Start time in seconds
        'pipe:1'              // Output on stdout
      ]);

      ffmpeg.stdout.on('readable', () => {
        const buffer = ffmpeg.stdout.read(bufferSize);

        if (buffer === null) {
          return; // Not enough samples yet
        }

        ffmpeg.stdout.removeListener('readable', arguments.callee);
        ffmpeg.kill('SIGHUP');

        ecg(buffer, numSamples, songOffset, (fingerprint) => {
          resolve(fingerprint);
        });
      });

      ffmpeg.stdout.on('error', (err) => {
        reject(err.message);
      });
    });
  }

  ingestFingerprint(fingerprint) {
    console.log('fingerprint:', fingerprint);

    return new Promise((resolve) => {
      resolve('track data');
    });
  }

  recognizeTrack(trackId) {
    return new Promise((resolve, reject) => {
      this.retrieveTrack(trackId)
        .then(this.buildStreamUrl)
        .then(this.downloadTrack)
        .then(this.generateFingerprint)
        .then(this.ingestFingerprint)
        .then(resolve)
        .catch(reject);
    });
  }
}

module.exports = trackRecognition;
