from fastapi import APIRouter, Depends, BackgroundTasks, Query, Path, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, get_db
from app.db.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut,
    AnalyzeRequest, AnalysisStatusResponse, AnalysisReportOut, PaginatedReports,
    CompareRequest, CompareResult, UsageOut, MessageResponse,
)
from app.services.auth import (
    create_user, authenticate_user, create_access_token, get_current_user
)
from app.services.analysis import (
    check_and_increment_usage, create_pending_report,
    get_report, get_reports_paginated, get_usage, run_analysis,
)

router = APIRouter()


# ═══════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════
@router.post("/auth/register", response_model=TokenResponse, tags=["Auth"])
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user and return an access token."""
    user = await create_user(db, body.email, body.password, body.full_name)
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return an access token."""
    user = await authenticate_user(db, body.email, body.password)
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/auth/me", response_model=UserOut, tags=["Auth"])
async def get_me(user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserOut.model_validate(user)


# ═══════════════════════════════════════════════════════
# ANALYZE
# ═══════════════════════════════════════════════════════
@router.post("/analyze", response_model=AnalysisStatusResponse, tags=["Analysis"])
async def analyze(
    body: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Start an audience analysis for a public Instagram username.
    Returns a report_id to poll for results.
    Rate-limited by plan tier.
    """
    await check_and_increment_usage(db, user)
    report = await create_pending_report(db, user.id, body.username)
    background_tasks.add_task(run_analysis, db, report.id, body.username, user)
    return AnalysisStatusResponse(
        report_id=report.id,
        username=body.username,
        status="processing",
        message=f"Analysis started for @{body.username}. Poll /reports/{report.id} for results.",
        estimated_seconds=45 if user.plan == "free" else 120,
    )


@router.get("/reports/{report_id}", response_model=AnalysisReportOut, tags=["Analysis"])
async def get_analysis_report(
    report_id: str = Path(..., description="Report ID returned from POST /analyze"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch a specific analysis report. Poll until status is 'complete' or 'failed'."""
    report = await get_report(db, report_id, user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return AnalysisReportOut.model_validate(report)


@router.get("/insights/{username}", response_model=AnalysisReportOut, tags=["Analysis"])
async def get_latest_insights(
    username: str = Path(..., description="Instagram username"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return the most recent completed analysis for a username if cached."""
    from sqlalchemy import select
    from app.db.models import AnalysisReport
    result = await db.execute(
        select(AnalysisReport)
        .where(
            AnalysisReport.user_id == user.id,
            AnalysisReport.username == username.lstrip("@").lower(),
            AnalysisReport.status == "complete",
        )
        .order_by(AnalysisReport.created_at.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail=f"No completed analysis found for @{username}.")
    return AnalysisReportOut.model_validate(report)


# ═══════════════════════════════════════════════════════
# REPORTS LIST
# ═══════════════════════════════════════════════════════
@router.get("/reports", response_model=PaginatedReports, tags=["Reports"])
async def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all analysis reports for the authenticated user."""
    items, total = await get_reports_paginated(db, user.id, page, per_page)
    pages = (total + per_page - 1) // per_page
    return PaginatedReports(
        items=[AnalysisReportOut.model_validate(r) for r in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.delete("/reports/{report_id}", response_model=MessageResponse, tags=["Reports"])
async def delete_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a report."""
    report = await get_report(db, report_id, user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    await db.delete(report)
    await db.commit()
    return MessageResponse(message="Report deleted.")


# ═══════════════════════════════════════════════════════
# COMPARE
# ═══════════════════════════════════════════════════════
@router.post("/compare", response_model=CompareResult, tags=["Compare"])
async def compare_accounts(
    body: CompareRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Compare audience overlap between two public Instagram accounts.
    Pro feature. Counts as 2 analyses.
    """
    if user.plan not in ("pro", "enterprise"):
        raise HTTPException(
            status_code=402,
            detail="Account comparison requires a Pro plan. Upgrade at instaiq.app/upgrade."
        )

    # In production: fetch both follower samples and compute set intersection.
    # Here we return the contract shape with placeholder logic.
    return CompareResult(
        username_a=body.username_a,
        username_b=body.username_b,
        total_a=0,
        total_b=0,
        mutual_count=0,
        overlap_pct_a=0.0,
        overlap_pct_b=0.0,
        top_mutual=[],
        shared_interests=[],
        affinity_score=0.0,
    )


# ═══════════════════════════════════════════════════════
# USAGE
# ═══════════════════════════════════════════════════════
@router.get("/usage", response_model=UsageOut, tags=["Usage"])
async def get_my_usage(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return today's usage stats for the authenticated user."""
    return UsageOut(**await get_usage(db, user))


# ═══════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════
@router.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "instaiq-api"}
