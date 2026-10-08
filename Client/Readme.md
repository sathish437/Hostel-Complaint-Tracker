You are implementing a production-quality full-stack web application for the ELEVIX 1.0 hackathon problem statement:

**F5 — Hostel Complaint Tracker**

Build a real, deployable hostel complaint management system, NOT a demo-only prototype.

## 1. CORE PRODUCT IDEA

The system manages hostel complaints from submission to resolution.

The key workflow is:

Student submits complaint
→ system categorizes complaint
→ Hostel Office controls assignment mode
→ if Automation Mode is ON, system automatically assigns the appropriate staff
→ if Automation Mode is OFF, Hostel Office manually assigns the staff
→ assigned staff handles the complaint
→ SLA is tracked
→ if SLA is breached, escalation workflow is triggered
→ student receives resolution request
→ student confirms or rejects resolution
→ complaint is closed or reopened.

The system must provide transparency, accountability, SLA monitoring, escalation, notifications, history, and role-based access.

---

# 2. CRITICAL RULES

### RULE 1 — OPENAPI CONTRACT

A locked `openapi.yaml` is part of the hackathon problem.

If `openapi.yaml` is present in the project:

- Read it FIRST.
- Treat it as the source of truth for API paths, HTTP methods, request bodies, response bodies, field names, data types, validation, and status codes.
- Do NOT invent conflicting endpoints.
- Do NOT rename contract fields merely for convenience.
- Make the implementation pass the locked contract tests.
- If the current architecture conflicts with the OpenAPI contract, adapt the implementation to the contract.

If `openapi.yaml` is not present, clearly identify the missing contract and continue only with components that can safely be implemented without violating it.

### RULE 2 — NO-AI CORE

The organizers require the following core components to be handwritten and understood by the team:

- SLA timer
- Escalation rules engine

DO NOT generate or implement these two core algorithms automatically as a finished copy-paste solution.

Instead:
- create clean interfaces/contracts around them,
- create integration points,
- create tests and documentation,
- clearly mark the exact places where the team must implement the handwritten business logic.

The rest of the application may be implemented normally.

### RULE 3 — DO NOT OVERENGINEER

Use a modular monolith.

Do NOT introduce:
- microservices
- Kafka
- Kubernetes
- Eureka
- API Gateway
- unnecessary distributed systems

The project must be reliable and achievable within a 12-hour hackathon.

---

# 3. TECHNOLOGY STACK

## Backend

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- PostgreSQL
- Spring Security
- JWT authentication
- Bean Validation
- Lombok only if it genuinely improves maintainability
- OpenAPI compatibility
- Maven

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios or equivalent HTTP client
- React Hook Form if useful
- Clean responsive UI

## Database

PostgreSQL.

Use proper:
- primary keys
- foreign keys
- indexes
- unique constraints
- timestamps
- enums where appropriate

---

# 4. USER ROLES

Implement these roles:

### STUDENT

Can:
- register/login
- create complaints
- view own complaints
- view complaint details
- view timeline/history
- upload evidence
- track assignment
- track SLA
- receive notifications
- confirm resolution
- reject resolution and reopen complaint

### HOSTEL_OFFICE

Can:
- view all complaints
- review complaints
- control Automation Mode
- manually assign complaints
- override automatic assignment
- reassign complaints
- monitor SLA
- view escalated complaints
- coordinate operations

### ELECTRICIAN

Handles:
- electrical complaints

### CLEANING_WORKER

Handles:
- cleaning/hygiene complaints

### MASTER

Handles:
- food/mess complaints

### WATCHMAN

Handles:
- security complaints

### DEPUTY_WARDEN

Can:
- view escalated complaints
- handle escalations
- monitor SLA breaches
- reassign/escalate where permitted
- monitor staff workload

### WARDEN

Can:
- view complete hostel operation
- view all complaints
- view escalations
- view SLA analytics
- handle major escalations
- manage high-level settings
- view reports

---

# 5. HOSTEL STAFF STRUCTURE

Use the actual hostel structure:

Hostel Office
Warden
Deputy Warden
Electrician
Cleaning Workers
Master
Watchman

Do NOT invent additional staff roles.

---

# 6. COMPLAINT CATEGORIES

Initial categories:

1. ELECTRICAL
2. WATER_PLUMBING
3. CLEANING_HYGIENE
4. FOOD_MESS
5. SECURITY
6. ROOM_FURNITURE
7. INTERNET
8. GENERAL

