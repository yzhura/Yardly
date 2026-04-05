import type { LucideIcon } from "lucide-react";
import {
  Factory,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional badge (e.g. pending count) */
  badge?: number;
};

export const DASHBOARD_NAV_MAIN: DashboardNavItem[] = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/orders", label: "Замовлення", icon: ShoppingCart },
  { href: "/products", label: "Товари", icon: Package },
  { href: "/materials", label: "Склад матеріалів", icon: Warehouse },
  { href: "/production", label: "Виробництво", icon: Factory },
  { href: "/team/invite", label: "Користувачі", icon: Users },
  { href: "/settings", label: "Налаштування", icon: Settings },
];
