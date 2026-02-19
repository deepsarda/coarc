/**
 * Central icon map for navigation items.
 * Converts the _RAW nav arrays (no icon) into full NavItem[] with Lucide icons.
 */
import {
	BookOpen,
	CalendarCheck,
	CalendarDays,
	Code,
	Crosshair,
	Crown,
	Layers,
	LayoutDashboard,
	Megaphone,
	ScrollText,
	Settings,
	Skull,
	Swords,
	Trophy,
	User,
	Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { NavItem } from '@/lib/utils/constants';
import { ADMIN_NAV_ITEMS_RAW, MOBILE_NAV_ITEMS_RAW, NAV_ITEMS_RAW } from '@/lib/utils/constants';

const SIZE = 'w-[18px] h-[18px]';
const SIZE_MOBILE = 'w-5 h-5';

/** href → Lucide icon */
const NAV_ICON_MAP: Record<string, ReactNode> = {
	'/dashboard': <LayoutDashboard className={SIZE} />,
	'/leaderboard': <Trophy className={SIZE} />,
	'/problems': <Code className={SIZE} />,
	'/problems/daily': <CalendarDays className={SIZE} />,
	'/duels': <Swords className={SIZE} />,
	'/boss': <Skull className={SIZE} />,
	'/quests': <Crosshair className={SIZE} />,
	'/attendance': <CalendarCheck className={SIZE} />,
	'/flashcards': <Layers className={SIZE} />,
	'/resources': <BookOpen className={SIZE} />,
	'/announcements': <Megaphone className={SIZE} />,
	'/hall-of-fame': <Crown className={SIZE} />,
	'/profile/me': <User className={SIZE} />,
	// admin
	'/admin': <Settings className={SIZE} />,
	'/admin/users': <Users className={SIZE} />,
	'/admin/courses': <BookOpen className={SIZE} />,
	'/admin/daily': <CalendarDays className={SIZE} />,
	'/admin/boss': <Skull className={SIZE} />,
	'/admin/quests': <ScrollText className={SIZE} />,
	'/admin/flashcards': <Layers className={SIZE} />,
	'/admin/resources': <BookOpen className={SIZE} />,
	'/admin/announcements': <Megaphone className={SIZE} />,
};

const MOBILE_ICON_MAP: Record<string, ReactNode> = {
	'/dashboard': <LayoutDashboard className={SIZE_MOBILE} />,
	'/leaderboard': <Trophy className={SIZE_MOBILE} />,
	'/problems': <Code className={SIZE_MOBILE} />,
	'/duels': <Swords className={SIZE_MOBILE} />,
	'/profile/me': <User className={SIZE_MOBILE} />,
};

function attach(raw: Omit<NavItem, 'icon'>[], map: Record<string, ReactNode>): NavItem[] {
	return raw.map((r) => ({
		...r,
		icon: map[r.href] ?? <Code className={SIZE} />,
	}));
}

export const NAV_ITEMS = attach(NAV_ITEMS_RAW, NAV_ICON_MAP);
export const ADMIN_NAV_ITEMS = attach(ADMIN_NAV_ITEMS_RAW, NAV_ICON_MAP);
export const MOBILE_NAV_ITEMS = attach(MOBILE_NAV_ITEMS_RAW, MOBILE_ICON_MAP);
