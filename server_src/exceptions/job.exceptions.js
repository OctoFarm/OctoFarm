class JobValidationException extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "JobValidationError"; // (2)
  }
}

module.exports = {
  JobValidationException
};
