package discord

import (
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

// OnError gets called by dgvoice when an error is encountered.
var OnError = func(str string, err error) {

	if err != nil {
		logging.Dgvoice(str + ": " + err.Error())
	} else {
		logging.Dgvoice(str)
	}
}
