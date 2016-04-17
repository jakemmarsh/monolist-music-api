'use strict';

var when            = require('when');
var _               = require('lodash');
var models          = require('../models');
var Sequelize       = require('sequelize');
var ActivityManager = require('../utils/ActivityManager');
var ResponseHandler = require('../utils/ResponseHandler');

/* ====================================================== */

/**
 * @api {get} /group/:identifier GetGroup
 * @apiName GetGroup
 * @apiGroup Group
 *
 * @apiParam {String} identifier ID or slug to retrieve group for
 *
 * @apiSuccess {Object} Retrieved group object
 */
exports.get = function(req, res) {

  var fetchGroup = function(identifier) {
    var deferred = when.defer();
    var query;

    if ( isFinite(identifier) ) {
      query = { id: identifier };
    } else {
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
          as: 'Memberships',
          include: [
            {
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
            }
          ]
        },
        {
          model: models.GroupFollow,
          as: 'Followers'
        }
      ]
    }).then(function(group) {
      if ( _.isEmpty(group) ) {
        deferred.reject({ status: 404, body: 'Group could not be found at identifier: ' + identifier });
      } else {
        group = group.toJSON();
        delete group.OwnerId;
        group.members = _.filter(_.pluck(group.Memberships, 'User'));
        deferred.resolve(group);
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroup(req.params.identifier).then(function(group) {
    ResponseHandler.handleSuccess(res, 200, group);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

exports.create = function(req, res) {

  var checkTitle = function(group, currentUser) {
    var deferred = when.defer();
    var title = group.title || group.Title;

    models.Group.find({
      where: { title: title }
    }).then(function(retrievedGroup) {
      if ( !_.isEmpty(retrievedGroup) ) {
        deferred.reject({ status: 400, body: 'That name is already taken.' });
      } else {
        deferred.resolve([group, currentUser]);
      }
    });

    return deferred.promise;
  };

  var createGroup = function(data) {
    var deferred = when.defer();
    var group = data[0];
    var currentUser = data[1];

    group = {
      OwnerId: currentUser.id,
      title: group.title || group.Title,
      description: group.description || group.Description,
      tags: group.tags || group.Tags,
      privacy: group.privacy || group.Privacy,
      inviteLevel: group.inviteLevel || group.InviteLevel,
    };

    models.Group.create(group).then(function(savedGroup) {
      savedGroup = savedGroup.toJSON();
      savedGroup.owner = currentUser;
      deferred.resolve([savedGroup, currentUser]);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var createMembership = function(data) {
    var deferred = when.defer();
    var group = data[0];
    var currentUser = data[1];
    var membership = {
      GroupId: group.id,
      UserId: currentUser.id,
      level: 3 // Owner level
    };

    models.GroupMembership.create(membership).then(function() {
      deferred.resolve(group);
    }).catch(function() {
      // Still resolve since group was already created
      deferred.resolve(group);
    });

    return deferred.promise;
  };

  checkTitle(req.body, req.user)
  .then(createGroup)
  .then(createMembership)
  .then(function(resp) {
    ResponseHandler.handleSuccess(res, 200, resp);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {get} /group/:id/playlists GetGroupPlaylists
 * @apiName GetGroupPlaylists
 * @apiGroup Group
 *
 * @apiParam {Number} id Group ID to retrieve playlists for
 *
 * @apiSuccess {Object[]} Playlists retrieved for group
 */
exports.getPlaylists = function(req, res) {

  var fetchPlaylists = function(groupId, limit, offset) {
    var deferred = when.defer();

    limit = ( limit && limit < 50 ) ? limit : 20;
    offset = offset || 0;

    models.Playlist.findAll({
      where: {
        ownerId: groupId,
        ownerType: 'group'
      },
      limit: limit,
      offset: offset
    }).then(function(retrievedPlaylists) {
      deferred.resolve(retrievedPlaylists);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchPlaylists(req.params.id, req.query.limit, req.query.offset).then(function(playlists) {
    ResponseHandler.handleSuccess(res, 200, playlists);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {get} /groups/trending GetTrendingGroups
 * @apiName GetTrendingGroups
 * @apiGroup Group
 *
 * @apiSuccess {Object[]} Retrieved trending groups
 */
exports.getTrending = function(req, res) {

  var getMemberships = function() {
    var deferred = when.defer();

    models.GroupMembership.findAll({
      attributes: ['GroupId'],
      order: [['createdAt', 'DESC']],
      limit: 1000
    }).then(function(memberships) {
      deferred.resolve(memberships);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var getFollows = function(memberships) {
    var deferred = when.defer();

    models.GroupFollow.findAll({
      attributes: ['GroupId'],
      order: [['createdAt', 'DESC']],
      limit: 1000
    }).then(function(follows) {
      deferred.resolve([memberships, follows]);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var process = function(data) {
    var deferred = when.defer();
    var memberships = _.countBy(data[0], function(membership) { return membership.GroupId; });
    var follows = _.countBy(data[1], function(follow) { return follow.GroupId; });
    var merged = _.merge(memberships, follows, function(a, b) { return a + b; });
    var formatted = [];
    var limit = ( req.query.limit && req.query.limit < 50 ) ? req.query.limit : 30;
    var results;

    _.forOwn(merged, function(num, key) {
      formatted.push({
        GroupId: parseInt(key),
        NumInteractions: num
      });
    });

    results = _.sortBy(formatted, function(item) { return -item.NumInteractions; }).slice(0, limit);

    deferred.resolve(_.pluck(results, 'GroupId'));

    return deferred.promise;
  };

  var getGroups = function(groupIds) {
    var deferred = when.defer();
    var limit = ( req.query.limit && req.query.limit < 50 ) ? req.query.limit : 30;

    models.Group.findAll({
      where: {
        id: groupIds,
        privacy: 'public'
      },
      limit: limit,
      include: [{
        model: models.GroupMembership,
        as: 'Memberships'
      }]
    }).then(function(groups) {
      deferred.resolve(groups);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getMemberships()
  .then(getFollows)
  .then(process)
  .then(getGroups)
  .then(function(groups) {
    ResponseHandler.handleSuccess(res, 200, groups);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {get} /groups/newest GetNewestGroups
 * @apiName GetNewestGroups
 * @apiGroup Group
 *
 * @apiSuccess {Object[]} Retrieved newest groups
 */
exports.getNewest = function(req, res) {

  var getGroups = function(limit) {
    var deferred = when.defer();

    limit = ( limit && limit < 50 ) ? limit : 30;

    models.Group.findAll({
      where: { privacy: 'public' },
      limit: limit,
      include: [{
        model: models.GroupMembership,
        as: 'Memberships'
      }]
    }).then(function(groups) {
      deferred.resolve(groups);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  getGroups(req.query.limit).then(function(groups) {
    ResponseHandler.handleSuccess(res, 200, groups);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {patch} /group/:id UpdateGroup
 * @apiName UpdateGroup
 * @apiGroup Group
 *
 * @apiParam {Number}   id            ID for group to update
 * @apiParam {String}   [title]       New group title
 * @apiParam {String}   [description] New group description
 * @apiParam {String}   [privacy]     New group privacy
 * @apiParam {String[]} [tags]        New group tags
 * @apiParam {Number}   [inviteLevel] New group inviteLevel
 *
 * @apiSuccess {Object} Updated group object
 */
exports.update = function(req, res) {

  var fetchGroup = function(id, updates) {
    var deferred = when.defer();

    models.Group.find({
      where: { id: id },
      include: [
        {
          model: models.User,
          as: 'Owner'
        },
        {
          model: models.GroupMembership,
          as: 'Memberships',
          include: [
            {
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
            }
          ]
        },
        {
          model: models.GroupFollow,
          as: 'Followers'
        }
      ]
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

    if ( updates.privacy || updates.Privacy ) {
      sanitizedUpdates.privacy = updates.privacy || updates.Privacy;
    }

    if ( updates.tags || updates.Tags ) {
      sanitizedUpdates.tags = updates.tags || updates.Tags;
    }

    if ( updates.inviteLevel || updates.InviteLevel ) {
      sanitizedUpdates.inviteLevel = updates.inviteLevel || updates.InviteLevel;
    }

    retrievedGroup.updateAttributes(sanitizedUpdates).then(function() {
      deferred.resolve(_.assign(retrievedGroup, sanitizedUpdates));
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchGroup(req.params.id, req.body)
  .then(updateGroup)
  .then(function(updatedGroup) {
    ResponseHandler.handleSuccess(res, 200, updatedGroup);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {get} /groups/search/:query SearchGroups
 * @apiName SearchGroups
 * @apiGroup Group
 *
 * @apiParam {String} query Search query
 *
 * @apiSuccess {Object[]} Retrieved groups matching query
 */
exports.search = function(req, res) {

  var searchGroups = function(query) {
    var deferred = when.defer();

    models.Group.findAll({
      where: Sequelize.or(
        { title: { ilike: '%' + query + '%' } },
        Sequelize.or(
          { tags: { ilike: '%' + query + '%' } },
          Sequelize.or(
            { slug: { ilike: '%' + query + '%' } },
            { description: { ilike: '%' + query + '%' } }
          )
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
          include: [
            {
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
            }
          ]
        }
      ]
    }).then(function(retrievedGroups) {
      retrievedGroups = _.map(retrievedGroups, function(group) {
        group = group.toJSON();
        delete group.OwnerId;
        group.members = _.pluck(group.Memberships, 'User');
        delete group.Memberships;
        return group;
      });
      deferred.resolve(retrievedGroups);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  searchGroups(req.params.query).then(function(groups) {
    ResponseHandler.handleSuccess(res, 200, groups);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {get} /group/:id/posts GetGroupPosts
 * @apiName GetGroupPosts
 * @apiGroup Group
 *
 * @apiParam {Number} id ID for group to retrieve posts for
 *
 * @apiSuccess {Object[]} Retrieved posts for group
 */
exports.getPosts = function(req, res) {

  var fetchPosts = function(groupId, limit, offset) {
    var deferred = when.defer();

    limit = ( limit && limit < 50 ) ? limit : 20;
    offset = offset || 0;

    models.Post.findAll({
      where: { GroupId: groupId },
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: models.User,
          attributes: ['id', 'username', 'imageUrl']
        },
        {
          model: models.PostLike,
          as: 'Likes',
          include: [{
              model: models.User,
              attributes: ['id', 'username', 'imageUrl']
          }]
        },
        {
          model: models.PostComment,
          as: 'Comments',
          order: [['createdAt', 'DESC']],
          include: [{
            model: models.User,
            attributes: ['id', 'username', 'imageUrl']
          }]
        }
      ]
    }).then(function(posts) {
      posts = _.map(posts, function(post) {
        post = post.toJSON();
        delete post.UserId;
        return post;
      });
      deferred.resolve(posts);
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchPosts(req.params.id, req.query.limit, req.query.offset).then(function(posts) {
    ResponseHandler.handleSuccess(res, 200, posts);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {post} /group/:id/follow FollowGroup
 * @apiName FollowGroup
 * @apiGroup Group
 *
 * @apiParam {Number} id ID for group to follow or unfollow
 *
 * @apiSuccess {String} Success message for follow or unfollow
 */
exports.follow = function(req, res) {

  var followGroup = function(currentUserId, groupId) {
    var deferred = when.defer();
    var attributes = {
      FollowerId: currentUserId,
      GroupId: groupId
    };

    models.GroupFollow.find({
      where: attributes
    }).then(function(retrievedFollowing) {
      if ( _.isEmpty(retrievedFollowing) ) {
        models.GroupFollow.create(attributes).then(function() {
          deferred.resolve('Successfully followed group.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      } else {
        retrievedFollowing.destroy().then(function() {
          deferred.resolve('Following successfully removed.');
        }).catch(function(err) {
          deferred.reject({ status: 500, body: err });
        });
      }
    });

    return deferred.promise;
  };

  followGroup(req.user.id, req.params.id).then(function(resp) {
    ResponseHandler.handleSuccess(res, 200, resp);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {post} /group/:id/member/:memberId AddMember
 * @apiName AddMember
 * @apiGroup Group
 *
 * @apiParam {Number} id       ID for group
 * @apiParam {Number} memberId ID for user to add as a member
 *
 * @apiSuccess {Object} Created Membership object
 */
exports.addMember = function(req, res) {

  var fetchGroup = function(groupId, actorId, memberId) {
    var deferred = when.defer();

    models.Group.find({
      where: { id: groupId }
    }).then(function(group) {
      if ( _.isEmpty(group) ) {
        deferred.reject({ status: 404, body: 'Group could not be found at ID: ' + groupId });
      } else {
        deferred.resolve([group, actorId, memberId]);
      }
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var getCurrentUserLevel = function(data) {
    var deferred = when.defer();
    var group = data[0];
    var actorId = data[1];
    var memberId = data[2];

    models.GroupMembership.find({
      where: {
        GroupId: group.id,
        UserId: req.user.id
      }
    }).then(function(retrievedMembership) {
      if ( group.privacy === 'public' ) {
        deferred.resolve([group.id, actorId, memberId]);
      } else if ( group.inviteLevel > retrievedMembership.level ) {
        deferred.reject({ status: 401, body: 'User does not have permission to add members to that group.' });
      }
    });

    return deferred.promise;
  };

  var createMembership = function(data) {
    var deferred = when.defer();
    var groupId = data[0];
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
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var deleteFollow = function(membership) {
    var deferred = when.defer();

    models.GroupFollow.find({
      where: {
        FollowerId: membership.UserId,
        GroupId: membership.GroupId
      }
    }).then(function(follow) {
      if ( !_.isEmpty(follow) ) {
        follow.destroy().then(function() {
          deferred.resolve(membership);
        });
      } else {
        deferred.resolve(membership);
      }
    }).catch(function() {
      // Still resolve since member was added
      deferred.resolve(membership);
    });

    return deferred.promise;
  };

  fetchGroup(req.params.groupId, req.user.id, req.params.memberId)
  .then(getCurrentUserLevel)
  .then(createMembership)
  .then(deleteFollow)
  .then(ActivityManager.queue.bind(null, 'group', req.params.groupId, 'addMember', req.user.id, req.params.memberId))
  .then(function(createdMembership) {
    ResponseHandler.handleSuccess(res, 200, createdMembership);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {delete} /group/:id/member/:memberId RemoveMember
 * @apiName RemoveMember
 * @apiGroup Group
 *
 * @apiParam {Number} id       ID for group
 * @apiParam {Number} memberId ID for user to remove as a member
 *
 * @apiSuccess {String} Success message for member removal
 */
exports.removeMember = function(req, res) {

  // TODO: better checking to let admins remove members

  var fetchGroup = function(groupId, actorId, memberId) {
    var deferred = when.defer();

    actorId = parseInt(actorId);
    memberId = parseInt(memberId);

    models.Group.find({
      where: { id: groupId }
    }).then(function(group) {
      if ( _.isEmpty(group) ) {
        deferred.reject({ status: 404, body: 'Group could not be found at ID: ' + groupId });
      } else if ( parseInt(group.OwnerId) !== actorId && actorId !== memberId ) {
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
  .then(ActivityManager.queue.bind(null, 'group', req.params.groupId, 'removeMember', req.user.id, req.params.memberId))
  .then(function() {
    ResponseHandler.handleSuccess(res, 200, 'Member successfully removed from group.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {post} /group/:id/member/:memberId/level/:newLevel UpdateMemberLevel
 * @apiName UpdateMemberLevel
 * @apiGroup Group
 *
 * @apiParam {Number} id       ID for group to follow or unfollow
 * @apiParam {Number} memberId ID for user to modify membership level
 * @apiParam {Number} newLevel New level (1-3) for member
 *
 * @apiSuccess {Object} Updated Membership object
 */
exports.updateMemberLevel = function(req, res) {

  var getCurrentUserLevel = function(groupId, memberId, newLevel) {
    var deferred = when.defer();

    models.GroupMembership.find({
      where: {
        GroupId: groupId,
        UserId: req.user.id
      }
    }).then(function(retrievedMembership) {
      if ( !_.isEmpty(retrievedMembership) ) {
        deferred.resolve([groupId, memberId, newLevel, retrievedMembership.level]);
      } else {
        deferred.reject({ status: 401, body: 'Current user is not a member of that group.' });
      }
    });

    return deferred.promise;
  };

  var fetchMembership = function(data) {
    var deferred = when.defer();
    var groupId = data[0];
    var memberId = data[1];
    var newLevel = data[2];
    var currentUserLevel = data[3];

    if ( newLevel > currentUserLevel ) {
      deferred.reject({ status: 403, body: 'User cannot promote members above themselves.' });
    } else {
      models.GroupMembership.find({
        where: {
          GroupId: groupId,
          UserId: memberId
        }
      }).then(function(retrievedMembership) {
        if ( !_.isEmpty(retrievedMembership) ) {
          deferred.resolve([retrievedMembership, newLevel, currentUserLevel]);
        } else {
          deferred.reject({ status: 404, body: 'Membership could not be found at the IDs: ' + groupId + ', ' + memberId });
        }
      });
    }

    return deferred.promise;
  };

  var updateMembership = function(data) {
    var deferred = when.defer();
    var membership = data[0];
    var newLevel = data[1];
    var currentUserLevel = data[2];
    var updates = { level: newLevel };

    if ( newLevel < membership.level && currentUserLevel <= membership.level ) {
      deferred.reject({ status: 403, body: 'Users cannot demote members above themselves.' });
    } else {
      membership.updateAttributes(updates).then(function(updatedMembership) {
        deferred.resolve(updatedMembership);
      }).catch(function(err) {
        deferred.reject({ status: 500, body: err });
      });
    }

    return deferred.promise;
  };

  getCurrentUserLevel(req.params.groupId, req.params.memberId, req.params.newLevel)
  .then(fetchMembership)
  .then(updateMembership)
  .then(ActivityManager.queue.bind(null, 'group', req.params.groupId, 'updateMemberLevel', req.user.id))
  .then(function(updatedMembership) {
    ResponseHandler.handleSuccess(res, 200, updatedMembership);
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};

/* ====================================================== */

/**
 * @api {delete} /group/:id/member/:memberId/level/:newLevel DeleteGroup
 * @apiName DeleteGroup
 * @apiGroup Group
 *
 * @apiParam {Number} id       ID for group to follow or unfollow
 * @apiParam {Number} memberId ID for user to modify membership level
 * @apiParam {Number} newLevel New level (1-3) for member
 *
 * @apiSuccess {Object} Updated Membership object
 */
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
    ResponseHandler.handleSuccess(res, 200, 'Group successfully deleted.');
  }).catch(function(err) {
    ResponseHandler.handleError(req, res, err.status, err.body);
  });

};
