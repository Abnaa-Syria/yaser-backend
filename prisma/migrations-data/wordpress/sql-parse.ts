/**
 * Shared helpers for parsing phpMyAdmin-style INSERT tuples from a WordPress dump.
 */
export function unescapeSqlString(value: string) {
  return value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

export function inferTablePrefix(sql: string) {
  const match = sql.match(/CREATE TABLE `([^`]+)users`/);
  return match?.[1] || 'wp_';
}

/** Yield each VALUES tuple for INSERT INTO `table` as raw field strings (quoted strings unescaped, NULL→null). */
export function* iterateInsertTuples(sql: string, table: string): Generator<(string | null)[]> {
  const insertRegex = new RegExp(`INSERT INTO \`${table}\`[^V]*VALUES\\s*`, 'gi');
  let insertMatch: RegExpExecArray | null;

  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    let i = insertMatch.index + insertMatch[0].length;
    while (i < sql.length) {
      while (i < sql.length && /\s|,/.test(sql[i])) i += 1;
      if (sql[i] === ';') break;
      if (sql[i] !== '(') {
        // End of this INSERT statement or unexpected char
        if (sql[i] === ';') break;
        i += 1;
        continue;
      }
      i += 1; // skip '('
      const fields: (string | null)[] = [];
      while (i < sql.length) {
        while (i < sql.length && /\s/.test(sql[i])) i += 1;
        if (sql[i] === ')') {
          i += 1;
          break;
        }
        if (sql[i] === ',') {
          i += 1;
          continue;
        }
        if (/^[nN][uU][lL][lL]/.test(sql.slice(i, i + 4)) && !/[A-Za-z0-9_]/.test(sql[i + 4] || '')) {
          fields.push(null);
          i += 4;
          continue;
        }
        if (sql[i] === "'" || sql[i] === '"') {
          const quote = sql[i];
          i += 1;
          let raw = '';
          while (i < sql.length) {
            if (sql[i] === '\\') {
              raw += sql[i] + (sql[i + 1] || '');
              i += 2;
              continue;
            }
            if (sql[i] === quote) {
              i += 1;
              break;
            }
            raw += sql[i];
            i += 1;
          }
          fields.push(unescapeSqlString(raw));
          continue;
        }
        // number / bare token
        let token = '';
        while (i < sql.length && !/[,\)]/.test(sql[i])) {
          token += sql[i];
          i += 1;
        }
        fields.push(token.trim());
      }
      yield fields;
    }
  }
}

export function slugify(input: string, fallback: string) {
  const base = String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || fallback;
}
