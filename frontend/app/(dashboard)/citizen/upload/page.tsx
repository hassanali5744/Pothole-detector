"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, MapPin, Brain, CheckCircle, X, ImageIcon, AlertTriangle } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";
import { DAMAGE_TYPE_LABELS } from "@/lib/constants";
import type { DamageType, SeverityLevel } from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import { SlideInUp, FadeIn, ScaleIn, StaggerChildren, HoverLift } from "@/components/animations";
import { LocationMap } from "@/components/map/location-map";

interface AIResult {
  damageType: DamageType;
  confidence: number;
  severity: SeverityLevel;
  explanation: string;
  severityPercentage?: number;  // New field for Gemini API
  priority?: string;  // New field for priority (high/low)
}

interface AnalyzeResponse {
  accepted: boolean;
  isRoadDamage: boolean;
  modelUsed: string;
  detections: AIResult[];
  explanation: string;
  protocolFollowed: boolean;
  protocolReason: string;
  suggestedDepartment: string;
  recommendedResponseTime: string;
  severityPercentage?: number;  // New field for overall severity
  priority?: string;  // New field for overall priority
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [complaintText, setComplaintText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AIResult[] | null>(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [protocolFollowed, setProtocolFollowed] = useState(true);
  const [suggestedDepartment, setSuggestedDepartment] = useState("");
  const [recommendedResponseTime, setRecommendedResponseTime] = useState("");
  const [rejected, setRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [severityPercentage, setSeverityPercentage] = useState<number | null>(null);
  const [priority, setPriority] = useState<string>("");

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload a photo (JPG/PNG) of the road damage. Video is not supported yet.");
      return;
    }
    setFile(f);
    setAiResults(null);
    setAiExplanation("");
    setRejected(false);
    setRejectionReason("");
    setSubmitted(false);
    setError("");
    setSeverityPercentage(null);
    setPriority("");
    setPreview(URL.createObjectURL(f));
  }, []);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    setError("");
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter location manually.");
      setGettingLocation(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        setLatitude(lat);
        setLongitude(lng);
        
        // Use reverse geocoding to get detailed address information
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'PotholeDetector/1.0'
              }
            }
          );
          const data = await response.json();
          
          if (data.address) {
            // Extract the most specific address/landmark
            const landmark = data.address.road || data.address.building || data.address.footway || 
                            data.address.pedestrian || data.address.neighbourhood || "";
            const detectedCity = data.address.city || data.address.town || data.address.village || 
                               data.address.county || "";
            const detectedAddress = landmark ? `${landmark}, ${detectedCity}` : detectedCity;
            
            setAddress(detectedAddress);
            setCity(detectedCity);
          }
        } catch (e) {
          console.error("Failed to reverse geocode:", e);
          setError("Location detected but address lookup failed. Coordinates saved.");
        }
        
        setGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to get your location. Please enter location manually.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again or enter location manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again or enter location manually.";
            break;
          default:
            errorMessage = "An unknown error occurred getting your location.";
        }
        
        setError(errorMessage);
        setGettingLocation(false);
      },
      options
    );
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    setRejected(false);
    setRejectionReason("");
    setAiResults(null);
    setSeverityPercentage(null);
    setPriority("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("complaintText", complaintText);
      const data = (await apiClient.postForm("/api/ai/analyze", formData)) as AnalyzeResponse;

      setAiResults(data.detections);
      setAiExplanation(data.explanation);
      setModelUsed(data.modelUsed);
      setProtocolFollowed(data.protocolFollowed);
      setSuggestedDepartment(data.suggestedDepartment);
      setRecommendedResponseTime(data.recommendedResponseTime);
      
      // Capture Gemini-specific data if available
      if (data.severityPercentage !== undefined) {
        setSeverityPercentage(data.severityPercentage);
      }
      if (data.priority !== undefined) {
        setPriority(data.priority);
      }
      
      if (!data.protocolFollowed) {
        setError(data.protocolReason);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "AI analysis failed";
      setRejected(true);
      setRejectionReason(message);
      setAiResults(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    if (!file || !aiResults || aiResults.length === 0 || rejected) return;
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("address", address);
      formData.append("city", city);
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      formData.append("complaintText", complaintText);

      const mainResult = aiResults[0];
      formData.append("damageType", mainResult.damageType);
      formData.append("severity", mainResult.severity);
      formData.append("aiConfidence", mainResult.confidence.toString());
      formData.append("aiDetections", JSON.stringify(aiResults));
      formData.append("aiExplanation", aiExplanation || mainResult.explanation);
      formData.append("protocolFollowed", protocolFollowed.toString());
      formData.append("suggestedDepartment", suggestedDepartment);
      formData.append("recommendedResponseTime", recommendedResponseTime);
      
      // Add Gemini-specific data if available
      if (severityPercentage !== null) {
        formData.append("severityPercentage", severityPercentage.toString());
      }
      if (priority) {
        formData.append("priority", priority);
      }

      await apiClient.postForm("/api/reports", formData);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <RoleGuard allowedRoles={["citizen"]}>
        <ScaleIn duration={0.6}>
          <div className="mx-auto max-w-lg py-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">Report Submitted!</h1>
            <p className="mt-2 text-muted">
              Your report has been queued for inspector review
              {priority && (
                <span className="font-semibold">
                  {` with ${priority.toUpperCase()} priority`}
                </span>
              )}.
              {severityPercentage && (
                <span className="block mt-1 text-sm">
                  AI severity: {severityPercentage.toFixed(0)}%
                </span>
              )}
            </p>
            <FadeIn duration={0.5} delay={0.3}>
              <Button
                className="mt-6"
                onClick={() => {
                  setSubmitted(false);
                  setFile(null);
                  setPreview(null);
                  setAiResults(null);
                  setRejected(false);
                  setSeverityPercentage(null);
                  setPriority("");
                }}
              >
                Submit Another Report
              </Button>
            </FadeIn>
          </div>
        </ScaleIn>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <SlideInUp duration={0.5}>
        <div className="mx-auto max-w-3xl space-y-6">
          <FadeIn duration={0.6}>
            <PageHeader
              title="Report Road Damage"
              description="Upload a clear photo of the defect. Our AI will analyze severity and assign priority based on damage assessment."
            />
          </FadeIn>

          <StaggerChildren staggerDelay={0.1}>
            <HoverLift>
              <Card>
                <CardContent className="p-6">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
                      dragOver ? "border-accent-500 bg-accent-50/50" : "border-line bg-surface-muted/40"
                    }`}
                  >
                    {preview ? (
                      <ScaleIn duration={0.4}>
                        <div className="relative w-full max-w-md">
                          <div className="relative h-64 w-full">
                            <Image src={preview} alt="Preview" fill className="rounded-lg object-cover" unoptimized />
                          </div>
                          <button
                            onClick={() => {
                              setFile(null);
                              setPreview(null);
                              setAiResults(null);
                              setRejected(false);
                            }}
                            className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white shadow-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </ScaleIn>
                    ) : (
                      <>
                        <div className="mb-4 rounded-full bg-accent-50 p-4 ring-1 ring-accent-100">
                          <ImageIcon className="h-8 w-8 text-accent-600" />
                        </div>
                        <p className="text-sm font-semibold text-ink-secondary">
                          Drag & drop a road damage photo here
                        </p>
                        <p className="mt-1 text-xs text-muted">JPG or PNG — pothole, crack, waterlogging, markings, debris</p>
                        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:border-line-strong hover:bg-surface-muted">
                          <Upload className="h-4 w-4" />
                          Browse Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </HoverLift>

            <FadeIn duration={0.5} delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="address"
                      label="Address / Landmark"
                      placeholder="Enter address or landmark"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <Input
                      id="city"
                      label="City"
                      placeholder="Enter city name"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="w-full"
                    >
                      {gettingLocation ? "Getting Location..." : "Use Current GPS Location"}
                    </Button>
                    <p className="mt-1 text-xs text-muted">
                      {latitude && longitude ? `Current coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "Click to get your current location"}
                    </p>
                  </div>

                  {latitude && longitude && (
                    <ScaleIn duration={0.4}>
                      <div>
                        <p className="mb-2 text-xs font-semibold text-muted">Location Map</p>
                        <LocationMap latitude={latitude} longitude={longitude} />
                      </div>
                    </ScaleIn>
                  )}
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn duration={0.5} delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Complaint Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    id="complaintText"
                    placeholder="Describe the road damage in detail (e.g., size, traffic impact, safety hazards)"
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink placeholder:text-muted focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 min-h-[100px] resize-y"
                  />
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerChildren>

          {rejected && (
            <ScaleIn duration={0.4}>
              <Card className="border-danger/30 bg-danger-soft/30">
                <CardContent className="flex gap-4 p-6">
                  <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
                  <div>
                    <h3 className="font-semibold text-danger">Image Rejected</h3>
                    <p className="mt-1 text-sm text-ink-secondary">{rejectionReason}</p>
                    <p className="mt-2 text-xs text-muted">
                      Only valid road damage photos are accepted. Try a closer, well-lit shot of the defect.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ScaleIn>
          )}

          {aiResults && aiResults.length > 0 && (
            <ScaleIn duration={0.5}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4" />
                    AI Detection Results
                  </CardTitle>
                  <CardDescription>
                    {aiExplanation}
                    {modelUsed && (
                      <span className="mt-1 block text-xs text-muted">
                        Model: {modelUsed}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AI Severity Display */}
                  {severityPercentage !== null && priority && (
                    <div className={`rounded-xl border p-4 ${
                      priority === "critical" 
                        ? "border-danger/50 bg-danger-soft/20" 
                        : priority === "high"
                        ? "border-danger/30 bg-danger-soft/10"
                        : priority === "medium"
                        ? "border-warning/50 bg-warning-soft/20"
                        : "border-success/50 bg-success-soft/20"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-display font-semibold text-ink">
                            AI Severity Analysis
                          </h4>
                          <p className="mt-1 text-sm text-muted">
                            Severity Score: <span className={`font-bold ${
                              severityPercentage >= 90 ? "text-danger" :
                              severityPercentage >= 70 ? "text-danger" :
                              severityPercentage >= 50 ? "text-warning" : "text-success"
                            }`}>{severityPercentage.toFixed(0)}%</span>
                          </p>
                          <p className="text-xs text-muted">
                            Priority Level: <span className={`font-semibold ${
                              priority === "critical" ? "text-danger" :
                              priority === "high" ? "text-danger" :
                              priority === "medium" ? "text-warning" : "text-success"
                            }`}>{priority.toUpperCase()}</span>
                          </p>
                          <p className="text-xs text-muted">
                            {priority.charAt(0).toUpperCase() + priority.slice(1)} priority level assigned
                          </p>
                        </div>
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          priority === "critical" ? "bg-danger text-white" :
                          priority === "high" ? "bg-danger/80 text-white" :
                          priority === "medium" ? "bg-warning text-white" : "bg-success text-white"
                        }`}>
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  )}

                  <StaggerChildren staggerDelay={0.1}>
                    {aiResults.map((result, i) => (
                      <HoverLift key={i}>
                        <div className="rounded-xl border border-line bg-surface-muted/40 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-semibold text-ink">
                              {DAMAGE_TYPE_LABELS[result.damageType]}
                              {i === 0 && (
                                <span className="ml-2 text-xs font-normal text-accent-600">Primary</span>
                              )}
                            </h4>
                            <SeverityBadge severity={result.severity} />
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-muted">{result.explanation}</p>
                          <p className="mt-2 text-xs font-semibold text-accent-600">
                            Confidence: {(result.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </HoverLift>
                    ))}
                  </StaggerChildren>
                </CardContent>
              </Card>
            </ScaleIn>
          )}

          {error && !rejected && (
            <FadeIn duration={0.3}>
              <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">{error}</p>
            </FadeIn>
          )}

          <FadeIn duration={0.5} delay={0.3} className="flex gap-3">
            {file && !aiResults && !rejected && (
              <Button onClick={analyze} disabled={analyzing || !address}>
                {analyzing ? "Analyzing with AI..." : "Run AI Analysis"}
              </Button>
            )}
            {aiResults && !rejected && (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            )}
            {rejected && file && (
              <Button variant="outline" onClick={analyze} disabled={analyzing}>
                {analyzing ? "Re-analyzing..." : "Try Again"}
              </Button>
            )}
          </FadeIn>
        </div>
      </SlideInUp>
    </RoleGuard>
  );
}
