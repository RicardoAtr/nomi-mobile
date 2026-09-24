import { toSourceCode, check, recommended } from '@shopify/theme-check-common';
import { themeCheckRun } from '@shopify/theme-check-node';
const root = new URL('../theme/', import.meta.url).pathname;
const res = await themeCheckRun(root, undefined, (m) => {});
const skip = new Set(['TranslationKeyExists']);
const offenses = (res.offenses || res).filter(o => !skip.has(o.check) && !/entalle-landing/.test(o.uri) && !(o.check === 'MissingTemplate' && /entalle-(money|styles|behavior|whatsapp)|entalle-cart-drawer/.test(o.message)));
const by = {};
for (const o of offenses) { const k = `${o.severity}|${o.check}`; by[k] = (by[k]||0)+1; }
console.log(JSON.stringify(by, null, 1));
for (const o of offenses.filter(o => o.severity <= 2).slice(0, 80)) console.log(o.severity, o.check, o.uri?.split('/theme/')[1], o.start?.line, '-', o.message.slice(0, 160));
