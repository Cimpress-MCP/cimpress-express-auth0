var expect = require('chai').expect,
  Auth0Client = require('../lib/auth0client.js');

describe('Auth0 Client', function () {

  describe('Get Profile', function () {

    var profile = { token: "this is my profile" },
      endpoint = function () {
        return Promise.resolve({
          statusCode: 200,
          body: profile
        });
      },
      auth0Client = new Auth0Client(endpoint);

    auth0Client.auth0Endpoint = function (options) {
      if (options.uri !== '/tokeninfo') {
        return Promise.reject('Wrong location');
      }
      return Promise.resolve({ statusCode: 200, body: profile });
    };

    it('should get the requested profile', function () {
      return auth0Client.getProfile('this is my access token').then(function (retProfile) {
        expect(retProfile).to.equal(profile);
      });
    });
  });

  describe('Get Access Token', function () {

    var capturedOptions;

    var token = { token: "this is my profile" },
      endpoint = function (options) {
        capturedOptions = options;
        return Promise.resolve({
          statusCode: 200,
          body: token
        });
      },
      auth0Client = new Auth0Client(endpoint);

    it('should get the requested profile', function () {
      return auth0Client.getDelegationToken('portal id', 'client id', 'refresh token')
        .then(function (retToken) {
          expect(retToken).to.equal(token);
        });
    });

    it('should use current session id token if provided', function () {
      return auth0Client.getDelegationToken('portal id', 'client id', 'refresh token', 'session id token')
        .then(function (retToken) {
          expect(retToken).to.equal(token);
          expect(capturedOptions.json.id_token).to.equal('session id token');
          expect(capturedOptions.json.refresh_token).to.be.undefined;
        });
    });
  });

  describe('Get Access Token v2', function () {
    var capturedOptions;
    var token = {
      access_token: 'access token',
      token_type: 'blah'
    },
      endpoint = function (options) {
        capturedOptions = options;
        return Promise.resolve({
          statusCode: 200,
          body: token
        });
      },
      auth0Client = new Auth0Client(endpoint);

    it('should get the requested client grant', function () {
      return auth0Client.getClientGrant('client id', 'client secret', 'audience')
        .then(function (retToken) {
          expect(retToken).to.equal(token);
          expect(capturedOptions.json.client_id).to.equal('client id');
          expect(capturedOptions.json.client_secret).to.equal('client secret');
          expect(capturedOptions.json.audience).to.equal('audience');
          expect(capturedOptions.json.grant_type).to.equal('client_credentials');
        });
    });
  });

  describe('Get Access Token through RO', function () {
    var capturedOptions;
    var token = {
      access_token: 'access token',
      token_type: 'blah'
    },
      endpoint = function (options) {
        capturedOptions = options;
        return Promise.resolve({
          statusCode: 200,
          body: token
        });
      },
      auth0Client = new Auth0Client(endpoint);

    it('should get the access token', () => {
      return auth0Client.getRoAccessToken('client id', 'username', 'password', 'connection', 'scope')
        .then(function (retToken) {
          expect(retToken).to.equal(token);
          expect(capturedOptions.json.client_id).to.equal('client id');
          expect(capturedOptions.json.username).to.equal('username');
          expect(capturedOptions.json.password).to.equal('password');
          expect(capturedOptions.json.connection).to.equal('connection');
          expect(capturedOptions.json.scope).to.equal('scope');
        });
    });
  });

});
