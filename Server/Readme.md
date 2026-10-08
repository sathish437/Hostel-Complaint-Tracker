🏠 ELEVIX F5 — Hostel Complaint Tracker

Full End-to-End Solution Blueprint

Goal: Student complaint raise pannuvanga → system classify pannum → priority decide pannum → correct staff-ku route pannum → SLA timer run aagum → delay aana escalate aagum → staff resolution → student confirmation → close → full history/audit.


---

1. 🎯 Core Product

Users

Role	Main responsibility

👨‍🎓 STUDENT	Complaint create, track, confirm/reject resolution
🏢 HOSTEL_OFFICE	All complaints, manual assignment, override
⚡ ELECTRICIAN	Electrical complaints
🧹 CLEANING_WORKER	Cleaning/hygiene
🍛 MASTER	Food/mess
🔐 WATCHMAN	Security
👨‍💼 DEPUTY_WARDEN	Escalations
👨‍💼 WARDEN	Final escalation + analytics



---

2. 🏗️ Technology Stack

Frontend

React
TypeScript
Vite
Tailwind CSS
React Router
Axios
TanStack Query
React Hook Form
Zod
Recharts

Backend

Java
Spring Boot
Spring Web
Spring Data JPA
Spring Security
JWT
Bean Validation
Maven

Database

PostgreSQL

Deployment

Frontend → Vercel
Backend  → Render / Railway
Database → PostgreSQL

Architecture:

┌─────────────────┐
                    │     Student     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ React Frontend  │
                    └────────┬────────┘
                             │ REST
                             ▼
              ┌─────────────────────────────┐
              │      Spring Boot API        │
              │                             │
              │ Auth / Complaint / SLA      │
              │ Assignment / Escalation     │
              │ Notification / Audit        │
              └─────────────┬───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  PostgreSQL   │
                    └───────────────┘

Microservices வேண்டாம். Modular monolith is enough and much safer for 12 hours.


---

3. 📦 Main Backend Modules

backend/
└── src/main/java/.../
    ├── auth/
    ├── user/
    ├── complaint/
    ├── assignment/
    ├── sla/
    ├── escalation/
    ├── notification/
    ├── audit/
    ├── attachment/
    └── common/

Each module:

controller
service
repository
entity
dto
mapper
exception

Flow:

Controller
    ↓
Service
    ↓
Business Rules
    ↓
Repository
    ↓
PostgreSQL


---

4. 🗃️ Database Design

Exact fields should finally be matched against your locked openapi.yaml.

users

id
name
email
phone
password_hash
role
active
created_at
updated_at

complaints

id
complaint_number
student_id
category
description
location
priority
status
assignee_id
sla_deadline
created_at
updated_at
resolved_at
closed_at

assignments

id
complaint_id
assigned_to
assigned_by
assignment_type
reason
assigned_at

assignment_type:

AUTOMATIC
MANUAL
REASSIGNED

complaint_history

id
complaint_id
actor_id
action
old_value
new_value
reason
created_at

escalations

id
complaint_id
from_role
to_role
reason
trigger_type
created_at
resolved_at

notifications

id
user_id
complaint_id
type
title
message
read
created_at

attachments

id
complaint_id
file_name
file_url
content_type
uploaded_by
created_at

system_settings

id
key
value
updated_by
updated_at

Important setting:

ASSIGNMENT_AUTOMATION_ENABLED


---

5. 🔐 Authentication

Login:

Email
Password
   ↓
POST /auth/login
   ↓
JWT
   ↓
Frontend stores session
   ↓
Every API request → JWT

Backend must enforce roles.

Frontend route protection is only UX.

Important security rules

Student A:

GET complaint B
→ 403 Forbidden

Electrician:

Update complaint
→ only complaints assigned/authorized to electrician

Student:

Cannot change:
priority
assignee
SLA
escalation


---

6. 📝 Complaint Creation

Student sees:

Create Complaint

Category
Description
Location
Photo/Evidence

Example:

> "Bathroom exhaust fan not working and there is a burning smell."



System pipeline:

Complaint
    ↓
Category Detection
    ↓
Priority Detection
    ↓
SLA Selection
    ↓
Assignment Decision
    ↓
Notification
    ↓
Complaint Created


---

7. 🧠 Complaint Classification

