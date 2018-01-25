const db = require('../db');

module.exports = db.defineModel('article', {
    datetime: db.INTEGER,
    title: db.STRING(256),
    digest: db.STRING(256),
    fileid: db.INTEGER,
    content_url: db.STRING(256),
    source_url: db.STRING(256),
    cover: db.STRING(256),
    account: db.STRING(256)
});
