/**
 * 在这里定义和用户相关的路由处理函数，供 /router/user.js 模块进行调用
 */

// 导入数据库操作模块
const db = require("../db/index");

// 导入密码加密的库
const bcrypt = require("bcryptjs");

// 用这个包来生成 Token 字符串
const jwt = require('jsonwebtoken')

// 导入配置文件
const config = require('../config')


// 注册用户的处理函数
exports.regUser = (req, res) => {
  // 接受表单数据
  const userinfo = req.body;

  // 定义SQL语句
  const sql = `select * from ev_users where username=?`;
  // 执行SQL语句并根据结果判断用户名是否被占用
  db.query(sql, [userinfo.username], function (err, results) {
    // 执行SQL语句失败
    if (err) {
      return res.cc(err)
    }
    // 用户名被占用
    if (results.length > 0) {
      return res.cc('用户名被占用，请更换其他用户名')
    }
    // TODO: 用户名可用，继续后续流程...
    userinfo.password = bcrypt.hashSync(userinfo.password, 10);
    // 定义插入用户的 SQL 语句
    const sql = `insert into ev_users set ?`;
    db.query(
      sql,
      { username: userinfo.username, password: userinfo.password },
      function (err, results) {
        // 执行 SQL 语句失败
        if (err) return res.cc(err);
        // SQL 语句执行成功，但影响行数不为 1
        if (results.affectedRows !== 1) {
          return res.cc('注册用户失败，请稍后再试！');
        }
        // 注册成功
        res.cc('注册成功！', 0);
      }
    );
  });
};

// 登录的处理函数
exports.login = (req, res) => {
  const userinfo = req.body
  const sql = `select * from ev_users where username=?`
  db.query(sql, userinfo.username, function(err, results) {
    if (err) return res.cc(err)
    if (results.length !== 1) return res.cc('登陆失败')
    // TODO：判断用户输入的登录密码是否和数据库中的密码一致
    // 拿着用户输入的密码,和数据库中存储的密码进行对比
    const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
    // 如果对比的结果等于 false, 则证明用户输入的密码错误
    if (!compareResult) {
        return res.cc('登陆失败')
    }
    // TODO：登录成功，生成 Token 字符串
    // 通过 ES6 的高级语法，快速剔除 `密码` 和 `头像` 的值
    const user = {...results[0], password: '', user_pic: ''}
    const accessToken = jwt.sign(user, config.jwtSecretKey, {expiresIn: '1h'})
    const refreshToken = jwt.sign(user, config.jwtSecretKey, {expiresIn: '3h'})

    // 将生成的 Token 字符串响应给客户端
    res.send({
        status: 0,
        message: '登陆成功！',
        accessToken: 'Bearer ' + accessToken,
        refreshToken: refreshToken
    })
  })
};
