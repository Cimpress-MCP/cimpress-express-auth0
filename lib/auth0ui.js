var _ = require('lodash');

// exposes routes for use in UI's that need some knowledge of how auth0 is configured
module.exports = function(app, config, logger) {

  var auth0AppConfig = _.get(config, 'app.auth0.application');
  var domain = _.get(config, 'app.auth0.domain');

  if(auth0AppConfig && domain) {

    // if there's no connections, no UI is going to succeed, so we
    // should probably let the user know that
    if(!auth0AppConfig.connections || !auth0AppConfig.connections.length) {
      var message = "You have configured your application for auth0, but have not provided any connections. " +
        "This is invalid, as no one will be able to connect to your application.  " +
        "Please add connections to your configuration file that match those found at http://manage.auth0.com";

      throw message;
    }

    // supplies a route that prepares an auth0 widget using the clientId
    // and the domain
    app.get('/authtools/widget.js', function(req, res, next) {
      res.send('window.auth0widget = new Auth0Lock("' + auth0AppConfig.clientId + '", "' + domain + '");');
    });

    // supplies a list of the connections provided
    app.get('/authtools/connections.js', function(req, res, next) {
      var connString = JSON.stringify(auth0AppConfig.connections);
      res.send('window.auth0Connections = ' + connString);
    });
  }
};
