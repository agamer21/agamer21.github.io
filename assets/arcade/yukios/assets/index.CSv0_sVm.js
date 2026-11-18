import { p as process$1, g as getDefaultExportFromCjs, c as commonjsGlobal } from './_commonjsHelpers.BoH3JbLf.js';

const decoder = new TextDecoder();
const arr2text = (data, enc) => {
    if (!enc)
        return decoder.decode(data);
    const dec = new TextDecoder(enc);
    return dec.decode(data);
};
function concat(chunks, size = 0) {
    const length = chunks.length;
    if (!size)
        for (let i = 0; i < length; i++)
            size += chunks[i].length;
    const b = new Uint8Array(size);
    let offset = 0;
    for (let i = 0; i < length; i++) {
        b.set(chunks[i], offset);
        offset += chunks[i].length;
    }
    return b;
}
function bitwise64(a, b, type) {
    const byteLen = a.byteLength;
    const aOff = a.byteOffset;
    const bOff = b.byteOffset;
    let i = 0;
    if (aOff & 7) {
        const prefix = Math.min((8 - (aOff & 7)) & 7, byteLen);
        if (type === 'xor')
            for (let j = 0; j < prefix; j++)
                a[j] ^= b[j];
        else if (type === 'or')
            for (let j = 0; j < prefix; j++)
                a[j] |= b[j];
        else
            for (let j = 0; j < prefix; j++)
                a[j] &= b[j];
        i += prefix;
    }
    const words = (byteLen - i) >> 3;
    const a64 = new BigInt64Array(a.buffer, aOff + i, words);
    const b64 = new BigInt64Array(b.buffer, bOff + i, words);
    let j = 0;
    if (type === 'xor') {
        while (j + 4 <= words) {
            a64[j] ^= b64[j];
            a64[j + 1] ^= b64[j + 1];
            a64[j + 2] ^= b64[j + 2];
            a64[j + 3] ^= b64[j + 3];
            j += 4;
        }
        while (j < words)
            a64[j] ^= b64[j++];
    }
    else if (type === 'or') {
        while (j + 4 <= words) {
            a64[j] |= b64[j];
            a64[j + 1] |= b64[j + 1];
            a64[j + 2] |= b64[j + 2];
            a64[j + 3] |= b64[j + 3];
            j += 4;
        }
        while (j < words)
            a64[j] |= b64[j++];
    }
    else {
        while (j + 4 <= words) {
            a64[j] &= b64[j];
            a64[j + 1] &= b64[j + 1];
            a64[j + 2] &= b64[j + 2];
            a64[j + 3] &= b64[j + 3];
            j += 4;
        }
        while (j < words)
            a64[j] &= b64[j++];
    }
    i += words << 3;
    const rem = byteLen - i;
    if (rem) {
        if (type === 'xor')
            for (let k = 0; k < rem; k++)
                a[i + k] ^= b[i + k];
        else if (type === 'or')
            for (let k = 0; k < rem; k++)
                a[i + k] |= b[i + k];
        else
            for (let k = 0; k < rem; k++)
                a[i + k] &= b[i + k];
    }
    return a;
}
function xor(a, b) {
    const length = a.length;
    if (length >= 128 && ((a.byteOffset - b.byteOffset) & 7) === 0) {
        return bitwise64(a, b, 'xor');
    }
    for (let i = 0; i < length; i++)
        a[i] ^= b[i];
    return a;
}
function or(a, b) {
    const length = a.length;
    if (length >= 128 && ((a.byteOffset - b.byteOffset) & 7) === 0) {
        return bitwise64(a, b, 'or');
    }
    for (let i = 0; i < length; i++)
        a[i] |= b[i];
    return a;
}
function and(a, b) {
    const length = a.length;
    if (length >= 128 && ((a.byteOffset - b.byteOffset) & 7) === 0) {
        return bitwise64(a, b, 'and');
    }
    for (let i = 0; i < length; i++)
        a[i] &= b[i];
    return a;
}

const alphabet = '0123456789abcdef';
const encodeLookup = [];
const decodeLookup = new Uint8Array(128); // so that it's 0 initiated, so non hex characters map to 0
for (let i = 0; i < 16; ++i) {
    const i16 = i * 16;
    for (let j = 0; j < 16; ++j) {
        encodeLookup[i16 + j] = alphabet[i] + alphabet[j];
    }
    if (i < 10) {
        decodeLookup[0x30 + i] = i; // '0'-'9'
    }
    else {
        decodeLookup[0x61 - 10 + i] = i; // 'a'-'f'
        decodeLookup[0x41 - 10 + i] = i; // 'A'-'F'
    }
}
const arr2hex = (data) => data.toHex();
const hex2arr = (str) => {
    const len = str.length;
    if (len > 64)
        return Uint8Array.fromHex(str);
    const out = new Uint8Array(len >> 1);
    let j = 0;
    let i = 0;
    while (i < len) {
        out[j++] = (decodeLookup[str.charCodeAt(i++)] << 4) | decodeLookup[str.charCodeAt(i++)];
    }
    return out;
};
const encoder = new TextEncoder();
const text2arr = (str) => encoder.encode(str);
const arr2base = (bytes) => bytes.toBase64();
const base2arr = (str) => Uint8Array.fromBase64(str);
const bin2hex = (str) => {
    let res = '';
    let i = 0;
    const len = str.length;
    while (i < len) {
        res += encodeLookup[str.charCodeAt(i++)];
    }
    return res;
};
const MAX_ARGUMENTS_LENGTH = 0x10000;
const hex2bin = (hex) => {
    const points = hex2arr(hex);
    if (points.length <= MAX_ARGUMENTS_LENGTH)
        return String.fromCharCode.apply(null, points);
    let res = '';
    let i = 0;
    while (i < points.length) {
        res += String.fromCharCode.apply(null, points.subarray(i, i += MAX_ARGUMENTS_LENGTH));
    }
    return res;
};
const formatMap = {
    hex: arr2hex,
    base64: arr2base
};
async function hash(data, format, algo = 'sha-1') {
    if (typeof data === 'string')
        data = text2arr(data);
    const out = new Uint8Array(await crypto.subtle.digest(algo, data));
    return format ? formatMap[format](out) : out;
}
const randomBytes = (size) => crypto.getRandomValues(new Uint8Array(size));
// there's a lot of duplicating here, but inlining matters for performance, can't really use helpers without loosing a lot
function equal(a, b) {
    if (a.byteLength !== b.byteLength)
        return false;
    const len = a.byteLength;
    if (len < 128) {
        for (let i = 0; i < len; i++)
            if (a[i] !== b[i])
                return false;
        return true;
    }
    const words = len >> 3;
    if ((a.byteOffset & 7) === 0 && (b.byteOffset & 7) === 0) {
        const a64 = new BigInt64Array(a.buffer, a.byteOffset, words);
        const b64 = new BigInt64Array(b.buffer, b.byteOffset, words);
        for (let j = 0; j < words; j++) {
            if (a64[j] !== b64[j])
                return false;
        }
    }
    else {
        const dvA = new DataView(a.buffer, a.byteOffset, len);
        const dvB = new DataView(b.buffer, b.byteOffset, b.byteLength);
        for (let j = 0; j < words; j++) {
            if (dvA.getBigInt64(j << 3) !== dvB.getBigInt64(j << 3))
                return false;
        }
    }
    const off = words << 3;
    for (let i = off; i < len; i++)
        if (a[i] !== b[i])
            return false;
    return true;
}
function compare(a, b) {
    const len = a.byteLength < b.byteLength ? a.byteLength : b.byteLength;
    if (len < 128) {
        for (let i = 0; i < len; i++)
            if (a[i] !== b[i])
                return a[i] - b[i];
        return 0;
    }
    const words = len >> 3;
    if ((a.byteOffset & 7) === 0 && (b.byteOffset & 7) === 0) {
        const a64 = new BigInt64Array(a.buffer, a.byteOffset, words);
        const b64 = new BigInt64Array(b.buffer, b.byteOffset, words);
        for (let j = 0; j < words; j++) {
            if (a64[j] !== b64[j]) {
                const o = j << 3;
                for (let k = 0; k < 8; k++) {
                    if (a[o + k] !== b[o + k])
                        return a[o + k] - b[o + k];
                }
            }
        }
    }
    else {
        const dvA = new DataView(a.buffer, a.byteOffset, a.byteLength);
        const dvB = new DataView(b.buffer, b.byteOffset, b.byteLength);
        for (let j = 0; j < words; j++) {
            const o = j << 3;
            if (dvA.getBigInt64(o) !== dvB.getBigInt64(o)) {
                for (let k = 0; k < 8; k++) {
                    if (a[o + k] !== b[o + k])
                        return a[o + k] - b[o + k];
                }
            }
        }
    }
    for (let i = words << 3; i < len; i++) {
        if (a[i] !== b[i])
            return a[i] - b[i];
    }
    return a.byteLength - b.byteLength;
}

