/**
 * Comprehensive dictionary of key concepts and terms extracted from
 * MLRIT DBMS and ANGRAU course artifacts.
 *
 * Each term maps directly to a pure, concise explanation.
 */

export const GLOSSARY_DEFINITIONS: Record<string, string> = {
  // ── MLRIT DBMS UNIT 1: FUNDAMENTALS & ARCHITECTURE ──
  'database': 'An organized collection of interrelated data and persistent facts representing real-world entities.',
  'dbms': 'A specialized software system designed to store, access, manipulate, and protect data securely, efficiently, and concurrently.',
  'database management system': 'A software system designed to store, manage, query, and maintain large collections of structured data securely.',
  'file system': 'Traditional OS-level storage storing records in isolated files, lacking centralized integrity, concurrency control, and crash safety.',
  'data redundancy': 'Duplication of identical data across multiple isolated files or tables, leading to storage waste and synchronization drift.',
  'data inconsistency': 'A state where multiple copies of supposedly identical data show conflicting values across the system.',
  'physical level': 'The lowest level of data abstraction describing how data is actually stored in files, disk blocks, and indices.',
  'internal schema': 'The schema specification at the physical level detailing file structures, indexing mechanisms, and page allocations.',
  'logical level': 'The level of abstraction describing what data is stored in the database and the relationships among that data, managed by the DBA.',
  'conceptual schema': 'The overall logical blueprint of the entire enterprise database, defining all entities, attributes, and relationships.',
  'view level': 'The highest level of data abstraction that presents customized, security-restricted subsets of data to specific user groups.',
  'external schema': 'A tailored view of the database designed for specific user needs while hiding sensitive or irrelevant enterprise data.',
  'data independence': 'The ability to modify a schema definition at one abstraction level without altering schemas at higher levels or rewriting applications.',
  'physical data independence': 'The capacity to alter physical storage structures, index access paths, or disk media without modifying the logical schema or application code.',
  'logical data independence': 'The capacity to modify the conceptual schema (e.g. adding or splitting tables) without rewriting existing external views or user queries.',
  'query processor': 'The database engine subsystem that compiles, optimizes, and executes declarative SQL statements against storage.',
  'ddl interpreter': 'Parses schema definition statements (like CREATE, ALTER, DROP) and records schema metadata in the system data dictionary.',
  'dml compiler': 'Translates high-level declarative DML queries (like SELECT, INSERT) into executable low-level algebraic operations.',
  'query optimizer': 'Evaluates alternative execution trees for a query and selects the lowest-cost plan based on catalog statistics.',
  'query evaluation engine': 'Executes the low-level algebraic primitive instructions output by the query compiler against database storage.',
  'storage manager': 'The subsystem responsible for buffer management, disk page caching, file organization, and enforcing transaction authorization and integrity.',
  'buffer manager': 'Allocates and caches disk pages in RAM memory frames using replacement policies to minimize physical disk I/O.',
  'file manager': 'Manages the allocation of contiguous disk block space and free space maps used to store records on storage media.',
  'authorization & integrity manager': 'Verifies user privileges and tests declarative integrity constraints before permitting updates.',
  'transaction manager': 'The engine component coordinating crash recovery (Write-Ahead Logging) and concurrency control to guarantee ACID properties.',
  'recovery manager': 'Ensures atomicity and durability by maintaining Write-Ahead Logging (WAL) and executing undo/redo passes upon crash recovery.',
  'concurrency control manager': 'Coordinates the simultaneous execution of transactions using locking or MVCC to ensure serializability without lost updates.',
  'database schema': 'The static overall structural design, metadata, and invariant rules of a database, analogous to type definitions.',
  'database instance': 'The dynamic collection of actual data tuples stored in the database at a specific snapshot in time.',
  'data dictionary': 'The active system metadata repository maintaining schema definitions, integrity constraints, and user access privileges.',
  'system catalog': 'The active metadata repository maintaining descriptions of database schemas, constraints, and security authorizations.',

  // ── MLRIT DBMS UNIT 1: ER & EER MODELING ──
  'entity': 'A distinct real-world object, person, place, or concept that is distinguishable from other objects.',
  'entity set': 'A collection of similar entities of the same type that share the same attributes (e.g. all students in a college).',
  'attribute': 'A descriptive property or characteristic possessed by each entity in an entity set (e.g. Student ID or Name).',
  'simple attribute': 'An atomic attribute that cannot be divided into smaller sub-components (for example, Age or Salary).',
  'composite attribute': 'An attribute that can be hierarchically divided into smaller independent components (such as Name into First Name and Last Name).',
  'multivalued attribute': 'An attribute that can hold more than one value for a given entity (such as multiple Phone Numbers or Skill Sets).',
  'derived attribute': 'An attribute whose value is dynamically calculated from stored attributes (such as Age derived from Date of Birth).',
  'superkey': 'A set of one or more attributes that together uniquely identify a specific entity or tuple within a table.',
  'super key': 'A set of one or more attributes that together uniquely identify a specific entity or tuple within a table.',
  'candidate key': 'A minimal superkey containing no redundant attributes that could potentially serve as the primary key.',
  'primary key': 'The minimal candidate key chosen by the database designer to uniquely identify each tuple in a table, with no NULL values allowed.',
  'relationship': 'An association among two or more entities in an enterprise.',
  'relationship set': 'A collection of associations of the same type connecting entities across entity sets.',
  'mapping cardinality': 'The constraint specifying the maximum number of entity instances in one set that can be associated with entity instances in another set (1:1, 1:N, or M:N).',
  'cardinality ratio': 'Specifies the maximum number of relationship instances in which an entity can participate (1:1, 1:N, or M:N).',
  'total participation': 'A constraint requiring that every entity in an entity set must participate in at least one relationship instance (existence dependency).',
  'partial participation': 'A constraint where some entities in the entity set may not participate in any relationship instance.',
  'weak entity set': 'An entity set that lacks sufficient attributes to form its own primary key and depends on an identifying relationship with an owner entity.',
  'discriminator': 'The set of attributes that distinguishes weak entities belonging to the same owner entity, drawn with a dashed underline.',
  'partial key': 'The discriminator attributes of a weak entity that distinguish it among other weak entities linked to the same owner entity.',
  'identifying relationship': 'The relationship connecting a weak entity set to its strong owner entity set, represented as a double diamond.',
  'specialization': 'The top-down process of dividing a generalized entity set into distinct sub-classes with specialized attributes and relationships.',
  'generalization': 'The bottom-up synthesis of combining multiple entity sets sharing common attributes into a higher-level generalized superclass.',
  'disjoint constraint': 'A constraint specifying that an entity can belong to at most one specialized subclass.',
  'overlapping constraint': 'A constraint allowing an entity to simultaneously belong to more than one specialized subclass.',

  // ── MLRIT DBMS UNIT 1: RELATIONAL MODEL & CONSTRAINTS ──
  'relational model': 'A data model representing all enterprise data and relationships as two-dimensional tables of rows (tuples) and columns (attributes).',
  'relation': 'A two-dimensional table of rows and columns satisfying atomic domain constraints and unordered tuples.',
  'tuple': 'A single row in a relational table representing a distinct recorded entity or event.',
  'domain': 'The set of permissible, atomic values permitted for a specific attribute.',
  'domain constraint': 'An integrity rule requiring that every attribute value in a tuple must be an atomic element from its predefined data type.',
  'entity integrity': 'The rule requiring that no attribute participating in the primary key of a base table may accept a NULL value.',
  'entity integrity constraint': 'The rule requiring that no attribute participating in the primary key of a base table may accept a NULL value.',
  'referential integrity': 'A constraint ensuring that any foreign key value in a referencing relation must correspond to an existing primary key value in the referenced relation, or be NULL.',
  'referential integrity constraint': 'A constraint ensuring that any foreign key value in a referencing relation must correspond to an existing primary key value in the referenced relation, or be NULL.',
  'foreign key': 'An attribute or set of attributes in a relation that references the primary key of another relation to maintain referential integrity.',
  'relational view': 'A virtual table defined by an underlying SQL query over base tables, computed dynamically when queried.',
  'view': 'A virtual table defined by a SQL query expression over base tables; does not store independent tuples physically unless materialized.',
  'ddl': 'Data Definition Language: the SQL sub-language (CREATE, ALTER, DROP, TRUNCATE) used to specify and modify database schemas.',
  'dml': 'Data Manipulation Language: the SQL sub-language (SELECT, INSERT, UPDATE, DELETE) used to query and modify table tuples.',
  'dcl': 'Data Control Language: SQL statements (GRANT, REVOKE) used to manage database access permissions and security privileges.',
  'tcl': 'Transaction Control Language: SQL commands (COMMIT, ROLLBACK, SAVEPOINT) that define and manage atomic transaction boundaries.',
  'acid': 'The four transaction safety guarantees: Atomicity (all-or-nothing), Consistency (rule preservation), Isolation (concurrency safety), and Durability (persistence).',
  'atomicity': 'The transaction guarantee ensuring that all operations within a transaction execute completely or none are applied.',
  'first normal form': 'The relational rule requiring that all attribute values in a table must be atomic and indivisible, with no repeating groups.',
  '1nf': 'First Normal Form: requiring that every column contains atomic values with no repeating groups or nested arrays.',

  // ── ANGRAU ENTOMOLOGY CHAPTER 1/2 ──
  'foregut (stomodaeum)': 'The anterior ectodermal region of the insect digestive tract responsible for food ingestion, storage, and mechanical grinding.',
  'stomodaeum': 'The anterior ectodermal region of the insect digestive tract responsible for ingestion and mechanical grinding.',
  'midgut (mesenteron)': 'The central endodermal region of the insect digestive tract specialized for enzyme secretion, digestion, and nutrient absorption.',
  'mesenteron': 'The central endodermal region of the insect digestive tract specialized for enzyme secretion, digestion, and nutrient absorption.',
  'hindgut (proctodaeum)': 'The posterior ectodermal region of the insect digestive tract responsible for water, salt, and nutrient reabsorption and waste elimination.',
  'proctodaeum': 'The posterior ectodermal region of the insect digestive tract responsible for water and ion reabsorption and waste elimination.',
  'proventriculus': 'The muscular gizzard in the foregut equipped with internal cuticular teeth that mechanically grinds solid food particles.',
  'crop': 'The dilated, thin-walled food storage reservoir in the insect foregut.',
  'peritrophic membrane': 'A semi-permeable chitinous envelope lining the midgut that shields epithelial cells from mechanical abrasion and pathogens.',
  'malpighian tubules': 'Excretory organs located at the midgut-hindgut junction that filter metabolic waste and uric acid from the hemolymph.',
  'gastric caeca': 'Blind tubular outgrowths at the anterior end of the midgut that increase surface area for enzyme secretion and absorption.',
  'salivary glands': 'Glands opening near the mouthparts that secrete digestive enzymes and lubricants to moisten ingested food.',
  'intima': 'The cuticular lining of the insect foregut and hindgut derived from ectoderm, shed during each molt.',
  'cuticular intima': 'The protective chitinous inner lining of the foregut and hindgut that prevents abrasion from coarse food.',
  'ectodermal': 'Embryonic tissue layer giving rise to external structures and the cuticular linings of the foregut and hindgut.',
  'endodermal': 'Embryonic tissue layer forming the functional epithelial lining of the midgut responsible for enzymatic absorption.',
  'foregut': 'The anterior section of the alimentary canal lined with cuticle, specialized for ingestion, storage, and mastication.',
  'midgut': 'The middle region of the digestive tract lacking a cuticular lining, dedicated to chemical digestion and nutrient uptake.',
  'hindgut': 'The posterior cuticular region of the insect digestive tract that resorbs water and essential salts prior to excretion.',
  'alimentary canal': 'The continuous digestive tube running from the mouth to the anus, divided into foregut, midgut, and hindgut.',
  'ileum': 'The anterior tubular region of the hindgut following the Malpighian tubules.',
  'colon': 'The intermediate section of the hindgut leading to the rectum.',
  'rectum': 'The expanded posterior chamber of the hindgut containing rectal pads dedicated to water reabsorption.',
  'rectal pads': 'Specialized thickened epithelial cells in the rectum that actively absorb water and electrolytes.',
  'cibarium': 'The preoral food cavity lying in front of the mouthparts.',
  'pharynx': 'The muscular pump behind the mouth that sucks liquid food into the esophagus.',
  'oesophagus': 'The narrow tube conducting food from the pharynx to the crop.',
  'ventriculus': 'The midgut stomach where chemical digestion and nutrient uptake take place.',
  'nidi': 'Nests of regenerative stem cells at the base of the midgut epithelium.',
  'columnar cells': 'Tall absorptive and secretory epithelial cells of the midgut.',
  'columnar cell': 'Tall absorptive and secretory epithelial cell of the midgut.',
  'goblet cells': 'Potassium-secreting cavity cells in the midgut epithelium of phytophagous insects.',
  'goblet cell': 'Potassium-secreting cavity cell in the midgut epithelium of phytophagous insects.',
  'malpighian tubule': 'Excretory organ located at the midgut-hindgut junction that filters metabolic waste and uric acid from the hemolymph.',
  'gastric caecum': 'Blind tubular outgrowth at the anterior end of the midgut that increases surface area for enzyme secretion and absorption.',
  'salivary gland': 'Gland opening near the mouthparts that secretes digestive enzymes and lubricants to moisten ingested food.',
  'rectal pad': 'Specialized thickened epithelial cell in the rectum that actively absorbs water and electrolytes.',
  'ectoderm': 'The outer primary embryonic germ layer giving rise to the epidermis and the cuticular linings of the foregut and hindgut.',
  'endoderm': 'The inner primary embryonic germ layer giving rise to the functional epithelial lining of the midgut.',
  'esophagus': 'The narrow tube conducting food from the pharynx to the crop.',
  'ecdysis': 'The periodic process of shedding the old cuticle (molting) in insects allowing growth and development.',
  'hemolymph': 'The circulatory fluid of insects analogous to blood and lymph that bathes organs directly in the hemocoel.',
  'chitin': 'A tough, protective nitrogenous polysaccharide forming the main structural component of the arthropod cuticle.',
  'cuticle': 'The non-cellular multi-layered exoskeleton lining the external body and ectodermal gut regions of insects.',
  'gizzard': 'The muscular foregut organ (proventriculus) equipped with internal cuticular teeth that mechanically grinds solid food particles.',
};

