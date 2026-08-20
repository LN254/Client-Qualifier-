# Client-Qualifier-
Auto Lead Qualifier

## Legal Bot: Kenya court jurisdiction & Advocates Act triage

`legal-bot/` adds a rule-based triage step for law-firm leads. Given a lead's
free-text inquiry (and an optional claim amount), it:

- Classifies the case type (employment, land, family/succession, criminal,
  constitutional/judicial review, Muslim personal law, or general civil/debt).
- Routes civil, family/succession and criminal matters to the correct court
  under Kenya's judiciary structure — Small Claims Court → Magistrate's Court
  (by class/value) → High Court, or ELRC/ELC/Kadhi's Court where those have
  exclusive jurisdiction.
- Flags relevant Advocates Act (Cap. 16) notes when the inquiry asks about an
  advocate's qualifications, fees, or a complaint against one.

Files:
- `legal-bot/kenya-jurisdiction-classifier.js` — the classifier logic (`classify(text, amount)`), usable standalone or from Node.
- `legal-bot/legal-bot-workflow.json` — an n8n workflow (webhook → classify → reply) that can run standalone or feed into `lead-capture-workflow.json`.
- `legal-bot/kenya-advocates-act-reference.md` — the underlying court-structure and Advocates Act reference.

This is automated lead triage, not legal advice — monetary jurisdiction
limits are gazetted by the Chief Justice and change periodically, so verify
current figures before relying on a specific routing decision, and always
have an advocate confirm before filing.
