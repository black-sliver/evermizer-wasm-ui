<!DOCTYPE html>
<html>
    <head>
        <title>Item Distribution</title>
        <?= $style ?>
    </head>
    <body>
        <noscript>Javascript required</noscript>
        <script>
            document.body.innerText = "Loading ...";
            const relevant = <?= json_encode($all_relevant_chars) ?>;
            const duplicates = <?= json_encode($duplicates) ?>;
            const settings = (new URLSearchParams(window.location.search)).get('settings') || '';
            let reduced = '';
            relevant.split('').forEach((c) => { if (settings.includes(c)) reduced += c; });
            reduced = duplicates[reduced] || reduced;
            fetch(`static-${reduced}.html`)
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                return response.text();
            })
            .then((text) => {
                let doc = (new DOMParser).parseFromString(text, 'text/html');
                document.body.outerHTML = doc.body.outerHTML;
            })
            .catch((err) => {
                document.body.innerText = err;
            });
        </script>
    </body>
</html>
