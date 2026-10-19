import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const localWindows = new Map();

const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

const BASE_IMAGE_BAN_SECONDS = 5 * 60;
const MAX_BAN_ESCALATIONS = 20;
const MAX_IMAGE_BAN_SECONDS = 24 * 60 * 60;
const IMAGE_REPEAT_LIMIT = 5;
const IMAGE_REPEAT_WINDOW_SECONDS = 24 * 60 * 60;
const imageRepeatWindows = new Map();
const localBans = new Map();
const BAN_AND_COUNT_IMAGE_SCRIPT = `
local now = tonumber(ARGV[1])
local repeatLimit = tonumber(ARGV[2])
local repeatWindow = tonumber(ARGV[3])
local baseBanSeconds = tonumber(ARGV[4])
local maxEscalations = tonumber(ARGV[5])
local maxBanSeconds = tonumber(ARGV[6])
local activeBanUntil = tonumber(redis.call("GET", KEYS[1]) or "0")

if activeBanUntil > now then
  return { 0, activeBanUntil - now, 0 }
end

local count = redis.call("INCR", KEYS[2])
if count == 1 then
  redis.call("EXPIRE", KEYS[2], repeatWindow)
end

if count <= repeatLimit then
  return { 1, 0, count }
end

local escalation = tonumber(redis.call("GET", KEYS[3]) or "0")
local banSeconds = math.min(
  baseBanSeconds * (2 ^ math.min(escalation, maxEscalations)),
  maxBanSeconds
)
local banUntil = now + banSeconds * 1000

redis.call("SET", KEYS[1], banUntil, "EX", banSeconds)
redis.call("SET", KEYS[3], math.min(escalation + 1, maxEscalations), "EX", 31536000)
redis.call("DEL", KEYS[2])

return { 0, banSeconds * 1000, count }
`;

const hourlyLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "tradit:shoe-scan:hour",
    })
  : null;

const dailyLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(25, "1 d"),
      prefix: "tradit:shoe-scan:day",
    })
  : null;

function requestIp(request) {
  const forwardedIp = request.headers.get("x-real-ip")?.trim();
  if (forwardedIp) return forwardedIp;
  return process.env.NODE_ENV === "development" ? "local-development" : null;
}

function clientIdentifier(request) {
  const ip = requestIp(request);
  if (!ip) {
    throw new Error("A trusted client IP is required for production rate limiting.");
  }
  return createHash("sha256").update(ip).digest("hex");
}

function getBanKeys(identifier, fingerprint) {
  const prefix = `tradit:shoe-scan:${identifier}`;
  return {
    ban: `${prefix}:ban`,
    repeats: `${prefix}:image:${fingerprint}:24h`,
    escalation: `${prefix}:ban-level`,
  };
}

function localBanStatus(identifier, now = Date.now()) {
  const ban = localBans.get(identifier);
  if (!ban || ban.until <= now) {
    if (ban) localBans.delete(identifier);
    return { banned: false, retryAfterSeconds: 0 };
  }
  return {
    banned: true,
    retryAfterSeconds: Math.max(1, Math.ceil((ban.until - now) / 1000)),
  };
}

function pruneLocalState(now) {
  if (imageRepeatWindows.size > 5000) {
    for (const [key, window] of imageRepeatWindows) {
      if (window.resetAt <= now) imageRepeatWindows.delete(key);
      if (imageRepeatWindows.size <= 4500) break;
    }
  }
  if (localBans.size > 5000) {
    for (const [key, ban] of localBans) {
      if (ban.until <= now) localBans.delete(key);
      if (localBans.size <= 4500) break;
    }
  }
}