function digitCount (value) {
  // Add a digit for negative numbers, as the sign will be prefixed
  const sign = value < 0 ? 1 : 0;
  // Guard against negative numbers & zero going into log10(),
  // as that would return -Infinity
  value = Math.abs(Number(value || 1));
  return Math.floor(Math.log10(value)) + 1 + sign
}

function getType (value) {
  if (ArrayBuffer.isView(value)) return 'arraybufferview'
  if (Array.isArray(value)) return 'array'
  if (value instanceof Number) return 'number'
  if (value instanceof Boolean) return 'boolean'
  if (value instanceof Set) return 'set'
  if (value instanceof Map) return 'map'
  if (value instanceof String) return 'string'
  if (value instanceof ArrayBuffer) return 'arraybuffer'
  return typeof value
}

/**
 * Encodes data in bencode.
 *
 * @param  {Uint8Array|Array|String|Object|Number|Boolean} data
 * @return {Uint8Array}
 */
function encode$1 (data, buffer, offset) {
  const buffers = [];
  let result = null;

  encode$1._encode(buffers, data);
  result = concat(buffers);
  encode$1.bytes = result.length;

  if (ArrayBuffer.isView(buffer)) {
    buffer.set(result, offset);
    return buffer
  }

  return result
}

encode$1.bytes = -1;
encode$1._floatConversionDetected = false;

encode$1._encode = function (buffers, data) {
  if (data == null) { return }

  switch (getType(data)) {
    case 'object': encode$1.dict(buffers, data); break
    case 'map': encode$1.dictMap(buffers, data); break
    case 'array': encode$1.list(buffers, data); break
    case 'set': encode$1.listSet(buffers, data); break
    case 'string': encode$1.string(buffers, data); break
    case 'number': encode$1.number(buffers, data); break
    case 'boolean': encode$1.number(buffers, data); break
    case 'arraybufferview': encode$1.buffer(buffers, new Uint8Array(data.buffer, data.byteOffset, data.byteLength)); break
    case 'arraybuffer': encode$1.buffer(buffers, new Uint8Array(data)); break
  }
};

const buffE = new Uint8Array([0x65]);
const buffD = new Uint8Array([0x64]);
const buffL = new Uint8Array([0x6C]);

encode$1.buffer = function (buffers, data) {
  buffers.push(text2arr(data.length + ':'), data);
};

encode$1.string = function (buffers, data) {
  buffers.push(text2arr(text2arr(data).byteLength + ':' + data));
};

encode$1.number = function (buffers, data) {
  if (Number.isInteger(data)) return buffers.push(text2arr('i' + BigInt(data) + 'e'))

  const maxLo = 0x80000000;
  const hi = (data / maxLo) << 0;
  const lo = (data % maxLo) << 0;
  const val = hi * maxLo + lo;

  buffers.push(text2arr('i' + val + 'e'));

  if (val !== data && !encode$1._floatConversionDetected) {
    encode$1._floatConversionDetected = true;
    console.warn(
      'WARNING: Possible data corruption detected with value "' + data + '":',
      'Bencoding only defines support for integers, value was converted to "' + val + '"'
    );
    console.trace();
  }
};

encode$1.dict = function (buffers, data) {
  buffers.push(buffD);

  let j = 0;
  let k;
  // fix for issue #13 - sorted dicts
  const keys = Object.keys(data).sort();
  const kl = keys.length;

  for (; j < kl; j++) {
    k = keys[j];
    if (data[k] == null) continue
    encode$1.string(buffers, k);
    encode$1._encode(buffers, data[k]);
  }

  buffers.push(buffE);
};

encode$1.dictMap = function (buffers, data) {
  buffers.push(buffD);

  const keys = Array.from(data.keys()).sort();

  for (const key of keys) {
    if (data.get(key) == null) continue
    ArrayBuffer.isView(key)
      ? encode$1._encode(buffers, key)
      : encode$1.string(buffers, String(key));
    encode$1._encode(buffers, data.get(key));
  }

  buffers.push(buffE);
};

encode$1.list = function (buffers, data) {
  let i = 0;
  const c = data.length;
  buffers.push(buffL);

  for (; i < c; i++) {
    if (data[i] == null) continue
    encode$1._encode(buffers, data[i]);
  }

  buffers.push(buffE);
};

encode$1.listSet = function (buffers, data) {
  buffers.push(buffL);

  for (const item of data) {
    if (item == null) continue
    encode$1._encode(buffers, item);
  }

  buffers.push(buffE);
};

