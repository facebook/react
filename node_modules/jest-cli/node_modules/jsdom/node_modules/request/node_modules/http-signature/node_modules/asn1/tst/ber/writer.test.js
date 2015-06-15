// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

var test = require('tap').test;
var sys = require('sys');

///--- Globals

var BerWriter;

var BerReader;


///--- Tests

test('load library', function(t) {
  BerWriter = require('../../lib/index').BerWriter;
  t.ok(BerWriter);
  t.ok(new BerWriter());
  t.end();
});


test('write byte', function(t) {
  var writer = new BerWriter();

  writer.writeByte(0xC2);
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 1, 'Wrong length');
  t.equal(ber[0], 0xC2, 'value wrong');

  t.end();
});


test('write 1 byte int', function(t) {
  var writer = new BerWriter();

  writer.writeInt(0x7f);
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 3, 'Wrong length for an int: ' + ber.length);
  t.equal(ber[0], 0x02, 'ASN.1 tag wrong (2) -> ' + ber[0]);
  t.equal(ber[1], 0x01, 'length wrong(1) -> ' + ber[1]);
  t.equal(ber[2], 0x7f, 'value wrong(3) -> ' + ber[2]);

  t.end();
});


test('write 2 byte int', function(t) {
  var writer = new BerWriter();

  writer.writeInt(0x7ffe);
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 4, 'Wrong length for an int');
  t.equal(ber[0], 0x02, 'ASN.1 tag wrong');
  t.equal(ber[1], 0x02, 'length wrong');
  t.equal(ber[2], 0x7f, 'value wrong (byte 1)');
  t.equal(ber[3], 0xfe, 'value wrong (byte 2)');

  t.end();
});


test('write 3 byte int', function(t) {
  var writer = new BerWriter();

  writer.writeInt(0x7ffffe);
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 5, 'Wrong length for an int');
  t.equal(ber[0], 0x02, 'ASN.1 tag wrong');
  t.equal(ber[1], 0x03, 'length wrong');
  t.equal(ber[2], 0x7f, 'value wrong (byte 1)');
  t.equal(ber[3], 0xff, 'value wrong (byte 2)');
  t.equal(ber[4], 0xfe, 'value wrong (byte 3)');

  t.end();
});


test('write 4 byte int', function(t) {
  var writer = new BerWriter();

  writer.writeInt(0x7ffffffe);
  var ber = writer.buffer;

  t.ok(ber);

  t.equal(ber.length, 6, 'Wrong length for an int');
  t.equal(ber[0], 0x02, 'ASN.1 tag wrong');
  t.equal(ber[1], 0x04, 'length wrong');
  t.equal(ber[2], 0x7f, 'value wrong (byte 1)');
  t.equal(ber[3], 0xff, 'value wrong (byte 2)');
  t.equal(ber[4], 0xff, 'value wrong (byte 3)');
  t.equal(ber[5], 0xfe, 'value wrong (byte 4)');

  t.end();
});


test('write boolean', function(t) {
  var writer = new BerWriter();

  writer.writeBoolean(true);
  writer.writeBoolean(false);
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 6, 'Wrong length');
  t.equal(ber[0], 0x01, 'tag wrong');
  t.equal(ber[1], 0x01, 'length wrong');
  t.equal(ber[2], 0xff, 'value wrong');
  t.equal(ber[3], 0x01, 'tag wrong');
  t.equal(ber[4], 0x01, 'length wrong');
  t.equal(ber[5], 0x00, 'value wrong');

  t.end();
});


test('write string', function(t) {
  var writer = new BerWriter();
  writer.writeString('hello world');
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 13, 'wrong length');
  t.equal(ber[0], 0x04, 'wrong tag');
  t.equal(ber[1], 11, 'wrong length');
  t.equal(ber.slice(2).toString('utf8'), 'hello world', 'wrong value');

  t.end();
});

test('write buffer', function(t) {
  var writer = new BerWriter();
  // write some stuff to start with
  writer.writeString('hello world');
  var ber = writer.buffer;
  var buf = new Buffer([0x04, 0x0b, 0x30, 0x09, 0x02, 0x01, 0x0f, 0x01, 0x01,
     0xff, 0x01, 0x01, 0xff]);
  writer.writeBuffer(buf.slice(2, buf.length), 0x04);
  ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 26, 'wrong length');
  t.equal(ber[0], 0x04, 'wrong tag');
  t.equal(ber[1], 11, 'wrong length');
  t.equal(ber.slice(2, 13).toString('utf8'), 'hello world', 'wrong value');
  t.equal(ber[13], buf[0], 'wrong tag');
  t.equal(ber[14], buf[1], 'wrong length');
  for (var i = 13, j = 0; i < ber.length && j < buf.length; i++, j++) {
    t.equal(ber[i], buf[j], 'buffer contents not identical');
  }
  t.end();
});

