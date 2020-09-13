const tokens = {};

class Token {
    static issueToken(user, done) {
        const token = Token.randomString(64);
        Token.saveRememberMeToken(token, user.id, function(err) {
            if (err) { return done(err); }
            return done(null, token);
        });
    }

    static consumeRememberMeToken(token, fn) {
        const uid = tokens[token];
        // invalidate the single-use token
        delete tokens[token];
        return fn(null, uid);
    }

    static saveRememberMeToken(token, uid, fn) {
        tokens[token] = uid;
        return fn();
    }

    static randomString(len) {
        const buf = []
            , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            , charlen = chars.length;

        for (let i = 0; i < len; ++i) {
            buf.push(chars[Token.getRandomInt(0, charlen - 1)]);
        }

        return buf.join('');
    }

    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}
module.exports = {
    Token,
};

