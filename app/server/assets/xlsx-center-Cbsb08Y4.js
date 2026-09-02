import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
function lastCol(ws) {
	let last = 1;
	(ws.getRow(2).cellCount > 1 ? ws.getRow(2) : ws.getRow(1)).eachCell({ includeEmpty: false }, (cell) => {
		const c = Number(cell.col);
		if (c > last) last = c;
	});
	return last;
}
async function writeCenteredXlsx(wb) {
	const raw = XLSX.write(wb, {
		bookType: "xlsx",
		type: "array"
	});
	const book = new ExcelJS.Workbook();
	await book.xlsx.load(raw);
	for (const ws of book.worksheets) {
		const last = lastCol(ws);
		let filled = 0;
		ws.getRow(1).eachCell({ includeEmpty: false }, () => {
			filled += 1;
		});
		if (filled > 1) {
			ws.getRow(1).alignment = {
				horizontal: "center",
				vertical: "middle",
				wrapText: true
			};
			continue;
		}
		const title = ws.getCell(1, 1).value;
		if (title == null || last < 2) continue;
		try {
			ws.mergeCells(1, 1, 1, last);
		} catch {}
		const cell = ws.getCell(1, 1);
		cell.value = title;
		cell.alignment = {
			horizontal: "center",
			vertical: "middle"
		};
		cell.font = {
			bold: true,
			size: 14,
			name: "Microsoft YaHei"
		};
		ws.getRow(1).height = 24;
		ws.getRow(2).alignment = {
			horizontal: "center",
			vertical: "middle",
			wrapText: true
		};
	}
	return await book.xlsx.writeBuffer();
}
export { writeCenteredXlsx as t };
