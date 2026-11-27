---
layout: post
title: "Building a Voice-Controlled MacBook AI Agent with Gemini in Terminal"
subtitle: "A step-by-step learning log on turning a MacBook into a hands-free GUI & voice agent using Python, Gemini Vision, macOS native automation, and zero extra hardware."
date: 2026-11-26
author: Tong Fang Sun
kicker: Learning Log · AI Agent
read_time: 7 min read
tags:
  - Antigravity
  - Gemini API
  - macOS Automation
  - AI Agent
  - Voice UI
excerpt: "How I built a voice-controlled MacBook AI Agent from scratch in Terminal using Gemini's multimodal API, macOS screencapture, AppleScript, and Python — plus every real-world bug we hit and fixed along the way."
---

I originally started exploring how to give an AI agent physical "eyes and hands" using an ESP32-S3 or Raspberry Pi Zero 2 W to control an iPhone or MacBook. Before buying any hardware, I realized we could build a complete **software-only MacBook GUI & Voice Agent** right inside Terminal in under 10 minutes — using **Gemini** as both the vision brain and the speech recognizer.

This learning article documents the exact Terminal commands, complete Python scripts (`mac_agent.py` and `voice_agent.py`), and the real debugging lessons we encountered along the way.

---

## How the Agent Works

Every step follows a simple perception–action loop running locally on macOS:

1. **Voice Input (`voice_agent.py`)** — Press `Enter` to record audio from the MacBook microphone (`sounddevice`), then send the `.wav` file directly to **Gemini** (which understands audio natively — no Whisper or separate STT service needed).
2. **Eyes (`screencapture`)** — Capture the current MacBook desktop, resize it for fast upload, and send it to Gemini along with the user's goal and action history.
3. **Brain (`google-genai` + Pydantic)** — Gemini returns a strictly typed JSON action (`open_url`, `open_app`, `click`, `type`, `hotkey`, `scroll`, `wait`, or `done`) with normalized `0–1000` screen coordinates.
4. **Hands (`open`, `pyautogui`, `pbcopy` + `osascript`)** — Execute the action locally, speak status updates with macOS `say`, and loop until the task is complete.

---

## Step 1: Get a Gemini API Key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and sign in with your Google account.
2. Click **Create API key** and copy the key (note: newer AI Studio keys start with `AQ.` instead of the older `AIza` prefix, and work natively with the official `google-genai` Python SDK).

> **Security Note:** Never commit your `.env` file or hardcode your real API key into a public repository. Always store it locally with restricted permissions (`chmod 600 .env`).

---

## Step 2: Grant macOS System Permissions

Open **System Settings → Privacy & Security** and enable the following for your Terminal app (**Terminal**, **iTerm**, or **VS Code**):

1. **Accessibility** — allows the script to move the mouse and send keystrokes.
2. **Screen Recording** — allows `screencapture` to capture the desktop for Gemini.
3. **Microphone** — macOS will prompt for this automatically the first time you run `voice_agent.py`.

Restart Terminal completely (`Cmd + Q` and reopen) so the new permissions take effect.

---

## Step 3: Set Up the Project in Terminal

Run these commands in your MacBook Terminal to create an isolated Python virtual environment and install all dependencies:

```bash
mkdir -p ~/mac-gemini-agent && cd ~/mac-gemini-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -U google-genai pyautogui pillow pydantic python-dotenv sounddevice numpy
```

Save your API key into a local `.env` file (replace `YOUR_GEMINI_API_KEY` with your actual key):

```bash
cat << 'EOF' > .env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
EOF
chmod 600 .env
```

---

## Step 4: The Core MacBook GUI Agent (`mac_agent.py`)

