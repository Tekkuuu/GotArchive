import { schema } from '.';
import { createService } from './shared/serviceFactory';
import { withErrorOrigin } from './shared/util';
import { idConfig } from './idConfig';
import * as z from 'zod/v4';
import { selectAnimeEpisodeDetails } from './customMethods/animeEpisode.custom';

export const services = {
  anime: withErrorOrigin(
    createService(
      schema.anime,
      "anime",
      idConfig(
        z.object({ animeId: z.number().int().positive() }),
        { animeId: schema.anime.animeId }
      )
    ),
    'animeService'
  ),
  animeEpisode: withErrorOrigin(
    createService(
      schema.animeEpisode,
      'anime_episode',
      idConfig(
        z.object({ animeEpisodeId: z.number().int().positive() }),
        { animeEpisodeId: schema.animeEpisode.animeEpisodeId }
      ),
      {
        selectDetails: selectAnimeEpisodeDetails
      }
    ),
    'animeEpisodeService'
  ),
  animeGenre: withErrorOrigin(
    createService(
      schema.animeGenre,
      'anime_genre',
      idConfig(
        z.object({
          animeId: z.number().int().positive(),
          genreId: z.number().int().positive(),
        }),
        {
          animeId: schema.animeGenre.animeId,
          genreId: schema.animeGenre.genreId,
        }
      )
    ),
    'animeGenreService'
  ),
  animeLink: withErrorOrigin(
    createService(
      schema.animeLink,
      "anime_link",
      idConfig(
        z.object({
          animeId: z.number().int().positive(),
          url: z.url(),
        }),
        {
          animeId: schema.animeLink.animeId,
          url: schema.animeLink.url,
        }
      )
    ),
    'animeLinkService'
  ),
  animeSeason: withErrorOrigin(
    createService(
      schema.animeSeason,
      'anime_season',
      idConfig(
        z.object({
          animeId: z.number().int().positive(),
          sequence: z.number().int().positive(),
        }),
        {
          animeId: schema.animeSeason.animeId,
          sequence: schema.animeSeason.sequence,
        }
      )
    ),
    'animeSeasonService'
  ),
  animeSeasonStatus: withErrorOrigin(
    createService(
      schema.animeSeasonStatus,
      'anime_season_status',
      idConfig(
        z.object({
          animeId: z.number().int().positive(),
          sequence: z.number().int().positive(),
        }),
        {
          animeId: schema.animeSeason.animeId,
          sequence: schema.animeSeason.sequence,
        }
      )
    ),
    'animeSeasonStatusService'
  ),
  episodeLink: withErrorOrigin(
    createService(
      schema.episodeLink,
      'episode_link',
      idConfig(
        z.object({
          animeEpisodeId: z.number().int().positive(),
          url: z.url(),
        }),
        {
          animeEpisodeId: schema.episodeLink.animeEpisodeId,
          url: schema.episodeLink.url,
        }
      )
    ),
    'episodeLinkService'
  ),
  genre: withErrorOrigin(
    createService(
      schema.genre,
      'genre',
      idConfig(
        z.object({ genreId: z.number().int().positive() }),
        { genreId: schema.genre.genreId }
      )
    ),
    'genreService'
  ),
  platform: withErrorOrigin(
    createService(
      schema.platform,
      'platform',
      idConfig(
        z.object({ platformId: z.number().int().positive() }),
        { platformId: schema.platform.platformId }
      )
    ),
    'platformService'
  ),
  schedule: withErrorOrigin(
    createService(
      schema.schedule,
      'schedule',
      idConfig(
        z.object({ scheduleId: z.number().int().positive() }),
        { scheduleId: schema.schedule.scheduleId }
      )
    ),
    'scheduleService'
  ),
  scheduleAnimeDetail: withErrorOrigin(
    createService(
      schema.scheduleAnimeDetail,
      'schedule_anime_detail',
      idConfig(
        z.object({ scheduleAnimeDetailId: z.number().int().positive() }),
        { scheduleAnimeDetailId: schema.scheduleAnimeDetail.scheduleAnimeDetailId }
      )
    ),
    'scheduleAnimeDetailService'
  ),
  scheduleAnimeEpisode: withErrorOrigin(
    createService(
      schema.scheduleAnimeEpisode,
      'schedule_anime_episode',
      idConfig(
        z.object({
          scheduleAnimeDetailId: z.number().int().positive(),
          animeEpisodeId: z.number().int().positive(),
        }),
        {
          scheduleAnimeDetailId: schema.scheduleAnimeEpisode.scheduleAnimeDetailId,
          animeEpisodeId: schema.scheduleAnimeEpisode.animeEpisodeId,
        }
      )
    ),
    'scheduleAnimeEpisodeService'
  ),
  scheduleEntry: withErrorOrigin(
    createService(
      schema.scheduleEntry,
      'schedule_entry',
      idConfig(
        z.object({ scheduleEntryId: z.number().int().positive() }),
        { scheduleEntryId: schema.scheduleEntry.scheduleEntryId }
      )
    ),
    'scheduleEntryService'
  ),
  scheduleEntryPlatform: withErrorOrigin(
    createService(
      schema.scheduleEntryPlatform,
      'schedule_entry_platform',
      idConfig(
        z.object({ scheduleEntryId: z.number().int().positive(), platformId: z.number().int().positive() }),
        { scheduleEntryId: schema.scheduleEntryPlatform.scheduleEntryId, platformId: schema.scheduleEntryPlatform.platformId }
      )
    ),
    'scheduleEntryPlatformService'
  ),
  changelog: withErrorOrigin(
    createService(
      schema.changelog,
      'changelog',
      idConfig(
        z.object({ changelogId: z.number().int().positive() }),
        { changelogId: schema.changelog.changelogId }
      )
    ),
    'changelogService'
  ),
  feedback: withErrorOrigin(
    createService(
      schema.feedback,
      'feedback',
      idConfig(
        z.object({ feedbackId: z.number().int().positive() }),
        { feedbackId: schema.feedback.feedbackId }
      )
    ),
    'feedbackService'
  ),
  dailyUsers: withErrorOrigin(
    createService(
      schema.dailyUsers,
      'daily_users',
      idConfig(
        z.object({ date: z.iso.date() }),
        { date: schema.dailyUsers.date }
      )
    ),
    'dailyUsersService'
  )
};
