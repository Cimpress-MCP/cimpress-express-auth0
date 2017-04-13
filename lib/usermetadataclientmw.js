var _ = require('lodash'),
  UserMetadataClient = require('./client/usermetadataclient.js');

module.exports = function (app, config, logger) {
  app.use(function (req, res, next) {

    var tenantSource = _.get(config, 'app.auth0.application.tenantSource');
    var clientId = _.get(config, 'app.auth0.application.clientId');

    if(tenantSource && clientId && req.user) {
      res.locals.userMetadataClient =
        new UserMetadataClient(
          tenantSource.baseUrl, tenantSource.token, req.user.sub, clientId, res.locals.endpointClient);
    }

    next();
  });
};