test('write string array', function(t) {
  var writer = new BerWriter();
  writer.writeStringArray(['hello world', 'fubar!']);
  var ber = writer.buffer;

  t.ok(ber);

  t.equal(ber.length, 21, 'wrong length');
  t.equal(ber[0], 0x04, 'wrong tag');
  t.equal(ber[1], 11, 'wrong length');
  t.equal(ber.slice(2, 13).toString('utf8'), 'hello world', 'wrong value');

  t.equal(ber[13], 0x04, 'wrong tag');
  t.equal(ber[14], 6, 'wrong length');
  t.equal(ber.slice(15).toString('utf8'), 'fubar!', 'wrong value');

  t.end();
});


test('resize internal buffer', function(t) {
  var writer = new BerWriter({size: 2});
  writer.writeString('hello world');
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 13, 'wrong length');
  t.equal(ber[0], 0x04, 'wrong tag');
  t.equal(ber[1], 11, 'wrong length');
  t.equal(ber.slice(2).toString('utf8'), 'hello world', 'wrong value');

  t.end();
});


test('sequence', function(t) {
  var writer = new BerWriter({size: 25});
  writer.startSequence();
  writer.writeString('hello world');
  writer.endSequence();
  var ber = writer.buffer;

  t.ok(ber);
  console.log(ber);
  t.equal(ber.length, 15, 'wrong length');
  t.equal(ber[0], 0x30, 'wrong tag');
  t.equal(ber[1], 13, 'wrong length');
  t.equal(ber[2], 0x04, 'wrong tag');
  t.equal(ber[3], 11, 'wrong length');
  t.equal(ber.slice(4).toString('utf8'), 'hello world', 'wrong value');

  t.end();
});


test('nested sequence', function(t) {
  var writer = new BerWriter({size: 25});
  writer.startSequence();
  writer.writeString('hello world');
  writer.startSequence();
  writer.writeString('hello world');
  writer.endSequence();
  writer.endSequence();
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 30, 'wrong length');
  t.equal(ber[0], 0x30, 'wrong tag');
  t.equal(ber[1], 28, 'wrong length');
  t.equal(ber[2], 0x04, 'wrong tag');
  t.equal(ber[3], 11, 'wrong length');
  t.equal(ber.slice(4, 15).toString('utf8'), 'hello world', 'wrong value');
  t.equal(ber[15], 0x30, 'wrong tag');
  t.equal(ber[16], 13, 'wrong length');
  t.equal(ber[17], 0x04, 'wrong tag');
  t.equal(ber[18], 11, 'wrong length');
  t.equal(ber.slice(19, 30).toString('utf8'), 'hello world', 'wrong value');

  t.end();
});


test('LDAP bind message', function(t) {
  var dn = 'cn=foo,ou=unit,o=test';
  var writer = new BerWriter();
  writer.startSequence();
  writer.writeInt(3);             // msgid = 3
  writer.startSequence(0x60);     // ldap bind
  writer.writeInt(3);             // ldap v3
  writer.writeString(dn);
  writer.writeByte(0x80);
  writer.writeByte(0x00);
  writer.endSequence();
  writer.endSequence();
  var ber = writer.buffer;

  t.ok(ber);
  t.equal(ber.length, 35, 'wrong length (buffer)');
  t.equal(ber[0], 0x30, 'wrong tag');
  t.equal(ber[1], 33, 'wrong length');
  t.equal(ber[2], 0x02, 'wrong tag');
  t.equal(ber[3], 1, 'wrong length');
  t.equal(ber[4], 0x03, 'wrong value');
  t.equal(ber[5], 0x60, 'wrong tag');
  t.equal(ber[6], 28, 'wrong length');
  t.equal(ber[7], 0x02, 'wrong tag');
  t.equal(ber[8], 1, 'wrong length');
  t.equal(ber[9], 0x03, 'wrong value');
  t.equal(ber[10], 0x04, 'wrong tag');
  t.equal(ber[11], dn.length, 'wrong length');
  t.equal(ber.slice(12, 33).toString('utf8'), dn, 'wrong value');
  t.equal(ber[33], 0x80, 'wrong tag');
  t.equal(ber[34], 0x00, 'wrong len');

  t.end();
});


test('Write OID', function(t) {
  var oid = '1.2.840.113549.1.1.1';
  var writer = new BerWriter();
  writer.writeOID(oid);

  var ber = writer.buffer;
  t.ok(ber);
  console.log(require('util').inspect(ber));
  console.log(require('util').inspect(new Buffer([0x06, 0x09, 0x2a, 0x86,
                                                  0x48, 0x86, 0xf7, 0x0d,
                                                  0x01, 0x01, 0x01])));

  t.end();
});
