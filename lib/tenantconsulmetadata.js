var _ = require('lodash');

module.exports = function (app, config, logger) {
  app.use(function (req, res, next) {

    var user = req.user;

    // if there's no user configured or no way to get metadata, then there's nothing to do
    if (res.locals.userMetadataClient && user) {
      user.tenants = function () {
        return res.locals.userMetadataClient.getTenants()
          .catch(error => null); // swallow common errors in retrieving tenants (like 404 - user doesn't exist)
      };
    }
    next();
  });
};