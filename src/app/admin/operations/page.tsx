import { requireAdminPage } from "../guard";
import { FeatureOperations } from "./page-client";
export default async function Page() {
  await requireAdminPage("workspace");
  return <FeatureOperations />;
}
