// var _ = require('lodash'),
//   Auth0Client = require('./auth0client.js'),
//   Endpoint = require('../outbound/endpoint.js')

// // if you're using auth0 in any capacity, it will be useful to have an
// // auth0 client available to you
// module.exports = function (app, config, logger) {

//   var domain = _.get(config, 'app.auth0.domain');

//   if (domain) {
//     app.use((req, res, next) => {
//       req.getAuth0Client = () => req.getAuth0ClientFromDomain(domain);
//       next();
//     });
//   }

//   app.use((req, res, next) => {
//     req.getAuth0ClientFromDomain = (domain) => {
//       var auth0Endpoint = res.locals.endpointClient.endpoint({ baseUrl: "https://" + domain });
//       return new Auth0Client(auth0Endpoint);
//     };
//     next();
//   });
// };
