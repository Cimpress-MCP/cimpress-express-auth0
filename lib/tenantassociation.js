var _ = require('lodash'),
  P = require('bluebird');

module.exports = function (app, config, logger) {
  app.use(function (req, res, next) {
    logger = req.getLogger() || logger;

    var getIdentity = function () {
      if (user && user.sub) {
        return {
          type: user.sub.split("|")[0],
          id: user.sub.split("|")[1]
        };
      }
    };

    var findViaDomain = function (tenant, identity) {
      // its active directory and the identity looks like an email address
      // we can try to find things by their domain
      if (identity.type === "adfs" && identity.id.indexOf("@") >= 0) {
        var emailParts = identity.id.split("@");

        if (emailParts.length !== 2) {
          logger.warn("Invalid email detected", { email: email });
          return;
        }
        var domain = emailParts[1];
        return _.includes(tenant.domains, domain);
      }
    };

    var findTenant = function (identity) {
      // without a number of things defined, we know we wont be able to
      // find a tenant
      if (!identity) {
        // if there was no tenant, we'll return undefined
        return;
      }

      // if no tenant matches the user, we'll return undefined
      return _.find(tenants, function (tenant) {
        // see if there's a matching email address or domain
        var found = _.includes(tenant.ids, identity.id) ||
          findViaDomain(tenant, identity);

        return found;
      });
    };

    var user = req.user;
    var tenants = _.get(config, 'app.auth0.application.tenants');

    // if there's no user or no tenants configured, then there's nothing to do
    // if another middleware has already added a way of getting a tenant, then
    // we wont want to override it.
    if (user && tenants && !user.tenants) {
      user.tenant = findTenant(getIdentity());

      if (!user.tenants) {
        // adding a method to be compatible with other methods of getting tenants
        user.tenants = function () {
          return P.resolve([user.tenant]);
        };
      }
    }
    next();
  });
};
