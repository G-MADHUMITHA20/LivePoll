package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/internship/live-polling-tool/backend/internal/models"
	"github.com/internship/live-polling-tool/backend/internal/repository"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type VoteService interface {
	GetPublicPoll(ctx context.Context, pollID string) (*models.Poll, error)
	SubmitVote(ctx context.Context, pollID string, optionID string, voterID string) error
	GetPollResults(ctx context.Context, pollID string) (map[string]int, error)
	Subscribe(ctx context.Context, pollID string) *redis.PubSub
}

type voteService struct {
	voteRepo    repository.VoteRepository
	pollRepo    repository.PollRepository
	redisClient *redis.Client
}

func NewVoteService(voteRepo repository.VoteRepository, pollRepo repository.PollRepository, redisClient *redis.Client) VoteService {
	return &voteService{
		voteRepo:    voteRepo,
		pollRepo:    pollRepo,
		redisClient: redisClient,
	}
}

func (s *voteService) GetPublicPoll(ctx context.Context, pollID string) (*models.Poll, error) {
	// The public only needs the poll if it is active.
	poll, err := s.pollRepo.FindByID(ctx, pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}
	return poll, nil
}

func (s *voteService) SubmitVote(ctx context.Context, pollID string, optionID string, voterID string) error {
	if voterID == "" {
		return errors.New("voter identification is required")
	}

	pollObjID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll id")
	}

	optionObjID, err := primitive.ObjectIDFromHex(optionID)
	if err != nil {
		return errors.New("invalid option id")
	}

	poll, err := s.pollRepo.FindByID(ctx, pollID)
	if err != nil {
		return errors.New("poll not found")
	}

	if poll.Status == "closed" {
		return errors.New("poll is manually closed")
	}

	if poll.StartTime != nil && time.Now().Before(*poll.StartTime) {
		return errors.New("poll is scheduled")
	}

	if poll.EndTime != nil && time.Now().After(*poll.EndTime) {
		return errors.New("poll is expired")
	}

	// Validate Option exists in this poll
	validOption := false
	for _, opt := range poll.Options {
		if opt.ID == optionObjID {
			validOption = true
			break
		}
	}

	if !validOption {
		return errors.New("invalid option for this poll")
	}

	vote := &models.Vote{
		PollID:   pollObjID,
		OptionID: optionObjID,
		VoterID:  voterID,
	}

	err = s.voteRepo.Create(ctx, vote)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return errors.New("you have already voted in this poll")
		}
		return errors.New("failed to submit vote")
	}

	// Fetch updated authoritative results
	results, err := s.GetPollResults(ctx, pollID)
	if err == nil {
		// Calculate total votes and construct payload
		totalVotes := 0
		for _, count := range results {
			totalVotes += count
		}

		payload := map[string]interface{}{
			"type":        "vote_update",
			"poll_id":     pollID,
			"total_votes": totalVotes,
			"results":     results,
		}

		payloadBytes, _ := json.Marshal(payload)
		s.redisClient.Publish(context.Background(), "poll:"+pollID+":events", payloadBytes)
	}

	return nil
}

func (s *voteService) Subscribe(ctx context.Context, pollID string) *redis.PubSub {
	return s.redisClient.Subscribe(ctx, "poll:"+pollID+":events")
}

func (s *voteService) GetPollResults(ctx context.Context, pollID string) (map[string]int, error) {
	votes, err := s.voteRepo.GetVotesForPoll(ctx, pollID)
	if err != nil {
		return nil, errors.New("failed to retrieve results")
	}

	results := make(map[string]int)
	for _, v := range votes {
		results[v.OptionID.Hex()]++
	}
	return results, nil
}
