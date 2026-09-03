const PERM_GROUPS = [
	{
		key: "people",
		label: "人员",
		items: [
			{
				id: "people.view",
				label: "查看"
			},
			{
				id: "people.edit",
				label: "新增/修改"
			},
			{
				id: "people.delete",
				label: "删除"
			}
		]
	},
	{
		key: "attendance",
		label: "月度考勤",
		items: [
			{
				id: "attendance.view",
				label: "查看"
			},
			{
				id: "attendance.edit",
				label: "录入/修改"
			},
			{
				id: "attendance.delete",
				label: "删除"
			}
		]
	},
	{
		key: "payments",
		label: "发放记录",
		items: [
			{
				id: "payments.view",
				label: "查看"
			},
			{
				id: "payments.edit",
				label: "新增/修改"
			},
			{
				id: "payments.delete",
				label: "删除"
			}
		]
	},
	{
		key: "contracts",
		label: "合同",
		items: [
			{
				id: "contracts.view",
				label: "查看"
			},
			{
				id: "contracts.edit",
				label: "新增/修改"
			},
			{
				id: "contracts.delete",
				label: "删除"
			},
			{
				id: "contracts.print",
				label: "打印对账单"
			}
		]
	},
	{
		key: "expenses",
		label: "报销单",
		items: [
			{
				id: "expenses.view",
				label: "查看"
			},
			{
				id: "expenses.edit",
				label: "新增/修改"
			},
			{
				id: "expenses.delete",
				label: "删除"
			},
			{
				id: "expenses.print",
				label: "打印报销单"
			}
		]
	},
	{
		key: "photos",
		label: "照片",
		items: [{
			id: "photos.view",
			label: "查看"
		}, {
			id: "photos.edit",
			label: "上传/删除"
		}]
	},
	{
		key: "files",
		label: "影像资料",
		items: [{
			id: "files.view",
			label: "查看"
		}, {
			id: "files.edit",
			label: "上传/删除"
		}]
	},
	{
		key: "query",
		label: "个人查询",
		items: [{
			id: "query.view",
			label: "查看"
		}, {
			id: "query.print",
			label: "打印工资条"
		}]
	},
	{
		key: "io",
		label: "导入 / 导出",
		items: [{
			id: "import.use",
			label: "导入"
		}, {
			id: "export.use",
			label: "导出"
		}]
	},
	{
		key: "settings",
		label: "设置",
		items: [
			{
				id: "settings.year",
				label: "增减年度"
			},
			{
				id: "settings.rules",
				label: "批量工资规则"
			},
			{
				id: "settings.data",
				label: "清空/示例数据"
			}
		]
	},
	{
		key: "audit",
		label: "操作记录",
		items: [{
			id: "audit.view",
			label: "查看"
		}]
	},
	{
		key: "members",
		label: "成员",
		items: [{
			id: "members.manage",
			label: "分配权限"
		}]
	}
];
const ALL_PERMS = PERM_GROUPS.flatMap((g) => g.items.map((i) => i.id));
const PRESETS = [
	{
		id: "all",
		label: "全部权限",
		hint: "和创建人一样",
		perms: [...ALL_PERMS]
	},
	{
		id: "read",
		label: "只读",
		hint: "只能看，不能改",
		perms: ALL_PERMS.filter((p) => p.endsWith(".view") || p === "query.view" || p === "export.use" || p === "audit.view")
	},
	{
		id: "hr",
		label: "考勤发放",
		hint: "人员、考勤、发放、照片、查询",
		perms: [
			"people.view",
			"people.edit",
			"people.delete",
			"attendance.view",
			"attendance.edit",
			"attendance.delete",
			"payments.view",
			"payments.edit",
			"payments.delete",
			"photos.view",
			"photos.edit",
			"query.view",
			"query.print",
			"import.use",
			"export.use",
			"audit.view"
		]
	},
	{
		id: "contract",
		label: "合同财务",
		hint: "合同、报销、影像、导出",
		perms: [
			"contracts.view",
			"contracts.edit",
			"contracts.delete",
			"contracts.print",
			"expenses.view",
			"expenses.edit",
			"expenses.delete",
			"expenses.print",
			"files.view",
			"files.edit",
			"export.use",
			"audit.view"
		]
	}
];
function hasPerm(perms, id) {
	const list = perms || [];
	if (!list.length) return false;
	if (list.includes("*")) return true;
	if (list.includes(id)) return true;
	if (id.endsWith(".view")) {
		const prefix = id.slice(0, -5);
		if (list.some((p) => p.startsWith(prefix))) return true;
	}
	return false;
}
function canWriteLedger(perms) {
	const list = perms || [];
	if (list.includes("*")) return true;
	return list.some((p) => p.endsWith(".edit") || p.endsWith(".delete") || p === "import.use" || p.startsWith("settings.") || p === "photos.edit" || p === "files.edit" || p === "expenses.edit");
}
const NAV_PERM = {
	"/": "",
	"/people": "people.view",
	"/attendance": "attendance.view",
	"/payments": "payments.view",
	"/contracts": "contracts.view",
	"/expenses": "expenses.view",
	"/photos": "photos.view",
	"/files": "files.view",
	"/query": "query.view",
	"/audit": "audit.view",
	"/import": "import.use",
	"/export": "export.use",
	"/settings": ""
};
var live = ["*"];
var listeners = /* @__PURE__ */ new Set();
function setLivePerms(perms) {
	live = perms.length ? perms : [];
	listeners.forEach((fn) => fn());
}
function livePerms() {
	return live;
}
function subscribePerms(fn) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}
function can(id) {
	if (!id) return true;
	return hasPerm(live, id);
}
export { can as a, livePerms as c, PRESETS as i, setLivePerms as l, NAV_PERM as n, canWriteLedger as o, PERM_GROUPS as r, hasPerm as s, ALL_PERMS as t, subscribePerms as u };
