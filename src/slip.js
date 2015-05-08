'use strict';

/**
 * Dependencies
 */
var SerialPort = require("serialport").SerialPort
  , util = require('util')
  , bt = require('buffertools')
  , SLIPMessage = require('./slip-message.js')

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
  SLIPMessage.applyProtocol(protocol)
  this.protocol_ = protocol
  this.endByte_ = new Buffer([protocol.endByte])
  // register on data handler
  this.on('data', function(data) {
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
  var message = new SLIPMessage(buffer)
    , that = this
  this.write(message, function (err) {
    if (err) return callback(err)
    this.write(that.endByte_, callback)
  })
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

  return function (data) {
    var endIndex = bt.indexOf(data, this.endByte_)
    if (endIndex === -1) {
      //chunk has no endByte, pushing it to temporary buffer
      writeCursor += data.copy(temporaryBuffer, writeCursor)
    } else {
      if (endIndex > 0) //chunk has data before endByte
        writeCursor += data.copy(temporaryBuffer, writeCursor, 0, endIndex)
      //copy data from temporary buffer to a new buffer and fire 'message'
      var messageBuffer = new Buffer(writeCursor)
      temporaryBuffer.copy(messageBuffer, 0, 0, writeCursor)
      this.emit('message', SLIPMessage.unescape(messageBuffer))
      writeCursor = 0
      if (data.length-1 > endIndex) //if has data after endByte
        writeCursor += data.copy(temporaryBuffer, 0, endIndex+1, data.length)
    }
  }
})()

module.exports = SLIP
