import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { z } from 'zod'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { usersPaths } from '../paths'
import type { UserInput } from '../users.types'

const schema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  email: z.email('Ingrese un correo válido'),
})

type FieldErrors = Partial<Record<keyof UserInput, string>>

interface Props {
  initialValues?: UserInput
  submitLabel: string
  pending: boolean
  /** Error devuelto por la API (p. ej. correo duplicado). */
  serverError?: string
  onSubmit: (values: UserInput) => void
}

export function UserForm({ initialValues, submitLabel, pending, serverError, onSubmit }: Props) {
  const [values, setValues] = useState<UserInput>(initialValues ?? { name: '', email: '' })
  const [errors, setErrors] = useState<FieldErrors>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof UserInput
        fieldErrors[key] ??= issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-name">Nombre</Label>
        <Input
          id="user-name"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">Correo</Label>
        <Input
          id="user-email"
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
        <Button variant="outline" asChild>
          <Link to={usersPaths.list}>Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
