/**
 * 应用名与导航声明：NAV（侧栏/菜单）、TABS（移动端底栏）。新增页面先在这里登记。
 */
import {
  Banknote,
  CalendarDays,
  Camera,
  ClipboardList,
  Download,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
export const APP_NAME = "台账";

export const NAV = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/people", label: "人员", icon: Users },
  { to: "/attendance", label: "月度考勤", icon: CalendarDays },
  { to: "/payments", label: "发放记录", icon: Banknote },
  { to: "/contracts", label: "合同管理", icon: FileText },
  { to: "/expenses", label: "报销单", icon: FileText },
  { to: "/insurance", label: "团体保险", icon: ShieldCheck },
  { to: "/photos", label: "照片", icon: Camera },
  { to: "/files", label: "影像资料", icon: FolderOpen },
  { to: "/query", label: "个人查询", icon: ClipboardList },
  { to: "/audit", label: "操作记录", icon: History },
  { to: "/import", label: "导入", icon: Upload },
  { to: "/export", label: "导出", icon: Download },
  { to: "/settings", label: "设置", icon: Settings },
];

export const TABS = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/attendance", label: "考勤", icon: CalendarDays },
  { to: "/contracts", label: "合同", icon: FileText },
  { to: "/expenses", label: "报销", icon: FileText },
  { to: "/query", label: "查询", icon: ClipboardList },
];
