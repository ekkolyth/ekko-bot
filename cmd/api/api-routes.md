https://chatgpt.com/c/68f7f311-23a4-8321-94ff-090caaf7598a

/api/v1
├─ healthz                          GET    // liveness
├─ me                                GET    // current user (Better Auth)
├─ guilds                            GET    // list guilds the bot can manage
├─ guilds/{guild_id}                 GET    // summary: status, voice, features
│
├─ guilds/{guild_id}/queue
│  ├─                                 GET    // current playback + upcoming tracks
│  ├─                                 POST   // enqueue track(s) {url|query, requester}
│  ├─ /clear                           POST   // clear queue
│  ├─ /shuffle                         POST   // shuffle queue
│  ├─ /move                            POST   // reorder {from_index, to_index}
│  └─ /remove/{item_id}               DELETE  // remove item
│
├─ guilds/{guild_id}/player
│  ├─                                 GET    // player state: playing, position, volume
│  ├─ /play                            POST   // resume or play now {track_id?}
│  ├─ /pause                           POST   // pause
│  ├─ /skip                            POST   // skip current
│  ├─ /seek                            POST   // {position_ms}
│  ├─ /volume                          POST   // {level: 0-100}
│  └─ /connect                         POST   // {voice_channel_id} (join/move VC)
│
├─ guilds/{guild_id}/commands
│  ├─                                 GET    // list registered app commands (cached)
│  ├─                                 POST   // create new command (design-time)
│  ├─ /{command_id}                    GET    // fetch one
│  ├─ /{command_id}                   PATCH   // update definition
│  └─ /{command_id}                  DELETE  // delete definition
│
├─ guilds/{guild_id}/commands:execute POST   // run a command now (runtime)
│                                         // {name|id, options, channel_id}
│
├─ guilds/{guild_id}/embeds
│  ├─                                 GET    // list saved embed templates
│  ├─                                 POST   // create new embed template
│  ├─ /{embed_id}                      GET    // get one
│  ├─ /{embed_id}                     PATCH   // update template
│  └─ /{embed_id}                    DELETE  // delete template
│
├─ guilds/{guild_id}/messages
│  ├─ /preview                         POST   // render embed/template -> HTML/PNG preview
│  └─                                   POST   // send message now
│                                         // {channel_id, content?, embed_id?, embeds?, components?}
│
├─ guilds/{guild_id}/config
│  ├─                                 GET    // bot config for this guild
│  └─                                 PATCH  // partial update (prefix, default VC, perms)
│
├─ events/sse                         GET    // server-sent events stream (auth’d)
└─ ws                                 GET    // optional WebSocket for live updates
