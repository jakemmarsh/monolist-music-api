'use strict';

var ActionTypes = {

  USER_ACTION_TYPES: [
    'follow'
  ],

  POST_ACTION_TYPES: [
    'create',
    'like',
    'addComment'
  ],

  PLAYLIST_ACTION_TYPES: [
    'create',
    'follow',
    'like',
    'addTrack',
    'addCollaborator',
    'removeCollaborator'
  ],

  TRACK_ACTION_TYPES: [
    'addComment',
    'upvote',
    'downvote'
  ],

  GROUP_ACTION_TYPES: [
    'addMember',
    'removeMember',
    'updateMemberLevel'
  ]

};

module.exports = ActionTypes;