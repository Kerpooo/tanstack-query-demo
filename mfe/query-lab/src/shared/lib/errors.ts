import axios from 'axios'

/** Mensaje legible de un error de la API (`{ error: string }`) o de red. */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(err)) {
    return err.response?.data?.error ?? err.message
  }
  return err instanceof Error ? err.message : 'Error desconocido'
}
