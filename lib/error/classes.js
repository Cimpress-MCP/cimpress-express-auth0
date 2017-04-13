// Returned when a tenant does not exist
function TenantNotFound(additionalData) {
  this.humanReadableMessage = "The requested tenant does not exist.";
  this.additionalData = additionalData || {};
  this.stack = '';
}
TenantNotFound.prototype = Object.create(Error.prototype);

function UserNotFound(additionalData) {
  this.humanReadableMessage = "The requested user does not exist.";
  this.additionalData = additionalData || {};
  this.stack = '';
}
UserNotFound.prototype = Object.create(Error.prototype);

function UserDataWriteError(additionalData) {
  this.humanReadableMessage = "The requested user meta data could not be written";
  this.additionalData = additionalData || {};
  this.stack = '';
}
UserDataWriteError.prototype = Object.create(Error.prototype);

module.exports.UserNotFound = UserNotFound;
module.exports.TenantNotFound = TenantNotFound;
module.exports.UserDataWriteError = UserDataWriteError;