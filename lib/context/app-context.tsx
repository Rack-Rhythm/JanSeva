"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  };
};

import {
  CivicIssue,
  INITIAL_ISSUES,
  UserProfile,

  NotificationItem,
  INITIAL_NOTIFICATIONS,
  WardInfo,
  WARD_42_DATA,
  OfficialAnnouncement,
} from "@/lib/data/mock-data";
import { DEFAULT_LOCATION, DEFAULT_USER_FALLBACK } from "@/lib/data/default-location";
import { getAnnouncements, createAnnouncement, deleteAnnouncement as deleteAnnouncementApi } from "@/lib/api/announcements";

import {
  authService,
  fetchWithAuth,
  setAccessToken,
} from "@/lib/auth/auth-service-cookie3";
import {
  translations,
  Language,
  TranslationKey,
} from "@/i18n/translations";
import { translationService } from "@/lib/services/translation-service";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  quickActions?: {
    label: string;
    action: string;
  }[];
  suggestedIssueId?: string;
}

interface AppContextType {
  user: UserProfile | null;
  isLoadingAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  logout: () => Promise<void>;
  switchRole: (
    role: "citizen" | "officer" | "corporator"
  ) => void;

  issues: CivicIssue[];
  refreshIssues: () => Promise<void>;
  toggleUpvote: (issueId: string) => void;
  addIssue: (issue: Partial<CivicIssue>) => Promise<CivicIssue>;
  deleteIssue: (issueId: string) => void;
  mergeIssues: (
    primaryId: string,
    duplicateId: string,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;

  updateIssueStatus: (
    issueId: string,
    status: CivicIssue["status"],
    note?: string,
    photo?: string,
    extraFields?: {
      officer_verdict?: string;
      officer_feedback?: string;
      estimated_budget?: string;
      assigned_department?: string;
    }
  ) => void;

  updateInnovationVerdict: (
    issueId: string,
    verdict: "Under Review" | "Feasibility Approved" | "Pilot Scheduled" | "Budget Allocated" | "Rejected",
    feedbackNote: string,
    assignedDept?: string,
    estimatedBudget?: string
  ) => Promise<void>;

  voteVerification: (
    issueId: string,
    vote: "yes" | "no"
  ) => void;

  addComment: (issueId: string, text: string) => void;

  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotifsCount: number;

  wardData: WardInfo;
  votePoll: (optionId: string) => void;
  userPollVote: string | null;

  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;

  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;

  activeFilter: string;
  setActiveFilter: (filter: string) => void;

  announcements: OfficialAnnouncement[];
  fetchAnnouncements: (pincode?: string, department?: string) => Promise<void>;
  publishAnnouncement: (payload: {
    title: string;
    message: string;
    department: string;
    pincodes: string[];
    urgency?: "Emergency" | "High" | "Advisory" | "Normal";
    category?: string;
    author_name?: string;
    author_role?: string;
    action_url?: string;
  }) => Promise<{ success: boolean; message?: string; reachCount?: number }>;
  deleteAnnouncement: (id: string | number) => Promise<boolean>;

  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  translateText: (text: string) => Promise<string>;
  allLanguages: { code: Language; name: string }[];
}

const AppContext = createContext<AppContextType | undefined>(
  undefined
);

// Bridge for pure API functions in lib/api/issues.ts to mutate context fallbacks
export const MockContextBridge: {
  getIssues: () => CivicIssue[];
  toggleUpvote: (issueId: string) => void;
  addComment: (issueId: string, text: string) => void;
  mergeIssues?: (primaryId: string, duplicateId: string, reason?: string) => void;
} = {
  getIssues: () => [],
  toggleUpvote: () => { },
  addComment: () => { },
};

export function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [issues, setIssues] =
    useState<CivicIssue[]>(INITIAL_ISSUES);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [announcements, setAnnouncements] =
    useState<OfficialAnnouncement[]>([]);

  const [wardData, setWardData] =
    useState<WardInfo>(WARD_42_DATA);

  const [userPollVote, setUserPollVote] =
    useState<string | null>(null);

  const [isAiDrawerOpen, setIsAiDrawerOpen] =
    useState(false);

  const [language, setLanguageState] =
    useState<Language>("en");

