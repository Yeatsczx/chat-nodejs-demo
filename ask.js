const crypto = require('crypto');
const WebSocket = require('ws');

class DocumentQAndA {
  constructor(APPId, APISecret, TimeStamp, OriginUrl) {
    this.appId = APPId;
    this.apiSecret = APISecret;
    this.timeStamp = TimeStamp;
    this.originUrl = OriginUrl;
  }

  getOriginSignature() {
    const data = this.appId + this.timeStamp;
    const hash = crypto.createHash('md5').update(data).digest('hex');
    return hash;
  }

  getSignature() {
    const signatureOrigin = this.getOriginSignature();
    const signature = crypto
      .createHmac('sha1', this.apiSecret)
      .update(signatureOrigin)
      .digest('base64');
    return signature;
  }

  getHeader() {
    const signature = this.getSignature();
    const header = {
      'Content-Type': 'application/json',
      appId: this.appId,
      timestamp: this.timeStamp,
      signature: signature,
    };
    return header;
  }

  getWebSocketUrl() {
    const signature = this.getSignature();
    const queryString = `?appId=${this.appId}&timestamp=${this.timeStamp}&signature=${signature}`;
    return this.originUrl + queryString;
  }

  getRequestBody() {
    return {
      chatExtends: {
        wikiPromptTpl:
          '请将以下内容作为已知信息：\n<wikicontent>\n请根据以上内容回答用户的问题。\n问题:<wikiquestion>\n回答:',
        wikiFilterScore: 0.83,
        temperature: 0.5,
      },
      fileIds: ['ecb05aa7a434468caea51803775b582e'],
      messages: [
        {
          role: 'user',
          content: '父亲在车站买了什么东西？',
        },
      ],
    };
  }
}
// 添加自己的APPId、APISecret
const APPId = '';
const APISecret = '';
const curTime = Math.floor(Date.now() / 1000).toString();
const OriginUrl = 'wss://chatdoc.xfyun.cn/openapi/chat';

const documentQAndA = new DocumentQAndA(APPId, APISecret, curTime, OriginUrl);
const wsUrl = documentQAndA.getWebSocketUrl();
console.log(wsUrl);

const headers = documentQAndA.getHeader();
const requestBody = documentQAndA.getRequestBody();

const ws = new WebSocket(wsUrl, {
  headers: headers,
});

ws.on('open', function open() {
  ws.send(JSON.stringify(requestBody));
});

ws.on('message', function incoming(data) {
  const message = JSON.parse(data);
  const code = message.code;
  if (code !== 0) {
    console.log(`请求错误: ${code}, ${message}`);
    ws.close();
  } else {
    const content = message.content;
    const status = message.status;
    console.log(content);
    if (status === 2) {
      ws.close();
    }
  }
});

ws.on('error', function error(error) {
  console.error('WebSocket error:', error);
});

ws.on('close', function close() {
  console.log('WebSocket closed');
});
