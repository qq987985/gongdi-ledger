import * as XLSX from "xlsx";
import { buildPeopleWorkbook, parsePeopleSheet } from "../../src/lib/excel";
console.log("xlsx", typeof XLSX.write);
console.log("people fn", typeof buildPeopleWorkbook, typeof parsePeopleSheet);
