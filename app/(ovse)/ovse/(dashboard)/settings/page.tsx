"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar, Field, Toast, btnGhost, btnPrimary, card, inputCls } from "@/components/ui";
import { authorizedFetch } from "@/app/lib/api-client";
import { updateAdminUser, type ApiUser } from "@/app/lib/admin-api";

const USER_ID = 1;

type ProfileUser = ApiUser & {
  password?: string;
  access_token?: string;
  refresh_token?: string;
};

type Errors = Partial<Record<"name" | "email", string>>;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getApiMessage(result: any, fallback: string) {
  return result?.message || result?.error || fallback;
}

async function readJson(response: Response) {
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.status === false) {
    throw new Error(getApiMessage(result, `Request failed (${response.status}).`));
  }
  return result;
}

function validate(name: string, email: string): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) errors.name = "Enter your full name.";
  if (!emailRe.test(email.trim())) errors.email = "Enter a valid email address.";
  return errors;
}

function isActive(value: ApiUser["is_active"]) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  return null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [savedName, setSavedName] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userScope, setUserScope] = useState("");
  const [savedScope, setSavedScope] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState("");

  const clearToast = useCallback(() => setToast(""), []);

  const dirty =
    name !== savedName ||
    email !== savedEmail ||
    userScope !== savedScope;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await authorizedFetch(`/api/admin/user/${USER_ID}`, {
        method: "GET",
      });
      const result = await readJson(response);
      const profile = (result?.data?.user ?? result?.data) as ProfileUser | undefined;

      if (!profile || profile.id === undefined) {
        throw new Error("Unexpected profile API response format.");
      }

      const nextName = profile.name ?? "";
      const nextEmail = profile.email ?? "";
      const nextScope = String(profile.user_scope ?? "");

      setUser(profile);
      setName(nextName);
      setSavedName(nextName);
      setEmail(nextEmail);
      setSavedEmail(nextEmail);
      setUserScope(nextScope);
      setSavedScope(nextScope);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const nextErrors = validate(name, email);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setPageError("");

    try {
      await updateAdminUser(user.id, {
        name: name.trim(),
        email: email.trim(),
        user_scope: userScope,
      });

      setSavedName(name.trim());
      setSavedEmail(email.trim());
      setSavedScope(userScope);
      setName(name.trim());
      setEmail(email.trim());
      setToast("Profile updated successfully.");
      await loadProfile();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  const active = isActive(user?.is_active);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Profile settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and update the profile connected to your admin account.
          </p>
        </div>
        <button type="button" onClick={() => void loadProfile()} disabled={loading || saving} className={btnGhost}>
          <span className={loading ? "mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" : "mr-2"} aria-hidden="true">
            {!loading ? "↻" : ""}
          </span>
          {loading ? "Loading…" : "Refresh profile"}
        </button>
      </header>

      {pageError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1">{pageError}</p>
          {!user && <button type="button" onClick={() => void loadProfile()} className="mt-2 font-semibold underline underline-offset-4">Try again</button>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${card} space-y-5 p-6 lg:col-span-2`}>
          <div className="flex items-center gap-4">
            <Avatar name={name || "User"} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 dark:text-white">{name || (loading ? "Loading profile…" : "Your profile")}</h2>
              <p className="break-all text-sm text-slate-500 dark:text-slate-400">{email || "Profile information"}</p>
            </div>
            {active !== null && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                {active ? "Active" : "Inactive"}
              </span>
            )}
          </div>

          {loading && !user ? (
            <div className="space-y-3 py-8">
              <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : user ? (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" htmlFor="profile-name" error={errors.name}>
                  <input id="profile-name" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }} className={`${inputCls} ${errors.name ? "border-rose-500" : ""}`} autoComplete="name" />
                </Field>
                <Field label="Email address" htmlFor="profile-email" error={errors.email}>
                  <input id="profile-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })); }} className={`${inputCls} ${errors.email ? "border-rose-500" : ""}`} autoComplete="email" />
                </Field>
              </div>



              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">User ID</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">#{user.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{user.role || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Created at</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{user.created_at ? new Date(user.created_at).toLocaleString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last updated</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{user.updated_at ? new Date(user.updated_at).toLocaleString() : "—"}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button type="button" disabled={!dirty || saving} onClick={() => { setName(savedName); setEmail(savedEmail); setUserScope(savedScope); setErrors({}); }} className={btnGhost}>Reset</button>
                <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
                  {saving && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : null}
        </section>


      </div>

      <Toast message={toast} onClose={clearToast} />
    </div>
  );
}
