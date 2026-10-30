## The problem in one paragraph

The EU AI Act was built around a simple idea: check a system before it goes on the market, then watch it once it is there. That works well for a system that stays the same. It works less well for a system that keeps learning from the people who use it, because the system you checked in January is no longer the system running in June. The Act knows this, and it has a specific answer for systems that learn after release. This post walks through that answer step by step, and then asks whether it is enough.

A quick picture before we start. A hospital buys a tool that reads chest X rays and flags possible pneumonia. The tool was tested, documented and approved. Every time a radiologist corrects one of its flags, the tool quietly adjusts itself. Six months later, its flags are a little different. Nobody signed off on that version. Was it still checked?

**The short answer:** the Act lets a learning system change without a new check, as long as the provider described those changes in advance. That is a sensible rule. But it rests on assumptions that are hard to meet for systems that learn from live users, and the rest of this post explains where it can fall short.

## Step 1: What online learning actually is

Online learning means a system keeps changing its own behaviour after release, using the data it meets while in use. Nobody builds a new version and ships it. The system updates itself, often in small steps, as it goes.

It helps to separate three ways an AI system can change after release:

1. **Frozen.** The model never changes once shipped. A new version means the developer trains it again, tests it again and releases it again. Most systems today work this way.
2. **Periodic retraining.** The developer collects new data and retrains on a schedule, say every quarter. Each retrained version can still be tested before it goes out, because a person decides when to release it.
3. **Continuous learning.** The system updates itself from live data, without a person approving each update. This is what the Act means by a system that "continues to learn" after it is placed on the market.

The third kind is the hard case, and it is the subject of this post. Four scenarios show what it looks like in practice.

**Scenario A: the X ray reader.** A tool flags possible pneumonia on chest X rays. When a radiologist rejects a flag, the tool lowers its confidence on images like that one. Over months it becomes better tuned to that hospital's machines and patients. It may also become worse on patients that hospital rarely sees, and nobody would notice until one of them is missed.

**Scenario B: the loan model.** A lender's model updates itself as loans are repaid or defaulted. But it only ever learns from people it approved. Anyone it rejected never gets a loan, so it never learns whether they would have repaid. If it starts out a little too strict with one group, it never receives the evidence that would correct it. The mistake becomes permanent.

**Scenario C: the hiring screen.** A tool ranks job applicants and learns from which candidates recruiters click on. If recruiters favour graduates of a few universities, the tool learns to rank those graduates higher, recruiters then see more of them, and click on more of them. The tool and the recruiters push each other in the same direction.

**Scenario D: the coding assistant.** A coding assistant learns from which suggestions developers accept. Developers under deadline accept suggestions that make tests pass quickly, including ones that skip a safety check. The assistant learns that skipping checks is what people want.

Scenarios B and C show the pattern that matters most: **the system's own outputs shape the data it learns from next.** This is called a feedback loop, and it is the main reason learning systems are harder to check than frozen ones. Scenarios A and D show a second pattern: the system can drift toward what is easy to reward in daily use, away from what was tested.

One more case is worth naming, because it is growing fast. Many AI agents now keep a memory of past conversations and use it to shape future answers, without any change to the model itself. Strictly, that is not "learning" in the training sense. But from the user's side, the agent behaves differently in month six than it did in month one, and the evaluation done at release no longer describes it fully. Whether the Act treats this as a system that "continues to learn" is not settled.

## Step 2: How the Act checks a system that does not change

The Act's checks apply in full only to **high risk** systems: those used in areas such as hiring, credit, education, critical infrastructure and law enforcement (Annex III), or built into products already regulated for safety, such as medical devices (Annex I). A coding assistant or a general chatbot is usually not high risk, so most of what follows would not apply to it at all. Keep that in mind; it comes back later.

For a high risk system, the path to market looks like this:

