import { useState } from 'react'
import Stars from './Stars.jsx'

// Rate your purchase: 1-5 stars + comment. Saved to the store (localStorage) via onSubmit.
export default function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Pick a star rating first.')
      return
    }
    setError('')
    onSubmit(rating, comment)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <div className="text-sm font-medium mb-1">Rate your purchase</div>
        <Stars value={rating} onChange={setRating} label="Rate your purchase" size="h-7 w-7" />
      </div>
      <div>
        <label className="label" htmlFor="review-comment">Comment (optional)</label>
        <textarea
          id="review-comment"
          className="input"
          rows={3}
          maxLength={400}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How did delivery go? Was the account or code as described?"
        />
      </div>
      {error && <div className="text-danger text-sm">{error}</div>}
      <button type="submit" className="btn self-start">SUBMIT REVIEW</button>
    </form>
  )
}
