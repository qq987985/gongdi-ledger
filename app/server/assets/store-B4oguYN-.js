import { F as require_react, V as __toESM } from "../server.js";
import { s as uid } from "./utils-DqsA5Dz5.js";
import { _ as nextYear, h as localToday, p as derivedYears, s as round2, v as parseDateYmd } from "./wage-BjPg8C56.js";
import { S as numOrWarn, T as sumQuantity, d as splitLegacyReceipts, h as parseIdCard, i as teamNameError, p as normalizeIdDate, r as mergeTeams, u as normalizeEntry, v as nameKey, x as numOr } from "./teams-COFVEpEW.js";
import { a as diffDetail, c as expenseDeletedChanges, d as paymentChanges, f as paymentDeletedChanges, g as logOp, l as fmtMoney, m as personDeletedChanges, n as batchChanges, o as entryChanges, p as personChanges, r as contractChanges, s as expenseChanges, t as attendanceChanges } from "./audit-diff-Dq6lg3_A.js";
var createStoreImpl = (createState) => {
	let state;
	const listeners = /* @__PURE__ */ new Set();
	const setState = (partial, replace) => {
		const nextState = typeof partial === "function" ? partial(state) : partial;
		if (!Object.is(nextState, state)) {
			const previousState = state;
			state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
			listeners.forEach((listener) => listener(state, previousState));
		}
	};
	const getState = () => state;
	const getInitialState = () => initialState;
	const subscribe = (listener) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	};
	const api = {
		setState,
		getState,
		getInitialState,
		subscribe
	};
	const initialState = state = createState(setState, getState, api);
	return api;
};
var createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var identity = (arg) => arg;
function useStore(api, selector = identity) {
	const slice = import_react.useSyncExternalStore(api.subscribe, import_react.useCallback(() => selector(api.getState()), [api, selector]), import_react.useCallback(() => selector(api.getInitialState()), [api, selector]));
	import_react.useDebugValue(slice);
	return slice;
}
var createImpl = (createState) => {
	const api = createStore(createState);
	const useBoundStore = (selector) => useStore(api, selector);
	Object.assign(useBoundStore, api);
	return useBoundStore;
};
var create = ((createState) => createState ? createImpl(createState) : createImpl);
function createJSONStorage(getStorage, options) {
	let storage;
	try {
		storage = getStorage();
	} catch (e) {
		return;
	}
	return {
		getItem: (name) => {
			var _a;
			const parse = (str2) => {
				if (str2 === null) return null;
				return JSON.parse(str2, options == null ? void 0 : options.reviver);
			};
			const str = (_a = storage.getItem(name)) != null ? _a : null;
			if (str instanceof Promise) return str.then(parse);
			return parse(str);
		},
		setItem: (name, newValue) => storage.setItem(name, JSON.stringify(newValue, options == null ? void 0 : options.replacer)),
		removeItem: (name) => storage.removeItem(name)
	};
}
var toThenable = (fn) => (input) => {
	try {
		const result = fn(input);
		if (result instanceof Promise) return result;
		return {
			then(onFulfilled) {
				return toThenable(onFulfilled)(result);
			},
			catch(_onRejected) {
				return this;
			}
		};
	} catch (e) {
		return {
			then(_onFulfilled) {
				return this;
			},
			catch(onRejected) {
				return toThenable(onRejected)(e);
			}
		};
	}
};
var persistImpl = (config, baseOptions) => (set, get, api) => {
	let options = {
		storage: createJSONStorage(() => window.localStorage),
		partialize: (state) => state,
		version: 0,
		merge: (persistedState, currentState) => ({
			...currentState,
			...persistedState
		}),
		...baseOptions
	};
	let hasHydrated = false;
	let hydrationVersion = 0;
	const hydrationListeners = /* @__PURE__ */ new Set();
	const finishHydrationListeners = /* @__PURE__ */ new Set();
	let storage = options.storage;
	if (!storage) return config((...args) => {
		console.warn(`[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`);
		set(...args);
	}, get, api);
	const setItem = () => {
		const state = options.partialize({ ...get() });
		return storage.setItem(options.name, {
			state,
			version: options.version
		});
	};
	const savedSetState = api.setState;
	api.setState = (state, replace) => {
		savedSetState(state, replace);
		return setItem();
	};
	const configResult = config((...args) => {
		set(...args);
		return setItem();
	}, get, api);
	api.getInitialState = () => configResult;
	let stateFromStorage;
	const hydrate = () => {
		var _a, _b;
		if (!storage) return;
		const currentVersion = ++hydrationVersion;
		hasHydrated = false;
		hydrationListeners.forEach((cb) => {
			var _a2;
			return cb((_a2 = get()) != null ? _a2 : configResult);
		});
		const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
		return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
			if (deserializedStorageValue) if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
				if (options.migrate) {
					const migration = options.migrate(deserializedStorageValue.state, deserializedStorageValue.version);
					if (migration instanceof Promise) return migration.then((result) => [true, result]);
					return [true, migration];
				}
				console.error(`State loaded from storage couldn't be migrated since no migrate function was provided`);
			} else return [false, deserializedStorageValue.state];
			return [false, void 0];
		}).then((migrationResult) => {
			var _a2;
			if (currentVersion !== hydrationVersion) return;
			const [migrated, migratedState] = migrationResult;
			stateFromStorage = options.merge(migratedState, (_a2 = get()) != null ? _a2 : configResult);
			set(stateFromStorage, true);
			if (migrated) return setItem();
		}).then(() => {
			if (currentVersion !== hydrationVersion) return;
			postRehydrationCallback?.(get(), void 0);
			stateFromStorage = get();
			hasHydrated = true;
			finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
		}).catch((e) => {
			if (currentVersion !== hydrationVersion) return;
			postRehydrationCallback?.(void 0, e);
		});
	};
	api.persist = {
		setOptions: (newOptions) => {
			options = {
				...options,
				...newOptions
			};
			if (newOptions.storage) storage = newOptions.storage;
		},
		clearStorage: () => {
			++hydrationVersion;
			storage?.removeItem(options.name);
		},
		getOptions: () => options,
		rehydrate: () => hydrate(),
		hasHydrated: () => hasHydrated,
		onHydrate: (cb) => {
			hydrationListeners.add(cb);
			return () => {
				hydrationListeners.delete(cb);
			};
		},
		onFinishHydration: (cb) => {
			finishHydrationListeners.add(cb);
			return () => {
				finishHydrationListeners.delete(cb);
			};
		}
	};
	if (!options.skipHydration) hydrate();
	return stateFromStorage || configResult;
};
var persist = persistImpl;
var NO_COUNTS = {
	attendance: 0,
	payments: 0,
	receivers: 0,
	insuranceMembers: 0,
	expenses: 0
};
function fail(error, oldName = "", newName = "", input) {
	return {
		ok: false,
		error,
		oldName,
		newName,
		counts: { ...NO_COUNTS },
		attendance: input ? input.attendance : [],
		payments: input ? input.payments : [],
		insuranceMembers: input?.insuranceMembers || [],
		expenses: input?.expenses || []
	};
}
function planRenamePerson(input, id, rawName) {
	const target = input.people.find((p) => p.id === id);
	const newName = nameKey(rawName);
	if (!target) return fail("人员不存在（可能已被删除），没有改动任何数据", "", newName, input);
	const oldName = nameKey(target.name);
	if (!newName) return fail("姓名不能为空，没有改动任何数据", oldName, newName, input);
	if (newName === oldName) return {
		ok: true,
		oldName,
		newName,
		counts: { ...NO_COUNTS },
		attendance: input.attendance,
		payments: input.payments,
		insuranceMembers: input.insuranceMembers || [],
		expenses: input.expenses || []
	};
	if (input.people.some((p) => p.id !== id && nameKey(p.name) === newName)) return fail(`已有同名人员「${newName}」，改名已取消（考勤、发放、参保人、报销人里的姓名都没动）。请先给另一人改名，或换一个名字。`, oldName, newName, input);
	let attendanceCount = 0;
	const attendance = input.attendance.map((a) => {
		if (nameKey(a.name) !== oldName) return a;
		attendanceCount += 1;
		return {
			...a,
			name: newName
		};
	});
	let payments = 0;
	let receivers = 0;
	const nextPayments = input.payments.map((p) => {
		const ownerHit = nameKey(p.owner) === oldName;
		const receiverHit = nameKey(p.receiver) === oldName;
		if (!ownerHit && !receiverHit) return p;
		payments += 1;
		if (receiverHit) receivers += 1;
		return {
			...p,
			owner: ownerHit ? newName : p.owner,
			receiver: receiverHit ? newName : p.receiver
		};
	});
	const membersIn = input.insuranceMembers || [];
	let memberCount = 0;
	const nextMembers = membersIn.map((m) => {
		if (nameKey(m.name) !== oldName) return m;
		memberCount += 1;
		return {
			...m,
			name: newName
		};
	});
	const expensesIn = input.expenses || [];
	let expenseCount = 0;
	const nextExpenses = expensesIn.map((e) => {
		if (nameKey(e.claimant) !== oldName) return e;
		expenseCount += 1;
		return {
			...e,
			claimant: newName
		};
	});
	return {
		ok: true,
		oldName,
		newName,
		counts: {
			attendance: attendanceCount,
			payments,
			receivers,
			insuranceMembers: memberCount,
			expenses: expenseCount
		},
		attendance: attendanceCount ? attendance : input.attendance,
		payments: payments ? nextPayments : input.payments,
		insuranceMembers: memberCount ? nextMembers : membersIn,
		expenses: expenseCount ? nextExpenses : expensesIn
	};
}
function applyRenameToPeople(people, id, newName) {
	return people.map((p) => p.id === id ? {
		...p,
		name: nameKey(newName)
	} : p);
}
function renameLogDetail(plan) {
	const parts = [`同步 ${plan.counts.attendance} 条考勤`, `${plan.counts.payments} 笔发放`];
	if (plan.counts.receivers) parts.push(`其中 ${plan.counts.receivers} 笔是代收人`);
	if (plan.counts.insuranceMembers) parts.push(`${plan.counts.insuranceMembers} 位参保人`);
	if (plan.counts.expenses) parts.push(`${plan.counts.expenses} 条报销人`);
	return `${plan.oldName} → ${plan.newName}（${parts.join(" / ")}）`;
}
var depth = 0;
function syncMuted() {
	return depth > 0;
}
function runMuted(fn) {
	depth += 1;
	try {
		return fn();
	} finally {
		depth -= 1;
	}
}
const LEDGER_SCHEMA_VERSION = 3;
const PAY_METHODS = [
	"现金",
	"转账",
	"微信",
	"支付宝",
	"对公",
	"其他"
];
function needsVoucher(method) {
	return (method || "现金") !== "现金";
}
function expenseFormFromDraft(draft) {
	return {
		...draft,
		payBank: draft.payBank || (!draft.payCardNo ? draft.payAccount : "") || "",
		payCardNo: draft.payCardNo || "",
		payoutDate: draft.status === "已报销" ? draft.payoutDate || "" : ""
	};
}
var text = (value) => String(value ?? "").trim();
var common = (rows, field) => {
	const value = text(rows[0]?.[field]);
	return rows.length && rows.every((row) => text(row[field]) === value) ? value : "";
};
var validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && parseDateYmd(value) === value;
var joined = (values) => [...new Set(values.filter(Boolean))].join("、");
var snapshot = (row) => JSON.parse(JSON.stringify(row));
function expensePayoutBatches(expenses) {
	const groups = /* @__PURE__ */ new Map();
	for (const row of expenses) {
		if (!row.payoutId) continue;
		const rows = groups.get(row.payoutId) || [];
		rows.push(row);
		groups.set(row.payoutId, rows);
	}
	return [...groups].map(([id, rows]) => {
		const dates = rows.map((row) => parseDateYmd(row.payoutDate) || parseDateYmd(row.reimbursedAt) || parseDateYmd(row.date) || parseDateYmd(row.period));
		const status = rows.every((row) => row.status === rows[0].status) ? rows[0].status : "状态不一致";
		const issues = [];
		if (status === "状态不一致") issues.push("收款状态不一致");
		for (const [field, label] of [
			["forWhom", "收款人"],
			["payBank", "开户行"],
			["payCardNo", "收款账户"],
			["payoutDate", "收款日期"],
			["payoutMethod", "收款方式"],
			["payoutFileName", "收款凭证"]
		]) if (new Set(rows.map((row) => text(row[field]))).size > 1) issues.push(`${label}不一致`);
		return {
			id,
			rows,
			total: round2(sumQuantity(rows.map((row) => numOr(row.amount, 0)))),
			status,
			date: dates.sort().at(-1) || "",
			claimant: joined(rows.map((row) => text(row.claimant))),
			payee: joined(rows.map((row) => text(row.forWhom))),
			fileName: common(rows, "payoutFileName"),
			issues
		};
	}).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
function expensePayoutDraft(rows, today) {
	const claimant = common(rows, "claimant");
	const status = rows.length && rows.every((row) => row.status === "已报销") ? "已报销" : "未报销";
	const sameAccount = rows.length > 0 && rows.every((row) => [
		"forWhom",
		"payBank",
		"payCardNo"
	].every((field) => text(row[field]) === text(rows[0][field])));
	const forWhom = sameAccount ? common(rows, "forWhom") : "";
	const completeAccount = sameAccount && !!forWhom && !!common(rows, "payBank") && !!common(rows, "payCardNo");
	const date = common(rows, "payoutDate");
	return {
		claimant,
		forWhom: forWhom || claimant,
		payBank: completeAccount ? common(rows, "payBank") : "",
		payCardNo: completeAccount ? common(rows, "payCardNo") : "",
		payoutMethod: common(rows, "payoutMethod") || "转账",
		payoutDate: status === "已报销" ? validDate(date) ? date : validDate(today) ? today : "" : "",
		status
	};
}
function selectedRows(all, ids) {
	if (!ids.length) throw new Error("请先选择报销明细");
	if (new Set(ids).size !== ids.length || ids.some((id) => !id)) throw new Error("所选明细重复或编号无效，请重新选择");
	const selected = new Set(ids);
	const rows = all.filter((row) => selected.has(row.id));
	if (rows.length !== ids.length || new Set(rows.map((row) => row.id)).size !== ids.length) throw new Error("所选明细已变化或被删除，请重新打开");
	return rows;
}
function assertCompleteGroups(all, rows) {
	const selected = new Set(rows.map((row) => row.id));
	const groups = new Set(rows.map((row) => row.payoutId).filter(Boolean));
	if (all.some((row) => groups.has(row.payoutId) && !selected.has(row.id))) throw new Error("必须打开完整收款批次后操作，不能只修改其中几笔");
}
function planExpensePayout(args) {
	const { all, ids, editingId, draft, payoutId, fileName } = args;
	const rows = selectedRows(all, ids);
	if (editingId) {
		const existing = all.filter((row) => row.payoutId === editingId);
		if (!existing.length) throw new Error("该收款批次已变化，请重新打开");
		const selected$1 = new Set(ids);
		if (existing.some((row) => !selected$1.has(row.id))) throw new Error("请保留本批全部明细，解除批次需单独操作");
		if (rows.some((row) => row.payoutId && row.payoutId !== editingId)) throw new Error("不能把其他收款批次并入本批");
	} else if (rows.some((row) => row.payoutId)) throw new Error("所选明细已有收款批次，请从该批次打开，不要重新合并");
	if (!text(payoutId)) throw new Error("收款批次编号为空，请重新打开");
	const selected = new Set(ids);
	if (all.some((row) => row.payoutId === payoutId && !selected.has(row.id))) throw new Error("收款批次编号已被其他明细使用，请重新打开");
	if (draft.status !== "已报销" && draft.status !== "未报销") throw new Error("请选择收款状态");
	if (!PAY_METHODS.includes(draft.payoutMethod)) throw new Error("请选择收款方式");
	const date = text(draft.payoutDate);
	if (draft.status === "已报销") {
		if (!text(draft.forWhom)) throw new Error("请填写收款人");
		if (rows.some((row) => !text(row.claimant) && !text(draft.claimant))) throw new Error("请给未填报销人的明细补填报销人");
		if (draft.payoutMethod !== "现金" && (!text(draft.payBank) || !text(draft.payCardNo))) throw new Error("非现金收款需填写开户行和账户");
		if (!validDate(date)) throw new Error("请填写有效的收款日期");
	}
	return {
		before: rows.map(snapshot),
		after: rows.map((row) => ({
			...snapshot(row),
			claimant: text(row.claimant) ? row.claimant : text(draft.claimant),
			forWhom: text(draft.forWhom),
			payBank: text(draft.payBank),
			payCardNo: text(draft.payCardNo),
			payAccount: [draft.payBank, draft.payCardNo].map(text).filter(Boolean).join(" "),
			payoutMethod: draft.payoutMethod,
			payoutDate: draft.status === "已报销" ? date : "",
			reimbursedAt: draft.status === "已报销" ? date : "",
			status: draft.status,
			payoutId,
			payoutFileName: text(fileName)
		})),
		...editingId ? { groupId: editingId } : {}
	};
}
function planDissolveExpensePayout(all, ids, resetPaid) {
	const rows = selectedRows(all, ids);
	assertCompleteGroups(all, rows);
	const groups = [...new Set(rows.map((row) => row.payoutId).filter(Boolean))];
	return {
		before: rows.map(snapshot),
		after: rows.map((row) => ({
			...snapshot(row),
			payoutId: "",
			payoutFileName: "",
			...resetPaid ? {
				status: "未报销",
				payoutDate: "",
				reimbursedAt: ""
			} : {}
		})),
		...groups.length === 1 ? { groupId: groups[0] } : {}
	};
}
function stable(value) {
	if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
	if (value && typeof value === "object") return `{${Object.entries(value).filter(([, v]) => v !== void 0).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
	return JSON.stringify(value) ?? "null";
}
function expenseBatchMatches(all, before, groupId) {
	if (!before.length || before.some((row) => !row.id) || new Set(before.map((row) => row.id)).size !== before.length) return false;
	const current = /* @__PURE__ */ new Map();
	for (const row of all) {
		if (current.has(row.id)) return false;
		current.set(row.id, row);
	}
	if (before.some((row) => !current.has(row.id) || stable(current.get(row.id)) !== stable(row))) return false;
	const groups = new Set(before.map((row) => row.payoutId).filter(Boolean));
	if (groupId) groups.add(groupId);
	for (const id of groups) {
		const expected = new Set(before.filter((row) => row.payoutId === id).map((row) => row.id));
		const actual = all.filter((row) => row.payoutId === id);
		if (actual.length !== expected.size || actual.some((row) => !expected.has(row.id))) return false;
	}
	return true;
}
var PAYOUT_FIELDS = new Set([
	"claimant",
	"forWhom",
	"payBank",
	"payCardNo",
	"payAccount",
	"payoutId",
	"payoutFileName",
	"payoutMethod",
	"payoutDate",
	"reimbursedAt",
	"status"
]);
function canApplyExpenseBatch(all, before, after, groupId) {
	if (!expenseBatchMatches(all, before, groupId) || before.length !== after.length) return false;
	const originals = new Map(before.map((row) => [row.id, row]));
	const selected = new Set(before.map((row) => row.id));
	const otherGroups = new Set(all.filter((row) => !selected.has(row.id)).map((row) => row.payoutId).filter(Boolean));
	if (new Set(after.map((row) => row.id)).size !== after.length) return false;
	return after.every((row) => {
		const original = originals.get(row.id);
		if (!original || row.status !== "已报销" && row.status !== "未报销") return false;
		const withoutPayout = (value) => Object.fromEntries(Object.entries(value).filter(([field]) => !PAYOUT_FIELDS.has(field)));
		if (stable(withoutPayout(original)) !== stable(withoutPayout(row))) return false;
		return !row.payoutId || !otherGroups.has(row.payoutId);
	});
}
var numIn = (v, what) => numOrWarn(v, 0, what);
function emptyState() {
	const year = 2026;
	return {
		schemaVersion: 3,
		year,
		years: [year],
		teams: [],
		people: [],
		attendance: [],
		attendanceDocs: [],
		payments: [],
		contracts: [],
		contractEntries: [],
		expenses: [],
		insurancePolicies: [],
		insuranceMembers: [],
		accessHash: "",
		uiStyle: "classic"
	};
}
function person(partial) {
	const parsed = parseIdCard(partial.idCard || "");
	return {
		id: uid(),
		name: partial.name,
		team: partial.team || "",
		personNo: partial.personNo || "",
		idCard: partial.idCard || "",
		gender: parsed.gender || partial.gender || "",
		age: parsed.age,
		birthday: parsed.birthday || "",
		phone: partial.phone || "",
		dailyWage: partial.dailyWage || 0,
		monthWage: partial.monthWage || 0,
		payType: partial.payType === "month" ? "month" : "day",
		otRule: partial.otRule || "",
		mealAllowance: partial.mealAllowance || 0,
		wageHistory: [],
		bank: partial.bank || "",
		cardNo: partial.cardNo || "",
		address: partial.address || "",
		idIssuer: partial.idIssuer || "",
		idValidFrom: normalizeIdDate(partial.idValidFrom),
		idValidTo: normalizeIdDate(partial.idValidTo, true),
		remark: partial.remark || "示例人员，可删"
	};
}
function att(year, month, name, team, days, otHours, allowance = 0, deduction = 0) {
	return {
		id: uid(),
		year,
		month,
		name,
		team,
		days,
		otHours,
		allowance,
		deduction,
		remark: ""
	};
}
function pay(owner, receiver, date, amount, source, remark) {
	return {
		id: uid(),
		owner,
		receiver,
		date,
		amount,
		source,
		remark
	};
}
function demoState() {
	const people = [person({
		name: "张三",
		team: "一班",
		personNo: "DEMO001",
		idCard: "110101199001011210",
		phone: "13800001234",
		dailyWage: 280,
		otRule: "按小时:25",
		bank: "中国工商银行北京分行",
		cardNo: "6222021234567890123",
		address: "北京市东城区示例路1号",
		remark: "虚构示例，可删"
	}), person({
		name: "李四",
		team: "二班",
		personNo: "DEMO002",
		idCard: "320106198506154512",
		phone: "13900005678",
		dailyWage: 260,
		otRule: "折算:8",
		bank: "中国农业银行上海分行",
		cardNo: "6228481234567890123",
		address: "上海市浦东新区示例路8号",
		remark: "虚构示例，可删"
	})];
	const attendance = [
		att(2026, 3, "张三", "一班", 26, 12, 200, 0),
		att(2026, 3, "李四", "二班", 22, 8, 0, 50),
		att(2026, 4, "张三", "一班", 24, 8, 150, 0),
		att(2026, 4, "李四", "二班", 20, 4, 0, 0),
		att(2026, 7, "张三", "一班", 27, 14.5, 300, 80),
		att(2026, 7, "李四", "二班", 27, 10, 0, 100)
	];
	const payments = [
		pay("张三", "张三", "2026-04-28", 1e4, "示例工程4月请款", "本人"),
		pay("李四", "张三", "2026-04-28", 8e3, "示例工程4月请款", "张三代收"),
		pay("张三", "张三", "2026-07-21", 5e3, "示例工程7月请款", "本人"),
		pay("李四", "李四", "2026-07-21", 5e3, "示例工程7月请款", "本人")
	];
	const contracts = [{
		id: "c-demo-a",
		year: 2026,
		code: "DEMO-A-2026",
		name: "示例住宅A区",
		contractor: "示例建设集团",
		subcontractor: "示例劳务公司",
		contractAmount: 12e5,
		taxRate: 9,
		reportTaxMode: "excl",
		payRatio: 80,
		warrantyStart: "",
		warrantyEnd: "",
		hasDeposit: true,
		depositAmount: 5e4,
		manager: "王经营",
		status: "在建",
		prelimAmount: 0,
		settleReceivable: 0,
		remark: "虚构示例，可删"
	}, {
		id: "c-demo-b",
		year: 2026,
		code: "DEMO-B-2026",
		name: "示例市政道路",
		contractor: "示例建设集团",
		subcontractor: "示例市政公司",
		contractAmount: 8e5,
		taxRate: 9,
		reportTaxMode: "incl",
		payRatio: 85,
		warrantyStart: "2026-06-01",
		warrantyEnd: "2028-05-31",
		hasDeposit: false,
		depositAmount: 0,
		manager: "李经营",
		status: "分包结算",
		prelimAmount: 78e4,
		settleReceivable: 12e4,
		remark: "虚构示例，可删"
	}];
	const contractEntries = [
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "report",
			date: "2026-03-31",
			amount: 18e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "2026-03",
			remark: "3月报量",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "report",
			date: "2026-04-30",
			amount: 16e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "2026-04",
			remark: "4月报量",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "invoice",
			date: "2026-04-12",
			amount: 2e5,
			amountExcl: 183486.24,
			taxRate: 9,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "1100000001",
			remark: "",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "receipt",
			date: "2026-04-15",
			amount: 8e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "worker",
			no: "",
			remark: "总包代付农民工",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "receipt",
			date: "2026-04-28",
			amount: 7e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "sub",
			no: "",
			remark: "到分包公司",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "report",
			date: "2026-02-28",
			amount: 8e5,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "完工报量",
			remark: "",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "invoice",
			date: "2026-03-05",
			amount: 8e5,
			amountExcl: 733944.95,
			taxRate: 9,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "1100000002",
			remark: "",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "receipt",
			date: "2026-03-10",
			amount: 2e5,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "worker",
			no: "",
			remark: "总包代付农民工",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "receipt",
			date: "2026-03-25",
			amount: 48e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "sub",
			no: "",
			remark: "到分包公司",
			fileName: "",
			workerFileName: ""
		}
	];
	const year = 2026;
	return {
		year,
		years: derivedYears({
			year,
			years: [year],
			attendance
		}),
		teams: [{
			id: uid(),
			name: "一班"
		}, {
			id: uid(),
			name: "二班"
		}],
		people,
		attendance,
		attendanceDocs: [],
		payments,
		contracts,
		contractEntries,
		expenses: [],
		insurancePolicies: [],
		insuranceMembers: [],
		accessHash: "",
		uiStyle: "classic"
	};
}
var emptyStorage = {
	getItem: () => null,
	setItem: () => {},
	removeItem: () => {}
};
const useApp = create()(persist((set, get) => ({
	...emptyState(),
	resetToSeed: () => {
		set({
			...demoState(),
			accessHash: get().accessHash
		});
		logOp("恢复示例数据", "", "设置");
	},
	clearAll: () => {
		set({
			...emptyState(),
			accessHash: get().accessHash
		});
		logOp("清空全部数据", "", "设置");
	},
	setYear: (year) => {
		runMuted(() => set({
			year,
			years: derivedYears({
				...get(),
				year
			})
		}));
	},
	addYear: (y) => {
		const existing = derivedYears(get());
		const next = y && y >= 2e3 && y <= 2100 ? Math.round(y) : nextYear(existing);
		set({
			years: existing.includes(next) ? existing : [...existing, next].sort((a, b) => a - b),
			year: next
		});
		logOp("新增年度", String(next), "设置");
		return next;
	},
	removeYear: (y) => {
		const restYears = (get().years || []).filter((x) => x !== y);
		const attendance = get().attendance.filter((a) => a.year !== y);
		if (!restYears.length && !attendance.length) return;
		const fallback = restYears.length > 0 ? restYears[restYears.length - 1] : attendance[0]?.year || (/* @__PURE__ */ new Date()).getFullYear();
		const years = derivedYears({
			...get(),
			attendance,
			years: restYears,
			year: fallback
		}).filter((x) => x !== y);
		set({
			years: years.length ? years : [fallback],
			attendance,
			year: get().year === y ? fallback : get().year
		});
		logOp("删除年度", String(y), "设置");
	},
	upsertPerson: (p) => {
		const people = get().people;
		const nextP = {
			...p,
			name: nameKey(p.name),
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		};
		const pid = nextP.id?.trim();
		const i = pid ? people.findIndex((x) => x.id === pid) : -1;
		if (i >= 0) {
			const plan = planRenamePerson({
				people,
				attendance: get().attendance,
				payments: get().payments,
				insuranceMembers: get().insuranceMembers || [],
				expenses: get().expenses || []
			}, people[i].id, nextP.name);
			if (!plan.ok) {
				console.warn("[store] 改名被拒绝：", plan.error);
				return;
			}
			const next = people.slice();
			next[i] = {
				...nextP,
				id: people[i].id,
				name: plan.newName
			};
			set({
				people: next,
				attendance: plan.attendance,
				payments: plan.payments,
				insuranceMembers: plan.insuranceMembers,
				expenses: plan.expenses
			});
			const fieldDiffs = personChanges(people[i], next[i]).filter((c) => c.label !== "姓名" || plan.oldName === plan.newName);
			logOp(plan.oldName === plan.newName ? "修改人员" : "人员改名", plan.oldName === plan.newName ? diffDetail(nextP.name, fieldDiffs) : diffDetail(renameLogDetail(plan), fieldDiffs), "人员");
		} else {
			set({ people: [...people, {
				...nextP,
				id: pid || uid()
			}] });
			logOp("新增人员", nextP.name, "人员");
		}
	},
	renamePerson: (id, name) => {
		const plan = planRenamePerson({
			people: get().people,
			attendance: get().attendance,
			payments: get().payments,
			insuranceMembers: get().insuranceMembers || [],
			expenses: get().expenses || []
		}, id, name);
		if (!plan.ok) return {
			ok: false,
			error: plan.error
		};
		if (plan.oldName !== plan.newName) {
			set({
				people: applyRenameToPeople(get().people, id, plan.newName),
				attendance: plan.attendance,
				payments: plan.payments,
				insuranceMembers: plan.insuranceMembers,
				expenses: plan.expenses
			});
			logOp("人员改名", renameLogDetail(plan), "人员");
		}
		return {
			ok: true,
			counts: plan.counts
		};
	},
	addPerson: (p) => {
		set({ people: [...get().people, {
			...p,
			name: nameKey(p.name),
			id: uid(),
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		}] });
		logOp("新增人员", nameKey(p.name), "人员");
	},
	removePeople: (ids) => {
		const rows = get().people.filter((p) => ids.includes(p.id));
		set({ people: get().people.filter((p) => !ids.includes(p.id)) });
		logOp("删除人员", diffDetail(`${rows.length}人`, personDeletedChanges(rows)), "人员");
	},
	replacePeople: (people) => {
		set({ people: people.map((p) => ({
			...p,
			name: nameKey(p.name),
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		})) });
		logOp("导入/替换人员", `${people.length}人`, "人员");
	},
	saveAttendanceMonth: (year, month, rows) => {
		const before = get().attendance.filter((r) => r.year === year && r.month === month);
		const rest = get().attendance.filter((r) => !(r.year === year && r.month === month));
		const next = rows.filter((r) => (r.name || "").trim()).map((r) => ({
			...r,
			name: nameKey(r.name),
			allowance: numIn(r.allowance, "考勤.补助"),
			deduction: numIn(r.deduction, "考勤.扣款"),
			id: uid(),
			year,
			month
		}));
		const attendance = [...rest, ...next];
		set({
			attendance,
			years: derivedYears({
				...get(),
				attendance,
				year
			})
		});
		logOp("保存月考勤", diffDetail(`${year}年${month}月 ${next.length}人`, attendanceChanges(before, next)), "考勤");
	},
	replaceAttendance: (attendance) => {
		const next = attendance.map((r) => ({
			...r,
			name: nameKey(r.name)
		}));
		set({
			attendance: next,
			years: derivedYears({
				...get(),
				attendance: next
			})
		});
		logOp("导入/替换考勤", `${attendance.length}条`, "考勤");
	},
	addAttendanceDoc: (d) => set({ attendanceDocs: [...get().attendanceDocs || [], {
		...d,
		id: d.id || uid(),
		fileName: d.fileName || "",
		remark: d.remark || ""
	}] }),
	patchAttendanceDoc: (id, patch) => set({ attendanceDocs: (get().attendanceDocs || []).map((d) => d.id === id ? {
		...d,
		...patch
	} : d) }),
	removeAttendanceDocs: (ids) => set({ attendanceDocs: (get().attendanceDocs || []).filter((d) => !ids.includes(d.id)) }),
	addPayment: (p) => {
		set({ payments: [...get().payments, {
			...p,
			id: uid()
		}] });
		logOp("新增发放", `${p.owner} ${p.amount}`, "发放");
	},
	addPayments: (rows) => {
		const list = (rows || []).filter((r) => r && (r.owner || "").trim());
		if (!list.length) return 0;
		const next = list.map((r) => ({
			...r,
			id: r.id || uid()
		}));
		set({ payments: [...get().payments, ...next] });
		const total = next.reduce((s, r) => s + (Number(r.amount) || 0), 0);
		logOp("批量生成待发放", diffDetail(`${next.length} 笔`, [
			{
				label: "笔数",
				before: "0",
				after: String(next.length)
			},
			{
				label: "待发放合计",
				before: "0.00",
				after: fmtMoney(total)
			},
			{
				label: "名单",
				before: "（无）",
				after: next.map((r) => `${r.owner} ¥${fmtMoney(r.amount)}`).join("、")
			}
		]), "发放");
		return next.length;
	},
	patchPayments: (ids, patch) => {
		const idset = new Set(ids);
		const pairs = get().payments.filter((p) => idset.has(p.id)).map((p) => ({
			before: p,
			after: {
				...p,
				...patch,
				id: p.id
			}
		}));
		set({ payments: get().payments.map((p) => idset.has(p.id) ? {
			...p,
			...patch,
			id: p.id
		} : p) });
		logOp("修改发放", diffDetail(`${ids.length}条`, batchChanges(pairs, paymentChanges, (p) => nameKey(p.owner))), "发放");
	},
	replacePayments: (payments, detail) => {
		set({ payments });
		logOp("导入/替换发放", detail || `${payments.length}条`, "发放");
	},
	removePayment: (id) => {
		const p = get().payments.find((x) => x.id === id);
		set({ payments: get().payments.filter((x) => x.id !== id) });
		logOp("删除发放", p ? diffDetail("1条", paymentDeletedChanges([p])) : id, "发放");
	},
	removePayments: (ids) => {
		const rows = get().payments.filter((p) => ids.includes(p.id));
		set({ payments: get().payments.filter((p) => !ids.includes(p.id)) });
		logOp("删除发放", diffDetail(`${ids.length}条`, paymentDeletedChanges(rows)), "发放");
	},
	upsertContract: (c) => {
		const list = get().contracts;
		const i = list.findIndex((x) => x.id === c.id || c.code && x.code === c.code && x.year === c.year && x.name === c.name);
		if (i >= 0) {
			const next = list.slice();
			next[i] = {
				...c,
				id: list[i].id
			};
			set({ contracts: next });
			logOp("修改合同", diffDetail(c.name, contractChanges(list[i], next[i])), "合同");
		} else {
			set({ contracts: [...list, {
				...c,
				id: c.id || uid()
			}] });
			logOp("新增合同", c.name, "合同");
		}
	},
	removeContracts: (ids) => {
		set({
			contracts: get().contracts.filter((c) => !ids.includes(c.id)),
			contractEntries: get().contractEntries.filter((e) => !ids.includes(e.contractId))
		});
		logOp("删除合同", `${ids.length}份`, "合同");
	},
	addContractEntry: (e) => {
		const entry = normalizeEntry(e);
		set({ contractEntries: [...get().contractEntries, entry] });
		logOp("新增合同明细", `${entry.kind} ${entry.amount}`, "合同");
	},
	updateContractEntry: (row) => {
		const entry = normalizeEntry(row);
		const before = get().contractEntries.find((e) => e.id === entry.id);
		set({ contractEntries: get().contractEntries.map((e) => e.id === entry.id ? entry : e) });
		logOp("修改合同明细", diffDetail(`${entry.kind} ${fmtMoney(entry.amount)}`, before ? entryChanges(before, entry) : []), "合同");
	},
	patchContractEntry: (id, patch) => {
		const before = get().contractEntries.find((e) => e.id === id);
		const after = before ? {
			...before,
			...patch
		} : void 0;
		set({ contractEntries: get().contractEntries.map((e) => e.id === id ? {
			...e,
			...patch
		} : e) });
		logOp("修改合同明细", diffDetail(id, before && after ? entryChanges(before, after) : []), "合同");
	},
	removeContractEntries: (ids) => {
		set({ contractEntries: get().contractEntries.filter((e) => !ids.includes(e.id)) });
		logOp("删除合同明细", `${ids.length}条`, "合同");
	},
	replaceContracts: (contracts, entries) => {
		const keepIds = new Set(contracts.map((c) => c.id));
		const nextEntries = (entries ?? get().contractEntries).filter((e) => keepIds.has(e.contractId));
		set({
			contracts,
			contractEntries: nextEntries
		});
		logOp("导入/替换合同", `${contracts.length}份 / ${nextEntries.length}条明细`, "合同");
	},
	upsertExpense: (row) => {
		const list = get().expenses || [];
		const i = list.findIndex((x) => x.id === row.id);
		const next = {
			...row,
			id: row.id || uid(),
			qty: numIn(row.qty, "报销.数量"),
			price: numIn(row.price, "报销.单价"),
			amount: numIn(row.amount, "报销.金额"),
			status: row.status === "已报销" ? "已报销" : "未报销",
			payMethod: row.payMethod || "现金",
			voucherId: row.voucherId || "",
			voucherFileName: row.voucherFileName || "",
			claimant: row.claimant || "",
			forWhom: row.forWhom || "",
			payBank: row.payBank || "",
			payCardNo: row.payCardNo || "",
			payAccount: [row.payBank, row.payCardNo].map((s) => (s || "").trim()).filter(Boolean).join(" ") || row.payAccount || "",
			payoutId: row.payoutId || "",
			payoutFileName: row.payoutFileName || "",
			payoutDate: row.status === "已报销" ? row.payoutDate || "" : "",
			payoutMethod: row.payoutMethod || "",
			reimbursedAt: row.status === "已报销" ? row.reimbursedAt || row.payoutDate || localToday() : ""
		};
		if (i >= 0) {
			const copy = list.slice();
			copy[i] = next;
			set({ expenses: copy });
			logOp("修改报销", diffDetail(next.name, expenseChanges(list[i], next)), "报销");
		} else {
			set({ expenses: [...list, next] });
			logOp("新增报销", next.name, "报销");
		}
	},
	applyExpenseBatch: (before, after, groupId) => {
		const list = get().expenses || [];
		if (!canApplyExpenseBatch(list, before, after, groupId)) return false;
		const next = new Map(after.map((row) => [row.id, { ...row }]));
		const changes = batchChanges(before.map((row) => ({
			before: row,
			after: next.get(row.id)
		})), expenseChanges, (row) => row.name || row.id);
		set({ expenses: list.map((row) => next.get(row.id) || row) });
		logOp("批量修改报销收款", diffDetail(`${after.length}笔`, changes), "报销");
		return true;
	},
	removeExpenses: (ids) => {
		const rows = (get().expenses || []).filter((e) => ids.includes(e.id));
		set({ expenses: (get().expenses || []).filter((e) => !ids.includes(e.id)) });
		logOp("删除报销", diffDetail(`${rows.length}笔`, expenseDeletedChanges(rows)), "报销");
	},
	replaceExpenses: (expenses) => {
		set({ expenses });
		logOp("导入/替换报销", `${expenses.length}笔`, "报销");
	},
	upsertPolicy: (p) => {
		const list = get().insurancePolicies || [];
		const next = {
			...p,
			id: p.id || uid(),
			policyNo: (p.policyNo || "").trim(),
			buyer: p.buyer || "",
			name: p.name || "",
			company: p.company || "",
			premiumPerPerson: numIn(p.premiumPerPerson, "保单.每人保费"),
			headcount: numIn(p.headcount, "保单.人数"),
			coverage: numIn(p.coverage, "保单.保额"),
			periodStart: p.periodStart || "",
			periodEnd: p.periodEnd || "",
			linkedPolicyId: p.linkedPolicyId || "",
			contracts: Array.isArray(p.contracts) ? p.contracts : [],
			remark: p.remark || ""
		};
		let i = list.findIndex((x) => x.id === p.id);
		if (i < 0) i = list.findIndex((x) => x.policyNo && x.policyNo === next.policyNo);
		if (i >= 0) {
			const copy = list.slice();
			copy[i] = {
				...next,
				id: list[i].id
			};
			set({ insurancePolicies: copy });
			logOp("修改保单", next.policyNo, "团体保险");
		} else {
			set({ insurancePolicies: [...list, next] });
			logOp("新增保单", next.policyNo, "团体保险");
		}
	},
	removePolicies: (ids) => {
		const deleted = new Set(ids);
		set({
			insurancePolicies: (get().insurancePolicies || []).filter((p) => !deleted.has(p.id)).map((p) => deleted.has(p.linkedPolicyId) ? {
				...p,
				linkedPolicyId: ""
			} : p),
			insuranceMembers: (get().insuranceMembers || []).filter((m) => !deleted.has(m.policyId))
		});
		logOp("删除保单", `${ids.length}份`, "团体保险");
	},
	upsertMember: (m) => {
		const list = get().insuranceMembers || [];
		const i = list.findIndex((x) => x.id === m.id);
		const next = {
			...m,
			id: m.id || uid(),
			name: (m.name || "").trim(),
			policyId: m.policyId || "",
			leader: m.leader || "",
			startDate: m.startDate || "",
			endDate: m.endDate || "",
			remark: m.remark || ""
		};
		if (i >= 0) {
			const copy = list.slice();
			copy[i] = {
				...next,
				id: list[i].id
			};
			set({ insuranceMembers: copy });
			logOp("修改被保人", next.name, "团体保险");
		} else {
			set({ insuranceMembers: [...list, next] });
			logOp("新增被保人", next.name, "团体保险");
		}
	},
	removeMembers: (ids) => {
		set({ insuranceMembers: (get().insuranceMembers || []).filter((m) => !ids.includes(m.id)) });
		logOp("删除被保人", `${ids.length}人`, "团体保险");
	},
	replaceMembers: (members) => {
		set({ insuranceMembers: members });
		logOp("导入被保人", `${members.length}人`, "团体保险");
	},
	setInsuranceMembers: (members) => set({ insuranceMembers: members }),
	setAccessHash: (accessHash) => set({ accessHash }),
	setUiStyle: (uiStyle) => runMuted(() => set({ uiStyle })),
	addTeam: (raw) => {
		const error = teamNameError(raw, get().teams, get().people);
		if (error) return {
			ok: false,
			error
		};
		const team = {
			id: uid(),
			name: raw.trim()
		};
		set({ teams: [...get().teams, team] });
		logOp("新增班组", team.name, "人员");
		return {
			ok: true,
			team
		};
	},
	importTeams: (incoming) => {
		const merged = mergeTeams(get().teams, incoming);
		if (merged.added) {
			set({ teams: merged.teams });
			logOp("导入班组", `${merged.added}个班组`, "人员");
		}
		return merged.added;
	},
	setAll: (s) => set({
		...s,
		schemaVersion: 3,
		teams: s.teams || [],
		years: derivedYears(s)
	})
}), {
	name: "gongdi-ledger-v5",
	version: 11,
	skipHydration: true,
	storage: createJSONStorage(() => typeof window === "undefined" ? emptyStorage : localStorage),
	migrate: (persisted, _version) => {
		const s = persisted;
		const attendance = (s.attendance || []).map((a) => ({
			...a,
			allowance: numIn(a.allowance, "旧数据.考勤补助"),
			deduction: numIn(a.deduction, "旧数据.考勤扣款")
		}));
		const contracts = (s.contracts || []).map((c) => ({
			...c,
			reportTaxMode: c.reportTaxMode === "incl" ? "incl" : "excl"
		}));
		const contractEntries = splitLegacyReceipts((s.contractEntries || []).map((e) => ({
			...e,
			amountExcl: numIn(e.amountExcl, "旧数据.合同不含税金额"),
			taxRate: numIn(e.taxRate, "旧数据.合同税率"),
			workerPay: numIn(e.workerPay, "旧数据.合同代付金额"),
			workerPayDate: e.workerPayDate || "",
			payTo: e.payTo === "worker" || e.payTo === "sub" ? e.payTo : "",
			fileName: e.fileName || "",
			workerFileName: e.workerFileName || ""
		})));
		const attendanceDocs = s.attendanceDocs || [];
		const people = (s.people || []).map((p) => ({
			...p,
			payType: p.payType === "month" ? "month" : "day",
			monthWage: numIn(p.monthWage, "旧数据.月工资"),
			dailyWage: numIn(p.dailyWage, "旧数据.日工资")
		}));
		return {
			...s,
			schemaVersion: 3,
			teams: s.teams || [],
			people,
			attendance,
			contracts,
			contractEntries,
			attendanceDocs,
			expenses: s.expenses || [],
			insurancePolicies: s.insurancePolicies || [],
			insuranceMembers: s.insuranceMembers || [],
			years: derivedYears({
				...s,
				attendance,
				years: s.years || []
			}),
			accessHash: s.accessHash || "",
			uiStyle: s.uiStyle === "v2" || s.uiStyle === "apple" || s.uiStyle === "movie" ? s.uiStyle : "classic"
		};
	},
	partialize: (s) => ({
		schemaVersion: 3,
		year: s.year,
		years: s.years,
		teams: s.teams,
		people: s.people,
		attendance: s.attendance,
		attendanceDocs: s.attendanceDocs || [],
		payments: s.payments,
		contracts: s.contracts || [],
		contractEntries: s.contractEntries || [],
		expenses: s.expenses || [],
		insurancePolicies: s.insurancePolicies || [],
		insuranceMembers: s.insuranceMembers || [],
		accessHash: s.accessHash || "",
		uiStyle: s.uiStyle === "v2" || s.uiStyle === "apple" || s.uiStyle === "movie" ? s.uiStyle : "classic"
	})
}));
export { expensePayoutDraft as a, PAY_METHODS as c, LEDGER_SCHEMA_VERSION as d, runMuted as f, expensePayoutBatches as i, expenseFormFromDraft as l, useApp as n, planDissolveExpensePayout as o, syncMuted as p, expenseBatchMatches as r, planExpensePayout as s, emptyState as t, needsVoucher as u };
