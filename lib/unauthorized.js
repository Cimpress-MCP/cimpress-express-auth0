var _ = require('lodash'),
    util = require('util');

module.exports = function(app, config, logger) {
  var auth0AppConfig = _.get(config, 'app.auth0.application');
  var auth0Domain = _.get(config, 'app.auth0.domain');
  var auth0Realm = _.get(config, 'app.auth0.realm');

  app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      logger.log(err);
      addWwwAuthenticateHeaders(req, res, auth0Domain, auth0AppConfig.clientId, auth0AppConfig.resourceServer, auth0Realm);
      addLinkHeaders(res, auth0Domain, auth0AppConfig.resourceServer);
      return res.status(401).json();
    }
    next(err);
  });
};

function addWwwAuthenticateHeaders(req, res, domain, clientId, resourceServer, realm) {
  var v1WwwAuthenticateHeader = util.format('Bearer realm="%s", scope="client_id=%s service=%s"',
    domain, clientId, req.protocol + "://" + req.hostname + req.baseUrl);

  if (resourceServer) {
    var v2WwwAuthenticateHeader = util.format('Bearer realm="%s", authorization_uri="https://%s/oauth/token"', realm, domain);
    return res.header('WWW-Authenticate', [v1WwwAuthenticateHeader, v2WwwAuthenticateHeader]);
  }
  res.header('WWW-Authenticate', v1WwwAuthenticateHeader);
}

function addLinkHeaders(res, domain, resourceServer) {
  var v1authLink = '<https://%s/authorize>; rel="openid2.provider openid.server"';

  if (resourceServer) {
    var v2authLink = '<https://%s/oauth/token>; rel=authorization_uri';
    return res.header('Link', [util.format(v1authLink, domain), util.format(v2authLink, domain)]);
  }
  res.header('Link', util.format(v1authLink, domain));
}
