"""
Analysis service: orchestrates the full pipeline from username input
to a completed AnalysisReport with all computed metrics.
"""
import uuid
from datetime import datetime, UTC
from typing import Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.config import get_settings
from app.db.models import AnalysisReport, Follower, InstagramProfile, UsageRecord, User
from app.scrapers.instagram import fetch_profile, fetch_followers_sample, quick_profile_check
from app.nlp.processor import (
    detect_language, detect_country, compute_bot_score, aggregate_followers
)

log = structlog.get_logger(__name__)
settings = get_settings()


# ── USAGE ENFORCEMENT ────────────────────────────────────────────────────────
async def check_and_increment_usage(db: AsyncSession, user: User) -> None:
    from fastapi import HTTPException
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    limit = (
        settings.FREE_ANALYSES_PER_DAY
        if user.plan == "free"
        else settings.PRO_ANALYSES_PER_DAY
    )

    result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.user_id == user.id,
            UsageRecord.date == today,
        )
    )
    record = result.scalar_one_or_none()

    if record and record.analyses_count >= limit:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Daily analysis limit reached ({limit}/day on {user.plan} plan). "
                "Upgrade to Pro for unlimited analyses."
            ),
        )

    if record:
        record.analyses_count += 1
    else:
        record = UsageRecord(
            id=str(uuid.uuid4()),
            user_id=user.id,
            date=today,
            analyses_count=1,
        )
        db.add(record)
    await db.commit()


async def get_usage(db: AsyncSession, user: User) -> dict:
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    limit = (
        settings.FREE_ANALYSES_PER_DAY
        if user.plan == "free"
        else settings.PRO_ANALYSES_PER_DAY
    )
    result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.user_id == user.id,
            UsageRecord.date == today,
        )
    )
    record = result.scalar_one_or_none()
    used = record.analyses_count if record else 0
    return {
        "plan": user.plan,
        "analyses_today": used,
        "daily_limit": limit,
        "remaining": max(0, limit - used),
    }


