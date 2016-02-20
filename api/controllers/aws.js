'use strict';

var when            = require('when');
var _               = require('lodash');
var Knox            = require('knox');
var crypto          = require('crypto');
var moment          = require('moment');
var mime            = require('mime-types');
var changeCase      = require('change-case');
var models          = require('../models');
var ResponseHandler = require('../utils/ResponseHandler');

/* ====================================================== */

var AWS = Knox.createClient({
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  bucket: process.env.S3_BUCKET
});

/* ====================================================== */

function uploadToAWS(file, type, entityId) {

  var deferred = when.defer();
  var datePrefix = moment().format('YYYY[/]MM');
  var key = crypto.randomBytes(10).toString('hex');
  var hash = key + '-' + entityId;
  var path = '/' + type + '_imgs/' + datePrefix + '/' + hash + '.' + mime.extensions[file.mimetype][0];
  var headers = {
    'Content-Length': file.size,
    'Content-Type': file.mimetype,
    'x-amz-acl': 'public-read'
  };

  AWS.putBuffer(file.buffer, path, headers, function(err, response){
    if ( err || !response || response.statusCode !== 200 ) {
      console.error('error streaming image: ', err);
      deferred.reject({
        status: response ? response.statusCode : 500,
        error: err
      });
    } else {
      console.log('File uploaded! Amazon response statusCode: ', response.statusCode);
      deferred.resolve([type, entityId, path]);
    }
  });

  return deferred.promise;

}

function deleteFile(url) {
  var deferred = when.defer();
  var path = url.match(/\/\/[^\/]+(\/[^\.]+)/)[1];

  AWS.deleteFile(path, function(err, response) {
    if ( err || !response ) {
      console.log('Error deleting file:', err);
      deferred.reject({
        status: response ? response.statusCode : 500,
        body: err
      });
    } else {
      console.log('File deleted! Amazon response code: ', response.statusCode);
      deferred.resolve(response);
    }
  });

  return deferred.promise;
}

/* ====================================================== */

function updateEntity(data) {

  var mainDeferred = when.defer();
  var type = data[0];
  var id = data[1];
  var imagePath = data[2];
  var model = models[changeCase.pascal(type)];
  var originalImageUrl;

  var fetchItem = function(id) {
    var deferred = when.defer();

    model.find({
      where: { id: id }
    }).then(function(item) {
      if ( !_.isEmpty(item) ) {
        originalImageUrl = item.imageUrl || null;
        deferred.resolve(item);
    } else {
      deferred.reject({ status: 404, body: 'Entity could not be found at the ID: ' + id });
    }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var updateItem = function(item) {
    var deferred = when.defer();

    item.updateAttributes({
      imageUrl: 'http://assets.monolist.co' + imagePath
    }).then(function(updatedEntity) {
      deferred.resolve(updatedEntity);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var deleteOriginalImage = function(updatedEntity) {
    var deferred = when.defer();

    if ( !_.isEmpty(originalImageUrl) ) {
       deleteFile(originalImageUrl).then(function(updatedEntity) {
        deferred.resolve(updatedEntity);
       }).catch(function() {
        // Still resolve since entity was successfully updated
        deferred.resolve(updatedEntity);
      });
    } else {
      // No original image to delete
      deferred.resolve(updatedEntity);
    }

    return deferred.promise;
  };

  fetchItem(id).then(updateItem).then(deleteOriginalImage).then(function(updatedEntity) {
    mainDeferred.resolve(updatedEntity);
  }).catch(function(err) {
    mainDeferred.reject({ status: err.status, error: err.body });
  });

  return mainDeferred.promise;

}

/* ====================================================== */

/**
 * @api {post} /upload/:type/:id Upload
 * @apiName Upload
 * @apiGroup AWS
 *
 * @apiParam {File}   file Image file to be uploaded
 * @apiParam {String} type Entity type for which the image is being uploaded
 * @apiParam {String} id   ID of entity to be updated
 *
 * @apiSuccess {Object} Updated entity
 */
exports.upload = function(req, res) {

  req.pipe(req.busboy);

  req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    // If filename is not truthy it means there's no file
    if ( !filename ) {
      res.status(400).json({ error: 'No file' });
      return;
    }

    file.fileRead = [];

    file.on('data', function(chunk) {
      this.fileRead.push(chunk);
    });

    file.on('error', function(err) {
      console.log('Error while buffering the stream: ', err);
      res.status(500).json({ error: err });
    });

    file.on('end', function() {
      var finalBuffer = Buffer.concat(this.fileRead);
      var finalFile = {
        buffer: finalBuffer,
        size: finalBuffer.length,
        filename: filename,
        mimetype: mimetype
      };

      uploadToAWS(finalFile, req.params.type, req.params.id).then(updateEntity).then(function(updatedEntity) {
        ResponseHandler.handleSuccess(res, 200, updatedEntity);
      }).catch(function(err) {
        ResponseHandler.handleError(req, res, err.status, err.body);
      });
    });
  });

};

/* ====================================================== */

exports.delete = deleteFile;
