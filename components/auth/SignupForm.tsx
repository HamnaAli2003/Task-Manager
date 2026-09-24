"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  checkEmail,
  loginWithGoogle,
  registerUser,
  type AuthResult,
  type EmailCheck,
} from "@/app/(auth)/login/action";

const signupSchema = z
    .object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters"),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters"),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm({
    initialError,
}: {
    initialError?: string | null;
}) {
    const [serverError, setServerError] = useState(initialError ?? "");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [emailCheck, setEmailCheck] = useState<EmailCheck | null>(null);
    const [checking, setChecking] = useState(false);
    const [emailValue, setEmailValue] = useState("");
    const [emailError, setEmailError] = useState("");
    const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            password: "",
            confirmPassword: "",
        },
    });

    function onEmailChange(raw: string) {
        setEmailValue(raw);

        const trimmed = raw.trim();
        if (trimmed === "") {
            setEmailError("Email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setEmailError("Please enter a valid email address");
        } else {
            setEmailError("");
        }

        scheduleCheck(raw);
    }

    function scheduleCheck(raw: string) {
        const value = raw.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            if (checkTimer.current) clearTimeout(checkTimer.current);
            setEmailCheck(null);
            setChecking(false);
            return;
        }

        setChecking(true);
        if (checkTimer.current) clearTimeout(checkTimer.current);
        checkTimer.current = setTimeout(async () => {
            setEmailCheck(await checkEmail(value));
            setChecking(false);
        }, 400);
    }

    useEffect(
        () => () => {
            if (checkTimer.current) clearTimeout(checkTimer.current);
        },
        []
    );

    const handleGoogleSignup = async () => {
        setServerError("");
        setGoogleLoading(true);

        try {
            const guard: AuthResult = await loginWithGoogle();
            if (guard?.error) {
                setGoogleLoading(false);
                setServerError(guard.error);
                return;
            }

            await signIn("google", { callbackUrl: "/dashboard" });
        } catch {
            setGoogleLoading(false);
            setServerError("Google sign-in failed. Please try again.");
        }
    };

    const onSubmit = async (data: SignupFormData) => {
        const submitEmail = emailValue.trim().toLowerCase();
        if (!submitEmail) {
            setEmailError("Email is required");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitEmail)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        setServerError("");

        const result: AuthResult = await registerUser(
            data.name,
            submitEmail,
            data.password
        );

        if (result.error) {
            setServerError(result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
                <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-text"
                >
                    Full name
                </label>

                <input
                    id="name"
                    type="text"
                    placeholder="Hamna Ali"
                    {...register("name")}
                    className="
            w-full rounded-2xl
            border border-field-border
            bg-field-bg
            px-4 py-3
            text-sm text-text
            outline-none
            shadow-(--field-inset)
            placeholder:text-text-muted
            transition
            focus:border-accent
            focus:ring-2
            focus:ring-accent/20
          "
                />

                {errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-danger">
                        {errors.name.message}
                    </p>
                )}
            </div>

            {/* Email */}
            <div>
                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-text"
                >
                    Email address
                </label>

                <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={emailValue}
                    onChange={(event) => onEmailChange(event.target.value)}
                    autoComplete="email"
                    className="
            w-full rounded-2xl
            border border-field-border
            bg-field-bg
            px-4 py-3
            text-sm text-text
            outline-none
            shadow-(--field-inset)
            placeholder:text-text-muted
            transition
            focus:border-accent
            focus:ring-2
            focus:ring-accent/20
          "
                />

                {emailError && (
                    <p className="mt-1.5 text-xs font-medium text-danger">
                        {emailError}
                    </p>
                )}

                {checking && (
                    <p className="mt-1.5 text-xs font-medium text-text-muted">
                        Checking this email...
                    </p>
                )}

                {!checking && emailCheck?.available && (
                    <p className="mt-1.5 text-xs font-medium text-success">
                        This email is not registered — you can sign up with it.
                    </p>
                )}

                {!checking && emailCheck && !emailCheck.available && (
                    <p className="mt-1.5 text-xs font-medium text-danger">
                        An account with this email already exists.{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-accent hover:text-accent-2"
                        >
                            Sign in instead
                        </Link>
                    </p>
                )}
            </div>

            {/* Password */}
            <div>
                <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-text"
                >
                    Password
                </label>

                <div className="relative">
                <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    {...register("password")}
                    className="
            w-full rounded-2xl
            border border-field-border
            bg-field-bg
            px-4 py-3
            pr-11
            text-sm text-text
            outline-none
            shadow-(--field-inset)
            placeholder:text-text-muted
            transition
            focus:border-accent
            focus:ring-2
            focus:ring-accent/20
          "
                />

                <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="
              absolute right-3 top-1/2 -translate-y-1/2
              flex size-7 items-center justify-center
              rounded-full text-text-muted transition hover:text-accent
            "
                >
                    {showPassword ? (
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>

                {errors.password && (
                    <p className="mt-1.5 text-xs font-medium text-danger">
                        {errors.password.message}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-text"
                >
                    Confirm password
                </label>

                <div className="relative">
                <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className="
            w-full rounded-2xl
            border border-field-border
            bg-field-bg
            px-4 py-3
            pr-11
            text-sm text-text
            outline-none
            shadow-(--field-inset)
            placeholder:text-text-muted
            transition
            focus:border-accent
            focus:ring-2
            focus:ring-accent/20
          "
                />

                <button
                    type="button"
                    onClick={() => setShowConfirm((value) => !value)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    title={showConfirm ? "Hide password" : "Show password"}
                    className="
              absolute right-3 top-1/2 -translate-y-1/2
              flex size-7 items-center justify-center
              rounded-full text-text-muted transition hover:text-accent
            "
                >
                    {showConfirm ? (
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>

                {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-medium text-danger">
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            {serverError && (
                <p className="text-center text-sm font-medium text-danger">
                    {serverError}
                </p>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="
          w-full rounded-2xl
          bg-accent
          px-4 py-3
          text-sm font-bold text-white
          shadow-(--clay-drop)
          transition
          hover:-translate-y-0.5
          hover:bg-accent-hover
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
            >
                {isSubmitting ? "Creating account..." : "Create account"}
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-field-border" />
                </div>
                <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                    <span className="bg-clay-bg px-2">or</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="
          flex w-full items-center justify-center gap-3 rounded-2xl
          border border-field-border bg-white/80 px-4 py-3
          text-sm font-semibold text-text transition
          hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white
          dark:bg-slate-950/80 dark:text-white dark:hover:bg-slate-950
          disabled:cursor-not-allowed disabled:opacity-60
        "
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 48 48"
                    className="h-7 w-7 shrink-0"
                >
                    <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                </svg>
                {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Login */}
            <p className="text-center text-sm text-text-secondary">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-accent hover:text-accent-2"
                >
                    Sign in
                </Link>
            </p>
        </form>
    );
}
