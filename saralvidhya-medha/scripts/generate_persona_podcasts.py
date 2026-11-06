#!/usr/bin/env python3
"""
Generate short_podcast.mp3 / long_podcast.mp3 from markdown scripts.

- Single-voice or dual-host (Man/Woman) with Indian English Edge TTS voices.
- Concatenates with ffmpeg and encodes MP3 under 25 MiB.
"""

from __future__ import annotations

import argparse
import asyncio
import math
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

MAX_BYTES = 25 * 1024 * 1024
SAFETY = 0.92

SPEAKER_RE = re.compile(
    r"^(Man|Woman|Host|Guest|Bot|Girl|Boy|Speaker|Narrator|AI|Assistant)\s*:\s*(.*)$",
    re.IGNORECASE,
)
LABELED_ANYWHERE = re.compile(
    r"^(Man|Woman|Host|Guest|Bot|Girl|Boy|Speaker|Narrator|AI|Assistant)\s*:",
    re.IGNORECASE | re.MULTILINE,
)
ALLOWED_BITRATES = [32000, 48000, 64000, 80000, 96000, 112000, 128000, 160000, 192000, 256000, 320000]

VOICE_MAN_EDGE = "en-IN-PrabhatNeural"
VOICE_WOMAN_EDGE = "en-IN-NeerjaNeural"
VOICE_WOMAN_EXPRESSIVE_EDGE = "en-IN-NeerjaExpressiveNeural"
VOICE_SINGLE_EDGE = "en-IN-NeerjaNeural"
LEVELS = {"beginner", "intermediate", "advanced"}


@dataclass
class Segment:
    speaker: str
    text: str


@dataclass
class TtsConfig:
    dual_voice: bool = False
    voice_man: str = VOICE_MAN_EDGE
    voice_woman: str = VOICE_WOMAN_EDGE
    voice_single: str = VOICE_SINGLE_EDGE


@dataclass
class JobResult:
    md: Path
    mp3: Path
    status: str
    reason: str = ""
    size_bytes: int = 0
    duration_sec: float = 0.0
    error: str = ""


def strip_for_tts(text: str) -> str:
    t = text.strip()
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
    t = re.sub(r"\*([^*]+)\*", r"\1", t)
    t = t.replace("`", "")
    return re.sub(r"\s+", " ", t).strip()


def normalize_speaker(label: str) -> str:
    s = label.strip().lower()
    if s in ("woman", "girl", "guest"):
        return "Woman"
    return "Man"


def voice_for_speaker(speaker: str, cfg: TtsConfig) -> str:
    if not cfg.dual_voice:
        return cfg.voice_single
    return cfg.voice_woman if speaker == "Woman" else cfg.voice_man


def parse_labeled_script(md_text: str) -> list[Segment]:
    lines = md_text.splitlines()
    segments: list[Segment] = []
    current: Segment | None = None

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            continue
        m = SPEAKER_RE.match(line.strip())
        if m:
            label, rest = m.group(1), m.group(2)
            speaker = normalize_speaker(label)
            text = strip_for_tts(rest)
            if not text:
                current = Segment(speaker=speaker, text="")
                segments.append(current)
                continue
            current = Segment(speaker=speaker, text=text)
            segments.append(current)
        else:
            if current is None:
                extra = strip_for_tts(line)
                if extra:
                    current = Segment(speaker="Man", text=extra)
                    segments.append(current)
                continue
            extra = strip_for_tts(line)
            if not extra:
                continue
            if current.text:
                current.text = strip_for_tts(current.text + " " + extra)
            else:
                current.text = extra

    return [s for s in segments if s.text]


def parse_alternating_script(md_text: str) -> list[Segment]:
    blocks: list[str] = []
    current: list[str] = []
    for raw in md_text.splitlines():
        if not raw.strip():
            if current:
                blocks.append(strip_for_tts(" ".join(current)))
                current = []
            continue
        cleaned = strip_for_tts(SPEAKER_RE.sub(r"\2", raw.strip()))
        if cleaned:
            current.append(cleaned)
    if current:
        blocks.append(strip_for_tts(" ".join(current)))

    segments: list[Segment] = []
    for i, block in enumerate(blocks):
        if not block:
            continue
        speaker = "Man" if i % 2 == 0 else "Woman"
        segments.append(Segment(speaker=speaker, text=block))
    return segments


