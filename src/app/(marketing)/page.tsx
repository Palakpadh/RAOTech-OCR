"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // Run: npx shadcn@latest add button
import { ArrowRight, BarChart3, FileText, Zap } from "lucide-react";

export default function LandingPage() {
  const [currentDateTime, setCurrentDateTime] = useState("");

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="h-14 border-b border-white/10 bg-black px-4 text-white lg:px-6">
        <div className="flex h-full items-center">
          <div className="flex flex-col items-start leading-none">
            <Link className="flex items-center justify-center font-bold text-2xl text-white" href="#">
              RAO AI
            </Link>
            <span className="mt-1 text-xs font-medium tracking-wide text-white/70">{currentDateTime || "--"}</span>
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
            <div className="relative w-full overflow-hidden bg-black shadow-none">
              <video
                className="block aspect-video w-full object-cover"
                src="/static/kling_20260815_VIDEO_Updated_10_6126_0.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/95 to-transparent" />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full pt-2 pb-0 md:pt-4 lg:pt-6">
          <div className="mx-auto flex w-full flex-col gap-0">
            {[
              {
                title: "Smart OCR",
                description: "Auto-extract details from PDF, PNG, or Zip files instantly.",
                icon: FileText,
                align: "right",
                image: "/static/ocr-image.jpg",
              },
              {
                title: "AI Chatbot",
                description: 'Ask questions like "What was my total sales last October?"',
                icon: Zap,
                align: "left",
                image: "/static/chatbot-image.jpg",
              },
              {
                title: "Analytics",
                description: "Visual dashboards for Monthly and Yearly sales trends.",
                icon: BarChart3,
                align: "right",
                image: "/static/analytics-image.jpg",
              },
            ].map(({ title, description, icon: Icon, align, image }) => (
              <div key={title} className="w-full">
                <div
                  className="relative flex aspect-[16/9] w-full items-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.52), rgba(0,0,0,0.32)), url('${image}')`,
                  }}
                >
                  <div className={`w-full ${align === "right" ? "flex justify-end" : "flex justify-start"}`}>
                    <div className="max-w-lg text-left text-white">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">{title}</h2>
                      <p className="mt-4 max-w-md text-base text-white/80 md:text-xl">{description}</p>
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