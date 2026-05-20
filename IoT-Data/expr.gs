/**
 * IoT-Data — safe arithmetic expression evaluator.
 * NO eval / Function. Tokenizer -> recursive-descent parser -> direct evaluation.
 *
 * Grammar:
 *   expr   := term (('+'|'-') term)*
 *   term   := power (('*'|'/'|'%') power)*
 *   power  := unary ('^' power)?            // right-associative
 *   unary  := ('-'|'+') unary | primary
 *   primary:= number | ident | ident '(' args ')' | '(' expr ')'
 *
 * Identifiers resolve against a `scope` object (raw metric values).
 * Only the whitelisted functions below may be called.
 *
 * CANONICAL COPY — mirrored verbatim into the IoT-Dashboard project. Keep in sync.
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
    var s = 0; for (var i = 0; i < a.length; i++) s += a[i];
    return s / a.length;
  }
};

var EXPR_BINOPS = {
  '+': function (x, y) { return x + y; },
  '-': function (x, y) { return x - y; },
  '*': function (x, y) { return x * y; },
  '/': function (x, y) { return x / y; },
  '%': function (x, y) { return x % y; }
};

/** Evaluate `src` against `scope`. Returns {ok:true,value} or {ok:false,error}. */
function evalExpression_(src, scope) {
  try {
    var str = String(src == null ? '' : src);
    if (str.length > EXPR_MAX_LEN) return { ok: false, error: 'expression too long' };
    var tokens = tokenizeExpr_(str);
    if (tokens.length === 0) return { ok: false, error: 'empty expression' };
    if (tokens.length > EXPR_MAX_TOKENS) return { ok: false, error: 'expression too complex' };

    var parser = makeExprParser_(tokens, scope || {});
    var value = parser.parseExpr();
    if (!parser.atEnd()) return { ok: false, error: 'unexpected token' };
    if (typeof value !== 'number' || !isFinite(value)) {
      return { ok: false, error: 'non-finite result' };
    }
    return { ok: true, value: value };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

function tokenizeExpr_(s) {
  var tokens = [];
  var i = 0;
  while (i < s.length) {
    var c = s[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if ((c >= '0' && c <= '9') || (c === '.' && s[i + 1] >= '0' && s[i + 1] <= '9')) {
      var num = '';
      while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) { num += s[i++]; }
      var n = parseFloat(num);
      if (!isFinite(n)) throw new Error('bad number "' + num + '"');
      tokens.push({ t: 'num', v: n });
      continue;
    }
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
      var id = '';
      while (i < s.length && ((s[i] >= 'a' && s[i] <= 'z') || (s[i] >= 'A' && s[i] <= 'Z') ||
        (s[i] >= '0' && s[i] <= '9') || s[i] === '_')) { id += s[i++]; }
      tokens.push({ t: 'id', v: id });
      continue;
    }
    if (EXPR_BINOPS.hasOwnProperty(c) || c === '^') { tokens.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(') { tokens.push({ t: 'lp' }); i++; continue; }
    if (c === ')') { tokens.push({ t: 'rp' }); i++; continue; }
    if (c === ',') { tokens.push({ t: 'comma' }); i++; continue; }
    throw new Error('unexpected character "' + c + '"');
  }
  return tokens;
}

function makeExprParser_(tokens, scope) {
  var pos = 0;
  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }
  function atEnd() { return pos >= tokens.length; }
  function expect(type) {
    var tk = tokens[pos];
    if (!tk || tk.t !== type) throw new Error('expected ' + type);
    pos++;
    return tk;
  }

  function parseExpr() {
    var v = parseTerm();
    while (!atEnd() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
      var op = next().v;
      v = EXPR_BINOPS[op](v, parseTerm());
    }
    return v;
  }
  function parseTerm() {
    var v = parsePower();
    while (!atEnd() && peek().t === 'op' && (peek().v === '*' || peek().v === '/' || peek().v === '%')) {
      var op = next().v;
      v = EXPR_BINOPS[op](v, parsePower());
    }
    return v;
  }
  function parsePower() {
    var base = parseUnary();
    if (!atEnd() && peek().t === 'op' && peek().v === '^') {
      next();
      return Math.pow(base, parsePower()); // right-associative
    }
    return base;
  }
  function parseUnary() {
    if (!atEnd() && peek().t === 'op' && peek().v === '-') { next(); return -parseUnary(); }
    if (!atEnd() && peek().t === 'op' && peek().v === '+') { next(); return parseUnary(); }
    return parsePrimary();
  }
  function parsePrimary() {
    var tk = peek();
    if (!tk) throw new Error('unexpected end of expression');
    if (tk.t === 'num') { next(); return tk.v; }
    if (tk.t === 'lp') {
      next();
      var v = parseExpr();
      expect('rp');
      return v;
    }
    if (tk.t === 'id') {
      next();
      if (!atEnd() && peek().t === 'lp') {
        next(); // '('
        var args = [];
        if (!atEnd() && peek().t !== 'rp') {
          args.push(parseExpr());
          while (!atEnd() && peek().t === 'comma') { next(); args.push(parseExpr()); }
        }
        expect('rp');
        var fn = EXPR_FUNCS[tk.v];
        if (!fn) throw new Error('unknown function "' + tk.v + '"');
        var result = fn(args);
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('"' + tk.v + '" produced a non-finite value');
        }
        return result;
      }
      if (!scope.hasOwnProperty(tk.v)) throw new Error('unknown variable "' + tk.v + '"');
      var sv = Number(scope[tk.v]);
      if (!isFinite(sv)) throw new Error('variable "' + tk.v + '" is not a finite number');
      return sv;
    }
    throw new Error('unexpected token');
  }

  return { parseExpr: parseExpr, atEnd: atEnd };
}
