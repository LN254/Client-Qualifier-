/**
 * Kenya Legal Matter Classifier
 *
 * Rule-based triage for the Client Qualifier: reads a lead's free-text inquiry
 * (plus an optional claim amount), guesses the case category, and maps it to
 * the correct court under Kenya's judiciary structure. Also flags Advocates
 * Act (Cap. 16) notes for the more common "can this person even represent me"
 * / "what will it cost" questions.
 *
 * This is a lead-qualification aid, NOT legal advice. Monetary jurisdiction
 * limits are set by the Chief Justice under s.7 of the Magistrates' Courts
 * Act, 2015 and are revised by gazette notice from time to time — confirm
 * COURT_MONEY_LIMITS below against the current Judiciary practice directions
 * before relying on it for a real filing decision.
 */

'use strict';

// Confirm against the latest Judiciary gazette notice before relying on these.
const COURT_MONEY_LIMITS = {
  smallClaimsCourtMax: 1_000_000, // Small Claims Court Act, 2016
  residentMagistrateMax: 5_000_000,
  seniorResidentMagistrateMax: 7_000_000,
  principalMagistrateMax: 10_000_000,
  seniorPrincipalMagistrateMax: 15_000_000,
  chiefMagistrateMax: 20_000_000, // above this: High Court (unlimited pecuniary jurisdiction)
};

const CASE_RULES = [
  {
    category: 'Employment / Labour Dispute',
    keywords: [
      'fired', 'dismissed', 'dismissal', 'termination', 'terminated', 'salary',
      'wages', 'unpaid pay', 'workplace', 'employer', 'employee', 'redundan',
      'wrongful dismissal', 'nssf', 'nhif', 'leave pay', 'contract of employment',
    ],
    court: 'Employment and Labour Relations Court (ELRC)',
    basis: 'Employment and Labour Relations Court Act, 2011 (s.12) — the ELRC has exclusive original jurisdiction over employment and labour relations disputes; ordinary magistrate\'s and High Court civil jurisdiction does not apply.',
  },
  {
    category: 'Land / Environment Dispute',
    keywords: [
      'land', 'boundary', 'title deed', 'eviction', 'trespass', 'environment',
      'pollution', 'lease', 'plot', 'survey', 'land dispute', 'landlord',
    ],
    court: 'Environment and Land Court (ELC)',
    basis: 'Environment and Land Court Act, 2011 (s.13) — the ELC has exclusive original jurisdiction over disputes relating to land use, title, tenure, boundaries and the environment.',
  },
  {
    category: 'Muslim Personal Law',
    keywords: [
      'kadhi', 'islamic marriage', 'muslim marriage', 'muslim divorce',
      'islamic inheritance', 'islamic succession',
    ],
    court: "Kadhi's Court",
    basis: "Constitution of Kenya, Art. 170 & Kadhis' Courts Act (Cap. 11) — jurisdiction is limited to questions of Muslim law on personal status, marriage, divorce or inheritance where all parties profess the Muslim faith and submit to the court's jurisdiction.",
  },
  {
    category: 'Family / Succession',
    keywords: [
      'divorce', 'custody', 'maintenance', 'succession', 'inheritance',
      'probate', 'letters of administration', 'estate', 'marriage', 'adoption',
    ],
    court: null, // resolved by resolveFamilyCourt() using estate/claim value
    basis: 'Magistrates\' Courts Act, 2015 (family matters) and the Law of Succession Act (Cap. 160). Divorce, custody and maintenance are heard in the Magistrate\'s Court (Kadhi\'s Court where applicable); succession/probate matters are filed in the Magistrate\'s Court or High Court Family Division depending on the value of the estate.',
  },
  {
    category: 'Criminal Matter',
    keywords: [
      'arrested', 'police', 'charged', 'criminal case', 'theft', 'stolen',
      'assault', 'robbery', 'murder', 'bail', 'bond', 'cybercrime',
    ],
    court: null, // resolved by resolveCriminalCourt()
    basis: 'Criminal Procedure Code (Cap. 75) — most criminal matters are tried in the Magistrate\'s Court; capital and grave offences (e.g. murder, treason, robbery with violence) are tried in the High Court, which has unlimited original criminal jurisdiction under Art. 165(3)(a) of the Constitution.',
  },
  {
    category: 'Constitutional / Judicial Review / Human Rights',
    keywords: [
      'constitutional', 'judicial review', 'human rights violation',
      'fundamental rights', 'habeas corpus', 'unconstitutional', 'petition against the state',
    ],
    court: 'High Court',
    basis: 'Constitution of Kenya, Art. 165(3) — the High Court has original jurisdiction to interpret the Constitution and to determine whether a right in the Bill of Rights has been denied, violated, infringed or threatened.',
  },
  {
    category: 'General Civil / Contract / Debt Claim',
    keywords: [
      'contract', 'debt', 'breach', 'sue', 'owe me', 'owes me', 'unpaid invoice',
      'goods', 'services', 'loan', 'refund', 'rent arrears', 'compensation',
    ],
    court: null, // resolved by resolveCivilCourt() using claim amount
    basis: 'Magistrates\' Courts Act, 2015 and Small Claims Court Act, 2016 — ordinary civil/contract/debt claims are filed in the Small Claims Court or a Magistrate\'s Court of the appropriate class, or the High Court, depending on the value of the claim (see amount-based routing).',
  },
];

