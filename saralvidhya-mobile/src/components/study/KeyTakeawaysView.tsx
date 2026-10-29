import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { fetchKeyTakeaways } from '@/services/contentService';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Website-Inspired Parser
// ─────────────────────────────────────────────────────────────────────────────

interface SubBulletItem {
  prefix?: string;
  lead?: string;
  body: string;
  raw: string;
}

interface TakeawayItem {
  id: string;
  lead: string;
  body: string;
  summaryBody: string;
  extendedNote?: string;
  subItems: SubBulletItem[];
  isHighYield: boolean;
  pyqBadge?: string;
  sectionTitle?: string;
  sectionIndex?: number;
}

interface RegionTripletCard {
  id: string;
  tag: string;
  name: string;
  note: string;
  detail: string;
}

interface LayerTableRow {
  num: string;
  name: string;
  func: string;
  detail: string;
}

interface TakeawaySection {
  id: string;
  index: number;
  numFormatted: string;
  title: string;
  subSectionTag?: string;
  introText?: string;
  regionsTriplet?: RegionTripletCard[];
  layersTable?: LayerTableRow[];
  items: TakeawayItem[];
}

interface ChapterBlueprint {
  stats: { num: string; label: string }[];
  routeSteps: string[];
  sections: TakeawaySection[];
}

const HIGH_YIELD_PATTERNS = [
  /\bpyq\b/i,
  /\bfrequently\s+asked\b/i,
  /\bhigh[-\s]?yield\b/i,
  /\bexam\b/i,
  /\bdefinition\b/i,
  /\bclassification\b/i,
  /\bmechanism\b/i,
  /\bformula\b/i,
  /\bperitrophic\b/i,
  /\bmalpighian\b/i,
  /\bstomodaeum\b/i,
  /\bmesenteron\b/i,
  /\bproctodaeum\b/i,
  /\becdysone\b/i,
  /\bjuvenile\s+hormone\b/i,
  /\bweathering\b/i,
  /\bpollination\b/i,
  /\bparthenocarpy\b/i,
];

function splitLeadAndBody(text: string, fallbackIndex: number = 1): { lead: string; body: string } {
  const cleaned = text.trim();
  const boldMatch = cleaned.match(/^\*\*([^*]+?)\*\*\s*:?\s*([\s\S]*)$/);
  if (boldMatch) {
    const rawLead = boldMatch[1].replace(/:$/, '').trim();
    const rawBody = boldMatch[2].replace(/^:\s*/, '').trim();
    if (rawBody) {
      return { lead: rawLead, body: rawBody };
    }
  }
  const plain = cleaned.replace(/\*+/g, '').trim();
  const colonIdx = plain.indexOf(':');
  if (colonIdx > 2 && colonIdx <= 48) {
    const candidateLead = plain.slice(0, colonIdx).trim();
    const rest = plain.slice(colonIdx + 1).trim();
    if (candidateLead && rest) {
      return { lead: candidateLead, body: rest };
    }
  }
  const dashMatch = plain.match(/^([^—–\-]{3,42})\s+[—–\-]\s+([\s\S]+)$/);
  if (dashMatch) {
    return { lead: dashMatch[1].trim(), body: dashMatch[2].trim() };
  }
  const words = plain.split(/\s+/).slice(0, 4).join(' ').replace(/[.,;!?]+$/, '');
  return {
    lead: words || `Concept ${fallbackIndex}`,
    body: plain,
  };
}

