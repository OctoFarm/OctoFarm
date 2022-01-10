class NotImplementedException extends Error {
  constructor(message) {
    super(message);
    this.name = "NotImplementedException";
  }
}

class NotFoundException extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundException";
  }
}

class ValidationException extends Error {
  constructor(validationObject) {
    super(JSON.stringify(validationObject));
    this.name = "ValidationException";
    this.errors = validationObject;
  }
}

module.exports = {
  NotImplementedException,
  NotFoundException,
  ValidationException
};
