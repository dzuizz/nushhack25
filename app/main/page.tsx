"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { ref, get, set, push, onValue, off } from "firebase/database";
import { User, Conversation } from "@/types";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import QRScanner from "@/components/QRScanner";
import Navbar from "@/components/Navbar";

export default function Main() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tgt, setTgt] = useState<User | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/");
      return;
    }
    if (!user.hasCompletedProfile) router.push("/profile-setup");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    void fetchTgt();
    void checkActiveConv();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const convRef = ref(database, "conversations");
    const unsub = onValue(convRef, (snap) => {
      if (!snap.exists()) return;
      const convs = snap.val() as Record<string, Conversation>;
      const active = Object.values(convs).find(
        (c) => c.isActive && (c.user1Id === user.uid || c.user2Id === user.uid)
      );
      if (active) router.push("/conversation");
    });
    return () => off(convRef, "value", unsub);
  }, [user, router]);

  const checkActiveConv = async () => {
    if (!user) return;
    const snap = await get(ref(database, "conversations"));
    if (!snap.exists()) return;
    const convs = snap.val() as Record<string, Conversation>;
    const active = Object.values(convs).find(
      (c) => c.isActive && (c.user1Id === user.uid || c.user2Id === user.uid)
    );
    if (active) router.push("/conversation");
  };

  const fetchTgt = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.currentTargetId) {
        const snap = await get(ref(database, `users/${user.currentTargetId}`));
        if (snap.exists()) setTgt(snap.val());
        else await assignTgt();
      } else await assignTgt();
    } catch (err) {
      console.debug("[target] fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const assignTgt = async (excludeCurr = false) => {
    if (!user) return;
    const snap = await get(ref(database, "users"));
    if (!snap.exists()) return;

    const users = snap.val() as Record<string, User>;
    const done = user.conversationsCompleted || [];
    const avail = Object.values(users).filter(
      (u) =>
        u.uid !== user.uid &&
        u.hasCompletedProfile &&
        !done.includes(u.uid) &&
        (!excludeCurr || u.uid !== tgt?.uid)
    );

    if (!avail.length) {
      setTgt(null);
      return;
    }

    const match = findMatch(avail);
    await set(ref(database, `users/${user.uid}`), {
      ...user,
      currentTargetId: match.uid,
    });
    setTgt(match);
  };

  const handleRefresh = async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      await assignTgt(true);
    } catch (err) {
      console.error("[target] refresh error", err);
      alert("Failed to find a new target. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const findMatch = (cands: User[]): User => {
    if (!user) return cands[0];
    const scored = cands.map((t) => {
      let s = 0;
      if (t.major !== user.major) s += 3;
      const common = (user.hobbies || []).filter((h) =>
        (t.hobbies || []).includes(h)
      );
      s += common.length;
      return { t, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored[0].t;
  };

  const handleScan = async (scannedId: string) => {
    if (!user || !tgt) return;
    if (scannedId === tgt.uid) {
      const convRef = push(ref(database, "conversations"));
      const newConv: Conversation = {
        id: convRef.key!,
        user1Id: user.uid,
        user2Id: tgt.uid,
        startedAt: Date.now(),
        isActive: true,
      };
      await set(convRef, newConv);
      setShowScanner(false);
      router.push("/conversation");
    } else {
      alert("oops! wrong person.");
      setShowScanner(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex bg-cream items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-pri border-t-transparent mb-4"></div>
          <p className="text-fg text-lg font-medium">
            finding your next friend...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="mx-auto max-w-2xl space-y-6 p-4 pt-6">
        <div className="bg-white p-6 border border-border-gray shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-fg">your profile</h2>
            <div className="bg-pri text-white px-4 py-2 font-bold">
              {user?.score} pts
            </div>
          </div>
          <div className="space-y-3 text-fg">
            <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-pri">
              <div>
                <p className="text-xs text-sec font-medium uppercase tracking-wide">
                  name
                </p>
                <p className="font-semibold">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-pri">
              <div>
                <p className="text-xs text-sec font-medium uppercase tracking-wide">
                  major
                </p>
                <p className="font-semibold">{user?.major}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-pri">
              <div>
                <p className="text-xs text-sec font-medium uppercase tracking-wide">
                  hobbies
                </p>
                <p className="font-semibold">{user?.hobbies.join(", ")}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setShowQR((v) => !v)}
              className="w-full py-3 bg-pri text-white font-semibold hover:bg-deep-purple transition-all"
            >
              {showQR ? "hide my QR code" : "show my QR code"}
            </button>
            {showQR && (
              <div className="mt-6 p-6 bg-cream flex flex-col items-center border border-border-gray">
                <p className="text-sm text-fg font-medium mb-3">
                  let your match scan this
                </p>
                <div className="bg-white p-4 border border-border-gray">
                  <QRCode value={user?.uid || ""} size={200} />
                </div>
              </div>
            )}
          </div>
        </div>

        {tgt ? (
          <div className="bg-white p-6 border border-border-gray shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-fg">target person</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 text-sm bg-accent text-white hover:bg-pri transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? "finding..." : "find new match"}
              </button>
            </div>
            <div className="space-y-3 text-fg mb-6">
              <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-accent">
                <div>
                  <p className="text-xs text-sec font-medium uppercase tracking-wide">
                    name
                  </p>
                  <p className="font-semibold">{tgt.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-accent">
                <div>
                  <p className="text-xs text-sec font-medium uppercase tracking-wide">
                    major
                  </p>
                  <p className="font-semibold">{tgt.major}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-accent">
                <div>
                  <p className="text-xs text-sec font-medium uppercase tracking-wide">
                    hobbies
                  </p>
                  <p className="font-semibold">{tgt.hobbies.join(", ")}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-4 bg-accent text-white font-bold text-lg hover:bg-pri transition-all"
            >
              scan their QR code
            </button>
            <p className="text-center text-sm text-sec mt-3 font-medium">
              find them and start a conversation
            </p>
          </div>
        ) : (
          <div className="bg-white p-8 border border-border-gray text-center shadow-md">
            <p className="text-lg font-semibold text-fg mb-4">
              no more targets...
            </p>
            <p className="text-sec mb-6">
              you've already met everyone available
              <br /> come again later for more matches!
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-6 py-3 bg-accent text-white hover:bg-pri transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? "Searching..." : "Search for New People"}
            </button>
          </div>
        )}
      </div>
      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
