/*jshint -W030 */
'use strict';
const expect = require("chai").expect,
  chai = require("chai"),
  assert = require("assert-plus"),
  spies = require("chai-spies"),
  JwtMock = require('./jwtmock.js'),
  UnauthorizedError = require('express-jwt/lib/errors/UnauthorizedError'),
  Helper = require("./supertesthelper.js");

chai.use(spies);

describe('Verify auth0 application functions.', function () {

  var helper, jwtMock, config, mw;
  const clientId = "myId";
  const domain = "cimpressfake.auth0.com";
  const realm = "https://fakeapi.cimpress.io/";
  const jwksUrl = "https://fakejwksserver.cimpress.io";
  beforeEach(function () {
    config = {
      app: {
        auth0: {
          application: {
            clientId: clientId,
            connections: ['conn1', 'conn2'],
            secret: 'this is a secret',
          },
          domain: domain,
          realm,
          jwksUrl
        }
      }
    };

    jwtMock = new JwtMock();

    mw = require('../lib/auth0verification.js');
  });

  afterEach(function () {
    jwtMock.tearDown();
    helper = undefined;
  });

  it('Should validate a request with a non-base64 encoded secret', function () {
    jwtMock.setJwtFunction(function (req, res, next) {
      req.user = {};
      next();
    });

    helper = new Helper(mw, config);
    helper.app.get("/stub", function (req, res) {
      res.status(200).json({ name: "tobi" });
    });

    return helper.execute("/stub").expect(200).then(function (req, res) {
      expect(helper.finishedRequest.user).to.not.be.undefined;

      // ensure the original client secret was passed through
      expect(jwtMock.options.secret).to.equal(config.app.auth0.application.secret);
    });
  });

  it('Should validate a request with a base64 encoded secret', function () {
    jwtMock.setJwtFunction(function (req, res, next) {
      req.user = {};
      next();
    });

    config.app.auth0.application.secret = new Buffer('this is a secret').toString('base64');
    helper = new Helper(mw, config);
    helper.app.get("/stub", function (req, res) {
      res.status(200).json({ name: "tobi" });
    });

    return helper.execute("/stub").expect(200).then(function (req, res) {
      expect(helper.finishedRequest.user).to.not.be.undefined;

      // ensure the original client secret was base64 decoded
      expect(jwtMock.options.secret).to.be.an.instanceof(Buffer);
      var decodedSecret = new Buffer(jwtMock.options.secret).toString('base64');
      expect(decodedSecret).to.equal(config.app.auth0.application.secret);
    });
  });

  it('Should reject an unauthenticated request', function () {

    jwtMock.setJwtFunction(function (req, res, next) {
      return next(new UnauthorizedError('credentials_required', {
        message: 'No authorization token was found'
      }));
    });
    helper = new Helper(mw, config);
    helper.app.get("/stub", function (req, res) {
      res.status(200).json({ name: "tobi" });
    });

    return helper.execute("/stub").expect(401).then(function (req, res) {
      expect(helper.finishedRequest.user).to.be.undefined;
      expect(helper.finishedResponse._headers['www-authenticate']).to.include(
        'Bearer realm="' + domain + '", scope="client_id=' + clientId +
        ' service=' + helper.finishedRequest.protocol +
        '://' + helper.finishedRequest.hostname + helper.finishedRequest.baseUrl + '"');
    });
  });

  it('Should return an appropriate WWW-Authenticate header for API Authentication', function () {

    jwtMock.setJwtFunction(function (req, res, next) {
      return next(new UnauthorizedError('credentials_required', {
        message: 'No authorization token was found'
      }));
    });
    // Clone the config so as not to break other tests.
    var v2config = JSON.parse(JSON.stringify(config));
    v2config.app.auth0.application.resourceServer = 'http://api.cimpress.io/';

    helper = new Helper(mw, v2config);
    helper.app.get("/stub", function (req, res) {
      res.status(200).json({ name: "tobi" });
    });

    return helper.execute("/stub").expect(401).then(function (req, res) {
      expect(helper.finishedRequest.user).to.be.undefined;
      expect(helper.finishedResponse._headers['www-authenticate']).to.include(
        'Bearer realm="' + domain + '", scope="client_id=' + clientId +
        ' service=' + helper.finishedRequest.protocol +
        '://' + helper.finishedRequest.hostname + helper.finishedRequest.baseUrl + '"');
      expect(helper.finishedResponse._headers['www-authenticate']).to.include(
        'Bearer realm="' + realm + '", authorization_uri="https://' + domain + '/oauth/token"');
    });
  });

  it('Should be able to exclude a route', function () {
    jwtMock.setJwtFunction(function (req, res, next) {
      req.user = {};
      next();
    });

    var excludedRoute = "/excluded";
    config.app.auth0.application.excludedRoutes = [excludedRoute];
    helper = new Helper(mw, config);
    helper.app.get(excludedRoute, function (req, res) {
      res.status(200).json({});
    });

    return helper
      .execute(excludedRoute).expect(200)
      .then((req, res) => expect(helper.finishedRequest.user).to.be.undefined);
  });

  it('Should be able to exclude a route by HTTP method', function () {
    jwtMock.setJwtFunction(function (req, res, next) {
      req.user = {};
      next();
    });

    var excludedRoute = "/excluded";
    config.app.auth0.application.excludedRoutes = [{
      url: excludedRoute,
      methods: ["GET"]
    }];
    helper = new Helper(mw, config);
    helper.app.get(excludedRoute, function (req, res) {
      res.status(200).json({});
    });
    helper.app.post(excludedRoute, function (req, res) {
      res.status(200).json({});
    });

    return helper
      .execute(excludedRoute).expect(200)
      .then((req, res) => expect(helper.finishedRequest.user).to.be.undefined)
      .then(() => helper.post(excludedRoute).expect(200))
      .then((req, res) => expect(helper.finishedRequest.user).to.not.be.undefined);
  });
});
