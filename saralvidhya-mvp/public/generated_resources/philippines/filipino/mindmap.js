/**
 * Filipino (Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino) — Modyul 1 Mindmap
 * Senior High School Core Subject | Mga Konseptong Pangwika (Linggo 1–3)
 *
 * Self-contained interactive HTML/SVG Mindmap Engine & Dataset (`mindmap.js`).
 * - Renders balanced left/right branches, cubic Bezier edges, collapsible nodes,
 *   interactive pan/zoom, Fit-to-screen, search highlight, and rich node details.
 * - Auto-mounts to `<div id="mindmap"></div>` or can be imported/used programmatically.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.FilipinoModyul1Mindmap = api;
    root.MINDMAP_DATA = api.MINDMAP_DATA;
    root.MINDMAP_MERMAID = api.MINDMAP_MERMAID;
    root.renderMindmap = api.renderMindmap;
    root.generateStandaloneHTML = api.generateStandaloneHTML;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── 1. Mermaid Source (Matches mindmap.md) ─────────────────────────────────
  var MINDMAP_MERMAID = [
    'mindmap',
    '  root((Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino))',
    '    Aralin 1. Kahulugan at Katangian ng Wika',
    '      Etimolohiya at Kalikasan',
    '        Latin: lingua (dila / wika)',
    '        Pranses: langue',
    '        Kastila: lengua',
    '      Mga Pakahulugan ng Dalubwika',
    '        Henry Gleason: Masistemang balangkas ng sinasalitang tunog na pinili at isinaayos sa paraang arbitraryo',
    '        Edward Sapir: Likas at makataong pamamaraan ng paghahatid ng kaisipan',
    '        Archibald Hill: Pangunahin at pinakaelaboreyt na anyo ng gawaing pansagisag',
    '        Paz, Hernandez, at Peneyra: Tulay sa pagpapahayag ng nararamdaman at iniisip',
    '        Webster: Kalipunan ng mga salita at pamamaraan ng pagsasama-sama',
    '      Siyam na Katangian ng Wika',
    '        1. Masistemang Balangkas: Ponema -> Morpema -> Sintaksis -> Diskurso',
    '        2. Sinasalitang Tunog: Ginagamitan ng speech apparatus',
    '        3. Arbitraryo: Napagkasunduan ng komunidad',
    '        4. Nakabatay sa Kultura: Sinasalamin ang pamumuhay at paniniwala',
    '        5. Dinamiko at Nagbabago: Patuloy na yumayabong at sumasabay sa panahon',
    '        6. Ginagamit sa Komunikasyon: Nawawalan ng saysay kapag hindi ginagamit',
    '        7. Makapangyarihan: Nakapagpapakilos at nakapagdudulot ng kapayapaan o sigalot',
    '        8. Kagila-gilalas / Malikhain: Walang limitasyong pagbuo ng bagong pahayag',
    '        9. Politikal at may Gahum: Kasangkapan sa kapangyarihan at pamumuno',
    '    Aralin 2. Kasaysayan ng Wikang Pambansa',
    '      Kronolohikal na Yugto',
    '        Panahon ng Katutubo: Baybayin (17 titik)',
    '        Panahon ng Espanyol: Pagpapalaganap ng Kristiyanismo gamit ang katutubong wika',
    '        Panahon ng Rebolusyon: Tagalog sa Saligang Batas ng Biak-na-Bato (1897)',
    '        Panahon ng Amerikano: Ingles bilang wikang panturo; Batas Blg. 74; Komisyong Monroe (1925)',
    '        Panahon ng Komonwelt: Manuel L. Quezon (Ama ng Wikang Pambansa)',
    '        Panahon ng Hapon: Gintong Panahon ng Wikang Pambansa; Tagalog at Nihonggo',
    '        Panahon ng Pagsasarili hanggang Kasalukuyan: Pilipino (1959) patungong Filipino (1987)',
    '      Mahahalagang Batas at Kautusan',
    '        1935 Saligang Batas Art. XIV Sek. 3: Hakbang sa pagpapatibay ng wikang pambansa batay sa katutubong wika',
    '        Batas Komonwelt Blg. 184 (1936): Pagtatatag ng Surian ng Wikang Pambansa (SWP)',
    '        Kautusang Tagapagpaganap Blg. 134 (1937): Tagalog bilang batayan ng Wikang Pambansa',
    '        Kautusang Pangkagawaran Blg. 7 (1959): Pilipino ang opisyal na tawag (Jose E. Romero)',
    '        1987 Saligang Batas Art. XIV Sek. 6: Ang wikang pambansa ng Pilipinas ay Filipino',
    '        Batas Republika Blg. 7104 (1991): Pagtatatag ng Komisyon sa Wikang Filipino (KWF)',
    '      Pagsusuri sa Panayam ni Dr. Bienvenido Lumbera',
    '        Wika bilang sandata ng dekolonisasyon at pambansang kamalayan',
    '    Aralin 3. Baryasyon at Barayti ng Wika',
    '      Kalikasan ng Wika',
    '        Homogeneous: Iisang anyo at katangian ng wika (teoretikal)',
    '        Heterogeneous: Pagkakaiba-iba dulot ng heograpiya at sosyolohikal na salik',
    '      Linggwistikong Komunidad at Kaalaman',
    '        Linggwistikong Komunidad: Grupo ng taong may pinagsasaluhang pamantayan sa wika',
    '        Unang Wika (L1): Wikang kinagisnan at natutuhan mula pagsilang',
    '        Ikalawang Wika (L2): Anumang wikang natutuhan pagkatapos ng unang wika',
    '        Ikatlong Wika (L3): Wikang natutuhan dulot ng lumalawak na pakikisalamuha',
    '      Pitong Barayti ng Wika',
    '        Dayalek: Barayting batay sa heograpikal na dimensiyon',
    '        Idyolek: Indibidwal na estilo at tatak sa pagsasalita (e.g., Mike Enriquez)',
    '        Sosyolek: Barayting panlipunan (e.g., Jejemon, Gay Lingo/Swardspeak, Conyo)',
    '        Etnolek: Wika ng mga etnolinggwistikong grupo (e.g., Vakuul, Palangga)',
    '        Ekolek: Wikang karaniwang naririnig at ginagamit sa loob ng tahanan',
    '        Pidgin: Nobody\'s native language; makeshift language ng dalawang nagtatagpong grupo',
    '        Creole: Pidgin na naging likas na wika ng isang komunidad (e.g., Chavacano)',
    '      Register ng Wika at Tatlong Dimensiyon',
    '        Field of Discourse: Larangan o paksang pinag-uusapan',
    '        Tenor of Discourse: Relasyon ng mga nag-uusap (pormalidad at kapangyarihan)',
    '        Mode of Discourse: Paraan o tsanel ng komunikasyon (pasulat vs. pasalita)',
    '        Antas ng Register: Static, Formal, Consultative, Casual, Intimate',
    '    Aralin 4. Mga Isyu at Sitwasyong Pangwika',
    '      Tatlong Konseptwal na Kategorya',
    '        Wikang Pambansa: Pambansang pagkakakilanlan (Filipino - Art. XIV, Sek. 6)',
    '        Wikang Opisyal: Wika sa opisyal na komunikasyon ng gobyerno (Filipino at Ingles - Art. XIV, Sek. 7)',
    '        Wikang Panturo: Opisyal na wikang ginagamit sa pagtuturo at pagkatuto',
    '      Pangwikang Sistema sa Edukasyon',
    '        Monolingguwalismo: Iisang wika sa lahat ng larangan',
    '        Bilingguwalismo: Paggamit ng dalawang wika (BEP 1974: Ingles sa Agham/Math; Pilipino sa Social Studies)',
    '        Multilingguwalismo: Paggamit ng tatlo o higit pang wika (MTB-MLE sa ilalim ng RA 10533 K-12)',
    '      Mga Isyu at Pakikibaka sa Lipunang Pilipino',
    '        Gahum ng Ingles: Neokolonyalismo at pagsusuri sa "Speak in English Zone" (Joel Malabanan)',
    '        CMO Blg. 20 Serye 2013: Pagtanggal ng Filipino at Panitikan sa General Education Curriculum',
    '        Tanggol Wika: Alyansa ng mga Tagapagtanggol ng Wikang Filipino (Dr. David San Juan)',
    '        Intelektwalisasyon ng Wika: Pagpapalawak ng Filipino sa siyensya, batas, at akademya'
  ].join('\n');

  // ─── 2. Hierarchical Mindmap Data ──────────────────────────────────────────
  var MINDMAP_DATA = {
    id: 'root',
    label: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
    summary:
      'Modyul 1: Mga Konseptong Pangwika (Linggo 1–3). Saklaw ang Kahulugan at Katangian ng Wika, Kasaysayan at Pag-unlad ng Wikang Pambansa, Baryasyon at Pitong Barayti ng Wika, at mga Isyung Pangwika sa Lipunang Pilipino.',
    children: [
      {
        id: 'topic_1',
        label: 'Aralin 1. Kahulugan at Katangian ng Wika',
        summary: 'Pundasyon, etimolohiya, pakahulugan ng mga dalubwika (Gleason, Sapir, Hill), at siyam na pangunahing katangian ng wika.',
        children: [
          {
            id: 'sub_1_1',
            label: 'Etimolohiya at Kalikasan',
            summary: 'Nagmula sa Latin na lingua (dila), kaugnay ng langue sa Pranses at lengua sa Kastila.',
            children: [
              { id: 'c_1_1_1', label: 'Latin: lingua (dila / wika)' },
              { id: 'c_1_1_2', label: 'Pranses: langue' },
              { id: 'c_1_1_3', label: 'Kastila: lengua' }
            ]
          },
          {
            id: 'sub_1_2',
            label: 'Mga Pakahulugan ng Dalubwika',
            summary: 'Mga klasikong depinisyon mula kina Henry Gleason, Edward Sapir, Archibald Hill, Paz et al., at Webster.',
            children: [
              { id: 'c_1_2_1', label: 'Henry Gleason: Masistemang balangkas ng sinasalitang tunog na pinili at isinaayos sa paraang arbitraryo' },
              { id: 'c_1_2_2', label: 'Edward Sapir: Likas at makataong pamamaraan ng paghahatid ng kaisipan' },
              { id: 'c_1_2_3', label: 'Archibald Hill: Pangunahin at pinakaelaboreyt na anyo ng gawaing pansagisag' },
              { id: 'c_1_2_4', label: 'Paz, Hernandez, at Peneyra: Tulay sa pagpapahayag ng nararamdaman at iniisip' },
              { id: 'c_1_2_5', label: 'Webster: Kalipunan ng mga salita at pamamaraan ng pagsasama-sama' }
            ]
          },
          {
            id: 'sub_1_3',
            label: 'Siyam na Katangian ng Wika',
            summary: 'Mga likas na katangian ng wika ayon sa pag-aaral nina Gleason at mga dalubwika.',
            children: [
              { id: 'c_1_3_1', label: '1. Masistemang Balangkas: Ponema -> Morpema -> Sintaksis -> Diskurso' },
              { id: 'c_1_3_2', label: '2. Sinasalitang Tunog: Ginagamitan ng speech apparatus' },
              { id: 'c_1_3_3', label: '3. Arbitraryo: Napagkasunduan ng komunidad' },
              { id: 'c_1_3_4', label: '4. Nakabatay sa Kultura: Sinasalamin ang pamumuhay at paniniwala' },
              { id: 'c_1_3_5', label: '5. Dinamiko at Nagbabago: Patuloy na yumayabong at sumasabay sa panahon' },
              { id: 'c_1_3_6', label: '6. Ginagamit sa Komunikasyon: Nawawalan ng saysay kapag hindi ginagamit' },
              { id: 'c_1_3_7', label: '7. Makapangyarihan: Nakapagpapakilos at nakapagdudulot ng kapayapaan o sigalot' },
              { id: 'c_1_3_8', label: '8. Kagila-gilalas / Malikhain: Walang limitasyong pagbuo ng bagong pahayag' },
              { id: 'c_1_3_9', label: '9. Politikal at may Gahum: Kasangkapan sa kapangyarihan at pamumuno' }
            ]
          }
        ]
      },
      {
        id: 'topic_2',
        label: 'Aralin 2. Kasaysayan ng Wikang Pambansa',
        summary: 'Ebolusyon mula panahon ng katutubo (Baybayin), pananakop, Komonwelt, hanggang sa 1987 Saligang Batas.',
        children: [
          {
            id: 'sub_2_1',
            label: 'Kronolohikal na Yugto',
            summary: 'Kasaysayan ng pakikibaka at pag-unlad ng Wikang Pambansa.',
            children: [
              { id: 'c_2_1_1', label: 'Panahon ng Katutubo: Baybayin (17 titik)' },
              { id: 'c_2_1_2', label: 'Panahon ng Espanyol: Pagpapalaganap ng Kristiyanismo gamit ang katutubong wika' },
              { id: 'c_2_1_3', label: 'Panahon ng Rebolusyon: Tagalog sa Saligang Batas ng Biak-na-Bato (1897)' },
              { id: 'c_2_1_4', label: 'Panahon ng Amerikano: Ingles bilang wikang panturo; Batas Blg. 74; Komisyong Monroe (1925)' },
              { id: 'c_2_1_5', label: 'Panahon ng Komonwelt: Manuel L. Quezon (Ama ng Wikang Pambansa)' },
              { id: 'c_2_1_6', label: 'Panahon ng Hapon: Gintong Panahon ng Wikang Pambansa; Tagalog at Nihonggo' },
              { id: 'c_2_1_7', label: 'Panahon ng Pagsasarili hanggang Kasalukuyan: Pilipino (1959) patungong Filipino (1987)' }
            ]
          },
          {
            id: 'sub_2_2',
            label: 'Mahahalagang Batas at Kautusan',
            summary: 'Legal na batayan ng pagpili, pagpapatupad, at pagpapalaganap ng Wikang Pambansa.',
            children: [
              { id: 'c_2_2_1', label: '1935 Saligang Batas Art. XIV Sek. 3: Hakbang sa pagpapatibay ng wikang pambansa batay sa katutubong wika' },
              { id: 'c_2_2_2', label: 'Batas Komonwelt Blg. 184 (1936): Pagtatatag ng Surian ng Wikang Pambansa (SWP)' },
              { id: 'c_2_2_3', label: 'Kautusang Tagapagpaganap Blg. 134 (1937): Tagalog bilang batayan ng Wikang Pambansa' },
              { id: 'c_2_2_4', label: 'Kautusang Pangkagawaran Blg. 7 (1959): Pilipino ang opisyal na tawag (Jose E. Romero)' },
              { id: 'c_2_2_5', label: '1987 Saligang Batas Art. XIV Sek. 6: Ang wikang pambansa ng Pilipinas ay Filipino' },
              { id: 'c_2_2_6', label: 'Batas Republika Blg. 7104 (1991): Pagtatatag ng Komisyon sa Wikang Filipino (KWF)' }
            ]
          },
          {
            id: 'sub_2_3',
            label: 'Pagsusuri sa Panayam ni Dr. Lumbera',
            summary: 'Pambansang Alagad ng Sining: Wika bilang sandata ng dekolonisasyon at paghubog ng pambansang kamalayan.',
            children: [
              { id: 'c_2_3_1', label: 'Wika bilang sandata ng dekolonisasyon at pambansang kamalayan' }
            ]
          }
        ]
      },
      {
        id: 'topic_3',
        label: 'Aralin 3. Baryasyon at Barayti ng Wika',
        summary: 'Homogeneous vs. Heterogeneous, Linggwistikong Komunidad, Unang Wika (L1/L2), at pitong barayti ng wika.',
        children: [
          {
            id: 'sub_3_1',
            label: 'Kalikasan ng Wika',
            summary: 'Homogeneous (iisang katangian) vs. Heterogeneous (iba-iba dulot ng heograpiya at lipunan).',
            children: [
              { id: 'c_3_1_1', label: 'Homogeneous: Iisang anyo at katangian ng wika (teoretikal)' },
              { id: 'c_3_1_2', label: 'Heterogeneous: Pagkakaiba-iba dulot ng heograpiya at sosyolohikal na salik' }
            ]
          },
          {
            id: 'sub_3_2',
            label: 'Linggwistikong Komunidad at Kaalaman',
            summary: 'Speech community, unang wika (inang wika), ikalawang wika, at ikatlong wika.',
            children: [
              { id: 'c_3_2_1', label: 'Linggwistikong Komunidad: Grupo ng taong may pinagsasaluhang pamantayan sa wika' },
              { id: 'c_3_2_2', label: 'Unang Wika (L1): Wikang kinagisnan at natutuhan mula pagsilang' },
              { id: 'c_3_2_3', label: 'Ikalawang Wika (L2): Anumang wikang natutuhan pagkatapos ng unang wika' },
              { id: 'c_3_2_4', label: 'Ikatlong Wika (L3): Wikang natutuhan dulot ng lumalawak na pakikisalamuha' }
            ]
          },
          {
            id: 'sub_3_3',
            label: 'Pitong Barayti ng Wika',
            summary: 'Mga anyo ng wika batay sa lugar, indibidwal, grupo, etnisidad, tahanan, at kontak-wika.',
            children: [
              { id: 'c_3_3_1', label: 'Dayalek: Barayting batay sa heograpikal na dimensiyon' },
              { id: 'c_3_3_2', label: 'Idyolek: Indibidwal na estilo at tatak sa pagsasalita (e.g., Mike Enriquez)' },
              { id: 'c_3_3_3', label: 'Sosyolek: Barayting panlipunan (e.g., Jejemon, Gay Lingo/Swardspeak, Conyo)' },
              { id: 'c_3_3_4', label: 'Etnolek: Wika ng mga etnolinggwistikong grupo (e.g., Vakuul, Palangga)' },
              { id: 'c_3_3_5', label: 'Ekolek: Wikang karaniwang naririnig at ginagamit sa loob ng tahanan' },
              { id: 'c_3_3_6', label: 'Pidgin: Nobody\'s native language; makeshift language ng dalawang nagtatagpong grupo' },
              { id: 'c_3_3_7', label: 'Creole: Pidgin na naging likas na wika ng isang komunidad (e.g., Chavacano)' }
            ]
          },
          {
            id: 'sub_3_4',
            label: 'Register ng Wika at Tatlong Dimensiyon',
            summary: 'Paggamit ng wika ayon sa larangan, relasyon, at paraan ng komunikasyon.',
            children: [
              { id: 'c_3_4_1', label: 'Field of Discourse: Larangan o paksang pinag-uusapan' },
              { id: 'c_3_4_2', label: 'Tenor of Discourse: Relasyon ng mga nag-uusap (pormalidad at kapangyarihan)' },
              { id: 'c_3_4_3', label: 'Mode of Discourse: Paraan o tsanel ng komunikasyon (pasulat vs. pasalita)' },
              { id: 'c_3_4_4', label: 'Antas ng Register: Static, Formal, Consultative, Casual, Intimate' }
            ]
          }
        ]
      },
      {
        id: 'topic_4',
        label: 'Aralin 4. Mga Isyu at Sitwasyong Pangwika',
        summary: 'Pambansa vs. Opisyal vs. Panturo, Bilingguwalismo, Multilingguwalismo (MTB-MLE), Gahum ng Ingles, at Tanggol Wika.',
        children: [
          {
            id: 'sub_4_1',
            label: 'Tatlong Konseptwal na Kategorya',
            summary: 'Pagkakaiba ng Wikang Pambansa, Wikang Opisyal, at Wikang Panturo ayon sa Saligang Batas.',
            children: [
              { id: 'c_4_1_1', label: 'Wikang Pambansa: Pambansang pagkakakilanlan (Filipino - Art. XIV, Sek. 6)' },
              { id: 'c_4_1_2', label: 'Wikang Opisyal: Wika sa opisyal na komunikasyon ng gobyerno (Filipino at Ingles - Art. XIV, Sek. 7)' },
              { id: 'c_4_1_3', label: 'Wikang Panturo: Opisyal na wikang ginagamit sa pagtuturo at pagkatuto' }
            ]
          },
          {
            id: 'sub_4_2',
            label: 'Pangwikang Sistema sa Edukasyon',
            summary: 'Patakarang Monolingguwal, Bilingguwalismo (1974 BEP), at Multilingguwalismo (RA 10533 MTB-MLE).',
            children: [
              { id: 'c_4_2_1', label: 'Monolingguwalismo: Iisang wika sa lahat ng larangan' },
              { id: 'c_4_2_2', label: 'Bilingguwalismo: Paggamit ng dalawang wika (BEP 1974: Ingles sa Agham/Math; Pilipino sa Social Studies)' },
              { id: 'c_4_2_3', label: 'Multilingguwalismo: Paggamit ng tatlo o higit pang wika (MTB-MLE sa ilalim ng RA 10533 K-12)' }
            ]
          },
          {
            id: 'sub_4_3',
            label: 'Mga Isyu at Pakikibaka sa Lipunang Pilipino',
            summary: 'Neokolonyalismo, awit na "Speak in English Zone", CMO Blg. 20 s. 2013, at adbokasiya ng Tanggol Wika.',
            children: [
              { id: 'c_4_3_1', label: 'Gahum ng Ingles: Neokolonyalismo at pagsusuri sa "Speak in English Zone" (Joel Malabanan)' },
              { id: 'c_4_3_2', label: 'CMO Blg. 20 Serye 2013: Pagtanggal ng Filipino at Panitikan sa General Education Curriculum' },
              { id: 'c_4_3_3', label: 'Tanggol Wika: Alyansa ng mga Tagapagtanggol ng Wikang Filipino (Dr. David San Juan)' },
              { id: 'c_4_3_4', label: 'Intelektwalisasyon ng Wika: Pagpapalawak ng Filipino sa siyensya, batas, at akademya' }
            ]
          }
        ]
      }
    ]
  };

  // ─── 3. Layout & Palette Constants ─────────────────────────────────────────
  var LEVEL_0_BG = '#25352C';
  var LEVEL_1_BG = '#375545';
  var LEVEL_2_BG = '#527964';
  var LEVEL_3_BG = '#6E957E';
  var H_GAP = 140;
  var V_GAP = 22;
  var MIN_Z = 0.2;
  var MAX_Z = 2.8;
  var FONT = "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  var _measureCtx = null;
  function measureText(text, font) {
    if (typeof document !== 'undefined') {
      if (!_measureCtx) {
        var c = document.createElement('canvas');
        _measureCtx = c.getContext('2d');
      }
      if (_measureCtx) {
        _measureCtx.font = font;
        return _measureCtx.measureText(text).width;
      }
    }
    return text.length * 7.2;
  }

  function styleForDepth(depth) {
    if (depth === 0) return { font: '700 14px ' + FONT, px: 22, py: 14, lineH: 19, maxW: 260, bg: LEVEL_0_BG };
    if (depth === 1) return { font: '700 13px ' + FONT, px: 16, py: 11, lineH: 17, maxW: 240, bg: LEVEL_1_BG };
    if (depth === 2) return { font: '600 12px ' + FONT, px: 14, py: 9, lineH: 16, maxW: 220, bg: LEVEL_2_BG };
    return { font: '500 11.5px ' + FONT, px: 12, py: 7, lineH: 15, maxW: 240, bg: LEVEL_3_BG };
  }

  function wrapLines(label, font, maxW) {
    var words = String(label || '').split(/\s+/);
    var lines = [];
    var cur = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var candidate = cur ? cur + ' ' + w : w;
      if (cur && measureText(candidate, font) > maxW) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  function subtreeWeight(node, collapsedSet) {
    if (collapsedSet.has(node.id) || !node.children || !node.children.length) return 1;
    var total = 1;
    for (var i = 0; i < node.children.length; i++) {
      total += subtreeWeight(node.children[i], collapsedSet);
    }
    return total;
  }

  function computeMindmapLayout(rootNode, collapsedSet) {
    var map = {};
    var kidsOf = {};

    var rWeight = 0;
    var lWeight = 0;
    var sideOf = {};
    var topChildren = rootNode.children || [];
    for (var i = 0; i < topChildren.length; i++) {
      var ch = topChildren[i];
      var side = rWeight <= lWeight ? 'r' : 'l';
      sideOf[ch.id] = side;
      var w = subtreeWeight(ch, collapsedSet);
      if (side === 'r') rWeight += w;
      else lWeight += w;
    }

    function walk(n, parentId, depth, side) {
      if (depth === 1) side = sideOf[n.id] || 'r';
      var st = styleForDepth(depth);
      var lines = wrapLines(n.label, st.font, st.maxW);
      var maxLineW = 0;
      for (var i = 0; i < lines.length; i++) {
        var lw = measureText(lines[i], st.font);
        if (lw > maxLineW) maxLineW = lw;
      }
      var w = Math.max(depth === 0 ? 230 : depth === 1 ? 210 : 170, Math.ceil(maxLineW) + st.px * 2);
      var h = Math.ceil(lines.length * st.lineH) + st.py * 2;
      var kids = n.children || [];
      var isCollapsed = collapsedSet.has(n.id);

      var lnode = {
        id: n.id,
        label: n.label,
        summary: n.summary || '',
        lines: lines,
        depth: depth,
        side: side,
        bg: st.bg,
        font: st.font,
        lineH: st.lineH,
        px: st.px,
        py: st.py,
        w: w,
        h: h,
        x: 0,
        y: 0,
        sub: 0,
        parentId: parentId,
        hasKids: kids.length > 0,
        collapsed: isCollapsed,
        kidCount: kids.length
      };
      map[n.id] = lnode;

      var childLayoutNodes = [];
      if (!isCollapsed) {
        for (var j = 0; j < kids.length; j++) {
          walk(kids[j], n.id, depth + 1, side);
          childLayoutNodes.push(map[kids[j].id]);
        }
      }
      kidsOf[n.id] = childLayoutNodes;
    }

    walk(rootNode, null, 0, 'r');

    function sumHeight(list) {
      if (!list || !list.length) return 0;
      var s = 0;
      for (var i = 0; i < list.length; i++) s += list[i].sub;
      return s + V_GAP * Math.max(0, list.length - 1);
    }

    function computeSub(ln) {
      var ks = kidsOf[ln.id] || [];
      for (var i = 0; i < ks.length; i++) computeSub(ks[i]);
      ln.sub = Math.max(ln.h, sumHeight(ks));
      return ln.sub;
    }

    function place(ln, edgeX, centerY, side) {
      ln.x = side === 'r' ? edgeX : edgeX - ln.w;
      ln.y = centerY - ln.h / 2;
      var ks = kidsOf[ln.id] || [];
      var y = centerY - sumHeight(ks) / 2;
      for (var i = 0; i < ks.length; i++) {
        var k = ks[i];
        var nextEdge = side === 'r' ? ln.x + ln.w + H_GAP : ln.x - H_GAP;
        place(k, nextEdge, y + k.sub / 2, side);
        y += k.sub + V_GAP;
      }
    }

    var rootLayout = map[rootNode.id];
    rootLayout.x = -rootLayout.w / 2;
    rootLayout.y = -rootLayout.h / 2;

    var sides = ['r', 'l'];
    for (var sIdx = 0; sIdx < sides.length; sIdx++) {
      var sideKey = sides[sIdx];
      var branchKids = (kidsOf[rootNode.id] || []).filter(function (k) {
        return k.side === sideKey;
      });
      for (var i = 0; i < branchKids.length; i++) computeSub(branchKids[i]);
      var startY = -sumHeight(branchKids) / 2;
      for (var j = 0; j < branchKids.length; j++) {
        var bk = branchKids[j];
        var startEdge = sideKey === 'r' ? rootLayout.x + rootLayout.w + H_GAP : rootLayout.x - H_GAP;
        place(bk, startEdge, startY + bk.sub / 2, sideKey);
        startY += bk.sub + V_GAP;
      }
    }

    var nodes = Object.keys(map).map(function (k) {
      return map[k];
    });
    var edges = [];
    for (var nIdx = 0; nIdx < nodes.length; nIdx++) {
      var m = nodes[nIdx];
      if (!m.parentId) continue;
      var p = map[m.parentId];
      var isRight = m.side === 'r';
      var x1 = isRight ? p.x + p.w : p.x;
      var dy = m.y + m.h / 2 - (p.y + p.h / 2);
      var y1 = p.y + p.h / 2 + Math.max(-14, Math.min(14, dy * 0.08));
      var x2 = isRight ? m.x : m.x + m.w;
      var y2 = m.y + m.h / 2;
      var mx = (x1 + x2) / 2;
      edges.push({
        id: p.id + '__' + m.id,
        fromId: p.id,
        toId: m.id,
        color: m.depth === 1 ? '#5E786A' : '#8FA196',
        sw: m.depth === 1 ? 2 : 1.5,
        d: 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2
      });
    }

    return { nodes: nodes, edges: edges, map: map };
  }

  // ─── 4. Interactive HTML/DOM Mindmap Renderer ──────────────────────────────
  function renderMindmap(target, options) {
    options = options || {};
    var container =
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) {
      throw new Error('renderMindmap: target container not found.');
    }

    var data = options.data || MINDMAP_DATA;
    var collapsed = new Set(options.initialCollapsed || []);
    var view = { x: 0, y: 0, k: 0.72 };
    var selectedNodeId = null;
    var searchQuery = '';

    container.innerHTML = '';
    container.style.cssText =
      'position:relative;width:100%;height:' +
      (options.height || '100%') +
      ';min-height:620px;background:#F3EFE6;border:1px solid #E4DFD3;border-radius:16px;overflow:hidden;font-family:' +
      FONT +
      ';display:flex;flex-direction:column;box-sizing:border-box;user-select:none;';

    // Header bar
    var header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 18px;background:#FFFFFF;border-bottom:1px solid #E4DFD3;z-index:20;';
    header.innerHTML = [
      '<div style="display:flex;align-items:center;gap:10px;">',
      '  <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#25352C;color:#fff;font-weight:700;font-size:14px;">FIL</span>',
      '  <div>',
      '    <div style="font-size:14px;font-weight:700;color:#1E2822;">Filipino — Modyul 1 Mindmap</div>',
      '    <div style="font-size:11.5px;color:#5A655E;">Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino (Senior High School)</div>',
      '  </div>',
      '</div>',
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">',
      '  <input type="search" data-mm-search placeholder="Maghanap ng konsepto..." style="padding:6px 12px;border:1px solid #D5CEC2;border-radius:8px;font-size:12px;outline:none;width:190px;background:#FAF8F5;color:#1E2822;" />',
      '  <button type="button" data-mm-expand style="padding:6px 10px;border:1px solid #E4DFD3;border-radius:8px;background:#fff;color:#375545;font-size:12px;font-weight:600;cursor:pointer;">Ipakita Lahat</button>',
      '  <button type="button" data-mm-collapse style="padding:6px 10px;border:1px solid #E4DFD3;border-radius:8px;background:#fff;color:#375545;font-size:12px;font-weight:600;cursor:pointer;">Tiklopin ang Paksa</button>',
      '  <div style="display:inline-flex;align-items:center;background:#FAF8F5;border:1px solid #E4DFD3;border-radius:8px;padding:2px;">',
      '    <button type="button" data-mm-zoom-out style="width:28px;height:26px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:700;color:#375545;">−</button>',
      '    <button type="button" data-mm-fit style="padding:0 10px;height:26px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:700;color:#1E2822;">100% · Fit</button>',
      '    <button type="button" data-mm-zoom-in style="width:28px;height:26px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:700;color:#375545;">+</button>',
      '  </div>',
      '</div>'
    ].join('\n');
    container.appendChild(header);

    // Viewport canvas
    var viewport = document.createElement('div');
    viewport.style.cssText =
      'position:relative;flex:1;width:100%;height:100%;overflow:hidden;cursor:grab;touch-action:none;background-image:radial-gradient(circle, #DED8CA 1.1px, transparent 1.1px);background-size:24px 24px;';
    container.appendChild(viewport);

    var stage = document.createElement('div');
    stage.style.cssText =
      'position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;';
    viewport.appendChild(stage);

    var svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttribute('width', '1');
    svgLayer.setAttribute('height', '1');
    svgLayer.style.cssText =
      'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;';
    stage.appendChild(svgLayer);

    var nodesLayer = document.createElement('div');
    nodesLayer.style.cssText = 'position:absolute;left:0;top:0;';
    stage.appendChild(nodesLayer);

    var detailCard = document.createElement('div');
    detailCard.style.cssText =
      'position:absolute;bottom:16px;right:16px;max-width:340px;background:#FFFFFF;border:1px solid #E4DFD3;border-radius:12px;padding:14px 16px;box-shadow:0 8px 24px rgba(30,40,34,0.12);z-index:15;display:none;font-size:12.5px;color:#1E2822;';
    viewport.appendChild(detailCard);

    var legend = document.createElement('div');
    legend.style.cssText =
      'position:absolute;bottom:16px;left:16px;background:#FFFFFF;border:1px solid #E4DFD3;border-radius:999px;padding:6px 14px;display:inline-flex;align-items:center;gap:8px;font-size:11.5px;color:#5A655E;box-shadow:0 2px 6px rgba(0,0,0,0.04);pointer-events:none;z-index:10;';
    legend.innerHTML =
      '<span>I-drag para mag-pan</span><span>·</span><span>Ctrl + Scroll para mag-zoom</span><span>·</span><span>I-click ang node para masuri</span>';
    viewport.appendChild(legend);

    var currentLayout = null;
    var fitBtn = header.querySelector('[data-mm-fit]');

    function applyTransform() {
      stage.style.transform =
        'translate3d(' + view.x + 'px,' + view.y + 'px,0) scale(' + view.k + ')';
      if (fitBtn) {
        fitBtn.textContent = Math.round(view.k * 100) + '% · Fit';
      }
    }

    function fitToScreen() {
      if (!currentLayout || !currentLayout.nodes.length) return;
      var rect = viewport.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (var i = 0; i < currentLayout.nodes.length; i++) {
        var n = currentLayout.nodes[i];
        x0 = Math.min(x0, n.x - 24);
        y0 = Math.min(y0, n.y - 16);
        x1 = Math.max(x1, n.x + n.w + 24);
        y1 = Math.max(y1, n.y + n.h + 16);
      }
      var padX = 48;
      var padY = 48;
      var k = Math.max(
        MIN_Z,
        Math.min(
          1,
          (rect.width - padX * 2) / Math.max(1, x1 - x0),
          (rect.height - padY * 2) / Math.max(1, y1 - y0)
        )
      );
      view.k = k;
      view.x = rect.width / 2 - ((x0 + x1) / 2) * k;
      view.y = rect.height / 2 - ((y0 + y1) / 2) * k;
      applyTransform();
    }

    function zoomBy(factor, cx, cy) {
      var rect = viewport.getBoundingClientRect();
      var px = cx !== undefined ? cx : rect.width / 2;
      var py = cy !== undefined ? cy : rect.height / 2;
      var nextK = Math.min(MAX_Z, Math.max(MIN_Z, view.k * factor));
      var scaleRatio = nextK / view.k;
      view.x = px - (px - view.x) * scaleRatio;
      view.y = py - (py - view.y) * scaleRatio;
      view.k = nextK;
      applyTransform();
    }

    function updateDetailCard(lnode) {
      if (!lnode) {
        detailCard.style.display = 'none';
        return;
      }
      detailCard.style.display = 'block';
      var parentNode = lnode.parentId && currentLayout ? currentLayout.map[lnode.parentId] : null;
      detailCard.innerHTML = [
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">',
        '  <div style="font-weight:700;font-size:13px;color:#25352C;line-height:1.35;">' + lnode.label + '</div>',
        '  <button type="button" data-mm-close-detail style="border:none;background:transparent;cursor:pointer;color:#5A655E;font-size:14px;line-height:1;padding:0 2px;">✕</button>',
        '</div>',
        parentNode
          ? '<div style="font-size:11px;color:#6E957E;font-weight:600;margin-bottom:6px;">Kategorya: ' + parentNode.label + '</div>'
          : '',
        lnode.summary
          ? '<div style="font-size:12px;color:#45584E;line-height:1.45;margin-bottom:6px;">' + lnode.summary + '</div>'
          : '',
        '<div style="font-size:11px;color:#7A867E;">Antas ' +
          lnode.depth +
          (lnode.hasKids ? ' · ' + lnode.kidCount + ' sub-konsepto' : ' · Pangunahing Konsepto') +
          '</div>'
      ].join('');
      var closeBtn = detailCard.querySelector('[data-mm-close-detail]');
      if (closeBtn) {
        closeBtn.onclick = function () {
          selectedNodeId = null;
          detailCard.style.display = 'none';
          draw();
        };
      }
    }

    function draw() {
      currentLayout = computeMindmapLayout(data, collapsed);
      svgLayer.innerHTML = '';
      nodesLayer.innerHTML = '';

      for (var i = 0; i < currentLayout.edges.length; i++) {
        var e = currentLayout.edges[i];
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', e.d);
        path.setAttribute('stroke', e.color);
        path.setAttribute('stroke-width', String(e.sw));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('opacity', '0.9');
        svgLayer.appendChild(path);
      }

      var q = searchQuery.trim().toLowerCase();

      for (var j = 0; j < currentLayout.nodes.length; j++) {
        (function (m) {
          var isRoot = m.depth === 0;
          var isSelected = selectedNodeId === m.id;
          var isMatch = q && m.label.toLowerCase().indexOf(q) !== -1;

          var el = document.createElement('div');
          el.setAttribute('data-node-id', m.id);
          el.style.cssText = [
            'position:absolute',
            'left:' + m.x + 'px',
            'top:' + m.y + 'px',
            'width:' + m.w + 'px',
            'height:' + m.h + 'px',
            'box-sizing:border-box',
            'display:flex',
            'align-items:center',
            'justify-content:' + (isRoot ? 'center' : 'flex-start'),
            'font:' + m.font,
            'line-height:' + m.lineH + 'px',
            'background:' + (isMatch ? '#BD7D52' : m.bg),
            'color:#FFFFFF',
            'border-radius:' + (isRoot ? '12px' : m.depth === 1 ? '11px' : '9px'),
            'padding:0 ' + m.px + 'px',
            'cursor:pointer',
            'border:' + (isSelected || isMatch ? '2px solid #FFE0B2' : '1.5px solid rgba(255,255,255,0.14)'),
            'box-shadow:' +
              (isSelected
                ? '0 8px 22px rgba(37,53,44,0.34)'
                : isRoot
                ? '0 6px 18px rgba(37,53,44,0.26)'
                : '0 3px 10px rgba(37,53,44,0.14)'),
            'transition:box-shadow 0.18s ease, transform 0.18s ease, filter 0.18s ease'
          ].join(';');

          var textSpan = document.createElement('span');
          textSpan.style.cssText =
            'white-space:pre-wrap;word-break:break-word;width:100%;text-align:' +
            (isRoot ? 'center' : 'left') +
            ';user-select:none;';
          textSpan.textContent = m.lines.join('\n');
          el.appendChild(textSpan);

          el.onmouseenter = function () {
            el.style.filter = 'brightness(1.08)';
          };
          el.onmouseleave = function () {
            el.style.filter = 'none';
          };

          el.onclick = function (ev) {
            ev.stopPropagation();
            if (panState && panState.moved) return;
            selectedNodeId = m.id;
            updateDetailCard(m);
            if (typeof options.onNodeClick === 'function') {
              options.onNodeClick(m);
            }
            draw();
          };

          if (!isRoot && m.hasKids) {
            var toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            var onRight = m.side === 'r';
            toggleBtn.title = m.collapsed ? 'Ipakita (' + m.kidCount + ')' : 'Tiklopin';
            toggleBtn.style.cssText = [
              'position:absolute',
              'top:50%',
              'transform:translateY(-50%)',
              (onRight ? 'right' : 'left') + ':-21px',
              'width:19px',
              'height:19px',
              'border-radius:50%',
              'border:1px solid #CFC3BA',
              'background:#FFFFFF',
              'color:#375545',
              'font-size:10px',
              'font-weight:700',
              'line-height:1',
              'cursor:pointer',
              'padding:0',
              'display:flex',
              'align-items:center',
              'justify-content:center',
              'box-shadow:0 1px 3px rgba(0,0,0,0.15)',
              'z-index:5'
            ].join(';');
            toggleBtn.textContent = m.collapsed ? String(m.kidCount) : '−';
            toggleBtn.onclick = function (ev) {
              ev.stopPropagation();
              if (collapsed.has(m.id)) collapsed.delete(m.id);
              else collapsed.add(m.id);
              draw();
            };
            el.appendChild(toggleBtn);
          }

          nodesLayer.appendChild(el);
        })(currentLayout.nodes[j]);
      }

      applyTransform();
    }

    var panState = null;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('[data-node-id]') || e.target.closest('button')) return;
      panState = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
      viewport.style.cursor = 'grabbing';
      if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!panState) return;
      if (Math.hypot(e.clientX - panState.sx, e.clientY - panState.sy) > 4) {
        panState.moved = true;
      }
      if (panState.moved) {
        view.x = panState.vx + (e.clientX - panState.sx);
        view.y = panState.vy + (e.clientY - panState.sy);
        applyTransform();
      }
    });
    function endPan() {
      panState = null;
      viewport.style.cursor = 'grab';
    }
    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);

    viewport.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault();
        var rect = viewport.getBoundingClientRect();
        if (e.ctrlKey || e.metaKey) {
          zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top);
        } else {
          view.x -= e.deltaX;
          view.y -= e.deltaY;
          applyTransform();
        }
      },
      { passive: false }
    );

    var zoomInBtn = header.querySelector('[data-mm-zoom-in]');
    var zoomOutBtn = header.querySelector('[data-mm-zoom-out]');
    var expandBtn = header.querySelector('[data-mm-expand]');
    var collapseBtn = header.querySelector('[data-mm-collapse]');
    var searchInput = header.querySelector('[data-mm-search]');

    if (zoomInBtn) zoomInBtn.onclick = function () { zoomBy(1.25); };
    if (zoomOutBtn) zoomOutBtn.onclick = function () { zoomBy(1 / 1.25); };
    if (fitBtn) fitBtn.onclick = function () { fitToScreen(); };
    if (expandBtn) {
      expandBtn.onclick = function () {
        collapsed.clear();
        draw();
        fitToScreen();
      };
    }
    if (collapseBtn) {
      collapseBtn.onclick = function () {
        collapsed.clear();
        function collapseDepth2(n, d) {
          if (d >= 2 && n.children && n.children.length) collapsed.add(n.id);
          (n.children || []).forEach(function (c) { collapseDepth2(c, d + 1); });
        }
        collapseDepth2(data, 0);
        draw();
        fitToScreen();
      };
    }
    if (searchInput) {
      searchInput.oninput = function (e) {
        searchQuery = e.target.value || '';
        if (searchQuery.trim()) {
          collapsed.clear();
        }
        draw();
      };
    }

    draw();
    setTimeout(fitToScreen, 30);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', fitToScreen);
    }

    return {
      fit: fitToScreen,
      zoomBy: zoomBy,
      expandAll: function () {
        collapsed.clear();
        draw();
        fitToScreen();
      },
      getData: function () {
        return data;
      }
    };
  }

  // ─── 5. Standalone HTML Generator ───────────────────────────────────────────
  function generateStandaloneHTML() {
    return [
      '<!DOCTYPE html>',
      '<html lang="tl">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Filipino Modyul 1 — Interaktibong Mindmap</title>',
      '  <style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #F3EFE6; } #mindmap { width: 100vw; height: 100vh; border: none; border-radius: 0; }</style>',
      '</head>',
      '<body>',
      '  <div id="mindmap"></div>',
      '  <script src="./mindmap.js"></script>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  if (typeof document !== 'undefined') {
    var autoMount = function () {
      var target =
        document.getElementById('mindmap') ||
        document.getElementById('mindmap-container') ||
        document.querySelector('[data-mindmap]');
      if (!target && document.body && document.body.children.length <= 1) {
        var scriptsOnly = Array.prototype.every.call(document.body.children, function (el) {
          return el.tagName === 'SCRIPT';
        });
        if (scriptsOnly) {
          target = document.createElement('div');
          target.id = 'mindmap';
          target.style.cssText = 'width:100vw;height:100vh;';
          document.body.style.margin = '0';
          document.body.appendChild(target);
        }
      }
      if (target && !target.getAttribute('data-mm-mounted')) {
        target.setAttribute('data-mm-mounted', 'true');
        renderMindmap(target, { height: '100vh' });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoMount);
    } else {
      setTimeout(autoMount, 0);
    }
  }

  return {
    MINDMAP_DATA: MINDMAP_DATA,
    MINDMAP_MERMAID: MINDMAP_MERMAID,
    renderMindmap: renderMindmap,
    computeMindmapLayout: computeMindmapLayout,
    generateStandaloneHTML: generateStandaloneHTML
  };
});

