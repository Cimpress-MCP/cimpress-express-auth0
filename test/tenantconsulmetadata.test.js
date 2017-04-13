/*jshint -W030 */
var expect = require("chai").expect,
  chai = require("chai"),
  assert = require("assert-plus"),
  spies = require("chai-spies"),
  Helper = require("./supertesthelper.js");

chai.use(spies);

describe('Verify tenant retrieval.', function () {

  var helper, config, mw, tenants, getTenants;
  var clientId = "myId";
  var domain = "cimpressfake.auth0.com";

  beforeEach(function () {
    tenants = ["abc", "123"];
    config = {
      auth0: {
        application: {
          clientId: clientId,
          tenantSource: {
            baseUrl: "http://www.example.com",
            token: "BOB"
          }
        },
        domain: domain
      }
    };

    getTenants = function () {
      return Promise.resolve(tenants);
    };

    mw = require('../lib/tenantconsulmetadata.js');
    helper = new Helper(mw, config);
    helper.setup = (req, res) => {
      req.user = {
        sub: clientId
      };

      res.locals.userMetadataClient = {
        getTenants: getTenants
      };
    };

  });

  afterEach(function () {
    helper = undefined;
  });

  it('Should find a tenant when configured to do so', function () {
    return helper.execute().then(() => {
      return helper.finishedRequest.user.tenants()
        .then((retVal) => expect(retVal).to.equal(tenants));
    });
  });

  it('should not return a tenant when there is an error retrieving it', function () {
    getTenants = function() {
      return Promise.reject();
    };

    return helper.execute().then(() => {
      return helper.finishedRequest.user.tenants()
        .then((retVal) => expect(retVal).to.be.null);
    });
  });
});
