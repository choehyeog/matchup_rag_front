import { ArrowLeft, X } from 'lucide-react'
import { COLORS } from '@/shared/theme'

interface TopNavProps {
  canGoBack?: boolean
  onBack?: () => void
  onClose?: () => void
}

export default function TopNav({ canGoBack = true, onBack = () => {}, onClose = () => {} }: TopNavProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        aria-label="Back"
        onClick={onBack}
        disabled={!canGoBack}
        className={`p-1 -ml-1 ${canGoBack ? '' : 'invisible'}`}
        style={{ color: COLORS.ink }}
      >
        <ArrowLeft size={22} />
      </button>
      <button aria-label="Close" onClick={onClose} className="p-1 -mr-1" style={{ color: COLORS.ink }}>
        <X size={22} />
      </button>
    </div>
  )
}