def parse_continuous_script(md_text: str) -> list[Segment]:
    parts: list[str] = []
    for raw in md_text.splitlines():
        line = raw.strip()
        if not line:
            continue
        cleaned = strip_for_tts(SPEAKER_RE.sub(r"\2", line))
        if cleaned:
            parts.append(cleaned)
    text = strip_for_tts(" ".join(parts))
    if not text:
        return []
    return [Segment(speaker="Man", text=text)]


def parse_script(md_text: str, *, dual_voice: bool) -> list[Segment]:
    if dual_voice:
        if LABELED_ANYWHERE.search(md_text):
            labeled = parse_labeled_script(md_text)
            if labeled:
                return labeled
        alt = parse_alternating_script(md_text)
        if alt:
            return alt
        return parse_continuous_script(md_text)
    if LABELED_ANYWHERE.search(md_text):
        labeled = parse_labeled_script(md_text)
        if labeled:
            return labeled
    return parse_continuous_script(md_text)


def chunk_text(text: str, max_len: int = 2400) -> list[str]:
    if len(text) <= max_len:
        return [text]
    parts: list[str] = []
    rest = text
    while rest:
        if len(rest) <= max_len:
            parts.append(rest.strip())
            break
        cut = rest.rfind(". ", 0, max_len)
        if cut < max_len // 2:
            cut = rest.rfind(" ", 0, max_len)
        if cut < max_len // 2:
            cut = max_len
        chunk = rest[: cut + 1].strip()
        rest = rest[cut + 1 :].strip()
        if chunk:
            parts.append(chunk)
    return parts


def pick_mp3_bitrate_bps(duration_sec: float) -> int:
    if duration_sec <= 0:
        return 128000
    target = (MAX_BYTES * 8 * SAFETY) / duration_sec
    chosen = ALLOWED_BITRATES[0]
    for br in ALLOWED_BITRATES:
        if br <= target:
            chosen = br
        else:
            break
    return chosen


def run(cmd: list[str], *, cwd: Path | None = None) -> None:
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{r.stderr or r.stdout}")


def ffprobe_duration(path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    try:
        return float((r.stdout or "0").strip())
    except ValueError:
        return 0.0


async def tts_edge(text: str, voice: str, out_mp3: Path, sem: asyncio.Semaphore) -> None:
    import edge_tts

    last_err: Exception | None = None
    for attempt in range(4):
        try:
            async with sem:
                com = edge_tts.Communicate(text, voice)
                await com.save(str(out_mp3))
            return
        except Exception as e:
            last_err = e
            await asyncio.sleep(1.5 * (attempt + 1))
    assert last_err is not None
    raise last_err


async def synthesize_segments(segments: list[Segment], work: Path, cfg: TtsConfig) -> list[Path]:
    sem = asyncio.Semaphore(4)
    idx = 0
    tasks: list[asyncio.Task] = []

    async def process_chunk(chunk_idx: int, text: str, speaker: str) -> Path:
        out_mp3 = work / f"raw_{chunk_idx:05d}.mp3"
        out_wav = work / f"seg_{chunk_idx:05d}.wav"
        voice = voice_for_speaker(speaker, cfg)
        await tts_edge(text, voice, out_mp3, sem)
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(out_mp3),
                "-ar",
                "44100",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(out_wav),
            ]
        )
        out_mp3.unlink(missing_ok=True)
        return out_wav

    for seg in segments:
        for ch in chunk_text(seg.text):
            tasks.append(asyncio.create_task(process_chunk(idx, ch, seg.speaker)))
            idx += 1

    results = await asyncio.gather(*tasks)
    return list(results)


def concat_wavs(wavs: list[Path], combined: Path) -> None:
    lst = combined.parent / "concat_list.txt"
    with lst.open("w", encoding="utf-8") as f:
        for w in wavs:
            f.write(f"file '{w.as_posix()}'\n")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(combined)])


