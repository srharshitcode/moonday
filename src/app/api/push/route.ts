import { NextResponse } from "next/server";
import * as webpush from "web-push";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ScheduledPushItem {
  id: string;
  title: string;
  body: string;
  type: "once" | "daily" | "interval";
  fireAt?: number;       // Exact timestamp (ms) for countdown timers
  timeHHMM?: string;     // "HH:mm" for daily alarms, cycle alerts & supplements
  intervalMins?: number; // For repeating water nudges
  nextIntervalAt?: number;
}


interface PushStoreData {
  vapidKeys: {
    publicKey: string;
    privateKey: string;
  };
  subscriptions: webpush.PushSubscription[];
  schedules: ScheduledPushItem[];
  quietStart: string;
  quietEnd: string;
  firedLog: Record<string, boolean>;
}

const STORE_PATH = path.join(process.cwd(), ".moonday-push-store.json");

function loadPushStore(): PushStoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed?.vapidKeys?.publicKey && parsed?.vapidKeys?.privateKey) {
        return {
          vapidKeys: parsed.vapidKeys,
          subscriptions: Array.isArray(parsed.subscriptions)
            ? parsed.subscriptions
            : [],
          schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
          quietStart: parsed.quietStart || "22:30",
          quietEnd: parsed.quietEnd || "07:00",
          firedLog: parsed.firedLog || {},
        };
      }
    }
  } catch {}

  const generated = webpush.generateVAPIDKeys();
  const initial: PushStoreData = {
    vapidKeys: {
      publicKey:
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || generated.publicKey,
      privateKey: process.env.VAPID_PRIVATE_KEY || generated.privateKey,
    },
    subscriptions: [],
    schedules: [],
    quietStart: "22:30",
    quietEnd: "07:00",
    firedLog: {},
  };

  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf-8");
  } catch {}
  return initial;
}

function savePushStore(store: PushStoreData) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch {}
}

function isWithinQuietHours(
  nowHHMM: string,
  quietStart: string,
  quietEnd: string,
): boolean {
  if (!quietStart || !quietEnd) return false;
  if (quietStart <= quietEnd) {
    return nowHHMM >= quietStart && nowHHMM <= quietEnd;
  }
  return nowHHMM >= quietStart || nowHHMM <= quietEnd;
}

async function sendWebPushToAll(
  store: PushStoreData,
  payloadObj: { title: string; body: string; tag?: string; url?: string },
) {
  if (store.subscriptions.length === 0) return;

  webpush.setVapidDetails(
    "mailto:sanctuary@moonday.local",
    store.vapidKeys.publicKey,
    store.vapidKeys.privateKey,
  );

  const payload = JSON.stringify({
    title: payloadObj.title,
    body: payloadObj.body,
    tag: payloadObj.tag || `moonday-${Date.now()}`,
    url: payloadObj.url || "/reminders",
    timestamp: Date.now(),
  });

  const validSubs: webpush.PushSubscription[] = [];

  await Promise.allSettled(
    store.subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload, { TTL: 3600 });
        validSubs.push(sub);
      } catch (err: any) {
        if (err?.statusCode !== 404 && err?.statusCode !== 410) {
          validSubs.push(sub);
        }
      }
    }),
  );

  if (validSubs.length !== store.subscriptions.length) {
    store.subscriptions = validSubs;
    savePushStore(store);
  }
}

const globalForPush = globalThis as unknown as {
  __moondayPushDaemonStarted?: boolean;
};