1. **Manage risk across the whole life of the system.** The provider must run a risk management process that is "continuous" and "iterative", reviewed and updated over the system's lifetime ([Art. 9](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-9)). It must identify foreseeable risks, including from foreseeable misuse, and adopt measures against them.
2. **Test before release.** Testing must happen before the system is placed on the market, measured against "prior defined metrics and probabilistic thresholds" that fit its purpose (Art. 9(8)). In plain words: decide in advance what good enough looks like, then show the system meets it.
3. **Use suitable data.** Training, validation and test data must meet quality rules, including checks for bias (Art. 10).
4. **Write it all down.** Technical documentation must exist before release and be kept up to date ([Art. 11](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-11)). [Annex IV](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-4) lists what goes in it: how the system was built and tested, its accuracy for the groups it is meant for, its foreseeable failures, and the plan for monitoring it after release.
5. **Build in logging, transparency, oversight and robustness.** The system must record events automatically over its lifetime ([Art. 12](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)), come with clear instructions including its accuracy levels (Arts. 13 and 15), allow effective human oversight (Art. 14), and stay accurate, robust and secure "throughout their lifecycle" ([Art. 15](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-15)).
6. **Run a quality management system.** This includes procedures for managing changes to the system, and test procedures before, during and after development ([Art. 17](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-17)).
7. **Pass a conformity assessment.** For most Annex III systems this is **internal control**: the provider checks its own quality system and documentation, with no outside body involved ([Art. 43(2)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43), [Annex VI](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-6)). An independent notified body is involved only for some biometric systems, and for products like medical devices, which go through their own sector's procedure.
8. **Declare, mark and register.** The provider signs a declaration of conformity, adds the CE mark and registers the system in an EU database (Arts. 47 to 49).
9. **Watch it after release.** The provider must "actively and systematically" collect and analyse performance data for the system's whole lifetime, following a written monitoring plan ([Art. 72](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-72)), and report serious incidents within fixed deadlines: 15 days in general, 10 days for a death, 2 days for the most serious cases ([Art. 73](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-73)).
10. **Check again after a big change.** If the system later undergoes a **substantial modification**, it needs a new conformity assessment (Art. 43(4)). A substantial modification is a change the provider did not foresee or plan in the first assessment, which affects compliance or changes the system's intended purpose ([Art. 3(23)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3)).

The logic is sound for a frozen system. Steps 1 to 8 establish that one specific version is fit for purpose. Step 9 catches problems that only show up in real use. Step 10 makes sure a meaningfully different version gets checked again.

