@AGENTS.md

## Multi-Agent Delegation Protocol

For work large enough to benefit from parallelism, the lead agent may divide it among multiple agents or models. Use capability, reasoning depth, latency, and cost as the selection criteria; do not depend on vendor-specific model names.

### Decide whether to delegate

- Keep small, tightly coupled, or single-file work with one agent.
- Delegate only concrete subtasks that can progress independently.
- Prefer parallel work when the task has separable layers, repositories, investigations, test suites, or review surfaces.
- Do not assign multiple agents to edit the same files concurrently. If work is serially dependent, complete the dependency first and hand its explicit contract to the next agent.
- The lead agent always owns the final result, integration, validation, and user communication. Delegation does not transfer accountability.

### Mandatory cost-effective delegation

- When a task contains a safe, bounded, independently executable subtask that can be completed by a lower-cost capability than the lead agent, the lead agent **must delegate it**. Examples include repository inventory, focused searches, mechanical edits, documentation updates, straightforward test runs, and independent diff review.
- Choose the least capable model or reasoning budget that can reliably satisfy the subtask's risk and contract. Do not use a stronger or more expensive capability merely by default.
- Do not delegate when the work is genuinely inseparable, would cause concurrent edits to the same files, or when the coordination and integration risk exceeds the expected saving. Record that decision briefly in the user-facing progress update.
- The lead agent must reserve stronger reasoning for architecture, integration, high-risk changes, and final verification; it remains responsible for reviewing delegated output before accepting it.

### Match capability to complexity

- **Low complexity:** mechanical edits, documentation, searches, inventory, formatting, and straightforward test execution. Use a fast, economical model with light reasoning.
- **Medium complexity:** bounded feature implementation, ordinary bug fixes, component/service changes, and focused test authoring. Use a capable coding model with moderate reasoning.
- **High complexity or high risk:** architecture, cross-repository contracts, authentication, authorization, concurrency, data integrity, migrations, ambiguous failures, and security-sensitive code. Use the strongest available reasoning and coding capability with a high reasoning budget.
- **Independent review:** use an agent that did not author the code when possible. Give it enough reasoning capacity for the risk of the change, and ask it to look for incorrect assumptions, race conditions, partial failures, security gaps, compatibility issues, and missing tests.

Capability choice should be proportional to risk, not merely task size. A short authorization change may require stronger reasoning than a large mechanical refactor.

### Delegation brief

Every delegated subtask must state:

- the exact objective and repository/path scope;
- the branch and whether commits or pushes are allowed;
- relevant contracts, invariants, and repository instructions;
- files or areas the agent must not touch;
- expected tests, lint, build, or other evidence;
- whether the agent should edit, review only, or report findings;
- the required result format, including unresolved risks and validation performed.

Agents sharing a workspace must assume that other agents' edits are live. They must preserve unrelated changes and report any overlap before modifying the same area.

### Recommended execution waves

1. **Discovery and contract:** inspect the affected code, identify boundaries, and freeze request/response or component/service contracts before parallel implementation.
2. **Implementation:** assign independent layers or repositories to appropriately capable agents.
3. **Integration:** the lead agent compares every implementation against the shared contract and checks cross-layer behavior.
4. **Independent review:** reviewers inspect the integrated diff without relying on the authors' conclusions.
5. **Hardening and validation:** route findings back to an implementation agent, then rerun focused tests, lint, builds, and diff checks on the final state.

Passing tests alone is not sufficient for high-risk work. The lead agent must explicitly examine failure paths, stale state, cancellation, partial success, authorization boundaries, and whether user-facing messages describe the actual outcome.

If delegation tools or additional models are unavailable, follow the same stages sequentially and perform a separate self-review pass with fresh context.
