import type { Condition, JsonMap, JsonValue, PolicyContext, ReviewPolicy } from './types.js';

export function policy<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  input: ReviewPolicy<TPayload, TMeta>,
): ReviewPolicy<TPayload, TMeta> {
  return input;
}

export function all<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  ...conditions: Condition<TPayload, TMeta>[]
): Condition<TPayload, TMeta> {
  return async (context) => {
    for (const condition of conditions) {
      if (!(await condition(context))) {
        return false;
      }
    }
    return true;
  };
}

export function any<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  ...conditions: Condition<TPayload, TMeta>[]
): Condition<TPayload, TMeta> {
  return async (context) => {
    for (const condition of conditions) {
      if (await condition(context)) {
        return true;
      }
    }
    return false;
  };
}

export function not<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  condition: Condition<TPayload, TMeta>,
): Condition<TPayload, TMeta> {
  return async (context) => !(await condition(context));
}

export function eq<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  expected: JsonValue,
): Condition<TPayload, TMeta> {
  return (context) => context.value(path) === expected;
}

export function oneOf<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  values: JsonValue[],
): Condition<TPayload, TMeta> {
  return (context) => values.includes(context.value(path) as JsonValue);
}

export function pathExists<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
): Condition<TPayload, TMeta> {
  return (context) => typeof context.value(path) !== 'undefined';
}

export function includes<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  expected: JsonValue,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return Array.isArray(value) && value.includes(expected);
  };
}

export function arrayLengthAbove<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  minimumExclusive: number,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return Array.isArray(value) && value.length > minimumExclusive;
  };
}

export function stringIncludes<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  expectedFragment: string,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return typeof value === 'string' && value.includes(expectedFragment);
  };
}

export function stringStartsWith<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  prefix: string,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return typeof value === 'string' && value.startsWith(prefix);
  };
}

export function matchesRegex<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  expression: RegExp,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return typeof value === 'string' && expression.test(value);
  };
}

export function numberAbove<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  minimumExclusive: number,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return typeof value === 'number' && value > minimumExclusive;
  };
}

export function numberBelow<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  maximumExclusive: number,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return typeof value === 'number' && value < maximumExclusive;
  };
}

export function numberBetween<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  minimumInclusive: number,
  maximumInclusive: number,
): Condition<TPayload, TMeta> {
  return (context) => {
    const value = context.value(path);
    return typeof value === 'number' && value >= minimumInclusive && value <= maximumInclusive;
  };
}

export function truthy<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
): Condition<TPayload, TMeta> {
  return (context) => Boolean(context.value(path));
}

export function actionIs<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  action: string,
): Condition<TPayload, TMeta> {
  return (context) => context.request.action === action;
}

export function actionIn<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  actions: string[],
): Condition<TPayload, TMeta> {
  return (context) => actions.includes(context.request.action);
}

export function actionMatches<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  expression: RegExp,
): Condition<TPayload, TMeta> {
  return (context) => expression.test(context.request.action);
}

export function actorTypeIs<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  type: string,
): Condition<TPayload, TMeta> {
  return (context) => context.request.actor.type === type;
}

export function providerIs<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  provider: string,
): Condition<TPayload, TMeta> {
  return (context) => context.request.provider === provider;
}

export function providerIn<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  providers: string[],
): Condition<TPayload, TMeta> {
  return (context) => typeof context.request.provider === 'string' && providers.includes(context.request.provider);
}

export function providerMatches<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  expression: RegExp,
): Condition<TPayload, TMeta> {
  return (context) => typeof context.request.provider === 'string' && expression.test(context.request.provider);
}

export function tagIncludes<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  tag: string,
): Condition<TPayload, TMeta> {
  return (context) => Array.isArray(context.request.tags) && context.request.tags.includes(tag);
}

export function tagAny<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  tags: string[],
): Condition<TPayload, TMeta> {
  return (context) => Array.isArray(context.request.tags) && tags.some((tag) => context.request.tags?.includes(tag));
}

export function resourceTypeIs<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  type: string,
): Condition<TPayload, TMeta> {
  return (context) => context.request.resource?.type === type;
}

export function amountAbove<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  minimumExclusive: number,
  path = 'payload.amount',
): Condition<TPayload, TMeta> {
  return numberAbove(path, minimumExclusive);
}

export function confidenceBelow<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  maximumExclusive: number,
  path = 'meta.confidence',
): Condition<TPayload, TMeta> {
  return numberBelow(path, maximumExclusive);
}

export function recipientCountAbove<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  minimumExclusive: number,
  path = 'payload.recipientCount',
): Condition<TPayload, TMeta> {
  return numberAbove(path, minimumExclusive);
}

export function externalDomainNotAllowed<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
  allowlist: string[],
): Condition<TPayload, TMeta> {
  const normalized = allowlist.map((value) => value.toLowerCase());
  return (context) => {
    const value = context.value(path);
    if (typeof value !== 'string' || !value.includes('@')) {
      return false;
    }
    const domain = value.split('@').pop()?.toLowerCase();
    return Boolean(domain) && !normalized.includes(domain as string);
  };
}

export function flag<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  path: string,
): Condition<TPayload, TMeta> {
  return truthy(path);
}

export function reasonFromMatches(matches: string[]): string {
  return matches.length === 1
    ? `Matched review policy: ${matches[0]}`
    : `Matched review policies: ${matches.join(', ')}`;
}

export function createPolicyContext<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
  request: PolicyContext<TPayload, TMeta>['request'],
  getter: (path: string) => JsonValue | undefined,
): PolicyContext<TPayload, TMeta> {
  return { request, value: getter };
}
