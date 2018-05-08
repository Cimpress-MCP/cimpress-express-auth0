var _ = require('lodash'),
    util = require('util');

module.exports = function(app, config, logger) {
  app.use(function(err, req, res, next) {
    if (config.preferRequestLogger) {
      if (req.logger && _.isFunction(req.logger.log)) {
        logger = req.logger;
      }
    }
    if (err.name === 'UnauthorizedError') {
      logger.log(err);
      addWwwAuthenticateHeaders(req, res, config.domain, config.clientId, config.audience, config.realm, config.enableV1);
      addLinkHeaders(res, config.domain, config.audience, config.enableV1);
      return res.status(401).json();
    }
    next(err);
  });
};

function createv1WWWAuthentiateHeader(req, domain, clientId) {
  return util.format('Bearer realm="%s", scope="client_id=%s service=%s"',
    domain, clientId, "https://" + req.hostname + req.baseUrl);
}

function addWwwAuthenticateHeaders(req, res, domain, clientId, resourceServer, realm, v1) {
  if (resourceServer) {
    const v2WwwAuthenticateHeader = util.format('Bearer realm="%s", authorization_uri="https://%s/oauth/token"', realm, domain);
    if (v1) {
      return res.header('WWW-Authenticate', [v2WwwAuthenticateHeader, createv1WWWAuthentiateHeader(req, domain, clientId)]);
    }
    return res.header('WWW-Authenticate', v2WwwAuthenticateHeader);
  } else if (v1) {
    res.header('WWW-Authenticate', createv1WWWAuthentiateHeader(req, domain, clientId));
  }
}

function createv1LinkHeaders(domain) {
  return util.format('<https://%s/authorize>; rel="openid2.provider openid.server"', domain);
}

function addLinkHeaders(res, domain, resourceServer, v1) {
  if (resourceServer) {
    const v2authLink = '<https://%s/oauth/token>; rel=authorization_uri';
    if (v1) {
      return res.header('Link', [util.format(v2authLink, domain), createv1LinkHeaders(domain)]);
    }
  } else if (v1) {
    res.header('Link', createv1LinkHeaders(domain));
  }
}
