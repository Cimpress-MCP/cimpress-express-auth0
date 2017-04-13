// var _ = require("lodash"),
//   chai = require("chai"),
//   expect = require("chai").expect,
//   mockery = require("mockery"),
//   spies = require("chai-spies"),
//   uuid = require("node-uuid"),
//   P = require("bluebird"),
//   moment = require("moment"),
//   spylogger = require("./spylogger.js");

// chai.use(spies);

// describe("Endpoint auth tests", function () {

//   beforeEach(() => {
//     this.ctx.mockAuthCacheGet = chai.spy(key => {
//       return {
//         bearer: `bearer for ${key}`,
//         authType: "testAuthType",
//         authConfig: `authConfig for ${key}`,
//         authInfo: `authInfo for ${key}`
//       };
//     });

//     this.ctx.mockDecode = chai.spy(bearer => {
//       var first = moment().unix();
//       var expiration = moment().add(1, "seconds").unix();
//       return { exp: expiration };
//     });
//     this.ctx.mockJwt = { decode: this.ctx.mockDecode };
//     this.ctx.keys = chai.spy(() => _.keys(context.appConfig.endpoints));
//     this.ctx.mockEndpoint = chai.spy(options => {
//       return P.resolve();
//     });
//     this.ctx.mockEndpoint.uri = "http://thisisatest.com";

//     var authCache = {
//       get: (key) => this.ctx.mockAuthCacheGet(key),
//       keys: this.ctx.keys,
//       flushAll: () => undefined
//     };

//     mockery.enable({
//       warnOnReplace: false,
//       warnOnUnregistered: false,
//       useCleanCache: true
//     });
//     mockery.registerMock("jsonwebtoken", this.ctx.mockJwt);
//     mockery.registerMock("../../../beltlogger.js", {
//       logger: spylogger
//     });
//     this.ctx.authHandler = chai.spy((authConfig, authInfo, forceTokenRefresh) => P.resolve());
//     var EndpointAuth = require('../../middleware/outbounendpointauth.js');
//     this.ctx.endpointAuth = new EndpointAuth({}, authCache, {});
//     this.ctx.endpointAuth.useAuth("testAuthType",
//       (authConfig, authInfo, forceTokenRefresh) => this.ctx.authHandler(authConfig, authInfo, forceTokenRefresh));

//   });

//   afterEach(() => {
//     mockery.disable();
//   });

//   describe("Having a config with no primable endpoints", () => {
//     it("should not prefetch authorization when the endpoint isnt configured to do so", () => {
//       return this.ctx.endpointAuth.prefetchAuthForEndpoint(this.ctx.mockEndpoint).then(() => {
//         expect(this.ctx.mockEndpoint).to.be.a.spy.and.to.not.have.been.called();
//         expect(this.ctx.mockAuthCacheGet).to.be.a.spy.and.to.not.have.been.called();
//       });
//     });
//   });

//   describe("Having a primable endpoint", () => {
//     beforeEach(() => {
//       var originalCacheGet = this.ctx.mockAuthCacheGet;
//       this.ctx.mockAuthCacheGet = chai.spy(key => {
//         return undefined;
//       });

//       this.ctx.authHandler = chai.spy((authConfig, authInfo, forceTokenRefresh) => {
//         this.ctx.mockAuthCacheGet = originalCacheGet;
//         return P.resolve();
//       });
//       this.ctx.mockJwt.decode = chai.spy(bearer => {
//         var expiration = moment().unix() + 903;
//         return { exp: expiration };
//       });
//     });

//     it("should invoke prefetch when directed to do so", () => {

//       return this.ctx.endpointAuth.prefetchAuthForEndpoint(this.ctx.mockEndpoint, this.ctx.mockEndpoint)
//         .then(() => {
//           expect(this.ctx.mockEndpoint).to.be.a.spy.and.to.have.been.called.once;
//           expect(this.ctx.mockEndpoint).to.be.called;
//         })
//         .then(() => P.delay(3000))
//         // should have scheduled another call, which would have executed by now
//         .then(() => {
//           expect(this.ctx.mockAuthCacheGet).to.be.a.spy.and.to.have.been.called.thrice;
//         });
//     });

//     it("should prime the authentication for an external endpoint", () => {
//       _.set(this.ctx.mockEndpoint,
//         "overrides.auth.authConfig.type",
//         "testAuthType");

//       this.ctx.mockEndpoint.uri = "http://dummy.com/livecheck";

//       return this.ctx.endpointAuth.prefetchAuthForEndpoint(this.ctx.mockEndpoint)
//         .then(() => {
//           expect(this.ctx.mockEndpoint).to.be.a.spy.and.to.not.have.been.called;
//           expect(this.ctx.authHandler).to.be.called.once;
//         })
//         .then(() => P.delay(3000))
//         // should have scheduled another call, which would have executed by now
//         .then(() => {
//           expect(this.ctx.mockAuthCacheGet).to.be.a.spy.and.to.have.been.called.thrice;
//           // it was in the cache, but it should have been called again by now
//           expect(this.ctx.authHandler).to.be.called.twice;
//         });
//     });
//   });

//   describe("Gets auth for an endpoint", () => {
//     it("should be able to call an endpoint that advertises its auth method", () => {
//       _.set(this.ctx.mockEndpoint,
//         "overrides.auth.authConfig.type",
//         "testAuthType");

//       return this.ctx.endpointAuth.getAuthForEndpoint(this.ctx.mockEndpoint)
//         .then(auth => {
//           expect(this.ctx.authHandler).to.be.called.once;
//         });
//     });
//   });
// });