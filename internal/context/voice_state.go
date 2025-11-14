package context

// SetUserVoiceChannel records the voice channel a user is currently in.
func SetUserVoiceChannel(guildID, userID, channelID string) {
	UserVoiceMutex.Lock()
	defer UserVoiceMutex.Unlock()

	if guildID == "" || userID == "" {
		return
	}

	if channelID == "" {
		if users, ok := UserVoiceChannels[guildID]; ok {
			delete(users, userID)
			if len(users) == 0 {
				delete(UserVoiceChannels, guildID)
			}
		}
		return
	}

	if UserVoiceChannels[guildID] == nil {
		UserVoiceChannels[guildID] = make(map[string]string)
	}
	UserVoiceChannels[guildID][userID] = channelID
}

// GetUserVoiceChannel returns the channel ID if known.
func GetUserVoiceChannel(guildID, userID string) (string, bool) {
	UserVoiceMutex.RLock()
	defer UserVoiceMutex.RUnlock()

	if users, ok := UserVoiceChannels[guildID]; ok {
		channelID, exists := users[userID]
		return channelID, exists
	}

	return "", false
}
