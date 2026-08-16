import type { MedicalRecordStatus } from '../../types/api'
import { Badge } from './Badge'
import type { BadgeTone } from './Badge'

const statusLabels: Record<MedicalRecordStatus, string> = {
  needs_review: 'Needs Review',
  user_edited: 'Edited',
  verified: 'Verified',
  rejected: 'Rejected',
  conflict_requires_review: 'Conflict',
  processing: 'Processing',
  extracted: 'Extracted',
}

const statusTones: Record<MedicalRecordStatus, BadgeTone> = {
  needs_review: 'warning',
  user_edited: 'primary',
  verified: 'success',
  rejected: 'neutral',
  conflict_requires_review: 'danger',
  processing: 'neutral',
  extracted: 'neutral',
}

export function RecordStatusBadge({ status }: { status: MedicalRecordStatus }) {
  return <Badge tone={statusTones[status] ?? 'neutral'}>{statusLabels[status] ?? status}</Badge>
}
