# Kenya Legal Reference — Court Jurisdiction & the Advocates Act

Background reference for the `legal-bot` classifier. Written for lead-qualification
triage, not as legal advice — figures and provisions should be checked against
the current gazetted rules before relying on them for an actual filing.

## Court structure (Constitution of Kenya, 2010, Art. 162–169)

| Court | Jurisdiction |
|---|---|
| **Supreme Court** | Presidential election petitions; appeals of right/leave on constitutional interpretation and application; advisory opinions to national/county government. |
| **Court of Appeal** | Appeals from the High Court, Employment and Labour Relations Court (ELRC) and Environment and Land Court (ELC). No original jurisdiction. |
| **High Court** | Unlimited original civil and criminal jurisdiction; sole jurisdiction over constitutional interpretation and Bill of Rights enforcement (Art. 165(3)); supervisory jurisdiction over subordinate courts; appeals from Magistrate's Courts and Kadhis' Courts. |
| **Employment and Labour Relations Court (ELRC)** | Status equal to the High Court. Exclusive jurisdiction over employment and labour relations disputes (Employment and Labour Relations Court Act, 2011). |
| **Environment and Land Court (ELC)** | Status equal to the High Court. Exclusive jurisdiction over land use, title, tenure, boundaries and environmental disputes (Environment and Land Court Act, 2011). |
| **Magistrate's Courts** | Civil and criminal jurisdiction up to a pecuniary limit set by class (Resident, Senior Resident, Principal, Senior Principal, Chief Magistrate). Limits are fixed by the Chief Justice under s.7 of the Magistrates' Courts Act, 2015 and are periodically revised by gazette notice — treat the numbers in `kenya-jurisdiction-classifier.js` as indicative, not authoritative. |
| **Small Claims Court** | Simplified, low-cost track for money claims (goods, services, contracts, compensation) up to the Small Claims Court Act, 2016 ceiling (KES 1,000,000 at enactment). No advocate required to file; claims target resolution within 60 days. |
| **Kadhis' Courts** | Muslim personal law only — marriage, divorce, personal status, inheritance — and only where all parties profess the Muslim faith and submit to the court's jurisdiction (Art. 170; Kadhis' Courts Act, Cap. 11). |

Grave/capital criminal offences (murder, treason, robbery with violence,
manslaughter, terrorism-related charges) are tried in the High Court; most
other criminal matters, including most bail applications, start in the
Magistrate's Court (Criminal Procedure Code, Cap. 75).

## The Advocates Act (Cap. 16, Laws of Kenya)

Governs who may practise law in Kenya and how advocates are regulated.

- **Admission (ss. 9–13):** to be admitted as an advocate a person must hold
  the prescribed academic qualifications (including a Kenya School of Law
  Advocates Training Programme pass), be of good character, and be admitted
  by the Chief Justice onto the Roll of Advocates.
- **Practising certificate (ss. 12–17, 21–23):** an advocate must hold a
  current annual practising certificate issued by the Registrar to lawfully
  act for a fee; practising without one is an offence.
- **Unqualified persons (s.34):** it is an offence for a non-advocate to act,
  or hold themselves out, as an advocate, or to draw certain legal documents
  for a fee.
- **Remuneration (s.44, Advocates (Remuneration) Order):** fees for
  contentious and non-contentious work are governed by the Remuneration
  Order; a client who disputes a bill can have it taxed by the court.
- **Discipline (Part IX):** complaints against advocate conduct go to the
  Advocates Complaints Commission or the LSK Disciplinary Committee, with
  serious matters referred to the Advocates Disciplinary Tribunal.
- **Law Society of Kenya (LSK):** the professional body for advocates;
  maintains the register used to verify whether someone is a currently
  practising advocate.

## How this maps to lead qualification

`kenya-jurisdiction-classifier.js` uses this structure to:
1. Guess the case category from keywords in the inquiry text.
2. Route civil/family/succession claims by value through the
   Small Claims → Magistrate class → High Court ladder.
3. Flag Advocates Act notes when the inquiry asks about an advocate's
   qualifications, fees, or a complaint against one.

Every output carries a disclaimer that this is automated triage, not legal
advice, and should be confirmed by a qualified advocate before filing.
