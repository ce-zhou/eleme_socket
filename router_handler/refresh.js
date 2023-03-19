const jwt = require("jsonwebtoken");
const config = require("../config");

exports.regRefresh = (req, res) => {
  const refreshToken = req.body.refresh_token;
  if (refreshToken) {
    jwt.verify(refreshToken, config.jwtSecretKey, (err, decoded) => {
      if (err) {
        if (err.name == "TokenExpiredError") {
          //token过期
          res.cc('token过期', 400)
          return str;
        } else if (err.name == "JsonWebTokenError") {
          //无效的token
          res.cc('无效的token', 402)
          return str;
        }
      } else {
        console.log(decoded);
        delete decoded.iat 
        delete decoded.exp
        // console.log(decoded);
        const user = {...decoded, password: '', user_pic: ''}
        const accessToken = jwt.sign(user, config.jwtSecretKey, {expiresIn: '1h'})
        // 更新accessToken和refreshToken
        res.send({
            status: 0,
            message: '登陆成功！',
            accessToken: 'Bearer ' + accessToken,
        })
      }
    });
  } else {
    res.cc('The required parameters were not sent in the request', 401)
  }
};
