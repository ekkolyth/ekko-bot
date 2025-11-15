-- name: InsertRecentlyPlayed :exec
insert into recently_played (
    guild_id,
    voice_channel_id,
    url,
    title,
    artist,
    duration_seconds,
    thumbnail,
    added_by,
    added_by_id
)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: TrimRecentlyPlayed :exec
delete from recently_played
where id in (
    select rp.id
    from recently_played as rp
    where rp.guild_id = $1
      and rp.voice_channel_id = $2
    order by added_at desc
    offset $3
);

-- name: ListRecentlyPlayed :many
select
    id,
    guild_id,
    voice_channel_id,
    url,
    title,
    artist,
    duration_seconds,
    thumbnail,
    added_by,
    added_by_id,
    added_at
from recently_played
where guild_id = $1
  and voice_channel_id = $2
order by added_at desc
limit $3;

