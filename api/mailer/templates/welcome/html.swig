{% extends "../base.swig" %}

{% block title %}
  Welcome to Monolist!
{% endblock %}

{% block content %}
  <h1>Welcome to Monolist, {{ user.username }}!</h1>
  <h3>Get ready to create, share, and discover</h3>
  Now that you're registered for Monolist, you're ready to begin creating and collaborating!
  <br />
  Here are just some of the features that Monolist offers:
{% endblock %}

{% block columns %}
  <tr>
    <td align="center" valign="top">
      <!-- BEGIN COLUMNS // -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateColumns">
        <tr mc:repeatable>
          <td align="center" valign="top" class="templateColumnContainer">
            <table border="0" cellpadding="20" cellspacing="0" width="100%">
              <tr>
                <td class="leftColumnContent">
                  <img src="http://monolist.co/images/email/music-icon.png" style="max-width:160px;" class="columnImage" mc:label="left_column_image" mc:edit="left_column_image" />
                </td>
              </tr>
              <tr>
                <td valign="top" class="leftColumnContent" mc:edit="left_column_content">
                  <h3>Your favorite sources</h3>
                  Tracks can be chosen and played from three of the biggest sources: YouTube, Soundcloud, and Bandcamp. This means you'll always be able to find that perfect track you're looking for to add to your new playlist.
                </td>
              </tr>
            </table>
          </td>
          <td align="center" valign="top" class="templateColumnContainer">
            <table border="0" cellpadding="20" cellspacing="0" width="100%">
              <tr>
                <td class="centerColumnContent">
                  <img src="http://monolist.co/images/email/users-icon.png" style="max-width:160px;" class="columnImage" mc:label="center_column_image" mc:edit="center_column_image" />
                </td>
              </tr>
              <tr>
                <td valign="top" class="centerColumnContent" mc:edit="center_column_content">
                  <h3>Groups</h3>
                  Beyond single-playlist collaboration, it is also possible to create groups for you and all of your friends. This allows free collaboration among all members on playlists created within the group, and also provides a location to privately share and discuss new tracks.
                </td>
              </tr>
            </table>
          </td>
          <td align="center" valign="top" class="templateColumnContainer">
            <table border="0" cellpadding="20" cellspacing="0" width="100%">
              <tr>
                <td class="rightColumnContent">
                  <img src="http://monolist.co/images/email/compass-icon.png" style="max-width:160px;" class="columnImage" mc:label="right_column_image" mc:edit="right_column_image" />
                </td>
              </tr>
              <tr>
                <td valign="top" class="rightColumnContent" mc:edit="right_column_content">
                  <h3>Exploration</h3>
                  Between collaboration, the easy-to-use tag system, and track sharing both globally and within your groups, discovering new music has never been easier. Always find the perfect track or playlist for the moment.
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