# ── REPORT LIFECYCLE ─────────────────────────────────────────────────────────
async def create_pending_report(
    db: AsyncSession, user_id: str, username: str
) -> AnalysisReport:
    report = AnalysisReport(
        id=str(uuid.uuid4()),
        user_id=user_id,
        username=username,
        status="pending",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def get_report(
    db: AsyncSession, report_id: str, user_id: str
) -> Optional[AnalysisReport]:
    result = await db.execute(
        select(AnalysisReport).where(
            AnalysisReport.id == report_id,
            AnalysisReport.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_reports_paginated(
    db: AsyncSession, user_id: str, page: int = 1, per_page: int = 20
) -> tuple[list[AnalysisReport], int]:
    offset = (page - 1) * per_page
    count_result = await db.execute(
        select(func.count())
        .select_from(AnalysisReport)
        .where(AnalysisReport.user_id == user_id)
    )
    total = count_result.scalar_one()
    result = await db.execute(
        select(AnalysisReport)
        .where(AnalysisReport.user_id == user_id)
        .order_by(AnalysisReport.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all(), total


# ── CORE ANALYSIS PIPELINE ───────────────────────────────────────────────────
async def run_analysis(
    db: AsyncSession, report_id: str, username: str, user: User
) -> None:
    """
    Full analysis pipeline. Runs as a FastAPI BackgroundTask.
    Steps:
      1. Fetch real Instagram profile via quick_profile_check (no auth needed)
      2. Fetch sampled followers via instaloader (dummy account)
      3. Enrich each follower with NLP (language, country, bot score)
      4. Aggregate all metrics
      5. Generate AI summary
      6. Save completed report
    """
    log.info("analysis_start", report_id=report_id, username=username)

    # Mark as processing
    result = await db.execute(
        select(AnalysisReport).where(AnalysisReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        log.error("report_not_found", report_id=report_id)
        return

    report.status = "processing"
    await db.commit()

    try:
        # 1. Fetch real profile (tries unauthenticated endpoint first, then instaloader)
        profile_data = await quick_profile_check(username)
        if not profile_data:
            raise ValueError(f"Profile @{username} not found.")

        if profile_data.get("is_private"):
            raise ValueError(
                f"@{username} is a private account. "
                "InstaIQ only analyzes public accounts."
            )

        # Persist profile in cache
        await _upsert_profile(db, profile_data)

        # 2. Determine sample size by plan
        limit = (
            settings.MAX_FOLLOWERS_FREE
            if user.plan == "free"
            else settings.MAX_FOLLOWERS_PRO
        )
        limit = min(limit, profile_data.get("followers_count", 0))

        # 3. Fetch real followers via instaloader
        raw_followers = await fetch_followers_sample(username, limit=limit)
        log.info("followers_scraped", count=len(raw_followers))

        # 4. NLP enrichment (language, country, bot score)
        processed = _enrich_followers(raw_followers, username)

        # 5. Persist followers
        await _bulk_upsert_followers(db, processed)

        # 6. Aggregate all analytics
        analytics = aggregate_followers(processed)

        # 7. Estimate engagement score from profile data
        engagement_score = _estimate_engagement(profile_data)

        # 8. AI summary (falls back gracefully if OpenAI key not set)
        ai_summary, ai_insights = await _generate_ai_summary(
            username, profile_data, analytics
        )

        # 9. Save completed report
        report.status = "complete"
        report.sample_size = len(processed)
        report.quality_score = analytics.get("quality_score")
        report.engagement_score = engagement_score
        report.bot_probability = analytics.get("bot_probability")
        report.inactive_pct = analytics.get("inactive_pct")
        report.verified_pct = analytics.get("verified_pct")
        report.country_distribution = analytics.get("country_distribution")
        report.language_distribution = analytics.get("language_distribution")
        report.bio_keywords = analytics.get("bio_keywords")
        report.bot_breakdown = analytics.get("bot_breakdown")
        report.ai_summary = ai_summary
        report.ai_insights = ai_insights
        report.completed_at = datetime.now(UTC)
        await db.commit()

        log.info("analysis_complete", report_id=report_id, username=username)

    except Exception as e:
        log.error("analysis_failed", report_id=report_id, error=str(e))
        # Re-fetch report object (session may have been rolled back)
        try:
            result = await db.execute(
                select(AnalysisReport).where(AnalysisReport.id == report_id)
            )
            report = result.scalar_one_or_none()
            if report:
                report.status = "failed"
                report.error_message = str(e)
                await db.commit()
        except Exception as inner:
            log.error("failed_to_save_error_state", error=str(inner))


# ── HELPERS ──────────────────────────────────────────────────────────────────
def _enrich_followers(raw: list[dict], source: str) -> list[dict]:
    """Run NLP enrichment on raw scraped followers."""
    enriched = []
    for f in raw:
        bio = f.get("bio", "") or ""
        full_name = f.get("full_name", "") or ""
        # Detect language from bio + full_name combined
        combined_text = f"{bio} {full_name}".strip()
        lang = detect_language(combined_text)
        # Country: bio + language + full_name (script detection)
        country, confidence = detect_country(bio, lang, full_name)
        bot_score = compute_bot_score(f)
        enriched.append({
            **f,
            "source_username": source,
            "detected_language": lang,
            "detected_country": country,
            "country_confidence": confidence,
            "bot_score": bot_score,
        })
    return enriched


async def _bulk_upsert_followers(db: AsyncSession, followers: list[dict]) -> None:
    for f in followers:
        result = await db.execute(
            select(Follower).where(
                Follower.source_username == f["source_username"],
                Follower.follower_username == f["username"],
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.bot_score = f["bot_score"]
            existing.detected_language = f.get("detected_language")
            existing.detected_country = f.get("detected_country")
            existing.country_confidence = f.get("country_confidence", 0.0)
        else:
            db.add(
                Follower(
                    id=str(uuid.uuid4()),
                    source_username=f["source_username"],
                    follower_username=f["username"],
                    follower_full_name=f.get("full_name"),
                    follower_bio=f.get("bio"),
                    is_verified=f.get("is_verified", False),
                    is_private=f.get("is_private", False),
                    followers_count=f.get("followers_count", 0),
                    following_count=f.get("following_count", 0),
                    post_count=f.get("post_count", 0),
                    detected_language=f.get("detected_language"),
                    detected_country=f.get("detected_country"),
                    country_confidence=f.get("country_confidence", 0.0),
                    bot_score=f.get("bot_score", 0.0),
                )
            )
    await db.commit()


async def _upsert_profile(db: AsyncSession, data: dict) -> None:
    from datetime import timedelta

    result = await db.execute(
        select(InstagramProfile).where(
            InstagramProfile.username == data["username"]
        )
    )
    profile = result.scalar_one_or_none()
    expires = datetime.now(UTC) + timedelta(hours=6)

    if profile:
        for k, v in data.items():
            if hasattr(profile, k):
                setattr(profile, k, v)
        profile.fetched_at = datetime.now(UTC)
        profile.cache_expires_at = expires
    else:
        allowed = {
            c.key for c in InstagramProfile.__table__.columns
        }
        profile = InstagramProfile(
            id=str(uuid.uuid4()),
            cache_expires_at=expires,
            **{k: v for k, v in data.items() if k in allowed},
        )
        db.add(profile)
    await db.commit()


def _estimate_engagement(profile_data: dict) -> float:
    """Rough engagement score heuristic (0-10)."""
    import math
    followers = max(profile_data.get("followers_count", 1), 1)
    posts = profile_data.get("post_count", 0)
    if posts == 0:
        return 0.0
    base = max(0.5, 8.0 - math.log10(followers) * 0.9)
    return round(min(base, 10.0), 1)


async def _generate_ai_summary(
    username: str, profile: dict, analytics: dict
) -> tuple[str, list[str]]:
    """Generate AI summary via OpenAI. Falls back to rule-based if key not set."""
    try:
        if not settings.OPENAI_API_KEY:
            raise ValueError("No OpenAI key configured.")

        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        country_dist = analytics.get("country_distribution") or []
        top_country = country_dist[0].get("name", "Unknown") if country_dist else "Unknown"
        lang_dist = analytics.get("language_distribution") or []
        top_lang = lang_dist[0].get("lang", "Unknown") if lang_dist else "Unknown"
        bot_pct = (analytics.get("bot_breakdown") or {}).get("bot_pct", 0)
        quality = analytics.get("quality_score", 0)

        prompt = f"""You are an Instagram audience analyst. Analyze @{username}.

Data:
- Followers: {profile.get('followers_count', 0):,}
- Quality score: {quality}/100
- Bot rate: {bot_pct}%
- Top country: {top_country}
- Primary language: {top_lang}
- Inactive %: {analytics.get('inactive_pct', 0)}%
- Sample size: {analytics.get('sample_size', 0)} followers analyzed

Write a 2-sentence audience summary and 4 actionable insights.
Respond only in JSON: {{"summary": "...", "insights": ["...", "...", "...", "..."]}}"""

        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=400,
        )
        import json
        data = json.loads(resp.choices[0].message.content)
        return data.get("summary", ""), data.get("insights", [])

    except Exception as e:
        log.warning("ai_summary_fallback", error=str(e))

        # Rule-based fallback
        country_dist = analytics.get("country_distribution") or []
        top_country = country_dist[0].get("name", "various countries") if country_dist else "various countries"
        bot_pct = (analytics.get("bot_breakdown") or {}).get("bot_pct", 0)
        quality = analytics.get("quality_score", 0)
        inactive = analytics.get("inactive_pct", 0)
        sample = analytics.get("sample_size", 0)

        summary = (
            f"@{username} has an audience quality score of {quality}/100 "
            f"with the largest segment based in {top_country}. "
            f"Analysis is based on a sample of {sample} real followers."
        )
        insights = [
            f"Bot rate of {bot_pct}% is {'above' if bot_pct > 15 else 'below'} the platform average of 15%.",
            f"Inactive follower rate of {inactive}% suggests potential audience churn.",
            "Compare with similar accounts to benchmark audience quality.",
            "Focus content on the primary language demographic for maximum engagement.",
        ]
        return summary, insights