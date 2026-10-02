"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CivicIssue } from "@/lib/data/mock-data";
import { upvoteIssue, downvoteIssue } from "@/lib/api/issues";
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  MapPin,
  Bot,
  Clock,
  MoreVertical,
  Trash2,
  ArrowRight,
  Check,
  Lightbulb,
  ShieldCheck
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { useApp } from "@/lib/context/app-context";
import { useAutoTranslate } from "@/lib/services/translation-service";

interface IssueCardProps {
  issue: CivicIssue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const { deleteIssue, user, toggleUpvote, language } = useApp();
  const { translated: translatedTitle } = useAutoTranslate(issue.title, language);
  const { translated: translatedDesc } = useAutoTranslate(issue.description, language);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isOwner = user && (user.id === (issue.reporter as any).id || user.username === issue.reporter.username || user.name === issue.reporter.name || user.email === issue.reporter.name);

  const isInnovation = Boolean(
    issue.category === "Innovation" ||
    issue.isInnovation ||
    (issue as any).aiAnalysis?.is_innovation ||
    (issue as any).ai_analysis?.is_innovation
  );

  const [localUpvotes, setLocalUpvotes] = useState(issue.upvotes || 0);
  const [localIsUpvoted, setLocalIsUpvoted] = useState(Boolean(issue.isUpvoted));