Create `~/mac-gemini-agent/mac_agent.py`. This final version includes:
- **Retina-safe normalized coordinates (`0–1000`)** mapped to `pyautogui.size()` logical pixels.
- **Native `open_url` and `open_app` actions** with graceful error feedback so missing apps (like Chrome on a Safari-only Mac) don't crash the loop.
- **Full Chinese / UTF-8 typing** via `pbcopy` + AppleScript `Cmd+V`.
- **Automatic multi-model fallback** prioritizing stable `flash-lite` models when free-tier preview models hit `503` or `429`.
- **Emergency stop (`pyautogui.FAILSAFE = True`)**: whip your mouse to the top-left corner `(0, 0)` at any time to immediately halt the agent.

```python
import os
import subprocess
import time
from typing import Literal, Optional

import pyautogui
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image
from pydantic import BaseModel

load_dotenv()

# Emergency stop: fling mouse to top-left corner (0, 0) to abort immediately
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.2

# Ordered by stability & free-tier quota; falls back automatically on 503/429
MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
]
SCREENSHOT_PATH = "/tmp/mac_agent_screen.png"


class AgentAction(BaseModel):
    thought: str
    action: Literal[
        "open_url",
        "open_app",
        "click",
        "double_click",
        "right_click",
        "type",
        "hotkey",
        "scroll",
        "wait",
        "done",
    ]
    url: Optional[str] = None        # Opens directly in the user's default browser
    app_name: Optional[str] = None   # macOS app name, e.g. "Safari", "Calculator", "Notes"
    x: Optional[int] = None          # Normalized 0..1000 horizontal coordinate
    y: Optional[int] = None          # Normalized 0..1000 vertical coordinate
    text: Optional[str] = None       # Text to type (supports Chinese & English)
    keys: Optional[list[str]] = None # Hotkey list, e.g. ["enter"] or ["command", "n"]
    scroll_amount: Optional[int] = None


SYSTEM_PROMPT = """You are a personal AI assistant running on macOS. You can see the user's screen and control the keyboard and mouse.
Rules:
1. To open a website or run a web search, prefer action="open_url" (e.g. "https://www.google.com/search?q=...") so it opens directly in the user's default browser.
2. To open a local app, use action="open_app" (default browser is usually "Safari"; if an app fails to open, try another installed app).
3. All click coordinates (x, y) must be normalized integers from 0 to 1000 (top-left is 0,0; bottom-right is 1000,1000).
4. Output only one clear action per step. When the task is finished — or before any sensitive action like payments, deletions, or passwords — return action="done" and explain in thought.
"""


def take_screenshot() -> Image.Image:
    subprocess.run(["screencapture", "-x", SCREENSHOT_PATH], check=True)
    img = Image.open(SCREENSHOT_PATH)
    img.thumbnail((1440, 1440))
    return img


def paste_text_macos(text: str):
    """Use clipboard + AppleScript Cmd+V so Chinese and special characters work reliably."""
    subprocess.run(["pbcopy"], input=text.encode("utf-8"), check=True)
    time.sleep(0.1)
    subprocess.run(
        ["osascript", "-e", 'tell application "System Events" to keystroke "v" using command down'],
        check=True,
    )


def to_logical_xy(x_norm: int, y_norm: int) -> tuple[int, int]:
    """Map 0..1000 normalized coords to macOS logical points (avoids Retina 2x offset)."""
    sw, sh = pyautogui.size()
    return int(x_norm / 1000 * sw), int(y_norm / 1000 * sh)


def execute_action(act: AgentAction) -> str:
    if act.action == "open_url" and act.url:
        subprocess.run(["open", act.url], check=False)
        time.sleep(1.5)
        return f"Opened URL {act.url}"
    elif act.action == "open_app" and act.app_name:
        res = subprocess.run(["open", "-a", act.app_name], capture_output=True, text=True)
        if res.returncode != 0:
            err = res.stderr.strip() or f"App not found: {act.app_name}"
            print(f"⚠️  {err} (reported back to Gemini)")
            return f"Failed: {err}"
        time.sleep(0.8)
        return f"Opened {act.app_name}"
    elif act.action in ("click", "double_click", "right_click"):
        lx, ly = to_logical_xy(act.x or 0, act.y or 0)
        pyautogui.moveTo(lx, ly, duration=0.25)
        if act.action == "click":
            pyautogui.click()
        elif act.action == "double_click":
            pyautogui.doubleClick()
        elif act.action == "right_click":
            pyautogui.rightClick()
    elif act.action == "type" and act.text:
        if act.text.isascii():
            pyautogui.write(act.text, interval=0.05)
        else:
            paste_text_macos(act.text)
    elif act.action == "hotkey" and act.keys:
        if len(act.keys) == 1:
            pyautogui.press(act.keys[0])
        else:
            pyautogui.hotkey(*act.keys)
    elif act.action == "scroll":
        pyautogui.scroll(act.scroll_amount or -5)
    elif act.action == "wait":
        time.sleep(1.5)
    return "OK"


def ask_gemini(client: genai.Client, img: Image.Image, prompt: str) -> AgentAction:
    last_err = None
    for model_id in MODELS:
        try:
            print(f"🤖 Requesting {model_id} ...", flush=True)
            resp = client.models.generate_content(
                model=model_id,
                contents=[img, prompt],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=AgentAction,
                    temperature=0.1,
                ),
            )
            text = "".join(
                p.text for p in resp.candidates[0].content.parts if getattr(p, "text", None)
            )
            return AgentAction.model_validate_json(text)
        except Exception as e:
            print(f"⚠️  {model_id} unavailable ({type(e).__name__}), trying next...", flush=True)
            last_err = e
    raise last_err


def run_task(task: str, max_steps: int = 15, confirm_each_step: bool = False):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not found in .env")
    client = genai.Client(api_key=api_key, http_options={"timeout": 20000})
    history: list[str] = []

    print(f"\n🚀 Task: {task}")
    print("💡 Tip: Move mouse to the top-left corner anytime to emergency-stop!\n")

    for step in range(1, max_steps + 1):
        print(f"📸 [Step {step}] Capturing screen...", flush=True)
        img = take_screenshot()
        prompt = (
            f"User goal: {task}\n\nCompleted steps:\n"
            + ("\n".join(history) if history else "None")
            + "\n\nDecide the next action based on the current screenshot."
        )

        act = ask_gemini(client, img, prompt)
        print(f"[Step {step}] Thought: {act.thought}")
        print(f"          Action:  {act.model_dump(exclude={'thought'}, exclude_none=True)}")

        if act.action == "done":
            print("\n✅ Task complete!")
            break

        if confirm_each_step:
            ans = input("👉 Press Enter to execute (or 'n' to cancel): ").strip().lower()
            if ans == "n":
                print("Aborted.")
                break

        result = execute_action(act)
        history.append(f"Step {step}: {act.action} -> {result} ({act.thought})")
        time.sleep(1.5)


if __name__ == "__main__":
    task_input = input("Enter a task for Gemini on MacBook: ").strip()
    if task_input:
        run_task(task_input, confirm_each_step=False)
```

