/*jshint -W030 */
var expect = require('chai').expect,
  MiddlewareHelper = require('./middlewaretesthelper.js'),
  JwtMock = require('./jwtmock.js'),
  chai = require('chai'),
  spies = require('chai-spies');

chai.use(spies);

describe('Verify the construction of an auth0 client.', function () {

  var helper;

  beforeEach(function () {
    helper = new MiddlewareHelper('../lib/auth0clientbuilder.js');
    helper.config = {
      app: {
        auth0: {
          domain: "this.isa.domain"
        }
      }
    };

    // build custom endpoint returns a function representing the endpoint
    helper.res = { locals: { endpointClient: {} } };
    helper.res.locals.endpointClient.endpoint = chai.spy(function (obj) {
      return function () { };
    });

  });

  it('Should construct an auth0 client', function () {
    helper.execute();
    expect(helper.req.getAuth0Client()).to.be.defined;
    expect(helper.res.locals.endpointClient.endpoint).to.have.been.called.with({ baseUrl: "https://this.isa.domain" });
  });
});
