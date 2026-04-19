const { src, dest } = require('gulp');

/**
 * Copies node icons (SVG/PNG) from source folders into dist/ so n8n can render
 * them in the node picker. TypeScript's compiler doesn't emit non-code assets,
 * so this gulp task runs alongside `tsc` in `npm run build`.
 */
function buildIcons() {
  return src('nodes/**/*.{png,svg}').pipe(dest('dist/nodes/'));
}

exports['build:icons'] = buildIcons;
