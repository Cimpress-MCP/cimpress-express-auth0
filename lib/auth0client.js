var assert = require('assert-plus'),
  deprecate = require('depd')('belt'),
  P = require('bluebird');

var Auth0Client = function(auth0Endpoint) {

  if (!(this instanceof Auth0Client)) {
    return new Auth0Client(auth0Endpoint);
  }

  assert.func(auth0Endpoint, "auth0Endpoint");

  this.getProfile = function(accessToken) {
    var options = {
      uri: '/tokeninfo',
      method: 'POST',
      json: { id_token: accessToken }
    };

    return auth0Endpoint(options).then(function(response, err) {
      if (response.statusCode < 300) {
        return response.body;
      } else {
        return P.reject(response.body);
      }
    });
  };

  this.getClientGrant = function(clientId, clientSecret, audience) {
    var data = {
      client_id: clientId,
      client_secret: clientSecret,
      audience: audience,
      grant_type: 'client_credentials'
    };

    var auth0Options = {
      method: 'POST',
      json: data,
      headers: {
        'User-agent': 'node.js/' + process.version.replace('v', '')
      }
    };

    var success = function(response) {
      return response.body;
    };

    var failure = function(error) {
      return P.reject(error);
    };

    return auth0Endpoint(auth0Options).then(success).catch(failure);
  };

  this.getAccessToken = function(portal_id, client_id, refresh_token, currentSessionIdToken) {
    deprecate('getAccessToken: use getDelegationToken instead');
    return this.getDelegationToken(portal_id, client_id, refresh_token, currentSessionIdToken);
  };

  this.getDelegationToken = function(portal_id, client_id, refresh_token, currentSessionIdToken) {

    var data = {
      client_id: portal_id,
      target: client_id,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
    };

    // Use delegation/impersonation if the current session ID token was provided, use refresh token otherwise
    if (currentSessionIdToken) {
      data.api_type = 'api';
      data.id_token = currentSessionIdToken;
    } else {
      data.api_type = 'app';
      data.refresh_token = refresh_token;
    }

    var auth0Options = {
      uri: '/delegation',
      method: 'POST',
      json: data,
      headers: {
        'User-agent': 'node.js/' + process.version.replace('v', '')
      }
    };

    var success = function(response) {
      return response.body;
    };

    var failure = function(error) {
      return P.reject(error);
    };

    return auth0Endpoint(auth0Options).then(success).catch(failure);
  };

  this.getRoAccessToken = (client_id, username, password, connection, scope) => {
    var data = {
      client_id: client_id,
      username: username,
      password: password,
      connection: connection,
      scope: scope
    };

    var auth0Options = {
      uri: '/oauth/ro',
      method: 'POST',
      json: data,
      headers: {
        'User-agent': 'node.js/' + process.version.replace('v', '')
      }
    };

    var success = function(response) {
      return response.body;
    };

    var failure = function(error) {
      return P.reject(error);
    };

    return auth0Endpoint(auth0Options).then(success).catch(failure);
  };
};

module.exports = Auth0Client;
