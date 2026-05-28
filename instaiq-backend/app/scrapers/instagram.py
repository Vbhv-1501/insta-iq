"""
Real Instagram data scraper using instaloader.
Uses a dummy Instagram account to fetch public profile data and follower samples.
Only accesses public accounts. Respects rate limits.
"""
import asyncio
import os
import time
import random
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

import structlog
import instaloader

log = structlog.get_logger(__name__)

_executor = ThreadPoolExecutor(max_workers=2)
_loader: Optional[instaloader.Instaloader] = None
_session_file = Path("session/ig_session")


def _get_loader() -> instaloader.Instaloader:
    global _loader
    if _loader is not None:
        return _loader

    username = os.getenv("INSTAGRAM_USERNAME", "")
    password = os.getenv("INSTAGRAM_PASSWORD", "")

    if not username or not password:
        raise RuntimeError(
            "INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD must be set in .env. "
            "Create a free dummy Instagram account and add its credentials."
        )

    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        quiet=True,
        sleep=True,
        max_connection_attempts=3,
    )

    _session_file.parent.mkdir(exist_ok=True)
    try:
        L.load_session_from_file(username, str(_session_file))
        log.info("ig_session_loaded_from_file", username=username)
    except FileNotFoundError:
        log.info("ig_logging_in", username=username)
        try:
            L.login(username, password)
            L.save_session_to_file(str(_session_file))
            log.info("ig_login_success", username=username)
        except instaloader.exceptions.BadCredentialsException:
            raise RuntimeError("Instagram login failed. Check INSTAGRAM_USERNAME / INSTAGRAM_PASSWORD.")
        except instaloader.exceptions.TwoFactorAuthRequiredException:
            raise RuntimeError("Dummy account has 2FA enabled. Disable it on Instagram and retry.")
        except Exception as e:
            raise RuntimeError(f"Instagram login error: {e}")

    _loader = L
    return L


async def fetch_profile(username: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_profile_sync, username)


async def fetch_followers_sample(username: str, limit: int = 200) -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_followers_sync, username, limit)


def _fetch_profile_sync(username: str) -> dict:
    L = _get_loader()
    try:
        profile = instaloader.Profile.from_username(L.context, username)
        if profile.is_private:
            raise ValueError(f"@{username} is a private account. InstaIQ only analyzes public accounts.")
        return {
            "username": profile.username,
            "full_name": profile.full_name or "",
            "bio": profile.biography or "",
            "followers_count": profile.followers,
            "following_count": profile.followees,
            "post_count": profile.mediacount,
            "is_verified": profile.is_verified,
            "is_private": profile.is_private,
            "profile_pic_url": profile.profile_pic_url or "",
            "external_url": profile.external_url or "",
            "category": profile.business_category_name or "",
        }
    except instaloader.exceptions.ProfileNotExistsException:
        raise ValueError(f"Instagram account @{username} does not exist.")
    except instaloader.exceptions.LoginRequiredException:
        raise ValueError(f"Cannot view @{username}. Account may be private or restricted.")
    except instaloader.exceptions.ConnectionException as e:
        raise RuntimeError(f"Instagram connection error: {e}")


def _fetch_followers_sync(username: str, limit: int) -> list:
    L = _get_loader()
    followers = []
    try:
        profile = instaloader.Profile.from_username(L.context, username)
        if profile.is_private:
            raise ValueError(f"@{username} is private.")

        for follower in profile.get_followers():
            if len(followers) >= limit:
                break
            time.sleep(random.uniform(0.4, 0.9))
            try:
                followers.append({
                    "username": follower.username,
                    "full_name": follower.full_name or "",
                    "bio": follower.biography or "",
                    "is_verified": follower.is_verified,
                    "is_private": follower.is_private,
                    "followers_count": follower.followers,
                    "following_count": follower.followees,
                    "post_count": follower.mediacount,
                })
            except Exception as e:
                log.debug("follower_skip", error=str(e))
                continue

        log.info("followers_done", username=username, count=len(followers))
        return followers

    except instaloader.exceptions.QueryReturnedBadRequestException:
        log.warning("rate_limit_hit", username=username, partial=len(followers))
        return followers
    except Exception as e:
        log.error("followers_error", username=username, error=str(e))
        if followers:
            return followers
        raise


async def quick_profile_check(username: str) -> dict:
    """Unauthenticated fast check using Instagram public JSON endpoint."""
    import httpx
    url = f"https://i.instagram.com/api/v1/users/web_profile_info/?username={username}"
    headers = {
        "x-ig-app-id": "936619743392459",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.instagram.com/",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                user = data.get("data", {}).get("user", {})
                if user:
                    return {
                        "username": username,
                        "full_name": user.get("full_name", ""),
                        "bio": user.get("biography", ""),
                        "followers_count": user.get("edge_followed_by", {}).get("count", 0),
                        "following_count": user.get("edge_follow", {}).get("count", 0),
                        "post_count": user.get("edge_owner_to_timeline_media", {}).get("count", 0),
                        "is_verified": user.get("is_verified", False),
                        "is_private": user.get("is_private", False),
                        "profile_pic_url": user.get("profile_pic_url_hd", ""),
                        "external_url": user.get("external_url", ""),
                        "category": user.get("category_name", ""),
                    }
    except Exception as e:
        log.debug("quick_check_failed", error=str(e))
    return await fetch_profile(username)
