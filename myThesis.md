UNIVERSITY OF MARIBOR
FACULTY OF ELECTRICAL ENGINEERING AND COMPUTER SCIENCE
Abdul Hakim Nazari
ADAPTIVE BUDGET ALLOCATION
USING MACHINE LEARNING AND
SOFTWARE-IN-THE-LOOP CONTROL
SIMULATION
Bachelor's Thesis
Maribor, May 2026

ADAPTIVE BUDGET ALLOCATION
USING MACHINE LEARNING AND
SOFTWARE-IN-THE-LOOP CONTROL
SIMULATION
Bachelor's Thesis
Student: Abdul Hakim Nazari
Study program: University study program
Track: —
Supervisor: Assoc. Prof. Dr. Aleš Hace
License: CC BY 4.0
Maribor, May 2026
i

ACKNOWLEDGEMENTS
First and foremost, I would like to express my sincere gratitude to my supervisor, Assoc.
Prof. Dr. Aleš Hace, for his guidance, support, and constructive feedback throughout the
development of this thesis. His expertise in mechatronics and control systems was
invaluable in shaping the academic framing of this work. I would also like to thank the
Faculty of Electrical Engineering and Computer Science at the University of Maribor for
providing the academic environment and resources that made this project possible.
Finally, this thesis reflects many months of persistent, independent work — learning
new fields, building a full-stack system from scratch, and connecting disciplines that do
not often meet. I am grateful for the resilience that process required, and proud of what
it produced.
ii

Adaptive Budget Allocation Using Machine Learning and Software-in-
the-Loop Control Simulation
Keywords: adaptive budgeting, machine learning, Gradient Boosting, exponential
smoothing, software-in-the-loop simulation
Abstract
This thesis addressed adaptive personal budget allocation as a software-based control
problem. A Gradient Boosting prediction model was combined with exponential
smoothing to produce monthly category budget recommendations that balance
accuracy and stability. Five regression models were evaluated on a synthetic persona-
based spending dataset, and the selected model was tested in a software-in-the-loop
simulation against static budgeting, last-month budgeting, and direct prediction. The
adaptive controller reduced recommendation instability by 68.5% compared with direct
prediction while preserving a 39.7% tracking-error improvement over static budgeting.
The results support a control-oriented approach to machine-learning-assisted
budgeting.
iii

DECLARATION OF AUTHORSHIP
I, Abdul Hakim Nazari, hereby declare that this bachelor’s thesis is my own original work,
written under the supervision of Assoc. Prof. Dr. Aleš Hace at the University of Maribor,
Faculty of Electrical Engineering and Computer Science.
I confirm that the work has not been submitted elsewhere for the purpose of obtaining
any other qualification, and that all sources used have been duly cited and
acknowledged.
I agree that this thesis may be made available in the University of Maribor digital library
(DKUM).
Maribor, May 2026
Signature: ________________________________________
iv

Table of Contents
Table Of Figures .......................................................................................................... viii
LIST OF TABLES ............................................................................................................. ix
LIST OF SYMBOLS AND ACRONYMS ............................................................................... x
Acronyms ...................................................................................................................... x
1 INTRODUCTION ...................................................................................................... 1
1.1 Background and Motivation ............................................................................. 1
1.2 Research Question ......................................................................................... 2
1.3 Objectives ...................................................................................................... 2
1.4 Thesis Structure .............................................................................................. 3
2 LITERATURE REVIEW ............................................................................................... 4
2.1 Personal Finance Systems and Decision Support ............................................. 4
2.2 Machine Learning for Financial Tabular Prediction ........................................... 4
2.3 Control Theory, Exponential Smoothing, and Stability ...................................... 5
2.4 Soft Sensing and Software-in-the-Loop Simulation........................................... 5
2.5 Research Gap ................................................................................................. 6
3 MECHATRONICS AND CONTROL-SYSTEM FRAMING ................................................ 7
3.1 Interdisciplinary Framing ................................................................................. 7
3.2 Mechatronic Block Diagram and Control Loop ................................................. 7
3.3 Soft Sensing Channels .................................................................................... 9
3.3.1 Voice Input ................................................................................................. 9
3.3.2 Receipt OCR ............................................................................................. 10
3.3.3 Manual Entry ............................................................................................. 10
3.4 State Estimation ........................................................................................... 10
3.5 The Adaptive Controller: Design, Equations, and Stability ............................... 10
3.6 Human-Machine Interface ............................................................................ 11
4 SYSTEM ARCHITECTURE ....................................................................................... 12
4.1 Three-Layer Structure ................................................................................... 12
4.2 Database Schema ........................................................................................ 12
4.3 Backend-to-AI Integration ............................................................................. 13
4.4 Architectural Limitations ............................................................................... 13
5 SYNTHETIC DATASET AND SPENDING SIMULATION ............................................... 14
5.1 Justification for Synthetic Data ...................................................................... 14
5.2 Persona Profiles............................................................................................ 14
v

5.3 Data Generation and Feature Engineering ...................................................... 15
6 MACHINE LEARNING PREDICTION MODELS .......................................................... 16
6.1 Problem Formulation .................................................................................... 16
6.2 Candidate Models and Theoretical Basis ....................................................... 16
6.3 Training and Evaluation Protocol ................................................................... 17
6.4 Model Comparison Results ........................................................................... 18
6.5 Per-Category Error Analysis ........................................................................... 19
6.6 Feature Ablation Study .................................................................................. 20
6.7 Hyperparameter Search ................................................................................ 22
6.8 Model Selection Rationale ............................................................................. 23
7 ADAPTIVE BUDGET CONTROL METHOD ................................................................. 24
7.1 Motivation .................................................................................................... 24
7.2 The Four Compared Strategies ...................................................................... 24
7.3 Alpha Sensitivity Analysis .............................................................................. 25
7.4 Stability Analysis ........................................................................................... 26
7.5 SIL Simulation Procedure .............................................................................. 27
8 EXPERIMENTAL EVALUATION AND RESULTS .......................................................... 28
8.1 Evaluation Setup ........................................................................................... 28
8.2 Evaluation Metrics ........................................................................................ 28
8.3 Main Results ................................................................................................. 29
8.4 Tracking Error Analysis .................................................................................. 29
8.5 Budget Stability Analysis ............................................................................... 30
8.6 Overspending Analysis .................................................................................. 30
8.7 The Accuracy-Stability Trade-Off ................................................................... 31
8.8 Answer to the Research Question .................................................................. 31
8.9 Threats to Validity ......................................................................................... 32
9 WEB APPLICATION IMPLEMENTATION ................................................................... 33
9.1 Purpose of the Web Application .................................................................... 33
9.2 Overall Runtime Architecture ........................................................................ 33
This section has been discussed on chapter 4 ........................................................... 33
9.3 AI Budget Optimizer Integration ..................................................................... 34
9.4 Expense Input and Multi-Modal Soft Sensing .................................................. 34
10 LIMITATIONS AND FUTURE WORK ..................................................................... 35
10.1 Limitations ................................................................................................... 35
vi

10.1.1 Synthetic Dataset .................................................................................. 35
10.1.2 No Behavioral Closed Loop ................................................................... 35
10.1.3 Simple Controller Design ....................................................................... 35
10.1.4 Fixed Alpha ........................................................................................... 35
10.1.5 Statistical Significance .......................................................................... 35
10.2 Future Work .................................................................................................. 35
11 CONCLUSION .................................................................................................. 37
11.1 Summary of Work ......................................................................................... 37
11.2 Main Findings ............................................................................................... 37
11.3 Contributions ............................................................................................... 38
11.4 Final Answer to the Research Question .......................................................... 38
REFERENCES AND LITERATURE .................................................................................... 39
vii

