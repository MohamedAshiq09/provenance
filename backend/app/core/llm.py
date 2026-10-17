"""
LLM client factory — supports Gemini, OpenAI, and Anthropic.
LLM is used ONLY for:
  (a) entity/decision extraction with strict JSON schema
  (b) writing the final natural language answer

All traversal, ranking, and staleness detection is done via FalkorDB Cypher.
"""
import json
from typing import Any, Optional
from app.core.config import settings


def get_llm_response(prompt: str, schema: Optional[dict] = None, temperature: float = 0.1) -> str:
    """Get a response from the configured LLM provider."""
    if settings.LLM_PROVIDER == "gemini":
        return _gemini(prompt, schema, temperature)
    elif settings.LLM_PROVIDER == "openai":
        return _openai(prompt, schema, temperature)
    elif settings.LLM_PROVIDER == "anthropic":
        return _anthropic(prompt, schema, temperature)
    else:
        raise ValueError(f"Unknown LLM provider: {settings.LLM_PROVIDER}")


def extract_json(prompt: str, schema: dict) -> dict:
    """Extract structured JSON from a document using LLM with schema enforcement."""
    system_prompt = f"""You are a precise knowledge extraction engine.
Extract information from the text and return ONLY valid JSON matching this schema:
{json.dumps(schema, indent=2)}

Rules:
- Return ONLY the JSON object, no explanation, no markdown
- If a field has no value, use null or []
- Be conservative — only extract what is clearly stated
"""
    full_prompt = f"{system_prompt}\n\nTEXT TO EXTRACT FROM:\n{prompt}"
    raw = get_llm_response(full_prompt, temperature=0.0)
    # Clean markdown fences if present
    raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
    return json.loads(raw)


def generate_answer(question: str, graph_context: dict, sources: list) -> str:
    """Generate a natural language answer from graph traversal results."""
    context_str = json.dumps(graph_context, indent=2, default=str)
    sources_str = "\n".join([f"- [{s.get('id','?')}] {s.get('title','?')} ({s.get('url','')})" for s in sources])

    prompt = f"""You are Provenance, a Company Brain assistant that answers engineering questions.
Answer the following question based ONLY on the provided graph traversal results.
Do not invent or extrapolate facts. 
CRITICAL RULE: If the question asks about something not present in the graph context (e.g. personal gossip, pets, unrelated topics, unrecorded technologies like MongoDB, or unrecorded decisions), explicitly state ONLY: "No record of the requested topic in the graph." Do not invent facts, IDs, status, or citations. Do NOT guess.

QUESTION: {question}

GRAPH CONTEXT (from FalkorDB traversal):
{context_str}

SOURCES:
{sources_str}

Format your answer with clean headings and bullet points. Never display raw internal database IDs to users (use real names). End with a cited sources list."""
    return get_llm_response(prompt, temperature=0.2)


def _gemini(prompt: str, schema: Optional[dict], temperature: float) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    config = genai.GenerationConfig(temperature=temperature)

    # Try configured model, fallback to 2.0-flash or 1.5-flash if 429 quota exceeded
    models_to_try = [settings.GEMINI_MODEL, "gemini-2.0-flash", "gemini-1.5-flash"]
    last_err = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, generation_config=config)
            return response.text
        except Exception as e:
            last_err = e
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "404" in err_str or "not found" in err_str or "not available" in err_str:
                continue
            raise
    raise last_err


def _openai(prompt: str, schema: Optional[dict], temperature: float) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    messages = [{"role": "user", "content": prompt}]
    kwargs: dict[str, Any] = {"model": settings.OPENAI_MODEL, "messages": messages, "temperature": temperature}
    if schema:
        kwargs["response_format"] = {"type": "json_object"}
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


def _anthropic(prompt: str, schema: Optional[dict], temperature: float) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=4096,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
