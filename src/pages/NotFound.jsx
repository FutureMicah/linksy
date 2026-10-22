import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-6xl text-lime text-glow">404</p>
      <p className="text-muted mt-1">That page does not exist.</p>
      <Link to="/" className="btn mt-5 inline-flex">BACK TO SHOP</Link>
    </div>
  )
}
