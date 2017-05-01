'use strict';
const _ = require('lodash'),
  expressJwt = require('express-jwt'),
  jwt = require('jsonwebtoken'),
  unless = require('express-unless'),
  util = require('util'),
  Promise = require('bluebird'),
  jwksClient = require('jwks-rsa');

const BASE64_REGEX = /^(?:[A-Za-z0-9-_]{4})*(?:[A-Za-z0-9-_]{2}==|[A-Za-z0-9-_]{3}=)?$/;
const ERROR_NAME= 'UnauthorizedError';

// private function for computing the routes we do not need to apply auth0 to
const getExcludedRoutes = function (configuredExclusions) {
  // there's a few routes we know should be free of authentication
  const defaultExcludedRoutes = ['/livecheck', '/swagger', '/authtools/widget.js', '/authtools/connections.js'],
    routesToExclude = _.union(defaultExcludedRoutes, configuredExclusions || []);

  // Exclude all sub-routes of the configured excluded routes
  var excludedRoutesRegex = _.map(routesToExclude, function (route) {
    if (_.isString(route)) {
      return new RegExp(route, 'i');
    } else if (route.url) { // support the url/method key-pair
      if (!(route.url instanceof RegExp)) {
        route.url = new RegExp(route.url, 'i');
      }
      return route;
    } else {
      return route;
    }
  });

  //only match the root
  excludedRoutesRegex.push(new RegExp('^/$', 'ig'));

  return excludedRoutesRegex;
};

const getAuthPublicKey = function (jwksUrl, cache, kid) {
  return cache.get(`kid${kid}`).then(function (data) {
    if (!data) {
      var client = Promise.promisifyAll(jwksClient({
        cache: true,
        cacheMaxEntries: 5,
        jwksUri: jwksUrl
      }));
      return client.getSigningKeyAsync(kid).then(key => {
        var signingKey = key.publicKey || key.rsaPublicKey;
        var encodedValue = new Buffer(signingKey).toString("base64");
        return cache.set(`kid${kid}`, encodedValue, 36000).then(() => {
          return new Buffer(signingKey);
        });
      }, err => err);
    } else {
      return new Buffer(data, "base64");
    }
  });
};

// secures the application with auth0, by implementing checks against
// incoming jwt's, with configuration of what routes to apply it to
module.exports = function (app, config, logger, cache) {
  if (config && config.secret) {
    // decode the client secret if it is base64 encoded
    var secret;
    if (config.secret.match(BASE64_REGEX)) {
      secret = new Buffer(config.secret, 'base64');
    } else {
      secret = config.secret;
    }

    // set up jwt validation, which will take into account excluded routes
    var v1JwtCheck = expressJwt({
      secret: secret,
      audience: config.clientId
    });

    let v2JwtCheck;
    if (config.audience && config.jwksUrl) {
      v2JwtCheck = expressJwt({
        // Look up the public key to use based on the KID (key id) contained in the
        // header of the JWT.
        secret: (req, header, _payload, done) => {
          if (!header || !header.kid) {
            return done(new Error("JWT KID Not Found"));
          }
          getAuthPublicKey(config.jwksUrl, cache, header.kid).then(
            (key) => {
              if (key) {
                return done(null, key);
              } else {
                return done(new Error("Public Key not found for KID " + header.kid));
              }
            }, err => done(err)
          );
        },
        audience: config.audience,
        issuer: 'https://' + config.domain + '/',
        algorithms: ['RS256']
      });
    }

    let jwtAuthentication = function authentication(req, res, next) {
      // Use the v2 JWT middleware if:
      // 1) an `auth0.application.resourceServer` has been specified via the config object
      // 2) the request contains an `Authorization` header of the form "Bearer {JWT}"
      // 3) the JWT is well formed and the algorithm used to sign it is "RS256" as specified
      //    by the `alg` field of the JWT header
      if (config.audience && req.headers && req.headers.authorization) {
        let decodedToken;
        try {
          decodedToken = jwt.decode(req.headers.authorization.split(' ')[1], { complete: true });
        }
        catch (err) {
          var error = new Error(err);
          error.name = ERROR_NAME;
          next(error);
        }
        if (decodedToken && decodedToken.header && decodedToken.header.alg === 'RS256') {
          return v2JwtCheck(req, res, next);
        }
      }
      return v1JwtCheck(req, res, next);
    };
    jwtAuthentication.unless = unless;

    app.use(jwtAuthentication.unless({ path: getExcludedRoutes(config.excludedRoutes) }));

    require('./unauthorized')(app, config, logger);

    // makes the id token available for others
    app.use(function (req, res, next) {
      // if there's no user, then it doesn't matter what the headers are,
      // we shouldn't bother trying to put the id_token in place
      if (req.user && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        req.user.id_token = req.headers.authorization.split(' ')[1];
      }
      next();
    });
  }
};
