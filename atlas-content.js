/* Model Atlas: curated content.
   Scores come from Epoch AI's benchmark data (see atlas.js). Everything in this file is written by hand:
   benchmark explainers, lab notes, safety sources, walkthroughs and the glossary.
   To add a benchmark explainer, copy one entry in BENCHMARKS and use the exact benchmark name from Epoch's data. */

window.ATLAS_CONTENT = {

  categories: {
    knowledge: "Knowledge and reasoning",
    math: "Math",
    coding: "Coding",
    agents: "Agents and real work",
    abstract: "Abstract reasoning",
    cyber: "Cyber (dual use)",
    context: "Long context"
  },

  /* Candidate headline columns for the leaderboard. The page shows the four with the most results
     among models released in the last twelve months, in this order of preference. */
  headline: ["GPQA diamond", "HLE", "SWE-Bench verified", "FrontierMath-Tiers-1-3-v2-Private", "Terminal Bench", "ARC-AGI-2", "SimpleQA Verified", "OTIS Mock AIME 2024-2025"],

  benchmarks: {
    "GPQA diamond": {
      short: "GPQA Diamond", cat: "knowledge", status: "Near saturation",
      what: "198 very hard multiple choice questions in biology, physics and chemistry, written by people with or working toward PhDs.",
      how: "Four options per question, so guessing gives 25%. Diamond is the subset where experts agreed on the answer and most skilled non experts, even with web access, got it wrong.",
      why: "For two years it was the standard test of graduate level science knowledge. A high score means the model can recall and apply specialist science, not that it can do research.",
      watch: "Top models now score in the high 80s and 90s, close to the point where the remaining errors are disputed questions. Small differences between frontier models mean little here.",
      link: "https://arxiv.org/abs/2311.12022"
    },
    "HLE": {
      short: "Humanity's Last Exam", cat: "knowledge", status: "Active",
      what: "About 2,500 expert written questions across mathematics, sciences and the humanities, built to be the hardest closed ended academic test.",
      how: "Mixed multiple choice and exact answer questions. Questions were kept only if frontier models failed them at the time of writing. It also reports calibration: how confident the model is when it is wrong.",
      why: "It still separates frontier models. Its calibration score is worth reading, because a model that is confidently wrong is more dangerous to rely on than one that says it is unsure.",
      watch: "Scores depend heavily on whether tools such as search or code execution were allowed. Check the setting before comparing numbers from different sources.",
      link: "https://lastexam.ai"
    },
    "SimpleQA Verified": {
      short: "SimpleQA Verified", cat: "knowledge", status: "Active",
      what: "About 1,000 short questions with one checkable factual answer, a cleaned up version of OpenAI's SimpleQA released by Google DeepMind.",
      how: "Graded as correct, incorrect or not attempted. It is run without web search, so it measures what the model actually knows.",
      why: "It is the closest thing on this page to a hallucination test. A model can score well on reasoning and still invent facts.",
      watch: "A model that refuses to answer more often can look safer on errors while knowing less. Look at both correct and incorrect rates where they are reported.",
      link: "https://arxiv.org/abs/2509.07968"
    },
    "MMLU": {
      short: "MMLU", cat: "knowledge", status: "Saturated",
      what: "About 16,000 multiple choice questions across 57 school and professional subjects, from 2020.",
      how: "Four options, accuracy reported.",
      why: "Historically important: for years it was the single number every release quoted.",
      watch: "Saturated and contaminated. Modern models cluster near the top and some questions have wrong answer keys. Treat it as history, not as evidence.",
      link: "https://arxiv.org/abs/2009.03300"
    },
    "MATH level 5": {
      short: "MATH Level 5", cat: "math", status: "Saturated",
      what: "The hardest tier of the MATH dataset of competition problems (algebra, geometry, number theory and more).",
      how: "The final answer is checked against the reference.",
      why: "It tracked the jump from models that could not do competition math to models that can.",
      watch: "Leading reasoning models score near the ceiling, so it no longer separates them.",
      link: "https://arxiv.org/abs/2103.03874"
    },
    "OTIS Mock AIME 2024-2025": {
      short: "OTIS Mock AIME", cat: "math", status: "Near saturation",
      what: "Problems in the style of the American Invitational Mathematics Examination, taken from OTIS mock exams rather than the real contest.",
      how: "Every answer is an integer from 0 to 999, so guessing almost never works.",
      why: "Using mock exams instead of the real AIME lowers the chance that the problems were in training data.",
      watch: "There are few problems, so a single question changes the score by several points.",
      link: "https://epoch.ai/benchmarks"
    },
    "FrontierMath-Tiers-1-3-v2-Private": {
      short: "FrontierMath (tiers 1 to 3)", cat: "math", status: "Active",
      what: "Unpublished research level math problems written by mathematicians for Epoch AI, from advanced undergraduate up to early research difficulty.",
      how: "Answers are exact objects (numbers, expressions) checked automatically. The problems are private, which limits contamination.",
      why: "It is one of the few math tests that still has headroom, and its privacy makes it harder to game.",
      watch: "OpenAI funded the benchmark and had access to much of it, which led to criticism in 2025. Read results with that history in mind.",
      link: "https://epoch.ai/frontiermath"
    },
    "FrontierMath-Tier-4-v2-Private": {
      short: "FrontierMath tier 4", cat: "math", status: "Hard",
      what: "The hardest FrontierMath problems, at the level a research mathematician would need days or more to solve.",
      how: "Same automatic answer checking as the other tiers.",
      why: "Progress here is a signal about whether models can contribute to new mathematics.",
      watch: "Very few problems, so scores move in large steps.",
      link: "https://epoch.ai/frontiermath"
    },
    "SWE-Bench verified": {
      short: "SWE-bench Verified", cat: "coding", status: "Near saturation",
      what: "500 real GitHub issues from popular Python projects, checked by human engineers to be solvable and fairly tested.",
      how: "The model edits the repository; the fix counts only if hidden tests that the real fix passed now pass.",
      why: "It moved coding evaluation from toy functions to real codebases and became the headline coding number of 2024 and 2025.",
      watch: "Scores depend on the agent scaffold around the model, not only the model. Many of the repositories are public, so contamination is a real concern, and the top scores are now close together. This is a measure of fixing an issue, not of fixing it with a small, safe change.",
      link: "https://openai.com/index/introducing-swe-bench-verified/"
    },
    "Terminal Bench": {
      short: "Terminal-Bench", cat: "coding", status: "Active",
      what: "Tasks an agent must complete inside a real command line environment, such as building software, configuring systems or fixing broken setups.",
      how: "Each task has tests that check the final state of the environment.",
      why: "It is closer to how coding agents are actually used than single file coding tests.",
      watch: "Results depend on the agent harness and time limits. Agents can also reach a passing state through actions you would not accept in practice.",
      link: "https://www.tbench.ai"
    },
    "Aider polyglot": {
      short: "Aider Polyglot", cat: "coding", status: "Near saturation",
      what: "225 of the hardest Exercism exercises in C++, Go, Java, JavaScript, Python and Rust.",
      how: "The model must edit existing files so the tests pass, with one retry after seeing the failures.",
      why: "It tests code editing across languages, not only Python.",
      watch: "Exercism solutions are public, and top scores are now high.",
      link: "https://aider.chat/docs/leaderboards/"
    },
    "OSWorld": {
      short: "OSWorld", cat: "agents", status: "Active",
      what: "About 370 tasks on a real desktop computer: using browsers, office software, file managers and other apps through the screen.",
      how: "The model sees screenshots and controls the mouse and keyboard; a script checks whether the task was done. Human testers completed about 72%.",
      why: "It measures computer use, a capability that turns a chatbot into something that can act for you.",
      watch: "Scores vary with screen resolution, step limits and the scaffold. OSWorld 2.0 is a newer, harder version.",
      link: "https://os-world.github.io"
    },
    "GDPval": {
      short: "GDPval", cat: "agents", status: "Active",
      what: "Real work products from 44 occupations, such as legal briefs, engineering drawings and sales decks, built by OpenAI from tasks set by industry professionals.",
      how: "Expert graders compare the model's deliverable with a professional's, without knowing which is which. The score is how often the model's work wins or ties.",
      why: "It asks the economic question directly: is the output as good as a professional's?",
      watch: "OpenAI built it, and the published subset is small. A win means the deliverable was preferred, not that the model can do the whole job.",
      link: "https://openai.com/index/gdpval/"
    },
    "Remote Labor Index": {
      short: "Remote Labor Index", cat: "agents", status: "Hard",
      what: "240 real freelance projects across 23 domains, such as design, video, CAD, data analysis and web apps, from the Center for AI Safety and Scale AI.",
      how: "The automation rate is the share of projects where the AI's deliverable is judged at least as good as the human freelancer's.",
      why: "It is the most direct measure of end to end automation of paid work. The best agent at launch in October 2025 automated 2.5%.",
      watch: "It is small and expensive to run, so few models have scores.",
      link: "https://arxiv.org/abs/2510.26787"
    },
    "ARC-AGI-2": {
      short: "ARC-AGI-2", cat: "abstract", status: "Active",
      what: "Visual grid puzzles where the model must infer a rule from a few examples and apply it to a new grid. Every task was solved by at least two people in testing.",
      how: "Exact match on the output grid. Results are usually reported with cost per task.",
      why: "It tests learning a new rule on the spot rather than recalling knowledge, which is where models were weakest.",
      watch: "Check whether a score is on the semi private set and whether it used a special search system, which can cost far more per task than a normal model call.",
      link: "https://arcprize.org/arc-agi/2/"
    },
    "METR Time Horizons": {
      short: "METR time horizon", cat: "agents", status: "Active",
      what: "The length of task, measured by how long it takes skilled humans, that a model can complete with 50% success. Built from software and research tasks of many lengths.",
      how: "METR fits a curve of success against human task time for each model and reads off where it crosses 50%. The atlas shows this horizon in hours.",
      why: "It turns many benchmarks into one intuitive unit. METR reported in 2025 that this horizon had doubled roughly every seven months since 2019.",
      watch: "The confidence intervals are wide, the task set leans toward software, and 50% success is far from reliable enough for unsupervised work.",
      link: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/"
    },
    "Cybench": {
      short: "Cybench", cat: "cyber", status: "Near saturation",
      what: "40 professional capture the flag challenges from real security competitions.",
      how: "The agent works in a sandbox with security tools and must recover the hidden flag.",
      why: "Cyber offence is one of the dangerous capabilities labs and governments track. A higher score means more uplift to an attacker as well as a defender.",
      watch: "This is a capability measure, so a high score is a risk signal, not a quality badge.",
      link: "https://cybench.github.io"
    },
    "ExploitBench": {
      short: "ExploitBench", cat: "cyber", status: "Active",
      what: "41 real bugs in V8, the JavaScript engine inside Chrome, from Carnegie Mellon University researchers.",
      how: "Progress is scored on a ladder of 16 flags, from triggering the bug to full code execution, so partial progress counts.",
      why: "It measures how far a model can take a known vulnerability toward a working exploit against hardened, widely used software.",
      watch: "Dual use: a high score is a risk signal. Only a couple of the exploits are public, which limits contamination.",
      link: "https://epoch.ai/benchmarks/exploitbench"
    },
    "Fiction.LiveBench": {
      short: "Fiction.LiveBench", cat: "context", status: "Active",
      what: "Questions about long stories that require tracking characters, events and changes across the text.",
      how: "Tested at several context lengths; the atlas uses Epoch's chosen score column.",
      why: "Advertised context windows say how much text a model accepts, not how well it understands it. This tests the second.",
      watch: "Performance usually drops as the story gets longer, so the length tested matters.",
      link: "https://epoch.ai/benchmarks"
    }
  },

  eci: {
    title: "Epoch Capabilities Index (ECI)",
    text: "One score that combines many benchmarks. Epoch fits a statistical model (item response theory) that estimates how capable each model is and how hard each benchmark is, so a model does not need to have run every test. Higher is better, and the scale has no natural top. The bars show a 90% interval.",
    link: "https://epoch.ai/eci"
  },

  /* Lab profiles. FLI grades are from the Summer 2026 AI Safety Index (evidence collected to 3 June 2026). */
  labs: [
    { id: "openai", name: "OpenAI", match: /^OpenAI/i, country: "United States", families: "GPT, o series; gpt-oss (open weights)",
      weights: "Mostly closed. gpt-oss (August 2025) is its open weight line.", fli: "C (2.28)",
      notes: "Publishes system cards and a Preparedness Framework for dangerous capability thresholds.",
      links: [["System cards", "https://openai.com/safety/"]] },
    { id: "anthropic", name: "Anthropic", match: /^Anthropic/i, country: "United States", families: "Claude",
      weights: "Closed weights, API and apps.", fli: "C+ (2.66), highest of the nine",
      notes: "Publishes system cards and a Responsible Scaling Policy that ties safeguards to capability levels.",
      links: [["Transparency hub", "https://www.anthropic.com/transparency"]] },
    { id: "google", name: "Google DeepMind", match: /^Google/i, country: "United States and United Kingdom", families: "Gemini (closed), Gemma (open weights)",
      weights: "Gemini is closed; Gemma models are open weight.", fli: "C (2.01)",
      notes: "Publishes model cards and a Frontier Safety Framework.",
      links: [["Frontier Safety Framework", "https://deepmind.google/frontier-safety/"]] },
    { id: "meta", name: "Meta", match: /^Meta/i, country: "United States", families: "Llama (open weights), Muse",
      weights: "Llama models are open weight under Meta's own licence. Newer Muse models in the data include both closed and open variants.", fli: "D+ (1.32)",
      notes: "Llama is one of the most fine tuned model families, so many community models inherit its strengths and weaknesses.",
      links: [["Llama", "https://www.llama.com"]] },
    { id: "alibaba", name: "Alibaba (Qwen)", match: /^Alibaba/i, country: "China", families: "Qwen",
      weights: "Releases many open weight models in many sizes, from small dense models to large mixture of experts models, mostly under permissive licences. Some flagship versions are API only.", fli: "D− (0.87)",
      notes: "Qwen is among the most downloaded and fine tuned open model families, so it often sits underneath other projects. If you use it, its safety properties travel with it.",
      links: [["Qwen on Hugging Face", "https://huggingface.co/Qwen"]] },
    { id: "moonshot", name: "Moonshot AI (Kimi)", match: /^Moonshot/i, country: "China", families: "Kimi",
      weights: "Open weights since Kimi K2 (July 2025), a mixture of experts model with about one trillion total parameters, under a modified MIT licence.", fli: "Not covered by the index",
      notes: "Known for agentic and coding strength. CAISI's evaluation of Kimi K2 Thinking (December 2025) found it the most capable PRC model at its release but behind leading US models, and highly censored in Chinese.",
      links: [["CAISI on Kimi K2 Thinking", "https://www.nist.gov/node/1900996"]] },
    { id: "deepseek", name: "DeepSeek", match: /^DeepSeek/i, country: "China", families: "DeepSeek V and R series",
      weights: "Open weights, mostly under MIT style licences. R1 (January 2025) made open reasoning models mainstream.", fli: "F (0.47)",
      notes: "CAISI (2025) found DeepSeek models far more likely than US models to follow malicious instructions hidden in agent tasks, and to echo Chinese Communist Party narratives. CAISI's 2026 evaluation placed V4 Pro about eight months behind the frontier, and more cost efficient than models of similar capability.",
      links: [["CAISI on DeepSeek (2025)", "https://www.nist.gov/node/1898176"], ["CAISI on DeepSeek V4 Pro", "https://www.nist.gov/news-events/news/2026/05/caisi-evaluation-deepseek-v4-pro"]] },
    { id: "zai", name: "Z.ai (GLM)", match: /^Z\.ai|Zhipu/i, country: "China", families: "GLM",
      weights: "Open weights under permissive licences for the main GLM releases.", fli: "D− (0.88)",
      notes: "CAISI called GLM-5.2 probably the most capable open weight model at its June 2026 release. It found the safeguards mixed: refusal of most malicious cyber requests, but higher compliance with sensitive biology requests than US models.",
      links: [["CAISI on GLM-5.2", "https://www.nist.gov/document/caisi-assessment-zais-glm-52"]] },
    { id: "mistral", name: "Mistral AI", match: /^Mistral/i, country: "France", families: "Mistral, Mixtral, Codestral, Magistral",
      weights: "A mix of open weight models (often Apache 2.0) and commercial models.", fli: "F (0.33), lowest of the nine",
      notes: "Europe's best known frontier lab. Its FLI grade reflects limited published risk assessment and safety frameworks.",
      links: [["Models", "https://docs.mistral.ai/getting-started/models/"]] },
    { id: "xai", name: "xAI", match: /^xAI/i, country: "United States", families: "Grok",
      weights: "Mostly closed; weights of some older Grok models have been released.", fli: "F (0.65)",
      notes: "Grok is integrated with X. Its FLI grade reflects thin safety documentation relative to its capability.",
      links: [["xAI", "https://x.ai"]] }
  ],

  safety: {
    lenses: [
      ["The lab", "Does the developer publish risk assessments, safety frameworks and system cards, and let outsiders test before release? This is what the FLI AI Safety Index grades. It says nothing about a single model's behaviour."],
      ["The model's safeguards", "Does it refuse clearly harmful requests, resist jailbreaks, and resist instructions hidden in web pages or files (agent hijacking)? Independent testers like CAISI and MLCommons AILuminate measure this."],
      ["Dangerous capability", "How much could it help someone do serious harm, for example in cyber attacks or biology? Benchmarks such as Cybench and ExploitBench measure capability, so a higher score is more risk, not more safety."],
      ["How you deploy it", "Open weights can be fine tuned or run without the developer's filters. Research has repeatedly removed safety training from open models for a few dollars of compute, so a model's built in refusals should not be your only protection."]
    ],
    fli: [
      ["Anthropic", "C+", 2.66], ["OpenAI", "C", 2.28], ["Google DeepMind", "C", 2.01], ["Meta", "D+", 1.32],
      ["Z.ai", "D−", 0.88], ["Alibaba Cloud", "D−", 0.87], ["xAI", "F", 0.65], ["DeepSeek", "F", 0.47], ["Mistral", "F", 0.33]
    ],
    fliNote: "Future of Life Institute, AI Safety Index, Summer 2026. Nine companies graded on 37 indicators across six domains; evidence collected to 3 June 2026. FLI is an advocacy group focused on catastrophic risk, and the grades reward public disclosure, so read them as a view of company practices, not of model behaviour.",
    fliLink: "https://futureoflife.org/index",
    caisi: [
      ["DeepSeek R1, R1-0528, V3.1", "Sept 2025", "Behind US reference models, with the widest gap on software engineering and cyber. The most secure DeepSeek model was about 12 times more likely than US frontier models to follow malicious instructions designed to hijack an agent. Echoed Chinese Communist Party narratives.", "https://www.nist.gov/node/1898176"],
      ["Kimi K2 Thinking", "Dec 2025", "Most capable PRC model at release, still behind leading US models in cyber and software engineering. Highly censored in Chinese (about 26% alignment with CCP narratives), much less in English.", "https://www.nist.gov/node/1900996"],
      ["DeepSeek V4 Pro", "May 2026", "About eight months behind the frontier on CAISI's tests, which included private benchmarks. Scored better on DeepSeek's own reported evaluations than on CAISI's. More cost efficient than models of similar capability.", "https://www.nist.gov/news-events/news/2026/05/caisi-evaluation-deepseek-v4-pro"],
      ["GLM-5.2", "July 2026", "Probably the most capable open weight model at release; cyber capability similar to Opus 4.6. Safeguards mixed: refused most malicious cyber requests, but complied with sensitive biology requests more often than US models. No public hijacking attack succeeded.", "https://www.nist.gov/document/caisi-assessment-zais-glm-52"]
    ],
    caisiNote: "CAISI is the US government's AI testing centre at NIST. Its reports on PRC models are written under a policy mandate to compare them with US models, and some critics have questioned its methods, so read them alongside other sources.",
    research: [
      ["Removing safety training from open weights", "LoRA fine tuning removed Llama 2 Chat's safety training for under $200 (Palisade Research, 2023); a 2024 follow up did it for Llama 3 8B in minutes for under a dollar.", "https://arxiv.org/abs/2407.01376"],
      ["Fine tuning breaks closed models too", "Ten harmful examples and about $0.20 of fine tuning through an API undid GPT-3.5 Turbo's guardrails (Stanford HAI policy brief).", "https://hai.stanford.edu/policy/policy-brief-safety-risks-customizing-foundation-models-fine-tuning"],
      ["Measuring the safety gap", "The Safety Gap Toolkit compares dangerous capability before and after safeguards are stripped, tested on Llama 3 and Qwen 2.5 families.", "https://arxiv.org/abs/2507.11544"],
      ["Chat safety grades", "MLCommons AILuminate grades chat systems across 12 hazard categories with private prompts.", "https://ailuminate.mlcommons.org"]
    ],
    checklist: [
      "Read the system or model card. Is there one, and does it report dangerous capability tests and who ran them?",
      "Look for an independent evaluation (CAISI, UK AISI, AILuminate, academic red teams), not only the developer's own numbers.",
      "Check the dual use benchmarks in this atlas. High cyber scores mean you should think about misuse of your deployment.",
      "If the weights are open, assume anyone can remove its refusals. Put your own filters, permissions and monitoring around it.",
      "For agents, test prompt injection: give it a web page or file containing hostile instructions and see whether it obeys.",
      "Check language. Safety behaviour measured in English often weakens in other languages."
    ]
  },

  start: [
    ["Separate the claim from the check", "Release posts report the developer's own numbers, under settings they chose. Independent sources such as Epoch AI, CAISI and benchmark maintainers rerun or collect results more consistently. CAISI found DeepSeek V4 Pro scored better on DeepSeek's own evaluations than on its own tests."],
    ["Ask what the benchmark actually measures", "Multiple choice knowledge, final answer math, editing a repository and operating a computer are different skills. Read the explainer before reading the number."],
    ["Check whether it still has room", "A benchmark where every frontier model scores above 90% cannot tell them apart. Prefer active and hard benchmarks for comparing new models."],
    ["Read the setting", "Reasoning effort, tools, number of attempts, agent scaffold and cost all change scores. A number without its setting is half a fact."],
    ["Look at the trend, not one point", "The frontier chart shows where a model sits relative to everything released before it, and how far open weights trail closed ones."],
    ["Weigh safety separately", "Capability and safety are different axes. Use the safety tab for the lab, the model's safeguards, dangerous capabilities and how you plan to deploy it."]
  ],

  howto: [
    { title: "Read a new model release in ten minutes",
      steps: [
        "Find the model card or system card and the license. Note open or closed weights, size, context window and price.",
        "List the benchmarks they report. Mark each as saturated, active or hard using the Benchmarks tab.",
        "For each number, find the setting: reasoning effort, tools, attempts (pass@1 or more), and scaffold.",
        "Look up the model here or on Epoch AI a week or two later, when independent results arrive. Compare them with the launch numbers.",
        "Read the safety section of the card, then check the Safety tab for independent findings."
      ] },
    { title: "Run a real benchmark yourself with Inspect",
      intro: "Inspect is the open source evaluation framework from the UK AI Security Institute. The inspect_evals package has ready made versions of many benchmarks on this page.",
      code: "pip install inspect-ai inspect-evals openai\n\n# any OpenAI compatible provider works; OpenRouter gives one key for many models\nexport OPENROUTER_API_KEY=your_key\n\n# run 50 GPQA Diamond questions against an open model\ninspect eval inspect_evals/gpqa_diamond --model openrouter/qwen/qwen3-235b-a22b --limit 50\n\n# open the log viewer to read every question, answer and score\ninspect view",
      after: "Start with a small limit to control cost. Model names change often; check your provider's model list for the exact id." },
    { title: "Build a tiny eval for your own use case",
      intro: "Public benchmarks rarely match your task. Twenty to fifty of your own examples, graded the same way every time, tell you more than any leaderboard.",
      code: "from inspect_ai import Task, task\nfrom inspect_ai.dataset import Sample\nfrom inspect_ai.scorer import model_graded_qa\nfrom inspect_ai.solver import generate\n\n@task\ndef my_eval():\n    return Task(\n        dataset=[\n            Sample(input=\"Translate to Kinyarwanda: Wash your hands before eating.\",\n                   target=\"A faithful translation that keeps the instruction clear.\"),\n            # add 20 to 50 real examples from your own work\n        ],\n        solver=generate(),\n        scorer=model_graded_qa(),\n    )\n\n# inspect eval my_eval.py --model openrouter/moonshotai/kimi-k2",
      after: "Grade with a fixed rubric, keep the file in version control, and rerun it on every model you consider. Read a sample of outputs yourself; automatic graders make mistakes too." },
    { title: "Test open weights on your own machine",
      intro: "EleutherAI's lm-evaluation-harness runs hundreds of classic tasks on Hugging Face models.",
      code: "pip install lm-eval\n\nlm_eval --model hf \\\n  --model_args pretrained=Qwen/Qwen2.5-1.5B-Instruct \\\n  --tasks gsm8k,arc_challenge \\\n  --device cuda:0 --batch_size 8",
      after: "Small models run on a single consumer GPU or a free Colab GPU. Scores will not match the developer's exactly, because prompts and settings differ, which is itself a useful lesson." }
  ],

  glossary: [
    ["Open weights", "The trained parameters are downloadable, so anyone can run, fine tune or modify the model. Not the same as open source, which would also include training data and code."],
    ["Closed weights", "Only available through the developer's API or apps."],
    ["Mixture of experts (MoE)", "A model made of many sub networks where only a few are used for each token. Total parameters (for example one trillion) can be far larger than active parameters per token, which is why some huge open models are cheap to run."],
    ["Reasoning or thinking model", "A model trained to write out a long chain of thought before answering. Usually much better at math and code, slower and more expensive per answer."],
    ["Benchmark saturation", "When top models all score near the maximum, so the test can no longer separate them."],
    ["Contamination", "When test questions or answers were in the training data. Scores then measure memory, not ability. Private and newly written benchmarks reduce it."],
    ["pass@1", "Score when the model gets one attempt per problem. pass@k allows k attempts and counts a success if any works, which inflates numbers."],
    ["Scaffold or harness", "The code around a model that lets it use tools, read files, retry and plan. Agent benchmarks measure the model and scaffold together."],
    ["Random baseline", "The score from guessing, for example 25% on four option multiple choice. Progress should be read from this floor, not from zero."],
    ["Item response theory (IRT)", "A statistical method from educational testing that estimates ability and question difficulty together. Epoch's ECI uses it to combine benchmarks."],
    ["System card", "A developer's report on a model's capabilities, safety testing and known risks, published at release."],
    ["Jailbreak", "A prompt designed to get a model to ignore its safety training."],
    ["Agent hijacking (prompt injection)", "Hostile instructions hidden in content an agent reads, such as a web page or email, that try to redirect what it does."],
    ["Dual use capability", "A skill, such as finding software vulnerabilities, that helps defenders and attackers alike."],
    ["Time horizon", "METR's measure: the length of human task a model can complete with 50% success."],
    ["Elo or arena rating", "A ranking from human votes between two anonymous model answers. It measures preference, which includes style and length, not correctness."]
  ]
};
