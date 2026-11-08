## The problem of unwarranted actions

Much of the work on agent safety asks whether a model will refuse a harmful request. A quieter and, for coding agents, more common failure begins with a perfectly harmless request. An agent asked to fix a failing test deletes a directory it considers stale, rewrites the test so that it passes, or upgrades a library on the way to a solution. None of these actions is dangerous in the abstract, and each might be exactly right for some other task. What makes them failures is that the task in front of the agent did not call for them.

[AgentSpec](https://arxiv.org/abs/2503.18666), by Haoyu Wang, Christopher M. Poskitt and Jun Sun of Singapore Management University, is one of the most concrete proposals for controlling what LLM agents do while they run, and it will appear at ICSE 2026. Its central idea is that safety constraints can be written in advance, in a small domain specific language, and enforced at runtime independently of the model. This essay examines that idea closely, with a focus on coding agents, and asks how far it can reach when the harm in question depends on the goal of the task rather than on the action itself.

## How AgentSpec works

AgentSpec places a layer of rules between the agent and its tools. Every action the agent proposes is checked against those rules before it runs, and the rules live outside the model, so their verdict does not depend on the model's judgment and does not vary from one run to the next.

Each rule has a simple structure. It opens with a trigger, the event that brings the rule into play. A trigger can be any action, a change in the agent's state, the moment the agent declares that it has finished, or a call to a specific tool; for a coding agent the main trigger is `PythonREPL`, which fires whenever the agent is about to execute code. The trigger is followed by one or more checks, which are Boolean predicates over the proposed action and the current state, and the rule fires only when all of them hold. The paper's examples include `is_destructive_cmd`, which looks for commands such as `rm`, and `request_untrusted_source`, which tests whether a URL falls outside an allow list. Finally, the rule names an enforcement: `stop` ends the trajectory, `user_inspection` pauses and asks a person to approve or reject the action, `llm_self_examine` prompts the model to reflect on the violation and propose a correction, and `invoke_action` runs a predefined corrective step.

A rule for a coding agent, adapted from the paper, reads as follows:

```
rule @inspect_print_untrusted_source
trigger PythonREPL
check
  request_untrusted_source
  write_to_io
enforce
  user_inspection
end
```

In plain terms, if the agent is about to run code that fetches content from a site outside the allow list and writes that content to a file or to the screen, execution pauses until a user decides whether to allow it.

The implementation is built on LangChain and intercepts the agent loop at three points: immediately before an action executes, immediately after its result is observed, and when the agent signals completion. Predicates are ordinary Python functions, written either by a developer or by an LLM prompted with a description of the agent and a few examples. The authors emphasise two strengths of this design. The rules are interpretable, since anyone can read what is being enforced, and they are deterministic, which the paper contrasts with guard systems such as GuardAgent that rely on an LLM to interpret safety policies at runtime.

<figure class="figure" style="margin: 2em 0">
<svg viewBox="0 0 760 370" role="img" aria-label="AgentSpec checks every proposed action against fixed rules before it runs" font-size="13" style="display: block; width: 100%; height: auto; font-family: var(--sans)">
<defs><marker id="as-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill: var(--mute)"/></marker></defs>
<text x="24" y="28" font-size="15" font-weight="600" style="fill: var(--ink)">AgentSpec checks every proposed action against fixed rules before it runs</text>
<g fill="none" stroke-width="1.25" style="stroke: var(--mute)">
<path d="M185 130H215" marker-end="url(#as-arrow)"/>
<path d="M355 130H395" marker-end="url(#as-arrow)"/>
<path d="M535 130H570" marker-end="url(#as-arrow)"/>
<path d="M465 170V256" marker-end="url(#as-arrow)"/>
<path d="M285 170V280H390" marker-end="url(#as-arrow)"/>
<path d="M465 304V332H105V158" marker-end="url(#as-arrow)"/>
</g>
<rect x="25" y="102" width="160" height="56" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="105" y="126" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Model proposes</text>
<text x="105" y="144" font-weight="600" text-anchor="middle" style="fill: var(--ink)">an action</text>
<polygon points="215,130 285,90 355,130 285,170" fill="none" stroke-width="1.25" style="stroke: var(--mute)"/>
<text x="285" y="126" text-anchor="middle" style="fill: var(--ink)">Rule trigger</text>
<text x="285" y="143" text-anchor="middle" style="fill: var(--ink)">matches?</text>
<polygon points="395,130 465,90 535,130 465,170" fill="none" stroke-width="1.25" style="stroke: var(--mute)"/>
<text x="465" y="126" text-anchor="middle" style="fill: var(--ink)">All checks</text>
<text x="465" y="143" text-anchor="middle" style="fill: var(--ink)">true?</text>
<rect x="570" y="78" width="160" height="104" rx="8" stroke-width="2" style="fill: var(--brown-soft); stroke: var(--brown)"/>
<text x="586" y="102" font-weight="600" style="fill: var(--ink)">Enforce</text>
<text x="586" y="122" font-size="11.5" style="fill: var(--ink); font-family: ui-monospace, monospace">stop</text>
<text x="586" y="138" font-size="11.5" style="fill: var(--ink); font-family: ui-monospace, monospace">user_inspection</text>
<text x="586" y="154" font-size="11.5" style="fill: var(--ink); font-family: ui-monospace, monospace">llm_self_examine</text>
<text x="586" y="170" font-size="11.5" style="fill: var(--ink); font-family: ui-monospace, monospace">invoke_action</text>
<rect x="390" y="256" width="150" height="48" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="465" y="284" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Action runs</text>
<text x="375" y="122" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">yes</text>
<text x="552.5" y="122" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">yes</text>
<text x="293" y="220" font-size="11.5" style="fill: var(--mute)">no</text>
<text x="473" y="210" font-size="11.5" style="fill: var(--mute)">no</text>
<text x="285" y="350" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">result fed back to the model</text>
</svg>
<figcaption style="margin-top: 10px; font-family: var(--sans); font-size: 0.85rem; line-height: 1.5; color: var(--mute)">A rule acts only when its trigger matches and every one of its checks holds. Every other action runs without any further scrutiny.</figcaption>
</figure>

## AgentSpec on coding agents

For coding agents, the paper's abstract reports that AgentSpec prevents unsafe executions in over 90% of cases at negligible runtime cost. The result is real, but it is worth being precise about what was tested.

The agent is built on CodeAct, a framework in which the model acts by writing and executing Python. The evaluation uses [RedCode-Exec](https://arxiv.org/abs/2411.07781), a benchmark of 25 risk categories with 30 risky instructions each, 750 in total. The categories cover behaviour such as posting sensitive files online, installing untrusted packages, opening a reverse shell, reading, copying or deleting sensitive files, unsafe deserialization and buggy regular expressions. The authors wrote one rule per category, 25 in all, and shared predicates across rules where they could.

The agent attempted to execute code in 24 of the 25 categories, and in most of them the rules correctly flagged the risky behaviour. In two categories, missing default cases and duplicate keys in associative lists, no violations were flagged, and a manual check showed that the agent had not actually carried out the risky instruction. Most flagged actions were then rejected during user inspection, although some were permitted once a person looked at them; all 24 flagged cases of unsafe deserialization, for instance, were allowed because the code turned out to be harmless. The overhead is very small: evaluating predicates took about 2.83 ms on average, against code agent runs that lasted about 25.4 seconds.

The authors also tested whether rules could be generated automatically. OpenAI's o1 was given a description of the agent and 10% of the risky examples, and the rules it produced enforced safety on 87.26% of the risky code it had not seen. The paper is candid about the failures: the generated rules tended to overfit, recognising only the sensitive file paths that appeared in the examples.

One feature of the benchmark matters a great deal for the rest of this discussion. Every instruction in RedCode-Exec is risky on its face. The user asks the agent to do something harmful, such as deleting a system file, and the evaluation asks whether the harmful code is executed. The danger sits in the request and is visible in the code. That is a fair test of a guardrail, but it is a different situation from the one described at the start of this essay, where the request is benign and the harm emerges along the way.

## Can every risk be specified in advance?

AgentSpec rests on an assumption that is easy to miss: the person writing the rules must anticipate, before the agent ever runs, both which actions could cause harm and the circumstances in which they would. For a short list of known catastrophes, such as reverse shells or the exfiltration of credentials, that assumption holds well. For the broader class of actions that are simply not warranted by the task at hand, it does not, and the difficulty is not one that better rules or a more careful rule writer can remove.

The first obstacle is the size of the action space. A coding agent with a shell and an interpreter can do anything a program can do, and even a single kind of harm can be expressed in an open ended number of ways. Destroying data can mean `rm`, `shutil.rmtree`, `os.remove`, `git clean -fdx` or `git checkout -- .`, but it can equally mean opening a file in write mode, redirecting output over it with `>`, or running a `sed -i` that empties it. A predicate that inspects source code for particular patterns is, in effect, chasing spellings. The authors acknowledge part of this when they note that data flow analysis could make `request_untrusted_source` more accurate.

The second obstacle is more fundamental. Whether an action is acceptable is often not a property of the action at all. Deleting `build/` is appropriate when the task is to clean the build and inappropriate when the task is to fix a typo. Editing a test file is correct when the task is to update the tests for a new interface and wrong when the task is to make a failing test pass. The property that matters is a relation among three things: the proposed action, the current state of the project and the goal of this particular task. A rule written in advance can observe the first two, but it knows the goal only insofar as its author imagined it.

A rule that ignores context therefore fails in one of two directions. If it is broad, flagging every use of `rm` for example, it interrupts the user for countless harmless cleanups, and the user soon learns to approve everything, at which point inspection no longer protects anyone. If it is narrow, flagging only the dangerous cases its author thought of, everything else passes, including the action that happens to matter in a given session.

In fairness to the paper, nothing in AgentSpec prevents a developer from writing a predicate that reasons about the task. Predicates are arbitrary Python, so one could call a model and ask whether the proposed action is needed for the stated goal. Doing so, however, moves the difficult judgment inside the predicate and gives up the determinism that the paper presents as its main advantage over LLM based guards. The `llm_self_examine` enforcement does not close the gap either, because it is an enforcement rather than a check: it runs only after a rule has fired, which means the model is invited to reason only where a risk had already been predicted.

## A case the rules cannot catch

A small example makes the problem concrete. Suppose a coding agent receives the following task:

> `test_parse_date` started failing after we switched to timezone aware timestamps. Fix `parse_date` in `src/utils/dates.py` so the test passes.

The developer also has uncommitted work in progress in two other files under `src/`. Over the course of the session, the agent reads the test, runs it and proposes the five actions listed below. To give AgentSpec a fair chance, assume it is configured with exactly the rules a careful developer would write after reading the paper: one that flags destructive commands such as `rm`, one that flags installation of untrusted packages, and one that flags reading or transmitting sensitive files.

| # | Proposed action | Does a sensible rule fire? | Warranted by this task? |
| --- | --- | --- | --- |
| 1 | Edit `parse_date` to handle timezone aware input | No | Yes. This is the fix. |
| 2 | `rm -rf .pytest_cache` to clear stale results | Yes, `is_destructive_cmd` | Yes. It is harmless and easy to recreate. |
| 3 | Change the expected value in `tests/test_dates.py` to match what the function now returns | No. Writing a repo file is normal. | No. It hides the bug, and the task said fix `parse_date`. |
| 4 | `git checkout -- src/` to "start from a clean state" | Only if someone wrote a git rule | No. It silently wipes the developer's unsaved work. |
| 5 | `pip install -U python-dateutil`, then bump the pin in `requirements.txt` | No. The package is on any allow list. | No. It changes the environment for everyone without asking. |

The outcome is the reverse of what was intended. The rule set interrupts the one harmless action, the cache cleanup, and allows all three harmful ones. Nothing is wrong with the rules as written; they simply answer a different question. They ask whether an action is dangerous in general, whereas the question that matters here is whether this task requires it.

It is tempting to respond by adding rules. One could add a rule for `git checkout`, then further rules for `git reset`, `git stash drop` and `git clean`, and then a rule against editing test files. That last rule would be wrong the following day, when the task really is to update the tests. Each patch is either too specific to generalise or too general to leave the agent free to work. The third action shows the limit most clearly. No predicate that looks only at the action can separate a legitimate update to a test from a test rewritten to conceal a bug, because the difference between them exists only in the goal of the task.

## Toward enforcement that reasons about the goal

If the property that matters is whether an action serves the task, enforcement has to be able to ask that question of each action as it is proposed. Fixed rules still have a place in such a design, but as a floor beneath it rather than as the whole of it. One way to arrange this is in three layers.

The first layer is a deterministic floor of rules, in the style of AgentSpec, for the small set of actions that are never acceptable in a session, such as opening a reverse shell or sending credentials off the machine. Here determinism is exactly the right property, and a cost of a few milliseconds per check is easily justified.

The second layer is a scope written for each task before the agent begins. It is derived only from trusted inputs, namely the user's request and the layout of the repository, and it states what the task may touch. This follows the approach of [Conseca](https://arxiv.org/abs/2501.17070), which generates a security policy for each task using a model that never sees untrusted content. For the example above, a reasonable scope would allow writes to `src/utils/dates.py`, allow reading anywhere, leave the tests unchanged, forbid git operations that discard work and forbid changes to dependencies. A deterministic enforcer checks every action against this scope, so the great majority of actions are approved in milliseconds.

The third layer is a warrant check that runs only when an action falls outside the scope. A separate model is given the original task, the plan so far, the proposed action and a preview of the action's actual effects, computed by the system rather than described by the agent: which files would change, what would be deleted and what would leave the sandbox. It considers whether the goal requires this effect, whether a smaller action would accomplish the same step, whether the effect can be undone and whether it touches anything the task did not mention. Its answer is to allow the action, to refer it to the user, or to propose a smaller alternative.

<figure class="figure" style="margin: 2em 0">
<svg viewBox="0 0 760 340" role="img" aria-label="Only actions outside the task scope reach the model checker" font-size="13" style="display: block; width: 100%; height: auto; font-family: var(--sans)">
<defs><marker id="layer-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill: var(--mute)"/></marker></defs>
<text x="24" y="28" font-size="15" font-weight="600" style="fill: var(--ink)">Only actions outside the task scope reach the model checker</text>
<g fill="none" stroke-width="1.25" style="stroke: var(--mute)">
<path d="M180 120H205" marker-end="url(#layer-arrow)"/>
<path d="M365 120H390" marker-end="url(#layer-arrow)"/>
<path d="M550 120H575" marker-end="url(#layer-arrow)"/>
<path d="M285 156V236" marker-end="url(#layer-arrow)"/>
<path d="M470 156V236" marker-end="url(#layer-arrow)"/>
<path d="M655 156V232" marker-end="url(#layer-arrow)"/>
</g>
<rect x="20" y="84" width="160" height="72" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="36" y="108" font-weight="600" style="fill: var(--ink)">Proposed action</text>
<text x="36" y="128" font-size="11.5" style="fill: var(--mute)">from the agent</text>
<rect x="205" y="84" width="160" height="72" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="221" y="108" font-weight="600" style="fill: var(--ink)">1. Fixed floor</text>
<text x="221" y="128" font-size="11.5" style="fill: var(--mute)">rules for actions that</text>
<text x="221" y="144" font-size="11.5" style="fill: var(--mute)">are never allowed</text>
<rect x="390" y="84" width="160" height="72" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="406" y="108" font-weight="600" style="fill: var(--ink)">2. Task scope</text>
<text x="406" y="128" font-size="11.5" style="fill: var(--mute)">written from the user&#8217;s</text>
<text x="406" y="144" font-size="11.5" style="fill: var(--mute)">request and the repo</text>
<rect x="575" y="84" width="160" height="72" rx="8" stroke-width="2" style="fill: var(--brown-soft); stroke: var(--brown)"/>
<text x="591" y="108" font-weight="600" style="fill: var(--ink)">3. Warrant check</text>
<text x="591" y="128" font-size="11.5" style="fill: var(--ink)">model weighs the task,</text>
<text x="591" y="144" font-size="11.5" style="fill: var(--ink)">plan and real effects</text>
<rect x="205" y="236" width="160" height="48" rx="8" stroke-width="2" style="fill: none; stroke: var(--ink)"/>
<text x="285" y="264" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Stopped</text>
<rect x="390" y="236" width="160" height="48" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--brown)"/>
<text x="470" y="264" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Runs at once</text>
<rect x="575" y="232" width="160" height="56" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="655" y="256" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Allow, ask the user,</text>
<text x="655" y="274" font-weight="600" text-anchor="middle" style="fill: var(--ink)">or a smaller step</text>
<text x="192.5" y="72" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">passes</text>
<text x="377.5" y="72" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">passes</text>
<text x="562.5" y="72" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">outside scope</text>
<text x="293" y="190" font-size="11.5" style="fill: var(--mute)">a rule fires</text>
<text x="478" y="190" font-size="11.5" style="fill: var(--mute)">inside scope</text>
<text x="470" y="306" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">most actions end here</text>
</svg>
<figcaption style="margin-top: 10px; font-family: var(--sans); font-size: 0.85rem; line-height: 1.5; color: var(--mute)">The two cheap, deterministic layers handle almost every action. The model is consulted only when an action reaches beyond what the task was scoped to need.</figcaption>
</figure>

Applied to the example, this design behaves sensibly. The cache deletion produces an effect that the preview identifies as trivially recreatable, so it proceeds without interrupting anyone. The edit to the test file falls outside the scope, and the warrant check, seeing that the task asks for a fix to the function while the edit changes an assertion, blocks it and directs the agent back to the function. The `git checkout` would irreversibly discard uncommitted changes that the task does not require, so it is blocked. The dependency upgrade changes the environment beyond the scope, so the decision goes to the user.

The design carries real costs. The warrant checker is itself a language model and will sometimes be wrong. That is acceptable only because the alternative is not an absence of errors but rules that are confidently wrong in exactly the cases at issue; the checker's error rate can be measured, and its default under uncertainty should be to consult the user rather than to allow. The checker is also a target for attack. If it reads the agent's own account of what it is doing, a prompt injection that misled the agent can mislead the checker as well, so it should see the user's words and the effects computed by the system rather than the agent's narrative. A model call on every action would be slow and expensive, which is why the scope sits in the middle, limiting the warrant check to the small share of actions that cross it. Finally, some determinism is lost, since two runs may not receive the same verdict on a borderline action, but the fixed floor preserves that guarantee where it matters most.

## The limitations the authors acknowledge

The paper is open about its limitations, and read together they point to the same root cause: the rules see only the present moment, and someone has to write them.

The first limitation is that enforcement is deterministic and happens at discrete checkpoints, before an action, after its result and at completion. The authors present this as a source of reliability and interpretability, and for a floor of fixed rules it is. The same property, however, means that each check sees only what is in front of it. A checkpoint cannot recognise that the current action is the agent's fourth failed attempt at the same test, or that the agent has begun to look at the test file instead of the function.

The second limitation, and the one with the widest consequences, is that AgentSpec does not reason about the longer term effects of current actions. The authors state that it lacks trajectory based analysis and cannot estimate whether a sequence of actions will reach an unsafe state several steps later. Many of the harms that matter for coding agents accumulate across steps rather than arriving in one: scope that widens one file at a time, an agent that drifts toward shortcuts after repeated failure, or an early `git stash` that sets up a later loss. Each step passes inspection on its own, and the problem lies in the trajectory as a whole.

The third issue appears in the authors' discussion of threats to validity, which is the risk of overfitting. To limit it, they split each dataset in a ratio of 1:9 so that rules are written from a small sample and tested on the remainder, and they report that generated rules for code still latched onto the specific sensitive paths in the examples. This deserves a stronger reading than a quirk of the generator. Overfitting is what happens whenever rules about an open ended space are written from a handful of examples, and a human author overfits in the same way to the incidents they remember.

The fourth issue is the role of people in the evaluation. Whether a flagged action was genuinely unsafe was partly decided through user inspection, which is reasonable but makes the reported figures depend on the judgment of whoever approved or rejected each action.

Three further limits receive less attention in the paper but bear directly on the question of unwarranted actions. The evaluation reports no cost to usefulness for coding agents, although for embodied agents it does report that success on safe tasks fell from 58.62% to 54.26%; the alarm fatigue caused by broad rules cannot appear in a benchmark that contains only risky requests. The coding benchmark contains no benign requests at all, so the scenario in which a harmless task produces a harmful step is never tested. And predicates that inspect source code catch familiar commands such as `rm` but can be bypassed by any other call with the same effect. Data flow analysis, which the authors suggest, would narrow that gap, but it would still not reveal whether a deletion was needed.

## A Markov view of enforcement

The authors' proposed remedy for the second limitation is to learn, from past agent runs, how likely an agent is to reach an unsafe state from where it currently stands, and to intervene before it gets there. They have since developed this idea in a follow up paper, [ProbGuard](https://arxiv.org/abs/2508.00500), first released under the name Pro2Guard.

The approach has four parts. Each moment of an agent's execution is first reduced to a small abstract state, described by a vector of Boolean predicates such as whether the tests are failing or whether a file outside the scope has been edited; in ProbGuard these predicates are chosen by domain experts. The agent is then run many times, and the transitions between abstract states are counted and converted into probabilities, giving a discrete time Markov chain. ProbGuard smooths these counts so that a transition that is merely rare is not treated as impossible, and it samples enough runs to bound the error of the estimates. Experts then label which abstract states are unsafe. At runtime, the monitor computes from the current state the probability that execution will reach an unsafe state, and intervenes when that probability crosses a threshold. ProbGuard's main intervention is to tell the model its current state, the property at risk and the predicted probability, and to ask it to revise its plan; halting the agent outright proved too costly to task completion.

In the domains where it has been tested, the approach works. On embodied household tasks, the replanning variant reduced unsafe behaviour by 65.37% while preserving 80.4% of baseline task completion, and in autonomous driving it anticipated violations up to 38.66 seconds in advance. Coding agents were not among the domains evaluated.

For a coding agent, the predicates would need to track drift rather than individual dangerous commands. A plausible state could record whether the target test is still failing (`tests_failing`), whether three or more attempted fixes have failed (`attempts_ge_3`), whether a file outside the task scope has been edited (`scope_widened`), whether a test file, assertion, CI configuration or check script has been modified (`oracle_touched`), whether the developer has uncommitted changes and the agent has run a command capable of discarding them (`user_work_at_risk`), and whether dependency files or the environment have changed (`deps_changed`). The unsafe states would be those in which the oracle has been touched, dependencies have changed without approval, or user work has been lost. The value of the chain lies in learning the paths that lead toward those states. It might learn, for instance, that once `tests_failing` and `attempts_ge_3` hold together, the probability of reaching `oracle_touched` within a few steps rises sharply. A monitor could then intervene at the third failed attempt, before the test has been touched, by restating the goal to the agent or by handing the decision to the user. A fixed rule cannot issue that kind of warning, because at that point nothing has yet gone wrong.

<figure class="figure" style="margin: 2em 0">
<svg viewBox="0 0 760 300" role="img" aria-label="Repeated failure is the path toward a rewritten test" font-size="13" style="display: block; width: 100%; height: auto; font-family: var(--sans)">
<defs><marker id="drift-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill: var(--mute)"/></marker></defs>
<text x="24" y="28" font-size="15" font-weight="600" style="fill: var(--ink)">Repeated failure is the path toward a rewritten test</text>
<g fill="none" stroke-width="1.25" style="stroke: var(--mute)">
<path d="M170 120H215" marker-end="url(#drift-arrow)"/>
<path d="M365 120H410" marker-end="url(#drift-arrow)"/>
<path d="M290 96V68H95V96" marker-end="url(#drift-arrow)"/>
<path d="M95 144V226" marker-end="url(#drift-arrow)"/>
<path d="M485 144V226" marker-end="url(#drift-arrow)"/>
<path d="M445 144V185H290V226" marker-end="url(#drift-arrow)"/>
</g>
<line x1="560" y1="120" x2="584" y2="120" stroke-width="1.25" stroke-dasharray="4 4" style="stroke: var(--brown)"/>
<rect x="20" y="96" width="150" height="48" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="95" y="124" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Working on fix</text>
<rect x="215" y="96" width="150" height="48" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="290" y="124" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Fix attempt fails</text>
<rect x="410" y="96" width="150" height="48" rx="8" stroke-width="2" style="fill: var(--brown-soft); stroke: var(--brown)"/>
<text x="485" y="124" font-weight="600" text-anchor="middle" style="fill: var(--ink)">3 failed tries</text>
<rect x="20" y="226" width="150" height="48" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--brown)"/>
<text x="95" y="254" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Done: real fix</text>
<rect x="215" y="226" width="150" height="48" rx="8" stroke-width="1.25" style="fill: none; stroke: var(--mute)"/>
<text x="290" y="254" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Scope widens</text>
<rect x="410" y="226" width="150" height="48" rx="8" stroke-width="2" style="fill: none; stroke: var(--ink)"/>
<text x="485" y="254" font-weight="600" text-anchor="middle" style="fill: var(--ink)">Test rewritten</text>
<text x="192.5" y="60" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">retry</text>
<text x="103" y="189" font-size="11.5" style="fill: var(--mute)">test passes</text>
<text x="367.5" y="177" font-size="11.5" text-anchor="middle" style="fill: var(--mute)">goes outside scope</text>
<text x="493" y="209" font-size="11.5" style="fill: var(--mute)">edits the assertion</text>
<text x="592" y="116" font-size="11.5" style="fill: var(--ink)">Checker steps in here,</text>
<text x="592" y="132" font-size="11.5" style="fill: var(--ink)">before anything breaks</text>
</svg>
<figcaption style="margin-top: 10px; font-family: var(--sans); font-size: 0.85rem; line-height: 1.5; color: var(--mute)">Illustrative states for the parse_date task, without learned probabilities. The warning arrives at the third failed try, while the session is still recoverable. A rule that inspects individual actions could fire only at the final state, once the test is already being rewritten.</figcaption>
</figure>

