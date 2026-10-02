"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/app-context";
import {
  MapPin,
  Search,
  Sparkles,
  ShieldCheck,
  Star,
  Users,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Building2,
  Zap,
  Flame,
  Award,
  Headphones,
  Tag,
  Shield,
  BookOpen,
  Calendar,
  Compass,
  Heart,
  TrendingUp,
  Leaf,
  Layers,
  ChevronDown,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const router = useRouter();
  const { user, issues } = useApp();

  // Search & Filter State
  const [searchWard, setSearchWard] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedStory, setSelectedStory] = useState<{
    title: string;
    readTime: string;
    image: string;
    content: string;
  } | null>(null);

  // Active sub-nav filter
  const [activeNav, setActiveNav] = useState<"hotspots" | "guide" | "rewards" | "about">("hotspots");

  // Dynamic spotlight hotspots from live database issues
  const spotlightHotspots = useMemo(() => {
    if (!issues || issues.length === 0) return [];
    return [...issues]
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, 4)
      .map((issue) => ({
        id: issue.id,
        title: issue.title,
        tagline: `${issue.category} Infrastructure`,
        rating: (4.5 + Math.min(0.5, (issue.upvotes || 0) * 0.01)).toFixed(1),
        upvotes: `${issue.upvotes || 0} Upvotes`,
        urgency: issue.urgency,
        image: issue.images?.reported || "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
        status: issue.status,
        category: issue.category,
      }));
  }, [issues]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchWard.trim()) {
      router.push(`/feed?q=${encodeURIComponent(searchWard.trim())}`);
    } else {
      router.push("/feed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn pb-16">

      {/* Top Floating Category Navigation Bar (Exact WanderAsia Style) */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 sm:gap-6 px-4 sm:px-8 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-soft overflow-x-auto no-scrollbar max-w-full text-xs font-bold text-slate-700">
          <button
            onClick={() => {
              setActiveNav("hotspots");
              document.getElementById("trending-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap",
              activeNav === "hotspots" ? "bg-emerald-50 text-emerald-800" : "hover:text-slate-900"
            )}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ward Hotspots</span>
          </button>

          <button
            onClick={() => router.push("/feed")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all hover:text-slate-900 whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Live Feed</span>
          </button>

          <button
            onClick={() => router.push("/innovations")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all hover:text-slate-900 whitespace-nowrap"
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span>Innovations</span>
          </button>

          <button
            onClick={() => {
              setActiveNav("guide");
              document.getElementById("stories-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap",
              activeNav === "guide" ? "bg-emerald-50 text-emerald-800" : "hover:text-slate-900"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            <span>Civic Guide</span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all hover:text-slate-900 whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>Citizen XP</span>
          </button>

          <button
            onClick={() => {
              document.getElementById("values-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all hover:text-slate-900 whitespace-nowrap"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>About JanSeva</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HERO SECTION & INTERACTIVE 3-FIELD SEARCH BAR */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#134431] via-[#1a563f] to-[#0f3828] text-white p-6 sm:p-12 shadow-2xl">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">

          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Empowering Bhubaneswar Citizens with Real-time SLA Accountability</span>
          </div>

          {/* Headline */}
          <h1 className="font-headline font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-tight sm:leading-none">
            Where do you want to <br />
            <span className="text-emerald-300">spark civic change today?</span>
          </h1>

          <p className="text-xs sm:text-base text-emerald-100/90 max-w-2xl mx-auto font-medium leading-relaxed">
            Browse active municipal ward upgrades, track field resolutions across departments, and verify real public impact.
          </p>

          {/* 3-Field Floating Search Bar Container (Exact Match to WanderAsia Search Bar) */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 p-3 rounded-3xl bg-white text-slate-800 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3 border border-white/80"
          >

            {/* Field 1: Ward Location */}
            <div className="flex-1 px-4 py-2 rounded-2xl hover:bg-slate-50 transition-colors text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#134431] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  PIN Code / Area
                </label>
                <input
                  type="text"
                  value={searchWard}
                  onChange={(e) => setSearchWard(e.target.value)}
                  placeholder="e.g. 751024, 751020, Khandagiri..."
                  className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-200"></div>

            {/* Field 2: Department */}
            <div className="flex-1 px-4 py-2 rounded-2xl hover:bg-slate-50 transition-colors text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Department
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="All">All Municipal Depts</option>
                  <option value="Roads">Roads & PWD</option>
                  <option value="Water">Water & Drainage</option>
                  <option value="Sanitation">Solid Waste & Cleaning</option>
                  <option value="Electricity">Electricity & Streetlights</option>
                </select>
              </div>
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-200"></div>

            {/* Field 3: Status / SLA */}
            <div className="flex-1 px-4 py-2 rounded-2xl hover:bg-slate-50 transition-colors text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="All">All Resolution Stages</option>
                  <option value="In Progress">⚡ In Progress</option>
                  <option value="Resolved">✓ Resolved & Verified</option>
                  <option value="Critical">🔥 Critical Urgency</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="px-7 py-3 rounded-full bg-[#f06424] hover:bg-[#d95214] text-white font-headline font-bold text-xs shadow-lg shadow-orange-500/30 transition-all hover:scale-102 active:scale-98 shrink-0 flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Feed</span>
            </button>
          </form>

          {/* Quick Feature Badges below Search Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-emerald-200/80">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Residents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Auto-Triage Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-300" />
              <span>Real-time SLA Timers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-300" />
              <span>Gamified Citizen XP</span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: POPULAR WARD HOTSPOTS (4-CARD GRID) */}
      <div id="trending-section" className="space-y-6">

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-black text-2xl text-slate-900">
              Ward Hotspots in Bhubaneswar
            </h2>
            <span className="text-emerald-600 text-xl">🍃</span>
          </div>

          <Link
            href="/feed"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 group transition-colors"
          >
            <span>View all issues</span>
            <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-[#134431] group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* 4-Card Hotspot Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {spotlightHotspots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => router.push(`/feed?q=${encodeURIComponent(spot.title.split(",")[0])}`)}
              className="rounded-3xl bg-white border border-slate-100 p-3 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Image Container */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] w-full mb-3 bg-slate-100">
                  <img
                    src={spot.image}
                    alt={spot.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Rating Badge on Top-Right */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-md text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{spot.rating}</span>
                  </div>

                  {/* Urgency Pill on Top-Left */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                    {spot.urgency} Urgency
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold">
                    {spot.status}
                  </div>
                </div>

                {/* Title & Tagline */}
                <h3 className="font-headline font-bold text-base text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                  {spot.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {spot.tagline}
                </p>
              </div>

              {/* Bottom Price/Upvotes Row */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Community Priority</span>
                <span className="font-headline font-black text-sm text-[#f06424]">
                  {spot.upvotes}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* SECTION 3: COMMUNITY STORY BANNER (Exact Match to WanderAsia Story Banner) */}
      <div id="stories-section" className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-[#134431] to-teal-950 text-white p-8 sm:p-12 shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold tracking-wider uppercase border border-emerald-400/20">
              Community Inspiration
            </span>
            <h3 className="font-headline font-black text-2xl sm:text-3xl text-white">
              Not sure where to report? Get inspired by real citizen triumphs.
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Read how Khandagiri transformed water logging into clean green zones within 48 hours using JanSeva AI.
            </p>
          </div>

          <button
            onClick={() => setSelectedStory({
              title: "How Khandagiri Fixed 12 Water Logged Corners in 48 Hours",
              readTime: "3 min read",
              image: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=1000&auto=format&fit=crop&q=80",
              content: "Through collaborative reporting on JanSeva, 84 residents of Khandagiri upvoted critical drainage tickets. The BMC Water Works division dispatched suction vehicles and unclogged main junction lines, verified via before-and-after photo audit."
            })}
            className="px-6 py-3 rounded-full bg-white text-[#134431] hover:bg-emerald-50 font-headline font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Read Story
          </button>
        </div>
      </div>

      {/* SECTION 4: 4 PASTEL FEATURE PILLARS (Why Stand with JanSeva?) */}
      <div id="values-section" className="space-y-6">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <h2 className="font-headline font-black text-2xl text-slate-900">
            Why Stand with JanSeva?
          </h2>
          <p className="text-xs text-slate-500">
            The civic platform built on radical transparency, direct dispatch routing, and community empowerment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Card 1: Pastel Mint */}
          <div className="rounded-3xl p-6 bg-[#f0f9f5] border border-[#d8eee3] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#134431] text-white flex items-center justify-center font-bold shadow-md">
              <Shield className="w-6 h-6 text-emerald-300" />
            </div>
            <h3 className="font-headline font-bold text-base text-slate-900">
              Verified Residents Only
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every report and upvote is bound to real municipal wards via secure OTP & resident validation. Zero fake bots.
            </p>
          </div>

          {/* Card 2: Pastel Peach */}
          <div className="rounded-3xl p-6 bg-[#fef5f0] border border-[#fcdccb] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f06424] text-white flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <h3 className="font-headline font-bold text-base text-slate-900">
              Instant AI Triage
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Take a snap and our neural model classifies road, drainage, or light issues, tagging responsible departments automatically.
            </p>
          </div>

          {/* Card 3: Pastel Sky */}
          <div className="rounded-3xl p-6 bg-[#f0f7fe] border border-[#d2e7fc] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center font-bold shadow-md">
              <Clock className="w-6 h-6 text-sky-200" />
            </div>
            <h3 className="font-headline font-bold text-base text-slate-900">
              Transparent SLA Timers
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Live countdown clocks on municipal repair benchmarks. Escalations trigger automatically if deadlines pass.
            </p>
          </div>

          {/* Card 4: Pastel Lavender */}
          <div className="rounded-3xl p-6 bg-[#f7f2fe] border border-[#e5d4fc] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center font-bold shadow-md">
              <Award className="w-6 h-6 text-purple-200" />
            </div>
            <h3 className="font-headline font-bold text-base text-slate-900">
              Citizen XP & Badges
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Earn civic karma, unlock municipal honors, and establish yourself as an active community leader.
            </p>
          </div>

        </div>
      </div>

      {/* SECTION 5: DARK FOREST GREEN STATS & CALL-TO-ACTION FOOTER */}
      <div className="rounded-3xl bg-[#134431] text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-8">

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center border-b border-white/10 pb-8">
            <div className="space-y-1">
              <p className="font-headline font-black text-3xl sm:text-4xl text-emerald-300">12,480+</p>
              <p className="text-xs text-emerald-100/70 font-medium uppercase tracking-wider">Reports Resolved</p>
            </div>
            <div className="space-y-1">
              <p className="font-headline font-black text-3xl sm:text-4xl text-emerald-300">67 Wards</p>
              <p className="text-xs text-emerald-100/70 font-medium uppercase tracking-wider">Active in BMC</p>
            </div>
            <div className="space-y-1">
              <p className="font-headline font-black text-3xl sm:text-4xl text-emerald-300">18.4 hrs</p>
              <p className="text-xs text-emerald-100/70 font-medium uppercase tracking-wider">Avg Fix Turnaround</p>
            </div>
            <div className="space-y-1">
              <p className="font-headline font-black text-3xl sm:text-4xl text-emerald-300">94.2%</p>
              <p className="text-xs text-emerald-100/70 font-medium uppercase tracking-wider">Citizen Satisfaction</p>
            </div>
          </div>

          {/* Call to Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="font-headline font-bold text-xl text-white">
                Spot a civic hazard in your street right now?
              </h3>
              <p className="text-xs text-emerald-100/70 mt-0.5">
                Join thousands of active residents making our city cleaner and safer every day.
              </p>
            </div>

            <Link
              href={user ? "/report" : "/login"}
              className="px-8 py-3.5 rounded-full bg-[#f06424] hover:bg-[#d95214] text-white font-headline font-black text-xs shadow-xl shadow-orange-600/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2 shrink-0"
            >
              <span>Report an Issue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

      {/* STORY MODAL DIALOG */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="relative h-56">
              <img src={selectedStory.image} alt={selectedStory.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <Leaf className="w-3.5 h-3.5" />
                <span>Civic Impact Story • {selectedStory.readTime}</span>
              </div>
              <h3 className="font-headline font-black text-xl text-slate-900">
                {selectedStory.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedStory.content}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSelectedStory(null)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                >
                  Close Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
