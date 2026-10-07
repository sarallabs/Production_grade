import type { QuestionData } from "@/pages/PreviousYearQuestions";

/**
 * PLACEHOLDER Previous Year Questions for ANGRAU B.Sc. Agriculture — Entomology (ento_131).
 *
 * These are illustrative sample questions (5 per chapter) used only to preview how
 * PYQs will look in the app. They are NOT real past-paper questions and the year
 * tags are made up. Replace with the official PYQ set when it is available.
 */
const ENTO = "ento_131";

export const ANGRAU_PLACEHOLDER_PYQS: QuestionData[] = [
  // ───────────── Chapter 1 — Digestive System ─────────────
  {
    id: 1,
    text: "Name the three regions of the insect alimentary canal and state the embryonic germ layer from which each originates.",
    shortAnswer:
      "Foregut (stomodaeum, ectoderm), midgut (mesenteron, endoderm) and hindgut (proctodaeum, ectoderm).",
    longAnswer:
      "The insect alimentary canal is a tube running from mouth to anus and has three regions:\n1. Foregut (stomodaeum) – arises from ectoderm; lined with a cuticular intima.\n2. Midgut (mesenteron / ventriculus) – arises from endoderm; has no cuticular intima, so enzyme secretion and absorption occur here.\n3. Hindgut (proctodaeum) – arises from ectoderm; lined with a cuticular intima that is shed at each moult.",
    chapter: "Chp: 1 (Digestive System)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 1,
    year: 2023,
  },
  {
    id: 2,
    text: "What is the peritrophic membrane? Mention its functions.",
    shortAnswer:
      "A thin, non-cellular chitin–protein sheath around the food bolus in the midgut that protects the midgut epithelium and aids digestion.",
    longAnswer:
      "The peritrophic membrane (peritrophic matrix) is a semi-permeable, non-cellular sheath made of chitin and proteins that surrounds the food bolus in the midgut.\n\nFunctions:\n- Protects the delicate midgut epithelial cells from abrasion by coarse food particles.\n- Acts as a barrier against pathogens, toxins and parasites.\n- Allows passage of digestive enzymes and digested nutrients while keeping large particles inside.\n- Helps compartmentalise digestion and recycling of enzymes.",
    chapter: "Chp: 1 (Digestive System)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 1,
    year: 2022,
  },
  {
    id: 3,
    text: "Describe the structure and functions of the proventriculus (gizzard) in insects.",
    shortAnswer:
      "A muscular posterior part of the foregut with a thick circular muscle coat and sclerotised intimal teeth/spines that grind food and regulate its passage into the midgut.",
    longAnswer:
      "The proventriculus (gizzard) is the posterior region of the foregut, best developed in chewing insects such as cockroaches and grasshoppers.\n\nStructure:\n- A thick outer coat of circular muscles and an inner layer of longitudinal muscles.\n- The cuticular intima is heavily sclerotised and folded into longitudinal teeth with interdental cushions bearing hair-like spines.\n\nFunctions:\n1. Mechanical grinding – crushes coarse food into a fine slurry.\n2. Straining/filtering – spines prevent large particles from entering the delicate midgut.\n3. Regulation – the stomodaeal (cardiac) valve controls the flow of food into the midgut and prevents backflow.",
    chapter: "Chp: 1 (Digestive System)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 1,
    year: 2024,
  },
  {
    id: 4,
    text: "Explain the filter chamber of Hemiptera and its significance in sap-sucking insects.",
    shortAnswer:
      "A specialised region where parts of the midgut and hindgut are closely associated, letting excess water from sap bypass the midgut and pass directly to the hindgut.",
    longAnswer:
      "Sap-sucking hemipterans such as aphids, jassids and scale insects ingest large volumes of dilute, sugar-rich plant sap but need relatively few nutrients.\n\nThe filter chamber is a modification in which the anterior midgut and the hindgut (or Malpighian tubule region) are held closely together in a sac-like arrangement.\n\nSignificance:\n- Excess water and sugars bypass the main midgut and pass quickly to the hindgut for excretion, often as honeydew.\n- Digestive enzymes and nutrients stay concentrated in the midgut, preventing dilution.\n- It lets the insect process large volumes of sap efficiently.",
    chapter: "Chp: 1 (Digestive System)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 1,
    year: 2021,
  },
  {
    id: 5,
    text: "Discuss the digestive enzymes of the insect midgut and the substrates on which they act.",
    shortAnswer:
      "Carbohydrases (amylase, invertase), proteases (trypsin- and chymotrypsin-like) and lipases digest carbohydrates, proteins and fats respectively in the midgut.",
    longAnswer:
      "Most digestive enzymes are secreted by the midgut epithelium (and salivary glands in some insects) and work in the midgut lumen.\n\n1. Carbohydrases:\n   - Amylase – hydrolyses starch and glycogen to maltose.\n   - Maltase and invertase (sucrase) – break maltose and sucrose into monosaccharides.\n   - Cellulase – present in a few insects (e.g. termites, with gut symbionts) for cellulose digestion.\n2. Proteases:\n   - Endopeptidases such as trypsin- and chymotrypsin-like enzymes cleave proteins into peptides.\n   - Exopeptidases (amino- and carboxypeptidases) release free amino acids.\n3. Lipases: hydrolyse fats into fatty acids and glycerol.\n\nThe gut pH and the type of enzymes vary with the insect's diet, which is why digestive-enzyme inhibitors and Bt toxins that need an alkaline midgut can be used in pest management.",
    chapter: "Chp: 1 (Digestive System)",
    section: "Long Answer",
    marks: 10,
    subjectId: ENTO,
    chapterNumber: 1,
    year: 2020,
  },

  // ───────────── Chapter 2 — Metamorphosis ─────────────
  {
    id: 1,
    text: "Define metamorphosis. List its three main types with one example each.",
    shortAnswer:
      "Metamorphosis is the post-embryonic change in form from young to adult. Types: ametabolous (silverfish), hemimetabolous (grasshopper) and holometabolous (butterfly).",
    longAnswer:
      "Metamorphosis is the series of changes in form, structure and habit that an insect undergoes between hatching and the adult stage.\n\n1. Ametabola (no/ slight metamorphosis) – young resemble adults except in size; e.g. silverfish.\n2. Hemimetabola (incomplete) – egg → nymph/naiad → adult; e.g. grasshopper, dragonfly.\n3. Holometabola (complete) – egg → larva → pupa → adult; e.g. butterfly, housefly, beetle.",
    chapter: "Chp: 2 (Metamorphosis)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 2,
    year: 2023,
  },
  {
    id: 2,
    text: "Differentiate between nymph, naiad and larva with suitable examples.",
    shortAnswer:
      "Nymph: terrestrial young of hemimetabolous insects with wing buds; naiad: aquatic young with gills; larva: young of holometabolous insects that differs entirely from the adult.",
    longAnswer:
      "Nymph – the young stage of terrestrial hemimetabolous insects. It resembles the adult, has compound eyes, develops external wing buds and gradually becomes the adult. Example: grasshopper, bug.\n\nNaiad – the aquatic young stage of some hemimetabolous insects. It has gills or other aquatic adaptations and is unlike the adult in habitat. Example: dragonfly, damselfly, mayfly.\n\nLarva – the young stage of holometabolous insects. It looks completely different from the adult, has no wing buds, and passes through a pupal stage before becoming an adult. Example: caterpillar, grub, maggot.",
    chapter: "Chp: 2 (Metamorphosis)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 2,
    year: 2022,
  },
  {
    id: 3,
    text: "Define diapause and give two examples of insects that show it.",
    shortAnswer:
      "Diapause is a hormonally controlled state of arrested development that helps insects survive unfavourable seasons. Examples: egg diapause in the silkworm Bombyx mori and larval diapause in the pink bollworm.",
    longAnswer:
      "Diapause is a genetically programmed, hormonally regulated period of suspended growth and reduced metabolism that allows an insect to survive adverse conditions such as winter or drought. It is triggered by environmental cues like photoperiod and temperature, usually before the harsh season begins.\n\nExamples:\n- Egg diapause in the silkworm Bombyx mori.\n- Larval diapause in the pink bollworm Pectinophora gossypiella.\n- Pupal diapause in the American bollworm Helicoverpa armigera.",
    chapter: "Chp: 2 (Metamorphosis)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 2,
    year: 2024,
  },
  {
    id: 4,
    text: "Describe the different types of pupae in insects with examples.",
    shortAnswer:
      "Obtect pupa (appendages glued to the body; moths), exarate pupa (appendages free; beetles) and coarctate pupa (enclosed in the hardened last larval skin; flies).",
    longAnswer:
      "The pupa is the non-feeding, usually immobile stage between larva and adult in holometabolous insects. Three main types:\n\n1. Obtect pupa – the legs, wings and antennae are glued to the body by a secretion; the surface is smooth. Example: moths and butterflies (chrysalis).\n2. Exarate pupa – the appendages are free and not glued to the body. Example: beetles, wasps, bees.\n3. Coarctate pupa – an exarate pupa enclosed within a barrel-shaped puparium formed from the hardened last larval skin. Example: houseflies and other higher flies.",
    chapter: "Chp: 2 (Metamorphosis)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 2,
    year: 2020,
  },
  {
    id: 5,
    text: "Explain the hormonal control of moulting and metamorphosis in insects.",
    shortAnswer:
      "PTTH from the brain stimulates the prothoracic glands to release ecdysone (moulting hormone); the level of juvenile hormone from the corpora allata decides whether the moult is larval, pupal or adult.",
    longAnswer:
      "Moulting and metamorphosis are controlled by three main hormones:\n\n1. Prothoracicotropic hormone (PTTH) – secreted by neurosecretory cells of the brain; stimulates the prothoracic glands.\n2. Ecdysone (moulting hormone) – secreted by the prothoracic glands and converted to 20-hydroxyecdysone; it triggers apolysis and moulting.\n3. Juvenile hormone (JH) – secreted by the corpora allata; it determines the nature of the moult.\n\nRole of JH:\n- High JH level + ecdysone → larva-to-larva moult (retains juvenile features).\n- Low JH level + ecdysone → larva-to-pupa moult.\n- Absence of JH + ecdysone → pupa-to-adult moult.\n\nThis understanding is used in pest management through insect growth regulators and JH analogues.",
    chapter: "Chp: 2 (Metamorphosis)",
    section: "Long Answer",
    marks: 10,
    subjectId: ENTO,
    chapterNumber: 2,
    year: 2023,
  },

  // ───────────── Chapter 3 — Weathering ─────────────
  {
    id: 1,
    text: "Define weathering and name its three main types.",
    shortAnswer:
      "Weathering is the in-situ breakdown of rocks into smaller particles by physical, chemical and biological processes.",
    longAnswer:
      "Weathering is the process by which rocks and minerals are broken down or decomposed at or near the Earth's surface without being transported.\n\nTypes:\n1. Physical (mechanical) weathering – disintegration without change in chemical composition.\n2. Chemical weathering – decomposition through chemical reactions such as hydrolysis, oxidation and carbonation.\n3. Biological weathering – breakdown by plant roots, microbes, lichens and burrowing animals.",
    chapter: "Chp: 3 (Weathering)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 3,
    year: 2023,
  },
  {
    id: 2,
    text: "Differentiate between weathering and erosion.",
    shortAnswer:
      "Weathering breaks rocks down in place, while erosion removes and transports the weathered material by agents like water, wind and ice.",
    longAnswer:
      "Weathering is the in-situ breakdown and decay of rocks by physical, chemical and biological processes; no movement of material is involved.\n\nErosion is the detachment, removal and transport of weathered material by agents such as running water, wind, glaciers and gravity.\n\nWeathering therefore prepares the material, and erosion carries it away to be deposited elsewhere.",
    chapter: "Chp: 3 (Weathering)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 3,
    year: 2022,
  },
  {
    id: 3,
    text: "Explain the agents and processes of physical weathering.",
    shortAnswer:
      "Temperature changes (exfoliation), frost action, wind abrasion, water and plant-root pressure break rocks into smaller fragments without altering their chemistry.",
    longAnswer:
      "Physical weathering breaks rock into smaller pieces without changing its mineral composition. Main agents:\n\n1. Temperature changes – repeated heating and cooling causes unequal expansion and contraction of minerals, producing cracks and peeling of outer layers (exfoliation).\n2. Frost action (frost wedging) – water entering cracks freezes and expands by about 9%, widening the cracks.\n3. Wind – carries sand particles that abrade rock surfaces (abrasion).\n4. Water – flowing water and waves cause abrasion and impact.\n5. Plants and animals – roots growing in cracks and burrowing animals exert pressure that splits rocks.",
    chapter: "Chp: 3 (Weathering)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 3,
    year: 2021,
  },
  {
    id: 4,
    text: "Describe the major processes of chemical weathering.",
    shortAnswer:
      "Solution, hydration, hydrolysis, carbonation and oxidation chemically alter minerals and convert them into new, more stable products such as clay.",
    longAnswer:
      "Chemical weathering decomposes minerals through reactions with water, oxygen and acids.\n\n1. Solution – minerals such as rock salt dissolve in water.\n2. Hydration – minerals absorb water and swell; e.g. hematite → limonite, anhydrite → gypsum.\n3. Hydrolysis – reaction between mineral ions and H⁺/OH⁻ of water; feldspar changes into clay minerals (kaolinite). It is the most important process for silicate minerals.\n4. Carbonation – carbonic acid (CO₂ in water) dissolves limestone to form soluble bicarbonates.\n5. Oxidation – oxygen reacts with iron-bearing minerals, giving reddish iron oxides (rusting).",
    chapter: "Chp: 3 (Weathering)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 3,
    year: 2024,
  },
  {
    id: 5,
    text: "Discuss the role of weathering in soil formation and the factors that influence it.",
    shortAnswer:
      "Weathering converts parent rock into regolith, the raw material of soil; climate, parent material, topography, organisms and time control how soil forms.",
    longAnswer:
      "Weathering is the first step of soil formation (pedogenesis). Physical and chemical weathering break solid rock into loose regolith, which becomes true soil as organic matter accumulates and horizons develop.\n\nFactors influencing soil formation (Jenny's five factors):\n1. Parent material – determines texture, mineral content and nutrient status.\n2. Climate – temperature and rainfall control the rate of weathering and leaching.\n3. Topography – slope affects drainage, erosion and soil depth.\n4. Organisms – vegetation, microbes and soil fauna add organic matter and speed up weathering.\n5. Time – soils become deeper and more developed with age.",
    chapter: "Chp: 3 (Weathering)",
    section: "Long Answer",
    marks: 10,
    subjectId: ENTO,
    chapterNumber: 3,
    year: 2020,
  },

  // ───────────── Chapter 4 — Pollination ─────────────
  {
    id: 1,
    text: "Define pollination and name its two main types.",
    shortAnswer:
      "Pollination is the transfer of pollen from the anther to the stigma; it can be self-pollination or cross-pollination.",
    longAnswer:
      "Pollination is the transfer of pollen grains from the anther to the stigma of a flower, which is a prerequisite for fertilisation.\n\nTypes:\n1. Self-pollination – pollen is transferred to the stigma of the same flower or another flower on the same plant (autogamy, geitonogamy).\n2. Cross-pollination – pollen is transferred to the stigma of a flower on a different plant of the same species (xenogamy). It needs an agent such as insects, wind or water.",
    chapter: "Chp: 4 (Pollination)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 4,
    year: 2023,
  },
  {
    id: 2,
    text: "What is entomophily? Mention any two floral adaptations for insect pollination.",
    shortAnswer:
      "Entomophily is pollination by insects. Insect-pollinated flowers have bright petals and nectar/scent to attract insects, and sticky or spiny pollen that clings to them.",
    longAnswer:
      "Entomophily is the transfer of pollen from one flower to another by insects such as bees, butterflies, moths, flies and beetles.\n\nFloral adaptations:\n- Showy, brightly coloured petals and fragrance to attract insects.\n- Nectar and edible pollen as rewards.\n- Sticky, rough or spiny pollen grains that adhere to the insect's body.\n- Stigma that is sticky or feathery to receive pollen.",
    chapter: "Chp: 4 (Pollination)",
    section: "Short Answer",
    marks: 2,
    subjectId: ENTO,
    chapterNumber: 4,
    year: 2022,
  },
  {
    id: 3,
    text: "Discuss the role of honey bees as pollinators and name crops that benefit from bee pollination.",
    shortAnswer:
      "Honey bees visit large numbers of flowers for nectar and pollen and carry pollen on their hairy bodies, boosting seed set and yield in crops such as sunflower, mustard and fruit trees.",
    longAnswer:
      "Honey bees (Apis mellifera, Apis cerana) are the most important managed pollinators because:\n- They live in large colonies and forage in great numbers.\n- Their hairy bodies and pollen baskets (corbiculae) pick up and carry pollen.\n- They show flower constancy, visiting one crop species at a time, which improves cross-pollination.\n- Colonies can be placed in fields during flowering.\n\nCrops benefiting from bee pollination include sunflower, mustard, rapeseed, cotton, apple, citrus, cucurbits and many vegetable seed crops. Bee pollination improves both yield and quality of fruit and seed.",
    chapter: "Chp: 4 (Pollination)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 4,
    year: 2024,
  },
  {
    id: 4,
    text: "How can pollinators be managed to enhance crop yield? Explain.",
    shortAnswer:
      "Place bee colonies in the field at flowering, avoid pesticide spraying during bloom, provide water and forage, and protect natural pollinator habitats.",
    longAnswer:
      "Measures to manage pollinators for higher yield:\n1. Introduce honey bee colonies into the crop at about 10% flowering, using the recommended number of hives per hectare for the crop.\n2. Avoid spraying insecticides during flowering; if necessary, spray in the evening using the least toxic products.\n3. Provide a nearby source of clean water and bee forage plants for periods when the crop is not in bloom.\n4. Keep hives in sunlight and shelter them from strong winds.\n5. Conserve wild pollinators by maintaining hedgerows, field margins and nesting sites.\n6. Where honey bees are unsuitable, use other managed pollinators such as stingless bees, bumble bees or leaf-cutter bees.",
    chapter: "Chp: 4 (Pollination)",
    section: "Long Answer",
    marks: 5,
    subjectId: ENTO,
    chapterNumber: 4,
    year: 2021,
  },
  {
    id: 5,
    text: "Distinguish between anemophily, hydrophily and entomophily with suitable examples.",
    shortAnswer:
      "Anemophily is pollination by wind (maize), hydrophily is by water (Vallisneria) and entomophily is by insects (sunflower).",
    longAnswer:
      "1. Anemophily (wind pollination) – flowers are small, dull, without scent or nectar; pollen is light, dry and produced in large quantities; stigma is feathery. Examples: maize, wheat, coconut.\n\n2. Hydrophily (water pollination) – occurs in some aquatic plants; pollen is carried on or under water and is often protected by a mucilage coat. Examples: Vallisneria, Hydrilla.\n\n3. Entomophily (insect pollination) – flowers are showy, scented and have nectar; pollen is sticky or spiny. Examples: sunflower, mustard, apple.\n\nWind and water pollination are abiotic and need large amounts of pollen, whereas entomophily is biotic and more efficient and targeted.",
    chapter: "Chp: 4 (Pollination)",
    section: "Long Answer",
    marks: 10,
    subjectId: ENTO,
    chapterNumber: 4,
    year: 2020,
  },
];
