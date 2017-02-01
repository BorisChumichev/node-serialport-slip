# node-serialport-slip

The `node-serialport-slip` is an implementation of the Serial Line Internet Protocol ([RFC 1055](http://www.rfc-editor.org/rfc/rfc1055.txt)) designed to work over serial ports and modem connections. `node-serialport-slip` extends [`node-serialport`](https://github.com/voodootikigod/node-serialport) library which is bult to access serial ports.

> Since `SLIP` is a subclass of `SerialPort` it's worth to read [`node-serialport`](https://github.com/voodootikigod/node-serialport) docs first.

For most use cases you can install `node-serialport-slip` using `npm`:

```
  npm install serialport-slip
```

## Usage

Start with instantiating SLIP:

```js
  var SLIP = require("serialport-slip")
  var slip = new SLIP("path-to-port", {
    baudrate: 57600
  }, {
    'endByte': 0xC0
  });
``` 

Here you can specify (in this order):

1. Path to serial port - required.
1. Options - optional and described in [`node-serialport`](https://github.com/voodootikigod/node-serialport) docs.
1. Protocol definition - optional, described below.

In order to transmit message use `sendMessage` method like so:

```js
  slip.sendMessage(new Buffer([0x10, 0x11, 0x12]), function (err) {
    //error handling routine
  })
``` 

Where `new Buffer([0x10, 0x11, 0x12])` is data that needs to be sent. `serialport-slip` adds a special END byte to it 
, which distinguishes datagram boundaries in the byte stream, also
if the END byte occurs in the data to be sent, the two byte sequence ESC, ESC_END is sent instead,
if the ESC byte occurs in the data, the two byte sequence ESC, ESC_ESC is sent.

Default END, ESC, ESC_END, ESC_ESC hex values are in the following teble:

|Hex value | Abbreviation |  Description|
|-----|-----|---------------------------|
|`0xC0` | END | Frame End|
|`0xDB` | ESC | Frame Escape|
|`0xDC` | ESC_END | Transposed Frame End|
|`0xDD` | ESC_ESC | Transposed Frame Escape|

You are able to extend escaping rules and redefine default hex values, read "Extending protocol" section for details.

Each time incoming message occurs `slip` object fires 'message' event, so in order to handle messages you can do something like:

```js
  slip.on('message', function (message) {
    console.log('Message recieved', message)
  })
``` 

### Extending protocol

Default protocol settings are: 

```js
  {
    "messageMaxLength": 256,
    "endByte": 0xC0,
    "escapeByte": 0xDB,
    "escapeRules": [
      {
        "initialFragment": 0xC0,
        "replacement": 0xDC
      },
      {
        "initialFragment": 0xDB,
        "replacement": 0xDD
      }
    ]  
  }
``` 

You can change settings using third argument while SLIP instantiation like so:

```js
  var slip = new SLIP("path-to-port", {
    baudrate: 57600
  }, {
    'endByte': 0xC3,
    "escapeRules": [
      {
        "initialFragment": 0xC3,
        "replacement": 0xDC
      },
      {
        "initialFragment": 0xDB,
        "replacement": 0xDD
      }
    ]  
  });
``` 

This will change default `0xC0` value for END byte to `0xC3`, and add new escaping rule.
