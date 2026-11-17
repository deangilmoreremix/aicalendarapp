/**
 * Rule builder for advanced filters (Twenty: record filter dropdown + advanced filter). Uses the same small controls
 * as the existing calendar filter menu. One group of rules joined by AND or OR.
 */
import { Plus, X } from 'lucide-react';

import {
  OPERANDS_BY_TYPE,
  OPERAND_LABEL,
  VALUELESS,
  type FieldDef,
  type FilterGroup,
  type FilterRule,
  type Operand
} from '../../lib/recordFilters/types';

const control = 'rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

let seq = 0;
export const newRuleId = () => `rule-${Date.now().toString(36)}-${seq++}`;

export const FilterBuilder = <T,>({
  fields,
  value,
  onChange
}: {
  fields: FieldDef<T>[];
  value: FilterGroup;
  onChange: (next: FilterGroup) => void;
}) => {
  const update = (id: string, patch: Partial<FilterRule>) =>
    onChange({ ...value, rules: value.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const addRule = () => {
    const first = fields[0];
    if (!first) return;
    onChange({ ...value, rules: [...value.rules, { id: newRuleId(), field: first.key, operand: OPERANDS_BY_TYPE[first.type][0] }] });
  };

  const changeField = (rule: FilterRule, key: string) => {
    const def = fields.find((f) => f.key === key);
    if (!def) return;
    // a new field starts with its first operand and no value
    update(rule.id, { field: key, operand: OPERANDS_BY_TYPE[def.type][0], value: undefined, value2: undefined, values: undefined });
  };

  return (
    <div className="space-y-2 text-sm">
      {value.rules.length > 1 && (
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          Match
          <select aria-label="Match rules with" className={control} value={value.op} onChange={(e) => onChange({ ...value, op: e.target.value as 'and' | 'or' })}>
            <option value="and">all of these rules (AND)</option>
            <option value="or">any of these rules (OR)</option>
          </select>
        </label>
      )}

      {value.rules.map((rule, index) => {
        const def = fields.find((f) => f.key === rule.field);
        if (!def) return null;
        const operands = OPERANDS_BY_TYPE[def.type];
        const needsValue = !VALUELESS.includes(rule.operand);
        const n = index + 1;
        return (
          <div key={rule.id} role="group" aria-label={`Rule ${n}`} className="flex flex-wrap items-center gap-2">
            <select aria-label={`Rule ${n} field`} className={control} value={rule.field} onChange={(e) => changeField(rule, e.target.value)}>
              {fields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <select aria-label={`Rule ${n} operator`} className={control} value={rule.operand} onChange={(e) => update(rule.id, { operand: e.target.value as Operand })}>
              {operands.map((o) => (
                <option key={o} value={o}>
                  {OPERAND_LABEL[o]}
                </option>
              ))}
            </select>

            {needsValue && <ValueInput def={def} rule={rule} n={n} update={(patch) => update(rule.id, patch)} />}

            <button type="button" aria-label={`Remove rule ${n}`} onClick={() => onChange({ ...value, rules: value.rules.filter((r) => r.id !== rule.id) })} className="text-gray-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      <button type="button" onClick={addRule} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
        <Plus className="h-4 w-4" /> Add rule
      </button>
    </div>
  );
};

const ValueInput = <T,>({ def, rule, n, update }: { def: FieldDef<T>; rule: FilterRule; n: number; update: (p: Partial<FilterRule>) => void }) => {
  const label = `Rule ${n} value`;
  const multi = rule.operand === 'is_any_of' || def.type === 'multiselect';

  if (def.type === 'select' && !multi) {
    return (
      <select aria-label={label} className={control} value={rule.value ?? ''} onChange={(e) => update({ value: e.target.value })}>
        <option value="" disabled>
          Choose…
        </option>
        {def.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (multi) {
    // checkbox list for select options; free comma-separated text for tags
    if (def.options) {
      return (
        <fieldset aria-label={label} className="flex flex-wrap gap-2">
          {def.options.map((o) => (
            <label key={o.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={rule.values?.includes(o.value) ?? false}
                onChange={(e) => update({ values: e.target.checked ? [...(rule.values ?? []), o.value] : (rule.values ?? []).filter((v) => v !== o.value) })}
              />
              {o.label}
            </label>
          ))}
        </fieldset>
      );
    }
    return (
      <input
        aria-label={label}
        className={control}
        placeholder="tag, tag…"
        value={(rule.values ?? []).join(', ')}
        onChange={(e) => update({ values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
      />
    );
  }

  const inputType = def.type === 'number' || rule.operand === 'next_n_days' || rule.operand === 'last_n_days' ? 'number' : def.type === 'date' ? 'date' : 'text';
  return (
    <>
      <input aria-label={label} type={inputType} className={control} value={rule.value ?? ''} onChange={(e) => update({ value: e.target.value })} />
      {rule.operand === 'between' && (
        <>
          <span className="text-gray-500">and</span>
          <input aria-label={`Rule ${n} second value`} type={inputType} className={control} value={rule.value2 ?? ''} onChange={(e) => update({ value2: e.target.value })} />
        </>
      )}
    </>
  );
};
