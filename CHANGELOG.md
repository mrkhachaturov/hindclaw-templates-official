# Changelog

All notable changes to the HindClaw official templates will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
repository adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-14

### Changed (BREAKING)

- **Template format converged onto upstream Hindsight `BankTemplateManifest`.** Every file under `templates/` is now a drop-in upstream manifest that parses through `hindsight_api.api.http.BankTemplateManifest.model_validate()` AND `validate_bank_template()` with zero adapter code. The legacy schema (`schema_version`, `min_hindclaw_version`, `min_hindsight_version`, `author`, `directive_seeds`, `mental_model_seeds`, `entity_labels` with HindClaw-specific shape) is gone.
- **Catalog file renamed `index.json` -> `templates.json`** with a new shape:
  ```json
  {
    "catalog_version": "1",
    "name": "hindclaw-official",
    "description": "...",
    "templates": [
      { "id": "...", "name": "...", "description": "...", "category": "...",
        "integrations": ["..."], "tags": ["..."],
        "manifest_file": "templates/<id>.json" }
    ]
  }
  ```
  Each catalog entry carries presentation metadata plus EXACTLY ONE of an inline `manifest` or an external `manifest_file` reference. The wrapper mirrors upstream's `hindsight-docs/src/data/templates.json` inline-entry format; either shape parses through HindClaw's marketplace layer.
- **Templates rewritten to use upstream's richer field set:**
  - `entity_labels` now use upstream's `LabelGroup` shape (`key`, `description`, `type` in `value`/`multi-values`/`text`, `optional`, `tag`, `values`).
  - `directives` use upstream's `BankTemplateDirective` shape with `name`, `content`, `priority`, `is_active`, `tags`. Priority is now meaningful (higher priority directives inject first).
  - `mental_models` use upstream's `BankTemplateMentalModel` shape with `id`, `name`, `source_query`, `tags`, `max_tokens`, `trigger.refresh_after_consolidation`.
  - `retain_extraction_mode` is constrained to `concise`, `verbose`, `custom`, or `chunks` — the legacy `verbatim` mode is gone (upstream's validator rejects it).
- **`backend-python`** now uses two `LabelGroup` types (`value` for `domain`, `multi-values` for `concerns`), three mental models with `refresh_after_consolidation` triggers, and directives with `priority: 10` and `priority: 5`.
- **`fullstack-typescript`** uses three `LabelGroup` types (`value` for `layer`, `multi-values` for `libraries`, `text` for `notes`), two mental models with refresh triggers, and `priority: 8` directives.
- **`astromech-test`** uses two `LabelGroup` types (`value` for `droid`, `multi-values` for `subsystem`), one mental model with refresh trigger, and `priority: 6` directive.

### Added

- **`templates.json` catalog format** — see the structure above. Lets HindClaw fetch a single index file that lists every available template with presentation metadata, then resolve each manifest via `manifest_file` on demand.
- **README rewritten** to document the new format, layout, and compatibility story.

### Removed

- `index.json` (legacy catalog).
- The `schema_version`, `min_hindclaw_version`, `min_hindsight_version`, `version`, `author` top-level fields from every template — now lives in upstream's manifest version contract.
- `verbatim` extraction mode from every template.

### Compatibility

- Manifest files in `templates/` can be POSTed directly to upstream Hindsight's `/v1/default/banks/{id}/import` endpoint without any transformation. This is a Plan B definition-of-done check.
- Requires HindClaw extension `>= 0.5.0` (Plan B template convergence). Earlier extensions cannot parse this format.

## [1.0.0] - 2026-03-27

### Added
- `backend-python` template for Python backend projects
  - Extracts API design, error handling, testing strategies, database access, auth patterns
  - 1 entity label (domain) with 5 values: api-design, error-handling, testing, data-access, auth
  - 2 directive seeds: No PII Storage, Cite Sources
  - 3 mental model seeds: Python Best Practices, API Design Patterns, Testing Strategies
  - Verbose extraction mode, observations enabled, free-form entities allowed
