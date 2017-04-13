var _ = require("lodash");

module.exports = function (app, config, logger) {
  var auth0AppConfig = _.get(config, 'app.auth0.application');

  if (auth0AppConfig) {
    app.use((req, res, next) => {
      if (req.user) {
        req.user.isAdmin = function () {
          var scopes = _.get(req.user, "scopes", []);
          if (_.includes(scopes, "admin")) {
            return true;
          }

          if (auth0AppConfig.tenantSource.adminDomain) {
            return req.user.sub.startsWith("adfs") && req.user.sub.endsWith(auth0AppConfig.tenantSource.adminDomain);
          }

          return false;
        };
      }
      next();
    });
  }
};