import { Link } from 'react-router-dom'
import { ContactLine, InfoPage } from '../components/PublicLayout'
import { SITE_OPERATOR } from '../lib/publicPages'

const PRIVACY_UPDATED = '2026-10-08'

export function PrivacyPage() {
  return (
    <InfoPage path="/privacy" heading="Privacy Policy" updated={PRIVACY_UPDATED}>
      <p>
        This policy explains what information Envagai collects, how it is used, and the choices you have. Envagai is
        operated by {SITE_OPERATOR.name} ("we", "us"). Health information is sensitive, so we have tried to describe our
        practices plainly.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address and password. Passwords are stored as a one-way
          hash, not in readable form.
        </li>
        <li>
          <strong>Documents you upload:</strong> files such as prescriptions, lab reports and discharge notes (PDF, PNG
          or JPEG), and the details extracted from them.
        </li>
        <li>
          <strong>Records you add:</strong> medical events, allergies, vaccinations, surgeries and vitals such as height,
          weight, blood pressure and blood sugar.
        </li>
        <li>
          <strong>Questions and results:</strong> questions you ask the chat assistant, its answers, and analysis
          results such as medication interaction checks.
        </li>
        <li>
          <strong>Location you enter:</strong> if you search for doctors, the location text you type.
        </li>
        <li>
          <strong>Technical logs:</strong> request and error logs needed to operate and secure the service.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <p>
        We use your information only to provide Envagai's features to you: storing your records, extracting details
        from documents, building your timeline, running analyses, answering your questions, and keeping the service
        secure and working. <strong>We do not sell your data and do not use it for advertising.</strong>
      </p>

      <h2>Service providers</h2>
      <p>We rely on these providers to run Envagai. They process data on our behalf to deliver the service:</p>
      <ul>
        <li>
          <strong>OpenAI</strong> processes the content of your documents, records and questions to extract details,
          run analyses and generate chat answers.
        </li>
        <li>
          <strong>Amazon Web Services (S3)</strong> stores the files you upload.
        </li>
        <li>
          <strong>Railway</strong> hosts the Envagai application.
        </li>
        <li>
          <strong>Google Maps Platform</strong> receives the location you enter when you use the doctor search.
        </li>
      </ul>

      <h2>Cookies and browser storage</h2>
      <p>
        Envagai does not use advertising or analytics cookies. To keep you signed in, your browser stores sign-in tokens
        in session storage, which is cleared when you close the browser tab.
      </p>

      <h2>Access and security</h2>
      <p>
        Your records are only available after signing in to your account, and connections to Envagai use HTTPS. No
        online service can guarantee complete security, so please use a strong, unique password and keep it private.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can review and correct details extracted from your documents.</li>
        <li>You can delete documents, medical records and vitals entries from within the app at any time.</li>
        <li>
          You can permanently delete your account and all of its data from your Profile page. This also deletes the
          files you uploaded.
        </li>
        <li>
          To ask about your data, <ContactLine />.
        </li>
      </ul>

      <h2>Not medical advice</h2>
      <p>
        Envagai provides information, not medical advice. See the <Link to="/terms">Terms of Use</Link>.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change how we handle your information, we will update this page and the "Last updated" date above.
      </p>
    </InfoPage>
  )
}