Table Of Figures
Figure 1: Block diagram of the mechatronic system architecture and software-in-the-
loop simulation boundary. ................................................................................................ 8
Figure 2: Simplified entity-relationship diagram. ........................................................... 13
Figure 3. Block diagram of the Gradient Boosting prediction model and its connection
to the software product. ................................................................................................. 16
Figure 4: Bar chart comparing average MAE across five regression models. Gradient
Boosting achieves the lowest average MAE at $90.98. .................................................. 18
Figure 5: Bar chart comparing average R² across five models. Gradient Boosting
achieves the highest R² at 0.9415. .................................................................................. 19
Figure 6: Per-category MAE heatmap for all five models. Travel is consistently the
hardest category across all models. ............................................................................... 20
Figure 7: Feature ablation bar chart. Positive values (month, prev_total) indicate useful
features; negative values (prev_food, prev_other, prev_transport) indicate noise-
introducing features. ...................................................................................................... 22
Figure 10: Block diagram of the adaptive budget control method and its connection to
the software product. ..................................................................................................... 24
Figure 11: Alpha sensitivity dual-axis chart: tracking error (left axis) and budget
instability (right axis) as functions of alpha. The selected value α = 0.7 is marked. ...... 26
Figure 12: Block diagram of the experimental evaluation setup — software-in-the-loop
simulation procedure. ..................................................................................................... 28
Figure 13: Four-panel bar chart comparing all four strategies across all four metrics. . 29
Figure 14: Tracking error across 60 test months for all four strategies. Note the higher
volatility of direct ML compared to adaptive controller. ............................................... 30
Figure 15: Accuracy-stability scatter plot: each strategy is plotted at (tracking error,
budget instability). The ideal point is bottom-left. Adaptive Controller is closest to the
ideal among responsive strategies. ................................................................................ 31
Figure 18: Block diagram of the web application runtime architecture and AI pipeline
integration. ..................................................................................................................... 33
Figure 19: Dashboard screenshot showing financial summary. ..................................... 34
viii

LIST OF TABLES
Table 1: Research objectives. ........................................................................................... 2
Table 2: Complete mapping of components to Mechatronics and control-system
concepts. ........................................................................................................................... 8
Table 3: Technology stack by layer. ................................................................................ 12
Table 4: Synthetic personas used for spending simulation. ........................................... 14
Table 5: Time-based train-test split. ............................................................................... 15
Table 6: Average model performance across all eight categories (test set, 2025).
Gradient Boosting is highlighted. ................................................................................... 18
Table 7: Per-category MAE for Gradient Boosting. Categories sorted by difficulty. ...... 19
Table 8: Complete feature ablation results. Positive MAE change = feature is useful;
negative = feature introduces noise. .............................................................................. 21
Table 9: Alpha sensitivity analysis results. ...................................................................... 25
Table 10: Main software-in-the-loop control experiment results (60 test months, 5
personas, 8 categories). .................................................................................................. 29
ix

LIST OF SYMBOLS AND ACRONYMS
Symbols
Symbol Definition
α (alpha) Smoothing parameter of the adaptive controller (0 < α < 1)
Ν Learning rate in Gradient Boosting
𝐵(𝑐,𝑡) Budget allocated to category c in month t
𝐵 (𝑐,𝑡) Gradient Boosting prediction-based budget for category c
𝑀𝐿
𝐵 (𝑐,𝑡) Smoothed (pre-normalization) budget for category c
𝑎𝑑𝑎𝑝𝑡
𝐵 (𝑐,𝑡) Normalized final budget after income constraint enforcement
𝑓𝑖𝑛𝑎𝑙
𝐴(𝑐,𝑡) Actual spending in category c in month t
I Monthly income of the user
S Monthly saving target
𝑥 Feature vector at month t (11-dimensional)
𝑡
𝑦 Target spending vector at month t (8-dimensional)
𝑡
𝑓 Trained regression model for spending category c
𝑐
𝐹 (𝑥) Gradient Boosting Ensemble After m stages
𝑚
ℎ (𝑥) Residual tree at stage m
𝑚
𝐻(𝑧) IIR filter transfer function in the Z-domain
𝑤 Fixed category weight in static budget strategy
𝑐
N Total number of category-month observations (480)
Acronyms
Acronym Full form
AA Allocation Accuracy
AI Artificial Intelligence
API Application Programming Interface
BIBO Bounded-Input Bounded-Output
DSS Decision Support System
x

GB Gradient Boosting
HMI Human-Machine Interface
IIR Infinite Impulse Response
LSTM Long Short-Term Memory
MAE Mean Absolute Error
ML Machine Learning
MPC Model Predictive Control
NLP Natural Language Processing
OCR Optical Character Recognition
OSR Overspend Rate
PID Proportional-Integral-Derivative
R² Coefficient of Determination
RF Random Forest
RMSE Root Mean Squared Error
SIL Software-in-the-Loop
SQL Structured Query Language
ST Budget Stability
SVR Support Vector Regression
TE Tracking Error
TOC Table of Contents
UDC Universal Decimal Classification
UM FERI University of Maribor, Faculty of Electrical Engineering and
Computer Science
YNAB You Need A Budget (commercial app)
xi

1 INTRODUCTION
1.1 Background and Motivation
Personal financial management is a continuous decision process. Each month, a user
receives income, observes spending across multiple categories — food, transport,
utilities, health, travel, and others — maintains a saving target, and must allocate the
remaining disposable income. This process is dynamic: spending patterns shift across
seasons, life circumstances, and income levels. A useful budgeting system must do more
than record historical transactions. It must help the user form a forward-looking,
feasible, and stable spending plan.
Commercial finance applications such as Mint, YNAB, and PocketGuard focus primarily
on expense tracking, categorization, and manual budget setting. These tools are useful
but leave the core allocation decision to the user. Research consistently shows that self-
set budgets tend to be optimistic: people set targets that do not fully match their actual
expenditure patterns [12]. Digital tools can support awareness, but there is limited
evidence that awareness alone produces better financial outcomes [1]. The gap is
therefore not in tracking functionality — it is in the intelligence layer that converts
historical spending data into actionable, adaptive, and stable budget recommendations.
Machine learning creates the technical foundation for closing this gap. If a model can
accurately estimate next-month category spending from past behavior, income, and
seasonality, then budget recommendations can be data-driven rather than rule-based.
However, directly using model predictions as budget values introduces a new problem:
volatile, inconsistent recommendations that change sharply from month to month. In
user-facing systems, recommendation volatility reduces trust and compliance [15]. The
engineering challenge is therefore a multi-objective one: the budget allocation system
must be accurate enough to adapt to changing patterns, stable enough to be practically
usable, and constrained to respect the user's saving target.
1

We addressed that challenge by framing personal budget allocation as a software-based
adaptive control problem. The proposed system, Aura Finance, combines a full-stack
web application with a Python machine learning and simulation module, and evaluates
the resulting budget allocation behavior through formal software-in-the-loop
experiments.
1.2 Research Question
Can a machine-learning-assisted adaptive controller provide a better trade-off between
budget tracking accuracy, overspending prevention, and budget stability than static
budgeting or direct ML prediction alone?
This question deliberately asks for a trade-off, not a single optimum. The best predictor
is not always the best controller. In control-oriented systems, performance is evaluated
under constraints such as stability, smoothness, and feasibility — not only by one-step
prediction error [2]. This framing distinguishes the thesis from a pure machine learning
comparison study.
1.3 Objectives
Table 1: Research objectives.
Ref. Objective
O1 Build a full-stack personal finance application with multi-modal expense
input (manual, voice, OCR), budget management, and AI-assisted
recommendation.
O2 Generate a synthetic persona-based spending dataset to support controlled
software-in-the-loop evaluation.
O3 Train and compare five regression models for category-level monthly
spending prediction, with feature ablation and hyperparameter analysis.
O4 Design an adaptive budget controller that integrates ML predictions with
smoothing, income constraints, and saving-target enforcement.
O5 Evaluate four budget allocation strategies in software-in-the-loop
simulation using tracking error, overspend rate, stability, and allocation
accuracy.
2

O6 Interpret the results through both a machine learning lens and a control-
system lens, and answer the research question explicitly.
1.4 Thesis Structure
Chapter 2 reviews the relevant literature and identifies the research gap. Chapter 3
provides the Mechatronics and control-system framing that positions the project
academically. Chapter 4 summarizes the system architecture. Chapter 5 describes the
synthetic dataset. Chapter 6 presents the machine learning model comparison in depth.
Chapter 7 presents the adaptive budget control method. Chapter 8 presents the
experimental evaluation and central results. Chapter 9 briefly documents the web
application implementation. Chapter 10 states limitations and future work. Chapter 11
concludes the thesis.
3

