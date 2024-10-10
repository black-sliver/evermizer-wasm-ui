# Evermizer.js UI

This is a PHP + JS user interface around
[Evermizer](https://github.com/black-sliver/evermizer) WASM.

## Why PHP/server?

* Easy way to switch between versions
* Weekly seed meta data is generated on the server

Everything else could be done in JS; the current split is arbitrary.

## package.json? rollup.config.js?

We use rollup (+ terser + scss) to minify and version JS and CSS files.

Use `npm run build` to create a dist folder,
but you can also host directly from source.

## How to run locally

Put a WASM build of evermizer into `./evermizer.js/vXXX`. Better instructions TBD.

`php -S localhost:8000` and navigate to http://localhost:8000
or use Apache with mod\_php.

## Why not ES6 modules?

I believe proper modules are the future, however the JS landscape is a mess,
so I did not invest more time than needed.

Evermizer.js (the WASM part) uses emscripten, which uses closure-compiler,
which is not fully compatible to ES modules.

PRs are welcome.

## Why AGPL?

I want improvements to be made available to everyone.

Evermizer is still GPL/LGPL (depending on the use).

## TODO

Add zstd support to evermizer.js/.htaccess.
