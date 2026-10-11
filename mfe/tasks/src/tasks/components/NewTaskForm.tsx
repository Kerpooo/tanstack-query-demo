import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

interface Props {
  pending: boolean
  onCreate: (title: string, onDone: () => void) => void
}

export function NewTaskForm({ pending, onCreate }: Props) {
  const [title, setTitle] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate(title.trim(), () => setTitle(''))
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nueva tarea"
        aria-label="Nueva tarea"
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Agregando…' : 'Agregar'}
      </Button>
    </form>
  )
}
