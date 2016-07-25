'use strict';

/**
 * Dependencies
 */
var SerialPort = require("serialport")
    , util = require('util')
    , bt = require('buffertools')
    , SLIPMessage = require('./slip-message.js')
    , fs = require('fs')
    , defaultProtocolDefinition = JSON.parse(fs.readFileSync(__dirname + '/default-protocol-definition.json', {encoding: 'utf8'}))
    , _ = require('underscore')

/**
 * @param {String} path           path to serial port
 * @param {Object} options        options object
 * @param {Object} protocol       protocol definition object
 * @constructor
 */
var SLIP = function (path, options, protocol) {
  var that = this
  //super constructor call
  SerialPort.call(this, path, options)
  protocol = _.defaults(protocol ? protocol : {}, defaultProtocolDefinition)
  SLIPMessage.applyProtocol(protocol)
  this.protocol_ = protocol
  this.endByte_ = new Buffer([protocol.endByte])
  // register on data handler
  this.on('data', function (data) {
    that.collectDataAndFireMessageEvent_(data)
  })
}

util.inherits(SLIP, SerialPort)

/**
 * Sends message to device
 * @param  {String}   data     Data array that need to be sent
 * @param  {Function} callback This will fire after sending
 */
SLIP.prototype.sendMessage = function (buffer, callback) {
  var that = this;
  var message = Buffer.concat([new SLIPMessage(buffer), that.endByte_]);
  this.write(message, callback);
}

/**
 * Sends message to device, waiting for all data to be transmitted to the
 * serial port before calling the callback.
 * @param  {String}   data     Data array that need to be sent
 * @param  {Function} callback This will fire after sending
 */
SLIP.prototype.sendMessageAndDrain = function (buffer, callback) {
  var that = this;
  var message = Buffer.concat([new SLIPMessage(buffer), that.endByte_]);
  this.write(message, function (err) {
    if (err) return callback(err);
    this.drain(callback);
  });
}

/**
 * Stores recieved bytes to a temporary array till endByte
 * appears in the chunk then fires 'message' event
 * @private
 * @param  {Buffer}   data
 */
SLIP.prototype.collectDataAndFireMessageEvent_ = (function () {
  var temporaryBuffer = new Buffer(256)
      , writeCursor = 0
      , emptyBuffer = new Buffer(256);

  bt.clear(emptyBuffer);

  return function (data) {
    var endIndex = bt.indexOf(data, this.endByte_);
    if (endIndex === -1) {
      //chunk has no endByte, pushing it to temporary buffer
      writeCursor += data.copy(temporaryBuffer, writeCursor);
    } else {
      if (endIndex > 0) {
        //chunk has data before endByte
        writeCursor += data.copy(temporaryBuffer, writeCursor, 0, endIndex);
      }
      //copy data from temporary buffer to a new buffer and fire 'message'
      var messageBuffer = new Buffer(writeCursor);

      // Don't send a message if the buffer is empty and all we received was an end byte
      if (!bt.equals(temporaryBuffer, emptyBuffer) || writeCursor !== 0) {
        temporaryBuffer.copy(messageBuffer, 0, 0, writeCursor);
        this.emit('message', SLIPMessage.unescape(messageBuffer));

      }

      bt.clear(temporaryBuffer);

      writeCursor = 0;

      if (data.length - 2 > endIndex) {
        //if has data after endByte
        writeCursor += data.copy(temporaryBuffer, 0, endIndex + 1, data.length);
      }
    }
  }
})()

module.exports = SLIP
