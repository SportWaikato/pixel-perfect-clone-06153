import { useState } from "react";
import { Watch, HeartPulse, Activity, Check, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { useUser } from "@/modules/auth/hooks/useUser";
import { useWearableSync } from "../useWearableSync";
import { importWorkouts } from "../importWorkouts";

const LAST_SYNC_KEY = "karawhiua:wearable-last-sync";
const SYNC_WINDOW_DAYS = 7;

// Profile surface for connecting a watch / fitness tracker.
//
// On the web PWA the sync provider reports `available: false` (reason "web"), so
// this renders an honest "coming with the native app" state — matching the
// landing page's App Store / Google Play placeholders. The `connect()` branch is
// live wiring: when a native provider ships, the same card gains a working
// permission prompt with no further changes here.
const PLATFORMS = [
  {
    key: "apple_health",
    Icon: HeartPulse,
    name: "Apple Health",
    blurb: "Sync workouts from Apple Watch & iPhone",
  },
  {
    key: "health_connect",
    Icon: Activity,
    name: "Health Connect",
    blurb: "Sync from Wear OS, Fitbit, Samsung & more",
  },
] as const;

const WearableSyncCard = () => {
  const { availability, permission, busy, connect, pullWorkouts } = useWearableSync();
  const { user } = useUser();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const isLive = availability?.available === true;
  const isConnected = permission === "granted";

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const stored = localStorage.getItem(LAST_SYNC_KEY);
      const fallback = new Date(Date.now() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const since = stored ? new Date(stored) : fallback;
      // Never look back further than the app's logging window allows.
      const effectiveSince = since < fallback ? fallback : since;

      const samples = await pullWorkouts(effectiveSince);
      const result = await importWorkouts(createSupabaseClient(), user.id, samples);

      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      if (result.imported > 0) {
        toast.success(
          `Synced ${result.imported} workout${result.imported === 1 ? "" : "s"} from your watch!`,
        );
        router.invalidate();
      } else if (samples.length === 0) {
        toast.info("No new workouts found on your watch.");
      } else {
        toast.info("Everything is already up to date.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed — try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async () => {
    const status = await connect();
    if (status === "granted") {
      toast.success("Watch connected — pulling your recent workouts…");
      await handleSync();
    } else if (status === "denied") {
      toast.error("Health permission was declined.");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
            <Watch className="text-brand-green" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sync your watch</h3>
            <p className="text-sm text-gray-600">
              Let your smartwatch log your minutes automatically.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {PLATFORMS.map(({ key, Icon, name, blurb }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <Icon className="shrink-0 text-brand-green" size={22} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{blurb}</p>
              </div>
              {isLive && availability?.platform === key ? (
                isConnected ? (
                  <Button
                    size="sm"
                    onClick={handleSync}
                    disabled={busy || syncing}
                    className="gap-1.5"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                    {syncing ? "Syncing…" : "Sync now"}
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleConnect} disabled={busy}>
                    {busy ? "Connecting…" : "Connect"}
                  </Button>
                )
              ) : isLive ? (
                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
                  Not on this device
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
                  Coming soon
                </span>
              )}
            </div>
          ))}
        </div>

        {!isLive && (
          <div className="flex items-start gap-2 rounded-lg border border-brand-green/20 bg-brand-green/5 p-3 text-sm text-brand-green">
            <Check className="mt-0.5 shrink-0" size={16} />
            <p>
              Watch sync arrives with the Karawhiua app for iOS &amp; Android. For now, log your
              minutes in a tap — or scan a workout screenshot to auto-fill them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WearableSyncCard;
