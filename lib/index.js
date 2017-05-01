const auth0verification = require('./auth0verification');
const unauthorized = require('./unauthorized');
const _ = require('lodash');

module.exports = (app, config, logger, cache) => {
  return auth0verification(app, config, logger, cache);
};
module.exports.unauthorized = unauthorized;
module.exports.auth0verification = (app, legacyConfig, logger, cache) => {
  const config = {
    domain: _.get(legacyConfig, 'app.auth0.domain', undefined),
    jwksUrl: _.get(legacyConfig, 'app.auth0.jwksUrl', undefined),
    secret: _.get(legacyConfig, 'app.auth0.application.secret', undefined),
    clientId: _.get(legacyConfig, 'app.auth0.application.clientId', undefined),
    audience: _.get(legacyConfig, 'app.auth0.application.resourceServer', undefined),
    excludedRoutes: _.get(legacyConfig, 'app.auth0.application.excludedRoutes', undefined),
    realm: _.get(legacyConfig, 'app.auth0.realm', undefined),
  };
  return auth0verification(app, config, logger, cache);
};
