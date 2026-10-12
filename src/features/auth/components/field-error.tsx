interface FieldErrorProps {
  /** The id that the input's aria-describedby points to (D16). */
  readonly id: string
  readonly message: string | undefined
}

/** The message under one field. Renders nothing when the field is valid. */
export function FieldError({ id, message }: FieldErrorProps) {
  if (message === undefined || message === "") return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}
