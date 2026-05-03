<img
  src="https://database.faithfulpack.net/images/branding/logos/transparent/hd/complibot_logo.png?w=256"
  alt="CompliBot Logo"
  height="256"
  align="right"
/>
<div align="center">
  <h1>CompliBot Commands</h1>
  <h3>The official bot for the Faithful Discord servers.</h3>

  ![RepoSize](https://img.shields.io/github/repo-size/Faithful-Resource-Pack/CompliBot-Commands)
  ![Issues](https://img.shields.io/github/issues/Faithful-Resource-Pack/CompliBot-Commands)
  ![PullRequests](https://img.shields.io/github/issues-pr/Faithful-Resource-Pack/CompliBot-Commands)
  [![Crowdin](https://badges.crowdin.net/e/656f9fc7c628d23c87426953b11cf26c/localized.svg)](https://faithful.crowdin.com/complibot-commands)
</div>

---

## Requirements

- NodeJS v22+ https://nodejs.org
- pnpm (`corepack enable` + `corepack prepare pnpm@latest --activate`)

## Running

```bash
pnpm install
```

```bash
pnpm dev
```

> [!WARNING]
> While CompliBot is designed to be reasonably easy to fork and run your own instance of, we can't offer individual support for your specific use case.
> *Your mileage may vary in terms of necessary code modifications!*

1. Log into the **[Discord Developer Portal](https://discord.com/developers/applications)**.
2. Create an application, navigate to the **Bot** tab in its settings, and copy its token.
3. Rename `tokens.json.example` in the `json/` folder to `tokens.json`.
4. Paste your token after `token`. Additional information like API tokens and various testing modes can be enabled from there as well.

## API Reference

This project uses the Faithful API for retrieving most dynamic data, such as texture information, user contributions, and available resource packs. Check out our [API reference](https://api.faithfulpack.net/docs) for documentation about each API endpoint and its associated types.

## Translating

Many messages shown throughout the bot can be translated into users' native languages for easier usage. Our translation service is powered by Crowdin, [and you can start translating there](https://faithful.crowdin.com/complibot-commands) by clicking on your language in the list. All languages that Discord supports should be listed there.
