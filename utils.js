import { createHash, randomUUID } from 'node:crypto';
export function createId(prefix = 'id') {
    return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}
export function getPathValue(input, path) {
    return path.split('.').reduce((current, part) => {
        if (current && typeof current === 'object' && part in current) {
            return current[part];
        }
        return undefined;
    }, input);
}
export function stableStringify(value) {
    return JSON.stringify(sortJson(value));
}
function sortJson(value) {
    if (Array.isArray(value)) {
        return value.map(sortJson);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
            acc[key] = sortJson(value[key]);
            return acc;
        }, {});
    }
    return value;
}
export function hashString(value) {
    return createHash('sha256').update(value).digest('hex');
}
export function computeFingerprint(input) {
    return hashString(stableStringify(input));
}
export function nowIso(date = new Date()) {
    return date.toISOString();
}
export function addMilliseconds(date, ms) {
    return new Date(date.getTime() + ms);
}
export function maxSeverity(a, b) {
    const ranking = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
    };
    return ranking[a] >= ranking[b] ? a : b;
}
export function jsonClone(value) {
    return JSON.parse(JSON.stringify(value));
}
