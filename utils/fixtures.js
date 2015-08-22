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
      imageUrl: 'https://i1.sndcdn.com/artworks-000086001473-mw7dye-large.jpg',
      PlaylistId: 1,
      UserId: 1,
      source: 'soundcloud',
      sourceParam: '159945668',
      sourceUrl: 'http://soundcloud.com/rustie/attak-feat-danny-brown',
      title: 'Attak (feat. Danny Brown)',
      duration: 181
    }
  ],

  groups: [
    {
      OwnerId: 1,
      title: 'Test Group',
      description: 'This is a group for anyone since it is just for testing.',
      imageUrl: 'https://scontent-sjc2-1.xx.fbcdn.net/hphotos-xap1/v/t1.0-9/10375152_10153451820467673_5915045047010730686_n.jpg?oh=3eec477b3d0925b8f39802bbb68c3789&oe=565AA6AE',
      inviteLevel: 1
    },
    {
      OwnerId: 2,
      title: 'Test Group Two',
      description: 'This is another group for anyone since it is just for testing.',
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
      tags: ['test', 'hip hop', 'rap'],
      imageUrl: 'http://franthony.com/wp-content/uploads/2015/04/record-player.jpg'
    }
  ],

  posts: [
    {
      UserId: 1,
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
  ]

};