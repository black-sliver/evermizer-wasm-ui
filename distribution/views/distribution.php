<!DOCTYPE html>
<html>
    <head>
        <title>Item Distribution for <?= htmlentities($settings, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401); ?></title>
        <style>
            body {
                color: #fff;
                background: #000;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 16px;
                padding: 16px;
            }
            thead {
                font-weight: bold;
            }
            table {
                border-collapse: collapse;
            }
            td {
                padding: 3px 5px;
                
            }
            th {
                text-align: right;
            }
        </style>
    </head>
    <body>
        <table>
            <thead>
                <tr><td></td><td>Gourds</td><td>Alchemists</td><td>Bosses</td><td>Sniff Spots</td></tr>
            </thead>
            <tbody>
                <tr><th>Key Items:</th><td><?= $total_gourds ?></td><td><?= $total_alchemists ?></td><td><?= $total_bosses ?></td><td><?= $total_sniff ?></td></tr>
    <?php if ($has_fragments) { ?>
                <tr><th>Fragments:</th><td><?= $gourd_fragments ?></td><td><?= $alchemist_fragments ?></td><td><?= $boss_fragments ?></td><td><?= $sniff_fragments ?></tr>
    <?php } ?>
    <?php for ($i=0; $i < $max_rows; $i++) { ?>
                <tr>
                    <?php if ($i == 0) { ?><th>Possible Items:</th><?php } else { ?><td></td><?php } ?>
                    <td><?= $gourd_items[$i] ?? '' ?></td>
                    <td><?= $alchemist_items[$i] ?? '' ?></td>
                    <td><?= $boss_items[$i] ?? '' ?></td>
                    <td><?= $sniff_items[$i] ?? '' ?></td>
                </tr><tr>
    <?php } ?>
                </tr>
            </tbody>
        </table>
    </body>
</html>
