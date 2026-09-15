const ROW_PATTERN = /^(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+([\d.,]+)\s*€$/;
const HEADER_MARKERS = /Студијски програм|Област|Буџ|самофин|школарина|укупно|странци|домаћи/i;

export interface TableSplitResult {
    tableSentences: string[];
    proseLines: string[];
}

export function splitTableAndProse(lines: string[]): TableSplitResult {
    const tableSentences: string[] = [];
    const proseLines: string[] = [];
    let currentDepartment = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(ROW_PATTERN);

        if (!match) {
            const nextLine = lines[i + 1];
            const precedesDataRow = nextLine !== undefined && ROW_PATTERN.test(nextLine);

            if (precedesDataRow) {
                if (!HEADER_MARKERS.test(line)) {
                    currentDepartment = line.trim();
                }
                continue;
            }

            proseLines.push(line);
            continue;
        }

        const [, name, budzet, samofin, ukupno, skolarina, valuta] = match;
        const prefix = currentDepartment ? `${currentDepartment} - ` : "";
        tableSentences.push(
            `${prefix}${name}: budžet ${budzet}, samofinansiranje ${samofin}, ukupno ${ukupno} mesta, školarina ${skolarina} dinara, za samofinansirajuće strance ${valuta} €.`
        );
    }

    return { tableSentences, proseLines };
}
