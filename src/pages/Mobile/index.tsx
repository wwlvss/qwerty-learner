import { Navigate } from 'react-router-dom'

// Keep old mobile bookmarks on the personal learning site.
export default function MobilePage() {
  return <Navigate to="/my-dictionary" replace />
}
