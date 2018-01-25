const fs = require('fs');
const qs = require('querystring');
const model = require('../model');
const URL = require('url');
const unescape = require('unescape-html');
const request = require("request");

let Account = model.Account;
let Article = model.Article;

// const parseHistList = async (content) => {
//   console.log('******parseHistList*****');
//   // console.log(content);
//   content = JSON.parse(unescape(content)).list;
//   console.log(content);
//   if (content) {
//     saveArticle(content);
//   }
// }

const saveArticle = async (biz, content) => {
  console.log(biz, '8888888*****************8888888888');
  for (let item of content) {
    if (item.comm_msg_info.type === 49) {
      let datetime = item.comm_msg_info.datetime,
        title = item.app_msg_ext_info.title,
        digest = item.app_msg_ext_info.digest,
        fileid = item.app_msg_ext_info.fileid,
        content_url = item.app_msg_ext_info.content_url,
        source_url = item.app_msg_ext_info.source_url,
        cover = item.app_msg_ext_info.cover,
        is_multi = item.app_msg_ext_info.is_multi,
        multi_app_msg_item_list = item.app_msg_ext_info.multi_app_msg_item_list;
      console.log(is_multi, '******content^^^&&&%%%');
      try {
        let article_data = await Article.findOrCreate({
          where: {
            id: fileid
          },
          defaults: {
            datetime,
            title,
            digest,
            fileid,
            content_url,
            source_url,
            cover,
            account: biz,
            id: fileid
          }
        });
      } catch (error) {
        console.log(error);
      }
      if (is_multi > 0) {
        for (let sub_item of multi_app_msg_item_list) {
          console.log('***subitem****');
          title = sub_item.title;
          digest = sub_item.digest;
          fileid = sub_item.fileid;
          content_url = sub_item.content_url;
          source_url = sub_item.source_url;
          cover = sub_item.cover;
          try {
            let new_obj = await Article.findOrCreate({
              where: {
                id: fileid
              },
              defaults: {
                datetime,
                title,
                digest,
                fileid,
                content_url,
                source_url,
                cover,
                account: biz,
                id: fileid
              }
            });
          } catch (e) {
            console.log(e);
          }
        }
      }
    }
  }
}

const fetchMoreMsg = async(biz, reqUrl, params, offset) => {
  let {
    setcookie,
    reqcookie,
    wechatkey,
    wechatuin,
    appmsg_token
  } = params;
  let setcookies = qs.parse(setcookie);
  let is_continue = 0,
    pass_ticket = setcookies['pass_ticket'],
    wap_sid2 = setcookies['wap_sid2'];
  let getMsgUrl = 'https://mp.weixin.qq.com/mp/profile_ext?action=getmsg&__biz=' + biz + '&f=json&offset=' + offset + '&count=10&is_ok=1&scene=124&uin=777&key=777&pass_ticket=' + pass_ticket + '&wxtoken=&appmsg_token=' + appmsg_token + '&x5=0&f=json';
  let headers = {},
    wxtokenkey = '';
  console.log(getMsgUrl, '********testtest*****');
  for (let item of reqcookie.split('; ')) {
    if (item.split('=')[0] === 'wxtokenkey') {
      wxtokenkey = item.split('=')[1];
    }
  }
  let cookie = 'devicetype=iOS10.2.1; lang=zh_CN; pass_ticket=' + pass_ticket + '; version=16060125; wap_sid2=' + wap_sid2 + '; wxuin=1190142921; rewardsn=; wxtokenkey=' + wxtokenkey;
  headers = {
    'Host': 'mp.weixin.qq.com',
    'Cookie': cookie,
    'Connection': 'keep-alive',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Mobile/14D27 MicroMessenger/6.6.1 NetType/WIFI Language/zh_CN',
    'Referer': reqUrl,
    'Accept-Language': 'zh-cn',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': '*/*'
  };

  let options = {
    method: 'GET',
    url: getMsgUrl,
    headers: headers,
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    body = JSON.parse(body);
    // console.log(body);
    let code = body['ret'];
    if (code === 0) {
      is_continue = body['can_msg_continue'];
      offset = body['next_offset'];
      let msg_list = JSON.parse(body['general_msg_list']).list;
      console.log(msg_list.length, '&&&&&&&&&&&&&&&&&66666666666666&&&&&&&&');
      if (msg_list && msg_list.length > 0) {
        try {
          (async () => {
            await saveArticle(biz, msg_list);
            console.log(offset, '***************Success1111111***************');
            if (offset > 0 && is_continue > 0) {
              setTimeout(() => {
                (async () => {
                  await fetchMoreMsg(biz, reqUrl, params, offset);
                })();
              }, 1000);
            }
          })();
        } catch (error) {
          console.log(error, '!!!!!!error******');
        }
      }
    }
  });

}

module.exports = {
  'POST /fetchHistList': async(ctx, next) => {
    let url = decodeURIComponent(ctx.request.body.url),
      content = ctx.request.body.content,
      params = ctx.request.body.params;
    // console.log(ctx.request.body, '^^^^^^^^6body&&&&&&&&&&');
    let params_obj = qs.parse(qs.unescape(params));
    let {
      setcookie,
      reqcookie,
      wechatkey,
      wechatuin,
      appmsg_token
    } = params_obj;
    let parse_url = URL.parse(url).query.split('&'),
      biz = parse_url[1].slice(6);
    let time = Math.round(Date.now() / 1000); //转换为10位时间戳

    let account_data = await Account.findOne({
      where: {
        biz: biz
      }
    });

    if (!account_data) {
      console.log('&&&&&&&&create_Account&&&&&&&&');
      await Account.create({
        name: '',
        biz,
        time,
        setcookie,
        reqcookie,
        wechatkey,
        wechatuin,
        appmsg_token
      });
    } else {
      // 已经存在该公众号信息，更新cookie等参数
      await Account.update({
        time,
        setcookie,
        reqcookie,
        wechatkey,
        wechatuin,
        appmsg_token
      }, {
        where: {
          biz: biz
        }
      });
      console.log('*****update Account****');
    }
    // parseHistList(content);
    //构造新的请求获取历史列表数据
    await fetchMoreMsg(biz, url, params_obj, 0);
    // console.log(next_offset, '*************$$$$$$$$$$$$$%%%%%%%%%%');
    // while (next_offset > 0) {
    //   setTimeout(() => {
    //     next_offset = fetchMoreMsg(biz, url, params_obj, next_offset);
    //   }, 2000);
      
    // }
    // 将url, content格式化后存入数据库
    // fs.writeFile('test.txt',content, function(err){ 
    //   if(err){ 
    //     console.log(err); 
    //   }
    // });
    ctx.response.body = {
      code: 200,
      msg: 'success'
    };
  },

  'POST /fetchMsgJson': async(ctx, next) => {}
};
