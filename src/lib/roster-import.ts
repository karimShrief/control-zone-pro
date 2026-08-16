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
type WorkbookSheet = { sheet: string; data: CellValue[][] };

export async function parseRosterWorkbook(
  file: File,
  users: User[],
  shiftTypes: ShiftType[],
): Promise<RosterImportResult> {
  const workbook = await readWorkbookSheets(file);
  const selectedSheet = selectRosterSheet(workbook);
  const matrix = selectedSheet?.data ?? [];

  if (!matrix.length) return { shifts: [], errors: ["File does not contain any roster rows."] };

  const matrixResult = parseMatrixRoster(
    matrix,
    selectedSheet?.sheet ?? "Roster",
    users,
    shiftTypes,
  );
  if (matrixResult.shifts.length || matrixResult.errors.length) {
    return matrixResult;
  }

  const legacyResult = parseLegacyRosterRows(matrix, users, shiftTypes);
  return legacyResult;
}

async function readWorkbookSheets(file: File): Promise<WorkbookSheet[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") {
    return [{ sheet: "Imported CSV", data: parseCsv(await file.text()) }];
  }
  if (extension === "xlsx") {
    const workbook = await readSheet(file);
    return Array.isArray(workbook)
      ? workbook.map((sheet) => ({
          sheet: typeof sheet?.sheet === "string" ? sheet.sheet : "Sheet1",
          data: Array.isArray(sheet?.data) ? (sheet.data as CellValue[][]) : [],
        }))
      : [{ sheet: "Sheet1", data: workbook as CellValue[][] }];
  }
  throw new Error("Unsupported roster file type");
}

function selectRosterSheet(sheets: WorkbookSheet[]) {
  const sheetNameLookup = sheets.find((sheet) =>
    [sheet.sheet, sheet.sheet.toLowerCase()].some((value) => value.includes("aug-26")),
  );
  return (
    sheetNameLookup ??
    sheets.find((sheet) => sheet.sheet.toLowerCase().includes("roster")) ??
    sheets[0]
  );
}

function parseMatrixRoster(
  matrix: CellValue[][],
  sheetName: string,
  users: User[],
  shiftTypes: ShiftType[],
): RosterImportResult {
  const errors: string[] = [];
  const dateColumns = new Map<number, string>();
  const assignmentMap = new Map<string, Map<ShiftType, Set<string>>>();
  const warningsByDate = new Map<string, string[]>();

  const dateRowIndex = matrix.findIndex((row) =>
    row.some((cell) => normalizeHeader(stringify(cell)).includes("name/date")),
  );

  if (dateRowIndex === -1) {
    return { shifts: [], errors: ["Roster matrix header row was not found."] };
  }

  const dateRow = matrix[dateRowIndex] ?? [];
  const monthName = inferMonthFromSheet(sheetName, dateRow[0]);
  const year = inferYearFromSheet(sheetName, dateRow[0]) ?? new Date().getFullYear();

  dateRow.slice(1).forEach((cell, index) => {
    const normalized = stringify(cell).trim();
    if (!normalized) return;
    const numericDate = Number(normalized);
    if (!Number.isInteger(numericDate) || numericDate < 1) return;
    const date = formatDateForMonth(year, monthName, numericDate);
    if (date) {
      dateColumns.set(index + 1, date);
    }
  });

  if (!dateColumns.size) {
    return { shifts: [], errors: ["No valid date numbers were found in the roster matrix."] };
  }

  for (let index = dateRowIndex + 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    if (!row.some((cell) => stringify(cell))) break;
    const engineerName = stringify(row[0]);
    if (!engineerName) continue;

    const userMatch = findUser(engineerName, users);
    if (!userMatch) {
      errors.push(`Missing engineer name: "${engineerName}".`);
      continue;
    }

    row.forEach((cell, columnIndex) => {
      if (columnIndex === 0 || !dateColumns.has(columnIndex)) return;
      const dateKey = dateColumns.get(columnIndex)!;
      const code = normalizeMatrixCode(cell);
      if (!code) return;

      if (code === "D") {
        addWarning(warningsByDate, dateKey, "Out of shift / External Activity");
        return;
      }
      if (code === "OFF") {
        addWarning(warningsByDate, dateKey, "Off / Not Scheduled");
        return;
      }
      if (code === "Leave") {
        addWarning(warningsByDate, dateKey, "Leave");
        return;
      }
      if (!code || !["A", "B", "C"].includes(code)) {
        addWarning(warningsByDate, dateKey, `Unknown shift code: ${stringify(cell)}`);
        return;
      }

      const shiftType = codeToShiftType(code, shiftTypes);
      if (!shiftType) {
        addWarning(warningsByDate, dateKey, `Unknown shift code: ${stringify(cell)}`);
        return;
      }

      if (!assignmentMap.has(dateKey)) assignmentMap.set(dateKey, new Map());
      const byShift = assignmentMap.get(dateKey)!;
      if (!byShift.has(shiftType)) byShift.set(shiftType, new Set());
      byShift.get(shiftType)!.add(userMatch.id);
    });
  }

  const shifts: Shift[] = [];
  for (const [dateKey, byShift] of assignmentMap.entries()) {
    for (const type of shiftTypes) {
      const engineers = Array.from(byShift.get(type) ?? []);
      if (!engineers.length) continue;

      const warnings = warningsByDate.get(dateKey) ?? [];
      shifts.push({
        date: dateKey,
        type,
        engineers,
        coverageStatus: engineers.length >= 3 ? "Covered" : "Understaffed",
        status: "Draft",
        warnings: warnings.length ? [...new Set(warnings)] : ["No warnings"],
        notes: warnings.length ? warnings.join("; ") : "Imported from roster matrix.",
      });
    }
  }

  if (!shifts.length) {
    errors.push("No valid A/B/C shift assignments were found in the uploaded roster matrix.");
  }

  return { shifts, errors };
}

