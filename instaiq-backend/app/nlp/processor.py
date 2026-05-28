"""
NLP pipeline for follower bio analysis.
Language detection via langdetect + fastText.
Country inference from language, explicit location mentions, geotags.
Bio keyword extraction using frequency analysis.
"""
import re
import unicodedata
from collections import Counter
from typing import Optional
import structlog

log = structlog.get_logger(__name__)

# ──────────────── LANGUAGE DETECTION ────────────────
try:
    from langdetect import detect, detect_langs, LangDetectException
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    log.warning("langdetect_not_available")


LANG_TO_COUNTRY_HINTS: dict[str, list[str]] = {
    "hi": ["India"],
    "bn": ["India", "Bangladesh"],
    "ta": ["India", "Sri Lanka"],
    "te": ["India"],
    "mr": ["India"],
    "gu": ["India"],
    "pa": ["India", "Pakistan"],
    "ur": ["Pakistan"],
    "ar": ["Saudi Arabia", "UAE", "Egypt", "Jordan"],
    "fa": ["Iran"],
    "tr": ["Turkey"],
    "id": ["Indonesia"],
    "ms": ["Malaysia"],
    "tl": ["Philippines"],
    "vi": ["Vietnam"],
    "th": ["Thailand"],
    "ko": ["South Korea"],
    "ja": ["Japan"],
    "zh-cn": ["China"],
    "zh-tw": ["Taiwan"],
    "pt": ["Brazil", "Portugal"],
    "es": ["Mexico", "Spain", "Colombia", "Argentina"],
    "fr": ["France", "Belgium", "Canada"],
    "de": ["Germany", "Austria", "Switzerland"],
    "ru": ["Russia"],
    "uk": ["Ukraine"],
    "pl": ["Poland"],
    "it": ["Italy"],
    "nl": ["Netherlands"],
    "sv": ["Sweden"],
    "no": ["Norway"],
    "da": ["Denmark"],
    "fi": ["Finland"],
}

# Explicit country strings often appearing in bios
COUNTRY_KEYWORDS: dict[str, str] = {
    "india": "India", "delhi": "India", "mumbai": "India", "bangalore": "India",
    "chennai": "India", "hyderabad": "India", "kolkata": "India",
    "usa": "USA", "united states": "USA", "new york": "USA", "california": "USA",
    "los angeles": "USA", "chicago": "USA", "houston": "USA",
    "uk": "UK", "london": "UK", "manchester": "UK", "england": "UK",
    "uae": "UAE", "dubai": "UAE", "abu dhabi": "UAE",
    "canada": "Canada", "toronto": "Canada", "vancouver": "Canada",
    "australia": "Australia", "sydney": "Australia", "melbourne": "Australia",
    "germany": "Germany", "berlin": "Germany", "munich": "Germany",
    "france": "France", "paris": "France",
    "brazil": "Brazil", "sao paulo": "Brazil", "rio de janeiro": "Brazil",
    "pakistan": "Pakistan", "karachi": "Pakistan", "lahore": "Pakistan",
    "bangladesh": "Bangladesh", "dhaka": "Bangladesh",
    "nigeria": "Nigeria", "lagos": "Nigeria",
    "indonesia": "Indonesia", "jakarta": "Indonesia",
    "turkey": "Turkey", "istanbul": "Turkey",
    "egypt": "Egypt", "cairo": "Egypt",
    "japan": "Japan", "tokyo": "Japan",
    "south korea": "South Korea", "korea": "South Korea", "seoul": "South Korea",
    "china": "China", "beijing": "China", "shanghai": "China",
    "spain": "Spain", "madrid": "Spain", "barcelona": "Spain",
    "italy": "Italy", "rome": "Italy", "milan": "Italy",
    "netherlands": "Netherlands", "amsterdam": "Netherlands",
    "russia": "Russia", "moscow": "Russia",
    "saudi arabia": "Saudi Arabia", "riyadh": "Saudi Arabia",
}


def detect_language(text: str) -> Optional[str]:
    """Detect primary language of text. Returns ISO 639-1 code or None."""
    if not text or len(text.strip()) < 8:
        return None
    if not LANGDETECT_AVAILABLE:
        return None
    try:
        cleaned = _clean_text_for_lang(text)
        if len(cleaned) < 5:
            return None
        return detect(cleaned)
    except Exception:
        return None


