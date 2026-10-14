"""Direct Gemini text generation over the public REST API (no third-party SDK).

Reads GOOGLE_API_KEY. Model order can be overridden with GEMINI_TEXT_MODEL; the fallbacks
mirror lib/gemini-text.js. Raises RuntimeError with a readable message on failure.
"""
import os
import requests

API_BASE = os.getenv("GEMINI_API_BASE", "https://generativelanguage.googleapis.com/v1beta")
API = API_BASE + "/models/{model}:generateContent"
FALLBACKS = ["gemini-2.5-flash", "gemini-flash-latest"]


def generate(prompt, system_prompt=None, temperature=0.9, max_output_tokens=8192, timeout=90):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY not found in environment")

    models = [m for m in [os.getenv("GEMINI_TEXT_MODEL")] + FALLBACKS if m]
    models = list(dict.fromkeys(models))  # dedupe, keep order

    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature, "maxOutputTokens": max_output_tokens},
    }
    if system_prompt:
        body["systemInstruction"] = {"parts": [{"text": system_prompt}]}

    last_error = "no model attempted"
    for model in models:
        try:
            resp = requests.post(
                API.format(model=model),
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json=body,
                timeout=timeout,
            )
        except requests.RequestException as exc:
            last_error = f"{model}: {exc}"
            continue
        if resp.status_code == 200:
            parts = (resp.json().get("candidates") or [{}])[0].get("content", {}).get("parts") or []
            text = "".join(p.get("text", "") for p in parts)
            if text:
                return text
            last_error = f"{model}: empty response"
            continue
        last_error = f"{model}: HTTP {resp.status_code} {resp.text[:200]}"
        # Auth errors will not improve on another model.
        if resp.status_code in (400, 401, 403):
            break
    raise RuntimeError(last_error)
