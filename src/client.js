const jsonParse = require('zan-json-parse').default;
const Connection = require('./connection');
const httpParser = require('./http_parser');
const Pool = require('./pool');
const pkg = require('../package.json');

const userAgent = `lrn/${pkg.version}`;

class HttpRequestClient {
  constructor(options) {
    this.options = options || {};
    this.options.poolOptions = Object.assign({}, this.options.poolOptions || {});

    const factory = {
      create: () => {
        return new Connection(this.options);
      },
    };
    this.pool = new Pool(factory, this.options.poolOptions);
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
    const method = (options.method || 'GET').toUpperCase();
    const path = options.path || '/';
    const headers = Object.assign({}, this.defaultHeaders, options.headers || {});
    const responseType = options.responseType || 'json';
    const timeout = options.timeout || 3000;

    const data = httpParser.encode({
      method,
      path,
      headers,
      data: options.data ? JSON.stringify(options.data) : '',
    });

    return new Promise((resolve, reject) => {
      const conn = this.pool.acquire();
      let flag = false;
      const handler = setTimeout(() => {
        flag = true;
        reject(new Error('request timeout'));
      }, timeout);

      conn.send(
        data,
        resp => {
          if (flag) {
            return;
          }
          let result = httpParser.decode(resp);
          if (result.statusCode === 200 && responseType === 'json') {
            if (options.allowBigNumberInJSON) {
              result.data = jsonParse(result.data);
            } else {
              result.data = JSON.parse(result.data);
            }
          }
          clearTimeout(handler);
          resolve(result);
          this.pool.release(conn);
        },
        error => {
          if (flag) {
            return;
          }
          clearTimeout(handler);
          reject(error);
          this.pool.release(conn);
        }
      );
    });
  }
}

module.exports = HttpRequestClient;
