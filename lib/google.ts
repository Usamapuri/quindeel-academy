import "server-only";
import { google } from "googleapis";
import { prisma } from "./db";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "openid", "email"];

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback"
  );
}

/** URL the teacher visits once to connect his Google account. */
export function getAuthUrl(): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

/** Exchange the OAuth code for tokens and store them (single-row GoogleAccount). */
export async function exchangeCode(code: string): Promise<void> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let email = "";
  try {
    const info = await google.oauth2({ version: "v2", auth: client }).userinfo.get();
    email = info.data.email || "";
  } catch {
    /* email is best-effort */
  }

  await prisma.googleAccount.upsert({
    where: { id: "primary" },
    create: {
      id: "primary",
      email,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || "",
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
    update: {
      email,
      accessToken: tokens.access_token || "",
      // keep the existing refresh token if Google didn't return a new one
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });
}

export async function getConnectedAccount() {
  return prisma.googleAccount.findUnique({ where: { id: "primary" } });
}

export async function isGoogleConnected(): Promise<boolean> {
  if (!googleConfigured()) return false;
  const acc = await getConnectedAccount();
  return Boolean(acc?.refreshToken);
}

export async function disconnectGoogle(): Promise<void> {
  await prisma.googleAccount.deleteMany({ where: { id: "primary" } });
}

/** Build an authorized client from stored tokens, persisting refreshed access tokens. */
async function authorizedClient() {
  const acc = await getConnectedAccount();
  if (!acc?.refreshToken) throw new Error("Google not connected");
  const client = oauthClient();
  client.setCredentials({
    access_token: acc.accessToken || undefined,
    refresh_token: acc.refreshToken,
    expiry_date: acc.expiry ? acc.expiry.getTime() : undefined,
  });
  client.on("tokens", async (tokens) => {
    await prisma.googleAccount.update({
      where: { id: "primary" },
      data: {
        ...(tokens.access_token ? { accessToken: tokens.access_token } : {}),
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        ...(tokens.expiry_date ? { expiry: new Date(tokens.expiry_date) } : {}),
      },
    });
  });
  return client;
}

/** Create a Google Calendar event with a Meet link and return the link + event id. */
export async function createMeetEvent(opts: {
  title: string;
  description?: string;
  startsAt: Date;
  durationMins: number;
  attendeeEmails: string[];
}): Promise<{ meetingLink: string; eventId: string }> {
  const client = await authorizedClient();
  const calendar = google.calendar({ version: "v3", auth: client });
  const end = new Date(opts.startsAt.getTime() + opts.durationMins * 60000);

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: opts.title,
      description: opts.description || undefined,
      start: { dateTime: opts.startsAt.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: opts.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `qa-${opts.startsAt.getTime()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const meetingLink =
    res.data.hangoutLink ||
    res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
    "";
  return { meetingLink, eventId: res.data.id || "" };
}
