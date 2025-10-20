# Identity Verification Integration Outline

This project currently stores users locally in the browser. When you are ready to move beyond the demo flow you can plug in any KYC/identity verification provider (e.g. Stripe Identity, Sumsub, Veriff, Persona). The steps below describe the required pieces and where to hook them into the codebase.

## 1. Collect the right inputs

- Extend the registration UI (`src/pages/RegisterPage.js`) to gather the information your provider requires (full legal name, date of birth, document type/number, selfie, etc.).
- For file uploads (ID photos, selfies) add controlled inputs and send them to your backend using `FormData`.
- Display clear consent text that explains why the information is needed and how it is handled.

## 2. Move user creation to the backend

- Create a proper API (for example in `peloapleo-backend/`) with an endpoint such as `POST /api/auth/register`.
- The endpoint should:
  1. Validate the basic fields (email uniqueness, password strength).
  2. Create a draft user record in your database with a `verificationStatus` field (`pending`, `approved`, `rejected`).
  3. Forward the collected identity data to the external provider using their SDK or REST API.
  4. Store the provider’s verification ID/token alongside the user to reconcile async webhooks.

## 3. Handle provider callbacks

- Most vendors deliver the decision asynchronously (webhook). Implement a webhook endpoint (e.g. `POST /api/webhooks/identity`) that:
  - Validates the signature secret provided by the vendor.
  - Looks up the draft user via the provider’s verification ID.
  - Updates `verificationStatus` accordingly and stores any metadata (e.g. risk scores, reason codes).
  - Optionally notifies the user by email/in-app that the review finished.

## 4. Gate access in the frontend

- Replace the current `AuthContext` implementation with real API calls:
  - `register` should call your backend endpoint and only log the user in once verification is `approved`.
  - `login` should reject users whose `verificationStatus !== "approved"` and show a message guiding them to support.
- Expose the status in context so components (publish flow, messaging) can block unverified users if required.

## 5. Operational considerations

- Offer a manual fallback: show a support CTA when verification fails.
- Store audit logs for regulatory purposes (who triggered a verification, when, outcome).
- Review local data retention requirements—most vendors provide a way to delete captured documents once you no longer need them.

Following this outline keeps the UI changes minimal while letting you scale into a compliant onboarding workflow when ready. Plug the code into whichever vendor best matches your compliance needs and regional coverage.
