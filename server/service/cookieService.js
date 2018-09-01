const TokenTimeout = 800000;

module.exports = {
  addSessionCookie: (login, token, res) => {
    res.cookie('login', login, {
      maxAge: TokenTimeout,
      httpOnly: false
    });
    res.cookie('token', token, {
      maxAge: TokenTimeout,
      httpOnly: false
    });
  }
};