  React.useEffect(() => {
    setLocalUpvotes(issue.upvotes || 0);
    setLocalIsUpvoted(Boolean(issue.isUpvoted));
  }, [issue.upvotes, issue.isUpvoted]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined") return;

    const shareUrl = `${window.location.origin}/issues/${issue.id}`;
    const shareData = {
      title: issue.title || "JanSeva Civic Report",
      text: `Civic report in ${issue.location?.ward || "community"}: ${issue.title}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          console.warn("Native share fallback to clipboard:", err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (clipErr) {
      console.error("Clipboard copy error:", clipErr);
    }
  };

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasUpvoted = localIsUpvoted;
    setLocalIsUpvoted(!wasUpvoted);
    setLocalUpvotes(prev => wasUpvoted ? Math.max(0, prev - 1) : prev + 1);

    toggleUpvote(issue.id);
  };

  // Helper for urgency badge styling
  const renderUrgencyBadge = (urgency: string) => {
    const u = urgency?.toUpperCase() || "HIGH";
    if (u === "CRITICAL") {
      return (
        <span className="border border-rose-500 text-rose-600 bg-rose-50/40 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
          CRITICAL
        </span>
      );
    }
    if (u === "HIGH") {
      return (
        <span className="border border-[#b58117] text-[#976807] bg-amber-50/40 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
          HIGH
        </span>
      );
    }
    if (u === "MODERATE") {
      return (
        <span className="border border-blue-400 text-blue-700 bg-blue-50/40 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
          MODERATE
        </span>
      );
    }
    return (
      <span className="border border-slate-300 text-slate-600 bg-slate-50/40 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
        LOW
      </span>
    );
  };

  // Helper for status badge
  const renderStatusBadge = (status: string) => {
    return (
      <span className="border border-slate-300 text-slate-700 bg-white text-[11px] font-medium px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
        <Clock className="w-3 h-3 text-slate-500" />
        <span>{status || "Reported"}</span>
      </span>
    );
  };

  return (
    <article className="rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
      <div>

        {/* Top Header: Avatar + Handle + Timestamp + Location & Badges + 3-dots */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3">

          {/* Author Info */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs bg-[#f4fbf7] flex items-center justify-center">
              <span className="text-[10px] font-black text-[#134431]">#{issue.id.slice(0, 4)}</span>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                  Ticket #{issue.id}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-normal shrink-0">
                  - {formatDate(issue.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                <MapPin className="w-3 h-3 text-[#134431] shrink-0" />
                {((issue as any).pin_code || (issue as any).pincode || issue.location?.pincode || issue.location?.address?.match(/\b\d{6}\b/)?.[0]) && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#edf7f1] text-[#134431] text-[10px] font-bold border border-[#cbe7d7] shrink-0">
                    PIN {(issue as any).pin_code || (issue as any).pincode || issue.location?.pincode || issue.location?.address?.match(/\b\d{6}\b/)?.[0]}
                  </span>
                )}
                <span className="truncate max-w-[140px] sm:max-w-xs">{issue.location.address}</span>
              </div>
            </div>
          </div>

          {/* Right Section: 3 dots + Status & Urgency Badges */}
          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 pt-1 sm:pt-0">
            {/* Badges Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {isInnovation ? (
                <>
                  <span className="border border-emerald-500 text-emerald-800 bg-emerald-50 text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                    <Lightbulb className="w-3 h-3 text-emerald-600" />
                    <span>Community Innovation</span>
                  </span>
                  {issue.officerVerdict && (
                    <span className={cn(
                      "text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs border",
                      issue.officerVerdict === "Feasibility Approved" || issue.officerVerdict === "Pilot Scheduled"
                        ? "border-emerald-600 text-emerald-900 bg-emerald-100"
                        : issue.officerVerdict === "Budget Allocated"
                        ? "border-purple-500 text-purple-900 bg-purple-100"
                        : "border-amber-400 text-amber-900 bg-amber-50"
                    )}>
                      <span>🏛️ {issue.officerVerdict}</span>
                    </span>
                  )}
                  {renderStatusBadge(issue.status)}
                </>
              ) : (
                <>
                  {((issue.timesReported && issue.timesReported > 1) || ((issue as any).times_reported && (issue as any).times_reported > 1)) && (
                    <span className="border border-purple-300 text-purple-700 bg-purple-50 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                      <span>⚡ Reported {issue.timesReported || (issue as any).times_reported}x</span>
                    </span>
                  )}
                  {renderStatusBadge(issue.status)}
                  {renderUrgencyBadge(issue.urgency)}
                </>
              )}
            </div>

            {/* 3-dots Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
                aria-label="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 overflow-hidden animate-fadeIn">
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this issue?")) {
                          deleteIssue(issue.id);
                        }
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 min-h-[44px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 min-h-[44px]"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Title & Description */}
        <div className="mt-2 mb-3">
          <Link href={`/issues/${issue.id}`} className="block group-hover:text-emerald-800 transition-colors">
            <h3 className="font-headline font-bold text-base sm:text-xl text-slate-900 leading-snug mb-1 flex items-center justify-between gap-2">
              <span>{translatedTitle || issue.title}</span>
              {language !== "en" && translatedTitle !== issue.title && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  🌐 Translated
                </span>
              )}
            </h3>
          </Link>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
            {translatedDesc || issue.description}
          </p>
        </div>

        {/* Image Showcase with Category/Ticket Overlay */}
        <div className="relative rounded-2xl overflow-hidden mb-3 aspect-[16/10] sm:aspect-video w-full bg-slate-100 border border-slate-100">
          <img
            src={issue.images.reported || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80"}
            alt={issue.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />

          {/* Dark Overlay Pill (Category - Ticket #ID) */}
          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-sm text-white text-[11px] font-bold shadow-md tracking-wide max-w-[calc(100%-20px)] truncate">
            {issue.category} - Ticket #{issue.id}
          </div>
        </div>

        {/* Triage / Proposal Card */}
        {isInnovation ? (
          <div className="rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border border-emerald-200/90 mb-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-950">
                <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">Theme: {issue.innovationTheme || (issue as any).aiAnalysis?.innovation_theme || "Community Solution"}</span>
              </div>
              {issue.estimatedBudget && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300 text-emerald-900 bg-white shadow-2xs">
                  Est. Budget: {issue.estimatedBudget}
                </span>
              )}
            </div>

            {issue.communityBenefit && (
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                <strong>Community Benefit:</strong> {issue.communityBenefit}
              </p>
            )}

            {issue.officerFeedback && (
              <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-300 text-xs text-emerald-950 font-medium space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Officer Feasibility Assessment:</span>
                </div>
                <p className="italic text-slate-700">"{issue.officerFeedback}"</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-emerald-800 border-t border-emerald-200/60 pt-2 mt-1 flex-wrap gap-1">
              <span className="truncate max-w-[220px]">
                Review Body: <strong className="text-emerald-950 font-bold">{issue.assignedDepartment || "Ward Innovation Council"}</strong>
              </span>
              <span className="font-semibold text-emerald-700">
                Status: {issue.officerVerdict || issue.status || "Under Review"}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-3 sm:p-4 bg-[#f4f9f8] border border-[#d6ebe2] mb-3 space-y-2">
            {/* Top Row: AI Triage Label + Confidence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#0f5b49]">
                <Bot className="w-4 h-4 text-[#0f5b49] shrink-0" />
                <span className="truncate">
                  AI Triage: {issue.aiAnalysis?.detectedObject ? issue.aiAnalysis.detectedObject : "Pending Classification"}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 text-slate-500 bg-white shadow-2xs shrink-0">
                {issue.aiAnalysis?.confidence ? `${issue.aiAnalysis.confidence}%` : "N/A"}
              </span>
            </div>

            {/* Middle Row: AI Summary / Dispatch Status */}
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
              {issue.aiAnalysis?.summary || "Pending review by dispatch."}
            </p>

            {/* Bottom Row: Routed To + SLA */}
            <div className="flex items-center justify-between text-xs text-slate-600 border-t border-[#e2efe9] pt-2 mt-1 flex-wrap gap-1">
              <span className="truncate max-w-[200px]">
                Routed to: <strong className="text-[#0f5b49] font-bold">{issue.assignedDepartment || "Municipal Dispatch"}</strong>
              </span>
              <span className="font-semibold text-slate-500">
                SLA: ~{issue.aiAnalysis?.suggestedSlaHours ? `${issue.aiAnalysis.suggestedSlaHours}h` : "24h"}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs gap-2 flex-wrap sm:flex-nowrap">

        {/* Left Actions: Upvote, Comment, Share */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Upvote / Endorse */}
          <button
            type="button"
            onClick={handleUpvote}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all select-none min-h-[44px] cursor-pointer",
              isInnovation
                ? localIsUpvoted
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                : localIsUpvoted
                ? "bg-[#edf7f1] text-[#134431] border border-[#cbe7d7]"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            )}
          >
            <ThumbsUp className={cn("w-4 h-4", localIsUpvoted ? (isInnovation ? "fill-white text-white" : "fill-[#134431] text-[#134431]") : "text-slate-600")} />
            <span>{isInnovation ? (localIsUpvoted ? "Endorsed" : "Endorse Idea") : localUpvotes}</span>
            {isInnovation && (
              <span className={cn("px-1.5 py-0.2 rounded-full text-[10px] font-black", localIsUpvoted ? "bg-emerald-800 text-white" : "bg-white text-emerald-900 border border-emerald-200")}>
                {localUpvotes}
              </span>
            )}
          </button>

          {/* Comments Link */}
          <Link
            href={`/issues/${issue.id}#comments`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors min-h-[44px]"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span>{issue.commentsCount || 0}</span>
          </Link>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Share issue"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>

        </div>

        {/* Right Action: Track Live -> */}
        <Link
          href={`/issues/${issue.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#edf7f1] text-[#134431] text-xs font-bold hover:bg-[#cbe7d7] transition-all min-h-[44px] ml-auto sm:ml-0"
        >
          <span>Track Live</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

      </div>
    </article>
  );
}
