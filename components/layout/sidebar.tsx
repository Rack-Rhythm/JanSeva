"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/context/app-context";
import { authService } from "@/lib/auth/auth-service-cookie3";
import {
  LayoutGrid,
  Compass,
  Map,
  Building2,
  PlusCircle,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Award,
  Wallet,
  Sparkles,
  ExternalLink,
  User,
  AlertTriangle,
  Layers,
  Users,
  Calendar,
  BarChart3,
  Vote,
  Megaphone,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  Radio,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, unreadNotifsCount, t } = useApp();
  const isProfilePage = pathname === "/profile";

  const isOfficer = Boolean(
    user?.role === "officer" ||
    user?.role === "corporator" ||
    pathname.startsWith("/officer")
  );

  const officerDept = user?.department ? user.department.toLowerCase() : "water";
  const currentTab = searchParams ? searchParams.get("tab") : null;
  const activeOfficerTab = currentTab || "workbench";

  const handleLogout = async () => {
    await logout();
    if (onCloseMobile) onCloseMobile();
    router.push("/login");
  };

  interface NavItem {
    label: string;
    href: string;
    tab?: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
    highlight?: boolean;
  }

  // Citizen navigation items
  const citizenNavItems: NavItem[] = [
    { label: t("home"), href: "/feed", icon: LayoutGrid },
    { label: t("explore"), href: "/explore", icon: Compass },
    { label: t("report"), href: "/report", icon: PlusCircle, highlight: true },
    { label: "Innovation Hub", href: "/innovations", icon: Lightbulb, badge: "Ideas" },
    { label: t("map"), href: "/map", icon: Map },
    { label: "Ward Budget", href: "/ward-budget", icon: Wallet },
    {
      label: t("notifications"),
      href: "/notifications",
      icon: Bell,
      badge: unreadNotifsCount > 0 ? `${unreadNotifsCount}` : undefined,
    },
    { label: t("profile"), href: "/profile", icon: User },
  ];

  // Authority / Officer operational items
  const officerNavItems: NavItem[] = [
    { label: "Command Workbench", href: `/officer/${officerDept}`, tab: "workbench", icon: LayoutGrid },
    { label: "Citizen Innovations", href: `/officer/${officerDept}?tab=innovations`, tab: "innovations", icon: Lightbulb, badge: "Review", badgeColor: "bg-emerald-100 text-emerald-800" },
    {
      label: "Escalations & Breaches",
      href: `/officer/${officerDept}?tab=escalations`,
      tab: "escalations",
      icon: AlertTriangle,
      badge: "2 Overdue",
      badgeColor: "bg-rose-100 text-rose-800"
    },
    {
      label: "AI Duplicate Review",
      href: `/officer/${officerDept}?tab=duplicates`,
      tab: "duplicates",
      icon: Layers,
      badge: "3 Matches",
      badgeColor: "bg-amber-100 text-amber-800"
    },
    { label: "Squad Dispatch", href: `/officer/${officerDept}?tab=squads`, tab: "squads", icon: Users },
    { label: "SLA Calendar", href: `/officer/${officerDept}?tab=calendar`, tab: "calendar", icon: Calendar },
    { label: "Department Analytics", href: `/officer/${officerDept}?tab=analytics`, tab: "analytics", icon: BarChart3 },
    { label: "Citizen Consensus Polls", href: `/officer/${officerDept}?tab=polls`, tab: "polls", icon: Vote },
    { label: "Official Announcements", href: `/officer/${officerDept}?tab=announcements`, tab: "announcements", icon: Megaphone },
    { label: "Audit Reports & Export", href: `/officer/${officerDept}?tab=reports`, tab: "reports", icon: FileSpreadsheet },
  ];

  const activeNavList = isOfficer ? officerNavItems : citizenNavItems;

  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-100 flex flex-col justify-between p-5 transition-all duration-300 ease-in-out lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:z-30 overflow-y-auto no-scrollbar",
          isProfilePage ? "w-72 sm:w-80 lg:w-20 lg:p-3" : "w-72 sm:w-80",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="space-y-6">
          {/* Mobile Header in Drawer */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#134431] flex items-center justify-center text-white font-bold text-xs">
                {isOfficer ? "OPS" : "JS"}
              </div>
              <span className="font-headline font-black text-base text-slate-900">
                {isOfficer ? "JanSeva Authority" : "JanSeva"}
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 text-sm"
            >
              ✕
            </button>
          </div>

          {/* 1. TOP PROFILE / CONSOLE CONTEXT SECTION */}
          <div className={cn("space-y-4 pt-1", isProfilePage && "lg:space-y-2 lg:pt-0")}>
            {/* Centered Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group block">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={cn(
                      "rounded-full object-cover ring-4 ring-emerald-500/20 border-2 border-white shadow-md transition-transform",
                      isProfilePage ? "w-20 h-20 lg:w-11 lg:h-11" : "w-20 h-20"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-headline font-black ring-4 ring-emerald-500/20 border-2 border-white shadow-md transition-transform",
                    isProfilePage ? "w-20 h-20 lg:w-11 lg:h-11 text-base" : "w-20 h-20 text-2xl"
                  )}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : (isOfficer ? "O" : "U")}
                  </div>
                )}
                <div className={cn(
                  "absolute bottom-0 right-0 rounded-full text-white flex items-center justify-center border-2 border-white shadow-xs",
                  isOfficer ? "bg-[#134431]" : "bg-emerald-600",
                  isProfilePage ? "w-6 h-6 lg:w-4 lg:h-4" : "w-6 h-6"
                )}>
                  {isOfficer ? (
                    <ShieldAlert className={cn("w-3.5 h-3.5 text-amber-300", isProfilePage && "lg:w-2.5 lg:h-2.5")} />
                  ) : (
                    <ShieldCheck className={cn("w-3.5 h-3.5", isProfilePage && "lg:w-2.5 lg:h-2.5")} />
                  )}
                </div>
              </div>

              {/* Name & Role */}
              <div className={cn("mt-2.5", isProfilePage && "lg:hidden")}>
                <h3 className="font-headline font-black text-base text-slate-900 leading-tight">
                  {user?.name || (isOfficer ? "Field Operations Officer" : "Civic Resident")}
                </h3>
                <p className="text-xs text-emerald-800 font-bold mt-0.5 uppercase tracking-wider text-[10px]">
                  {isOfficer
                    ? `BMC ${officerDept.toUpperCase()} DIVISION`
                    : `@${user?.username || (user?.name ? user.name.toLowerCase().replace(/\s+/g, "_") : "citizen")}`}
                </p>
              </div>
            </div>

            {/* Role-Specific Stats Bar */}
            {isOfficer ? (
              /* Officer Operational Quick Stats */
              <div className={cn("flex items-center justify-around py-3 px-2 rounded-2xl bg-[#edf7f1] border border-[#cbe7d7] text-center", isProfilePage && "lg:hidden")}>
                <div className="flex-1">
                  <p className="font-headline font-black text-sm text-slate-900">8</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Active</p>
                </div>
                <div className="w-px h-6 bg-[#b2dfc4]"></div>
                <div className="flex-1">
                  <p className="font-headline font-black text-sm text-emerald-700">94.2%</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">SLA Met</p>
                </div>
                <div className="w-px h-6 bg-[#b2dfc4]"></div>
                <div className="flex-1">
                  <p className="font-headline font-black text-sm text-amber-700">5 Live</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Squads</p>
                </div>
              </div>
            ) : (
              /* Citizen Gamified XP Stats */
              <div className={cn("flex items-center justify-around py-3 px-2 rounded-2xl bg-[#f8faf9] border border-slate-100 text-center", isProfilePage && "lg:hidden")}>
                <div className="flex-1">
                  <p className="font-headline font-black text-sm text-slate-900">
                    {user?.stats?.issuesReported ?? 4}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    Posts
                  </p>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex-1">
                  <p className="font-headline font-black text-sm text-slate-900">
                    {user?.stats?.upvotesGiven ?? 28}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    Upvotes
                  </p>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex-1">
                  <p className="font-headline font-black text-sm text-emerald-700">
                    {user?.civicCitizenXP ?? 100}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    XP
                  </p>
                </div>
              </div>
            )}

            {/* Officer Duty Status or Citizen Ward info */}
            <div className={cn("px-1 text-center sm:text-left space-y-0.5", isProfilePage && "lg:hidden")}>
              {isOfficer ? (
                <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    On Active Duty
                  </span>
                </div>
              ) : (
                <>
                  <p className="font-bold text-xs text-slate-800">
                    {user?.name || "Civic Citizen"}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {user?.levelTitle || "Active Citizen"} | PIN {user?.pincode || "751030"} • {user?.city || "Bhubaneswar"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 2. VERTICAL NAVIGATION MENU */}
          <nav className="space-y-1 pt-2 border-t border-slate-100">
            {activeNavList.map((item) => {
              const Icon = item.icon;
              // Check active URL reactively
              const isActive = isOfficer
                ? (item.tab ? item.tab === activeOfficerTab : activeOfficerTab === "workbench")
                : (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={item.label}
                  className={cn(
                    "flex items-center rounded-2xl text-xs font-bold transition-all group select-none",
                    isProfilePage ? "px-4 py-2.5 lg:px-0 lg:py-3 lg:justify-center" : "justify-between px-3.5 py-2.5",
                    isActive
                      ? "bg-[#134431] text-white shadow-md shadow-emerald-950/20"
                      : "text-slate-700 hover:bg-[#edf7f1] hover:text-[#134431]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-500 group-hover:text-[#134431]"
                      )}
                    />
                    <span className={cn("truncate", isProfilePage && "lg:hidden")}>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ml-1.5",
                        isProfilePage && "lg:hidden",
                        isActive
                          ? "bg-white/20 text-white"
                          : (item.badgeColor || "bg-emerald-100 text-emerald-800")
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. BOTTOM LOGOUT BUTTON */}
        <div className="pt-4 border-t border-slate-100 mt-6">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className={cn(
                "w-full flex items-center rounded-2xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors group",
                isProfilePage ? "px-4 py-2.5 lg:px-0 lg:py-2.5 lg:justify-center" : "gap-3 px-4 py-2.5"
              )}
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
              <span className={cn(isProfilePage && "lg:hidden")}>
                {isOfficer ? "Sign Out Console" : t("logout")}
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onCloseMobile}
              className={cn(
                "w-full flex items-center justify-center rounded-2xl text-xs font-bold bg-[#134431] text-white hover:bg-[#0c2e21] shadow-md transition-colors",
                isProfilePage ? "px-4 py-2.5 lg:px-0 lg:py-2.5" : "px-4 py-2.5"
              )}
            >
              <span className={cn(isProfilePage && "lg:hidden")}>Sign In</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