2 LITERATURE REVIEW
2.1 Personal Finance Systems and Decision Support
Personal budgeting research demonstrates that budgets influence spending behavior
but compliance is weak when budgets are static or disconnected from observed
behavior [12]. Angel's randomized trial of digital finance tools found that app-based
budgeting increased account monitoring frequency but did not produce significant
improvements in financial literacy or decision quality [1]. This evidence motivates the
argument that academic value in a budgeting system should come from the intelligence
of its recommendation mechanism, not from data display alone.
Decision Support Systems provide theoretical foundation. Sprague and Carlson's
classical framework identifies three components of an effective DSS: a data subsystem,
a model subsystem, and a dialogue subsystem [17]. Aura Finance instantiates all three:
the database and expense history form the data layer, the Gradient Boosting predictor
and adaptive controller form the model layer, and the React dashboard and budget
recommendation interface form the dialogue layer. Nunes and Jannach's systematic
review of explanations in recommender and decision-support systems establishes that
trust and acceptance of algorithmic recommendations depend on consistency and
interpretability [15] a finding that motivates the stability objective of the adaptive
controller.
2.2 Machine Learning for Financial Tabular Prediction
Tree-based ensemble methods consistently outperform both linear models and deep
neural networks on structured tabular financial data [8]. This finding is directly relevant
to the model selection methodology in this thesis, as the dataset is small, tabular, and
structured, making tree-based ensembles the appropriate primary candidates.
Friedman's original formulation of Gradient Boosting Machines establishes the
sequential residual-fitting principle: each tree in the ensemble corrects the errors of the
previous ensemble, producing a model that is particularly effective at capturing
4

nonlinear interactions in structured data [7]. Breiman's Random Forest reduces variance
through bootstrap aggregation and random feature subsampling, providing a strong and
interpretable ensemble baseline [3].
Feature engineering for temporal prediction follows standard time-series conventions.
Hyndman and Athanasopoulos establish that directional train-test splits are mandatory
in forecasting evaluation: training on past data and testing on future data reflects the
real operational direction of the system [9]. Cross-validation that mixes time periods
produces optimistically biased metrics and should be avoided in financial forecasting
contexts.
2.3 Control Theory, Exponential Smoothing, and Stability
Control theory provides the central intellectual framework for the adaptive budget
allocation method. Åström and Murray describe feedback control as the mechanism
through which dynamic systems regulate behavior under uncertainty, disturbance, and
constraint [2]. The budget allocation problem maps onto this framework: the state is the
monthly spending distribution, the reference is the saving target, the control action is
the per-category budget, and new observed spending constitutes the feedback signal
for the next cycle.
Exponential smoothing is a classical technique in forecasting and control for recursively
weighing recent observations more heavily than older ones [9]. Applied as a low-pass
filter on budget recommendations — rather than on raw measurements — it introduces
inertia against sudden prediction changes while preserving the responsiveness of the
underlying ML prediction. The mathematical stability of exponential smoothing is
straightforward: since it computes a convex combination of two bounded quantities (the
previous budget and the current prediction, both bounded by the spendable income
ceiling), the output is always bounded, and feasibility is preserved at every step.
2.4 Soft Sensing and Software-in-the-Loop Simulation
5

Soft sensors are software-based inference systems that derive state estimates from
indirect or noisy inputs — analogously to physical sensors, but without transducers [11].
In Aura Finance, expense entry through manual forms, voice transcription, and OCR
receipt parsing function as soft sensing channels: each converts user actions into
structured financial signals that feed the prediction and control layers.
Software-in-the-loop simulation is a validated methodology for evaluating control logic
before physical or behavioral deployment [4]. Sargent establishes the epistemological
boundary of simulation: results are valid for comparing algorithmic strategies under the
conditions defined by the simulation, not for claiming generalization beyond those
conditions [16]. This thesis uses SIL simulation in precisely this way — to compare four
budget allocation strategies under identical controlled conditions.
2.5 Research Gap
The reviewed literature supports the relevance of each component area. However,
these areas are typically studied in isolation. Personal finance research does not
evaluate algorithmic budget controllers. ML forecasting research focuses on prediction
accuracy without evaluating output stability. Control theory is applied to physical plants,
not software resource allocation. The specific combination — ML prediction integrated
with an adaptive smoothing controller, evaluated through SIL simulation on a personal
budgeting task, with stability and accuracy measured simultaneously — has not been
addressed at this scope and framing in the existing bachelor-level engineering literature.
6

3 MECHATRONICS AND CONTROL-SYSTEM FRAMING
3.1 Interdisciplinary Framing
Although Aura Finance is implemented as a software system, its architecture follows the
same structural logic as a mechatronic system: sensing, state estimation, decision-
making, output generation, and feedback. In this thesis, the Mechatronics perspective
is used as a methodological framework for understanding and evaluating the system,
not as a claim that the project is a physical hardware platform. This framing is
appropriate because the thesis combines data acquisition, prediction, control, and
human-machine interaction within one closed decision loop[18] [10].
3.2 Mechatronic Block Diagram and Control Loop
The adaptive budget allocation system follows a closed-loop-inspired architecture. The
control cycle proceeds monthly through the following stages:
• Soft sensing: the user enters expense data through one of three input channels.
• State estimation: transaction-level data is aggregated into a monthly category
spending state vector.
• Prediction (feedforward path): the Gradient Boosting model estimates next-
month category spending from the current state.
• Adaptive control: the controller blends the prediction with the previous budget
and normalizes under the income-saving constraint.
• Output (actuation): the per-category budget recommendation is presented
through the human-machine interface.
• Feedback: new spending in the next month updates the state features for the
following cycle.
In a physical mechatronic system, the plant is a physical process. Here the plant is
human spending behavior. Because live user data is unavailable, the SIL simulation
replaces the plant with a synthetic persona model, while all other blocks — the soft
sensing pipeline, state estimator, GB predictor, and adaptive controller — run as
7

deployed software. This is the defining characteristic of a software-in-the-loop
architecture.

Figure 1: Block diagram of the mechatronic system architecture and software-in-the-loop
simulation boundary.

Table 2: Complete mapping of  components to Mechatronics and control-system concepts.
| System component  | Mechatronics  | Technical role  |
| ----------------- | ------------- | --------------- |
term
Manual expense  Soft sensor  Converts user text input to structured
| entry form  | (direct)  | transaction records.  |
| ----------- | --------- | --------------------- |
Voice recognition  Soft sensor  Captures and transcribes spoken
| module  | (acoustic)  | expense descriptions; NLP stage  |
| ------- | ----------- | -------------------------------- |
classifies category and extracts amount.
OCR receipt parsing  Soft sensor  Extracts amount and merchant from
|     | (visual)  | receipt images; keyword matching  |
| --- | --------- | --------------------------------- |
infers spending category.
Monthly category  State estimator  Reduces transaction stream to 8-
| aggregation  |     | dimensional monthly spending state  |
| ------------ | --- | ----------------------------------- |
vector.
8

Gradient Boosting Predictive Maps state features to expected next-
model feedforward month category spending.
model
Saving target (15% Setpoint / Defines the feasible allocation budget
of income) constraint ceiling: I − S.
Exponential Controller Produces stabilized, constrained budget
smoothing controller (discrete-time, output from ML prediction and previous
first-order) state.
Per-category budget Control output The actionable monthly spending plan
allocation delivered to the user.
Dashboard + alerts + Human-machine Communicates system state, controller
budget page interface output, and budget status to the user.
New monthly Feedback signal Updates prediction features for the
spending history next control cycle.
3.3 Soft Sensing Channels
The three expense input channels implement distinct soft sensing strategies and involve
different signal processing pipelines.
3.3.1 Voice Input
The voice input subsystem converts spoken natural language into a structured financial
record. The pipeline proceeds through six stages: (1) acoustic acquisition via the browser
MediaRecorder API; (2) transmission of the audio blob to the backend endpoint POST
/expenses/transcribe-voice; (3) speech-to-text conversion using a Whisper-based
transcription script; (4) amount extraction through a regular expression supporting
integer and decimal formats; (5) category classification via a deterministic multilingual
keyword dictionary (English, Turkish, German); and (6) human-in-the-loop validation, in
which the user reviews the parsed result before it is written to the database[13][14].
The validation step is particularly important: background noise, accents, or ambiguous
phrasing can produce incorrect results [19]. Human confirmation prevents inaccurate
measurements from entering the financial state used by the prediction and control
pipeline. The component operates as a five-state finite state machine: idle → listening
→ stopped → processing → review.
9

