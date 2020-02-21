const net = require('net');
const Debug = require('debug');
const debug = Debug('conn:');

function loop() {}

class Connection {
  get defaultOptions() {
    return {
      keepAlive: true,
      idleTimeout: 60 * 1000,
    };
  }

  get destroyed() {
    return this.socket.destroyed;
  }

  constructor(options = {}) {
    this.options = Object.assign(this.defaultOptions, options);
    this.socket = null;
    this.ready = false;
    this.writeCacheData = null;

    this.successCall = loop;
    this.failCall = loop;

    this.contentLength = 0;
    this.chunked = false;

    this.bodySize = 0;
    this.data = ''; // received data
    this.dataCount = 0; // received data count

    this.connect();
  }

  connect() {
    this.socket = new net.Socket();
    this.socket.setTimeout(this.options.idleTimeout);
    this.socket.setKeepAlive(this.options.keepAlive);
    this.socket.connect(this.options.port, this.options.host);
    this.socket.setEncoding('utf8');

    this.socket
      .on('lookup', () => {
        // Emitted after resolving the hostname but before connecting. Not applicable to Unix sockets.
        debug('socket event -> lookup');
      })
      .on('connect', () => {
        // Emitted when a socket connection is successfully established.
        debug('socket event -> connect');
      })
      .on('ready', () => {
        // Emitted when a socket is ready to be used.
        debug('socket event -> ready');
        this.ready = true;
        if (this.writeCacheData) {
          this.socket.write(this.writeCacheData);
          this.writeCacheData = null;
        }
      })
      .on('data', chunk => {
        // Emitted when data is received.
        debug('socket event -> data');
        this.dataCount++;

        if (this.dataCount === 1) {
          const contentLengthIndex = chunk.indexOf('Content-Length: ');
          const transferEncodingIndex = chunk.indexOf('Transfer-Encoding: chunked');

          if (contentLengthIndex > -1) {
            this.chunked = false;
            this.data = chunk;
            this.contentLength = parseInt(chunk.slice(contentLengthIndex + 16, contentLengthIndex + 26).toString());
            const idx = chunk.indexOf('\r\n\r\n');
            this.bodySize += Buffer.byteLength(chunk) - idx - 4;

            if (this.bodySize >= this.contentLength) {
              this.successCall(this.data);
              this.release();
            }
          } else if (transferEncodingIndex > -1) {
            this.chunked = true;
            this.data = chunk.replace(/\r\n\r\n.*\r\n/, '\r\n\r\n');
            const idx = this.data.indexOf('0\r\n\r\n');
            if (idx > -1) {
              this.data = this.data.slice(0, idx - 2);
              this.successCall(this.data);
              this.release();
            }
          }
        } else {
          if (this.chunked) {
            const idx = chunk.indexOf('0\r\n\r\n');
            if (idx > -1) {
              this.data += chunk.slice(0, idx - 2);
              this.successCall(this.data);
              this.release();
            } else {
              this.data += chunk;
            }
          } else {
            this.data += chunk;
            this.bodySize += Buffer.byteLength(chunk);
            if (this.bodySize >= this.contentLength) {
              this.successCall(this.data);
              this.release();
            }
          }
        }
      })
      .on('timeout', () => {
        // Emitted if the socket times out from inactivity. This is only to notify that the socket has been idle.
        // The user must manually close the connection.
        debug('socket event -> timeout');
        this.socket.end();
      })
      .on('drain', () => {
        // Emitted when the write buffer becomes empty. Can be used to throttle uploads.
        debug('socket event -> drain');
      })
      .on('end', () => {
        // Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.
        debug('socket event -> end');
      })
      .on('error', err => {
        // Emitted when an error occurs. The 'close' event will be called directly following this event.
        debug('socket event -> error');
        this.failCall(err);
      })
      .on('close', () => {
        // Emitted once the socket is fully closed.
        // The argument hadError is a boolean which says if the socket was closed due to a transmission error.
        debug('socket event -> close');
        this.ready = false;
        this.release();
        if (!this.socket.destroyed) {
          this.socket.destroy();
        }
      });
  }

  release() {
    this.writeCacheData = null;
    this.successCall = loop;
    this.failCall = loop;
    this.contentLength = 0;
    this.chunked = false;
    this.bodySize = 0;
    this.data = '';
    this.dataCount = 0;
  }

  send(data, successCall, failCall) {
    this.successCall = successCall;
    this.failCall = failCall;
    debug('socket ready status check');
    if (this.ready) {
      debug('socket start send');
      this.socket.write(data);
    } else {
      debug('data temporary cache');
      this.writeCacheData = data;
    }
  }
}

module.exports = Connection;
