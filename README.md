![Build Status](https://travis-ci.org/Cimpress-MCP/cimpress-express-auth0.svg?branch=master)

# cimpress-express-auth0
Express.js middleware designed for managing a web application's interactions with the Auth0 SDK.

## Installation
`npm install cimpress-express-auth0 --save`, or

`yarn add cimpress-express-auth0`

## Usage

### Auth0 Verification
The config object passed in must have the following sections and fields:

```js
var config = {
  secret: 'The client secret, only needed for OAuth v1',
  clientId: 'Your own client id, only needed for OAuth v1',
  domain: 'The token issuer w/o https:// or the trailing /',
  realm: 'The realm of the token, used in the challenge headers, full url (w/ https:// and  trailing /)',
  jwksUrl: 'The url to retrieve the jwk from, only needed for OAuth v2',
  audience: 'The audience for the auth token',
  enableV1: 'Should auth v1 be enabled (defaults to true), not required',
  excludedRoutes (OPTIONAL): [  // Routes that shouldn't be protected by Auth0
    {
      url: '/healthcheck',  // Supports a regex as well
      methods: ['GET'],   // Optional, if none specified then assumes all methods shouldn't   use auth0
    },
  ],
};
```

This library also supports the 'express-unless' library.

You must also pass in a cache object, used for only OAuth v2, with the following two functions:
```js
- get(string key) { // Must return a promise
    return (The value associated with the key);
  }
- set(string key, string value, int TTL) {
    return;
  }
```

```js
const auth = require('cimpress-express-auth0');
const express = require('express');
const config = require('./config');
const cache = require('./cache');

const logger = console;
const app = express();

auth(app, config, logger, cache).then(() => {
  app.get('/healthcheck', someHealthcheckController);
  app.listen(3000);
});
```

### Secret Management
We highly recommend against keeping values such as your secret as plain text in any configuration. Instead you should use some kind of secure secrets manager. One recommended library is the [aws-secrets] library (https://github.com/Cimpress-MCP/aws-secrets).

## Development
We are using [semantic-release](https://github.com/semantic-release/semantic-release) with [AngularJS Git Commit Message conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit). Please ensure that you use that commit message format so that publishing happens as needed. We recommend using [commitizen](https://github.com/commitizen/cz-cli) for that.
