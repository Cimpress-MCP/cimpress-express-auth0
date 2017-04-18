![Build Status](https://travis-ci.org/Cimpress-MCP/cimpress-express-auth0.svg?branch=master)

# cimpress-express-auth0
Express.js middleware designed for managing a web application's interactions with the Auth0 SDK.

## Installation
`npm install cimpress-express-auth0 --save`, or

`yarn add cimpress-express-auth0`

## Usage

### Auth0 Verification
The config object passed in must have the following sections and fields:

Section: app.auth0
Fields:
* domain: The token issuer w/o https:// or the trailing /
* realm: The realm of the token, used in the challenge headers, full url (w/ https:// and trailing /)
* jwksUrl: The url to retrieve the jwk from, only needed for OAuth v2

Section: app.auth0.application
Fields:
* secret: The client secret, not needed for OAuth v2
* clientId: Your own client id
* resourceServer: The audience for the auth token
* excludedRoutes (Optional): Routes that shouldn't be protected by Auth0

You can also pass in a cache object, used for only OAuth v2, with the following two functions:
- get(string kid){
  return (The base64 encoded public key)
}
- set(string kid, string encodedPublicKey, int TTL) {
  return;
}

## Development
We are using [semantic-release](https://github.com/semantic-release/semantic-release) with [AngularJS Git Commit Message conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit). Please ensure that you use that commit message format so that publishing happens as needed. We recommend using [commitizen](https://github.com/commitizen/cz-cli) for that.
