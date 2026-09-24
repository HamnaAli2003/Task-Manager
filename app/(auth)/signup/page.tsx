import { auth } from "@/auth";
import { friendlyAuthError } from "@/lib/auth-errors";
import SignupForm from "@/components/auth/SignupForm";
import SignedInCard from "@/components/auth/SignedInCard";

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const session = await auth();
    if (session?.user) {
        return (
            <SignedInCard
                name={session.user.name}
                email={session.user.email}
            />
        );
    }

    const initialError = friendlyAuthError(error);

    return (
        <section className="w-full max-w-md">
            <div className="mb-8 text-center">
                <div
                    className="
						mx-auto mb-4 flex size-14
						items-center justify-center
						rounded-2xl bg-accent
						text-xl font-bold text-white
						shadow-(--clay-drop)
					"
                >
                    P
                </div>

                <h1 className="text-3xl font-bold text-text">
                    Create your account
                </h1>

                <p className="mt-2 text-sm text-text-secondary">
                    Start organizing your workspace today
                </p>
            </div>

            <div
                className="
					rounded-[30px]
					border border-clay-edge
					bg-clay-bg
					p-6
					shadow-(--clay-card)
					sm:p-8
				"
            >
                <SignupForm initialError={initialError} />
            </div>

            <p className="mt-6 text-center text-xs text-text-muted">
                Project Management Portal
            </p>
        </section>
    );
}