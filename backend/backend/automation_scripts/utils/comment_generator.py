from __future__ import annotations

from ..core.session import AutomationConfig


def _get_openai_client(config: AutomationConfig):
    if not config.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is missing. Comment generation requires an OpenAI API key.")

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError("The openai package is not installed. Run `pip install openai`.") from exc

    return OpenAI(api_key=config.openai_api_key)


def generate_comment(config: AutomationConfig, post_text: str, tone: str = "balanced") -> str:
    """Generate a domain-expert LinkedIn comment with specified tone.
    
    Args:
        config: AutomationConfig with OpenAI settings
        post_text: The LinkedIn post text to comment on
        tone: Comment tone - 'technical', 'balanced', or 'contrarian'
    """
    client = _get_openai_client(config)
    
    # Tone-specific expert instructions
    tone_instructions = {
        "technical": """You are a fintech & MSME credit expert. Focus on:
- Technical depth: credit risk models, guarantee structures, NPA angles
- Industry specifics: RBI regulations, policy impacts, execution gaps
- Use precise terminology (GST, TReDS, CGTMSE, LTV, working capital cycle)
- Mention specific mechanisms or challenges in the space""",
        "balanced": """You are an experienced MSME finance professional. Balance:
- Acknowledgment of the initiative + deeper insight
- Avoid generic praise like "great initiative"
- Identify real challenges: adoption gaps, execution challenges, scaling barriers
- Add value by pointing out what's missing or what could be better""",
        "contrarian": """You are a critic with deep MSME finance expertise. Challenge:
- Underlying assumptions in the post
- Propose alternative perspectives or constraints
- Point out execution risks, sustainability questions, or policy challenges
- Be constructive but sharp—sound like someone who sees gaps others miss""",
    }
    
    tone_desc = tone_instructions.get(tone, tone_instructions["balanced"])
    
    prompt = f"""You are a domain expert in MSME finance, credit risk, and fintech.

Write a sharp, insightful LinkedIn comment on this post.

{tone_desc}

**Critical Rules:**
- Mention at least one specific concept or metric from the post (RBI, credit, MSME scheme, TReDS, GST, etc.)
- Add a deeper insight: risk model, adoption challenge, policy impact, or execution barrier
- NO generic phrases like "great initiative" or "significant step"
- Sound like an expert, not a general LinkedIn user
- 2–3 lines max, concise and impactful
- No emojis

**Example of what NOT to do:**
❌ "This initiative is a significant step forward."

**Example of what TO do:**
✅ "The MSME credit card model could ease working capital cycles for GST-compliant businesses. The real challenge will be adoption at the last mile and underwriting discipline as volumes scale."

Post:
{post_text}

Expert Comment:
"""
    response = client.chat.completions.create(
        model=config.openai_model,
        messages=[
            {
                "role": "system",
                "content": "You are a domain expert in MSME finance, credit risk, fintech, and Indian lending ecosystems. You write sharp, insightful comments that show deep expertise. You always mention specific concepts and add real insights, never generic praise.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
    )
    return (response.choices[0].message.content if response.choices else "").strip()


def refine_comment(
    config: AutomationConfig,
    original_comment: str,
    refine_prompt: str,
    post_text: str,
    tone: str = "balanced",
) -> str:
    """Refine a LinkedIn comment based on user instruction and tone, with expert-level depth.
    
    Args:
        config: AutomationConfig with OpenAI settings
        original_comment: The comment to refine
        refine_prompt: User's refinement instruction
        post_text: Original post text for context
        tone: Comment tone - 'technical', 'balanced', or 'contrarian'
    """
    client = _get_openai_client(config)
    
    # Tone-specific expert instructions for refinement
    tone_instructions = {
        "technical": """Apply technical depth: enhance with credit risk models, guarantee structures,
policy mechanisms, regulatory angles, or technical metrics (LTV, GST, NPA, working capital cycles).""",
        "balanced": """Keep it balanced and insightful: acknowledge the initiative while adding the deeper
challenge (adoption gaps, execution barriers, scaling risks, market readiness).""",
        "contrarian": """Sharpen the critique: emphasize execution risks, sustainability questions,
alternative perspectives, or policy constraints the post might miss.""",
    }
    
    tone_desc = tone_instructions.get(tone, tone_instructions["balanced"])
    
    prompt = f"""You are a domain expert in MSME finance, credit risk, and fintech.

Refine this LinkedIn comment based on the user's instruction.

User's Refinement Instruction:
{refine_prompt}

Refinement Guidance ({tone} tone):
{tone_desc}

**Rules for refinement:**
- Keep the expert voice and specific concepts
- Make sure it still mentions at least one specific metric/concept from the original post
- Avoid becoming generic or adding fluff
- 2–3 lines max, sharp and impactful
- NO generic phrases like "great," "innovative," or "significant step"

Original Comment:
{original_comment}

Original Post:
{post_text}

Refined Expert Comment:
"""
    response = client.chat.completions.create(
        model=config.openai_model,
        messages=[
            {
                "role": "system",
                "content": "You are a domain expert in MSME finance, credit risk, fintech, and Indian lending ecosystems. You refine comments while maintaining depth, specificity, and expert voice. You never make comments generic.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
    )
    return (response.choices[0].message.content if response.choices else "").strip()
