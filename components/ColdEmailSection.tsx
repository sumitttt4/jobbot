"use client";

import { useState } from "react";
import { Mail, Search, Sparkles, Loader2, Check, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export function ColdEmailSection({
  jobId,
  companyName,
  canGenerate = true,
  canSend = false,
  onStatusUpdate,
}: {
  jobId: string;
  companyName: string;
  canGenerate?: boolean;
  canSend?: boolean;
  onStatusUpdate?: (status: any) => void;
}) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Guessing email formats
  const cleanCompanyName = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const domainGuess = cleanCompanyName ? `${cleanCompanyName}.com` : "company.com";
  const commonEmails = [
    `jobs@${domainGuess}`,
    `recruiting@${domainGuess}`,
    `careers@${domainGuess}`,
    `hr@${domainGuess}`,
  ];

  // Search links
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${companyName} founders email OR hr email OR recruiting`
  )}`;
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${companyName} founder HR recruiter`
  )}`;

  async function generateEmail() {
    setLoading(true);
    setErrorMsg("");
    setStatus("idle");
    try {
      const res = await fetch("/api/generate-cold-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      setSubject(data.subject);
      setBody(data.body);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  async function sendEmail() {
    if (!recipient) {
      setErrorMsg("Please enter the recipient's email address.");
      setStatus("error");
      return;
    }
    setSending(true);
    setErrorMsg("");
    setStatus("idle");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipient, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");

      setStatus("success");

      // Auto update status to "applied" and add a note
      if (onStatusUpdate) {
        onStatusUpdate("applied");
      }
      
      // Update job status & notes in the background database
      const today = new Date().toLocaleDateString();
      await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "applied",
          notes: `Sent cold email to ${recipient} on ${today}.`,
        }),
      }).catch(() => {});
      
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-5">
      <CardBody className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Mail className="h-5 w-5" strokeWidth={1.75} /> Cold Outreach
          </h2>
          <p className="text-sm text-muted mt-1">
            Find the right contact, write a direct human email, and send it immediately.
          </p>
        </div>

        {/* Email Research Tools */}
        <div className="rounded-md border border-line bg-subtle p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Search className="h-3.5 w-3.5" /> Find or Guess Contact Email
          </div>
          
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={linkedinSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-subtle"
            >
              <span>Search LinkedIn for decision-makers</span>
              <ExternalLink className="h-3 w-3 text-muted" />
            </a>
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-subtle"
            >
              <span>Search Google for emails</span>
              <ExternalLink className="h-3 w-3 text-muted" />
            </a>
          </div>

          <div>
            <span className="text-xs text-muted block mb-1">Common email patterns for {companyName}:</span>
            <div className="flex flex-wrap gap-1.5">
              {commonEmails.map((email) => (
                <button
                  key={email}
                  onClick={() => setRecipient(email)}
                  className="rounded bg-white border border-line px-2 py-0.5 text-xs text-ink hover:border-ink hover:bg-subtle font-mono"
                >
                  {email}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Outreach Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">To (HR or Founder Email)</Label>
            <Input
              id="recipient"
              type="email"
              placeholder="e.g. founder@company.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="flex items-end justify-between">
            <Label className="mb-0">Email Content</Label>
            <Button
              variant="secondary"
              size="sm"
              onClick={generateEmail}
              disabled={loading || !canGenerate}
              title={canGenerate ? "" : "Add GROQ_API_KEY to generate"}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" /> Generate cold email
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              placeholder="Hi [Name]..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Action and feedback */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Button
                onClick={sendEmail}
                disabled={sending || !body || !recipient}
                className="gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> Send Cold Email
                  </>
                )}
              </Button>

              {!canSend && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Info className="h-3.5 w-3.5" />
                  SMTP credentials missing. You can only view/edit.
                </span>
              )}
            </div>

            {status === "success" && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                <Check className="h-4 w-4 shrink-0" strokeWidth={3} />
                <span>Cold email sent successfully! Status updated to Applied.</span>
              </div>
            )}

            {status === "error" && (
              <p className="text-sm text-ink bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
