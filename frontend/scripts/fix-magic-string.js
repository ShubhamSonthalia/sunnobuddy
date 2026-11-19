const fs = require('fs');
const path = require('path');

try {
  const mjsPath = path.join(__dirname, '..', 'node_modules', 'magic-string', 'dist', 'index.mjs');
  const cjsPath = path.join(__dirname, '..', 'node_modules', 'magic-string', 'dist', 'index.cjs');

  if (fs.existsSync(mjsPath)) {
    let code = fs.readFileSync(mjsPath, 'utf8');

    code = code.replace(
      'import { encode, encodeRangeMappings } from "@jridgewell/sourcemap-codec";',
      'const { encode, encodeRangeMappings } = require("@jridgewell/sourcemap-codec");'
    );

    code = code.replace(
      'export { Bundle, MagicString, MagicString as default, MagicStringError, SourceMap };',
      'module.exports = MagicString;\nmodule.exports.default = MagicString;\nmodule.exports.MagicString = MagicString;\nmodule.exports.Bundle = Bundle;\nmodule.exports.MagicStringError = MagicStringError;\nmodule.exports.SourceMap = SourceMap;'
    );

    fs.writeFileSync(cjsPath, code, 'utf8');

    const pkgPath = path.join(__dirname, '..', 'node_modules', 'magic-string', 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.main = './dist/index.cjs';
      pkg.exports = {
        '.': {
          'require': './dist/index.cjs',
          'import': './dist/index.mjs',
          'default': './dist/index.mjs'
        },
        './package.json': './package.json'
      };
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
    }
  }
} catch (e) {
  // Silent fallback
}