const INTEGER_START = 0x69; // 'i'
const STRING_DELIM = 0x3A; // ':'
const DICTIONARY_START = 0x64; // 'd'
const LIST_START = 0x6C; // 'l'
const END_OF_TYPE = 0x65; // 'e'

/**
 * replaces parseInt(buffer.toString('ascii', start, end)).
 * For strings with less then ~30 charachters, this is actually a lot faster.
 *
 * @param {Uint8Array} data
 * @param {Number} start
 * @param {Number} end
 * @return {Number} calculated number
 */
function getIntFromBuffer (buffer, start, end) {
  let sum = 0;
  let sign = 1;

  for (let i = start; i < end; i++) {
    const num = buffer[i];

    if (num < 58 && num >= 48) {
      sum = sum * 10 + (num - 48);
      continue
    }

    if (i === start && num === 43) { // +
      continue
    }

    if (i === start && num === 45) { // -
      sign = -1;
      continue
    }

    if (num === 46) { // .
      // its a float. break here.
      break
    }

    throw new Error('not a number: buffer[' + i + '] = ' + num)
  }

  return sum * sign
}

/**
 * Decodes bencoded data.
 *
 * @param  {Uint8Array} data
 * @param  {Number} start (optional)
 * @param  {Number} end (optional)
 * @param  {String} encoding (optional)
 * @return {Object|Array|Uint8Array|String|Number}
 */
function decode$1 (data, start, end, encoding) {
  if (data == null || data.length === 0) {
    return null
  }

  if (typeof start !== 'number' && encoding == null) {
    encoding = start;
    start = undefined;
  }

  if (typeof end !== 'number' && encoding == null) {
    encoding = end;
    end = undefined;
  }

  decode$1.position = 0;
  decode$1.encoding = encoding || null;

  decode$1.data = !(ArrayBuffer.isView(data))
    ? text2arr(data)
    : new Uint8Array(data.slice(start, end));

  decode$1.bytes = decode$1.data.length;

  return decode$1.next()
}

decode$1.bytes = 0;
decode$1.position = 0;
decode$1.data = null;
decode$1.encoding = null;

decode$1.next = function () {
  switch (decode$1.data[decode$1.position]) {
    case DICTIONARY_START:
      return decode$1.dictionary()
    case LIST_START:
      return decode$1.list()
    case INTEGER_START:
      return decode$1.integer()
    default:
      return decode$1.buffer()
  }
};

decode$1.find = function (chr) {
  let i = decode$1.position;
  const c = decode$1.data.length;
  const d = decode$1.data;

  while (i < c) {
    if (d[i] === chr) return i
    i++;
  }

  throw new Error(
    'Invalid data: Missing delimiter "' +
    String.fromCharCode(chr) + '" [0x' +
    chr.toString(16) + ']'
  )
};

decode$1.dictionary = function () {
  decode$1.position++;

  const dict = {};

  while (decode$1.data[decode$1.position] !== END_OF_TYPE) {
    const buffer = decode$1.buffer();
    let key = arr2text(buffer);
    if (key.includes('\uFFFD')) key = arr2hex(buffer);
    dict[key] = decode$1.next();
  }

  decode$1.position++;

  return dict
};

decode$1.list = function () {
  decode$1.position++;

  const lst = [];

  while (decode$1.data[decode$1.position] !== END_OF_TYPE) {
    lst.push(decode$1.next());
  }

  decode$1.position++;

  return lst
};

decode$1.integer = function () {
  const end = decode$1.find(END_OF_TYPE);
  const number = getIntFromBuffer(decode$1.data, decode$1.position + 1, end);

  decode$1.position += end + 1 - decode$1.position;

  return number
};

decode$1.buffer = function () {
  let sep = decode$1.find(STRING_DELIM);
  const length = getIntFromBuffer(decode$1.data, decode$1.position, sep);
  const end = ++sep + length;

  decode$1.position = end;

  return decode$1.encoding
    ? arr2text(decode$1.data.slice(sep, end))
    : decode$1.data.slice(sep, end)
};

function listLength (list) {
  let length = 1 + 1; // type marker + end-of-type marker

  for (const value of list) {
    length += encodingLength$1(value);
  }

  return length
}

function mapLength (map) {
  let length = 1 + 1; // type marker + end-of-type marker

  for (const [key, value] of map) {
    const keyLength = text2arr(key).byteLength;
    length += digitCount(keyLength) + 1 + keyLength;
    length += encodingLength$1(value);
  }

  return length
}

function objectLength (value) {
  let length = 1 + 1; // type marker + end-of-type marker
  const keys = Object.keys(value);

  for (let i = 0; i < keys.length; i++) {
    const keyLength = text2arr(keys[i]).byteLength;
    length += digitCount(keyLength) + 1 + keyLength;
    length += encodingLength$1(value[keys[i]]);
  }

  return length
}

function stringLength (value) {
  const length = text2arr(value).byteLength;
  return digitCount(length) + 1 + length
}

function arrayBufferLength (value) {
  const length = value.byteLength - value.byteOffset;
  return digitCount(length) + 1 + length
}

function encodingLength$1 (value) {
  const length = 0;

  if (value == null) return length

  const type = getType(value);

  switch (type) {
    case 'arraybufferview': return arrayBufferLength(value)
    case 'string': return stringLength(value)
    case 'array': case 'set': return listLength(value)
    case 'number': return 1 + digitCount(Math.floor(value)) + 1
    case 'bigint': return 1 + value.toString().length + 1
    case 'object': return objectLength(value)
    case 'map': return mapLength(value)
    default:
      throw new TypeError(`Unsupported value of type "${type}"`)
  }
}

/**
 * Determines the amount of bytes
 * needed to encode the given value
 * @param  {Object|Array|Uint8Array|String|Number|Boolean} value
 * @return {Number} byteCount
 */
const encodingLength = encodingLength$1;
const bencode = { encode: encode$1, decode: decode$1, byteLength: encodingLength$1, encodingLength };

const fs = {};

const Blob$1 = self.Blob;
const File = self.File;
const FormData = self.FormData;
const Headers = self.Headers;
const Request = self.Request;
const Response = self.Response;
const AbortController = self.AbortController;
const AbortSignal$1 = self.AbortSignal;

const fetch = self.fetch || (() => { throw new Error('global fetch is not available!') });

