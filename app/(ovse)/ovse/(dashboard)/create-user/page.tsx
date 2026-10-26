
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authorizedFetch } from "@/app/lib/api-client";

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
    "notDefined",
    "maskedAadhaar",
];

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

function generateUserScope(selected: number[]): string {
    const selectedSet = new Set(selected);

    return Array.from({ length: CLAIMS.length }, (_, index) =>
        selectedSet.has(index + 1) ? "1" : "0"
    ).join("");
}

export default function CreateUserPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [premisesAddress, setPremisesAddress] = useState("");
    const [selectedClaims, setSelectedClaims] = useState<number[]>([
        6, 8, 12, 42,
    ]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const userScope = generateUserScope(selectedClaims);

    function toggleClaim(id: number, checked: boolean) {
        setSelectedClaims((previous) =>
            checked
                ? [...new Set([...previous, id])].sort((a, b) => a - b)
                : previous.filter((claimId) => claimId !== id)
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (saving) return;

        setError("");
        setSuccess("");

        if (name.trim().length < 2) {
            setError("Name must contain at least 2 characters.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
            setError("Enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Password is required.");
            return;
        }
        if (!premisesAddress) {
            setError("Premises address is required.");
            return;
        }

        if (selectedClaims.length === 0) {
            setError("Please select at least one claim.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                name: name.trim(),
                email: email.trim(),
                password,
                user_scope: userScope,
                premises_addr: premisesAddress,
            };

            const response = await authorizedFetch(
                "/api/admin/register",
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    result?.error ||
                    `Registration failed (${response.status}).`
                );
            }

            setSuccess("User created successfully.");

            router.push("/ovse/users");
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create user."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
            <div className="mx-auto max-w-5xl space-y-6">
                <header>
                    <Link
                        href="/ovse/users"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        ← Back to Users
                    </Link>

                    <h1 className="mt-4 text-2xl font-bold">
                        Create User
                    </h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Enter user details and select their access claims.
                    </p>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
                >
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium"
                            >
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                autoComplete="name"
                                required
                                minLength={2}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter name"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium"
                            >
                                Username
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="text"
                                autoComplete="username"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Username"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="premises-address"
                                className="mb-1.5 block text-sm font-medium"
                            >
                                Premises Address
                            </label>
                            <input
                                id="premises-address"
                                name="premises-address"
                                type="text"
                                autoComplete="premises-address"
                                required
                                value={premisesAddress}
                                onChange={(e) => setPremisesAddress(e.target.value)}
                                placeholder="Enter Premises Address"
                                className={inputClass}
                            />
                        </div>
                        <div className="">
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className={inputClass}
                            />
                        </div>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-semibold">
                                Bit Map Selection
                            </h2>
                            <span className="text-sm text-slate-500">
                                {selectedClaims.length} selected
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            {CLAIMS.map((claim, index) => {
                                const id = index + 1;

                                return (
                                    <label
                                        key={id}
                                        className="flex items-start gap-2 rounded-lg border border-slate-200 p-2.5 text-xs hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedClaims.includes(id)}
                                            onChange={(e) =>
                                                toggleClaim(
                                                    id,
                                                    e.target.checked
                                                )
                                            }
                                            className="mt-0.5 accent-blue-600"
                                        />
                                        <span className="break-words">
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

                    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-2 flex justify-between gap-2">
                            <span className="text-sm font-semibold">
                                user_scope
                            </span>
                            <span className="text-xs text-slate-500">
                                {userScope.length} bits
                            </span>
                        </div>

                        <code className="block break-all font-mono text-xs leading-6">
                            {userScope}
                        </code>
                    </section>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                        >
                            {error}
                        </p>
                    )}

                    {success && (
                        <p
                            role="status"
                            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                        >
                            {success}
                        </p>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                        <Link
                            href="/ovse/users"
                            className="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold dark:border-slate-700"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
