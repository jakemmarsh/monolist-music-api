'use strict';

const path    = require('path');
const fs      = require('fs');
const http    = require('http');
const crypto  = require('crypto');
const request = require('request');
const _       = require('lodash');
const ytdl    = require('ytdl-core');
const models  = require('../models');

const ACR_OPTIONS = {
  host: 'us-west-2.api.acrcloud.com',
  endpoint: '/v1/identify',
  signatureVersion: '1', // eslint-disable-line camelcase
  dataType: 'audio',
  secure: true,
  accessKey: process.env.ACRCLOUD_KEY,
  accessSecret: process.env.ACRCLOUD_SECRET
};

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
  return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
}

function sign(signString, accessSecret) {
  return crypto.createHmac('sha1', accessSecret)
    .update(new Buffer(signString, 'utf-8'))
    .digest().toString('base64');
}

const trackRecognition = {

  buildFilePath(trackId) {
    const rootFile = require.main.filename;
    const finalSlashIndex = rootFile.lastIndexOf('/');
    const fileNameLength = rootFile.slice(0 + finalSlashIndex).length;
    const rootDirectory = rootFile.slice(0, -fileNameLength + 1);

    return path.resolve(rootDirectory, 'audio_files/', `${trackId}.mp3`);
  },

  retrieveTrack(trackId) {
    return new Promise((resolve, reject) => {
      models.Track.find({
        where: { id: trackId }
      }).then((track) => {
        resolve(track);
      }).catch(reject);
    });
  },

  buildDownloadUrl(track) {
    const apiUrl = process.env.NODE_ENV === 'production' ? 'http://api.monolist.co' : `http://localhost:${process.env.PORT || 3000}`;

    return new Promise((resolve) => {
      let url;

      if ( track.source === 'youtube' ) {
        url = `http://youtube.com/watch?v=${track.sourceParam}`;
      } else {
        url = `${apiUrl}/v1/stream/${track.source}/`;

        if ( track.source === 'audiomack' ) {
          url += encodeURIComponent(track.sourceUrl);
        } else {
          url += encodeURIComponent(track.sourceParam);
        }
      }

      resolve({
        trackId: track.id,
        trackSource: track.source,
        url: url
      });
    });
  },

  downloadTrack(data) {
    const trackId = data.trackId;
    const trackSource = data.trackSource;
    const url = data.url;
    const destPath = this.buildFilePath(trackId);
    const destFile = fs.createWriteStream(destPath);

    return new Promise((resolve, reject) => {
      if ( trackSource === 'youtube' ) {
        ytdl(url, {
          filter: 'audioonly'
        })
        .on('response', (response) => {
          console.log('response:', response);
        })
        .pipe(destFile);

        destFile.on('finish', () => {
          destFile.close();

          resolve(trackId);
        });
      } else {
        http.get(url, (response) => {
          response.pipe(destFile);

          destFile.on('finish', () => {
            destFile.close();

            resolve(trackId);
          });
        }).on('error', (err) => {
          fs.unlink(destPath);

          reject(err.message);
        });
      }
    });
  },

  generateFingerprint(trackId) {
    const filePath = this.buildFilePath(trackId);
    const duration = 30;
    const startTime = 20;

    return new Promise((resolve, reject) => {
      codegen({
        file: filePath,
        index: startTime,
        offset: duration
      }, function(err, data) {
        if ( err ) {
          reject(err);
        } else {
          resolve({
            trackId: trackId,
            fingerprint: data
          });
        }
      });
    });
  },

  identifyTrack(trackId) {
    return new Promise((resolve, reject) => {
      const filePath = this.buildFilePath(trackId);
      const fileData = new Buffer(fs.readFileSync(filePath));
      const currentDate = new Date();
      const timestamp = currentDate.getTime()/1000;
      const stringToSign = buildStringToSign(
        'POST',
        ACR_OPTIONS.endpoint,
        ACR_OPTIONS.accessKey,
        ACR_OPTIONS.dataType,
        ACR_OPTIONS.signatureVersion,
        timestamp
      );
      const signature = sign(stringToSign, ACR_OPTIONS.accessSecret);
      const formData = {
        sample: fileData,
        access_key: ACR_OPTIONS.accessKey, // eslint-disable-line camelcase
        data_type: ACR_OPTIONS.dataType, // eslint-disable-line camelcase
        signature_version: ACR_OPTIONS.signatureVersion, // eslint-disable-line camelcase
        signature: signature,
        sample_bytes: fileData.length, // eslint-disable-line camelcase
        timestamp: timestamp
      };

      request.post({
        url: `http://${ACR_OPTIONS.host}${ACR_OPTIONS.endpoint}`,
        method: 'POST',
        formData: formData
      }, (err, httpResonse, body) => {
        if ( err ) {
          reject(err);
        } else {
          body = JSON.parse(body);

          const musicData = body.metadata && body.metadata.music ? body.metadata.music[0] : {};
          const artistData = musicData.artists ? musicData.artists[0] : {};
          const trackData = {
            title: musicData.title,
            artist: artistData.name
          };

          resolve({
            trackId: trackId,
            trackData: trackData
          });
        }
      });
    });
  },

  deleteTrack(data) {
    const trackId = data.trackId;
    const trackData = data.trackData;
    const filePath = this.buildFilePath(trackId);

    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err) => {
        if ( err ) {
          reject(err);
        } else {
          fs.unlink(filePath, (err) => {
            if ( err ) {
              reject(err);
            } else {
              resolve({
                trackId: trackId,
                trackData: trackData
              });
            }
          });
        }
      });
    });
  },

  updateTrack(data) {
    return new Promise((resolve, reject) => {
      const trackId = data.trackId;
      const trackData = data.trackData;
      const updates = {};

      if ( trackData.title ) {
        updates.title = trackData.title;
      }

      if ( trackData.artist ) {
        updates.artist = trackData.artist;
      }

      if ( !_.isEmpty(updates) ) {
        models.Track.update(
          updates,
          { where: { id: trackId } }
        ).then(resolve).catch(reject);
      } else {
        resolve();
      }
    });
  },

  processTrack(trackId) {
    return new Promise((resolve, reject) => {
      this.retrieveTrack(trackId)
        .then(this.buildDownloadUrl.bind(this))
        .then(this.downloadTrack.bind(this))
        .then(this.identifyTrack.bind(this))
        .then(this.deleteTrack.bind(this))
        .then(this.updateTrack.bind(this))
        .then(resolve)
        .catch(reject);
    });
  },

  processAllTracks(tracks) {
    return new Promise((resolve, reject) => {
      const promises = [];

      tracks.forEach((track) => {
        promises.push(this.processTrack(track.id));
      });

      Promise.all(promises).then(resolve).catch(reject);
    });
  },

  identifyAllTracksInPlaylist(playlistId) {
    return new Promise((resolve, reject) => {
      models.Track.findAll({
        where: { PlaylistId: playlistId },
        attributes: ['id']
      }).then(this.processAllTracks.bind(this)).catch((err) => {
        console.log('ERROR IN TRACK IDENTIFICATION:', err);
        reject(err);
      });
    });
  },

  identifyeMostRecentTracks() {
    return new Promise((resolve, reject) => {
      const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

      models.Track.findAll({
        where: { createdAt: { $gte: yesterday } },
        attributes: ['id']
      }).then(this.processAllTracks.bind(this)).catch((err) => {
        console.log('ERROR IN TRACK IDENTIFICATION:', err);
        reject(err);
      });
    });
  }

};

module.exports = trackRecognition;
