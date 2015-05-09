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
      var slip = new SLIP(conf.serailPort.path, conf.serailPort.options, {endByte: 0xc1})
      assert.deepEqual(slip.protocol_, { 
        endByte: 193,
        messageMaxLength: 256,
        escapeByte: 219,
        escapeRules: [{ initialFragment: 192, replacement: 220 },
                      { initialFragment: 219, replacement: 221 } ]
        })
    })

    it('has sendMessage method that send message to seriaport', function(done){
      assert.isFunction(slip.sendMessage)
      slip.sendMessage(new Buffer([0]), function (err) {
        assert.isTrue(err.message == 'Serialport not open.')
        done()
      })
    })

    it('has collectDataAndFireMessageEvent_ method', function(done){
      slip.collectDataAndFireMessageEvent_(new Buffer([0x22]))
      slip.on('message', function (buf) {
        assert.isTrue(buf.equals(new Buffer([0x22, 0x20, 0x24])))
        done()
      })
      slip.collectDataAndFireMessageEvent_(new Buffer([0x20, 0x24, 0xc0, 0x22, 0x21]))
    })

  })

})
