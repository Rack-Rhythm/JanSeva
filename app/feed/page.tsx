"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context/app-context";
import { getFeed } from "@/lib/api/issues";
import { CivicIssue } from "@/lib/data/mock-data";
import { useSearchParams } from "next/navigation";
import { IssueCard } from "@/components/feed/issue-card";
import { WeatherWidget } from "@/components/feed/weather-widget";
import { LeaderboardWidget } from "@/components/feed/leaderboard-widget";
import { CategoryPill } from "@/components/ui/category-pill";
import { Award, Camera, MapPin, Search, Filter, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, X, Clock, Settings, LogOut, Sparkles, Layers, ArrowUpDown, Globe2, Navigation, Edit3, RefreshCw, Megaphone, ShieldCheck } from "lucide-react";
import { GUEST_USER } from "@/lib/data/default-location";
import { AnnouncementCardModal } from "@/components/announcements/announcement-card-modal";
import { OfficialAnnouncement } from "@/lib/data/mock-data";
import { cn } from "@/lib/utils";

function FeedPageContent() {
  const searchParams = useSearchParams();
  const initialPinParam = searchParams.get("pin") || "";
  const initialScopeParam = searchParams.get("scope") as "local" | "global" | null;
  const initialQParam = searchParams.get("q") || "";
  const initialAnnouncementIdParam = searchParams.get("announcementId") || "";

  const { user, issues, refreshIssues, isLoadingAuth, t, language, announcements, fetchAnnouncements } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hyperlocal Announcement Modal Popup State
  const [selectedAnnouncementForModal, setSelectedAnnouncementForModal] = useState<OfficialAnnouncement | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [hasAutoOpenedPopup, setHasAutoOpenedPopup] = useState(false);

  // Feed Scope: "local" (default start with local pincode) or "global" (all areas)
  const [feedScope, setFeedScope] = useState<"local" | "global">(initialScopeParam || (initialPinParam ? "local" : "local"));
  const [localPincode, setLocalPincode] = useState<string>(initialPinParam || user?.pincode || "751024");
  const [pincodeSearchInput, setPincodeSearchInput] = useState<string>(initialPinParam || user?.pincode || "751024");
  const [isLocating, setIsLocating] = useState(false);

  const getIssuePin = (issue: CivicIssue): string => {
    if ((issue as any).pin_code) return String((issue as any).pin_code).trim();
    if ((issue as any).pincode) return String((issue as any).pincode).trim();
    if (issue.location?.pincode) return String(issue.location.pincode).trim();
    const address = issue.location?.address || "";
    const match = address.match(/\b\d{6}\b/);
    if (match) return match[0];
    return "";
  };

  // Collect all available unique PIN codes present across all reported problems
  const availablePincodes = React.useMemo(() => {
    const pinCounts: Record<string, number> = {};
    issues.forEach((issue) => {
      const pin = getIssuePin(issue);
      if (pin) {
        pinCounts[pin] = (pinCounts[pin] || 0) + 1;
      }
    });
    return Object.entries(pinCounts).map(([pin, count]) => ({ pin, count }));
  }, [issues]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshIssues();
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (!issues || issues.length === 0) {
      refreshIssues();
    }
  }, []);

  React.useEffect(() => {
    if (initialPinParam) {
      setLocalPincode(initialPinParam);
      setPincodeSearchInput(initialPinParam);
      setFeedScope("local");
    } else if (user?.pincode) {
      setLocalPincode(user.pincode);
      setPincodeSearchInput(user.pincode);
    } else if (availablePincodes.length > 0 && !localPincode) {
      setLocalPincode(availablePincodes[0].pin);
      setPincodeSearchInput(availablePincodes[0].pin);
    }
  }, [user?.pincode, availablePincodes, initialPinParam]);

  const handlePincodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincodeSearchInput.trim().replace(/\D/g, '');
    if (cleanPin.length > 0) {
      setLocalPincode(cleanPin);
      setFeedScope("local");
    }
  };

  const handleDetectGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const detectedPin = data.address?.postcode?.replace(/\D/g, "") || "751024";
          setLocalPincode(detectedPin);
          setPincodeSearchInput(detectedPin);
          setFeedScope("local");
        } catch (e) {
          console.error("GPS Reverse Geocode Error", e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation permission error:", err);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const [activeTab, setActiveTab] = useState<"all" | "critical" | "resolved" | "in_progress">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState(initialQParam);
  const [sortBy, setSortBy] = useState<"upvotes" | "recent" | "urgency">("recent");

  const categories = ["All", "Innovation", "Sanitation", "Roads", "Water", "Electricity", "Waste", "Traffic", "Parks"];

  const filteredIssues = issues
    .filter((issue) => {
      // 1. Global vs Local (Pincode) Scope Filter
      if (feedScope === "local") {
        const issuePincode = getIssuePin(issue);
        const address = (issue.location?.address || "").toLowerCase();
        const pinMatch = issuePincode === localPincode.trim() || address.includes(localPincode.trim());
        if (!pinMatch) return false;
      }

      // 2. Status Tab filter
      if (activeTab === "critical" && issue.urgency !== "Critical") return false;
      if (activeTab === "resolved" && issue.status !== "Resolved" && issue.status !== "Verified Resolved") return false;
      if (activeTab === "in_progress" && issue.status !== "In Progress" && issue.status !== "Assigned") return false;

      // 3. Category filter
      if (selectedCategory !== "All") {
        if (selectedCategory === "Innovation") {
          const isInnov = issue.category === "Innovation" || issue.isInnovation || (issue as any).aiAnalysis?.is_innovation;
          if (!isInnov) return false;
        } else if (issue.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 4. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (issue.title || "").toLowerCase().includes(q);
        const matchesDesc = (issue.description || "").toLowerCase().includes(q);
        const matchesAddress = (issue.location?.address || "").toLowerCase().includes(q);
        const matchesId = (issue.id || "").toLowerCase().includes(q);
        const matchesPin = getIssuePin(issue).includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAddress && !matchesId && !matchesPin) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "upvotes") return (b.upvotes || 0) - (a.upvotes || 0);
      if (sortBy === "recent") {
        const timeB = new Date(b.createdAt || (b as any).created_at || 0).getTime();
        const timeA = new Date(a.createdAt || (a as any).created_at || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === "urgency") {
        const order: Record<string, number> = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
        return (order[b.urgency] || 0) - (order[a.urgency] || 0);
      }
      return 0;
    });

  const localCount = issues.filter(i => {
    const p = getIssuePin(i);
    return p === localPincode.trim() || (i.location?.address || "").includes(localPincode.trim());
  }).length;
  const globalCount = issues.length;

  // Active Announcements for currently selected PIN
  const activePinAnnouncements = React.useMemo(() => {
    if (!announcements || announcements.length === 0) return [];
    return announcements.filter((ann) => {
      if (ann.isActive === false) return false;
      if (feedScope === "global") return true;
      const targetPins = ann.pincodes && ann.pincodes.length > 0 ? ann.pincodes : ["ALL"];
      if (targetPins.includes("ALL") || targetPins.includes("all")) return true;
      return targetPins.some((p) => p.trim() === localPincode.trim());
    });
  }, [announcements, feedScope, localPincode]);

  // Auto-trigger announcement modal popup on feed load if there is an active advisory
  useEffect(() => {
    if (activePinAnnouncements.length === 0 || hasAutoOpenedPopup) return;

    let targetAnnouncement: OfficialAnnouncement | undefined;
    if (initialAnnouncementIdParam) {
      targetAnnouncement = activePinAnnouncements.find(
        (a) => String(a.id) === initialAnnouncementIdParam
      );
    }

    if (!targetAnnouncement) {
      let dismissed: string[] = [];
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("janseva_dismissed_announcements") : null;
        if (stored) dismissed = JSON.parse(stored);
      } catch (e) {}

      targetAnnouncement = activePinAnnouncements.find(
        (a) => !dismissed.includes(String(a.id))
      );
    }

    if (targetAnnouncement) {
      setSelectedAnnouncementForModal(targetAnnouncement);
      setIsAnnouncementModalOpen(true);
      setHasAutoOpenedPopup(true);
    }
  }, [activePinAnnouncements, hasAutoOpenedPopup, initialAnnouncementIdParam]);

  const handleDismissForever = (id: string | number) => {
    try {
      let dismissed: string[] = [];
      const stored = typeof window !== "undefined" ? localStorage.getItem("janseva_dismissed_announcements") : null;
      if (stored) dismissed = JSON.parse(stored);
      if (!dismissed.includes(String(id))) {
        dismissed.push(String(id));
        localStorage.setItem("janseva_dismissed_announcements", JSON.stringify(dismissed));
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header & Quick Report Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline font-black text-xl sm:text-3xl text-slate-900 tracking-tight leading-tight">
              {feedScope === "local" 
                ? `Local PIN ${localPincode} Feed`
                : "Global Community Feed"}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7f1] text-[#134431] border border-[#cbe7d7] flex items-center gap-1 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer disabled:opacity-50 min-h-[36px] active:scale-95"
              title="Refresh latest issues"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-emerald-700", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? "..." : "Refresh"}</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {feedScope === "local"
              ? `Neighborhood reports & verified municipal repairs in PIN ${localPincode}.`
              : "Browse public reports and verified civic repairs across all municipal areas."}
          </p>
        </div>

        <Link
          href={user ? "/report" : "/login"}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-98 transition-all shrink-0 min-h-[44px]"
        >
          <Camera className="w-4 h-4 text-emerald-300" />
          <span>AI Quick Snap Report</span>
        </Link>
      </div>

      {/* Main Dual Feed Switcher (Local vs Global) & Pincode Search Box */}
      <div className="bg-white p-2.5 sm:p-3 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Feed Scope Segmented Control */}
          <div className="flex items-center p-1 bg-[#f1f5f3] rounded-2xl border border-slate-200/60 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setFeedScope("local")}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer min-h-[40px]",
                feedScope === "local"
                  ? "bg-[#134431] text-white shadow-md shadow-emerald-950/15"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="truncate">Local (PIN: {localPincode})</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                feedScope === "local" ? "bg-emerald-700 text-emerald-100" : "bg-slate-200 text-slate-600"
              )}>
                {localCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFeedScope("global")}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer min-h-[40px]",
                feedScope === "global"
                  ? "bg-[#134431] text-white shadow-md shadow-emerald-950/15"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span className="truncate">Global Feed</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                feedScope === "global" ? "bg-emerald-700 text-emerald-100" : "bg-slate-200 text-slate-600"
              )}>
                {globalCount}
              </span>
            </button>
          </div>

          {/* Pincode Search & GPS Detect Box */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <form onSubmit={handlePincodeSearch} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <MapPin className="w-3.5 h-3.5 text-[#134431] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeSearchInput}
                  onChange={(e) => setPincodeSearchInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Filter PIN..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#f8faf9] border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-[#134431] text-slate-900 placeholder:text-slate-400 font-medium min-h-[40px]"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs min-h-[40px]"
              >
                Go
              </button>
            </form>

            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="px-3 py-2 rounded-xl bg-[#edf7f1] hover:bg-[#cbe7d7] text-[#134431] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#cbe7d7] shrink-0 min-h-[40px] cursor-pointer"
              title="Detect your current location PIN"
            >
              <Navigation className={cn("w-3.5 h-3.5 text-[#134431]", isLocating && "animate-spin")} />
              <span>{isLocating ? "..." : "My GPS"}</span>
            </button>
          </div>

        </div>

        {/* Active Hyperlocal PIN Chips */}
        {availablePincodes.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
              <MapPin className="w-3 h-3 text-[#134431]" /> Active Zones:
            </span>
            {availablePincodes.map(({ pin, count }) => (
              <button
                key={pin}
                type="button"
                onClick={() => {
                  setLocalPincode(pin);
                  setPincodeSearchInput(pin);
                  setFeedScope("local");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer",
                  feedScope === "local" && localPincode === pin
                    ? "bg-[#134431] text-white shadow-xs"
                    : "bg-[#f1f5f3] text-slate-700 hover:bg-[#edf7f1] hover:text-[#134431]"
                )}
              >
                <span>PIN {pin}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  feedScope === "local" && localPincode === pin ? "bg-emerald-700 text-emerald-100" : "bg-slate-200 text-slate-600"
                )}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        
        {/* Main Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: t("home") ? `${t("home")} (${t("all" as any) || "All"})` : "All Statuses" },
            { id: "critical", label: `🔥 ${t("critical") || "Critical"}` },
            { id: "in_progress", label: `⚡ ${t("inProgress") || "In Progress"}` },
            { id: "resolved", label: `✓ ${t("resolved") || "Resolved"}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 select-none cursor-pointer",
                activeTab === tab.id
                  ? "bg-[#134431] text-white shadow-md shadow-emerald-950/15"
                  : "bg-white text-slate-700 hover:bg-[#edf7f1] hover:text-[#134431] border border-slate-200/80 shadow-2xs"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pills & Sorting Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-sm">
          
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <CategoryPill
                key={cat}
                category={cat}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}
          </div>

          {/* Search & Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder") || "Filter by keyword / ID..."}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#f8faf9] border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-[#134431] text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0 bg-[#f8faf9] px-2.5 py-1 rounded-xl border border-slate-200/80">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#134431]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="upvotes">Most Upvoted</option>
                <option value="recent">Newest First</option>
                <option value="urgency">Urgency First</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Feed Stream (Left 2 cols) + Widgets (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Feed Stream */}
        <div className="lg:col-span-2 space-y-6">
          {/* HYPERLOCAL OFFICIAL ADVISORY BANNER */}
          {activePinAnnouncements.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              {activePinAnnouncements.map((ann) => {
                const isEmergency = ann.urgency === "Emergency";
                return (
                  <div
                    key={ann.id}
                    onClick={() => {
                      setSelectedAnnouncementForModal(ann);
                      setIsAnnouncementModalOpen(true);
                    }}
                    className={cn(
                      "p-4 sm:p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer group",
                      isEmergency
                        ? "bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/50 border-rose-200 hover:border-rose-400"
                        : "bg-gradient-to-r from-[#edf7f1] via-[#f4fbf7] to-white border-[#cbe7d7] hover:border-emerald-500"
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform",
                        isEmergency ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-[#134431] text-emerald-100"
                      )}>
                        <Megaphone className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                              isEmergency ? "bg-rose-600 text-white" : "bg-[#134431] text-emerald-100"
                            )}>
                              {isEmergency ? "🔴 Emergency Advisory" : "📢 Official Municipal Advisory"}
                            </span>

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white text-slate-700 border border-slate-200">
                              {ann.department || "Municipal Corporation"}
                            </span>

                            {ann.pincodes && ann.pincodes.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-800 text-emerald-100">
                                📍 PIN {ann.pincodes.join(", ")}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-bold text-emerald-700 group-hover:underline flex items-center gap-0.5">
                            Inspect Card <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>

                        <h3 className="font-headline font-black text-sm sm:text-base text-slate-900 leading-snug pt-0.5 group-hover:text-emerald-950 transition-colors">
                          {ann.title}
                        </h3>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-2">
                          {ann.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                          <span>Dispatched by {ann.authorName || "Department Authority"}</span>
                          <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isLoadingAuth && issues.length === 0 ? (
            <div className="rounded-3xl bg-white border border-surface-container-high p-12 text-center">
              <div className="w-8 h-8 rounded-full border-4 border-[#134431] border-t-transparent animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-slate-600">Loading community feed...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold border border-amber-200">
                📍
              </div>
              <div className="space-y-1">
                <h3 className="font-headline font-bold text-base text-slate-900">
                  {feedScope === "local"
                    ? `No active reports in PIN ${localPincode}`
                    : "No issues match your current filters"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {feedScope === "local"
                    ? `There are ${globalCount} total reports logged across other municipal PIN codes.`
                    : "Try resetting your search query or selecting 'All Statuses'."}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                {feedScope === "local" && (
                  <button
                    type="button"
                    onClick={() => setFeedScope("global")}
                    className="px-4 py-2 rounded-xl bg-[#134431] text-white font-bold text-xs hover:bg-[#0c2e21] shadow-xs cursor-pointer"
                  >
                    View Global Feed ({globalCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("all");
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#edf7f1] text-[#134431] font-bold text-xs hover:bg-[#cbe7d7] border border-[#cbe7d7] cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>

        {/* Right 1 Column: Sticky Civic Intelligence Widgets */}
        <div className="space-y-6">
          <WeatherWidget />
          <LeaderboardWidget />
        </div>

      </div>

      {/* Interactive Official Announcement Popup Card */}
      <AnnouncementCardModal
        announcement={selectedAnnouncementForModal}
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onDismissForever={handleDismissForever}
      />

    </div>
  );
}

export default function FeedPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-8 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#134431] border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">Loading Civic Live Feed...</p>
        </div>
      }
    >
      <FeedPageContent />
    </React.Suspense>
  );
}

