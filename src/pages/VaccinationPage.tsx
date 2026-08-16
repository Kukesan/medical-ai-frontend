import { Syringe } from 'lucide-react'
import { MedicalRecordListPage } from '../components/medical-records/MedicalRecordListPage'
import type { RecordFieldConfig } from '../components/medical-records/fieldUtils'

const fields: RecordFieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'date_administered', label: 'Date Administered', type: 'datetime', required: true },
  { key: 'is_next_due', label: 'Next Dose Due', type: 'boolean' },
  { key: 'next_due_date', label: 'Next Due Date', type: 'datetime' },
]

export function VaccinationPage() {
  return (
    <MedicalRecordListPage
      recordType="VACCINATION"
      title="Vaccinations"
      description="Review vaccinations extracted from your documents."
      icon={Syringe}
      fields={fields}
      emptyTitle="No vaccinations found."
      emptyDescription="Vaccinations extracted from uploaded documents will appear here for review."
    />
  )
}