---

## Step 5: Adding Native Voice Control (`voice_agent.py`)

Because Gemini natively accepts `audio/wav`, adding voice control takes just ~60 lines of Python — plus macOS's built-in `say` command for spoken confirmation:

```python
import os
import queue
import subprocess
import wave

import numpy as np
import sounddevice as sd
from dotenv import load_dotenv
from google import genai
from google.genai import types

from mac_agent import MODELS, run_task

load_dotenv()

SAMPLE_RATE = 16000
VOICE_PATH = "/tmp/mac_agent_voice.wav"


def speak(text: str):
    subprocess.Popen(["say", text])


def record_until_enter() -> bytes:
    q: queue.Queue = queue.Queue()

    def callback(indata, frames, time_info, status):
        q.put(indata.copy())

    print("🎙️  Recording... speak your command, then press Enter to stop.", flush=True)
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="int16", callback=callback):
        input()

    chunks = []
    while not q.empty():
        chunks.append(q.get())
    audio = np.concatenate(chunks, axis=0) if chunks else np.zeros((1, 1), dtype="int16")

    with wave.open(VOICE_PATH, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio.tobytes())

    with open(VOICE_PATH, "rb") as f:
        return f.read()


def transcribe_with_gemini(wav_bytes: bytes) -> str:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"], http_options={"timeout": 20000})
    audio_part = types.Part.from_bytes(data=wav_bytes, mime_type="audio/wav")
    prompt = "Transcribe the user's spoken command accurately. Output only the command text with no quotes or explanation."

    for model_id in MODELS:
        try:
            resp = client.models.generate_content(
                model=model_id,
                contents=[audio_part, prompt],
            )
            return "".join(
                p.text for p in resp.candidates[0].content.parts if getattr(p, "text", None)
            ).strip()
        except Exception:
            continue
    raise RuntimeError("All models are currently unavailable. Please try again shortly.")


def main():
    print("🔊 MacBook Voice Agent ready! (Move mouse to top-left corner to stop)\n")
    while True:
        cmd = input("👉 Press Enter to speak (or type a task, 'q' to quit): ").strip()
        if cmd.lower() == "q":
            break

        if cmd:
            task = cmd
        else:
            wav_bytes = record_until_enter()
            print("🧠 Transcribing with Gemini...", flush=True)
            task = transcribe_with_gemini(wav_bytes)
            print(f"🗣️  Heard: {task}")

        if not task:
            print("⚠️  Didn't catch that. Try again.\n")
            continue

        speak(f"Got it. Starting: {task}")
        run_task(task, confirm_each_step=False)
        speak("Task completed.")
        print()


if __name__ == "__main__":
    main()
```

