const chai = require('chai');
const should = chai.should();
const lib = require('../lib');

describe('Require index.js', function () {
  it('Defines all exported functions', () => {
    should.not.equal(null, lib.unauthorized);
    should.not.equal(null, lib.auth0verifications);
  })
});
