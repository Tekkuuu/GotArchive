<script lang="ts">
	/**
	 * Brand icon for external platforms.
	 *
	 * Renders a single-path `<svg>` so callers keep control of their surrounding
	 * `<a>`/button markup.
	 */
	type PlatformName = 'anilist' | 'mal';

	interface IconDef {
		title: string;
		path: string;
	}

	interface Props {
		/** Bundled icon; omit when rendering a DB-provided `svg` instead. */
		platform?: PlatformName;
		/** Sanitized simple-icons `<svg>` markup from `platform.icon_svg`; wins over `platform`. */
		svg?: string | null;
		/** Brand colour (`#rrggbb`) from `platform.icon_color`; inherited by the SVG. */
		color?: string | null;
		class?: string;
	}

	let { platform, svg = null, color = null, class: className = '' }: Props = $props();

	const ANILIST_PATH =
		'M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z';

	const MAL_PATH =
		'M10.87 22.9027c.1571 0 .2796-.1236.2796-.2824 0-.124-.0874-.2828-.2445-.2828h-.088l-.1926-.0352c-3.2382-.636-5.6358-3.5505-5.6358-6.96 0-1.4478.4376-2.8256 1.19-3.938.1229-.1593.315-.2828.5254-.0884l5.1113 5.2277c.0342.0352.122.0883.1921.0883.0875 0 .1576-.0353.1927-.0883l5.1458-5.1924c.1927-.1944.368-.1588.473.0352a7.1 7.1 0 0 1 1.19 3.9385c0 1.819-.6826 3.4622-1.8032 4.7164-.0347.0353-.087.0883-.1222.1236 0 .0353-.035.0883-.035.1235 0 .1593.1225.2828.28.2828h.0351c.035 0 .0875-.0352.1225-.0352 6.8262-2.897 6.5116-9.75 6.5116-9.75 0-3.9036-1.8384-7.4184-4.6737-9.6263-.1224-.0883-.3151-.0883-.403.0352l-6.7033 6.8534c-.1228.1235-.3154.1235-.4376 0L5.0234 1.1949c-.1225-.1235-.2797-.1235-.4022-.0352C1.8379 3.3676 0 6.8293 0 10.786c0 6.2875 4.7086 11.4806 10.7825 12.1167Z';

	const ICONS: Record<PlatformName, IconDef> = {
		anilist: { title: 'AniList', path: ANILIST_PATH },
		mal: { title: 'MyAnimeList', path: MAL_PATH }
	};

	const icon = $derived(platform ? ICONS[platform] : undefined);
</script>

{#if svg}
	<span class="[&>svg]:size-full {className}" style={color ? `color: ${color}` : undefined}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- platform icons are admin-authored and server-sanitized -->
		{@html svg}
	</span>
{:else if icon}
	<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class={className}>
		<title>{icon.title}</title>
		<path d={icon.path} />
	</svg>
{/if}
