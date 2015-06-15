// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

var test = require('tap').test;



///--- Globals

var BerReader;



///--- Tests

test('load library', function(t) {
  BerReader = require('../../lib/index').BerReader;
  t.ok(BerReader);
  try {
    new BerReader();
    t.fail('Should have thrown');
  } catch (e) {
    t.ok(e instanceof TypeError, 'Should have been a type error');
  }
  t.end();
});


test('read byte', function(t) {
  var reader = new BerReader(new Buffer([0xde]));
  t.ok(reader);
  t.equal(reader.readByte(), 0xde, 'wrong value');
  t.end();
});


test('read 1 byte int', function(t) {
  var reader = new BerReader(new Buffer([0x02, 0x01, 0x03]));
  t.ok(reader);
  t.equal(reader.readInt(), 0x03, 'wrong value');
  t.equal(reader.length, 0x01, 'wrong length');
  t.end();
});


test('read 2 byte int', function(t) {
  var reader = new BerReader(new Buffer([0x02, 0x02, 0x7e, 0xde]));
  t.ok(reader);
  t.equal(reader.readInt(), 0x7ede, 'wrong value');
  t.equal(reader.length, 0x02, 'wrong length');
  t.end();
});


test('read 3 byte int', function(t) {
  var reader = new BerReader(new Buffer([0x02, 0x03, 0x7e, 0xde, 0x03]));
  t.ok(reader);
  t.equal(reader.readInt(), 0x7ede03, 'wrong value');
  t.equal(reader.length, 0x03, 'wrong length');
  t.end();
});


test('read 4 byte int', function(t) {
  var reader = new BerReader(new Buffer([0x02, 0x04, 0x7e, 0xde, 0x03, 0x01]));
  t.ok(reader);
  t.equal(reader.readInt(), 0x7ede0301, 'wrong value');
  t.equal(reader.length, 0x04, 'wrong length');
  t.end();
});


test('read boolean true', function(t) {
  var reader = new BerReader(new Buffer([0x01, 0x01, 0xff]));
  t.ok(reader);
  t.equal(reader.readBoolean(), true, 'wrong value');
  t.equal(reader.length, 0x01, 'wrong length');
  t.end();
});


test('read boolean false', function(t) {
  var reader = new BerReader(new Buffer([0x01, 0x01, 0x00]));
  t.ok(reader);
  t.equal(reader.readBoolean(), false, 'wrong value');
  t.equal(reader.length, 0x01, 'wrong length');
  t.end();
});


test('read enumeration', function(t) {
  var reader = new BerReader(new Buffer([0x0a, 0x01, 0x20]));
  t.ok(reader);
  t.equal(reader.readEnumeration(), 0x20, 'wrong value');
  t.equal(reader.length, 0x01, 'wrong length');
  t.end();
});


test('read string', function(t) {
  var dn = 'cn=foo,ou=unit,o=test';
  var buf = new Buffer(dn.length + 2);
  buf[0] = 0x04;
  buf[1] = Buffer.byteLength(dn);
  buf.write(dn, 2);
  var reader = new BerReader(buf);
  t.ok(reader);
  t.equal(reader.readString(), dn, 'wrong value');
  t.equal(reader.length, dn.length, 'wrong length');
  t.end();
});


test('read sequence', function(t) {
  var reader = new BerReader(new Buffer([0x30, 0x03, 0x01, 0x01, 0xff]));
  t.ok(reader);
  t.equal(reader.readSequence(), 0x30, 'wrong value');
  t.equal(reader.length, 0x03, 'wrong length');
  t.equal(reader.readBoolean(), true, 'wrong value');
  t.equal(reader.length, 0x01, 'wrong length');
  t.end();
});


test('anonymous LDAPv3 bind', function(t) {
  var BIND = new Buffer(14);
  BIND[0] = 0x30;  // Sequence
  BIND[1] = 12;    // len
  BIND[2] = 0x02;  // ASN.1 Integer
  BIND[3] = 1;     // len
  BIND[4] = 0x04;  // msgid (make up 4)
  BIND[5] = 0x60;  // Bind Request
  BIND[6] = 7;     // len
  BIND[7] = 0x02;  // ASN.1 Integer
  BIND[8] = 1;     // len
  BIND[9] = 0x03;  // v3
  BIND[10] = 0x04; // String (bind dn)
  BIND[11] = 0;    // len
  BIND[12] = 0x80; // ContextSpecific (choice)
  BIND[13] = 0;    // simple bind

  // Start testing ^^
  var ber = new BerReader(BIND);
  t.equal(ber.readSequence(), 48, 'Not an ASN.1 Sequence');
  t.equal(ber.length, 12, 'Message length should be 12');
  t.equal(ber.readInt(), 4, 'Message id should have been 4');
  t.equal(ber.readSequence(), 96, 'Bind Request should have been 96');
  t.equal(ber.length, 7, 'Bind length should have been 7');
  t.equal(ber.readInt(), 3, 'LDAP version should have been 3');
  t.equal(ber.readString(), '', 'Bind DN should have been empty');
  t.equal(ber.length, 0, 'string length should have been 0');
  t.equal(ber.readByte(), 0x80, 'Should have been ContextSpecific (choice)');
  t.equal(ber.readByte(), 0, 'Should have been simple bind');
  t.equal(null, ber.readByte(), 'Should be out of data');
  t.end();
});


test('long string', function(t) {
  var buf = new Buffer(256);
  var o;
  var s =
    '2;649;CN=Red Hat CS 71GA Demo,O=Red Hat CS 71GA Demo,C=US;' +
    'CN=RHCS Agent - admin01,UID=admin01,O=redhat,C=US [1] This is ' +
    'Teena Vradmin\'s description.';
  buf[0] = 0x04;
  buf[1] = 0x81;
  buf[2] = 0x94;
  buf.write(s, 3);
  var ber = new BerReader(buf.slice(0, 3 + s.length));
  t.equal(ber.readString(), s);
  t.end();
});
