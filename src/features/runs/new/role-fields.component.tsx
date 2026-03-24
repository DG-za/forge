import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="bg-muted rounded-md p-3">
      <span className="text-muted-foreground mb-2 block text-xs font-medium tracking-wider uppercase">{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${role}Platform`} className="mb-1 text-xs">
            {label} platform
          </Label>
          <Select name={`${role}Platform`} value={platform} onValueChange={(v) => v && onPlatformChange(v as Platform)}>
            <SelectTrigger id={`${role}Platform`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`${role}Model`} className="mb-1 text-xs">
            {label} model
          </Label>
          <Select name={`${role}Model`} value={model} onValueChange={(v) => v && onModelChange(v)}>
            <SelectTrigger id={`${role}Model`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
