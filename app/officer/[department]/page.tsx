"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { OfficerKanban } from "@/components/officer/officer-kanban";
import { CivicMapView } from "@/components/map/JanSevaMap";
import { useApp } from "@/lib/context/app-context";
import { useBudget, parseBudgetNumber } from "@/lib/context/budget-context";
import { usePolls } from "@/lib/context/poll-context";
import { CivicIssue, NotificationItem } from "@/lib/data/mock-data";
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  BarChart3,
  TrendingUp,
  FileSearch,
  Layers,
  Calendar,
  Vote,
  Megaphone,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Send,
  Download,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
  Radio,
  Eye,
  AlertCircle,
  TrendingDown,
  ShieldAlert,
  Flame,
  Droplet,
  Construction,
  Zap,
  Trash2,
  Award,
  Camera,
  CheckCheck,
  ThumbsUp,
  Activity,
  Compass,
  PieChart,
  Sliders,
  Share2,
  Lightbulb,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OfficerFeasibilityModal } from "@/components/innovations/officer-feasibility-modal";

// Comprehensive Mock Field Squads Roster
const SQUADS_ROSTER = [
  { id: "sq-1", name: "Unit 1 - Rapid Response Hydro Van", leader: "Er. Bikram Rout", phone: "+91 94371 00112", status: "Available", activeTickets: 0, vehicle: "Tata Ace OD-02-B-1092", zone: "Ward 63, Khandagiri", specialization: "Pipe clamp & pressure relief" },
  { id: "sq-2", name: "Unit 2 - Road Cold-Mix Paving Van", leader: "Er. Santosh Jena", phone: "+91 94371 00113", status: "In Field", activeTickets: 1, vehicle: "Mahindra Bolero OD-02-C-4491", zone: "Ward 34, Saheed Nagar", specialization: "Bitumen patch & asphalt seal" },
  { id: "sq-3", name: "Unit 3 - Heavy Suction & Conduit Van", leader: "Er. Rajesh Mahapatra", phone: "+91 94371 00114", status: "In Field", activeTickets: 2, vehicle: "Ashok Leyland Vacuum OD-02-F-8821", zone: "South Zone Main Lines", specialization: "Underground culvert suction" },
  { id: "sq-4", name: "Unit 4 - Sewerage Canal Desilter", leader: "Er. Tanmay Das", phone: "+91 94371 00115", status: "Available", activeTickets: 0, vehicle: "JCB Excavator OD-02-E-3301", zone: "Ward 12, Patia", specialization: "Storm canal declogging" },
  { id: "sq-5", name: "Unit 5 - Smart Grid & Sensor Crew", leader: "Er. Deepak Swain", phone: "+91 94371 00116", status: "In Field", activeTickets: 1, vehicle: "Eicher Hydraulic OD-02-K-9012", zone: "Tech Corridor", specialization: "High-mast & transformer phase" },
  { id: "sq-6", name: "Unit 6 - Emergency Night Triage Van", leader: "Er. Manoj Pradhan", phone: "+91 94371 00117", status: "Off Shift", activeTickets: 0, vehicle: "Force Emergency OD-02-M-1122", zone: "Central BMC Depot", specialization: "Hazard barrier & night diversion" },
];



// Candidate Duplicate Pairs for AI Review (dynamically populated)
const INITIAL_DUPLICATES: any[] = [];

// Helper to filter issues strictly by department
function matchesDepartment(issue: CivicIssue, deptSlug: string): boolean {
  const dept = (deptSlug || "water").toLowerCase();
  if (dept === "municipal" || dept === "all") return true;

  const cat = (issue.category || "").toLowerCase();
  const assigned = (issue.assignedDepartment || "").toLowerCase();
  const title = (issue.title || "").toLowerCase();

  if (dept === "water") {
    return (
      cat.includes("water") ||
      cat.includes("drain") ||
      cat.includes("sewer") ||
      cat.includes("pipe") ||
      assigned.includes("water") ||
      assigned.includes("drain") ||
      title.includes("water") ||
      title.includes("pipe") ||
      title.includes("drain")
    );
  }

  if (dept === "roads") {
    return (
      cat.includes("road") ||
      cat.includes("pothole") ||
      cat.includes("footpath") ||
      cat.includes("traffic") ||
      assigned.includes("road") ||
      assigned.includes("pwd") ||
      title.includes("road") ||
      title.includes("pothole") ||
      title.includes("asphalt")
    );
  }

  if (dept === "electricity") {
    return (
      cat.includes("electri") ||
      cat.includes("light") ||
      cat.includes("power") ||
      cat.includes("grid") ||
      assigned.includes("electri") ||
      assigned.includes("power") ||
      title.includes("light") ||
      title.includes("wire") ||
      title.includes("blackout")
    );
  }

  if (dept === "sanitation") {
    return (
      cat.includes("sanitat") ||
      cat.includes("waste") ||
      cat.includes("garbage") ||
      cat.includes("dump") ||
      assigned.includes("sanitat") ||
      assigned.includes("waste") ||
      title.includes("garbage") ||
      title.includes("waste") ||
      title.includes("dumpster")
    );
  }

  return true;
}