3.3.2 Receipt OCR
Receipt OCR provides a second soft sensing channel. The system uses Tesseract.js to
extract text from a receipt image, then applies two-stage rule-based parsing: first
searching for receipt-specific total markers such as "total", "toplam", or "sum"; falling
back to the highest numeric value if the first strategy fails. The result is reviewed by the
user before being saved, preventing recognition errors from corrupting the financial
state.
3.3.3 Manual Entry
Manual entry through a structured form captures amount, category, date, and optional
description. It provides the highest data quality and serves as the primary ground-truth
input channel and a calibration reference for the other soft sensing channels.
3.4 State Estimation
Individual expense transactions are event-level, irregular, and noisy. The prediction
model requires a consistent, fixed-dimension input vector at monthly intervals. State
estimation bridges this gap through two operations: (1) grouping all transactions by
(user_id, year, month, categoryId) and computing the sum of amounts per group,
producing a monthly category spending vector of dimension 8; and (2) applying a
temporal shift to create prev_* features representing the previous month's spending in
each category.
The feature vector passed to the prediction model is therefore:
𝑥 = [𝑖𝑛𝑐𝑜𝑚𝑒,𝑚𝑜𝑛𝑡ℎ,𝑝𝑟𝑒𝑣_𝑓𝑜𝑜𝑑,…,𝑝𝑟𝑒𝑣_𝑡𝑜𝑡𝑎𝑙]𝑇, 𝑥 ∈ ℝ11 (3.1)
𝑡 𝑡
3.5 The Adaptive Controller: Design, Equations, and Stability
The adaptive controller operates as a discrete-time first-order low-pass filter applied to
the budget recommendation signal. The smoothing parameter α determines the filter's
cut-off behavior: high α retains more of the low-frequency stable component; low α
allows more of the high-frequency responsive prediction. The transfer function in the Z-
domain per category is:
10

1−𝛼
𝐻(𝑧) = (3.2)
1−𝛼⋅𝑧−1
The controller is unconditionally BIBO-stable for any α ∈ (0, 1), since the pole lies at z =
α, strictly inside the unit circle. The full feasibility proof is given in Section 7.4.
3.6 Human-Machine Interface
The human-machine interface presents budget recommendations, category summaries,
alerts, and spending information to support user decision-making. In mechatronics
terminology this is the dialogue layer between the system and the human operator. A
stable and understandable recommendation is more likely to be accepted than an
erratic one — this is one of the principal reasons the controller is designed to balance
responsiveness and consistency [6].
11

4 SYSTEM ARCHITECTURE
4.1 Three-Layer Structure
Aura Finance is organized into three independently deployable layers: the React
frontend, the Express/TypeScript backend, and the Python AI module. This separation
ensures that the academic evaluation components are reproducible without requiring
the full web application stack.
Table 3: Technology stack by layer.
Layer Technology Primary role
Frontend React 18, TypeScript, HMI: dashboard, expense entry
Vite, Tailwind CSS, (manual/voice/OCR), budget
Recharts recommendations, alerts.
Backend Node.js, Express 5, Authentication, data persistence, business
TypeScript, logic, Python subprocess integration.
PostgreSQL, JWT
AI module Python 3, scikit-learn, Data generation, model training, inference,
pandas, joblib SIL simulation.
4.2 Database Schema
The PostgreSQL schema stores six primary entities: User (id, email, income,
saving_target, hashed password), Category (id, name — one of 8 fixed categories),
Expense (userId, categoryId, amount, date, description), Budget (userId, categoryId,
limitAmount), Loan, and UserPreferences. The Expense table is the primary data source
for the AI pipeline; the User table provides income and saving_target fields that
parameterise the adaptive controller at inference time.
12

Figure 2: Simplified entity-relationship diagram.
4.3 Backend-to-AI Integration
The budget optimization route invokes the Python inference script as a Node.js child
process, passing eleven arguments (income, month, and nine previous-category values)
via the command line. The script loads budget_model_v2.pkl, constructs a pandas
DataFrame with the stored feature column ordering, generates per-category
predictions, and returns a JSON object to stdout. The backend scales the predictions to
the user's spendable budget ceiling before returning the result to the frontend. The SIL
evaluation script (control_evaluation.py) runs entirely offline and is independent of this
integration path.
4.4 Architectural Limitations
Four limitations are noted. First, subprocess-based inference incurs process startup
latency on each call; a persistent Python microservice would be more efficient at scale.
Second, the backend includes rule-based AI insight generation and an LSTM forecast that
are auxiliary product features, not part of the academically evaluated contribution.
Third, inline SQL migrations lack formal versioning. Fourth, the LSTM model is trained
on per-user expense history at runtime; with sparse data it falls back to a simple linear
trend. None of these limitations affects the validity of the SIL experiment.
13

5  SYNTHETIC DATASET AND SPENDING SIMULATION
5.1  Justification for Synthetic Data
Real personal finance data is ethically impractical to collect at bachelor level: it requires
consent,  anonymization,  institutional  approval,  and  data  processing  agreements.
Synthetic data provides a controlled alternative appropriate for the thesis's evaluation
goal: comparing algorithmic budget allocation strategies under diverse but known
conditions. Sargent's framework for simulation validity establishes that a simulation is
valid if it accurately represents the phenomena it was designed to study [16]. This
simulation is designed to produce diverse monthly spending trajectories with seasonal
patterns and stochastic variation — the phenomena relevant to testing the adaptive
controller.

The key limitation must be stated clearly: results cannot be claimed to generalize to real
users. The model learns patterns embedded by the generator, not real psychological
spending behavior. All results are simulation evidence, not real-world validation.

5.2  Persona Profiles
Table 4: Synthetic personas used for spending simulation.
| Persona  | Income  | Saving  | Dominant spending characteristics  |
| -------- | ------- | ------- | ---------------------------------- |
rate
Emily, College  $2,800  5%  Food and entertainment dominant; high
| Student  |     |     | variability; minimal travel.  |
| -------- | --- | --- | ----------------------------- |
Marcus, Junior  $5,500  15%  Balanced across categories; moderate
| Developer  |         |      | variability; occasional travel.       |
| ---------- | ------- | ---- | ------------------------------------- |
| Sarah,     | $8,500  | 20%  | Health and shopping emphasis; stable  |
| Marketing  |         |      | utilities; regular travel.            |
Manager
David, Senior  $13,000  25%  Family-oriented; consistent utilities and
| Engineer  |     |     | food; frequent travel.  |
| --------- | --- | --- | ----------------------- |
Olivia, Executive  $22,000  30%  High travel and shopping; low relative
| Director  |     |     | food spend; low variability.  |
| --------- | --- | --- | ----------------------------- |
14

5.3  Data Generation and Feature Engineering
The generator assigns each persona a base category allocation vector, applies monthly
seasonal multipliers (travel peaks in July and December; utilities peak in January and
February), and adds Gaussian noise scaled to persona-specific variance parameters. If
the total generated spending exceeds the persona's spendable budget, values are
proportionally scaled down. This produces 6,979 transaction records, aggregated into
180 monthly rows.

Eleven  prediction  features  are  derived:  income,  month  index  (1–12),  prev_food,
prev_transport,  prev_shopping,  prev_entertainment,  prev_utilities,  prev_health,
prev_travel, prev_other, and prev_total. These are created by sorting each persona's
monthly records chronologically and applying a within-group lag shift of one month. The
first month per persona is dropped (no prior state available), leaving 175 usable rows.

Table 5: Time-based train-test split.
| Split     | Period          | Rows      | Purpose                     |
| --------- | --------------- | --------- | --------------------------- |
| Training  | Jan 2023 – Dec  | 115       | Model fitting for all five  |
|           | 2024            |           | regression candidates.      |
| Test      | Jan 2025 – Dec  | 60 (12    | SIL simulation: strategy    |
|           | 2025            | months ×  | comparison and control      |
|           |                 | 5         | evaluation.                 |
personas)

15

6 MACHINE LEARNING PREDICTION MODELS
6.1 Problem Formulation
Figure 3. Block diagram of the Gradient Boosting prediction model and its connection to the
software product.
The machine learning task is multi-output regression. The feature vector 𝑥
𝑡
is constructed from information available at the beginning of month t: income, month
number, and previous-month spending values. The target 𝑦
𝑡
is the spending vector observed during month t, making the model a one-step-ahead
predictor. One independent regression model is trained per spending category c ∈ {food,
transport, shopping, entertainment, utilities, health, travel, other}:
𝑦 (𝑡) = 𝑓(𝑥 ) (6.1)
𝑐 𝑐 𝑡
The eight models are trained and evaluated independently. Final budget allocation is
computed by normalizing predictions to the spendable income ceiling, as described in
Chapter 7.
6.2 Candidate Models and Theoretical Basis
Five models are evaluated. Linear Regression (OLS) serves as the lowest-complexity
interpretable baseline; it assumes a linear additive relationship and cannot capture
16

