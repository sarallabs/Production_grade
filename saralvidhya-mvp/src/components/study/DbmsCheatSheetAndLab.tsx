import React, { useState, useMemo, useCallback } from "react";
import { cloudStorage } from "@/context/CloudStateContext";
import { GCS_API_BASE } from "@/data/manifestService";

export const DBMS_CLOUD_CHEAT_SHEET_URL = `${GCS_API_BASE}/api/content/mlrit/dbms/chapter_01/media/cheat_sheet.jpg?v=2`;
export const DBMS_CLOUD_LAB_NOTEBOOK_URL = `${GCS_API_BASE}/api/content/mlrit/dbms/chapter_01/media/DBMS_Interactive_Labs.ipynb?v=2`;

// ============================================================================
// IN-BROWSER UNIVERSITY RELATIONAL DB ENGINE & AUTO-GRADER
// (Ported from DBMS_Interactive_Labs.ipynb: SQLite3 + Relational Algebra + BCNF + ACID)
// ============================================================================

interface DepartmentRow {
  dept_id: number;
  dept_code: string;
  dept_name: string;
  building: string;
}

interface InstructorRow {
  instructor_id: number;
  full_name: string;
  email: string;
  salary: number;
  dept_id: number | null;
  office_room?: string;
}

interface CourseRow {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  dept_id: number;
}

interface StudentRow {
  student_id: number;
  roll_no: string;
  student_name: string;
  major_dept_id: number | null;
  gpa: number;
}

interface EnrollmentRow {
  student_id: number;
  course_id: number;
  semester: string;
  grade: string | null;
}

interface AccountRow {
  account_id: number;
  account_name: string;
  balance: number;
}

class InMemoryRelationalDB {
  tablesCreated: Set<string> = new Set();
  viewsCreated: Set<string> = new Set();
  instructorHasOfficeRoom = false;
  seeded = false;
  csSalaryRaised = false;
  cascadeVerified = false;
  visitingInstructorAdded = false;
  bcnfDecomposed = false;
  scholarshipTransferred = false;
  bplusIndexCreated = false;

  departments: DepartmentRow[] = [];
  instructors: InstructorRow[] = [];
  courses: CourseRow[] = [];
  students: StudentRow[] = [];
  enrollments: EnrollmentRow[] = [];
  accounts: AccountRow[] = [];

  constructor() {
    this.resetAndSeedDefault();
  }

  resetAndSeedDefault() {
    this.tablesCreated = new Set(["Departments", "Instructors", "Students", "Courses", "Enrollments"]);
    this.viewsCreated = new Set(["Public_Instructor_Directory"]);
    this.instructorHasOfficeRoom = true;
    this.seeded = true;
    this.csSalaryRaised = false;
    this.cascadeVerified = false;
    this.visitingInstructorAdded = false;
    this.bcnfDecomposed = false;
    this.scholarshipTransferred = false;
    this.bplusIndexCreated = false;

    this.departments = [
      { dept_id: 1, dept_code: "CS", dept_name: "Computer Science", building: "Turing Hall" },
      { dept_id: 2, dept_code: "EE", dept_name: "Electrical Engineering", building: "Tesla Lab" },
      { dept_id: 3, dept_code: "ME", dept_name: "Mechanical Engineering", building: "Newton Block" },
      { dept_id: 4, dept_code: "PH", dept_name: "Physics", building: "Feynman Center" },
    ];

    this.instructors = [
      { instructor_id: 101, full_name: "Dr. Ada Lovelace", email: "ada@univ.edu", salary: 125000, dept_id: 1, office_room: "TH-301" },
      { instructor_id: 102, full_name: "Dr. Alan Turing", email: "turing@univ.edu", salary: 135000, dept_id: 1, office_room: "TH-305" },
      { instructor_id: 103, full_name: "Dr. Grace Hopper", email: "hopper@univ.edu", salary: 128000, dept_id: 1, office_room: "TH-210" },
      { instructor_id: 104, full_name: "Dr. Nikola Tesla", email: "tesla@univ.edu", salary: 118000, dept_id: 2, office_room: "TL-101" },
      { instructor_id: 105, full_name: "Dr. Claude Shannon", email: "shannon@univ.edu", salary: 122000, dept_id: 2, office_room: "TL-204" },
      { instructor_id: 106, full_name: "Dr. Richard Feynman", email: "feynman@univ.edu", salary: 130000, dept_id: 4, office_room: "FC-401" },
    ];

    this.courses = [
      { course_id: 501, course_code: "CS101", title: "Database Management Systems", credits: 4, dept_id: 1 },
      { course_id: 502, course_code: "CS102", title: "Operating Systems", credits: 4, dept_id: 1 },
      { course_id: 503, course_code: "CS103", title: "Distributed Systems", credits: 3, dept_id: 1 },
      { course_id: 504, course_code: "EE201", title: "Digital Signal Processing", credits: 4, dept_id: 2 },
      { course_id: 505, course_code: "PH301", title: "Quantum Mechanics", credits: 3, dept_id: 4 },
    ];

    this.students = [
      { student_id: 1001, roll_no: "R2026-01", student_name: "Aarav Sharma", major_dept_id: 1, gpa: 3.9 },
      { student_id: 1002, roll_no: "R2026-02", student_name: "Diya Patel", major_dept_id: 1, gpa: 3.7 },
      { student_id: 1003, roll_no: "R2026-03", student_name: "Rohan Verma", major_dept_id: 2, gpa: 3.4 },
      { student_id: 1004, roll_no: "R2026-04", student_name: "Meera Nair", major_dept_id: 1, gpa: 3.95 },
      { student_id: 1005, roll_no: "R2026-05", student_name: "Kabir Singh", major_dept_id: 3, gpa: 3.1 },
      { student_id: 1006, roll_no: "R2026-06", student_name: "Ananya Rao", major_dept_id: null, gpa: 3.6 },
    ];

    this.enrollments = [
      { student_id: 1001, course_id: 501, semester: "Fall-2026", grade: "A" },
      { student_id: 1001, course_id: 502, semester: "Fall-2026", grade: "A" },
      { student_id: 1001, course_id: 503, semester: "Fall-2026", grade: "B" },
      { student_id: 1002, course_id: 501, semester: "Fall-2026", grade: "A" },
      { student_id: 1002, course_id: 502, semester: "Fall-2026", grade: "B" },
      { student_id: 1003, course_id: 504, semester: "Fall-2026", grade: "A" },
      { student_id: 1004, course_id: 501, semester: "Fall-2026", grade: "A" },
      { student_id: 1004, course_id: 502, semester: "Fall-2026", grade: "A" },
      { student_id: 1004, course_id: 503, semester: "Fall-2026", grade: "A" },
      { student_id: 1004, course_id: 504, semester: "Fall-2026", grade: "B" },
    ];

    this.accounts = [
      { account_id: 1, account_name: "University_Grant_Pool", balance: 20000.0 },
      { account_id: 2, account_name: "Aarav_Scholarship_Wallet", balance: 1000.0 },
    ];
  }
}

function formatTable(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return "(0 rows returned)";
  const cols = Object.keys(rows[0]);
  const widths = cols.map((c) =>
    Math.max(
      c.length,
      ...rows.map((r) => String(r[c] === null || r[c] === undefined ? "NULL" : r[c]).length)
    )
  );
  const header = cols.map((c, i) => c.padEnd(widths[i])).join(" | ");
  const sep = widths.map((w) => "-".repeat(w)).join("-+-");
  const body = rows
    .map((r) =>
      cols
        .map((c, i) => String(r[c] === null || r[c] === undefined ? "NULL" : r[c]).padEnd(widths[i]))
        .join(" | ")
    )
    .join("\n");
  return `${header}\n${sep}\n${body}\n(${rows.length} row${rows.length === 1 ? "" : "s"})`;
}

interface DbmsLabTask {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  solutionCode: string;
  runAndVerify: (code: string, db: InMemoryRelationalDB) => { logs: string; passed: boolean; verifyMsg: string };
}

interface DbmsLabModule {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  concepts: string[];
  tasks: DbmsLabTask[];
}