  // Load language preference from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("janseva_lang") as Language;
      if (savedLang && translations[savedLang]) {
        setLanguageState(savedLang);
      }
    } catch (e) { }
  }, []);

  const setLanguage = (newLang: Language) => {
    if (translations[newLang]) {
      setLanguageState(newLang);
      try {
        localStorage.setItem("janseva_lang", newLang);
      } catch (e) { }
    }
  };

  const t = (key: TranslationKey): string => {
    const currentLangDict = translations[language] || translations.en;
    if (key in currentLangDict) {
      return (currentLangDict as any)[key] || (translations.en as any)[key] || key;
    }
    return (translations.en as any)[key] || key;
  };

  const allLanguages = (Object.keys(translations) as Language[]).map((code) => ({
    code,
    name: translations[code].name,
  }));

  const translateText = async (text: string): Promise<string> => {
    const langObj = allLanguages.find((l) => l.code === language);
    return translationService.translateText(text, language, langObj?.name);
  };

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);

  // Load user-specific chat history from localStorage
  useEffect(() => {
    if (!user) return;
    const storageKey = `janseva_chat_history_${user.id || user.username}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setChatMessages(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.warn("Failed to load user chat history:", e);
    }

    const userName = user?.name || user?.username || "Citizen";
    const firstName = userName.split(" ")[0] || "Citizen";

    const defaultMsg: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      sender: "assistant",
      text: `Hello ${firstName}! I'm JanSeva AI. Ask me anything about your reported tickets, municipal SLA targets, or how to level up your Civic Citizen XP.`,
      timestamp: new Date().toISOString(),
      quickActions: [
        { label: "⚡ My Active Tickets", action: "my_tickets" },
        { label: "📍 Ward SLA Status", action: "ward_sla" },
        { label: "🏆 My XP & Badges", action: "my_xp" },
      ],
    };
    setChatMessages([defaultMsg]);
  }, [user?.id, user?.username, user?.name]);

  // Sync state to MockContextBridge so that non-React API files can access it during mock fallbacks
  useEffect(() => {
    MockContextBridge.getIssues = () => issues;
    // We will assign the other methods below when they are defined in scope
  }, [issues]);

  // Install global fetch interceptor for API calls
  // to attach Authorization and perform cookie-based refresh.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch.bind(window);

    const API_ROOT =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    window.fetch = async (
      input: URL | RequestInfo,
      init: RequestInit = {}
    ): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.startsWith(API_ROOT)) {
        return fetchWithAuth(input, init);
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const fetchIssues = async () => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    try {
      const res = await fetchWithAuth(
        `${API_URL}/api/issues/?page=1&page_size=20`,
        { cache: "no-store" }
      );

      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data?.results && Array.isArray(data.results) ? data.results : []);

        if (Array.isArray(rawList)) {
          setIssues((prevIssues) => {
            // Keep any local unpersisted issues along with fresh backend data
            const backendIds = new Set(rawList.map((i: any) => i.id));
            const localOnlyIssues = prevIssues.filter(i => !backendIds.has(i.id));

            return [...rawList, ...localOnlyIssues];
          });
        }
      }
    } catch (e) {
      console.error(
        "Failed to fetch issues from backend, using fallback.",
        e
      );
    }
  };

  const fetchNotifications = async () => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/notifications/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();

        setNotifications((prevNotifs) => {
          const backendIds = new Set(data.map((n: any) => n.id));
          const localOnlyNotifs = prevNotifs.filter(n => !backendIds.has(n.id));
          return [...data, ...localOnlyNotifs];
        });
      }
    } catch (e) {
      console.error(
        "Failed to fetch notifications from backend.",
        e
      );
    }
  };

  const fetchAnnouncements = async (pincode?: string, department?: string) => {
    try {
      const pin = pincode || user?.pincode;
      const data = await getAnnouncements(pin, department);
      setAnnouncements(data);
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
    }
  };

  const publishAnnouncement = async (payload: {
    title: string;
    message: string;
    department: string;
    pincodes: string[];
    urgency?: "Emergency" | "High" | "Advisory" | "Normal";
    category?: string;
    author_name?: string;
    author_role?: string;
    action_url?: string;
  }) => {
    const res = await createAnnouncement(payload);
    if (res.success && res.announcement) {
      setAnnouncements((prev) => [res.announcement!, ...prev]);
      const targetPinStr = payload.pincodes && payload.pincodes.length > 0 ? payload.pincodes.join(", ") : "ALL";
      const newNotif: NotificationItem = {
        id: `ann-${res.announcement.id || Date.now()}`,
        title: `📢 [${payload.department.toUpperCase()} NOTICE - PIN ${targetPinStr}]: ${payload.title}`,
        message: payload.message,
        type: "officer",
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: `/feed?pin=${payload.pincodes[0] || ""}`,
        pincodes: payload.pincodes,
        department: payload.department,
        urgency: payload.urgency || "Advisory",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
    return res;
  };

  const deleteAnnouncement = async (id: string | number) => {
    const ok = await deleteAnnouncementApi(id);
    if (ok) {
      setAnnouncements((prev) => prev.filter((a) => String(a.id) !== String(id)));
    }
    return ok;
  };

  const fetchUserProfile = async () => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/auth/profile/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (res.ok) {
        const userProfile = await res.json();

        const { normalizeUser } = await import("@/lib/api/auth");
        const formattedUser = normalizeUser(userProfile);

        setUser(formattedUser);

        localStorage.setItem(
          "janseva_user",
          JSON.stringify(formattedUser)
        );
      }
    } catch (e) {
      console.error(
        "Failed to fetch user profile.",
        e
      );
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const savedIssues = localStorage.getItem("janseva_issues");
        if (savedIssues) {
          setIssues(JSON.parse(savedIssues));
        }

        const savedUser = localStorage.getItem("janseva_user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        const savedNotifs = localStorage.getItem("janseva_notifs");
        if (savedNotifs) {
          setNotifications(JSON.parse(savedNotifs));
        }

        const savedPoll = localStorage.getItem("janseva_poll_vote");
        if (savedPoll) {
          setUserPollVote(savedPoll);
        }

        // Attempt to restore session using HttpOnly refresh cookie
        try {
          await authService.tryRestoreSession();
        } catch (sessionError) {
          console.warn("Could not restore backend session, continuing with local state", sessionError);
        }
      } catch (e) {
        console.error(
          "Failed to load local storage state",
          e
        );
      }

      // Non-blocking warm-up probe to wake up Render if idle
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      fetch(`${API_URL}/api/hello/`, { cache: "no-store" }).catch(() => {});

      // Parallel Data Fetching: Execute all initial requests concurrently to eliminate waterfalls
      const token = typeof window !== "undefined" ? localStorage.getItem("janseva_token") : null;
      const initialFetchPromises: Promise<any>[] = [
        fetchIssues(),
        fetchAnnouncements(),
      ];

      if (token) {
        initialFetchPromises.push(fetchUserProfile());
        initialFetchPromises.push(fetchNotifications());
      } else {
        authService.tryRestoreSession().then((restored) => {
          if (restored) {
            fetchUserProfile();
            fetchNotifications();
          }
        }).catch(() => {});
      }

      await Promise.allSettled(initialFetchPromises);
      setIsLoadingAuth(false);
    };

    initData();

    // Set up lightweight background polling (only when tab is active and focused)
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return; // Skip polling in background/hidden tabs to save network bandwidth
      }
      const token = typeof window !== "undefined" ? localStorage.getItem("janseva_token") : null;
      fetchAnnouncements();
      if (token) {
        fetchNotifications();
      }
    }, 60000);

    return () => clearInterval(pollInterval);
  }, []);

  // Save issues to localStorage and bridge to MockContextBridge
  useEffect(() => {
    try {
      localStorage.setItem(
        "janseva_issues",
        JSON.stringify(issues)
      );
      MockContextBridge.getIssues = () => issues;
      MockContextBridge.toggleUpvote = toggleUpvote;
      MockContextBridge.addComment = addComment;
    } catch (e) {
      console.error(e);
    }
  }, [issues]);

  // Save authenticated user to localStorage
  useEffect(() => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("janseva_token")
          : null;

      if (token && user) {
        localStorage.setItem(
          "janseva_user",
          JSON.stringify(user)
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Save notifications
  useEffect(() => {
    try {
      localStorage.setItem(
        "janseva_notifs",
        JSON.stringify(notifications)
      );
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  const switchRole = (
    role: "citizen" | "officer" | "corporator"
  ) => {
    if (!user) return;

    if (role === "citizen") {
      setUser({
        ...user,
        role: "citizen",
      });
    } else if (role === "officer") {
      setUser({
        ...user,
        role: "officer",
        levelTitle: "Senior Ward Officer",
      });
    } else if (role === "corporator") {
      setUser({
        ...user,
        role: "corporator",
        levelTitle: "Ward 42 Corporator",
      });
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    setAccessToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("janseva_token");
      localStorage.removeItem("janseva_user");
      localStorage.removeItem("janseva_role");
    }
    setUser(null);
  };

  const toggleUpvote = async (issueId: string) => {
    setIssues((prev: CivicIssue[]) =>
      prev.map((issue: CivicIssue) => {
        if (issue.id === issueId) {
          const isUpvoted = !issue.isUpvoted;
          const newUpvotes = isUpvoted
            ? issue.upvotes + 1
            : issue.upvotes - 1;

          return {
            ...issue,
            upvotes: newUpvotes,
            isUpvoted,
          };
        }

        return issue;
      })
    );

    const target = issues.find((i: CivicIssue) => i.id === issueId);
    const willUpvote = !target?.isUpvoted;

    // Give or deduct user Civic Citizen XP optimistically
    setUser((prev: UserProfile | null) => {
      if (!prev) return prev;
      const newXP = willUpvote ? (prev.civicCitizenXP + 5) : Math.max(0, prev.civicCitizenXP - 5);
      return {
        ...prev,
        civicCitizenXP: newXP,
        stats: {
          ...prev.stats,
          upvotesGiven: willUpvote ? ((prev.stats?.upvotesGiven || 0) + 1) : Math.max(0, (prev.stats?.upvotesGiven || 0) - 1),
        },
      };
    });

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    if (token) {
      try {
        await fetch(
          `${API_URL}/api/issues/${issueId}/upvote/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        fetchIssues();
      } catch (e) {
        console.error(
          "Failed to upvote on backend",
          e
        );
      }
    }
  };

  const addIssue = async (
    newIssueData: Partial<CivicIssue>
  ): Promise<CivicIssue> => {
    if (!user) throw new Error("User not authenticated");
    const isTempId = !newIssueData.id || newIssueData.id.startsWith("JS-temp-");
    const id = newIssueData.id || `JS-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const now = new Date().toISOString();

    const isInnovation = Boolean(newIssueData.isInnovation || newIssueData.category === "Innovation");

    let createdIssue: CivicIssue = {
      id,
      title:
        newIssueData.title ||
        (isInnovation ? "Community Innovation Proposal" : "Civic Grievance Report"),
      description:
        newIssueData.description ||
        (isInnovation ? "Innovative community project suggested by citizen." : "Reported via JanSeva AI Quick Assistant."),
      category: isInnovation ? "Innovation" : (newIssueData.category || "Sanitation"),
      status: isInnovation ? (newIssueData.status || "Under Review") : "AI Verified",
      urgency: newIssueData.urgency || "Moderate",
      isInnovation,
      innovationTheme: newIssueData.innovationTheme || (isInnovation ? "Sustainable Infrastructure" : undefined),
      estimatedBudget: newIssueData.estimatedBudget,
      communityBenefit: newIssueData.communityBenefit,
      officerVerdict: isInnovation ? (newIssueData.officerVerdict || "Under Review") : undefined,
      officerFeedback: newIssueData.officerFeedback || "",
      location: newIssueData.location || {
        address: `${DEFAULT_LOCATION.ward}, ${DEFAULT_LOCATION.city}, ${DEFAULT_LOCATION.state}`,
        ward: DEFAULT_LOCATION.ward,
        wardNumber: DEFAULT_LOCATION.wardNumber,
        pincode: (newIssueData as any)?.pin_code || (newIssueData as any)?.pincode || user?.pincode || "751024",
        lat: 20.270 + (Math.random() - 0.5) * 0.01,
        lng: 85.760 + (Math.random() - 0.5) * 0.01,
      },
      reporter: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.verifiedCitizen,
        karma: user.civicCitizenXP,
      },
      images: {
        reported:
          newIssueData.images?.reported ||
          "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
      },
      aiAnalysis:
        newIssueData.aiAnalysis || {
          detectedObject: isInnovation ? (newIssueData.innovationTheme || "Community Innovation") : "Verified Infrastructure Hazard",
          confidence: 97.5,
          estimatedSeverity: isInnovation ? "Community Innovation Initiative" : "High Priority Civic Issue",
          predictedDepartment: isInnovation ? "Municipal Innovation & Urban Planning" : `${DEFAULT_LOCATION.municipalBody} ${DEFAULT_LOCATION.ward} Maintenance`,
          suggestedSlaHours: isInnovation ? 72 : 24,
          summary: isInnovation ? (newIssueData.communityBenefit || "Citizen submitted innovation proposal for community benefit.") : "AI verified valid physical hazard from geo-tagged image.",
          ...(isInnovation ? {
            is_innovation: true,
            innovation_theme: newIssueData.innovationTheme,
            estimated_budget: newIssueData.estimatedBudget,
            community_benefit: newIssueData.communityBenefit,
            officer_verdict: "Under Review"
          } : {})
        },
      assignedDepartment:
        newIssueData.assignedDepartment || (isInnovation ? "Urban Planning & Innovation Council" : `${DEFAULT_LOCATION.municipalBody} ${DEFAULT_LOCATION.ward} Rapid Response`),
      timeline: isInnovation ? [
        {
          stage: "Proposal Submitted",
          timestamp: now,
          note: `Community Innovation Proposal submitted by ${user.name} for citizen endorsement and government feasibility review.`,
          actor: user.name,
        }
      ] : [
        {
          stage: "Reported",
          timestamp: now,
          note: `Report submitted by ${user.name} with AI Computer Vision validation.`,
          actor: user.name,
        },
        {
          stage: "AI Verified",
          timestamp: now,
          note:
            "Computer vision classified severity & auto-routed to municipal dispatch queue.",
          actor: "JanSeva AI Engine",
        },
      ],
      upvotes: 1,
      isUpvoted: true,
      commentsCount: 0,
      timesReported: 1,
      verificationVotes: {
        yes: 0,
        no: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    setIssues((prev: CivicIssue[]) => [
      createdIssue,
      ...prev.filter(i => i.id !== id),
    ]);

    // Give user Civic Citizen XP & update stats optimistically
    setUser((prev: UserProfile | null) => prev ? ({
      ...prev,
      civicCitizenXP: prev.civicCitizenXP + 50,
      stats: {
        ...prev.stats,
        issuesReported:
          (prev.stats?.issuesReported || 0) + 1,
      },
    }) : prev);

    // Add notification optimistically
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Report #${id} Submitted Successfully 🎉`,
      message: `Your issue "${createdIssue.title}" has been AI verified and queued for municipal action.`,
      type: "status",
      timestamp: now,
      read: false,
      issueId: id,
      actionUrl: `/issues/${id}`,
    };

    setNotifications((prev: NotificationItem[]) => [
      newNotif,
      ...prev,
    ]);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    // Only dispatch network POST if this issue is not already persisted with a backend ID
    if (isTempId) {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/issues/`, {
          method: "POST",
          body: JSON.stringify({
            title: createdIssue.title,
            description: createdIssue.description,
            category: createdIssue.category,
            status: createdIssue.status,
            urgency: createdIssue.urgency,
            location: createdIssue.location,
            pin_code: (newIssueData as any)?.pin_code || (createdIssue.location as any)?.pincode || "",
            images: createdIssue.images,
            aiAnalysis: createdIssue.aiAnalysis,
            assignedDepartment: createdIssue.assignedDepartment,
          }),
        });

        if (res.ok) {
          const resData = await res.json();

          if (resData.auto_merged && resData.primary_issue) {
            const primaryDbIssue = resData.primary_issue;
            const duplicateDbIssue = resData;

            setIssues((prev: CivicIssue[]) => {
              const filtered = prev.filter(
                (item: CivicIssue) => item.id !== id && item.id !== duplicateDbIssue.id && item.id !== primaryDbIssue.id
              );
              return [primaryDbIssue, ...filtered];
            });

            fetchUserProfile();
            fetchNotifications();
            return {
              ...primaryDbIssue,
              auto_merged: true,
              primary_issue_id: primaryDbIssue.id,
              primary_issue: primaryDbIssue,
              merge_reason: resData.merge_reason,
              duplicate_id: duplicateDbIssue.id,
            };
          } else {
            const dbIssue = resData;
            // Replace optimistic model with real DB object without duplicates
            setIssues((prev: CivicIssue[]) => {
              const filtered = prev.filter(
                (item: CivicIssue) => item.id !== id && item.id !== dbIssue.id
              );
              return [dbIssue, ...filtered];
            });

            fetchUserProfile();
            fetchNotifications();
            return dbIssue;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Backend issue save returned non-ok:", res.status, errData);
        }
      } catch (e) {
        console.error("Failed to save issue to backend", e);
      }
    }

    return createdIssue;
  };

  const deleteIssue = async (issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      await fetchWithAuth(`${API_URL}/api/issues/${issueId}/`, {
        method: "DELETE",
      });
      fetchIssues();
    } catch (e) {
      console.error("Failed to delete issue on backend", e);
    }
  };

  const mergeIssues = async (
    primaryId: string,
    duplicateId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (primaryId === duplicateId) {
      return { success: false, message: "Cannot merge an issue with itself." };
    }

    const now = new Date().toISOString();
    const actorName = user?.name || "Municipal Authority";

    // 1. Optimistic updates in React state
    setIssues((prev: CivicIssue[]) => {
      const primary = prev.find((i) => i.id === primaryId);
      const duplicate = prev.find((i) => i.id === duplicateId);

      if (!primary || !duplicate) return prev;

      const combinedUpvotes = Math.max(primary.upvotes + (duplicate.upvotes || 0), 1);
      const combinedComments = (primary.commentsCount || 0) + (duplicate.commentsCount || 0);

      const updatedPrimary: CivicIssue = {
        ...primary,
        upvotes: combinedUpvotes,
        commentsCount: combinedComments,
        timeline: [
          ...(primary.timeline || []),
          {
            stage: "Duplicate Merged",
            timestamp: now,
            note: `Merged duplicate report #${duplicate.id} ("${duplicate.title}") reported by ${duplicate.reporter?.name || "citizen"}. Upvotes and community reports consolidated.`,
            actor: actorName,
          },
        ],
      };

      const updatedDuplicate: CivicIssue = {
        ...duplicate,
        status: "Resolved",
        timeline: [
          ...(duplicate.timeline || []),
          {
            stage: "Merged into Primary",
            timestamp: now,
            note: `This report was confirmed as a duplicate and merged into #${primary.id}. Community upvotes and impact consolidated under #${primary.id}.`,
            actor: actorName,
          },
        ],
      };

      return prev.map((item) => {
        if (item.id === primaryId) return updatedPrimary;
        if (item.id === duplicateId) return updatedDuplicate;
        return item;
      });
    });

    // 2. Add notification for feedback
    const mergeNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Report #${duplicateId} Merged into #${primaryId} 🔗`,
      message: `Duplicate ticket #${duplicateId} was consolidated into primary ticket #${primaryId}.`,
      type: "officer",
      timestamp: now,
      read: false,
      issueId: primaryId,
      actionUrl: `/issues/${primaryId}`,
    };
    setNotifications((prev) => [mergeNotif, ...prev]);

    // 3. Persist to backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetchWithAuth(`${API_URL}/api/issues/merge/`, {
        method: "POST",
        body: JSON.stringify({
          primary_id: primaryId,
          duplicate_id: duplicateId,
          reason: reason || "Spatial AI & Visual similarity match confirmed duplicate.",
        }),
      });

      if (res.ok) {
        fetchIssues();
      }
    } catch (e) {
      console.warn("Backend merge sync fallback:", e);
    }

    return {
      success: true,
      message: `Issue #${duplicateId} successfully merged into #${primaryId}.`,
    };
  };

  const updateIssueStatus = async (
    issueId: string,
    status: CivicIssue["status"],
    note?: string,
    photo?: string,
    extraFields?: {
      officer_verdict?: string;
      officer_feedback?: string;
      estimated_budget?: string;
      assigned_department?: string;
    }
  ) => {
    const actorName = user?.name || "Verified Resident";
    const now = new Date().toISOString();

    setIssues((prev: CivicIssue[]) =>
      prev.map((issue: CivicIssue) => {
        if (issue.id === issueId) {
          const currentTimeline = Array.isArray(issue.timeline) ? issue.timeline : [];
          const updatedTimeline = [
            ...currentTimeline,
            {
              stage: status,
              timestamp: now,
              note:
                note ||
                `Status updated to ${status} by ${actorName}.`,
              actor: actorName,
            },
          ];

          const isOfficerRole = Boolean(user && (user.role === "officer" || user.role === "corporator" || (user.role as string) === "admin"));
          const shouldAssignOfficer = isOfficerRole && (status === "Assigned" || status === "In Progress" || (note && note.toLowerCase().includes("responsibility")));

          return {
            ...issue,
            status,
            updatedAt: now,
            timeline: updatedTimeline,
            assignedOfficer: shouldAssignOfficer && user ? {
              name: user.name || user.username || "Lead Officer",
              role: user.levelTitle || (user.role === "corporator" ? "Ward Corporator" : "Lead Officer"),
              avatar: user.avatar || "",
              phone: user.phone || (user as any).phoneNumber || "",
            } : issue.assignedOfficer,
            images: {
              ...(issue.images || {}),
              ...(photo
                ? { resolved: photo }
                : (status === "Verified Resolved" || status === "Resolved") && !issue.images?.resolved
                ? {
                    resolved:
                      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80",
                  }
                : {}),
            },
          };
        }

        return issue;
      })
    );

    // Notification to citizens optimistically
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Ticket #${issueId} Status: ${status}`,
      message:
        note ||
        `${actorName} transitioned ticket to ${status}.`,
      type: "officer",
      timestamp: now,
      read: false,
      issueId,
      actionUrl: `/issues/${issueId}`,
    };

    setNotifications((prev: NotificationItem[]) => [
      notif,
      ...prev,
    ]);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/issues/${encodeURIComponent(issueId)}/status/`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status,
            note,
            resolved_image: photo,
            assigned_officer_id: user?.id,
            officer_name: user?.name,
            ...(extraFields || {}),
          }),
        }
      );

      if (res.ok) {
        const updatedIssue = await res.json().catch(() => null);
        if (updatedIssue && updatedIssue.id) {
          setIssues((prev: CivicIssue[]) =>
            prev.map((i: CivicIssue) => (i.id === issueId || i.id === updatedIssue.id ? { ...i, ...updatedIssue } : i))
          );
        }
        fetchIssues();
      } else {
        console.warn(`Backend status update returned ${res.status}`);
      }
    } catch (e) {
      console.error(
        "Failed to update status on backend",
        e
      );
    }
  };

  const updateInnovationVerdict = async (
    issueId: string,
    verdict: "Under Review" | "Feasibility Approved" | "Pilot Scheduled" | "Budget Allocated" | "Rejected",
    feedbackNote: string,
    assignedDept?: string,
    estimatedBudget?: string
  ) => {
    const actorName = user?.name || "Municipal Authority";
    const now = new Date().toISOString();

    setIssues((prev: CivicIssue[]) =>
      prev.map((issue: CivicIssue) => {
        if (issue.id === issueId) {
          const currentTimeline = Array.isArray(issue.timeline) ? issue.timeline : [];
          return {
            ...issue,
            status: verdict as any,
            officerVerdict: verdict,
            officerFeedback: feedbackNote,
            assignedDepartment: assignedDept || issue.assignedDepartment,
            estimatedBudget: estimatedBudget || issue.estimatedBudget,
            updatedAt: now,
            timeline: [
              ...currentTimeline,
              {
                stage: `Officer Verdict: ${verdict}`,
                timestamp: now,
                note: feedbackNote || `Feasibility assessment updated to ${verdict} by ${actorName}.`,
                actor: actorName,
              },
            ],
          };
        }
        return issue;
      })
    );

    await updateIssueStatus(issueId, verdict as any, feedbackNote, undefined, {
      officer_verdict: verdict,
      officer_feedback: feedbackNote,
      estimated_budget: estimatedBudget,
      assigned_department: assignedDept,
    });
  };

  const voteVerification = async (
    issueId: string,
    vote: "yes" | "no"
  ) => {
    if (!user) return;

    // Optimistically update
    setIssues((prev: CivicIssue[]) =>
      prev.map((issue: CivicIssue) => {
        if (issue.id === issueId) {
          const currentVote = issue.verificationVotes.userVoted;
          const votes = { ...issue.verificationVotes };

          if (currentVote === vote) return issue;

          if (currentVote === "yes") votes.yes = Math.max(0, votes.yes - 1);
          if (currentVote === "no") votes.no = Math.max(0, votes.no - 1);

          if (vote === "yes") votes.yes += 1;
          if (vote === "no") votes.no += 1;

          votes.userVoted = vote;

          return { ...issue, verificationVotes: votes };
        }
        return issue;
      })
    );

    // Optimistically award +15 XP for citizen verification
    setUser((prev: UserProfile | null) => prev ? ({
      ...prev,
      civicCitizenXP: prev.civicCitizenXP + 15,
      stats: {
        ...prev.stats,
        verificationVotes: (prev.stats?.verificationVotes || 0) + 1,
      },
    }) : prev);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    if (token) {
      try {
        const res = await fetch(
          `${API_URL}/api/issues/${issueId}/verify/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ vote }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          // Update issue status if returned by backend
          if (data.issueStatus) {
            setIssues((prev: CivicIssue[]) =>
              prev.map((issue: CivicIssue) => {
                if (issue.id === issueId) {
                  return { ...issue, status: data.issueStatus };
                }
                return issue;
              })
            );
          }
        }
        fetchIssues();
      } catch (e) {
        console.error("Failed to vote verification on backend", e);
      }
    }
  };

  const addComment = async (
    issueId: string,
    text: string
  ) => {
    setIssues((prev: CivicIssue[]) =>
      prev.map((issue: CivicIssue) => {
        if (issue.id === issueId) {
          return {
            ...issue,
            commentsCount: issue.commentsCount + 1,
          };
        }

        return issue;
      })
    );

    // Award +10 XP for constructive community engagement
    setUser((prev: UserProfile | null) => prev ? ({
      ...prev,
      civicCitizenXP: prev.civicCitizenXP + 10,
    }) : prev);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    if (token) {
      try {
        await fetch(
          `${API_URL}/api/issues/${issueId}/comments/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
            }),
          }
        );

        fetchIssues();
      } catch (e) {
        console.error(
          "Failed to add comment on backend",
          e
        );
      }
    }
  };

  const markNotificationRead = async (
    id: string
  ) => {
    setNotifications((prev: NotificationItem[]) =>
      prev.map((n: NotificationItem) =>
        n.id === id
          ? {
            ...n,
            read: true,
          }
          : n
      )
    );

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    const idStr = String(id);
    const dbId = idStr.includes("-")
      ? idStr.split("-")[1]
      : idStr;

    if (
      token &&
      dbId &&
      !isNaN(Number(dbId))
    ) {
      try {
        await fetch(
          `${API_URL}/api/notifications/${dbId}/read/`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (e) {
        console.error(
          "Failed to mark notification as read",
          e
        );
      }
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(
      (prev: NotificationItem[]) =>
        prev.map((n: NotificationItem) => ({
          ...n,
          read: true,
        }))
    );

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("janseva_token")
        : null;

    if (token) {
      try {
        await fetch(
          `${API_URL}/api/notifications/read-all/`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (e) {
        console.error(
          "Failed to mark all notifications as read",
          e
        );
      }
    }
  };

  const votePoll = (optionId: string) => {
    if (userPollVote === optionId) return;

    setWardData((prev: WardInfo) => {
      const updatedOptions =
        prev.activePoll.options.map((opt: any) => {
          if (opt.id === optionId) {
            return {
              ...opt,
              votes: opt.votes + 1,
            };
          }

          if (opt.id === userPollVote) {
            return {
              ...opt,
              votes: Math.max(0, opt.votes - 1),
            };
          }

          return opt;
        });

      return {
        ...prev,
        activePoll: {
          ...prev.activePoll,
          totalVotes: userPollVote
            ? prev.activePoll.totalVotes
            : prev.activePoll.totalVotes + 1,
          options: updatedOptions,
        },
      };
    });

    setUserPollVote(optionId);

    try {
      localStorage.setItem(
        "janseva_poll_vote",
        optionId
      );
    } catch (e) { }

    setUser((prev: UserProfile | null) => prev ? ({
      ...prev,
      civicCitizenXP: prev.civicCitizenXP + 20,
    }) : prev);
  };

  const persistChat = (messages: ChatMessage[]) => {
    if (!user) return;
    const storageKey = `janseva_chat_history_${user.id || user.username}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save user chat history:", e);
    }
  };

  const sendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedWithUser = [...chatMessages, userMsg];
    setChatMessages(updatedWithUser);
    persistChat(updatedWithUser);

    // Build user-specific context from active state
    const userIssues = issues.filter(
      (i: any) =>
        i.reporterId === user?.id ||
        i.reporter?.username === user?.username ||
        i.reporter?.name === user?.name
    );

    const userContext = {
      name: user?.name,
      username: user?.username,
      city: user?.city,
      pincode: user?.pincode,
      civicCitizenXP: user?.civicCitizenXP,
      level: user?.level,
      levelTitle: user?.levelTitle,
      badges: user?.badges || [],
      myReportsCount: userIssues.length,
      resolvedCount: userIssues.filter(
        (i: any) => i.status === "Resolved" || i.status === "Verified Resolved"
      ).length,
      myIssues: userIssues.map((i: any) => ({
        id: i.id,
        title: i.title,
        category: i.category,
        status: i.status,
        urgency: i.urgency,
        slaHours:
          i.aiAnalysis?.suggestedSlaHours ||
          (i.urgency === "Critical" ? 12 : i.urgency === "High" ? 24 : 48),
      })),
    };

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "chat",
          message: text,
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.status}`);
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        text:
          data.reply ||
          "I am here to assist with all your municipal tickets and civic inquiries.",
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedWithUser, botMsg];
      setChatMessages(finalMessages);
      persistChat(finalMessages);
    } catch (error) {
      console.error("Gemini Chatbot error:", error);

      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        text: "Sorry, I couldn't reach JanSeva AI right now. Please verify your connection or try again in a moment.",
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedWithUser, errorMsg];
      setChatMessages(finalMessages);
      persistChat(finalMessages);
    }
  };
  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      // Prompt user with assistant advice for voice queries using Gemini
      sendChatMessage("Voice input received. What is the status of my reported civic complaints?");
    } catch (error) {
      console.error("Voice input error:", error);
    }
  };

  const unreadNotifsCount =
    notifications.filter(
      (n: NotificationItem) => !n.read
    ).length;

  // Sync to MockContextBridge
  useEffect(() => {
    MockContextBridge.getIssues = () => issues;
    MockContextBridge.toggleUpvote = toggleUpvote;
    MockContextBridge.addComment = addComment;
    MockContextBridge.mergeIssues = (pId, dId, r) => {
      mergeIssues(pId, dId, r);
    };
  }, [issues, toggleUpvote, addComment, mergeIssues]);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoadingAuth,
        setUser,
        logout,
        switchRole,
        issues,
        refreshIssues: fetchIssues,
        toggleUpvote,
        addIssue,
        deleteIssue,
        mergeIssues,
        updateIssueStatus,
        updateInnovationVerdict,
        voteVerification,
        addComment,
        notifications,
        setNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotifsCount,
        wardData,
        votePoll,
        userPollVote,
        chatMessages,
        sendChatMessage,
        sendVoiceMessage,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        activeFilter,
        setActiveFilter,
        announcements,
        fetchAnnouncements,
        publishAnnouncement,
        deleteAnnouncement,
        language,
        setLanguage,
        t,
        translateText,
        allLanguages,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used within an AppProvider"
    );
  }

  return context;
}
