import type { ProcessingStatus } from '../../types/api'
import { Badge } from './Badge'
import type { BadgeTone } from './Badge'

const statusLabels: Record<ProcessingStatus, string> = {
  uploaded: 'Processing',
  ocr_completed: 'Processing',
  extracted: 'Pending Review',
  analyzed: 'Analyzed',
  user_edited: 'Edited',
  accepted: 'Accepted',
  failed: 'Processing failed',
}

const statusTones: Record<ProcessingStatus, BadgeTone> = {
  uploaded: 'primary',
  ocr_completed: 'primary',
  extracted: 'warning',
  analyzed: 'neutral',
  user_edited: 'primary',
  accepted: 'success',
  failed: 'danger',
}

export function DocumentStatusBadge({ status }: { status: ProcessingStatus }) {
  return <Badge tone={statusTones[status] ?? 'neutral'}>{statusLabels[status] ?? status}</Badge>
}
