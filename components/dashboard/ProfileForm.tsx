"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/(dashboard)/profile/actions";
import { deleteAccount } from "@/app/(auth)/login/action";
import { saveUser } from "./useUser";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

type ProfileFormProps = {
  initialName: string;
  initialEmail: string;
  initialImage?: string | null;
  initialBio: string;
};

export default function ProfileForm({
  initialName,
  initialEmail,
  initialImage,
  initialBio,
}: ProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [image, setImage] = useState<string | null>(initialImage ?? null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, startDelete] = useTransition();

  const fileRef = useRef<HTMLInputElement>(null);

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  function onPickFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large. Please choose a file under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : null);
      setError("");
      setSaved("");
    };
    reader.readAsDataURL(file);
  }

  function onSave() {
    setError("");
    setSaved("");
    startTransition(async () => {
      const result = await updateProfile({ name, bio, image });
      if (result.error) {
        setError(result.error);
        return;
      }

      saveUser({ name, email: initialEmail });
      saveUser({ name, email: initialEmail, image });
      setSaved("Profile updated.");
      router.refresh();
    });
  }

  function onRemovePhoto() {
    setError("");
    setSaved("");
    startTransition(async () => {
      const result = await updateProfile({ name, bio, image: null });
      if (result.error) {
        setError(result.error);
        return;
      }
      saveUser({ name, email: initialEmail, image: null });
      setImage(null);
      setSaved("Profile photo removed.");
      router.refresh();
    });
  }

  function onConfirmDelete() {
    setDeleteOpen(false);
    startDelete(async () => {
      const result = await deleteAccount();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/login");
    });
  }

  const inputClasses = `
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
  `;

  return (
    <div className="space-y-6">
      {/* Card */}
      <div
        className="
          rounded-3xl border border-clay-edge bg-clay-bg p-6
          shadow-(--clay-card)
        "
      >
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Profile"
                className="size-24 rounded-full border-4 border-accent bg-clay-bg object-cover shadow-(--clay-drop)"
              />
            ) : (
              <div
                className="
                  flex size-24 items-center justify-center rounded-full
                  border-4 border-accent bg-accent text-3xl font-bold
                  text-white shadow-(--clay-drop)
                "
              >
                {initials}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="
                absolute -bottom-1 -right-1 flex size-9 items-center justify-center
                rounded-full border border-clay-edge bg-clay-bg text-text-muted
                shadow-(--clay-drop) transition hover:text-accent
              "
              aria-label="Upload profile image"
              title="Upload profile image"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onPickFile(event.target.files?.[0])}
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-text dark:text-slate-100">{name}</h2>
            <p className="truncate text-sm text-text-muted dark:text-slate-400">{initialEmail}</p>

            {image && (
              <button
                type="button"
                disabled={pending}
                onClick={onRemovePhoto}
                className="
                  mt-3 inline-flex items-center gap-1.5 rounded-xl
                  border border-danger/40 bg-danger/10 px-3 py-1.5
                  text-xs font-semibold text-danger
                  transition hover:bg-danger hover:text-white
                  focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0
                  disabled:cursor-wait disabled:opacity-60
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-text">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved("");
              }}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-2 block text-sm font-semibold text-text">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={initialEmail}
              readOnly
              className={`${inputClasses} cursor-not-allowed opacity-70`}
            />
            <p className="mt-1.5 text-xs text-text-muted">
              Your email is the login for this account and cannot be changed.
            </p>
          </div>

          <div>
            <label htmlFor="profile-bio" className="mb-2 block text-sm font-semibold text-text">
              About you
            </label>
            <textarea
              id="profile-bio"
              rows={4}
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                setSaved("");
              }}
              placeholder="Write a short description about yourself..."
              className={`${inputClasses} resize-none`}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-medium text-danger">{error}</p>
        )}
        {saved && (
          <p className="mt-4 text-center text-sm font-medium text-success">{saved}</p>
        )}

        {/* Save */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={onSave}
            className="
              inline-flex items-center gap-2 rounded-2xl
              bg-accent px-6 py-3 text-sm font-bold text-white
              shadow-(--clay-drop) transition hover:-translate-y-0.5
              hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60
            "
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div
        className="
          rounded-3xl border border-danger/30 bg-clay-bg p-6
          shadow-(--clay-card)
        "
      >
        <h2 className="text-base font-bold text-danger">Danger zone</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Deleting your account permanently removes your profile, and it cannot
          be undone.
        </p>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={deletePending}
            onClick={() => setDeleteOpen(true)}
            className="
              inline-flex items-center gap-2 rounded-2xl
              border border-danger bg-clay-bg px-6 py-3
              text-sm font-bold text-danger shadow-(--clay-drop)
              transition hover:-translate-y-0.5 hover:bg-danger
              hover:text-black dark:hover:text-white disabled:cursor-wait disabled:opacity-60
            "
          >
            Delete account
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete account?"
        body={
          <>
            Are you sure you want to permanently delete your account? This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete permanently"
        pending={deletePending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}