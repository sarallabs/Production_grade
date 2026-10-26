import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export type MarkType = '2M' | '5M' | '10M';
export type AnswerMode = 'short' | 'long';

export interface PYQItem {
  id: number;
  questionNumber: number;
  questionPrompt: string;
  chapterText: string;
  year: number;
  marks: MarkType;
  shortAnswerLines: string[];
  longAnswerLines: string[];
  sosTip: string;
}

const PYQ_DATA: PYQItem[] = [
  {
    id: 1,
    questionNumber: 1,
    questionPrompt:
      'Q1)  Name the three regions of the insect alimentary canal and state the embryonic germ layer from which each originates.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2023,
    marks: '2M',
    shortAnswerLines: [
      'The insect alimentary canal is a tube running from mouth to anus and has three regions:',
      '1. Foregut (stomodaeum) — ectoderm; lined with cuticular intima.',
      '2. Midgut (mesenteron) — endoderm; no cuticular intima.',
      '3. Hindgut (proctodaeum) — ectoderm; cuticular intima is shed at each moult.',
    ],
    longAnswerLines: [
      'The insect alimentary canal is differentiated into three principal morpho-functional regions:',
      '• Foregut (Stomodaeum): Develops from anterior embryonic ectodermal invagination. It is lined internally with cuticular intima continuous with the body wall exoskeleton, which is shed at each ecdysis.',
      '• Midgut (Mesenteron / Ventriculus): Arises exclusively from embryonic endoderm. It completely lacks a cuticular intima, exposing specialized microvillar enterocytes for digestive enzyme secretion and active nutrient absorption.',
      '• Hindgut (Proctodaeum): Originates from posterior ectodermal invagination. It is also lined with cuticular intima that is moulted with each larval/nymphal instar, terminating at the anus.',
    ],
    sosTip: 'Foregut & Hindgut = Ectoderm (sheds cuticular intima at moult). Midgut = Endoderm (no cuticle).',
  },
  {
    id: 2,
    questionNumber: 2,
    questionPrompt: 'Q2)  What is the peritrophic membrane? Mention its functions.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2022,
    marks: '2M',
    shortAnswerLines: [
      'A semi-permeable, non-cellular sheath made of chitin and proteins surrounds the food bolus in the midgut.',
      'Functions:',
      '• Protects midgut cells from abrasion by coarse food particles.',
      '• Acts as a barrier against pathogens, toxins and parasites.',
      '• Allows enzymes and nutrients to pass while retaining large particles.',
      '• Helps compartmentalise digestion and recycle enzymes.',
    ],
    longAnswerLines: [
      'The peritrophic membrane (PM) is a non-cellular tubular sleeve composed of a chitin-protein lattice secreted into the midgut lumen to encase the ingested food bolus.',
      'Types of Formation:',
      '• Type I: Delaminated continuously along the entire length of the ventricular epithelium (found in Orthoptera, Coleoptera, Lepidopteran larvae).',
      '• Type II: Formed by an annular ring of specialized cells at the anterior cardiac valve (Diptera, Dermaptera).',
      'Key Physiological Functions:',
      '1. Mechanical Protection: Prevents abrasive plant fibers (e.g. silica phytoliths) from shearing fragile enterocyte microvilli.',
      '2. Pathogen Defense: Blocks viral virions, microsporidian spores, and bacterial toxins from direct epithelial contact.',
      '3. Enzyme Conservation: Establishes countercurrent endo- and ecto-peritrophic circulation, allowing digestive enzymes to be recycled.',
    ],
    sosTip: 'Type I = delaminated throughout midgut; Type II = cardiac ring. Protects, filters & compartmentalizes.',
  },
  {
    id: 3,
    questionNumber: 3,
    questionPrompt:
      'Q3)  Describe the structure and functions of the proventriculus (gizzard) in insects.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2024,
    marks: '5M',
    shortAnswerLines: [
      'The proventriculus is a muscular, cuticle-lined region of the foregut.',
      'Its teeth and plates grind food, regulate passage into the midgut, and filter coarse particles.',
    ],
    longAnswerLines: [
      'The proventriculus (gizzard) is the terminal, specialized chamber of the foregut immediately preceding the midgut.',
      'Histological Structure:',
      '• Wall Architecture: Encased by extraordinarily thick layers of circular muscle fibers.',
      '• Dental Armature: Internal cuticular intima is raised into 6 longitudinal primary dental folds bearing sharp, heavily sclerotized denticles or teeth.',
      '• Pulvillar Cushions: Sieve cushions between teeth covered with dense, backward-pointing micro-trichia.',
      'Core Functions:',
      '1. Mechanical Trituration: Pulverizes coarse ingested plant tissues into micro-particles (<100 μm).',
      '2. Straining Sieve: Prevents unground, abrasive food fragments from penetrating the midgut.',
      '3. Valvular Regurgitation Prevention: Contains the stomodaeal cardiac valve projecting into the ventriculus to block retrograde food flow.',
    ],
    sosTip: '6 longitudinal folds with chitinous teeth + circular muscles = grinding and cardiac valve = regulation.',
  },
  {
    id: 4,
    questionNumber: 4,
    questionPrompt:
      'Q4)  What are Malpighian tubules? State their primary osmoregulatory function.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2023,
    marks: '2M',
    shortAnswerLines: [
      'Malpighian tubules are slender, blind-ending excretory tubes located at the junction of the midgut and hindgut.',
      'Functions:',
      '• Extract metabolic waste (uric acid) and excess ions from abdominal hemolymph.',
      '• Precipitate insoluble uric acid to conserve water.',
    ],
    longAnswerLines: [
      'Malpighian tubules are the primary excretory and osmoregulatory organs of insects, arising as blind tubular diverticula at the pyloric junction between midgut and hindgut.',
      'Mechanism of Action:',
      '• Active Transport: Distal tubule cells pump K+ and Na+ into the lumen, drawing water and urate salts isotonically from hemolymph.',
      '• Acidification: In the proximal tubule, pH drops, causing soluble potassium urate to precipitate as insoluble uric acid crystals, releasing free water.',
      '• Rectal Recycling: The rectal complex reabsorbs up to 95% of water, producing dry uric acid fecal pellets essential for terrestrial survival.',
    ],
    sosTip: 'Located at midgut-hindgut junction. Converts nitrogenous waste into dry uric acid to save water.',
  },
  {
    id: 5,
    questionNumber: 5,
    questionPrompt:
      'Q5)  Explain the histological wall layers of the insect gut from lumen outward.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2021,
    marks: '5M',
    shortAnswerLines: [
      'From lumen outward, the alimentary wall consists of:',
      '1. Cuticular intima (foregut and hindgut only).',
      '2. Single-layered epithelial cells on a basement membrane.',
      '3. Circular muscle layer (peristaltic contraction).',
      '4. Longitudinal muscle layer (lengthwise movement).',
      '5. Outer peritoneal membrane with tracheoles and nerves.',
    ],
    longAnswerLines: [
      'The insect gut wall demonstrates five concentric histological coats (from inner lumen outward):',
      '1. Cuticular Intima: Chitinous layer present in stomodaeum and proctodaeum; replaced by the peritrophic membrane in the mesenteron.',
      '2. Epithelium: Single-layered columnar or cuboidal enterocytes with apical microvilli resting on an amorphous basement membrane.',
      '3. Circular Muscle: Concentric muscle rings that produce peristaltic constriction.',
      '4. Longitudinal Muscle: Longitudinally arranged fibers responsible for shortening the tube.',
      '• Muscle discrepancy: Foregut has inner longitudinal and outer circular; Midgut has inner circular and outer longitudinal muscles.',
      '5. Peritoneal Membrane: Connective tissue coating richly supplied with tracheoles providing oxygen to gut tissues.',
    ],
    sosTip: 'Lumen outward: Cuticle (fore/hind) → Epithelium → Circular Muscle → Longitudinal Muscle → Peritoneal.',
  },
  {
    id: 6,
    questionNumber: 6,
    questionPrompt:
      'Q6)  Give a detailed account of the insect digestive system with special reference to the midgut.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2024,
    marks: '10M',
    shortAnswerLines: [
      'The midgut (mesenteron) is the primary site of biochemical digestion and nutrient absorption.',
      '• Contains 2–8 blind gastric caeca to increase surface area.',
      '• Epithelium consists of columnar digestive cells, regenerative cells (nidi), and goblet cells.',
      '• Secretes amylases, proteases, lipases, and the peritrophic membrane.',
    ],
    longAnswerLines: [
      'The insect midgut (mesenteron/ventriculus) is the metabolic core of the alimentary canal derived from embryonic endoderm:',
      '1. Gross Anatomy & Caeca: Tubular chamber bordered anteriorly by stomodaeal cardiac valve and posteriorly by pyloric sphincter. Possesses 2–8 diverticular gastric caeca harboring symbiotic microflora and multiplying surface area.',
      '2. Epithelial Cell Types:',
      '• Columnar Cells: Predominant enterocytes with microvillar brush borders secreting enzymes and absorbing hydrolysates.',
      '• Regenerative Nidi: Basal stem cell clusters that continually divide to replenish shed columnar cells during active feeding.',
      '• Endocrine Cells: Dispersed neurosecretory cells releasing peptide hormones regulating gut motility and enzyme output.',
      '3. Secretory Mechanism: Merocrine (exocytosis) and apocrine secretion release amylases, invertases, trypsin-like proteases, and lipases.',
      '4. Peritrophic Matrix Integration: Directs unabsorbed bulk material backward while allowing solubilized nutrients to access brush borders.',
    ],
    sosTip: 'Midgut = endoderm, gastric caeca, columnar enterocytes + regenerative nidi, peritrophic matrix.',
  },
  {
    id: 7,
    questionNumber: 7,
    questionPrompt:
      'Q7)  Distinguish between stomodaeal and proctodaeal cuticular intima.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2020,
    marks: '2M',
    shortAnswerLines: [
      '• Stomodaeal intima: Tough, thick, and sclerotized into proventricular teeth for mechanical grinding.',
      '• Proctodaeal intima: Thinner and highly permeable to water and electrolytes at the rectal papillae.',
    ],
    longAnswerLines: [
      'While both stomodaeum and proctodaeum share an ectodermal origin with cuticular lining, their intima exhibits distinct structural adaptations:',
      '• Stomodaeum: Sclerotized and impermeable. In the gizzard, it thickens into 6 heavy primary teeth for mechanical pulverization of coarse foliage.',
      '• Proctodaeum: Thin and flexible. Over the 6 rectal pads/papillae, it forms an ultra-thin, hydrophilic cuticular layer that permits rapid passage of water, ions, and amino acids under active suction from sub-epithelial ionic pumps.',
    ],
    sosTip: 'Stomodaeal = thick/grinding teeth; Proctodaeal = thin/permeable for water reabsorption.',
  },
  {
    id: 8,
    questionNumber: 8,
    questionPrompt:
      'Q8)  Describe the structure and function of gastric caeca in nutrient absorption.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2022,
    marks: '5M',
    shortAnswerLines: [
      'Gastric caeca are finger-like diverticula situated at the anterior boundary of the midgut.',
      '• Greatly amplify the luminal surface area for absorption.',
      '• House symbiotic micro-organisms in wood- and plant-feeding insects.',
      '• Actively secrete digestive enzymes into the cardiac zone.',
    ],
    longAnswerLines: [
      'Gastric (hepatic) caeca are blind-ending evaginations arising circularly around the anterior extremity of the midgut:',
      '1. Morphology: Numbers vary from 2 (Diptera) to 6 or 8 (Orthoptera e.g., locusts and grasshoppers).',
      '2. Functional Roles:',
      '• Surface Amplification: Increases effective absorptive surface area multi-fold within the confined abdominal hemocoel.',
      '• Enzyme Secretion: Columnar lining releases specialized hydrolytic enzymes directly onto food exiting the gizzard.',
      '• Fluid Cycling: Generates anteriorly directed fluid currents in the ectoperitrophic space, returning enzymes toward the proventriculus.',
      '• Symbiont Reservoir: Houses vital intracellular or luminal bacterial symbionts producing vitamins and cellulases.',
    ],
    sosTip: '2-8 blind pouches at anterior midgut; amplifies absorptive surface and secretes enzymes.',
  },
  {
    id: 9,
    questionNumber: 9,
    questionPrompt:
      'Q9)  Explain water and osmoregulation in the rectum and rectal papillae.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2023,
    marks: '5M',
    shortAnswerLines: [
      'The insect rectum possesses 6 specialized rectal pads/papillae.',
      '• Active Na+/K+ pumps draw water from fecal matter into intercellular channels.',
      '• Recovers up to 95% of water, producing dry uric acid pellets.',
    ],
    longAnswerLines: [
      'The rectum is the crucial organ of terrestrial insect water economy:',
      '1. Rectal Pads (Papillae): Six longitudinal swellings projecting into the rectal lumen, composed of large, columnar epithelial cells with deeply infolded lateral membranes.',
      '2. Local Osmotic Gradient Model (Wall & Oschman):',
      '• Na+/K+ ATPases actively transport ions into narrow lateral intercellular spaces, creating local hypertonicity.',
      '• Water is drawn osmotically from the rectal lumen across the thin cuticular intima.',
      '• Ions are recycled back to hemolymph while water is recovered, enabling insects to extract water even against concentrated feces.',
    ],
    sosTip: '6 rectal pads with ion pumps create local osmotic gradient, reabsorbing 95% water.',
  },
  {
    id: 10,
    questionNumber: 10,
    questionPrompt:
      'Q10) Define filter chamber and name an insect order possessing it.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2021,
    marks: '2M',
    shortAnswerLines: [
      'A filter chamber is a structural modification where anterior and posterior gut regions are bound together.',
      '• Allows excess water to bypass the digestive midgut directly into the hindgut.',
      '• Found in sap-sucking insects of the Order Hemiptera (e.g. leafhoppers, aphids).',
    ],
    longAnswerLines: [
      'A filter chamber is an anatomical specialization of the alimentary canal in fluid-feeding Homopteran insects (Order: Hemiptera):',
      '• Structure: The anterior midgut forms a thin-walled dilated loop closely wrapped around the posterior midgut and initial segments of Malpighian tubules inside a common muscular sheath.',
      '• Function: Since plant sap is 90–95% water and dilute in amino acids, excess water shunts directly by osmosis from anterior to posterior gut, concentrating nutrients for midgut enzymes without diluting them.',
    ],
    sosTip: 'Filter chamber = Hemiptera; water shunts directly from anterior to posterior gut to concentrate sap.',
  },
  {
    id: 11,
    questionNumber: 11,
    questionPrompt:
      'Q11) Write short notes on digestive enzymes secreted by the midgut epithelium.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2020,
    marks: '5M',
    shortAnswerLines: [
      'Midgut enzymes hydrolyze carbohydrates, proteins, and lipids:',
      '• Carbohydrases: Amylase (starch), Invertase (sucrose), Maltase (maltose).',
      '• Proteases: Trypsin- and chymotrypsin-like endopeptidases.',
      '• Lipases: Hydrolyze triglycerides into free fatty acids.',
    ],
    longAnswerLines: [
      'The midgut enterocytes synthesize and secrete diverse hydrolases tailored to the insect’s feeding regime:',
      '1. Carbohydrases: High activity in phytophagous insects. α-Amylase digests starch; Invertase (sucrase) cleaves sucrose into glucose and fructose; Trehalase hydrolyzes trehalose.',
      '2. Proteases: Predominantly serine proteases (Trypsin and Chymotrypsin) functioning at alkaline midgut pH (8.0–10.0 in Lepidoptera to prevent tannin precipitation). Aminopeptidases complete terminal hydrolysis.',
      '3. Lipases & Esterases: Cleave dietary triacylglycerols and sterol esters into monoacylglycerols and free fatty acids for microvillar absorption.',
    ],
    sosTip: 'Amylase (carbs), Trypsin (proteins), Lipase (fats) functioning under species-specific gut pH.',
  },
  {
    id: 12,
    questionNumber: 12,
    questionPrompt:
      'Q12) Differentiate between Type I and Type II peritrophic membranes.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2024,
    marks: '2M',
    shortAnswerLines: [
      '• Type I PM: Delaminated from the entire midgut epithelial surface (e.g. Orthoptera, Coleoptera, Lepidoptera).',
      '• Type II PM: Produced as a continuous sleeve by an anterior ring of cardiac valve cells (e.g. Diptera, Dermaptera).',
    ],
    longAnswerLines: [
      'Key differences between PM Types:',
      '1. Origin of Secretion:',
      '• Type I is delaminated from microvilli across the whole length of the ventricular epithelium in response to food ingestion.',
      '• Type II is continually synthesized by an annular group of specialized cells located at the stomodaeal invagination (cardiac valve).',
      '2. Taxonomic Occurrence:',
      '• Type I: Grasshoppers, beetles, caterpillars, adult bees.',
      '• Type II: Adult flies (Diptera), earwigs (Dermaptera), and tsetse flies.',
    ],
    sosTip: 'Type I = entire midgut surface; Type II = specialized cardiac annular ring.',
  },
  {
    id: 13,
    questionNumber: 13,
    questionPrompt:
      'Q13) What is cryptonephridial arrangement and its significance?',
    chapterText: 'Ch. 1 · Digestive',
    year: 2022,
    marks: '2M',
    shortAnswerLines: [
      'Cryptonephridial system: Distal ends of Malpighian tubules are bound closely to the rectal wall under a common perinephric membrane.',
      '• Extracts virtually 100% moisture from feces (common in desert beetles and mealworms).',
    ],
    longAnswerLines: [
      'The cryptonephridial (or cryptonephric) complex is a supreme xerophytic water-conservation adaptation:',
      '• Anatomical Architecture: The terminal blind ends of the Malpighian tubules re-apply themselves intimately against the outer surface of the rectal epithelial pads, enclosed beneath a non-cellular perinephric membrane.',
      '• Physiological Significance: Enables tenebrionid beetles and mealworms (Tenebrio molitor) to absorb water vapor directly from sub-saturated air or fecal pellets, excreting dry powder feces with zero water waste.',
    ],
    sosTip: 'Malpighian tubules attached to rectal wall = extracts 100% water from feces in dry environments.',
  },
  {
    id: 14,
    questionNumber: 14,
    questionPrompt:
      'Q14) Discuss physiological adaptations of the alimentary canal in fluid feeders vs solid feeders.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2023,
    marks: '10M',
    shortAnswerLines: [
      '• Solid Feeders: Heavy proventriculus with grinding teeth; prominent crop for storage; robust Type I peritrophic membrane.',
      '• Fluid Feeders: Reduced or absent gizzard teeth; muscular suction cibarial pump; diverticular crop; filter chambers in Hemiptera.',
    ],
    longAnswerLines: [
      'Dietary physical consistency dictates profound morphological divergence in insect digestive architecture:',
      '1. Solid Herbivores & Scavengers (e.g. Locusts, Cockroaches):',
      '• Mandibulate pre-oral cavity for mastication.',
      '• Highly sclerotized proventricular gizzard armed with 6 primary cuticular teeth for mechanical trituration.',
      '• Multilayered Type I peritrophic membrane protecting against sharp cellulose fibers.',
      '2. Fluid & Sap Feeders (e.g. Hemiptera, Lepidoptera, Diptera):',
      '• Cibarial-pharyngeal sucking pump driven by powerful clypeal dilator muscles.',
      '• Gizzard reduced to a simple one-way cardiac valve.',
      '• Hemipterans feature filter chambers to bypass copious water directly to hindgut.',
      '• Adult Lepidoptera and Diptera maintain a blind diverticular crop for storing liquid nectar.',
    ],
    sosTip: 'Solid feeders have grinding proventriculus & thick PM; liquid feeders have sucking pump & filter chamber.',
  },
  {
    id: 15,
    questionNumber: 15,
    questionPrompt:
      'Q15) Explain the role of cardiac and pyloric sphincters in food transit.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2021,
    marks: '2M',
    shortAnswerLines: [
      '• Cardiac Sphincter (Stomodaeal valve): Regulates one-way food flow from foregut into midgut; blocks regurgitation.',
      '• Pyloric Sphincter: Controls transit of digesta from midgut into hindgut and guards Malpighian tubule inlets.',
    ],
    longAnswerLines: [
      'Internal muscular valves ensure unidirectional movement of digesta:',
      '1. Cardiac Valve (Stomodaeal Invagination): An annular fold of foregut wall projecting into the anterior midgut lumen, preventing backward regurgitation of abrasive bolus.',
      '2. Pyloric Valve: A circular muscular sphincter demarcating the junction of mesenteron and proctodaeum, timing the evacuation of processed chyme into the ileum while protecting Malpighian tubule orifices.',
    ],
    sosTip: 'Cardiac = foregut to midgut (stops regurgitation); Pyloric = midgut to hindgut.',
  },
  {
    id: 16,
    questionNumber: 16,
    questionPrompt:
      'Q16) Describe the pharynx and cibarial pump mechanism in piercing-sucking insects.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2024,
    marks: '5M',
    shortAnswerLines: [
      'The cibarial pump is a suction apparatus inside the pre-oral cavity.',
      '• Powerful clypeal dilator muscles expand the cibarium, sucking liquid food up the food canal.',
      '• Elastic recoil pushes sap/blood through the pharynx into the esophagus.',
    ],
    longAnswerLines: [
      'In piercing-sucking insects (e.g., Hemiptera, mosquitoes):',
      '• Cibarium: The preoral cavity bounded anteriorly by clypeus and posteriorly by hypopharynx.',
      '• Pump Mechanism: Powerful dilator muscles originating on the facial clypeus insert into the flexible anterior wall of the cibarium. Contraction dilates the chamber creating negative pressure, sucking plant sap or blood through the stylet food canal. Relaxation compresses the chamber, propelling the fluid past the pharyngeal valve into the esophagus.',
    ],
    sosTip: 'Clypeal dilator muscles expand cibarium creating vacuum to draw fluid through stylets.',
  },
  {
    id: 17,
    questionNumber: 17,
    questionPrompt:
      'Q17) What are regenerative cells (nidi) in the midgut?',
    chapterText: 'Ch. 1 · Digestive',
    year: 2020,
    marks: '2M',
    shortAnswerLines: [
      'Regenerative cells are stem cells clustered in nests (nidi) or crypts along the midgut basement membrane.',
      '• Continuously divide to replace damaged or worn columnar digestive cells.',
    ],
    longAnswerLines: [
      'Because the midgut epithelium lacks protective cuticular intima, enterocytes undergo rapid senescence during intense digestive cycles:',
      '• Morphology: Basal embryonic-like stem cells grouped in clusters called nidi (in Orthoptera/Coleoptera) or crypts.',
      '• Function: Mitotically active cells that differentiate into mature columnar enterocytes and endocrine cells, renewing the entire midgut epithelial lining every few days.',
    ],
    sosTip: 'Basal stem cell clusters (nidi) that multiply to replace worn-out midgut digestive cells.',
  },
  {
    id: 18,
    questionNumber: 18,
    questionPrompt:
      'Q18) Explain the function of the salivary glands (labial glands).',
    chapterText: 'Ch. 1 · Digestive',
    year: 2023,
    marks: '2M',
    shortAnswerLines: [
      'Paired labial glands in the thorax secrete saliva into the preoral cavity.',
      '• Lubricates food and secretes amylase/invertase.',
      '• In blood-feeders, contains anticoagulants and vasodilators.',
    ],
    longAnswerLines: [
      'The salivary glands (modified labial glands) are paired acinar organs located in the thorax opening at the hypopharynx:',
      '• Solid Feeders: Secrete watery mucus with α-amylase to moisten food and initiate starch hydrolysis.',
      '• Blood Feeders (e.g. Mosquitoes): Saliva contains apyrase, anti-clotting factor Xa inhibitors, and vasodilators to prevent host blood coagulation during ingestion.',
      '• Silkworms: Modified into silk glands producing fibroin and sericin.',
    ],
    sosTip: 'Lubricates food, initiates carbohydrate digestion, and secretes anticoagulants in blood feeders.',
  },
  {
    id: 19,
    questionNumber: 19,
    questionPrompt:
      'Q19) Discuss how honeydew is produced in sap-sucking Hemipterans.',
    chapterText: 'Ch. 1 · Digestive',
    year: 2022,
    marks: '5M',
    shortAnswerLines: [
      'Honeydew is a sweet, sugary excretion produced by sap-sucking insects (aphids, mealybugs).',
      '• Excess plant phloem sap (sucrose and water) is passed rapidly through the filter chamber.',
      '• Egested droplets attract ants and promote sooty mold on crops.',
    ],
    longAnswerLines: [
      'Honeydew production is a direct physiological consequence of feeding on vascular phloem sap:',
      '1. Osmotic Dilemma: Phloem sap contains abundant water and sucrose but extremely low concentrations of essential amino acids.',
      '2. Filter Chamber Shunt: To acquire sufficient nitrogen, insects ingest massive volumes of sap. The filter chamber rapidly shunts excess water and sugars into the hindgut without diluting midgut digestive enzymes.',
      '3. Excretion: The resulting sweet, sugary egesta (honeydew) is ejected onto foliage, serving as an attractant for mutualistic ants and a substrate for black sooty mold fungus (Capnodium spp.).',
    ],
    sosTip: 'Produced by sap-suckers via filter chamber to extract scarce amino acids from excess sugary sap.',
  },
  {
    id: 20,
    questionNumber: 20,
    questionPrompt:
      'Q20) Compare the proventriculus of Orthoptera (grasshoppers) vs Dictyoptera (cockroaches).',
    chapterText: 'Ch. 1 · Digestive',
    year: 2024,
    marks: '10M',
    shortAnswerLines: [
      '• Orthoptera (Grasshopper): 6 longitudinal rows of smaller cuticular ridges with fine denticles; adapted for fibrous grasses.',
      '• Dictyoptera (Cockroach): 6 massive, heavily sclerotized triangular teeth and pulvilli; adapted for omnivorous, tough diets.',
    ],
    longAnswerLines: [
      'A comparative analysis of the proventricular grinding armature highlights dietary specializations:',
      '1. Dictyoptera (Periplaneta americana - Omnivorous):',
      '• Possesses 6 enormous, heavily sclerotized, dark brown pyramidal teeth situated on primary longitudinal folds.',
      '• Posterior to each tooth is an interdental pulvillus covered in dense bristles forming a micro-strainer.',
      '• Exerts massive compressive crushing force on omnivorous scraps.',
      '2. Orthoptera (Locusta migratoria - Herbivorous):',
      '• Teeth are replaced by longitudinal ridges covered in multiple rows of micro-denticles and transverse ridges.',
      '• Suited for shredding and shredding abrasive siliceous monocot grass blades.',
    ],
    sosTip: 'Cockroach has 6 massive pyramidal teeth for omnivory; Grasshopper has rows of finer teeth for grass.',
  },
];

