<?php

if (!isset($argv)) {
    echo 'Please run from console';
    return 1;
}
if (!str_starts_with($argv[1] ?? '', 'v')) {
    echo "Usage: {$argv[0]} <version>\n";
    return 1;
}

$version = $argv[1];

$relevant_chars = [
  ['', 'A'],
  ['', 'B'],
  ['', 'G'],
  ['', 'o', 'O'],
  ['', 'S'],
  ['', 'z', 'Z'],
];

$yield_imploded = function($strs) {
    foreach ($strs as $str) {
        yield implode('', $str);
    }
};
$all_relevant_chars = implode('', iterator_to_array($yield_imploded($relevant_chars)));

function string_product($list) {
    if (count($list) > 1) {
        foreach ($list[0] as $part) {
            foreach (string_product(array_slice($list, 1)) as $rest) {
                yield $part . $rest;
            }
        }
    } else {
        foreach ($list[0] as $part) {
            yield $part;
        }
    }
}

$unique = array();
$duplicates = array();
$style = '';

$render = function($version, $settings) {
    if (!isset($_GET)) {
        $_GET = array();
    }
    $_GET["v"] = $version;
    $_GET["settings"] = $settings;
    ob_start();
    @include(__DIR__ . '/../index.php'); // @ required because of const
    $content = ob_get_contents();
    ob_end_clean();
    return $content;
};

foreach (string_product($relevant_chars) as $settings) {
    echo "Generating ?v=$version&settings=$settings ...\n";
    $content = $render($version, $settings);
    $content = preg_replace('/<title>Item Distribution for.*?<\/title>/si',
                            '<title>Item Distribution</title>',
                            $content, 1);
    if ($style === '') {
        preg_match_all('/<style>.+?<\/style>\n?/si', $content, $matches);
        foreach ($matches as $match) {
            $style .= $match[0];
        }
    }
    foreach ($unique as $old_settings => $old_content) {
        if ($old_content === $content) {
            $duplicates[$settings] = $old_settings;
            continue 2;
        }
    }
    $unique[$settings] = $content;
}

foreach ($unique as $settings => $content) {
    echo "Writing unique $settings ...\n";
    $f = fopen("static-$settings.html", "w");
    fwrite($f, $content);
    fclose($f);
}
echo "Total unique: ".count($unique)."\n";
echo "Total duplicates: ".count($duplicates)."\n";

ob_start();
require(__DIR__ . '/../views/static-index.php');
$f = fopen('index.html', 'w');
fwrite($f, ob_get_contents());
fclose($f);
ob_end_clean();