/*
Copyright (c) 2011, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
const charTable = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const byteTable = [
  0xff, 0xff, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
  0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
  0x17, 0x18, 0x19, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
  0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
  0x17, 0x18, 0x19, 0xff, 0xff, 0xff, 0xff, 0xff
];
function quintetCount (buff) {
  const quintets = Math.floor(buff.length / 5);
  return buff.length % 5 === 0 ? quintets : quintets + 1
}
const encode = function (plain) {
  if (!ArrayBuffer.isView(plain) && typeof plain !== 'string') {
    throw new TypeError('base32.encode only takes Buffer or string as parameter')
  }
  if (!ArrayBuffer.isView(plain)) {
    plain = text2arr(plain);
  }
  let i = 0;
  let j = 0;
  let shiftIndex = 0;
  let digit = 0;
  const encoded = new Uint8Array(quintetCount(plain) * 8);
  /* byte by byte isn't as pretty as quintet by quintet but tests a bit
        faster. will have to revisit. */
  while (i < plain.length) {
    const current = plain[i];
    if (shiftIndex > 3) {
      digit = current & (0xff >> shiftIndex);
      shiftIndex = (shiftIndex + 5) % 8;
      digit = (digit << shiftIndex) | ((i + 1 < plain.length)
        ? plain[i + 1]
        : 0) >> (8 - shiftIndex);
      i++;
    } else {
      digit = (current >> (8 - (shiftIndex + 5))) & 0x1f;
      shiftIndex = (shiftIndex + 5) % 8;
      if (shiftIndex === 0) { i++; }
    }
    encoded[j] = charTable.charCodeAt(digit);
    j++;
  }
  for (i = j; i < encoded.length; i++) {
    encoded[i] = 0x3d; // '='.charCodeAt(0)
  }
  return encoded
};
const decode = function (encoded) {
  if (!ArrayBuffer.isView(encoded) && typeof encoded !== 'string') {
    throw new TypeError('base32.decode only takes Buffer or string as parameter')
  }
  let shiftIndex = 0;
  let plainDigit = 0;
  let plainChar;
  let plainPos = 0;
  if (!ArrayBuffer.isView(encoded)) {
    encoded = text2arr(encoded);
  }
  const decoded = new Uint8Array(Math.ceil(encoded.length * 5 / 8));
  /* byte by byte isn't as pretty as octet by octet but tests a bit
        faster. will have to revisit. */
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === 0x3d) { // '='
      break
    }
    const encodedByte = encoded[i] - 0x30;
    if (encodedByte < byteTable.length) {
      plainDigit = byteTable[encodedByte];
      if (shiftIndex <= 3) {
        shiftIndex = (shiftIndex + 5) % 8;
        if (shiftIndex === 0) {
          plainChar |= plainDigit;
          decoded[plainPos] = plainChar;
          plainPos++;
          plainChar = 0;
        } else {
          plainChar |= 0xff & (plainDigit << (8 - shiftIndex));
        }
      } else {
        shiftIndex = (shiftIndex + 5) % 8;
        plainChar |= 0xff & (plainDigit >>> shiftIndex);
        decoded[plainPos] = plainChar;
        plainPos++;
        plainChar = 0xff & (plainDigit << (8 - shiftIndex));
      }
    } else {
      throw new Error('Invalid input - it is not base32 encoded string')
    }
  }
  return decoded.subarray(0, plainPos)
};
const index = { encode, decode };

function composeRange (range) {
  return range
    .reduce((acc, cur, idx, arr) => {
      if (idx === 0 || cur !== arr[idx - 1] + 1) acc.push([]);
      acc[acc.length - 1].push(cur);
      return acc
    }, [])
    .map((cur) => {
      return cur.length > 1 ? `${cur[0]}-${cur[cur.length - 1]}` : `${cur[0]}`
    })
}

function parseRange (range) {
  const generateRange = (start, end = start) => Array.from({ length: end - start + 1 }, (cur, idx) => idx + start);

  return range
    .reduce((acc, cur, idx, arr) => {
      const r = cur.split('-').map(cur => parseInt(cur));
      return acc.concat(generateRange(...r))
    }, [])
}

/*! magnet-uri. MIT License. WebTorrent LLC <https://webtorrent.io/opensource> */

/**
 * Parse a magnet URI and return an object of keys/values
 *
 * @param  {string} uri
 * @return {Object} parsed uri
 */
function magnetURIDecode (uri) {
  const result = {};

  // Support 'magnet:' and 'stream-magnet:' uris
  const data = uri.split('magnet:?')[1];

  const params = (data && data.length >= 0)
    ? data.split('&')
    : [];

  params.forEach(param => {
    const keyval = param.split('=');

    // This keyval is invalid, skip it
    if (keyval.length !== 2) return

    const key = keyval[0];
    let val = keyval[1];

    // Clean up torrent name
    if (key === 'dn') val = decodeURIComponent(val).replace(/\+/g, ' ');

    // Address tracker (tr), exact source (xs), and acceptable source (as) are encoded
    // URIs, so decode them
    if (key === 'tr' || key === 'xs' || key === 'as' || key === 'ws') {
      val = decodeURIComponent(val);
    }

    // Return keywords as an array
    if (key === 'kt') val = decodeURIComponent(val).split('+');

    // Cast file index (ix) to a number
    if (key === 'ix') val = Number(val);

    // bep53
    if (key === 'so') val = parseRange(decodeURIComponent(val).split(','));

    // If there are repeated parameters, return an array of values
    if (result[key]) {
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]];
      }

      result[key].push(val);
    } else {
      result[key] = val;
    }
  });

  // Convenience properties for parity with `parse-torrent-file` module
  let m;
  if (result.xt) {
    const xts = Array.isArray(result.xt) ? result.xt : [result.xt];
    xts.forEach(xt => {
      if ((m = xt.match(/^urn:btih:(.{40})/))) {
        result.infoHash = m[1].toLowerCase();
      } else if ((m = xt.match(/^urn:btih:(.{32})/))) {
        result.infoHash = arr2hex(decode(m[1]));
      } else if ((m = xt.match(/^urn:btmh:1220(.{64})/))) {
        result.infoHashV2 = m[1].toLowerCase();
      }
    });
  }

  if (result.xs) {
    const xss = Array.isArray(result.xs) ? result.xs : [result.xs];
    xss.forEach(xs => {
      if ((m = xs.match(/^urn:btpk:(.{64})/))) {
        result.publicKey = m[1].toLowerCase();
      }
    });
  }

  if (result.infoHash) result.infoHashBuffer = hex2arr(result.infoHash);
  if (result.infoHashV2) result.infoHashV2Buffer = hex2arr(result.infoHashV2);
  if (result.publicKey) result.publicKeyBuffer = hex2arr(result.publicKey);

  if (result.dn) result.name = result.dn;
  if (result.kt) result.keywords = result.kt;

  result.announce = [];
  if (typeof result.tr === 'string' || Array.isArray(result.tr)) {
    result.announce = result.announce.concat(result.tr);
  }

  result.urlList = [];
  if (typeof result.as === 'string' || Array.isArray(result.as)) {
    result.urlList = result.urlList.concat(result.as);
  }
  if (typeof result.ws === 'string' || Array.isArray(result.ws)) {
    result.urlList = result.urlList.concat(result.ws);
  }

  result.peerAddresses = [];
  if (typeof result['x.pe'] === 'string' || Array.isArray(result['x.pe'])) {
    result.peerAddresses = result.peerAddresses.concat(result['x.pe']);
  }

  // remove duplicates by converting to Set and back
  result.announce = Array.from(new Set(result.announce));
  result.urlList = Array.from(new Set(result.urlList));
  result.peerAddresses = Array.from(new Set(result.peerAddresses));

  return result
}

