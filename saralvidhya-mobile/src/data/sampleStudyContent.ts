import { formatChapterDir, GCS_API_BASE } from '@/services/contentService';

export const SAMPLE_STUDY_CONTENT: Record<number, { summary: string; detailed: string }> = {
  1: {
    summary: `## 1. Architectural Blueprint & Regional Partitioning

The insect alimentary canal is a specialized muscular tube extending from the mouth to the anus. It is divided into three distinct anatomical chambers: the **Foregut (Stomodaeum)**, the **Midgut (Mesenteron)**, and the **Hindgut (Proctodaeum)**. This division reflects fundamental embryonic origins that govern how food is processed and eliminated.

- **Strategic Boundary Checkpoints**: The **cardiac valve** regulates flow between foregut and midgut, while the insertion ring of the **Malpighian tubules** marks the transition between midgut and hindgut.
- **Tripartite Division of Labor**: The foregut handles ingestion and physical crushing; the midgut executes chemical digestion and absorption; the hindgut recovers water and vital mineral ions before solid waste expulsion.
- **Embryonic Origins & Protective Cuticle**: The foregut and hindgut develop from embryonic ectoderm and are lined internally with a **cuticular intima** (a protective chitin layer continuous with the exoskeleton). This lining shields living tissue from sharp food particles and is shed and rebuilt at every larval molt (ecdysis).
- **Unshielded Midgut Surface**: The midgut develops from embryonic endoderm and entirely lacks a cuticle lining. This allows midgut cells to actively secrete digestive enzymes and directly absorb nutrients into the surrounding hemolymph.

![Tripartite Blueprint](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/Insect_Digestive_System_Blueprint.png)

### Regional Summary Table

| Region | Embryonic Origin | Cuticular Intima (Cuticle) | Primary Functions | Key Structures |
|---|---|---|---|---|
| **Foregut (Stomodaeum)** | Ectodermal | **Present (+)** *(Shed during molting)* | Ingestion, transport, physical grinding, temporary storage | Pharynx pump, oesophagus, storage crop, tooth-lined proventriculus |
| **Midgut (Mesenteron)** | Endodermal | **Absent (-)** *(Enables direct transport)* | Active chemical digestion, enzyme secretion, nutrient absorption | Ventriculus stomach, gastric caeca, peritrophic membrane sleeve |
| **Hindgut (Proctodaeum)** | Ectodermal | **Present (+)** *(Protects reabsorptive cells)* | Excreta filtration, water/ion reclamation, solid waste compaction | Malpighian tubules, ileum, colon, rectum with reabsorptive rectal pads |

---

## 🖼️ 2. Foregut (Stomodaeum) Visual Infographic Gallery

Understand foregut ingestion, crop storage, proventriculus teeth, and cuticular intima histology:

![Anatomy of Foregut](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20(Stomodaem)/Anatomy_of_the_Insect_Foregut.png)

![Anatomy of the Insect Gut](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20(Stomodaem)/Leaf%20Nodes/1.%20Anatomy_of_the_Insect_Gut.png)

![Insect Intake Engine Diagram](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20(Stomodaem)/Leaf%20Nodes/2.%20Insect_Intake_Engine_Anatomy_Diagram.png)

![Foregut Processing Engine](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20(Stomodaem)/Leaf%20Nodes/3.%20Insect_Foregut_Processing_Engine.png)

![Ectodermal Gut Histology Blueprint](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20(Stomodaem)/Leaf%20Nodes/4.%20Insect_Ectodermal_Gut_Histology_Blueprint.png)

### Key Foregut Takeaways:
- **Cibarium & Pharynx:** Muscular intake and sucking pumps.
- **Crop:** Expandable balloon pouch for temporary food storage.
- **Proventriculus:** Sclerotized cuticular teeth that crush solid food before the midgut.

---

## 🖼️ 3. Midgut (Mesenteron) & Cellular Infographic Gallery

Explore enzyme secretion, gastric caeca, peritrophic matrix, and enterocyte stem cells:

![Midgut Biological Engine](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20(Mesenteron)/The_Insect_Midgut_Biological_Engine.png)

![Midgut Digestive System](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20(Mesenteron)/Leaf%20Nodes/1.%20Insect_Midgut_Digestive_System.png)

![Cellular Engine of Digestion](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20(Mesenteron)/Leaf%20Nodes/2.%20Cellular_Engine_of_Insect_Digestion.png)

![Midgut Anatomy Diagram](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20(Mesenteron)/Leaf%20Nodes/3.%20The_Insect_Midgut_Anatomy_Diagram.png)

![Cellular Division of Labour Diagram](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20(Mesenteron)/Leaf%20Nodes/Cellular%20Types/Insect_Midgut_Cellular_Labour_Diagram.png)

### Key Midgut Takeaways:
- **Columnar Enterocytes:** Microvilli brush border for enzyme secretion & absorption.
- **Regenerative Stem Cells (Nidi):** Basal nests dividing to replace damaged cells.
- **Calciform Goblet Cells:** Active K+ ion transport and pH balance regulation.
- **Peritrophic Membrane:** Non-cellular sieve protecting stomach cells from abrasion.

---

## 🖼️ 4. Hindgut (Proctodaeum) & Rectal Pad Infographic Gallery

Visualize Malpighian tubule filtration and rectal pad water reclamation:

![Hindgut Anatomy and Function](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/3.%20Hindgut%20(%20Proctodaeum%20)/Insect_Hindgut_Anatomy_and_Function.png)

![Proctodaeum Waste Management](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/3.%20Hindgut%20(%20Proctodaeum%20)/Leaf%20Nodes/1.%20Insect_Hindgut_Anatomy_and_Function.png)

![Hindgut and Fluid Conservation](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/3.%20Hindgut%20(%20Proctodaeum%20)/Leaf%20Nodes/2.%20Insect_Hindgut_and_Fluid_Conservation.png)

![Proctodaeum Waste Management System](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/3.%20Hindgut%20(%20Proctodaeum%20)/Leaf%20Nodes/3.%20Insect_Proctodaeum_Waste_Management_System.png)

![Anatomy of Hindgut](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/3.%20Hindgut%20(%20Proctodaeum%20)/Leaf%20Nodes/4.%20Anatomy_of_the_Insect_Hindgut.png)

### Key Hindgut Takeaways:
- **Malpighian Tubules:** Filter nitrogenous waste (uric acid) into the hindgut.
- **Rectal Pads:** Tall prismatic cells with mitochondria pumping Na+/K+ to reclaim 90% water, forming dry frass.

---

## 🖼️ 5. Salivary Glands & Specialized Adaptations Gallery

Discover salivary versatile functions, sap-sucking filter chambers, and termite wood digestion:

![Salivary Gland Biological Adaptations](../Mindmaps/Digestive%20System%20Infographics/2.%20Salivary%20Glands/00%20Insect_Salivary_Gland_Biological_Adaptations.png)

![Specialized Physiological Adaptations Overview](../Mindmaps/Digestive%20System%20Infographics/3.%20Specilized%20Physiological%20Adaptations/00%20specialized_physiological_adaptations.jpg)

![Insect Gut Adaptations for Survival](../Mindmaps/Digestive%20System%20Infographics/3.%20Specilized%20Physiological%20Adaptations/01%20Insect_Gut_Adaptations_for_Survival.png)

![Filter Chamber Complete Anatomy](../Mindmaps/Digestive%20System%20Infographics/3.%20Specilized%20Physiological%20Adaptations/1.%20Filter%20Chamber/00%20filter_chamber_complete_anatomy.jpg)

![Nature's Osmotic Bypass Filter Chamber](../Mindmaps/Digestive%20System%20Infographics/3.%20Specilized%20Physiological%20Adaptations/1.%20Filter%20Chamber/01%20Nature_s_Osmotic_Bypass_Filter_Chamber.png)

![Symbiotic Digestion Infographic](../Mindmaps/Digestive%20System%20Infographics/3.%20Specilized%20Physiological%20Adaptations/2.%20Symbotic%20Digestion/00%20symbiotic_digestion_infographic.jpg)

![Termite Symbiotic Wood Digestion Process](../Mindmaps/Digestive%20System%20Infographics/3.%20Specilized%20Physiological%20Adaptations/2.%20Symbotic%20Digestion/01%20Termite_Symbiotic_Wood_Digestion_Process.png)

![Insect Excretory Integration Diagram](../Mindmaps/Digestive%20System%20Infographics/4.%20Excretory%20Integration/00-Insect_Excretory_Integration_Diagram.png)

### Key Adaptation Takeaways:
- **Salivary Adaptations:** External liquefaction in predators, silk fibroin in caterpillars, and anti-coagulants in mosquitoes.
- **Filter Chamber:** Sap-feeders shunt 90% water directly to hindgut, excreting honeydew while digesting concentrated slurry.
- **Termite Symbiosis:** Rectal pouch houses *Trichonympha* flagellates secreting cellulase to ferment wood into absorbable sugars.
`,
    detailed: `## 1. Architectural Blueprint and Division of Labor in the Insect Gut

The insect alimentary canal is one of the most remarkable evolutionary adaptations in the animal kingdom. Rather than functioning as a uniform, undifferentiated tube, the digestive tract operates as a highly coordinated biological assembly line. It is compartmentalized into three primary regions: the foregut (stomodaeum), midgut (mesenteron), and hindgut (proctodaeum). Each region performs a distinct physiological assignment, transforming food into molecular energy while conserving vital body fluids.

The foregut and hindgut arise from the ectoderm and retain a protective cuticular intima. In contrast, the central midgut develops from embryonic endoderm and lacks this cuticular lining, allowing efficient secretion of digestive juices and absorption of dissolved nutrients.

![Insect Digestive System Master Overview](../Mindmaps/Digestive%20System%20Infographics/00.%20insect_digestive_system_master_overview.jpg)

![Insect Alimentary Canal Structural Guide](../Mindmaps/Digestive%20System%20Infographics/01.%20Insect_Alimentary_Canal_Structural_Guide.png)

![Insect Digestive System Blueprint](../Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/Insect_Digestive_System_Blueprint.png)

\`\`\`
                     [ Mouth / Cibarium Ingestion ]
                                   │
                                   ▼
                 ┌──────────────────────────────────┐
                 │       Foregut (Stomodaeum)       │  <-- Ectodermal Origin
                 │ - Ingestion, storage, grinding   │      Protective cuticular intima
                 │ - "Fire hose" transport system   │      Shed during larval molts
                 └─────────────────┬────────────────┘
                                   │
                           [ Cardiac Valve ]           <-- "Customs Checkpoint"
                                   │
                                   ▼
                 ┌──────────────────────────────────┐
                 │        Midgut (Mesenteron)       │  <-- Endodermal Origin
                 │ - Enzyme secretion & digestion   │      No cuticle lining
                 │ - High-turnover "factory floor"  │      Peritrophic membrane sieve
                 └─────────────────┬────────────────┘
                                   │
                         [ Malpighian Tubules ]        <-- Junction of Midgut & Hindgut
                                   │
                                   ▼
                 ┌──────────────────────────────────┐
                 │       Hindgut (Proctodaeum)      │  <-- Ectodermal Origin
                 │ - Water reabsorption & compaction│      Protective cuticular intima
                 │ - Rectal pad ionic pumps         │      Shed during larval molts
                 └─────────────────┬────────────────┘
                                   │
                                   ▼
                           [ Feces / Frass ]
\`\`\`

### A. Embryological Origins and Structural Consequences
- **Ectodermal Origin (Foregut & Hindgut):** Both foregut and hindgut develop from embryonic ectoderm via stomodaeal and proctodaeal invaginations. Lined with an innermost **cuticular intima** (a sheddable chitinous layer) continuous with the outer exoskeleton. Acts as a mechanical shield against abrasive materials and is shed during each larval molt (ecdysis).
- **Endodermal Origin (Midgut):** Develops from embryonic endoderm and completely **lacks a cuticle lining**. Permits direct chemical transport, enzyme secretion, and active nutrient absorption across cell membranes.

### B. Functional Segmental Partitioning
- **Foregut (Receiving Station):** Ingestion, lubrication, transport, and physical grinding.
- **Midgut (Chemical Processing Core):** Enzymatic chemical digestion and active nutrient absorption.
- **Hindgut (Water Reclamation & Packaging):** Reclaims 90%+ water and mineral salts, turning digestive slurry into dry frass pellets.

---

## 2. Anatomical Subdivisions of the Foregut (Stomodaeum)
1. **Preoral Cavity & Cibarium:** In chewing insects, bounds the mouthparts. In piercing-sucking insects (Hemiptera, Diptera), specialized cibarial dilator muscles act as an intake suction pump.
2. **Pharynx:** Muscular transit tube linking preoral cavity to oesophagus.
3. **Oesophagus:** Slender tube running through the thorax.
4. **Crop (Ingluvies):** Thin-walled expandable reservoir for temporary food storage. Amylase and invertase from salivary glands start digestion here.
5. **Proventriculus (Gizzard):** Armed internally with 6 sclerotized cuticular teeth and hair-like bristles that crush solid food particles and act as a fine mechanical filter.

---

## 3. Midgut (Mesenteron) Histology & Cellular Labor
The midgut is the metabolic center of the insect:
- **Gastric Caeca:** Finger-like blind tubes at the anterior midgut that dramatically increase surface area for enzyme secretion and absorption.
- **Columnar Cells:** Microvillar epithelial cells that secrete proteases, amylases, lipases, and peptidases.
- **Regenerative Cells (Nidi):** Basal stem cell nests that divide continuously to replace worn epithelial cells.
- **Peritrophic Membrane:** Non-cellular sleeve of chitin and protein secreted to encase the food bolus. Shields gut cells from mechanical abrasion and pathogen invasion while letting enzymes and digested nutrients pass through.

---

## 4. Hindgut (Proctodaeum) & Water Balance
- **Malpighian Tubules:** Slender blind tubules inserting at the midgut-hindgut junction. Actively extract potassium urate and metabolic wastes from the hemolymph.
- **Ileum & Colon:** Convey waste toward the posterior chamber.
- **Rectal Pads / Papillae:** Specialized tall epithelial cells packed with mitochondria that drive active transport of Na+ and K+ ions, drawing water osmotically out of urine and feces to maintain water conservation.
`,
  },
  2: {
    summary: `# Comprehensive Chapter Overview: Insect Metamorphosis

This summary synthesizes the post-embryonic developmental framework of insects, comparing structural metamorphosis categories, larval and pupal morphological taxonomy, hypermetabolous lifecycles, neuroendocrine regulatory pathways, and photoperiodic diapause mechanisms.

---

# 1. Morphogenesis Framework & Post-Embryonic Phases
Morphogenesis represents the totality of post-embryonic structural changes occurring between egg hatching and adult sexual maturity.

\`\`\`mermaid
flowchart LR
    A["Egg Stage"] --> B["Phase 1: Growth (Larva/Nymph)<br>Feeding & Apolysis/Ecdysis"]
    B --> C["Phase 2: Differentiation (Pupa)<br>Histolysis & Histogenesis"]
    C --> D["Phase 3: Maturation (Adult)<br>Sclerotization & Reproduction"]
\`\`\`

* **Growth Phase**: Accompanied by periodic ecdysis (moulting) to accommodate cuticle expansion.
* **Differentiation Phase**: Occurs during the pupal stage of holometabolous insects; involves **histolysis** (enzymatic breakdown of larval tissues) and **histogenesis** (formation of adult organs from imaginal discs).
* **Maturation Phase**: Sclerotization of the cuticle via Bursicon and activation of gonads for reproduction.

---

# 2. Structural Categories of Metamorphosis

| Feature / Criteria | Ametabolous (No Metamorphosis) | Hemimetabolous (Incomplete) | Holometabolous (Complete) |
| :--- | :--- | :--- | :--- |
| **Developmental Arc** | Direct (\`Egg -> Young -> Adult\`) | Direct (\`Egg -> Nymph -> Adult\`) | Indirect (\`Egg -> Larva -> Pupa -> Adult\`) |
| **Number of Stages** | 3 Stages | 3 Stages | 4 Stages |
| **Immature Terminology** | Young | Nymph (or Aquatic Naiad) | Larva |
| **Pupal Stage** | Absent | Absent | Present (Transitory Phase) |
| **Wing Morphogenesis** | Wingless adults (Apterygota) | External wing pads (Exopterygota) | Internal imaginal discs (Endopterygota) |
| **Ecological Niche** | Immature & adult diets identical | Immature & adult diets identical | Larval & adult diets decoupled |
| **Species Proportion** | < 0.1% | ~ 12% | ~ 88% |

---

# 3. Immature & Pupal Taxonomy

## A. Larval Classifications
1. **Eruciform**: Cylindrical body with 3 pairs of thoracic legs and 2–5 pairs of abdominal prolegs with crochets (Lepidoptera, Symphyta).
2. **Scarabaeiform**: Fleshy C-shaped grub with sclerotized head, well-developed thoracic legs, no prolegs (Scarabaeidae).
3. **Campodeiform**: Elongate, dorso-ventrally flattened active predator with prominent legs and cerci (Neuroptera, Carabidae).
4. **Elateriform**: Cylindrical, heavily sclerotized wireworm-like body with short thoracic legs (Elateridae).
5. **Vermiform**: Legless maggot with reduced head capsule and mouthhooks (Diptera).

## B. Pupal Classifications
1. **Exarate**: Appendages free and unattached to body wall (Coleoptera, Hymenoptera).
2. **Obtect**: Appendages glued tightly to body wall by cuticular secretion (Lepidoptera chrysalis).
3. **Coarctate**: Enclosed inside a hardened, brown 4th/5th larval puparium (Diptera).

---

# 4. Neuroendocrine Regulatory Axis

\`\`\`mermaid
flowchart TD
    Brain["Brain Neurosecretory Cells (Protocerebrum)"] -- "Secretes PTTH" --> CC["Corpora Cardiaca (Storage/Release)"]
    CC -- "PTTH via Haemolymph" --> PG["Prothoracic Glands"]
    PG -- "Secretes Ecdysone" --> Epidermis["Epidermal Cells"]
    CA["Corpora Allata"] -- "Secretes Juvenile Hormone (JH)" --> Epidermis

    Epidermis -- "High JH + Ecdysone" --> MoultL["Larval-to-Larval Moult"]
    Epidermis -- "Low JH + Ecdysone" --> MoultP["Larval-to-Pupal Moult"]
    Epidermis -- "Zero JH + Ecdysone" --> MoultA["Pupal-to-Adult Moult"]
\`\`\`

* **Bursicon**: Neurohormone released post-eclosion to trigger epidermal sclerotization (cuticular tanning) and wing expansion.
`,
    detailed: `# Comprehensive Insect Metamorphosis & Endocrinology (Detailed Notes)

## Post-Embryonic Growth & Developmental Mechanics

The biological development of an insect does not terminate upon hatching from the egg. Rather, the organism undergoes a continuous, highly regulated series of post-embryonic changes that guide it from a newly emerged, sexually immature state to a fully formed, reproductively capable adult. This entire sequence of post-embryonic changes—comprising physical growth, periodic shedding of the exoskeleton, tissue differentiation, and sexual maturation—is known as **morphogenesis**.

\`\`\`mermaid
graph TD
    Egg[Egg Stage] --> Larva[Larval Stage: Growth & Moulting]
    Larva --> Pupa[Pupal Stage: Differentiation]
    Pupa --> Adult[Adult Stage: Maturation & Reproduction]
\`\`\`

---

## 1. Morphogenesis: The Framework of Post-Embryonic Development

Morphogenesis is the overarching biological framework spanning an insect's entire post-embryonic life. It can be divided into three distinct, sequential phases:
1. **Growth and Moulting**: Occurs during immature larval stages, where the insect feeds voraciously and periodically sheds its rigid cuticle (moulting) to allow body expansion.
2. **Differentiation**: Occurs primarily during the pupal stage, where larval tissues are histolysed (broken down) and histogenised (rebuilt) into complex adult structures from imaginal discs.
3. **Maturation and Reproduction**: Occurs in the adult stage, where the insect develops functional reproductive organs and focuses energy on dispersal and reproduction.

---

## 2. The Three Categories of Metamorphosis
1. **No Metamorphosis (Ametabola)**: Primitive wingless insects (silverfish *Lepisma*). Young emerge looking identical to adults except for size and genitalia. Molting continues throughout life.
2. **Incomplete Metamorphosis (Hemimetabola)**: Nymphs resemble miniature wingless adults. External wing pads develop gradually with each instar. No pupal stage (grasshoppers, true bugs, cockroaches).
3. **Complete Metamorphosis (Holometabola)**: 4 discrete stages (egg, larva, pupa, adult). Immature larva specialized for feeding with no resemblance to adult; pupa transitions internal organs; adult winged and reproductive (butterflies, beetles, bees, flies).

---

## 3. Endocrine Cascade & Hormonal Balance Theory
The nature of each moult is quantitatively governed by the titer of **Juvenile Hormone (JH)** relative to **20-Hydroxyecdysone**:

- **PTTH (Prothoracicotropic Hormone):** Secreted by protocerebral neurosecretory cells of the brain, transported to corpora cardiaca, triggers prothoracic glands.
- **Ecdysone:** Steroid hormone produced by prothoracic glands that initiates apolysis and cuticular secretion.
- **Juvenile Hormone (JH):** Sesquiterpenoid secreted by corpora allata. High levels maintain larval traits; reduction triggers pupation; complete absence enables adult development.
- **Bursicon:** Directs post-eclosion sclerotization (tanning) and wing expansion.
`,
  },
  3: {
    summary: `# Quick Study Guide: Rock Weathering & Soil Formation

**Subject:** Agricultural Geology / Soil Science | **Chapter:** Weathering of Rocks & Minerals  
**Audience Level:** Intermediate  

---

## 1. Rock Weathering Mechanisms

Weathering is the basic process of pedogenesis, breaking massive bedrock into regolith through mechanical disintegration and chemical decomposition.

\`\`\`mermaid
flowchart TD
    Bedrock["Massive Bedrock (Parent Rock)"] --> Physical["Physical Weathering<br>Frost wedging, thermal expansion, abrasion"]
    Bedrock --> Chemical["Chemical Weathering<br>Hydration, hydrolysis, oxidation, carbonation"]
    Bedrock --> Biological["Biological Weathering<br>Root wedging, lichen acids, microbial action"]
    Physical --> Regolith["Unconsolidated Regolith Mantle"]
    Chemical --> Regolith
    Biological --> Regolith
    Regolith --> Solum["True Soil (Solum: A + B Horizons)"]
\`\`\`

---

## 2. The Weathering Agents Comparison

| Category | Primary Agent / Reaction | Mode of Action | Soil Consequence |
|---|---|---|---|
| **Physical (Disintegration)** | Frost Wedging / Exfoliation | 9% volume expansion of freezing water; differential thermal expansion of mineral crystals | Shatters rocks into smaller fragments; massively increases reactive surface area |
| **Chemical (Decomposition)** | Hydrolysis & Hydration | H+ & OH- ions replace metal cations (K+, Na+, Ca2+) in silicate crystal lattices | Transforms feldspars into clay minerals (kaolinite) and releases plant nutrients |
| **Chemical (Oxidation)** | Oxygen & Water | Fe2+ (ferrous) oxidized to Fe3+ (ferric), destroying lattice stability | Characteristic red/yellow soil coloration; creates hematite and limonite |
| **Chemical (Carbonation)** | Carbonic Acid (H2CO3) | Rainwater absorbs atmospheric CO2, dissolving limestone & calcite | Leaches calcium and forms karst features; increases soil alkalinity |
| **Biological** | Plant Roots & Lichens | Mechanical root turgor pressure (1.5 MPa) wedging rock joints + secretion of chelating organic acids | Accelerates chemical dissolution in the rhizosphere; humus enrichment |

---

## 3. Quantitative Synthesis & Examination Takeaways
- **Specific Surface Area Geometric Scaling:** Subdividing a 1 m³ block into coarse silt particles (0.05 mm) creates 8 × 10¹² particles with 120,000 m² of aggregate surface area, accelerating chemical dissolution exponentially.
- **Frost Wedging Pressure:** 9% volumetric expansion generates up to 146.5 MPa splitting pressure.
- **Soil Horizon Architecture:**
  - **O Horizon:** Fresh organic humus layer.
  - **A Horizon (Topsoil):** Mineral horizon enriched with decomposed organic matter.
  - **B Horizon (Subsoil):** Zone of illuviation (accumulated clays, iron, aluminum).
  - **C Horizon (Regolith/Saprolite):** Partially weathered parent material.
  - **R Horizon:** Unweathered solid bedrock.
`,
    detailed: `# Comprehensive Agricultural Geology & Pedogenesis (Detailed Notes)

## Weathering of Rocks and Minerals in Soil Science Syllabus

Soil formation begins with the physical disintegration and chemical decomposition of parent rocks and minerals. The unconsolidated mantle of weathered material is known as **regolith**, and the upper, biologically active portion developed into distinct genetic horizons is termed the **solum** (true soil).

---

## 1. Classification of Weathering Processes

### A. Physical / Mechanical Weathering (Disintegration)
1. **Thermal Exfoliation:** Diurnal fluctuations in temperature cause differential expansion and contraction of mineral grains (e.g., quartz expands twice as much as orthoclase feldspar), generating shearing stresses that peel outer rock layers like an onion.
2. **Frost Wedging (Congelifraction):** Water trapped in joints and fissures expands by 9% upon freezing, generating hydrostatic pressures up to 146.5 MPa, easily splitting massive granite.
3. **Salt Wedging:** Evaporation of saline solutions in arid environments precipitates halite and gypsum crystals that wedge rock pores apart.

---

### B. Chemical Weathering (Decomposition)
1. **Hydration:** Rigid attachment of water molecules to mineral crystal lattices without chemical decomposition (e.g., conversion of anhydrite to gypsum: $CaSO_4 + 2H_2O \\to CaSO_4 \\cdot 2H_2O$).
2. **Hydrolysis:** The most important chemical weathering reaction in silicate rocks. Hydrogen ($H^+$) and hydroxyl ($OH^-$) ions of dissociated water displace cations in the crystal lattice:
   $$2KAlSi_3O_8 + 2H_2CO_3 + 9H_2O \\to Al_2Si_2O_5(OH)_4 + 2K^+ + 2HCO_3^- + 4H_4SiO_4$$
   *(Orthoclase Feldspar $\\to$ Kaolinite Clay + soluble Potassium)*
3. **Oxidation and Reduction:** Oxidation of ferrous ($Fe^{2+}$) iron to ferric ($Fe^{3+}$) iron destabilizes the crystal structure of biotite, pyroxenes, and olivine, producing rust-colored hematite ($Fe_2O_3$) and limonite.
4. **Carbonation:** Dissolution of carbon dioxide in water creates carbonic acid ($H_2CO_3$), which attacks carbonate rocks:
   $$CaCO_3 + H_2CO_3 \\to Ca(HCO_3)_2$$

---

### C. Biological Weathering
- **Root Wedging:** Tree roots penetrate joint planes; cambial expansion exerts radial turgor pressures exceeding 1.0–1.5 MPa.
- **Organic Acid Chelation:** Microbial respiration and decaying humus release citric, oxalic, and humic acids that chelate metal ions from minerals.
`,
  },
};
