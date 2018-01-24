const fs = require('fs'); 

module.exports = {
  'POST /fetchHistList': async (ctx, next) => {
    let url = ctx.request.body.url,
        content = ctx.request.body.content,
	params = ctx.request.body.params;
    console.log(url, '****url****');
    console.log(params, '****content****');
    // 将url, content格式化后存入数据库
    fs.writeFile('test.txt',content, function(err){ 
      if(err){ 
        console.log(err); 
      }
    });
    ctx.response.body = {code: 200, msg:'success'};
  },

  'POST /fetchMsgJson': async(ctx, next) => {
  }
};
