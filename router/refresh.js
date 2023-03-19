// 重新刷新access token 接口
const express = require('express')

const router = express.Router()

const refreshHandler = require('../router_handler/refresh')

// 刷新access token
router.post('/refresh', refreshHandler.regRefresh)

// 将路由对象共享出去
module.exports = router