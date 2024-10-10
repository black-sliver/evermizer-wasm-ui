const fs = require("fs");
const path = require('node:path');

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

module.exports = {
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
          targets: [
            { src: 'index.php', dest: 'dist' },
            { src: 'views', dest: 'dist' },
            { src: 'distribution', dest: 'dist' },
            { src: 'evermizer.js', dest: 'dist' },
            { src: '*.png', dest: 'dist' },
            { src: 'LICENSE', dest: 'dist' },
          ]
        }),
    ],
}
