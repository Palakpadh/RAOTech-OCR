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
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <div className="flex flex-col items-start leading-none">
          <Link className="flex items-center justify-center font-bold text-2xl" href="#">
            RAO AI
          </Link>
          <span className="mt-1 text-xs font-medium text-gray-500 tracking-wide">{currentDateTime || "--"}</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/dashboard">
            <Button>Login / Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full pt-0 pb-8 md:pb-12 lg:pb-16 xl:pb-20 bg-gray-50">
          <div className="mx-auto text-center">
            <div className="relative mb-4 w-full overflow-hidden bg-gray-50 shadow-none">
              <video
                className="block aspect-video w-full object-cover"
                src="/static/kling_20260815_VIDEO_Updated_10_6126_0.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Manage Invoices with <span className="text-blue-600">AI Precision</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl">
              Upload bulk invoices, extract data automatically, and chat with your financial data using our RAG-powered AI.
            </p>
            <div className="mt-8">
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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