Initial routing recommendations:

ELECTRICAL → ELECTRICIAN

CLEANING_HYGIENE → CLEANING_WORKER

FOOD_MESS → MASTER

SECURITY → WATCHMAN

ROOM_FURNITURE → HOSTEL_OFFICE

WATER_PLUMBING → HOSTEL_OFFICE

INTERNET → HOSTEL_OFFICE

GENERAL → HOSTEL_OFFICE

Make routing configurable where practical so that future hackathon twists can modify rules without rewriting the entire application.

---

# 7. IMPORTANT FEATURE — AUTOMATION ON/OFF

This is a core feature.

Hostel Office must have an **Assignment Automation Control**.

UI:

------------------------------------------------
COMPLAINT ASSIGNMENT AUTOMATION
------------------------------------------------

Automatic Assignment: [ ON / OFF ]

ON:
New complaints are automatically routed to the appropriate staff based on category/routing rules.

OFF:
New complaints remain in the Hostel Office assignment queue and must be manually assigned.

Current Mode:
🟢 AUTOMATIC
or
🟡 MANUAL

------------------------------------------------

Only authorized Hostel Office / Warden users can change this setting.

Every change must be recorded in the audit log.

Example:

10:30 AM
Hostel Office changed Assignment Automation
OFF → ON
Changed by: Office Admin

---

# 8. AUTOMATION ON FLOW

Student submits:

"Fan not working in Room B-203."

Backend:

Complaint created
→ category = ELECTRICAL
→ routing rule finds ELECTRICIAN
→ assignment automatically created
→ staff notification generated
→ SLA starts according to applicable rule
→ student sees assigned staff/status.

Example:

Student:
Fan not working

System:
Category: Electrical

Automatically Assigned:
Electrician

Status:
ASSIGNED

This should happen transactionally.

Do not create a complaint successfully and then leave assignment inconsistent.

---

# 9. AUTOMATION OFF FLOW

Student submits:

"Fan not working."

Backend:

Complaint created
→ category determined
→ no automatic staff assignment
→ complaint enters HOSTEL_OFFICE_QUEUE
→ Hostel Office sees "Unassigned"
→ Office selects staff
→ assignment created
→ staff notified
→ workflow continues.

Hostel Office UI:

Complaint:
CMP-1024
Fan not working
Room B-203
Category: Electrical

Assignment:
[ Select Staff ▼ ]

Suggested:
Electrician

[ ASSIGN ]

The system may recommend the normal responsible staff, but Office has final control in Manual Mode.

---

# 10. AUTOMATION OVERRIDE

Even when Automation Mode is ON, Hostel Office should be able to override an assignment when authorized.

Example:

Automatic:
Fan complaint → Electrician

But electrician is unavailable.

Office:
[ Reassign ]

→ select another authorized staff member

Record:
- original assignee
- new assignee
- reason
- who changed it
- timestamp

Do not silently overwrite assignment history.

---

# 11. COMPLAINT STATUS MODEL

Use a well-defined lifecycle.

Preferred states:

SUBMITTED
ASSIGNED
ACKNOWLEDGED
IN_PROGRESS
RESOLUTION_PENDING
RESOLVED
STUDENT_CONFIRMED
CLOSED
REOPENED
SLA_BREACHED
ESCALATED

Do not allow arbitrary status changes.

Define valid transitions.

For example:

SUBMITTED → ASSIGNED

ASSIGNED → ACKNOWLEDGED

ACKNOWLEDGED → IN_PROGRESS

IN_PROGRESS → RESOLUTION_PENDING

RESOLUTION_PENDING → STUDENT_CONFIRMED

RESOLUTION_PENDING → REOPENED

STUDENT_CONFIRMED → CLOSED

SLA breach/escalation must be handled through backend business rules.

---

# 12. STUDENT COMPLAINT FORM

Build a polished form.

Fields:

- category
- complaint type
- location/block
- room number
- description
- photo/evidence
- optional additional information

Do not ask the student to choose staff.

The system determines routing.

Show:

"Your complaint will be reviewed and assigned automatically/manually depending on hostel assignment settings."

---

# 13. STUDENT DASHBOARD

Create:

- Total complaints
- Active complaints
- Escalated complaints
- Resolved complaints
- Recent complaints
- Notifications

Cards:

Total
Active
Escalated
Resolved

Complaint list:

Complaint ID
Category
Description
Status
Assigned Staff
Created At
SLA state

Provide search/filter.

---

