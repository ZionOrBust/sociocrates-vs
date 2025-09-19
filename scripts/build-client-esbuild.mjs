import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const clientRoot = path.join(projectRoot, 'client');
const outDir = path.join(clientRoot, 'dist');

async function main() {
  try {
    // Ensure output directory exists
    fs.mkdirSync(outDir, { recursive: true });

    const result = await build({
      entryPoints: [path.join(clientRoot, 'src/main.tsx')],
      bundle: true,
      splitting: true,
      format: 'esm',
      sourcemap: true,
      logLevel: 'info',
      outdir: outDir,
      entryNames: 'assets/[name]-[hash]',
      chunkNames: 'assets/[name]-[hash]',
      assetNames: 'assets/[name]-[hash]',
      jsx: 'automatic',
      tsconfig: path.join(clientRoot, 'tsconfig.json'),
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
      metafile: true,
      loader: {
        '.png': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.svg': 'file',
        '.css': 'css',
      },
    });

    // Find emitted JS and CSS for main entry
    const outputs = result.metafile.outputs;
    let jsFile = null;
    let cssFile = null;

    for (const [outfile, info] of Object.entries(outputs)) {
      const isEntry = info.entryPoint && info.entryPoint.endsWith('src/main.tsx');
      if (isEntry && outfile.endsWith('.js')) jsFile = path.relative(outDir, outfile);
      if (isEntry && outfile.endsWith('.css')) cssFile = path.relative(outDir, outfile);
    }

    if (!jsFile) {
      throw new Error('Failed to locate bundled JS entry for main.tsx');
    }

    // Read original HTML and rewrite script/css tags
    const htmlSrcPath = path.join(clientRoot, 'index.html');
    let html = fs.readFileSync(htmlSrcPath, 'utf8');

    // Replace Vite script tag with built bundle served under /app
    html = html.replace(/<script[^>]*src=\"[^\"]*src\/main\.tsx\"[^>]*><\/script>/, `<script type=\"module\" src=\"/app/${jsFile.replace(/\\\\/g, '/')}\"></script>`);

    // Inject CSS link if present
    if (cssFile && !html.includes(cssFile)) {
      const linkTag = `<link rel=\"stylesheet\" href=\"/app/${cssFile.replace(/\\\\/g, '/')}\">`;
      html = html.replace(/<\/head>/, `${linkTag}\n</head>`);
    }

    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

    console.log('✅ Client built with esbuild');
  } catch (err) {
    console.error('❌ Esbuild client build failed:', err?.message || err);
    process.exit(1);
  }
}

main();
