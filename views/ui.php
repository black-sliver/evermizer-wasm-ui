<!doctype html>
<html lang="en-us">

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Evermizer.js</title>
    <style>
        <?php include(style_file('ui.css')); ?> 
    </style>
</head>

<body>
    <noscript>
        This is the javascript version. No ROM will hit the wire. You need javascript for this to work.
        <a href="/#rando">Click here for the Desktop version</a>.
    </noscript>
    <form id="ui" class="hidden<?= $readonly ? ' ro' : '' ?>">
        Evermizer
        <label for="version">Version:</label>
        <select id="version"<?= $readonly ? " readonly disabled" : "" ?>>
            <?php foreach ($versions as $v) { ?>
            <option value="<?= $v ?>" <?= ($v == $ver) ? ' selected' : '' ?>><?= $v ?></option>
            <?php } ?>
        </select>
        <?php if ($readonly) { ?>
        <span id="ro">This is a race/read-only link</span>
        <?php } ?>

        <label id="drop" for="rom">Loading...</label>
        <input type="file" id="rom" accept=".sfc,.smc<?php /*,application/vnd.nintendo.snes.rom*/ ?>" />
        <div id="cfg">
            <div>
                <label for="seed">Seed:</label>
                <input id="seed" type="text" placeholder="blank for random" value="<?= $seed ?? '' ?>" <?= isset($data) ? ' style="display:none"/>&nbsp;Weekly ' . $week : '/>' ?> </div>
                <div>
                    <label></label>
                    <input id="mystery" type="checkbox" <?= $mystery ? 'checked="checked"' : '' ?> /> <label for="mystery" style="display:inline-block;">Mystery</label>
                </div>
                <div class="nomystery forced-hidden">
                    <label for="preset">Presets:</label>
                    <select id="preset"></select>
                    <button type="button" id="apply_preset">Apply Preset</button>
                </div>
                <div class="nomystery">
                    <label for="settings">Settings:</label>
                    <input id="settings" type="text"<?= !$readonly ? ' placeholder="or use checkboxes below"' : '' ?> />
                </div>
                <div class="hidden nomystery">
                    <label>Difficulty:</label>
                    <div id="difficulties"></div>
                </div>
                <div class="hidden nomystery">
                    <label>Options:</label>
                    <span style="display:block; font-size: 0.75em; padding: 10px 0 0 5px">hover over an option to see what it does</span>
                    <div id="options"></div>
                </div>
                <div><label></label>
                    <div><button id="run">Generate ROM</button><span id="perma"></span><span id="distribution"></span></div>
                </div>
            </div>
            <footer>Visit <a href="/">Home</a> for more information.</footer>
    </form>
    <script type='text/javascript'>
        var ready;
        var outBuf = errBuf = '';
        var Module = {
            preRun: [],
            postRun: [],
            totalDependencies: 0,
            print: function(s) {
                if (arguments.length > 1) s = Array.prototype.slice.call(arguments).join('\n');
                outBuf += s + '\n'; // stdout
<?php if (VERBOSE) { ?>
                if (s) console.log(s);
<?php } ?>
            },
            printErr: function(s) {
                if (arguments.length > 1) s = Array.prototype.slice.call(arguments).join('\n');
                errBuf += s + '\n'; // stderr
                if (s) console.error(s);
            },
            setStatus: function(s) {
                if (s) console.log(s);
            },
<?php if (VERBOSE) { ?>
            monitorRunDependencies: function(left) {
                if (!left) Module.setStatus('All downloads complete.');
            },
<?php } ?>
            onRuntimeInitialized: function() {
                ready = true;
                updateSettings(
                    <?= json_encode($data) ?>,
                    <?= json_encode($weekly_version) ?>,
                    <?= json_encode($settings) ?>,
                    <?= json_encode($seed) ?>,
                    <?= json_encode($readonly) ?>,
                    <?= json_encode($mystery) ?>);
                let drop = document.getElementById('drop');
                drop.innerHTML = dropInfo;
            }
        };

        Module.setStatus('Loading...');
        window.onerror = function(e) {
            let drop = document.getElementById('drop');
            drop.innerHTML = "Error!<br/>Try again later";
            Module.setStatus('Exception thrown');
        };
        var uriargs = <?= json_encode($args) ?>;
        var weekly = <?= json_encode($week !== null ? "weekly-$week" : null) ?>;
        var evermizer_version = <?= json_encode($evermizer_version_number) ?>;
        var override = <?= json_encode($override) ?>;
    </script>
    <script type="text/javascript" src="<?= script_file('ui.js') ?>"></script>
    <script type="text/javascript" src="evermizer.js/<?= $ver ?>/evermizer.js"></script>
</body>

</html>
