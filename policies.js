export function policy(input) {
    return input;
}
export function all(...conditions) {
    return async (context) => {
        for (const condition of conditions) {
            if (!(await condition(context))) {
                return false;
            }
        }
        return true;
    };
}
export function any(...conditions) {
    return async (context) => {
        for (const condition of conditions) {
            if (await condition(context)) {
                return true;
            }
        }
        return false;
    };
}
export function not(condition) {
    return async (context) => !(await condition(context));
}
export function eq(path, expected) {
    return (context) => context.value(path) === expected;
}
export function includes(path, expected) {
    return (context) => {
        const value = context.value(path);
        return Array.isArray(value) && value.includes(expected);
    };
}
export function numberAbove(path, minimumExclusive) {
    return (context) => {
        const value = context.value(path);
        return typeof value === 'number' && value > minimumExclusive;
    };
}
export function numberBelow(path, maximumExclusive) {
    return (context) => {
        const value = context.value(path);
        return typeof value === 'number' && value < maximumExclusive;
    };
}
export function truthy(path) {
    return (context) => Boolean(context.value(path));
}
export function actionIs(action) {
    return (context) => context.request.action === action;
}
export function actorTypeIs(type) {
    return (context) => context.request.actor.type === type;
}
export function providerIs(provider) {
    return (context) => context.request.provider === provider;
}
export function tagIncludes(tag) {
    return (context) => Array.isArray(context.request.tags) && context.request.tags.includes(tag);
}
export function resourceTypeIs(type) {
    return (context) => context.request.resource?.type === type;
}
export function amountAbove(minimumExclusive, path = 'payload.amount') {
    return numberAbove(path, minimumExclusive);
}
export function confidenceBelow(maximumExclusive, path = 'meta.confidence') {
    return numberBelow(path, maximumExclusive);
}
export function flag(path) {
    return truthy(path);
}
export function reasonFromMatches(matches) {
    return matches.length === 1
        ? `Matched review policy: ${matches[0]}`
        : `Matched review policies: ${matches.join(', ')}`;
}
export function createPolicyContext(request, getter) {
    return { request, value: getter };
}
