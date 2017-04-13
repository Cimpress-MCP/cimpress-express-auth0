/*jshint -W030 */
var expect = require('chai').expect,
  MiddlewareHelper = require('./middlewaretesthelper.js');

describe('Verify tenant lookup.', function () {

  var tenant, setSeb, getTenant, helper;

  beforeEach(function () {
    helper = new MiddlewareHelper('../lib/tenantassociation.js');
    helper.req.user = {};

    tenant = {
      ids: ['somerandomjunk'],
      domains: ['domain.com']
    };

    helper.config = {
      app: {
        auth0: {
          application: {
            tenants: [tenant]
          }
        }
      }
    };

    setSub = function (value) {
      helper.req.user.sub = value;
    };

    getTenant = function () {
      return helper.req.user.tenant;
    };

    setSub("asdf|somerandomjunk");
  });

  it('Should find a tenant when the user matches a domain', function () {
    setSub("adfs|valid@domain.com");
    helper.execute();
    expect(getTenant()).to.equal(tenant);
  });

  it('Should find a tenant when the user matches an auth0 id', function () {
    setSub("auth0|somerandomjunk");
    helper.execute();
    expect(getTenant()).to.equal(tenant);
  });

  it('Should not find a tenant when no information is provided', function () {
    helper.config = {};
    helper.execute();
    expect(getTenant()).to.be.undefined;
  });

  it('Should not find a tenant when the user has a malformed email address', function () {
    setSub("adfs|malformedemail.com");
    helper.execute();
    expect(getTenant()).to.be.undefined;
  });

  it('Should not find a tenant when the user is valid, but matches no tenants', function () {
    setSub("adfs|whoam@I.com");
    helper.execute();
    expect(getTenant()).to.be.undefined;
  });

  it('Should not find a tenant when the user has a malformed sub', function () {
    setSub("malformedsub");
    helper.execute();
    expect(getTenant()).to.be.undefined;
  });
});
