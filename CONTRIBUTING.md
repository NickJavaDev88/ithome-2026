# Contributing

Contributions to the Astro site, article tooling, and project-local Codex skill are welcome.

## Development

```bash
pnpm install
pnpm test:ithome
pnpm check
pnpm build
```

Keep changes focused and include tests for behavior changes. Changes to payload, event, bootstrap, or safety contracts must update the corresponding reference and deterministic tests together.

## Safety

Do not use a pull request or test fixture to perform a live iThome mutation. Automated tests must not publish, delete, overwrite, solve a CAPTCHA, bypass anti-automation controls, or send a real Telegram notification.

Never commit:

- browser cookies, profiles, or storage state;
- passwords, one-time codes, API keys, or Telegram credentials;
- runtime event, bootstrap, or notification deduplication state;
- screenshots, HTML dumps, or logs containing private account data;
- article payload bodies when a minimal synthetic fixture is sufficient.

## Skill changes

The Codex skill is project-specific. Preserve its explicit Day authority, repo-generated payload boundary, one-click publish guard, conflict fail-closed behavior, and separation between iThome operation and notification delivery.

Validate the package with Codex's `skill-creator` quick validator and run `pnpm test:ithome` before submitting a change.