function ensureBackgroundPushDaemon() {
  if (globalForPush.__moondayPushDaemonStarted) return;
  globalForPush.__moondayPushDaemonStarted = true;

  setInterval(async () => {
    try {
      const store = loadPushStore();
      if (store.subscriptions.length === 0 || store.schedules.length === 0) {
        return;
      }

      const now = new Date();
      const nowMs = now.getTime();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const nowHHMM = `${hh}:${mm}`;
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const quietActive = isWithinQuietHours(
        nowHHMM,
        store.quietStart,
        store.quietEnd,
      );

      let storeModified = false;
      const remainingSchedules: ScheduledPushItem[] = [];

      for (const item of store.schedules) {
        if (item.type === "once" && typeof item.fireAt === "number") {
          if (nowMs >= item.fireAt) {
            storeModified = true;
            await sendWebPushToAll(store, {
              title: item.title,
              body: item.body,
              tag: item.id,
            });
            continue;
          }
          remainingSchedules.push(item);
          continue;
        }

        if (item.type === "interval" && item.intervalMins) {
          const nextAt =
            item.nextIntervalAt || nowMs + item.intervalMins * 60 * 1000;
          if (nowMs >= nextAt) {
            item.nextIntervalAt = nowMs + item.intervalMins * 60 * 1000;
            storeModified = true;
            if (!quietActive) {
              await sendWebPushToAll(store, {
                title: item.title,
                body: item.body,
                tag: item.id,
              });
            }
          }
          remainingSchedules.push(item);
          continue;
        }

        if (item.type === "daily" && item.timeHHMM) {
          const fireLogKey = `${todayKey}_${item.id}_${item.timeHHMM}`;
          if (item.timeHHMM === nowHHMM && !store.firedLog[fireLogKey]) {
            store.firedLog[fireLogKey] = true;
            storeModified = true;
            if (!quietActive || item.id.startsWith("alm-")) {
              await sendWebPushToAll(store, {
                title: item.title,
                body: item.body,
                tag: item.id,
              });
            }
          }
          remainingSchedules.push(item);
        }
      }

      if (storeModified) {
        store.schedules = remainingSchedules;
        savePushStore(store);
      }
    } catch {}
  }, 3000);
}

ensureBackgroundPushDaemon();

export async function GET() {
  ensureBackgroundPushDaemon();
  const store = loadPushStore();
  return NextResponse.json({
    publicKey: store.vapidKeys.publicKey,
    subscriberCount: store.subscriptions.length,
    activeSchedules: store.schedules.length,
  });
}

export async function POST(request: Request) {
  ensureBackgroundPushDaemon();
  const store = loadPushStore();
  const body = await request.json();

  if (body.action === "subscribe" && body.subscription?.endpoint) {
    const exists = store.subscriptions.some(
      (s) => s.endpoint === body.subscription.endpoint,
    );
    if (!exists) {
      store.subscriptions.push(body.subscription);
      savePushStore(store);
    }
    return NextResponse.json({
      ok: true,
      subscriberCount: store.subscriptions.length,
    });
  }


  if (body.action === "sync_schedules") {
    if (body.subscription?.endpoint) {
      const exists = store.subscriptions.some(
        (s) => s.endpoint === body.subscription.endpoint,
      );
      if (!exists) {
        store.subscriptions.push(body.subscription);
      }
    }

    if (Array.isArray(body.schedules)) {
      store.schedules = body.schedules;
    }
    if (body.quietStart) store.quietStart = body.quietStart;
    if (body.quietEnd) store.quietEnd = body.quietEnd;

    savePushStore(store);
    return NextResponse.json({
      ok: true,
      activeSchedules: store.schedules.length,
    });
  }


  if (body.action === "send_test") {
    const delaySec = Number(body.delaySec) || 0;
    const title = body.title || "MoonDay Background Push Verified";
    const message =
      body.body ||
      "This notification was pushed from the server and works even when MoonDay is closed.";

    if (delaySec > 0) {
      store.schedules.push({
        id: `test-closed-${Date.now()}`,
        title,
        body: message,
        type: "once",
        fireAt: Date.now() + delaySec * 1000,
      });
      savePushStore(store);
      return NextResponse.json({ ok: true, scheduledInSec: delaySec });
    }

    await sendWebPushToAll(store, { title, body: message });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}