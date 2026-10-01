import RecentItems from "@/components/dashboard/RecentItems";
import { getActiveWorkspace } from "@/lib/workspace.server";

export default async function RecentPage() {
    const workspace = await getActiveWorkspace();

    return (
        <RecentItems
            workspaceId={workspace.id}
            workspaceType={workspace.type}
        />
    );
}