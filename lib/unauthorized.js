var _ = require('lodash'),
    util = require('util');

module.exports = function(app, config, logger) {
  app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      addWwwAuthenticateHeaders(req, res, config.domain, config.clientId, config.audience, config.realm);
      addLinkHeaders(res, config.domain, config.audience);
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
