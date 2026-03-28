# HindClaw Templates

Official template repository for [HindClaw](https://github.com/mrkhachaturov/hindclaw), the access control layer for [Hindsight](https://hindsight.vectorize.io) memory servers.

Templates define how a Hindsight memory bank behaves: what it extracts, how it reflects, what entities it tracks, and what directives and mental models it starts with. Install a template, apply it to a bank, and the bank is ready to use. No manual configuration.

## How it works

This repository is a marketplace source. Register it once with the HindClaw CLI or API, and you can browse, install, and update templates from it.

```bash
# Register this repo as a marketplace source
hindclaw admin source add https://github.com/mrkhachaturov/hindclaw-templates-official

# Browse what's available
hindclaw template search

# Install a template
hindclaw template install mrkhachaturov/backend-python --scope personal

# Create a bank from the installed template
hindclaw template apply personal/mrkhachaturov/backend-python \
  --bank-id my-project --bank-name "My Project"
```

That last command creates the bank, configures it, seeds directives, and seeds mental models. One command.

## Available templates

| Template | Tags | What it does |
|----------|------|-------------|
| `backend-python` | python, backend, api, testing | Extracts reusable backend patterns from Python projects. Tracks API design, error handling, testing strategies, database access, and auth. Ships with 2 directive seeds, 3 mental model seeds, and a domain entity label for categorization. |

We'll add more as we find patterns worth extracting. If you have a template that works well for your team, consider contributing it.

## Template anatomy

Each template is a JSON file in `templates/` and an entry in `index.json`. The JSON defines everything the bank needs:

- **Missions** control what the bank extracts (retain), synthesizes (reflect), and observes. These are the instructions Hindsight follows when processing your conversations.
- **Dispositions** tune the bank's personality along three axes: skepticism (how much evidence it wants before storing a fact), literalism (how strictly it interprets statements), and empathy (how much it weighs emotional context).
- **Entity labels** define the categories the bank uses to organize extracted knowledge. A Python backend template might track domains like "api-design" and "testing." A team management template might track "hiring" and "process."
- **Directive seeds** are rules the bank follows from day one. "Never store PII" or "Always cite when a decision was made."
- **Mental model seeds** define the questions the bank periodically asks itself during reflection. "What Python patterns are established across projects?" produces a living document that updates as the bank learns.

## Writing your own

Start from an existing template. Copy `templates/backend-python.json`, change the fields, and add an entry to `index.json`.

The schema is strict (`schema_version: 1`), and the HindClaw server validates every field on install. If something is wrong, you'll get a clear error. The required fields:

```
id, min_hindclaw_version, retain_mission, reflect_mission
```

Everything else has sensible defaults. `retain_extraction_mode` defaults to `concise`, dispositions default to 3 (middle of the 1-5 scale), and observations are off unless you set `enable_observations: true`.

A minimal template looks like this:

```json
{
  "schema_version": 1,
  "min_hindclaw_version": "0.2.0",
  "name": "my-template",
  "version": "1.0.0",
  "description": "What this template is for",
  "author": "you",
  "tags": ["your", "tags"],
  "retain_mission": "What to extract from conversations",
  "reflect_mission": "How to synthesize what was extracted"
}
```

To test it locally without publishing:

```bash
hindclaw template create my-template.json --scope personal
hindclaw template apply personal/my-template --bank-id test-bank
```

## Contributing

Fork this repo, add your template, and open a PR. We'll review it for quality and install it on our own server before merging. Templates that solve real problems for real teams get in.

## Version compatibility

Each template declares `min_hindclaw_version`. The server checks this on install and rejects templates that need a newer version than what's running. If you see a version error, upgrade HindClaw first.

## License

MIT
