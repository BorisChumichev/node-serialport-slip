'use strict';

/**
 * dependencies
 */
var bt = require('buffertools')
    , _ = require('underscore')

/**
 * SLIPMessage class
 * @constructor
 */
var SLIPMessage = function (buffer) {
  return this.escape_(buffer)
};

/**
 * Unescaping message
 *
 * @param  {[type]} initialBuffer      message to unescape
 */
SLIPMessage.unescape = function (initialBuffer) {
  var unescapedBytes = [];
  for (var i = 0; i < initialBuffer.length; i++) {
    initialBuffer[i] === this.protocol_.escapeByte ?
        unescapedBytes.push(_.findWhere(SLIPMessage.protocol_.escapeRules,
            {replacement: initialBuffer[++i]}).initialFragment) : unescapedBytes.push(initialBuffer[i]);
  }

  return new Buffer(unescapedBytes);
};

/**
 * Stores a protocol definition object to a static property
 * @private
 *
 * @param  {Object}    protocol definition
 */
SLIPMessage.applyProtocol = function (protocol) {
  SLIPMessage.protocol_ = protocol
};

/**
 * Returns an escaped buffer accoring to protocol definition file
 * @private
 *
 * @param  {Buffer}       buffer to escape
 * @return {Buffer}       escaped budder
 */
SLIPMessage.prototype.escape_ = function (buffer) {
  var replacementMap = this.buildReplacementMap_(buffer)
      , escapedBuffer = new Buffer(buffer.length + replacementMap.length)
      , sourceReadOffset = 0
      , originWriteOffset = 0

  // escape & copy loop: finishes when all the bytes of original array are copied (or escaped)
  while (sourceReadOffset < buffer.length) {
    if (replacementMap[0] && replacementMap[0].index === sourceReadOffset) {
      // writing an escape sequence
      escapedBuffer.writeUInt8(SLIPMessage.protocol_.escapeByte, originWriteOffset)
      escapedBuffer.writeUInt8(replacementMap[0].replaceTo, originWriteOffset + 1)
      // increment read and write cursors
      sourceReadOffset += 1
      originWriteOffset += 2
      // get rid of used mapping object
      replacementMap.splice(0, 1)
    } else {
      // no escape needed: just copy till new escape value (or till end)
      var readBoundry = replacementMap[0] ? replacementMap[0].index : buffer.length
      buffer.copy(escapedBuffer, originWriteOffset, sourceReadOffset, readBoundry)
      // update read and write cursors
      originWriteOffset = originWriteOffset + (readBoundry - sourceReadOffset)
      sourceReadOffset = readBoundry
    }
  }
  return escapedBuffer
};

/**
 * Returns a mapping between indexes of bytes that need to be replaced
 * and values on which replace to. Indexes served in ascending order.
 * @private
 *
 * @param  {Buffer} buffer to analyse
 * @return {[{index: Number, replaceTo: Number}, ...]}    replacement map
 */
SLIPMessage.prototype.buildReplacementMap_ = function (buffer) {
  var bytesToReplace = [];
  for (var ruleNum = 0; ruleNum < SLIPMessage.protocol_.escapeRules.length; ruleNum++) {
    var rule = SLIPMessage.protocol_.escapeRules[ruleNum]
        , searchCursor = 0
        , endOfBuffer = false;
    while (!endOfBuffer) {
      var index = bt.indexOf(buffer, new Buffer([rule.initialFragment]), searchCursor);
      if (index !== -1) {
        bytesToReplace.push({index: index, replaceTo: rule.replacement});
        searchCursor = index + 1;
      } else {
        endOfBuffer = true;
      }
    }
  }
  return _.sortBy(bytesToReplace, 'index');
};

module.exports = SLIPMessage
