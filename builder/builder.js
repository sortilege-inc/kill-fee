/* Kill Fee character builder — level 1, the book's nine steps in Night City terms.
   Data: window.KF_DATA (generated). State: localStorage. No dependencies. */
(function () {
  'use strict';
  const D = window.KF_DATA;
  const KEY = 'kf-builder-v1';
  const LEVEL = D.level || 1;
  const STEP_TITLES = ['Class & subclass', 'Heritage', 'Traits', 'Record', 'Equipment', 'Background', 'Experiences', 'Domain cards', 'Connections'];

  // ---------------------------------------------------------------- state
  function fresh() {
    return { step: 1, name: '', pronouns: '', description: '', cls: null, sub: null, top: null, bottom: null, nochrome: false,
      community: null, traits: {}, primary: null, secondary: null, armor: null, potion: null,
      background: {}, experiences: ['', ''], cards: [], connections: {} };
  }
  let st = fresh();
  try { const s = localStorage.getItem(KEY); if (s) st = Object.assign(fresh(), JSON.parse(s)); } catch (e) { /* storage unavailable */ }
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

  function derived() {
    const c = cls(), a = armor();
    const evBonus = a && /\+(\d+) to Evasion/.test(a.feature || '') ? +RegExp.$1 : 0;
    return {
      evasion: c ? c.evasion + evBonus : null,
      hp: c ? c.hp : null,
      stress: 6, hope: 2, proficiency: 1,
      armorScore: a ? a.score : null,
      major: a ? a.major + LEVEL : null,
      severe: a ? a.severe + LEVEL : null,
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
      case 2: return !!(community() && (st.nochrome || (chrome('top') && chrome('bottom'))));
      case 3: return traitsOk();
      case 4: return !!cls();
      case 5: { const p = weapon(st.primary); return !!(p && armor() && st.potion && (p.burden === 'Two-Handed' || true)); }
      case 6: return !!st.name;
      case 7: return st.experiences.every((e) => e && e.trim());
      case 8: return cards().length === 2;
      case 9: return [1, 2, 3, 4, 5, 6, 7, 8].every(stepDone);
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
  function panel(title, small, kids) {
    const h = el('h2', {}, title);
    if (small) h.appendChild(el('small', {}, small));
    return el('div', { class: 'bpanel' }, [h].concat(kids || []));
  }
  const hint = (t, warn) => el('p', { class: 'hint' + (warn ? ' warn' : ''), html: inline(t) });
  const featList = (fs) => el('div', { class: 'feat', html: fs.map((f) => '<p><b>' + esc(f.name) + ':</b> ' + md(f.text).replace(/^<p>|<\/p>$/g, '') + '</p>').join('') });

  // ---------------------------------------------------------------- steps
  function step1(box) {
    box.appendChild(panel('Who are you', null, [
      el('div', { class: 'row2' }, [
        field('Name', st.name, (v) => { st.name = v; save(); side(); }),
        field('Pronouns', st.pronouns, (v) => { st.pronouns = v; save(); side(); }),
      ]),
    ]));
    const grid = el('div', { class: 'opts' });
    for (const c of D.classes) {
      grid.appendChild(opt(c.name, st.cls === c.name, () => { st.cls = c.name; st.sub = null; st.cards = []; save(); redraw(); },
        { meta: c.domains.join(' · ') + ' · Evasion ' + c.evasion + ' · HP ' + c.hp + (c.hf ? ' · H&F' : ''), was: c.was, cls: c.name === c.was && ['Bard', 'Druid', 'Guardian', 'Ranger', 'Rogue', 'Seraph', 'Sorcerer', 'Warrior', 'Assassin', 'Brawler', 'Witch'].includes(c.name) ? 'unmapped' : '' }));
    }
    box.appendChild(panel('Class', '13 — the book\'s names where the remap hasn\'t reached yet', [hint('Netrunner (was Wizard) and Netmerc (was Warlock) are remapped; the rest keep the book\'s class name for now.'), grid]));
    const c = cls();
    if (!c) return;
    box.appendChild(panel(c.name, 'class features', [el('div', { class: 'book', html: md(c.description) }), el('h3', {}, 'Class features'), featList(c.features), el('h3', {}, 'Class items'), el('p', { class: 'hint' }, c.class_items)]));
    const sg = el('div', { class: 'opts' });
    for (const s of c.subclasses) {
      sg.appendChild(opt(s.name, st.sub === s.name, () => { st.sub = s.name; save(); redraw(); }, { meta: (s.spellcast_trait ? 'Netrun trait: ' + s.spellcast_trait : 'no Netrun trait'), text: s.description, was: s.was }));
    }
    box.appendChild(panel('Subclass', null, [sg]));
    const s = sub();
    if (s) box.appendChild(panel(s.name, 'foundation', [featList(s.foundation)]));
  }

  function step2(box) {
    const nc = el('label', { class: 'hint' }, [el('input', { type: 'checkbox', onchange: (e) => { st.nochrome = e.target.checked; if (st.nochrome) { st.top = null; st.bottom = null; } save(); redraw(); } }), ' No chrome — skip the implants (talk to the GM about what you get instead).']);
    nc.querySelector('input').checked = !!st.nochrome;
    const kids = [hint('Nobody is born with an ancestry in Night City; you buy one. Pick <b>one top-slot</b> implant and <b>one bottom-slot</b> implant.'), nc];
    if (!st.nochrome) {
      for (const slot of ['top', 'bottom']) {
        const g = el('div', { class: 'opts' });
        for (const c of D.cyberware.filter((x) => x.slot === slot)) g.appendChild(opt(c.name, st[slot] === c.name, () => { st[slot] = c.name; save(); redraw(); }, { text: c.text, was: c.was }));
        kids.push(el('h3', {}, slot + ' slot'), g);
      }
    }
    box.appendChild(panel('Cyberware', '47 implants', kids));
    const g = el('div', { class: 'opts' });
    for (const c of D.communities) g.appendChild(opt(c.name, st.community === c.name, () => { st.community = c.name; save(); redraw(); }, { blurb: c.blurb, text: c.text, was: c.was }));
    box.appendChild(panel('Community', 'the neighborhood that raised you', [g]));
  }

  function step3(box) {
    const grid = el('div', { class: 'traits' });
    const pool = D.modifiers.slice();
    for (const t of D.traits) {
      const sel = el('select', { onchange: (e) => { st.traits[t.name] = e.target.value === '' ? null : +e.target.value; save(); redraw(); } });
      sel.appendChild(el('option', { value: '' }, '—'));
      for (const m of [2, 1, 0, -1]) { const o = el('option', { value: String(m) }, (m > 0 ? '+' : '') + m); if (st.traits[t.name] === m) o.selected = true; sel.appendChild(o); }
      grid.appendChild(el('div', { class: 'trait' }, [el('div', { class: 'nm' }, t.name), el('div', { class: 'verbs' }, t.verbs), sel]));
    }
    const used = D.traits.map((t) => st.traits[t.name]).filter((v) => v !== undefined && v !== null);
    const left = pool.slice();
    for (const u of used) { const i = left.indexOf(u); if (i >= 0) left.splice(i, 1); }
    const ok = traitsOk();
    box.appendChild(panel('Traits', '+2, +1, +1, 0, 0, −1', [grid,
      el('p', { class: 'pool' + (ok ? ' ok' : '') }, [ok ? 'All six assigned.' : 'Still to place: ', el('span', { class: 'left' }, ok ? '' : left.map((m) => (m > 0 ? '+' : '') + m).join(', ') || 'nothing — but the set is wrong; use each value once')])]));
  }

  function step4(box) {
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

  function step5(box) {
    const prim = weapon(st.primary);
    const twoH = prim && prim.burden === 'Two-Handed';
    const wrow = (w) => w.trait + ' · ' + w.range + ' · ' + w.damage + ' · ' + w.burden;
    const mk = (list, key, disabled) => {
      const g = el('div', { class: 'opts' });
      for (const w of list) {
        const b = opt(w.name, st[key] === w.name, () => { st[key] = st[key] === w.name ? null : w.name; if (key === 'primary' && weapon(st.primary) && weapon(st.primary).burden === 'Two-Handed') st.secondary = null; save(); redraw(); }, { meta: wrow(w), text: w.feature || '', cls: 'unmapped' });
        if (disabled) b.disabled = true;
        g.appendChild(b);
      }
      return g;
    };
    box.appendChild(hint('Weapons and armor are still the book\'s tier 1 tables — guns and chrome names come when the remap reaches equipment. The numbers are what count.', true));
    box.appendChild(panel('Primary weapon', 'two-handed, or one-handed plus a secondary', [mk(D.equipment.weapons.filter((w) => w.category === 'Primary'), 'primary')]));
    box.appendChild(panel('Secondary weapon', twoH ? 'not with a two-handed primary' : 'one-handed primary only', [mk(D.equipment.weapons.filter((w) => w.category === 'Secondary'), 'secondary', twoH)]));
    const ag = el('div', { class: 'opts' });
    for (const a of D.equipment.armor) ag.appendChild(opt(a.name, st.armor === a.name, () => { st.armor = a.name; save(); redraw(); }, { meta: 'Thresholds ' + a.major + ' / ' + a.severe + ' · Armor Score ' + a.score, text: a.feature || '', cls: 'unmapped' }));
    box.appendChild(panel('Armor', 'thresholds shown are base; your level is added on the sheet', [ag]));
    const pg = el('div', { class: 'opts' });
    for (const p of ['Minor Health Potion (clear 1d4 Hit Points)', 'Minor Stamina Potion (clear 1d4 Stress)']) pg.appendChild(opt(p, st.potion === p, () => { st.potion = p; save(); redraw(); }, { cls: 'unmapped' }));
    const c = cls();
    box.appendChild(panel('Other starting items', null, [pg, c ? hint('Class items: <b>' + esc(c.class_items) + '</b>') : null, hint('Plus the book\'s basics — rope, supplies, a handful of eddies. The GM will say what that looks like in Night City.')]));
  }

  function step6(box) {
    const c = cls();
    const kids = [field('Character description', st.description, (v) => { st.description = v; save(); }, true)];
    if (c) for (const q of c.background_questions) kids.push(field(q, st.background[q], (v) => { st.background[q] = v; save(); }, true));
    else kids.push(hint('Pick a class to see its background questions.', true));
    box.appendChild(panel('Background', c ? c.name + ' questions' : null, kids));
  }

  function step7(box) {
    box.appendChild(panel('Experiences', 'two, each +2', [
      field('Experience 1 (+2)', st.experiences[0], (v) => { st.experiences[0] = v; save(); side(); }),
      field('Experience 2 (+2)', st.experiences[1], (v) => { st.experiences[1] = v; save(); side(); }),
      hint('Specific beats broad: <i>Ex-Trauma Team medic</i>, <i>Kabuki fixer\'s runner</i>, <i>Braindance editor</i>, <i>Tyger Claw debts</i>.'),
    ]));
  }

  function step8(box) {
    const c = cls();
    if (!c) { box.appendChild(hint('Pick a class first — your cards come from its two domains.', true)); return; }
    const g = el('div', { class: 'opts wide' });
    for (const card of classCards()) {
      const on = st.cards.includes(card.name);
      const b = opt(card.name, on, () => { if (on) st.cards = st.cards.filter((n) => n !== card.name); else if (st.cards.length < 2) st.cards.push(card.name); save(); redraw(); },
        { meta: card.domain + ' · level ' + card.level + ' · ' + card.type + ' · recall ' + card.recall, text: card.text, was: card.was, cls: card.converted ? '' : 'unmapped' });
      if (!on && st.cards.length >= 2) b.disabled = true;
      g.appendChild(b);
    }
    box.appendChild(panel('Domain cards', c.domains.join(' + ') + ' · choose two', [hint('Converted cards carry their Night City name; the rest still show the book\'s name with the renamed terms inside.'), g]));
  }

  function step9(box) {
    const c = cls();
    const kids = [];
    if (c) for (const q of c.connections) kids.push(field(q, st.connections[q], (v) => { st.connections[q] = v; save(); }, true));
    else kids.push(hint('Pick a class to see its connection prompts.', true));
    box.appendChild(panel('Connections', c ? c.name + ' prompts — ask another player' : null, kids));
    const missing = STEP_TITLES.map((t, i) => (stepDone(i + 1) ? null : (i + 1) + '. ' + t)).filter(Boolean);
    box.appendChild(panel('Finish', null, [missing.length ? hint('Still open: ' + missing.join(' · '), true) : hint('Everything is filled in. Export the JSON for the GM, or print the sheet.'),
      el('div', { class: 'sheet-acts' }, [el('button', { class: 'btn', type: 'button', onclick: exportJson }, 'Export JSON'), el('button', { class: 'btn cyan', type: 'button', onclick: () => window.print() }, 'Print sheet')])]));
  }
  const STEPS = [step1, step2, step3, step4, step5, step6, step7, step8, step9];

  // ---------------------------------------------------------------- export / import / print
  function exportJson() {
    const blob = new Blob([JSON.stringify({ builder: 'kill-fee', version: 1, level: LEVEL, derived: derived(), character: st }, null, 2)], { type: 'application/json' });
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
    h.push('<h1>' + esc(st.name || 'Unnamed') + '</h1><p>' + esc([st.pronouns, c && c.name, s && s.name, 'Level ' + LEVEL].filter(Boolean).join(' · ')) + '</p>');
    h.push('<div class="pstats">' + [['Evasion', d.evasion], ['HP', d.hp], ['Stress', d.stress], ['Hope', d.hope], ['Armor', d.armorScore], ['Thresholds', d.major != null ? d.major + ' / ' + d.severe : null]].map(([k, v]) => '<div>' + k + ' <b>' + (v == null ? '—' : v) + '</b></div>').join('') + '</div>');
    h.push('<h2>Traits</h2><p>' + D.traits.map((t) => t.name + ' ' + fmtMod(st.traits[t.name])).join(' · ') + '</p>');
    h.push('<h2>Heritage</h2><p>' + esc((co ? 'Community: ' + co.name : '') + (st.nochrome ? ' · No chrome' : (st.top || st.bottom ? ' · Chrome: ' + [st.top, st.bottom].filter(Boolean).join(', ') : ''))) + '</p>');
    if (co) h.push('<p>' + md(co.text) + '</p>');
    for (const slot of ['top', 'bottom']) { const ch = chrome(slot); if (ch) h.push('<p><b>' + esc(ch.name) + ':</b> ' + md(ch.text) + '</p>'); }
    h.push('<h2>Features</h2>' + feats.map((f) => '<p><b>' + esc(f.name) + ':</b> ' + md(f.text) + '</p>').join(''));
    h.push('<h2>Equipment</h2><p>' + esc([p && p.name + ' (' + p.damage + ', ' + p.range + ')', sc && sc.name + ' (' + sc.damage + ', ' + sc.range + ')', a && a.name, st.potion, c && c.class_items].filter(Boolean).join(' · ')) + '</p>');
    h.push('<h2>Experiences</h2><p>' + esc(st.experiences.filter(Boolean).map((e) => e + ' +2').join(' · ')) + '</p>');
    h.push('<h2>Domain cards</h2>' + cards().map((k) => '<p><b>' + esc(k.name) + '</b> (' + esc(k.domain) + ' ' + k.level + ', ' + esc(k.type) + ', recall ' + k.recall + '): ' + md(k.text) + '</p>').join(''));
    if (st.description) h.push('<h2>Description</h2><p>' + esc(st.description) + '</p>');
    const bq = Object.entries(st.background).filter(([, v]) => v); if (bq.length) h.push('<h2>Background</h2>' + bq.map(([q, v]) => '<p><i>' + esc(q) + '</i><br>' + esc(v) + '</p>').join(''));
    const cq = Object.entries(st.connections).filter(([, v]) => v); if (cq.length) h.push('<h2>Connections</h2>' + cq.map(([q, v]) => '<p><i>' + esc(q) + '</i><br>' + esc(v) + '</p>').join(''));
    return h.join('');
  }
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
      el('p', { class: 'sub' }, [st.pronouns, c && c.name, s && s.name, 'level ' + LEVEL].filter(Boolean).join(' · ')),
      el('div', { class: 'stats' }, [['Evasion', d.evasion], ['HP', d.hp], ['Stress', d.stress], ['Hope', d.hope], ['Armor', d.armorScore], ['Thresh.', d.major != null ? d.major + '/' + d.severe : null]].map(([k, v]) => el('div', { class: 'stat' }, [el('b', {}, v == null ? '—' : String(v)), el('span', {}, k)]))),
      el('div', { class: 'tr6' }, D.traits.map((t) => el('div', { class: 'stat' }, [el('b', {}, fmtMod(st.traits[t.name])), el('span', {}, t.name.slice(0, 5))]))),
      el('dl', {}, [
        el('dt', {}, 'Chrome'), dd(st.nochrome ? 'none (by choice)' : [st.top, st.bottom].filter(Boolean).join(' · ')),
        el('dt', {}, 'Community'), dd(co && co.name),
        el('dt', {}, 'Weapons'), dd([st.primary, st.secondary].filter(Boolean).join(' · ')),
        el('dt', {}, 'Armor'), dd(st.armor),
        el('dt', {}, 'Experiences'), dd(st.experiences.filter(Boolean).map((e) => e + ' +2').join(' · ')),
        el('dt', {}, 'Domain cards'), dd(st.cards.join(' · ')),
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
    const t = D.steps.find((x) => x.n === st.step);
    mainEl.appendChild(el('h2', { class: 'group-h' }, 'Step ' + st.step + ' — ' + STEP_TITLES[st.step - 1]));
    if (t) mainEl.appendChild(el('details', { class: 'step-text' }, [el('summary', {}, 'The book: ' + t.title), el('div', { class: 'book', html: md(t.text) })]));
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