function splitSummaryAndExtended(body: string): { summaryBody: string; extendedNote?: string } {
  const trimmed = (body || '').replace(/\*+/g, '').trim();
  if (!trimmed) return { summaryBody: '' };

  const paragraphs = trimmed.split(/\n{2,}/);
  if (paragraphs.length > 1) {
    return {
      summaryBody: paragraphs[0].trim(),
      extendedNote: paragraphs.slice(1).join('\n\n').trim(),
    };
  }

  if (trimmed.length > 190) {
    const sentenceMatch = trimmed.match(/^([\s\S]{80,175}?[.!?])(\s+[\s\S]+)$/);
    if (sentenceMatch) {
      return {
        summaryBody: sentenceMatch[1].trim(),
        extendedNote: sentenceMatch[2].trim(),
      };
    }
  }

  return { summaryBody: trimmed };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rich Chapter Blueprints (Figma PNG Layout + Complete Section Content)
// ─────────────────────────────────────────────────────────────────────────────

const CHAPTER_BLUEPRINTS: Record<number, ChapterBlueprint> = {
  1: {
    stats: [
      { num: '03', label: 'Gut regions' },
      { num: '02', label: 'Origins' },
      { num: '05', label: 'Min review' },
    ],
    routeSteps: ['1  Review regions', '2  Compare wall layers', '3  Test key functions'],
    sections: [
      {
        id: 'sec_1',
        index: 1,
        numFormatted: '01',
        title: 'Three primary gut regions',
        subSectionTag: 'TRIPARTITE DIVISION',
        introText: 'The alimentary canal has three distinct regions:',
        regionsTriplet: [
          {
            id: 'foregut',
            tag: 'FOREGUT',
            name: 'Stomodaeum',
            note: 'Ectoderm · cuticular intima',
            detail:
              'Includes pharynx, oesophagus, crop (food storage), and proventriculus/gizzard (mechanical grinding). Lined by impermeable cuticular intima shed at each moult; bounded posteriorly by the cardiac (stomodeal) valve.',
          },
          {
            id: 'midgut',
            tag: 'MIDGUT',
            name: 'Mesenteron',
            note: 'Endoderm · no intima',
            detail:
              'Primary site of enzyme secretion and nutrient absorption. Lacks cuticular intima; instead secretes a semi-permeable chitin-protein Peritrophic Matrix (PM) and bears anterior gastric caeca.',
          },
          {
            id: 'hindgut',
            tag: 'HINDGUT',
            name: 'Proctodaeum',
            note: 'Ectoderm · cuticular intima',
            detail:
              'Begins at the pyloric valve where Malpighian tubules insert. Subdivided into ileum, colon, and rectum with rectal pads for water and ion reabsorption via cryptonephridial systems.',
          },
        ],
        items: [
          {
            id: 'ch1_s1_i1',
            lead: 'Foregut (Stomodaeum)',
            summaryBody: 'Ectodermal origin lined with cuticular intima; specialized for ingestion, crop storage, and proventricular grinding.',
            body: 'Ectodermal origin lined with cuticular intima; specialized for ingestion, crop storage, and proventricular grinding. Terminates at the cardiac valve which prevents regurgitation from the midgut.',
            extendedNote: 'Cardiac valve (stomodeal valve) invaginates into the anterior midgut, guiding food into the endoperitrophic space.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Three primary gut regions',
            sectionIndex: 1,
          },
          {
            id: 'ch1_s1_i2',
            lead: 'Midgut (Mesenteron)',
            summaryBody: 'Endodermal origin lacking cuticular intima; main locus of digestive enzyme synthesis and nutrient absorption.',
            body: 'Endodermal origin lacking cuticular intima; main locus of digestive enzyme synthesis and nutrient absorption across columnar cells and gastric caeca.',
            extendedNote: 'Regenerative nidi (stem cells) at the base of midgut epithelium continuously replace worn digestive cells.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Three primary gut regions',
            sectionIndex: 1,
          },
          {
            id: 'ch1_s1_i3',
            lead: 'Hindgut (Proctodaeum)',
            summaryBody: 'Ectodermal origin with permeable cuticular intima; regulates water/ion homeostasis via rectal papillae.',
            body: 'Ectodermal origin with permeable cuticular intima; regulates water/ion homeostasis via rectal papillae and excretes uric acid.',
            subItems: [],
            isHighYield: false,
            sectionTitle: 'Three primary gut regions',
            sectionIndex: 1,
          },
        ],
      },
      {
        id: 'sec_2',
        index: 2,
        numFormatted: '02',
        title: 'Histological wall layers',
        subSectionTag: 'LUMEN OUTWARD',
        layersTable: [
          {
            num: '01',
            name: 'Peritrophic matrix',
            func: 'Protective lining',
            detail: 'Chitin microfibrils + peritrophin proteins forming a semi-permeable ultrafilter (Type I delaminates across entire midgut; Type II extruded by cardia).',
          },
          {
            num: '02',
            name: 'Epithelium',
            func: 'Secretion & absorption',
            detail: 'Columnar cells with apical microvilli (brush border), goblet cells (K+ active transport in Lepidoptera), and basal regenerative nidi.',
          },
          {
            num: '03',
            name: 'Basement membrane',
            func: 'Structural support',
            detail: 'Acellular collagenous basal lamina separating the gut epithelium from the surrounding visceral musculature and hemolymph.',
          },
          {
            num: '04',
            name: 'Muscle layers',
            func: 'Mixing & peristalsis',
            detail: 'Inner circular and outer longitudinal striated visceral muscle fibers driving peristaltic food propulsion.',
          },
        ],
        items: [
          {
            id: 'ch1_s2_i1',
            lead: 'Peritrophic Matrix (Type I vs Type II)',
            summaryBody: 'Non-cellular chitin-protein sleeve protecting midgut microvilli from mechanical abrasion and pathogens.',
            body: 'Non-cellular chitin-protein sleeve protecting midgut microvilli from mechanical abrasion and pathogens. Type I forms across the whole midgut (Coleoptera, Lepidoptera); Type II is secreted continuously by the cardia (Diptera).',
            extendedNote: 'Absent in many sap-sucking Hemiptera, which instead possess a specialized lipoprotein perimicrovillar membrane.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Histological wall layers',
            sectionIndex: 2,
          },
          {
            id: 'ch1_s2_i2',
            lead: 'Midgut Epithelial Cell Types',
            summaryBody: 'Columnar digestive cells, regenerative nidi, endocrine cells, and proton-pumping goblet cells.',
            body: 'Columnar digestive cells handle enzyme secretion and absorption; goblet cells in Lepidoptera actively pump K+ into the lumen, creating a high alkaline pH (9.5–12).',
            subItems: [],
            isHighYield: false,
            sectionTitle: 'Histological wall layers',
            sectionIndex: 2,
          },
        ],
      },
      {
        id: 'sec_3',
        index: 3,
        numFormatted: '03',
        title: 'Digestive secretions',
        subSectionTag: 'ENZYMES & COMPARTMENTS',
        items: [
          {
            id: 'ch1_s3_i1',
            lead: 'Labial Salivary Glands & Invertase / Amylase',
            summaryBody: 'Lubricates ingesta and initiates carbohydrate hydrolysis; blood-feeders secrete anticoagulants (apyrase, hirudin-like peptides).',
            body: 'Paired labial glands open into the salivarium. Phytophagous insects secrete amylase and invertase; zoophagous Hemiptera inject pectinase, proteases, and phospholipases for extra-oral digestion.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Digestive secretions',
            sectionIndex: 3,
          },
          {
            id: 'ch1_s3_i2',
            lead: 'Endo-ectoperitrophic Counter-Current Recycling',
            summaryBody: 'Polymers are cleaved in the endoperitrophic space; oligomers diffuse into the ectoperitrophic space for terminal digestion.',
            body: 'Large digestive enzymes remain inside the endoperitrophic lumen while fluid flux carries enzymes anteriorly in the ectoperitrophic space, preventing enzyme loss in feces.',
            subItems: [],
            isHighYield: false,
            sectionTitle: 'Digestive secretions',
            sectionIndex: 3,
          },
        ],
      },
      {
        id: 'sec_4',
        index: 4,
        numFormatted: '04',
        title: 'Key physiological formulas',
        subSectionTag: 'TOXICOLOGY & SPECIAL ADAPTATIONS',
        items: [
          {
            id: 'ch1_s4_i1',
            lead: 'Bt Cry Toxin Activation Mechanism',
            summaryBody: 'Requires alkaline midgut pH (9.5–12) in Lepidoptera to solubilize parasporal crystals, followed by serine protease cleavage.',
            body: 'Bacillus thuringiensis Cry protoxins dissolve in the highly alkaline lepidopteran midgut, are activated by midgut trypsin-like proteases, bind cadherin/aminopeptidase-N receptors on microvilli, and form lytic pores.',
            extendedNote: 'Acidic midguts of many non-target insects cannot solubilize lepidopteran-specific Cry1Ac crystals, conferring selective safety.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Key physiological formulas',
            sectionIndex: 4,
          },
          {
            id: 'ch1_s4_i2',
            lead: 'Filter Chamber & Cryptonephridial System',
            summaryBody: 'Filter chamber in Hemiptera bypasses excess sap water; cryptonephridial complex in Coleoptera/Lepidoptera recovers rectal water.',
            body: 'In Sternorrhyncha/Auchenorrhyncha, the filter chamber binds anterior midgut and posterior midgut/Malpighian tubules to shunt excess water directly to the hindgut while concentrating amino acids.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Key physiological formulas',
            sectionIndex: 4,
          },
        ],
      },
    ],
  },
  2: {
    stats: [
      { num: '03', label: 'Meta types' },
      { num: '04', label: 'Larval forms' },
      { num: '05', label: 'Min review' },
    ],
    routeSteps: ['1  Review metamorphosis', '2  Compare larval/pupal types', '3  Test hormone cascade'],
    sections: [
      {
        id: 'sec_1',
        index: 1,
        numFormatted: '01',
        title: 'Three metamorphosis types',
        subSectionTag: 'POST-EMBRYONIC DEVELOPMENT',
        introText: 'Insect post-embryonic development follows three primary pathways:',
        regionsTriplet: [
          {
            id: 'ametabola',
            tag: 'AMETABOLA',
            name: 'No Metamorphosis',
            note: 'Egg → Young → Adult',
            detail: 'Apterygote orders (Thysanura, Collembola). Juveniles resemble adults except in size and sexual maturity; adults continue moulting.',
          },
          {
            id: 'hemimetabola',
            tag: 'HEMIMETABOLA',
            name: 'Incomplete',
            note: 'Egg → Nymph → Adult',
            detail: 'Exopterygota (Orthoptera, Hemiptera, Odonata). External wing pads develop gradually; no pupal stage.',
          },
          {
            id: 'holometabola',
            tag: 'HOLOMETABOLA',
            name: 'Complete',
            note: 'Egg → Larva → Pupa → Adult',
            detail: 'Endopterygota (Coleoptera, Lepidoptera, Diptera, Hymenoptera). Internal imaginal discs form adult organs during the quiescent pupal stage.',
          },
        ],
        items: [
          {
            id: 'ch2_s1_i1',
            lead: 'Holometabolous vs Hemimetabolous Development',
            summaryBody: 'Holometabola separates larval feeding from adult reproduction via a pupal stage and internal imaginal discs.',
            body: 'Holometabola separates larval feeding from adult reproduction via a pupal stage and internal imaginal discs, eliminating intraspecific niche competition.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Three metamorphosis types',
            sectionIndex: 1,
          },
        ],
      },
      {
        id: 'sec_2',
        index: 2,
        numFormatted: '02',
        title: 'Larval & pupal classifications',
        subSectionTag: 'MORPHOLOGICAL TYPES',
        layersTable: [
          {
            num: '01',
            name: 'Eruciform & Scarabaeiform',
            func: 'Polypod / Oligopod',
            detail: 'Eruciform (caterpillars) have thoracic legs + abdominal prolegs with crochets; Scarabaeiform (white grubs) are C-shaped with thoracic legs only.',
          },
          {
            num: '02',
            name: 'Campodeiform & Elateriform',
            func: 'Active oligopod',
            detail: 'Campodeiform (neuropteran/coccinellid) are prognathous predators; Elateriform (wireworms) are cylindrical and heavily sclerotized.',
          },
          {
            num: '03',
            name: 'Vermiform (Apodous)',
            func: 'Legless larvae',
            detail: 'Eucephalous (mosquito wrigglers), Hemicephalous (horsefly), and Acephalous (housefly maggots with cephalopharyngeal skeleton).',
          },
          {
            num: '04',
            name: 'Obtect, Exarate & Coarctate',
            func: 'Pupal classifications',
            detail: 'Obtect (appendages glued: Lepidoptera), Exarate (free appendages: Coleoptera), Coarctate (enclosed in hardened last larval skin/puparium: Diptera).',
          },
        ],
        items: [
          {
            id: 'ch2_s2_i1',
            lead: 'Pupal Types: Obtect, Exarate, Coarctate',
            summaryBody: 'Obtect pupae solder appendages to the body (chrysalis); Exarate keep appendages free; Coarctate form inside a dipteran puparium.',
            body: 'Obtect pupae solder appendages to the body (Lepidoptera); Exarate keep appendages free (Coleoptera, Hymenoptera); Coarctate develop inside the sclerotized 3rd-instar cuticle called a puparium (Cyclorrhaphous Diptera).',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Larval & pupal classifications',
            sectionIndex: 2,
          },
        ],
      },
      {
        id: 'sec_3',
        index: 3,
        numFormatted: '03',
        title: 'Endocrine hormonal cascade',
        subSectionTag: 'PTTH · ECDYSONE · JUVENILE HORMONE',
        items: [
          {
            id: 'ch2_s3_i1',
            lead: 'PTTH, 20-Hydroxyecdysone & Juvenile Hormone (JH)',
            summaryBody: 'Ecdysone from prothoracic glands triggers moulting; JH titer from corpora allata determines the nature of the moult.',
            body: 'Brain neurosecretory cells release PTTH stored in corpora cardiaca → stimulates prothoracic glands to secrete ecdysone (converted to active 20E). High JH = larva→larva moult; Low JH = larva→pupa; Absent JH = pupa→adult.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Endocrine hormonal cascade',
            sectionIndex: 3,
          },
        ],
      },
      {
        id: 'sec_4',
        index: 4,
        numFormatted: '04',
        title: 'Diapause vs quiescence',
        subSectionTag: 'SEASONAL SURVIVAL',
        items: [
          {
            id: 'ch2_s4_i1',
            lead: 'Photoperiodic Diapause vs Quiescence',
            summaryBody: 'Diapause is neurohormonally programmed in advance by token stimuli (photoperiod); quiescence is an immediate reversible arrest.',
            body: 'Diapause is induced by token cues (daylength, temperature) prior to harsh conditions and requires diapause development to terminate; quiescence ends immediately when favorable conditions return.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Diapause vs quiescence',
            sectionIndex: 4,
          },
        ],
      },
    ],
  },
  3: {
    stats: [
      { num: '03', label: 'Pathways' },
      { num: '06', label: 'Reactions' },
      { num: '05', label: 'Min review' },
    ],
    routeSteps: ['1  Review weathering modes', '2  Compare chemical reactions', '3  Test stability series'],
    sections: [
      {
        id: 'sec_1',
        index: 1,
        numFormatted: '01',
        title: 'Physical disintegration pathways',
        subSectionTag: 'MECHANICAL WEATHERING',
        introText: 'Three core physical agents break rock into regolith without altering chemistry:',
        regionsTriplet: [
          {
            id: 'thermal',
            tag: 'THERMAL',
            name: 'Exfoliation',
            note: 'Differential expansion',
            detail: 'Diurnal heating and cooling causes outer rock layers to peel off like onion skins (common in granitoid rocks).',
          },
          {
            id: 'frost',
            tag: 'FROST WEDGING',
            name: 'Ice Crystal Growth',
            note: '9% volume expansion',
            detail: 'Water freezing in rock fissures expands by ~9%, exerting up to 150 kg/cm² pressure to shatter rock joints.',
          },
          {
            id: 'abrasion',
            tag: 'ABRASION',
            name: 'Water, Wind & Ice',
            note: 'Specific surface area ↑',
            detail: 'Fluvial, aeolian, and glacial transport grinds clasts smaller, exponentially increasing surface area for chemical attack.',
          },
        ],
        items: [
          {
            id: 'ch3_s1_i1',
            lead: 'Specific Surface Area Amplification',
            summaryBody: 'Physical comminution multiplies exposed mineral surfaces, accelerating subsequent chemical weathering.',
            body: 'Subdividing a cube into smaller particles keeps total volume constant while inversely increasing total surface area, directly governing hydration and hydrolysis rates.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Physical disintegration pathways',
            sectionIndex: 1,
          },
        ],
      },
      {
        id: 'sec_2',
        index: 2,
        numFormatted: '02',
        title: 'Chemical decomposition reactions',
        subSectionTag: 'GEOCHEMICAL TRANSFORMATIONS',
        layersTable: [
          {
            num: '01',
            name: 'Hydrolysis',
            func: 'H+ / OH- ion replacement',
            detail: 'Most important reaction: orthoclase feldspar (KAlSi3O8) + H2O → kaolinite clay + soluble KOH + silicic acid.',
          },
          {
            num: '02',
            name: 'Hydration',
            func: 'Intact H2O addition',
            detail: 'Hematite (Fe2O3, red) incorporates water molecules to form Limonite/Goethite (Fe2O3·nH2O, yellow) with volume expansion.',
          },
          {
            num: '03',
            name: 'Carbonation',
            func: 'H2CO3 dissolution',
            detail: 'CO2-enriched soil water forms carbonic acid, converting insoluble CaCO3 (calcite) into soluble Ca(HCO3)2.',
          },
          {
            num: '04',
            name: 'Oxidation & Chelation',
            func: 'Fe2+ → Fe3+ & organic ligands',
            detail: 'Ferrous iron oxidizes to ferric iron weakening crystal lattices; humic acids chelate metallic cations.',
          },
        ],
        items: [
          {
            id: 'ch3_s2_i1',
            lead: 'Hydrolysis of Orthoclase Feldspar ("Clay Maker")',
            summaryBody: 'H+ ions from dissociated water replace K+ in aluminosilicates, synthesizing secondary clay minerals like kaolinite.',
            body: '2KAlSi3O8 + 2H+ + 9H2O → Al2Si2O5(OH)4 (Kaolinite) + 4H4SiO4 + 2K+. Considered the primary precursor reaction for silicate clay genesis.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Chemical decomposition reactions',
            sectionIndex: 2,
          },
        ],
      },
      {
        id: 'sec_3',
        index: 3,
        numFormatted: '03',
        title: 'Biological weathering agents',
        subSectionTag: 'BIO-MECHANICAL & BIO-CHEMICAL',
        items: [
          {
            id: 'ch3_s3_i1',
            lead: 'Root Exudates, Lichens & Soil Fauna',
            summaryBody: 'Plant roots exert turgor wedging and respire CO2; lichens secrete oxalic acid to chelate rock cations.',
            body: 'Pioneer crustose lichens, mycorrhizal hyphae, and root exudates (citric, malic, oxalic acids) accelerate mineral dissolution while earthworms and termites mix soil horizons.',
            subItems: [],
            isHighYield: false,
            sectionTitle: 'Biological weathering agents',
            sectionIndex: 3,
          },
        ],
      },
      {
        id: 'sec_4',
        index: 4,
        numFormatted: '04',
        title: 'Soil genesis & clay minerals',
        subSectionTag: 'GOLDICH SERIES & JENNY EQUATION',
        items: [
          {
            id: 'ch3_s4_i1',
            lead: 'Goldich Weathering Stability Series & Jenny Equation',
            summaryBody: 'Olivine weathers fastest and Quartz slowest; S = f(cl, o, r, p, t) governs soil formation.',
            body: 'Minerals crystallizing at high temperatures (olivine, calcic plagioclase) are least stable at surface conditions, whereas quartz is most resistant. Jenny (1941): Soil = f(Climate, Organisms, Relief, Parent material, Time).',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Soil genesis & clay minerals',
            sectionIndex: 4,
          },
        ],
      },
    ],
  },
  4: {
    stats: [
      { num: '02', label: 'Pollination modes' },
      { num: '04', label: 'Syndromes' },
      { num: '05', label: 'Min review' },
    ],
    routeSteps: ['1  Review floral modes', '2  Compare outbreeding mechanisms', '3  Test parthenocarpy types'],
    sections: [
      {
        id: 'sec_1',
        index: 1,
        numFormatted: '01',
        title: 'Floral reproductive morphology',
        subSectionTag: 'POLLINATION MODES',
        introText: 'Pollen transfer pathways determine genetic structure in crops:',
        regionsTriplet: [
          {
            id: 'autogamy',
            tag: 'AUTOGAMY',
            name: 'Self-Pollination',
            note: 'Same flower · homozygosity',
            detail: 'Promoted by cleistogamy (unopened flowers in groundnut/commelina), chasmogamy, and homogamy.',
          },
          {
            id: 'geitonogamy',
            tag: 'GEITONOGAMY',
            name: 'Between Flowers',
            note: 'Same plant · genetically self',
            detail: 'Ecologically cross-pollination requiring a vector, but genetically equivalent to autogamy (e.g., monoecious maize).',
          },
          {
            id: 'xenogamy',
            tag: 'XENOGAMY',
            name: 'Cross-Pollination',
            note: 'Different plants · heterosis',
            detail: 'True allogamy enforced by dicliny, dichogamy (protandry/protogyny), herkogamy, and self-incompatibility.',
          },
        ],
        items: [
          {
            id: 'ch4_s1_i1',
            lead: 'Double Fertilization & Endosperm Ploidy',
            summaryBody: 'One male gamete fuses with the egg (2n zygote); the second fuses with two polar nuclei (3n primary endosperm nucleus).',
            body: 'Siphonogamous pollen tube growth delivers two sperm cells into the embryo sac, producing a diploid embryo and triploid nutritive endosperm.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Floral reproductive morphology',
            sectionIndex: 1,
          },
        ],
      },
      {
        id: 'sec_2',
        index: 2,
        numFormatted: '02',
        title: 'Self vs cross-pollination',
        subSectionTag: 'OUTBREEDING DEVICES',
        layersTable: [
          {
            num: '01',
            name: 'Dicliny (Unisexuality)',
            func: 'Monoecious vs Dioecious',
            detail: 'Monoecious: cucurbits, maize, castor; Dioecious: papaya, date palm, kiwi, spinach.',
          },
          {
            num: '02',
            name: 'Dichogamy',
            func: 'Protandry vs Protogyny',
            detail: 'Protandry (anthers mature first): maize, sunflower,okra; Protogyny (stigma matures first): bajra, annona, sapota.',
          },
          {
            num: '03',
            name: 'Self-Incompatibility',
            func: 'Sporophytic vs Gametophytic',
            detail: 'SSI (governed by diploid sporophyte S-alleles: Brassicaceae); GSI (governed by haploid pollen genotype: Solanaceae, Rosaceae).',
          },
          {
            num: '04',
            name: 'Herkogamy & Heterostyly',
            func: 'Spatial separation',
            detail: 'Physical barrier between anther and stigma (Calotropis pollinia) or pin/thrum style dimorphism (primrose, linseed).',
          },
        ],
        items: [
          {
            id: 'ch4_s2_i1',
            lead: 'Sporophytic vs Gametophytic Self-Incompatibility',
            summaryBody: 'SSI rejects pollen on the dry stigma surface (Brassica); GSI arrests pollen tubes inside the style via S-RNases (Tomato/Apple).',
            body: 'Self-incompatibility prevents inbreeding in fertile hermaphrodite flowers and is widely used for hybrid seed production in cole crops.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Self vs cross-pollination',
            sectionIndex: 2,
          },
        ],
      },
      {
        id: 'sec_3',
        index: 3,
        numFormatted: '03',
        title: 'Entomophilous adaptations',
        subSectionTag: 'POLLINATORS VS POLLINIZERS',
        items: [
          {
            id: 'ch4_s3_i1',
            lead: 'Pollinator (Vector) vs Pollinizer (Pollen Donor Cultivar)',
            summaryBody: 'A pollinator is the biotic agent (e.g., Apis mellifera); a pollinizer is the compatible plant cultivar supplying viable pollen.',
            body: 'In self-unfruitful orchards like apple (Red Delicious requires Golden Delicious pollinizer at 11–33% ratio), bloom overlap and bee hive placement (2–5 colonies/ha) are critical.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Entomophilous adaptations',
            sectionIndex: 3,
          },
        ],
      },
      {
        id: 'sec_4',
        index: 4,
        numFormatted: '04',
        title: 'Managed bee pollination & parthenocarpy',
        subSectionTag: 'SEEDLESS FRUIT DEVELOPMENT',
        items: [
          {
            id: 'ch4_s4_i1',
            lead: 'Vegetative, Stimulative & Stenospermocarpic Parthenocarpy',
            summaryBody: 'Banana/Washington Navel orange are vegetative; Black Corinth grape is stimulative; Sindhu mango & Thompson Seedless grape are stenospermocarpic.',
            body: 'Stenospermocarpy involves normal pollination and fertilization followed by early embryo abortion, leaving soft rudimentary seed traces. Exogenous GA3 and auxins (NAA/2,4-D) induce artificial parthenocarpy.',
            subItems: [],
            isHighYield: true,
            pyqBadge: '★ PYQ-repeat',
            sectionTitle: 'Managed bee pollination & parthenocarpy',
            sectionIndex: 4,
          },
        ],
      },
    ],
  },
};

function mergeBackendMarkdownIntoBlueprint(
  markdown: string,
  chapterNumber: number
): ChapterBlueprint {
  const base = CHAPTER_BLUEPRINTS[chapterNumber] || CHAPTER_BLUEPRINTS[1];
  const trimmed = (markdown || '').trim();
  if (!trimmed || trimmed.length < 80 || trimmed.includes('being compiled for this chapter')) {
    return base;
  }

  // Parse additional markdown bullets from cloud DB if available
  const lines = trimmed.split(/\r?\n/);
  const parsedSections: TakeawaySection[] = [];
  let currentSec: TakeawaySection | null = null;
  let currentItem: TakeawayItem | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === '---') continue;

    const h2Match = line.match(/^#{2,3}\s+(.+)$/);
    if (h2Match) {
      const cleanTitle = h2Match[1]
        .replace(/^📌\s*/, '')
        .replace(/\*+/g, '')
        .replace(/^\d+[\.\)]\s*/, '')
        .trim();
      if (
        cleanTitle.toLowerCase().includes('scope') ||
        cleanTitle.toLowerCase().includes('introduction')
      ) {
        continue;
      }
      const idx = parsedSections.length + 1;
      const baseSec = base.sections[idx - 1];
      currentSec = {
        id: `sec_${idx}`,
        index: idx,
        numFormatted: idx < 10 ? `0${idx}` : `${idx}`,
        title: cleanTitle.length > 42 ? cleanTitle.slice(0, 40) + '…' : cleanTitle,
        subSectionTag: baseSec?.subSectionTag || `SECTION 0${idx}`,
        introText: baseSec?.introText,
        regionsTriplet: idx === 1 ? baseSec?.regionsTriplet : undefined,
        layersTable: idx === 2 ? baseSec?.layersTable : undefined,
        items: [],
      };
      parsedSections.push(currentSec);
      currentItem = null;
      continue;
    }

    const bulletMatch = rawLine.match(/^(\s*)([*\-+]|(?:\d+\.))\s+(.+)$/);
    if (bulletMatch && currentSec) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[3].trim();
      if (indent >= 2 && currentItem) {
        const sp = splitLeadAndBody(content, currentItem.subItems.length + 1);
        currentItem.subItems.push({
          lead: sp.lead,
          body: sp.body,
          raw: content,
        });
      } else {
        const itemIdx = currentSec.items.length + 1;
        const { lead, body } = splitLeadAndBody(content, itemIdx);
        const { summaryBody, extendedNote } = splitSummaryAndExtended(body);
        const isHighYield =
          HIGH_YIELD_PATTERNS.some((re) => re.test(`${lead} ${body}`)) || itemIdx === 1;
        currentItem = {
          id: `ch${chapterNumber}_${currentSec.id}_i${itemIdx}`,
          lead,
          body: body.replace(/\*+/g, ''),
          summaryBody,
          extendedNote,
          subItems: [],
          isHighYield,
          pyqBadge: isHighYield ? '★ PYQ-repeat' : undefined,
          sectionTitle: currentSec.title,
          sectionIndex: currentSec.index,
        };
        currentSec.items.push(currentItem);
      }
    }
  }

  const validSections = parsedSections.filter((s) => s.items.length > 0 || s.regionsTriplet || s.layersTable);
  if (validSections.length >= 2) {
    return {
      stats: base.stats,
      routeSteps: base.routeSteps,
      sections: validSections,
    };
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface KeyTakeawaysViewProps {
  subjectId?: string;
  chapterNumber?: number;
  chapterName?: string;
  subjectName?: string;
}

export default function KeyTakeawaysView({
  subjectId = 'entomology',
  chapterNumber = 1,
  chapterName = 'Insect Digestive System',
  subjectName = 'Entomology',
}: KeyTakeawaysViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [rawMarkdown, setRawMarkdown] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Interactive states inspired by Website + Figma PNG
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>({});
  const [checkedSections, setCheckedSections] = useState<Record<string, boolean>>({
    sec_1: true,
    sec_2: true,
  });
  const [activeRegionId, setActiveRegionId] = useState<string | null>('foregut');
  const [activeLayerIdx, setActiveLayerIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unreviewed' | 'mastered' | 'high_yield'>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [rapidReviewOpen, setRapidReviewOpen] = useState<boolean>(false);
  const [rapidReviewIndex, setRapidReviewIndex] = useState<number>(0);

  const storageKeyMastered = `sv_kt_mastered_${subjectId}_ch${chapterNumber}`;
  const storageKeyChecklist = `sv_kt_checklist_${subjectId}_ch${chapterNumber}`;

  // Load persisted progress & fetch chapter takeaways
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setSearchQuery('');
    setFilterMode('all');
    setSelectedSectionId('all');
    setActiveLayerIdx(null);

    const bp = CHAPTER_BLUEPRINTS[chapterNumber] || CHAPTER_BLUEPRINTS[1];
    setActiveRegionId(bp.sections[0]?.regionsTriplet?.[0]?.id || null);

    // Load saved checklist & mastered items
    AsyncStorage.multiGet([storageKeyMastered, storageKeyChecklist])
      .then((pairs) => {
        if (!isMounted) return;
        const mRaw = pairs[0]?.[1];
        const cRaw = pairs[1]?.[1];
        if (mRaw) {
          try {
            setMasteredIds(JSON.parse(mRaw));
          } catch {}
        } else {
          setMasteredIds({});
        }
        if (cRaw) {
          try {
            setCheckedSections(JSON.parse(cRaw));
          } catch {}
        } else {
          setCheckedSections({ sec_1: true, sec_2: true });
        }
      })
      .catch(() => {});

    setIsLoading(true);
    fetchKeyTakeaways(subjectId, chapterNumber, controller.signal)
      .then((text) => {
        if (isMounted) {
          if (text && text.trim().length > 50) {
            setRawMarkdown(text);
          } else {
            setRawMarkdown('');
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber]);

  const blueprint = useMemo(
    () => mergeBackendMarkdownIntoBlueprint(rawMarkdown, chapterNumber),
    [rawMarkdown, chapterNumber]
  );

  // Figma Forest-Emerald Palette (matching the uploaded Figma PNG + Dark Mode support)
  const colors = isDark
    ? {
        screenBg: '#16231C',
        cardBg: '#1E2F26',
        cardBorder: '#314B3D',
        pageTitle: '#F2F7F4',
        topicTitle: '#62C388',
        intro: '#A7C0B2',
        timeBadgeBg: '#254233',
        timeBadgeText: '#7CD99E',
        statNumber: '#62C388',
        statLabel: '#E4EFE8',
        studyGuideHeading: '#7CD99E',
        sectionNumBg: '#254233',
        sectionNumText: '#7CD99E',
        sectionNumActiveBg: '#3A8459',
        sectionLinkTitle: '#F2F7F4',
        separator: '#314B3D',
        checklistLabel: '#9AB5A6',
        badgeSolidBg: '#3A8459',
        badgeSolidText: '#FFFFFF',
        badgeSoftBg: '#254233',
        badgeSoftText: '#7CD99E',
        subSectionTag: '#62C388',
        regionCardBg: '#24382D',
        regionCardBorder: '#355242',
        regionCardActiveBorder: '#62C388',
        regionLabel: '#7CD99E',
        regionName: '#F2F7F4',
        regionNote: '#A7C0B2',
        layerIndex: '#62C388',
        layerName: '#F2F7F4',
        layerFunction: '#A7C0B2',
        routeBannerBg: '#22382C',
        routeBannerBorder: '#355443',
        routeTitle: '#7CD99E',
        routeText: '#E8F3EC',
        pyqBadgeBg: '#2B4738',
        pyqBadgeText: '#8BE0AA',
        highYieldCardBg: '#21352A',
        highYieldCardBorder: '#3D634E',
        searchBg: '#1E2F26',
        pillBg: '#1E2F26',
        pillActiveBg: '#274636',
        pillActiveBorder: '#52B379',
      }
    : {
        screenBg: '#F4F9F5',
        cardBg: '#FFFFFF',
        cardBorder: '#D5E6DC',
        pageTitle: '#1E3128',
        topicTitle: '#3A8459',
        intro: '#63786D',
        timeBadgeBg: '#E6F2EB',
        timeBadgeText: '#23573A',
        statNumber: '#3A8459',
        statLabel: '#1E3128',
        studyGuideHeading: '#23573A',
        sectionNumBg: '#E6F2EB',
        sectionNumText: '#23573A',
        sectionNumActiveBg: '#3A8459',
        sectionLinkTitle: '#1E3128',
        separator: '#DFECE4',
        checklistLabel: '#63786D',
        badgeSolidBg: '#3A8459',
        badgeSolidText: '#FFFFFF',
        badgeSoftBg: '#E6F2EB',
        badgeSoftText: '#23573A',
        subSectionTag: '#23573A',
        regionCardBg: '#EAF2ED',
        regionCardBorder: '#D4E4DA',
        regionCardActiveBorder: '#3A8459',
        regionLabel: '#23573A',
        regionName: '#1E3128',
        regionNote: '#63786D',
        layerIndex: '#23573A',
        layerName: '#1E3128',
        layerFunction: '#6B7F74',
        routeBannerBg: '#E6F2EB',
        routeBannerBorder: '#CFE3D7',
        routeTitle: '#23573A',
        routeText: '#1E3128',
        pyqBadgeBg: '#E6F2EB',
        pyqBadgeText: '#23573A',
        highYieldCardBg: '#F9FCFA',
        highYieldCardBorder: '#C6DFD0',
        searchBg: '#FFFFFF',
        pillBg: '#FFFFFF',
        pillActiveBg: '#E6F2EB',
        pillActiveBorder: '#3A8459',
      };

  const allItems = useMemo(
    () => blueprint.sections.flatMap((s) => s.items),
    [blueprint.sections]
  );

  const totalItemsCount = allItems.length;
  const masteredCount = useMemo(
    () => allItems.filter((i) => masteredIds[i.id]).length,
    [allItems, masteredIds]
  );
  const highYieldItems = useMemo(
    () => allItems.filter((i) => i.isHighYield),
    [allItems]
  );

  const completedChecklistCount = useMemo(
    () => blueprint.sections.filter((sec) => checkedSections[sec.id]).length,
    [blueprint.sections, checkedSections]
  );

  const persistChecklist = (next: Record<string, boolean>) => {
    setCheckedSections(next);
    AsyncStorage.setItem(storageKeyChecklist, JSON.stringify(next)).catch(() => {});
  };

  const persistMastered = (next: Record<string, boolean>) => {
    setMasteredIds(next);
    AsyncStorage.setItem(storageKeyMastered, JSON.stringify(next)).catch(() => {});
  };

  const handleToggleChecklistSection = (sec: TakeawaySection) => {
    Haptics.selectionAsync();
    const nextChecked = !checkedSections[sec.id];
    persistChecklist({ ...checkedSections, [sec.id]: nextChecked });

    // Also sync the section's items mastered state
    const nextMastered = { ...masteredIds };
    sec.items.forEach((item) => {
      nextMastered[item.id] = nextChecked;
    });
    persistMastered(nextMastered);
  };

  const handleToggleItemMastered = (item: TakeawayItem, section: TakeawaySection) => {
    Haptics.selectionAsync();
    const nextVal = !masteredIds[item.id];
    const nextMastered = { ...masteredIds, [item.id]: nextVal };
    persistMastered(nextMastered);

    const allDone = section.items.every((i) => nextMastered[i.id]);
    if (allDone !== Boolean(checkedSections[section.id])) {
      persistChecklist({ ...checkedSections, [section.id]: allDone });
    }
  };

  const handleToggleNoteExpand = (itemId: string) => {
    Haptics.selectionAsync();
    setExpandedNotes((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blueprint.sections
      .filter((sec) => selectedSectionId === 'all' || sec.id === selectedSectionId)
      .map((sec) => {
        if (!q && filterMode === 'all') return sec;
        const matchingItems = sec.items.filter((item) => {
          if (filterMode === 'unreviewed' && masteredIds[item.id]) return false;
          if (filterMode === 'mastered' && !masteredIds[item.id]) return false;
          if (filterMode === 'high_yield' && !item.isHighYield) return false;
          if (!q) return true;
          return (
            sec.title.toLowerCase().includes(q) ||
            item.lead.toLowerCase().includes(q) ||
            item.body.toLowerCase().includes(q)
          );
        });
        return { ...sec, items: matchingItems };
      })
      .filter(
        (sec) =>
          sec.items.length > 0 ||
          (!searchQuery.trim() && filterMode === 'all' && (sec.regionsTriplet || sec.layersTable))
      );
  }, [blueprint.sections, selectedSectionId, filterMode, searchQuery, masteredIds]);

  const rapidDeck = useMemo(
    () => (highYieldItems.length > 0 ? highYieldItems : allItems),
    [highYieldItems, allItems]
  );

  const handleStartRapidReview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRapidReviewIndex(0);
    setRapidReviewOpen(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TITLE & 5-MIN BADGE BLOCK (Matches Figma PNG) */}
        <View style={styles.titleSection}>
          <View style={styles.pageTitleRow}>
            <Text style={[styles.pageTitle, { color: colors.pageTitle }]}>Key Takeaways</Text>
            <TouchableOpacity
              style={[styles.timeBadge, { backgroundColor: colors.timeBadgeBg }]}
              onPress={handleStartRapidReview}
              activeOpacity={0.8}
            >
              <Text style={[styles.timeBadgeText, { color: colors.timeBadgeText }]}>⚡ 5 MIN</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.topicTitle, { color: colors.topicTitle }]}>{chapterName}</Text>
          <Text style={[styles.intro, { color: colors.intro }]}>
            A focused 5-minute revision sheet.
          </Text>
        </View>

        {/* 2. THREE QUICK STAT CARDS ROW (Matches Figma PNG) */}
        <View style={styles.statsRow}>
          {blueprint.stats.map((st, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                if (idx === 2) {
                  handleStartRapidReview();
                } else {
                  const targetSec = blueprint.sections[idx];
                  if (targetSec) {
                    setSelectedSectionId((prev) => (prev === targetSec.id ? 'all' : targetSec.id));
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: colors.statNumber }]}>{st.num}</Text>
              <Text style={[styles.statLabel, { color: colors.statLabel }]} numberOfLines={1}>
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. STUDY GUIDE & REVISION CHECKLIST CARD (Matches Figma PNG + Interactive Checklist) */}
        <View
          style={[
            styles.studyGuideCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.studyGuideHeaderRow}>
            <Text style={[styles.studyGuideHeading, { color: colors.studyGuideHeading }]}>
              STUDY GUIDE
            </Text>
            {selectedSectionId !== 'all' && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSectionId('all');
                }}
              >
                <Text style={[styles.showAllLink, { color: colors.topicTitle }]}>Show all sections</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.studyGuideList}>
            {blueprint.sections.map((sec) => {
              const isChecked = Boolean(checkedSections[sec.id]);
              const isFocused = selectedSectionId === sec.id;
              return (
                <View key={sec.id} style={styles.studyGuideRow}>
                  {/* Tapping badge toggles checklist state */}
                  <TouchableOpacity
                    style={[
                      styles.sectionNumBadge,
                      {
                        backgroundColor: isChecked
                          ? colors.sectionNumActiveBg
                          : colors.sectionNumBg,
                      },
                    ]}
                    onPress={() => handleToggleChecklistSection(sec)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.sectionNumText,
                        { color: isChecked ? '#FFFFFF' : colors.sectionNumText },
                      ]}
                    >
                      {sec.numFormatted}
                    </Text>
                  </TouchableOpacity>

                  {/* Tapping title filters/focuses section or toggles checklist */}
                  <TouchableOpacity
                    style={styles.studyGuideTitleBtn}
                    onPress={() => handleToggleChecklistSection(sec)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.sectionLinkTitle,
                        {
                          color: colors.sectionLinkTitle,
                          fontWeight: isFocused ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {sec.title}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleChecklistSection(sec)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={isChecked ? colors.topicTitle : colors.intro}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={[styles.separatorLine, { backgroundColor: colors.separator }]} />

          <View style={styles.checklistFooterRow}>
            <Text style={[styles.revisionChecklistLabel, { color: colors.checklistLabel }]}>
              REVISION CHECKLIST · {completedChecklistCount}/{blueprint.sections.length}
            </Text>
            <Text style={[styles.revisionSubCount, { color: colors.topicTitle }]}>
              {masteredCount}/{totalItemsCount} takeaways reviewed
            </Text>
          </View>
        </View>

        {/* 4. WEBSITE-INSPIRED SEARCH, FILTER PILLS & RAPID REVIEW BAR */}
        <View style={styles.controlsBlock}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.searchBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="search-outline" size={16} color={colors.intro} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search key terms, enzymes, definitions..."
              placeholderTextColor={colors.intro}
              style={[styles.searchInput, { color: colors.pageTitle }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={17} color={colors.intro} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            {(
              [
                { id: 'all', label: 'All', count: totalItemsCount, star: false },
                { id: 'high_yield', label: 'PYQ High-yield', count: highYieldItems.length, star: true },
                { id: 'unreviewed', label: 'To review', count: totalItemsCount - masteredCount, star: false },
                { id: 'mastered', label: 'Reviewed', count: masteredCount, star: false },
              ] as const
            ).map((pill) => {
              const active = filterMode === pill.id;
              return (
                <TouchableOpacity
                  key={pill.id}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? colors.pillActiveBg : colors.pillBg,
                      borderColor: active ? colors.pillActiveBorder : colors.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilterMode(pill.id);
                  }}
                  activeOpacity={0.8}
                >
                  {pill.star && <Text style={{ color: colors.topicTitle, fontSize: 11 }}>★</Text>}
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: active ? colors.studyGuideHeading : colors.intro,
                        fontWeight: active ? '700' : '600',
                      },
                    ]}
                  >
                    {pill.label} · {pill.count}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.rapidReviewPillBtn, { backgroundColor: colors.badgeSolidBg }]}
              onPress={handleStartRapidReview}
              activeOpacity={0.85}
            >
              <Text style={styles.rapidReviewPillText}>⚡ Rapid review</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {isLoading && (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={colors.topicTitle} />
          </View>
        )}

        {/* 5. SECTION CARDS (Figma 01 Tripartite Card + 02 Layers Table + Website Takeaway Cards) */}
        {filteredSections.length === 0 ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                alignItems: 'center',
                paddingVertical: 28,
              },
            ]}
          >
            <Ionicons name="search-outline" size={28} color={colors.intro} />
            <Text style={[styles.emptyTitle, { color: colors.pageTitle }]}>
              No matching takeaways found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.intro }]}>
              Try clearing your search or switching the filter pill above.
            </Text>
            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: colors.badgeSolidBg }]}
              onPress={() => {
                setSearchQuery('');
                setFilterMode('all');
                setSelectedSectionId('all');
              }}
            >
              <Text style={styles.resetBtnText}>Reset filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredSections.map((section, sIdx) => {
            const isPrimarySection = section.index === 1;
            const isSecChecked = Boolean(checkedSections[section.id]);
            const selectedRegion = section.regionsTriplet?.find((r) => r.id === activeRegionId);

            return (
              <View
                key={section.id}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                {/* Section Header Row (Matches Figma 01 / 02 Headers) */}
                <View style={styles.sectionHeaderRow}>
                  <View
                    style={[
                      styles.sectionBadgeBig,
                      {
                        backgroundColor: isPrimarySection
                          ? colors.badgeSolidBg
                          : colors.badgeSoftBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionBadgeBigText,
                        {
                          color: isPrimarySection
                            ? colors.badgeSolidText
                            : colors.badgeSoftText,
                        },
                      ]}
                    >
                      {section.numFormatted}
                    </Text>
                  </View>

                  <Text
                    style={[styles.sectionHeadingTitle, { color: colors.pageTitle }]}
                    numberOfLines={2}
                  >
                    {section.title}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleToggleChecklistSection(section)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isSecChecked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSecChecked ? colors.topicTitle : colors.intro}
                    />
                  </TouchableOpacity>
                </View>

                {section.subSectionTag && (
                  <Text style={[styles.subSectionTag, { color: colors.subSectionTag }]}>
                    {section.subSectionTag}
                  </Text>
                )}

                {section.introText && (
                  <Text style={[styles.sectionIntro, { color: colors.intro }]}>
                    {section.introText}
                  </Text>
                )}

                {/* FIGMA SECTION 01: 3 Sub-regions Triplet Cards */}
                {section.regionsTriplet && !searchQuery.trim() && filterMode === 'all' && (
                  <View style={styles.tripletWrapper}>
                    <View style={styles.regionsRow}>
                      {section.regionsTriplet.map((reg) => {
                        const isActive = activeRegionId === reg.id;
                        return (
                          <TouchableOpacity
                            key={reg.id}
                            style={[
                              styles.regionCard,
                              {
                                backgroundColor: colors.regionCardBg,
                                borderColor: isActive
                                  ? colors.regionCardActiveBorder
                                  : colors.regionCardBorder,
                                borderWidth: isActive ? 1.5 : 1,
                              },
                            ]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setActiveRegionId(isActive ? null : reg.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.regionLabel, { color: colors.regionLabel }]}>
                              {reg.tag}
                            </Text>
                            <Text
                              style={[styles.regionName, { color: colors.regionName }]}
                              numberOfLines={1}
                            >
                              {reg.name}
                            </Text>
                            <Text style={[styles.regionNote, { color: colors.regionNote }]}>
                              {reg.note}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Interactive Expanded Detail when a Region Card is Tapped */}
                    {selectedRegion && (
                      <View
                        style={[
                          styles.regionDetailBox,
                          {
                            backgroundColor: colors.regionCardBg,
                            borderColor: colors.regionCardActiveBorder,
                          },
                        ]}
                      >
                        <View style={styles.regionDetailHeader}>
                          <Text style={[styles.regionDetailTitle, { color: colors.studyGuideHeading }]}>
                            {selectedRegion.tag} · {selectedRegion.name}
                          </Text>
                          <Text style={[styles.pyqMiniPill, { color: colors.topicTitle }]}>
                            ★ High-Yield
                          </Text>
                        </View>
                        <Text style={[styles.regionDetailBody, { color: colors.pageTitle }]}>
                          {selectedRegion.detail}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* FIGMA SECTION 02: 4 Layers Comparative Table */}
                {section.layersTable && !searchQuery.trim() && filterMode === 'all' && (
                  <View style={styles.layersTable}>
                    {section.layersTable.map((layer, lIdx) => {
                      const isExpanded = activeLayerIdx === lIdx;
                      return (
                        <TouchableOpacity
                          key={layer.num}
                          style={[
                            styles.layerRowContainer,
                            isExpanded && {
                              backgroundColor: colors.regionCardBg,
                              borderRadius: 10,
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                            },
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setActiveLayerIdx(isExpanded ? null : lIdx);
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.layerRow}>
                            <Text style={[styles.layerIndex, { color: colors.layerIndex }]}>
                              {layer.num}
                            </Text>
                            <Text style={[styles.layerName, { color: colors.layerName }]}>
                              {layer.name}
                            </Text>
                            <Text style={[styles.layerFunction, { color: colors.layerFunction }]}>
                              {layer.func}
                            </Text>
                          </View>
                          {isExpanded && (
                            <Text style={[styles.layerDetailText, { color: colors.intro }]}>
                              {layer.detail}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* WEBSITE-INSPIRED TAKEAWAY CARDS */}
                {section.items.length > 0 && (
                  <View
                    style={[
                      styles.takeawayItemsList,
                      (section.regionsTriplet || section.layersTable) && { marginTop: 14 },
                    ]}
                  >
                    {section.items.map((item) => {
                      const isMastered = Boolean(masteredIds[item.id]);
                      const isExpanded = Boolean(expandedNotes[item.id]);
                      const hasExtra = Boolean(item.extendedNote) || item.body.length > item.summaryBody.length;

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.takeawayCard,
                            {
                              backgroundColor: item.isHighYield
                                ? colors.highYieldCardBg
                                : colors.screenBg,
                              borderColor: item.isHighYield
                                ? colors.highYieldCardBorder
                                : colors.cardBorder,
                              opacity: isMastered ? 0.85 : 1,
                            },
                          ]}
                        >
                          <View style={styles.takeawayTopRow}>
                            <View style={styles.takeawayTitleWrap}>
                              <Text style={[styles.takeawayLead, { color: colors.pageTitle }]}>
                                {item.lead}
                              </Text>
                              {item.isHighYield && (
                                <View
                                  style={[
                                    styles.pyqBadge,
                                    { backgroundColor: colors.pyqBadgeBg },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.pyqBadgeText,
                                      { color: colors.pyqBadgeText },
                                    ]}
                                  >
                                    {item.pyqBadge || '★ PYQ-repeat'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <TouchableOpacity
                              onPress={() => handleToggleItemMastered(item, section)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons
                                name={isMastered ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={isMastered ? colors.topicTitle : colors.intro}
                              />
                            </TouchableOpacity>
                          </View>

                          <Text style={[styles.takeawayBody, { color: colors.intro }]}>
                            {isExpanded ? item.body : item.summaryBody}
                          </Text>

                          {isExpanded && item.extendedNote && (
                            <View
                              style={[
                                styles.extendedNoteBox,
                                {
                                  backgroundColor: colors.regionCardBg,
                                  borderLeftColor: colors.topicTitle,
                                },
                              ]}
                            >
                              <Text style={[styles.extendedNoteText, { color: colors.pageTitle }]}>
                                {item.extendedNote}
                              </Text>
                            </View>
                          )}

                          {hasExtra && (
                            <TouchableOpacity
                              onPress={() => handleToggleNoteExpand(item.id)}
                              style={styles.fullNoteBtn}
                            >
                              <Text style={[styles.fullNoteBtnText, { color: colors.topicTitle }]}>
                                {isExpanded ? 'Hide note ↑' : 'Full note ↓'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* 6. 5-MIN REVISION ROUTE BANNER (Matches Figma PNG + Launches Rapid Review) */}
        <TouchableOpacity
          style={[
            styles.revisionRouteBanner,
            {
              backgroundColor: colors.routeBannerBg,
              borderColor: colors.routeBannerBorder,
            },
          ]}
          onPress={handleStartRapidReview}
          activeOpacity={0.85}
        >
          <View style={styles.routeBannerHeader}>
            <Text style={[styles.revisionRouteTitle, { color: colors.routeTitle }]}>
              5-MIN REVISION ROUTE
            </Text>
            <Text style={[styles.routeStartLink, { color: colors.topicTitle }]}>
              Start rapid review →
            </Text>
          </View>
          <Text style={[styles.revisionRouteText, { color: colors.routeText }]}>
            {blueprint.routeSteps[0]}     ·     {blueprint.routeSteps[1]}
          </Text>
          <Text style={[styles.revisionRouteText2, { color: colors.routeText }]}>
            {blueprint.routeSteps[2]}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 7. WEBSITE-INSPIRED INTERACTIVE RAPID REVIEW MODAL */}
      <Modal
        visible={rapidReviewOpen && rapidDeck.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setRapidReviewOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.rapidModalCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {(() => {
              const currentCard = rapidDeck[rapidReviewIndex] || rapidDeck[0];
              if (!currentCard) return null;
              const isCardMastered = Boolean(masteredIds[currentCard.id]);
              const parentSec = blueprint.sections.find(
                (s) => s.index === currentCard.sectionIndex
              ) || blueprint.sections[0];

              return (
                <>
                  <View style={styles.rapidModalHeader}>
                    <View style={[styles.pyqBadge, { backgroundColor: colors.pyqBadgeBg }]}>
                      <Text style={[styles.pyqBadgeText, { color: colors.pyqBadgeText }]}>
                        ⚡ Rapid Review · {rapidReviewIndex + 1} of {rapidDeck.length}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setRapidReviewOpen(false)}>
                      <Ionicons name="close" size={22} color={colors.intro} />
                    </TouchableOpacity>
                  </View>

                  {currentCard.sectionTitle && (
                    <Text style={[styles.rapidSectionEyebrow, { color: colors.topicTitle }]}>
                      {currentCard.sectionTitle.toUpperCase()}
                    </Text>
                  )}

                  <Text style={[styles.rapidCardLead, { color: colors.pageTitle }]}>
                    {currentCard.lead}
                  </Text>

                  <Text style={[styles.rapidCardBody, { color: colors.intro }]}>
                    {currentCard.body}
                  </Text>

                  {currentCard.extendedNote && (
                    <View
                      style={[
                        styles.extendedNoteBox,
                        {
                          backgroundColor: colors.regionCardBg,
                          borderLeftColor: colors.topicTitle,
                        },
                      ]}
                    >
                      <Text style={[styles.extendedNoteText, { color: colors.pageTitle }]}>
                        {currentCard.extendedNote}
                      </Text>
                    </View>
                  )}

                  <View style={styles.rapidModalFooter}>
                    <TouchableOpacity
                      style={[
                        styles.rapidMarkBtn,
                        {
                          backgroundColor: isCardMastered
                            ? colors.badgeSolidBg
                            : colors.sectionNumBg,
                        },
                      ]}
                      onPress={() => handleToggleItemMastered(currentCard, parentSec)}
                    >
                      <Ionicons
                        name={isCardMastered ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={isCardMastered ? '#FFFFFF' : colors.sectionNumText}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: isCardMastered ? '#FFFFFF' : colors.sectionNumText,
                        }}
                      >
                        {isCardMastered ? 'Reviewed' : 'Mark reviewed'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.rapidNavBtns}>
                      <TouchableOpacity
                        style={[
                          styles.rapidArrowBtn,
                          { borderColor: colors.cardBorder },
                          rapidReviewIndex === 0 && { opacity: 0.35 },
                        ]}
                        disabled={rapidReviewIndex === 0}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setRapidReviewIndex((i) => Math.max(0, i - 1));
                        }}
                      >
                        <Ionicons name="chevron-back" size={18} color={colors.pageTitle} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.rapidNextBtn,
                          { backgroundColor: colors.badgeSolidBg },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          if (rapidReviewIndex < rapidDeck.length - 1) {
                            setRapidReviewIndex((i) => i + 1);
                          } else {
                            setRapidReviewOpen(false);
                          }
                        }}
                      >
                        <Text style={styles.rapidNextBtnText}>
                          {rapidReviewIndex < rapidDeck.length - 1 ? 'Next →' : 'Done ✓'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 44,
  },
  tabletContainer: {
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
  },
  titleSection: {
    marginBottom: 16,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  timeBadge: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  intro: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 25,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  studyGuideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  studyGuideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studyGuideHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  showAllLink: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  studyGuideList: {
    flexDirection: 'column',
    gap: 10,
  },
  studyGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  studyGuideTitleBtn: {
    flex: 1,
  },
  sectionLinkTitle: {
    fontSize: 13.5,
  },
  separatorLine: {
    height: 1,
    marginVertical: 12,
  },
  checklistFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revisionChecklistLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  revisionSubCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  controlsBlock: {
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  rapidReviewPillBtn: {
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidReviewPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingInline: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionBadgeBig: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeBigText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  sectionHeadingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  subSectionTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionIntro: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  tripletWrapper: {
    gap: 10,
  },
  regionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  regionCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 10,
    padding: 9,
    justifyContent: 'space-between',
  },
  regionLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  regionName: {
    fontSize: 11.5,
    fontWeight: '800',
    marginVertical: 2,
  },
  regionNote: {
    fontSize: 8.5,
    fontWeight: '500',
    lineHeight: 12,
  },
  regionDetailBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  regionDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regionDetailTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  pyqMiniPill: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  regionDetailBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  layersTable: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 6,
  },
  layerRowContainer: {
    gap: 4,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  layerIndex: {
    width: 26,
    fontSize: 11,
    fontWeight: '800',
  },
  layerName: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
  },
  layerFunction: {
    width: 130,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  layerDetailText: {
    fontSize: 11.5,
    lineHeight: 17,
    marginLeft: 26,
    marginTop: 2,
  },
  takeawayItemsList: {
    gap: 10,
  },
  takeawayCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 13,
    gap: 6,
  },
  takeawayTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  takeawayTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  takeawayLead: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  pyqBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pyqBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  takeawayBody: {
    fontSize: 12.5,
    lineHeight: 18.5,
  },
  extendedNoteBox: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 4,
  },
  extendedNoteText: {
    fontSize: 12,
    lineHeight: 17.5,
  },
  fullNoteBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  fullNoteBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  revisionRouteBanner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  routeBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  revisionRouteTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeStartLink: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  revisionRouteText: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  revisionRouteText2: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 20, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rapidModalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  rapidModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rapidSectionEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rapidCardLead: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  rapidCardBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  rapidModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rapidMarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rapidNavBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rapidArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidNextBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
