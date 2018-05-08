var mockery = require('mockery'),
 unless = require("express-unless");

module.exports = function() {
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  });

  var self = this;
  var func;

  var jwtFunc = function(options) {
    self.options = options;
    return func;
  };

  this.setJwtFunction = function(inputFunc) {
    func = inputFunc;
    func.unless = unless;
  };

  this.tearDown = function() {
    mockery.deregisterMock('express-jwt');
    mockery.disable();
  };

  mockery.registerMock('express-jwt', jwtFunc);
};
