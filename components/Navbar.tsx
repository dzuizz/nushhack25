"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const { user: u, logout: bye } = useAuth();
  const pn = usePathname();
  const rtr = useRouter();

  const yeet = async () => {
    await bye();
    rtr.push("/");
  };

  const hot = (h: string) => pn == h || pn?.startsWith(`${h}/`);

  return (
    <nav
      className="sticky top-0 z-40 bg-white border-b border-border-gray"
      aria-label="Primary"
      role="navigation"
    >
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href={u ? "/main" : "/"}
            className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-pri transition"
          >
            <Image
              className="shadow-sm object-contain"
              src="/logo.png"
              height={40}
              width={40}
              alt="FREN"
              priority
            />
          </Link>
          {u && (
            <div className="flex flex-row items-center">
              <Link
                href="/main"
                aria-current={hot("/main") ? "page" : undefined}
                className={`px-4 py-2 text-sm font-medium transition ${
                  hot("/main")
                    ? "bg-pri border-pri text-white"
                    : "text-fg hover:bg-cream"
                }`}
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                aria-current={hot("/leaderboard") ? "page" : undefined}
                className={[
                  "px-4 py-2 text-sm font-medium transition",
                  hot("/leaderboard")
                    ? "bg-pri border-pri text-white"
                    : "text-fg hover:bg-cream",
                ].join(" ")}
              >
                Leaderboard
              </Link>
              <button
                onClick={yeet}
                className="ml-1 sm:ml-2 px-4 py-2 text-sm font-medium bg-cream text-fg border border-border-gray hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
