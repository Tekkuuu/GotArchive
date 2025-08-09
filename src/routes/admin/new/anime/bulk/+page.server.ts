import { db } from '$lib/server/db';
import * as z from 'zod/v4';
import { fail } from '@sveltejs/kit';
import { superValidate, fail as failWithFiles } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { formSchema, validate } from './util';
import { services } from '$lib/server/db';
import type * as dbt from '$lib/server/db';
import { ServiceError, FormError, ERROR_CODES, AppError } from '$lib/errors';
import logger from '$lib/logger';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';
import _ from 'lodash';
import { anilistServices, extractId } from '$lib/anilist';

export const load: PageServerLoad = async ({ request }) => {
  const form = await superValidate(zod4(formSchema));

  return { form };
}

export const actions = {
  create: async ({ request, locals, url }) => {
    const form = await superValidate(request, zod4(formSchema));

    if (!form.valid) {
      return failWithFiles(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
    }

    const text = await form.data.file.text();
    let data: z.infer<typeof validate> = [];

    try {
      data = JSON.parse(text);

      const validated = validate.safeParse(data);
      if (!validated.success) {
        logger.error("Validation error of data file", { zodErrors: validated.error });
        throw new FormError(ERROR_CODES.forms.VALIDATION_FAILED, { form: 'new-anime-bulk' });
      }

      const ids = data.map(d => ({
        mainId: d.anilistId,
        seasonIds: d.seasons.map(s => s.anilistId)
      }));
      const anilistData = await anilistServices.fetchAnimeSeasonBulk(ids);

      if (data.length !== anilistData.length) {
        logger.error("Data length mismatch between file data and anilist fetched data", { expected: data.length, actual: anilistData.length });
        throw new FormError(ERROR_CODES.forms.LOGIC_MISMATCH, { form: 'new-anime-bulk' });
      }

      await db.transaction(async (tx) => {
        let dbGenres = await services.genre.select(tx);

        for (var ani of anilistData) {
          const animeData = data.find(d => d.anilistId === ani.anime.id);

          if (!animeData) {
            logger.error("Cannot find animeData for given anilistId", { anilistId: ani.anime.id });
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-anime-bulk' });
          }

          const newGenres = _.difference(ani.anime.genres, dbGenres.map(g => g.name)).map(g => ({ name: g }));
          if (newGenres.length !== 0) {
            const insertedGenres = await services.genre.insert(tx, newGenres);
            dbGenres = dbGenres.concat(insertedGenres); // Correctly update dbGenres
          }

          const insertedAnime = (await services.anime.insert(tx, {
            titleNative: ani.anime.title.native,
            titleRomaji: ani.anime.title.romaji,
            titleEnglish: ani.anime.title.english,
          })).at(0);

          if (!insertedAnime) {
            logger.error("Failed to insert anime, returned 0 rows", { anilistId: ani.anime.id });
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-anime-bulk' });
          }

          const animeLinks: dbt.AnimeLinkInsert[] | undefined = animeData.playlists?.map((p) => ({
            animeId: insertedAnime.animeId,
            url: p.url,
            platformId: p.platformId,
            note: p.note || null
          }));

          if (animeLinks && animeLinks.length > 0) {
            await services.animeLink.insert(tx, animeLinks);
          }

          let animeGenre = dbGenres.filter(g => ani.anime.genres.includes(g.name)).map(g => ({
            genreId: g.genreId,
            animeId: insertedAnime.animeId
          }));

          await services.animeGenre.insert(tx, animeGenre);

          const seasonsData = ani.seasons.map((s, idx) => ({
            animeId: insertedAnime.animeId,
            sequence: idx + 1,
            titleNative: s.title.native,
            titleRomaji: s.title.romaji,
            titleEnglish: s.title.english,
            episodes: s.episodes,
            season: s.season,
            year: s.seasonYear,
            anilistLink: s.siteUrl,
            format: s.format
          }));

          const insertedSeasons = await services.animeSeason.insert(tx, seasonsData);

          if (insertedSeasons.length !== ani.seasons.length) {
            logger.error("Failed to insert all seasons for anime", { anilistId: ani.anime.id, expected: ani.seasons.length, actual: insertedSeasons.length });
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-anime-bulk' });
          }

          for (var [sidx, season] of animeData.seasons.entries()) {
            const insertedSeasonData = insertedSeasons.find(s => extractId(s.anilistLink) === season.anilistId);

            if (!insertedSeasonData) {
              logger.error("Cannot find inserted season data for given anilistId", { anilistId: season.anilistId, animeId: insertedAnime.animeId });
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-anime-bulk' });
            }

            const epCount = insertedSeasonData.episodes;
            if (!epCount) {
              continue;
            }

            const episodes = Array.from({ length: epCount }).map((_, idx) => ({
              animeId: insertedAnime.animeId,
              sequence: sidx + 1,
              episodeNumber: idx + 1,
              watched: season.watched,
            }));

            const insertedEpisodes = await services.animeEpisode.insert(tx, episodes);

            if (insertedEpisodes.length !== epCount) {
              logger.error("Failed to insert all episodes for season", { insertedEpisodes: insertedEpisodes.length, expected: epCount, seasonId: season.anilistId });
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-anime-bulk' });
            }

            const episodeLinks: dbt.EpisodeLinkInsert[] | undefined = season.episodeLinks?.map((ep) => {
              const dbEp = insertedEpisodes.find(e => e.episodeNumber === ep.episodeNumber);
              if (!dbEp) {
                logger.error("Cannot find episode for given episode number", { episodeNumber: ep.episodeNumber, seasonId: season.anilistId });
                throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-anime-bulk' });
              }

              return {
                animeEpisodeId: dbEp.animeEpisodeId,
                url: ep.url,
                platformId: ep.platformId,
                note: ep.note || null
              };
            });

            if (episodeLinks && episodeLinks.length > 0) {
              const insertedLinks = await services.episodeLink.insert(tx, episodeLinks);
              if (insertedLinks.length !== episodeLinks.length) {
                logger.error("Failed to insert all episode links for season", { seasonId: season.anilistId, expected: episodeLinks.length, actual: insertedLinks.length });
                throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-anime-bulk' });
              }
            }
          }
        }
      });
    } catch (err) {
      if (!(err instanceof FormError)) {
        let context: SentryLoggerOptions = {
          tags: {
            url: url.pathname,
            form: 'new-anime-bulk',
          }
        }
        const userId = locals.session?.user.id;
        if (userId) _.set(context, 'user.id', userId);
        sentry.logServer(err, context);
      }

      if (err instanceof AppError) {
        logger.warn(err.message, err.stack);
        return failWithFiles(err.httpStatus, { form, text: err.message })
      } else if (err instanceof Error) {
        logger.error(err.message, err.stack);
        return failWithFiles(500, { form, text: err.message })
      } else {
        logger.error("Unexpected error occurred", { cause: err });
        return failWithFiles(500, { form, text: 'Unexpected error occurred' });
      }
    }
  }
}
