// さかな・水草・すいそうの背景を SVG で かく（species.js の art 指定から生成）。
// 返すのは SVG 文字列。データはすべてこのアプリ内の定数なので innerHTML に入れてよい。
// さかなは左向き。viewBox は 130×100、体の中心線は y=50。
// 同じさかなを何匹も ならべるので、SVG内の id（clipPath・gradient）には uid を付けて ページ内で かさならないようにする。
(function (root) {
  'use strict';

  const CY = 50;
  const f1 = n => Math.round(n * 10) / 10;
  const pts = list => list.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');

  function seeded(seed) {
    let a = seed * 9301 + 49297;
    return () => {
      a = (a * 9301 + 49297) % 233280;
      return a / 233280;
    };
  }

  // 体の輪郭の上端・下端（だいたいの値。ひれの付け根や もようの位置決めに使う）
  function makeGeom(a) {
    const g = {
      nose: a.nose ?? 8, ped: a.ped ?? 86, hT: a.hT, hB: a.hB, tb: a.tb, tf: a.tf ?? 10,
    };
    g.mx = g.nose + (g.ped - g.nose) * (a.hx ?? 0.38);
    const edge = (h, x) => {
      if (x <= g.mx) {
        const r = (g.mx - x) / (g.mx - g.nose);
        return h * Math.sqrt(Math.max(0, 1 - r * r));
      }
      const r = (x - g.mx) / (g.ped - g.mx);
      return h - (h - g.tb) * r * r;
    };
    g.top = x => CY - edge(g.hT, x);
    g.bot = x => CY + edge(g.hB, x);
    return g;
  }

  function bodyPath(g) {
    const { nose, ped, mx, hT, hB, tb } = g;
    return `M${nose},${CY} C${nose},${f1(CY - hT * 0.6)} ${f1(mx - (mx - nose) * 0.5)},${CY - hT} ${f1(mx)},${CY - hT} `
      + `C${f1(mx + (ped - mx) * 0.5)},${CY - hT} ${ped - 6},${CY - tb} ${ped},${CY - tb} L${ped},${CY + tb} `
      + `C${ped - 6},${CY + tb} ${f1(mx + (ped - mx) * 0.5)},${CY + hB} ${f1(mx)},${CY + hB} `
      + `C${f1(mx - (mx - nose) * 0.5)},${CY + hB} ${nose},${f1(CY + hB * 0.6)} ${nose},${CY} Z`;
  }

  function tailPath(type, g) {
    const p = g.ped - 3;
    const { tb, tf } = g;
    switch (type) {
      case 'round':
        return `M${p},${CY - tb} C${p + 16},${CY - tf} ${p + 26},${CY - tf * 0.6} ${p + 26},${CY} C${p + 26},${CY + tf * 0.6} ${p + 16},${CY + tf} ${p},${CY + tb} Z`;
      case 'fan':
        return `M${p},${CY - tb} L${p + 34},${CY - tf} C${p + 42},${CY - tf * 0.4} ${p + 42},${CY + tf * 0.4} ${p + 34},${CY + tf} L${p},${CY + tb} Z`;
      case 'flow':
        return `M${p},${CY - tb} C${p + 20},${CY - tf} ${p + 44},${CY - tf * 0.9} ${p + 50},${CY - 2} C${p + 46},${CY + tf} ${p + 20},${CY + tf * 1.1} ${p},${CY + tb} Z`;
      case 'lyre':
        return `M${p},${CY - tb} C${p + 12},${CY - tf} ${p + 22},${CY - tf - 4} ${p + 32},${CY - tf - 6} C${p + 24},${CY - 4} ${p + 24},${CY + 4} ${p + 32},${CY + tf + 6} C${p + 22},${CY + tf + 4} ${p + 12},${CY + tf} ${p},${CY + tb} Z`;
      case 'sword':
        return `M${p},${CY - tb} L${p + 24},${CY - tf} C${p + 20},${CY - 2} ${p + 22},${CY + 2} ${p + 24},${CY + tf * 0.6} L${p},${CY + tb} Z`;
      default: // fork
        return `M${p},${CY - tb} L${p + 26},${CY - tf} L${p + 18},${CY} L${p + 26},${CY + tf} L${p},${CY + tb} Z`;
    }
  }

  // ひれ（体の うしろに かく。付け根は 体に かくれる）
  function dorsalFin(type, g, a) {
    const { mx, ped, hT } = g;
    const t = g.top;
    const fill = `fill="${a.fin}"`;
    switch (type) {
      case 'none': return '';
      case 'tall': {
        const x = mx - 2;
        return `<path ${fill} opacity="0.9" d="M${f1(x)},${f1(t(x) + 4)} L${f1(x + 3)},${f1(t(x) - hT * 0.85)} L${f1(x + 12)},${f1(t(x + 12) + 3)} Z"/>`;
      }
      case 'sail': {
        const x = mx - 6;
        return `<path ${fill} opacity="0.95" d="M${f1(x)},${f1(t(x) + 3)} L${f1(x + 3)},${f1(t(x) - hT * 0.9)} L${f1(x + 32)},${f1(t(x + 32) - hT * 0.35)} L${f1(x + 34)},${f1(t(x + 34) + 3)} Z"/>`;
      }
      case 'long': {
        const x = mx - 4;
        return `<path ${fill} opacity="0.85" d="M${f1(x)},${f1(t(x) + 3)} L${f1(x + 5)},${f1(t(x) - 7)} L${f1(ped + 2)},${f1(t(ped) - 7)} L${f1(ped)},${f1(t(ped) + 2)} Z"/>`;
      }
      case 'double': {
        const x1 = mx - 4;
        const x2 = mx + 16;
        return `<path ${fill} opacity="0.85" d="M${f1(x1)},${f1(t(x1) + 3)} L${f1(x1 + 4)},${f1(t(x1) - 6)} L${f1(x1 + 10)},${f1(t(x1 + 10) + 2)} Z"/>`
          + `<path ${fill} opacity="0.85" d="M${f1(x2)},${f1(t(x2) + 3)} L${f1(x2 + 4)},${f1(t(x2) - 9)} L${f1(ped)},${f1(t(ped) - 4)} L${f1(ped - 2)},${f1(t(ped) + 2)} Z"/>`;
      }
      case 'crest': {
        const x = mx - 6;
        return `<path fill="#1e1e22" d="M${f1(x)},${f1(t(x) + 3)} L${f1(x + 1)},${f1(t(x) - 11)} L${f1(x + 5)},${f1(t(x) - 6)} L${f1(x + 7)},${f1(t(x) - 12)} L${f1(x + 11)},${f1(t(x + 11) - 5)} L${f1(x + 12)},${f1(t(x + 12) + 3)} Z"/>`
          + `<path ${fill} opacity="0.85" d="M${f1(x + 10)},${f1(t(x + 10) + 3)} L${f1(x + 12)},${f1(t(x + 12) - 6)} L${f1(ped + 2)},${f1(t(ped) - 6)} L${f1(ped)},${f1(t(ped) + 2)} Z"/>`;
      }
      case 'cockatoo': {
        const x = mx - 10;
        const spikes = [];
        for (let i = 0; i < 6; i++) {
          const xi = x + i * 5;
          spikes.push([xi, t(xi) - (16 - i * 1.6)], [xi + 2.5, t(xi + 2.5) - 4]);
        }
        const outline = [[x, t(x) + 3], ...spikes, [ped, t(ped) - 4], [ped - 1, t(ped) + 2]];
        return `<polygon fill="${a.fin}" points="${pts(outline)}"/>`
          + spikes.filter((_, i) => i % 2 === 0).slice(0, 4).map(([px, py]) => `<circle cx="${f1(px)}" cy="${f1(py + 1)}" r="1.6" fill="#d22a1f"/>`).join('');
      }
      case 'flow': {
        const x = mx - 8;
        return `<path ${fill} opacity="0.92" d="M${f1(x)},${f1(t(x) + 3)} C${f1(x + 4)},${f1(t(x) - hT * 1.6)} ${f1(ped + 14)},${f1(CY - hT * 2.4)} ${f1(ped + 18)},${f1(CY - hT * 0.8)} L${f1(ped)},${f1(t(ped) + 2)} Z"/>`;
      }
      case 'angel': {
        const x = mx - 12;
        return `<path ${fill} opacity="0.9" d="M${f1(x)},${f1(t(x) + 4)} C${f1(x + 8)},${f1(CY - hT - 14)} ${f1(ped)},${f1(CY - hT - 26)} ${f1(ped + 10)},${f1(CY - hT - 30)} C${f1(ped + 4)},${f1(CY - hT - 12)} ${f1(ped + 2)},${f1(CY - hT * 0.5)} ${f1(ped)},${f1(t(ped) + 2)} Z"/>`;
      }
      case 'rear': {
        const x = ped - 26;
        return `<path ${fill} opacity="0.9" d="M${f1(x)},${f1(t(x) + 3)} L${f1(x + 4)},${f1(t(x) - 6)} L${f1(ped + 2)},${f1(t(ped) - 6)} L${f1(ped)},${f1(t(ped) + 2)} Z"/>`;
      }
      default: { // small
        const x = mx + (ped - mx) * 0.05;
        const h = hT * 0.55 + 3;
        return `<path ${fill} opacity="0.85" d="M${f1(x)},${f1(t(x) + 3)} L${f1(x + 4)},${f1(t(x) - h)} L${f1(x + 13)},${f1(t(x + 13) + 2)} Z"/>`;
      }
    }
  }

  function analFin(type, g, a) {
    const { mx, ped, hB } = g;
    const b = g.bot;
    const fill = `fill="${a.fin}"`;
    switch (type) {
      case 'none': return '';
      case 'long': {
        const x = mx - 2;
        return `<path ${fill} opacity="0.85" d="M${f1(x)},${f1(b(x) - 3)} L${f1(x + 5)},${f1(b(x) + 7)} L${f1(ped + 2)},${f1(b(ped) + 7)} L${f1(ped)},${f1(b(ped) - 2)} Z"/>`;
      }
      case 'glass': {
        const x = mx - 6;
        return `<path ${fill} opacity="0.55" d="M${f1(x)},${f1(b(x) - 3)} L${f1(x + 3)},${f1(b(x) + 5)} L${f1(ped + 2)},${f1(b(ped) + 4)} L${f1(ped)},${f1(b(ped) - 2)} Z"/>`;
      }
      case 'flow': {
        const x = mx - 6;
        return `<path ${fill} opacity="0.92" d="M${f1(x)},${f1(b(x) - 3)} C${f1(x + 4)},${f1(b(x) + hB * 1.6)} ${f1(ped + 10)},${f1(CY + hB * 2.6)} ${f1(ped + 16)},${f1(CY + hB * 1.2)} L${f1(ped)},${f1(b(ped) - 2)} Z"/>`;
      }
      case 'angel': {
        const x = mx - 8;
        return `<path ${fill} opacity="0.9" d="M${f1(x)},${f1(b(x) - 4)} C${f1(x + 8)},${f1(CY + hB + 14)} ${f1(ped)},${f1(CY + hB + 24)} ${f1(ped + 10)},${f1(CY + hB + 28)} C${f1(ped + 4)},${f1(CY + hB + 10)} ${f1(ped + 2)},${f1(CY + hB * 0.5)} ${f1(ped)},${f1(b(ped) - 2)} Z"/>`;
      }
      case 'rear': {
        const x = ped - 24;
        return `<path ${fill} opacity="0.9" d="M${f1(x)},${f1(b(x) - 3)} L${f1(x + 4)},${f1(b(x) + 6)} L${f1(ped + 2)},${f1(b(ped) + 6)} L${f1(ped)},${f1(b(ped) - 2)} Z"/>`;
      }
      default: { // small
        const x = mx + (ped - mx) * 0.3;
        const h = hB * 0.4 + 3;
        return `<path ${fill} opacity="0.8" d="M${f1(x)},${f1(b(x) - 3)} L${f1(x + 4)},${f1(b(x) + h)} L${f1(x + 12)},${f1(b(x + 12) - 2)} Z"/>`;
      }
    }
  }

  function patternLayer(p, g, idx) {
    const top = CY - 40;
    const full = 80;
    switch (p.t) {
      case 'belly':
        return `<rect x="${p.x0}" y="${f1(CY + p.y)}" width="${p.x1 - p.x0}" height="40" fill="${p.color}"/>`;
      case 'stripe':
        return `<rect x="${p.x0}" y="${f1(CY + p.y - p.h / 2)}" width="${p.x1 - p.x0}" height="${p.h}" rx="${p.h / 2}" fill="${p.color}"/>`;
      case 'hstripes':
        return p.ys.map(y => `<rect x="${p.x0}" y="${f1(CY + y - p.h / 2)}" width="${p.x1 - p.x0}" height="${p.h}" fill="${p.color}"/>`).join('');
      case 'nose':
        return `<rect x="0" y="${top}" width="${p.x1}" height="${full}" fill="${p.color}"/>`;
      case 'bands':
        return p.xs.map(x => {
          const s = p.slant || 0;
          return `<polygon fill="${p.color}" points="${pts([[x - p.w / 2 + s, top], [x + p.w / 2 + s, top], [x + p.w / 2 - s, top + full], [x - p.w / 2 - s, top + full]])}"/>`;
        }).join('');
      case 'ellipse':
        return `<ellipse cx="${p.cx}" cy="${f1(CY + p.cy)}" rx="${p.rx}" ry="${p.ry}" fill="${p.color}"/>`;
      case 'poly':
        return `<polygon fill="${p.color}" points="${pts(p.pts.map(([x, y]) => [x, CY + y]))}"/>`;
      case 'spots': {
        const r = seeded(p.seed + idx);
        let out = '';
        for (let i = 0; i < p.n; i++) {
          const x = p.x0 + r() * (p.x1 - p.x0);
          const y = g.top(x) + 2 + r() * Math.max(1, g.bot(x) - g.top(x) - 4);
          out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${p.r}" fill="${p.color}"/>`;
        }
        return out;
      }
      case 'waves': {
        let out = '';
        for (let i = 0; i < p.n; i++) {
          const y = CY + p.y0 + i * p.dy;
          let d = `M${p.x0},${f1(y)}`;
          for (let x = p.x0; x < p.x1; x += 8) d += ` q4,${i % 2 ? -3 : 3} 8,0`;
          out += `<path d="${d}" stroke="${p.color}" stroke-width="1.1" fill="none"/>`;
        }
        return out;
      }
      default:
        return '';
    }
  }

  function drawStandardFish(sp, uid) {
    const a = sp.art;
    const g = makeGeom(a);
    const id = `${sp.id}-${uid}`;
    const body = bodyPath(g);
    const tail = tailPath(a.tail, g);
    let defs = `<clipPath id="b-${id}"><path d="${body}"/></clipPath><clipPath id="t-${id}"><path d="${tail}"/></clipPath>`;

    let bodyFill;
    if (a.grad) {
      defs += `<linearGradient id="g-${id}" x1="0" x2="1" y1="0" y2="0">${a.grad.map((c, i) => `<stop offset="${i / (a.grad.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
      bodyFill = `url(#g-${id})`;
    } else {
      defs += `<linearGradient id="g-${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0.15" stop-color="${a.back || a.base}"/><stop offset="0.55" stop-color="${a.base}"/></linearGradient>`;
      bodyFill = `url(#g-${id})`;
    }
    let tailFill = a.fin;
    if (a.tailGrad) {
      defs += `<linearGradient id="tg-${id}" x1="0" x2="1" y1="0" y2="0">${a.tailGrad.map((c, i) => `<stop offset="${i / (a.tailGrad.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
      tailFill = `url(#tg-${id})`;
    }

    let back = '';
    // むなびれ（ハチェットの はね・プレコの おおきな むなびれ）
    if (a.wings) {
      back += `<path fill="${a.fin}" opacity="0.7" d="M${g.nose + 12},${CY + 4} C${g.nose + 30},${CY - 12} ${g.nose + 50},${CY - 16} ${g.nose + 62},${CY - 14} C${g.nose + 44},${CY - 8} ${g.nose + 28},${CY} ${g.nose + 16},${CY + 8} Z"/>`;
    }
    back += dorsalFin(a.dorsal || 'small', g, a) + analFin(a.anal || 'small', g, a);
    back += `<path d="${tail}" fill="${tailFill}" opacity="${a.glass ? 0.5 : 0.92}"/>`;
    const tailLen = { round: 26, fan: 40, flow: 50, lyre: 32, sword: 24 }[a.tail] || 26;
    let rays = '';
    for (let i = -2; i <= 2; i++) {
      rays += `<path d="M${g.ped - 2},${CY} L${g.ped - 3 + tailLen},${f1(CY + i * g.tf * 0.55)}" stroke="#000" stroke-opacity="0.13" stroke-width="0.8"/>`;
    }
    back += `<g clip-path="url(#t-${id})">${rays}</g>`;
    if (a.finEdge) {
      back += `<path d="${tail}" fill="none" stroke="${a.finEdge}" stroke-width="2.4" opacity="0.8"/>`;
      back = back.replace(/(<path fill="[^"]+" opacity="0\.92" d="[^"]+"\/>)/g, (m) => m + m.replace(/fill="[^"]+" opacity="0\.92"/, `fill="none" stroke="${a.finEdge}" stroke-width="2" opacity="0.7"`));
    }
    if (a.tailPattern) {
      back += `<g clip-path="url(#t-${id})">${a.tailPattern.map(s => `<rect x="${g.ped - 4}" y="${f1(CY + s.y)}" width="60" height="${s.h}" fill="${s.color}"/>`).join('')}</g>`;
    }
    if (a.tail === 'sword') {
      const p = g.ped - 3;
      back += `<path fill="${a.fin}" d="M${p},${CY + g.tb - 1} L${p + 40},${CY + g.tf + 4} L${p + 38},${CY + g.tf + 7} L${p - 2},${CY + g.tb + 2} Z"/>`
        + `<path fill="none" stroke="#151515" stroke-width="1.4" d="M${p + 2},${CY + g.tb + 1.5} L${p + 39},${CY + g.tf + 6.5}"/>`
        + `<path fill="none" stroke="#151515" stroke-width="1.2" d="M${p + 4},${CY + g.tb - 1.5} L${p + 39},${CY + g.tf + 3.6}"/>`;
    }
    if (a.adipose) {
      const x = g.ped - 9;
      back += `<ellipse cx="${f1(x)}" cy="${f1(g.top(x) - 1)}" rx="3" ry="2" fill="${a.fin}" opacity="0.8"/>`;
    }
    if (a.threads) {
      const x = g.mx - 6;
      back += `<path d="M${f1(x)},${f1(g.bot(x) - 2)} C${f1(x + 6)},${f1(g.bot(x) + 12)} ${f1(x + 18)},${f1(g.bot(x) + 20)} ${f1(x + 34)},${f1(g.bot(x) + 22)}" stroke="${a.fin}" stroke-width="1.4" fill="none"/>`;
    }
    if (a.filaments) {
      const x = g.mx - 10;
      back += `<path d="M${f1(x)},${f1(g.bot(x) - 2)} C${f1(x + 2)},${f1(g.bot(x) + 18)} ${f1(x + 8)},${f1(g.bot(x) + 30)} ${f1(x + 16)},${f1(g.bot(x) + 38)}" stroke="${a.fin}" stroke-width="1.6" fill="none"/>`;
    }
    if (a.pectoral) {
      const x = g.nose + 14;
      back += `<path fill="${a.fin}" opacity="0.95" d="M${x},${CY + 2} C${x + 4},${CY + 14} ${x + 18},${CY + 16} ${x + 26},${CY + 12} L${x + 8},${CY + 2} Z"/>`;
      if (a.pattern && a.pattern[0].t === 'bands') {
        back += `<path stroke="${a.pattern[0].color}" stroke-width="2.4" fill="none" d="M${x + 6},${CY + 6} L${x + 20},${CY + 12}"/>`;
      }
    }

    // からだ
    let bodySvg = `<path d="${body}" fill="${bodyFill}" ${a.glass ? 'fill-opacity="0.3"' : ''}/>`;
    let inner = (a.pattern || []).map((p, i) => patternLayer(p, g, i)).join('');
    if (a.scales) {
      for (let row = -2; row <= 2; row++) {
        for (let x = g.nose + 18 + (row % 2 ? 5 : 0); x < g.ped; x += 10) {
          const y = CY + row * 5.5;
          inner += `<path d="M${f1(x)},${f1(y - 3.2)} a4,3.4 0 0 1 0,6.4" stroke="${a.scales}" stroke-width="1.1" fill="none"/>`;
        }
      }
    }
    if (a.glass) {
      // すきとおった からだ：あたまだけ ぎんいろ、せぼねと ろっこつが みえる
      inner += `<rect x="0" y="0" width="${g.nose + 16}" height="100" fill="#c9d6da"/>`;
      inner += `<path d="M${g.nose + 16},${CY - 1} L${g.ped},${CY - 1}" stroke="#7d9aa2" stroke-width="1.6"/>`;
      for (let x = g.nose + 22; x < g.ped - 4; x += 4.5) {
        inner += `<path d="M${f1(x)},${f1(g.top(x) + 2)} L${f1(x + 2)},${f1(g.bot(x) - 2)}" stroke="#9fb8be" stroke-width="0.7"/>`;
      }
      inner += `<ellipse cx="${g.nose + 22}" cy="${CY + 4}" rx="5" ry="4" fill="#b8c8cc" opacity="0.8"/>`;
    }
    if (a.sheen) {
      inner += `<ellipse cx="${f1(g.mx)}" cy="${f1(CY - g.hT * 0.45)}" rx="${f1((g.ped - g.nose) * 0.35)}" ry="${f1(g.hT * 0.25)}" fill="#ffffff" opacity="0.12"/>`;
    }
    // うっすら 影をつけて 立体感をだす
    inner += `<rect x="0" y="${f1(CY + 2)}" width="130" height="50" fill="#000" opacity="${a.glass ? 0 : 0.08}"/>`;
    bodySvg += `<g clip-path="url(#b-${id})">${inner}</g>`;
    bodySvg += `<path d="${body}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="0.8"/>`;

    // かお
    const ex = g.nose + Math.max(7, (g.mx - g.nose) * 0.32);
    const ey = CY + (a.eyeY ?? -g.hT * 0.22);
    const er = Math.min(4.2, Math.max(2.6, 2.2 + g.hT * 0.09));
    let face = `<path d="M${f1(ex + er + 3)},${f1(ey - er - 1)} q3,${f1(er + 3)} 0,${f1(er * 2 + 4)}" stroke="#000" stroke-opacity="0.2" stroke-width="0.9" fill="none"/>`;
    face += `<circle cx="${f1(ex)}" cy="${f1(ey)}" r="${f1(er)}" fill="${a.eyeColor || '#f4f1e6'}"/>`
      + `<circle cx="${f1(ex - 0.4)}" cy="${f1(ey)}" r="${f1(er * 0.62)}" fill="#111"/>`
      + `<circle cx="${f1(ex - 1.2)}" cy="${f1(ey - 1)}" r="${f1(er * 0.22)}" fill="#fff"/>`;
    if (a.upturned) {
      face += `<path d="M${g.nose + 1},${CY - 2} L${g.nose + 14},${CY + 3}" stroke="#7a5a10" stroke-width="1.2"/>`;
    } else {
      face += `<path d="M${g.nose + 0.5},${CY + 1} l3,0.6" stroke="#000" stroke-opacity="0.4" stroke-width="0.9"/>`;
    }
    if (a.barbels === 'chin') {
      face += `<path d="M${g.nose + 3},${CY - 1} l-5,-6 M${g.nose + 5},${CY - 1} l-3,-7" stroke="${a.back}" stroke-width="1.3"/>`;
    } else if (a.barbels) {
      const len = a.glass ? 14 : 6;
      face += `<path d="M${g.nose + 2},${CY + 2} l-${len},${a.glass ? -3 : 4} M${g.nose + 3},${CY + 3} l-${len - 1},${a.glass ? 3 : 6}" stroke="${a.back || a.base}" stroke-width="1.1"/>`;
    }
    if (a.sucker) face += `<ellipse cx="${g.nose + 4}" cy="${CY + 4}" rx="4" ry="2.2" fill="${a.back || a.base}"/>`;
    if (a.bristles) {
      face += [0, 1, 2, 3].map(i => `<path d="M${g.nose + 3 + i * 2.5},${CY - 4 - i} l-2,-3" stroke="#d9d2b0" stroke-width="1"/>`).join('');
    }
    // むなびれ（ふつう）
    if (!a.pectoral && !a.wings) {
      face += `<path d="M${f1(ex + er + 6)},${f1(CY + 2)} q6,2 9,7 q-6,-1 -9,-4 Z" fill="${a.pecColor || a.fin}" opacity="${a.pecColor ? 0.95 : 0.6}"/>`;
    }

    return `<svg viewBox="0 0 130 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${back}${bodySvg}${face}</svg>`;
  }

  function drawShrimp(sp) {
    const a = sp.art;
    const op = a.opacity ?? 1;
    // あたま（左）→ からだ（右に まがる）→ しっぽ
    const segs = [[56, 47, 8, 8], [66, 48, 7, 7.5], [75, 50, 6.5, 7], [83, 53, 6, 6.2], [90, 57, 5.2, 5.4], [95, 62, 4.4, 4.6]];
    let s = '';
    s += `<path d="M30,44 C10,30 -2,26 -6,24 M30,46 C14,40 2,42 -6,46" stroke="${a.bands || '#8a9a96'}" stroke-width="1" fill="none" opacity="0.8"/>`;
    s += [40, 48, 56, 64, 72].map(x => `<path d="M${x},${55} l-3,10" stroke="${a.bands || '#8a9a96'}" stroke-width="1.1" opacity="0.7"/>`).join('');
    s += `<path d="M97,64 L108,70 L104,62 L110,58 Z" fill="${a.base}" opacity="${op}"/>`;
    segs.slice().reverse().forEach(([x, y, rx, ry], i) => {
      const fill = a.bands ? (i % 2 ? a.bands : a.base) : a.base;
      s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${op}"/>`;
    });
    s += `<ellipse cx="40" cy="47" rx="16" ry="9" fill="${a.bands || a.base}" opacity="${op}"/>`;
    s += `<path d="M24,44 L14,40 L26,42 Z" fill="${a.bands || a.base}" opacity="${op}"/>`;
    if (a.dash) {
      s += [[34, 49], [44, 50], [56, 50], [66, 51], [76, 53], [84, 56]].map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="1.4" fill="${a.dash}"/>`).join('');
    }
    if (a.bands) s += `<path d="M30,46 q10,-8 22,0" stroke="${a.base}" stroke-width="3" fill="none"/>`;
    s += '<circle cx="27" cy="44" r="2.4" fill="#111"/>';
    return `<svg viewBox="0 0 130 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
  }

  function drawSnail(sp) {
    const a = sp.art;
    return `<svg viewBox="0 0 130 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
      + `<path d="M28,70 C30,62 92,60 100,70 Z" fill="${a.foot}"/>`
      + `<path d="M34,64 l-12,-14 M38,63 l-8,-16" stroke="${a.foot}" stroke-width="2.2" stroke-linecap="round"/>`
      + `<circle cx="66" cy="46" r="22" fill="${a.base}"/>`
      + `<path d="M66,46 m-4,0 a4,4 0 1 1 8,0 a8,8 0 1 1 -16,0 a12,12 0 1 1 24,0 a16,16 0 1 1 -32,0" stroke="#8c2a22" stroke-width="2" fill="none"/>`
      + `<ellipse cx="58" cy="36" rx="8" ry="4" fill="#fff" opacity="0.25"/>`
      + `</svg>`;
  }

  function drawDiscus(sp, uid) {
    const a = sp.art;
    const id = `${sp.id}-${uid}`;
    let lines = '';
    for (let i = -4; i <= 4; i++) {
      const y = 50 + i * 6;
      lines += `<path d="M28,${y} q8,-3 16,0 t16,0 t16,0 t16,0" stroke="${a.line}" stroke-width="2.2" fill="none"/>`;
    }
    let bands = '';
    for (let x = 40; x <= 84; x += 6) bands += `<rect x="${x}" y="15" width="2.5" height="70" fill="${a.band}" opacity="0.35"/>`;
    return `<svg viewBox="0 0 130 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
      + `<defs><clipPath id="b-${id}"><circle cx="60" cy="50" r="31"/></clipPath></defs>`
      + `<path d="M90,50 L108,38 C112,46 112,54 108,62 Z" fill="${a.fin}" opacity="0.85"/>`
      + `<path d="M38,22 C56,8 86,10 98,40 L98,60 C86,90 56,92 38,78 Z" fill="${a.fin}" opacity="0.9"/>`
      + `<path d="M40,22 C58,10 86,12 96,40" stroke="${a.line}" stroke-width="1.6" fill="none" opacity="0.8"/>`
      + `<circle cx="60" cy="50" r="31" fill="${a.base}"/>`
      + `<g clip-path="url(#b-${id})">${bands}${lines}<rect x="0" y="55" width="130" height="50" fill="#000" opacity="0.08"/></g>`
      + `<circle cx="60" cy="50" r="31" fill="none" stroke="#000" stroke-opacity="0.18"/>`
      + `<circle cx="38" cy="44" r="4.2" fill="#e8402c"/><circle cx="37.6" cy="44" r="2.4" fill="#111"/><circle cx="36.8" cy="43" r="0.8" fill="#fff"/>`
      + `<path d="M29.5,51 l3,0.6" stroke="#000" stroke-opacity="0.5"/>`
      + `<path d="M50,52 q6,2 9,7 q-6,-1 -9,-4 Z" fill="${a.fin}" opacity="0.7"/>`
      + `</svg>`;
  }

  function drawFish(sp, uid = '0') {
    if (sp.kind === 'shrimp') return drawShrimp(sp);
    if (sp.kind === 'snail') return drawSnail(sp);
    if (sp.kind === 'disc') return drawDiscus(sp, uid);
    return drawStandardFish(sp, uid);
  }

  // ---- 水草・石（viewBox 60×80、下はしが 底すな） ----
  function leaf(x, y, len, w, angle, color) {
    return `<path transform="translate(${x},${y}) rotate(${angle})" d="M0,0 C${w},-${len * 0.3} ${w},-${len * 0.75} 0,-${len} C-${w},-${len * 0.75} -${w},-${len * 0.3} 0,0 Z" fill="${color}"/>`;
  }

  function drawPlant(id) {
    let s = '';
    switch (id) {
      case 'anubias':
        s = `<ellipse cx="30" cy="77" rx="14" ry="4" fill="#4a3a2a"/>`
          + [[-45, 22], [-20, 26], [5, 28], [28, 25], [50, 21]].map(([a, l], i) => leaf(30, 76, l, 9, a, i % 2 ? '#1f5a2a' : '#2a6e34')).join('');
        break;
      case 'microsorum':
        s = [[-35, 44], [-15, 52], [0, 48], [18, 54], [34, 42]].map(([a, l], i) => leaf(30, 78, l, 5, a, i % 2 ? '#3d7a2a' : '#4e8c34')).join('')
          + `<ellipse cx="30" cy="77" rx="10" ry="3" fill="#5a4a32"/>`;
        break;
      case 'moss': {
        s = `<path d="M8,80 C10,66 22,60 32,62 C44,60 54,68 54,80 Z" fill="#5a5a58"/>`;
        const r = seeded(7);
        for (let i = 0; i < 36; i++) {
          const x = 10 + r() * 42;
          const y = 62 + r() * 14 - (x > 18 && x < 46 ? 4 : 0);
          s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2.5 + r() * 2.5)}" fill="${i % 3 ? '#3f7d2c' : '#5a9a3a'}"/>`;
        }
        break;
      }
      case 'rotala':
        [[14, 62], [24, 72], [34, 66], [44, 58]].forEach(([x, h], i) => {
          s += `<path d="M${x},80 C${x - 2},${80 - h * 0.5} ${x + 2},${80 - h * 0.8} ${x},${80 - h}" stroke="#4d7a2e" stroke-width="1.6" fill="none"/>`;
          for (let k = 8; k < h; k += 8) {
            const col = k > h - 16 ? '#e86a8a' : (k > h - 28 ? '#c8a04a' : '#5a9a3a');
            const side = (k / 8 + i) % 2 ? 1 : -1;
            s += leaf(x, 80 - k, 6, 2.2, -65 * side, col) + leaf(x, 80 - k, 5, 2, 50 * side, col);
          }
        });
        break;
      case 'sword':
        s = [[-50, 40], [-30, 56], [-12, 66], [6, 70], [24, 62], [42, 48], [58, 36]].map(([a, l], i) => leaf(30, 79, l, 6, a, i % 2 ? '#2f7a32' : '#3d8c3a')).join('')
          + [[-20, 56], [16, 60]].map(([a, l]) => `<path transform="translate(30,79) rotate(${a})" d="M0,0 L0,-${l}" stroke="#2a6a2c" stroke-width="0.8"/>`).join('');
        break;
      case 'hairgrass': {
        const r = seeded(3);
        for (let i = 0; i < 26; i++) {
          const x = 6 + r() * 48;
          const h = 26 + r() * 22;
          s += `<path d="M${f1(x)},80 q${f1((r() - 0.5) * 10)},-${f1(h / 2)} ${f1((r() - 0.5) * 8)},-${f1(h)}" stroke="${i % 3 ? '#4f9a3a' : '#6ab04a'}" stroke-width="1.2" fill="none"/>`;
        }
        break;
      }
      case 'glosso': {
        const r = seeded(11);
        for (let i = 0; i < 40; i++) {
          const x = 4 + r() * 52;
          const y = 70 + r() * 9;
          s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="2.6" ry="1.8" transform="rotate(${f1((r() - 0.5) * 60)} ${f1(x)} ${f1(y)})" fill="${i % 2 ? '#5ab040' : '#4a9a34'}"/>`;
        }
        break;
      }
      case 'lava': {
        s = `<path d="M6,80 C4,64 14,52 28,54 C40,48 56,58 54,80 Z" fill="#3a302c"/>`
          + `<path d="M12,66 C16,58 26,56 34,58" stroke="#5a4a42" stroke-width="2" fill="none"/>`;
        const r = seeded(13);
        for (let i = 0; i < 14; i++) s += `<circle cx="${f1(12 + r() * 38)}" cy="${f1(60 + r() * 18)}" r="${f1(0.8 + r() * 1.4)}" fill="#1e1816"/>`;
        break;
      }
      default:
        break;
    }
    return `<svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
  }

  // ---- すいそうの背景（ながれぎ・いし・うしろの水草・すな） ----
  function drawTankBackground(uid = '0') {
    const r = seeded(21);
    let backPlants = '';
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 44 + r() * 20;
      const h = 120 + r() * 90;
      const col = i % 3 === 0 ? '#2e6a3a' : (i % 3 === 1 ? '#25603a' : '#3a7a40');
      backPlants += `<path d="M${f1(x)},236 C${f1(x - 10)},${f1(236 - h * 0.5)} ${f1(x + 12)},${f1(236 - h * 0.8)} ${f1(x + 2)},${f1(236 - h)}" stroke="${col}" stroke-width="5" fill="none" opacity="0.55"/>`;
      for (let k = 14; k < h; k += 12) {
        const y = 236 - k;
        backPlants += `<ellipse cx="${f1(x + Math.sin(k / 20) * 5)}" cy="${f1(y)}" rx="9" ry="3" fill="${col}" opacity="0.45" transform="rotate(${i % 2 ? 20 : -20} ${f1(x)} ${f1(y)})"/>`;
      }
    }
    let pebbles = '';
    for (let i = 0; i < 60; i++) {
      pebbles += `<ellipse cx="${f1(r() * 400)}" cy="${f1(232 + r() * 26)}" rx="${f1(1.5 + r() * 2.5)}" ry="${f1(1 + r() * 1.5)}" fill="${i % 3 ? '#c8b088' : '#a8906a'}" opacity="0.8"/>`;
    }
    return `<svg class="tank-bg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
      + `<defs><linearGradient id="water-${uid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6fc7d4"/><stop offset="0.5" stop-color="#2e93a8"/><stop offset="1" stop-color="#145a6a"/></linearGradient>`
      + `<linearGradient id="sand-${uid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8d6ac"/><stop offset="1" stop-color="#b89a6a"/></linearGradient>`
      + `<linearGradient id="ray-${uid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`
      + `<rect width="400" height="260" fill="url(#water-${uid})"/>`
      + `<polygon points="60,0 100,0 160,240 90,240" fill="url(#ray-${uid})"/><polygon points="200,0 226,0 270,240 222,240" fill="url(#ray-${uid})"/><polygon points="300,0 330,0 380,240 330,240" fill="url(#ray-${uid})" opacity="0.7"/>`
      + backPlants
      + `<path d="M250,232 C262,200 280,176 300,160 C312,150 328,128 334,104 M300,160 C320,156 344,148 366,132 M282,184 C268,170 258,150 256,128" stroke="#5a3a22" stroke-width="9" stroke-linecap="round" fill="none"/>`
      + `<path d="M250,232 C262,200 280,176 300,160 C312,150 328,128 334,104" stroke="#7a5232" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>`
      + `<path d="M30,236 C26,210 44,192 70,196 C88,186 108,204 104,236 Z" fill="#8a8a84"/><path d="M40,210 C52,200 70,198 84,204" stroke="#a8a8a0" stroke-width="3" fill="none"/>`
      + `<path d="M96,238 C96,222 110,214 124,220 C134,218 140,228 138,238 Z" fill="#76766f"/>`
      + `<path d="M0,232 C80,226 160,236 240,230 C320,224 360,232 400,228 L400,260 L0,260 Z" fill="url(#sand-${uid})"/>`
      + pebbles
      + `<rect width="400" height="3" fill="#fff" opacity="0.5"/>`
      + `</svg>`;
  }

  const FishArt = { drawFish, drawPlant, drawTankBackground };
  if (typeof module !== 'undefined' && module.exports) module.exports = FishArt;
  else root.FishArt = FishArt;
})(this);