# 14. STUDENT COMPLAINT DETAILS

Show:

Complaint ID
Category
Description
Room/location
Priority
Current status
Assigned staff
SLA state
SLA deadline
Created timestamp
Updated timestamp

Timeline:

Complaint submitted
Assignment
Acknowledgement
Work started
Updates
SLA event
Escalation
Resolution
Student confirmation
Closure

Show evidence images.

Do not expose internal/private staff information unnecessarily.

---

# 15. STAFF DASHBOARD

Each staff member should get a role-aware dashboard.

Show:

- New assignments
- Accepted jobs
- In-progress jobs
- SLA approaching
- SLA breached
- Recently resolved

Each work item:

Complaint ID
Problem
Location
Priority
Created time
SLA state
Time remaining
Status

Actions:

Accept
Start Work
Add Update
Mark Resolution Pending

Only allow actions permitted for that staff role.

---

# 16. HOSTEL OFFICE DASHBOARD

This is one of the most important pages.

Show:

### Assignment Automation

ON/OFF toggle.

### Complaint Queue

Tabs:

All
Unassigned
Assigned
In Progress
SLA Approaching
SLA Breached
Escalated
Resolved

### Manual assignment

For unassigned complaints:

- show recommended staff
- allow staff selection
- allow assignment
- record assignment history

### Override

Allow authorized office users to reassign.

Require a reason for reassignment.

---

# 17. DEPUTY WARDEN DASHBOARD

Focus on:

- SLA breached complaints
- Escalated complaints
- High priority complaints
- Reopened complaints
- Staff workload

Each escalation:

Complaint
Current owner
Previous owner
Reason
SLA breach time
Escalation time
Current authority
Actions

---

# 18. WARDEN DASHBOARD

Build a management dashboard.

Metrics:

Total complaints
Open
Assigned
In Progress
Resolved
Closed
Escalated
SLA Breached

Category statistics:

Electrical
Plumbing
Cleaning
Food
Security
Furniture
Internet
General

Staff workload.

SLA performance.

Resolution rate.

Repeated complaints.

Recent escalations.

Use clean charts.

---

# 19. SLA ARCHITECTURE

Create a dedicated SLA module.

Suggested conceptual structure:

sla/
  SlaRule
  SlaPolicy
  SlaService
  SlaEvaluation
  SlaStatus

The team will implement the actual handwritten SLA calculation and breach logic.

The system must support:

- SLA duration
- deadline
- remaining time
- breached state
- breach timestamp
- resolution before/after SLA
- escalation trigger

Important:

SLA must be evaluated on the backend.

Do NOT trust frontend timers as the source of truth.

Frontend timer is display only.

---

# 20. ESCALATION ARCHITECTURE

Create dedicated escalation module.

Conceptual structure:

escalation/
  EscalationRule
  EscalationRecord
  EscalationService
  EscalationLevel

The team must write the core escalation decision logic manually.

System must support:

- current responsible role
- next escalation role
- escalation reason
- escalation timestamp
- escalation history
- prevention of duplicate escalation
- final escalation state

Never repeatedly escalate the same complaint on every API request.

---

# 21. STUDENT RESOLUTION CONFIRMATION

When staff marks:

RESOLUTION_PENDING

student sees:

"Has your complaint been resolved?"

Buttons:

[ YES, CLOSE COMPLAINT ]

[ NO, REOPEN COMPLAINT ]

If NO:

status → REOPENED

staff gets notification.

If YES:

status → CLOSED

Record confirmation timestamp.

---

# 22. NOTIFICATION SYSTEM

Implement an internal notification system.

Notification types:

COMPLAINT_CREATED
ASSIGNED
REASSIGNED
STATUS_CHANGED
SLA_APPROACHING
SLA_BREACHED
ESCALATED
RESOLUTION_PENDING
REOPENED
CLOSED

Each notification:

id
recipient
type
message
read/unread
createdAt
reference complaint

Provide notification bell in frontend.

---

# 23. AUDIT TRAIL

Every important action must be recorded.

Examples:

Complaint created
Assignment created
Assignment changed
Status changed
Automation setting changed
SLA breached
Escalation created
Resolution submitted
Student confirmed
Student reopened

Audit record:

actor
action
entity
old value
new value
timestamp
reason if applicable

Do not allow users to modify audit history.

---

# 24. SECURITY

Implement:

JWT authentication.

Password hashing.

Role-based authorization.

Backend endpoint protection.

Users must only see data they are authorized to see.

