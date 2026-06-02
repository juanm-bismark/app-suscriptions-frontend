"use client"

import { useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Input, Select, SelectItem } from "@/components/ui"
import type { CredentialUpsertIn } from "@/lib/types/api"
import { environment, fileToBase64, getPath, type Field } from "./config"

export function CredentialFieldGrid({
  fields,
  form,
  watchedValues,
  defaultValues,
}: {
  fields: Field[]
  form: UseFormReturn<CredentialUpsertIn>
  watchedValues: Partial<CredentialUpsertIn>
  defaultValues: CredentialUpsertIn
}) {
  return (
    <div className="rounded-lg bg-white/30 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <CredentialField
            key={field.name}
            field={field}
            form={form}
            value={getPath(watchedValues, field.name) ?? getPath(defaultValues, field.name)}
          />
        ))}
      </div>
    </div>
  )
}

function CredentialField({
  field,
  form,
  value,
}: {
  field: Field
  form: UseFormReturn<CredentialUpsertIn>
  value: unknown
}) {
  const errorMessage = getPath(form.formState.errors, field.name)

  return (
    <label className="space-y-1.5 text-sm font-medium text-title">
      <span>{field.label}</span>
      {field.kind === "select" ? (
        <Select
          {...form.register(field.name)}
          value={String(value ?? "")}
          className="h-10 border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
        >
          {field.options.map((option) => (
            <SelectItem key={option} value={option}>
              {environment[option]}
            </SelectItem>
          ))}
        </Select>
      ) : field.kind === "file" ? (
        <CredentialFileField field={field} form={form} value={value} />
      ) : (
        <Input
          {...form.register(field.name, field.kind === "number" ? { valueAsNumber: true } : undefined)}
          type={field.kind === "password" ? "password" : field.kind === "number" ? "number" : "text"}
          placeholder={field.placeholder}
          className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
        />
      )}
      {isFieldError(errorMessage) ? (
        <p className="text-sm font-medium text-red-500">{String(errorMessage.message)}</p>
      ) : null}
    </label>
  )
}

function CredentialFileField({
  field,
  form,
  value,
}: {
  field: Extract<Field, { kind: "file" }>
  form: UseFormReturn<CredentialUpsertIn>
  value: unknown
}) {
  useEffect(() => {
    form.register(field.name)
  }, [field.name, form])

  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept=".pfx,.p12,application/x-pkcs12"
        className="border-0 bg-white/80 shadow-sm shadow-header-top/5 file:text-header-bg focus-visible:ring-header-accent"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            form.setValue(field.name, "", { shouldDirty: true, shouldValidate: true })
            return
          }

          try {
            form.clearErrors(field.name)
            form.setValue(field.name, await fileToBase64(file), { shouldDirty: true, shouldValidate: true })
          } catch {
            form.setError(field.name, { type: "manual", message: "No se pudo leer el certificado PFX" })
          }
        }}
      />
      {value ? <p className="text-xs text-muted">Archivo cargado y convertido a base64.</p> : null}
    </div>
  )
}

function isFieldError(value: unknown): value is { message: unknown } {
  return Boolean(value && typeof value === "object" && "message" in value)
}
