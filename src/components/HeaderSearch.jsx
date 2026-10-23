import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Header search: a round icon that expands into a pill input. CSS width transition only.
export default function HeaderSearch() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(params.get('q') || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = (e) => {
    e.preventDefault()
    const term = value.trim()
    navigate(term ? `/?q=${encodeURIComponent(term)}` : '/')
  }

  const onKey = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <form onSubmit={submit} role="search" className="flex items-center" data-nav>
      <div className={`hs-field flex items-center overflow-hidden rounded-full border transition-[width,opacity,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'w-40 md:w-64 opacity-100 border-line bg-white/80' : 'w-0 opacity-0 border-transparent'}`}>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => !value.trim() && setOpen(false)}
          placeholder="Search accounts, gift cards"
          aria-label="search listings"
          tabIndex={open ? 0 : -1}
          className="min-w-0 flex-1 bg-transparent pl-4 pr-2 py-2 text-sm text-bone placeholder:text-muted outline-none"
        />
      </div>
      <button
        type={open && value.trim() ? 'submit' : 'button'}
        onClick={() => !open && setOpen(true)}
        aria-label={open ? 'run search' : 'open search'}
        className="tap ml-1.5 grid place-items-center w-9 h-9 rounded-full border border-line text-bone/80 hover:text-bone transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>
    </form>
  )
}
