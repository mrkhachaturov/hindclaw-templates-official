# HindClaw Templates

Bank templates for HindClaw deployments. Each template is a drop-in upstream
Hindsight [`BankTemplateManifest`](https://hindsight.vectorize.io/docs/schema/bank-template-manifest)
— the same schema accepted by `POST /v1/default/banks/{id}/import`.

## Layout

- `templates.json` — catalog of available templates. Presentation metadata only;
  each entry carries a `manifest_file` pointing at the actual manifest.
- `templates/*.json` — individual manifests in upstream format.

## Adding a template

1. Write a `templates/<id>.json` file as a valid upstream `BankTemplateManifest`.
2. Add a catalog entry to `templates.json` with `manifest_file: "templates/<id>.json"`.
3. Register a HindClaw install source pointing at this repo's raw URL; run
   `hindclaw templates install --source hindclaw-official <id>`.

## Compatibility

Manifest files in `templates/` can be POSTed directly to upstream Hindsight's
`/v1/default/banks/{id}/import` endpoint without any transformation. The
catalog wrapper is HindClaw-specific but mirrors upstream's
`hindsight-docs/src/data/templates.json` inline-entry format; either shape
parses through HindClaw's marketplace layer.

## License

MIT
