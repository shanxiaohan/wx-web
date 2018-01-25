const db = require('../db');

module.exports = db.defineModel('account', {
    name: db.STRING(256),
    biz: db.STRING(256),
    time: db.INTEGER,
    setcookie: db.STRING(256),
    reqcookie: db.STRING(256),
    wechatkey: db.STRING(256),
    wechatuin: db.STRING(256),
    appmsg_token: db.STRING(256)
});
