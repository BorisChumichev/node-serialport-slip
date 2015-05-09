'use strict';

var assert = require('chai').assert
  , fs = require('fs')
  , protocol = JSON.parse(fs.readFileSync('test/test-config.json', {encoding: 'utf8'})).protocol
  , SLIPMessage = require('../src/slip-message.js')


describe('SLIPMessage class', function () {

  before(function () {
    SLIPMessage.applyProtocol(protocol)    
  })

  it('has a protocol defined', function () {
    assert.deepEqual(SLIPMessage.protocol_, protocol)
  })

  it('is a constructor', function () {
    assert.isFunction(SLIPMessage)
  })

  it('instantiates a SLIP escaped message', function () {
    var initialBuffer = new Buffer([0x35, 0xA1, 0xBC, 0xC0, 0x12, 0xC1, 0xDB, 0xAA, 0x11, 0xDB, 0xAA])
      , expectedBuffer = new Buffer([0x35, 0xA1, 0xBC, 0xDB, 0xDC, 0x12, 0xC1, 0xDB, 0xDD, 0xAA, 0x11, 0xDB, 0xDD, 0xAA])
      , resultBuffer = new SLIPMessage(initialBuffer)
    assert.isTrue(expectedBuffer.equals(resultBuffer))
  })

  it('has unescape mathod that unescapes the message', function () {
    var expectedBuffer = new Buffer([0x35, 0xA1, 0xBC, 0xC0, 0x12, 0xC1, 0xDB, 0xAA, 0x11, 0xDB])
      , initialBuffer = new Buffer([0x35, 0xA1, 0xBC, 0xDB, 0xDC, 0x12, 0xC1, 0xDB, 0xDD, 0xAA, 0x11, 0xDB, 0xDD])
      , resultBuffer = SLIPMessage.unescape(initialBuffer)
    assert.isTrue(expectedBuffer.equals(resultBuffer))
  })

})