const YEARS = ['All Years', 2024, 2023, 2022, 2021, 2020];

interface PYQViewProps {
  chapterNumber?: number;
  chapterName?: string;
}

export default function PYQView({
  chapterNumber = 1,
  chapterName = 'Insect Digestive System',
}: PYQViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [selectedYear, setSelectedYear] = useState<string | number>('All Years');
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});
  const [answerModeMap, setAnswerModeMap] = useState<Record<number, AnswerMode>>({});

  // Theme tokens matching PyqDark.module.css and PyqLight.module.css
  const bg = isDark ? '#263830' : '#F0F7F2';
  const topAccentColor = isDark ? '#A6EDBA' : '#145E3B';
  const titleColor = isDark ? '#F0F7F0' : '#1F2E26';
  const subtextColor = isDark ? '#B8CFBF' : '#5E7066';

  // Filter track
  const trackBg = isDark ? '#30453B' : '#FFFFFF';
  const trackBorder = isDark ? '#577361' : '#D1E0D6';
  const activePillBg = isDark ? '#FFF6F1' : '#2D3E36';
  const activePillText = isDark ? '#2D3E36' : '#FFFFFF';
  const inactivePillBg = isDark ? '#30453B' : '#FFFFFF';
  const inactivePillBorder = isDark ? '#577361' : '#D1E0D6';
  const inactivePillText = isDark ? '#B8CFBF' : '#5E7066';

  // Card tokens
  const cardBg = isDark ? '#30453B' : '#FFFFFF';
  const cardBorder = isDark ? '#577361' : '#D1E0D6';
  const cardAccent = isDark ? '#FF6361' : '#E83B3D';
  const questionPromptColor = isDark ? '#F0F7F0' : '#1F2E26';

  // Tags
  const chapterTagBg = isDark ? '#29523B' : '#EBFAF0';
  const chapterTagText = isDark ? '#A6EDBA' : '#145E3B';
  const yearTagBg = '#FFE8B2';
  const yearTagText = '#664A0F';
  const marksTagBg = isDark ? '#3B5245' : '#E8F2EB';
  const marksTagText = isDark ? '#F0F7F0' : '#1F2E26';

  // Action buttons
  const completeBtnBg = isDark ? '#30453B' : '#FFFFFF';
  const completeBtnBorder = isDark ? '#577361' : '#D1E0D6';
  const completeBtnText = isDark ? '#B8CFBF' : '#5E7066';
  const completedActiveBg = isDark ? '#29523B' : '#EBFAF0';
  const completedActiveText = isDark ? '#A6EDBA' : '#145E3B';

  // Answer Panel
  const answerPanelBg = isDark ? '#29523B' : '#EBFAF0';
  const answerPanelBorder = '#A8E8BF';
  const answerAccent = isDark ? '#47D97A' : '#14A64F';
  const answerHeadingColor = isDark ? '#A6EDBA' : '#145E3B';
  const answerTextColor = isDark ? '#F0F7F0' : '#1F2E26';

  const filteredQuestions = useMemo(() => {
    if (selectedYear === 'All Years') return PYQ_DATA;
    return PYQ_DATA.filter((q) => q.year === selectedYear);
  }, [selectedYear]);

  const toggleComplete = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAnswerMode = (id: number, mode: AnswerMode) => {
    Haptics.selectionAsync();
    setAnswerModeMap((prev) => ({
      ...prev,
      [id]: mode,
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Top Status Accent Bar (.topStatusAccent: 4px) */}
      <View style={[styles.topStatusAccent, { backgroundColor: topAccentColor }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title & Question Count (.pageTitle & .count) */}
        <View style={styles.titleBlock}>
          <Text style={[styles.pageTitle, { color: titleColor }]}>PYQ</Text>
          <Text style={[styles.count, { color: subtextColor }]}>
            20 questions · 2M, 5M & 10M answers
          </Text>
        </View>

        {/* Year Filter Track (.yearFilterTrack) */}
        <View style={[styles.yearFilterTrack, { backgroundColor: trackBg, borderColor: trackBorder }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearsRow}
          >
            {YEARS.map((yr) => {
              const isSelected = selectedYear === yr;
              return (
                <TouchableOpacity
                  key={yr.toString()}
                  style={[
                    styles.yearButton,
                    isSelected
                      ? [styles.yearButtonActive, { backgroundColor: activePillBg }]
                      : [styles.yearButtonInactive, { backgroundColor: inactivePillBg, borderColor: inactivePillBorder }],
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedYear(yr);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.yearLabel,
                      {
                        color: isSelected ? activePillText : inactivePillText,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Intro text (.intro) */}
        <Text style={[styles.intro, { color: subtextColor }]}>
          Select a subject to view chapter questions and model answers.
        </Text>

        {/* Question Cards List */}
        <View style={styles.cardsList}>
          {filteredQuestions.map((item) => {
            const isCompleted = !!completedMap[item.id];
            const answerMode = answerModeMap[item.id] || 'short';
            const answerLines =
              answerMode === 'long' ? item.longAnswerLines : item.shortAnswerLines;

            return (
              <View
                key={item.id}
                style={[
                  styles.questionCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                {/* Left Red/Coral Accent Bar (.accent) */}
                <View style={[styles.cardAccent, { backgroundColor: cardAccent }]} />

                <View style={styles.cardInner}>
                  {/* Question Prompt (.questionPrompt) */}
                  <Text style={[styles.questionPrompt, { color: questionPromptColor }]}>
                    {item.questionPrompt}
                  </Text>

                  {/* Metadata Tags Row: Chapter Tag, Year Tag, Marks */}
                  <View style={styles.tagRow}>
                    {/* Chapter Tag */}
                    <View style={[styles.chapterTag, { backgroundColor: chapterTagBg }]}>
                      <Text style={[styles.chapterText, { color: chapterTagText }]}>
                        {item.chapterText}
                      </Text>
                    </View>

                    <View style={styles.rightTagGroup}>
                      {/* Year Tag */}
                      <View style={[styles.yearTag, { backgroundColor: yearTagBg }]}>
                        <Text style={[styles.yearText, { color: yearTagText }]}>
                          ▦ {item.year}
                        </Text>
                      </View>

                      {/* Marks Tag */}
                      <View style={[styles.marksTag, { backgroundColor: marksTagBg }]}>
                        <Text style={[styles.marksText, { color: marksTagText }]}>
                          {item.marks}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Row: Mark as Read (placed in place of SOS) */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.markAsReadButton,
                        {
                          backgroundColor: isCompleted ? completedActiveBg : completeBtnBg,
                          borderColor: isCompleted
                            ? isDark
                              ? '#4ADE80'
                              : '#22C55E'
                            : completeBtnBorder,
                        },
                      ]}
                      onPress={() => toggleComplete(item.id)}
                      activeOpacity={0.75}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                        size={15}
                        color={isCompleted ? completedActiveText : completeBtnText}
                      />
                      <Text
                        style={[
                          styles.markAsReadText,
                          { color: isCompleted ? completedActiveText : completeBtnText },
                        ]}
                      >
                        {isCompleted ? 'Marked as read' : 'Mark as read'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Answer Panel (.answerPanel) */}
                  <View
                    style={[
                      styles.answerPanel,
                      { backgroundColor: answerPanelBg, borderColor: answerPanelBorder },
                    ]}
                  >
                    {/* Left Green Accent (.answerAccent) */}
                    <View style={[styles.answerAccent, { backgroundColor: answerAccent }]} />

                    <View style={styles.answerPanelContent}>
                      {/* Header with ANSWER and Bigger Short / Long Toggle */}
                      <View style={styles.answerHeaderRow}>
                        <Text style={[styles.answerHeading, { color: answerHeadingColor }]}>
                          ANSWER
                        </Text>

                        {/* Bigger, easy-to-tap Short / Long segmented toggle */}
                        <View
                          style={[
                            styles.shortLongToggleTrack,
                            {
                              backgroundColor: isDark ? '#1C3125' : '#DDEFE3',
                              borderColor: isDark ? '#436B51' : '#BBDBC5',
                            },
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.shortLongSegment,
                              answerMode === 'short' && [
                                styles.shortLongSegmentActive,
                                {
                                  backgroundColor: isDark ? '#2E4F3B' : '#FFFFFF',
                                  borderColor: isDark ? '#59B87A' : '#72B68E',
                                },
                              ],
                            ]}
                            onPress={() => setAnswerMode(item.id, 'short')}
                            activeOpacity={0.75}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text
                              style={[
                                styles.shortLongText,
                                {
                                  color:
                                    answerMode === 'short'
                                      ? isDark
                                        ? '#A6EDBA'
                                        : '#145E3B'
                                      : isDark
                                      ? '#8BA896'
                                      : '#5C7A68',
                                  fontWeight: answerMode === 'short' ? '700' : '500',
                                },
                              ]}
                            >
                              Short
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.shortLongSegment,
                              answerMode === 'long' && [
                                styles.shortLongSegmentActive,
                                {
                                  backgroundColor: isDark ? '#2E4F3B' : '#FFFFFF',
                                  borderColor: isDark ? '#59B87A' : '#72B68E',
                                },
                              ],
                            ]}
                            onPress={() => setAnswerMode(item.id, 'long')}
                            activeOpacity={0.75}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text
                              style={[
                                styles.shortLongText,
                                {
                                  color:
                                    answerMode === 'long'
                                      ? isDark
                                        ? '#A6EDBA'
                                        : '#145E3B'
                                      : isDark
                                      ? '#8BA896'
                                      : '#5C7A68',
                                  fontWeight: answerMode === 'long' ? '700' : '500',
                                },
                              ]}
                            >
                              Long
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Answer Lines (.answerLine) */}
                      <View style={styles.answerLinesWrap}>
                        {answerLines.map((line, lIdx) => (
                          <Text
                            key={lIdx}
                            style={[styles.answerLine, { color: answerTextColor }]}
                          >
                            {line}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topStatusAccent: {
    width: '100%',
    height: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  titleBlock: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  yearFilterTrack: {
    borderRadius: 13,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 6,
    justifyContent: 'center',
    marginBottom: 10,
  },
  yearsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yearButton: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearButtonActive: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  yearButtonInactive: {
    borderWidth: 1,
  },
  yearLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  intro: {
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  cardsList: {
    gap: 16,
  },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  cardInner: {
    paddingLeft: 14,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  questionPrompt: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chapterTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chapterText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  rightTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yearTag: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  yearText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  marksTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  marksText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  markAsReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAsReadText: {
    fontSize: 11,
    fontWeight: '600',
  },
  answerPanel: {
    borderRadius: 9,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  answerAccent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  answerPanelContent: {
    paddingLeft: 12,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  answerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  answerHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shortLongToggleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    padding: 2.5,
    gap: 3,
  },
  shortLongSegment: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 28,
  },
  shortLongSegmentActive: {
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  shortLongText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  answerLinesWrap: {
    gap: 4,
  },
  answerLine: {
    fontSize: 11,
    lineHeight: 16,
  },
});