function magnetURIEncode (obj) {
  obj = Object.assign({}, obj); // clone obj, so we can mutate it

  // support using convenience names, in addition to spec names
  // (example: `infoHash` for `xt`, `name` for `dn`)

  // Deduplicate xt by using a set
  let xts = new Set();
  if (obj.xt && typeof obj.xt === 'string') xts.add(obj.xt);
  if (obj.xt && Array.isArray(obj.xt)) xts = new Set(obj.xt);
  if (obj.infoHashBuffer) xts.add(`urn:btih:${arr2hex(obj.infoHashBuffer)}`);
  if (obj.infoHash) xts.add(`urn:btih:${obj.infoHash}`);
  if (obj.infoHashV2Buffer) xts.add(obj.xt = `urn:btmh:1220${arr2hex(obj.infoHashV2Buffer)}`);
  if (obj.infoHashV2) xts.add(`urn:btmh:1220${obj.infoHashV2}`);
  const xtsDeduped = Array.from(xts);
  if (xtsDeduped.length === 1) obj.xt = xtsDeduped[0];
  if (xtsDeduped.length > 1) obj.xt = xtsDeduped;

  if (obj.publicKeyBuffer) obj.xs = `urn:btpk:${arr2hex(obj.publicKeyBuffer)}`;
  if (obj.publicKey) obj.xs = `urn:btpk:${obj.publicKey}`;
  if (obj.name) obj.dn = obj.name;
  if (obj.keywords) obj.kt = obj.keywords;
  if (obj.announce) obj.tr = obj.announce;
  if (obj.urlList) {
    obj.ws = obj.urlList;
    delete obj.as;
  }
  if (obj.peerAddresses) obj['x.pe'] = obj.peerAddresses;

  let result = 'magnet:?';
  Object.keys(obj)
    .filter(key => key.length === 2 || key === 'x.pe')
    .forEach((key, i) => {
      const values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
      values.forEach((val, j) => {
        if ((i > 0 || j > 0) && ((key !== 'kt' && key !== 'so') || j === 0)) result += '&';

        if (key === 'dn') val = encodeURIComponent(val).replace(/%20/g, '+');
        if (key === 'tr' || key === 'as' || key === 'ws') {
          val = encodeURIComponent(val);
        }
        // Don't URI encode BEP46 keys
        if (key === 'xs' && !val.startsWith('urn:btpk:')) {
          val = encodeURIComponent(val);
        }
        if (key === 'kt') val = encodeURIComponent(val);
        if (key === 'so') return

        if (key === 'kt' && j > 0) result += `+${val}`;
        else result += `${key}=${val}`;
      });
      if (key === 'so') result += `${key}=${composeRange(values)}`;
    });

  return result
}

var pathBrowserify;
var hasRequiredPathBrowserify;

