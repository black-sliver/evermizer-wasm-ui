const fs = require("fs");
const path = require('node:path');
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;

const { cleandir } = require("rollup-plugin-cleandir");
const copy = require("rollup-plugin-copy");
const scss = require('rollup-plugin-scss');
const terser = require('@rollup/plugin-terser');

const remove_assets_js = function(opts = {}) {
    return {
        name: "remove-assets-js",
        generateBundle(outputOptions, bundle) {
            for (const key of Object.keys(bundle)) {
                if (key.match(/assets\.[\w-]+\.js/)) {
                    delete bundle[key];
                }
            }
        }
    }
}

const hash_map_php = function(opts = {}) {
    return {
        name: "hash-map-php",
        generateBundle(outputOptions, bundle) {
            let s = "<?php\n";
            s += "return array(\n";

            for (const key of Object.keys(bundle)) {
                const hashedFile = key;
                const originalFile = key.replace(/\.([\w-]+)(\.css|\.js)$/, "$2");            

                s += (`    ${JSON.stringify(originalFile)} => ${JSON.stringify(hashedFile)},\n`);
            }

            s += ");\n";
            s += "?>\n";

            fs.writeFileSync(path.join(outputOptions.dir, "manifest.hash.php"), s);
        }
    }
}

const renderPHP = function(src, dst, cwd, deleteSrc, callback) {
    return {
        name: "render-php",
        closeBundle() {
            cwd = cwd || __dirname;
            if (spawnSync(`php "${src}" > "${dst}"`, {
                shell: true,
                cwd: cwd,
                stdio: "inherit",
                env: process.env,
            }).status != 0) throw new Error("render-php failed");
            if (deleteSrc === true) {
                fs.unlinkSync(path.join(cwd, src));
            }
            if (callback) callback();
        }
    }
}

const buildStaticDistrubution = function(src, dst, version) {
    return {
        name: "build-static-distribution",
        closeBundle() {
            src = path.resolve(src);
            dst = path.resolve(dst);
            fs.mkdirSync(dst, '0755', true);
            console.log(`${src} -> ${dst} for ${version}`);
            spawnSync(`echo "${src}/bin/build-static.php" "${version}"`, {
                shell: true,
                cwd: dst,
                stdio: "inherit",
                env: process.env,
            });
            if (spawnSync(`php "${src}/bin/build-static.php" "${version}"`, {
                shell: true,
                cwd: dst,
                stdio: "inherit",
                env: process.env,
            }).status != 0) throw new Error("build-static-distribution failed");
            return spawn(`npm x -- html-minifier-terser `
                + `--collapse-whitespace --minify-css --minify-js --preserve-line-breaks `
                + `--input-dir "${dst}" --output-dir "${dst}"`,
            {
                shell: true,
                cwd: __dirname,
                stdio: "inherit",
                env: process.env,
            });
        }
    }
}

module.exports = function(cliArgs) {
    const variant = cliArgs.variant || 'default';
    const version = cliArgs.version || 'v050'; // TODO: get max version from ./evermizer.js
    delete cliArgs.variant;
    delete cliArgs.version;
    if (variant !== 'default' && variant !== 'static') {
        throw new Error(`Unknown variant ${variant}. Valid values: 'default', 'static'.`)
    }
    console.log(`building ${variant} for version ${version}`);

    let extraPlugins = [];

    let copies = [
        { src: 'index.php', dest: 'dist' },
        { src: 'views', dest: 'dist' },
        { src: 'evermizer.js', dest: 'dist' },
        { src: '*.png', dest: 'dist' },
        { src: 'LICENSE', dest: 'dist' },
    ];

    if (variant === 'default') {
        copies = copies.concat([
            { src: 'distribution/index.php', dest: 'dist/distribution' },
            { src: 'distribution/views', dest: 'dist/distribution' },
        ]);
    } else {
        extraPlugins = extraPlugins.concat([
            renderPHP('dist/index.php', 'dist/index.html', '', true, function() {
                fs.rmSync('dist/views', {'recursive': true});
            }),
            buildStaticDistrubution('distribution', 'dist/distribution', version),
        ]);
    }

    return {
        input: ['./ui.js', './assets.js'],
        output: {
            dir: 'dist',
            entryFileNames: '[name].[hash].js',
            assetFileNames: '[name].[hash][extname]',
        },
        plugins: [
            terser(),
            scss({
                name: 'ui.css',
                outputStyle: "compressed",
            }),
            cleandir('dist'),
            remove_assets_js(),
            hash_map_php(),
            copy({
              targets: copies,
            }),
        ].concat(extraPlugins),
    }
}