Use:

Rule-Based Classification

AI/ML தேவையில்லை.

Example rule groups:

fan
light
switch
socket
wiring
geyser
exhaust fan
       ↓
ELECTRICAL

tap
pipe
leak
toilet
flush
drain
water
       ↓
WATER_PLUMBING

clean
garbage
mosquito
cockroach
rats
pest
       ↓
CLEANING_HYGIENE

and so on.

Categories

ELECTRICAL
WATER_PLUMBING
CLEANING_HYGIENE
ROOM_FURNITURE
INTERNET_WIFI
FOOD_MESS
SECURITY
DISCIPLINE
GENERAL


---

8. 🚦 Priority Engine

Four levels:

LOW
MEDIUM
HIGH
CRITICAL

Priority should consider:

Safety
Health
People affected
Service disruption
Complaint type
Emergency conditions

Example

Fan not working
→ MEDIUM

But:

Fan sparking + burning smell
→ CRITICAL

Similarly:

No water in one room
→ HIGH

but:

No water in entire block
→ CRITICAL


---

9. 👥 Assignment Engine

This is where your Electrician busy problem is solved.

Automation ON

Complaint
   ↓
Category
   ↓
Responsible staff
   ↓
Check workload
   ↓
Available?
 ┌───────┴────────┐
YES              NO
 ↓                 ↓
Assign        Hostel Office Queue

Example:

Electrical complaint
Electrician active workload = 5
Capacity = 3

Then:

LOW/MEDIUM
→ Office Queue

But:

CRITICAL electrical issue
→ immediate priority handling
→ escalation/urgent notification

Automation OFF

Student complaint
       ↓
Classification
       ↓
Hostel Office Queue
       ↓
Office manually assigns
       ↓
Staff notification

Important

Changing:

Automation ON → OFF

should not modify existing assignments.

It affects only new complaints.


---

10. 🏢 Hostel Office Dashboard

This is one of your strongest features.

Top:

Assignment Automation

        🟢 ON

Toggle:

ON  → automatic routing
OFF → manual assignment

Tabs:

All
Unassigned
Assigned
In Progress
SLA Approaching
SLA Breached
Escalated
Resolved

Complaint card:

#CMP-1042

Bathroom exhaust fan not working

Category     Electrical
Priority     MEDIUM
Status       ASSIGNED
Assigned to  Electrician
SLA          01:24:35 remaining

Actions:

View
Assign
Reassign
Change Priority
Escalate

Every override requires:

Reason


---

11. ⏱️ SLA Engine

This is your NO-AI CORE.

⚠️ Don't copy an AI-generated implementation for this part.
The hackathon specifically requires the SLA timer + escalation rules engine to be handwritten.

Conceptually:

Complaint created
       ↓
Determine SLA duration
       ↓
Calculate deadline
       ↓
Start timer
       ↓
Monitor deadline
       ↓
Approaching?
       ↓
Breached?

Example:

Complaint:
Fan not working

Priority:
MEDIUM

SLA:
2 hours

Created:
10:00 AM

Deadline:
12:00 PM

At:

11:30 → SLA approaching
12:00 → SLA breached

Frontend can display:

01h 30m remaining

But backend is source of truth.


---

12. 🚨 Escalation Engine

Also your NO-AI CORE.

Don't AI-generate/copy-paste the implementation.

Concept:

SLA Breached
      ↓
Who is responsible?
      ↓
Escalation rule
      ↓
Higher authority
      ↓
Notify
      ↓
Audit

Example:

Electrician
    ↓ SLA breached
Deputy Warden
    ↓ still unresolved
Warden

For critical complaints:

CRITICAL
   ↓
Immediate Deputy Warden notification

Potential escalation levels:

LEVEL 0 → Assigned Staff
LEVEL 1 → Deputy Warden
LEVEL 2 → Warden


---

13. 🔄 Complaint Lifecycle

Don't just use OPEN/CLOSED.

Use:

SUBMITTED
    ↓
ASSIGNED
    ↓
ACKNOWLEDGED
    ↓
IN_PROGRESS
    ↓
RESOLUTION_PENDING
    ↓
STUDENT_CONFIRMED
    ↓
CLOSED

If SLA fails:

IN_PROGRESS
    ↓
