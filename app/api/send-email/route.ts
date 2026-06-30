import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasSmtp } from "@/lib/config";

export const runtime = "nodejs";

/**
 * POST /api/send-email
 * Body: { to, subject, body }
 * Sends a cold email using Nodemailer and SMTP credentials.
 */
export async function POST(req: Request) {
  if (!hasSmtp) {
    return NextResponse.json(
      { error: "SMTP settings not configured. Please add SMTP_HOST, SMTP_USER, and SMTP_PASS to environment variables." },
      { status: 400 }
    );
  }

  const { to, subject, body } = (await req.json().catch(() => ({}))) as {
    to?: string;
    subject?: string;
    body?: string;
  };

  if (!to || !subject || !body) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, body" },
      { status: 400 }
    );
  }

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  const from = process.env.SMTP_FROM || user;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports (587, 25)
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: body,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("Nodemailer failed:", err);
    return NextResponse.json(
      { error: `Failed to send email: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
