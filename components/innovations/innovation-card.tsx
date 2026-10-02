"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CivicIssue } from "@/lib/data/mock-data";
import { useApp } from "@/lib/context/app-context";
import { OfficerFeasibilityModal } from "./officer-feasibility-modal";
import { formatDate, cn } from "@/lib/utils";
import {
  Lightbulb,
  ThumbsUp,
  MapPin,
  Share2,
  Check,
  ShieldCheck,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Building2,
  DollarSign
} from "lucide-react";

interface InnovationCardProps {
  issue: CivicIssue;
}

export function InnovationCard({ issue }: InnovationCardProps) {
  const { user, toggleUpvote } = useApp();

  const [copied, setCopied] = useState(false);
  const [isFeasibilityModalOpen, setIsFeasibilityModalOpen] = useState(false);

  const localUpvotes = issue.upvotes || 0;
  const localIsUpvoted = Boolean(issue.isUpvoted);

  const isOfficer = Boolean(
    user && (user.role === "officer" || user.role === "corporator" || (user.role as string) === "admin")
  );

  const themeTag = issue.innovationTheme || (issue as any).aiAnalysis?.innovation_theme || (issue as any).aiAnalysis?.innovationTheme || "Community Solution";
  const pinCode = (issue as any).pin_code || (issue as any).pincode || issue.location?.pincode || issue.location?.address?.match(/\b\d{6}\b/)?.[0] || "";

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/innovations#${issue.id}` : "";
    const shareData = {
      title: issue.title || "Community Innovation Proposal",
      text: `Vote for this community innovation in ${issue.location?.ward || "our ward"}: ${issue.title}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleUpvote(issue.id);
  };

  // Status Badge styling helper
  const getVerdictBadge = () => {
    const v = issue.officerVerdict || issue.status || "Under Review";
    if (v === "Feasibility Approved") {
      return {
        bg: "bg-emerald-50 text-emerald-900 border-emerald-300",
        label: "✅ Feasibility Approved for Ward Pilot"
      };
    }
    if (v === "Pilot Scheduled") {
      return {
        bg: "bg-blue-50 text-blue-900 border-blue-300",
        label: "🚀 Pilot Scheduled in Ward"
      };
    }
    if (v === "Budget Allocated") {
      return {
        bg: "bg-purple-50 text-purple-900 border-purple-300",
        label: "💰 Ward Budget Allocated"
      };
    }
    return {
      bg: "bg-amber-50 text-amber-900 border-amber-300",
      label: "🟡 Under Officer Feasibility Review"
    };
  };

  const verdictBadge = getVerdictBadge();

  return (
    <>
      <article
        id={issue.id}
        className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
      >
        <div>
          {/* Card Image Banner with Concept Preview & Theme */}
          <div className="relative w-full h-48 sm:h-56 bg-slate-100 overflow-hidden">
            <img
              src={issue.images?.reported || "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900&auto=format&fit=crop&q=80"}
              alt={issue.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Top Overlay Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#134431]/90 backdrop-blur-md text-emerald-300 border border-emerald-500/40 shadow-md flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-300" />
                <span>{themeTag}</span>
              </span>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md text-slate-800 shadow-md border border-slate-200">
                PIN {pinCode}
              </span>
            </div>

            {/* Bottom Gradient with Endorsement Count */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-6 flex items-center justify-between text-white pointer-events-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{localUpvotes} Citizen Endorsements</span>
              </div>
              {issue.estimatedBudget && (
                <span className="text-[11px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                  Scale: {issue.estimatedBudget}
                </span>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 sm:p-5 space-y-3.5">

            {/* Author + Timestamp */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#134431] flex items-center justify-center font-bold text-[10px] border border-emerald-200">
                  {issue.reporter?.name ? issue.reporter.name.charAt(0) : "C"}
                </div>
                <span className="font-semibold text-slate-700">{issue.reporter?.name || "Civic Citizen"}</span>
              </div>
              <span className="text-[11px]">{formatDate(issue.createdAt)}</span>
            </div>

            {/* Title */}
            <h3 className="font-headline font-black text-base sm:text-lg text-slate-900 leading-snug group-hover:text-[#134431] transition-colors">
              {issue.title}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal line-clamp-3">
              {issue.description}
            </p>

            {/* Anticipated Community Impact Box */}
            {issue.communityBenefit && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-1 font-bold text-[#134431]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Community Benefit &amp; Impact:</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {issue.communityBenefit}
                </p>
              </div>
            )}

            {/* Location Address */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#134431] shrink-0" />
              <span className="truncate">{issue.location?.address || (pinCode ? `Ward Location, PIN ${pinCode}` : "Ward Location")}</span>
            </div>

            {/* Official Officer Verdict & Feasibility Banner */}
            <div className={cn("p-3 rounded-2xl border space-y-1.5", verdictBadge.bg)}>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-black flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{verdictBadge.label}</span>
                </span>
                <span className="text-[10px] font-bold opacity-80">
                  {issue.assignedDepartment || "Ward Innovation Council"}
                </span>
              </div>
              
              {issue.officerFeedback ? (
                <p className="text-xs italic text-slate-800 border-t border-black/10 pt-1.5">
                  "{issue.officerFeedback}"
                </p>
              ) : (
                <p className="text-[11px] text-slate-600">
                  Awaiting spatial inspection and ward corporator feasibility approval.
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions: Endorse Vote, Share, Officer Review CTA */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          
          {/* Endorsement Vote Button */}
          <button
            type="button"
            onClick={handleVote}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all select-none shadow-xs cursor-pointer active:scale-95",
              localIsUpvoted
                ? "bg-emerald-700 text-white shadow-md ring-2 ring-emerald-600/30"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            )}
          >
            <ThumbsUp className={cn("w-4 h-4", localIsUpvoted ? "fill-white text-white" : "text-emerald-700")} />
            <span>{localIsUpvoted ? "Endorsed ✓" : "Endorse Idea"}</span>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black", localIsUpvoted ? "bg-emerald-800 text-white" : "bg-white text-emerald-900 border border-emerald-200")}>
              {localUpvotes}
            </span>
          </button>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-2xl text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/80 cursor-pointer"
              title="Share Idea"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Officer Review Action Button (Visible to officers or anyone reviewing authority) */}
            {isOfficer ? (
              <button
                type="button"
                onClick={() => setIsFeasibilityModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Evaluate</span>
              </button>
            ) : (
              <Link
                href={`/issues/${issue.id}`}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-900 border border-slate-200 transition-colors text-xs font-bold flex items-center gap-1"
                title="View Comments & Full Ledger"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>{issue.commentsCount || 0}</span>
              </Link>
            )}

          </div>

        </div>
      </article>

      {/* Officer Feasibility Modal */}
      <OfficerFeasibilityModal
        isOpen={isFeasibilityModalOpen}
        onClose={() => setIsFeasibilityModalOpen(false)}
        issue={issue}
      />
    </>
  );
}