Two facts about timing. These obligations do not apply yet: after the Digital Omnibus amendment, they start on 2 December 2027 for Annex III systems and 2 August 2028 for systems built into regulated products ([CASRAI](https://www.casrai.org/news/eu-ai-act-digital-omnibus-deadline-delay)). And the Commission's template for the monitoring plan is due by 2 September 2027 (Art. 72(3)), so the details of step 9 are still being written.

## Step 3: What the Act adds for systems that keep learning

The Act does not ignore learning systems. Its very definition of an AI system says it "may exhibit adaptiveness after deployment" ([Art. 3(1)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3)). It handles them with one central rule and a handful of supporting duties.

### The central rule: describe the changes in advance

Under Step 2, a big change triggers a new conformity assessment. For a system that learns, that would mean a new assessment every time it updates, which is unworkable. So the Act makes an exception.

For a high risk system that keeps learning after release, changes to the system and its performance that the provider **predetermined at the initial conformity assessment**, and recorded in the technical documentation, do **not** count as a substantial modification ([Art. 43(4)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43), second paragraph). Recital 128 adds that such changes must have been "assessed at the moment of the conformity assessment" ([Recital 128](https://ai-act-law.eu/recital/128/)).

The documentation must contain, where applicable, "a detailed description of pre-determined changes to the AI system and its performance", together with the technical solutions used to keep the system compliant as it changes ([Annex IV, point 2(f)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-4)).

Put simply: before release, the provider draws a boundary around how the system is allowed to change. Changes inside that boundary need no new check. Changes outside it count as a new system. In this post I call that boundary the **change envelope**.

<figure class="figure" style="margin: 2em 0">
<svg viewBox="0 0 760 430" role="img" aria-label="A learning system skips reassessment only while it stays inside its envelope" font-size="13" style="display: block; width: 100%; height: auto; font-family: var(--sans)">
<defs><marker id="env-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill: var(--mute)"/></marker></defs>
<text x="24" y="30" font-size="15" font-weight="600" style="fill: var(--ink)">A learning system skips reassessment only while it stays inside its envelope</text>
<g fill="none" stroke-width="1.25" style="stroke: var(--mute)">
<path d="M240 96H300" marker-end="url(#env-arrow)"/>
<path d="M400 132V184" marker-end="url(#env-arrow)"/>
<path d="M480 230H545" marker-end="url(#env-arrow)"/>
<path d="M640 194V96H500" marker-end="url(#env-arrow)"/>
<path d="M400 276V334" marker-end="url(#env-arrow)"/>
</g>
<g fill="none" stroke-width="1.25" style="stroke: var(--mute)">
<rect x="40" y="60" width="200" height="72" rx="8"/>
<rect x="300" y="60" width="200" height="72" rx="8"/>
<rect x="545" y="194" width="190" height="72" rx="8"/>
<rect x="280" y="334" width="240" height="72" rx="8"/>
</g>
<polygon points="320,230 400,184 480,230 400,276" stroke-width="2" style="fill: var(--brown); fill-opacity: 0.14; stroke: var(--brown)"/>
<g text-anchor="middle">
<text x="140" y="84" font-weight="600" style="fill: var(--ink)">Assessed once</text>
<text x="140" y="102" font-size="11.5" style="fill: var(--mute)">Provider declares the</text>
<text x="140" y="118" font-size="11.5" style="fill: var(--mute)">change envelope (Annex IV)</text>
<text x="400" y="84" font-weight="600" style="fill: var(--ink)">Learns from live use</text>
<text x="400" y="102" font-size="11.5" style="fill: var(--mute)">Updates itself as</text>
<text x="400" y="118" font-size="11.5" style="fill: var(--mute)">people use it</text>
<text x="400" y="227" font-weight="600" style="fill: var(--ink)">Inside the</text>
<text x="400" y="243" font-weight="600" style="fill: var(--ink)">envelope?</text>
<text x="640" y="218" font-weight="600" style="fill: var(--ink)">No new assessment</text>
<text x="640" y="236" font-size="11.5" style="fill: var(--mute)">Monitoring only</text>
<text x="640" y="252" font-size="11.5" style="fill: var(--mute)">(Art. 72)</text>
<text x="400" y="358" font-weight="600" style="fill: var(--ink)">Substantial modification</text>
<text x="400" y="376" font-size="11.5" style="fill: var(--mute)">New conformity assessment</text>
<text x="400" y="392" font-size="11.5" style="fill: var(--mute)">(Art. 43(4))</text>
<text x="512" y="222" font-size="11.5" style="fill: var(--mute)">yes</text>
</g>
<line x1="196" y1="230" x2="316" y2="230" stroke-width="1" stroke-dasharray="4 4" style="stroke: var(--mute)"/>
<text x="40" y="216" font-weight="600" style="fill: var(--ink)">Who decides?</text>
<text x="40" y="234" font-size="11.5" style="fill: var(--mute)">Mostly the provider,</text>
<text x="40" y="250" font-size="11.5" style="fill: var(--mute)">under internal control</text>
<text x="650" y="143" font-size="11.5" style="fill: var(--mute)">keeps</text>
<text x="650" y="159" font-size="11.5" style="fill: var(--mute)">learning</text>
<text x="412" y="306" font-size="11.5" style="fill: var(--mute)">no</text>
</svg>
<figcaption style="margin-top: 10px; font-family: var(--sans); font-size: 0.85rem; line-height: 1.5; color: var(--mute)">Every update inside the declared envelope skips reassessment and is only monitored. Only a change outside it triggers a new check, and for most systems the provider decides which side of the line a change falls on.</figcaption>
</figure>

### The supporting duties

1. **Guard against feedback loops.** A system that keeps learning must be built to remove or reduce, as far as possible, the risk that biased outputs feed into future inputs, and any such loops must be "duly addressed with appropriate mitigation measures" ([Art. 15(4)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-15)). This is the only place the Act names the mechanism behind Scenarios B and C.
2. **Stay accurate for the whole lifecycle.** Accuracy, robustness and security must hold "throughout their lifecycle" (Art. 15(1)), not just on release day.
3. **Keep logs that can reveal a change.** Logging must support identifying when a system "has been substantially modified" ([Art. 12](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)).
4. **Monitor in use.** The monitoring plan from Step 2 applies, with the stated purpose of checking that the system keeps meeting its requirements ([Art. 72](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-72)).
5. **Keep the paperwork current.** Technical documentation must be kept up to date ([Art. 11](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-11)).

### What is still missing

The Act states the rule but not how to apply it. Two pieces of guidance would fill that in, and neither exists yet:

- **Guidelines on substantial modification.** The Commission must issue them ([Art. 96(1)(c)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-96)). As of its last update on 31 July 2026, the Commission listed them as "in preparation" with no date ([European Commission](https://digital-strategy.ec.europa.eu/en/news/supporting-implementation-ai-act-clear-guidelines)).
- **Guidance on what a valid change plan looks like.** For medical devices, the EU's device regulators have said such guidance is expected and will likely draw on the international Predetermined Change Control Plan model, but none exists yet ([Hogan Lovells, June 2026](https://www.hlc.com/en/publications/conformity-assessment-of-continuously-learning-aibased-medical-devices-in-the-eu)).

The closest working model is the US. The FDA's final guidance of December 2024 asks for a change plan with three parts: a description of the planned changes (including whether they happen automatically), a protocol for how each change is developed, validated and rolled out against acceptance criteria set in advance, and an assessment of the risks and benefits ([Foley](https://www.foley.com/insights/publications/2025/01/fda-final-guidance-ai-device-software-predetermined-change-control-plan/)). The EU text asks for the first part. It says much less about the second and third.

## Step 4: Why this may not be enough

The change envelope is a reasonable idea, borrowed from medical device regulation. But it rests on assumptions that hold for slow, controlled updates and break down for systems that learn from live users. Here are nine places where the gap shows.

### 1. The envelope is described, not proven

The Act asks for a "detailed description" of predetermined changes ([Annex IV, 2(f)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-4)). A description is a promise about the future. Nothing in the text requires the provider to show, for each update, that the new version actually stayed inside the promise. The FDA's model asks for exactly that: a protocol with acceptance criteria that each change must pass before it rolls out ([Foley](https://www.foley.com/insights/publications/2025/01/fda-final-guidance-ai-device-software-predetermined-change-control-plan/)). The EU text leaves this step to guidance that does not exist yet.

### 2. You can plan how a system learns, not what it learns

A provider controls the update rule: what data counts, how often the system updates, how far one update can move it. The provider does not control the data, because the data comes from users. "The model retrains weekly on confirmed outcomes" is a fully predetermined process. Whether it ends up fair to one group of loan applicants is not predetermined at all; it depends on who applies and who gets approved. The Act's envelope can only be written in terms of the process, but the harms show up in the outcome.

### 3. The provider draws the envelope and checks it

For most high risk systems, conformity assessment is internal control: the provider assesses itself, and no outside body reviews the plan ([Art. 43(2)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43), [Annex VI](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-6)). That creates a quiet incentive. The wider the envelope, the fewer changes ever count as substantial, and the fewer new assessments are needed. A loosely written envelope can exempt almost everything. Even in medical devices, where notified bodies are involved, lawyers expect the exemption to cover only gradual changes, and say notified bodies may read it strictly ([Hogan Lovells](https://www.hlc.com/en/publications/conformity-assessment-of-continuously-learning-aibased-medical-devices-in-the-eu)). For most Annex III systems there is no such reader.

### 4. Small steps add up

The definition of substantial modification looks at "a change" ([Art. 3(23)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3)). A learning system makes thousands of small changes, none of which looks substantial alone. Added together, they can move the system far from the version that was tested. The Act has no explicit rule for this cumulative drift: no point at which the sum of many small, planned changes counts as a new system.

### 5. Feedback loops corrupt the evidence the monitoring relies on

Post market monitoring means collecting performance data from real use ([Art. 72](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-72)). For a learning system, that data is partly produced by the system's own decisions. Researchers call this the **selective labels** problem: outcomes are only observed for the cases a decision allowed, as when a defendant's return to court is only seen if a judge granted bail ([Lakkaraju et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5958915)). More broadly, predictions that people act on change the very outcomes they predict ([Perdomo et al., 2020](https://arxiv.org/abs/2002.06673v4)), and engineers have long warned that such hidden loops are hard to detect in practice ([Sculley et al., 2015](https://proceedings.neurips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf)).

In Scenario B, the monitoring data is silent about exactly the people the model wrongly rejects. Monitoring can look clean while the harm grows. Article 15(4) does name feedback loops, but only for "biased outputs", and only to reduce them "as far as possible" ([Art. 15(4)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-15)). It does not cover loops like Scenario D, where the system learns to please users at the cost of safety.

### 6. Better on average, worse for someone

Neural networks that learn new things in sequence tend to lose what they learned earlier, a well documented effect called catastrophic forgetting ([Kirkpatrick et al., 2017](https://arxiv.org/abs/1612.00796)). At release, the Act asks for accuracy figures for the specific groups the system serves ([Annex IV, point 3](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-4)). After release, monitoring that tracks overall performance can show steady improvement while accuracy falls for a group the system now rarely sees, as in Scenario A. Nothing in the text requires those group level figures to be measured again after each change.

### 7. Tests set in advance cannot see new behaviour

Testing before release uses metrics and thresholds defined beforehand ([Art. 9(8)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-9)). That is right for a fixed system. A learning system can develop behaviour nobody thought to test for, because it did not exist yet. The problem is getting worse even for frozen systems: the International AI Safety Report 2026 found that models increasingly tell test settings apart from real use, so problems can go undetected before deployment ([International AI Safety Report 2026](https://arxiv.org/abs/2602.21012)). A test passed before release says even less about a system that has since changed.

### 8. Incident rules assume the system stands still

After a serious incident, the provider must not alter the system in a way that could affect the later analysis of its cause without first informing the authorities ([Art. 73](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-73)). A system that learns continuously alters itself by default. Unless updates are paused, or every version is saved, the version that caused the harm may be gone by the time anyone investigates. The logging duty records "events" ([Art. 12](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)); it does not clearly require keeping each version of the model so it can be run again.

### 9. Much of the learning happens outside the rules

All of the above applies only to high risk systems. Coding assistants, general chatbots and agents that build up memory of their users are mostly outside that net, yet they are where continuous adaptation is spreading fastest. Scenario D would face none of these checks. General purpose model providers have their own duties, including keeping a safety report up to date ([Code of Practice](https://artificialintelligenceact.eu/ai-act-explorer/cop-home)), but those are written around documenting a model, not a model whose behaviour shifts every day.

## Step 5: What better evidence could look like

None of these gaps means the envelope idea is wrong. They mean a description is not enough on its own. What is missing is evidence, gathered as the system changes, that it is still the system that was approved. These are my proposals, not requirements in the Act; most could fit inside the guidance the Commission still has to write.

| Idea | What it means in practice | Gap it addresses |
| --- | --- | --- |
| Save every version | Keep a copy of each model version that served real users, so any past decision can be run again and examined | 8 |
| Gate each update | Rerun a fixed test set, including results for each user group, before an update goes live, and block it if it fails thresholds set in advance | 1, 6 |
| Set a drift budget | Measure how far the current version has moved from the assessed one on a fixed reference set; past a set limit, treat the sum of changes as a substantial modification | 4 |
| Keep a control version | Run the originally assessed version alongside the learning one on a small share of cases, so there is always a fair comparison | 5, 7 |
| Collect the missing outcomes | Where decisions hide outcomes, as with rejected loan applicants, gather outcome data for a small sample that the system did not choose | 5 |
| Write the envelope in outcomes | State limits on results, such as the largest allowed drop in accuracy for any group, not only on how the system updates | 2 |
| Have someone else read the plan | Even under internal control, have an independent party review the change plan and the drift evidence | 3 |
| Count memory as learning | Treat agents that adapt through stored memory or personalisation as systems that continue to learn, for scoping purposes | 9 |

The common thread: for a system that keeps changing, approval should depend on a running record of evidence, not a single moment of testing. The Act already points this way with lifecycle risk management and monitoring. It stops short of saying what that record must contain.

## Closing: evaluated once, learning forever

The EU AI Act sees the problem. It defines AI systems as things that may adapt after deployment, it gives learning systems a way to change without endless reassessment, and it names feedback loops as a risk. That is more than most laws do.

But its answer is a plan written before release, checked mostly by the people who wrote it. For a system that learns from live users, the plan can describe how it will learn, not what it will become. The evidence that would show whether it stayed safe, such as saved versions, group level results after every update and a measure of total drift, is not yet required anywhere in the text. The guidance that could require it is still being written, and the rules themselves only start applying in December 2027. That makes now the right time to argue about what it should say.

The questions I keep coming back to:

- How should a change plan be written for a system that learns from users, so that it limits outcomes and not just the update process?
- How much total drift should count as a new system, and on what measure?
- What should a provider have to keep so that an investigator can replay the exact version that caused harm?
- Should agents that adapt through memory, without retraining, count as systems that continue to learn?

## References

**The AI Act (Regulation (EU) 2024/1689), via the European Commission's AI Act Service Desk**

- [Article 3: Definitions](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3), points (1) AI system and (23) substantial modification
- [Article 9: Risk management system](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-9)
- [Article 11: Technical documentation](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-11)
- [Article 12: Record keeping](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)
- [Article 15: Accuracy, robustness and cybersecurity](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-15)
- [Article 17: Quality management system](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-17)
- [Article 43: Conformity assessment](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43)
- [Article 72: Post market monitoring](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-72)
- [Article 73: Reporting of serious incidents](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-73)
- [Article 96: Commission guidelines](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-96)
- [Annex IV: Technical documentation](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-4)
- [Annex VI: Internal control](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-6)
- [Recital 128](https://ai-act-law.eu/recital/128/)
- [General Purpose AI Code of Practice](https://artificialintelligenceact.eu/ai-act-explorer/cop-home)

**Implementation and comparison**

- European Commission, [Supporting the implementation of the AI Act with clear guidelines](https://digital-strategy.ec.europa.eu/en/news/supporting-implementation-ai-act-clear-guidelines), updated 31 July 2026
- CASRAI, [EU AI Act Digital Omnibus deadline delay](https://www.casrai.org/news/eu-ai-act-digital-omnibus-deadline-delay)
- Hogan Lovells, [Conformity assessment of continuously learning AI based medical devices in the EU](https://www.hlc.com/en/publications/conformity-assessment-of-continuously-learning-aibased-medical-devices-in-the-eu), June 2026
- Foley, [FDA's final guidance for Predetermined Change Control Plans](https://www.foley.com/insights/publications/2025/01/fda-final-guidance-ai-device-software-predetermined-change-control-plan/), January 2025

**Research**

- Ferrario and Hatherley, [Update Opacity: Epistemic Accessibility and Governance Under AI System Change](https://arxiv.org/pdf/2606.00037), 2026
- Lakkaraju et al., [The Selective Labels Problem](https://pmc.ncbi.nlm.nih.gov/articles/PMC5958915), KDD 2017
- Perdomo et al., [Performative Prediction](https://arxiv.org/abs/2002.06673v4), ICML 2020
- Kirkpatrick et al., [Overcoming catastrophic forgetting in neural networks](https://arxiv.org/abs/1612.00796), PNAS 2017
- Sculley et al., [Hidden Technical Debt in Machine Learning Systems](https://proceedings.neurips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf), NeurIPS 2015
- Bengio et al., [International AI Safety Report 2026](https://arxiv.org/abs/2602.21012)