def detect_country(bio: str, language: Optional[str] = None) -> tuple[Optional[str], float]:
    """
    Infer likely country from bio text and detected language.
    Returns (country_name, confidence_0_to_1).
    ONLY uses evidence from bio text. NO random guessing.
    """
    if not bio and not language:
        return None, 0.0

    bio_lower = bio.lower() if bio else ""

    # 1. Check for explicit country/city keywords in bio (highest confidence)
    for kw, country in COUNTRY_KEYWORDS.items():
        if kw in bio_lower:
            return country, 0.90

    # 2. Check emoji flags in bio
    flag_country = _detect_flag_emoji(bio)
    if flag_country:
        return flag_country, 0.88

    # 3. Infer from language (lower confidence since many languages span multiple countries)
    if language and language in LANG_TO_COUNTRY_HINTS:
        hints = LANG_TO_COUNTRY_HINTS[language]
        if len(hints) == 1:
            return hints[0], 0.60
        else:
            return hints[0], 0.40  # ambiguous multilingual case

    return None, 0.0


FLAG_EMOJI_MAP: dict[str, str] = {
    "🇮🇳": "India", "🇺🇸": "USA", "🇬🇧": "UK", "🇦🇪": "UAE",
    "🇨🇦": "Canada", "🇦🇺": "Australia", "🇩🇪": "Germany", "🇫🇷": "France",
    "🇧🇷": "Brazil", "🇵🇰": "Pakistan", "🇧🇩": "Bangladesh", "🇳🇬": "Nigeria",
    "🇮🇩": "Indonesia", "🇹🇷": "Turkey", "🇪🇬": "Egypt", "🇯🇵": "Japan",
    "🇰🇷": "South Korea", "🇨🇳": "China", "🇪🇸": "Spain", "🇮🇹": "Italy",
    "🇳🇱": "Netherlands", "🇷🇺": "Russia", "🇸🇦": "Saudi Arabia",
    "🇿🇦": "South Africa", "🇵🇭": "Philippines", "🇲🇾": "Malaysia",
}


def _detect_flag_emoji(text: str) -> Optional[str]:
    for flag, country in FLAG_EMOJI_MAP.items():
        if flag in text:
            return country
    return None


def _clean_text_for_lang(text: str) -> str:
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#\w+", "", text)
    text = re.sub(r"[\U00010000-\U0010ffff]", "", text, flags=re.UNICODE)  # strip emoji
    return text.strip()


# ──────────────── BOT DETECTION ────────────────
def compute_bot_score(follower: dict) -> float:
    """
    Heuristic bot score for a follower. Returns 0.0 (real) to 1.0 (bot).
    Uses multiple signals, no single signal is definitive.
    """
    score = 0.0
    signals = 0

    username = follower.get("username", "")
    bio = follower.get("bio", "") or ""
    followers = follower.get("followers_count", 0)
    following = follower.get("following_count", 0)
    posts = follower.get("post_count", 0)

    # Signal 1: Username looks auto-generated (digits at end, random chars)
    if re.search(r"\d{5,}$", username):
        score += 0.35
    if re.search(r"^[a-z]+\d{3,}[a-z]*$", username):
        score += 0.20
    signals += 1

    # Signal 2: Empty bio
    if not bio.strip():
        score += 0.10
    signals += 1

    # Signal 3: 0 posts
    if posts == 0:
        score += 0.25
    elif posts <= 2:
        score += 0.10
    signals += 1

    # Signal 4: Very high following / very low followers ratio
    if following > 1000 and followers < 50:
        score += 0.35
    elif following > 5000 and followers < 200:
        score += 0.40
    signals += 1

    # Signal 5: Following > 7500 (aggressive following behavior)
    if following > 7500:
        score += 0.20
    signals += 1

    # Normalize to 0-1
    return min(score, 1.0)


def classify_follower(bot_score: float) -> str:
    """Classify follower as real/suspicious/bot."""
    if bot_score >= 0.55:
        return "bot"
    if bot_score >= 0.28:
        return "suspicious"
    return "real"


# ──────────────── BIO KEYWORD EXTRACTION ────────────────
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "i", "my", "me",
    "i'm", "just", "be", "do", "it", "this", "that", "all", "not", "have",
    "has", "had", "will", "would", "could", "should", "also", "your", "our",
    "their", "its", "we", "you", "he", "she", "they", "what", "who", "how",
    "when", "where", "am", "been", "into", "up", "out", "if", "so", "no",
    "can", "get", "got", "let", "us", "new", "here", "there", "about",
    "life", "love", "follow", "dm", "link", "bio",
}