def encode_mp3_under_cap(combined_wav: Path, out_mp3: Path) -> None:
    dur = ffprobe_duration(combined_wav)
    br = pick_mp3_bitrate_bps(dur)
    brk = max(32, math.floor(br / 1000))
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(combined_wav),
            "-c:a",
            "libmp3lame",
            "-b:a",
            f"{brk}k",
            str(out_mp3),
        ]
    )
    size = out_mp3.stat().st_size
    if size > MAX_BYTES:
        tighter = max(32, math.floor(brk * (MAX_BYTES / size) * 0.95))
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(combined_wav),
                "-c:a",
                "libmp3lame",
                "-b:a",
                f"{tighter}k",
                str(out_mp3),
            ]
        )


def split_segments_by_half(segments: list[Segment]) -> tuple[list[Segment], list[Segment]]:
    if len(segments) == 1:
        text = segments[0].text
        mid = len(text) // 2
        cut = text.rfind(". ", 0, mid)
        if cut < len(text) // 4:
            cut = text.rfind(" ", 0, mid)
        if cut < len(text) // 4:
            cut = mid
        a, b = text[: cut + 1].strip(), text[cut + 1 :].strip()
        spk = segments[0].speaker
        return [Segment(spk, a)], [Segment(spk, b)]
    mid = len(segments) // 2
    return segments[:mid], segments[mid:]


async def generate_wav_for_segments(segments: list[Segment], work: Path, cfg: TtsConfig) -> Path:
    wavs = await synthesize_segments(segments, work, cfg)
    combined = work / "combined.wav"
    concat_wavs(wavs, combined)
    return combined


async def generate_one(md_path: Path, out_mp3: Path, cfg: TtsConfig) -> list[Path]:
    text = md_path.read_text(encoding="utf-8")
    segments = parse_script(text, dual_voice=cfg.dual_voice)
    if not segments:
        raise RuntimeError(f"No narration text in {md_path}")

    try:
        import edge_tts  # noqa: F401
    except ImportError as e:
        raise RuntimeError("Install edge-tts: pip install edge-tts") from e

    outputs: list[Path] = []
    with tempfile.TemporaryDirectory(prefix="podcast_") as td:
        work = Path(td)
        combined = await generate_wav_for_segments(segments, work, cfg)
        encode_mp3_under_cap(combined, out_mp3)
        if out_mp3.stat().st_size <= MAX_BYTES:
            return [out_mp3]

        part1 = out_mp3.with_name(out_mp3.stem + "_part1.mp3")
        part2 = out_mp3.with_name(out_mp3.stem + "_part2.mp3")
        left, right = split_segments_by_half(segments)
        work1 = work / "p1"
        work2 = work / "p2"
        work1.mkdir()
        work2.mkdir()
        wav1 = await generate_wav_for_segments(left, work1, cfg)
        wav2 = await generate_wav_for_segments(right, work2, cfg)
        encode_mp3_under_cap(wav1, part1)
        encode_mp3_under_cap(wav2, part2)
        if part1.stat().st_size > MAX_BYTES or part2.stat().st_size > MAX_BYTES:
            raise RuntimeError(f"Split output still exceeds 25 MiB: {part1} / {part2}")
        out_mp3.unlink(missing_ok=True)
        outputs = [part1, part2]
    return outputs


def resolve_script(level_dir: Path, kind: str) -> Path | None:
    canonical = level_dir / f"{kind}_podcast.md"
    if canonical.is_file():
        return canonical
    for p in level_dir.glob("*.md"):
        name = p.name.lower()
        if kind in name and "podcast" in name:
            return p
    return None


def discover_jobs(root: Path) -> list[tuple[Path, Path]]:
    jobs: list[tuple[Path, Path]] = []
    for level_dir in discover_level_dirs(root):
        for kind in ("short", "long"):
            md = resolve_script(level_dir, kind)
            if md is not None:
                jobs.append((md, level_dir / f"{kind}_podcast.mp3"))
    return jobs


def discover_level_dirs(root: Path) -> list[Path]:
    if root.is_dir() and root.name in LEVELS:
        return [root]
    dirs: list[Path] = []
    for p in root.rglob("*"):
        if p.is_dir() and p.name in LEVELS:
            dirs.append(p)
    return sorted(set(dirs))


