"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button"; // Run: npx shadcn@latest add button
import { ArrowRight, BarChart3, FileText, Zap, Volume2, VolumeX } from "lucide-react";

export default function LandingPage() {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const heroDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(
        new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // Ensure autoplay works by starting muted. Attempt to play; browsers
    // may still block autoplay with sound, so leave unmute to user action.
    if (videoRef.current) {
      try {
        videoRef.current.muted = isMuted;
        if (!isMuted) videoRef.current.volume = 0.8;
        const p = videoRef.current.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (e) {
        // ignore
      }
    }
  }, [isMuted]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    if (!newMuted) videoRef.current.volume = 0.8;
    // attempt to play with user gesture; this should enable audio in most browsers
    try {
      const p = videoRef.current.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {
      // ignore
    }
    setIsMuted(newMuted);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="h-14 border-b border-white/10 bg-black px-4 text-white lg:px-6">
        <div className="flex h-full items-center">
          <div className="flex flex-col items-start leading-none">
            <Link className="flex items-center justify-center font-bold text-2xl text-white" href="#">
              RAO AI
            </Link>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard">
              <Button className="bg-white text-black hover:bg-white/90">Login / Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 bg-black">
        <section className="w-full pt-0 pb-0 bg-black">
          <div className="mx-auto text-center">
            <div className="relative w-full overflow-hidden bg-black shadow-none h-screen md:h-auto">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src="/static/kling_20260815_VIDEO_Updated_10_6126_0.mp4"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                controls={false}
              />
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                className="absolute right-4 bottom-4 z-20 flex items-center justify-center rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/95 to-transparent" />

              {/* Date + Tagline, bottom-left, SpaceX style */}
              <div className="absolute bottom-2 left-4 md:left-10 z-10 max-w-2xl text-left text-white">
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-white/80 md:text-sm">
                  {heroDate}
                </p>
                <h1 className="text-2xl font-extrabold uppercase leading-[1.05] tracking-tight md:text-4xl lg:text-5xl">
                  Your Work, Our Trusted Care.
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full border-t border-white/10">
          <div className="mx-auto flex w-full flex-col">
            {[
              {
                eyebrow: "Document Intelligence",
                title: "Smart OCR",
                description: "Auto-extract details from PDF, PNG, or Zip files instantly.",
                icon: FileText,
                align: "right",
                image: "/static/ocr-image.jpg",
              },
              {
                eyebrow: "Conversational AI",
                title: "AI Chatbot",
                description: 'Ask questions like "What was my total sales last October?"',
                icon: Zap,
                align: "left",
                image: "/static/chatbot-image.jpg",
              },
              {
                eyebrow: "Reporting",
                title: "Analytics",
                description: "Visual dashboards for Monthly and Yearly sales trends.",
                icon: BarChart3,
                align: "right",
                image: "/static/analytics-image.jpg",
              },
            ].map(({ eyebrow, title, description, icon: Icon, align, image }, i) => (
              <div key={title} className={i !== 0 ? "w-full border-t border-white/10" : "w-full"}>
                <div
                  className="relative flex aspect-[16/9] w-full items-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-8 md:px-8 md:py-10 lg:px-16 lg:py-12"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.6), rgba(0,0,0,0.35)), url('${image}')`,
                  }}
                >
                  <div className={`w-full ${align === "right" ? "flex justify-end" : "flex justify-start"}`}>
                    <div className="max-w-lg text-left text-white">
                      <div className="mb-4 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center border border-white/30 bg-white/5">
                        <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-white/60">
                        {eyebrow}
                      </p>
                      <h2 className="text-2xl font-semibold uppercase leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                        {title}
                      </h2>
                      <p className="mt-3 max-w-md text-sm md:text-lg text-white/70">{description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}