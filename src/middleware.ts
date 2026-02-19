import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/auth/callback"];

// Routes that require profile setup to be complete
const SETUP_REQUIRED_ROUTES = [
	"/dashboard",
	"/leaderboard",
	"/problems",
	"/duels",
	"/boss",
	"/quests",
	"/attendance",
	"/flashcards",
	"/resources",
	"/announcements",
	"/hall-of-fame",
	"/notifications",
	"/admin",
	"/profile",
	"/compare",
	"/contests",
];

export async function middleware(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					supabaseResponse = NextResponse.next({
						request,
					});
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	// Refresh session (important: must call getUser, not getSession)
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const pathname = request.nextUrl.pathname;

	// Skip auth checks for API routes (they handle auth themselves)
	if (pathname.startsWith("/api/")) {
		return supabaseResponse;
	}

	// Check if current route is public
	const isPublicRoute = PUBLIC_ROUTES.some(
		(route) => pathname === route || pathname.startsWith("/auth/"),
	);

	// If not authenticated and trying to access protected route → login
	if (!user && !isPublicRoute) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// If authenticated and on login page → check profile
	if (user && pathname === "/login") {
		const { data: profile } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.single();

		const url = request.nextUrl.clone();
		url.pathname = profile ? "/dashboard" : "/setup";
		return NextResponse.redirect(url);
	}

	// If authenticated, check if profile is set up for protected routes
	if (
		user &&
		SETUP_REQUIRED_ROUTES.some((route) => pathname.startsWith(route))
	) {
		const { data: profile } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.single();

		// If no profile exists, redirect to setup
		if (!profile) {
			const url = request.nextUrl.clone();
			url.pathname = "/setup";
			return NextResponse.redirect(url);
		}
	}

	// If authenticated but on setup and ALREADY has a profile → dashboard
	if (user && pathname === "/setup") {
		const { data: profile } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.single();

		if (profile) {
			const url = request.nextUrl.clone();
			url.pathname = "/dashboard";
			return NextResponse.redirect(url);
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (icons, manifest, sw.js)
		 */
		"/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