SLA_BREACHED
    ↓
ESCALATED

If student says problem still exists:

RESOLUTION_PENDING
       ↓
REOPENED
       ↓
IN_PROGRESS

This is excellent for the demo.


---

14. 👨‍🔧 Staff Workflow

Electrician dashboard:

My Work Queue

┌──────────────────────────┐
│ 🔴 Critical              │
│ Exposed wiring           │
│ SLA: 20 min              │
└──────────────────────────┘

┌──────────────────────────┐
│ 🟠 High                  │
│ Power trip               │
│ SLA: 1h 10m              │
└──────────────────────────┘

┌──────────────────────────┐
│ 🟡 Medium                │
│ Fan not working          │
│ SLA: 2h                   │
└──────────────────────────┘

Actions:

Accept
Start Work
Add Update
Mark Resolution Pending


---

15. 👨‍🎓 Student Workflow

Dashboard:

Welcome, Student

Total Complaints      12
Active                 3
Escalated              1
Resolved               8

Recent complaints:

CMP-1042
Fan not working

MEDIUM
IN_PROGRESS

SLA: 01:22:10

New Complaint:

Category
Description
Location
Upload Photo
Submit

Complaint details:

Complaint ID
Category
Priority
Status
Assigned Staff
SLA Deadline
Timeline
Evidence


---

16. ✅ Student Resolution Confirmation

This feature is very important.

Staff:

Mark Resolution Pending

Student gets:

> Has your complaint been resolved?



Buttons:

✅ Yes, resolved
❌ No, still a problem

Yes:

→ CLOSED

No:

→ REOPENED
→ staff notified

This prevents staff from simply marking everything resolved.


---

17. 🔔 Notifications

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

Example:

> 🔔 Complaint CMP-1042 has been assigned to you.



SLA:

> ⚠️ Complaint CMP-1042 SLA will breach in 20 minutes.



Escalation:

> 🚨 Complaint CMP-1042 has breached SLA and was escalated.




---

18. 📜 Audit Trail

Every important action:

WHO
WHAT
WHEN
OLD VALUE
NEW VALUE
REASON

Example:

10:02 AM
Hostel Office

Assigned complaint
Old: Unassigned
New: Electrician
Reason: Electrical category

Another:

12:01 PM

SYSTEM

SLA breached

Assigned to: Electrician
Escalated to: Deputy Warden

This gives transparency.


---

19. 📊 Warden Dashboard

Top cards:

Total Complaints
Open
In Progress
Resolved
Closed
Escalated
SLA Breached

Charts:

Complaints by category

Electrical       ███████████
Water            ████████
Cleaning         ██████
Food             █████
Security         ███
Furniture        ███
Wi-Fi            ██

Staff workload

Electrician       5 active
Cleaning Worker   2 active
Master             3 active
Watchman           1 active

SLA performance

Within SLA       87%
Breached          13%

Repeated complaints

Room 203
Electrical
4 complaints in 7 days

⚠ Repeated issue detected


---

20. 🔁 Repeated Complaint Detection

Simple rule.

Example:

Same room
+
Same category
+
Recent time window

If repeated:

⚠ Repeated issue detected

Room: B-203
Category: Electrical
Previous complaints: 3

Warden can investigate root cause.


---

21. 📱 UI Structure

Public

/
 /login
 /register
 /forgot-password

Student

/student/dashboard
/student/complaints
/student/complaints/new
/student/complaints/:id
/student/profile

Staff

/staff/dashboard
/staff/work-queue
/staff/complaints/:id
/staff/profile

Deputy

/deputy/dashboard
/deputy/escalations
/deputy/complaints/:id

Warden

/warden/dashboard
/warden/complaints
/warden/escalations
/warden/analytics
/warden/users
/settings


---

22. 🎨 UI Design

Don't make it look like a basic CRUD project.

Use:

Clean dashboard
Responsive cards
Status badges
Priority badges
Timeline
Progress indicators
SLA countdown
Charts
Filters
Search
Empty states
Loading states
Error states
Toast notifications
Confirmation dialogs

Priority:

🟢 LOW
🟡 MEDIUM
🟠 HIGH
🔴 CRITICAL

Status:

SUBMITTED
ASSIGNED
IN_PROGRESS
RESOLUTION_PENDING
REOPENED
ESCALATED
CLOSED


