{% extends "../base.swig" %}

{% block title %}
  Welcome to Monolist!
{% endblock %}

{% block content %}
  <h1>Welcome to Monolist, {{ user.username }}!</h1>
  <h3>Get ready to create, share, and discover</h3>
  Now that you're registered for Monolist, you can easily sign in using the link below and begin creating and collaborating! Here are just some of the features that Monolist offers:
  <br />
  <br />
  <a class="block" href="https://www.monolist.co/login" target="_blank">Get started</a>
{% endblock %}

{% block columns %}
  <tr>
    <td align="center" valign="top">
      <!-- BEGIN COLUMNS // -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateColumns">
        <tr mc:repeatable>
          <td align="center" valign="top" class="templateColumnContainer" style="padding-top:20px;">
            <table border="0" cellpadding="20" cellspacing="0" width="100%">
              <tr>
                <td class="leftColumnContent">
                  <img src="http://assets.monolist.co/images/email/users-icon.png" style="max-width:160px;" class="columnImage" mc:label="left_column_image" mc:edit="left_column_image" />
                </td>
              </tr>
              <tr>
                <td valign="top" class="leftColumnContent" mc:edit="left_column_content">
                  <h3>Create playlists collaboratively</h3>
                  Once a playlist is created, the creator has the option of adding other users as 'collaborators'. All collaborators have the ability to add and remove tracks from the playlist, as well as provide feedback on tracks added by other collaborators through per-track upvotes, downvotes, and comments.
                </td>
              </tr>
            </table>
          </td>
          <td align="center" valign="top" class="templateColumnContainer" style="padding-top:20px;">
            <table border="0" cellpadding="20" cellspacing="0" width="100%">
              <tr>
                <td class="centerColumnContent">
                  <img src="http://assets.monolist.co/images/email/add-icon.png" style="max-width:160px;" class="columnImage" mc:label="center_column_image" mc:edit="center_column_image" />
                </td>
              </tr>
              <tr>
                <td valign="top" class="centerColumnContent" mc:edit="center_column_content">
                  <h3>Choose songs from multiple sources</h3>
                  When searching for songs and adding them to your playlists, you have multiple sources to choose from including YouTube, Soundcloud, and Bandcamp. This nearly guarantees that you'll be able to find any song that you have in mind!
                </td>
              </tr>
            </table>
          </td>
          <td align="center" valign="top" class="templateColumnContainer" style="padding-top:20px;">
            <table border="0" cellpadding="20" cellspacing="0" width="100%">
              <tr>
                <td class="rightColumnContent">
                  <img src="http://assets.monolist.co/images/email/compass-icon.png" style="max-width:160px;" class="columnImage" mc:label="right_column_image" mc:edit="right_column_image" />
                </td>
              </tr>
              <tr>
                <td valign="top" class="rightColumnContent" mc:edit="right_column_content">
                  <h3>Discover new playlists and songs</h3>
                  At any time, you can search for new playlists by title or related tags. You can also view playlists that are 'Trending' to see what's popular right now.
                  <br />
                  You can also choose to 'Follow' both playlists and users, as well as 'Star' tracks. This allows you to remember those playlists and tracks that you liked, as well as get future updates on them!
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!-- // END COLUMNS -->
    </td>
  </tr>
{% endblock %}