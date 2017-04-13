var _ = require('lodash'),
  expressJwt = require('express-jwt'),
  jwt = require('jsonwebtoken'),
  unless = require('express-unless'),
  util = require('util');

const BASE64_REGEX = /^(?:[A-Za-z0-9-_]{4})*(?:[A-Za-z0-9-_]{2}==|[A-Za-z0-9-_]{3}=)?$/;

// private function for computing the routes we do not need to apply auth0 to
var getExcludedRoutes = function(configuredExclusions) {
  // there's a few routes we know should be free of authentication
  var defaultExcludedRoutes = ['/livecheck', '/swagger', '/authtools/widget.js', '/authtools/connections.js'],
    routesToExclude = _.union(defaultExcludedRoutes, configuredExclusions || []);

  // Exclude all sub-routes of the configured excluded routes
  var excludedRoutesRegex = _.map(routesToExclude, function(route) {
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

// secures the application with auth0, by implementing checks against
// incoming jwt's, with configuration of what routes to apply it to
module.exports = function(app, config, logger) {

  // make sure we are configured to use auth0, otherwise, we dont need to
  // actually apply anything
  var auth0AppConfig = _.get(config, 'app.auth0.application');
  var auth0Domain = _.get(config, 'app.auth0.domain', 'cimpress.auth0.com');

  if (auth0AppConfig) {
    // decode the client secret if it is base64 encoded
    var secret;
    if (auth0AppConfig.secret.match(BASE64_REGEX)) {
      secret = new Buffer(auth0AppConfig.secret, 'base64');
    } else {
      secret = auth0AppConfig.secret;
    }

    // set up jwt validation, which will take into account excluded routes
    var v1JwtCheck = expressJwt({
      secret: secret,
      audience: auth0AppConfig.clientId
    });

    if (auth0AppConfig.resourceServer) {
      var v2JwtCheck = expressJwt({
        // Look up the public key to use based on the KID (key id) contained in the
        // header of the JWT.
        secret: (req, header, _payload, done) => {
          if (!header || !header.kid) {
            return done(new Error("JWT KID Not Found"));
          }
          var publicKeys = req.app.get("auth0PublicKeys") || {};
          var publicKey = publicKeys[header.kid];
          if (publicKey) {
            return done(null, publicKey);
          } else {
            return done(new Error("Public Key not found for KID " + header.kid));
          }
        },
        audience: auth0AppConfig.resourceServer,
        issuer: 'https://' + auth0Domain + '/',
        algorithms: ['RS256']
      });
    }

    var jwtAuthentication = function authentication(req, res, next) {
      // Use the v2 JWT middleware if:
      // 1) an `auth0.application.resourceServer` has been specified via the config object
      // 2) the request contains an `Authorization` header of the form "Bearer {JWT}"
      // 3) the JWT is well formed and the algorithm used to sign it is "RS256" as specified
      //    by the `alg` field of the JWT header
      if (auth0AppConfig.resourceServer && req.headers && req.headers.authorization) {
        var decodedToken = jwt.decode(req.headers.authorization.split(' ')[1], { complete: true });
        if (decodedToken && decodedToken.header && decodedToken.header.alg === 'RS256') {
          return v2JwtCheck(req, res, next);
        }
      }
      return v1JwtCheck(req, res, next);
    };
    jwtAuthentication.unless = unless;

    app.use(jwtAuthentication.unless({ path: getExcludedRoutes(auth0AppConfig.excludedRoutes) }));

    require('./unauthorized')(app, config, logger);

    // makes the id token available for others
    app.use(function(req, res, next) {
      // if there's no user, then it doesn't matter what the headers are,
      // we shouldn't bother trying to put the id_token in place
      if (req.user && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        req.user.id_token = req.headers.authorization.split(' ')[1];
      }
      next();
    });
  }
};