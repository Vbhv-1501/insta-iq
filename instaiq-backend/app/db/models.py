from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey, Index
from datetime import datetime, UTC
from typing import Optional
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)           # UUID
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(128))
    full_name: Mapped[Optional[str]] = mapped_column(String(120))
    plan: Mapped[str] = mapped_column(String(20), default="free")            # free | pro | enterprise
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    analyses = relationship("AnalysisReport", back_populates="user", lazy="dynamic")
    usage_records = relationship("UsageRecord", back_populates="user", lazy="dynamic")


class InstagramProfile(Base):
    """Cached Instagram profile metadata."""
    __tablename__ = "instagram_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(200))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    followers_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_pic_url: Mapped[Optional[str]] = mapped_column(Text)
    external_url: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    raw_data: Mapped[Optional[dict]] = mapped_column(JSON)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    cache_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    __table_args__ = (Index("ix_profiles_username_lower", "username"),)


class Follower(Base):
    """Sampled follower relationships."""
    __tablename__ = "followers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_username: Mapped[str] = mapped_column(String(60), index=True)
    follower_username: Mapped[str] = mapped_column(String(60), index=True)
    follower_bio: Mapped[Optional[str]] = mapped_column(Text)
    follower_full_name: Mapped[Optional[str]] = mapped_column(String(200))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    followers_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    detected_language: Mapped[Optional[str]] = mapped_column(String(10))
    detected_country: Mapped[Optional[str]] = mapped_column(String(60))
    country_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    bot_score: Mapped[float] = mapped_column(Float, default=0.0)      # 0-1, higher = more suspicious
    sampled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    __table_args__ = (
        Index("ix_followers_source", "source_username"),
        Index("ix_followers_pair", "source_username", "follower_username", unique=True),
    )


class AnalysisReport(Base):
    """Full audience analysis report per username."""
    __tablename__ = "analysis_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    username: Mapped[str] = mapped_column(String(60), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|processing|complete|failed
    sample_size: Mapped[int] = mapped_column(Integer, default=0)

    # Computed metrics
    quality_score: Mapped[Optional[float]] = mapped_column(Float)
    engagement_score: Mapped[Optional[float]] = mapped_column(Float)
    bot_probability: Mapped[Optional[float]] = mapped_column(Float)
    inactive_pct: Mapped[Optional[float]] = mapped_column(Float)
    verified_pct: Mapped[Optional[float]] = mapped_column(Float)

    # Rich analytics blobs
    country_distribution: Mapped[Optional[dict]] = mapped_column(JSON)
    language_distribution: Mapped[Optional[dict]] = mapped_column(JSON)
    bio_keywords: Mapped[Optional[dict]] = mapped_column(JSON)
    follower_growth: Mapped[Optional[dict]] = mapped_column(JSON)
    bot_breakdown: Mapped[Optional[dict]] = mapped_column(JSON)
    engagement_trend: Mapped[Optional[dict]] = mapped_column(JSON)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    ai_insights: Mapped[Optional[list]] = mapped_column(JSON)

    error_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    user = relationship("User", back_populates="analyses")


class UsageRecord(Base):
    """Daily usage tracking per user."""
    __tablename__ = "usage_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    date: Mapped[str] = mapped_column(String(10), index=True)            # YYYY-MM-DD
    analyses_count: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", back_populates="usage_records")

    __table_args__ = (Index("ix_usage_user_date", "user_id", "date", unique=True),)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
