
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Field,
  Toast,
  btnGhost,
  btnPrimary,
  card,
  inputCls,
} from "@/components/ui";
import { authorizedFetch, getAdminToken } from "@/app/lib/api-client";
import { updateAdminUser, type ApiUser } from "@/app/lib/admin-api";

type ProfileUser = ApiUser & {
  password?: string;
  access_token?: string;
  refresh_token?: string;
};

type Errors = Partial<Record<"name" | "email", string>>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CLAIMS = [
  "credentialIssuingDate",
  "enrolmentDate",
  "enrolmentNumber",
  "isNRI",
  "residentImage",
  "residentName",
  "localResidentName",
  "ageAbove18",
  "ageAbove50",
  "ageAbove60",
  "ageAbove75",
  "dob",
  "gender",
  "careOf",
  "localCareOf",
  "building",
  "localBuilding",
  "locality",
  "localLocality",
  "street",
  "localStreet",
  "landmark",
  "localLandmark",
  "vtc",
  "localVtc",
  "subDistrict",
  "localSubDistrict",
  "district",
  "localDistrict",
  "state",
  "localState",
  "poName",
  "localPoName",
  "pincode",
  "address",
  "regionalAddress",
  "mobile",
  "maskedMobile",
  "email",
  "maskedEmail",
  "claim41",
  "maskedAadhaar",
];

function generateUserScope(selected: number[]): string {
  const selectedSet = new Set(selected);

  return Array.from(
    { length: CLAIMS.length },
    (_, index) => (selectedSet.has(index + 1) ? "1" : "0")
  ).join("");
}

function parseUserScope(scope: string): number[] {
  return Array.from(scope)
    .flatMap((bit, index) => (bit === "1" ? [index + 1] : []))
    .filter((id) => id <= CLAIMS.length);
}

function getApiMessage(result: any, fallback: string) {
  return result?.message || result?.error || fallback;
}

async function readJson(response: Response) {
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.status === false) {
    throw new Error(
      getApiMessage(result, `Request failed (${response.status}).`)
    );
  }

  return result;
}

