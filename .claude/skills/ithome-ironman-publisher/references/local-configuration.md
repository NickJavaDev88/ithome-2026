# Local configuration

The skill is safe to keep in Git; browser state, cross-user bridge state, and notification credentials are not.

## Project discovery

Keep the skill at:

```text
<repo>/.agents/skills/ithome-ironman-publisher/
```

Run payload and validation commands from `<repo>`. Do not copy only the skill folder and expect it to operate without the repository's `pnpm ithome:prepare` producer.

## Browser session

Computer Use operates a user-controlled browser session. The skill never exports or commits that session. Do not add cookie files, browser profiles, screenshots containing private data, passwords, or one-time codes to the repository.

## Machine-readable events

Set the event directory only in the local execution environment:

```bash
export ITHOME_EVENT_DIR="<absolute-events-directory>"
```

The publisher must own the directory and be able to create files atomically. A notification consumer needs read and directory-traversal permission only. It must not receive write, rename, or delete permission.

`scripts/write-event.mjs` validates an input event and refuses to replace an existing event. Do not make the shared directory a command queue; events report completed observations and operations only.

## Day 1 bootstrap state

Configure the verified state file locally:

```bash
export ITHOME_BOOTSTRAP_STATE="<absolute-state-directory>/series-bootstrap.json"
```

Only a fully verified Day 1 bootstrap may create or idempotently confirm this file. Failed, partial, or uncertain results belong in immutable events and must not replace verified state.

## Cross-user macOS example

The bundled macOS reference deployment uses `/Users/Shared/ithome-ironman-bridge`. Other deployments may configure their own absolute event and bootstrap paths; account names always remain local deployment choices. Apply least privilege:

- publisher account: create, atomic rename, and read;
- notification account: list, traverse, and read only;
- all other accounts: no access;
- files: no execute permission;
- notification deduplication state: stored under the notification account's own private state directory.

Verify the boundary using the actual notification account before relying on it:

```bash
sudo -u <notification-user> ls -la <absolute-events-directory>
sudo -u <notification-user> touch <absolute-events-directory>/.should-not-write
```

The first command should succeed and the second should fail with `Permission denied`. Remove any probe if a misconfiguration unexpectedly allows it.

## Secrets and generated files

Never place these values in payloads, events, bootstrap state, tests, or logs:

- iThome cookies or session storage;
- passwords, one-time codes, or browser profiles;
- Telegram bot tokens or chat identifiers;
- article bodies or HTML dumps;
- local home-directory paths when a configurable placeholder is sufficient.
