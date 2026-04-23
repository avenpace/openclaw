import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { VerbosityLevel } from "pdfjs-dist/legacy/build/pdf.mjs";
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/Exception.js
/**
 * Error thrown when the parsed data is not a valid PDF document.
 *
 * Use this exception to signal that the input cannot be interpreted as a PDF
 * (corrupt file, invalid header, etc.).
 *
 * @public
 */
var InvalidPDFException = class InvalidPDFException extends Error {
  /**
   * Create a new InvalidPDFException.
   * @param message - Optional error message.
   * @param cause - Optional underlying cause (preserved on modern runtimes).
   */
  constructor(message, cause) {
    if (cause !== void 0) super(message ?? "Invalid PDF", { cause });
    else super(message ?? "Invalid PDF");
    this.name = "InvalidPDFException";
    Object.setPrototypeOf(this, InvalidPDFException.prototype);
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, InvalidPDFException);
  }
};
/**
 * Error indicating a PDF file requires a password or the provided password is incorrect.
 *
 * @public
 */
var PasswordException = class PasswordException extends Error {
  /**
   * Create a new PasswordException.
   * @param message - Optional error message.
   * @param cause - Optional underlying cause.
   */
  constructor(message, cause) {
    if (cause !== void 0) super(message ?? "Password required or incorrect", { cause });
    else super(message ?? "Password required or incorrect");
    this.name = "PasswordException";
    Object.setPrototypeOf(this, PasswordException.prototype);
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, PasswordException);
  }
};
/**
 * Error thrown when the PDF structure/contents are malformed and cannot be parsed.
 *
 * This is raised for low-level format problems detected while reading PDF objects.
 * Errors caused during parsing PDF data.
 *
 * @public
 */
var FormatError = class FormatError extends Error {
  /**
   * Create a new FormatError.
   * @param message - Optional message describing the format problem.
   * @param cause - Optional underlying cause.
   */
  constructor(message, cause) {
    if (cause !== void 0) super(message ?? "PDF format error", { cause });
    else super(message ?? "PDF format error");
    this.name = "FormatError";
    Object.setPrototypeOf(this, FormatError.prototype);
    if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(this, FormatError);
  }
};
/**
 * Generic wrapper for errors where the library cannot classify the cause.
 *
 * The `details` property may contain additional information provided by the
 * underlying PDF library.
 *
 * @public
 */
var UnknownErrorException = class UnknownErrorException extends Error {
  /**
   * Create a new UnknownErrorException.
   * @param message - Optional error message.
   * @param details - Optional additional details from the PDF library.
   * @param cause - Optional underlying cause.
   */
  constructor(message, details, cause) {
    if (cause !== void 0) super(message ?? "Unknown error", { cause });
    else super(message ?? "Unknown error");
    this.name = "UnknownErrorException";
    Object.setPrototypeOf(this, UnknownErrorException.prototype);
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, UnknownErrorException);
    this.details = details;
  }
};
/**
 * Represents an HTTP/network response error encountered while fetching PDF data.
 *
 * The `status` and `missing` properties mirror values that may be provided
 * by the underlying PDF library's network layer.
 *
 * @public
 */
var ResponseException = class ResponseException extends Error {
  /**
   * Create a new ResponseException.
   * @param message - Optional error message.
   * @param status - Optional numeric HTTP/status code.
   * @param missing - Optional field describing missing resources.
   * @param cause - Optional underlying cause.
   */
  constructor(message, status, missing, cause) {
    if (cause !== void 0) super(message ?? "Response error", { cause });
    else super(message ?? "Response error");
    this.name = "ResponseException";
    Object.setPrototypeOf(this, ResponseException.prototype);
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, ResponseException);
    this.status = status;
    this.missing = missing;
  }
};
/**
 * Error used to indicate that an operation was aborted (for example by an AbortSignal).
 *
 * @public
 */
var AbortException = class AbortException extends Error {
  /**
   * Create a new AbortException.
   * @param message - Optional error message.
   * @param cause - Optional underlying cause.
   */
  constructor(message, cause) {
    if (cause !== void 0) super(message ?? "Operation aborted", { cause });
    else super(message ?? "Operation aborted");
    this.name = "AbortException";
    Object.setPrototypeOf(this, AbortException.prototype);
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, AbortException);
  }
};
/**
 * Normalize arbitrary thrown values into an Error instance used by the library.
 *
 * Known Error instances with specific names are mapped to the library's
 * typed exceptions in order to preserve type information and any additional
 * fields (for example `details`, `status`, etc.). If the value is not an
 * Error it is converted to a generic Error containing the stringified value.
 *
 * @public
 * @param error - The thrown value to normalize.
 * @returns An Error instance representing the provided value.
 */