function requirePathBrowserify () {
	if (hasRequiredPathBrowserify) return pathBrowserify;
	hasRequiredPathBrowserify = 1;
	// 'path' module extracted from Node.js v8.11.1 (only the posix part)
	// transplited with Babel

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	function assertPath(path) {
	  if (typeof path !== 'string') {
	    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
	  }
	}

	// Resolves . and .. elements in a path with directory names
	function normalizeStringPosix(path, allowAboveRoot) {
	  var res = '';
	  var lastSegmentLength = 0;
	  var lastSlash = -1;
	  var dots = 0;
	  var code;
	  for (var i = 0; i <= path.length; ++i) {
	    if (i < path.length)
	      code = path.charCodeAt(i);
	    else if (code === 47 /*/*/)
	      break;
	    else
	      code = 47 /*/*/;
	    if (code === 47 /*/*/) {
	      if (lastSlash === i - 1 || dots === 1) {
	        // NOOP
	      } else if (lastSlash !== i - 1 && dots === 2) {
	        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
	          if (res.length > 2) {
	            var lastSlashIndex = res.lastIndexOf('/');
	            if (lastSlashIndex !== res.length - 1) {
	              if (lastSlashIndex === -1) {
	                res = '';
	                lastSegmentLength = 0;
	              } else {
	                res = res.slice(0, lastSlashIndex);
	                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
	              }
	              lastSlash = i;
	              dots = 0;
	              continue;
	            }
	          } else if (res.length === 2 || res.length === 1) {
	            res = '';
	            lastSegmentLength = 0;
	            lastSlash = i;
	            dots = 0;
	            continue;
	          }
	        }
	        if (allowAboveRoot) {
	          if (res.length > 0)
	            res += '/..';
	          else
	            res = '..';
	          lastSegmentLength = 2;
	        }
	      } else {
	        if (res.length > 0)
	          res += '/' + path.slice(lastSlash + 1, i);
	        else
	          res = path.slice(lastSlash + 1, i);
	        lastSegmentLength = i - lastSlash - 1;
	      }
	      lastSlash = i;
	      dots = 0;
	    } else if (code === 46 /*.*/ && dots !== -1) {
	      ++dots;
	    } else {
	      dots = -1;
	    }
	  }
	  return res;
	}

	function _format(sep, pathObject) {
	  var dir = pathObject.dir || pathObject.root;
	  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
	  if (!dir) {
	    return base;
	  }
	  if (dir === pathObject.root) {
	    return dir + base;
	  }
	  return dir + sep + base;
	}

	var posix = {
	  // path.resolve([from ...], to)
	  resolve: function resolve() {
	    var resolvedPath = '';
	    var resolvedAbsolute = false;
	    var cwd;

	    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	      var path;
	      if (i >= 0)
	        path = arguments[i];
	      else {
	        if (cwd === undefined)
	          cwd = process$1.cwd();
	        path = cwd;
	      }

	      assertPath(path);

	      // Skip empty entries
	      if (path.length === 0) {
	        continue;
	      }

	      resolvedPath = path + '/' + resolvedPath;
	      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
	    }

	    // At this point the path should be resolved to a full absolute path, but
	    // handle relative paths to be safe (might happen when process.cwd() fails)

	    // Normalize the path
	    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

	    if (resolvedAbsolute) {
	      if (resolvedPath.length > 0)
	        return '/' + resolvedPath;
	      else
	        return '/';
	    } else if (resolvedPath.length > 0) {
	      return resolvedPath;
	    } else {
	      return '.';
	    }
	  },

	  normalize: function normalize(path) {
	    assertPath(path);

	    if (path.length === 0) return '.';

	    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
	    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

	    // Normalize the path
	    path = normalizeStringPosix(path, !isAbsolute);

	    if (path.length === 0 && !isAbsolute) path = '.';
	    if (path.length > 0 && trailingSeparator) path += '/';

	    if (isAbsolute) return '/' + path;
	    return path;
	  },

	  isAbsolute: function isAbsolute(path) {
	    assertPath(path);
	    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
	  },

	  join: function join() {
	    if (arguments.length === 0)
	      return '.';
	    var joined;
	    for (var i = 0; i < arguments.length; ++i) {
	      var arg = arguments[i];
	      assertPath(arg);
	      if (arg.length > 0) {
	        if (joined === undefined)
	          joined = arg;
	        else
	          joined += '/' + arg;
	      }
	    }
	    if (joined === undefined)
	      return '.';
	    return posix.normalize(joined);
	  },

	  relative: function relative(from, to) {
	    assertPath(from);
	    assertPath(to);

	    if (from === to) return '';

	    from = posix.resolve(from);
	    to = posix.resolve(to);

	    if (from === to) return '';

	    // Trim any leading backslashes
	    var fromStart = 1;
	    for (; fromStart < from.length; ++fromStart) {
	      if (from.charCodeAt(fromStart) !== 47 /*/*/)
	        break;
	    }
	    var fromEnd = from.length;
	    var fromLen = fromEnd - fromStart;

	    // Trim any leading backslashes
	    var toStart = 1;
	    for (; toStart < to.length; ++toStart) {
	      if (to.charCodeAt(toStart) !== 47 /*/*/)
	        break;
	    }
	    var toEnd = to.length;
	    var toLen = toEnd - toStart;

	    // Compare paths to find the longest common path from root
	    var length = fromLen < toLen ? fromLen : toLen;
	    var lastCommonSep = -1;
	    var i = 0;
	    for (; i <= length; ++i) {
	      if (i === length) {
	        if (toLen > length) {
	          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
	            // We get here if `from` is the exact base path for `to`.
	            // For example: from='/foo/bar'; to='/foo/bar/baz'
	            return to.slice(toStart + i + 1);
	          } else if (i === 0) {
	            // We get here if `from` is the root
	            // For example: from='/'; to='/foo'
	            return to.slice(toStart + i);
	          }
	        } else if (fromLen > length) {
	          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
	            // We get here if `to` is the exact base path for `from`.
	            // For example: from='/foo/bar/baz'; to='/foo/bar'
	            lastCommonSep = i;
	          } else if (i === 0) {
	            // We get here if `to` is the root.
	            // For example: from='/foo'; to='/'
	            lastCommonSep = 0;
	          }
	        }
	        break;
	      }
	      var fromCode = from.charCodeAt(fromStart + i);
	      var toCode = to.charCodeAt(toStart + i);
	      if (fromCode !== toCode)
	        break;
	      else if (fromCode === 47 /*/*/)
	        lastCommonSep = i;
	    }

	    var out = '';
	    // Generate the relative path based on the path difference between `to`
	    // and `from`
	    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
	      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
	        if (out.length === 0)
	          out += '..';
	        else
	          out += '/..';
	      }
	    }

	    // Lastly, append the rest of the destination (`to`) path that comes after
	    // the common path parts
	    if (out.length > 0)
	      return out + to.slice(toStart + lastCommonSep);
	    else {
	      toStart += lastCommonSep;
	      if (to.charCodeAt(toStart) === 47 /*/*/)
	        ++toStart;
	      return to.slice(toStart);
	    }
	  },

	  _makeLong: function _makeLong(path) {
	    return path;
	  },

	  dirname: function dirname(path) {
	    assertPath(path);
	    if (path.length === 0) return '.';
	    var code = path.charCodeAt(0);
	    var hasRoot = code === 47 /*/*/;
	    var end = -1;
	    var matchedSlash = true;
	    for (var i = path.length - 1; i >= 1; --i) {
	      code = path.charCodeAt(i);
	      if (code === 47 /*/*/) {
	          if (!matchedSlash) {
	            end = i;
	            break;
	          }
	        } else {
	        // We saw the first non-path separator
	        matchedSlash = false;
	      }
	    }

	    if (end === -1) return hasRoot ? '/' : '.';
	    if (hasRoot && end === 1) return '//';
	    return path.slice(0, end);
	  },

	  basename: function basename(path, ext) {
	    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
	    assertPath(path);

	    var start = 0;
	    var end = -1;
	    var matchedSlash = true;
	    var i;

	    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
	      if (ext.length === path.length && ext === path) return '';
	      var extIdx = ext.length - 1;
	      var firstNonSlashEnd = -1;
	      for (i = path.length - 1; i >= 0; --i) {
	        var code = path.charCodeAt(i);
	        if (code === 47 /*/*/) {
	            // If we reached a path separator that was not part of a set of path
	            // separators at the end of the string, stop now
	            if (!matchedSlash) {
	              start = i + 1;
	              break;
	            }
	          } else {
	          if (firstNonSlashEnd === -1) {
	            // We saw the first non-path separator, remember this index in case
	            // we need it if the extension ends up not matching
	            matchedSlash = false;
	            firstNonSlashEnd = i + 1;
	          }
	          if (extIdx >= 0) {
	            // Try to match the explicit extension
	            if (code === ext.charCodeAt(extIdx)) {
	              if (--extIdx === -1) {
	                // We matched the extension, so mark this as the end of our path
	                // component
	                end = i;
	              }
	            } else {
	              // Extension does not match, so our result is the entire path
	              // component
	              extIdx = -1;
	              end = firstNonSlashEnd;
	            }
	          }
	        }
	      }

	      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
	      return path.slice(start, end);
	    } else {
	      for (i = path.length - 1; i >= 0; --i) {
	        if (path.charCodeAt(i) === 47 /*/*/) {
	            // If we reached a path separator that was not part of a set of path
	            // separators at the end of the string, stop now
	            if (!matchedSlash) {
	              start = i + 1;
	              break;
	            }
	          } else if (end === -1) {
	          // We saw the first non-path separator, mark this as the end of our
	          // path component
	          matchedSlash = false;
	          end = i + 1;
	        }
	      }

	      if (end === -1) return '';
	      return path.slice(start, end);
	    }
	  },

	  extname: function extname(path) {
	    assertPath(path);
	    var startDot = -1;
	    var startPart = 0;
	    var end = -1;
	    var matchedSlash = true;
	    // Track the state of characters (if any) we see before our first dot and
	    // after any path separator we find
	    var preDotState = 0;
	    for (var i = path.length - 1; i >= 0; --i) {
	      var code = path.charCodeAt(i);
	      if (code === 47 /*/*/) {
	          // If we reached a path separator that was not part of a set of path
	          // separators at the end of the string, stop now
	          if (!matchedSlash) {
	            startPart = i + 1;
	            break;
	          }
	          continue;
	        }
	      if (end === -1) {
	        // We saw the first non-path separator, mark this as the end of our
	        // extension
	        matchedSlash = false;
	        end = i + 1;
	      }
	      if (code === 46 /*.*/) {
	          // If this is our first dot, mark it as the start of our extension
	          if (startDot === -1)
	            startDot = i;
	          else if (preDotState !== 1)
	            preDotState = 1;
	      } else if (startDot !== -1) {
	        // We saw a non-dot and non-path separator before our dot, so we should
	        // have a good chance at having a non-empty extension
	        preDotState = -1;
	      }
	    }

	    if (startDot === -1 || end === -1 ||
	        // We saw a non-dot character immediately before the dot
	        preDotState === 0 ||
	        // The (right-most) trimmed path component is exactly '..'
	        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
	      return '';
	    }
	    return path.slice(startDot, end);
	  },

	  format: function format(pathObject) {
	    if (pathObject === null || typeof pathObject !== 'object') {
	      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
	    }
	    return _format('/', pathObject);
	  },

	  parse: function parse(path) {
	    assertPath(path);

	    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
	    if (path.length === 0) return ret;
	    var code = path.charCodeAt(0);
	    var isAbsolute = code === 47 /*/*/;
	    var start;
	    if (isAbsolute) {
	      ret.root = '/';
	      start = 1;
	    } else {
	      start = 0;
	    }
	    var startDot = -1;
	    var startPart = 0;
	    var end = -1;
	    var matchedSlash = true;
	    var i = path.length - 1;

	    // Track the state of characters (if any) we see before our first dot and
	    // after any path separator we find
	    var preDotState = 0;

	    // Get non-dir info
	    for (; i >= start; --i) {
	      code = path.charCodeAt(i);
	      if (code === 47 /*/*/) {
	          // If we reached a path separator that was not part of a set of path
	          // separators at the end of the string, stop now
	          if (!matchedSlash) {
	            startPart = i + 1;
	            break;
	          }
	          continue;
	        }
	      if (end === -1) {
	        // We saw the first non-path separator, mark this as the end of our
	        // extension
	        matchedSlash = false;
	        end = i + 1;
	      }
	      if (code === 46 /*.*/) {
	          // If this is our first dot, mark it as the start of our extension
	          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
	        } else if (startDot !== -1) {
	        // We saw a non-dot and non-path separator before our dot, so we should
	        // have a good chance at having a non-empty extension
	        preDotState = -1;
	      }
	    }

	    if (startDot === -1 || end === -1 ||
	    // We saw a non-dot character immediately before the dot
	    preDotState === 0 ||
	    // The (right-most) trimmed path component is exactly '..'
	    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
	      if (end !== -1) {
	        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
	      }
	    } else {
	      if (startPart === 0 && isAbsolute) {
	        ret.name = path.slice(1, startDot);
	        ret.base = path.slice(1, end);
	      } else {
	        ret.name = path.slice(startPart, startDot);
	        ret.base = path.slice(startPart, end);
	      }
	      ret.ext = path.slice(startDot, end);
	    }

	    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

	    return ret;
	  },

	  sep: '/',
	  delimiter: ':',
	  win32: null,
	  posix: null
	};

	posix.posix = posix;

	pathBrowserify = posix;
	return pathBrowserify;
}