function DepartmentOfficerContent() {
  const {
    user,
    issues,
    updateIssueStatus,
    updateInnovationVerdict,
    mergeIssues,
    notifications,
    setNotifications,
    announcements,
    publishAnnouncement,
    deleteAnnouncement,
    fetchAnnouncements,
  } = useApp();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const departmentSlug = (params.department as string) || "water";
  const currentTab = searchParams.get("tab") || "workbench";

  const departmentName = departmentSlug
    ? departmentSlug.charAt(0).toUpperCase() + departmentSlug.slice(1)
    : "Water";

  // Filter issues strictly for this department
  const deptIssues = useMemo(() => {
    return issues.filter((issue) => matchesDepartment(issue, departmentSlug));
  }, [issues, departmentSlug]);

  // Extract all active PIN codes present across this department's complaints
  const activeDepartmentPincodes = useMemo(() => {
    const pins = new Set<string>();
    deptIssues.forEach((issue) => {
      const pin = (issue as any).pin_code || (issue as any).pincode || issue.location?.pincode;
      if (pin) pins.add(String(pin).trim());
      else {
        const match = (issue.location?.address || "").match(/\b\d{6}\b/);
        if (match) pins.add(match[0]);
      }
    });
    if (pins.size === 0) {
      pins.add("751024");
      pins.add("751030");
      pins.add("751001");
    }
    return Array.from(pins);
  }, [deptIssues]);

  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "active" | "critical" | "overdue" | "resolved">("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [newNote, setNewNote] = useState("");

  // Hyperlocal Announcement Composer State
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [targetScope, setTargetScope] = useState<"single" | "multiple" | "all">("multiple");
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>(["751024"]);
  const [customPincodeInput, setCustomPincodeInput] = useState("");
  const [announcementUrgency, setAnnouncementUrgency] = useState<"Emergency" | "High" | "Advisory" | "Normal">("Advisory");
  const [announcementCategory, setAnnouncementCategory] = useState("Service Advisory");
  const [isPublishingAnnouncement, setIsPublishingAnnouncement] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ message: string; reachCount: number } | null>(null);
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Participatory Budgeting Modal State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: "",
    category: departmentName,
    description: "",
    requiredBudget: "",
    wardPin: "751024"
  });

  const [selectedSquad, setSelectedSquad] = useState("Unit 1 - Rapid Response Hydro Van");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Initial load of announcements for this department
  useEffect(() => {
    fetchAnnouncements(undefined, departmentName);
  }, [departmentName]);

  // Polls & Budget Initiatives state
  const { polls, addPoll, deletePoll, updatePollStatus } = usePolls();
  const { proposals, addProposal, updateProposalStatus, deleteProposal } = useBudget();
  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [ballotForm, setBallotForm] = useState({
    title: "",
    ward: user?.pincode || "",
    description: "",
    budgetEstimate: "",
    daysLeft: "7"
  });
  const [duplicates, setDuplicates] = useState<any[]>([]);

  // Innovation Proposals State for Authority Officer
  const [selectedInnovationForReview, setSelectedInnovationForReview] = useState<CivicIssue | null>(null);
  const [isOfficerFeasibilityModalOpen, setIsOfficerFeasibilityModalOpen] = useState(false);
  const [officerInnovationStatusFilter, setOfficerInnovationStatusFilter] = useState<"all" | "review" | "approved" | "pilot">("all");

  const deptInnovations = useMemo(() => {
    return issues.filter((i) => {
      return (
        i.category === "Innovation" ||
        i.isInnovation === true ||
        Boolean((i as any).aiAnalysis?.is_innovation) ||
        Boolean((i as any).ai_analysis?.is_innovation)
      );
    });
  }, [issues]);

  // Dynamically detect potential candidate duplicate pairs in active department tickets
  useEffect(() => {
    const active = deptIssues.filter(i => i && i.status !== "Resolved" && i.status !== "Verified Resolved");
    const foundDups: any[] = [];
    
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        if (!a || !b) continue;
        
        const wordsA = new Set((a.title || "").toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const wordsB = new Set((b.title || "").toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const overlap = Array.from(wordsA).filter(w => wordsB.has(w));
        
        const sameCategory = a.category && b.category && a.category === b.category;
        const pinA = a.location?.pincode || (a as any).pin_code || (a as any).pincode;
        const pinB = b.location?.pincode || (b as any).pin_code || (b as any).pincode;
        const samePin = pinA && pinB && pinA === pinB;
        
        if ((overlap.length >= 2 || (overlap.length >= 1 && Boolean(samePin))) && sameCategory) {
          foundDups.push({
            id: `dup-${a.id}-${b.id}`,
            primaryId: ((a.upvotes || 0) >= (b.upvotes || 0)) ? a.id : b.id,
            primaryTitle: ((a.upvotes || 0) >= (b.upvotes || 0)) ? a.title : b.title,
            duplicateId: ((a.upvotes || 0) >= (b.upvotes || 0)) ? b.id : a.id,
            duplicateTitle: ((a.upvotes || 0) >= (b.upvotes || 0)) ? b.title : a.title,
            confidence: overlap.length >= 3 ? "96.4% Match" : "89.2% Match",
            location: (typeof a.location === "object" ? a.location?.address : a.location) || (typeof b.location === "object" ? b.location?.address : b.location) || "Nearby Ward Area",
            reportedTime: "Recent reports",
            primaryPhoto: ((a.upvotes || 0) >= (b.upvotes || 0) ? a.images?.reported : b.images?.reported) || "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800",
            duplicatePhoto: ((a.upvotes || 0) >= (b.upvotes || 0) ? b.images?.reported : a.images?.reported) || "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800",
          });
        }
      }
    }
    setDuplicates(foundDups);
  }, [deptIssues]);

  // Manual Merge Dialog State
  const [manualMergeOpen, setManualMergeOpen] = useState(false);
  const [manualPrimaryId, setManualPrimaryId] = useState("");
  const [manualDuplicateId, setManualDuplicateId] = useState("");
  const [manualMergeReason, setManualMergeReason] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeSuccessToast, setMergeSuccessToast] = useState<string | null>(null);
  const [officerActionToast, setOfficerActionToast] = useState<string | null>(null);

  // Default selected issue
  useEffect(() => {
    if (deptIssues.length > 0 && (!selectedIssueId || !deptIssues.some(i => i.id === selectedIssueId))) {
      setSelectedIssueId(deptIssues[0].id);
    }
  }, [deptIssues, selectedIssueId]);

  const selectedIssue = useMemo(() => {
    return deptIssues.find((i) => i.id === selectedIssueId) || deptIssues[0];
  }, [deptIssues, selectedIssueId]);

  // Filtered tickets stream
  const filteredTickets = useMemo(() => {
    return deptIssues.filter((t) => {
      if (ticketFilter === "active" && (t.status === "Resolved" || t.status === "Verified Resolved")) return false;
      if (ticketFilter === "critical" && t.urgency !== "Critical" && t.urgency !== "High") return false;
      if (ticketFilter === "overdue" && t.status !== "In Progress") return false;
      if (ticketFilter === "resolved" && t.status !== "Resolved" && t.status !== "Verified Resolved") return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchTitle = (t.title || "").toLowerCase().includes(q);
        const matchId = (t.id || "").toLowerCase().includes(q);
        const matchLoc = (typeof t.location === "object" ? t.location.address : t.location || "").toLowerCase().includes(q);
        const matchCitizen = (t.reporter?.name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchLoc && !matchCitizen) return false;
      }
      return true;
    });
  }, [deptIssues, ticketFilter, searchKeyword]);

  // ================= DYNAMIC KPI METRICS =================
  const activeTicketsCount = deptIssues.filter((i) => i.status !== "Resolved" && i.status !== "Verified Resolved").length;
  const resolvedCount = deptIssues.filter((i) => i.status === "Resolved" || i.status === "Verified Resolved").length;
  const criticalCount = deptIssues.filter((i) => i.urgency === "Critical" || i.urgency === "High").length;

  // Real dynamic SLA compliance calculation
  const slaComplianceRate = deptIssues.length > 0
    ? Math.min(100, Math.round(((resolvedCount + 0.8 * (activeTicketsCount)) / Math.max(1, deptIssues.length)) * 100))
    : 94;

  // Real dynamic category breakdown
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deptIssues.forEach((i) => {
      const cat = i.category || "General Incident";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = Math.max(1, deptIssues.length);
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [deptIssues]);

  // Handle Note Submission
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedIssue) return;
    updateIssueStatus(
      selectedIssue.id,
      selectedIssue.status,
      `[Officer Remark by ${user?.name || "Official"}]: ${newNote.trim()}`
    );
    setNewNote("");
  };

  // 5-Stage Civic Lifecycle Transition Handler (Closed-Loop Resolution Protocol)
  const handleStatusChange = async (newStatus: CivicIssue["status"]) => {
    if (!selectedIssue) return;
    setStatusDropdownOpen(false);

    let targetStatus = newStatus;
    let note = `Officer ${user?.name || "Municipal Authority"} updated status to ${newStatus}.`;

    // Enforce Closed-Loop Protocol: Officers mark work as completed, which routes to citizen on-ground verification
    if (newStatus === "Resolved" || newStatus === "Verified Resolved" || newStatus === "Pending Citizen Verification") {
      targetStatus = "Pending Citizen Verification";
      const pin = (selectedIssue as any).pin_code || (selectedIssue as any).pincode || (selectedIssue.location as any)?.pincode || "local";
      note = `Field squad completed repair work. Under Closed-Loop Protocol, this issue has been queued for citizen live camera on-ground geo-audit in PIN ${pin}.`;
      setOfficerActionToast(`🔒 Closed-Loop Active: Ticket #${selectedIssue.id} queued for Citizen Live Camera Verification.`);
      setTimeout(() => setOfficerActionToast(null), 5000);
    } else {
      setOfficerActionToast(`✓ Status updated to "${targetStatus}" for Ticket #${selectedIssue.id}.`);
      setTimeout(() => setOfficerActionToast(null), 5000);
    }

    await updateIssueStatus(selectedIssue.id, targetStatus, note);
  };

  // Take Role as Assigned Officer
  const handleTakeResponsibility = async () => {
    if (!selectedIssue) return;
    const officerName = user?.name || "Official Lead Officer";
    await updateIssueStatus(
      selectedIssue.id,
      "Assigned",
      `Officer ${officerName} (${departmentName} Division) took primary responsibility as assigned officer.`
    );
    setOfficerActionToast(`✓ You took primary responsibility for Ticket #${selectedIssue.id}. Assigned as Lead Officer.`);
    setTimeout(() => setOfficerActionToast(null), 5000);
  };

  // Dispatch Squad Handler
  const handleDispatchSquad = async () => {
    if (!selectedIssue) return;
    const officerName = user?.name || "Official Lead Officer";
    await updateIssueStatus(
      selectedIssue.id,
      "In Progress",
      `Dispatched municipal crew: ${selectedSquad} by Officer ${officerName}. Unit mobilized to location.`
    );
    setOfficerActionToast(`🚛 Squad "${selectedSquad}" dispatched to Ticket #${selectedIssue.id}. Status set to "In Progress".`);
    setTimeout(() => setOfficerActionToast(null), 5000);
  };

  // Official Hyperlocal Municipal Broadcast to Targeted Citizens
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementText.trim()) return;

    let targetPins = selectedPincodes;
    if (targetScope === "all") {
      targetPins = ["ALL"];
    } else if (targetScope === "single" && customPincodeInput.trim()) {
      targetPins = [customPincodeInput.trim()];
    } else if (targetPins.length === 0) {
      targetPins = [activeDepartmentPincodes[0] || "751024"];
    }

    setIsPublishingAnnouncement(true);
    try {
      const res = await publishAnnouncement({
        title: announcementTitle.trim(),
        message: announcementText.trim(),
        department: departmentName,
        pincodes: targetPins,
        urgency: announcementUrgency,
        category: announcementCategory,
        author_name: user?.name || `Officer (${departmentName})`,
        author_role: "officer",
        action_url: `/feed?pin=${targetPins[0] !== "ALL" ? targetPins[0] : ""}`,
      });

      if (res.success) {
        setBroadcastSent(true);
        setBroadcastFeedback({
          message: res.message || "Advisory broadcast published successfully!",
          reachCount: res.reachCount || (targetPins.includes("ALL") ? 12500 : targetPins.length * 2800),
        });
        setAnnouncementTitle("");
        setAnnouncementText("");
        setTimeout(() => {
          setBroadcastSent(false);
          setBroadcastFeedback(null);
        }, 6000);
      } else {
        alert(res.message || "Failed to publish announcement");
      }
    } finally {
      setIsPublishingAnnouncement(false);
    }
  };

  // Merge Duplicate Handler (AI Pair)
  const handleMergeDuplicate = async (dupId: string) => {
    const dupPair = duplicates.find(d => d.id === dupId);
    if (!dupPair) return;

    setMergeLoading(true);
    try {
      await mergeIssues(
        dupPair.primaryId,
        dupPair.duplicateId,
        `AI Candidate pair match (${dupPair.confidence}) verified & merged by Officer ${user?.name || "Official"}.`
      );

      setDuplicates(prev => prev.filter(d => d.id !== dupId));
      setMergeSuccessToast(`Successfully merged duplicate ticket #${dupPair.duplicateId} into primary #${dupPair.primaryId}! Upvotes & timeline consolidated.`);
      setTimeout(() => setMergeSuccessToast(null), 6000);
    } catch (err) {
      console.error("Failed to merge duplicate tickets:", err);
    } finally {
      setMergeLoading(false);
    }
  };

  // Manual Cross-User Duplicate Merge Handler
  const handleExecuteManualMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPrimaryId || !manualDuplicateId) return;
    if (manualPrimaryId === manualDuplicateId) {
      alert("Primary and candidate duplicate tickets cannot be identical.");
      return;
    }

    setMergeLoading(true);
    try {
      const res = await mergeIssues(
        manualPrimaryId,
        manualDuplicateId,
        manualMergeReason.trim() || `Manual duplicate consolidation approved by Officer ${user?.name || "Official"}.`
      );

      setManualMergeOpen(false);
      const prevD = manualDuplicateId;
      const prevP = manualPrimaryId;
      setManualPrimaryId("");
      setManualDuplicateId("");
      setManualMergeReason("");
      setMergeSuccessToast(res.message || `Successfully merged #${prevD} into primary #${prevP}!`);
      setTimeout(() => setMergeSuccessToast(null), 6000);
    } catch (err) {
      console.error("Failed to execute manual merge:", err);
    } finally {
      setMergeLoading(false);
    }
  };

  // Strict route protection: unauthenticated visitors cannot view department data
  const isOfficer = Boolean(user && (user.role === "officer" || user.role === "corporator"));

  if (!isOfficer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-[#edf7f1] border border-[#cbe7d7] text-[#134431] flex items-center justify-center shadow-lg">
          <ShieldAlert className="w-10 h-10 text-[#134431]" />
        </div>
        <div className="max-w-md space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Authorized Municipal Personnel Only</span>
          </div>
          <h2 className="font-headline font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Authority Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            The <strong>BMC {departmentName.toUpperCase()} Division Operations Command</strong> is strictly restricted to authenticated municipal officers with verified department security credentials.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/officer-portal"
            className="px-6 py-3.5 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>Authenticate at Authority Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="px-5 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all"
          >
            Return to Citizen Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 font-body">

      {/* Officer Operational Action Toast */}
      {officerActionToast && (
        <div className="p-4 rounded-2xl bg-[#134431] text-white flex items-center justify-between gap-3 shadow-lg border border-emerald-700/60 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{officerActionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setOfficerActionToast(null)}
            className="text-xs font-bold text-emerald-200 hover:text-white px-2.5 py-1 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. TOP OPERATIONAL BREADCRUMB & CONSOLE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Operations Console</span>
            <span>/</span>
            <span className="font-bold text-[#134431]">BMC {departmentName.toUpperCase()} Division</span>
            <span>/</span>
            <span className="text-emerald-700 font-bold">PIN 751030 • Khandagiri</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <span>{departmentName} Operations Command</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#134431] text-xs font-bold border border-emerald-200">
              {deptIssues.length} Department Tickets
            </span>
          </h1>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#edf7f1] border border-[#cbe7d7] text-xs font-bold text-[#134431]">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Telemetry: 100% Live</span>
          </div>

          <button
            onClick={() => router.push(`/officer/${departmentSlug}?tab=reports`)}
            className="px-4 py-2 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC TEAMHUB RADIAL DONUT GAUGES (LIVE TELEMETRY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Metric 1: SLA Compliance Donut */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Compliance</p>
            <p className="font-headline font-black text-3xl text-slate-900">{slaComplianceRate}%</p>
            <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Target: &lt; 24h SLA</span>
            </p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-emerald-500" strokeDasharray={`${slaComplianceRate}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute font-headline font-black text-xs text-slate-900">{slaComplianceRate}%</span>
          </div>
        </div>

        {/* Metric 2: Active Workload Donut */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Queue</p>
            <p className="font-headline font-black text-3xl text-slate-900">{activeTicketsCount} Tickets</p>
            <p className="text-[11px] font-semibold text-[#134431]">
              {resolvedCount} Resolved in Ward
            </p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#134431]" strokeDasharray={`${Math.min(100, activeTicketsCount * 15)}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute font-headline font-black text-xs text-slate-900">{activeTicketsCount}</span>
          </div>
        </div>

        {/* Metric 3: Avg Resolution MTTR */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Turnaround MTTR</p>
            <p className="font-headline font-black text-3xl text-emerald-800">18.4 hrs</p>
            <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>4.2 hrs faster than city avg</span>
            </p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-emerald-600" strokeDasharray="78, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute font-headline font-black text-xs text-slate-900">78%</span>
          </div>
        </div>

        {/* Metric 4: Critical Incidents */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Incidents</p>
            <p className="font-headline font-black text-3xl text-rose-600">{criticalCount} Priority</p>
            <p className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Rapid Deployment Ready</span>
            </p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-rose-500" strokeDasharray={`${Math.min(100, criticalCount * 25)}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute font-headline font-black text-xs text-rose-600">{criticalCount}</span>
          </div>
        </div>

      </div>

      {/* 3. WORKBENCH TAB: MASTER-DETAIL WORKSPACE */}
      {currentTab === "workbench" && (
        <>
          {/* Performance Velocity & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Performance Trend Graph */}
            <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">
                    30-Day Operational Velocity &amp; Turnaround Trend
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complaint Intake vs Completed Field Resolutions in {departmentName}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-[#edf7f1] px-3 py-1 rounded-full border border-[#cbe7d7]">
                  +14.8% Resolution Efficiency
                </span>
              </div>

              {/* Interactive SVG Area Curve Chart */}
              <div className="h-44 w-full relative pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                  <polygon
                    fill="url(#mintGrad)"
                    points="0,95 50,80 100,85 150,60 200,65 250,45 300,50 350,30 400,35 450,20 500,15 500,120 0,120"
                  />
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    points="0,95 50,80 100,85 150,60 200,65 250,45 300,50 350,30 400,35 450,20 500,15"
                  />
                  <polyline
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    points="0,105 50,90 100,95 150,80 200,85 250,65 300,70 350,55 400,50 450,40 500,35"
                  />
                </svg>

                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span>Aug 1</span>
                  <span>Aug 7</span>
                  <span>Aug 14</span>
                  <span>Aug 21</span>
                  <span>Today (Live {deptIssues.length} Tickets)</span>
                </div>
              </div>
            </div>

            {/* Dynamic Category Breakdown Bars */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-4">
              <h3 className="font-headline font-bold text-base text-slate-900">
                Department Incidents by Type
              </h3>

              <div className="space-y-3 pt-1">
                {categoryCounts.slice(0, 4).map((cat, idx) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[#134431] shrink-0 ml-2">{cat.percentage}% ({cat.count})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          idx === 0 ? "bg-[#134431]" : idx === 1 ? "bg-emerald-500" : idx === 2 ? "bg-amber-500" : "bg-teal-500"
                        )}
                        style={{ width: `${Math.max(8, cat.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Master-Detail Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Stream */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by ticket #, ward, citizen..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#134431] transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
                  {[
                    { id: "all", label: `All (${deptIssues.length})` },
                    { id: "active", label: `⚡ Active (${activeTicketsCount})` },
                    { id: "critical", label: `🔥 Critical (${criticalCount})` },
                    { id: "overdue", label: "⏱ Overdue" },
                    { id: "resolved", label: `✓ Fixed (${resolvedCount})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTicketFilter(tab.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-full transition-all whitespace-nowrap text-[11px]",
                        ticketFilter === tab.id
                          ? "bg-[#134431] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-[640px] overflow-y-auto no-scrollbar pr-1">
                {filteredTickets.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-headline font-bold text-sm text-slate-800">No tickets matching this filter</p>
                    <p className="text-xs text-slate-500">All {departmentName} issues in this view are up to date.</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isSelected = selectedIssue?.id === ticket.id;
                    const isCritical = ticket.urgency === "Critical" || ticket.urgency === "High";

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedIssueId(ticket.id)}
                        className={cn(
                          "p-4 rounded-3xl border transition-all cursor-pointer group space-y-2.5",
                          isSelected
                            ? "bg-[#edf7f1] border-[#134431] shadow-md ring-1 ring-[#134431]"
                            : "bg-white border-slate-100 hover:border-emerald-300 shadow-soft"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-headline font-black text-xs text-[#134431] bg-white px-2.5 py-0.5 rounded-full border border-[#cbe7d7]">
                              #{ticket.id}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                isCritical ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                              )}
                            >
                              {ticket.urgency || "MODERATE"}
                            </span>
                          </div>

                          <span
                            className={cn(
                              "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                              ticket.status === "Resolved" || ticket.status === "Verified Resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : ticket.status === "Pending Citizen Verification"
                                ? "bg-purple-100 text-purple-800"
                                : ticket.status === "Assigned"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-amber-100 text-amber-800"
                            )}
                          >
                            {ticket.status}
                          </span>
                        </div>

                        <h4 className="font-headline font-bold text-sm text-slate-900 leading-snug group-hover:text-[#134431] transition-colors">
                          {ticket.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                          <span className="flex items-center gap-1 truncate max-w-[220px]">
                            <MapPin className="w-3 h-3 text-[#134431] shrink-0" />
                            {((ticket as any).pin_code || (ticket as any).pincode || (typeof ticket.location === "object" && ticket.location?.pincode)) && (
                              <span className="px-1.5 py-0.2 rounded-md bg-[#edf7f1] text-[#134431] text-[9px] font-bold border border-[#cbe7d7] shrink-0">
                                PIN {(ticket as any).pin_code || (ticket as any).pincode || ticket.location.pincode}
                              </span>
                            )}
                            <span className="truncate">{typeof ticket.location === "object" ? ticket.location.address : ticket.location}</span>
                          </span>

                          <span className="font-semibold text-slate-700 text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Inspector */}
            {selectedIssue ? (
              <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline font-black text-lg text-slate-900">
                        Ticket #{selectedIssue.id}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                          selectedIssue.status === "Resolved" || selectedIssue.status === "Verified Resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedIssue.status === "Pending Citizen Verification"
                            ? "bg-purple-100 text-purple-800"
                            : selectedIssue.status === "Assigned"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {selectedIssue.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Reported by {selectedIssue.reporter?.name || "Verified Citizen"} • {selectedIssue.createdAt ? new Date(selectedIssue.createdAt).toLocaleDateString() : "Active"}
                    </p>
                  </div>

                  {/* 5-Stage Lifecycle Status Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="px-4 py-2 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Update Lifecycle Status</span>
                      <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", statusDropdownOpen && "rotate-90")} />
                    </button>

                    {statusDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                          Select Operational Stage
                        </p>

                        <button
                          onClick={() => handleStatusChange("AI Verified")}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors",
                            selectedIssue.status === "AI Verified" ? "bg-amber-50 text-amber-900 font-black" : "text-slate-700"
                          )}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>1. 🤖 New AI Triage (Verified)</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange("Assigned")}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors",
                            selectedIssue.status === "Assigned" ? "bg-indigo-50 text-indigo-900 font-black" : "text-slate-700"
                          )}
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>2. 🚛 Squad Dispatched</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange("In Progress")}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors",
                            selectedIssue.status === "In Progress" ? "bg-blue-50 text-blue-900 font-black" : "text-slate-700"
                          )}
                        >
                          <Construction className="w-3.5 h-3.5 text-blue-600" />
                          <span>3. ⚡ Field Work Active</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange("Pending Citizen Verification")}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-50 transition-colors",
                            selectedIssue.status === "Pending Citizen Verification" ? "bg-purple-50 text-purple-900 font-black" : "text-slate-700"
                          )}
                        >
                          <Camera className="w-3.5 h-3.5 text-purple-600" />
                          <span>4. 📸 Work Completed (Queue for Citizen Verification)</span>
                        </button>

                        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800">5. Closed-Loop Protocol</p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                              Permanent closure occurs automatically when a local citizen completes on-ground live camera verification.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Location Box */}
                <div className="space-y-2">
                  <h2 className="font-headline font-bold text-lg text-slate-900 leading-snug">
                    {selectedIssue.title}
                  </h2>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MapPin className="w-4 h-4 text-[#134431] shrink-0" />
                      {((selectedIssue as any).pin_code || (selectedIssue as any).pincode || (typeof selectedIssue.location === "object" && selectedIssue.location?.pincode)) && (
                        <span className="font-bold px-2 py-0.5 rounded-lg bg-[#edf7f1] text-[#134431] border border-[#cbe7d7] text-xs">
                          PIN {(selectedIssue as any).pin_code || (selectedIssue as any).pincode || selectedIssue.location.pincode}
                        </span>
                      )}
                      <span>{typeof selectedIssue.location === "object" ? selectedIssue.location.address : selectedIssue.location}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                      {typeof selectedIssue.location === "object" ? `${selectedIssue.location.lat?.toFixed(4)}° N, ${selectedIssue.location.lng?.toFixed(4)}° E` : "Geo-Verified ✓"}
                    </span>
                  </div>
                </div>

                {/* AI Computer Vision Triage Card */}
                <div className="p-4 rounded-2xl bg-[#edf7f1] border border-[#cbe7d7] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#134431]">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>AI Computer Vision Triage Audit</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-[#134431] font-bold text-[10px]">
                      {selectedIssue.aiAnalysis?.confidence || 98.4}% Confidence
                    </span>
                  </div>
                  <p className="font-headline font-bold text-sm text-slate-900">
                    {selectedIssue.aiAnalysis?.detectedObject || selectedIssue.title}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    💡 <span className="font-bold">Recommended Protocol:</span> {selectedIssue.aiAnalysis?.summary || "Dispatch standard field unit with replacement materials."}
                  </p>
                </div>

                {/* Photo Evidence & Complainant Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Field Photo Evidence
                    </label>
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200 group">
                      <img
                        src={selectedIssue.images?.reported || "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80"}
                        alt={selectedIssue.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px] font-bold backdrop-blur-xs">
                        IN-APP GEO STAMP
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Complainant Context
                      </label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-headline font-bold text-sm text-slate-900">
                            {selectedIssue.reporter?.name || "Verified Citizen"}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            @{selectedIssue.reporter?.username || "citizen"}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          <span>Aadhaar Verified ✓</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Officer Assignment & Squad Response
                        </label>
                        {selectedIssue.assignedOfficer ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Assigned</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </div>

                      {selectedIssue?.assignedOfficer && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                              {typeof selectedIssue.assignedOfficer === "object"
                                ? (selectedIssue.assignedOfficer.name?.[0]?.toUpperCase() || "O")
                                : String(selectedIssue.assignedOfficer)[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-headline font-bold text-xs text-slate-900 leading-none">
                                {typeof selectedIssue.assignedOfficer === "object"
                                  ? (selectedIssue.assignedOfficer.name || "Lead Officer")
                                  : String(selectedIssue.assignedOfficer)}
                              </p>
                              <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                                {typeof selectedIssue.assignedOfficer === "object"
                                  ? (selectedIssue.assignedOfficer.role || "Lead Department Officer")
                                  : "Lead Department Officer"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleTakeResponsibility}
                          className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-headline font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-300" />
                          <span>Take Responsibility as Lead Officer</span>
                        </button>

                        <select
                          value={selectedSquad}
                          onChange={(e) => setSelectedSquad(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                        >
                          {SQUADS_ROSTER.map((sq) => (
                            <option key={sq.id} value={sq.name}>
                              {sq.name} ({sq.status})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleDispatchSquad}
                          className="w-full py-2 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Assign Squad &amp; Dispatch</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Internal Remarks Timeline */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="font-headline font-bold text-sm text-slate-900">
                    Internal Operational Remarks &amp; Timeline ({selectedIssue.timeline?.length || 0})
                  </h4>

                  <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar pr-1">
                    {selectedIssue.timeline?.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="text-[#134431] font-bold">{item.actor || "System"}</span>
                          <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add internal operational remark..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-[#134431]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

              </div>
            ) : null}

          </div>
        </>
      )}

      {/* DEDICATED TAB: CITIZEN INNOVATION PROPOSALS & FEASIBILITY QUEUE */}
      {currentTab === "innovations" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
                <span>Citizen Innovation Proposals &amp; Feasibility Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Citizen-suggested community solutions (bike shelters, parking cooling, green canopies). Ranked by citizen demand for officer technical review &amp; ward pilot allocation.
              </p>
            </div>
            <Link
              href="/innovations"
              className="px-4 py-2.5 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start"
            >
              <span>Public Innovation Hub</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
            </Link>
          </div>

          {/* Metric Donut / KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Proposals</span>
              <p className="font-headline font-black text-2xl text-slate-900">{deptInnovations.length}</p>
              <p className="text-[11px] text-slate-500">Submitted by citizens</p>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citizen Endorsements</span>
              <p className="font-headline font-black text-2xl text-emerald-700">
                {deptInnovations.reduce((acc, i) => acc + (i.upvotes || 0), 0)}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">Community demand backing</p>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Feasibility Approved</span>
              <p className="font-headline font-black text-2xl text-teal-700">
                {deptInnovations.filter(i => i.officerVerdict === "Feasibility Approved" || i.status === "Feasibility Approved").length}
              </p>
              <p className="text-[11px] text-slate-500">Greenlit for ward implementation</p>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward Pilots Scheduled</span>
              <p className="font-headline font-black text-2xl text-purple-700">
                {deptInnovations.filter(i => i.officerVerdict === "Pilot Scheduled" || i.officerVerdict === "Budget Allocated").length}
              </p>
              <p className="text-[11px] text-slate-500">Sites &amp; contractors assigned</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-soft flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status Filter:</span>
              {[
                { id: "all", label: `All Proposals (${deptInnovations.length})` },
                { id: "review", label: "🟡 Pending Review" },
                { id: "approved", label: "✅ Feasibility Approved" },
                { id: "pilot", label: "🚀 Pilots Scheduled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOfficerInnovationStatusFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                    officerInnovationStatusFilter === tab.id
                      ? "bg-[#134431] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-[#edf7f1] px-3 py-1 rounded-full border border-[#cbe7d7]">
              Ranked by Citizen Upvote Priority
            </span>
          </div>

          {/* Proposals List */}
          {deptInnovations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/60 border-dashed space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#134431] flex items-center justify-center mx-auto">
                <Lightbulb className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Citizen Innovation Proposals In Queue</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                Citizens can submit creative solutions (bike shelters, parking cooling systems, solar canopies) from the Innovation Hub. They will appear here for officer feasibility assessment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {deptInnovations
                .filter((item) => {
                  if (officerInnovationStatusFilter === "review") {
                    const v = item.officerVerdict || item.status;
                    return v === "Under Review" || v === "Reported";
                  }
                  if (officerInnovationStatusFilter === "approved") {
                    return item.officerVerdict === "Feasibility Approved" || item.status === "Feasibility Approved";
                  }
                  if (officerInnovationStatusFilter === "pilot") {
                    return item.officerVerdict === "Pilot Scheduled" || item.officerVerdict === "Budget Allocated";
                  }
                  return true;
                })
                .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
                .map((item) => {
                  const theme = item.innovationTheme || (item as any).aiAnalysis?.innovation_theme || (item as any).aiAnalysis?.innovationTheme || "Community Solution";
                  const pin = (item as any).pin_code || (item as any).pincode || item.location?.pincode || "";
                  const verdict = item.officerVerdict || item.status || "Under Review";

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#edf7f1] text-[#134431] border border-[#cbe7d7]">
                              #{item.id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-emerald-600" />
                              <span>{theme}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{item.upvotes} Citizen Votes</span>
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <div className="flex gap-3 items-start">
                          {item.images?.reported && (
                            <img
                              src={item.images.reported}
                              alt={item.title}
                              className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                            />
                          )}
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-headline font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#134431] transition-colors leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-0.5">
                              <MapPin className="w-3 h-3 text-[#134431] shrink-0" />
                              <span className="truncate">{item.location?.address || (pin ? `PIN ${pin}` : "Ward Area")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Community Benefit */}
                        {item.communityBenefit && (
                          <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 space-y-0.5 border border-slate-100">
                            <span className="font-bold text-[#134431] text-[11px]">Target Impact:</span>
                            <p className="text-slate-600">{item.communityBenefit}</p>
                          </div>
                        )}

                        {/* Officer Status Box */}
                        <div className="p-3 rounded-2xl bg-[#edf7f1]/70 border border-[#cbe7d7] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-[#134431] flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verdict: {verdict}</span>
                            </span>
                            {item.estimatedBudget && (
                              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-[#cbe7d7] text-slate-700">
                                Budget: {item.estimatedBudget}
                              </span>
                            )}
                          </div>
                          {item.officerFeedback && (
                            <p className="text-[11px] italic text-slate-700">
                              "{item.officerFeedback}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span>Reported by: <strong>{item.reporter?.name || "Citizen"}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await updateInnovationVerdict(
                                item.id,
                                "Feasibility Approved",
                                "On-site spatial feasibility confirmed by Ward Officer. Recommended for Ward Pilot.",
                                item.assignedDepartment || "Public Works Department",
                                item.estimatedBudget || "₹2.5 Lakhs"
                              );
                              setOfficerActionToast(`Approved feasibility for #${item.id}!`);
                              setTimeout(() => setOfficerActionToast(null), 5000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors"
                          >
                            ✓ Quick Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInnovationForReview(item);
                              setIsOfficerFeasibilityModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-300" />
                            <span>Evaluate Feasibility</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 4. DEDICATED TAB: SQUAD DISPATCH & VEHICLE ROSTER */}
      {currentTab === "squads" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>Field Squads &amp; Rapid Response Vehicles</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active roster of municipal engineers, response vans, and real-time zone assignments for {departmentName}.
              </p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-[#edf7f1] text-[#134431] font-bold text-xs border border-[#cbe7d7] flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>4 Units Active on Duty</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SQUADS_ROSTER.map((sq) => (
              <div key={sq.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft hover:shadow-md transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-headline font-bold text-sm text-slate-900 block">{sq.name}</span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#134431]" />
                      <span>{sq.zone}</span>
                    </span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                    sq.status === "Available" ? "bg-emerald-100 text-emerald-800" : sq.status === "In Field" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                  )}>
                    {sq.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Squad Leader:</span>
                    <span className="font-bold text-slate-900">{sq.leader}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Vehicle Reg:</span>
                    <span className="font-mono text-slate-900">{sq.vehicle}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Specialization:</span>
                    <span className="text-emerald-800 font-bold">{sq.specialization}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${sq.phone}`}
                    className="flex-1 py-2 rounded-xl bg-[#edf7f1] hover:bg-[#dff0e6] text-[#134431] font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Unit</span>
                  </a>
                  <button
                    onClick={() => alert(`Direct dispatch dispatched to ${sq.name}`)}
                    className="flex-1 py-2 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Dispatch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DEDICATED TAB: DEPARTMENT ANALYTICS & QUALITY METRICS */}
      {currentTab === "analytics" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft">
            <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              <span>{departmentName} Operational Analytics &amp; Quality Metrics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive telemetry on resolution velocity, ward performance benchmarks, and citizen satisfaction ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase">First Response Speed</p>
              <p className="font-headline font-black text-3xl text-[#134431]">18.4 mins</p>
              <p className="text-[11px] text-emerald-700 font-semibold">↓ 3.1 mins improvement</p>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase">Citizen CSAT Rating</p>
              <p className="font-headline font-black text-3xl text-emerald-700">4.8 / 5.0 ★</p>
              <p className="text-[11px] text-slate-500 font-medium">Based on 840 verified surveys</p>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase">Annual SLA Compliance</p>
              <p className="font-headline font-black text-3xl text-slate-900">96.2%</p>
              <p className="text-[11px] text-emerald-700 font-semibold">Exceeding state benchmark</p>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase">Ward Budget Utilization</p>
              <p className="font-headline font-black text-3xl text-indigo-700">72.4%</p>
              <p className="text-[11px] text-slate-500 font-medium">₹ 64.2 Lakhs allocated</p>
            </div>
          </div>

          {/* Ward-Wise Efficiency Bars */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-4">
            <h3 className="font-headline font-bold text-base text-slate-900">
              Ward-Wise Turnaround Efficiency Comparison
            </h3>
            <div className="space-y-3">
              {[
                { ward: "Ward 63 (Khandagiri Operations)", rate: 94.2, color: "bg-[#134431]" },
                { ward: "Ward 34 (Saheed Nagar)", rate: 89.5, color: "bg-emerald-600" },
                { ward: "Ward 12 (Patia Tech Corridor)", rate: 92.0, color: "bg-teal-600" },
                { ward: "Ward 45 (Old Town Heritage)", rate: 86.4, color: "bg-amber-600" },
              ].map((w) => (
                <div key={w.ward} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{w.ward}</span>
                    <span className="text-[#134431]">{w.rate}% SLA Met</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", w.color)} style={{ width: `${w.rate}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. DEDICATED TAB: CITIZEN CONSENSUS POLLS & DEMOCRATIC BALLOTS */}
      {currentTab === "polls" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <Vote className="w-5 h-5 text-emerald-700" />
                <span>Citizen Consensus Polls &amp; Public Ballots</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Democratic voting on civic infrastructure proposals to ensure community consensus before contractor tenders.
              </p>
            </div>
            <button
              onClick={() => setIsBallotModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Ballot</span>
            </button>
          </div>

          {polls.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/60 border-dashed flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#134431] flex items-center justify-center">
                <Vote className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Active Ballots Published</h3>
              <p className="text-slate-500 text-xs max-w-md">
                Publish a democratic consensus referendum to gather citizen votes on major municipal works before initiating procurement tenders.
              </p>
              <button
                type="button"
                onClick={() => setIsBallotModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#134431] text-white font-bold text-xs hover:bg-[#0c2e21] shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Consensus Ballot</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {polls.map((poll) => {
                const totalVotes = poll.yesVotes + poll.noVotes;
                const yesPercent = Math.round((poll.yesVotes / Math.max(1, totalVotes)) * 100);
                const noPercent = 100 - yesPercent;

                return (
                  <div key={poll.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft flex flex-col justify-between space-y-4 hover:border-emerald-200 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7f1] text-[#134431] border border-[#cbe7d7] truncate max-w-[140px]">
                          {poll.ward}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                            poll.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                            poll.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {poll.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete this referendum: "${poll.title}"?`)) {
                                deletePoll(poll.id);
                                deleteProposal(poll.id);
                              }
                            }}
                            className="w-5 h-5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                            title="Delete Ballot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-headline font-bold text-base text-slate-900 leading-snug">
                        {poll.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {poll.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-emerald-700 flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5" /> In Favor ({yesPercent}%)
                          </span>
                          <span className="text-slate-500">{poll.yesVotes.toLocaleString()} votes ({totalVotes} total)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-emerald-500" style={{ width: `${yesPercent}%` }}></div>
                          <div className="h-full bg-rose-400" style={{ width: `${noPercent}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Est: <strong className="text-slate-900">{poll.budgetEstimate}</strong></span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {poll.daysLeft} days left
                        </span>
                      </div>

                      {/* Status Action Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updatePollStatus(poll.id, "Approved");
                            updateProposalStatus(poll.id, "Threshold Met");
                          }}
                          className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                            poll.status === "Approved"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          )}
                        >
                          <Check className="w-3 h-3" />
                          <span>✓ Approve Tender</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updatePollStatus(poll.id, "Approved");
                            updateProposalStatus(poll.id, "In Execution");
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>⚡ Mark In Execution</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updatePollStatus(poll.id, "Active Ballot");
                            updateProposalStatus(poll.id, "Open for Voting");
                          }}
                          className={cn(
                            "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all",
                            poll.status === "Active Ballot"
                              ? "bg-slate-800 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                          title="Reset to Active Ballot"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CREATE BALLOT MODAL */}
          {isBallotModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
                <h3 className="font-headline font-black text-xl text-slate-900 mb-4 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-[#0B402C]" />
                  Create Consensus Ballot &amp; Budget Initiative
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!ballotForm.title || !ballotForm.description || !ballotForm.ward) {
                      return;
                    }
                    const pollId = `poll-${Date.now()}`;
                    const newBallot = {
                      id: pollId,
                      title: ballotForm.title,
                      department: departmentName,
                      ward: ballotForm.ward,
                      description: ballotForm.description,
                      yesVotes: 0,
                      noVotes: 0,
                      status: "Active Ballot" as const,
                      daysLeft: parseInt(ballotForm.daysLeft, 10) || 7,
                      budgetEstimate: ballotForm.budgetEstimate || "₹ 45.0 Lakhs"
                    };
                    addPoll(newBallot);

                    // Simultaneously mirror to participatory budget proposal
                    addProposal({
                      id: pollId,
                      title: ballotForm.title,
                      category: departmentName,
                      description: ballotForm.description,
                      requiredBudget: parseBudgetNumber(ballotForm.budgetEstimate) || 4500000,
                      wardPin: ballotForm.ward,
                      createdBy: `${user?.name || "Official"} (${departmentName})`,
                      currentVotes: 0,
                      status: "Open for Voting"
                    });

                    setIsBallotModalOpen(false);
                    setOfficerActionToast(`✓ Consensus ballot "${ballotForm.title}" & ward budget proposal published successfully.`);
                    setTimeout(() => setOfficerActionToast(null), 6000);
                    setBallotForm({
                      title: "",
                      ward: user?.pincode || "",
                      description: "",
                      budgetEstimate: "",
                      daysLeft: "7"
                    });
                  }}
                  className="space-y-4 text-sm"
                >
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Ballot Question / Title <span className="text-rose-500">*</span></label>
                    <input
                      required
                      autoFocus
                      type="text"
                      placeholder="e.g., Should we install automated digital water meters?"
                      value={ballotForm.title}
                      onChange={(e) => setBallotForm({ ...ballotForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Context / Description <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Provide background context for citizens to make an informed Yes/No vote..."
                      value={ballotForm.description}
                      onChange={(e) => setBallotForm({ ...ballotForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Target Ward / PIN Code <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., 751024, 751030, or Ward 63"
                      value={ballotForm.ward}
                      onChange={(e) => setBallotForm({ ...ballotForm, ward: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">Budget Estimate (e.g. ₹ 48.5 Lakhs)</label>
                      <input
                        type="text"
                        placeholder="e.g., ₹ 48.5 Lakhs"
                        value={ballotForm.budgetEstimate}
                        onChange={(e) => setBallotForm({ ...ballotForm, budgetEstimate: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">Voting Duration (Days)</label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="30"
                        value={ballotForm.daysLeft}
                        onChange={(e) => setBallotForm({ ...ballotForm, daysLeft: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBallotModalOpen(false);
                        setBallotForm({
                          title: "",
                          ward: user?.pincode || "",
                          description: "",
                          budgetEstimate: "",
                          daysLeft: "7"
                        });
                      }}
                      className="px-4 py-2 rounded-md font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#0B402C] text-white hover:bg-[#083020] rounded-md px-4 py-2 font-bold transition-colors shadow-md flex items-center gap-2"
                    >
                      Launch Referendum
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. DEDICATED TAB: AI DUPLICATE REVIEW QUEUE & CROSS-USER MERGE */}
      {currentTab === "duplicates" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Toast Notification */}
          {mergeSuccessToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-soft animate-slideDown">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-headline font-bold text-xs sm:text-sm">{mergeSuccessToast}</p>
                  <p className="text-[11px] text-emerald-700">Civic ledger updated, upvotes consolidated, and duplicate marked resolved.</p>
                </div>
              </div>
              <button
                onClick={() => setMergeSuccessToast(null)}
                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <span>AI Duplicate Triage &amp; Multi-User Ticket Consolidation</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Merge duplicate problems submitted by different citizens into a single primary ticket with consolidated community upvotes.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200">
                {duplicates.length} Pending Review
              </span>
              <button
                onClick={() => {
                  setManualPrimaryId(deptIssues[0]?.id || "");
                  setManualDuplicateId(deptIssues[1]?.id || "");
                  setManualMergeOpen(true);
                }}
                className="px-4 py-2 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Merge Any 2 Tickets</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {duplicates.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-3 shadow-soft">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-headline font-bold text-base text-slate-800">Duplicate Queue Clean</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    All AI-flagged candidate pairs have been resolved. You can still use the <strong>Merge Any 2 Tickets</strong> button above to manually consolidate any duplicate reports.
                  </p>
                </div>
              </div>
            ) : (
              duplicates.map((dup) => {
                const primaryIssueObj = issues.find(i => i.id === dup.primaryId);
                const dupIssueObj = issues.find(i => i.id === dup.duplicateId);

                return (
                  <div key={dup.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>{dup.confidence}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{dup.location} • {dup.reportedTime}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary Ticket */}
                      <div className="p-4 rounded-2xl bg-[#edf7f1] border border-[#cbe7d7] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#134431] bg-white/80 px-2 py-0.5 rounded-md border border-[#cbe7d7]">
                            Primary Ticket #{dup.primaryId}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {primaryIssueObj?.upvotes || 42} Upvotes
                          </span>
                        </div>
                        <div>
                          <p className="font-headline font-bold text-sm text-slate-900">{dup.primaryTitle}</p>
                          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-[#134431]" />
                            Reported by <strong>{primaryIssueObj?.reporter.name || "Citizen Reporter 1"}</strong>
                          </p>
                        </div>
                        <div className="rounded-xl overflow-hidden aspect-video bg-slate-200 relative group">
                          <img src={dup.primaryPhoto} alt="Primary" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-[11px] font-medium">Primary photographic evidence</span>
                          </div>
                        </div>
                      </div>

                      {/* Duplicate Candidate */}
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
                            Candidate Duplicate #{dup.duplicateId}
                          </span>
                          <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {dupIssueObj?.upvotes || 18} Upvotes
                          </span>
                        </div>
                        <div>
                          <p className="font-headline font-bold text-sm text-slate-900">{dup.duplicateTitle}</p>
                          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-amber-700" />
                            Reported by <strong>{dupIssueObj?.reporter.name || "Citizen Reporter 2"}</strong>
                          </p>
                        </div>
                        <div className="rounded-xl overflow-hidden aspect-video bg-slate-200 relative group">
                          <img src={dup.duplicatePhoto} alt="Duplicate" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-[11px] font-medium">Duplicate photographic evidence</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] text-slate-500">
                        ⚡ Merging will combine upvotes, migrate comments, and send notification to Candidate reporter.
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => setDuplicates(prev => prev.filter(d => d.id !== dup.id))}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Keep Separate
                        </button>
                        <button
                          disabled={mergeLoading}
                          onClick={() => handleMergeDuplicate(dup.id)}
                          className="px-5 py-2 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{mergeLoading ? "Merging..." : "Merge into Primary Ticket"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* MANUAL MULTI-USER DUPLICATE MERGE MODAL */}
          {manualMergeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-headline font-black text-lg text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#134431]" />
                      <span>Consolidate Duplicate Tickets (Cross-User Merge)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select two tickets submitted by different citizens to combine their upvotes and community validation.
                    </p>
                  </div>
                  <button
                    onClick={() => setManualMergeOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleExecuteManualMerge} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primary Issue Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        1. Primary Ticket (Retained Master)
                      </label>
                      <select
                        value={manualPrimaryId}
                        onChange={(e) => setManualPrimaryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#134431]/20 focus:border-[#134431]"
                        required
                      >
                        <option value="">-- Choose Primary Ticket --</option>
                        {deptIssues.map((i) => (
                          <option key={`prim-${i.id}`} value={i.id}>
                            #{i.id} - {i.title.slice(0, 35)}... ({i.reporter?.name || "Citizen"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Duplicate Issue Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        2. Duplicate Ticket (To be Merged & Closed)
                      </label>
                      <select
                        value={manualDuplicateId}
                        onChange={(e) => setManualDuplicateId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#134431]/20 focus:border-[#134431]"
                        required
                      >
                        <option value="">-- Choose Duplicate Ticket --</option>
                        {deptIssues
                          .filter((i) => i.id !== manualPrimaryId)
                          .map((i) => (
                            <option key={`dup-${i.id}`} value={i.id}>
                              #{i.id} - {i.title.slice(0, 35)}... ({i.reporter?.name || "Citizen"})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Visual Side-by-Side Comparison Preview */}
                  {manualPrimaryId && manualDuplicateId && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      {(() => {
                        const prim = deptIssues.find((i) => i.id === manualPrimaryId);
                        const dup = deptIssues.find((i) => i.id === manualDuplicateId);
                        return (
                          <>
                            <div className="space-y-1.5 p-3 rounded-xl bg-white border border-[#cbe7d7]">
                              <span className="text-[9px] font-bold text-[#134431] uppercase">Primary #{prim?.id}</span>
                              <p className="font-headline font-bold text-xs text-slate-900 line-clamp-1">{prim?.title}</p>
                              <div className="text-[11px] text-slate-500">
                                Citizen: <strong className="text-slate-700">{prim?.reporter?.name || "User A"}</strong> • {prim?.upvotes || 0} Upvotes
                              </div>
                            </div>
                            <div className="space-y-1.5 p-3 rounded-xl bg-white border border-amber-200">
                              <span className="text-[9px] font-bold text-amber-800 uppercase">Duplicate #{dup?.id}</span>
                              <p className="font-headline font-bold text-xs text-slate-900 line-clamp-1">{dup?.title}</p>
                              <div className="text-[11px] text-slate-500">
                                Citizen: <strong className="text-slate-700">{dup?.reporter?.name || "User B"}</strong> • {dup?.upvotes || 0} Upvotes
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Justification note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Merge Remark / Justification (Logged in Public Audit Timeline)
                    </label>
                    <input
                      type="text"
                      value={manualMergeReason}
                      onChange={(e) => setManualMergeReason(e.target.value)}
                      placeholder="e.g. Same drainage rupture on 4th Main reported by multiple citizens."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#134431]/20 focus:border-[#134431]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setManualMergeOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mergeLoading || !manualPrimaryId || !manualDuplicateId}
                      className="px-5 py-2.5 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{mergeLoading ? "Consolidating..." : "Confirm & Consolidate Merge"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. DEDICATED TAB: ESCALATIONS & SLA BREACHES */}
      {currentTab === "escalations" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>SLA Breaches &amp; Priority Escalations</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tickets exceeding guaranteed resolution benchmarks requiring immediate executive intervention.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200">
              {deptIssues.filter(i => i.urgency === "Critical").length} Critical Breaches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Issue Description</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {deptIssues.filter(i => i.urgency === "Critical" || i.urgency === "High").map((t) => (
                  <tr key={t.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3 px-4 font-headline font-black text-[#134431]">#{t.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{t.title}</td>
                    <td className="py-3 px-4">{typeof t.location === "object" ? t.location.address : t.location}</td>
                    <td className="py-3 px-4 text-rose-600 font-bold">{t.urgency}</td>
                    <td className="py-3 px-4 font-bold">{t.status}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          updateIssueStatus(t.id, "In Progress", "Executive emergency supervisor intervention dispatched.");
                          alert(`Emergency supervisor alert dispatched for Ticket #${t.id}`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition-all"
                      >
                        Emergency Re-route
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. DEDICATED TAB: SLA CALENDAR */}
      {currentTab === "calendar" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>SLA Deadlines &amp; Maintenance Schedule</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Color-coded calendar dynamically showing active ticket deadlines and scheduled ward drives.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Emergency</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Active SLA</span>
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Resolved</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="font-bold text-slate-400 uppercase py-1 text-[11px]">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => {
              const hasTicket = deptIssues[date % Math.max(1, deptIssues.length)];
              const isToday = date === 27;

              return (
                <div
                  key={date}
                  className={cn(
                    "p-3 rounded-2xl border text-left min-h-[76px] transition-all relative",
                    isToday
                      ? "bg-[#edf7f1] border-emerald-500 font-bold"
                      : "bg-slate-50/60 border-slate-100 hover:bg-white hover:shadow-xs"
                  )}
                >
                  <span className="font-headline font-bold text-xs text-slate-800">{date}</span>
                  {isToday && hasTicket && (
                    <div className="mt-1 space-y-1">
                      <div className="p-1 rounded bg-rose-100 text-rose-800 text-[9px] font-bold truncate">
                        #{hasTicket.id} ({hasTicket.category})
                      </div>
                    </div>
                  )}
                  {date === 28 && (
                    <div className="mt-1 space-y-1">
                      <div className="p-1 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold truncate">
                        Ward Maintenance Drive
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10. DEDICATED TAB: OFFICIAL COMMUNITY ANNOUNCEMENTS (HYPERLOCAL PIN TARGETING) */}
      {currentTab === "announcements" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Main Broadcast Composer */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-6">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
                    <Megaphone className="w-5 h-5" />
                  </span>
                  <h2 className="font-headline font-black text-xl text-slate-900">
                    Hyperlocal Community Broadcast Composer
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dispatch official municipal advisories and alerts targeted strictly to specific PIN codes, a cluster of PINs, or your full jurisdiction.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-[#edf7f1] text-[#134431] border border-[#cbe7d7] text-xs font-bold self-start sm:self-auto">
                BMC {departmentName} Division
              </span>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-5">
              {/* 1. Target Audience Scope Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>1. Select Target Geographic Scope</span>
                  <span className="text-[11px] font-medium text-slate-400">Restricts notification &amp; feed alerts</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetScope("multiple")}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                      targetScope === "multiple"
                        ? "bg-[#edf7f1] border-emerald-600 text-[#134431] shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">🏘️ Multi-PIN Cluster</span>
                      {targetScope === "multiple" && <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Target selected set of pincodes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope("single")}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                      targetScope === "single"
                        ? "bg-[#edf7f1] border-emerald-600 text-[#134431] shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">🎯 Single PIN Code</span>
                      {targetScope === "single" && <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Strictly broadcast to 1 specific PIN</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope("all")}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                      targetScope === "all"
                        ? "bg-[#edf7f1] border-emerald-600 text-[#134431] shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">🌐 All Jurisdiction</span>
                      {targetScope === "all" && <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">All residents across all wards</p>
                  </button>
                </div>
              </div>

              {/* 2. PIN Selection Chips (for Single or Multiple modes) */}
              {targetScope !== "all" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{targetScope === "single" ? "Choose or Enter Target PIN:" : "Active Department PIN Codes (Click to toggle):"}</span>
                    </p>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {targetScope === "single"
                        ? `Target: PIN ${customPincodeInput || selectedPincodes[0] || "751024"}`
                        : `${selectedPincodes.length} PINs Selected`}
                    </span>
                  </div>

                  {/* Active Chips from department issues */}
                  <div className="flex flex-wrap gap-2">
                    {activeDepartmentPincodes.map((pin) => {
                      const isSelected = selectedPincodes.includes(pin);
                      return (
                        <button
                          key={pin}
                          type="button"
                          onClick={() => {
                            if (targetScope === "single") {
                              setSelectedPincodes([pin]);
                              setCustomPincodeInput(pin);
                            } else {
                              setSelectedPincodes((prev) =>
                                isSelected ? prev.filter((p) => p !== pin) : [...prev, pin]
                              );
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer",
                            (targetScope === "single" && (customPincodeInput === pin || (!customPincodeInput && selectedPincodes[0] === pin))) ||
                            (targetScope === "multiple" && isSelected)
                              ? "bg-[#134431] text-white border-emerald-950 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          <span>PIN {pin}</span>
                          {((targetScope === "single" && (customPincodeInput === pin || (!customPincodeInput && selectedPincodes[0] === pin))) ||
                            (targetScope === "multiple" && isSelected)) && (
                            <Check className="w-3 h-3 text-emerald-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom PIN input field */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      placeholder="Add custom 6-digit PIN (e.g. 751030)..."
                      value={customPincodeInput}
                      onChange={(e) => setCustomPincodeInput(e.target.value.replace(/\D/g, ""))}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#134431] w-64"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPincodeInput.length === 6) {
                          if (targetScope === "single") {
                            setSelectedPincodes([customPincodeInput]);
                          } else {
                            if (!selectedPincodes.includes(customPincodeInput)) {
                              setSelectedPincodes((prev) => [...prev, customPincodeInput]);
                            }
                          }
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add PIN
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Category & Urgency Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Advisory Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "Emergency", label: "🔴 Emergency", color: "bg-rose-50 border-rose-300 text-rose-800" },
                      { id: "Advisory", label: "🟡 Advisory", color: "bg-amber-50 border-amber-300 text-amber-800" },
                      { id: "Normal", label: "🟢 Public Notice", color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
                    ].map((urg) => (
                      <button
                        key={urg.id}
                        type="button"
                        onClick={() => setAnnouncementUrgency(urg.id as any)}
                        className={cn(
                          "py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                          announcementUrgency === urg.id
                            ? `${urg.color} ring-2 ring-emerald-600 font-black shadow-xs`
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {urg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Advisory Classification
                  </label>
                  <select
                    value={announcementCategory}
                    onChange={(e) => setAnnouncementCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#134431]"
                  >
                    <option value="Water Supply Notice">💧 Water Supply &amp; Pipeline Repair</option>
                    <option value="Road Works & Traffic">🚧 Road Resurfacing &amp; Diversion</option>
                    <option value="Power Outage Schedule">⚡ Electricity Grid Maintenance</option>
                    <option value="Sanitation Mega Drive">🧹 Ward Sanitation &amp; Waste Drive</option>
                    <option value="Monsoon Drainage Advisory">🌧️ Drainage &amp; Flood Preparedness</option>
                    <option value="General Civic Notice">📢 General Citizen Advisory</option>
                  </select>
                </div>
              </div>

              {/* 4. Title & Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Broadcast Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cauvery Phase-IV Valve Repair: Reduced Pressure Notice"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#134431]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Broadcast Content &amp; Instructions for Residents
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the affected streets in the targeted PINs, expected timeline of restoration, and helpline numbers for emergency supply..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#134431] resize-none leading-relaxed"
                />
              </div>

              {/* 5. Audience Reach & Dispatch Button */}
              <div className="p-4 rounded-2xl bg-[#f4fbf7] border border-[#cbe7d7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#134431] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Estimated Citizen Reach</span>
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    {targetScope === "all"
                      ? "Dispatches to ~18,500 verified residents in all city wards."
                      : `Dispatches strictly to registered residents in PIN: ${selectedPincodes.join(", ") || "Selected"}.`}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isPublishingAnnouncement}
                  className="px-6 py-3 rounded-full bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {broadcastSent ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Advisory Published &amp; Dispatched!</span>
                    </>
                  ) : isPublishingAnnouncement ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting to PINs...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Targeted Advisory →</span>
                    </>
                  )}
                </button>
              </div>

              {broadcastFeedback && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-medium animate-fadeIn">
                  ✓ {broadcastFeedback.message}
                </div>
              )}
            </form>
          </div>

          {/* Active Broadcast Ledger & History */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900">
                  Active Department Broadcasts ({announcements.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Currently active advisories displayed to citizens on their feed and notification center.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchAnnouncements(undefined, departmentName)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Refresh Broadcasts"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <Megaphone className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No active broadcasts published yet</p>
                <p className="text-[11px] text-slate-400">Compose an advisory above to notify residents of scheduled repairs.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => {
                  const isEmergency = ann.urgency === "Emergency";
                  const targetPins = ann.pincodes && ann.pincodes.length > 0 ? ann.pincodes : ["ALL"];

                  return (
                    <div
                      key={ann.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3",
                        isEmergency
                          ? "bg-rose-50/50 border-rose-200"
                          : "bg-slate-50/80 border-slate-200/80 hover:bg-white"
                      )}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                            isEmergency ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-amber-100 text-amber-900 border border-amber-300"
                          )}>
                            {ann.urgency || "Advisory"}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                            {ann.category || "General"}
                          </span>

                          <div className="flex items-center gap-1">
                            {targetPins.map((p) => (
                              <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#134431] text-emerald-100">
                                📍 PIN {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        <h4 className="font-headline font-bold text-sm text-slate-900">
                          {ann.title}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {ann.message}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                          <span>Author: {ann.authorName || "Department Officer"}</span>
                          <span>•</span>
                          <span>Published: {new Date(ann.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Deactivate broadcast "${ann.title}"?`)) {
                            await deleteAnnouncement(ann.id);
                          }
                        }}
                        className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Retract</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. DEDICATED TAB: PARTICIPATORY BUDGETING MANAGER (POLLS) */}
      {currentTab === "polls" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <Vote className="w-5 h-5 text-[#134431]" />
                Participatory Budgeting Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create new civic proposals and monitor live community voting allocations across wards.
              </p>
            </div>
            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#134431] hover:bg-[#0c2e21] text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Proposal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {proposals.map(proposal => (
              <div key={proposal.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#134431]/10 text-[#134431]">
                      {proposal.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                      PIN {proposal.wardPin}
                    </span>
                  </div>
                  <h3 className="font-headline font-black text-lg text-slate-900">{proposal.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span>Votes: <span className="text-emerald-700">{proposal.currentVotes.toLocaleString()}</span></span>
                    <span>Budget: <span className="text-[#134431]">₹{proposal.requiredBudget.toLocaleString('en-IN')}</span></span>
                  </div>
                </div>
                
                <div className="shrink-0 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Live Status Update</label>
                  <select
                    value={proposal.status}
                    onChange={(e) => updateProposalStatus(proposal.id, e.target.value as any)}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none appearance-none cursor-pointer text-center",
                      proposal.status === "Open for Voting" && "bg-blue-50 text-blue-800 border-blue-200",
                      proposal.status === "Threshold Met" && "bg-emerald-50 text-emerald-800 border-emerald-200",
                      proposal.status === "In Execution" && "bg-amber-50 text-amber-800 border-amber-200"
                    )}
                  >
                    <option value="Open for Voting">Open for Voting</option>
                    <option value="Threshold Met">Threshold Met</option>
                    <option value="In Execution">In Execution</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* CREATE PROPOSAL MODAL */}
          {isProposalModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
                <h3 className="font-headline font-black text-xl text-slate-900 mb-4 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-[#0B402C]" />
                  Create New Proposal
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!proposalForm.title || !proposalForm.description || !proposalForm.requiredBudget || !proposalForm.wardPin) {
                      return;
                    }
                    addProposal({
                      title: proposalForm.title,
                      category: proposalForm.category,
                      description: proposalForm.description,
                      requiredBudget: parseInt(proposalForm.requiredBudget, 10),
                      wardPin: proposalForm.wardPin,
                      createdBy: `Officer ${user?.name || "Admin"}`,
                    });
                    setProposalForm({
                      title: "",
                      category: departmentName,
                      description: "",
                      requiredBudget: "",
                      wardPin: "751024",
                    });
                    setIsProposalModalOpen(false);
                  }}
                  className="space-y-4 text-sm"
                >
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Project Title <span className="text-rose-500">*</span></label>
                    <input
                      required
                      autoFocus
                      type="text"
                      placeholder="e.g., New Solar Streetlights"
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Category <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={proposalForm.category}
                      onChange={(e) => setProposalForm({ ...proposalForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors bg-white"
                    >
                      <option value="Roads">Roads & Infrastructure</option>
                      <option value="Water">Water Works</option>
                      <option value="Sanitation">Sanitation</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Parks">Parks & Recreation</option>
                      <option value={departmentName}>{departmentName}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Description <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Briefly describe the proposal and its benefits..."
                      value={proposalForm.description}
                      onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">Required Budget (₹) <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="e.g., 1500000"
                        value={proposalForm.requiredBudget}
                        onChange={(e) => setProposalForm({ ...proposalForm, requiredBudget: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">Ward PIN <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="text"
                        placeholder="e.g., 751024"
                        value={proposalForm.wardPin}
                        onChange={(e) => setProposalForm({ ...proposalForm, wardPin: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B402C] focus:border-[#0B402C] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProposalModalOpen(false);
                        setProposalForm({
                          title: "",
                          category: departmentName,
                          description: "",
                          requiredBudget: "",
                          wardPin: "751024",
                        });
                      }}
                      className="px-4 py-2 rounded-md font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#0B402C] text-white hover:bg-[#083020] rounded-md px-4 py-2 font-bold transition-colors shadow-md"
                    >
                      Publish Proposal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 11. DEDICATED TAB: AUDIT REPORTS & EXPORT */}
      {currentTab === "reports" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <span>Executive Municipal Audit &amp; Compliance Sheets</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download verified performance logs, SLA compliance records, and contractor expenditures for administrative reviews.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-headline font-bold text-sm text-slate-900">Weekly SLA Compliance Report</h4>
              <p className="text-xs text-slate-500 font-medium">{deptIssues.length} Department Tickets • {resolvedCount} Resolved</p>
              <button
                onClick={() => alert(`Downloading ${departmentName}_SLA_Audit_Ward63.pdf`)}
                className="w-full py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-headline font-bold text-sm text-slate-900">Monthly Contractor &amp; Squad Ledger</h4>
              <p className="text-xs text-slate-500 font-medium">BMC {departmentName} Division • Active Crew Logs</p>
              <button
                onClick={() => alert(`Downloading ${departmentName}_Squad_Expenditure.csv`)}
                className="w-full py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-headline font-bold text-sm text-slate-900">Ward Quality of Life Telemetry</h4>
              <p className="text-xs text-slate-500 font-medium">Bhubaneswar South Zone • Ward 63 Command</p>
              <button
                onClick={() => alert(`Downloading Ward_Telemetry_${departmentName}_Q3.pdf`)}
                className="w-full py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInnovationForReview && (
        <OfficerFeasibilityModal
          isOpen={isOfficerFeasibilityModalOpen}
          onClose={() => {
            setIsOfficerFeasibilityModalOpen(false);
            setSelectedInnovationForReview(null);
          }}
          issue={selectedInnovationForReview}
        />
      )}

    </div>
  );
}

export default function DepartmentOfficerPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading Operations Command...</div>}>
      <DepartmentOfficerContent />
    </React.Suspense>
  );
}
