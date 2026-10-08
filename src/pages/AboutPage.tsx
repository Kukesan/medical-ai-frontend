import { Link } from 'react-router-dom'
import { ContactLine, InfoPage } from '../components/PublicLayout'
import { SITE_OPERATOR } from '../lib/publicPages'

export function AboutPage() {
  return (
    <InfoPage path="/about" heading="About Envagai" schemaType="AboutPage">
      <p>
        Envagai is a personal health records app. It helps you keep prescriptions, lab reports, discharge notes and
        other medical information in one place, and turns them into an organized record you can actually use.
      </p>

      <h2>Who it is for</h2>
      <p>
        Envagai is built for patients and their families: anyone who has collected medical paperwork over the years
        and wants a clear picture of their own health history, for example before a doctor's appointment.
      </p>

      <h2>What Envagai does</h2>
      <ul>
        <li>
          <strong>Reads your documents.</strong> Upload PDF, PNG or JPEG files and Envagai extracts key details, such as
          medications, diagnoses and test results, for you to review and correct.
        </li>
        <li>
          <strong>Builds your health timeline.</strong> Visits, diagnoses and other events appear in one chronological
          view.
        </li>
        <li>
          <strong>Checks medications.</strong> An analysis looks for possible medication interactions and ranks findings
          by risk.
        </li>
        <li>
          <strong>Answers questions.</strong> A chat assistant answers questions using your own documents and analysis
          results.
        </li>
        <li>
          <strong>Keeps records organized.</strong> Allergies, vaccinations, surgeries and vitals such as weight, blood
          pressure and blood sugar.
        </li>
      </ul>

      <h2>How it works</h2>
      <p>
        Document reading, analysis and chat answers are produced by AI language models. AI can misread a document or
        miss something, so Envagai shows extracted details for you to check before you rely on them. The{' '}
        <Link to="/privacy">Privacy Policy</Link> explains which service providers process your data.
      </p>

      <h2>What Envagai is not</h2>
      <p>
        Envagai provides information, not medical advice. It does not diagnose conditions or recommend treatment, and it
        is not a substitute for a qualified healthcare professional. If you think you may have a medical emergency,
        contact your local emergency services immediately. See the <Link to="/terms">Terms of Use</Link> for details.
      </p>

      <h2>Who is behind Envagai</h2>
      <p>
        Envagai is developed and operated by {SITE_OPERATOR.name}. For questions or feedback, <ContactLine />.
      </p>
    </InfoPage>
  )
}
