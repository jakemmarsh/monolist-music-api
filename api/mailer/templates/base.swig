<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>
      {% block title %}
        Monolist
      {% endblock %}
    </title>
  </head>
  <body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">
    <center>
      <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
        <tr>
          <td align="center" valign="top" id="bodyCell">
            <!-- BEGIN TEMPLATE // -->
            <table border="0" cellpadding="0" cellspacing="0" id="templateContainer">
              <tr>
                <td align="center" valign="top">
                  <!-- BEGIN HEADER // -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateHeader">
                      <tr>
                        <td valign="top" class="headerContent">
                          <img src="http://assets.monolist.co/images/logo.png" id="headerImage" />
                        </td>
                      </tr>
                  </table>
                  <!-- // END HEADER -->
                </td>
              </tr>
              <tr>
                <td align="center" valign="top">
                  <!-- BEGIN BODY // -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateBody">
                      <tr>
                        <td valign="top" class="bodyContent">
                          {% block content %}{% endblock %}
                        </td>
                      </tr>
                  </table>
                  <!-- // END BODY -->
                </td>
              </tr>
              {% block columns %}{% endblock %}
              <tr>
                <td align="center" valign="top">
                  <!-- BEGIN FOOTER // -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateFooter">
                    <tr>
                      <td valign="top" class="footerContent">
                        <em>Copyright &copy; 2014-2015 Monolist, All rights reserved.</em>
                      </td>
                    </tr>
                  </table>
                  <!-- // END FOOTER -->
                </td>
              </tr>
            </table>
            <!-- // END TEMPLATE -->
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>