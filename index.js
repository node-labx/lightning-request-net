const Connection = require('./connection');
const httpParser = require('./http_parser');

const userAgent = 'LightningHttpClient/0.0.1';

class HttpRequestClient {
  constructor(options) {
    this.options = options;

    this.conn = new Connection(this.options);
  }

  get defaultHeaders() {
    return {
      Host: `${this.options.host}:${this.options.port}`,
      'Content-Type': 'application/json',
      'User-Agent': userAgent,
      'Transfer-Encoding': 'chunked',
      Connection: 'keep-alive',
    };
  }

  async request(options) {
    const _this = this;
    const method = (options.method || 'GET').toUpperCase();
    const path = options.path || '/';
    const headers = Object.assign({}, this.defaultHeaders, options.headers || {});
    const responseType = options.responseType || 'text';

    const data = httpParser.encode({
      method,
      path,
      headers,
      data: options.data,
    });

    return new Promise((resolve, reject) => {
      this.conn.write(
        data,
        function(resp) {
          let result = httpParser.decode(resp);
          if (result.statusCode === 200 && responseType === 'json') {
            result.data = JSON.parse(result.data);
          }
          resolve(result);
        },
        function(error) {
          reject(error);
        }
      );
    });
  }
}

module.exports = HttpRequestClient;
