const fs = require('fs'); 

module.exports = {
  'POST /fetchHistList': async (ctx, next) => {
    let url = ctx.request.body.url,
        content = ctx.request.body.content;
    console.log(url, '****url****');
    console.log(content, '****content****');
    fs.readFile('test.txt',content, function(err){ 
      if(err){ 
        console.log(err); 
      }
    });
  }
};