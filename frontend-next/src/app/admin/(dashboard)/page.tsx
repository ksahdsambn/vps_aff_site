import { redirect } from "next/navigation";

/** /admin → 重定向到 /admin/products。 */
export default function DashboardIndexPage() {
  redirect("/admin/products");
}
