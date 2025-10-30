package context

// QueueKey creates a unique key for guild+voice channel combination
func QueueKey(guildID, voiceChannelID string) string {
	return guildID + ":" + voiceChannelID
}