Examples:

Student A cannot access Student B's complaint.

Electrician cannot access unrelated administrative functionality.

Cleaning Worker cannot modify electrical assignments unless explicitly authorized.

Hostel Office can manage operational assignment.

Warden has full visibility.

Never rely only on frontend route guards.

---

# 25. FILE UPLOADS

Support complaint evidence.

Student:
Upload image.

Staff:
Optionally upload after-work evidence.

Validate:
- file type
- file size
- safe filename
- storage strategy

Do not store arbitrary executable files.

---

# 26. SEARCH / FILTER / PAGINATION

Complaint lists should support:

Search by complaint ID
Search by room
Search by category
Filter by status
Filter by priority
Filter by staff
Filter by SLA state
Filter by date

Use backend pagination.

Do not load thousands of complaints into the browser at once.

---

# 27. REPEATED COMPLAINTS

Provide a simple rule-based repeated complaint indicator.

Example:

Same room
Same category
Recent previous complaint

Show:

"Repeated issue detected."

Do not use an AI model.

This can help Warden identify recurring infrastructure problems.

---

# 28. DATABASE DESIGN

Design normalized relational tables based on the actual OpenAPI contract.

Likely concepts:

users
roles
complaints
categories
assignments
complaint_history
escalations
notifications
attachments
sla_rules
system_settings
audit_logs

Potentially:

hostel_blocks
rooms

Only create tables actually justified by requirements.

Add appropriate:
- foreign keys
- indexes
- unique constraints
- NOT NULL constraints

Use migrations rather than manually changing production schema.

---

# 29. ASSIGNMENT MODE SETTING

Persist the setting.

Example conceptual model:

SYSTEM_SETTINGS

key:
ASSIGNMENT_AUTOMATION_ENABLED

value:
true/false

Only authorized roles can change it.

Changing this setting must not retroactively reassign existing complaints.

Important:

If ON:
Only NEW complaints use automatic assignment.

If OFF:
NEW complaints wait for manual assignment.

Existing assignments remain unchanged unless an authorized user explicitly reassigns them.

---

# 30. FRONTEND UX

The UI must feel like a real product.

Requirements:

- responsive
- mobile-friendly
- desktop-friendly
- clean navigation
- consistent spacing
- loading states
- empty states
- error states
- success feedback
- confirmation dialogs
- accessible forms
- status badges
- SLA indicators
- notification system

Do not create a visually overloaded dashboard.

Use consistent design tokens.

---

# 31. ERROR HANDLING

Backend:

Use consistent API error format according to `openapi.yaml`.

Handle:

400 validation
401 authentication
403 authorization
404 not found
409 conflict
500 unexpected error

Frontend:

Display human-readable messages.

Never show raw stack traces.

---

# 32. TRANSACTIONAL SAFETY

Important operations should be transactional.

Especially:

Complaint creation + automatic assignment.

Assignment + notification.

Escalation + history + notification.

Resolution + status update.

Student confirmation + closure.

Do not leave half-completed state when one operation fails.

---

# 33. CONCURRENCY / DUPLICATE SAFETY

Protect against:

- double assignment
- duplicate escalation
- duplicate closure
- duplicate notifications where inappropriate

Two staff members should not accidentally become the active owner of the same complaint unless explicitly supported.

---

# 34. API LAYER

Follow the locked `openapi.yaml`.

Do not expose unnecessary internal endpoints.

Use DTOs instead of exposing JPA entities directly.

Validate request bodies.

Return correct HTTP status codes.

Keep controller thin.

Business logic belongs in services/rules.

Repository should handle persistence only.

---

# 35. ARCHITECTURE

Use:

Controller
↓
Service
↓
Domain/business rules
↓
Repository
↓
Database

For example:

ComplaintController
→ ComplaintService
→ AssignmentService
→ Repository

Do not put business logic into controllers.

Do not put business logic into repositories.

---

# 36. TESTING

Create tests for:

Authentication
Authorization
Complaint creation
Automatic assignment
Manual assignment
Assignment mode ON
Assignment mode OFF
Reassignment
Status transitions
SLA integration points
Escalation integration points
Student isolation
Staff permissions
Notification creation
Resolution confirmation
Reopen flow
Duplicate assignment prevention
Contract compatibility

For SLA and escalation:
Create tests around the interfaces and expected behavior, while leaving the core handwritten implementation to the team.

---

# 37. DEPLOYMENT READINESS

Prepare:

Frontend environment variables.

