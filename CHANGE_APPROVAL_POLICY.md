# Mandatory Owner Approval Policy

For Amar Shopping, no production change is authorized by default.

1. Preserve all existing features and behavior. New features must be additive.
2. Before changing any existing code, feature, database object, security policy, authentication flow, payment flow, dependency, deployment setting, or customer data, explain the exact proposed change and its impact.
3. Wait for the owner's explicit approval for that specific change.
4. Approval to develop or test does not automatically authorize production merge or deployment. Obtain explicit production-release approval after showing the diff and test results.
5. If the requested feature cannot be implemented without changing an existing feature, stop and explain the conflict. Do not silently replace or remove the existing behavior.
6. Never claim a test passed unless it was actually run. Mark untested behavior NOT VERIFIED.
7. Keep a known-good version and a rollback path for every production release.

This policy is a project operating rule. Repository documentation and CI checks help enforce it, but GitHub branch protection and deployment permissions must also be configured at the hosting/account level for a hard technical gate.
