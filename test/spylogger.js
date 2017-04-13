var chai = require('chai'),
  spies = require('chai-spies');
chai.use(spies);

module.exports = {
  info: chai.spy(),
  warn: chai.spy(),
  error: chai.spy(),
  debug: chai.spy(),
  log: chai.spy()
};