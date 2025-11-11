"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");

  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    } else if (!authLoading && user?.hasCompletedProfile) {
      router.push("/main");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLd(true);
    setErr("");

    try {
      const hobbiesArray = hobbies
        .split(",")
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      if (hobbiesArray.length === 0) {
        setErr("Please enter at least one hobby");
        setLd(false);
        return;
      }

      await updateUserProfile({
        hasCompletedProfile: true,
        hobbies: hobbiesArray,
        major,
        name,
      });

      router.push("/main");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setErr(errorMessage);
    } finally {
      setLd(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-pri border-t-transparent mb-4"></div>
          <p className="text-fg text-lg font-medium">loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex w-full justify-center mb-4">
            <Image
              src="/logo.png"
              alt="logo"
              width={80}
              height={80}
              className="shadow-sm transition-shadow object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-fg mb-6">
            complete
            <br /> your profile
          </h1>
          <p className="text-lg text-sec font-medium">
            tell us more about yourself
          </p>
        </div>

        <div className="bg-white p-8 shadow-lg border border-border-gray">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-semibold text-fg mb-2 block"
              >
                full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                className="w-full px-4 py-3 border border-border-gray focus:outline-none focus:border-accent text-fg font-medium transition-all"
                placeholder="aidan sin"
              />
            </div>

            <div>
              <label
                htmlFor="major"
                className="text-sm font-semibold text-fg mb-2 block"
              >
                major
              </label>
              <input
                id="major"
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-border-gray focus:outline-none focus:border-accent text-fg font-medium transition-all"
                placeholder="PCMCS"
              />
            </div>

            <div>
              <label
                htmlFor="hobbies"
                className="text-sm font-semibold text-fg mb-2 block"
              >
                hobbies
              </label>
              <input
                id="hobbies"
                type="text"
                required
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                className="w-full px-4 py-3 border border-border-gray focus:outline-none focus:border-accent text-fg font-medium transition-all"
                placeholder="reading, sleeping, sports"
              />
              <p className="text-xs text-sec mt-2 font-medium">
                separate multiple hobbies with commas
              </p>
            </div>

            {err && (
              <div className="text-err text-sm text-center bg-red-50 p-4 font-semibold border border-err">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={ld}
              className="w-full py-4 bg-pri text-white font-bold text-lg hover:bg-deep-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ld ? "saving..." : "continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
