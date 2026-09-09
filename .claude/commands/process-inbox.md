---
name: "Process feature inbox"
description: "Process docs/feature-requests.md — log the oldest new request to beads (and OpenSpec if large), implement/propose it, and mark it done."
category: "Workflow"
tags: ["workflow", "features", "intake"]
---

Dispatch the **feature-intake** subagent (Agent tool, `subagent_type: "feature-intake"`) to process
`docs/feature-requests.md`.

- First check whether `## Inbox` in that file has any unchecked `- [ ] …` items (ignore
  commented-out examples). If there are none, say "Feature inbox is empty — nothing to do." and stop
  WITHOUT dispatching the agent (this keeps timed `/loop` runs quiet and cheap).
- Otherwise dispatch the agent, let it process the oldest item end-to-end, and relay its summary
  (the request, its beads id, whether it was implemented or proposed for approval, the commit, and
  how many items remain).

Do not implement the request yourself — the subagent does the work so the logic lives in the agent
definition, not in this conversation.
