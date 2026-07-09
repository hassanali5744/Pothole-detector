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

interface AIResult {
  damageType: DamageType;
  confidence: number;
  severity: SeverityLevel;
  explanation: string;
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
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.209);
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
    setPreview(URL.createObjectURL(f));
  }, []);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setGettingLocation(false);
        },
        (error) => {
          setError("Unable to get your location. Using default coordinates.");
          setGettingLocation(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setGettingLocation(false);
    }
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
        <div className="mx-auto max-w-lg py-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Report Submitted!</h1>
          <p className="mt-2 text-muted">
            Your report has been queued for inspector review, prioritized by severity level.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setSubmitted(false);
              setFile(null);
              setPreview(null);
              setAiResults(null);
              setRejected(false);
            }}
          >
            Submit Another Report
          </Button>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["citizen"]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Report Road Damage"
          description="Upload a clear photo of the defect. Our AI will verify it's road damage, classify the type, and assign severity for inspector prioritization."
        />

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input
              id="address"
              label="Address / Landmark"
              placeholder="e.g. Connaught Place, Block A"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Select
              id="city"
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={[
                { value: "New Delhi", label: "New Delhi" },
                { value: "Noida", label: "Noida" },
                { value: "Gurgaon", label: "Gurgaon" },
                { value: "Faridabad", label: "Faridabad" },
              ]}
            />
            <div className="sm:col-span-2">
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
                Current coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>

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

        {rejected && (
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
        )}

        {aiResults && aiResults.length > 0 && (
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
                    Model: {modelUsed === "yolo_finetuned" ? "Fine-tuned YOLO" : "Heuristic CV (add road_damage.pt for fine-tuned model)"}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiResults.map((result, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface-muted/40 p-4">
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
              ))}
            </CardContent>
          </Card>
        )}

        {error && !rejected && (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">{error}</p>
        )}

        <div className="flex gap-3">
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
        </div>
      </div>
    </RoleGuard>
  );
}
