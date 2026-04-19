"use client";

import { useFormContext } from "react-hook-form";
import type { AttributeDefinition } from "@/api/attributes/types";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductFormValues } from "./product-form-schema";

function selectedValueIdForDefinition(definition: AttributeDefinition, selectedIds: string[]): string {
  const allowed = new Set(definition.values.map((v) => v.id));
  const hit = selectedIds.find((id) => allowed.has(id));
  return hit ?? "";
}

type VariantAttributePickersProps = {
  definitions: AttributeDefinition[];
  variantIndex: number;
};

export function VariantAttributePickers({ definitions, variantIndex }: VariantAttributePickersProps) {
  const { control } = useFormContext<ProductFormValues>();
  const path = `variants.${variantIndex}.attributeValueIds` as const;

  if (definitions.length === 0) return null;

  return (
    <FormField
      control={control}
      name={path}
      render={({ field }) => {
        const selectedIds: string[] = field.value ?? [];
        return (
          <FormItem>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {definitions.map((def) => {
                const value = selectedValueIdForDefinition(def, selectedIds);
                return (
                  <div key={def.id} className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-muted-foreground">{def.name}</FormLabel>
                    <Select
                      value={value || "__none__"}
                      onValueChange={(next) => {
                        const allowed = new Set(def.values.map((v) => v.id));
                        const without = selectedIds.filter((id) => !allowed.has(id));
                        const merged = next === "__none__" ? without : [...without, next];
                        field.onChange(merged);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger aria-label={def.name}>
                          <SelectValue placeholder="Не обрано" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[130]">
                        <SelectItem value="__none__">Не обрано</SelectItem>
                        {def.values.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
