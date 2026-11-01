const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '../..', relative);
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const testModule = { exports: {} };
  const requireMock = (name) => {
    if (name === 'server-only') return {};
    if (name === 'zod') return require('zod');
    if (name === 'node:crypto') return require('node:crypto');
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === 'react/jsx-runtime') return {
      jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }),
    };
    throw new Error(`Unexpected dependency: ${name} in ${relative}`);
  };
  vm.runInThisContext(`(function(require,module,exports){${outputText}\n})`, { filename })(requireMock, testModule, testModule.exports);
  return testModule.exports;
}

module.exports = { load };
