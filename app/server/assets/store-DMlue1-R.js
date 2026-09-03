import { F as require_react, V as __toESM } from "../server.js";
import { o as uid } from "./utils-DPLvt0U2.js";
import { a as normalizeEntry, c as normalizeIdDate, h as nextYear, o as splitLegacyReceipts, p as derivedYears, u as parseIdCard } from "./contracts-F5LpCrrH.js";
import { n as logOp } from "./audit-OJ0X-zkq.js";
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
function emptyState() {
	const year = 2026;
	return {
		year,
		years: [year],
		people: [],
		attendance: [],
		attendanceDocs: [],
		payments: [],
		contracts: [],
		contractEntries: [],
		expenses: [],
		accessHash: ""
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
		people,
		attendance,
		attendanceDocs: [],
		payments,
		contracts,
		contractEntries,
		expenses: [],
		accessHash: ""
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
		set({
			year,
			years: derivedYears({
				...get(),
				year
			})
		});
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
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		};
		const i = people.findIndex((x) => x.id === nextP.id || x.name === nextP.name);
		if (i >= 0) {
			const next = people.slice();
			next[i] = {
				...nextP,
				id: people[i].id
			};
			set({ people: next });
			logOp("修改人员", nextP.name, "人员");
		} else {
			set({ people: [...people, {
				...nextP,
				id: nextP.id || uid()
			}] });
			logOp("新增人员", nextP.name, "人员");
		}
	},
	addPerson: (p) => {
		set({ people: [...get().people, {
			...p,
			id: uid(),
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		}] });
		logOp("新增人员", p.name, "人员");
	},
	removePeople: (ids) => {
		const names = get().people.filter((p) => ids.includes(p.id)).map((p) => p.name).join("、");
		set({ people: get().people.filter((p) => !ids.includes(p.id)) });
		logOp("删除人员", names || `${ids.length}人`, "人员");
	},
	replacePeople: (people) => {
		set({ people: people.map((p) => ({
			...p,
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		})) });
		logOp("导入/替换人员", `${people.length}人`, "人员");
	},
	saveAttendanceMonth: (year, month, rows) => {
		const rest = get().attendance.filter((r) => !(r.year === year && r.month === month));
		const next = rows.filter((r) => (r.name || "").trim()).map((r) => ({
			...r,
			allowance: Number(r.allowance) || 0,
			deduction: Number(r.deduction) || 0,
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
		logOp("保存月考勤", `${year}年${month}月 ${next.length}人`, "考勤");
	},
	replaceAttendance: (attendance) => {
		set({
			attendance,
			years: derivedYears({
				...get(),
				attendance
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
	patchPayments: (ids, patch) => {
		const idset = new Set(ids);
		set({ payments: get().payments.map((p) => idset.has(p.id) ? {
			...p,
			...patch,
			id: p.id
		} : p) });
		logOp("修改发放", `${ids.length}条`, "发放");
	},
	replacePayments: (payments) => {
		set({ payments });
		logOp("导入/替换发放", `${payments.length}条`, "发放");
	},
	removePayment: (id) => set({ payments: get().payments.filter((p) => p.id !== id) }),
	removePayments: (ids) => {
		set({ payments: get().payments.filter((p) => !ids.includes(p.id)) });
		logOp("删除发放", `${ids.length}条`, "发放");
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
			logOp("修改合同", c.name, "合同");
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
	addContractEntry: (e) => set({ contractEntries: [...get().contractEntries, normalizeEntry(e)] }),
	patchContractEntry: (id, patch) => set({ contractEntries: get().contractEntries.map((e) => e.id === id ? {
		...e,
		...patch
	} : e) }),
	removeContractEntries: (ids) => set({ contractEntries: get().contractEntries.filter((e) => !ids.includes(e.id)) }),
	replaceContracts: (contracts, entries) => set({
		contracts,
		contractEntries: entries ?? get().contractEntries
	}),
	upsertExpense: (row) => {
		const list = get().expenses || [];
		const i = list.findIndex((x) => x.id === row.id);
		const next = {
			...row,
			id: row.id || uid(),
			qty: Number(row.qty) || 0,
			price: Number(row.price) || 0,
			amount: Number(row.amount) || 0,
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
			reimbursedAt: row.status === "已报销" ? row.reimbursedAt || row.payoutDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) : ""
		};
		if (i >= 0) {
			const copy = list.slice();
			copy[i] = next;
			set({ expenses: copy });
			logOp("修改报销", next.name, "报销");
		} else {
			set({ expenses: [...list, next] });
			logOp("新增报销", next.name, "报销");
		}
	},
	removeExpenses: (ids) => {
		set({ expenses: (get().expenses || []).filter((e) => !ids.includes(e.id)) });
		logOp("删除报销", `${ids.length}笔`, "报销");
	},
	replaceExpenses: (expenses) => set({ expenses }),
	setAccessHash: (accessHash) => set({ accessHash }),
	setAll: (s) => set({
		...s,
		years: derivedYears(s)
	})
}), {
	name: "gongdi-ledger-v5",
	version: 10,
	skipHydration: true,
	storage: createJSONStorage(() => typeof window === "undefined" ? emptyStorage : localStorage),
	migrate: (persisted, _version) => {
		const s = persisted;
		const attendance = (s.attendance || []).map((a) => ({
			...a,
			allowance: Number(a.allowance) || 0,
			deduction: Number(a.deduction) || 0
		}));
		const contracts = (s.contracts || []).map((c) => ({
			...c,
			reportTaxMode: c.reportTaxMode === "incl" ? "incl" : "excl"
		}));
		const contractEntries = splitLegacyReceipts((s.contractEntries || []).map((e) => ({
			...e,
			amountExcl: Number(e.amountExcl) || 0,
			taxRate: Number(e.taxRate) || 0,
			workerPay: Number(e.workerPay) || 0,
			workerPayDate: e.workerPayDate || "",
			payTo: e.payTo === "worker" || e.payTo === "sub" ? e.payTo : "",
			fileName: e.fileName || "",
			workerFileName: e.workerFileName || ""
		})));
		const attendanceDocs = s.attendanceDocs || [];
		const people = (s.people || []).map((p) => ({
			...p,
			payType: p.payType === "month" ? "month" : "day",
			monthWage: Number(p.monthWage) || 0,
			dailyWage: Number(p.dailyWage) || 0
		}));
		return {
			...s,
			people,
			attendance,
			contracts,
			contractEntries,
			attendanceDocs,
			expenses: s.expenses || [],
			years: derivedYears({
				...s,
				attendance,
				years: s.years || []
			}),
			accessHash: s.accessHash || ""
		};
	},
	partialize: (s) => ({
		year: s.year,
		years: s.years,
		people: s.people,
		attendance: s.attendance,
		attendanceDocs: s.attendanceDocs || [],
		payments: s.payments,
		contracts: s.contracts || [],
		contractEntries: s.contractEntries || [],
		expenses: s.expenses || [],
		accessHash: s.accessHash || ""
	})
}));
export { useApp as t };
