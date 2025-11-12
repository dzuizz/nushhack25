"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { Conversation, User } from "@/types";

import { ref, get, set, push, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase";

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [othUser, setOthuser] = useState<User | null>(null);
  const [convo, setConvo] = useState<Conversation | null>(null);
  const [cause, setCause] = useState("");
  const [disc, setDisc] = useState(true);
  const [rep, setRep] = useState(false);
  const [end, setEnd] = useState(false);
  const [et, setET] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    } else if (user) fetchActiveConvo();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (convo && !disc) {
      const intervalId = setInterval(() => {
        setET(Math.floor((Date.now() - convo.startedAt) / 1000));
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [convo, disc]);

  useEffect(() => {
    if (!convo?.id) return;

    const convoRef = ref(database, `conversations/${convo.id}`);

    const leave = onValue(convoRef, (ss) => {
      if (ss.exists()) {
        const updConvo = ss.val() as Conversation;

        if (!updConvo.isActive && convo.isActive) {
          alert("Conversation ended :D");
          router.push("/main");
        }
      }
    });

    return () => off(convoRef, "value", leave);
  }, [convo, router]);

  const fetchActiveConvo = async () => {
    if (!user) return;

    const ss = await get(ref(database, "conversations"));

    if (ss.exists()) {
      const conversations = ss.val();
      const activeConv = Object.entries(conversations).find(
        ([_, conv]: [string, unknown]) => {
          const convo = conv as Conversation;
          return (
            convo.isActive &&
            (convo.user1Id == user.uid || convo.user2Id == user.uid)
          );
        }
      );

      if (activeConv) {
        const conv = {
          ...(activeConv[1] as Conversation),
          id: activeConv[0],
        };
        setConvo(conv);

        const othUserRef = ref(
          database,
          `users/${conv.user1Id === user.uid ? conv.user2Id : conv.user1Id}`
        );
        const otherUserSnapshot = await get(othUserRef);

        if (otherUserSnapshot.exists()) {
          setOthuser(otherUserSnapshot.val());
        }
      } else router.push("/main");
    } else router.push("/main");
  };

  const confirmStopConvo = () => {
    setEnd(true);
  };

  const handleStopConvo = async () => {
    if (!convo || !user || !othUser) return;

    setEnd(false);

    const duration = Math.floor((Date.now() - convo.startedAt) / 1000);
    const pointsEarned = Math.floor(duration);

    const convoRef = ref(database, `conversations/${convo.id}`);
    await set(convoRef, {
      ...convo,
      endedAt: Date.now(),
      isActive: false,
      duration,
    });

    const userCompletedConvos = user.conversationsCompleted || [];
    const otherUserCompletedConvos = othUser.conversationsCompleted || [];

    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      ...user,
      conversationsCompleted: [...userCompletedConvos, othUser.uid],
      score: (user.score || 0) + pointsEarned,
      currentTargetId: null,
    });

    const othUserRef = ref(database, `users/${othUser.uid}`);
    await set(othUserRef, {
      ...othUser,
      conversationsCompleted: [...otherUserCompletedConvos, user.uid],
      score: (othUser.score || 0) + pointsEarned,
      currentTargetId: null,
    });

    router.push("/main");
  };

  const handleReport = async () => {
    if (!convo || !user || !othUser || !cause.trim()) return;

    const reportRef = push(ref(database, "reports"));
    await set(reportRef, {
      id: reportRef.key,
      reporterId: user.uid,
      reportedUserId: othUser.uid,
      conversationId: convo.id,
      reason: cause,
      timestamp: Date.now(),
      status: "pending",
    });

    alert("Report submitted. Thank you for keeping our community safe.");
    setRep(false);
    setCause("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (authLoading || !convo || !othUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-pri border-t-transparent mb-4"></div>
          <p className="text-fg text-lg font-medium">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (disc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <div className="max-w-md w-full bg-white p-8 shadow-lg border border-border-gray">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-fg mb-2">
              Conversation Guidelines
            </h2>
            <p className="text-sec font-medium">Please follow these rules</p>
          </div>
          <div className="space-y-3 text-fg mb-8">
            <p className="font-semibold text-lg mb-4">Remember to:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-cream border-l-4 border-pri">
                <span className="font-medium">
                  Be respectful and kind! - listen actively
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-cream border-l-4 border-pri">
                <span className="font-medium">
                  Share more about yourself too! - Don't be shy
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-cream border-l-4 border-pri">
                <span className="font-medium">
                  If you ever feel uncomfortable at any point, don't hesitate to
                  rep it to us!
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDisc(false)}
            className="w-full py-4 bg-pri text-white font-bold text-lg"
          >
            Start Conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto space-y-6 p-4 pt-6">
        <div className="text-center bg-white p-8 shadow-lg border border-border-gray">
          <h1 className="text-2xl font-bold text-fg mb-4">
            Conversation in Progress
          </h1>
          <div className="text-7xl font-black text-pri mb-4 tracking-tight">
            {formatTime(et)}
          </div>
          <div className="inline-flex items-center gap-2 bg-cream px-6 py-3">
            <p className="text-sm text-fg font-bold">
              Earning a point per second
            </p>
          </div>
        </div>

        <div className="bg-white p-6 shadow-md border border-border-gray">
          <h2 className="text-xl font-bold text-fg mb-4">Chatting with</h2>
          <div className="space-y-3 text-fg">
            <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-accent">
              <div>
                <p className="text-xs text-sec font-medium uppercase tracking-wide">
                  Name
                </p>
                <p className="font-bold">{othUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-accent">
              <div>
                <p className="text-xs text-sec font-medium uppercase tracking-wide">
                  Major
                </p>
                <p className="font-bold">{othUser.major}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cream border-l-4 border-accent">
              <div>
                <p className="text-xs text-sec font-medium uppercase tracking-wide">
                  Hobbies
                </p>
                <p className="font-bold">{othUser.hobbies.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={confirmStopConvo}
            className="w-full py-4 bg-pri text-white font-bold text-lg"
          >
            End conversation
          </button>

          <button
            onClick={() => setRep(true)}
            className="w-full py-3 bg-white text-error font-bold border-2 border-error"
          >
            Report Issue
          </button>
        </div>
      </div>

      {rep && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 max-w-md w-full shadow-lg border border-border-gray transform">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-fg">Report Issue</h2>
              <button
                onClick={() => setRep(false)}
                className="text-sec text-3xl font-bold transition-colors w-10 h-10 flex items-center justify-center"
              >
                x
              </button>
            </div>

            <p className="text-sm text-sec mb-6 bg-cream p-4 border-l-4 border-pri">
              Please describe what happened. Your report will be reviewed by your
              school board and kept confidential.
            </p>

            <textarea
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              className="w-full h-36 px-4 py-3 border border-border-gray focus:outline-none focus:border-accent text-fg resize-none font-medium"
              placeholder="Tell us what happened..."
            />

            <button
              onClick={handleReport}
              disabled={!cause.trim()}
              className="w-full mt-6 py-4 bg-error text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {end && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 max-w-md w-full shadow-lg border border-border-gray transform">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-fg mb-2">
                End conversation?
              </h2>
              <p className="text-sec font-medium">
                You've been chatting for {formatTime(et)}
              </p>
            </div>

            <div className="bg-cream p-6 mb-6 border-l-4 border-pri">
              <p className="text-lg font-bold text-fg mb-2">
                Points to earn: {Math.floor(et)}
              </p>
              <p className="text-sm text-sec">
                Both of you will receive these points.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleStopConvo}
                className="w-full py-4 bg-pri text-white font-bold text-lg"
              >
                Yes, End Conversation
              </button>
              <button
                onClick={() => setEnd(false)}
                className="w-full py-3 bg-cream text-fg font-semibold border border-border-gray"
              >
                Continue chatting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
