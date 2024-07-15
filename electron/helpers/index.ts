import type { AppData } from "~/types/app-info";
import { allApps } from "../watchers";
import { getInstalledApps } from "./installed-apps";
import { getAppIconMac } from "./installed-apps/mac";
import { getFilePath, getIconFromWindows } from "./installed-apps/windows";

export async function getAvailableApps(): Promise<AppData[]> {
  const installedApps = await getInstalledApps();

  return (
    await Promise.all(
      allApps.map(async (app) => {
        if (process.platform === "win32" && app.windows?.DisplayName) {
          const record = installedApps.find(
            (ia) =>
              ia["DisplayName"] &&
              app.windows?.DisplayName &&
              ia["DisplayName"].startsWith(app.windows.DisplayName),
          );

          if (!record) {
            return null;
          }
          const name = record["DisplayName"];
          const filePath = await getFilePath(record, app.windows.exePath);
          if (!filePath || !name) {
            return null;
          }

          let icon: string | null = null;

          try {
            icon = getIconFromWindows(filePath);
          } catch (error) {
            /* empty */
          }

          return { icon, name, path: filePath };
        }

        if (process.platform === "darwin" && app.mac?.bundleId) {
          const record = installedApps.find(
            (ia) =>
              ia["kMDItemCFBundleIdentifier"] &&
              app.mac?.bundleId &&
              ia["kMDItemCFBundleIdentifier"] === app.mac.bundleId,
          );

          if (!record) {
            return null;
          }
          const name = record["kMDItemDisplayName"]?.replace(".app", "");
          const path = record["_FILE_PATH"];
          if (!path || !name) {
            return;
          }
          const icon = await getAppIconMac(path);

          return { path, icon, name };
        }

        return null;
      }),
    )
  ).filter((app) => !!app) as AppData[];
}
