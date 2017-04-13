/*jshint -W030 */
var expect = require('chai').expect,
  UserNotFound = require('../../../lib/error/classes.js').UserNotFound,
  UserMetadataClient = require("../../../lib/client/usermetadataclient.js");

describe('Verify user meta data.', function () {

  var endpointClient, tenantResponse, userDataResponse, userMetaDataClient, requests, baseUrl;
  var clientId = "myId";
  var userId = "asdf|somerandomjunk";

  beforeEach(function () {
    requests = [];
    baseUrl = "http://www.example.com/";
    userDataResponse = {
      statusCode: 200,
      body: {
        tenants: [
          "https://www.example.com/tenant1"
        ]
      }
    };

    tenantResponse = {
      statusCode: 200,
      body: {
        test: "data"
      }
    };

    var retVal = userDataResponse;

    endpointClient = {
      endpoint: function () {
        return function (options) {
          requests.push(options);
          var currentReturn = retVal;
          retVal = tenantResponse;
          return Promise.resolve(currentReturn);
        };
      }
    };

    userMetaDataClient = new UserMetadataClient(
      baseUrl,
      "ABC123",
      userId,
      clientId,
      endpointClient);
  });

  it('Should find a tenant when the user matches an auth0 id', function () {
    return userMetaDataClient.getTenants()
      .then((tenants) => {
        expect(tenants.length).to.equal(1);
        expect(tenants[0]).to.equal(tenantResponse.body);
        expect(requests[0].uri).to.equal('client/myId/user/asdf%7Csomerandomjunk?dc=irl&raw=1');
        expect(requests[0].method).to.equal('GET');
      });
  });

  it('Should not find a tenant when the user is not found', function () {
    userDataResponse.statusCode = 404;
    return userMetaDataClient.getTenants()
      .then((tenants) => {
        expect.fail();
      })
      .catch(UserNotFound, e => {
        expect(e.additionalData.tenant).to.equal(userId);
      });
  });

  it('Should not find a tenant when the user is valid, but matches no tenants', function () {
    userDataResponse.body.tenants = [];
    return userMetaDataClient.getTenants()
      .then((tenants) => {
        expect(tenants.length).to.equal(0);
      });
  });

  it('Should not find a tenant when the user is valid, but refers to invalid tenants', function () {
    tenantResponse.statusCode = 404;
    return userMetaDataClient.getTenants()
      .then((tenants) => {
        expect(tenants.length).to.equal(0);
      });
  });

  it('Should create a user', function () {
    return userMetaDataClient.createUser()
      .then(user => {
        expect(requests[0].uri).to.equal('client/myId/user/asdf%7Csomerandomjunk?dc=irl&raw=1');
        expect(requests[0].method).to.equal("PUT");
      });
  });

  it('Should create a tenant', function () {
    var data = { data: "some random data" };
    return userMetaDataClient.createTenant(45, data)
      .then(user => {
        expect(requests[0].uri).to.equal('client/myId/tenant/45?dc=irl&raw=1');
        expect(requests[0].method).to.equal("PUT");
        expect(requests[0].json).to.equal(data);
      });
  });

  it('Should add a tenant', function () {
    return userMetaDataClient.addTenant(45)
      .then(user => {
        // should have looked up a user
        expect(requests[0].uri).to.equal('client/myId/user/asdf%7Csomerandomjunk?dc=irl&raw=1');
        expect(requests[0].method).to.equal("GET");

        // then set the tenant
        expect(requests[1].uri).to.equal('client/myId/user/asdf%7Csomerandomjunk?dc=irl&raw=1');
        expect(requests[1].method).to.equal("PUT");
        var expected = {
          tenants: [
            "https://www.example.com/tenant1",
            baseUrl + "client/myId/tenant/45?dc=irl&raw=1"
          ]
        };
        expect(requests[1].json).to.deep.equal(expected);
      });
  });

  it('Should add a tenant to another application', function () {
    return userMetaDataClient.createRemoteClient("theOtherId").addTenant(45)
      .then(user => {
        // should have looked up a user
        expect(requests[0].uri).to.equal('client/theOtherId/user/asdf%7Csomerandomjunk?dc=irl&raw=1');
        expect(requests[0].method).to.equal("GET");

        // then set the tenant
        expect(requests[1].uri).to.equal('client/theOtherId/user/asdf%7Csomerandomjunk?dc=irl&raw=1');
        expect(requests[1].method).to.equal("PUT");
        var expected = {
          tenants: [
            "https://www.example.com/tenant1",
            baseUrl + "client/theOtherId/tenant/45?dc=irl&raw=1"
          ]
        };
        expect(requests[1].json).to.deep.equal(expected);
      });
  });
});
