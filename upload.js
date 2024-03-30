const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

class DocumentUpload {
  constructor(APPId, APISecret, timestamp) {
    this.APPId = APPId;
    this.APISecret = APISecret;
    this.Timestamp = timestamp;
  }

  getOriginSignature() {
    const data = this.APPId + this.Timestamp;
    const hash = crypto.createHash('md5').update(data).digest('hex');
    return hash;
  }

  getSignature() {
    const signatureOrigin = this.getOriginSignature();
    const signature = crypto
      .createHmac('sha1', this.APISecret)
      .update(signatureOrigin)
      .digest('base64');
    return signature;
  }

  getHeader(formData) {
    const signature = this.getSignature();
    const headers = {
      ...formData.getHeaders(),
      appId: this.APPId,
      timestamp: this.Timestamp,
      signature: signature,
    };
    return headers;
  }

  async uploadDocument() {
    const formData = new FormData();
    formData.append('file', fs.createReadStream('背影.txt'));
    formData.append('url', '');
    formData.append('fileName', '背影.txt');
    formData.append('fileType', 'wiki');
    formData.append('needSummary', 'false');
    formData.append('stepByStep', 'false');
    formData.append('callbackUrl', 'your_callbackUrl');

    const headers = this.getHeader(formData);

    try {
      const response = await axios.post(
        'https://chatdoc.xfyun.cn/openapi/fileUpload',
        formData,
        { headers }
      );
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

if (require.main === module) {
  // 添加自己的APPId、APISecret
  const APPId = '';
  const APISecret = '';
  const curTime = Math.floor(Date.now() / 1000).toString();

  const documentUpload = new DocumentUpload(APPId, APISecret, curTime);
  documentUpload.uploadDocument();
}
