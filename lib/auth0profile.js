module.exports = function(app, config, logger) {
  app.use(function (req, res, next) {
    // substitute the logger if available
    var user = req.user;

    // override the default logger with one the middleware has provided
    logger = req.getLogger() || logger;

    // dont bother continuing if there's no user
    if(!user || !user.id_token) {
      logger.warn("No valid user token available, cannot retrieve profile");
      return next();
    }

    // get the auth0 client and load up the profile
    req.getAuth0Client().getProfile(user.id_token)
        .then(function(profile) {
          user.profile = profile;
          return next();
        }).catch(function(err) {
          logger.error("Could not load auth0 user profile (continuing):" + err);
          return next();
        });
  });
};
