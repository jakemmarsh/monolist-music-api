'use strict';

module.exports = {

  users: [
    {
      username: 'jakemmarsh',
      email: 'jakemmarsh@gmail.com',
      facebookId: '621883172',
      hash: 'pass',
      role: 'admin',
      passwordResetKey: 'abcdefg'
    },
    {
      username: 'test',
      email: 'test@gmail.com',
      hash: 'test',
      passwordResetKey: 'abcdefg'
    },
    {
      username: 'testTwo',
      email: 'testTwo@gmail.com',
      hash: 'test',
      passwordResetKey: 'abcdefg'
    },
  ],

  userFollows: [
    {
      UserId: 1,
      FollowerId: 2
    }
  ],

  playlists: [
    {
      ownerId: 1,
      ownerType: 'user',
      title: 'Test Playlist',
      privacy: 'public',
      tags: ['test', 'hip hop', 'rap'],
      imageUrl: 'http://franthony.com/wp-content/uploads/2015/04/record-player.jpg'
    },
    {
      ownerId: 1,
      ownerType: 'user',
      title: 'Second Playlist That Is Private',
      privacy: 'private'
    }
  ],

  collaborations: [
    {
      PlaylistId: 1,
      UserId: 2
    }
  ],

  playlistFollows: [],

  playlistLikes: [
    {
      UserId: 1,
      PlaylistId: 1
    },
    {
      UserId: 2,
      PlaylistId: 1
    },
    {
      UserId: 1,
      PlaylistId: 2
    }
  ],

  playlistPlays: [
    {
      UserId: 1,
      PlaylistId: 1
    },
    {
      UserId: 2,
      PlaylistId: 1
    },
    {
      UserId: 2,
      PlaylistId: 2
    }
  ],

  tracks: [
    {
      title: 'West Coast',
      artist: 'Coconut Records',
      duration: 237,
      source: 'youtube',
      sourceParam: 'iR654dhhZNs',
      sourceUrl: 'http://youtube.com/watch?v=iR654dhhZNs',
      imageUrl: 'https://i.ytimg.com/vi/iR654dhhZNs/hqdefault.jpg',
      PlaylistId: 1,
      UserId: 1
    },
    {
      imageUrl: 'https://i1.sndcdn.com/artworks-000086001473-mw7dye-large.jpg',
      PlaylistId: 1,
      UserId: 1,
      source: 'soundcloud',
      sourceParam: '159945668',
      sourceUrl: 'http://soundcloud.com/rustie/attak-feat-danny-brown',
      title: 'Attak (feat. Danny Brown)',
      duration: 181
    },
    {
      PlaylistId: 1,
      UserId: 1,
      source: 'soundcloud',
      title: 'Mura Masa - Miss You (Taken from "Summer In Jakarta" Free DLL in description)',
      artist: 'Jakarta Records',
      imageUrl: 'https://i1.sndcdn.com/artworks-000085988304-2krh0z-large.jpg',
      duration: 246.566,
      sourceParam: '159925639',
      sourceUrl: 'https://soundcloud.com/jakarta-records/mura-masa-miss-you-taken-from-summer-in-jakarta'
    },
    {
      title: 'Daughter - Youth',
      artist: null,
      duration: 255,
      source: 'youtube',
      sourceParam: 'lgcg8ZFzfn0',
      sourceUrl: 'http://youtube.com/watch?v=lgcg8ZFzfn0',
      imageUrl: 'https://i.ytimg.com/vi/lgcg8ZFzfn0/hqdefault.jpg',
      PlaylistId: 1,
      UserId: 1
    }
  ],

  groups: [
    {
      OwnerId: 1,
      title: 'Test Group',
      description: 'This is a group for anyone since it is just for testing.',
      tags: ['test', 'hip hop', 'rap'],
      imageUrl: 'https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xap1/v/t1.0-9/10375152_10153451820467673_5915045047010730686_n.jpg?oh=3eec477b3d0925b8f39802bbb68c3789&oe=565AA6AE',
      inviteLevel: 1
    },
    {
      OwnerId: 2,
      title: 'Test Group Two',
      description: 'This is another group for anyone since it is just for testing.',
      tags: ['#hash'],
      imageUrl: 'https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xap1/v/t1.0-9/10375152_10153451820467673_5915045047010730686_n.jpg?oh=3eec477b3d0925b8f39802bbb68c3789&oe=565AA6AE',
      inviteLevel: 2
    }
  ],

  groupMemberships: [
    {
      GroupId: 1,
      UserId: 2,
      level: 1
    },
    {
      GroupId: 2,
      UserId: 3,
      level: 2
    },
    {
      GroupId: 1,
      UserId: 1,
      level: 3
    }
  ],

  groupFollows: [],

  groupPlaylists: [
    {
      ownerId: 1,
      ownerType: 'group',
      title: 'Test Group Playlist',
      privacy: 'public',
      tags: ['group', '#hash', 'playlist'],
      imageUrl: 'http://franthony.com/wp-content/uploads/2015/04/record-player.jpg'
    }
  ],

  posts: [
    {
      UserId: 1,
      GroupId: 1,
      body: 'This is a post without a track.',
      track: null
    },
    {
      UserId: 2,
      body: 'This is a post with a track.',
      track: {
        imageUrl: 'https://i1.sndcdn.com/artworks-000086001473-mw7dye-large.jpg',
        PlaylistId: 1,
        UserId: 1,
        source: 'soundcloud',
        sourceParam: '159945668',
        sourceUrl: 'http://soundcloud.com/rustie/attak-feat-danny-brown',
        title: 'Attak (feat. Danny Brown)',
        duration: 181
      }
    }
  ],

  playlistSearches: [
    {
      query: 'test',
      UserId: 1,
      resultIds: [1, 2]
    }
  ],

  trackSearches: [
    {
      query: 'test',
      UserId: 1,
      results: [
        {
          imageUrl: 'https://i1.sndcdn.com/artworks-000086001473-mw7dye-large.jpg',
          PlaylistId: 1,
          UserId: 1,
          source: 'soundcloud',
          sourceParam: '159945668',
          sourceUrl: 'http://soundcloud.com/rustie/attak-feat-danny-brown',
          title: 'Attak (feat. Danny Brown)',
          duration: 181
        }
      ]
    }
  ],

  postComments: [
    {
      PostId: 1,
      UserId: 1,
      body: 'this is a post comment'
    }
  ],

  notifications: [
    {
      entityType: 'playlist',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'like'
    },
    {
      entityType: 'playlist',
      entityId: 2,
      RecipientId: 1,
      ActorId: 2,
      action: 'create'
    },
    {
      entityType: 'playlist',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'follow'
    },
    {
      entityType: 'playlist',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'addTrack'
    },
    {
      entityType: 'playlist',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'addCollaborator'
    },
    {
      entityType: 'playlist',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'removeCollaborator'
    },
    // {
    //   entityType: 'track',
    //   entityId: 1,
    //   RecipientId: 1,
    //   ActorId: 2,
    //   action: 'addComment'
    // },
    // {
    //   entityType: 'track',
    //   entityId: 1,
    //   RecipientId: 1,
    //   ActorId: 2,
    //   action: 'upvote'
    // },
    // {
    //   entityType: 'track',
    //   entityId: 1,
    //   RecipientId: 1,
    //   ActorId: 2,
    //   action: 'downvote'
    // },
    {
      entityType: 'group',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'addMember'
    },
    {
      entityType: 'group',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'removeMember'
    },
    {
      entityType: 'group',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'updateMemberLevel'
    },
    {
      entityType: 'user',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'follow'
    },
    {
      entityType: 'post',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'create'
    },
    {
      entityType: 'post',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'like'
    },
    {
      entityType: 'post',
      entityId: 1,
      RecipientId: 1,
      ActorId: 2,
      action: 'addComment'
    }
  ]

};
