'use strict';

var when          = require('when');
var _             = require('lodash');
var models        = require('../models');
var Sequelize     = require('sequelize');
var notifications = require('../utils/notifications');

/* ====================================================== */

exports.get = function(req, res) {

  var fetchGroup = function(identifier) {
    var deferred = when.defer();
    var query = { id: identifier };

    if ( isNaN(parseInt(identifier)) ) {
      query = { slug: identifier };
    }

    models.Group.find({
      where: query,
      include: [
        {
          model: models.User,
          as: 'Owner'
        },
        {
          model: models.GroupMembership,
          as: 'Memberships'
        }
      ]
    }).then(function(group) {
      if ( _.isEmpty(group) ) {
        deferred.reject({ status: 404, body: 'Group could not be found at identifier: ' + identifier });
      } else {
        deferred.resolve(group);
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroup(req.params.identifier).then(function(group) {
    res.status(200).json(group);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getPlaylists = function(req, res) {

  var fetchPlaylists = function(groupId) {
    var deferred = when.defer();

    models.Playlist.findAll({
      where: {
        GroupId: groupId,
        ownerType: 'group'
      },
      include: [
        {
          model: models.Group
        }
      ]
    }).then(function(retrievedPlaylists) {
      deferred.resolve(retrievedPlaylists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchPlaylists(req.params.id).then(function(playlists) {
    res.status(200).json(playlists);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.getTrending = function(req, res) {

  var fetchGroups = function() {
    var deferred = when.defer();

    // TODO: real logic here to determine trending
    models.Group.findAll().then(function(groups) {
      deferred.resolve(groups);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroups().then(function(groups) {
    res.status(200).json(groups);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.update = function(req, res) {

  var fetchGroup = function(id, updates) {
    var deferred = when.defer();

    models.Group.find({
      where: { id: id }
    }).then(function(group) {
      if ( !_.isEmpty(group) ) {
        deferred.resolve([group, updates]);
      } else {
        deferred.reject({ status: 404, body: 'Group could not be found at the ID: ' + id });
      }
    });

    return deferred.promise;
  };

  var updateGroup = function(data) {
    var deferred = when.defer();
    var retrievedGroup = data[0];
    var updates = data[1];
    var sanitizedUpdates = {};

    if ( updates.title || updates.Title ) {
      sanitizedUpdates.title = updates.title || updates.Title;
    }

    if ( updates.description || updates.Description ) {
      sanitizedUpdates.description = updates.description || updates.Description;
    }

    retrievedGroup.updateAttributes(sanitizedUpdates).then(function(updatedUser) {
      deferred.resolve(updatedUser);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroup(req.params.id, req.body)
  .then(updateGroup)
  .then(function(updatedGroup) {
    res.status(200).json(updatedGroup);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.search = function(req, res) {

  var searchGroups = function(query) {
    var deferred = when.defer();

    models.Group.findAll({
      where: Sequelize.or(
        { title: { ilike: '%' + query + '%' } },
        Sequelize.or(
          { slug: { ilike: '%' + query + '%' } },
          { description: { ilike: '%' + query + '%' } }
        )
      ),
      include: [
        {
          model: models.User,
          as: 'Owner'
        },
        {
          model: models.GroupMembership,
          as: 'Memberships',
          attributes: ['id']
        }
      ]
    }).then(function(retrievedGroups) {
      deferred.resolve(retrievedGroups);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  searchGroups(req.params.query).then(function(groups) {
    res.status(200).json(groups);
  }).catch(function(err) {
    console.log('error searching groups:', err);
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.addMember = function(req, res) {

  var fetchGroup = function(groupId, actorId, memberId) {
    var deferred = when.defer();

    models.Group.find({
      where: { id: groupId }
    }).then(function(group) {
      if ( _.isEmpty(group) ) {
        deferred.reject({ status: 404, body: 'Group could not be found at ID: ' + groupId });
      } else if ( group.privacy !== 'public' && group.CreatorId !== actorId ) {
        deferred.reject({ status: 401, body: 'User does not have permission to add members to that group.' });
      } else {
        deferred.resolve([groupId, actorId, memberId]);
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var createMembership = function(data) {
    var deferred = when.defer();
    var groupId = data[0];
    var actorId = data[1];
    var memberId = data[2];
    var membership = {
      GroupId: groupId,
      UserId: memberId
    };

    models.GroupMembership.findOrCreate({
      where: membership,
      defaults: membership
    }).then(function(createdMembership) {
      if ( createdMembership.constructor === Array ) {
        createdMembership = createdMembership[0];
      }
      deferred.resolve(createdMembership);
    }).catch(function(err) {
      console.log('error creating membership:', err);
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroup(req.params.groupId, req.user.id, req.params.memberId)
  .then(createMembership)
  .then(function(createdMembership) {
    res.status(200).json(createdMembership);
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.removeMember = function(req, res) {

  var fetchGroup = function(groupId, actorId, memberId) {
    var deferred = when.defer();

    models.Group.find({
      where: { id: groupId }
    }).then(function(group) {
      if ( _.isEmpty(group) ) {
        deferred.reject({ status: 404, body: 'Group could not be found at ID: ' + groupId });
      } else if ( group.CreatorId !== actorId && actorId !== memberId ) {
        deferred.reject({ status: 401, body: 'User does not have permission to remove that member from the group.' });
      } else {
        deferred.resolve([groupId, actorId, memberId]);
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var destroyMembership = function(data) {
    var deferred = when.defer();
    var groupId = data[0];
    var actorId = data[1];
    var memberId = data[2];

    models.GroupMembership.destroy({
      where: {
        GroupId: groupId,
        UserId: memberId
      }
    }).then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroup(req.params.groupId, req.user.id, req.params.memberId)
  .then(destroyMembership)
  .then(function() {
    res.status(200).json({ status: 200, message: 'Member successfully removed from group.' });
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};

/* ====================================================== */

exports.delete = function(req, res) {

  var findAndEnsureUserCanDelete = function(currentUser, groupId) {
    var deferred = when.defer();

    models.Group.find({
      where: { id: groupId }
    }).then(function(group) {
      if ( currentUser.role !== 'admin' || group.OwnerId === currentUser.id ) {
        deferred.resolve(group);
      } else {
        deferred.reject({ status: 401, body: 'You do not have permission to delete that group.'});
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var deleteGroup = function(group) {
    var deferred = when.defer();

    group.destroy().then(function() {
      deferred.resolve();
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  findAndEnsureUserCanDelete(req.user, req.params.id)
  .then(deleteGroup)
  .then(function() {
    res.status(200).json({ status: 200, message: 'Group successfully deleted.' });
  }).catch(function(err) {
    res.status(err.status).json({ status: err.status, message: err.body.toString() });
  });

};