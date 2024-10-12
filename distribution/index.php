<?php

if (!isset($_GET["settings"]) || !isset($_GET["v"])) {
    echo 'Invalid link!';
    return;
}

$version = intval(substr($_GET["v"], 1));
if ($version < 43) {
    echo 'Not implemented for versions before v043';
    return;
}

$settings = $_GET["settings"];

$has_fragments = str_contains($settings, 'Z');
$vanilla_core = str_contains($settings, 'z');
$all_on_bosses = str_contains($settings, 'O');
$mix_gourds_and_alchemists = str_contains($settings, 'A') && str_contains($settings, 'G');
$mix_gourds_and_bosses = str_contains($settings, 'B') && str_contains($settings, 'G');
$mix_alchemists_and_bosses = str_contains($settings, 'A') && str_contains($settings, 'B');

if ($all_on_bosses && !str_contains($settings, 'B')) {
    $random = true;  // all on bosses behaves as random if bosses are not in the pool
    $all_on_bosses = false;
} else {
    $random = str_contains($settings, 'o');
}

$has_sniff_pool = $version >= 48;
$mix_sniff_and_bosses = $has_sniff_pool && str_contains($settings, 'S') && str_contains($settings, 'B');
$mix_sniff_and_gourds = $has_sniff_pool && str_contains($settings, 'S') && str_contains($settings, 'G');
$mix_sniff_and_alchemist = $has_sniff_pool && str_contains($settings, 'S') && str_contains($settings, 'A');

$gourd_drops = [
    "Gauge",
    "Knight Basher",
    "Laser Lance",
    "Atom Smasher",
];
if (!$vanilla_core && !$has_fragments) {
    $gourd_drops[] = "Energy Core";
}

const ALCHEMY = [
    "Levitate",
    "Revealer",
];

const BOSS_DROPS = [
    "Wheel", "Gladiator Sword", "Crusader Sword",
    "Spider Claw", "Bronze Axe", "Horn Spear", "Bronze Spear",
    "Lance (Weapon)", "Diamond Eye", "Diamond Eye", "Diamond Eye"
];

if ($all_on_bosses) {
    $gourd_items = [];
    $alchemist_items = [];
    $boss_items = BOSS_DROPS;
    $sniff_items = [];
    if ($mix_gourds_and_bosses) {
        $boss_items = array_merge($boss_items, $gourd_drops);
    } else {
        $gourd_items = $gourd_drops;
    }
    if ($mix_alchemists_and_bosses) {
        $boss_items = array_merge($boss_items, ALCHEMY);
    } else {
        $alchemist_items = ALCHEMY;
    }
    $total_gourds = count($gourd_items);
    $total_alchemists = count($alchemist_items);
    $total_bosses = count($boss_items);
    $total_sniff = count($sniff_items);
}
else {
    $gourd_items = $gourd_drops;
    $alchemist_items = ALCHEMY;
    $boss_items = BOSS_DROPS;
    $sniff_items = [];
    if ($mix_gourds_and_alchemists) {
        $alchemist_items = array_merge($alchemist_items, $gourd_drops);
        $gourd_items = array_merge($gourd_items, ALCHEMY);
    }
    if ($mix_gourds_and_bosses) {
        $boss_items = array_merge($boss_items, $gourd_drops);
        $gourd_items += array_merge($gourd_items, BOSS_DROPS);
    }
    if ($mix_alchemists_and_bosses) {
        $boss_items += array_merge($boss_items, ALCHEMY);
        $alchemist_items += array_merge($alchemist_items, BOSS_DROPS);
    }
    if ($random && $mix_sniff_and_alchemist) {
        $sniff_items = array_merge($sniff_items, ALCHEMY);
    }
    if ($random && $mix_sniff_and_bosses) {
        $sniff_items = array_merge($sniff_items, BOSS_DROPS);
    }
    if ($random && $mix_sniff_and_gourds) {
        $sniff_items = array_merge($sniff_items, $gourd_drops);
    }
    if ($random && ($mix_gourds_and_alchemists || $mix_gourds_and_bosses || $mix_sniff_and_gourds)) {
        $total_gourds = "?";
    } else {
        $total_gourds = count($gourd_drops);
    }
    if ($random && ($mix_alchemists_and_bosses || $mix_gourds_and_alchemists || $mix_sniff_and_alchemist)) {
        $total_alchemists = "?";
    } else {
        $total_alchemists = count(ALCHEMY);
    }
    if ($random && ($mix_gourds_and_bosses || $mix_alchemists_and_bosses || $mix_sniff_and_bosses)) {
        $total_bosses = "?";
    } else {
        $total_bosses = count(BOSS_DROPS);
    }
    if ($random && ($mix_sniff_and_gourds || $mix_sniff_and_alchemist || $mix_sniff_and_bosses)) {
        $total_sniff = "?";
    } else {
        $total_sniff = 0;
    }
}

sort($gourd_items);
sort($alchemist_items);
sort($boss_items);
sort($sniff_items);

if (count($gourd_items) == 0) {
    $gourd_items = ["None"];
}
if (count($alchemist_items) == 0) {
    $alchemist_items = ["None"];
}
if (count($boss_items) == 0) {
    $boss_items = ["None"];
}
if (count($sniff_items) == 0) {
    $sniff_items = ["None"];
}

if (!$mix_gourds_and_alchemists && !$mix_gourds_and_bosses && !$mix_sniff_and_gourds) {
    $gourd_fragments = "All";
    $alchemist_fragments = "None";
    $boss_fragments = "None";
    $sniff_fragments = "None";
} else {
    $gourd_fragments = "Any";
    if ($mix_gourds_and_alchemists) {
        $alchemist_fragments = "Any";
    }
    else {
        $alchemist_fragments = "None";
    }
    if ($mix_gourds_and_bosses) {
        $boss_fragments = "Any";
    } else {
        $boss_fragments = "None";
    }
    if ($mix_sniff_and_gourds) {
        $sniff_fragments = "Any";
    } else {
        $sniff_fragments = "None";
    }
}

$max_rows = max(count($gourd_items), count($alchemist_items), count($boss_items), count($sniff_items));

require('views/distribution.php');
