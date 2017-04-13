/*jshint -W030 */
var expect = require('chai').expect,
  MiddlewareHelper = require('./middlewaretesthelper.js');

describe('Verify auth0 ui functions.', function () {

  var helper;

  beforeEach(function () {
    helper = new MiddlewareHelper('../lib/auth0ui.js');
    helper.config = {
      app: {
        auth0: {
          application: {
            clientId: "clientId",
            connections: ['conn1', 'conn2']
          },
          domain: "this.isa.domain"
        }
      }
    };
  });

  it('Should return connections', function () {
    helper.execute();
    var response = helper.get('/authtools/connections.js');
    expect(response).to.equal('window.auth0Connections = ["conn1","conn2"]');
  });

  it('Should return the widget', function () {
    helper.execute();
    var response = helper.get('/authtools/widget.js');
    expect(response).to.equal('window.auth0widget = new Auth0Lock("clientId", "this.isa.domain");');
  });

  it('Should not exist if its not needed', function () {
    helper.config = {};
    helper.execute();
    expect(helper.routes).to.be.empty;
  });

  it('Should fail if there are no connections defined', function () {
    helper.config.app.auth0.application.connections = undefined;
    expect(function () {
      helper.execute();
    }).to.throw();
  });

  it('Should fail if the connections are empty', function () {
    helper.config.app.auth0.application.connections = [];
    expect(function () {
      helper.execute();
    }).to.throw();
  });
});
