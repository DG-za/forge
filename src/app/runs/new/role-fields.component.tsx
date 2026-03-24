import type { ModelOption, Platform } from './form.types';

type Props = {
  role: string;
  platform: Platform;
  model: string;
  platformOptions: { value: Platform; label: string }[];
  modelOptions: ModelOption[];
  onPlatformChange: (platform: Platform) => void;
  onModelChange: (model: string) => void;
};

export function RoleFields({
  role,
  platform,
  model,
  platformOptions,
  modelOptions,
  onPlatformChange,
  onModelChange,
}: Props) {
  const label = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="bg-surface-alt rounded-md p-3">
      <span className="text-text-muted mb-2 block text-xs font-medium tracking-wider uppercase">{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${role}Platform`} className="text-text mb-1 block text-xs">
            {label} platform
          </label>
          <select
            id={`${role}Platform`}
            name={`${role}Platform`}
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value as Platform)}
            className="bg-surface border-border text-text w-full rounded-md border px-2 py-1.5 text-sm"
          >
            {platformOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${role}Model`} className="text-text mb-1 block text-xs">
            {label} model
          </label>
          <select
            id={`${role}Model`}
            name={`${role}Model`}
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-surface border-border text-text w-full rounded-md border px-2 py-1.5 text-sm"
          >
            {modelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
