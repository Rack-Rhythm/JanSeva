"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/lib/context/app-context";
import { compressImage } from "@/lib/utils/image";
import confetti from "canvas-confetti";
import {
  Lightbulb,
  Camera,
  UploadCloud,
  Sparkles,
  X,
  CheckCircle2,
  MapPin,
  Tag,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestInnovationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPincode?: string;
}

const THEME_OPTIONS = [
  { id: "Sustainable Mobility & Bike Shelters", label: "🚲 Bike Shelters & Mobility", icon: "🚲" },
  { id: "Urban Heat & Cooling Systems", label: "❄️ Parking Cooling & Shade", icon: "❄️" },
  { id: "Clean Energy & Solar Canopies", label: "☀️ Solar & Clean Energy", icon: "☀️" },
  { id: "Parks & Green Public Spaces", label: "🌿 Green Spaces & Parklets", icon: "🌿" },
  { id: "Water Conservation & Catchment", label: "💧 Rainwater Catchment", icon: "💧" },
  { id: "Smart Waste & Circular Economy", label: "♻️ Smart Waste & Recycling", icon: "♻️" },
];

const PRESET_INSPIRATIONS = [
  {
    title: "Solar-Powered Bike Shelters with Fast E-Charging",
    theme: "Sustainable Mobility & Bike Shelters",
    budget: "₹2.5 - ₹3.5 Lakhs",
    desc: "Install weather-proof bike shelters along major transit corridors with integrated solar canopy roofs, secure biometric smart locks, and free charging points for electric cycles and scooters.",
    benefit: "Protects commuter cycles from monsoon rain and harsh sun, while promoting zero-emission green transportation.",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900&auto=format&fit=crop&q=80"
  },
  {
    title: "Urban Parking Cooling Mist & Solar Shade Canopies",
    theme: "Urban Heat & Cooling Systems",
    budget: "₹3.0 - ₹4.5 Lakhs",
    desc: "Erect heat-reflective shade canopies fitted with micro-droplet ultrasonic cooling misting nozzles in open public municipal parking lots to drop surface temperatures by up to 8°C during peak summer months.",
    benefit: "Reduces extreme cabin heat for vehicles, lowers ambient urban heat island temperatures, and prevents asphalt deterioration.",
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=900&auto=format&fit=crop&q=80"
  },
  {
    title: "Modular Bioswale Pocket Rain Gardens on Avenues",
    theme: "Water Conservation & Catchment",
    budget: "₹1.5 - ₹2.5 Lakhs",
    desc: "Convert dead roadside curb zones into landscaped bioswales with native water-absorbing flora that filter road stormwater runoff and recharge the subterranean groundwater table.",
    benefit: "Prevents street waterlogging during sudden cloudbursts and enhances street aesthetic green cover.",
    image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&auto=format&fit=crop&q=80"
  },
  {
    title: "Sensor-Enabled Solar Trash Compactors with Alert Telemetry",
    theme: "Smart Waste & Circular Economy",
    budget: "₹2.0 - ₹3.0 Lakhs",
    desc: "Deploy foot-pedal smart waste bins with rooftop photovoltaic panels that automatically compact garbage 5x and transmit real-time fill-level telemetry to the ward sanitation squad van.",
    benefit: "Eliminates overflowing public waste bins, cuts sanitation collection truck fuel trips by 60%, and keeps community footpaths clean.",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=900&auto=format&fit=crop&q=80"
  }
];

