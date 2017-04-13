var expect = require("chai").expect,
  chai = require("chai"),
  assert = require("assert-plus"),
  spies = require("chai-spies"),
  Helper = require("./supertesthelper.js");

chai.use(spies);

describe('Verify auth0 user admin feature.', function () {

  var helper, config, mw;
  var clientId = "myId";
  var domain = "cimpressfake.auth0.com";

  beforeEach(function () {
    config = {
      app: {
        auth0: {
          application: {
            tenantSource: {
              adminDomain: "derp.com"
            }
          }
        }
      }
    };

    mw = require('../lib/auth0admincheck.js');

    helper = new Helper(mw, config);

  });

  afterEach(function () {
    helper = undefined;
  });

  it('Should work with an admin scope.', function () {

    helper.setup = function (req, res) {
      req.user = {
        scopes: ["admin"]
      };
    };

    return helper.execute().then(function (req, res) {
      expect(helper.finishedRequest.user.isAdmin()).to.be.true;
    });

  });

  it('Should work with an admin domain.', function () {

    helper.setup = function (req, res) {
      req.user = {
        scopes: ["erp"],
        sub: "adfs|herp@derp.com"
      };
    };

    return helper.execute().then(function (req, res) {
      expect(helper.finishedRequest.user.isAdmin()).to.be.true;
    });
  });

  it('should succeed if there is no user.', () => {
    try {
      return helper.execute();
    } catch (e) {
      assert(false);
    }
  });

  it('Should not be an admin.', function () {

    config = {
      auth0: {
        application: {}
      }
    };

    helper.setup = function (req, res) {
      req.user = {
        sub: "abcus|herp@zerp.com"
      };
    };

    return helper.execute().then(function (req, res) {
      expect(helper.finishedRequest.user.isAdmin()).to.be.false;
    });

  });
});
