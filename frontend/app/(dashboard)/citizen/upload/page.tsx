"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, MapPin, Brain, CheckCircle, X, ImageIcon } from "lucide-react";
import { RoleGuard } from "@/components/layout/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";
import { DAMAGE_TYPE_LABELS } from "@/lib/constants";
import type { DamageType, SeverityLevel } from "@/lib/types";

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
    await new Promise((r) => setTimeout(r, 2000));
    setAiResults(mockAIResults);
    setAnalyzing(false);
  };

  const submit = async () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <RoleGuard allowedRoles={["citizen"]}>
        <div className="mx-auto max-w-lg py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Report Submitted!</h1>
          <p className="mt-2 text-slate-500">
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report Road Damage</h1>
          <p className="text-slate-500">
            Upload an image or video of the road damage. Our AI will analyze it automatically.
          </p>
        </div>

        {/* Upload zone */}
        <Card>
          <CardContent className="p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
                dragOver ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50"
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
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-full bg-brand-100 p-4">
                    <ImageIcon className="h-8 w-8 text-brand-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Drag & drop your image or video here
                  </p>
                  <p className="mt-1 text-xs text-slate-400">PNG, JPG, MP4 up to 50MB</p>
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
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
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">
                      {DAMAGE_TYPE_LABELS[result.damageType]}
                    </h4>
                    <SeverityBadge severity={result.severity} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{result.explanation}</p>
                  <p className="mt-2 text-xs text-brand-600">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          {file && !aiResults && (
            <Button onClick={analyze} disabled={analyzing || !address}>
              {analyzing ? "Analyzing..." : "Run AI Analysis"}
            </Button>
          )}
          {aiResults && (
            <Button onClick={submit}>Submit Report</Button>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
