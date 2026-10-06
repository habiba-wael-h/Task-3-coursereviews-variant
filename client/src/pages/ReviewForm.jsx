import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the existing review and fill the form.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    api.get(`/reviews/${id}`)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          courseCode: data.courseCode ?? '',
          rating: Number(data.rating) || 5,
          comment: data.comment ?? ''
        })
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load review')
      })
    return () => { cancelled = true }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'rating' ? Number(value) : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    // Never send reviewedBy: the server takes the reviewer from the token.
    const payload = {
      courseCode: form.courseCode,
      rating: form.rating,
      comment: form.comment
    }
    try {
      if (id) await api.patch(`/reviews/${id}`, payload)
      else await api.post('/reviews', payload)
      nav('/reviews')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save review')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="courseCode"
          placeholder="Course code (e.g. CS101)"
          value={form.courseCode}
          onChange={onChange}
        />
        <select className="input" name="rating" value={form.rating} onChange={onChange}>
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <textarea
          className="input"
          name="comment"
          rows={4}
          placeholder="Comment (optional)"
          value={form.comment}
          onChange={onChange}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
