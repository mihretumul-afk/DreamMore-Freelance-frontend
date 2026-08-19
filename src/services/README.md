# Services

Domain service modules live here, one per backend domain, added phase by phase.

**Convention**

- Each module imports the shared client from `../api/client` (never `axios` directly).
- Modules expose only real backend endpoints (Laravel REST API under `/api/v1`).
- UI components must never call the API client directly — they talk to a service.

Modules (added as their phases ship):

- `jobService.js` — jobs phase ✅ (getJobs, getJob)
- `freelancerService.js` — freelancer phase ✅ (getFreelancer, getMyProfile, updateMyProfile)
- `employerService.js` — profiles + dashboards ✅ (getMyProfile, updateMyProfile, getMyJobs)
- `authService.js` — authentication phase ✅ (login, register, getCurrentUser, logout)
- `proposalService.js` — proposals/bidding phase ✅ (getMyProposals, getProposal, createProposal, updateProposal, withdrawProposal, getJobProposals, shortlistProposal, rejectProposal, acceptProposal)
- `contractService.js` — contracts phase ✅ (getMyContracts, getContract, pauseContract, resumeContract, completeContract, cancelContract)
- `milestoneService.js` — contracts phase ✅ (getMilestones, getMilestone, createMilestone, updateMilestone, submitMilestone, approveMilestone, requestMilestoneRevision, deleteMilestone)
- `messagingService.js`, `notificationService.js`, `reviewService.js`, … — later phases
