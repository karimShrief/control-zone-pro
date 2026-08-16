import { readSheet } from "read-excel-file/browser";
import type { CoverageStatus, Shift, ShiftType, User } from "./data";

export interface RosterImportResult {
  shifts: Shift[];
  errors: string[];
}

const COVERAGE_STATUSES: CoverageStatus[] = [
  "Covered",
  "Understaffed",
  "Pending Update",
  "Conflict",
];

type CellValue = string | number | boolean | Date | null | undefined;
type SpreadsheetRow = Record<string, CellValue>;

export async function parseRosterWorkbook(
  file: File,
  users: User[],
  shiftTypes: ShiftType[],
): Promise<RosterImportResult> {
  const matrix = await readFileRows(file);
  if (!matrix.length) return { shifts: [], errors: ["File does not contain any roster rows."] };

  const [headers, ...body] = matrix;
  const normalizedHeaders = headers.map((header) => normalizeHeader(stringify(header)));
  const rows = body
    .filter((row) => row.some((cell) => stringify(cell)))
    .map((row) =>
      normalizedHeaders.reduce<SpreadsheetRow>((record, header, index) => {
        if (header) record[header] = row[index];
        return record;
      }, {}),
    );

  const errors: string[] = [];
  const shifts: Shift[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const date = normalizeDate(readColumn(row, ["date", "shift date", "roster date"]));
    const type = normalizeShiftType(
      readColumn(row, ["shift type", "shift", "shift name"]),
      shiftTypes,
    );
    const engineers = resolveUsers(
      readColumn(row, ["assigned engineers", "engineers", "engineer", "assignees"]),
      users,
    );
    const lead = resolveSingleUser(readColumn(row, ["shift lead", "lead"]), users);
    const coverageStatus = normalizeCoverageStatus(
      readColumn(row, ["coverage status", "coverage", "status"]),
    );
    const notes = stringify(readColumn(row, ["notes", "note", "comments"]));

    if (!date) errors.push(`Row ${rowNumber}: Date is required or invalid.`);
    if (!type) errors.push(`Row ${rowNumber}: Shift Type must match ${shiftTypes.join(", ")}.`);
    if (lead.missing) errors.push(`Row ${rowNumber}: Shift Lead "${lead.missing}" was not found.`);
    engineers.missing.forEach((name) =>
      errors.push(`Row ${rowNumber}: Engineer "${name}" was not found.`),
    );

    if (!date || !type || lead.missing || engineers.missing.length) return;

    const engineerIds = Array.from(new Set(engineers.ids));
    if (lead.id && !engineerIds.includes(lead.id)) engineerIds.push(lead.id);
    shifts.push({
      date,
      type,
      engineers: engineerIds,
      shiftLead: lead.id,
      coverageStatus,
      notes,
    });
  });

  return { shifts, errors };
}

async function readFileRows(file: File): Promise<CellValue[][]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return parseCsv(await file.text());
  if (extension === "xlsx") return (await readSheet(file)) as CellValue[][];
  throw new Error("Unsupported roster file type");
}

function parseCsv(text: string): CellValue[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delimiter = text.split(/\r?\n/, 1)[0]?.includes("\t") ? "\t" : ",";

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function readColumn(row: SpreadsheetRow, names: string[]) {
  return names.map((name) => row[name]).find((value) => stringify(value)) ?? "";
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function stringify(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return value.toISOString().slice(0, 10);

  const raw = stringify(value);
  if (!raw) return "";

  const serial = Number(raw);
  if (!Number.isNaN(serial) && serial > 20000) {
    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + serial);
    return date.toISOString().slice(0, 10);
  }

  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch?.[1] && isoMatch[2] && isoMatch[3]) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (slashMatch?.[1] && slashMatch[2] && slashMatch[3]) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function normalizeShiftType(value: unknown, shiftTypes: ShiftType[]) {
  const raw = stringify(value).toLowerCase();
  if (!raw) return null;
  const aliases: Record<string, ShiftType> = {
    "1": "Morning",
    "shift 1": "Morning",
    first: "Morning",
    day: "Morning",
    am: "Morning",
    morning: "Morning",
    "2": "Evening",
    "shift 2": "Evening",
    second: "Evening",
    afternoon: "Evening",
    evening: "Evening",
    pm: "Evening",
    "3": "Night",
    "shift 3": "Night",
    third: "Night",
    night: "Night",
    overnight: "Night",
  };
  const direct = shiftTypes.find((type) => type.toLowerCase() === raw);
  const aliased = aliases[raw];
  return direct ?? (aliased && shiftTypes.includes(aliased) ? aliased : null);
}

function normalizeCoverageStatus(value: unknown): CoverageStatus {
  const raw = stringify(value).toLowerCase();
  return COVERAGE_STATUSES.find((status) => status.toLowerCase() === raw) ?? "Pending Update";
}

function resolveUsers(value: unknown, users: User[]) {
  const names = splitNames(value);
  const ids: string[] = [];
  const missing: string[] = [];
  names.forEach((name) => {
    const user = findUser(name, users);
    if (user) ids.push(user.id);
    else missing.push(name);
  });
  return { ids, missing };
}

function resolveSingleUser(value: unknown, users: User[]) {
  const name = splitNames(value)[0];
  if (!name) return { id: undefined, missing: "" };
  const user = findUser(name, users);
  return user ? { id: user.id, missing: "" } : { id: undefined, missing: name };
}

function splitNames(value: unknown) {
  return stringify(value)
    .split(/[,;\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function findUser(value: string, users: User[]) {
  const needle = value.toLowerCase();
  return (
    users.find(
      (user) =>
        user.id.toLowerCase() === needle ||
        user.username.toLowerCase() === needle ||
        user.name.toLowerCase() === needle,
    ) ?? null
  );
}
