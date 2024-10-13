<?php
//ini_set('zlib.output_compression', 1);

const VERBOSE = false;
$args = ''; // perma link
$versions = [];
$jsdir = 'evermizer.js';

if (isset($_GET['weekly'])) {
    // weekly seed code - see also Module.onRuntimeInitialized
    $week = urlencode($_GET['weekly']);
    $settings = null;
    try {
        // sets the following from $week:
        // $readonly, $week, $args, $seeddate, $seed, $data, $ver, $mystery
        @require_once('../weekly/gen.inc.php');
        // load the weekly override, if any
        @require_once('../weekly/override.inc.php');
    } catch (\Throwable $e) {
        echo 'Weekly seed configuration not available!';
        return;
    }
} else {
    // regular evermizer
    // urlencode is not perfect, since JS will also encode, but we should only use digits and letters anyway.
    $week = null;
    $weekly_version = 0;
    $data = null;
    $override = null;

    $ver = isset($_GET['v']) ? urlencode($_GET['v']) : null;
    $seed = isset($_GET['seed']) ? htmlentities($_GET['seed']) : null;
    if ($seed !== null) {
        $args .= '&seed=' . urlencode($_GET['seed']);
    }
    $settings = isset($_GET['settings']) ? htmlentities($_GET['settings']) : null;
    if ($settings !== null) {
        $args .= '&settings=' . urlencode($_GET['settings']);
    }
    $mystery = boolval($_GET['mystery'] ?? null);
    if ($mystery) {
        $args .= '&mystery=' . urlencode($_GET['mystery']);
    }
    $readonly = boolval($_GET['ro'] ?? null);
    if ($readonly && $ver !== null) {
        $versions[] = $ver; // fixed version
    } else {
        foreach (scandir($jsdir, 1) as $v) {
            $v = urlencode($v); // to match $_GET, see above
            if (substr($v, 0, 1) != 'v') {
                continue;
            }
            if ($ver === null && substr($v, -1) != 'd') {
                $ver = $v; // select first non-dev version
            }
            $versions[] = $v;
        }
    }
}

// wasm version as integer
$evermizer_version_number = intval(substr($ver,1));

$GLOBALS['manifest_hash'] = @include(__DIR__ . '/manifest.hash.php');

function style_file($name) {
    $manifest_hash = $GLOBALS['manifest_hash'];

    if ($manifest_hash) {
        return $manifest_hash[$name] ?? null;
    } else {
        return $name;
    }
}

function script_file($name) {
    $manifest_hash = $GLOBALS['manifest_hash'];

    if ($manifest_hash) {
        return $manifest_hash[$name] ?? null;
    } else {
        return $name;
    }
}

require_once(__DIR__ . '/views/ui.php');