INTEREST_KEYWORDS = {
    "creator", "artist", "photographer", "filmmaker", "designer", "developer",
    "engineer", "entrepreneur", "ceo", "founder", "writer", "author", "blogger",
    "influencer", "model", "actor", "actress", "singer", "musician", "dancer",
    "chef", "foodie", "fitness", "gym", "yoga", "travel", "fashion", "beauty",
    "makeup", "skincare", "health", "wellness", "sports", "football", "cricket",
    "basketball", "gaming", "streamer", "tech", "ai", "crypto", "investor",
    "student", "teacher", "doctor", "lawyer", "marketer", "business", "startup",
    "coach", "mentor", "consultant", "freelancer", "remote", "music", "art",
    "photography", "video", "content", "brand", "digital", "media", "news",
    "politics", "science", "research", "education", "book", "reading",
}


def extract_bio_keywords(bios: list[str], top_n: int = 30) -> list[dict]:
    """Extract top keywords/topics from a list of bios."""
    counter: Counter = Counter()

    for bio in bios:
        if not bio:
            continue
        tokens = _tokenize_bio(bio)
        for tok in tokens:
            if tok in INTEREST_KEYWORDS or (len(tok) > 3 and tok not in STOPWORDS):
                counter[tok] += 1

    return [{"text": word.title(), "count": count}
            for word, count in counter.most_common(top_n)]


def _tokenize_bio(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#(\w+)", r" \1 ", text)      # keep hashtag text
    text = re.sub(r"[\U00010000-\U0010ffff]", " ", text)  # remove emoji
    text = re.sub(r"[^\w\s'-]", " ", text)
    tokens = text.split()
    return [t.strip("'-") for t in tokens if len(t) > 2]


# ──────────────── AGGREGATE ANALYTICS ────────────────
def aggregate_followers(followers: list[dict]) -> dict:
    """
    Compute all analytics from a list of processed followers.
    Returns a structured analytics dict.
    """
    total = len(followers)
    if total == 0:
        return {}

    country_counter: Counter = Counter()
    lang_counter: Counter = Counter()
    bot_scores: list[float] = []
    bios: list[str] = []

    real = suspicious = bot = inactive = verified = 0

    for f in followers:
        lang = f.get("detected_language")
        country = f.get("detected_country")
        bot_score = f.get("bot_score", 0.0)
        classification = classify_follower(bot_score)

        if lang:
            lang_counter[lang] += 1
        if country:
            country_counter[country] += 1

        bot_scores.append(bot_score)

        if classification == "real":
            real += 1
        elif classification == "suspicious":
            suspicious += 1
        else:
            bot += 1

        if f.get("post_count", 0) == 0 and not f.get("is_verified", False):
            inactive += 1
        if f.get("is_verified", False):
            verified += 1

        if f.get("bio"):
            bios.append(f["bio"])

    # Country distribution
    COLORS = ["#0284C7", "#0EA5E9", "#38BDF8", "#7DD3FC", "#BAE6FD", "#E0F2FE"]
    total_country = sum(country_counter.values()) or 1
    country_distribution = [
        {"name": c, "value": round(n / total_country * 100, 1), "color": COLORS[i % len(COLORS)]}
        for i, (c, n) in enumerate(country_counter.most_common(6))
    ]

    # Language distribution
    LANG_NAMES = {"en": "English", "hi": "Hindi", "ar": "Arabic", "es": "Spanish",
                  "fr": "French", "pt": "Portuguese", "de": "German", "ru": "Russian",
                  "id": "Indonesian", "tr": "Turkish", "ja": "Japanese", "ko": "Korean",
                  "zh-cn": "Chinese", "ur": "Urdu", "bn": "Bengali", "tl": "Filipino",
                  "it": "Italian", "nl": "Dutch", "vi": "Vietnamese", "th": "Thai"}
    total_lang = sum(lang_counter.values()) or 1
    language_distribution = [
        {"lang": LANG_NAMES.get(l, l.upper()), "pct": round(n / total_lang * 100, 1)}
        for l, n in lang_counter.most_common(8)
    ]

    # Bot breakdown
    bot_breakdown = {
        "real_pct": round(real / total * 100, 1),
        "suspicious_pct": round(suspicious / total * 100, 1),
        "bot_pct": round(bot / total * 100, 1),
        "bot_count_estimate": bot,
        "suspicious_count_estimate": suspicious,
    }

    # Quality score: composite of real_pct + engagement signals
    avg_bot = sum(bot_scores) / len(bot_scores) if bot_scores else 0.5
    quality_score = round((1 - avg_bot) * 75 + (verified / total) * 25, 1)

    # Bio keywords
    bio_keywords = extract_bio_keywords(bios)

    return {
        "country_distribution": country_distribution,
        "language_distribution": language_distribution,
        "bot_breakdown": bot_breakdown,
        "bio_keywords": bio_keywords,
        "quality_score": quality_score,
        "bot_probability": round(bot / total, 3),
        "inactive_pct": round(inactive / total * 100, 1),
        "verified_pct": round(verified / total * 100, 1),
    }