function resolveCivilCourt(amount) {
  if (amount == null) {
    return {
      court: 'Small Claims Court or Magistrate\'s Court (class depends on claim value — amount not provided)',
      note: 'Provide the claim amount to pin down the exact court class.',
    };
  }
  const L = COURT_MONEY_LIMITS;
  if (amount <= L.smallClaimsCourtMax) return { court: 'Small Claims Court', note: `Claims up to KES ${L.smallClaimsCourtMax.toLocaleString()} — fast-track, no advocate required to file, adjudicated within 60 days.` };
  if (amount <= L.residentMagistrateMax) return { court: "Resident Magistrate's Court", note: `Civil claims up to KES ${L.residentMagistrateMax.toLocaleString()}.` };
  if (amount <= L.seniorResidentMagistrateMax) return { court: "Senior Resident Magistrate's Court", note: `Civil claims up to KES ${L.seniorResidentMagistrateMax.toLocaleString()}.` };
  if (amount <= L.principalMagistrateMax) return { court: "Principal Magistrate's Court", note: `Civil claims up to KES ${L.principalMagistrateMax.toLocaleString()}.` };
  if (amount <= L.seniorPrincipalMagistrateMax) return { court: "Senior Principal Magistrate's Court", note: `Civil claims up to KES ${L.seniorPrincipalMagistrateMax.toLocaleString()}.` };
  if (amount <= L.chiefMagistrateMax) return { court: "Chief Magistrate's Court", note: `Civil claims up to KES ${L.chiefMagistrateMax.toLocaleString()}.` };
  return { court: 'High Court', note: `High Court has unlimited pecuniary jurisdiction — applies above the Chief Magistrate's ceiling of KES ${L.chiefMagistrateMax.toLocaleString()}.` };
}

function resolveFamilyCourt(text, amount) {
  if (/succession|probate|letters of administration|estate|inheritance/.test(text)) {
    const civil = resolveCivilCourt(amount);
    return { court: civil.court === 'High Court' ? 'High Court (Family Division)' : `${civil.court} (Succession Cause)`, note: 'Succession/probate follows the same value-based ladder as ordinary civil claims, using the estate value.' };
  }
  return { court: "Magistrate's Court (Family Division)", note: 'Divorce, custody and maintenance are normally filed at the Magistrate\'s Court; parties who profess Islam and submit to it may instead use the Kadhi\'s Court.' };
}

function resolveCriminalCourt(text) {
  const graveOffence = /murder|treason|robbery with violence|manslaughter|terrorism/.test(text);
  return graveOffence
    ? { court: 'High Court', note: 'Capital/grave offences are tried in the High Court, which alone can impose the maximum sentences for these charges.' }
    : { court: "Magistrate's Court", note: 'Most criminal matters, including most bail/bond applications, start in the Magistrate\'s Court.' };
}

const ADVOCATES_ACT_TRIGGERS = [
  {
    test: /\b(qualified|licensed|licence|license|practicing certificate|practising certificate|real lawyer|verify.*advocate)\b/i,
    note: "Advocates Act (Cap. 16), ss. 9–17: only a person admitted as an advocate by the Chief Justice, enrolled on the Roll of Advocates and holding a current Practising Certificate may lawfully practise law in Kenya (s.9, s.34). You can verify an advocate's standing with the Law Society of Kenya (LSK).",
  },
  {
    test: /\b(fee|fees|cost|charge|how much.*lawyer|legal fees)\b/i,
    note: 'Advocates Act (Cap. 16), s.44 & the Advocates (Remuneration) Order: advocates\' fees for contentious and non-contentious work are governed by the Remuneration Order and can be challenged through taxation of a bill of costs if a client believes they were overcharged.',
  },
  {
    test: /\b(complain|complaint|misconduct|unethical|scammed by.*lawyer|sue my lawyer)\b/i,
    note: 'Advocates Act (Cap. 16), Part IX: complaints against an advocate\'s conduct can be filed with the Advocates Complaints Commission or the Disciplinary Committee of the Law Society of Kenya, and serious cases go to the Advocates Disciplinary Tribunal.',
  },
  {
    test: /\bunqualified person|non-advocate|not a lawyer.*representing\b/i,
    note: 'Advocates Act (Cap. 16), s.34: it is an offence for an unqualified person to act as, or pretend to be, an advocate, or to prepare legal documents for a fee without being an advocate.',
  },
];

function classify(rawText, claimAmount) {
  const text = (rawText || '').toLowerCase();
  const amount = claimAmount == null || claimAmount === '' ? null : Number(claimAmount);

  let match = null;
  for (const rule of CASE_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) { match = rule; break; }
  }

  let court, basis, note = null;
  if (!match) {
    court = 'Unclear — needs human triage';
    basis = 'No case-type keywords matched. An advocate should review the raw inquiry before routing.';
  } else if (match.category === 'General Civil / Contract / Debt Claim') {
    const resolved = resolveCivilCourt(amount);
    court = resolved.court; note = resolved.note; basis = match.basis;
  } else if (match.category === 'Family / Succession') {
    const resolved = resolveFamilyCourt(text, amount);
    court = resolved.court; note = resolved.note; basis = match.basis;
  } else if (match.category === 'Criminal Matter') {
    const resolved = resolveCriminalCourt(text);
    court = resolved.court; note = resolved.note; basis = match.basis;
  } else {
    court = match.court; basis = match.basis;
  }

  const advocatesActNotes = ADVOCATES_ACT_TRIGGERS
    .filter((t) => t.test.test(text))
    .map((t) => t.note);

  return {
    caseCategory: match ? match.category : 'Unclassified',
    recommendedCourt: court,
    jurisdictionBasis: basis,
    courtNote: note,
    advocatesActNotes,
    disclaimer: 'Automated triage only — not legal advice. Confirm with a qualified advocate before filing.',
  };
}

module.exports = { classify, resolveCivilCourt, resolveFamilyCourt, resolveCriminalCourt, COURT_MONEY_LIMITS, CASE_RULES };
