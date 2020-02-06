⚡ Lightweight Node.js HTTP client based on net.

![logo](./logo.png)

## Install

```
npm i lightning-request-net --save
```

## Use lightning-request-net

First, require the library.

```
const HttpRequestClient = require('lightning-request-net');
const client = new HttpRequestClient({
  host: 'www.example.com',
  port: 8680,
});
```

Then let's make a request in an async function.

```
(async function() {
  try {
    const result = await client.request({
      method: 'POST',
      path: '/foo',
    });
    console.log(result.statusCode); // response status code
    console.log(result.data); // response data
  } catch (error) {
    console.log(error);
  }
})();
```

## Request Config

These are the available config options for making requests. Only the path is required. Requests will default to GET if method is not specified.

```
{
  // `method` is the request method to be used when making the request
  method: 'get', // default

  // `path` is the server URL that will be used for the request
  path: '/foo',

  // `headers` are custom headers to be sent
  headers: {'Content-Type': 'application/json'},

  // `data` is the data to be sent as the request body
  data: {
    foo: 'bar'
  },

  // `timeout` specifies the number of milliseconds before the request times out.
  // If the request takes longer than `timeout`, the request will be aborted.
  timeout: 3000, // default is `3000` milliseconds

  // `responseType` indicates the type of data that the server will respond with
  // options are: 'json', 'text'
  responseType: 'json', // default
}
```

## Response Schema

The response for a request contains the following information.

```
{
  // `statusCode` is the HTTP status code from the server response
  statusCode: 200,

  // `statusMessage` is the HTTP status message from the server response
  statusMessage: 'OK',

  // `headers` the headers that the server responded with All header names are lower cased
  headers: {},

  // `data` is the response data that was provided by the server
  data: {}
}
```

## Contributing

- Fork this repo
- Clone your repo
- Install dependencies
- Checkout a feature branch
- Feel free to add your features
- Make sure your features are fully tested
- Open a pull request, and enjoy <3

## License

[MIT](LICENSE)
