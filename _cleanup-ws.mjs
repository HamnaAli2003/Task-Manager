import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function removeUser(email) {
  const user = await p.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) { console.log("no user:", email); return; }
  await p.workspaceMember.deleteMany({ where: { userId: user.id } });
  await p.invite.deleteMany({ where: { createdById: user.id } });
  await p.notification.deleteMany({ where: { userId: user.id } });
  const owned = (await p.workspace.findMany({ where: { ownerId: user.id }, select: { id: true } })).map((w) => w.id);
  if (owned.length) await p.workspace.deleteMany({ where: { id: { in: owned } } });
  await p.user.delete({ where: { id: user.id } });
  console.log("cleaned:", email, "ownedWorkspaces:", owned.length);
}

async function main() {
  await removeUser("wowner@pmp.local");
  await removeUser("wmember@pmp.local");
  const orphan = await p.notification.count({ where: { actorId: { isSet: true } } });
  console.log("actor notifications remaining:", orphan);
  await p.$disconnect();
}

main();