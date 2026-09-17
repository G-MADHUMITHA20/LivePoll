package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollOption struct {
	ID   primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Text string             `bson:"text" json:"text"`
}

type Poll struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OwnerID   primitive.ObjectID `bson:"owner_id" json:"owner_id"`
	Question  string             `bson:"question" json:"question"`
	Options   []PollOption       `bson:"options" json:"options"`
	Status    string             `bson:"status" json:"status"` // e.g., "active", "closed"
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
	ExpiresAt *time.Time         `bson:"expires_at,omitempty" json:"expires_at,omitempty"`
}
