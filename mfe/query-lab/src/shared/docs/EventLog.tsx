/** Lista numerada de eventos, para ver en qué orden ocurren las cosas. */
export function EventLog({ events, empty = 'Todavía no hay eventos.' }: { events: string[]; empty?: string }) {
  return (
    <ol aria-label="Registro de eventos" className="bg-muted/50 max-h-48 space-y-0.5 overflow-auto rounded-md border p-3 font-mono text-xs">
      {events.length === 0 && <li className="text-muted-foreground">{empty}</li>}
      {events.map((event, index) => (
        <li key={index}>
          {index + 1}. {event}
        </li>
      ))}
    </ol>
  )
}