---

23. 🔎 Search + Filters

Hostel Office/Warden:

Search complaint ID
Search student
Search room

Filters:

Category
Priority
Status
Assignee
Date
SLA status
Escalation

Example:

> Show all CRITICAL + SLA BREACHED + ELECTRICAL complaints.




---

24. 📎 Evidence Upload

Student can upload:

Photo
PDF

Example:

> Broken switchboard → upload photo.



Staff can inspect evidence before working.

Don't make file storage unnecessarily complicated during hackathon. Keep a clean storage abstraction so it can use local/object storage later.


---

25. 🧪 Testing

Must test:

Authentication

Login
Wrong password
Expired JWT
Inactive user

Authorization

Student A cannot access Student B complaint
Staff cannot modify unauthorized complaint
Student cannot assign staff

Complaint

Create
View
Update
Duplicate prevention
Validation

Assignment

Automation ON
Automation OFF
Manual assignment
Reassignment
Busy staff
Critical priority

Workflow

SUBMITTED → ASSIGNED
ASSIGNED → IN_PROGRESS
IN_PROGRESS → RESOLUTION_PENDING
RESOLUTION_PENDING → CLOSED
RESOLUTION_PENDING → REOPENED

SLA

Your team writes/tests the handwritten implementation:

Deadline calculation
Approaching condition
Breach condition
Pause/stop conditions if applicable

Escalation

Your team writes/tests:

SLA breach
Critical complaint
Deputy escalation
Warden escalation
Duplicate escalation prevention


---

26. 🔒 Important Edge Cases

Don't forget these.

Case 1

Electrician overloaded.

→ Office queue

Case 2

Critical complaint while electrician overloaded.

→ Critical handling
→ immediate notification/escalation

Case 3

Automation switched OFF.

→ New complaints manually assigned
→ Existing assignments unchanged

Case 4

Student submits duplicate complaint.

→ Detect recent similar complaint
→ warn / link to existing issue

Case 5

Staff resolves complaint but student rejects.

→ REOPENED

Case 6

SLA already breached but staff tries to close.

→ Record breach
→ retain escalation/audit history

Case 7

Two users try to assign same complaint.

→ transaction/concurrency protection


---

27. 🌐 API Layer

Important: Because your openapi.yaml is locked, don't invent the final API contract before checking it.

Conceptually you need APIs around:

/auth
/users
/complaints
/assignments
/notifications
/escalations
/audit
/dashboard
/settings
/attachments

For example, conceptually:

POST   /complaints
GET    /complaints
GET    /complaints/{id}
PATCH  /complaints/{id}/status
POST   /complaints/{id}/assign
POST   /complaints/{id}/reassign
POST   /complaints/{id}/resolve
POST   /complaints/{id}/confirm
POST   /complaints/{id}/reopen

But final paths/request/response DTOs must come from your locked OpenAPI contract.


---

28. 📈 Complete System Flow

This is your entire project in one picture:

STUDENT
                       │
                       ▼
                Create Complaint
                       │
                       ▼
              ┌─────────────────┐
              │ Classification  │
              │ Rule-Based      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Priority Engine │
              │ L/M/H/C         │
              └────────┬────────┘
                       │
                       ▼
                SLA Selection
                       │
                       ▼
             Assignment Automation?
                 /             \
               ON               OFF
                │                 │
                ▼                 ▼
         Workload Check     Office Queue
                │                 │
         ┌──────┴──────┐          │
       Available      Busy        │
          │             │          │
          ▼             ▼          ▼
       Assign       Office      Manual
                    Queue       Assign
         │             │          │
         └─────────────┴──────────┘
                       │
                       ▼
                 Staff Works
                       │
                       ▼
                 SLA Running
                       │
             ┌─────────┴─────────┐
             │                   │
          Resolved             Breached
             │                   │
             ▼                   ▼
     Resolution Pending      Escalation
             │                   │
       ┌─────┴─────┐             ▼
      YES           NO      Deputy Warden
       │             │             │
       ▼             ▼             ▼
     CLOSED       REOPENED       WARDEN
                                     │
                                     ▼
                                  CLOSED


---

29. 🏆 What Makes This First-Prize Quality