export async function checkImageBan(request) {
  const identifier = clientIdentifier(request);
  const now = Date.now();

  if (redis) {
    const banUntil = Number(await redis.get(getBanKeys(identifier, "").ban) ?? 0);
    return {
      banned: Number.isFinite(banUntil) && banUntil > now,
      retryAfterSeconds: Number.isFinite(banUntil) && banUntil > now
        ? Math.max(1, Math.ceil((banUntil - now) / 1000))
        : 0,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Distributed image-ban storage is not configured.");
  }

  return localBanStatus(identifier, now);
}

export async function recordImageAndCheckBan(request, fingerprint) {
  const identifier = clientIdentifier(request);
  const now = Date.now();

  if (redis) {
    const keys = getBanKeys(identifier, fingerprint);
    const result = await redis.eval(
      BAN_AND_COUNT_IMAGE_SCRIPT,
      [keys.ban, keys.repeats, keys.escalation],
      [
        String(now),
        String(IMAGE_REPEAT_LIMIT),
        String(IMAGE_REPEAT_WINDOW_SECONDS),
        String(BASE_IMAGE_BAN_SECONDS),
        String(MAX_BAN_ESCALATIONS),
        String(MAX_IMAGE_BAN_SECONDS),
      ],
    );
    const [allowed, retryAfterMs] = result;
    return {
      banned: Number(allowed) !== 1,
      retryAfterSeconds: Number(allowed) !== 1
        ? Math.max(1, Math.ceil(Number(retryAfterMs) / 1000))
        : 0,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Distributed image-ban storage is not configured.");
  }

  const activeBan = localBanStatus(identifier, now);
  if (activeBan.banned) return activeBan;

  const key = `${identifier}:${fingerprint}`;
  const current = imageRepeatWindows.get(key);
  const repeatCount =
    !current || current.resetAt <= now
      ? 1
      : current.count + 1;
  const resetAt =
    !current || current.resetAt <= now
      ? now + IMAGE_REPEAT_WINDOW_SECONDS * 1000
      : current.resetAt;

  if (repeatCount <= IMAGE_REPEAT_LIMIT) {
    imageRepeatWindows.set(key, { count: repeatCount, resetAt });
    pruneLocalState(now);
    return { banned: false, retryAfterSeconds: 0 };
  }

  const previousBanLevel = localBans.get(`${identifier}:level`)?.level ?? 0;
  const banSeconds =
    Math.min(
      BASE_IMAGE_BAN_SECONDS * 2 ** Math.min(previousBanLevel, MAX_BAN_ESCALATIONS),
      MAX_IMAGE_BAN_SECONDS,
    );
  localBans.set(identifier, { until: now + banSeconds * 1000 });
  localBans.set(`${identifier}:level`, {
    level: Math.min(previousBanLevel + 1, MAX_BAN_ESCALATIONS),
    until: now + 365 * 24 * 60 * 60 * 1000,
  });
  imageRepeatWindows.delete(key);
  pruneLocalState(now);
  return { banned: true, retryAfterSeconds: banSeconds };
}

function consumeLocalWindow(key, limit, durationMs, now) {
  const current = localWindows.get(key);
  if (!current || current.resetAt <= now) {
    localWindows.set(key, { count: 1, resetAt: now + durationMs });
    return { allowed: true, resetAt: now + durationMs };
  }

  if (current.count >= limit) {
    return { allowed: false, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, resetAt: current.resetAt };
}

function consumeLocalLimits(identifier) {
  const now = Date.now();
  const hourly = consumeLocalWindow(`${identifier}:hour`, 10, 60 * 60 * 1000, now);
  const daily = consumeLocalWindow(`${identifier}:day`, 25, 24 * 60 * 60 * 1000, now);

  if (localWindows.size > 5000) {
    for (const [key, value] of localWindows) {
      if (value.resetAt <= now) localWindows.delete(key);
      if (localWindows.size <= 4500) break;
    }
  }

  const limitingWindow = [hourly, daily].find((window) => !window.allowed);
  return {
    allowed: !limitingWindow,
    retryAfterSeconds: limitingWindow
      ? Math.max(1, Math.ceil((limitingWindow.resetAt - now) / 1000))
      : 0,
  };
}

export async function checkAiRateLimit(request) {
  const identifier = clientIdentifier(request);
  if (hourlyLimiter && dailyLimiter) {
    const [hourly, daily] = await Promise.all([
      hourlyLimiter.limit(identifier),
      dailyLimiter.limit(identifier),
    ]);
    const limitingWindow = [hourly, daily].find((window) => !window.success);
    return {
      allowed: !limitingWindow,
      retryAfterSeconds: limitingWindow
        ? Math.max(1, Math.ceil((limitingWindow.reset - Date.now()) / 1000))
        : 0,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Distributed rate limiting is not configured.");
  }

  return consumeLocalLimits(identifier);
}
