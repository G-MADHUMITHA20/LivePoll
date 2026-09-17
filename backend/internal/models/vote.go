package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Vote struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID    primitive.ObjectID `bson:"poll_id" json:"poll_id"`
	OptionID  primitive.ObjectID `bson:"option_id" json:"option_id"`
	VoterID   string             `bson:"voter_id" json:"voter_id"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}
