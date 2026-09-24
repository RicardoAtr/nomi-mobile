import { themeCheckRun } from '@shopify/theme-check-node';
const root = new URL('../theme/', import.meta.url).pathname;
const res = await themeCheckRun(root, undefined, () => {});
const o = res.offenses || res;
const by = {}; for (const x of o) by[x.check] = (by[x.check]||0)+1;
console.log('total', o.length, JSON.stringify(by));
for (const x of o.filter(x => !['TranslationKeyExists'].includes(x.check))) console.log(x.severity, x.check, x.uri.split('/theme/')[1], x.start?.line, x.message.slice(0,150));