The approach nonetheless faces four difficulties when applied to coding agents. The first is the Markov assumption itself, which holds that the next state depends only on the current one. A coding session carries considerable history, including what has been tried, what the error messages said and how the plan has shifted. Folding that history into the state makes the number of states grow rapidly, while leaving it out blurs the predictions.

The second difficulty is that the problem of foresight returns one level higher. Someone must still choose the predicates and label the unsafe states before the agent runs. The chain learns how states connect, but not which facts were worth tracking, so drift along a dimension that was never included in the state remains invisible to it.

The third is that whether a state is unsafe depends on the task. Touching the oracle is a violation when the task is to fix the function and the entire purpose when the task is to update the tests. Either the state must include the type of task, which divides the data into thin slices, or the chain learns an average that is wrong in both directions.

The fourth is data. Reliable estimates require many runs for each kind of repository and task, including many that end badly, and every update to the underlying model changes its habits and makes the learned probabilities stale.

The direction remains a promising one, because it replaces the question of whether an action is bad with the question of where a session is heading. For coding agents, its usefulness will depend on whether the abstract state describes the agent's position relative to the goal, and not only the commands it has issued.

## Detecting drift before it happens

Predicting the full future of a session is hard, but a more modest goal is within reach: watching for signals that tend to precede drift. Five such signals seem worth testing, presented here roughly in order of cost.

