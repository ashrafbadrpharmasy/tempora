import os, re, subprocess, tempfile
from pathlib import Path
from typing import Any
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

app = FastAPI(title="Tempora Video Safety Scanner", version="0.1.0")
MAX_BYTES = int(os.getenv("MAX_VIDEO_BYTES", str(200 * 1024 * 1024)))
FRAME_RATE = float(os.getenv("SCAN_FRAMES_PER_SECOND", "2"))
MAX_SECONDS = int(os.getenv("MAX_VIDEO_SECONDS", "900"))
EXPLICIT_LABELS = {"FEMALE_GENITALIA_EXPOSED","MALE_GENITALIA_EXPOSED","ANUS_EXPOSED","FEMALE_BREAST_EXPOSED"}
BLOCKED_TEXT = {"fuck","fucking","shit","bitch","porn","nude","nudes","xxx","sex video","sexual assault"}
REVIEW_TEXT = {"kill yourself","suicide","rape","minor","underage"}

class ScanResponse(BaseModel):
    verdict: str
    complete: bool
    frames_checked: int
    duration_seconds: float | None
    reasons: list[str]
    text_findings: list[str]
    note: str

def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode:
        raise RuntimeError((result.stderr or "Media processing failed")[-1200:])
    return result.stdout.strip()

def get_duration(path: Path) -> float:
    return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)]))

def extract_frames(video: Path, folder: Path) -> list[Path]:
    run(["ffmpeg","-hide_banner","-loglevel","error","-i",str(video),"-vf",f"fps={FRAME_RATE}","-frames:v","1800",str(folder/"frame-%06d.jpg")])
    return sorted(folder.glob("frame-*.jpg"))

def scan_text(frames: list[Path]) -> list[str]:
    try:
        import pytesseract
        from PIL import Image
        findings = []
        for frame in frames:
            text = pytesseract.image_to_string(Image.open(frame)).lower()
            for term in BLOCKED_TEXT | REVIEW_TEXT:
                if re.search(r"(?<!\w)"+re.escape(term)+r"(?!\w)",text):
                    findings.append(f"On-screen text contains a flagged term: {term}")
        return sorted(set(findings))
    except Exception as exc:
        raise RuntimeError(f"On-screen text scan unavailable: {exc}") from exc

def scan_audio(video: Path) -> list[str]:
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(os.getenv("WHISPER_MODEL","base"),device="cpu",compute_type="int8")
        segments, _ = model.transcribe(str(video),vad_filter=True)
        transcript = " ".join(s.text.lower() for s in segments)
        return sorted({f"Audio transcript contains a flagged term: {term}" for term in BLOCKED_TEXT | REVIEW_TEXT if re.search(r"(?<!\w)"+re.escape(term)+r"(?!\w)",transcript)})
    except Exception as exc:
        raise RuntimeError(f"Audio transcription scan unavailable: {exc}") from exc

def scan_images(frames: list[Path]) -> list[str]:
    try:
        from nudenet import NudeDetector
        detector = NudeDetector()
        findings = []
        for index, frame in enumerate(frames):
            detections: list[dict[str, Any]] = detector.detect(str(frame))
            for detection in detections:
                label = str(detection.get("class","")).upper()
                if label in EXPLICIT_LABELS and float(detection.get("score",0)) >= 0.35:
                    findings.append(f"Possible explicit imagery in sampled frame {index+1} ({label})")
        return findings
    except Exception as exc:
        raise RuntimeError(f"Image safety model unavailable: {exc}") from exc

@app.get("/health")
def health():
    return {"status":"ok","service":"tempora-moderator"}

@app.post("/scan",response_model=ScanResponse)
async def scan_video(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".mp4",".mov",".m4v",".webm",".mkv",".avi"}:
        raise HTTPException(400,"Upload a supported video file.")
    with tempfile.TemporaryDirectory(prefix="tempora-scan-") as temp:
        root = Path(temp); video = root/("upload"+suffix); size = 0
        try:
            with video.open("wb") as out:
                while True:
                    chunk = await file.read(1024*1024)
                    if not chunk: break
                    size += len(chunk)
                    if size > MAX_BYTES: raise HTTPException(413,"Video exceeds the configured size limit.")
                    out.write(chunk)
            duration = get_duration(video)
            if duration <= 0 or duration > MAX_SECONDS: raise HTTPException(413,f"Video must be shorter than {MAX_SECONDS} seconds.")
            folder = root/"frames"; folder.mkdir()
            frames = extract_frames(video,folder)
            if not frames: raise RuntimeError("No frames could be extracted.")
            visual = scan_images(frames)
            text_findings = scan_text(frames) + scan_audio(video)
            if visual: verdict = "blocked"
            else:
                verdict = "review_required"
                text_findings.append("Automated screening cannot certify a video as 100% safe; human review is required.")
            return ScanResponse(verdict=verdict,complete=True,frames_checked=len(frames),duration_seconds=round(duration,2),reasons=visual,text_findings=sorted(set(text_findings)),note="Sampling and classifiers can miss content. This does not verify a person's age and is not a guarantee.")
        except HTTPException: raise
        except Exception as exc:
            raise HTTPException(503,f"Safety scan failed; treat video as unreviewed. {str(exc)[:250]}") from exc
        finally:
            await file.close()
