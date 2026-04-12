from __future__ import annotations

import json

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .services.automation_service import (
    apply_post_action,
    check_session,
    generate_comments,
    get_review_posts,
    login,
    run_bot,
)


def home(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "Backend running"})


@csrf_exempt
def linkedin_login(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        return JsonResponse(login())
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@csrf_exempt
def linkedin_run(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        return JsonResponse(run_bot())
    except FileNotFoundError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


def linkedin_session(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        return JsonResponse(check_session())
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


def linkedin_review_posts(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        return JsonResponse(get_review_posts())
    except FileNotFoundError as exc:
        return JsonResponse({"error": str(exc)}, status=404)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@csrf_exempt
def linkedin_generate_comments(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        tone = str(payload.get("tone", "balanced")).strip()
        return JsonResponse(generate_comments(tone=tone))
    except json.JSONDecodeError:
        return JsonResponse(generate_comments())
    except FileNotFoundError as exc:
        return JsonResponse({"error": str(exc)}, status=404)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


@csrf_exempt
def linkedin_action(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    try:
        post_id = int(payload.get("post_id"))
        action = str(payload.get("action", "")).strip()
        refine_prompt = str(payload.get("refine_prompt", "")).strip()
        tone = str(payload.get("tone", "")).strip()
        return JsonResponse(apply_post_action(post_id, action, refine_prompt, tone))
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except FileNotFoundError as exc:
        return JsonResponse({"error": str(exc)}, status=404)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)
