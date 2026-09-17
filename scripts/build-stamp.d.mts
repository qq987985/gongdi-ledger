/** `scripts/build-stamp.mjs` 的类型声明（纯 JS 模块，为了能被 CI 脚本与测试直接跑）。 */

export const STAMP_FILE: string;
export const BUILD_INPUTS: readonly string[];

export function buildInputFiles(root?: string): string[];
export function buildInputDigest(root?: string): string;
export function stampContent(root?: string): string;
export function parseStamp(raw: unknown): string;
export function verifyStamp(root?: string): { ok: boolean; digest: string; recorded: string; reason: string };
