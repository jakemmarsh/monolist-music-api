{% extends "../base.swig" %}

{% block title %}
  Reset Your Monolist Password
{% endblock %}

{% block content %}
  <h1>Forget your password, {{ user.username }}?</h1>
  Just click the link below in order to choose your new password.
  <br />
  <br />
  <a class="block" href="{{ resetUrl }}" target="_blank">Reset Password</a>
{% endblock %}