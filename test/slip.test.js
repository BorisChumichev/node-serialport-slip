'use strict';

var assert = require('chai').assert
  , SLIP = require('../src/slip.js')
  , fs = require('fs')
  , conf = JSON.parse(fs.readFileSync('test/test-config.json', {encoding: 'utf8'}))

describe('SLIP class', function () {

  it('exists', function(){
    assert.isFunction(SLIP)
  })

  it('inherits SerialPort class', function(){
    assert.isFunction(SLIP.prototype.write)
  })

  describe('SLIP instance', function () {

    var slip = null
    before(function () {
      slip = new SLIP(conf.serailPort.path, conf.serailPort.options, conf.protocol)
    })

    it('has same methods as SerialPort instances via inheritance', function(){
      assert.isFunction(slip.write)
    })

    it('has protocol_ defined', function(){
      assert.isObject(slip.protocol_)
    })

    it('has sendMessage method', function(){
      assert.isFunction(slip.sendMessage)
    })

    it('has collectDataAndFireMessageEvent_ method', function(done){
      slip.on('message', function (buf) {
        assert.isTrue(buf.equals(new Buffer([0x20, 0x24])))
        done()
      })
      slip.collectDataAndFireMessageEvent_(new Buffer([0x20, 0x24, 0xc0, 0x22, 0x21]))
    })

  })

})