function validate(name: string, email: string): Errors {
  const errors: Errors = {};

  if (name.trim().length < 2) {
    errors.name = "Enter your full name.";
  }

  if (!emailRe.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }

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
  const [savedScope, setSavedScope] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedClaims, setSelectedClaims] = useState<number[]>([]);

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState("");

  // Generate the bitmask from selected checkboxes.
  const userScope = generateUserScope(selectedClaims);

  const dirty =
    name !== savedName ||
    email !== savedEmail ||
    userScope !== savedScope;

  const clearToast = useCallback(() => {
    setToast("");
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const token = getAdminToken();

      const response = await authorizedFetch(
        "/api/admin/user-details/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await readJson(response);

      const profile = (
        result?.data?.user ?? result?.data
      ) as ProfileUser | undefined;

      if (!profile || profile.id === undefined) {
        throw new Error(
          "Unexpected profile API response format."
        );
      }

      const nextName = profile.name ?? "";
      const nextEmail = profile.email ?? "";
      const rawScope = String(profile.user_scope ?? "");

      const parsedClaims = parseUserScope(rawScope);
      const normalizedScope = generateUserScope(parsedClaims);

      setUser(profile);

      setName(nextName);
      setSavedName(nextName);

      setEmail(nextEmail);
      setSavedEmail(nextEmail);

      setSelectedClaims(parsedClaims);
      setSavedScope(normalizedScope);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not load profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function toggleClaim(id: number, checked: boolean) {
    setSelectedClaims((previous) =>
      checked
        ? [...new Set([...previous, id])].sort(
          (a, b) => a - b
        )
        : previous.filter((claimId) => claimId !== id)
    );
  }

  function resetForm() {
    setName(savedName);
    setEmail(savedEmail);
    setSelectedClaims(parseUserScope(savedScope));
    setErrors({});
    setPageError("");
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user || saving) return;

    const nextErrors = validate(name, email);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setPageError("");

    try {
      const nextName = name.trim();
      const nextEmail = email.trim();
      const nextScope = generateUserScope(selectedClaims);

      await updateAdminUser(user.id, {
        name: nextName,
        email: nextEmail,
        user_scope: nextScope,
      });

      setSavedName(nextName);
      setSavedEmail(nextEmail);
      setSavedScope(nextScope);

      setName(nextName);
      setEmail(nextEmail);

      setToast("Profile updated successfully.");

      await loadProfile();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const active = isActive(user?.is_active);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Account
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Profile settings
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void loadProfile()}
          disabled={loading || saving}
          className={btnGhost}
        >
          <span
            className={
              loading
                ? "mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
                : "mr-2"
            }
            aria-hidden="true"
          >
            {!loading ? "↻" : ""}
          </span>

          {loading ? "Loading…" : "Refresh profile"}
        </button>
      </header>

      {/* Error message */}
      {pageError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <p className="font-semibold">
            Something went wrong
          </p>

          <p className="mt-1">{pageError}</p>

          {!user && (
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="mt-2 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile form */}
        <section
          className={`${card} space-y-5 p-6 lg:col-span-2`}
        >
          <div className="flex items-center gap-4">
            <Avatar name={name || "User"} />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {name ||
                  (loading
                    ? "Loading profile…"
                    : "Your profile")}
              </h2>

              <p className="break-all text-sm text-slate-500 dark:text-slate-400">
                {email || "Profile information"}
              </p>
            </div>

            {active !== null && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
              >
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
            <form
              onSubmit={submit}
              noValidate
              className="space-y-5"
            >
              {/* Name and email */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  htmlFor="profile-name"
                  error={errors.name}
                >
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        name: undefined,
                      }));
                    }}
                    className={`${inputCls} ${errors.name
                        ? "border-rose-500"
                        : ""
                      }`}
                    autoComplete="name"
                  />
                </Field>

                <Field
                  label="Email address"
                  htmlFor="profile-email"
                  error={errors.email}
                >
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        email: undefined,
                      }));
                    }}
                    className={`${inputCls} ${errors.email
                        ? "border-rose-500"
                        : ""
                      }`}
                    autoComplete="email"
                  />
                </Field>
              </div>

              {/* Bit Map Selection */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      Bit Map Selection
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Select the claims this user can access.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {selectedClaims.length} / {CLAIMS.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {CLAIMS.map((claim, index) => {
                    const id = index + 1;
                    const checked =
                      selectedClaims.includes(id);

                    return (
                      <label
                        key={id}
                        className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors ${checked
                            ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={saving}
                          onChange={(event) =>
                            toggleClaim(
                              id,
                              event.target.checked
                            )
                          }
                          className="mt-0.5 shrink-0 accent-blue-600"
                        />

                        <span className="min-w-0 break-words text-slate-700 dark:text-slate-300">
                          <span className="mr-1 font-semibold">
                            {id}.
                          </span>
                          {claim}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Generated bitmask preview */}
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    user_scope
                  </span>

                  <span className="text-xs text-slate-500">
                    {userScope.length} bits
                  </span>
                </div>

                <code className="block break-all font-mono text-xs leading-6 text-slate-600 dark:text-slate-300">
                  {userScope}
                </code>
              </section>

              {/* Account details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      User ID
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                      #{user.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Role
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {user.role || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Created at
                    </p>

                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {user.created_at
                        ? new Date(
                          user.created_at
                        ).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Last updated
                    </p>

                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {user.updated_at
                        ? new Date(
                          user.updated_at
                        ).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={resetForm}
                  className={btnGhost}
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={!dirty || saving}
                  className={btnPrimary}
                >
                  {saving && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving
                    ? "Saving…"
                    : "Save changes"}
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
