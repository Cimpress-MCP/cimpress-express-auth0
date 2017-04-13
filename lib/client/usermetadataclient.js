var TenantNotFound = require('../error/classes.js').TenantNotFound,
  UserNotFound = require('../error/classes.js').UserNotFound,
  UserDataWriteError = require('../error/classes.js').UserDataWriteError,
  _ = require('lodash');

var UserMetadataClient = function (metadataUrl, token, userId, clientId, endpointClient) {
  if (!(this instanceof UserMetadataClient)) {
    return new UserMetadataClient(auth0Endpoint);
  }

  var consulOptions = function (uri, method, data) {
    var retVal = {
      uri: uri,
      headers: {
        "X-Consul-Token": token
      },
      method: method || "GET"
    };

    if (data) {
      retVal.json = data;
    }

    return retVal;
  };

  var tenantUri = function (tenantId) {
    return encodeURI(`client/${clientId}/tenant/${tenantId}?dc=irl&raw=1`);
  };

  var userUri = function () {
    return encodeURI(`client/${clientId}/user/${userId}?dc=irl&raw=1`);
  };

  var endpoint = function () {
    return endpointClient.endpoint({ baseUrl: metadataUrl });
  };

  var getTenantData = function (tenants) {
    var tenantLinks = _.map(tenants, (tenantReference) => {
      return endpointClient.endpoint({ baseUrl: tenantReference })(consulOptions(""))
        .then((response) => {
          if (response.statusCode >= 400) {
            Promise.reject(new TenantNotFound({ tenant: tenantReference }));
          } else {
            return response.body;
          }
        });
    });

    return Promise.all(tenantLinks);
  };

  this.ensureUserExists = function () {
    return endpoint()(consulOptions(userUri()))
      .then(response => {
        if (response.statusCode === 404) {
          return this.createUser();
        } else {
          return response.body;
        }
      });
  };

  this.getTenants = function () {
    return this.getUser()
      .then(body => getTenantData(body.tenants))
      .then((tenants) => _.compact(tenants));
  };

  this.getUser = function () {
    return endpoint()(consulOptions(userUri()))
      .then(response => {
        if (response.statusCode >= 400) {
          Promise.reject(new UserNotFound({ user: userId }));
        } else {
          return response.body;
        }
      });
  };

  this.createTenant = function (tenantId, tenantData) {
    return endpoint()(consulOptions(tenantUri(tenantId), "PUT", tenantData))
      .then(response => {
        if (response.statusCode >= 400) {
          Promise.reject(new UserDataWriteError({ tenant: tenantId }));
        } else {
          return response.body;
        }
      });
  };

  this.createUser = function () {
    // start with empty user data
    var userData = {
      tenants: []
    };

    // then write that to consul
    return endpoint()(consulOptions(userUri(), "PUT", userData))
      .then(response => {
        if (response.statusCode >= 400) {
          Promise.reject(new UserDataWriteError({ user: userId }));
        } else {
          return userData;
        }
      });
  };

  this.addTenant = function (tenantId) {
    // sets up the URI we'll link up for the tenant
    var tenantReference = metadataUrl + tenantUri(tenantId);

    // get the user before adding a tenant to it so we don't erase existing data
    return this.ensureUserExists()
      .then(userData => {
        userData.tenants = userData.tenants || [];
        userData.tenants.push(tenantReference);
        // no need to have the same tenant twice
        userData.tenants = _.uniq(userData.tenants);
        return endpoint()(consulOptions(userUri(), "PUT", userData));
      })
      .then(response => {
        if (response.statusCode >= 400) {
          Promise.reject(new UserDataWriteError({ user: userId }));
        } else {
          return tenantReference;
        }
      });
  };

  this.createRemoteClient = function(remoteClientId) {
    return new UserMetadataClient(metadataUrl, token, userId, remoteClientId, endpointClient);
  };
};

module.exports = UserMetadataClient;