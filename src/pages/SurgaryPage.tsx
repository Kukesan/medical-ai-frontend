import { Stethoscope } from 'lucide-react'
import { MedicalRecordListPage } from '../components/medical-records/MedicalRecordListPage'
import type { RecordFieldConfig } from '../components/medical-records/fieldUtils'

const fields: RecordFieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

export function SurgeryPage() {
  return (
    <MedicalRecordListPage
      recordType="SURGERY"
      title="Surgeries"
      description="Review surgeries extracted from your documents."
      icon={Stethoscope}
      fields={fields}
      emptyTitle="No surgeries found."
      emptyDescription="Surgeries extracted from uploaded documents will appear here for review."
    />
  )
}
