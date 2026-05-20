const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = path.join(PROJECT_ROOT, 'Payload Codec');
const OUTPUT_ROOT = path.join(PROJECT_ROOT, 'IoT-Data', 'device-examples', 'milesight-lorawan');
const NO_EXAMPLES_PATH = path.join(OUTPUT_ROOT, 'NO_EXAMPLE_MODELS.md');
const VALUE_DEFINITIONS_PATH = path.join(OUTPUT_ROOT, 'value-definitions.json');

function main() {
  ensureDir(OUTPUT_ROOT);

  const readmes = findReadmes(SOURCE_ROOT).filter((file) => {
    const rel = slash(path.relative(SOURCE_ROOT, file));
    return !rel.startsWith('z-aws-iot-core/');
  });

  const noExampleModels = [];
  const globalKeys = new Set();
  const stats = {
    scannedReadmes: readmes.length,
    generatedJsonFiles: 0,
    exampleObjects: 0,
    decodedKeys: 0,
    globalKeys: 0,
    noExampleModels: 0,
    unpairedFragments: 0,
    warnings: 0
  };

  readmes.forEach((file) => {
    const info = readModelInfo(file);
    const markdown = fs.readFileSync(file, 'utf8');
    const result = extractExampleObjects(markdown);
    stats.unpairedFragments += result.unpairedFragments;
    stats.warnings += result.warnings.length;

    const keys = uniqueSorted(result.objects.flatMap(extractKeyPaths));
    keys.forEach((key) => globalKeys.add(key));

    const outFile = path.join(OUTPUT_ROOT, info.model + '.json');
    if (result.objects.length) {
      writeJson(outFile, keys);
      stats.generatedJsonFiles += 1;
      stats.exampleObjects += result.objects.length;
      stats.decodedKeys += keys.length;
    } else {
      removeIfExists(outFile);
      noExampleModels.push({
        model: info.model,
        series: info.series,
        source_readme: info.sourceReadme,
        title: info.title,
        has_table: hasMarkdownTable(markdown),
        note: result.hasExampleSection ? 'Example section has no extractable decoded object.' : 'No Example section.'
      });
    }
  });

  stats.globalKeys = globalKeys.size;
  stats.noExampleModels = noExampleModels.length;
  writeJson(VALUE_DEFINITIONS_PATH, buildValueDefinitions(globalKeys));
  writeNoExamplesMarkdown(noExampleModels);
  validateOutputs();

  console.log(JSON.stringify(stats, null, 2));
  if (noExampleModels.length) {
    console.log('NO_EXAMPLE_MODELS.md written with ' + noExampleModels.length + ' entries.');
  }
}

function findReadmes(dir, out) {
  out = out || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) findReadmes(file, out);
    else if (entry.name.toLowerCase() === 'readme.md') out.push(file);
  });
  return out;
}

