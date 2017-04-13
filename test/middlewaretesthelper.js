var chai = require('chai'),
    spies = require('chai-spies');

chai.use(spies);

module.exports = function(middlewarePath) {
  var me = this;
  this.config = {};
  this.req = {};
  this.res = {};
  this.next = chai.spy(function() {});
  this.logger = {};
  this.app = {};
  this.routes = {};
  this.err = {};

  this.logger.warn = chai.spy(function() {});
  this.req.getLogger = function() {
    return me.logger;
  };

  this.app.use = function(middleware) {

    if (middleware.length >= 4) {
      middleware(me.err, me.req, me.res, me.next);
    } else {
      middleware(me.req, me.res, me.next);
    }
  };

  this.app.get = function(route, func) {
    me.routes[route] = func;
  };

  this.get = function(route) {
    var retVal, res = {
      send: function(value) {
        retVal = value;
      }
    };
    me.routes[route](me.req, res, me.next);
    return retVal;
  };

  this.execute = function() {
    require(middlewarePath)(this.app, this.config, this.logger);
  };
};
