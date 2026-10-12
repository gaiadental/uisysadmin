/**
 * React Hook Form wired to a Zod 4 schema through the zod resolver (ARCH-FE-001
 * D9; ADR-003). Every form uses this hook, so the resolver is set in one place.
 *
 * The form values are typed from the schema input. The submit handler gets the
 * schema output, so a transform such as a trimmed login ID reaches the request.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form"
import type { z } from "zod"

export function useZodForm<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>(
  schema: z.ZodType<TOutput, TInput>,
  defaultValues: DefaultValues<TInput>
): UseFormReturn<TInput, undefined, TOutput> {
  return useForm<TInput, undefined, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
  })
}
