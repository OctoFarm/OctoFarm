class NotImplementedException extends Error {
  constructor(message) {
    super(message);
    this.name = NotImplementedException.name;
  }
}

class NotFoundException extends Error {
  constructor(message) {
    super(message);
    this.name = NotFoundException.name;
  }
}

class ValidationException extends Error {
  constructor(validationObject) {
    super(JSON.stringify(validationObject));
    this.name = ValidationException.name;
    this.errors = validationObject;
  }
}

class ExternalServiceError extends Error {
  constructor(responseObject) {
    super(JSON.stringify(responseObject));
    this.name = ExternalServiceError.name;
    this.error = responseObject;
  }
}

module.exports = {
  NotImplementedException,
  NotFoundException,
  ExternalServiceError,
  ValidationException
};
