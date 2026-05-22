import { BadRequestException } from "@nestjs/common";
import { CourseCategory } from "@prisma/client";
import { parseCourseCategory } from "../../common/course-category.util.js";
import { normalizeLabel } from "../../common/normalize-label.util.js";
import { ImportParticipantRowDto } from "./dto/import-participants.dto.js";

const CSV_SEP_PRIMARY = ";";

type ImportCanonicalField =
  | "course"
  | "category"
  | "team"
  | "lastName"
  | "firstName"
  | "email"
  | "phone"
  | "captain";

type ImportColumnMap = Partial<Record<ImportCanonicalField, number>>;

const IMPORT_HEADER_ALIASES: Record<ImportCanonicalField, readonly string[]> = {
  course: ["course", "parcours", "epreuve", "épreuve", "discipline"],
  category: ["categorie", "catégorie", "category", "cat"],
  team: ["equipe", "équipe", "team", "groupe"],
  lastName: ["nom", "lastname", "last name", "nom de famille"],
  firstName: ["prenom", "prénom", "firstname", "first name"],
  email: ["mail", "email", "e-mail", "courriel"],
  phone: ["tel", "téléphone", "telephone", "phone", "mobile"],
  captain: ["capitaine", "captain", "chef"],
};

const CANONICAL_LABELS: Record<ImportCanonicalField, string> = {
  course: "Course",
  category: "Catégorie",
  team: "Équipe",
  lastName: "Nom",
  firstName: "Prénom",
  email: "Mail",
  phone: "Tel",
  captain: "Capitaine",
};

const REQUIRED_FIELDS: ImportCanonicalField[] = ["course", "category", "lastName", "firstName"];

function normalizeHeader(label: string): string {
  return normalizeLabel(label);
}

function parseCategoryCell(input: string): { category: CourseCategory; customCategoryName?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const parsed = parseCourseCategory(trimmed);
    return {
      category: parsed.category,
      ...(parsed.customCategoryName ? { customCategoryName: parsed.customCategoryName } : {}),
    };
  } catch {
    return null;
  }
}

function parseCsvLine(line: string, sep: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function detectSeparator(headerLine: string): string {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  if (semi === 0 && comma > 0) return ",";
  return CSV_SEP_PRIMARY;
}

function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const sep = detectSeparator(lines[0]);
  return lines.map((line) => parseCsvLine(line, sep));
}

function mapImportHeaders(headerRow: string[]): {
  columnMap: ImportColumnMap;
  missingRequired: ImportCanonicalField[];
} {
  const columnMap: ImportColumnMap = {};
  const normalizedHeaders = headerRow.map((h) => normalizeHeader(h));

  for (const field of Object.keys(IMPORT_HEADER_ALIASES) as ImportCanonicalField[]) {
    const aliases = IMPORT_HEADER_ALIASES[field];
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const h = normalizedHeaders[i];
      if (aliases.some((a) => h === normalizeHeader(a))) {
        columnMap[field] = i;
        break;
      }
    }
  }

  const missingRequired = REQUIRED_FIELDS.filter((f) => columnMap[f] === undefined);
  return { columnMap, missingRequired };
}

function parseCapitaine(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const v = value.trim().toLowerCase();
  return v === "oui" || v === "1" || v === "true" || v === "yes" || v === "o";
}

function cellAt(row: string[], index: number | undefined): string {
  if (index === undefined) return "";
  return (row[index] ?? "").trim();
}

export type CsvParseIssue = { line: number; message: string };

export function parseImportCsvText(csvText: string): {
  rows: ImportParticipantRowDto[];
  missingRequired: ImportCanonicalField[];
  categoryErrors: CsvParseIssue[];
} {
  const matrix = parseCsv(csvText);
  if (matrix.length < 2) {
    return { rows: [], missingRequired: [...REQUIRED_FIELDS], categoryErrors: [] };
  }

  const { columnMap, missingRequired } = mapImportHeaders(matrix[0]);
  if (missingRequired.length > 0) {
    return { rows: [], missingRequired, categoryErrors: [] };
  }

  const rows: ImportParticipantRowDto[] = [];
  const categoryErrors: CsvParseIssue[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i];
    const allEmpty = line.every((c) => !c?.trim());
    if (allEmpty) continue;

    const lineNumber = i + 1;
    const categoryRaw = cellAt(line, columnMap.category);
    const parsedCategory = parseCategoryCell(categoryRaw);
    if (!parsedCategory) {
      categoryErrors.push({
        line: lineNumber,
        message: `Catégorie invalide ou vide « ${categoryRaw} ».`,
      });
      continue;
    }

    rows.push({
      lineNumber,
      courseName: cellAt(line, columnMap.course),
      category: parsedCategory.category,
      ...(parsedCategory.customCategoryName
        ? { customCategoryName: parsedCategory.customCategoryName }
        : {}),
      teamName: cellAt(line, columnMap.team),
      lastName: cellAt(line, columnMap.lastName),
      firstName: cellAt(line, columnMap.firstName),
      email: cellAt(line, columnMap.email) || undefined,
      phone: cellAt(line, columnMap.phone) || undefined,
      isCaptain: parseCapitaine(cellAt(line, columnMap.captain)),
    });
  }

  return { rows, missingRequired, categoryErrors };
}

export function missingRequiredLabels(missing: ImportCanonicalField[]): string {
  return missing.map((f) => CANONICAL_LABELS[f]).join(", ");
}

export function assertImportCsvParseable(csvText: string): ImportParticipantRowDto[] {
  const { rows, missingRequired, categoryErrors } = parseImportCsvText(csvText);
  if (missingRequired.length > 0) {
    throw new BadRequestException(
      `Colonnes manquantes : ${missingRequiredLabels(missingRequired)}.`,
    );
  }
  if (categoryErrors.length > 0) {
    throw new BadRequestException(
      categoryErrors.map((e) => `Ligne ${e.line} : ${e.message}`).join(" "),
    );
  }
  if (rows.length === 0) {
    throw new BadRequestException("Aucune ligne de données trouvée après l'en-tête.");
  }
  return rows;
}
