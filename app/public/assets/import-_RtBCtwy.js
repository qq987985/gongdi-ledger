import{t as e}from"./jsx-runtime-DREnUpxT.js";
import{y as t}from"./index-ghxum7yZ.js";
import{a as PeopleImport,i as PaymentImport,n as ContractImport,o as TplLink,r as FullBookImport,t as AttendanceImport,e as ExpenseImport}from"./excel-import-CV73N9jL.js";
import{t as r}from"./can-9AzYldNF.js";
var i=e();
var outline=`btn inline-flex items-center rounded-sm border border-line-strong bg-surface text-xs hover:bg-accent-soft`;
var primary=`btn inline-flex items-center rounded-sm bg-accent text-xs text-accent-fg hover:opacity-90`;
function a(){
	let e=t();
	return(0,i.jsxs)(`div`,{className:`space-y-5`,children:[
		(0,i.jsxs)(`header`,{children:[
			(0,i.jsx)(`h1`,{className:`font-display text-2xl font-semibold`,children:`导入导出`}),
			(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`人员、考勤、发放、报销、合同都能从这里进出。导出按台账里实际有的字段全部写出。`})
		]}),
		(0,i.jsx)(r,{perm:`export.use`,children:(0,i.jsxs)(`section`,{className:`rounded-xl border border-line bg-surface p-5`,children:[
			(0,i.jsx)(`h2`,{className:`font-semibold`,children:`导出`}),
			(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`年台账含人员全部字段、12 个月考勤、全部发放、全部报销。也可只导出某一类。`}),
			(0,i.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[
				(0,i.jsxs)(`a`,{className:primary,href:`/api/file/export?year=${e.year}`,children:[`导出 `,e.year,` 年台账`]}),
				(0,i.jsx)(`a`,{className:outline,href:`/api/file/people-export`,children:`导出人员名单`}),
				(0,i.jsx)(`a`,{className:outline,href:`/api/file/payment-export`,children:`导出全部发放`}),
				(0,i.jsx)(`a`,{className:outline,href:`/api/file/expense-export`,children:`导出全部报销`}),
				(0,i.jsxs)(`a`,{className:outline,href:`/api/file/contract-export?year=${e.year}`,children:[`导出 `,e.year,` 年合同`]}),
				(0,i.jsx)(`a`,{className:outline,href:`/api/file/contract-export`,children:`导出全部年份合同`})
			]})
		]})}),
		(0,i.jsx)(r,{perm:`import.use`,children:(0,i.jsxs)(`div`,{className:`space-y-5`,children:[
			(0,i.jsxs)(`section`,{children:[
				(0,i.jsx)(`h2`,{className:`font-semibold`,children:`分项导入`}),
				(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`先下载模板填好再导入。人员重复会让你选跳过或覆盖。发放、报销是追加。`}),
				(0,i.jsxs)(`div`,{className:`mt-3 grid gap-4 md:grid-cols-2`,children:[
					(0,i.jsxs)(`div`,{className:`rounded-xl border border-line bg-surface p-5`,children:[
						(0,i.jsx)(`h3`,{className:`font-semibold`,children:`人员`}),
						(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`姓名、班组、身份证、银行卡、民族、籍贯、居住地等全部字段。`}),
						(0,i.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[
							(0,i.jsx)(TplLink,{href:`/api/file/people-template`,filename:`人员导入模板.xlsx`}),
							(0,i.jsx)(PeopleImport,{})
						]})
					]}),
					(0,i.jsxs)(`div`,{className:`rounded-xl border border-line bg-surface p-5`,children:[
						(0,i.jsx)(`h3`,{className:`font-semibold`,children:`考勤`}),
						(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`出勤天数、加班、补助、扣款。导入时选择写入哪年哪月。`}),
						(0,i.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[
							(0,i.jsx)(TplLink,{href:`/api/file/attendance-template?year=${e.year}`,filename:`${e.year}年考勤导入模板.xlsx`}),
							(0,i.jsx)(AttendanceImport,{})
						]})
					]}),
					(0,i.jsxs)(`div`,{className:`rounded-xl border border-line bg-surface p-5`,children:[
						(0,i.jsx)(`h3`,{className:`font-semibold`,children:`发放`}),
						(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`实际收款人、收款人、日期、金额、发放方、备注。日期可空=待发放。`}),
						(0,i.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[
							(0,i.jsx)(TplLink,{href:`/api/file/payment-template`,filename:`发放记录导入模板.xlsx`}),
							(0,i.jsx)(PaymentImport,{})
						]})
					]}),
					(0,i.jsxs)(`div`,{className:`rounded-xl border border-line bg-surface p-5`,children:[
						(0,i.jsx)(`h3`,{className:`font-semibold`,children:`报销`}),
						(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`项目、金额、支付方式、报销人、收款人、开户行、打款账户。`}),
						(0,i.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[
							(0,i.jsx)(TplLink,{href:`/api/file/expense-template`,filename:`报销单导入模板.xlsx`}),
							(0,i.jsx)(ExpenseImport,{})
						]})
					]}),
					(0,i.jsxs)(`div`,{className:`rounded-xl border border-line bg-surface p-5 md:col-span-2`,children:[
						(0,i.jsx)(`h3`,{className:`font-semibold`,children:`合同`}),
						(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`项目名称、金额、进度、报量 / 开票 / 收款。按年+名称+编号去重。`}),
						(0,i.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[
							(0,i.jsx)(TplLink,{href:`/api/file/contract-template`,filename:`合同导入模板.xlsx`}),
							(0,i.jsx)(ContractImport,{})
						]})
					]})
				]})
			]}),
			(0,i.jsxs)(`section`,{className:`rounded-xl border border-dashed border-line-strong bg-bg-elevated p-5`,children:[
				(0,i.jsx)(`h2`,{className:`font-semibold`,children:`导入整本台账`}),
				(0,i.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`一次写入人员、各月考勤、发放、报销。合同仍用上面单独导入。`}),
				(0,i.jsx)(`div`,{className:`mt-3`,children:(0,i.jsx)(FullBookImport,{})})
			]})
		]})})
	]});
}
export{a as component};