nonlinear feature interactions. Decision Tree Regression partitions the feature space
through  recursive  binary  splits;  a  single  deep  tree  overfits  this  small  dataset,
demonstrating why variance reduction through assembling is necessary. Random Forest
reduces  variance  through  bootstrap  aggregation  and  random  feature  subsampling
[7][3], and was the model originally deployed in the application backend. Support Vector
Regression uses an RBF kernel to enable nonlinear regression; its sensitivity to unscaled
feature ranges limits performance here.

Gradient Boosting builds the ensemble sequentially, fitting each new shallow tree to the
residual errors of the current ensemble [5][7]:
|     |     | (𝑥) |     | (𝑥)+𝜈 |     | (𝑥)  |     |        |
| --- | --- | --- | --- | ----- | --- | ---- | --- | ------ |
|     |     | 𝐹   | = 𝐹 |       | ⋅ℎ  |      |     | (6.2)  |
|     |     | 𝑚   |     | 𝑚−1   |     | 𝑚    |     |        |
Where ℎ  is the m-th residual tree and 𝜈 is the learning rate. This sequential error-
𝑚
correction strategy allows Gradient Boosting to capture complex nonlinear interactions
in structured data. The production configuration is: 𝑛 = 100, 𝑚𝑎𝑥 = 4,
|     |              |     |              |     |     |              | 𝑒𝑠𝑡𝑖𝑚𝑎𝑡𝑜𝑟𝑠 𝑑𝑒𝑝𝑡ℎ |     |
| --- | ------------ | --- | ------------ | --- | --- | ------------ | ---------------- | --- |
| 𝑚𝑖𝑛 |              |     | = 3,𝑙𝑒𝑎𝑟𝑛𝑖𝑛𝑔 |     | 𝑎𝑡𝑒 | = 0.1,𝑟𝑎𝑛𝑑𝑜𝑚 | 𝑡𝑎𝑡𝑒 = 42.       |     |
|     | 𝑠𝑎𝑚𝑝𝑙𝑒𝑠_𝑙𝑒𝑎𝑓 |     |              |     | 𝑟   |              | 𝑠                |     |
6.3  Training and Evaluation Protocol
All five models are trained on the 2023–2024 dataset (115 rows) and evaluated on the
2025 dataset (60 rows). Three metrics are computed per model per category, then
averaged:

•  Mean Absolute Error (MAE): interpretable in currency units; the primary
1
|     | evaluation metric.  MAE= |     |     |     |     | ∑𝑛 |𝑦 −𝑦̂|  |     |     |
| --- | ------------------------ | --- | --- | --- | --- | ----------- | --- | --- |
|     |                          |     |     |     |     | 𝑖=1 𝑖 𝑖     |     |     |
𝑛
•  Root Mean Squared Error (RMSE): penalizes large errors more strongly than
1
|     | MAE. RMSE |     | =   | √ ∑𝑛 | (𝑦 −𝑦̂)2  |     |     |     |
| --- | --------- | --- | --- | ---- | --------- | --- | --- | --- |
|     |           |     |     |      | 𝑖=1 𝑖     | 𝑖   |     |     |
𝑛
•  Coefficient of determination (R²): proportion of variance explained; R² = 1.0 is
|     | perfect.  𝑅2 |     |     | 𝑆𝑆res  |     |     |     |     |
| --- | ------------ | --- | --- | ------ | --- | --- | --- | --- |
= 1−
𝑆𝑆tot

17

6.4  Model Comparison Results
Table 6: Average model performance across all eight categories (test set, 2025). Gradient Boosting is highlighted.
| Model              | Avg MAE  | Avg RMSE  | Avg R²  | Train time  |
| ------------------ | -------- | --------- | ------- | ----------- |
|                    | ($)      | ($)       |         |             |
| Linear Regression  | 114.21   | 161.48    | 0.9304  | 0.01 s      |
| Decision Tree      | 115.23   | 196.57    | 0.9021  | 0.02 s      |
| Random Forest      | 106.93   | 161.76    | 0.9332  | 0.55 s      |
| Gradient Boosting  |  90.98   | 150.96    | 0.9415  | 0.41 s      |
| Support Vector     | 143.98   | 232.15    | 0.8561  | 0.02 s      |
Regression

Gradient Boosting achieves the lowest MAE ($90.98), lowest RMSE ($150.96), and
highest R² (0.9415) among all five models. The 15% MAE reduction relative to Random
Forest ($106.93 → $90.98) is consistent with Gradient Boosting's known advantage on
moderate-size tabular datasets where sequential error correction outperforms parallel
aggregation.

Figure 4: Bar chart comparing average MAE across five regression models. Gradient Boosting achieves the lowest
average MAE at $90.98.
18

Figure 5: Bar chart comparing average R² across five models. Gradient Boosting achieves the highest R² at 0.9415.
6.5  Per-Category Error Analysis
Averaging across categories conceals important variation. Table 6.2 shows the per-
category MAE for the selected Gradient Boosting model.

Table 7: Per-category MAE for Gradient Boosting. Categories sorted by difficulty.
| Category  | MAE ($)  | Difficulty  | Reason                              |
| --------- | -------- | ----------- | ----------------------------------- |
| other     |  43.46   | Low         | Stable catch-all category with low  |
variance.
| transport  |  46.17  | Low  | Consistent commute patterns; low  |
| ---------- | ------- | ---- | --------------------------------- |
seasonal variation.
| health  |  49.56  | Low  | Infrequent but predictable recurring  |
| ------- | ------- | ---- | ------------------------------------- |
expenses.
entertainment   52.19  Low  Moderate variance; well-correlated
with previous month.
utilities   96.01  Medium  Seasonal variation captured by month
feature.
| food  | 102.33  | Medium  | Consistent but varies with persona  |
| ----- | ------- | ------- | ----------------------------------- |
income scale.
| shopping  | 143.21  | High  | Discretionary spikes; irregular  |
| --------- | ------- | ----- | -------------------------------- |
purchase events.
travel  194.94  Very high  Sporadic; seasonal; large amplitude
variation.
19

Travel is by far the hardest category, with MAE nearly four times higher than transport.
Shopping is the second-hardest category due to discretionary purchase events. This
category-level analysis has a direct consequence for the control experiment: volatile
categories create the largest month-to-month prediction jumps in the direct ML
strategy, which is precisely what the adaptive smoothing controller is designed to
moderate.
Figure 6: Per-category MAE heatmap for all five models. Travel is consistently the hardest category across all
models.
6.6 Feature Ablation Study
Feature ablation quantifies the marginal contribution of each feature by measuring the
MAE change when that feature is excluded from training.
20

Table 8: Complete feature ablation results. Positive MAE change = feature is useful; negative = feature introduces
noise.
| Removed feature  | MAE          | MAE     |   Impact  | Interpretation          |
| ---------------- | ------------ | ------- | --------- | ----------------------- |
|                  | without ($)  | change  | %         |                         |
| month            | 113.80       | +6.88   |   +6.43%  | Strongest contributor.  |
Seasonality is critical for
travel, utilities,
entertainment.
| prev_total  | 110.05  | +3.12  |   +2.92%  | Previous total spend  |
| ----------- | ------- | ------ | --------- | --------------------- |
captures spending scale
better than income
alone.
| prev_travel  | 108.07  | +1.14  |   +1.07%  | Travel history helps  |
| ------------ | ------- | ------ | --------- | --------------------- |
predict future travel.
prev_entertainment  107.70  +0.77    +0.72%  Some cross-month
correlation in
entertainment.
| prev_shopping  | 107.34  | +0.41  |   +0.38%  | Weak contribution.   |
| -------------- | ------- | ------ | --------- | -------------------- |
| income         | 107.13  | +0.20  |   +0.18%  | Negligible: already  |
encoded in previous
spending levels.
prev_health  106.72  −0.21    −0.20%  Removing slightly helps:
health is stable; feature
adds noise.
| prev_utilities  | 106.48  | −0.45  |   −0.42%  | Utilities are more  |
| --------------- | ------- | ------ | --------- | ------------------- |
seasonal than habit-
based.
| prev_transport  | 104.05  | −2.88  |   −2.69%  | Cross-category  |
| --------------- | ------- | ------ | --------- | --------------- |
interference.
| prev_food  | 103.40  | −3.53  |   −3.30%  | Cross-category noise:  |
| ---------- | ------- | ------ | --------- | ---------------------- |
food spend does not
predict other categories
well.
| prev_other  | 103.27  | −3.66  |   −3.42%  | Largest noise source:  |
| ----------- | ------- | ------ | --------- | ---------------------- |
catch-all category is
uninformative as a
predictor.

