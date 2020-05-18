const CRLF = '\r\n';
const CRLF_2 = '\r\n\r\n';
const RESPONSE_LINE_REG = /^HTTP\/(\d)\.(\d) (\d{3}) ?(.*)$/;

module.exports = {
  encode: function (options) {
    options.headers = options.headers || {};
    const chunkedEncoding = options.headers['Transfer-Encoding'] === 'chunked';
    const body = options.data;
    const bodyLength = Buffer.byteLength(body);
    if (!chunkedEncoding) {
      options.headers['Content-Length'] = bodyLength;
    }
    let data = `${options.method} ${options.path} HTTP/1.1${CRLF}`;
    Object.keys(options.headers).forEach((key) => {
      data += `${key}: ${options.headers[key]}${CRLF}`;
    });
    data += CRLF;

    if (['POST', 'PUT', 'DELETE'].indexOf(options.method) > -1) {
      if (body) {
        if (chunkedEncoding) {
          data += `${bodyLength.toString(16)}${CRLF}`;
        }
        data += `${body}${CRLF}`;
      }
      if (chunkedEncoding) {
        data += `0${CRLF_2}`;
      }
    }
    return data;
  },

  decode: function (data) {
    const idx = data.indexOf(CRLF);
    const idx2 = data.indexOf(CRLF_2);
    const responseLineText = data.slice(0, idx);
    const responseHeadersText = data.slice(idx + 2, idx2);
    let responseBodyText = data.slice(idx2 + 4);

    // response line parse
    const responseLineMatch = RESPONSE_LINE_REG.exec(responseLineText);
    const statusCode = +responseLineMatch[3];
    const statusMessage = responseLineMatch[4];

    // response header parse
    let headers = {};
    responseHeadersText.split(CRLF).forEach((item) => {
      const index = item.indexOf(': ');
      const key = item.slice(0, index).toLowerCase();
      if (headers[key]) {
        headers[key] = headers[key] + ', ' + item.slice(index + 2);
      } else {
        headers[key] = item.slice(index + 2);
      }
    });
    if (headers['transfer-encoding']) {
      const idx = responseBodyText.indexOf(CRLF);
      if (idx > -1) {
        responseBodyText = responseBodyText.slice(idx + 2);
      }
      const idx2 = responseBodyText.lastIndexOf('\r\n0');
      if (idx2 > -1) {
        responseBodyText = responseBodyText.slice(0, idx2);
      }
    }

    return {
      statusCode,
      statusMessage,
      headers,
      data: responseBodyText,
    };
  },
};