def should_generate(md: Path, mp3: Path, *, force: bool, only_missing: bool) -> tuple[bool, str]:
    if force:
        return True, "force"
    if not mp3.is_file():
        return True, "missing"
    if only_missing:
        return False, "unchanged"
    if md.stat().st_mtime > mp3.stat().st_mtime:
        return True, "stale"
    if mp3.stat().st_size > MAX_BYTES:
        return True, "oversized"
    return False, "unchanged"


def discover_jobs_filtered(
    root: Path,
    *,
    kinds: set[str] | None = None,
) -> list[tuple[Path, Path]]:
    jobs = discover_jobs(root)
    if kinds:
        jobs = [
            (md, mp3)
            for md, mp3 in jobs
            if ("short" in md.name and "short" in kinds) or ("long" in md.name and "long" in kinds)
        ]
    return jobs


async def run_jobs(
    jobs: list[tuple[Path, Path]],
    cfg: TtsConfig,
    *,
    force: bool,
    only_missing: bool,
    dry_run: bool,
) -> list[JobResult]:
    results: list[JobResult] = []
    for md, mp3 in jobs:
        do_it, reason = should_generate(md, mp3, force=force, only_missing=only_missing)
        if not do_it:
            dur = ffprobe_duration(mp3) if mp3.is_file() else 0.0
            results.append(
                JobResult(
                    md=md,
                    mp3=mp3,
                    status="skipped",
                    reason=reason,
                    size_bytes=mp3.stat().st_size if mp3.is_file() else 0,
                    duration_sec=dur,
                )
            )
            print(f"SKIP {mp3.name} ({reason})")
            continue
        if dry_run:
            print(f"[dry-run] would generate {mp3.name} ({reason})")
            results.append(JobResult(md=md, mp3=mp3, status="dry_run", reason=reason))
            continue
        mode = "dual-host en-IN" if cfg.dual_voice else "single en-IN"
        print(f"Generating {mp3.name} from {md.name} ({reason}, {mode}) ...")
        try:
            outputs = await generate_one(md, mp3, cfg)
            primary = outputs[0]
            sz = primary.stat().st_size
            dur = ffprobe_duration(primary)
            status = "generated" if len(outputs) == 1 else "split"
            print(f"  OK {primary} ({sz / (1024*1024):.2f} MiB, {dur:.1f}s)")
            for extra in outputs[1:]:
                print(f"  OK {extra} ({extra.stat().st_size / (1024*1024):.2f} MiB)")
            results.append(
                JobResult(
                    md=md,
                    mp3=primary,
                    status=status,
                    reason=reason,
                    size_bytes=sz,
                    duration_sec=dur,
                )
            )
        except Exception as e:
            print(f"  FAIL {mp3}: {e}", file=sys.stderr)
            results.append(JobResult(md=md, mp3=mp3, status="error", reason=reason, error=str(e)))
    return results


def build_tts_config(args: argparse.Namespace) -> TtsConfig:
    voice_woman = VOICE_WOMAN_EDGE
    if getattr(args, "voice_woman", "standard") == "expressive":
        voice_woman = VOICE_WOMAN_EXPRESSIVE_EDGE
    return TtsConfig(
        dual_voice=args.dual_voice,
        voice_man=VOICE_MAN_EDGE,
        voice_woman=voice_woman,
        voice_single=VOICE_SINGLE_EDGE,
    )


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=repo / "public/generated_resources/neb_nepal")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only-missing", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--dual-voice", action="store_true", help="Two hosts: en-IN-Prabhat + Neerja")
    ap.add_argument(
        "--voice-woman",
        choices=["standard", "expressive"],
        default="standard",
        help="Female host voice variant (en-IN)",
    )
    ap.add_argument("--kinds", choices=["short", "long", "both"], default="both")
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"Root not found: {root}", file=sys.stderr)
        return 1

    cfg = build_tts_config(args)
    kinds = {"short", "long"} if args.kinds == "both" else {args.kinds}
    jobs = discover_jobs_filtered(root, kinds=kinds)
    if not jobs:
        print("No podcast jobs found", file=sys.stderr)
        return 1

    results = asyncio.run(
        run_jobs(jobs, cfg, force=args.force, only_missing=args.only_missing, dry_run=args.dry_run)
    )
    errors = sum(1 for r in results if r.status == "error")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