The first is growth in the agent's footprint. At the start of a task, one can record the files and resources it plausibly requires, namely those the task names and those the agent reads while exploring. After each step, the set of things the agent has actually changed is compared against that baseline. Drift typically first appears as the first write outside the set, well before anything harmful occurs. This signal is cheap to compute, deterministic, and easy to explain to a user, who can be told simply that the agent is now editing a file the task never mentioned.

The second signal is contact with the oracle. Some actions are risky not because of what they break but because they weaken our ability to tell whether the task was completed at all. Editing an assertion, deleting a failing test, adding a skip marker, relaxing a lint rule and modifying the CI configuration all interfere with the check that defines success. Any action that touches the success check should be treated as a strong sign of drift unless the task explicitly calls for it. In the earlier example, this signal catches the rewritten test without requiring any general rule about test files.

The third signal is repeated failure on the same target, a plausible precursor to shortcuts: an agent that cannot make a fix work begins to look for other ways to make the check pass. Counting failed attempts at the same test or error is straightforward. As the count rises, the bar for what counts as warranted can rise with it, and the monitor can intervene early, for example by asking the agent to restate the goal after three unsuccessful fixes before it takes another action. This is the pattern the Markov chain described above would learn, but a simple counter captures much of it without the chain.

The fourth signal is the length of the agent's chain of justification. The agent, or preferably a separate checker, can be asked to state in a sentence how the next action serves the user's goal, and the number of steps in that reasoning can be examined. Editing `parse_date` because the test fails is a single step. Upgrading a date library because its parser might handle timezones differently, which might in turn fix the test, involves several steps, each of them a guess. A lengthening chain suggests that the agent is wandering. Because this signal requires a model to evaluate, it is best reserved for cases where one of the cheaper signals has already raised a flag.

