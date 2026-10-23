// Three large, very faint blurred blobs drifting behind the glass panels. CSS keyframes only (see fx.css).
export default function Aurora() {
  return (
    <div aria-hidden="true" className="aurora pointer-events-none fixed inset-0 overflow-hidden">
      <span className="aurora-blob aurora-b1" />
      <span className="aurora-blob aurora-b2" />
      <span className="aurora-blob aurora-b3" />
    </div>
  )
}
