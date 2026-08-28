"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartPieSlice, House, Plus, SquaresFour, Users } from "@phosphor-icons/react";

type NavigationIcon = "dashboard" | "home" | "register" | "systems" | "users";

export type NavigationItem = {
  href: string;
  icon: NavigationIcon;
  label: string;
  badge?: number;
  primary?: boolean;
};

const iconByName = {
  dashboard: SquaresFour,
  home: House,
  register: Plus,
  systems: ChartPieSlice,
  users: Users,
};

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ApplicationNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const currentHref = items
    .filter((item) => isCurrentPath(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  return (
    <nav className="app-primary-navigation" aria-label="Primary navigation">
      {items.map((item) => {
        const Icon = iconByName[item.icon];
        const current = currentHref === item.href;

        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={`app-nav-item${current ? " is-current" : ""}${item.primary ? " is-primary" : ""}`}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" size={17} weight={current || item.primary ? "fill" : "regular"} />
            <span className="app-nav-label">{item.label}</span>
            {item.badge && item.badge > 0 ? <span className="nav-notification">{item.badge > 9 ? "9+" : item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