21

Two findings deserve emphasis. First, the month feature is the single most important
predictor, confirming that seasonality is the dominant pattern in the synthetic spending
process. Second, several previous-category features are net negative contributors:
removing prev_food, prev_other, and prev_transport actually improves performance,
revealing cross-category interference. The standard 11-feature set is retained for the
control experiment to maintain consistency with the deployed application.
Figure 7: Feature ablation bar chart. Positive values (month, prev_total) indicate useful features; negative values
(prev_food, prev_other, prev_transport) indicate noise-introducing features.
6.7 Hyperparameter Search
A grid search explored 𝑛 ∈ {50, 100, 200, 300} and 𝑚𝑎𝑥 ∈ {2, 4, 6, 8, 10}.
𝑒𝑠𝑡𝑖𝑚𝑎𝑡𝑜𝑟𝑠 𝑑𝑒𝑝𝑡ℎ
The best configuration found was 𝑛 = 300, 𝑚𝑎𝑥 = 2, achieving MAE =
𝑒𝑠𝑡𝑖𝑚𝑎𝑡𝑜𝑟𝑠 𝑑𝑒𝑝𝑡ℎ
$80.09. The production configuration (n_estimators = 100, max_depth = 4) achieves
MAE = $90.98 but provides a better trade-off between accuracy and training complexity.
The improvement from production to optimal configuration is 12%, while training time
triples. Notably, shallower trees (𝑚𝑎𝑥 = 2) consistently outperform deeper trees in
𝑑𝑒𝑝𝑡ℎ
22

Gradient Boosting — a pattern consistent with the sequential residual-correction
design, where shallow learners reduce overfitting risk at each boosting stage.
6.8 Model Selection Rationale
Gradient Boosting is selected as the prediction component for the adaptive budget
control experiment because it achieves the best empirical performance across all three-
evaluation metrics on the synthetic dataset. This selection is based purely on evidence
from the comparison experiment. The model is saved as budget_model_v2.pkl and used
consistently in both the backend inference path and the SIL control simulation,
eliminating any model-mismatch risk between the deployed application and the
academic evaluation.
23

7 ADAPTIVE BUDGET CONTROL METHOD
7.1 Motivation
Figure 8: Block diagram of the adaptive budget control method and its connection to the
software product.
A machine learning prediction model estimates expected spending. It does not, by itself,
produce a budget. A budget must satisfy three requirements: it must be feasible (total
allocation must not exceed spendable income), it must respect a saving target, and it
must be stable enough to be practically usable. The adaptive controller is introduced to
enforce these requirements on top of the ML prediction.
7.2 The Four Compared Strategies
Strategy 1 — Static Budget (open-loop baseline): spendable income is allocated
according to fixed category weights, with no feedback, no prediction, and no adaptation:
𝐵 (𝑐) = (𝐼 −𝑆)⋅𝑤 (7.1)
𝑠𝑡𝑎𝑡𝑖𝑐 𝑐
where I = income, S = saving target, and 𝑤 = fixed weight for category c (food 25%,
𝑐
transport 10%, shopping 12%, entertainment 8%, utilities 18%, health 8%, travel 7%,
other 12%).
24

Strategy  2  —  Last-Month  Baseline  (proportional  feedback):  the  previous  month's
spending distribution is used as the next budget distribution, making it sensitive to
anomalous expenses:
|     | (𝑐,𝑡) | 𝐴(𝑐,𝑡−1)   | ⋅(𝐼−𝑆)  |     |        |
| --- | ----- | ---------- | ------- | --- | ------ |
|     | 𝐵     | =          |         |     | (7.2)  |
|     | 𝐿𝑀    | ∑ 𝐴(𝑗,𝑡−1) |         |     |        |
𝑗

Strategy 3 — Direct ML Prediction (feedforward): the Gradient Boosting prediction is
used as the budget distribution, achieving the lowest tracking error but producing sharp
month-to-month changes for volatile categories:
𝑦ˆ (𝑡)
|     | 𝐵 (𝑐,𝑡) | = 𝑐 | ⋅(𝐼 −𝑆)  |     | (7.3)  |
| --- | ------- | --- | -------- | --- | ------ |
𝑀𝐿
∑ 𝑦ˆ (𝑡)
𝑗 𝑗

Strategy 4 — Adaptive Controller (feedback-regulated feedforward): ML predictions are
combined with the previous budget through exponential smoothing, then normalized
under the income constraint:
|     | 𝐵 (𝑐,𝑡) | = 𝛼⋅𝐵(𝑐,𝑡−1)+(1−𝛼)⋅𝐵 |         | (𝑐,𝑡)  | (7.4)  |
| --- | ------- | -------------------- | ------- | ------ | ------ |
|     | 𝑎𝑑𝑎𝑝𝑡   |                      |         | 𝑀𝐿     |        |
|     |         | 𝐵                    | (𝑐,𝑡)   |        |        |
|     | 𝐵 (𝑐,𝑡) | = 𝑎𝑑𝑎𝑝𝑡              | ⋅(𝐼−𝑆)  |        | (7.5)  |
𝑓𝑖𝑛𝑎𝑙
|     |     | ∑ 𝑗 𝐵 𝑎𝑑𝑎𝑝𝑡 | (𝑗,𝑡) |     |     |
| --- | --- | ----------- | ----- | --- | --- |
At α = 0, the controller reduces to direct ML prediction; at α = 1, it reduces to the
previous budget. The selected value α = 0.7 means 70% of the next budget comes from
the previous budget and 30% from the new ML prediction.
7.3  Alpha Sensitivity Analysis
Table 9: Alpha sensitivity analysis results.
| α value  |     | Tracking  | Stability ($)  | OSR  Interpretation  |     |
| -------- | --- | --------- | -------------- | -------------------- | --- |
error ($)
| 0.1 (most  |     | 182.62  | 822.41  | 24.2%  Near-ML accuracy but  |     |
| ---------- | --- | ------- | ------- | ---------------------------- | --- |
reactive)  high volatility.
| 0.3  |     | 185.94  | 638.67  | 24.4%  Modest smoothing; still  |     |
| ---- | --- | ------- | ------- | ------------------------------- | --- |
volatile.
| 0.5  |     | 192.99  | 464.63  | 23.8%  Balance point; best  |     |
| ---- | --- | ------- | ------- | --------------------------- | --- |
overspend rate.
25

0.7 202.55 289.48 24.4% Strong stability
(selected) reduction; acceptable
accuracy loss.
0.9 (most 216.91 111.82 26.2% Very stable but too slow
stable) to respond; overspend
rises.
The selection criterion for α = 0.7 is: it achieves the largest absolute reduction in budget
instability (from $919.93 for direct ML to $289.48, a 68.5% reduction) while maintaining
a tracking error improvement of at least 35% over the static baseline (actual: 39.7%).
The gain in stability from α = 0.5 to α = 0.7 outweighs the marginal loss in accuracy.
Figure 9: Alpha sensitivity dual-axis chart: tracking error (left axis) and budget instability (right axis) as functions of
alpha. The selected value α = 0.7 is marked.
7.4 Stability Analysis
The adaptive controller (7.4) – (7.5) is stable in the Bounded-Input Bounded-Output
sense. The Z-domain characterization of the filter is given in Section 3.5; The proof is as
follows: 𝐵 (𝑐,𝑡) is bounded by the spendable income ceiling (I − S) through the
𝑀𝐿
normalization in (7.3);𝐵(𝑐,𝑡−1) is bounded by (I − S) because the normalization in (7.5)
was applied in the previous step. Therefore 𝐵 (𝑐,𝑡) is a convex combination of two
𝑎𝑑𝑎𝑝𝑡
quantities bounded by (I − S):
26