function parseLegacyRosterRows(
  matrix: CellValue[][],
  users: User[],
  shiftTypes: ShiftType[],
): RosterImportResult {
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
      status: "Draft",
    });
  });

  return { shifts, errors };
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

function normalizeMatrixCode(value: unknown) {
  const normalized = stringify(value).toUpperCase();
  if (!normalized) return null;
  if (["A", "B", "C", "D", "OFF", "LEAVE"].includes(normalized)) return normalized;
  return null;
}

function stringify(value: unknown) {
  return String(value ?? "").trim();
}

function codeToShiftType(code: string, shiftTypes: ShiftType[]) {
  const mapping: Record<string, ShiftType> = {
    A: "Morning",
    B: "Evening",
    C: "Night",
  };
  const result = mapping[code];
  return shiftTypes.includes(result) ? result : null;
}

function inferMonthFromSheet(sheetName: string, headerCell: unknown) {
  const raw = `${sheetName} ${stringify(headerCell)}`.toLowerCase();
  if (raw.includes("jan")) return "January";
  if (raw.includes("feb")) return "February";
  if (raw.includes("mar")) return "March";
  if (raw.includes("apr")) return "April";
  if (raw.includes("may")) return "May";
  if (raw.includes("jun")) return "June";
  if (raw.includes("jul")) return "July";
  if (raw.includes("aug")) return "August";
  if (raw.includes("sep")) return "September";
  if (raw.includes("oct")) return "October";
  if (raw.includes("nov")) return "November";
  if (raw.includes("dec")) return "December";
  return "August";
}

function inferYearFromSheet(sheetName: string, headerCell: unknown) {
  const raw = `${sheetName} ${stringify(headerCell)}`;
  const match = raw.match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

function formatDateForMonth(year: number, monthName: string, day: number) {
  const monthIndex = monthNames.indexOf(monthName);
  if (monthIndex === -1) return "";
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex) return "";
  return date.toISOString().slice(0, 10);
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function addWarning(warningsByDate: Map<string, string[]>, dateKey: string, warning: string) {
  const current = warningsByDate.get(dateKey) ?? [];
  if (!current.includes(warning)) current.push(warning);
  warningsByDate.set(dateKey, current);
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