Don't try to win by adding 50 features.

Your strongest differentiators are:

1. Smart routing

Not simply:

> Electrical → Electrician



Instead:

> Category + Priority + Workload + Availability → Assignment




---

2. Real SLA

Not fake countdown.

Backend-controlled:

Created
→ Deadline
→ Approaching
→ Breached
→ Escalated


---

3. Automatic + Manual assignment

Automation ON

or

Automation OFF

Hostel Office remains in control.


---

4. Student confirmation

Staff can't just say:

> Resolved.



Student confirms.


---

5. Escalation

Staff
 ↓ SLA breach
Deputy Warden
 ↓ unresolved
Warden


---

6. Auditability

Every important action has:

Actor
Action
Time
Old value
New value
Reason


---

30. ⏱️ 12-Hour Hackathon Execution Order

Don't build everything randomly.

6:00–6:30

OpenAPI analysis
Project setup
Git setup
DB setup

6:30–7:30

Spring Boot foundation
React foundation
PostgreSQL
Auth

7:30–9:00

User roles
Complaint creation
Complaint listing
Complaint details

9:00–10:00

Classification
Priority
Assignment
Automation ON/OFF

10:00–11:00

Staff dashboard
Status workflow
Student confirmation

11:00–12:00

SLA handwritten core
Escalation handwritten core

12:00–1:00

Notifications
Audit history

1:00–2:00

Warden dashboard
Charts
Workload
Repeated complaints

2:00–3:00

Integration
Contract tests
Edge cases

3:00–4:00

UI polish
Responsive design
Error handling
Loading states

4:00–5:00

Deployment
Production testing
Bug fixes

5:00–6:00

Final testing
Demo data
Presentation
Judge flow rehearsal


---

31. 🎤 Your 2-Minute Judge Demo

Don't show every page.

Show one complaint journey.

Step 1 — Student

Create:

> “Electrical panel is sparking and there is a burning smell in Block B.”



System immediately:

Category: ELECTRICAL
Priority: CRITICAL

Step 2 — Assignment

Show:

Electrician
Current workload: High

But because complaint is critical:

🚨 Urgent handling

Step 3 — Staff

Electrician sees:

CRITICAL
SLA countdown

Step 4 — SLA

Demonstrate the handwritten SLA logic with your real implementation.

Step 5 — Escalation

If not handled:

SLA BREACHED
      ↓
Deputy Warden

Step 6 — Resolution

Electrician:

Resolution Pending

Step 7 — Student

Student clicks:

❌ Still not resolved

Complaint:

REOPENED

That single flow demonstrates classification + priority + assignment + workload + SLA + escalation + accountability.


---

32. 🤖 Where AI Can Be Used vs Not Used

AI can help you with

UI generation
CRUD scaffolding
DTO boilerplate
Repository boilerplate
Controller boilerplate
React components
CSS
Dashboard layouts
Test scaffolding
Documentation

Your team should handwrite

SLA timer logic
Escalation rules engine

Because those are explicitly marked No-AI core in your hackathon.

For those two, I can help you with logic design, flowcharts, edge cases, test cases, interfaces, and code review, but I shouldn't give you a copy-paste implementation that defeats the competition rule.


---

33. 🚀 Actual Build Order From Here

Since you want to build this layer by layer, don't start coding the entire thing from this blueprint.

Use this order:

LAYER 0
OpenAPI analysis
        ↓
LAYER 1
Backend + DB foundation
        ↓
LAYER 2
Authentication + RBAC
        ↓
LAYER 3
Complaint module
        ↓
LAYER 4
Classification + Priority
        ↓
LAYER 5
Assignment + Workload + Automation
        ↓
LAYER 6
Staff workflow
        ↓
LAYER 7
HANDWRITTEN SLA CORE
        ↓
LAYER 8
HANDWRITTEN ESCALATION CORE
        ↓
LAYER 9
Notifications + Audit
        ↓
LAYER 10
Student frontend
        ↓
LAYER 11
Staff + Office frontend
        ↓
LAYER 12
Warden analytics
        ↓
LAYER 13
Integration + Contract tests
        ↓
LAYER 14
Deployment + Final polish

First thing now: openapi.yaml ah upload pannunga. Adha inspect pannitu, Layer 1-ku exact copy-paste-