function readModelInfo(file) {
  const rel = slash(path.relative(SOURCE_ROOT, file));
  const parts = rel.split('/');
  const markdown = fs.readFileSync(file, 'utf8');
  return {
    series: parts[0] || '',
    model: parts[1] || path.basename(path.dirname(file)),
    sourceReadme: rel,
    title: (markdown.match(/^#\s+(.+)$/m) || [])[1] || parts[1] || path.basename(path.dirname(file))
  };
}

function extractExampleObjects(markdown) {
  const sections = getExampleSections(markdown);
  const result = {
    objects: [],
    hasExampleSection: sections.length > 0,
    unpairedFragments: 0,
    warnings: []
  };

  sections.forEach((section) => {
    getCodeBlocks(section).forEach((block) => {
      const extracted = extractObjectsFromBlock(block.body);
      result.objects.push.apply(result.objects, extracted.objects);
      result.unpairedFragments += extracted.unpairedFragments;
      result.warnings.push.apply(result.warnings, extracted.warnings);
    });
  });

  return result;
}

function getExampleSections(markdown) {
  const headingRe = /^##\s+Example\b.*$/gim;
  const sections = [];
  let match;
  while ((match = headingRe.exec(markdown)) !== null) {
    const start = match.index + match[0].length;
    const rest = markdown.slice(start);
    const next = rest.search(/^##\s+/m);
    sections.push(next === -1 ? rest : rest.slice(0, next));
  }
  return sections;
}

function getCodeBlocks(text) {
  const blocks = [];
  const re = /```([^\r\n]*)\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    blocks.push({ language: String(match[1] || '').trim().toLowerCase(), body: match[2] });
  }
  return blocks;
}

function extractObjectsFromBlock(block) {
  const objects = [];
  const warnings = [];
  let unpairedFragments = 0;
  let scanFrom = 0;

  while (scanFrom < block.length) {
    const start = findNextJsonStart(block, scanFrom);
    if (start === -1) break;

    const end = findMatchingJsonEnd(block, start);
    if (end === -1) {
      unpairedFragments += 1;
      warnings.push('Unclosed JSON object near offset ' + start);
      break;
    }

    objects.push(block.slice(start, end));
    scanFrom = end;
  }

  return { objects, unpairedFragments, warnings };
}

function extractKeyPaths(objectText) {
  const parser = new KeyPathParser(objectText);
  return parser.parse();
}

class KeyPathParser {
  constructor(text) {
    this.text = text;
    this.i = 0;
    this.keys = new Set();
  }

  parse() {
    this.skipSpace();
    if (this.peek() === '{') this.parseObject([]);
    return Array.from(this.keys);
  }

  parseObject(path) {
    this.consume('{');
    while (this.i < this.text.length) {
      this.skipSpaceAndCommas();
      if (this.peek() === '}') {
        this.i += 1;
        return;
      }
      if (this.peek() !== '"') {
        this.i += 1;
        continue;
      }
      const key = this.readString();
      this.skipSpace();
      if (this.peek() !== ':') continue;
      this.i += 1;
      this.parseValue(path.concat(key));
    }
  }

  parseArray(path) {
    this.consume('[');
    const arrayPath = path.length ? path.slice(0, -1).concat(path[path.length - 1] + '[]') : ['[]'];
    while (this.i < this.text.length) {
      this.skipSpaceAndCommas();
      if (this.peek() === ']') {
        this.i += 1;
        return;
      }
      this.parseValue(arrayPath);
    }
  }

  parseValue(path) {
    this.skipSpace();
    const ch = this.peek();
    if (ch === '{') {
      this.parseObject(path);
    } else if (ch === '[') {
      this.parseArray(path);
    } else {
      if (path.length) this.keys.add(path.join('.'));
      this.skipScalar();
    }
  }

  readString() {
    let out = '';
    this.consume('"');
    while (this.i < this.text.length) {
      const ch = this.text[this.i++];
      if (ch === '\\') {
        out += ch;
        if (this.i < this.text.length) out += this.text[this.i++];
      } else if (ch === '"') {
        return out.replace(/\\"/g, '"');
      } else {
        out += ch;
      }
    }
    return out;
  }

  skipScalar() {
    let inString = false;
    let escaped = false;
    while (this.i < this.text.length) {
      const ch = this.text[this.i];
      if (inString) {
        this.i += 1;
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        this.i += 1;
      } else if (ch === ',' || ch === '}' || ch === ']') {
        return;
      } else {
        this.i += 1;
      }
    }
  }

  skipSpace() {
    while (/\s/.test(this.peek())) this.i += 1;
  }

  skipSpaceAndCommas() {
    while (/\s|,/.test(this.peek())) this.i += 1;
  }

  consume(ch) {
    if (this.peek() === ch) this.i += 1;
  }

  peek() {
    return this.text[this.i] || '';
  }
}

function findNextJsonStart(text, from) {
  let inString = false;
  let escaped = false;
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') return i;
  }
  return -1;
}

function findMatchingJsonEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function buildValueDefinitions(keys) {
  const out = {};
  uniqueSorted(Array.from(keys)).forEach((key) => {
    out[key] = { type: 'unknown', unit: '', note: '' };
  });
  return out;
}

function hasMarkdownTable(markdown) {
  return /^\s*\|.*\|\s*$/m.test(markdown);
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value) + '\n', 'utf8');
}

function writeNoExamplesMarkdown(rows) {
  const lines = [
    '# Models Without README Example',
    '',
    'Generated by `tools/extract-readme-examples.js`.',
    '',
    '| Model | Series | README | Title | Has Table | Note |',
    '|---|---|---|---|---|---|'
  ];
  rows.forEach((row) => {
    lines.push([
      row.model,
      row.series,
      row.source_readme,
      row.title,
      row.has_table ? 'yes' : 'no',
      row.note
    ].map(markdownCell).join('|').replace(/^/, '|').replace(/$/, '|'));
  });
  fs.writeFileSync(NO_EXAMPLES_PATH, lines.join('\n') + '\n', 'utf8');
}

function validateOutputs() {
  fs.readdirSync(OUTPUT_ROOT)
    .filter((name) => name.toLowerCase().endsWith('.json'))
    .forEach((name) => {
      JSON.parse(fs.readFileSync(path.join(OUTPUT_ROOT, name), 'utf8'));
    });
}

function removeIfExists(file) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function slash(value) {
  return value.replace(/\\/g, '/');
}

function markdownCell(value) {
  return ' ' + String(value == null ? '' : value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ') + ' ';
}

main();
