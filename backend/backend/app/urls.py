from __future__ import annotations

from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("linkedin/login/", views.linkedin_login, name="linkedin-login"),
    path("linkedin/run/", views.linkedin_run, name="linkedin-run"),
    path("linkedin/session/", views.linkedin_session, name="linkedin-session"),
    path("linkedin/review-posts/", views.linkedin_review_posts, name="linkedin-review-posts"),
    path("linkedin/generate-comments/", views.linkedin_generate_comments, name="linkedin-generate-comments"),
    path("linkedin/action/", views.linkedin_action, name="linkedin-action"),
]