var pathBrowserifyExports = requirePathBrowserify();
const path = /*@__PURE__*/getDefaultExportFromCjs(pathBrowserifyExports);

/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

var queueMicrotask_1;
var hasRequiredQueueMicrotask;

function requireQueueMicrotask () {
	if (hasRequiredQueueMicrotask) return queueMicrotask_1;
	hasRequiredQueueMicrotask = 1;
	let promise;

	queueMicrotask_1 = typeof queueMicrotask === 'function'
	  ? queueMicrotask.bind(typeof window !== 'undefined' ? window : commonjsGlobal)
	  // reuse resolved promise, and allocate it lazily
	  : cb => (promise || (promise = Promise.resolve()))
	    .then(cb)
	    .catch(err => setTimeout(() => { throw err }, 0));
	return queueMicrotask_1;
}

var queueMicrotaskExports = requireQueueMicrotask();
const queueMicrotask$1 = /*@__PURE__*/getDefaultExportFromCjs(queueMicrotaskExports);

/*! parse-torrent. MIT License. WebTorrent LLC <https://webtorrent.io/opensource> */


/**
 * Parse a torrent identifier (magnet uri, .torrent file, info hash)
 * @param  {string|ArrayBufferView|Object} torrentId
 * @return {Object}
 */
async function parseTorrent (torrentId) {
  if (typeof torrentId === 'string' && /^(stream-)?magnet:/.test(torrentId)) {
    // if magnet uri (string)
    const torrentObj = magnetURIDecode(torrentId);

    // infoHash won't be defined if a non-bittorrent magnet is passed
    if (!torrentObj.infoHash) {
      throw new Error('Invalid torrent identifier')
    }

    return torrentObj
  } else if (typeof torrentId === 'string' && (/^[a-f0-9]{40}$/i.test(torrentId) || /^[a-z2-7]{32}$/i.test(torrentId))) {
    // if info hash (hex/base-32 string)
    return magnetURIDecode(`magnet:?xt=urn:btih:${torrentId}`)
  } else if (ArrayBuffer.isView(torrentId) && torrentId.length === 20) {
    // if info hash (buffer)
    return magnetURIDecode(`magnet:?xt=urn:btih:${arr2hex(torrentId)}`)
  } else if (ArrayBuffer.isView(torrentId)) {
    // if .torrent file (buffer)
    return await decodeTorrentFile(torrentId) // might throw
  } else if (torrentId && torrentId.infoHash) {
    // if parsed torrent (from `parse-torrent` or `magnet-uri`)
    torrentId.infoHash = torrentId.infoHash.toLowerCase();

    if (!torrentId.announce) torrentId.announce = [];

    if (typeof torrentId.announce === 'string') {
      torrentId.announce = [torrentId.announce];
    }

    if (!torrentId.urlList) torrentId.urlList = [];

    return torrentId
  } else {
    throw new Error('Invalid torrent identifier')
  }
}

