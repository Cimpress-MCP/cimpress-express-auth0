var expect  = require('chai').expect,
  P = require('bluebird')
  // auth0 = require('../../middleware/outbound/auth/auth0.js');

describe('Talking to auth0', function() {

  describe('getting a token', function() {
    var endpoint = {},
      token = { token_type: "Bearer",  id_token: 'alkjdslkajdflkjasdf' },
      auth0Client = { getDelegationToken: function(portalId, clientId, refreshToken) {
        return P.resolve(token);
      } },
      headers;
    endpoint.execute = function(options) {
      headers = options.headers;
    };

    // it('Should invoke the endpoint with an appropriate header', function() {
    //   var authEp = auth0(endpoint, function() {
    //     return auth0Client.getDelegationToken("1", "2", "3");
    //   });
    //   authEp.auth0Client = auth0Client;
    //   return authEp.execute({}).then(function() {
    //     expect(headers.authorization).to.equal(token.token_type + " " + token.id_token);
    //   });
    // });

    // it('Should respect an excluded route', function() {
    //   var authEp = auth0(endpoint, function() {
    //     return auth0Client.getDelegationToken("1", "2", "3");
    //   });
    //   authEp.auth0Client = auth0Client;
    //   return authEp.execute({}).then(function() {
    //     expect(headers.authorization).to.equal(token.token_type + " " + token.id_token);
    //   });
    // });
  });
});