function getException(error) {
  if (error instanceof Error)
    switch (error.name) {
      case "InvalidPDFException":
        return new InvalidPDFException(error.message, error);
      case "PasswordException":
        return new PasswordException(error.message, error);
      case "FormatError":
        return new FormatError(error.message, error);
      case "UnknownErrorException":
        return new UnknownErrorException(error.message, error.details, error);
      case "ResponseException":
        return new ResponseException(error.message, error.status, error.missing, error);
      case "AbortException":
        return new AbortException(error.message, error);
      default:
        return error;
    }
  return new Error(String(error));
}
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/geometry/Shape.js
var Shape = class {
  static tolerance = 2;
  static applyTransform(p, m) {
    return [p[0] * m[0] + p[1] * m[2] + m[4], p[0] * m[1] + p[1] * m[3] + m[5]];
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/geometry/Point.js
var Point = class extends Shape {
  x;
  y;
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
  equal(point) {
    return point.x === this.x && point.y === this.y;
  }
  transform(matrix) {
    const p = Shape.applyTransform([this.x, this.y], matrix);
    this.x = p[0];
    this.y = p[1];
    return this;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/geometry/Line.js
var LineDirection;
(function (LineDirection) {
  LineDirection[(LineDirection["None"] = 0)] = "None";
  LineDirection[(LineDirection["Horizontal"] = 1)] = "Horizontal";
  LineDirection[(LineDirection["Vertical"] = 2)] = "Vertical";
})(LineDirection || (LineDirection = {}));
var Line = class Line extends Shape {
  from;
  to;
  direction = LineDirection.None;
  length = 0;
  intersections = [];
  gaps = [];
  constructor(from, to) {
    super();
    this.from = from;
    this.to = to;
    this.init();
  }
  init() {
    let from = this.from;
    let to = this.to;
    if (Math.abs(from.y - to.y) < Shape.tolerance) {
      this.direction = LineDirection.Horizontal;
      to.y = from.y;
      if (from.x > to.x) {
        const temp = from;
        from = to;
        to = temp;
      }
      this.length = to.x - from.x;
    } else if (Math.abs(from.x - to.x) < Shape.tolerance) {
      this.direction = LineDirection.Vertical;
      to.x = from.x;
      if (from.y > to.y) {
        const temp = from;
        from = to;
        to = temp;
      }
      this.length = to.y - from.y;
    }
    this.from = from;
    this.to = to;
  }
  _valid = void 0;
  get valid() {
    if (this._valid === void 0)
      this._valid = this.direction !== LineDirection.None && this.length > Shape.tolerance;
    return this._valid;
  }
  get normalized() {
    if (this.direction === LineDirection.Horizontal)
      return new Line(
        new Point(this.from.x - Shape.tolerance, this.from.y),
        new Point(this.to.x + Shape.tolerance, this.from.y),
      );
    else if (this.direction === LineDirection.Vertical)
      return new Line(
        new Point(this.from.x, this.from.y - Shape.tolerance),
        new Point(this.from.x, this.to.y + Shape.tolerance),
      );
    return this;
  }
  addGap(line) {
    this.gaps.push(line);
  }
  containsPoint(p) {
    if (this.direction === LineDirection.Vertical)
      return this.from.x === p.x && p.y >= this.from.y && p.y <= this.to.y;
    else if (this.direction === LineDirection.Horizontal)
      return this.from.y === p.y && p.x >= this.from.x && p.x <= this.to.x;
    return false;
  }
  addIntersectionPoint(point) {
    for (const intPoint of this.intersections) if (intPoint.equal(point)) return;
    this.intersections.push(point);
  }
  intersection(line) {
    let result;
    if (!this.valid || !line.valid) return result;
    const thisNormalized = this.normalized;
    const lineNormalized = line.normalized;
    if (this.direction === LineDirection.Horizontal && line.direction === LineDirection.Vertical) {
      const x = lineNormalized.from.x;
      const y = thisNormalized.from.y;
      if (
        x > thisNormalized.from.x &&
        x < thisNormalized.to.x &&
        y > lineNormalized.from.y &&
        y < lineNormalized.to.y
      ) {
        const intPoint = new Point(x, y);
        this.addIntersectionPoint(intPoint);
        line.addIntersectionPoint(intPoint);
        result = intPoint;
      }
    } else if (
      this.direction === LineDirection.Vertical &&
      line.direction === LineDirection.Horizontal
    ) {
      const x = thisNormalized.from.x;
      const y = lineNormalized.from.y;
      if (
        x > lineNormalized.from.x &&
        x < lineNormalized.to.x &&
        y > thisNormalized.from.y &&
        y < thisNormalized.to.y
      ) {
        const intPoint = new Point(x, y);
        this.addIntersectionPoint(intPoint);
        line.addIntersectionPoint(intPoint);
        result = intPoint;
      }
    }
    return result;
  }
  transform(matrix) {
    const p1 = this.from.transform(matrix);
    const p2 = this.to.transform(matrix);
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const width = Math.abs(p1.x - p2.x);
    const height = Math.abs(p1.y - p2.y);
    this.from = new Point(x, y);
    this.to = new Point(x + width, y + height);
    this.init();
    return this;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/geometry/TableData.js
var TableData = class {
  minXY;
  maxXY;
  rows;
  rowPivots;
  colPivots;
  constructor(minXY, maxXY, rowPivots, colPivots) {
    this.minXY = minXY;
    this.maxXY = maxXY;
    this.rows = [];
    this.rowPivots = rowPivots;
    this.colPivots = colPivots;
  }
  findCell(x, y) {
    if (x >= this.minXY.x && y >= this.minXY.y && x <= this.maxXY.x && y <= this.maxXY.y) {
      for (const row of this.rows)
        for (const cell of row)
          if (cell.minXY.x <= x && cell.minXY.y <= y && cell.maxXY.x >= x && cell.maxXY.y >= y)
            return cell;
    }
  }
  get cellCount() {
    return this.rows.reduce((acc, row) => acc + row.length, 0);
  }
  get rowCount() {
    return this.rows.length;
  }
  check() {
    const virtualCellCount = (this.colPivots.length - 1) * (this.rowPivots.length - 1);
    let allCellCount = 0;
    for (const row of this.rows)
      for (const cell of row) {
        const count = (cell.colspan || 1) * (cell.rowspan || 1);
        allCellCount += count;
      }
    if (virtualCellCount !== allCellCount) return false;
    return true;
  }
  toArray() {
    const tableArr = [];
    for (const row of this.rows) {
      const rowArr = [];
      for (const cell of row) {
        let text = cell.text.join("");
        text = text.replace(/^[\s]+|[\s]+$/g, "");
        text = text.trim();
        rowArr.push(text);
      }
      tableArr.push(rowArr);
    }
    return tableArr;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/geometry/Table.js
var Table = class {
  hLines = [];
  vLines = [];
  constructor(line) {
    if (line.direction === LineDirection.Horizontal) this.hLines.push(line);
    else if (line.direction === LineDirection.Vertical) this.vLines.push(line);
  }
  get isValid() {
    return this.hLines.length + this.vLines.length > 4;
  }
  get rowPivots() {
    const rowSet = /* @__PURE__ */ new Set();
    for (const line of this.hLines) rowSet.add(line.from.y);
    return [...rowSet].sort((a, b) => a - b);
  }
  get colPivots() {
    const colSet = /* @__PURE__ */ new Set();
    for (const line of this.vLines) colSet.add(line.from.x);
    return [...colSet].sort((a, b) => a - b);
  }
  add(line) {
    if (this.intersection(line)) {
      if (line.direction === LineDirection.Horizontal) {
        this.hLines.push(line);
        return true;
      } else if (line.direction === LineDirection.Vertical) {
        this.vLines.push(line);
        return true;
      }
    }
    return false;
  }
  intersection(line) {
    let flag = false;
    if (!line.valid) return flag;
    if (line.direction === LineDirection.Horizontal) {
      for (const vLine of this.vLines) if (line.intersection(vLine)) flag = true;
    } else if (line.direction === LineDirection.Vertical) {
      for (const hLine of this.hLines) if (line.intersection(hLine)) flag = true;
    }
    return flag;
  }
  getSameHorizontal(line) {
    const same = [line];
    const other = [];
    while (this.hLines.length > 0) {
      const hLine = this.hLines.shift();
      if (!hLine) continue;
      if (hLine.from.y === line.from.y) same.push(hLine);
      else other.push(hLine);
    }
    this.hLines = other;
    return same;
  }
  getSameVertical(line) {
    const same = [line];
    const other = [];
    while (this.vLines.length > 0) {
      const vLine = this.vLines.shift();
      if (!vLine) continue;
      if (vLine.from.x === line.from.x) same.push(vLine);
      else other.push(vLine);
    }
    this.vLines = other;
    return same;
  }
  mergeHorizontalLines(lines) {
    lines.sort((l1, l2) => l1.from.x - l2.from.x);
    const minX = lines[0].from.x;
    const maxX = lines[lines.length - 1].to.x;
    const resultLine = new Line(new Point(minX, lines[0].from.y), new Point(maxX, lines[0].from.y));
    for (let i = 1; i < lines.length; i++) {
      const prevLine = lines[i - 1];
      const currLine = lines[i];
      if (Math.abs(prevLine.to.x - currLine.from.x) > Shape.tolerance) {
        const gapLine = new Line(
          new Point(prevLine.to.x, prevLine.from.y),
          new Point(currLine.from.x, currLine.from.y),
        );
        resultLine.addGap(gapLine);
      }
    }
    return resultLine;
  }
  mergeVerticalLines(lines) {
    lines.sort((l1, l2) => l1.from.y - l2.from.y);
    const minY = lines[0].from.y;
    const maxY = lines[lines.length - 1].to.y;
    const resultLine = new Line(new Point(lines[0].from.x, minY), new Point(lines[0].from.x, maxY));
    for (let i = 1; i < lines.length; i++) {
      const prevLine = lines[i - 1];
      const currLine = lines[i];
      if (Math.abs(prevLine.to.y - currLine.from.y) > Shape.tolerance) {
        const gapLine = new Line(
          new Point(prevLine.to.x, prevLine.to.y),
          new Point(prevLine.to.x, currLine.from.y),
        );
        resultLine.addGap(gapLine);
      }
    }
    return resultLine;
  }
  normalize() {
    this.hLines = this.hLines.filter((l) => l.intersections.length > 1);
    this.vLines = this.vLines.filter((l) => l.intersections.length > 1);
    this.hLines.sort((l1, l2) => l1.from.y - l2.from.y);
    this.vLines.sort((l1, l2) => l1.from.x - l2.from.x);
    const newHLines = [];
    while (this.hLines.length > 0) {
      const line = this.hLines.shift();
      if (!line) continue;
      const lines = this.getSameHorizontal(line);
      const merged = this.mergeHorizontalLines(lines);
      newHLines.push(merged);
    }
    this.hLines = newHLines;
    const newVLines = [];
    while (this.vLines.length > 0) {
      const line = this.vLines.shift();
      if (!line) continue;
      const lines = this.getSameVertical(line);
      const merged = this.mergeVerticalLines(lines);
      newVLines.push(merged);
    }
    this.vLines = newVLines;
  }
  verticalExists(line, y1, y2) {
    if (line.direction !== LineDirection.Vertical) throw new Error("Line is not vertical");
    if (y1 >= y2) throw new Error("y1 must be less than y2");
    if (line.from.y <= y1 && line.to.y >= y2) {
      for (const gap of line.gaps) if (gap.from.y <= y1 && gap.to.y >= y2) return false;
      return true;
    }
    return false;
  }
  horizontalExists(line, x1, x2) {
    if (line.direction !== LineDirection.Horizontal) throw new Error("Line is not horizontal");
    if (x1 >= x2) throw new Error("x1 must be less than x2");
    if (line.from.x <= x1 && line.to.x >= x2) {
      for (const gap of line.gaps) if (gap.from.x <= x1 && gap.to.x >= x2) return false;
      return true;
    }
    return false;
  }
  findBottomLineIndex(h2Index, xMiddle) {
    for (let i = h2Index; i < this.hLines.length; i++) {
      const hLine = this.hLines[i];
      if (hLine.from.x <= xMiddle && hLine.to.x >= xMiddle) return i;
    }
    return -1;
  }
  findVerticalLineIndexs(topHLine, yMiddle) {
    const result = [];
    for (let i = 0; i < this.vLines.length; i++) {
      const vLine = this.vLines[i];
      if (vLine.from.y <= yMiddle && vLine.to.y >= yMiddle && topHLine.intersection(vLine))
        result.push(i);
    }
    return result;
  }
  getRow(h1Index, h2Index, yMiddle) {
    const tableRow = [];
    const topHLine = this.hLines[h1Index];
    const vLineIndexes = this.findVerticalLineIndexs(topHLine, yMiddle);
    for (let i = 1; i < vLineIndexes.length; i++) {
      const leftVLine = this.vLines[vLineIndexes[i - 1]];
      const rightVLine = this.vLines[vLineIndexes[i]];
      const xMiddle = (leftVLine.from.x + rightVLine.from.x) / 2;
      const bottomHLineIndex = this.findBottomLineIndex(h2Index, xMiddle);
      const bottomHLine = this.hLines[bottomHLineIndex];
      const tableCell = {
        minXY: new Point(leftVLine.from.x, topHLine.from.y),
        maxXY: new Point(rightVLine.from.x, bottomHLine.from.y),
        width: rightVLine.from.x - leftVLine.from.x,
        height: bottomHLine.from.y - topHLine.from.y,
        text: [],
      };
      const colSpan = vLineIndexes[i] - vLineIndexes[i - 1];
      const rowSpan = bottomHLineIndex - h1Index;
      if (colSpan > 1) tableCell.colspan = colSpan;
      if (rowSpan > 1) tableCell.rowspan = rowSpan;
      tableRow.push(tableCell);
    }
    return tableRow;
  }
  toData() {
    const rowPivots = this.rowPivots;
    const colPivots = this.colPivots;
    const result = new TableData(
      new Point(colPivots[0], rowPivots[0]),
      new Point(colPivots[colPivots.length - 1], rowPivots[rowPivots.length - 1]),
      rowPivots,
      colPivots,
    );
    for (let h1 = 1; h1 < this.hLines.length; h1++) {
      const prevHLine = this.hLines[h1 - 1];
      const currHLine = this.hLines[h1];
      const YMiddle = (prevHLine.from.y + currHLine.from.y) / 2;
      const rowData = this.getRow(h1 - 1, h1, YMiddle);
      result.rows.push(rowData);
    }
    return result;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/geometry/LineStore.js
var LineStore = class {
  hLines = [];
  vLines = [];
  add(line) {
    if (line.valid) {
      if (line.direction === LineDirection.Horizontal) this.hLines.push(line);
      else if (line.direction === LineDirection.Vertical) this.vLines.push(line);
    }
  }
  addRectangle(rect) {
    for (const line of rect.getLines()) this.add(line);
  }
  getTableData() {
    const result = [];
    const tables = this.getTables();
    for (const table of tables) {
      const data = table.toData();
      if (data) result.push(data);
    }
    return result;
  }
  getTables() {
    const result = [];
    while (this.hLines.length !== 0) {
      const hLine = this.hLines.shift();
      if (!hLine) continue;
      if (this.tryFill(result, hLine)) continue;
      const table = new Table(hLine);
      this.fillTable(table);
      result.push(table);
    }
    while (this.vLines.length !== 0) {
      const vLine = this.vLines.shift();
      if (!vLine) continue;
      if (this.tryFill(result, vLine)) continue;
      const table = new Table(vLine);
      this.fillTable(table);
      result.push(table);
    }
    const validTables = result.filter((t) => t.isValid);
    for (const table of validTables) table.normalize();
    return validTables;
  }
  normalize() {
    this.normalizeHorizontal();
    this.normalizeVertical();
  }
  normalizeHorizontal() {
    this.hLines.sort((l1, l2) => l1.from.y - l2.from.y);
    const newLines = [];
    let sameY = [];
    for (const line of this.hLines)
      if (sameY.length === 0) sameY.push(line);
      else if (Math.abs(sameY[0]?.from.y - line.from.y) < Shape.tolerance) sameY.push(line);
      else {
        const merged = this.margeHorizontalLines(sameY);
        newLines.push(...merged);
        sameY = [line];
      }
    if (sameY.length > 0) {
      const merged = this.margeHorizontalLines(sameY);
      newLines.push(...merged);
    }
    this.hLines = newLines;
  }
  normalizeVertical() {
    this.vLines.sort((l1, l2) => l1.from.x - l2.from.x);
    const newLines = [];
    let sameX = [];
    for (const line of this.vLines)
      if (sameX.length === 0) sameX.push(line);
      else if (Math.abs(sameX[0]?.from.x - line.from.x) < Shape.tolerance) sameX.push(line);
      else {
        const merged = this.margeVerticalLines(sameX);
        newLines.push(...merged);
        sameX = [line];
      }
    if (sameX.length > 0) {
      const merged = this.margeVerticalLines(sameX);
      newLines.push(...merged);
    }
    this.vLines = newLines;
  }
  fillTable(table) {
    const newVLines = [];
    const newHLines = [];
    for (const vLine of this.vLines) if (!table.add(vLine)) newVLines.push(vLine);
    for (const hLine of this.hLines) if (!table.add(hLine)) newHLines.push(hLine);
    this.hLines = newHLines;
    this.vLines = newVLines;
  }
  tryFill(tables, line) {
    for (const table of tables)
      if (table.add(line)) {
        this.fillTable(table);
        return true;
      }
    return false;
  }
  margeHorizontalLines(sameYLines) {
    const result = [];
    sameYLines.sort((l1, l2) => l1.from.x - l2.from.x);
    const sameY = sameYLines[0]?.from.y;
    if (sameY === void 0) return result;
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    for (const line of sameYLines)
      if (line.from.x - maxX < Shape.tolerance) {
        if (line.from.x < minX) minX = line.from.x;
        if (line.to.x > maxX) maxX = line.to.x;
      } else {
        if (maxX > minX) result.push(new Line(new Point(minX, sameY), new Point(maxX, sameY)));
        minX = line.from.x;
        maxX = line.to.x;
      }
    const last = result[result.length - 1];
    if (last) {
      if (last.from.x !== minX && last.to.x !== maxX)
        result.push(new Line(new Point(minX, sameY), new Point(maxX, sameY)));
    } else result.push(new Line(new Point(minX, sameY), new Point(maxX, sameY)));
    return result;
  }
  margeVerticalLines(sameXLines) {
    const result = [];
    sameXLines.sort((l1, l2) => l1.from.y - l2.from.y);
    const sameX = sameXLines[0]?.from.x;
    if (sameX === void 0) return result;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    for (const line of sameXLines)
      if (line.from.y - maxY < Shape.tolerance) {
        if (line.from.y < minY) minY = line.from.y;
        if (line.to.y > maxY) maxY = line.to.y;
      } else {
        if (maxY > minY) result.push(new Line(new Point(sameX, minY), new Point(sameX, maxY)));
        minY = line.from.y;
        maxY = line.to.y;
      }
    const last = result[result.length - 1];
    if (last) {
      if (last.from.y !== minY && last.to.y !== maxY)
        result.push(new Line(new Point(sameX, minY), new Point(sameX, maxY)));
    } else result.push(new Line(new Point(sameX, minY), new Point(sameX, maxY)));
    return result;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/geometry/Rectangle.js
var Rectangle = class extends Shape {
  from;
  width;
  height;
  constructor(from, width, height) {
    super();
    this.from = from;
    this.width = width;
    this.height = height;
  }
  get to() {
    return new Point(this.from.x + this.width, this.from.y + this.height);
  }
  getLines() {
    const to = this.to;
    return [
      new Line(this.from, new Point(to.x, this.from.y)),
      new Line(this.from, new Point(this.from.x, to.y)),
      new Line(new Point(to.x, this.from.y), to),
      new Line(new Point(this.from.x, to.y), to),
    ].filter((l) => l.valid);
  }
  transform(matrix) {
    const p1 = Shape.applyTransform([this.from.x, this.from.y], matrix);
    const p2 = Shape.applyTransform([this.from.x + this.width, this.from.y + this.height], matrix);
    const x = Math.min(p1[0], p2[0]);
    const y = Math.min(p1[1], p2[1]);
    const width = Math.abs(p1[0] - p2[0]);
    const height = Math.abs(p1[1] - p2[1]);
    this.from = new Point(x, y);
    this.width = width;
    this.height = height;
    return this;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/ImageResult.js
/**
 * @public
 * ImageResult
 * Helper container for extracted images grouped per page.
 */
var ImageResult = class {
  pages = [];
  total = 0;
  getPageImage(num, name) {
    for (const pageData of this.pages)
      if (pageData.pageNumber === num) {
        for (const img of pageData.images) if (img.name === name) return img;
      }
    return null;
  }
  constructor(total) {
    this.total = total;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/InfoResult.js
const XMP_DATE_PROPERTIES = [
  "xmp:createdate",
  "xmp:modifydate",
  "xmp:metadatadate",
  "xap:createdate",
  "xap:modifydate",
  "xap:metadatadate",
];
/**
 * @public
 * Aggregated information about a PDF document returned by getInfo().
 * The object contains high-level metadata, outline/bookmark structure,
 * per-page extracted hyperlinks and utility helpers for parsing dates.
 */
var InfoResult = class {
  total;
  /**
   * The PDF 'Info' dictionary. Typical fields include title, author, subject,
   * Creator, Producer and Creation/Modification dates. The exact structure is
   * determined by the PDF and as returned by PDF.js.
   */
  info;
  metadata;
  /**
   * An array of document fingerprint strings provided by PDF.js. Useful
   * for caching, de-duplication or identifying a document across runs.
   */
  fingerprints;
  /**
   * Permission flags for the document as returned by PDF.js (or null).
   * These flags indicate capabilities such as printing, copying and
   * other restrictions imposed by the PDF security settings.
   */
  permission;
  /**
   * Optional document outline (bookmarks). When present this is the
   * hierarchical navigation structure which viewers use for quick access.
   */
  outline;
  pages = [];
  /**
   * Collects dates from different sources (Info dictionary and XMP/XAP metadata)
   * and returns them as a DateNode where available. This helps callers compare
   * and choose the most relevant timestamp (for example a creation date vs XMP date).
   */
  getDateNode() {
    const result = {};
    const CreationDate = this.info?.CreationDate;
    if (CreationDate) result.CreationDate = pdfjs.PDFDateString.toDateObject(CreationDate);
    const ModDate = this.info?.ModDate;
    if (ModDate) result.ModDate = pdfjs.PDFDateString.toDateObject(ModDate);
    if (!this.metadata) return result;
    for (const prop of XMP_DATE_PROPERTIES) {
      const value = this.metadata?.get(prop);
      const date = this.parseISODateString(value);
      switch (prop) {
        case XMP_DATE_PROPERTIES[0]:
          result.XmpCreateDate = date;
          break;
        case XMP_DATE_PROPERTIES[1]:
          result.XmpModifyDate = date;
          break;
        case XMP_DATE_PROPERTIES[2]:
          result.XmpMetadataDate = date;
          break;
        case XMP_DATE_PROPERTIES[3]:
          result.XapCreateDate = date;
          break;
        case XMP_DATE_PROPERTIES[4]:
          result.XapModifyDate = date;
          break;
        case XMP_DATE_PROPERTIES[5]:
          result.XapMetadataDate = date;
          break;
      }
    }
    return result;
  }
  /**
   * Try to parse an ISO-8601 date string from XMP/XAP metadata. If the
   * value is falsy or cannot be parsed, undefined is returned to indicate
   * absence or unparsable input.
   */
  parseISODateString(isoDateString) {
    if (!isoDateString) return void 0;
    const parsedDate = Date.parse(isoDateString);
    if (!Number.isNaN(parsedDate)) return new Date(parsedDate);
  }
  constructor(total) {
    this.total = total;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/ParseParameters.js
function setDefaultParseParameters(params) {
  params.lineThreshold = params?.lineThreshold ?? 4.6;
  params.cellThreshold = params?.cellThreshold ?? 7;
  params.cellSeparator = params?.cellSeparator ?? "	";
  params.lineEnforce = params?.lineEnforce ?? true;
  params.pageJoiner = params?.pageJoiner ?? "\n-- page_number of total_number --";
  params.imageThreshold = params?.imageThreshold ?? 80;
  params.imageDataUrl = params?.imageDataUrl ?? true;
  params.imageBuffer = params?.imageBuffer ?? true;
  params.scale = params?.scale ?? 1;
  return params;
}
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/PathGeometry.js
var PathGeometry;
(function (PathGeometry) {
  PathGeometry[(PathGeometry["undefined"] = 0)] = "undefined";
  PathGeometry[(PathGeometry["hline"] = 1)] = "hline";
  PathGeometry[(PathGeometry["vline"] = 2)] = "vline";
  PathGeometry[(PathGeometry["rectangle"] = 3)] = "rectangle";
})(PathGeometry || (PathGeometry = {}));
var DrawOPS;
(function (DrawOPS) {
  DrawOPS[(DrawOPS["moveTo"] = 0)] = "moveTo";
  DrawOPS[(DrawOPS["lineTo"] = 1)] = "lineTo";
  DrawOPS[(DrawOPS["curveTo"] = 2)] = "curveTo";
  DrawOPS[(DrawOPS["closePath"] = 3)] = "closePath";
  DrawOPS[(DrawOPS["rectangle"] = 4)] = "rectangle";
})(DrawOPS || (DrawOPS = {}));
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/ScreenshotResult.js
/**
 * @public
 * ScreenshotResult
 */
var ScreenshotResult = class {
  pages = [];
  total = 0;
  constructor(total) {
    this.total = total;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/TableResult.js
/**
 * @public
 * TableResult
 */
var TableResult = class {
  pages = [];
  mergedTables = [];
  total = 0;
  constructor(total) {
    this.total = total;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/TextResult.js
/**
 * @public
 * TextResult
 */
var TextResult = class {
  pages = [];
  text = "";
  total = 0;
  getPageText(num) {
    for (const pageData of this.pages) if (pageData.num === num) return pageData.text;
    return "";
  }
  constructor(total) {
    this.total = total;
  }
};
//#endregion
//#region ../node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/PDFParse.js
/**
 * @public
 * Loads PDF documents and exposes helpers for text, image, table, metadata, and screenshot extraction.
 */
var PDFParse = class {
  options;
  doc;
  progress = {
    loaded: -1,
    total: 0,
  };
  /**
   * Create a new parser with `LoadParameters`.
   * Converts Node.js `Buffer` data to `Uint8Array` automatically and ensures a default verbosity level.
   * @param options - Initialization parameters.
   */
  constructor(options) {
    if (options.verbosity === void 0) options.verbosity = pdfjs.VerbosityLevel.ERRORS;
    if (typeof Buffer !== "undefined" && options.data instanceof Buffer)
      options.data = new Uint8Array(options.data);
    this.options = options;
  }
  async destroy() {
    if (this.doc) {
      await this.doc.destroy();
      this.doc = void 0;
    }
  }
  static get isNodeJS() {
    return (
      typeof process === "object" &&
      `${process}` === "[object process]" &&
      !process.versions.nw &&
      !(
        process.versions.electron &&
        typeof process.type !== "undefined" &&
        process.type !== "browser"
      )
    );
  }
  static setWorker(workerSrc) {
    if (typeof globalThis.pdfjs === "undefined") globalThis.pdfjs = pdfjs;
    if (pdfjs?.GlobalWorkerOptions === null) return "";
    if (workerSrc !== void 0) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      return pdfjs.GlobalWorkerOptions.workerSrc;
    }
    return pdfjs.GlobalWorkerOptions.workerSrc;
  }
  /**
   * Load document-level metadata (info, outline, permissions, page labels) and optionally gather per-page link details.
   * @param params - Parse options; set `parsePageInfo` to collect per-page metadata described in `ParseParameters`.
   * @returns Aggregated document metadata in an `InfoResult`.
   */
  async getInfo(params = {}) {
    const doc = await this.load();
    const result = new InfoResult(doc.numPages);
    const { info, metadata } = await doc.getMetadata();
    result.info = info;
    result.metadata = metadata;
    result.fingerprints = doc.fingerprints;
    result.outline = await doc.getOutline();
    result.permission = await doc.getPermissions();
    const pageLabels = await doc.getPageLabels();
    if (params.parsePageInfo) {
      for (let i = 1; i <= result.total; i++)
        if (this.shouldParse(i, result.total, params)) {
          const page = await doc.getPage(i);
          const pageLinkResult = await this.getPageLinks(page);
          pageLinkResult.pageLabel = pageLabels?.[page.pageNumber];
          result.pages.push(pageLinkResult);
          page.cleanup();
        }
    }
    return result;
  }
  async getPageLinks(page) {
    const viewport = page.getViewport({ scale: 1 });
    const result = {
      pageNumber: page.pageNumber,
      links: [],
      width: viewport.width,
      height: viewport.height,
    };
    const annotations = (await page.getAnnotations({ intent: "display" })) || [];
    for (const i of annotations) {
      if (i.subtype !== "Link") continue;
      const url = i.url ?? i.unsafeUrl;
      if (!url) continue;
      const text = i.overlaidText || "";
      result.links.push({
        url,
        text,
      });
    }
    return result;
  }
  /**
   * Extract plain text for each requested page, optionally enriching hyperlinks and enforcing line or cell separators.
   * @param params - Parse options controlling pagination, link handling, and line/cell thresholds.
   * @returns A `TextResult` containing page-wise text and a concatenated document string.
   */
  async getText(params = {}) {
    const doc = await this.load();
    const result = new TextResult(doc.numPages);
    for (let i = 1; i <= result.total; i++)
      if (this.shouldParse(i, result.total, params)) {
        const page = await doc.getPage(i);
        const text = await this.getPageText(page, params, result.total);
        result.pages.push({
          text,
          num: i,
        });
        page.cleanup();
      }
    for (const page of result.pages)
      if (params.pageJoiner) {
        let pageNumber = params.pageJoiner.replace("page_number", `${page.num}`);
        pageNumber = pageNumber.replace("total_number", `${result.total}`);
        result.text += `${page.text}\n${pageNumber}\n\n`;
      } else result.text += `${page.text}\n\n`;
    return result;
  }
  async load() {
    try {
      if (this.doc === void 0) {
        const loadingTask = pdfjs.getDocument(this.options);
        loadingTask.onProgress = (progress) => {
          this.progress = progress;
        };
        this.doc = await loadingTask.promise;
      }
      return this.doc;
    } catch (error) {
      throw getException(error);
    }
  }
  shouldParse(currentPage, totalPage, params) {
    params.partial = params?.partial ?? [];
    params.first = params?.first ?? 0;
    params.last = params?.last ?? 0;
    if (params.partial.length > 0) {
      if (params.partial.includes(currentPage)) return true;
      return false;
    }
    if (params.first > 0 && params.last > 0) {
      if (currentPage >= params.first && currentPage <= params.last) return true;
      return false;
    }
    if (params.first > 0) {
      if (currentPage <= params.first) return true;
      return false;
    }
    if (params.last > 0) {
      if (currentPage > totalPage - params.last) return true;
      return false;
    }
    return true;
  }
  async getPageText(page, parseParams, total) {
    const viewport = page.getViewport({ scale: 1 });
    const params = setDefaultParseParameters(parseParams);
    const textContent = await page.getTextContent({
      includeMarkedContent: !!params.includeMarkedContent,
      disableNormalization: !!params.disableNormalization,
    });
    let links = /* @__PURE__ */ new Map();
    if (params.parseHyperlinks) links = await this.getHyperlinks(page, viewport);
    const strBuf = [];
    let lastX;
    let lastY;
    let lineHeight = 0;
    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const tm = item.transform ?? item.transform;
      const [x, y] = viewport.convertToViewportPoint(tm[4], tm[5]);
      if (params.parseHyperlinks) {
        const hit = (links.get(item.str) || []).find(
          (l) => x >= l.rect.left && x <= l.rect.right && y >= l.rect.top && y <= l.rect.bottom,
        );
        if (hit) item.str = `[${item.str}](${hit.url})`;
      }
      if (params.lineEnforce) {
        if (lastY !== void 0 && Math.abs(lastY - y) > params.lineThreshold) {
          const lastItem = strBuf.length ? strBuf[strBuf.length - 1] : void 0;
          const isCurrentItemHasNewLine =
            item.str.startsWith("\n") || (item.str.trim() === "" && item.hasEOL);
          if (lastItem?.endsWith("\n") === false && !isCurrentItemHasNewLine) {
            if (Math.abs(lastY - y) - 1 > lineHeight) {
              strBuf.push("\n");
              lineHeight = 0;
            }
          }
        }
      }
      if (params.cellSeparator) {
        if (lastY !== void 0 && Math.abs(lastY - y) < params.lineThreshold) {
          if (lastX !== void 0 && Math.abs(lastX - x) > params.cellThreshold)
            item.str = `${params.cellSeparator}${item.str}`;
        }
      }
      strBuf.push(item.str);
      lastX = x + item.width;
      lastY = y;
      lineHeight = Math.max(lineHeight, item.height);
      if (item.hasEOL) strBuf.push("\n");
      if (item.hasEOL || item.str.endsWith("\n")) lineHeight = 0;
    }
    if (params.itemJoiner) return strBuf.join(params.itemJoiner);
    return strBuf.join("");
  }
  async getHyperlinks(page, viewport) {
    const result = /* @__PURE__ */ new Map();
    const annotations = (await page.getAnnotations({ intent: "display" })) || [];
    for (const i of annotations) {
      if (i.subtype !== "Link") continue;
      const url = i.url ?? i.unsafeUrl;
      if (!url) continue;
      const text = i.overlaidText;
      if (!text) continue;
      const rectVp = viewport.convertToViewportRectangle(i.rect);
      const pos = {
        rect: {
          left: Math.min(rectVp[0], rectVp[2]) - 0.5,
          top: Math.min(rectVp[1], rectVp[3]) - 0.5,
          right: Math.max(rectVp[0], rectVp[2]) + 0.5,
          bottom: Math.max(rectVp[1], rectVp[3]) + 0.5,
        },
        url,
        text,
        used: false,
      };
      const el = result.get(text);
      if (el) el.push(pos);
      else result.set(text, [pos]);
    }
    return result;
  }
  /**
   * Extract embedded images from requested pages.
   *
   * Behavior notes:
   * - Pages are selected according to ParseParameters (partial, first, last).
   * - Images smaller than `params.imageThreshold` (width OR height) are skipped.
   * - Returned ImageResult contains per-page PageImages; each image entry includes:
   *     - data: Uint8Array (present when params.imageBuffer === true)
   *     - dataUrl: string (present when params.imageDataUrl === true)
   *     - width, height, kind, name
   * - Works in both Node.js (canvas.toBuffer) and browser (canvas.toDataURL) environments.
   *
   * @param params - ParseParameters controlling page selection, thresholds and output format.
   * @returns Promise<ImageResult> with extracted images grouped by page.
   */
  async getImage(params = {}) {
    const doc = await this.load();
    const result = new ImageResult(doc.numPages);
    setDefaultParseParameters(params);
    for (let i = 1; i <= result.total; i++)
      if (this.shouldParse(i, result.total, params)) {
        const page = await doc.getPage(i);
        const ops = await page.getOperatorList();
        const pageImages = {
          pageNumber: i,
          images: [],
        };
        result.pages.push(pageImages);
        for (let j = 0; j < ops.fnArray.length; j++)
          if (
            ops.fnArray[j] === pdfjs.OPS.paintInlineImageXObject ||
            ops.fnArray[j] === pdfjs.OPS.paintImageXObject
          ) {
            const name = ops.argsArray[j][0];
            const { width, height, kind, data } = await (page.commonObjs.has(name)
              ? this.resolveEmbeddedImage(page.commonObjs, name)
              : this.resolveEmbeddedImage(page.objs, name));
            if (params.imageThreshold) {
              if (params.imageThreshold >= width || params.imageThreshold >= height) continue;
            }
            const canvasAndContext = doc.canvasFactory.create(width, height);
            const context = canvasAndContext.context;
            let imgData = null;
            if (kind === pdfjs.ImageKind.RGBA_32BPP) {
              imgData = context.createImageData(width, height);
              imgData.data.set(data);
            } else {
              imgData = context.createImageData(width, height);
              this.convertToRGBA({
                src: data,
                dest: new Uint32Array(imgData.data.buffer),
                width,
                height,
                kind,
              });
            }
            context.putImageData(imgData, 0, 0);
            let buffer = new Uint8Array();
            let dataUrl = "";
            if (typeof canvasAndContext.canvas.toBuffer === "function") {
              let nodeBuffer;
              if (params.imageBuffer) {
                nodeBuffer = canvasAndContext.canvas.toBuffer("image/png");
                buffer = new Uint8Array(nodeBuffer);
              }
              if (params.imageDataUrl)
                if (nodeBuffer) dataUrl = `data:image/png;base64,${nodeBuffer.toString("base64")}`;
                else {
                  nodeBuffer = canvasAndContext.canvas.toBuffer("image/png");
                  buffer = new Uint8Array(nodeBuffer);
                  dataUrl = `data:image/png;base64,${nodeBuffer.toString("base64")}`;
                }
            } else {
              if (params.imageBuffer) {
                const imageData = canvasAndContext.context.getImageData(
                  0,
                  0,
                  canvasAndContext.canvas.width,
                  canvasAndContext.canvas.height,
                );
                buffer = new Uint8Array(imageData.data);
              }
              if (params.imageDataUrl) dataUrl = canvasAndContext.canvas.toDataURL("image/png");
            }
            pageImages.images.push({
              data: buffer,
              dataUrl,
              name,
              height,
              width,
              kind,
            });
          }
      }
    return result;
  }
  convertToRGBA({ src, dest, width, height, kind }) {
    if (kind === pdfjs.ImageKind.RGB_24BPP)
      for (let i = 0, j = 0; i < src.length; i += 3, j++) {
        const r = src[i];
        const g = src[i + 1];
        dest[j] = (255 << 24) | (src[i + 2] << 16) | (g << 8) | r;
      }
    else if (kind === pdfjs.ImageKind.GRAYSCALE_1BPP) {
      let pixelIndex = 0;
      for (let i = 0; i < src.length; i++) {
        const byte = src[i];
        for (let bit = 7; bit >= 0; bit--) {
          if (pixelIndex >= width * height) break;
          const gray = ((byte >> bit) & 1) === 1 ? 255 : 0;
          dest[pixelIndex++] = (255 << 24) | (gray << 16) | (gray << 8) | gray;
        }
      }
    } else if (kind === void 0 || kind === null) {
      const bytesPerPixel = src.length / (width * height);
      if (Math.abs(bytesPerPixel - 3) < 0.1)
        for (let i = 0, j = 0; i < src.length; i += 3, j++) {
          const r = src[i];
          const g = src[i + 1];
          dest[j] = (255 << 24) | (src[i + 2] << 16) | (g << 8) | r;
        }
      else if (Math.abs(bytesPerPixel - 4) < 0.1)
        for (let i = 0, j = 0; i < src.length; i += 4, j++) {
          const r = src[i];
          const g = src[i + 1];
          const b = src[i + 2];
          dest[j] = (src[i + 3] << 24) | (b << 16) | (g << 8) | r;
        }
      else if (Math.abs(bytesPerPixel - 1) < 0.1)
        for (let i = 0; i < src.length; i++) {
          const gray = src[i];
          dest[i] = (255 << 24) | (gray << 16) | (gray << 8) | gray;
        }
      else
        throw new Error(
          `convertToRGBA: Cannot infer image format. kind: ${kind}, bytesPerPixel: ${bytesPerPixel}, width: ${width}, height: ${height}, dataLength: ${src.length}`,
        );
    } else
      throw new Error(
        `convertToRGBA: Unsupported image kind: ${kind}. Available kinds: GRAYSCALE_1BPP=${pdfjs.ImageKind.GRAYSCALE_1BPP}, RGB_24BPP=${pdfjs.ImageKind.RGB_24BPP}, RGBA_32BPP=${pdfjs.ImageKind.RGBA_32BPP}`,
      );
  }
  resolveEmbeddedImage(pdfObjects, name) {
    return new Promise((resolve, reject) => {
      pdfObjects.get(name, (imgData) => {
        if (imgData) {
          let dataBuff;
          if (imgData.data instanceof Uint8Array) dataBuff = imgData.data;
          else if (imgData.data instanceof Uint8ClampedArray)
            dataBuff = new Uint8Array(imgData.data);
          else if (imgData.data?.buffer) dataBuff = new Uint8Array(imgData.data.buffer);
          else if (imgData.bitmap) {
            const canvasAndContext = this.doc.canvasFactory.create(
              imgData.bitmap.width,
              imgData.bitmap.height,
            );
            canvasAndContext.context.drawImage(imgData.bitmap, 0, 0);
            const imageData = canvasAndContext.context.getImageData(
              0,
              0,
              imgData.bitmap.width,
              imgData.bitmap.height,
            );
            dataBuff = new Uint8Array(imageData.data.buffer);
          } else if (ArrayBuffer.isView(imgData.data))
            dataBuff = new Uint8Array(
              imgData.data.buffer,
              imgData.data.byteOffset,
              imgData.data.byteLength,
            );
          if (!dataBuff) {
            reject(
              /* @__PURE__ */ new Error(
                `Image object ${name}: data field is empty or invalid. Available fields: ${Object.keys(imgData).join(", ")}`,
              ),
            );
            return;
          }
          if (dataBuff.length === 0) {
            reject(
              /* @__PURE__ */ new Error(`Image object ${name}: data buffer is empty (length: 0)`),
            );
            return;
          }
          resolve({
            width: imgData.width,
            height: imgData.height,
            kind: imgData.kind,
            data: dataBuff,
          });
        } else reject(/* @__PURE__ */ new Error(`Image object ${name} not found`));
      });
    });
  }
  /**
   * Render pages to raster screenshots.
   *
   * Behavior notes:
   * - Pages are selected according to ParseParameters (partial, first, last).
   * - Use params.scale for zoom; if params.desiredWidth is specified it takes precedence.
   * - Each ScreenshotResult page contains:
   *     - data: Uint8Array (when params.imageBuffer === true)
   *     - dataUrl: string (when params.imageDataUrl === true)
   *     - pageNumber, width, height, scale
   * - Works in both Node.js (canvas.toBuffer) and browser (canvas.toDataURL) environments.
   *
   * @param parseParams - ParseParameters controlling page selection and render options.
   * @returns Promise<ScreenshotResult> with rendered page images.
   */
  async getScreenshot(parseParams = {}) {
    const params = setDefaultParseParameters(parseParams);
    const result = new ScreenshotResult((await this.load()).numPages);
    if (this.doc === void 0) throw new Error("PDF document not loaded");
    for (let i = 1; i <= result.total; i++)
      if (this.shouldParse(i, result.total, params)) {
        const page = await this.doc.getPage(i);
        let viewport = page.getViewport({ scale: params.scale });
        if (params.desiredWidth) {
          viewport = page.getViewport({ scale: 1 });
          const scale = params.desiredWidth / viewport.width;
          viewport = page.getViewport({ scale });
        }
        const canvasAndContext = this.doc.canvasFactory.create(viewport.width, viewport.height);
        const renderContext = {
          canvasContext: canvasAndContext.context,
          viewport,
          canvas: canvasAndContext.canvas,
        };
        await page.render(renderContext).promise;
        let data = new Uint8Array();
        let dataUrl = "";
        if (typeof canvasAndContext.canvas.toBuffer === "function") {
          let nodeBuffer;
          if (params.imageBuffer) {
            nodeBuffer = canvasAndContext.canvas.toBuffer("image/png");
            data = new Uint8Array(nodeBuffer);
          }
          if (params.imageDataUrl)
            if (nodeBuffer) dataUrl = `data:image/png;base64,${nodeBuffer.toString("base64")}`;
            else {
              nodeBuffer = canvasAndContext.canvas.toBuffer("image/png");
              data = new Uint8Array(nodeBuffer);
              dataUrl = `data:image/png;base64,${nodeBuffer.toString("base64")}`;
            }
        } else {
          if (params.imageBuffer) {
            const imageData = canvasAndContext.context.getImageData(
              0,
              0,
              canvasAndContext.canvas.width,
              canvasAndContext.canvas.height,
            );
            data = new Uint8Array(imageData.data);
          }
          if (params.imageDataUrl) dataUrl = canvasAndContext.canvas.toDataURL("image/png");
        }
        result.pages.push({
          data,
          dataUrl,
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          scale: viewport.scale,
        });
        page.cleanup();
      }
    return result;
  }
  /**
   * Detect and extract tables from pages by analysing vector drawing operators, then populate cells with text.
   *
   * Behavior notes:
   * - Scans operator lists for rectangles/lines that form table grids (uses PathGeometry and LineStore).
   * - Normalizes detected geometry and matches positioned text to table cells.
   * - Honors ParseParameters for page selection.
   *
   * @param params - ParseParameters controlling which pages to analyse (partial/first/last).
   * @returns Promise<TableResult> containing discovered tables per page.
   */
  async getTable(params = {}) {
    const result = new TableResult((await this.load()).numPages);
    if (this.doc === void 0) throw new Error("PDF document not loaded");
    for (let i = 1; i <= result.total; i++)
      if (this.shouldParse(i, result.total, params)) {
        const page = await this.doc.getPage(i);
        const store = await this.getPageTables(page);
        store.normalize();
        const tableDataArr = store.getTableData();
        await this.fillPageTables(page, tableDataArr);
        const pageTableResult = {
          num: i,
          tables: [],
        };
        for (const table of tableDataArr) pageTableResult.tables.push(table.toArray());
        result.pages.push(pageTableResult);
        page.cleanup();
      }
    return result;
  }
  getPathGeometry(mm) {
    const width = mm[2] - mm[0];
    const height = mm[3] - mm[1];
    if (mm[0] === Infinity) return PathGeometry.undefined;
    if (width > 5 && height > 5) return PathGeometry.rectangle;
    else if (width > 5 && height === 0) return PathGeometry.hline;
    else if (width === 0 && height > 5) return PathGeometry.vline;
    return PathGeometry.undefined;
  }
  async getPageTables(page) {
    const lineStore = new LineStore();
    const viewport = page.getViewport({ scale: 1 });
    let transformMatrix = [1, 0, 0, 1, 0, 0];
    const transformStack = [];
    const opList = await page.getOperatorList();
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];
      const op = args?.[0] ?? 0;
      const mm = args?.[2] ?? [Infinity, Infinity, -Infinity, -Infinity];
      if (fn === pdfjs.OPS.constructPath) {
        if (op === pdfjs.OPS.fill) {
        }
        if (op !== pdfjs.OPS.stroke) continue;
        const pg = this.getPathGeometry(mm);
        if (pg === PathGeometry.rectangle) {
          const rect = new Rectangle(new Point(mm[0], mm[1]), mm[2] - mm[0], mm[3] - mm[1]);
          rect.transform(transformMatrix);
          rect.transform(viewport.transform);
          lineStore.addRectangle(rect);
        } else if (pg === PathGeometry.hline || pg === PathGeometry.vline) {
          const line = new Line(new Point(mm[0], mm[1]), new Point(mm[2], mm[3]));
          line.transform(transformMatrix);
          line.transform(viewport.transform);
          lineStore.add(line);
        }
      } else if (fn === pdfjs.OPS.setLineWidth) {
      } else if (fn === pdfjs.OPS.save) transformStack.push(transformMatrix);
      else if (fn === pdfjs.OPS.restore) {
        const restoredMatrix = transformStack.pop();
        if (restoredMatrix) transformMatrix = restoredMatrix;
      } else if (fn === pdfjs.OPS.transform)
        transformMatrix = pdfjs.Util.transform(transformMatrix, args);
    }
    return lineStore;
  }
  async fillPageTables(page, pageTables) {
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent({
      includeMarkedContent: false,
      disableNormalization: false,
    });
    for (const textItem of textContent.items) {
      if (!("str" in textItem)) continue;
      const tx = pdfjs.Util.transform(
        pdfjs.Util.transform(viewport.transform, textItem.transform),
        [1, 0, 0, -1, 0, 0],
      );
      for (const pageTable of pageTables) {
        const cell = pageTable.findCell(tx[4], tx[5]);
        if (cell) {
          cell.text.push(textItem.str);
          if (textItem.hasEOL) cell.text.push("\n");
          break;
        }
      }
    }
  }
};
//#endregion
export {
  AbortException,
  FormatError,
  InvalidPDFException,
  Line,
  LineDirection,
  LineStore,
  PDFParse,
  PasswordException,
  Point,
  Rectangle,
  ResponseException,
  Shape,
  Table,
  UnknownErrorException,
  VerbosityLevel,
  getException,
};
