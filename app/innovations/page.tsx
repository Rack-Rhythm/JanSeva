"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context/app-context";
import { InnovationCard } from "@/components/innovations/innovation-card";
import { SuggestInnovationModal } from "@/components/innovations/suggest-innovation-modal";
import {
  Lightbulb,
  Sparkles,
  PlusCircle,
  Search,
  Filter,
  TrendingUp,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Rocket,
  DollarSign,
  ArrowUpDown,
  Navigation,
  Globe2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InnovationsPage() {
  const { issues, user, refreshIssues } = useApp();

  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("All Themes");
  const [statusFilter, setStatusFilter] = useState<"all" | "review" | "approved" | "pilot">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [scope, setScope] = useState<"all" | "local">("all");

  const userPincode = user?.pincode || (user as any)?.wardDetails?.pincode || "";

  // Filter only issues that are community innovations
  const innovationIssues = useMemo(() => {
    return issues.filter((i) => {
      return (
        i.category === "Innovation" ||
        i.isInnovation === true ||
        Boolean((i as any).aiAnalysis?.is_innovation) ||
        Boolean((i as any).ai_analysis?.is_innovation)
      );
    });
  }, [issues]);

  // Dynamically extract themes from current active proposals - no hardcoded categories
  const dynamicThemes = useMemo(() => {
    const themeSet = new Set<string>();
    themeSet.add("All Themes");
    innovationIssues.forEach((item) => {
      const theme = item.innovationTheme || (item as any).aiAnalysis?.innovation_theme || (item as any).aiAnalysis?.innovationTheme;
      if (theme && typeof theme === "string" && theme.trim()) {
        themeSet.add(theme.trim());
      }
    });
    // Seed sensible defaults only if no proposals exist yet
    if (themeSet.size === 1) {
      themeSet.add("Sustainable Mobility & Bike Shelters");
      themeSet.add("Urban Heat & Cooling Systems");
      themeSet.add("Clean Energy & Solar Canopies");
      themeSet.add("Parks & Green Public Spaces");
      themeSet.add("Water Conservation & Catchment");
      themeSet.add("Smart Waste & Circular Economy");
    }
    return Array.from(themeSet);
  }, [innovationIssues]);

  // Compute dynamic stats from active innovation data
  const stats = useMemo(() => {
    const total = innovationIssues.length;
    const votes = innovationIssues.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
    const approved = innovationIssues.filter(
      (i) => i.officerVerdict === "Feasibility Approved" || i.status === "Feasibility Approved"
    ).length;
    const pilots = innovationIssues.filter(
      (i) => i.officerVerdict === "Pilot Scheduled" || i.officerVerdict === "Budget Allocated" || i.status === "Pilot Scheduled"
    ).length;
    return { total, votes, approved, pilots };
  }, [innovationIssues]);

  // Filtered and sorted innovation items
  const filteredInnovations = useMemo(() => {
    return innovationIssues
      .filter((item) => {
        // Local PIN / Ward filter
        if (scope === "local" && userPincode) {
          const itemPin = (item as any).pin_code || (item as any).pincode || item.location?.pincode || "";
          const address = (item.location?.address || "").toLowerCase();
          if (itemPin !== userPincode && !address.includes(userPincode)) {
            return false;
          }
        }

        // Status tab filter
        if (statusFilter === "review") {
          const v = item.officerVerdict || item.status;
          if (v !== "Under Review" && v !== "Reported") return false;
        } else if (statusFilter === "approved") {
          const v = item.officerVerdict || item.status;
          if (v !== "Feasibility Approved") return false;
        } else if (statusFilter === "pilot") {
          const v = item.officerVerdict || item.status;
          if (v !== "Pilot Scheduled" && v !== "Budget Allocated") return false;
        }

        // Theme filter
        if (selectedTheme !== "All Themes") {
          const t = (item.innovationTheme || (item as any).aiAnalysis?.innovation_theme || "").toLowerCase();
          if (!t.includes(selectedTheme.toLowerCase().slice(0, 10))) {
            return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (item.title || "").toLowerCase().includes(q);
          const matchDesc = (item.description || "").toLowerCase().includes(q);
          const matchLoc = (item.location?.address || "").toLowerCase().includes(q);
          const matchTheme = (item.innovationTheme || "").toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc && !matchTheme) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "votes") {
          return (b.upvotes || 0) - (a.upvotes || 0);
        }
        const timeB = new Date(b.createdAt || 0).getTime();
        const timeA = new Date(a.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [innovationIssues, scope, userPincode, statusFilter, selectedTheme, searchQuery, sortBy]);

  const isOfficer = Boolean(
    user && (user.role === "officer" || user.role === "corporator" || (user.role as string) === "admin")
  );

  return (
    <div className="space-y-6 pb-20 font-body animate-fadeIn">
      
      {/* 1. HERO & TELEMETRY BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c2e21] via-[#134431] to-[#1c5d44] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>Citizen-Led Civic R&amp;D Hub</span>
          </div>

          <h1 className="font-headline font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
            Community Innovation &amp; Idea Incubator
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
            Propose bold public infrastructure solutions—like solar bike shelters, ultrasonic parking cooling canopies, or bioswale parklets. The community votes to prioritize, and ward municipal officers conduct on-site feasibility audits for municipal funding.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSuggestModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white text-[#134431] hover:bg-emerald-50 font-headline font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#134431]" />
              <span>Suggest New Innovation</span>
            </button>

            <Link
              href="/feed"
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>View in Live Civic Feed</span>
              <span className="text-emerald-300">→</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none hidden md:block" />
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. DYNAMIC LIVE STATS GAUGES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Ideas */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Proposals</span>
            <Lightbulb className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-headline font-black text-2xl sm:text-3xl text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-500">Citizen submitted concepts</p>
        </div>

        {/* Citizen Endorsement Votes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Citizen Endorsements</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-headline font-black text-2xl sm:text-3xl text-emerald-800">{stats.votes}</p>
          <p className="text-[11px] text-emerald-700 font-semibold">Community backing votes</p>
        </div>

        {/* Feasibility Approved */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Feasibility Approved</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="font-headline font-black text-2xl sm:text-3xl text-teal-800">{stats.approved}</p>
          <p className="text-[11px] text-slate-500">Reviewed by Ward Officers</p>
        </div>

        {/* Ward Pilots Scheduled */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pilots Scheduled</span>
            <Rocket className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-headline font-black text-2xl sm:text-3xl text-purple-800">{stats.pilots}</p>
          <p className="text-[11px] text-slate-500">Budget &amp; site allocated</p>
        </div>

      </div>

      {/* 3. OFFICER IDENTITY NOTIFICATION BANNER (if officer logged in) */}
      {isOfficer && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#134431] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-950">Authority Officer Review Console Enabled</p>
              <p className="text-[11px] text-emerald-800">
                You have municipal evaluation privileges. Tap "Evaluate" on any proposal card to update feasibility verdicts or assign ward budgets.
              </p>
            </div>
          </div>
          <Link
            href={`/officer/${user?.department ? user.department.toLowerCase() : "water"}?tab=innovations`}
            className="px-4 py-2 rounded-2xl bg-[#134431] text-white text-xs font-bold hover:bg-[#0c2e21] transition-colors shrink-0 text-center"
          >
            Open Officer Queue →
          </Link>
        </div>
      )}

      {/* 4. FILTERS & SEARCH TOOLBAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-4">
        
        {/* Top Controls: Search + Scope + Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search bike shelters, cooling systems, solar, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Right Filters: Scope + Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* PIN Scope Toggle */}
            <div className="p-1 rounded-2xl bg-slate-100 flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5",
                  scope === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                <span>All Cities ({stats.total})</span>
              </button>
              <button
                type="button"
                onClick={() => setScope("local")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5",
                  scope === "local" ? "bg-[#134431] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>{userPincode ? `My PIN ${userPincode}` : "My Ward / City"}</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="votes">🔥 Most Endorsed</option>
                <option value="recent">⚡ Latest Proposals</option>
              </select>
            </div>

          </div>

        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          {[
            { id: "all", label: `All Proposals (${stats.total})` },
            { id: "approved", label: `✅ Feasibility Approved (${stats.approved})` },
            { id: "pilot", label: `🚀 Pilots Scheduled (${stats.pilots})` },
            { id: "review", label: "🟡 Pending Review" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                statusFilter === tab.id
                  ? "bg-[#134431] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Theme Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {dynamicThemes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTheme(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap border",
                selectedTheme === t
                  ? "bg-emerald-50 text-emerald-950 border-emerald-400 font-bold"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {t}
            </button>
          ))}
        </div>

      </div>

      {/* 5. CARDS GRID */}
      {filteredInnovations.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#134431] border border-emerald-200 flex items-center justify-center mx-auto text-2xl font-bold shadow-sm">
            💡
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-headline font-black text-lg text-slate-900">
              No Innovation Proposals Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {scope === "local"
                ? `No community innovations have been suggested in PIN ${userPincode} yet.`
                : "No proposals match your current keyword or theme filter."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsSuggestModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              <span>Suggest the First Innovation</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScope("all");
                setSelectedTheme("All Themes");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInnovations.map((issue) => (
            <InnovationCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {/* Suggest Modal */}
      <SuggestInnovationModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        defaultPincode={userPincode}
      />

    </div>
  );
}