Backend environment variables.

Database configuration.

CORS configuration.

JWT secret from environment.

Production logging.

Health endpoint if permitted by contract.

No credentials hardcoded in Git.

Provide:

README
setup instructions
database setup
environment variables
run commands
deployment instructions

---

# 38. DEVELOPMENT ORDER

Implement strictly in this order.

### PHASE 1
Inspect `openapi.yaml`.

Produce:
- endpoint inventory
- request/response inventory
- authentication requirements
- validation requirements
- contract constraints

Do not code yet.

### PHASE 2
Create Spring Boot project.

### PHASE 3
Create React project.

### PHASE 4
Database configuration and migrations.

### PHASE 5
Authentication + RBAC.

### PHASE 6
User/role foundation.

### PHASE 7
Complaint domain.

### PHASE 8
Complaint creation.

### PHASE 9
Assignment system.

Implement BOTH:

Automation ON:
automatic assignment.

Automation OFF:
Hostel Office manual assignment.

### PHASE 10
Staff work queue.

### PHASE 11
Complaint status workflow.

### PHASE 12
SLA integration boundary.

STOP and let the team implement the handwritten SLA core.

### PHASE 13
Escalation integration boundary.

STOP and let the team implement the handwritten escalation core.

### PHASE 14
Notifications.

### PHASE 15
Student frontend.

### PHASE 16
Staff frontend.

### PHASE 17
Hostel Office dashboard.

### PHASE 18
Deputy Warden dashboard.

### PHASE 19
Warden dashboard.

### PHASE 20
Audit/history.

### PHASE 21
Testing.

### PHASE 22
Security review.

### PHASE 23
OpenAPI contract verification.

### PHASE 24
Production deployment.

---

# 39. CODING STYLE

Write clean, maintainable code.

Avoid:
- duplicated business logic
- giant controllers
- magic strings
- hardcoded staff IDs
- hardcoded escalation paths
- hardcoded SLA values throughout the code
- exposing entities directly
- unnecessary abstractions
- unnecessary libraries

Use:
- enums/value objects where appropriate
- configuration
- constants
- DTOs
- services
- clear naming
- validation
- meaningful exceptions

---

# 40. FINAL ACCEPTANCE CRITERIA

The application is complete only when all of these work:

### Student

✓ Login
✓ Create complaint
✓ Upload evidence
✓ View complaint
✓ Track status
✓ View assignment
✓ View timeline
✓ View SLA
✓ Receive notifications
✓ Confirm resolution
✓ Reopen unresolved complaint

### Hostel Office

✓ View all complaints
✓ Toggle Assignment Automation ON/OFF
✓ Automatic mode works
✓ Manual mode works
✓ See recommended assignee
✓ Assign manually
✓ Reassign
✓ Monitor SLA
✓ View escalations

### Staff

✓ Login
✓ View assigned work
✓ Accept
✓ Start
✓ Update
✓ Submit resolution
✓ View SLA
✓ Receive notifications

### Deputy Warden

✓ View escalations
✓ Handle escalations
✓ Monitor SLA breaches

### Warden

✓ View all complaints
✓ View escalations
✓ View analytics
✓ Monitor staff workload
✓ View SLA performance
✓ Manage high-level operations

### System

✓ Role-based authorization
✓ Complaint history
✓ Audit trail
✓ Notifications
✓ SLA integration
✓ Escalation integration
✓ Assignment automation
✓ Manual assignment
✓ Reassignment
✓ Student confirmation
✓ Reopen
✓ Search/filter
✓ Pagination
✓ Validation
✓ Error handling
✓ Database integrity
✓ OpenAPI contract compliance
✓ Production configuration

---

# 41. IMPORTANT IMPLEMENTATION BEHAVIOR

Before modifying code:

1. Inspect the existing repository.
2. Inspect `openapi.yaml`.
3. Inspect existing frontend/backend structure.
4. Reuse existing code where correct.
5. Do not delete working functionality unnecessarily.
6. Do not change API contracts without justification.
7. Implement one module at a time.
8. Run tests/build after each major module.
9. Fix compilation errors immediately.
10. Do not leave placeholder TODO implementations in production paths.

At the end of every implementation step, report:

- Files created
- Files modified
- APIs implemented
- Database changes
- Tests added
- Remaining issues
- Exact command to run/test the current phase

Do NOT proceed to the next phase until the current phase builds successfully.

The application must be designed as a real hostel operations platform, not as a static hackathon mockup.