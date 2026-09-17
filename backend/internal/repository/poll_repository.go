package repository

import (
	"context"
	"errors"
	"time"

	"github.com/internship/live-polling-tool/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type PollRepository interface {
	Create(ctx context.Context, poll *models.Poll) error
	FindByID(ctx context.Context, id string) (*models.Poll, error)
	FindByOwnerID(ctx context.Context, ownerID string) ([]models.Poll, error)
	Update(ctx context.Context, poll *models.Poll) error
}

type pollRepository struct {
	collection *mongo.Collection
}

func NewPollRepository(db *mongo.Database) PollRepository {
	return &pollRepository{
		collection: db.Collection("polls"),
	}
}

func (r *pollRepository) Create(ctx context.Context, poll *models.Poll) error {
	poll.ID = primitive.NewObjectID()
	poll.CreatedAt = time.Now()
	poll.UpdatedAt = time.Now()

	// ensure all options have IDs
	for i := range poll.Options {
		poll.Options[i].ID = primitive.NewObjectID()
	}

	_, err := r.collection.InsertOne(ctx, poll)
	return err
}

func (r *pollRepository) FindByID(ctx context.Context, id string) (*models.Poll, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid id")
	}

	var poll models.Poll
	err = r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("poll not found")
		}
		return nil, err
	}
	return &poll, nil
}

func (r *pollRepository) FindByOwnerID(ctx context.Context, ownerID string) ([]models.Poll, error) {
	objID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		return nil, errors.New("invalid owner id")
	}

	var polls []models.Poll = make([]models.Poll, 0)
	cursor, err := r.collection.Find(ctx, bson.M{"owner_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &polls); err != nil {
		return nil, err
	}

	return polls, nil
}

func (r *pollRepository) Update(ctx context.Context, poll *models.Poll) error {
	poll.UpdatedAt = time.Now()

	// Ensure new options get IDs
	for i := range poll.Options {
		if poll.Options[i].ID.IsZero() {
			poll.Options[i].ID = primitive.NewObjectID()
		}
	}

	filter := bson.M{"_id": poll.ID}
	update := bson.M{"$set": poll}

	res, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return errors.New("poll not found")
	}

	return nil
}
