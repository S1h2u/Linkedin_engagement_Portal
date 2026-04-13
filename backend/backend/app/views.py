from __future__ import annotations

import json

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt


def add_cors_headers(response, origin="*"):
    """Add CORS headers to response for cross-origin requests.
    
    Note: Hop-by-hop headers (Connection, Keep-Alive, etc.) are handled
    by the web server and MUST NOT be set here as they will cause
    AssertionError in Django's WSGI handler.
    """
    response["Access-Control-Allow-Origin"] = origin
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response["Cache-Control"] = "no-cache"
    # DO NOT set Connection, Keep-Alive, or Transfer-Encoding here
    # The web server (gunicorn/nginx) handles those
    return response


from .services.automation_service import (
    apply_post_action,
    check_session,
    generate_comments,
    get_review_posts,
    login,
    run_bot,
)


def home(request: HttpRequest) -> JsonResponse:
    response = JsonResponse({"status": "Backend running"})
    return add_cors_headers(response)


@csrf_exempt
def linkedin_login(request: HttpRequest) -> JsonResponse:
    if request.method == "OPTIONS":
        response = JsonResponse({})
        return add_cors_headers(response)
    
    if request.method != "POST":
        response = JsonResponse({"error": "Method not allowed"}, status=405)
        return add_cors_headers(response)

    try:
        result = login()
        response = JsonResponse(result)
        return add_cors_headers(response)
    except Exception as exc:
        response = JsonResponse({"error": str(exc)}, status=500)
        return add_cors_headers(response)


@csrf_exempt
def linkedin_run(request: HttpRequest) -> JsonResponse:
    if request.method == "OPTIONS":
        response = JsonResponse({})
        return add_cors_headers(response)
    if request.method != "POST":
        response = JsonResponse({"error": "Method not allowed"}, status=405)
        return add_cors_headers(response)

    try:
        result = run_bot()
        response = JsonResponse(result)
        return add_cors_headers(response)
    except FileNotFoundError as exc:
        response = JsonResponse({"error": str(exc)}, status=400)
        return add_cors_headers(response)
    except Exception as exc:
        response = JsonResponse({"error": str(exc)}, status=500)
        return add_cors_headers(response)


def linkedin_session(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        response = JsonResponse({"error": "Method not allowed"}, status=405)
        return add_cors_headers(response)

    try:
        result = check_session()
        response = JsonResponse(result)
        return add_cors_headers(response)
    except Exception as exc:
        response = JsonResponse({"error": str(exc)}, status=500)
        return add_cors_headers(response)


def linkedin_review_posts(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        response = JsonResponse({"error": "Method not allowed"}, status=405)
        return add_cors_headers(response)

    try:
        result = get_review_posts()
        response = JsonResponse(result)
        return add_cors_headers(response)
    except FileNotFoundError as exc:
        response = JsonResponse({"error": str(exc)}, status=404)
        return add_cors_headers(response)
    except Exception as exc:
        response = JsonResponse({"error": str(exc)}, status=500)
        return add_cors_headers(response)


@csrf_exempt
def linkedin_generate_comments(request: HttpRequest) -> JsonResponse:
    if request.method == "OPTIONS":
        response = JsonResponse({})
        return add_cors_headers(response)
    
    if request.method != "POST":
        response = JsonResponse({"error": "Method not allowed"}, status=405)
        return add_cors_headers(response)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        tone = str(payload.get("tone", "balanced")).strip()
        result = generate_comments(tone=tone)
        response = JsonResponse(result)
        return add_cors_headers(response)
    except json.JSONDecodeError:
        result = generate_comments()
        response = JsonResponse(result)
        return add_cors_headers(response)
    except FileNotFoundError as exc:
        response = JsonResponse({"error": str(exc)}, status=404)
        return add_cors_headers(response)
    except Exception as exc:
        response = JsonResponse({"error": str(exc)}, status=500)
        return add_cors_headers(response)


@csrf_exempt
def linkedin_action(request: HttpRequest) -> JsonResponse:
    if request.method == "OPTIONS":
        response = JsonResponse({})
        return add_cors_headers(response)
    
    if request.method != "POST":
        response = JsonResponse({"error": "Method not allowed"}, status=405)
        return add_cors_headers(response)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        response = JsonResponse({"error": "Invalid JSON payload."}, status=400)
        return add_cors_headers(response)

    try:
        post_id = int(payload.get("post_id"))
        action = str(payload.get("action", "")).strip()
        refine_prompt = str(payload.get("refine_prompt", "")).strip()
        tone = str(payload.get("tone", "")).strip()
        result = apply_post_action(post_id, action, refine_prompt, tone)
        response = JsonResponse(result)
        return add_cors_headers(response)
    except ValueError as exc:
        response = JsonResponse({"error": str(exc)}, status=400)
        return add_cors_headers(response)
    except FileNotFoundError as exc:
        response = JsonResponse({"error": str(exc)}, status=404)
        return add_cors_headers(response)
    except Exception as exc:
        response = JsonResponse({"error": str(exc)}, status=500)
        return add_cors_headers(response)
