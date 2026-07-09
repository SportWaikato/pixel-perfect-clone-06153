import { Watch, HeartPulse, Activity, Check } from "lucide-react";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { toast } from "sonner";
import { useWearableSync } from "../useWearableSync";

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
  const { availability, busy, connect } = useWearableSync();
  const isLive = availability?.available === true;

  const handleConnect = async () => {
    const status = await connect();
    if (status === "granted") toast.success("Watch connected — your workouts will sync in.");
    else if (status === "denied") toast.error("Health permission was declined.");
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
              {isLive ? (
                <Button size="sm" onClick={handleConnect} disabled={busy}>
                  {busy ? "Connecting…" : "Connect"}
                </Button>
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
