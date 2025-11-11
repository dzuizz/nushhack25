"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getData } from "@/lib/firebase";
import { LeaderboardEntry } from "@/types";
import Navbar from "@/components/Navbar";

interface FirebaseUser {
  uid: string;
  name: string;
  major: string;
  score: number;
  hasCompletedProfile: boolean;
}

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lb, setLb] = useState<LeaderboardEntry[]>([]);
  const [ld, setLd] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    !authLoading && !user ? router.push("/") : user ? fetchLb() : null;
  }, [user, authLoading, router]);

  const fetchLb = async () => {
    setLd(true);
    setErr(null);
    try {
      const uData = await getData<Record<string, FirebaseUser>>("users");

      if (!uData) {
        setLb([]);
        return;
      }

      const arr = Object.values(uData)
        .filter((userData) => userData.name)
        .map((userData) => ({
          userId: userData.uid,
          name: userData.name,
          major: userData.major,
          score: userData.score,
          rank: 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setLb(arr);
    } catch (err) {
      console.error("Error:", err);
      setErr("Failed to load leaderboard; Debug better");
    } finally {
      setLd(false);
    }
  };

  if (authLoading || ld)
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="justify-center">
          <div className="w-12 h-12 animate-spin border-4 border-pri border-t-transparent rounded-full mb-4" />
          <p className="text-fg text-xs">Loading...</p>
        </div>
      </div>
    );

  if (err)
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4 pt-6">
          <div className="bg-white border border-border-gray p-8 text-center">
            <p className="text-red-600 text-lg font-medium mb-4">{err}</p>
            <button
              onClick={fetchLb}
              className="px-6 py-2 bg-pri text-white font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );

  const isUser = (userId: string) => userId === user?.uid;

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900 text-2xl";
    if (rank === 2) return "bg-gray-300 text-gray-800 text-xl";
    if (rank === 3) return "bg-orange-400 text-orange-900 text-xl";
    return "bg-pri text-white text-lg";
  };

  // Get top 5 users and current user if not in top 5
  const getDisplayEntries = () => {
    if (lb.length === 0) return [];

    const top5 = lb.slice(0, 5);
    const currentUserEntry = lb.find((entry) => isUser(entry.userId));

    // If user is not in top 5 and exists, add them to the display
    if (currentUserEntry && currentUserEntry.rank > 5) {
      return [...top5, currentUserEntry];
    }

    return top5;
  };

  const displayEntries = getDisplayEntries();
  const currentUserEntry = lb.find((entry) => isUser(entry.userId));
  const showSeparator = currentUserEntry && currentUserEntry.rank > 5;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-2xl mx-auto space-y-6 p-4 pt-6">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-fg mb-2">Leaderboard</h1>
          <p className="text-sec font-medium">Only top 5 and your rank is shown:</p>
        </header>

        <section className="space-y-4">
          {lb.length == 0 ? (
            <div className="bg-white shadow-md border border-border-gray p-12 text-center">
              <p className="text-sec text-lg">no users</p>
            </div>
          ) : (
            <>
              {displayEntries.map((entry, index) => (
                <div key={entry.userId}>
                  {/* Show separator before user's entry if they're not in top 5 */}
                  {showSeparator && index === 5 && (
                    <div className="flex items-center gap-3 my-6">
                      <div className="flex-1 border-t-2 border-dashed border-sec"></div>
                      <span className="text-sec text-sm font-medium px-3">
                        YOUR RANK
                      </span>
                      <div className="flex-1 border-t-2 border-dashed border-sec"></div>
                    </div>
                  )}
                  <article
                  key={entry.userId}
                  className={`
                    bg-white shadow-md border-2 p-5 transition-all hover:shadow-lg
                    ${
                      isUser(entry.userId)
                        ? "border-accent bg-light-gray"
                        : "border-border-gray"
                    }
                    ${
                      entry.rank === 1
                        ? "shadow-xl border-yellow-400 bg-yellow-50"
                        : ""
                    }
                    ${entry.rank === 2 ? "border-gray-400 bg-gray-50" : ""}
                    ${entry.rank === 3 ? "border-orange-400 bg-orange-50" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 items-center flex-1">
                      <div className="flex flex-col items-center justify-center min-w-[4rem]">
                        <div
                          className={`
                          w-14 h-14 flex items-center justify-center font-bold shadow-md
                          ${getRankBadgeStyle(entry.rank)}
                          ${entry.rank <= 3 ? "border-2 border-white" : ""}
                        `}
                        >
                          {entry.rank}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-fg text-xl">
                            {entry.name}
                          </p>
                          {isUser(entry.userId) && (
                            <span className="text-xs bg-accent text-white px-2 py-1 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-sec font-medium">
                          {entry.major}
                        </p>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="font-black text-3xl text-pri">
                        {entry.score}
                      </p>
                      <p className="text-xs text-sec font-bold uppercase tracking-wider">
                        points
                      </p>
                    </div>
                  </div>
                </article>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="bg-white p-6 shadow-md border border-border-gray">
          <h2 className="text-xl font-bold text-fg mb-4">
            How to earn points?
          </h2>
          <ul className="space-y-3 text-fg" role="list">
            <li className="p-3 bg-cream border-l-4 border-pri">
              <span className="font-medium">
                go and find your target person irl
              </span>
            </li>
            <li className="p-3 bg-cream border-l-4 border-pri">
              <span className="font-medium">
                earn 10 points for every minute of conversation
              </span>
            </li>
            <li className="p-3 bg-cream border-l-4 border-pri">
              <span className="font-medium">
                meet and talk with more people to climb the ranks!
              </span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