0 ≤ 𝐵 (𝑐,𝑡) ≤ 𝐼 −𝑆 (7.6)
𝑎𝑑𝑎𝑝𝑡
The normalization in (7.5) then guarantees ∑ 𝐵 (𝑐,𝑡) = 𝐼 −𝑆 exactly, enforcing
𝑐 𝑓𝑖𝑛𝑎𝑙
feasibility at every time step. The controller cannot, under any valid input conditions,
produce a budget that overspends the available income.
7.5 SIL Simulation Procedure
The software-in-the-loop simulation in control_evaluation.py executes the following
steps: (1) load monthly_summary.csv and generate prev_* features; (2) train eight
Gradient Boosting models on the 2023–2024 training period; (3) iterate over the 60 test
months (2025, all five personas); (4) for each test month, apply all four strategies using
the same input state; (5) compute tracking error, overspend rate, budget stability, and
allocation accuracy; (6) run the alpha sensitivity loop (α ∈ {0.1, 0.3, 0.5, 0.7, 0.9})
separately; (7) save all results to control_results.json and generate chart files. The
adaptive controller maintains a separate previous-budget state for each persona,
ensuring state does not leak across users.
27

8 EXPERIMENTAL EVALUATION AND RESULTS
8.1 Evaluation Setup
Figure 10: Block diagram of the experimental evaluation setup — software-in-the-loop simulation
procedure.
The software-in-the-loop simulation evaluates four budget allocation strategies across
60 test months (5 personas × 12 months, year 2025). Each monthly case produces a
budget vector of dimension 8, resulting in 480 category-month observations per
strategy. The saving target is fixed at 15% of income for all personas; the adaptive
controller uses α = 0.7 as justified in Chapter 7.
8.2 Evaluation Metrics
Four metrics are used. Tracking Error (TE) measures the average absolute difference
between recommended budget and actual spending:
1
𝑇𝐸 = ∑ |𝐴(𝑐,𝑡)−𝐵(𝑐,𝑡)|, 𝑁 = 480 (8.1)
𝑐,𝑡
𝑁
Category Overspend Rate (OSR) measures the fraction of category-months where actual
spending exceeds budget by more than a 5% tolerance:
28

count{𝐴(𝑐,𝑡)>1.05⋅𝐵(𝑐,𝑡)}
|     | 𝑂𝑆𝑅 = |     |     |     |     | (8.2)  |
| --- | ----- | --- | --- | --- | --- | ------ |
480
Budget Stability (ST) measures the average L1 norm of the month-to-month budget
change per user:
1
|     | 𝑆𝑇 = | ∑ ∑ |𝐵(𝑐,𝑡)−𝐵(𝑐,𝑡−1)|  |     |     |     | (8.3)  |
| --- | ---- | ---------------------- | --- | --- | --- | ------ |
𝑡 𝑐
𝑇
Allocation Accuracy (AA) measures cosine similarity between the budget and actual
spending distribution vectors:
|     | 𝐴𝐴 = | 𝐵⋅𝐴   |     |     |     | (8.4)  |
| --- | ---- | ----- | --- | --- | --- | ------ |
‖𝐵‖⋅‖𝐴‖
8.3  Main Results
Table 10: Main software-in-the-loop control experiment results (60 test months, 5 personas, 8 categories).
| Strategy  |     | TE ($)  | vs  | OSR  | ST ($)  | AA  |
| --------- | --- | ------- | --- | ---- | ------- | --- |
static
| Static Budget  |     | 335.64  | —       | 35.4%  | 0.00      | 95.6%  |
| -------------- | --- | ------- | ------- | ------ | --------- | ------ |
| Last-Month     |     | 219.78  | −34.5%  | 30.4%  | 1,210.58  | 98.5%  |
Baseline
| Direct ML  |     | 181.91  | −45.8%  | 24.8%  | 919.93  | 99.3%  |
| ---------- | --- | ------- | ------- | ------ | ------- | ------ |
Prediction
| Adaptive Controller  |     | 202.55  | −39.7%  | 24.4%  | 289.48  | 98.7%  |
| -------------------- | --- | ------- | ------- | ------ | ------- | ------ |

Figure 11: Four-panel bar chart comparing all four strategies across all four metrics.
8.4  Tracking Error Analysis
Direct  ML  prediction  achieves  the  lowest  tracking  error  at  $181.91,  a  45.8%
improvement over static budgeting. The adaptive controller achieves $202.55, a 39.7%
29

improvement. The accuracy cost of smoothing is $20.64 per category-month on average
(11.3% reduction relative to direct ML prediction). Last-month budgeting performs
worse than direct ML despite using real observed data because, in volatile categories,
last month's spending is a worse predictor than the model's learned seasonal pattern.
Figure 12: Tracking error across 60 test months for all four strategies. Note the higher volatility of direct ML
compared to adaptive controller.
8.5 Budget Stability Analysis
The adaptive controller's advantage is most pronounced in budget stability. Among
responsive strategies, the adaptive controller at $289.48 is dramatically smoother than
direct ML prediction at $919.93 and the last-month baseline at $1,210.58. The reduction
in instability from direct ML prediction to adaptive control is:
919.93−289.48
= 68.5% (8.5)
919.93
The adaptive controller accepts an 11.3% accuracy penalty in exchange for a 68.5%
stability improvement — a favorable trade-off for a user-facing recommendation system
where month-to-month consistency is a prerequisite for user trust.
8.6 Overspending Analysis
All four strategies produce overspend rates between 24.4% and 35.4%. The static
budget's 35.4% rate is highest because fixed percentages systematically under-budget
categories during high-demand months. The adaptive controller achieves the lowest
overspend rate at 24.4%, marginally better than direct ML prediction at 24.8%. The
30

improvement is small (0.4 percentage points) and should not be overstated; the primary
value of the adaptive controller is budget stability.
8.7 The Accuracy-Stability Trade-Off
The central thesis result: direct ML prediction is the most accurate budget strategy, but
the adaptive controller provides the best practical trade-off for user-facing budget
recommendation by sacrificing 11% accuracy for a 69% improvement in stability.
Figure 13: Accuracy-stability scatter plot: each strategy is plotted at (tracking error, budget instability). The ideal
point is bottom-left. Adaptive Controller is closest to the ideal among responsive strategies.
8.8 Answer to the Research Question
Research question: Can a machine-learning-assisted adaptive controller provide a better
trade-off between budget tracking accuracy, overspending prevention, and budget
stability than static budgeting or direct ML prediction alone?
Answer: Yes, within the limits of the synthetic software-in-the-loop simulation. The
adaptive controller (α = 0.7) achieves a 39.7% improvement in tracking error over static
budgeting, reduces overspend rate to 24.4%, and reduces budget instability by 69%
compared with direct ML prediction. The cost is an 11.3% reduction in tracking accuracy
relative to direct ML prediction. The adaptive controller is not the most accurate
31

predictor — that is direct ML prediction. Its value is the accuracy-stability compromise it
provides for practical, user-facing budget recommendation.
8.9 Threats to Validity
Five threats to validity must be acknowledged:
• Synthetic data: the model learns patterns embedded by the generator; real
spending contains psychological dynamics not captured in the simulation.
• Limited test size: 60 test months across 5 personas is sufficient for a controlled
comparison but insufficient for strong statistical generalization. No confidence
intervals are reported.
• No behavioral feedback loop: the simulated user does not change spending in
response to the recommendation.
• Simple controller design: exponential smoothing is a first-order IIR filter; PID,
Kalman, or MPC approaches might achieve better trade-offs.
• Feature selection inconsistency: the ablation study reveals several prev_*
features are net negative contributors, but the full 11-feature set is retained for
consistency with the deployed application.
32

9 WEB APPLICATION IMPLEMENTATION
9.1 Purpose of the Web Application
Figure 14: Block diagram of the web application runtime architecture and AI pipeline integration.
The web application functions as an experimental platform through which the proposed
AI-assisted budgeting and soft-sensing concepts are implemented, tested, and
demonstrated. Its academic value is not that it is a finance app, but that it demonstrates
how AI prediction, soft sensing, and human-supervised control can be combined in a
working software system. Without this implementation layer, the thesis would remain
only a simulation study.
9.2 Overall Runtime Architecture
This section has been discussed on chapter 4
33

