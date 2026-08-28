import { requireUser } from "@/lib/auth/permissions";
import { ApplicationShell } from "@/components/application-shell";
import { getNotificationCount } from "@/lib/data/notifications";
import { getLocale } from "@/lib/i18n";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const [notificationCount, locale] = await Promise.all([getNotificationCount(user.id, user.role), getLocale()]);
  return <ApplicationShell user={user} notificationCount={notificationCount} locale={locale}>{children}</ApplicationShell>;
}
