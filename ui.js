(function(){

function el(id) {
  return document.getElementById(id); // definitely too lazy to write that out
}
let ui = el("ui"),
  drop = el("drop"),
  rom = el("rom"),
  version = el("version"),
  seed = el("seed"),
  cfg = el("cfg"),
  settings = el("settings"),
  perma = el("perma"),
  distribution = el("distribution"),
  difficulties = el("difficulties"),
  options = el("options"),
  runbtn = el("run"),
  grp_general = el("opt_grp_general"),
  sub_grp_items = el("opt_sub_grp_items"),
  sub_grp_other = el("opt_sub_grp_other"),
  sub_grp_cosmetic = el("opt_sub_grp_cosmetic"),
  grp_accessability = el("opt_grp_accessability"),
  grp_qol = el("opt_grp_qol"),
  grp_fun = el("opt_grp_fun"),
  preset = el("preset"),
  apply_preset = el("apply_preset");
let romname = "";
let logname = "";
let radios = {};
let checkboxes = {};
let args = {};
let groups = {};
let presets = {};
let sfc = new Image();
sfc.src = "sfc.png";
let dropInfo =
  "Drag your ROM here or click to browse<br/>It won't leave your PC";
let is_mystery = false;
ui.classList.remove("hidden");
let g = globalThis; // global "exports"/"imports" (see HTML)

function readBlob(fn, mime) {
  return new Blob([FS.readFile(fn, { encoding: "binary" })], { type: mime });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  return a;
}

function downloadFS(fn, mime) {
  console.log(fn);
  downloadBlob(readBlob(fn, mime), fn.split("/").pop());
}

function mkPerma() {
  let s = seed.value || (romname ? seed.placeholder : "");
  let l = "?v=" + encodeURI(version.value) + "&seed=" + encodeURI(s);
  if (is_mystery) {
    l += "&mystery=1";
  } else {
    l += "&settings=" + encodeURI(settings.value || "r");
    for (let n in args)
      l += "&" + encodeURI(n) + "=" + encodeURI(args[n].value);
  }
  const sep = is_mystery ? "" : ", ";
  perma.innerHTML = s
    ? '<a href="' +
      l +
      '">Perma-Link</a>, <a href="' +
      l +
      '&ro=1">Race-Link</a>' +
      sep
    : "";
}

function mkDistributionHelp() {
  if (is_mystery) {
    distribution.innerHTML = "";
  } else {
    let l =
      "?v=" +
      encodeURI(version.value) +
      "&settings=" +
      encodeURI(settings.value || "r");
    distribution.innerHTML =
      '<a href="distribution' +
      l +
      '" target="_blank">Item Distribution Help</a>';
  }
}

function runExe(args) {
  outBuf = errBuf = "";
  let res = callMain(args);
  g.run(); // re-init
  // NOTE: added warnings in v043, so we can't rely on errBuf being empty
  return res == 0;
}

function uniqueci(s) {
  let res = "";
  let lower = s.toLowerCase();
  for (let i = 0; i < s.length; i++) if (i === lower.lastIndexOf(lower[i])) res += s[i];
  return res;
}

function setEnabled(e, val) {
  // helper to disable e if e exists: don't crash for new ui.js with old wasm
  if (Array.isArray(e)) e = e[0]; // checkboxes[x] -> checkbox[x][0]
  if (e) e.disabled = !val;
}

function updateDisabledSetting() {
  let s = settings.value;
  let bossPool = s.includes("B");
  let anyPool = bossPool || s.includes("A") || s.includes("G");
  let pupper = s.includes("p");
  let fragments = s.includes("Z");
  setEnabled(checkboxes["o,0"], anyPool);
  setEnabled(checkboxes["o,1"], anyPool);
  setEnabled(checkboxes["O"], bossPool);
  if (s.includes("O") && !bossPool) {
    //checkboxes['O'][0].checked = false;
    checkboxes["o,1"][0].checked = true;
  }
  setEnabled(checkboxes["d,0"], !pupper);
  setEnabled(checkboxes["d,1"], !pupper);
  setEnabled(checkboxes["D"], !pupper);
  setEnabled(el("a_required-fragments"), fragments);
  setEnabled(el("random_a_required-fragments"), fragments);
  setEnabled(el("a_available-fragments"), fragments);
  setEnabled(el("random_a_available-fragments"), fragments);
}

function updateSettingsString() {
  let s = "r";

  for (let k in radios) {
    let r = radios[k];
    if (r[0].checked && r[0].checked != r[1]) s += k;
  }
  for (let k in checkboxes) {
    let c = checkboxes[k];
    if (c[0].checked != c[1]) s += k[1] ? k[0] : k;
  }
  settings.value = s === "r" ? "" : uniqueci(s);
  updateDisabledSetting();
  mkPerma();
  mkDistributionHelp();
}

function updateSettingsChecks() {
  let t = settings.value;
  let s = uniqueci(t.split("r").pop());
  if (t !== s && t !== "r" + s) settings.value = "r" + s;
  let rset = false;
  for (let i = 0; i < s.length; i++) {
    let ch = s[i];
    let r = radios[ch];
    if (r) {
      rset = true;
      r[0].checked = true;
    }
  }
  for (let k in checkboxes) {
    let c = checkboxes[k];
    if (k[1]) k = k[0];
    c[0].checked = c[1] ^ s.includes(k);
  }
  if (!rset)
    for (let k in radios) if (radios[k][1]) radios[k][0].checked = true;
  updateDisabledSetting();
  mkPerma();
  mkDistributionHelp();
}

function randomOptions(data, version, skip_seed) {
  // IMPORTANT: make sure to keep cron in sync
  if (!skip_seed) {
    let h1 = 0,
      h2 = 0;
    for (let i = 0; i < data.length - 1; i++) {
      h1 = ((h1 << 5) - h1 + data.charCodeAt(i)) | 0;
      h2 = ((h2 << 5) - h2 + data.charCodeAt(i + 1)) | 0;
    }
    seed.value = (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }
  let rand = function (lo, hi) {
    lo = parseInt(lo) || 0;
    hi = parseInt(hi) || 1;
    let r = 0;
    let bits = Math.log2(hi - lo + 1);
    if (version > 1) {
      if (bits % 1 !== 0) bits += 1; // more entropy
    }
    while (bits > 0) {
      r <<= 4;
      r |= parseInt(data[0], 16);
      data = data.substr(1);
      bits -= 4;
    }
    return lo + (r % (hi - lo + 1));
  };
  let exclude = "lk3bguUJ"; // uUJ new in v45
  let rare = "t"; // 1 in 16
  // v1
  let infrequent = ""; // 1 in 4
  let lessfrequent = ""; // 1 in 3
  let frequent = ""; // 3 in 4
  let always = "";
  let invert = "";
  if (version > 1) {
    // v2
    infrequent = "12apO"; // 1 in 4
    frequent = "6f"; // 3 in 4
    always = "9";
    // v3+ (flags do not exist <=2)
    infrequent += "O";
    veryfrequent = "ABG"; // 5 in 6
    // new in evermizer v42 (flags do not exist before)
    infrequent += "zZ";
    // new in evermizer v45 (j replaces 1)
    infrequent += "j";
  }
  // v4
  if (version >= 4 && !is_mystery) {
    exclude = exclude.replace("l", "");
    rare += "l";
  }
  // v5
  if (version >= 5) {
    infrequent = infrequent.replace("Z", "");
    lessfrequent += "Z";
  }
  // version specific
  if (g.evermizer_version > 40) {
    // evermizer v41 inverts some defaults
    invert = "f9";
  }
  if (g.evermizer_version >= 48) {
    // new in evermizer v48:
    // v replaces S, S has a different meaning (not in weekly yet), v needs 33% to have the same balancing
    exclude += "S";
    lessfrequent += "v";
  }

  settings.value = Object.keys(radios)[rand(0, Object.keys(radios).length - 1)];
  if (settings.value === "n") settings.value = "r";
  Object.keys(checkboxes).forEach(function (k) {
    if (exclude.indexOf(k[0]) !== -1) return;
    if (checkboxes[k][2]) return;
    if (version > 2 && checkboxes[k][1]) return; // NOTE: this seems to have been a bug in the random settings
    let inverted = invert.indexOf(k[0]) !== -1;
    if (rare.indexOf(k[0]) !== -1) {
      if (!rand(0, 15) !== inverted) settings.value += k[0];
    } else if (infrequent.indexOf(k[0]) !== -1) {
      if (!rand(0, 3) !== inverted) settings.value += k[0];
    } else if (lessfrequent.indexOf(k[0]) !== -1) {
      if (!rand(0, 2) !== inverted) settings.value += k[0];
    } else if (frequent.indexOf(k[0]) !== -1) {
      if (!!rand(0, 3) !== inverted) settings.value += k[0];
    } else if (veryfrequent.indexOf(k[0]) !== -1) {
      if (!!rand(0, 5) !== inverted) settings.value += k[0];
    } else if (always.indexOf(k[0]) !== -1) {
      if (!inverted) settings.value += k[0];
    } else {
      if (!rand() !== inverted) settings.value += k[0];
    }
  });
  Object.keys(args).forEach(function (k) {
    // v5
    if (version >= 5 && k === "exp") {
      args[k].value = rand(args[k].value * 1.25, args[k].value * 2.2); // +5% max
    } else if (version >= 5 && k === "money") {
      args[k].value = rand(args[k].value * 1.25, args[k].value * 2.8); // +5% max
      // v4
    } else if (version >= 4 && k === "exp") {
      args[k].value = rand(args[k].value * 1.25, args[k].value * 2.15);
    } else if (version >= 2) {
      if (k === "money")
        args[k].value = rand(args[k].value * 1.25, args[k].value * 2.75);
      else if (k === "exp")
        args[k].value = rand(args[k].value * 1.1, args[k].value * 2);
      // fragments
      else args[k].value = rand(args[k].value * 0.5, args[k].value * 3);
    } else {
      args[k].value = rand(args[k].value, args[k].value * 2);
    }
    if (k === "available-fragments")
      args[k].value = Math.max(args[k].value, args["required-fragments"].value);
  });
  // if override is set, override.
  if (g.override) {
    settings.value = g.override["settings"];
    Object.keys(g.override["args"]).forEach(function (k) {
      args[k].value = g.override["args"][k];
    });
  }
}

function pickRandomValueForArg(k) {
  let rand = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  if (k === "money") args[k].value = rand(125, 275);
  else if (k === "exp") args[k].value = rand(125, 215);
  else if (k === "available-fragments")
    args[k].value = rand(args["required-fragments"].value, args[k].max);
  else args[k].value = rand(args[k].min, args[k].max);
  args[k].dispatchEvent(new Event("change"));
}

function groupNameToId(name) {
  return (
    "opt_grp_" + name.toLowerCase().replaceAll(" ", "_").replaceAll('"', "")
  );
}

function subGroupNameToId(name) {
  return (
    "opt_sub_grp_" + name.toLowerCase().replaceAll(" ", "_").replaceAll('"', "")
  );
}

function insertGroup(parent, name) {
  let id = groupNameToId(name);
  let h =
    '<label for="' +
    id +
    '" class="opt_grp_label">' +
    name +
    '</label><div id="' +
    id +
    '" class="opt_grp"></div>';
  parent.insertAdjacentHTML("beforeend", h);
  let elm = el(id);
  groups[id] = elm;
  return elm;
}

function insertSubGroup(parent, name) {
  let id = subGroupNameToId(name);
  let h =
    '<label for="' +
    id +
    '" class="opt_sub_grp_label">' +
    name +
    '</label><div id="' +
    id +
    '" class="opt_sub_grp"></div>';
  parent.insertAdjacentHTML("beforeend", h);
  let elm = el(id);
  groups[id] = elm;
  return elm;
}

function getOrInsertGroup(parent, e) {
  if (e[6] && groups[subGroupNameToId(e[6])] && groups[groupNameToId(e[5])])
    //everything is inserted
    return groups[subGroupNameToId(e[6])];
  if (groups[groupNameToId(e[5])]) {
    if (e[6])
      return insertSubGroup(groups[groupNameToId(e[5])], e[6]); //subgroup is missing but group is there
    else return groups[groupNameToId(e[5])]; //group is there and no subgroup needed
  }
  let elm = insertGroup(parent, e[5]); //insert group
  if (e[6]) {
    elm = insertSubGroup(elm, e[6]); //insert subgroup if needed
  }
  return elm; //return group/subgroup
}

function updatePresets() {
  runExe(["--presets.json"]);
  if (!outBuf) return;
  if (outBuf.startsWith("OK{")) outBuf = outBuf.substr(2); // happens <v043 if run twice
  let s = JSON.parse(outBuf);
  let first = true;
  s.forEach(function (e) {
    presets[e["Name"]] = e;
    let h =
      '<option value="' +
      e["Name"] +
      '"' +
      (first ? " selected" : "") +
      ">" +
      e["Name"] +
      "</option>";
    preset.insertAdjacentHTML("beforeend", h);
    if (first) first = false;
  });
  preset.parentNode.classList.remove("forced-hidden");
}

function updateSettings(
  data,
  weekly_version,
  ssettings,
  sseed,
  readonly,
  mystery,
) {
  if (g.override)
    // should already be set, but make sure.
    mystery = g.override["mystery"];
  is_mystery = mystery;
  el("mystery").checked = mystery;
  if (!mystery && !readonly && !data) updatePresets();
  runExe(["--settings.json"]);
  if (outBuf.startsWith("OK{")) outBuf = outBuf.substr(2); // happens if run twice; TODO: fix this
  let s = JSON.parse(outBuf);
  let p = "[r";
  if (s["Difficulty Description"])
    difficulties.title = s["Difficulty Description"];
  if (s["Difficulty"])
    s["Difficulty"].forEach(function (e) {
      let id = "d_" + e[0];
      difficulties.insertAdjacentHTML(
        "beforeend",
        '<input type="radio" id="' +
          id +
          '" name="difficulty" value="+' +
          e[0] +
          '"/><label for="' +
          id +
          '"> ' +
          e[1] +
          "</label>",
      );
      let w = el(id);
      w.checked = e[2];
      radios[e[0]] = [w, e[2]];
      p += e[0];
      if (!readonly) w.addEventListener("click", updateSettingsString);
      difficulties.parentNode.classList.remove("hidden");
    });
  if (s["Options"])
    s["Options"].forEach(function (e) {
      let w;
      let id = "o_" + e[0];
      if (e[4]) {
        let h =
          '<div class="oname" id="t_' +
          id +
          '" title="' +
          e[3] +
          '">' +
          e[1] +
          ':</div><div title="' +
          e[3] +
          '">';
        for (n = 0; n < e[4].length; n++)
          h +=
            ' <input type="radio" id="' +
            id +
            "_" +
            n +
            '" name="' +
            id +
            '" value="+' +
            e[0] +
            '"/><label for="' +
            id +
            "_" +
            n +
            '"> ' +
            e[4][n] +
            "</label>";
        if (e[5]) {
          let g = getOrInsertGroup(options, e);
          g.insertAdjacentHTML("beforeend", h + "</div>");
        } else {
          options.insertAdjacentHTML("beforeend", h + "</div>");
        }
        for (n = 0; n < e[4].length; n++) {
          w = el(id + "_" + n);
          w.checked = e[2] === n;
          if (!readonly) w.addEventListener("click", updateSettingsString);
          let U = e[0].toUpperCase();
          if (n === 2 && e[0] != U) {
            p += U;
            checkboxes[U] = [w, e[2] == n];
          } else {
            checkboxes[[e[0], n]] = [w, e[2] == n];
          }
        }
        p += e[0];
      } else {
        options.insertAdjacentHTML(
          "beforeend",
          '<input type="checkbox" id="' +
            id +
            '" name="' +
            id +
            '" value="+' +
            e[0] +
            '"/><label for="' +
            id +
            '"> ' +
            e[1] +
            "</label><br/>",
        );
        w = el(id);
        w.checked = e[2];
        checkboxes[e[0]] = [w, e[2]];
        p += e[0] + e[0].toUpperCase();
        if (!readonly) w.addEventListener("click", updateSettingsString);
      }
      options.parentNode.classList.remove("hidden");
    });
  if (s["Args"])
    s["Args"].forEach(function (e) {
      let id = "a_" + e[0];
      let vmin = parseInt(e[7]);
      vmin = vmin !== NaN ? ' min="' + vmin + '"' : "";
      let vmax = parseInt(e[8]);
      vmax = vmax !== NaN ? ' max="' + vmax + '"' : "";
      let t =
        e[2] === "int" ? 'type="number" step="1"' + vmin + vmax : 'type="text"';
      let v = encodeURI(
        new URLSearchParams(window.location.search).get(e[0]) || e[3],
      );
      let h =
        '<div class="aname" id="t_' +
        id +
        '" title="' +
        e[4] +
        '"><label for="' +
        id +
        '">' +
        e[1] +
        ':</label></div><div title="' +
        e[4] +
        '" class="afield"><input ' +
        t +
        ' id="' +
        id +
        '" value="' +
        v +
        '"/>';
      if (!readonly)
        h +=
          '<button type="button" id="random_' +
          id +
          '" class="btn_random">Random</button>';
      h += "</div>";
      if (e[5]) {
        let g = getOrInsertGroup(options, e);
        g.insertAdjacentHTML("beforeend", h);
      } else {
        options.insertAdjacentHTML("beforeend", h);
      }
      let w = el(id);
      w.addEventListener("change", function () {
        let v = parseInt(w.value);
        let vmin = parseInt(w.min);
        let vmax = parseInt(w.max);
        if (vmin !== NaN && (v === NaN || v < vmin)) w.value = vmin;
        else if (vmax !== NaN && (v === NaN || v > vmax)) w.value = vmax;
      });
      if (e[0] === "required-fragments") {
        w.addEventListener("change", function () {
          let a = args["available-fragments"];
          a.value = Math.max(a.value, w.value);
        });
      }
      if (e[0] === "available-fragments") {
        w.addEventListener("change", function () {
          let r = args["required-fragments"];
          r.value = Math.min(r.value, w.value);
        });
      }
      w.addEventListener("change", mkPerma);
      args[e[0]] = w;
      if (!readonly)
        el("random_" + id).addEventListener("click", function (ev) {
          ev.preventDefault();
          pickRandomValueForArg(e[0]);
        });
      options.parentNode.classList.remove("hidden");
    });
  p += "]*";
  settings.pattern = p;
  updateSettingsString();
  if (mystery) cfg.classList.add("mystery");
  else cfg.classList.remove("mystery");
  if (data) {
    // weekly
    settings.value = "";
    randomOptions(data, weekly_version, false);
  } else if (is_mystery) {
    // mystery
    settings.value = "";
    seed.value = sseed;
  } else {
    // regular
    settings.value = ssettings;
    seed.value = sseed;
  }
  updateSettingsChecks();
  if (readonly) {
    [].forEach.call(
      document.querySelectorAll('input:not([type="file"])'),
      function (e) {
        e.readOnly = true;
        e.disabled = e.type !== "radio" || !e.checked;
      },
    );
  }
  let e = el("mystery");
  e.replaceWith(e.cloneNode(true)); // disconnect events
  e = el("mystery");
  if (!g.weekly)
    e.addEventListener("change", function () {
      options.innerHTML = "";
      difficulties.innerHTML = "";
      preset.innerHTML = "";
      checkboxes = {};
      radios = {};
      groups = {};
      presets = {};
      updateSettings(
        data,
        weekly_version,
        ssettings,
        sseed,
        readonly,
        e.checked,
      );
    });
}

function loadRom(f) {
  if (!f) return alert("Bad file");
  if (!g.ready) return alert("Still loading...");
  drop.innerText = "Checking...";
  f.arrayBuffer().then(function (buf) {
    FS.writeFile("/soe.sfc", new Uint8Array(buf));
    if (!runExe(["--verify", "/soe.sfc"])) {
      ui.classList.remove("loaded");
      FS.unlink("/soe.sfc");
      drop.innerHTML = dropInfo;
      return alert(errBuf);
    }
    ui.classList.add("loaded");
    let e = document.createElement("div");
    e.innerText = f.name;
    drop.innerHTML = "";
    drop.appendChild(sfc);
    drop.appendChild(e);
  });
}

settings.addEventListener("change", updateSettingsChecks);
seed.addEventListener("change", mkPerma);
version.addEventListener("change", function (e) {
  window.location.href =
    window.location.href.split("?")[0] +
    "?v=" +
    encodeURI(version.value) +
    g.uriargs;
});
drop.addEventListener("dragenter", function (e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.add("over");
});
drop.addEventListener("dragleave", function (e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove("over");
});
drop.addEventListener("dragover", function (e) {
  e.preventDefault();
  this.classList.add("over");
});
drop.addEventListener("drop", function (e) {
  e.stopPropagation();
  e.preventDefault();
  this.classList.remove("over");
  let f = null;
  if (e.dataTransfer.items) {
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      if (e.dataTransfer.items[i].kind === "file") {
        f = e.dataTransfer.items[i].getAsFile();
      }
    }
  } else if (e.dataTransfer.files && d.dataTransfer.files.length > 0) {
    f = e.dataTransfer.files[0];
  }
  loadRom(f);
});
rom.addEventListener("change", function (e) {
  e.stopPropagation();
  e.preventDefault();
  drop.classList.remove("over");
  if (rom.files.length > 0) loadRom(rom.files[0]);
});
apply_preset.addEventListener("click", function (e) {
  e.preventDefault();
  settings.value = presets[preset.value]["Settings"];
  presets[preset.value]["Args"].forEach(function (e) {
    if (e[1] > 0) args[e[0]].value = e[1];
    else if (e[1] < 0) pickRandomValueForArg(e[0]);
  });
  updateSettingsChecks();
  mkPerma();
});
runbtn.addEventListener("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  // disable UI
  perma.innerHTML = seed.placeholder = romname = logname = "";
  ui.classList.add("busy");
  runbtn.disabled = true;
  // for mystery we need to fill in the seed and generate settings beforehand
  if (is_mystery && !g.weekly) {
    if (!seed.value) {
      const hex = "0123456789abcdef";
      for (let i = 0; i < 16; i++)
        seed.value =
          seed.value + hex.charAt(Math.floor(Math.random() * hex.length));
    }
    const datagen = (function (a, b, c, d) {
      return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return t >>> 0;
      };
    })(
      parseInt(seed.value.substr(0, 16), 16),
      parseInt(seed.value.substr(16), 16),
      0,
      0,
    );
    let data = "";
    for (let i = 0; i < 512 / 32; i++) data += datagen().toString(16);
    randomOptions(data, 4, true);
    updateSettingsChecks();
  }

  // actually run evermizer
  setTimeout(function () {
    if (romname) FS.unlink(romname);
    if (logname) FS.unlink(logname);
    let a = [];
    if (is_mystery && g.evermizer_version >= 49) a.push("--mystery");
    for (let n in args) a.push("--" + n, args[n].value);
    if (g.weekly || is_mystery) {
      const nameStart = "Evermizer_" + version.value + "_";
      if (g.weekly) a.push("-o", nameStart + g.weekly + ".sfc");
      else a.push("-o", nameStart + "mystery_" + seed.value + ".sfc");
    }
    a.push("/soe.sfc", settings.value, seed.value);
    let res = runExe(a);
    ui.classList.remove("busy");
    runbtn.disabled = false;
    if (!res) {
      if (!errBuf) errBuf = outBuf.trimEnd().split("\n").pop();
      alert(errBuf);
      return;
    }
    outBuf.split("\n").forEach(function (s) {
      const lower = s.toLowerCase();
      if (lower.startsWith("rom saved as "))
        romname = s.substring(13, s.length - 1).trim();
      if (lower.startsWith("spoiler log saved as "))
        logname = s.substring(21, s.length - 1).trim();
      if (lower.startsWith("seed: ")) seed.placeholder = s.substring(6);
    });
    if (romname) downloadFS(romname, "application/vnd.nintendo.snes.rom");
    if (logname) downloadFS(logname, "text/plain");
    if (!romname && !logname) {
      if (outBuf.startsWith("OKE")) outBuf = outBuf.substr(2); // happens <v043 if run twice
      console.warn("Run did not produce output\n\n" + outBuf);
    }
    mkPerma();
  }, 10);
});

g.updateSettings = updateSettings;
g.dropInfo = dropInfo;

})();