async function parseTorrentRemote (torrentId, opts, cb) {
  if (typeof opts === 'function') return parseTorrentRemote(torrentId, {}, opts)
  if (typeof cb !== 'function') throw new Error('second argument must be a Function')

  let parsedTorrent;
  try {
    parsedTorrent = await parseTorrent(torrentId);
  } catch (err) {
    // If torrent fails to parse, it could be a Blob, http/https URL or
    // filesystem path, so don't consider it an error yet.
  }

  if (parsedTorrent && parsedTorrent.infoHash) {
    queueMicrotask$1(() => {
      cb(null, parsedTorrent);
    });
  } else if (isBlob(torrentId)) {
    try {
      const torrentBuf = new Uint8Array(await torrentId.arrayBuffer());
      parseOrThrow(torrentBuf);
    } catch (err) {
      return cb(new Error(`Error converting Blob: ${err.message}`))
    }
  } else if (/^https?:/.test(torrentId)) {
    try {
      const res = await fetch(torrentId, {
        headers: { 'user-agent': 'WebTorrent (https://webtorrent.io)' },
        signal: AbortSignal.timeout(30 * 1000),
        ...opts
      });
      const torrentBuf = new Uint8Array(await res.arrayBuffer());
      parseOrThrow(torrentBuf);
    } catch (err) {
      return cb(new Error(`Error downloading torrent: ${err.message}`))
    }
  } else if (typeof fs.readFile === 'function' && typeof torrentId === 'string') {
    // assume it's a filesystem path
    fs.readFile(torrentId, (err, torrentBuf) => {
      if (err) return cb(new Error('Invalid torrent identifier'))
      parseOrThrow(torrentBuf);
    });
  } else {
    queueMicrotask$1(() => {
      cb(new Error('Invalid torrent identifier'));
    });
  }

  async function parseOrThrow (torrentBuf) {
    try {
      parsedTorrent = await parseTorrent(torrentBuf);
    } catch (err) {
      return cb(err)
    }
    if (parsedTorrent && parsedTorrent.infoHash) cb(null, parsedTorrent);
    else cb(new Error('Invalid torrent identifier'));
  }
}

/**
 * Parse a torrent. Throws an exception if the torrent is missing required fields.
 * @param  {ArrayBufferView|Object} torrent
 * @return {Object}        parsed torrent
 */
async function decodeTorrentFile (torrent) {
  if (ArrayBuffer.isView(torrent)) {
    torrent = bencode.decode(torrent);
  }

  // sanity check
  ensure(torrent.info, 'info');
  ensure(torrent.info['name.utf-8'] || torrent.info.name, 'info.name');
  ensure(torrent.info['piece length'], 'info[\'piece length\']');
  ensure(torrent.info.pieces, 'info.pieces');

  if (torrent.info.files) {
    torrent.info.files.forEach(file => {
      ensure(typeof file.length === 'number', 'info.files[0].length');
      ensure(file['path.utf-8'] || file.path, 'info.files[0].path');
    });
  } else {
    ensure(typeof torrent.info.length === 'number', 'info.length');
  }

  const result = {
    info: torrent.info,
    infoBuffer: bencode.encode(torrent.info),
    name: arr2text(torrent.info['name.utf-8'] || torrent.info.name),
    announce: []
  };

  result.infoHashBuffer = await hash(result.infoBuffer);
  result.infoHash = arr2hex(result.infoHashBuffer);

  if (torrent.info.private !== undefined) result.private = !!torrent.info.private;

  if (torrent['creation date']) result.created = new Date(torrent['creation date'] * 1000);
  if (torrent['created by']) result.createdBy = arr2text(torrent['created by']);

  if (ArrayBuffer.isView(torrent.comment)) result.comment = arr2text(torrent.comment);

  // announce and announce-list will be missing if metadata fetched via ut_metadata
  if (Array.isArray(torrent['announce-list']) && torrent['announce-list'].length > 0) {
    torrent['announce-list'].forEach(urls => {
      urls.forEach(url => {
        result.announce.push(arr2text(url));
      });
    });
  } else if (torrent.announce) {
    result.announce.push(arr2text(torrent.announce));
  }

  // handle url-list (BEP19 / web seeding)
  if (ArrayBuffer.isView(torrent['url-list'])) {
    // some clients set url-list to empty string
    torrent['url-list'] = torrent['url-list'].length > 0
      ? [torrent['url-list']]
      : [];
  }
  result.urlList = (torrent['url-list'] || []).map(url => arr2text(url));

  // remove duplicates by converting to Set and back
  result.announce = Array.from(new Set(result.announce));
  result.urlList = Array.from(new Set(result.urlList));

  let sum = 0;
  const files = torrent.info.files || [torrent.info];
  result.files = files.map((file, i) => {
    const parts = [].concat(result.name, file['path.utf-8'] || file.path || []).map(p => ArrayBuffer.isView(p) ? arr2text(p) : p);
    sum += file.length;
    return {
      path: path.join.apply(null, [path.sep].concat(parts)).slice(1),
      name: parts[parts.length - 1],
      length: file.length,
      offset: sum - file.length
    }
  });

  result.length = sum;

  const lastFile = result.files[result.files.length - 1];

  result.pieceLength = torrent.info['piece length'];
  result.lastPieceLength = ((lastFile.offset + lastFile.length) % result.pieceLength) || result.pieceLength;
  result.pieces = splitPieces(torrent.info.pieces);

  return result
}

/**
 * Convert a parsed torrent object back into a .torrent file buffer.
 * @param  {Object} parsed parsed torrent
 * @return {Uint8Array}
 */
function encodeTorrentFile (parsed) {
  const torrent = {
    info: parsed.info
  };

  torrent['announce-list'] = (parsed.announce || []).map(url => {
    if (!torrent.announce) torrent.announce = url;
    url = text2arr(url);
    return [url]
  });

  torrent['url-list'] = parsed.urlList || [];

  if (parsed.private !== undefined) {
    torrent.private = Number(parsed.private);
  }

  if (parsed.created) {
    torrent['creation date'] = (parsed.created.getTime() / 1000) | 0;
  }

  if (parsed.createdBy) {
    torrent['created by'] = parsed.createdBy;
  }

  if (parsed.comment) {
    torrent.comment = parsed.comment;
  }

  return bencode.encode(torrent)
}

/**
 * Check if `obj` is a W3C `Blob` or `File` object
 * @param  {*} obj
 * @return {boolean}
 */
function isBlob (obj) {
  return typeof Blob !== 'undefined' && obj instanceof Blob
}

function splitPieces (buf) {
  const pieces = [];
  for (let i = 0; i < buf.length; i += 20) {
    pieces.push(arr2hex(buf.slice(i, i + 20)));
  }
  return pieces
}

function ensure (bool, fieldName) {
  if (!bool) throw new Error(`Torrent is missing required field: ${fieldName}`)
}
const toMagnetURI = magnetURIEncode;

export { parseTorrent as default, parseTorrentRemote as remote, toMagnetURI, encodeTorrentFile as toTorrentFile };
