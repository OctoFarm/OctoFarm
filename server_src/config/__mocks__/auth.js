const auth = jest.createMockFromModule("../auth");

auth.ensureAuthenticated = async (req, res, next) => next();

module.exports = auth;

