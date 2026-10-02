export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: "Roads" | "Water" | "Sanitation" | "Electricity" | "Waste" | "Traffic" | "Parks" | "Innovation";
  status: "Reported" | "AI Verified" | "Assigned" | "In Progress" | "Resolved" | "Pending Citizen Verification" | "Verified Resolved" | "Under Review" | "Feasibility Approved" | "Pilot Scheduled" | "Budget Allocated";
  urgency: "Critical" | "High" | "Moderate" | "Low";
  isInnovation?: boolean;
  innovationTheme?: string;
  estimatedBudget?: string;
  communityBenefit?: string;
  officerVerdict?: "Under Review" | "Feasibility Approved" | "Pilot Scheduled" | "Budget Allocated" | "Rejected";
  officerFeedback?: string;
  location: {
    address: string;
    ward: string;
    wardNumber: number;
    pincode?: string;
    lat: number;
    lng: number;
  };
  reporter: {
    id?: string | number;
    name?: string;
    username?: string;
    avatar?: string;
    isVerified: boolean;
    karma: number;
  };
  images: {
    reported: string;
    resolved?: string;
  };
  aiAnalysis: {
    detectedObject: string;
    confidence: number;
    estimatedSeverity: string;
    predictedDepartment: string;
    suggestedSlaHours: number;
    summary: string;
  };
  assignedDepartment: string;
  assignedOfficer?: {
    name: string;
    role: string;
    avatar: string;
    phone: string;
  };
  timeline: {
    stage: string;
    timestamp: string;
    note: string;
    actor: string;
  }[];
  upvotes: number;
  isUpvoted?: boolean;
  commentsCount: number;
  verificationVotes: {
    yes: number;
    no: number;
    userVoted?: "yes" | "no";
  };
  timesReported?: number;
  mergedTicketIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WardInfo {
  name: string;
  number: number;
  city: string;
  corporator: {
    name: string;
    party: string;
    office: string;
    phone: string;
    email: string;
    avatar: string;
  };
  healthScore: number;
  metrics: {
    cleanliness: number;
    roads: number;
    water: number;
    lighting: number;
  };
  budget: {
    allocatedCr: number;
    spentCr: number;
    activeProjects: number;
  };
  stats: {
    totalReports: number;
    resolvedReports: number;
    activeOfficers: number;
    avgResolutionHours: number;
  };
  announcements: {
    id: string;
    title: string;
    date: string;
    category: string;
    content: string;
  }[];
  activePoll: {
    id: string;
    question: string;
    totalVotes: number;
    options: {
      id: string;
      text: string;
      votes: number;
    }[];
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "status" | "upvote" | "ward" | "badge" | "officer" | "announcement";
  timestamp: string;
  read: boolean;
  issueId?: string;
  actionUrl?: string;
  pincode?: string;
  pincodes?: string[];
  department?: string;
  urgency?: "Emergency" | "High" | "Advisory" | "Normal";
}

export interface OfficialAnnouncement {
  id: string | number;
  title: string;
  message: string;
  department: string;
  pincodes: string[];
  urgency: "Emergency" | "High" | "Advisory" | "Normal";
  category: string;
  authorName?: string;
  authorRole?: string;
  createdAt: string;
  expiresAt?: string | null;
  actionUrl?: string;
  isActive?: boolean;
  reachCount?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  gender?: string;
  avatar: string;
  ward: string;
  wardNumber: number;
  city?: string;
  pincode: string;
  department?: string;
  role: "citizen" | "officer" | "corporator";
  civicCitizenXP: number;
  level: number;
  levelTitle: string;
  verifiedCitizen: boolean;
  aadhaarLinked: boolean;
  stats: {
    issuesReported: number;
    issuesResolved: number;
    upvotesGiven: number;
    verificationVotes: number;
    civicImpactScore: number;
  };
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
    unlockedAt: string;
  }[];
}

export type Language = "en" | "hi" | "or" | "bn" | "te" | "ta" | "mr";

export const WARD_42_DATA: WardInfo = {
  name: "Khandagiri (PIN 751030)",
  number: 42,
  city: "Bhubaneswar",
  corporator: {
    name: "Smt. Rajeshwari N.",
    party: "Ward Citizen Council",
    office: "Municipal Office, 80ft Road, Khandagiri",
    phone: "+91 80 2297 5500",
    email: "corporator.khandagiri@bmc.gov.in",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
  },
  healthScore: 84,
  metrics: {
    cleanliness: 91,
    roads: 76,
    water: 88,
    lighting: 94,
  },
  budget: {
    allocatedCr: 12.5,
    spentCr: 8.9,
    activeProjects: 7,
  },
  stats: {
    totalReports: 0,
    resolvedReports: 0,
    activeOfficers: 12,
    avgResolutionHours: 18.4,
  },
  announcements: [
    {
      id: "ann-1",
      title: "Ward Town Hall Meeting: Monsoon Drainage Upgrades",
      date: "Sunday, Aug 23, 2026 at 10:00 AM",
      category: "Public Forum",
      content: "All citizens are invited to review the stormwater drainage reconstruction plan for 4th to 9th Cross.",
    },
    {
      id: "ann-2",
      title: "Special Wet & E-Waste Mega Drive this Weekend",
      date: "Saturday & Sunday, Aug 22-23",
      category: "Sanitation",
      content: "Door-to-door collection of obsolete electronics and tree trimmings across all residential sectors.",
    },
  ],
  activePoll: {
    id: "poll-42",
    question: "Should the 5th Cross Road be converted into a Pedestrian-First Green Zone on weekends?",
    totalVotes: 482,
    options: [
      { id: "opt-1", text: "Yes, great for families and air quality", votes: 342 },
      { id: "opt-2", text: "No, need regular vehicle access", votes: 110 },
      { id: "opt-3", text: "Only on Sunday evenings (4 PM - 9 PM)", votes: 30 },
    ],
  },
};

// Pure dynamic arrays: loaded live from backend database
export const INITIAL_ISSUES: CivicIssue[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const TOP_LEADERBOARD: { rank: number; name: string; ward: string; karma: number; badge: string; avatar: string }[] = [];
