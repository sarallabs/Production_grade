# Podcast Processing Report
Generated after NEB Nepal label-free dual-host TTS pipeline run.

## Summary

- Level folders processed: 18
- Script/audio pairs checked: 36
- Renames in manifest: 32 total (4 pilot + 28 full-tree batch)
- **voice_mode:** `dual-host-en-IN`
- **script_labels:** none (visible `Man:`/`Woman:` stripped via `--hide-labels`)
- **voice_routing:** `parse_alternating_script` (paragraph alternation; block 0 → Prabhat, block 1 → Neerja, …)
- **voices:** `en-IN-PrabhatNeural` + `en-IN-NeerjaNeural`
- **single-voice fallback:** `en-IN-NeerjaNeural` (when `--dual-voice` is off)
- Errors: 0

## Voice routing

All scripts are label-free markdown with blank-line-separated turns. TTS uses paragraph alternation only (no labeled routing).

| Scope | Parse mode | Host 1 (male) | Host 2 (female) |
|-------|------------|---------------|-----------------|
| All 36 pairs | `parse_alternating_script` | Prabhat (odd blocks) | Neerja (even blocks) |

## Known limitations (accepted)

Because routing is blind alternation after label removal:

| Issue | Effect |
|-------|--------|
| Scripts whose first turn was originally `Woman:` | Opening paragraph read by **Man** (Prabhat) |
| Consecutive same-speaker turns in source dialogue | Those turns may get the **wrong** voice |

class_12 scripts were re-cleaned with `--hide-labels` and all 24 class_12 MP3 pairs regenerated (2026-06-20).

## Per-folder status

| Folder | Kind | MD | MP3 | Size (MiB) | Duration (s) | <25MB |
|--------|------|----|-----|------------|--------------|-------|
| class_10/biology/chapter_01/advanced | short | Y | Y | 13.07 | 342.5 | yes |
| class_10/biology/chapter_01/advanced | long | Y | Y | 22.44 | 735.3 | yes |
| class_10/biology/chapter_01/beginner | short | Y | Y | 6.77 | 177.5 | yes |
| class_10/biology/chapter_01/beginner | long | Y | Y | 18.65 | 814.6 | yes |
| class_10/biology/chapter_01/intermediate | short | Y | Y | 4.73 | 123.8 | yes |
| class_10/biology/chapter_01/intermediate | long | Y | Y | 20.86 | 683.4 | yes |
| class_10/biology/chapter_02/advanced | short | Y | Y | 19.84 | 866.9 | yes |
| class_10/biology/chapter_02/advanced | long | Y | Y | 20.74 | 2718.2 | yes |
| class_10/biology/chapter_02/beginner | short | Y | Y | 4.62 | 121.2 | yes |
| class_10/biology/chapter_02/beginner | long | Y | Y | 20.41 | 2674.5 | yes |
| class_10/biology/chapter_02/intermediate | short | Y | Y | 17.90 | 781.9 | yes |
| class_10/biology/chapter_02/intermediate | long | Y | Y | 21.70 | 2843.5 | yes |
| class_12/biology/chapter_01/advanced | short | Y | Y | 22.80 | 746.9 | yes |
| class_12/biology/chapter_01/advanced | long | Y | Y | 21.19 | 1586.8 | yes |
| class_12/biology/chapter_01/beginner | short | Y | Y | 20.16 | 1056.8 | yes |
| class_12/biology/chapter_01/beginner | long | Y | Y | 21.65 | 1621.2 | yes |
| class_12/biology/chapter_01/intermediate | short | Y | Y | 22.19 | 727.2 | yes |
| class_12/biology/chapter_01/intermediate | long | Y | Y | 22.89 | 1714.5 | yes |
| class_12/biology/chapter_02/advanced | short | Y | Y | 22.46 | 735.8 | yes |
| class_12/biology/chapter_02/advanced | long | Y | Y | 22.55 | 1477.6 | yes |
| class_12/biology/chapter_02/beginner | short | Y | Y | 18.43 | 603.8 | yes |
| class_12/biology/chapter_02/beginner | long | Y | Y | 20.08 | 1316.2 | yes |
| class_12/biology/chapter_02/intermediate | short | Y | Y | 21.79 | 571.1 | yes |
| class_12/biology/chapter_02/intermediate | long | Y | Y | 18.81 | 1232.5 | yes |
| class_12/chemistry/chapter_01/advanced | short | Y | Y | 20.32 | 1065.1 | yes |
| class_12/chemistry/chapter_01/advanced | long | Y | Y | 20.01 | 3496.2 | yes |
| class_12/chemistry/chapter_01/beginner | short | Y | Y | 12.22 | 320.4 | yes |
| class_12/chemistry/chapter_01/beginner | long | Y | Y | 19.24 | 840.7 | yes |
| class_12/chemistry/chapter_01/intermediate | short | Y | Y | 13.42 | 351.7 | yes |
| class_12/chemistry/chapter_01/intermediate | long | Y | Y | 18.45 | 806.2 | yes |
| class_12/chemistry/chapter_02/advanced | short | Y | Y | 21.27 | 1115.0 | yes |
| class_12/chemistry/chapter_02/advanced | long | Y | Y | 22.28 | 1668.7 | yes |
| class_12/chemistry/chapter_02/beginner | short | Y | Y | 19.24 | 2522.3 | yes |
| class_12/chemistry/chapter_02/beginner | long | Y | Y | 21.27 | 3718.0 | yes |
| class_12/chemistry/chapter_02/intermediate | short | Y | Y | 21.77 | 1141.5 | yes |
| class_12/chemistry/chapter_02/intermediate | long | Y | Y | 22.81 | 1494.6 | yes |

## Non-standard filenames remaining

None.

## Errors

None.
