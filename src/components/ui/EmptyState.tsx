interface Props {
  title: string
  detail?: string
}

export function EmptyState({ title, detail }: Props) {
  return (
    <section className="empty-state">
      <h1>{title}</h1>
      {detail && <p>{detail}</p>}
    </section>
  )
}
