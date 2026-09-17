package repository

import (
	"context"
	"time"

	"github.com/internship/live-polling-tool/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type VoteRepository interface {
	Create(ctx context.Context, vote *models.Vote) error
	GetVotesForPoll(ctx context.Context, pollID string) ([]models.Vote, error)
}

type voteRepository struct {
	collection *mongo.Collection
}

func NewVoteRepository(db *mongo.Database) VoteRepository {
	collection := db.Collection("votes")

	// Ensure unique index on {poll_id, voter_id} to prevent duplicate votes
	indexModel := mongo.IndexModel{
		Keys: bson.D{
			{Key: "poll_id", Value: 1},
			{Key: "voter_id", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = collection.Indexes().CreateOne(ctx, indexModel)

	return &voteRepository{
		collection: collection,
	}
}

func (r *voteRepository) Create(ctx context.Context, vote *models.Vote) error {
	vote.ID = primitive.NewObjectID()
	vote.CreatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, vote)
	return err // will return duplicate key error if {poll_id, voter_id} already exists
}

func (r *voteRepository) GetVotesForPoll(ctx context.Context, pollID string) ([]models.Vote, error) {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return nil, err
	}

	var votes []models.Vote = make([]models.Vote, 0)
	cursor, err := r.collection.Find(ctx, bson.M{"poll_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &votes); err != nil {
		return nil, err
	}

	return votes, nil
}
