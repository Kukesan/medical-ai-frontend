import { Shield } from 'lucide-react'
import { MedicalRecordListPage } from '../components/medical-records/MedicalRecordListPage'
import type { RecordFieldConfig } from '../components/medical-records/fieldUtils'

const fields: RecordFieldConfig[] = [
  { key: 'substance', label: 'Substance', type: 'text', required: true },
  { key: 'reaction', label: 'Reaction', type: 'text' },
  { key: 'severity', label: 'Severity', type: 'text' },
]

export function AllergyPage() {
  return (
    <MedicalRecordListPage
      recordType="ALLERGY"
      title="Allergies"
      description="Review allergies extracted from your documents."
      icon={Shield}
      fields={fields}
      emptyTitle="No allergies found."
      emptyDescription="Allergies extracted from uploaded documents will appear here for review."
    />
  )
}
