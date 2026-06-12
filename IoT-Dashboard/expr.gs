/**
 * Safe arithmetic expression evaluator for read-time derived metrics.
 * Keep behavior aligned with IoT-Data/expr.gs.
 */

var EXPR_MAX_LEN = 500;
var EXPR_MAX_TOKENS = 200;

var EXPR_FUNCS = {
  min: function (a) { return Math.min.apply(null, a); },
  max: function (a) { return Math.max.apply(null, a); },
  abs: function (a) { return Math.abs(a[0]); },
  round: function (a) { return a.length > 1 ? Number(a[0].toFixed(a[1])) : Math.round(a[0]); },
  floor: function (a) { return Math.floor(a[0]); },
  ceil: function (a) { return Math.ceil(a[0]); },
  sqrt: function (a) { return Math.sqrt(a[0]); },
  pow: function (a) { return Math.pow(a[0], a[1]); },
  log: function (a) { return a.length > 1 ? Math.log(a[0]) / Math.log(a[1]) : Math.log(a[0]); },
  exp: function (a) { return Math.exp(a[0]); },
  avg: function (a) {
    if (!a.length) return NaN;
    var total = 0;
    for (var i = 0; i < a.length; i++) total += a[i];
    return total / a.length;
  }
};

var EXPR_BINOPS = {
  '+': function (x, y) { return x + y; },
  '-': function (x, y) { return x - y; },
  '*': function (x, y) { return x * y; },
  '/': function (x, y) { return x / y; },
  '%': function (x, y) { return x % y; }
};

function evalExpression_(src, scope) {
  try {
    var text = String(src == null ? '' : src);
    if (text.length > EXPR_MAX_LEN) return { ok: false, error: 'expression too long' };
    var tokens = tokenizeExpr_(text);
    if (!tokens.length) return { ok: false, error: 'empty expression' };
    if (tokens.length > EXPR_MAX_TOKENS) return { ok: false, error: 'expression too complex' };
    var parser = makeExprParser_(tokens, scope || {});
    var value = parser.parseExpr();
    if (!parser.atEnd()) return { ok: false, error: 'unexpected token' };
    if (typeof value !== 'number' || !isFinite(value)) return { ok: false, error: 'non-finite result' };
    return { ok: true, value: value };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

function tokenizeExpr_(text) {
  var tokens = [];
  var i = 0;
  while (i < text.length) {
    var c = text[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(text[i + 1] || ''))) {
      var number = '';
      while (i < text.length && /[0-9.]/.test(text[i])) number += text[i++];
      var parsed = parseFloat(number);
      if (!isFinite(parsed)) throw new Error('bad number');
      tokens.push({ t: 'num', v: parsed });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      var id = '';
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) id += text[i++];
      tokens.push({ t: 'id', v: id });
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(EXPR_BINOPS, c) || c === '^') {
      tokens.push({ t: 'op', v: c }); i++; continue;
    }
    if (c === '(') { tokens.push({ t: 'lp' }); i++; continue; }
    if (c === ')') { tokens.push({ t: 'rp' }); i++; continue; }
    if (c === ',') { tokens.push({ t: 'comma' }); i++; continue; }
    throw new Error('unexpected character');
  }
  return tokens;
}

function makeExprParser_(tokens, scope) {
  var pos = 0;
  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }
  function atEnd() { return pos >= tokens.length; }
  function expect(type) {
    var token = tokens[pos];
    if (!token || token.t !== type) throw new Error('expected ' + type);
    pos++;
  }
  function parseExpr() {
    var value = parseTerm();
    while (!atEnd() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
      var op = next().v;
      value = EXPR_BINOPS[op](value, parseTerm());
    }
    return value;
  }
  function parseTerm() {
    var value = parsePower();
    while (!atEnd() && peek().t === 'op' && (peek().v === '*' || peek().v === '/' || peek().v === '%')) {
      var op = next().v;
      value = EXPR_BINOPS[op](value, parsePower());
    }
    return value;
  }
  function parsePower() {
    var base = parseUnary();
    if (!atEnd() && peek().t === 'op' && peek().v === '^') {
      next();
      return Math.pow(base, parsePower());
    }
    return base;
  }
  function parseUnary() {
    if (!atEnd() && peek().t === 'op' && peek().v === '-') { next(); return -parseUnary(); }
    if (!atEnd() && peek().t === 'op' && peek().v === '+') { next(); return parseUnary(); }
    return parsePrimary();
  }
  function parsePrimary() {
    var token = peek();
    if (!token) throw new Error('unexpected end');
    if (token.t === 'num') { next(); return token.v; }
    if (token.t === 'lp') {
      next();
      var value = parseExpr();
      expect('rp');
      return value;
    }
    if (token.t !== 'id') throw new Error('unexpected token');
    next();
    if (!atEnd() && peek().t === 'lp') {
      next();
      var args = [];
      if (!atEnd() && peek().t !== 'rp') {
        args.push(parseExpr());
        while (!atEnd() && peek().t === 'comma') { next(); args.push(parseExpr()); }
      }
      expect('rp');
      if (!EXPR_FUNCS[token.v]) throw new Error('unknown function');
      return EXPR_FUNCS[token.v](args);
    }
    if (!Object.prototype.hasOwnProperty.call(scope, token.v)) throw new Error('unknown variable');
    var scoped = Number(scope[token.v]);
    if (!isFinite(scoped)) throw new Error('non-finite variable');
    return scoped;
  }
  return { parseExpr: parseExpr, atEnd: atEnd };
}
