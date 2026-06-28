"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, MapPin, Brain, CheckCircle, X, ImageIcon } from "lucide-react";
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

const mockAIResults: AIResult[] = [
  {
    damageType: "pothole",
    confidence: 0.93,
    severity: "high",
    explanation:
      "Large circular depression detected with irregular edges. Estimated depth appears significant based on shadow analysis.",
  },
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AIResult[] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setAiResults(null);
    setSubmitted(false);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.type.startsWith("image/") || f.type.startsWith("video/"))) {
        handleFile(f);
      }
    },
    [handleFile]
  );

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await apiClient.postForm("/api/ai/analyze", formData);
      const detections = (data as { detections: AIResult[] }).detections;
      setAiResults(detections);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "AI analysis failed";
      setError(message);
      setAiResults(mockAIResults);
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    if (!file || !aiResults || aiResults.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("address", address);
      formData.append("city", city);
      // Default coordinates for New Delhi
      formData.append("latitude", "28.6139");
      formData.append("longitude", "77.209");
      
      const mainResult = aiResults[0];
      formData.append("damageType", mainResult.damageType);
      formData.append("severity", mainResult.severity);
      formData.append("aiConfidence", mainResult.confidence.toString());
      formData.append("aiDetections", JSON.stringify(aiResults));
      formData.append("aiExplanation", mainResult.explanation);

      await apiClient.postForm("/api/reports", formData);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError(err.message || "Failed to submit report. Please try again.");
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
            Your road damage report has been submitted and is pending inspector review.
          </p>
          <Button className="mt-6" onClick={() => { setSubmitted(false); setFile(null); setPreview(null); setAiResults(null); }}>
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
          description="Upload an image or video of the road damage. Our AI will analyze it automatically."
        />

        {/* Upload zone */}
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
                  {file?.type.startsWith("video/") ? (
                    <video src={preview} controls className="w-full rounded-lg" />
                  ) : (
                    <div className="relative h-64 w-full">
                      <Image src={preview} alt="Preview" fill className="rounded-lg object-cover" />
                    </div>
                  )}
                  <button
                    onClick={() => { setFile(null); setPreview(null); setAiResults(null); }}
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
                    Drag & drop your image or video here
                  </p>
                  <p className="mt-1 text-xs text-muted">PNG, JPG, MP4 up to 50MB</p>
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:border-line-strong hover:bg-surface-muted">
                    <Upload className="h-4 w-4" />
                    Browse Files
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                  </label>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
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
          </CardContent>
        </Card>

        {/* AI Analysis */}
        {aiResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4" />
                AI Detection Results
              </CardTitle>
              <CardDescription>
                Our AI model analyzed your upload and detected the following defects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiResults.map((result, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-semibold text-ink">
                      {DAMAGE_TYPE_LABELS[result.damageType]}
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

        {error && (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {file && !aiResults && (
            <Button onClick={analyze} disabled={analyzing || !address}>
              {analyzing ? "Analyzing..." : "Run AI Analysis"}
            </Button>
          )}
          {aiResults && (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
