/* Kill Fee character builder — level 1, the book's nine steps in Night City terms.
   Data: window.KF_DATA (generated). State: localStorage. No dependencies. */
(function () {
  'use strict';
  const D = window.KF_DATA;
  const KEY = 'kf-builder-v1';
  const LEVEL = D.level || 1;
  const STEP_TITLES = ['Archetype', 'Neighborhood', 'Cyberware', 'Traits', 'Record', 'Equipment', 'Background', 'Experiences', 'Domain cards', 'Connections', 'Level 2'];

  // ---------------------------------------------------------------- state
  function fresh() {
    return { step: 1, name: '', pronouns: '', description: '', cls: null, sub: null, top: null, bottom: null, nochrome: false,
      community: null, traits: {}, primary: null, secondary: null, armor: null, potion: null,
      background: {}, experiences: ['', ''], cards: [], connections: {},
      lvl2: { started: false, exp3: '', adv: [], traits: [], expBonus: [], cardAdv: null, cardNew: null } };
  }
  let st = fresh();
  try { const s = localStorage.getItem(KEY); if (s) st = Object.assign(fresh(), JSON.parse(s)); } catch (e) { /* storage unavailable */ }
  st.lvl2 = Object.assign(fresh().lvl2, st.lvl2 || {});
  if (st.cls && st.sub && !(D.classes.find((c) => c.name === st.cls) || { subclasses: [] }).subclasses.some((x) => x.name === st.sub)) { st.sub = null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignore */ } }

  // ---------------------------------------------------------------- lookups
  const cls = () => D.classes.find((c) => c.name === st.cls) || null;
  const sub = () => { const c = cls(); return c ? c.subclasses.find((s) => s.name === st.sub) || null : null; };
  const community = () => D.communities.find((c) => c.name === st.community) || null;
  const chrome = (slot) => D.cyberware.find((c) => c.slot === slot && c.name === st[slot]) || null;
  const weapon = (n) => D.equipment.weapons.find((w) => w.name === n) || null;
  const armor = () => D.equipment.armor.find((a) => a.name === st.armor) || null;
  const cards = () => st.cards.map((n) => D.domain_cards.find((c) => c.name === n)).filter(Boolean);
  const classCards = () => { const c = cls(); return c ? D.domain_cards.filter((x) => c.domains.includes(x.domain)) : []; };

  const ADV = [
    { id: 'traits', slots: 3, text: 'Gain a +1 bonus to two unmarked character traits and mark them.' },
    { id: 'hp', slots: 2, text: 'Permanently gain one Hit Point slot.' },
    { id: 'stress', slots: 2, text: 'Permanently gain one Stress slot.' },
    { id: 'exp', slots: 2, text: 'Permanently gain a +1 bonus to two Experiences.' },
    { id: 'card', slots: 1, text: 'Choose an additional domain card of your level or lower from a domain you have access to (up to level 4).' },
    { id: 'evasion', slots: 1, text: 'Permanently gain a +1 bonus to your Evasion.' },
  ];
  const L2 = () => st.lvl2 || {};
  const level = () => (L2().started ? 2 : 1);
  const advCount = (id) => L2().adv.filter((a) => a === id).length;
  const traitMod = (name) => { const b = st.traits[name]; if (b === undefined || b === null) return null; return b + (L2().started && L2().traits.includes(name) ? 1 : 0); };
  const experiences = () => {
    const xs = st.experiences.map((e, i) => ({ name: e, mod: 2 + (L2().started && L2().expBonus.includes(i) ? 1 : 0) }));
    if (L2().started) xs.push({ name: L2().exp3, mod: 2 + (L2().expBonus.includes(2) ? 1 : 0) });
    return xs.filter((x) => x.name && x.name.trim());
  };
  const allCards = () => st.cards.concat(L2().started ? [L2().cardAdv, L2().cardNew] : []).filter(Boolean).map((n) => D.domain_cards.find((c) => c.name === n)).filter(Boolean);

  function derived() {
    const c = cls(), a = armor();
    const evBonus = a && /\+(\d+) to Evasion/.test(a.feature || '') ? +RegExp.$1 : 0;
    const lv = level(), l2 = L2().started;
    return {
      level: lv,
      evasion: c ? c.evasion + evBonus + (l2 ? advCount('evasion') : 0) : null,
      hp: c ? c.hp + (l2 ? advCount('hp') : 0) : null,
      stress: 6 + (l2 ? advCount('stress') : 0), hope: 2, proficiency: l2 ? 2 : 1,
      armorScore: a ? a.score : null,
      major: a ? a.major + lv : null,
      severe: a ? a.severe + lv : null,
    };
  }
  function traitsOk() {
    const vals = D.traits.map((t) => st.traits[t.name]);
    if (vals.some((v) => v === undefined || v === null)) return false;
    const pool = D.modifiers.slice().sort(), got = vals.slice().sort();
    return pool.join(',') === got.join(',');
  }
  function stepDone(n) {
    switch (n) {
      case 1: return !!(cls() && sub());
      case 2: return !!community();
      case 3: return !!(st.nochrome || (chrome('top') && chrome('bottom')));
      case 4: return traitsOk();
      case 5: return !!cls();
      case 6: return !!(weapon(st.primary) && armor() && st.potion);
      case 7: return !!st.name;
      case 8: return st.experiences.every((e) => e && e.trim());
      case 9: return cards().length === 2;
      case 10: return true;
      case 11: {
        const l = L2();
        if (!l.started || !(l.exp3 && l.exp3.trim()) || l.adv.length !== 2 || !l.cardNew) return false;
        if (advCount('traits') && l.traits.length !== 2 * advCount('traits')) return false;
        if (advCount('exp') && l.expBonus.length !== 2 * advCount('exp')) return false;
        if (advCount('card') && !l.cardAdv) return false;
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------- tiny dom + markdown
  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    for (const kid of [].concat(kids || [])) if (kid !== null && kid !== undefined) n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    return n;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  }
  function md(text) {
    const out = [];
    for (const block of String(text || '').replace(/<!--[\s\S]*?-->/g, '').split(/\n\s*\n/)) {
      const t = block.trim();
      if (!t) continue;
      if (/^#{1,6} /.test(t)) { out.push('<h4>' + inline(t.replace(/^#{1,6} /, '')) + '</h4>'); continue; }
      if (/^> /.test(t)) { out.push('<blockquote>' + t.split('\n').map((l) => inline(l.replace(/^> ?/, ''))).join('<br>') + '</blockquote>'); continue; }
      const lines = t.split('\n');
      if (lines.every((l) => /^[•\-] /.test(l))) { out.push('<ul>' + lines.map((l) => '<li>' + inline(l.replace(/^[•\-] /, '')) + '</li>').join('') + '</ul>'); continue; }
      out.push('<p>' + lines.map(inline).join('<br>') + '</p>');
    }
    return out.join('');
  }
  function opt(label, on, onclick, extra) {
    const b = el('button', { class: 'opt' + (on ? ' on' : '') + (extra && extra.cls ? ' ' + extra.cls : ''), type: 'button', onclick });
    if (extra && extra.meta) b.appendChild(el('span', { class: 'meta' }, extra.meta));
    b.appendChild(el('span', { class: 'nm' }, label));
    if (extra && extra.blurb) b.appendChild(el('span', { class: 'blurb' }, extra.blurb));
    if (extra && extra.text) b.appendChild(el('span', { class: 'tx', html: md(extra.text) }));
    if (extra && extra.was && extra.was !== label) b.appendChild(el('span', { class: 'was' }, 'was ' + extra.was));
    return b;
  }
  function field(label, value, oninput, multi) {
    const inp = multi ? el('textarea', { oninput: (e) => oninput(e.target.value) }) : el('input', { type: 'text', oninput: (e) => oninput(e.target.value) });
    inp.value = value || '';
    return el('div', { class: 'field' }, [el('label', {}, label), inp]);
  }
  function tabbar(key, tabs, dflt) {
    // tabs: [{id, label, sub, cls}] — st[key] holds the active id
    if (!tabs.some((t) => t.id === st[key])) st[key] = dflt || tabs[0].id;
    return el('div', { class: 'tabs' }, tabs.map((t) => el('button', { type: 'button', class: 'tab' + (st[key] === t.id ? ' on' : '') + (t.done ? ' done' : '') + (t.cls ? ' ' + t.cls : ''), onclick: () => { st[key] = t.id; save(); redraw(); } },
      [t.label, t.sub !== undefined ? el('i', {}, t.sub) : null])));
  }
  function panel(title, small, kids) {
    const h = el('h2', {}, title);
    if (small) h.appendChild(el('small', {}, small));
    return el('div', { class: 'bpanel' }, [h].concat(kids || []));
  }
  const hint = (t, warn) => el('p', { class: 'hint' + (warn ? ' warn' : ''), html: inline(t).replace(/&lt;(\/?[bi])&gt;/g, '<$1>') });  // allow <b>/<i> in hints
  const featList = (fs) => el('div', { class: 'feat', html: fs.map((f) => '<p><b>' + esc(f.name) + ':</b> ' + md(f.text).replace(/^<p>|<\/p>$/g, '') + '</p>').join('') });

  // ---------------------------------------------------------------- steps
  function archetypes() {
    const out = [];
    for (const c of D.classes) for (const s of c.subclasses) out.push({ c, s });
    return out;
  }
  function step1(box) {
    box.appendChild(panel('Who are you', null, [
      el('div', { class: 'row2' }, [
        field('Name', st.name, (v) => { st.name = v; save(); side(); }),
        field('Pronouns', st.pronouns, (v) => { st.pronouns = v; save(); side(); }),
      ]),
    ]));
    // filter by domain (chips up top; any selected domain matches)
    st.domainFilter = st.domainFilter || [];
    const allDoms = D.domains.map((d) => d.name);
    const fbar = el('div', { class: 'dfilter' }, [el('span', { class: 'lbl' }, 'Filter by domain')].concat(
      allDoms.map((d) => el('button', { type: 'button', class: 'dchip ' + domClass(d) + (st.domainFilter.includes(d) ? ' on' : ''), onclick: () => { st.domainFilter = st.domainFilter.includes(d) ? st.domainFilter.filter((x) => x !== d) : st.domainFilter.concat(d); save(); redraw(); } }, d)),
      st.domainFilter.length ? [el('button', { type: 'button', class: 'dchip clear', onclick: () => { st.domainFilter = []; save(); redraw(); } }, 'All')] : []));
    const grid = el('div', { class: 'opts' });
    let shown = 0;
    for (const { c, s } of archetypes()) {
      if (st.domainFilter.length && !c.domains.some((d) => st.domainFilter.includes(d))) continue;
      shown++;
      const on = st.cls === c.name && st.sub === s.name;
      const b = opt(s.name, on, () => { st.cls = c.name; st.sub = s.name; st.cards = []; save(); redraw(); }, { blurb: s.tropes });
      b.appendChild(el('span', { class: 'lines' }, [
        el('span', { class: 'ln doms' }, c.domains.map((d) => el('span', { class: 'dchip sm ' + domClass(d) }, d))),
        el('span', { class: 'ln' }, 'Evasion ' + c.evasion + ' · HP ' + c.hp),
        s.spellcast_trait ? el('span', { class: 'ln netrun' }, 'Netrun trait: ' + s.spellcast_trait) : null,
      ]));
      grid.appendChild(b);
    }
    box.appendChild(panel('Archetype', shown + ' of 26 — pick one; the class comes with it', [hint('You don\'t have to be the trope. But if you are, you\'re probably this.'), fbar, grid]));
    const c = cls(), s = sub();
    if (!c || !s) return;
    const kids = [el('div', { class: 'book', html: md(s.description) })];
    if (s.note) kids.push(hint(s.note, true));
    kids.push(el('h3', {}, 'Foundation'), featList(s.foundation));
    kids.push(el('h3', {}, s.name + ' features'), el('div', { class: 'book', html: md(c.description) }), featList(c.features));
    kids.push(el('h3', {}, 'Class items'), el('p', { class: 'hint' }, c.class_items));
    box.appendChild(panel(s.name, null, kids));
  }

  function mapViewer() {
    const img = el('img', { src: 'img/' + D.map.image, alt: D.map.caption || 'Night City', draggable: 'false' });
    const stage = el('div', { class: 'mapstage' }, [img]);
    let sc = 1, tx = 0, ty = 0, drag = null;
    const apply = () => { img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')'; };
    const zoomAt = (f, cx, cy) => {
      const r = stage.getBoundingClientRect(), x = cx - r.left - r.width / 2, y = cy - r.top - r.height / 2;
      const ns = Math.min(6, Math.max(0.5, sc * f));
      tx = x - (x - tx) * (ns / sc); ty = y - (y - ty) * (ns / sc); sc = ns; apply();
    };
    stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX - tx, y: e.clientY - ty }; stage.setPointerCapture(e.pointerId); stage.classList.add('grab'); });
    stage.addEventListener('pointermove', (e) => { if (drag) { tx = e.clientX - drag.x; ty = e.clientY - drag.y; apply(); } });
    const up = () => { drag = null; stage.classList.remove('grab'); };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    const center = () => stage.getBoundingClientRect();
    const ctl = el('div', { class: 'mapctl' }, [
      el('button', { type: 'button', class: 'btn ghost', onclick: () => { const r = center(); zoomAt(1.4, r.left + r.width / 2, r.top + r.height / 2); } }, '+'),
      el('button', { type: 'button', class: 'btn ghost', onclick: () => { const r = center(); zoomAt(1 / 1.4, r.left + r.width / 2, r.top + r.height / 2); } }, '−'),
      el('button', { type: 'button', class: 'btn ghost', onclick: () => { sc = 1; tx = 0; ty = 0; apply(); } }, 'Reset'),
      el('a', { class: 'btn ghost', href: 'img/' + D.map.image, target: '_blank', rel: 'noopener' }, 'Open full size'),
      el('span', { class: 'hint' }, 'Scroll to zoom, drag to pan.'),
    ]);
    return el('div', { class: 'mapview' }, [stage, ctl]);
  }

  function step2(box) {
    const kids = [hint('Your community is the neighborhood that raised you. Pick one; its feature is yours.')];
    if (D.map && D.map.image) kids.push(mapViewer());
    const g = el('div', { class: 'opts' });
    for (const c of D.communities) g.appendChild(opt(c.name, st.community === c.name, () => { st.community = c.name; save(); redraw(); }, { blurb: c.blurb, text: c.text, was: c.was }));
    kids.push(g);
    box.appendChild(panel('Neighborhood', '15 — where you\'re from', kids));
  }

  function step3(box) {
    const nc = el('label', { class: 'hint' }, [el('input', { type: 'checkbox', onchange: (e) => { st.nochrome = e.target.checked; if (st.nochrome) { st.top = null; st.bottom = null; } save(); redraw(); } }), ' No chrome — skip the implants (talk to the GM about what you get instead).']);
    nc.querySelector('input').checked = !!st.nochrome;
    const kids = [hint('Nobody is born with an ancestry in Night City; you buy one. Pick <b>one top-slot</b> implant and <b>one bottom-slot</b> implant.'), nc];
    if (!st.nochrome) {
      st.chromeTab = st.chromeTab === 'bottom' ? 'bottom' : 'top';
      const tabs = el('div', { class: 'tabs' }, ['top', 'bottom'].map((slot) =>
        el('button', { type: 'button', class: 'tab' + (st.chromeTab === slot ? ' on' : '') + (st[slot] ? ' done' : ''), onclick: () => { st.chromeTab = slot; save(); redraw(); } },
          [slot + ' slot', el('i', {}, st[slot] ? st[slot] : 'none picked')])));
      const slot = st.chromeTab;
      const g = el('div', { class: 'opts' });
      for (const c of D.cyberware.filter((x) => x.slot === slot)) g.appendChild(opt(c.name, st[slot] === c.name, () => { st[slot] = c.name; if (slot === 'top' && !st.bottom) st.chromeTab = 'bottom'; save(); redraw(); }, { text: c.text, was: c.was }));
      kids.push(tabs, g);
    }
    box.appendChild(panel('Cyberware', '47 implants', kids));
  }

  function step4(box) {
    const grid = el('div', { class: 'traits' });
    // each select offers only what is left in the pool (+2, +1, +1, 0, 0, −1) after the other traits took theirs
    const remainingFor = (name) => {
      const left = D.modifiers.slice();
      for (const t of D.traits) {
        if (t.name === name) continue;
        const v = st.traits[t.name];
        if (v === undefined || v === null) continue;
        const i = left.indexOf(v);
        if (i >= 0) left.splice(i, 1);
      }
      return left;
    };
    for (const t of D.traits) {
      const cur = st.traits[t.name];
      const sel = el('select', { onchange: (e) => { st.traits[t.name] = e.target.value === '' ? null : +e.target.value; save(); redraw(); } });
      sel.appendChild(el('option', { value: '' }, '—'));
      const avail = remainingFor(t.name);
      for (const m of [2, 1, 0, -1]) {
        const n = avail.filter((x) => x === m).length;
        if (!n && cur !== m) continue;
        const o = el('option', { value: String(m) }, (m > 0 ? '+' : '') + m + (n > 1 ? ' (×' + n + ' left)' : ''));
        if (cur === m) o.selected = true;
        sel.appendChild(o);
      }
      grid.appendChild(el('div', { class: 'trait' }, [el('div', { class: 'nm' }, t.name), el('div', { class: 'verbs' }, t.verbs), sel]));
    }
    const left = remainingFor(null);
    const ok = traitsOk();
    const c = cls(), sg = sub();
    let rec = null;
    if (c && c.guide && Object.keys(c.guide.traits).length) {
      const g = c.guide.traits;
      const order = Object.entries(g).sort((a, b) => b[1] - a[1]);
      const matches = D.traits.every((t) => st.traits[t.name] === g[t.name]);
      rec = el('div', { class: 'rec' }, [
        el('span', { class: 'lbl' }, 'Recommended for ' + (sg ? sg.name : c.name)),
        el('span', { class: 'vals' }, order.map(([t, m]) => el('span', { class: 'rv' + (m === 2 ? ' primary' : m === 1 ? ' secondary' : '') }, [el('b', {}, (m > 0 ? '+' : '') + m), ' ' + t]))),
        el('button', { type: 'button', class: 'btn' + (matches ? ' ghost' : ''), onclick: () => { st.traits = Object.assign({}, g); save(); redraw(); } }, matches ? 'Applied' : 'Use these'),
      ]);
    } else if (c) {
      rec = hint('No recommended spread for ' + (sg ? sg.name : c.name) + ' — place +2 on the trait you attack or quickhack with.');
    }
    box.appendChild(panel('Traits', '+2, +1, +1, 0, 0, −1', [rec, grid,
      el('p', { class: 'pool' + (ok ? ' ok' : '') }, [ok ? 'All six assigned.' : 'Still to place: ', el('span', { class: 'left' }, ok ? '' : left.map((m) => (m > 0 ? '+' : '') + m).join(', '))])]));
  }

  function step5(box) {
    const d = derived(), c = cls();
    if (!c) { box.appendChild(hint('Pick a class first — Evasion and Hit Points come from it.', true)); return; }
    box.appendChild(panel('Recorded for you', null, [
      el('div', { class: 'stats' }, [
        el('div', { class: 'stat' }, [el('b', {}, String(d.evasion)), el('span', {}, 'Evasion')]),
        el('div', { class: 'stat' }, [el('b', {}, String(d.hp)), el('span', {}, 'Hit Points')]),
        el('div', { class: 'stat' }, [el('b', {}, String(d.stress)), el('span', {}, 'Stress')]),
        el('div', { class: 'stat' }, [el('b', {}, String(d.hope)), el('span', {}, 'Hope')]),
        el('div', { class: 'stat' }, [el('b', {}, String(d.proficiency)), el('span', {}, 'Proficiency')]),
        el('div', { class: 'stat' }, [el('b', {}, String(LEVEL)), el('span', {}, 'Level')]),
      ]),
      hint('Evasion and Hit Points are your class\'s starting values' + (d.evasion !== c.evasion ? ' (plus your armor\'s Evasion bonus)' : '') + '. Every character starts with 6 Stress and 2 Hope. Damage thresholds come from your armor in the next step.'),
    ]));
  }

  function step6(box) {
    const prim = weapon(st.primary);
    const twoH = prim && prim.burden === 'Two-Handed';
    const wrow = (w) => w.trait + ' · ' + w.range + ' · ' + w.damage + ' · ' + w.burden;
    const mk = (list, key, disabled) => {
      const g = el('div', { class: 'opts' });
      for (const w of list) {
        const b = opt(w.name, st[key] === w.name, () => { st[key] = st[key] === w.name ? null : w.name; if (key === 'primary' && weapon(st.primary) && weapon(st.primary).burden === 'Two-Handed') st.secondary = null; save(); redraw(); }, { meta: wrow(w), text: w.feature || '', was: w.was });
        if (disabled) b.disabled = true;
        g.appendChild(b);
      }
      return g;
    };
    box.appendChild(hint('Tier 1 gear. Guns use the same ranges and damage dice as the originals; tech and smart weapons need a Netrun trait.'));
    const gc = cls(), gs = sub();
    if (gc && gc.guide && (gc.guide.primary || gc.guide.armor)) {
      const g = gc.guide;
      const matches = (!g.primary || st.primary === g.primary) && (!g.secondary || st.secondary === g.secondary) && (!g.armor || st.armor === g.armor);
      box.appendChild(el('div', { class: 'rec' }, [
        el('span', { class: 'lbl' }, 'Recommended for ' + (gs ? gs.name : gc.name)),
        el('span', { class: 'vals' }, [g.primary && el('span', { class: 'rv primary' }, g.primary), g.secondary && el('span', { class: 'rv secondary' }, g.secondary), g.armor && el('span', { class: 'rv' }, g.armor)].filter(Boolean)),
        el('button', { type: 'button', class: 'btn' + (matches ? ' ghost' : ''), onclick: () => { if (g.primary) st.primary = g.primary; st.secondary = g.secondary || null; if (g.armor) st.armor = g.armor; save(); redraw(); } }, matches ? 'Applied' : 'Use these'),
      ]));
    }
    const c = cls();
    const tabs = tabbar('gearTab', [
      { id: 'primary', label: 'Primary', sub: st.primary || 'none picked', done: !!st.primary },
      { id: 'secondary', label: 'Secondary', sub: twoH ? 'not with a two-handed primary' : (st.secondary || 'none picked'), done: !!st.secondary },
      { id: 'armor', label: 'Armor', sub: st.armor || 'none picked', done: !!st.armor },
      { id: 'other', label: 'Other', sub: st.potion ? st.potion.split(' (')[0] : 'none picked', done: !!st.potion },
    ]);
    const body = [];
    if (st.gearTab === 'primary') body.push(hint('Two-handed, or one-handed plus a secondary.'), mk(D.equipment.weapons.filter((w) => w.category === 'Primary'), 'primary'));
    else if (st.gearTab === 'secondary') body.push(hint(twoH ? 'Your primary is two-handed — no secondary.' : 'One-handed primary only.'), mk(D.equipment.weapons.filter((w) => w.category === 'Secondary'), 'secondary', twoH));
    else if (st.gearTab === 'armor') {
      const ag = el('div', { class: 'opts' });
      for (const a of D.equipment.armor) ag.appendChild(opt(a.name, st.armor === a.name, () => { st.armor = a.name; save(); redraw(); }, { meta: 'Thresholds ' + a.major + ' / ' + a.severe + ' · Armor Score ' + a.score, text: a.feature || '', was: a.was }));
      body.push(hint('Thresholds shown are base; your level is added on the sheet.'), ag);
    } else {
      const pg = el('div', { class: 'opts' });
      for (const p of ['Minor Health Potion (clear 1d4 Hit Points)', 'Minor Stamina Potion (clear 1d4 Stress)']) pg.appendChild(opt(p, st.potion === p, () => { st.potion = p; save(); redraw(); }, { cls: 'unmapped' }));
      body.push(hint('Pick one.'), pg, c ? hint('Class items: <b>' + esc(c.class_items) + '</b>') : null, hint('Plus the basics — rope, supplies, a handful of eddies. The GM will say what that looks like in Night City.'));
    }
    box.appendChild(panel('Equipment', null, [tabs].concat(body)));
  }

  function step7(box) {
    const c = cls();
    const kids = [field('Character description', st.description, (v) => { st.description = v; save(); }, true)];
    if (c) for (const q of c.background_questions) kids.push(field(q, st.background[q], (v) => { st.background[q] = v; save(); }, true));
    else kids.push(hint('Pick a class to see its background questions.', true));
    box.appendChild(panel('Background', c ? c.name + ' questions' : null, kids));
  }

  function step8(box) {
    box.appendChild(panel('Experiences', 'two, each +2', [
      field('Experience 1 (+2)', st.experiences[0], (v) => { st.experiences[0] = v; save(); side(); }),
      field('Experience 2 (+2)', st.experiences[1], (v) => { st.experiences[1] = v; save(); side(); }),
      hint('Specific beats broad: <i>Ex-Trauma Team medic</i>, <i>Kabuki fixer\'s runner</i>, <i>Braindance editor</i>, <i>Tyger Claw debts</i>.'),
    ]));
  }

  function step9(box) {
    const c = cls();
    if (!c) { box.appendChild(hint('Pick an archetype first — your cards come from its two domains.', true)); return; }
    const tabs = tabbar('cardTab', c.domains.map((d) => ({ id: d, label: d, cls: domClass(d), sub: st.cards.filter((n) => (D.domain_cards.find((x) => x.name === n) || {}).domain === d).join(' · ') || 'none picked', done: st.cards.some((n) => (D.domain_cards.find((x) => x.name === n) || {}).domain === d) })));
    const g = el('div', { class: 'opts wide' });
    for (const card of classCards().filter((x) => x.domain === st.cardTab && x.level === 1)) {
      const on = st.cards.includes(card.name);
      const b = opt(card.name, on, () => { if (on) st.cards = st.cards.filter((n) => n !== card.name); else if (st.cards.length < 2) st.cards.push(card.name); save(); redraw(); },
        { meta: 'level ' + card.level + ' · ' + card.type + ' · recall ' + card.recall, text: card.text, was: card.was, cls: card.converted ? '' : 'unmapped' });
      b.insertBefore(el('span', { class: 'dchip sm ' + domClass(card.domain) }, card.domain), b.firstChild);
      if (!on && st.cards.length >= 2) b.disabled = true;
      g.appendChild(b);
    }
    box.appendChild(panel('Domain cards', 'choose two — one from each, or both from one', [hint('Converted cards carry their Night City name; the rest still show their original name with the renamed terms inside.'), tabs, g]));
  }

  function step10(box) {
    const c = cls();
    const kids = [];
    if (c) for (const q of c.connections) kids.push(field(q, st.connections[q], (v) => { st.connections[q] = v; save(); }, true));
    else kids.push(hint('Pick an archetype to see its connection prompts.', true));
    box.appendChild(panel('Connections', c ? 'ask another player' : null, kids));
  }

  function step11(box) {
    const l = L2();
    if (!l.started) { l.started = true; save(); side(); }
    const c = cls();
    // 1. level achievement
    box.appendChild(panel('Level 2 — level achievement', 'the campaign starts here', [
      hint('At level 2, you gain an additional Experience and add it to your character sheet with a modifier of +2. You also gain a permanent +1 bonus to your Proficiency.'),
      field('Experience 3 (+2)', l.exp3, (v) => { l.exp3 = v; save(); side(); }),
      hint('Proficiency is now <b>2</b> — roll two damage dice. Damage thresholds rise by +1 with your level; the sheet already shows it.'),
    ]));
    // 2. two advancements
    const used = l.adv.length;
    const grid = el('div', { class: 'opts wide' });
    for (const a of ADV) {
      const n = advCount(a.id);
      const can = used < 2 && n < a.slots;
      const b = opt(a.text, n > 0, () => {
        if (n > 0 && !(can && a.slots > 1 && n < a.slots && used < 2)) { l.adv = l.adv.filter((x) => x !== a.id); if (a.id === 'traits') l.traits = []; if (a.id === 'exp') l.expBonus = []; if (a.id === 'card') l.cardAdv = null; }
        else if (can) l.adv.push(a.id);
        save(); redraw();
      }, { meta: a.slots + (a.slots > 1 ? ' slots' : ' slot') + (n ? ' · taken ×' + n : '') });
      if (!n && !can) b.disabled = true;
      grid.appendChild(b);
    }
    box.appendChild(panel('Choose two advancements', used + ' of 2 chosen', [hint('Choose two options from the list below and mark them. Taking the same option twice uses two of its slots.'), grid]));
    // 3. substeps per pick
    if (advCount('traits')) {
      const want = 2 * advCount('traits');
      const g = el('div', { class: 'opts' });
      for (const t of D.traits) {
        const on = l.traits.includes(t.name);
        const b = opt(t.name, on, () => { l.traits = on ? l.traits.filter((x) => x !== t.name) : l.traits.concat(t.name); save(); redraw(); }, { meta: 'now ' + fmtMod(st.traits[t.name]) + (on ? ' → ' + fmtMod(traitMod(t.name)) : '') });
        if (!on && l.traits.length >= want) b.disabled = true;
        g.appendChild(b);
      }
      box.appendChild(panel('Traits +1', l.traits.length + ' of ' + want + ' — these are marked until level 5', [g]));
    }
    if (advCount('exp')) {
      const want = 2 * advCount('exp');
      const xs = [st.experiences[0], st.experiences[1], l.exp3];
      const g = el('div', { class: 'opts' });
      xs.forEach((name, i) => {
        const on = l.expBonus.includes(i);
        const b = opt(name || '(Experience ' + (i + 1) + ' — not named yet)', on, () => { l.expBonus = on ? l.expBonus.filter((x) => x !== i) : l.expBonus.concat(i); save(); redraw(); }, { meta: on ? '+3' : '+2' });
        if (!on && l.expBonus.length >= want) b.disabled = true;
        g.appendChild(b);
      });
      box.appendChild(panel('Experiences +1', l.expBonus.length + ' of ' + want, [g]));
    }
    const cardPick = (key, title, small) => {
      const g = el('div', { class: 'opts wide' });
      const taken = allCards().map((k) => k.name);
      for (const card of classCards().filter((x) => x.level <= 2)) {
        const on = l[key] === card.name;
        const b = opt(card.name, on, () => { l[key] = on ? null : card.name; save(); redraw(); }, { meta: 'level ' + card.level + ' · ' + card.type + ' · recall ' + card.recall, text: card.text, was: card.was, cls: card.converted ? '' : 'unmapped' });
        b.insertBefore(el('span', { class: 'dchip sm ' + domClass(card.domain) }, card.domain), b.firstChild);
        if (!on && taken.includes(card.name)) b.disabled = true;
        g.appendChild(b);
      }
      return panel(title, small, [g]);
    };
    if (advCount('card')) box.appendChild(cardPick('cardAdv', 'Additional domain card', 'from the advancement — level 2 or lower'));
    // 4. the level's own card
    if (c) box.appendChild(cardPick('cardNew', 'New domain card', 'every level — level 2 or lower'));
    // finish
    const missing = STEP_TITLES.map((t, i) => (stepDone(i + 1) ? null : (i + 1) + '. ' + t)).filter(Boolean);
    box.appendChild(panel('Finish', null, [missing.length ? hint('Still open: ' + missing.join(' · '), true) : hint('Everything is filled in. Export the JSON for the GM, or print the sheet.'),
      el('div', { class: 'sheet-acts' }, [el('button', { class: 'btn', type: 'button', onclick: exportJson }, 'Export JSON'), el('button', { class: 'btn cyan', type: 'button', onclick: () => window.print() }, 'Print sheet')])]));
  }

  const STEPS = [step1, step2, step3, step4, step5, step6, step7, step8, step9, step10, step11];

  // ---------------------------------------------------------------- export / import / print
  function exportJson() {
    const blob = new Blob([JSON.stringify({ builder: 'kill-fee', version: 2, level: level(), derived: derived(), experiences: experiences(), traits: Object.fromEntries(D.traits.map((t) => [t.name, traitMod(t.name)])), cards: allCards().map((k) => k.name), character: st }, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: (st.name || 'character').replace(/[^\w-]+/g, '_') + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
  }
  function importJson(file) {
    const r = new FileReader();
    r.onload = () => { try { const j = JSON.parse(r.result); st = Object.assign(fresh(), j.character || j); save(); redraw(); } catch (e) { alert('Not a builder JSON file.'); } };
    r.readAsText(file);
  }
  function printsheet() {
    const d = derived(), c = cls(), s = sub(), co = community(), p = weapon(st.primary), sc = weapon(st.secondary), a = armor();
    const feats = [].concat(c ? c.features : [], s ? s.foundation : []);
    const h = [];
    h.push('<h1>' + esc(st.name || 'Unnamed') + '</h1><p>' + esc([st.pronouns, s && s.name, 'Level ' + level()].filter(Boolean).join(' · ')) + '</p>');
    h.push('<div class="pstats">' + [['Evasion', d.evasion], ['HP', d.hp], ['Stress', d.stress], ['Hope', d.hope], ['Proficiency', d.proficiency], ['Armor', d.armorScore], ['Thresholds', d.major != null ? d.major + ' / ' + d.severe : null]].map(([k, v]) => '<div>' + k + ' <b>' + (v == null ? '—' : v) + '</b></div>').join('') + '</div>');
    h.push('<h2>Traits</h2><p>' + D.traits.map((t) => t.name + ' ' + fmtMod(traitMod(t.name))).join(' · ') + '</p>');
    h.push('<h2>Heritage</h2><p>' + esc((co ? 'Community: ' + co.name : '') + (st.nochrome ? ' · No chrome' : (st.top || st.bottom ? ' · Chrome: ' + [st.top, st.bottom].filter(Boolean).join(', ') : ''))) + '</p>');
    if (co) h.push('<p>' + md(co.text) + '</p>');
    for (const slot of ['top', 'bottom']) { const ch = chrome(slot); if (ch) h.push('<p><b>' + esc(ch.name) + ':</b> ' + md(ch.text) + '</p>'); }
    h.push('<h2>Features</h2>' + feats.map((f) => '<p><b>' + esc(f.name) + ':</b> ' + md(f.text) + '</p>').join(''));
    h.push('<h2>Equipment</h2><p>' + esc([p && p.name + ' (' + p.damage + ', ' + p.range + ')', sc && sc.name + ' (' + sc.damage + ', ' + sc.range + ')', a && a.name, st.potion, c && c.class_items].filter(Boolean).join(' · ')) + '</p>');
    h.push('<h2>Experiences</h2><p>' + esc(experiences().map((x) => x.name + ' +' + x.mod).join(' · ')) + '</p>');
    h.push('<h2>Domain cards</h2>' + allCards().map((k) => '<p><b>' + esc(k.name) + '</b> (' + esc(k.domain) + ' ' + k.level + ', ' + esc(k.type) + ', recall ' + k.recall + '): ' + md(k.text) + '</p>').join(''));
    if (st.description) h.push('<h2>Description</h2><p>' + esc(st.description) + '</p>');
    const bq = Object.entries(st.background).filter(([, v]) => v); if (bq.length) h.push('<h2>Background</h2>' + bq.map(([q, v]) => '<p><i>' + esc(q) + '</i><br>' + esc(v) + '</p>').join(''));
    const cq = Object.entries(st.connections).filter(([, v]) => v); if (cq.length) h.push('<h2>Connections</h2>' + cq.map(([q, v]) => '<p><i>' + esc(q) + '</i><br>' + esc(v) + '</p>').join(''));
    return h.join('');
  }
  const domClass = (d) => 'dom-' + String(d).toLowerCase().replace(/[^a-z]+/g, '');
  const fmtMod = (m) => (m === undefined || m === null) ? '—' : (m > 0 ? '+' : '') + m;

  // ---------------------------------------------------------------- render
  const sideEl = document.getElementById('side'), mainEl = document.getElementById('main');
  let printEl = document.querySelector('.printsheet');
  if (!printEl) { printEl = el('div', { class: 'printsheet' }); document.body.appendChild(printEl); }

  function side() {
    const d = derived(), c = cls(), s = sub(), co = community();
    sideEl.innerHTML = '';
    const dd = (v) => el('dd', {}, v ? v : el('span', { class: 'none' }, 'not yet'));
    const sheet = el('div', { class: 'sheet' }, [
      el('h2', {}, st.name || 'Unnamed'),
      el('p', { class: 'sub' }, [st.pronouns, s && s.name, 'level ' + level()].filter(Boolean).join(' · ')),
      el('div', { class: 'stats' }, [['Evasion', d.evasion], ['HP', d.hp], ['Stress', d.stress], ['Hope', d.hope], ['Armor', d.armorScore], ['Thresholds', d.major != null ? d.major + ' / ' + d.severe : null], ['Proficiency', d.proficiency], ['Level', d.level]].map(([k, v]) => el('div', { class: 'stat' }, [el('b', {}, v == null ? '—' : String(v)), el('span', {}, k)]))),
      el('div', { class: 'tr6' }, D.traits.map((t) => el('div', { class: 'stat' + (L2().started && L2().traits.includes(t.name) ? ' marked' : '') }, [el('b', {}, fmtMod(traitMod(t.name))), el('span', {}, t.name)]))),
      (function () {
        const fs = [].concat(s ? s.foundation.map((f) => Object.assign({ from: s.name + ' · foundation' }, f)) : [], c && s ? c.features.map((f) => Object.assign({ from: s.name }, f)) : []);
        const ch = ['top', 'bottom'].map(chrome).filter(Boolean).map((x) => Object.assign({ from: x.slot + ' slot' }, x));
        const cm = co ? [Object.assign({ from: 'community' }, co)] : [];
        const dc = allCards().map((k) => Object.assign({ from: k.domain + ' · ' + k.type.toLowerCase() + ' · recall ' + k.recall, cls: domClass(k.domain) }, k));
        if (!fs.length && !ch.length && !cm.length && !dc.length) return null;
        const item = (f, open) => el('details', { class: 'sfeat' + (f.cls ? ' ' + f.cls : ''), open }, [el('summary', {}, [f.name, el('i', {}, f.from)]), el('div', { class: 'tx', html: md(f.text) })]);
        const kids = [];
        if (fs.length) kids.push(el('h3', {}, 'Features'), ...fs.map((f) => item(f, true)));       // class + subclass: open, click to close
        if (ch.length) kids.push(el('h3', {}, 'Chrome'), ...ch.map((f) => item(f, false)));        // implants: click to expand
        if (cm.length) kids.push(el('h3', {}, 'Community'), ...cm.map((f) => item(f, false)));
        if (dc.length) kids.push(el('h3', {}, 'Domain cards'), ...dc.map((f) => item(f, false)));   // coloured by domain, click to expand
        return el('div', { class: 'sfeats' }, kids);
      })(),
      el('dl', {}, [
        st.nochrome ? el('dt', {}, 'Chrome') : null, st.nochrome ? dd('none (by choice)') : null,
        el('dt', {}, 'Weapons'), dd([st.primary, st.secondary].filter(Boolean).join(' · ')),
        el('dt', {}, 'Armor'), dd(st.armor),
        el('dt', {}, 'Experiences'), dd(experiences().map((x) => x.name + ' +' + x.mod).join(' · ')),
      ]),
      el('div', { class: 'sheet-acts' }, [
        el('button', { class: 'btn', type: 'button', onclick: exportJson }, 'Export'),
        el('button', { class: 'btn ghost', type: 'button', onclick: () => document.getElementById('kf-import').click() }, 'Import'),
        el('button', { class: 'btn ghost', type: 'button', onclick: () => window.print() }, 'Print'),
        el('button', { class: 'btn danger', type: 'button', onclick: () => { if (confirm('Start over? This clears the saved character.')) { st = fresh(); save(); redraw(); } } }, 'Reset'),
        el('input', { type: 'file', id: 'kf-import', accept: '.json', style: 'display:none', onchange: (e) => { if (e.target.files[0]) importJson(e.target.files[0]); } }),
      ]),
    ]);
    sideEl.appendChild(sheet);
    printEl.innerHTML = printsheet();
  }

  function redraw() {
    side();
    mainEl.innerHTML = '';
    mainEl.appendChild(el('div', { class: 'steps' }, STEPS.map((_, i) => el('button', { type: 'button', class: (st.step === i + 1 ? 'on' : stepDone(i + 1) ? 'done' : ''), title: STEP_TITLES[i], onclick: () => { st.step = i + 1; save(); redraw(); window.scrollTo(0, 0); } }, String(i + 1)))));
    mainEl.appendChild(el('h2', { class: 'group-h' }, 'Step ' + st.step + ' — ' + STEP_TITLES[st.step - 1]));
    const box = el('div');
    STEPS[st.step - 1](box);
    mainEl.appendChild(box);
    mainEl.appendChild(el('div', { class: 'pager-b' }, [
      st.step > 1 ? el('button', { class: 'btn ghost', type: 'button', onclick: () => { st.step--; save(); redraw(); window.scrollTo(0, 0); } }, '← Step ' + (st.step - 1)) : el('span'),
      st.step < STEPS.length ? el('button', { class: 'btn', type: 'button', onclick: () => { st.step++; save(); redraw(); window.scrollTo(0, 0); } }, 'Step ' + (st.step + 1) + ' →') : el('span'),
    ]));
  }
  redraw();
  window.KFBuilder = { state: () => st, derived, redraw };
})();
