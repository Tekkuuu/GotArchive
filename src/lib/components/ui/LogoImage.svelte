<script lang="ts">
	interface Props {
		/** URL of the logo image */
		src: string
		/** Alt text forwarded to <img> */
		alt?: string
		/** Extra classes applied to the outer <div> wrapper */
		class?: string
		/** Extra classes applied to the <img> element */
		imgClass?: string
	}

	let { src, alt = '', class: wrapperClass = '', imgClass = '' }: Props = $props()
</script>

<!--
  Wrapper div controls layout/sizing via the `class` prop.
  The img receives a double drop-shadow (white + dark) so it remains
  readable on any background without needing CORS pixel sampling.
-->
<div class={wrapperClass}>
	<img
		{src}
		{alt}
		class={imgClass}
		style="filter: drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 3px rgba(0,0,0,0.7))"
	/>
</div>
