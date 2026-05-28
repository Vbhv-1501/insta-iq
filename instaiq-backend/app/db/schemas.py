from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Any
from datetime import datetime


# ──────────────── AUTH ────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    plan: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────── ANALYSIS ────────────────
class AnalyzeRequest(BaseModel):
    username: str = Field(min_length=1, max_length=60)

    @field_validator("username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        return v.lstrip("@").strip().lower()


class AnalysisStatusResponse(BaseModel):
    report_id: str
    username: str
    status: str
    message: str
    estimated_seconds: Optional[int] = None


class CountryEntry(BaseModel):
    name: str
    value: float
    color: str


class LanguageEntry(BaseModel):
    lang: str
    pct: float


class BotBreakdown(BaseModel):
    real_pct: float
    suspicious_pct: float
    bot_pct: float
    bot_count_estimate: int
    suspicious_count_estimate: int


class BioBioEntry(BaseModel):
    text: str
    count: int


class GrowthPoint(BaseModel):
    month: str
    followers: int


class EngagementPoint(BaseModel):
    day: str
    rate: float


class AnalysisReportOut(BaseModel):
    id: str
    username: str
    status: str
    sample_size: int
    quality_score: Optional[float]
    engagement_score: Optional[float]
    bot_probability: Optional[float]
    inactive_pct: Optional[float]
    verified_pct: Optional[float]
    country_distribution: Optional[list[CountryEntry]]
    language_distribution: Optional[list[LanguageEntry]]
    bio_keywords: Optional[list[BioBioEntry]]
    follower_growth: Optional[list[GrowthPoint]]
    bot_breakdown: Optional[BotBreakdown]
    engagement_trend: Optional[list[EngagementPoint]]
    ai_summary: Optional[str]
    ai_insights: Optional[list[str]]
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ──────────────── COMPARE ────────────────
class CompareRequest(BaseModel):
    username_a: str = Field(min_length=1, max_length=60)
    username_b: str = Field(min_length=1, max_length=60)

    @field_validator("username_a", "username_b")
    @classmethod
    def clean(cls, v: str) -> str:
        return v.lstrip("@").strip().lower()


class OverlapAccount(BaseModel):
    username: str
    is_verified: bool
    followers_count: int


class CompareResult(BaseModel):
    username_a: str
    username_b: str
    total_a: int
    total_b: int
    mutual_count: int
    overlap_pct_a: float
    overlap_pct_b: float
    top_mutual: list[OverlapAccount]
    shared_interests: list[str]
    affinity_score: float    # 0-100


# ──────────────── USAGE ────────────────
class UsageOut(BaseModel):
    plan: str
    analyses_today: int
    daily_limit: int
    remaining: int


# ──────────────── PAGINATION ────────────────
class PaginatedReports(BaseModel):
    items: list[AnalysisReportOut]
    total: int
    page: int
    per_page: int
    pages: int


# ──────────────── GENERIC ────────────────
class MessageResponse(BaseModel):
    message: str
    data: Optional[Any] = None
