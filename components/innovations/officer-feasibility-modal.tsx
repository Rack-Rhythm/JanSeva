"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { CivicIssue } from "@/lib/data/mock-data";
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  Calendar,
  Send,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficerFeasibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: CivicIssue;
}

const DEPARTMENTS = [
  "Urban Planning & Innovation Council",
  "Public Works Department (Roads & Transit)",
  "Environment & Urban Forestry Division",
  "Electrical & Smart Infrastructure Wing",
  "Sanitation & Solid Waste Management"
];

export function OfficerFeasibilityModal({ isOpen, onClose, issue }: OfficerFeasibilityModalProps) {
  const { updateInnovationVerdict, user } = useApp();

  const [verdict, setVerdict] = useState<"Under Review" | "Feasibility Approved" | "Pilot Scheduled" | "Budget Allocated" | "Rejected">(
    issue.officerVerdict || "Feasibility Approved"
  );
  const [feedbackNote, setFeedbackNote] = useState(
    issue.officerFeedback || ""
  );
  const [assignedDept, setAssignedDept] = useState(
    issue.assignedDepartment || user?.department || DEPARTMENTS[0]
  );
  const [allocatedBudget, setAllocatedBudget] = useState(
    issue.estimatedBudget || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNote.trim()) {
      setErrorMsg("Please write an officer assessment note.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await updateInnovationVerdict(
        issue.id,
        verdict,
        feedbackNote.trim(),
        assignedDept,
        allocatedBudget
      );

      onClose();
    } catch (err: any) {
      console.error("Failed to update feasibility verdict:", err);
      setErrorMsg(err.message || "Failed to update feasibility verdict.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-[#edf7f1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#134431] text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-headline font-black text-base sm:text-lg text-slate-900 leading-tight">
                Officer Feasibility Review
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Evaluating Proposal #{issue.id} • {issue.upvotes} Citizen Endorsements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Proposal Summary Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#134431]">
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="truncate">{issue.title}</span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">{issue.description}</p>
          </div>

          {/* Verdict Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Official Assessment Verdict *
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "Feasibility Approved", label: "✅ Feasibility Approved", desc: "Greenlit for pilot planning" },
                { id: "Pilot Scheduled", label: "🚀 Pilot Scheduled", desc: "Ward execution date assigned" },
                { id: "Budget Allocated", label: "💰 Budget Allocated", desc: "Discretionary fund committed" },
                { id: "Under Review", label: "🟡 Under Further Study", desc: "Needs spatial inspection" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVerdict(v.id as any)}
                  className={cn(
                    "p-2.5 rounded-2xl border text-left font-bold transition-all space-y-0.5",
                    verdict === v.id
                      ? "bg-[#134431] text-white border-[#134431] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <p className="text-xs">{v.label}</p>
                  <p className={cn("text-[10px] font-normal", verdict === v.id ? "text-emerald-200" : "text-slate-500")}>
                    {v.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Officer Feasibility Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Officer Technical Review Remarks &amp; Public Guidance *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Site surveyed on Khandagiri transit corridor. Feasible for 2 solar-canopy bike shelters under FY26 Green Transit budget."
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Department & Budget Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Assign Execution Wing
              </label>
              <select
                value={assignedDept}
                onChange={(e) => setAssignedDept(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Approved Budget Scale
              </label>
              <input
                type="text"
                placeholder="e.g. ₹2.5 Lakhs"
                value={allocatedBudget}
                onChange={(e) => setAllocatedBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isSubmitting ? "Saving Verdict..." : "Publish Official Verdict"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