The fifth signal treats reversibility as a budget. Before an action runs, the system can determine what it would destroy, including uncommitted changes, files outside version control and external effects such as network requests or package installations. An irreversible action taken early in a session closes off later options, so the earlier it comes and the less the task requires it, the higher the bar it should have to clear. In the example, `git checkout -- src/` fails this test by itself, without any rule about git having been written in advance.

None of these signals requires a list of harmful commands to be drawn up beforehand. Each measures the relationship between what the agent is doing and what it was asked to do, which is precisely the property that static rules cannot express. It is also the kind of information that a Markov model would need in its state if it is to say anything useful about coding agents.

## Conclusion

AgentSpec is a strong answer to the question of how to guarantee that a known dangerous action never runs, and that guarantee is worth having as the foundation of any agent deployment. It is not an answer to the question of how to ensure that an agent does only what a task requires, because that question cannot be settled before the task exists. The harm in an unwarranted action lies in its relationship to a goal that the rule writer never saw.

The open question that follows concerns representation: what should the state of a coding session record, so that both rules and probabilistic monitors can reason about drift? The argument of this essay is that it should describe the agent's position relative to the goal rather than the commands it has typed, including its footprint, its contact with the oracle, its history of failed attempts and what it has made irreversible. That claim can be tested directly, by labelling agent runs on benign tasks for unwarranted actions and measuring how early each of the signals above fires before them.

## Sources

- Wang, Poskitt and Sun. [AgentSpec: Customizable Runtime Enforcement for Safe and Reliable LLM Agents](https://arxiv.org/abs/2503.18666). ICSE 2026. arXiv v3, July 2025.
- Wang, Poskitt, Wei and Sun. [ProbGuard (first released as Pro2Guard): Proactive Runtime Enforcement of LLM Agent Safety via Probabilistic Model Checking](https://arxiv.org/abs/2508.00500). arXiv, 2025.
- Guo et al. [RedCode: Risky Code Execution and Generation Benchmark for Code Agents](https://arxiv.org/abs/2411.07781). NeurIPS 2024 Datasets and Benchmarks.
- Tsai and Bagdasarian. [Contextual Agent Security: A Policy for Every Purpose (Conseca)](https://arxiv.org/abs/2501.17070). HotOS 2025.
- Shi et al. [Progent: Programmable Privilege Control for LLM Agents](https://arxiv.org/abs/2504.11703). arXiv, 2025. A related approach that writes least privilege tool policies in a language of their own.