export function SuggestInnovationModal({ isOpen, onClose, defaultPincode = "" }: SuggestInnovationModalProps) {
  const { addIssue, user } = useApp();

  const initialPin = defaultPincode || user?.pincode || (user as any)?.wardDetails?.pincode || "";
  const initialAddress = user?.city ? `${user?.ward || "Community Ward"}, ${user?.city}` : "";

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState(THEME_OPTIONS[0].id);
  const [customTheme, setCustomTheme] = useState("");
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [description, setDescription] = useState("");
  const [communityBenefit, setCommunityBenefit] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [pincode, setPincode] = useState(initialPin);
  const [address, setAddress] = useState(initialAddress);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_INSPIRATIONS[0]) => {
    setTitle(preset.title);
    setTheme(preset.theme);
    setIsCustomTheme(false);
    setDescription(preset.desc);
    setCommunityBenefit(preset.benefit);
    setEstimatedBudget(preset.budget);
    setImagePreview(preset.image);
    setErrorMsg(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.75,
        mimeType: "image/jpeg"
      });
      setImagePreview(compressedDataUrl);
    } catch (err) {
      console.error("Failed to process image:", err);
      setErrorMsg("Failed to process image. Please try a different photo.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please provide an innovation proposal title.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please describe how your idea helps the community.");
      return;
    }

    const resolvedTheme = isCustomTheme && customTheme.trim() ? customTheme.trim() : theme;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // If user uploaded an image use it; otherwise generate a clean dynamic SVG concept card with their idea title
      let photoUrl = imagePreview;
      if (!photoUrl) {
        const safeTitle = encodeURIComponent(title.trim().slice(0, 45));
        const safeTheme = encodeURIComponent(resolvedTheme.slice(0, 35));
        photoUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230c2e21"/><stop offset="50%" stop-color="%23134431"/><stop offset="100%" stop-color="%231c5d44"/></linearGradient></defs><rect width="800" height="500" fill="url(%23g)"/><circle cx="700" cy="80" r="160" fill="%2334d399" opacity="0.12"/><circle cx="80" cy="420" r="180" fill="%2310b981" opacity="0.1"/><text x="400" y="200" font-family="sans-serif" font-size="56" font-weight="900" fill="%23ffffff" text-anchor="middle">💡</text><text x="400" y="270" font-family="sans-serif" font-size="24" font-weight="bold" fill="%23ffffff" text-anchor="middle">${safeTitle}</text><text x="400" y="320" font-family="sans-serif" font-size="16" font-weight="600" fill="%23a7f3d0" text-anchor="middle">${safeTheme}</text><text x="400" y="380" font-family="sans-serif" font-size="12" font-weight="bold" fill="%236ee7b7" text-anchor="middle">JanSeva Civic Innovation Incubator</text></svg>`;
      }

      const activePin = pincode.trim() || user?.pincode || "";
      const userWard = user?.ward || (activePin ? `Ward ${activePin.slice(-2)}` : "Ward Area");
      const wardNum = user?.wardNumber || (activePin ? parseInt(activePin.slice(-2), 10) || 1 : 1);

      await addIssue({
        title: title.trim(),
        description: description.trim(),
        category: "Innovation",
        status: "Under Review",
        urgency: "Moderate",
        isInnovation: true,
        innovationTheme: resolvedTheme,
        estimatedBudget: estimatedBudget.trim() || "To be audited during feasibility review",
        communityBenefit: communityBenefit.trim() || description.trim(),
        officerVerdict: "Under Review",
        officerFeedback: "Proposal received by Ward Citizen Advisory Council. Queued for technical feasibility assessment.",
        images: {
          reported: photoUrl,
        },
        location: {
          address: address.trim() || (activePin ? `Location in PIN ${activePin}` : "Community Ward Location"),
          ward: userWard,
          wardNumber: wardNum,
          pincode: activePin,
          lat: 20.270 + (Math.random() - 0.5) * 0.01,
          lng: 85.760 + (Math.random() - 0.5) * 0.01,
        },
      });

      // Confetti celebratory burst for proposing civic innovation
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onClose();
    } catch (err: any) {
      console.error("Failed to submit innovation proposal:", err);
      setErrorMsg(err.message || "Failed to submit proposal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-[#edf7f1] to-emerald-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#134431] text-white flex items-center justify-center shadow-md">
              <Lightbulb className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-headline font-black text-lg sm:text-xl text-slate-900 leading-tight">
                Suggest Community Innovation
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Propose creative public infrastructure to improve local living. Citizens vote &amp; officers review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 text-slate-800">

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Idea Presets Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Inspiration Presets (Click to autofill):</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_INSPIRATIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs space-y-1 group bg-white shadow-2xs"
                >
                  <p className="font-bold text-slate-900 group-hover:text-[#134431] flex items-center justify-between">
                    <span className="truncate">{preset.title}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Innovation Theme / Focus Area *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsCustomTheme(false);
                  }}
                  className={cn(
                    "p-2.5 rounded-2xl text-xs font-bold border transition-all text-left flex items-center gap-2",
                    !isCustomTheme && theme === t.id
                      ? "bg-[#134431] text-white border-[#134431] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-slate-100"
                  )}
                >
                  <span className="text-sm shrink-0">{t.icon}</span>
                  <span className="truncate text-[11px]">{t.label.replace(/^[^\s]+\s/, '')}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomTheme(true)}
                className={cn(
                  "p-2.5 rounded-2xl text-xs font-bold border transition-all text-left flex items-center gap-2",
                  isCustomTheme
                    ? "bg-[#134431] text-white border-[#134431] shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-slate-100"
                )}
              >
                <span className="text-sm shrink-0">✨</span>
                <span className="truncate text-[11px]">Custom Solution</span>
              </button>
            </div>
            {isCustomTheme && (
              <input
                type="text"
                required
                placeholder="Enter your custom innovation domain (e.g. Public Wi-Fi Canopy, Smart Solar Pavement)..."
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl border border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-900 placeholder:text-slate-400 mt-2 bg-emerald-50/30"
              />
            )}
          </div>

          {/* Proposal Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Innovation Idea Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Solar-Powered Bike Shelters with E-Charging, Parking Mist Cooling Canopy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Image Upload Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Concept Illustration / Site Photo *
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {imagePreview ? (
                <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                    Image Attached ✓
                  </div>
                </div>
              ) : null}

              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex-1 w-full border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center space-y-1.5",
                  isCompressing && "opacity-50 pointer-events-none"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#134431] flex items-center justify-center shadow-2xs">
                  <Camera className="w-5 h-5 text-emerald-800" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {imagePreview ? "Change / Upload Another Photo" : "Upload Concept Photo or On-Site Picture"}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isCompressing ? "Compressing image..." : "PNG, JPG or WebP (Auto-compressed)"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Detailed Description &amp; How It Works *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the problem, proposed mechanism, materials, and placement in the ward..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Community Benefit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Anticipated Community Impact &amp; Beneficiaries
            </label>
            <input
              type="text"
              placeholder="e.g. Reduces peak summer parking heat by 8°C and shields 150 daily cycle commuters"
              value={communityBenefit}
              onChange={(e) => setCommunityBenefit(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* PIN Code, Address & Budget Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                PIN Code *
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#134431] absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="751024"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Targeted Location / Street / Public Space
              </label>
              <input
                type="text"
                placeholder="e.g. Near Community Market, Transit Hub, or Main Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Estimated Budget */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900">Estimated Municipal Budget Scale</span>
              <p className="text-[11px] text-slate-500">Helps corporators evaluate feasibility under ward discretionary funding.</p>
            </div>
            <select
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Audit &amp; Determine During Feasibility</option>
              <option value="Under ₹1 Lakh">Micro (&lt; ₹1 Lakh)</option>
              <option value="₹1.5 - ₹3.0 Lakhs">Community Standard (₹1.5 - ₹3L)</option>
              <option value="₹3.0 - ₹5.0 Lakhs">Ward Infrastructure (₹3 - ₹5L)</option>
              <option value="₹5.0 - ₹10.0 Lakhs">Major Facility (₹5 - ₹10L)</option>
            </select>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-6 py-2.5 rounded-2xl bg-[#134431] hover:bg-[#0c2e21] text-white font-headline font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{isSubmitting ? "Publishing Proposal..." : "Publish for Citizen Votes"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