---

## Quick Run Cheatsheet

Any time you open a fresh Terminal window:

```bash
# Text mode
cd ~/mac-gemini-agent && .venv/bin/python -W ignore mac_agent.py

# Voice mode
cd ~/mac-gemini-agent && .venv/bin/python -W ignore voice_agent.py
```

*(The `-W ignore` flag silences harmless LibreSSL / Python 3.9 deprecation warnings on stock macOS Python.)*

---

## Real-World Debugging Lessons Learned

Building this live in Terminal surfaced four subtle pitfalls that are easy to miss in tutorials:

1. **Free-Tier `404` & `503` Model Spikes**  
   Older model names like `gemini-2.5-flash` returned `404 NOT_FOUND` for new keys, while peak-hour calls to `gemini-3.8-flash` and `-preview` models hit `503 UNAVAILABLE` / `429`. Writing a quick REST probe against `/v1beta/models` revealed that `gemini-3.5-flash-lite` and `gemini-3.1-flash-lite` responded instantly, so we placed them first in `MODELS` with automatic fallback.
2. **Don't Rely on `Cmd + Space` Spotlight Hotkeys**  
   `pyautogui.hotkey("command", "space")` is frequently intercepted by macOS. Adding explicit `open_app` (`open -a`) and `open_url` (`open https://...`) actions made launching apps and web searches instant and 100% reliable — and catching `open -a` failures lets Gemini recover when an app like Chrome isn't installed.
3. **Interactive Confirmation Steals Window Focus**  
   When `confirm_each_step=True` was enabled, clicking back into Terminal to press Enter stole focus away from Calculator, causing the agent to type `128*64` straight into bash! Turning on hands-free mode (`confirm_each_step=False`) while keeping `pyautogui.FAILSAFE = True` solved the focus issue immediately.
4. **Retina 2x Scaling & Non-ASCII Input**  
   `screencapture` outputs 2x Retina pixels while `pyautogui` clicks in 1x logical points. Asking Gemini for `0–1000` normalized coordinates avoids resolution math bugs completely, and pasting via `pbcopy` + AppleScript `Cmd+V` makes Chinese and emoji input seamless.