export const COMPILED_GLOSSARY_REGEX = (() => {
  const keys = Object.keys(GLOSSARY_DEFINITIONS)
    .filter((k) => k.length >= 3)
    .sort((a, b) => b.length - a.length);
  const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
})();

/**
 * Normalizes a raw phrase or term for matching in GLOSSARY_DEFINITIONS.
 */
export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/^[*_~`#]+|[*_~`#]+$/g, '')
    .replace(/[:.?,;!]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the definition for a given term, checking exact matches and variations.
 */
export function getTermDefinition(rawTerm: string): string | null {
  if (!rawTerm) return null;
  const norm = normalizeTerm(rawTerm);
  if (GLOSSARY_DEFINITIONS[norm]) {
    return GLOSSARY_DEFINITIONS[norm];
  }

  for (const [key, def] of Object.entries(GLOSSARY_DEFINITIONS)) {
    if (norm === key) return def;
    if (norm.startsWith(`${key}:`) || norm.startsWith(`${key} `)) {
      return def;
    }
  }

  return null;
}

/**
 * Parses markdown structured glossary definitions from the Cloud Run API
 */
export function parseGlossaryMarkdown(markdown: string): Record<string, string> {
  const dict: Record<string, string> = {};
  if (!markdown) return dict;

  const lines = markdown.split('\n');
  let currentTerm = '';

  for (const line of lines) {
    if (line.startsWith('### ')) {
      currentTerm = normalizeTerm(line.replace('### ', ''));
    } else if (currentTerm && line.includes('- **Definition:**')) {
      const def = line.replace('- **Definition:**', '').trim();
      if (def) {
        dict[currentTerm] = def;
      }
    }
  }

  return dict;
}

/**
 * Fetches dynamic glossary definitions for a chapter from Cloud Run API
 */
export async function fetchChapterGlossary(
  chapterNum: number,
  subjectId: string = 'entomology'
): Promise<Record<string, string>> {
  const chPad = String(chapterNum).padStart(2, '0');
  const cacheKey = `saral_glossary_${subjectId}_ch${chPad}`;
  const GCS_API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://saralvidhya-api-193782571555.asia-south1.run.app';

  try {
    const res = await fetch(`${GCS_API_BASE}/api/content/angrau/${subjectId}/chapter_${chPad}/read/glossary`);
    if (res.ok) {
      const text = await res.text();
      const parsed = parseGlossaryMarkdown(text);
      if (Object.keys(parsed).length > 0) {
        // Merge into active in-memory dictionary
        Object.assign(GLOSSARY_DEFINITIONS, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[GlossaryTerms] Failed to fetch live glossary for chapter ${chapterNum}:`, err);
  }

  return {};
}