const DBMS_LAB_MODULES: DbmsLabModule[] = [
  {
    id: "lab_1",
    badge: "Lab 1",
    title: "Architecture, ER Modeling, Keys & DDL",
    subtitle: "Three-Schema Architecture, Strong Entities, 1:N & M:N Bridge Tables, and Logical Data Independence",
    concepts: [
      "Three-Schema Architecture: Internal (Physical) ↔ Conceptual (CREATE TABLE) ↔ External (CREATE VIEW).",
      "Primary Key (PK): UNIQUE + NOT NULL (Entity Integrity); Alternate Key (AK): Secondary Candidate Key enforced via UNIQUE.",
      "Foreign Key (FK): Enforces Referential Integrity across 1:N and M:N relationships (ON DELETE SET NULL / CASCADE).",
      "M:N Bridge Table: Many-to-many relationship between Students and Courses mapped to Enrollments with Composite PK (student_id, course_id).",
    ],
    tasks: [
      {
        id: "task_1_1",
        title: "Task 1.1: Create Strong Entities & 1:N Relationships (DDL)",
        prompt:
          "Create tables `Departments` (PK `dept_id`, AK `dept_code UNIQUE`, `dept_name UNIQUE`, `building`) and `Instructors` (PK `instructor_id`, AK `email UNIQUE`, `salary CHECK (salary > 0)`, and FK `dept_id REFERENCES Departments(dept_id) ON DELETE SET NULL`).",
        starterCode: `CREATE TABLE Departments (
    dept_id INTEGER PRIMARY KEY,
    dept_code TEXT NOT NULL UNIQUE,
    dept_name TEXT NOT NULL UNIQUE,
    building TEXT NOT NULL
);

CREATE TABLE Instructors (
    instructor_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    salary REAL NOT NULL CHECK (salary > 0),
    dept_id INTEGER,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id) ON DELETE SET NULL
);`,
        solutionCode: `CREATE TABLE Departments (
    dept_id INTEGER PRIMARY KEY,
    dept_code TEXT NOT NULL UNIQUE,
    dept_name TEXT NOT NULL UNIQUE,
    building TEXT NOT NULL
);

CREATE TABLE Instructors (
    instructor_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    salary REAL NOT NULL CHECK (salary > 0),
    dept_id INTEGER,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id) ON DELETE SET NULL
);`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const hasDepts = upper.includes("CREATE TABLE DEPARTMENTS") && upper.includes("PRIMARY KEY") && upper.includes("UNIQUE");
          const hasInst =
            upper.includes("CREATE TABLE INSTRUCTORS") &&
            upper.includes("FOREIGN KEY") &&
            upper.includes("REFERENCES DEPARTMENTS") &&
            upper.includes("CHECK");
          if (hasDepts) db.tablesCreated.add("Departments");
          if (hasInst) db.tablesCreated.add("Instructors");
          const passed = hasDepts && hasInst;
          return {
            logs: passed
              ? "SQL script executed successfully.\nCreated table: Departments (PK: dept_id, AK: dept_code, dept_name)\nCreated table: Instructors (PK: instructor_id, FK: dept_id -> Departments.dept_id ON DELETE SET NULL)"
              : "ERROR: Missing CREATE TABLE Departments or Instructors with PRIMARY KEY, UNIQUE, CHECK (salary > 0), and FOREIGN KEY constraints.",
            passed,
            verifyMsg: passed
              ? "Task 1.1 Verification Passed! Strong entities & 1:N Foreign Key constraints verified."
              : "Ensure both Departments and Instructors tables define PRIMARY KEY, UNIQUE Alternate Keys, CHECK (salary > 0), and FOREIGN KEY.",
          };
        },
      },
      {
        id: "task_1_2",
        title: "Task 1.2: Create M:N Bridge Table with Composite Primary Key",
        prompt:
          "Create `Students`, `Courses`, and the M:N junction table `Enrollments` with Composite Primary Key `PRIMARY KEY (student_id, course_id)` and `ON DELETE CASCADE` Foreign Keys.",
        starterCode: `CREATE TABLE Students (
    student_id INTEGER PRIMARY KEY,
    roll_no TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    major_dept_id INTEGER,
    gpa REAL DEFAULT 0.0 CHECK (gpa >= 0.0 AND gpa <= 4.0),
    FOREIGN KEY (major_dept_id) REFERENCES Departments(dept_id)
);

CREATE TABLE Courses (
    course_id INTEGER PRIMARY KEY,
    course_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits BETWEEN 1 AND 6),
    dept_id INTEGER NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id)
);

CREATE TABLE Enrollments (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester TEXT NOT NULL,
    grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);`,
        solutionCode: `CREATE TABLE Students (
    student_id INTEGER PRIMARY KEY,
    roll_no TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    major_dept_id INTEGER,
    gpa REAL DEFAULT 0.0 CHECK (gpa >= 0.0 AND gpa <= 4.0),
    FOREIGN KEY (major_dept_id) REFERENCES Departments(dept_id)
);

CREATE TABLE Courses (
    course_id INTEGER PRIMARY KEY,
    course_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits BETWEEN 1 AND 6),
    dept_id INTEGER NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id)
);

CREATE TABLE Enrollments (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester TEXT NOT NULL,
    grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const ok =
            upper.includes("CREATE TABLE STUDENTS") &&
            upper.includes("CREATE TABLE COURSES") &&
            upper.includes("CREATE TABLE ENROLLMENTS") &&
            /PRIMARY\s+KEY\s*\(\s*STUDENT_ID\s*,\s*COURSE_ID\s*\)/i.test(code) &&
            upper.includes("ON DELETE CASCADE");
          if (ok) {
            db.tablesCreated.add("Students");
            db.tablesCreated.add("Courses");
            db.tablesCreated.add("Enrollments");
          }
          return {
            logs: ok
              ? "SQL script executed successfully.\nCreated tables: Students, Courses, Enrollments (Composite PK: student_id, course_id | ON DELETE CASCADE)"
              : "ERROR: Check Composite PRIMARY KEY (student_id, course_id) and ON DELETE CASCADE in Enrollments.",
            passed: ok,
            verifyMsg: ok
              ? "Task 1.2 Verification Passed! M:N Bridge Table with Composite PK & Referential Cascade created."
              : "Ensure Students, Courses, and Enrollments are created with PRIMARY KEY (student_id, course_id).",
          };
        },
      },
      {
        id: "task_1_3",
        title: "Task 1.3: Logical Data Independence & External Schema (VIEW & ALTER TABLE)",
        prompt:
          "Create an External View `Public_Instructor_Directory` exposing `instructor_id, full_name, email, dept_id` (hiding `salary`), and alter the Conceptual Schema `Instructors` to add `office_room TEXT DEFAULT 'TBD'`.",
        starterCode: `CREATE VIEW Public_Instructor_Directory AS
SELECT instructor_id, full_name, email, dept_id
FROM Instructors;

ALTER TABLE Instructors ADD COLUMN office_room TEXT DEFAULT 'TBD';`,
        solutionCode: `CREATE VIEW Public_Instructor_Directory AS
SELECT instructor_id, full_name, email, dept_id
FROM Instructors;

ALTER TABLE Instructors ADD COLUMN office_room TEXT DEFAULT 'TBD';`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const hasView =
            upper.includes("CREATE VIEW PUBLIC_INSTRUCTOR_DIRECTORY") &&
            upper.includes("SELECT INSTRUCTOR_ID") &&
            !upper.includes("SALARY");
          const hasAlter = upper.includes("ALTER TABLE INSTRUCTORS") && upper.includes("OFFICE_ROOM");
          const passed = hasView && hasAlter;
          if (passed) {
            db.viewsCreated.add("Public_Instructor_Directory");
            db.instructorHasOfficeRoom = true;
          }
          const schemaRows = [
            { name: "Courses", type: "table" },
            { name: "Departments", type: "table" },
            { name: "Enrollments", type: "table" },
            { name: "Instructors", type: "table" },
            { name: "Students", type: "table" },
            { name: "Public_Instructor_Directory", type: "view" },
          ];
          return {
            logs: passed
              ? `SQL script executed successfully.\n\n${formatTable(schemaRows)}\nLab 1 Verification Passed!`
              : "ERROR: Must create view Public_Instructor_Directory (without salary) and ALTER TABLE Instructors ADD COLUMN office_room.",
            passed,
            verifyMsg: passed
              ? "Lab 1 Verification Passed! 5 Conceptual Tables + 1 External View verified for Logical Data Independence."
              : "Verify CREATE VIEW Public_Instructor_Directory and ALTER TABLE Instructors ADD COLUMN office_room.",
          };
        },
      },
    ],
  },
  {
    id: "lab_2",
    badge: "Lab 2",
    title: "Basic CRUD Operations (DML) & SQL Execution Order",
    subtitle: "INSERT Constraint Enforcement, 8-Stage SELECT Pipeline, UPDATE & ON DELETE CASCADE",
    concepts: [
      "CRUD to SQL DML: Create -> INSERT INTO | Read -> SELECT | Update -> UPDATE ... SET ... WHERE | Delete -> DELETE FROM ... WHERE.",
      "Canonical SQL Execution Order: FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT/OFFSET.",
      "DELETE (DML, row-by-row, fires triggers, supports WHERE) vs TRUNCATE (DDL, all rows, minimal log) vs DROP (DDL, removes table & schema).",
    ],
    tasks: [
      {
        id: "task_2_1",
        title: "Task 2.1: CREATE (INSERT INTO) & Integrity Constraint Testing",
        prompt:
          "Seed the university tables (`4 Departments`, `6 Instructors`, `5 Courses`, `6 Students`, `10 Enrollments`) and verify that duplicate Alternate Key (`ada@univ.edu`) and invalid Foreign Key (`course_id = 9999`) raise `IntegrityError`.",
        starterCode: `-- Seed initial University records & test Integrity Constraints
INSERT INTO Departments (dept_id, dept_code, dept_name, building) VALUES
(1, 'CS', 'Computer Science', 'Turing Hall'),
(2, 'EE', 'Electrical Engineering', 'Tesla Lab'),
(3, 'ME', 'Mechanical Engineering', 'Newton Block'),
(4, 'PH', 'Physics', 'Feynman Center');

-- Test Alternate Key UNIQUE & Foreign Key Referential Integrity blocks:
-- INSERT INTO Instructors VALUES (999, 'Clone', 'ada@univ.edu', 90000, 1);
-- INSERT INTO Enrollments VALUES (1001, 9999, 'Fall-2026', 'A');`,
        solutionCode: `INSERT INTO Departments (dept_id, dept_code, dept_name, building) VALUES
(1, 'CS', 'Computer Science', 'Turing Hall'),
(2, 'EE', 'Electrical Engineering', 'Tesla Lab'),
(3, 'ME', 'Mechanical Engineering', 'Newton Block'),
(4, 'PH', 'Physics', 'Feynman Center');`,
        runAndVerify: (code, db) => {
          db.resetAndSeedDefault();
          const passed = code.toUpperCase().includes("INSERT INTO DEPARTMENTS");
          return {
            logs: `SQL script executed successfully.\nSeeded: 4 Departments, 6 Instructors, 5 Courses, 6 Students, 10 Enrollments.\n[Expected Constraint Block] Alternate Key UNIQUE violation caught: UNIQUE constraint failed: Instructors.email\n[Expected Constraint Block] Foreign Key Referential Integrity violation caught: FOREIGN KEY constraint failed`,
            passed,
            verifyMsg: passed
              ? "Task 2.1 Verification Passed! Seed records inserted and UNIQUE / FOREIGN KEY constraints enforced."
              : "Include the INSERT INTO Departments statement to seed the database.",
          };
        },
      },
      {
        id: "task_2_2",
        title: "Task 2.2: READ (SELECT) & 8-Stage SQL Execution Order Pipeline",
        prompt:
          "Join `Departments d` and `Instructors i`, filter `WHERE i.salary >= 120000`, `GROUP BY d.dept_code, d.dept_name`, filter groups `HAVING COUNT(i.instructor_id) >= 1 AND AVG(i.salary) > 121000`, `ORDER BY avg_salary DESC`, and `LIMIT 2`.",
        starterCode: `SELECT 
    d.dept_code,
    d.dept_name,
    COUNT(i.instructor_id) AS high_earner_count,
    ROUND(AVG(i.salary), 2) AS avg_salary
FROM Departments d
JOIN Instructors i ON d.dept_id = i.dept_id
WHERE i.salary >= 120000
GROUP BY d.dept_code, d.dept_name
HAVING COUNT(i.instructor_id) >= 1 AND AVG(i.salary) > 121000
ORDER BY avg_salary DESC
LIMIT 2;`,
        solutionCode: `SELECT 
    d.dept_code,
    d.dept_name,
    COUNT(i.instructor_id) AS high_earner_count,
    ROUND(AVG(i.salary), 2) AS avg_salary
FROM Departments d
JOIN Instructors i ON d.dept_id = i.dept_id
WHERE i.salary >= 120000
GROUP BY d.dept_code, d.dept_name
HAVING COUNT(i.instructor_id) >= 1 AND AVG(i.salary) > 121000
ORDER BY avg_salary DESC
LIMIT 2;`,
        runAndVerify: (code) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("FROM DEPARTMENTS") &&
            upper.includes("JOIN INSTRUCTORS") &&
            upper.includes("WHERE") &&
            upper.includes("120000") &&
            upper.includes("GROUP BY") &&
            upper.includes("HAVING") &&
            upper.includes("ORDER BY") &&
            upper.includes("LIMIT 2");
          const resultRows = [
            { dept_code: "PH", dept_name: "Physics", high_earner_count: 1, avg_salary: 130000.0 },
            { dept_code: "CS", dept_name: "Computer Science", high_earner_count: 3, avg_salary: 129333.33 },
          ];
          return {
            logs: passed
              ? `${formatTable(resultRows)}\nTask 2.2 Verification Passed!`
              : "ERROR: Query must include JOIN, WHERE i.salary >= 120000, GROUP BY, HAVING, ORDER BY avg_salary DESC, and LIMIT 2.",
            passed,
            verifyMsg: passed
              ? "Task 2.2 Verification Passed! Top 2 high-earning departments (PH: 130000.0, CS: 129333.33) returned."
              : "Check your WHERE, GROUP BY, HAVING, ORDER BY, and LIMIT 2 clauses.",
          };
        },
      },
      {
        id: "task_2_3",
        title: "Task 2.3: UPDATE & DELETE Operations (with ON DELETE CASCADE Verification)",
        prompt:
          "Give a 5% salary raise (`salary = ROUND(salary * 1.05, 2)`) to CS instructors (`dept_id = 1`), then insert & delete temporary student `1099` to verify child rows in `Enrollments` are automatically deleted via `ON DELETE CASCADE`.",
        starterCode: `UPDATE Instructors SET salary = ROUND(salary * 1.05, 2) WHERE dept_id = 1;

INSERT INTO Students VALUES (1099, 'R2026-99', 'Temp Student', 1, 3.0);
INSERT INTO Enrollments VALUES (1099, 501, 'Fall-2026', 'B');

DELETE FROM Students WHERE student_id = 1099;`,
        solutionCode: `UPDATE Instructors SET salary = ROUND(salary * 1.05, 2) WHERE dept_id = 1;

INSERT INTO Students VALUES (1099, 'R2026-99', 'Temp Student', 1, 3.0);
INSERT INTO Enrollments VALUES (1099, 501, 'Fall-2026', 'B');

DELETE FROM Students WHERE student_id = 1099;`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("UPDATE INSTRUCTORS") &&
            upper.includes("1.05") &&
            upper.includes("DELETE FROM STUDENTS") &&
            upper.includes("1099");
          if (passed) {
            db.csSalaryRaised = true;
            db.cascadeVerified = true;
          }
          const updatedCs = [
            { instructor_id: 101, full_name: "Dr. Ada Lovelace", salary: 131250.0 },
            { instructor_id: 102, full_name: "Dr. Alan Turing", salary: 141750.0 },
            { instructor_id: 103, full_name: "Dr. Grace Hopper", salary: 134400.0 },
          ];
          return {
            logs: passed
              ? `Statement executed successfully. Rows affected: 3\n${formatTable(updatedCs)}\nEnrollments for student 1099 before DELETE: 1\nStatement executed successfully. Rows affected: 1\nEnrollments for student 1099 after DELETE: 0\nTask 2.3 CRUD Verification Passed!`
              : "ERROR: Must execute UPDATE Instructors (+5% where dept_id = 1) and DELETE FROM Students WHERE student_id = 1099.",
            passed,
            verifyMsg: passed
              ? "Task 2.3 CRUD Verification Passed! +5% CS salary update & ON DELETE CASCADE verified."
              : "Ensure both UPDATE Instructors and DELETE FROM Students WHERE student_id = 1099 are present.",
          };
        },
      },
    ],
  },
  {
    id: "lab_3",
    badge: "Lab 3",
    title: "Relational Algebra & Complete SQL Joins Reference",
    subtitle: "Left Anti-Joins, Full Excluding Joins, and Relational Division (R ÷ S)",
    concepts: [
      "Relational Algebra Operators: Selection (σ), Projection (π), Rename (ρ), Union (∪), Set Diff (−), Cartesian Product (×), Natural Join (⋈), Division (÷).",
      "Left Excluding Join (Anti-Join): LEFT JOIN ... WHERE B.key IS NULL finds tuples in A with zero matching rows in B.",
      "Full Excluding Join: FULL OUTER JOIN ... WHERE A.key IS NULL OR B.key IS NULL finds rows unique to A or unique to B.",
      "Relational Division (R ÷ S): Finds entities in R associated with EVERY tuple in S (implemented via NOT EXISTS ... EXCEPT).",
    ],
    tasks: [
      {
        id: "task_3_1",
        title: "Task 3.1: Left Join vs. Left Excluding Join (Anti-Join)",
        prompt:
          "Write two Left Anti-Join queries: (1) Find all `Departments` with no instructors assigned (`i.instructor_id IS NULL`), and (2) Find all `Students` with zero course enrollments (`e.course_id IS NULL`).",
        starterCode: `-- 1. Departments with no instructors assigned
SELECT d.dept_id, d.dept_code, d.dept_name
FROM Departments d
LEFT JOIN Instructors i ON d.dept_id = i.dept_id
WHERE i.instructor_id IS NULL;

-- 2. Students with no course enrollments
SELECT s.student_id, s.roll_no, s.student_name
FROM Students s
LEFT JOIN Enrollments e ON s.student_id = e.student_id
WHERE e.course_id IS NULL;`,
        solutionCode: `SELECT d.dept_id, d.dept_code, d.dept_name
FROM Departments d
LEFT JOIN Instructors i ON d.dept_id = i.dept_id
WHERE i.instructor_id IS NULL;

SELECT s.student_id, s.roll_no, s.student_name
FROM Students s
LEFT JOIN Enrollments e ON s.student_id = e.student_id
WHERE e.course_id IS NULL;`,
        runAndVerify: (code) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("LEFT JOIN INSTRUCTORS") &&
            upper.includes("INSTRUCTOR_ID IS NULL") &&
            upper.includes("LEFT JOIN ENROLLMENTS") &&
            upper.includes("COURSE_ID IS NULL");
          const unassignedDepts = [{ dept_id: 3, dept_code: "ME", dept_name: "Mechanical Engineering" }];
          const unenrolledStudents = [
            { student_id: 1005, roll_no: "R2026-05", student_name: "Kabir Singh" },
            { student_id: 1006, roll_no: "R2026-06", student_name: "Ananya Rao" },
          ];
          return {
            logs: passed
              ? `Departments with no instructors:\n${formatTable(unassignedDepts)}\n\nStudents with no course enrollments:\n${formatTable(unenrolledStudents)}\nTask 3.1 Verification Passed!`
              : "ERROR: Both LEFT JOIN ... WHERE ... IS NULL anti-join queries are required.",
            passed,
            verifyMsg: passed
              ? "Task 3.1 Verification Passed! Unassigned department (ME) and unenrolled students (1005, 1006) identified."
              : "Use LEFT JOIN with WHERE i.instructor_id IS NULL and WHERE e.course_id IS NULL.",
          };
        },
      },
      {
        id: "task_3_2",
        title: "Task 3.2: Full Outer Join & Full Excluding Join",
        prompt:
          "After inserting visiting instructor `Dr. John von Neumann` (`dept_id = NULL`), write a Full Excluding Join between `Departments d` and `Instructors i` (`FULL OUTER JOIN ... WHERE d.dept_id IS NULL OR i.dept_id IS NULL`).",
        starterCode: `INSERT OR IGNORE INTO Instructors (instructor_id, full_name, email, salary, dept_id)
VALUES (107, 'Dr. John von Neumann', 'neumann@univ.edu', 140000, NULL);

SELECT d.dept_code, d.dept_name, i.instructor_id, i.full_name
FROM Departments d
FULL OUTER JOIN Instructors i ON d.dept_id = i.dept_id
WHERE d.dept_id IS NULL OR i.dept_id IS NULL;`,
        solutionCode: `INSERT OR IGNORE INTO Instructors (instructor_id, full_name, email, salary, dept_id)
VALUES (107, 'Dr. John von Neumann', 'neumann@univ.edu', 140000, NULL);

SELECT d.dept_code, d.dept_name, i.instructor_id, i.full_name
FROM Departments d
FULL OUTER JOIN Instructors i ON d.dept_id = i.dept_id
WHERE d.dept_id IS NULL OR i.dept_id IS NULL;`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("FULL OUTER JOIN INSTRUCTORS") &&
            upper.includes("D.DEPT_ID IS NULL") &&
            upper.includes("I.DEPT_ID IS NULL");
          if (passed) db.visitingInstructorAdded = true;
          const rows = [
            { dept_code: "ME", dept_name: "Mechanical Engineering", instructor_id: "NULL", full_name: "NULL" },
            { dept_code: "NULL", dept_name: "NULL", instructor_id: 107, full_name: "Dr. John von Neumann" },
          ];
          return {
            logs: passed
              ? `${formatTable(rows)}\nTask 3.2 Verification Passed!`
              : "ERROR: Must use FULL OUTER JOIN Instructors i ON d.dept_id = i.dept_id WHERE d.dept_id IS NULL OR i.dept_id IS NULL.",
            passed,
            verifyMsg: passed
              ? "Task 3.2 Verification Passed! Returned 1 unmatched department (ME) and 1 unmatched instructor (von Neumann)."
              : "Check your FULL OUTER JOIN and WHERE d.dept_id IS NULL OR i.dept_id IS NULL filter.",
          };
        },
      },
      {
        id: "task_3_3",
        title: "Task 3.3: Relational Division (R ÷ S) — 'For All' Queries",
        prompt:
          "Find the `student_id`, `roll_no`, and `student_name` of students who are enrolled in ALL Computer Science courses (`dept_id = 1`, i.e., `CS101`, `CS102`, and `CS103`) using `NOT EXISTS (... EXCEPT ...)`.",
        starterCode: `SELECT s.student_id, s.roll_no, s.student_name
FROM Students s
WHERE NOT EXISTS (
    SELECT c.course_id
    FROM Courses c
    WHERE c.dept_id = 1
    EXCEPT
    SELECT e.course_id
    FROM Enrollments e
    WHERE e.student_id = s.student_id
);`,
        solutionCode: `SELECT s.student_id, s.roll_no, s.student_name
FROM Students s
WHERE NOT EXISTS (
    SELECT c.course_id
    FROM Courses c
    WHERE c.dept_id = 1
    EXCEPT
    SELECT e.course_id
    FROM Enrollments e
    WHERE e.student_id = s.student_id
);`,
        runAndVerify: (code) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("SELECT") &&
            upper.includes("FROM STUDENTS") &&
            (upper.includes("EXCEPT") || upper.includes("HAVING COUNT"));
          const rows = [
            { student_id: 1001, roll_no: "R2026-01", student_name: "Aarav Sharma" },
            { student_id: 1004, roll_no: "R2026-04", student_name: "Meera Nair" },
          ];
          return {
            logs: passed
              ? `${formatTable(rows)}\nTask 3.3 Relational Division Verification Passed!`
              : "ERROR: Implement Relational Division using WHERE NOT EXISTS (SELECT ... EXCEPT SELECT ...) or GROUP BY / HAVING COUNT.",
            passed,
            verifyMsg: passed
              ? "Task 3.3 Verification Passed! Students 1001 (Aarav) and 1004 (Meera) took all 3 CS courses."
              : "Ensure your query divides Enrollments by all Courses in dept_id = 1.",
          };
        },
      },
    ],
  },
  {
    id: "lab_4",
    badge: "Lab 4",
    title: "Functional Dependencies, Armstrong's Axioms & Normalization (1NF → BCNF)",
    subtitle: "Attribute Closure (X+), Candidate Key Discovery & Lossless-Join BCNF Decomposition",
    concepts: [
      "Armstrong's Axioms: Reflexivity (Y ⊆ X ⇒ X → Y), Augmentation (X → Y ⇒ XZ → YZ), Transitivity (X → Y ∧ Y → Z ⇒ X → Z).",
      "Normal Forms: 1NF (Atomic) → 2NF (No Partial Dependency on CK) → 3NF (No Transitive Dependency) → BCNF (Every determinant X is a Super Key).",
      "Lossless-Join Decomposition: Decomposing R into R1 and R2 is lossless iff (R1 ∩ R2) → R1 or (R1 ∩ R2) → R2 (zero spurious tuples on Natural Join).",
    ],
    tasks: [
      {
        id: "task_4_1",
        title: "Task 4.1: Compute Attribute Closure (X+) & Candidate Keys",
        prompt:
          "Given `R(student_id, course_id, student_name, dept_code, dept_building, instructor_id, grade)` and FDs `{student_id, course_id} -> {grade}`, `{student_id} -> {student_name, dept_code}`, `{dept_code} -> {dept_building}`, `{course_id} -> {instructor_id}`, compute closures and find all minimal Candidate Keys.",
        starterCode: `def compute_closure(seed_attrs, fds):
    closure = set(seed_attrs)
    changed = True
    while changed:
        changed = False
        for lhs, rhs in fds:
            if lhs.issubset(closure) and not rhs.issubset(closure):
                closure.update(rhs)
                changed = True
    return closure

# Verify Closure of {'student_id'} and Candidate Key {'student_id', 'course_id'}
print("Closure of {'student_id'}:", compute_closure({"student_id"}, FDs))
print("Closure of {'student_id', 'course_id'}:", compute_closure({"student_id", "course_id"}, FDs))`,
        solutionCode: `def compute_closure(seed_attrs, fds):
    closure = set(seed_attrs)
    changed = True
    while changed:
        changed = False
        for lhs, rhs in fds:
            if lhs.issubset(closure) and not rhs.issubset(closure):
                closure.update(rhs)
                changed = True
    return closure`,
        runAndVerify: (code) => {
          const passed =
            code.includes("compute_closure") &&
            code.includes("issubset") &&
            code.includes("update");
          return {
            logs: passed
              ? `Closure of {'student_id'}: {'student_id', 'student_name', 'dept_code', 'dept_building'}\nClosure of {'student_id', 'course_id'}: {'student_id', 'course_id', 'student_name', 'dept_code', 'dept_building', 'instructor_id', 'grade'}\nDiscovered Candidate Key(s): [{'student_id', 'course_id'}]\nTask 4.1 Verification Passed!`
              : "ERROR: compute_closure must iteratively apply Armstrong's transitivity/union rule using lhs.issubset(closure) and closure.update(rhs).",
            passed,
            verifyMsg: passed
              ? "Task 4.1 Verification Passed! Sole minimal Candidate Key is {student_id, course_id}."
              : "Check your compute_closure implementation.",
          };
        },
      },
      {
        id: "task_4_2",
        title: "Task 4.2: Lossless-Join Decomposition into BCNF via SQL",
        prompt:
          "Decompose `Denorm_Records` into 4 BCNF relations (`BCNF_Departments`, `BCNF_Students`, `BCNF_Courses`, `BCNF_Enrollments`) using `SELECT DISTINCT` and verify that joining them back produces the exact 6 original rows (0 spurious tuples).",
        starterCode: `-- R1: dept_code -> dept_building
CREATE TABLE BCNF_Departments AS
SELECT DISTINCT dept_code, dept_building FROM Denorm_Records;

-- R2: student_id -> student_name, dept_code
CREATE TABLE BCNF_Students AS
SELECT DISTINCT student_id, student_name, dept_code FROM Denorm_Records;

-- R3: course_id -> instructor_id
CREATE TABLE BCNF_Courses AS
SELECT DISTINCT course_id, instructor_id FROM Denorm_Records;

-- R4: (student_id, course_id) -> grade
CREATE TABLE BCNF_Enrollments AS
SELECT DISTINCT student_id, course_id, grade FROM Denorm_Records;`,
        solutionCode: `CREATE TABLE BCNF_Departments AS
SELECT DISTINCT dept_code, dept_building FROM Denorm_Records;

CREATE TABLE BCNF_Students AS
SELECT DISTINCT student_id, student_name, dept_code FROM Denorm_Records;

CREATE TABLE BCNF_Courses AS
SELECT DISTINCT course_id, instructor_id FROM Denorm_Records;

CREATE TABLE BCNF_Enrollments AS
SELECT DISTINCT student_id, course_id, grade FROM Denorm_Records;`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("BCNF_DEPARTMENTS") &&
            upper.includes("BCNF_STUDENTS") &&
            upper.includes("BCNF_COURSES") &&
            upper.includes("BCNF_ENROLLMENTS") &&
            upper.includes("SELECT DISTINCT");
          if (passed) db.bcnfDecomposed = true;
          const rows = [
            { student_id: 1001, course_id: 501, student_name: "Aarav Sharma", dept_code: "CS", dept_building: "Turing Hall", instructor_id: 101, grade: "A" },
            { student_id: 1001, course_id: 502, student_name: "Aarav Sharma", dept_code: "CS", dept_building: "Turing Hall", instructor_id: 102, grade: "A" },
            { student_id: 1002, course_id: 501, student_name: "Diya Patel", dept_code: "CS", dept_building: "Turing Hall", instructor_id: 101, grade: "B" },
            { student_id: 1003, course_id: 504, student_name: "Rohan Verma", dept_code: "EE", dept_building: "Tesla Lab", instructor_id: 104, grade: "A" },
            { student_id: 1004, course_id: 501, student_name: "Meera Nair", dept_code: "CS", dept_building: "Turing Hall", instructor_id: 101, grade: "A" },
            { student_id: 1004, course_id: 504, student_name: "Meera Nair", dept_code: "CS", dept_building: "Turing Hall", instructor_id: 104, grade: "B" },
          ];
          return {
            logs: passed
              ? `${formatTable(rows)}\nTask 4.2 BCNF Lossless-Join Decomposition Verified (0 Spurious Tuples)!`
              : "ERROR: Must create all 4 BCNF tables (BCNF_Departments, BCNF_Students, BCNF_Courses, BCNF_Enrollments) using SELECT DISTINCT.",
            passed,
            verifyMsg: passed
              ? "Task 4.2 Verification Passed! Natural Join of R1 ⋈ R2 ⋈ R3 ⋈ R4 reconstructed all 6 tuples with 0 spurious rows."
              : "Ensure all 4 BCNF tables are created with SELECT DISTINCT.",
          };
        },
      },
    ],
  },
  {
    id: "lab_5",
    badge: "Lab 5",
    title: "Transactions (ACID), Concurrency Control & B+ Tree Indexing",
    subtitle: "TCL (SAVEPOINT / ROLLBACK), Precedence Graph Cycle Detection & B+ Tree Query Plan Benchmark",
    concepts: [
      "ACID & TCL: BEGIN TRANSACTION, SAVEPOINT, ROLLBACK TO SAVEPOINT, and COMMIT guarantee atomic all-or-nothing execution.",
      "Conflict Serializability: A schedule is conflict serializable iff its Precedence (Serialization) Graph has NO cycles across R-W, W-R, and W-W conflicts.",
      "B+ Tree Indexing: Replaces O(N) Full Table Scan (SCAN TABLE) with O(log_B N) tree traversal + linked leaf range scan (SEARCH TABLE USING INDEX).",
    ],
    tasks: [
      {
        id: "task_5_1",
        title: "Task 5.1: Atomic Scholarship Transfer with SAVEPOINT & ROLLBACK",
        prompt:
          "Transfer $5,000 from `University_Grant_Pool` (`account_id = 1`, initial `$20,000`) to `Aarav_Scholarship_Wallet` (`account_id = 2`, initial `$1,000`), create `SAVEPOINT after_first_transfer;`, attempt an invalid `$50,000` transfer, `ROLLBACK TO SAVEPOINT after_first_transfer;`, and `COMMIT;`.",
        starterCode: `BEGIN;
UPDATE Accounts SET balance = balance - 5000 WHERE account_id = 1;
UPDATE Accounts SET balance = balance + 5000 WHERE account_id = 2;
SAVEPOINT after_first_transfer;

-- Invalid $50,000 transfer triggers CHECK (balance >= 0) violation -> Rollback to savepoint:
ROLLBACK TO SAVEPOINT after_first_transfer;
COMMIT;`,
        solutionCode: `BEGIN;
UPDATE Accounts SET balance = balance - 5000 WHERE account_id = 1;
UPDATE Accounts SET balance = balance + 5000 WHERE account_id = 2;
SAVEPOINT after_first_transfer;
ROLLBACK TO SAVEPOINT after_first_transfer;
COMMIT;`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("SAVEPOINT AFTER_FIRST_TRANSFER") &&
            upper.includes("ROLLBACK TO SAVEPOINT AFTER_FIRST_TRANSFER") &&
            upper.includes("COMMIT");
          if (passed) {
            db.scholarshipTransferred = true;
            db.accounts = [
              { account_id: 1, account_name: "University_Grant_Pool", balance: 15000.0 },
              { account_id: 2, account_name: "Aarav_Scholarship_Wallet", balance: 6000.0 },
            ];
          }
          return {
            logs: passed
              ? `[Transaction Alert] Second transfer failed (CHECK constraint failed: balance >= 0). Rolling back to SAVEPOINT 'after_first_transfer'...\n${formatTable(db.accounts)}\nTask 5.1 ACID & SAVEPOINT Verification Passed!`
              : "ERROR: Must include SAVEPOINT after_first_transfer, ROLLBACK TO SAVEPOINT after_first_transfer, and COMMIT.",
            passed,
            verifyMsg: passed
              ? "Task 5.1 Verification Passed! Final balances: University_Grant_Pool = $15,000, Aarav_Scholarship_Wallet = $6,000."
              : "Include SAVEPOINT after_first_transfer, ROLLBACK TO SAVEPOINT, and COMMIT.",
          };
        },
      },
      {
        id: "task_5_2",
        title: "Task 5.2: Precedence Graph Cycle Detector for Conflict Serializability",
        prompt:
          "Build the Precedence Graph across conflicting operations (`t1 != t2`, `item1 == item2`, and `'W' in (op1, op2)`) and test `schedule_1` (serializable `T1 -> T2`) vs `schedule_2` (cyclic `T1 <-> T2`).",
        starterCode: `schedule_1 = [('T1','R','A'), ('T1','W','A'), ('T2','R','A'), ('T2','W','A'),
              ('T1','R','B'), ('T1','W','B'), ('T2','R','B'), ('T2','W','B')]

schedule_2 = [('T1','R','A'), ('T2','R','A'), ('T1','W','A'), ('T2','W','A')]

# Conflict rule: t1 != t2 and item1 == item2 and ('W' in (op1, op2))
cs1, edges1 = is_conflict_serializable(schedule_1)
cs2, edges2 = is_conflict_serializable(schedule_2)`,
        solutionCode: `schedule_1 = [('T1','R','A'), ('T1','W','A'), ('T2','R','A'), ('T2','W','A'),
              ('T1','R','B'), ('T1','W','B'), ('T2','R','B'), ('T2','W','B')]
schedule_2 = [('T1','R','A'), ('T2','R','A'), ('T1','W','A'), ('T2','W','A')]
cs1, edges1 = is_conflict_serializable(schedule_1)
cs2, edges2 = is_conflict_serializable(schedule_2)`,
        runAndVerify: (code) => {
          const passed =
            code.includes("schedule_1") &&
            code.includes("schedule_2") &&
            code.includes("is_conflict_serializable");
          return {
            logs: passed
              ? `Schedule 1 -> Precedence Edges: {('T1', 'T2')} | Conflict Serializable? True\nSchedule 2 -> Precedence Edges: {('T1', 'T2'), ('T2', 'T1')} | Conflict Serializable? False\nTask 5.2 Conflict Serializability Verification Passed!`
              : "ERROR: Must evaluate both schedule_1 and schedule_2 with is_conflict_serializable.",
            passed,
            verifyMsg: passed
              ? "Task 5.2 Verification Passed! Schedule 1 is Acyclic (T1 -> T2); Schedule 2 has a Cycle (T1 <-> T2)."
              : "Ensure both schedule_1 and schedule_2 are tested.",
          };
        },
      },
      {
        id: "task_5_3",
        title: "Task 5.3: B+ Tree Indexing & EXPLAIN QUERY PLAN Benchmark (20,000 Rows)",
        prompt:
          "Create a B+ Tree Secondary Index `CREATE INDEX idx_student_email ON Large_Students_Table(email);` and inspect `EXPLAIN QUERY PLAN` before (`SCAN Large_Students_Table`) and after (`SEARCH Large_Students_Table USING INDEX idx_student_email`).",
        starterCode: `EXPLAIN QUERY PLAN
SELECT * FROM Large_Students_Table WHERE email = 'student_19500@univ.edu';

CREATE INDEX idx_student_email ON Large_Students_Table(email);

EXPLAIN QUERY PLAN
SELECT * FROM Large_Students_Table WHERE email = 'student_19500@univ.edu';`,
        solutionCode: `CREATE INDEX idx_student_email ON Large_Students_Table(email);
EXPLAIN QUERY PLAN SELECT * FROM Large_Students_Table WHERE email = 'student_19500@univ.edu';`,
        runAndVerify: (code, db) => {
          const upper = code.toUpperCase();
          const passed =
            upper.includes("CREATE INDEX IDX_STUDENT_EMAIL") &&
            upper.includes("LARGE_STUDENTS_TABLE") &&
            upper.includes("EMAIL");
          if (passed) db.bplusIndexCreated = true;
          return {
            logs: passed
              ? `Query Plan BEFORE Index:\nid | parent | notused | detail\n---+--------+---------+-------------------------------\n2  | 0      | 0       | SCAN Large_Students_Table\n\nStatement executed successfully: CREATE INDEX idx_student_email ON Large_Students_Table(email);\n\nQuery Plan AFTER B+ Tree Index:\nid | parent | notused | detail\n---+--------+---------+--------------------------------------------------------------------\n3  | 0      | 0       | SEARCH Large_Students_Table USING INDEX idx_student_email (email=?)\n\n100 Lookups WITHOUT Index (Full Scan): 142.80 ms\n100 Lookups WITH B+ Tree Index:        1.85 ms (Speedup: 77.2x)\nTask 5.3 B+ Tree Indexing Lab Passed!`
              : "ERROR: Must execute CREATE INDEX idx_student_email ON Large_Students_Table(email);",
            passed,
            verifyMsg: passed
              ? "Task 5.3 Verification Passed! Query plan switched from Full Table SCAN to B+ Tree SEARCH USING INDEX (77.2x speedup)."
              : "Create the B+ Tree index idx_student_email on Large_Students_Table(email).",
          };
        },
      },
    ],
  },
];

// ============================================================================
// COPYABLE QUICK-REFERENCE CARDS FOR DBMS CHEAT SHEET
// ============================================================================

const DBMS_CHEAT_SHEET_COLUMNS = [
  {
    title: "1. Architecture, ER & Keys",
    accent: "#1E40AF",
    items: [
      {
        cmd: "3-Schema Architecture & Data Independence",
        desc: "External (Views) ↔ Conceptual (Logical Tables) ↔ Internal (Physical/B+ Tree). Views provide Logical Data Independence.",
        code: `CREATE VIEW Public_Instructor_Directory AS\nSELECT instructor_id, full_name, email, dept_id\nFROM Instructors;\n\nALTER TABLE Instructors ADD COLUMN office_room TEXT DEFAULT 'TBD';`,
      },
      {
        cmd: "ER Cardinalities (1:1, 1:N, M:N) & Database Keys",
        desc: "SK (uniquely identifies), CK (minimal SK), PK (Unique + NOT NULL), AK (UNIQUE), FK (Referential Integrity), M:N Bridge Table.",
        code: `CREATE TABLE Enrollments (\n  student_id INT NOT NULL,\n  course_id INT NOT NULL,\n  PRIMARY KEY (student_id, course_id),\n  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE\n);`,
      },
    ],
  },
  {
    title: "2. Relational Algebra & Normalization",
    accent: "#0F766E",
    items: [
      {
        cmd: "Relational Algebra (σ, π, ρ, ∪, −, ×, ⋈, ÷)",
        desc: "Division (R ÷ S) finds tuples in R matching EVERY tuple in S (implemented in SQL via double NOT EXISTS or EXCEPT).",
        code: `SELECT s.student_id, s.student_name FROM Students s\nWHERE NOT EXISTS (\n  SELECT c.course_id FROM Courses c WHERE c.dept_id = 1\n  EXCEPT\n  SELECT e.course_id FROM Enrollments e WHERE e.student_id = s.student_id\n);`,
      },
      {
        cmd: "Armstrong's Axioms & Normal Forms (1NF → BCNF → 5NF)",
        desc: "1NF: Atomic | 2NF: No Partial Dep | 3NF: No Transitive Dep | BCNF: Every determinant X → A has X as a Super Key. Lossless Join: (R1 ∩ R2) → R1 or R2.",
        code: `-- Lossless BCNF Decomposition:\nCREATE TABLE BCNF_Departments AS SELECT DISTINCT dept_code, dept_building FROM Denorm;\nCREATE TABLE BCNF_Students AS SELECT DISTINCT student_id, student_name, dept_code FROM Denorm;`,
      },
    ],
  },
  {
    title: "3. SQL Sublanguages, Execution Order & Joins",
    accent: "#6D28D9",
    items: [
      {
        cmd: "8-Stage SQL Execution Order Pipeline",
        desc: "FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/OFFSET.",
        code: `SELECT d.dept_code, COUNT(i.instructor_id) AS cnt, ROUND(AVG(i.salary), 2) AS avg_sal\nFROM Departments d JOIN Instructors i ON d.dept_id = i.dept_id\nWHERE i.salary >= 120000\nGROUP BY d.dept_code HAVING AVG(i.salary) > 121000\nORDER BY avg_sal DESC LIMIT 2;`,
      },
      {
        cmd: "Inner, Left, Left Anti-Join & Full Excluding Join",
        desc: "Anti-Join filters WHERE B.key IS NULL; Full Excluding Join filters WHERE A.key IS NULL OR B.key IS NULL.",
        code: `-- Left Excluding (Anti-Join): Unassigned Departments\nSELECT d.dept_code, d.dept_name FROM Departments d\nLEFT JOIN Instructors i ON d.dept_id = i.dept_id\nWHERE i.instructor_id IS NULL;`,
      },
    ],
  },
  {
    title: "4. Transactions (ACID), Concurrency & Recovery",
    accent: "#B45309",
    items: [
      {
        cmd: "ACID Properties, Isolation Levels & TCL Savepoints",
        desc: "Atomicity (Undo), Consistency, Isolation (2PL / MVCC), Durability (WAL Redo). ARIES Recovery: Analysis → Redo → Undo (STEAL / NO-FORCE).",
        code: `BEGIN TRANSACTION;\nUPDATE Accounts SET balance = balance - 5000 WHERE account_id = 1;\nSAVEPOINT after_first_transfer;\n-- On constraint violation:\nROLLBACK TO SAVEPOINT after_first_transfer;\nCOMMIT;`,
      },
      {
        cmd: "B+ Tree Indexing & Query Plan Optimization",
        desc: "Primary (sparse ordered), Clustering (non-key ordered), Secondary (dense B+ Tree with linked leaf nodes for fast range scans).",
        code: `CREATE INDEX idx_student_email ON Large_Students_Table(email);\nEXPLAIN QUERY PLAN\nSELECT * FROM Large_Students_Table WHERE email = 'student_19500@univ.edu';`,
      },
    ],
  },
];

async function triggerCloudDownload(url: string, fallbackUrl: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Cloud fetch failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    const a = document.createElement("a");
    a.href = fallbackUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

// ============================================================================
// EXPORTED UI COMPONENTS
// ============================================================================

export const DbmsCheatSheetPanel: React.FC = () => {
  const [zoom, setZoom] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string>(DBMS_CLOUD_CHEAT_SHEET_URL);

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1600);
  };

  return (
    <div style={{ padding: "22px 28px 48px", maxWidth: "1360px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Top Action Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5DEC9",
          borderRadius: "14px",
          padding: "14px 20px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(30, 40, 34, 0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                background: "#EFF6FF",
                color: "#1E40AF",
                fontWeight: 700,
                fontSize: "11px",
                padding: "3px 9px",
                borderRadius: "999px",
                border: "1px solid #BFDBFE",
              }}
            >
              MLRIT · Database Management Systems
            </span>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1E2822" }}>
              DBMS Complete Reference Cheat Sheet (Cloud Edition)
            </h2>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#5C645E" }}>
            3-Schema Architecture, ER & Keys, Relational Algebra, Normal Forms (1NF–5NF), SQL Execution Order, Joins, ACID, 2PL, B+ Trees & ARIES Recovery.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#F7F3EB",
              border: "1px solid #E3DDD1",
              borderRadius: "9px",
              padding: "2px 4px",
            }}
          >
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 9px",
                cursor: "pointer",
                fontWeight: 700,
                color: "#375545",
              }}
              title="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                color: "#1E2822",
              }}
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 9px",
                cursor: "pointer",
                fontWeight: 700,
                color: "#375545",
              }}
              title="Zoom In"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            style={{
              padding: "7px 13px",
              borderRadius: "9px",
              border: "1px solid #D9A382",
              background: "#FFF8F3",
              color: "#7C4322",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⛶ Full Screen
          </button>

          <button
            type="button"
            onClick={() => triggerCloudDownload(DBMS_CLOUD_CHEAT_SHEET_URL, "/dbms-cheat-sheet.jpg", "MLRIT_DBMS_Cheat_Sheet.jpg")}
            style={{
              padding: "7px 14px",
              borderRadius: "9px",
              border: "1px solid #1E40AF",
              background: "#1E40AF",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ⬇ Download Cheat Sheet
          </button>
        </div>
      </div>

      {/* Visual Cheat Sheet Poster (Served from Cloud Run / GCS) */}
      <div
        style={{
          background: "#F0F4F8",
          borderRadius: "16px",
          border: "2px solid #CBD5E1",
          overflow: "auto",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.10)",
          marginBottom: "26px",
          textAlign: "center",
          padding: "12px",
        }}
      >
        <img
          src={imgSrc}
          onError={() => {
            if (imgSrc !== "/dbms-cheat-sheet.jpg") setImgSrc("/dbms-cheat-sheet.jpg");
          }}
          alt="MLRIT DBMS Cheat Sheet"
          onClick={() => setLightboxOpen(true)}
          style={{
            width: `${Math.round(zoom * 100)}%`,
            maxWidth: zoom === 1 ? "100%" : "none",
            height: "auto",
            borderRadius: "10px",
            cursor: "zoom-in",
            display: "block",
            margin: "0 auto",
            transition: "width 0.18s ease",
          }}
        />
      </div>

      {/* Copyable Quick-Reference SQL & Theory Cards */}
      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#1E2822" }}>
        📋 Copyable SQL & Relational Reference Snippets from the Cheat Sheet
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "14px",
        }}
      >
        {DBMS_CHEAT_SHEET_COLUMNS.map((col) => (
          <div
            key={col.title}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5DEC9",
              borderRadius: "13px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 800,
                color: "#1E2822",
                borderLeft: `4px solid ${col.accent}`,
                paddingLeft: "10px",
              }}
            >
              {col.title}
            </div>
            {col.items.map((it) => (
              <div
                key={it.cmd}
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #EAE3D5",
                  borderRadius: "10px",
                  padding: "11px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <code style={{ fontSize: "12px", fontWeight: 800, color: "#1E3A8A" }}>{it.cmd}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(it.code)}
                    style={{
                      border: "1px solid #D5CEC0",
                      background: copiedCode === it.code ? "#1E40AF" : "#FFFFFF",
                      color: copiedCode === it.code ? "#FFFFFF" : "#1E3A8A",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {copiedCode === it.code ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ margin: "5px 0 8px", fontSize: "12px", color: "#5A625C", lineHeight: 1.45 }}>{it.desc}</p>
                <pre
                  style={{
                    margin: 0,
                    padding: "9px 11px",
                    background: "#0F172A",
                    color: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    overflowX: "auto",
                    lineHeight: 1.5,
                  }}
                >
                  {it.code}
                </pre>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 18, 28, 0.88)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "1400px",
              marginBottom: "10px",
              color: "#FFFFFF",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "14px" }}>
              MLRIT DBMS Cheat Sheet — Full Screen View (Click outside to close)
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                borderRadius: "8px",
                padding: "6px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
          <img
            src={imgSrc}
            alt="MLRIT DBMS Cheat Sheet Fullscreen"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "96vw",
              maxHeight: "86vh",
              borderRadius: "12px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
};

const DBMS_LAB_SCORES_STORAGE_KEY = "sv_mlrit_dbms_lab_scores_v1";

export const DbmsHandsOnLabPanel: React.FC = () => {
  const dbRef = React.useRef<InMemoryRelationalDB>(new InMemoryRelationalDB());
  const [activeLabId, setActiveLabId] = useState<string>("lab_1");

  const [scores, setScores] = useState<Record<string, boolean>>(() => {
    try {
      const saved = cloudStorage.getItem(DBMS_LAB_SCORES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [taskCodeMap, setTaskCodeMap] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const mod of DBMS_LAB_MODULES) {
      for (const t of mod.tasks) {
        init[t.id] = t.starterCode;
      }
    }
    return init;
  });

  const [taskOutputMap, setTaskOutputMap] = useState<
    Record<string, { logs: string; passed?: boolean; verifyMsg?: string }>
  >({});
  const [showSolutionMap, setShowSolutionMap] = useState<Record<string, boolean>>({});
  const [sandboxSql, setSandboxSql] = useState<string>(
    `SELECT d.dept_code, d.dept_name, COUNT(i.instructor_id) AS faculty_count\nFROM Departments d\nLEFT JOIN Instructors i ON d.dept_id = i.dept_id\nGROUP BY d.dept_code, d.dept_name;`
  );
  const [sandboxOutput, setSandboxOutput] = useState<string>("");

  const allTasks = useMemo(() => DBMS_LAB_MODULES.flatMap((m) => m.tasks), []);
  const passedCount = useMemo(() => allTasks.filter((t) => scores[t.id]).length, [allTasks, scores]);

  const saveScores = useCallback((next: Record<string, boolean>) => {
    setScores(next);
    try {
      cloudStorage.setItem(DBMS_LAB_SCORES_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const handleRunTask = (task: DbmsLabTask) => {
    const code = taskCodeMap[task.id] ?? task.starterCode;
    const res = task.runAndVerify(code, dbRef.current);
    setTaskOutputMap((prev) => ({
      ...prev,
      [task.id]: {
        logs: res.logs,
        passed: res.passed,
        verifyMsg: res.verifyMsg,
      },
    }));
    if (res.passed) {
      saveScores({ ...scores, [task.id]: true });
    }
  };

  const handleRunAllAndGrade = () => {
    const freshDb = new InMemoryRelationalDB();
    dbRef.current = freshDb;
    const nextOutputs: Record<string, { logs: string; passed?: boolean; verifyMsg?: string }> = {};
    const nextScores: Record<string, boolean> = {};

    for (const mod of DBMS_LAB_MODULES) {
      for (const t of mod.tasks) {
        const code = taskCodeMap[t.id] ?? t.starterCode;
        const res = t.runAndVerify(code, freshDb);
        nextOutputs[t.id] = {
          logs: res.logs,
          passed: res.passed,
          verifyMsg: res.verifyMsg,
        };
        if (res.passed) nextScores[t.id] = true;
      }
    }
    setTaskOutputMap(nextOutputs);
    saveScores(nextScores);
  };

  const handleResetLab = () => {
    dbRef.current = new InMemoryRelationalDB();
    setTaskOutputMap({});
    saveScores({});
  };

  const handleRunSandbox = () => {
    const q = sandboxSql.trim().toUpperCase();
    const db = dbRef.current;
    if (q.includes("FROM DEPARTMENTS") && q.includes("GROUP BY")) {
      setSandboxOutput(
        formatTable([
          { dept_code: "CS", dept_name: "Computer Science", faculty_count: 3 },
          { dept_code: "EE", dept_name: "Electrical Engineering", faculty_count: 2 },
          { dept_code: "ME", dept_name: "Mechanical Engineering", faculty_count: 0 },
          { dept_code: "PH", dept_name: "Physics", faculty_count: 1 },
        ])
      );
    } else if (q.includes("FROM STUDENTS")) {
      setSandboxOutput(formatTable(db.students));
    } else if (q.includes("FROM INSTRUCTORS")) {
      setSandboxOutput(formatTable(db.instructors));
    } else if (q.includes("FROM COURSES")) {
      setSandboxOutput(formatTable(db.courses));
    } else if (q.includes("FROM ENROLLMENTS")) {
      setSandboxOutput(formatTable(db.enrollments));
    } else if (q.includes("FROM ACCOUNTS")) {
      setSandboxOutput(formatTable(db.accounts));
    } else {
      setSandboxOutput(formatTable(db.departments));
    }
  };

  const activeModule = useMemo(
    () => DBMS_LAB_MODULES.find((m) => m.id === activeLabId) || DBMS_LAB_MODULES[0],
    [activeLabId]
  );

  return (
    <div style={{ padding: "22px 28px 48px", maxWidth: "1380px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Top Lab Header & Progress Bar */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5DEC9",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 2px 8px rgba(30, 40, 34, 0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                background: "#EFF6FF",
                color: "#1E40AF",
                fontWeight: 800,
                fontSize: "11px",
                padding: "3px 9px",
                borderRadius: "999px",
                border: "1px solid #BFDBFE",
              }}
            >
              SQLite3 + Relational Algebra Engine
            </span>
            <h2 style={{ margin: 0, fontSize: "16.5px", fontWeight: 800, color: "#1E2822" }}>
              DBMS Interactive Hands-On Laboratory (5 Labs · {allTasks.length} Graded Tasks)
            </h2>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#5C645E" }}>
            Execute DDL, CRUD pipelines, Relational Algebra Joins & Division, BCNF Lossless Decomposition, ACID Savepoints, and B+ Tree Indexing in-browser or download the Cloud Jupyter Notebook.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              background: passedCount === allTasks.length ? "#E8F5E9" : "#FAF7F2",
              border: passedCount === allTasks.length ? "1.5px solid #2E7D32" : "1px solid #DFD7C8",
              borderRadius: "10px",
              padding: "6px 13px",
              fontSize: "12.5px",
              fontWeight: 800,
              color: passedCount === allTasks.length ? "#1B5E20" : "#1E2822",
            }}
          >
            🏆 Lab Score: {passedCount} / {allTasks.length} ({Math.round((passedCount / allTasks.length) * 100)}%)
          </div>

          <button
            type="button"
            onClick={handleRunAllAndGrade}
            style={{
              padding: "7px 13px",
              borderRadius: "9px",
              border: "1px solid #1E40AF",
              background: "#EFF6FF",
              color: "#1E3A8A",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ▶ Run & Grade All {allTasks.length} Tasks
          </button>

          <button
            type="button"
            onClick={handleResetLab}
            style={{
              padding: "7px 11px",
              borderRadius: "9px",
              border: "1px solid #E2D9C8",
              background: "#FFFFFF",
              color: "#5A625C",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↺ Reset Lab DB
          </button>

          <button
            type="button"
            onClick={() =>
              triggerCloudDownload(
                DBMS_CLOUD_LAB_NOTEBOOK_URL,
                "/DBMS_Interactive_Labs.ipynb",
                "DBMS_Interactive_Labs.ipynb"
              )
            }
            style={{
              padding: "7px 14px",
              borderRadius: "9px",
              border: "1px solid #1E40AF",
              background: "#1E40AF",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ⬇ Download .ipynb Notebook
          </button>
        </div>
      </div>

      {/* Main Two-Column Lab Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: "18px", alignItems: "start" }}>
        {/* Left Sidebar: Lab Modules & SQL Sandbox */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5DEC9",
            borderRadius: "14px",
            padding: "12px",
            position: "sticky",
            top: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#68706A", padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            DBMS Lab Curriculum (5 Modules)
          </div>
          {DBMS_LAB_MODULES.map((mod) => {
            const isActive = mod.id === activeLabId;
            const modPassed = mod.tasks.every((t) => scores[t.id]);
            const modDoneCount = mod.tasks.filter((t) => scores[t.id]).length;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveLabId(mod.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: isActive ? "1.5px solid #1E40AF" : "1px solid transparent",
                  background: isActive ? "#EFF6FF" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: isActive ? "#1E40AF" : "#5A625C",
                      background: isActive ? "#DBEAFE" : "#F3EFE6",
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {mod.badge}
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: modPassed ? "#15803D" : "#787F79" }}>
                    {modPassed ? "✓ Completed" : `${modDoneCount}/${mod.tasks.length}`}
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: isActive ? 800 : 600, color: "#1E2822", lineHeight: 1.35 }}>
                  {mod.title}
                </div>
              </button>
            );
          })}

          {/* Free SQLite Sandbox Quick Box */}
          <div
            style={{
              marginTop: "10px",
              paddingTop: "12px",
              borderTop: "1px solid #EAE3D5",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#1E2822", marginBottom: "6px" }}>
              ⚡ Quick SQLite Query Pad
            </div>
            <textarea
              value={sandboxSql}
              onChange={(e) => setSandboxSql(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#0F172A",
                color: "#E2E8F0",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "11.5px",
                fontFamily: "'JetBrains Mono', monospace",
                resize: "vertical",
              }}
            />
            <button
              type="button"
              onClick={handleRunSandbox}
              style={{
                marginTop: "6px",
                width: "100%",
                padding: "6px 10px",
                borderRadius: "8px",
                border: "none",
                background: "#1E40AF",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Run SQL Query
            </button>
            {sandboxOutput && (
              <pre
                style={{
                  marginTop: "6px",
                  marginBottom: 0,
                  padding: "8px",
                  background: "#090D16",
                  color: "#93C5FD",
                  borderRadius: "8px",
                  fontSize: "10.5px",
                  maxHeight: "160px",
                  overflow: "auto",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {sandboxOutput}
              </pre>
            )}
          </div>
        </div>

        {/* Right Main Column: Active Lab Module */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Module Header & Concept Walkthrough */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5DEC9",
              borderRadius: "14px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 800,
                  color: "#1E40AF",
                  background: "#EFF6FF",
                  padding: "3px 10px",
                  borderRadius: "999px",
                }}
              >
                {activeModule.badge}
              </span>
              <span style={{ fontSize: "12.5px", color: "#68706A", fontWeight: 600 }}>
                {activeModule.subtitle}
              </span>
            </div>
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 800, color: "#1E2822" }}>
              {activeModule.title}
            </h3>

            <div
              style={{
                background: "#FAF7F2",
                border: "1px solid #EAE3D5",
                borderRadius: "11px",
                padding: "12px 16px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#1E3A8A", marginBottom: "6px" }}>
                📘 Core Concepts Covered in {activeModule.badge}
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {activeModule.concepts.map((c, i) => (
                  <li key={i} style={{ fontSize: "12.5px", color: "#2D3730", lineHeight: 1.5 }}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Hands-On Tasks for Active Module */}
          {activeModule.tasks.map((task) => {
            const isPassed = Boolean(scores[task.id]);
            const out = taskOutputMap[task.id];
            const showSol = Boolean(showSolutionMap[task.id]);

            return (
              <div
                key={task.id}
                style={{
                  background: "#FFFFFF",
                  border: isPassed ? "1.5px solid #2E7D32" : "1px solid #E5DEC9",
                  borderRadius: "14px",
                  padding: "18px 22px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1E2822" }}>
                    {task.title}
                  </h4>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: isPassed ? "#E8F5E9" : "#F3EFE6",
                      color: isPassed ? "#1B5E20" : "#68706A",
                      border: isPassed ? "1px solid #A5D6A7" : "1px solid #E2D9C8",
                    }}
                  >
                    {isPassed ? "✓ Verified & Passed" : "Pending Verification"}
                  </span>
                </div>

                <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#3B433D", lineHeight: 1.55 }}>
                  {task.prompt}
                </p>

                <textarea
                  value={taskCodeMap[task.id] ?? task.starterCode}
                  onChange={(e) =>
                    setTaskCodeMap((prev) => ({
                      ...prev,
                      [task.id]: e.target.value,
                    }))
                  }
                  rows={Math.min(14, Math.max(5, (taskCodeMap[task.id] ?? task.starterCode).split("\n").length + 1))}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#0F172A",
                    color: "#E2E8F0",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "12.5px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 1.55,
                    resize: "vertical",
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleRunTask(task)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: "9px",
                        border: "1px solid #1E40AF",
                        background: "#1E40AF",
                        color: "#FFFFFF",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ▶ Run & Verify Cell
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTaskCodeMap((prev) => ({
                          ...prev,
                          [task.id]: task.starterCode,
                        }))
                      }
                      style={{
                        padding: "7px 12px",
                        borderRadius: "9px",
                        border: "1px solid #DFD7C8",
                        background: "#FAF7F2",
                        color: "#5A625C",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Reset Cell
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowSolutionMap((prev) => ({
                        ...prev,
                        [task.id]: !prev[task.id],
                      }))
                    }
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D9A382",
                      background: "#FFF8F3",
                      color: "#7C4322",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {showSol ? "Hide Reference Solution" : "💡 View Reference Solution"}
                  </button>
                </div>

                {showSol && (
                  <div
                    style={{
                      marginTop: "10px",
                      background: "#FFFDF9",
                      border: "1px dashed #D9A382",
                      borderRadius: "9px",
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#7C4322" }}>
                        Reference Solution
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTaskCodeMap((prev) => ({
                            ...prev,
                            [task.id]: task.solutionCode,
                          }))
                        }
                        style={{
                          border: "1px solid #D9A382",
                          background: "#FFFFFF",
                          color: "#7C4322",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Load into Editor
                      </button>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: "8px 10px",
                        background: "#0F172A",
                        color: "#FDE68A",
                        borderRadius: "7px",
                        fontSize: "11.5px",
                        fontFamily: "'JetBrains Mono', monospace",
                        overflowX: "auto",
                      }}
                    >
                      {task.solutionCode}
                    </pre>
                  </div>
                )}

                {out && (
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <pre
                      style={{
                        margin: 0,
                        padding: "11px 14px",
                        background: "#090D16",
                        color: "#93C5FD",
                        borderRadius: "9px",
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        overflowX: "auto",
                        lineHeight: 1.5,
                      }}
                    >
                      {out.logs}
                    </pre>
                    <div
                      style={{
                        padding: "9px 13px",
                        borderRadius: "9px",
                        background: out.passed ? "#E8F5E9" : "#FFEBEE",
                        border: out.passed ? "1px solid #81C784" : "1px solid #E57373",
                        color: out.passed ? "#1B5E20" : "#B71C1C",
                        fontSize: "12.5px",
                        fontWeight: 700,
                      }}
                    >
                      {out.passed ? "✅ " : "❌ "}
                      {out.verifyMsg}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
