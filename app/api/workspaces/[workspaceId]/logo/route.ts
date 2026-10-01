import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ ok: false, error: "You are not signed in." }, { status: 401 });
  }

  const { workspaceId } = await params;
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: userId },
    select: { id: true },
  });
  if (!workspace) {
    return Response.json(
      { ok: false, error: "Only the workspace owner can change its branding." },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { ok: false, error: "Could not read the image upload. Please try again." },
      { status: 400 },
    );
  }

  const logo = formData.get("logo");
  if (!logo || typeof logo === "string") {
    return Response.json(
      { ok: false, error: "Please choose an image file." },
      { status: 400 },
    );
  }
  if (!logo.type.startsWith("image/")) {
    return Response.json(
      { ok: false, error: "Please choose an image file." },
      { status: 400 },
    );
  }
  if (logo.size > MAX_LOGO_BYTES) {
    return Response.json(
      { ok: false, error: "Image exceeds the 2 MB upload limit. Choose a smaller image." },
      { status: 413 },
    );
  }

  const imageBytes = Buffer.from(await logo.arrayBuffer());
  const logoUrl = `data:${logo.type};base64,${imageBytes.toString("base64")}`;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { logoUrl },
  });

  revalidatePath("/", "layout");

  return Response.json({ ok: true });
}