Figure 15: Dashboard screenshot showing financial summary.
9.3 AI Budget Optimizer Integration
When the user triggers AI optimization, the backend retrieves income, saving target,
existing budget values, and recent expense history from the database. It then invokes
predict_v2.py as a child process, which loads budget_model_v2.pkl and returns per-
category predictions. The backend scales predictions to the user's spendable budget
ceiling before returning the result to the frontend, where the user reviews a comparison
of current and recommended values before applying the changes. This design follows a
human-in-the-loop decision pattern: the AI proposes a control action but the user
confirms the update.
9.4 Expense Input and Multi-Modal Soft Sensing
The three input modes are described in detail in Section 3.3
34

10 LIMITATIONS AND FUTURE WORK
10.1 Limitations
10.1.1 Synthetic Dataset
All training and evaluation data is generated by the thesis author. The five personas
follow deterministic behavioral rules with stochastic noise. The model and controller
have never been tested on real user spending data. This is the single most important
limitation of the thesis.
10.1.2 No Behavioral Closed Loop
The simulation does not model how users respond to budget recommendations. A real
user might reduce spending in over-budgeted categories or ignore the recommendation
entirely. None of these behavioral dynamics are captured.
10.1.3 Simple Controller Design
Exponential smoothing is a first-order IIR filter. More sophisticated controllers — PID,
Kalman-filtered prediction, or Model Predictive Control — might achieve better
accuracy-stability trade-offs. Simplicity is appropriate for bachelor-level scope but is a
genuine limitation.
10.1.4 Fixed Alpha
The smoothing parameter α = 0.7 is fixed across all users, categories, and months.
Different categories have different volatility levels: travel benefits from more smoothing
than transport. A category-adaptive alpha, tuned online based on recent prediction
error variance, could improve the trade-off.
10.1.5 Statistical Significance
The experiment evaluates 60 test months, sufficient for observing consistent directional
differences but insufficient for strong statistical significance claims. No hypothesis tests
or confidence intervals are reported.
10.2 Future Work
Six directions for future work are identified:
35

• Real user data validation: replace the synthetic dataset with anonymized real
expense data to test whether the model and controller generalize beyond
synthetic behavioral rules.
• Category-adaptive smoothing: implement a per-category alpha that adjusts
based on recent prediction error variance.
• Advanced controller designs: implement and compare PID-style and Model
Predictive Control approaches against the exponential smoothing baseline.
• Behavioral response modelling: extend the SIL simulation to include a simple
behavioral model of user compliance, enabling evaluation of true closed-loop
dynamics.
• Expanded persona diversity: increase the number and diversity of synthetic
personas to test controller robustness across a wider behavioral space.
• User study for trust and usability: conduct a small user study measuring
whether budget stability improves user trust, compliance, and perceived
usefulness compared with direct ML prediction.
36

11 CONCLUSION
11.1 Summary of Work
This thesis investigated whether a machine-learning-assisted adaptive controller can
provide a better trade-off between budget tracking accuracy, overspending prevention,
and budget stability than static budgeting or direct ML prediction alone. The
investigation proceeded through five stages: generating a synthetic persona-based
spending dataset; training and comparing five regression models for category-level
spending prediction; designing a simple exponential-smoothing-based adaptive budget
controller; evaluating four strategies in software-in-the-loop simulation; and
interpreting the results through both a machine learning accuracy lens and a control-
system stability lens.
The system was implemented as Aura Finance, a full-stack personal finance application
with multi-modal soft sensing (voice, OCR, manual entry), a Gradient Boosting prediction
pipeline, an adaptive budget controller, and a React-based human-machine interface.
The system was framed within a Mechatronics and control-system architecture,
connecting its components to standard concepts of sensing, state estimation, predictive
control, constrained output, feedback, and HMI.
11.2 Main Findings
Gradient Boosting achieved the best average predictive performance among the five
evaluated models (MAE = $90.98, R² = 0.9415). Its sequential residual-correction
mechanism captures seasonal and persona-scale patterns in structured tabular financial
data more effectively than the other approaches.
In the control experiment, direct ML prediction achieved the lowest tracking error,
improving by 45.8% compared with static budgeting. The adaptive controller improved
tracking error by 39.7% over static budgeting while reducing budget instability by
approximately 68.5% compared with direct ML prediction — at a cost of 11.3% tracking
accuracy.
37

11.3 Contributions
The thesis makes four contributions. First, it proposes a control-system framing for
personal budget allocation that enables multi-objective evaluation across accuracy,
stability, and feasibility simultaneously. Second, it provides an empirical model
comparison that selects Gradient Boosting through evidence rather than assumption.
Third, it designs an adaptive budget controller whose stability can be proven analytically
(BIBO-stable, feasibility-guaranteed) and whose trade-off parameter is selected through
sensitivity analysis. Fourth, it contributes a software-in-the-loop evaluation framework
that can serve as a template for more advanced controller designs in future work.
11.4 Final Answer to the Research Question
The research question is answered in full in Section 8.9.
The broader conclusion is that treating personal budget allocation as a software control
problem — with formal objectives, a constrained controller, stability analysis, and multi-
metric evaluation — produces a more rigorous and academically defensible contribution
than presenting the same system as a finance web application with AI features.
38

REFERENCES AND LITERATURE
[1] Angel, S. Smart tools? A randomized controlled trial on the impact of three
different media tools on personal finance. Journal of Behavioral and Experimental
Economics, 74, (2018), pp. 104–111.
[2] Åström, K. J., Murray, R. M. Feedback Systems: An Introduction for Scientists and
Engineers. Princeton: Princeton University Press, 2008.
[3] Breiman, L. Random Forests. Machine Learning, 45, (2001), pp. 5–32.
[4] Chen, X., Salem, M., Das, T., Chen, X. Real Time Software-in-the-Loop Simulation for
Control Performance Validation. Simulation, 84, (2008), 8–9, pp. 399–407.
[5] Cortes, C., Vapnik, V. Support-vector networks. Machine Learning, 20, (1995), pp.
273–297.
[6] Endsley, M. R. Toward a theory of situation awareness in dynamic systems. Human
Factors, 37, (1995), 1, pp. 32–64.
[7] Friedman, J. H. Greedy function approximation: A gradient boosting machine. The
Annals of Statistics, 29, (2001), 5, pp. 1189–1232.
[8] Grinsztajn, L., Oyallon, E., Varoquaux, G. Why tree-based models still outperform
deep learning on tabular data. Advances in Neural Information Processing Systems,
35, (2022), pp. 507–520.
[9] Hyndman, R. J., Athanasopoulos, G. Forecasting: Principles and Practice. 3rd ed.
Melbourne: OTexts, 2021. Available at: https://otexts.com/fpp3 [6 May 2026].
[10] Institution of Mechanical Engineers. What is Mechatronics. Available at:
https://www.imeche.org/industry-sectors/mechatronics-informatics-and-
control/about-the-mechatronics-informatics-and-control-group/what-is-
mechatronics [6 May 2026].
[11] Kadlec, P., Gabrys, B., Strandt, S. Data-driven Soft Sensors in the process industry.
Computers and Chemical Engineering, 33, (2009), 4, pp. 795–814.
[12] Lukas, M. F., Howard, R. C. The Influence of Budgets on Consumer Spending.
Journal of Consumer Research, 49, (2023), 5, pp. 697–720.
39

[13] Mozilla Developer Network. Web Speech API. Available at:
https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API [6 May
2026].
[14] Nagaraja, N. et al. Role of noise elimination algorithms in speech processing
applications. Engineering Applications of Artificial Intelligence, 148, (2025).
[15] Nunes, I., Jannach, D. A systematic review and taxonomy of explanations in
decision support and recommender systems. User Modeling and User-Adapted
Interaction, 27, (2017), pp. 393–444.
[16] Sargent, R. G. Verification and validation of simulation models. Journal of
Simulation, 7, (2013), 1, pp. 12–24.
[17] Sprague, R. H., Carlson, E. D. Building Effective Decision Support Systems.
Englewood Cliffs: Prentice-Hall, 1982.
[18] Tomizuka, M. Mechatronics: from the 20th to 21st century. Control Engineering
Practice, 10, (2002), 8, pp. 877–886.
[19] Yoshimura, T. et al. End-to-End Automatic Speech Recognition Integrated With
CTC-Based Voice Activity Detection. In: Proceedings of ICASSP 2020. Barcelona:
IEEE, 2020.
40