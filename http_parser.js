module.exports = {
  encode: function(options) {
    options.headers = options.headers || {};
    const chunkedEncoding = options.headers['Transfer-Encoding'] === 'chunked';
    const body = options.data ? JSON.stringify(options.data) : '';
    const bodyLength = Buffer.byteLength(body);
    if (!chunkedEncoding) {
      options.headers['Content-Length'] = bodyLength;
    }
    let data = `${options.method} ${options.path} HTTP/1.1
${Object.entries(options.headers)
  .map(([k, v]) => `${k}: ${v}`)
  .join('\r\n')}`;

    data += '\r\n\r\n';
    if (['POST', 'PUT', 'DELETE'].indexOf(options.method) > -1) {
      if (body) {
        if (chunkedEncoding) {
          data += `${bodyLength.toString(16)}\r\n`;
        }
        data += `${body}\r\n`;
      }
      if (chunkedEncoding) {
        data += '0\r\n\r\n';
      }
    }
    return data;
  },

  decode: function(data) {
    const idx = data.indexOf('\r\n');
    const idx2 = data.indexOf('\r\n\r\n');
    const responseLineText = data.slice(0, idx);
    const responseHeadersText = data.slice(idx + 2, idx2);
    const responseBodyText = data.slice(idx2 + 4);

    // response line parse
    const responseLineMatch = /^HTTP\/(\d)\.(\d) (\d{3}) ?(.*)$/.exec(responseLineText);
    const statusCode = +responseLineMatch[3];
    const statusMessage = responseLineMatch[4];

    // response header parse
    let headers = {};
    responseHeadersText.split('\r\n').forEach(item => {
      const index = item.indexOf(': ');
      headers[item.slice(0, index)] = item.slice(index + 2);
    });

    return {
      statusCode,
      statusMessage,
      headers,
      data: responseBodyText,
    };
  },
};
