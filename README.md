# Syntaxxed

**Send your AI coding tool less code, and none of your secrets.**

Syntaxxed is a VS Code extension that builds compact, reviewable context from
your repository before you paste it into Claude, ChatGPT, Cursor or any other AI
tool. Everything runs locally: nothing is uploaded and no model is called.

- **Outline mode keeps signatures and drops function bodies.** On a typical
  TypeScript project that is roughly **75% fewer tokens** while the model still
  sees every type, interface, class and function signature.
- **Secrets are redacted before anything leaves VS Code.** It catches GitHub, AWS,
  OpenAI, Anthropic, Stripe and Slack tokens, private keys, connection strings
  and `password = "..."`-style assignments, and you can add your own rules.
- **Sensitive files are never included:** `.env`, keys, certificates, cloud
  credentials and Terraform state are always excluded, along with your
  `.gitignore` rules.
- **You can preview the exact output** for any file before you copy it.

## Quick start

1. Install the extension (see [Install](#install)).
2. Open a project and select the **Syntaxxed** icon in the Activity Bar.
3. Optionally describe your task under **Task focus** to pre-select relevant
   files, then adjust the selection.
4. Pick a **Context detail** level, select **Build & Copy**, and paste into
   your AI tool.

## Context detail levels

| Level | What the model gets | Typical reduction |
| --- | --- | --- |
| **Outline** (default) | Types, interfaces, classes and signatures; implementation bodies removed | ~75% |
| **Logic** | Full implementation with comments and extra whitespace removed | ~5-20% |
| **Source** | The complete file, still secret-redacted | 0% |

The figures are from Syntaxxed's own source. Outline currently strips bodies
for JavaScript and TypeScript only; other languages are included with
whitespace cleanup. Token counts are estimates (about 4 characters per token),
not provider billing figures.

## Optional: MCP gateway for agents

For Claude Code, Cursor and other MCP clients, Syntaxxed can run a local,
authenticated gateway. Agents get Outline views freely and must ask you, via a
VS Code prompt, before receiving full implementation or source for a file. It
is off by default. Enable it with **Syntaxxed: Enable MCP Gateway for
Workspace**. See the [Agent Gateway guide](docs/agent-gateway.md).

The gateway only controls what flows through Syntaxxed. It cannot stop an agent
from using its own file-reading tools.

## Install

Download `syntaxxed-0.3.0.vsix` from the
[releases page](https://github.com/edwardchaput-spec/syntaxxed/releases), then
in VS Code open **Extensions**, select **...**, then **Install from VSIX...**.

Or from a terminal:

```powershell
code --install-extension .\syntaxxed-0.3.0.vsix
```

Requires VS Code 1.105 or newer.

## Limitations

- Redaction is pattern-based. A novel, encoded or split-up secret may not be
  recognized, so preview anything sensitive before sharing it.
- Task focus is keyword and symbol matching, not semantic search. Treat it as
  a starting point.
- Outline only removes function bodies in JavaScript and TypeScript for now.

## More

- [Full reference guide](docs/reference.md): every setting, the CLI, the
  GitHub Action, the security model and troubleshooting
- [Privacy statement](PRIVACY.md): no telemetry unless you explicitly
  configure it
- [Changelog](CHANGELOG.md)

## Licence

Syntaxxed is **free for personal, non-commercial use** under the
[PolyForm Noncommercial License 1.0.0](LICENSE).

Use by or on behalf of a business, or any other commercial use, needs a
commercial licence. To ask about one, open an issue on
[GitHub](https://github.com/edwardchaput-spec/syntaxxed/issues).
