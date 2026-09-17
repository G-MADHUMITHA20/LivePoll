package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/internship/live-polling-tool/backend/internal/models"
	"github.com/internship/live-polling-tool/backend/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollService interface {
	CreatePoll(ctx context.Context, ownerID string, question string, optionTexts []string, expiresAt *time.Time) (*models.Poll, error)
	GetPollByID(ctx context.Context, pollID string, requesterID string) (*models.Poll, error)
	GetPollsByOwner(ctx context.Context, ownerID string) ([]models.Poll, error)
	UpdatePoll(ctx context.Context, pollID string, ownerID string, question string, optionTexts []string, expiresAt *time.Time) (*models.Poll, error)
}

type pollService struct {
	pollRepo repository.PollRepository
}

func NewPollService(pollRepo repository.PollRepository) PollService {
	return &pollService{
		pollRepo: pollRepo,
	}
}

func validatePollData(question string, optionTexts []string) ([]models.PollOption, error) {
	question = strings.TrimSpace(question)
	if question == "" {
		return nil, errors.New("question cannot be empty")
	}
	if len(question) > 300 {
		return nil, errors.New("question is too long")
	}

	if len(optionTexts) < 2 {
		return nil, errors.New("a poll must have at least 2 options")
	}
	if len(optionTexts) > 20 {
		return nil, errors.New("a poll cannot have more than 20 options")
	}

	seenOptions := make(map[string]bool)
	var options []models.PollOption

	for _, text := range optionTexts {
		text = strings.TrimSpace(text)
		if text == "" {
			return nil, errors.New("poll options cannot be empty")
		}
		if len(text) > 100 {
			return nil, errors.New("poll option is too long")
		}

		lowerText := strings.ToLower(text)
		if seenOptions[lowerText] {
			return nil, errors.New("duplicate poll options are not allowed")
		}
		seenOptions[lowerText] = true

		options = append(options, models.PollOption{
			Text: text,
		})
	}

	return options, nil
}

func (s *pollService) CreatePoll(ctx context.Context, ownerID string, question string, optionTexts []string, expiresAt *time.Time) (*models.Poll, error) {
	ownerObjID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		return nil, errors.New("invalid owner ID")
	}

	options, err := validatePollData(question, optionTexts)
	if err != nil {
		return nil, err
	}

	poll := &models.Poll{
		OwnerID:   ownerObjID,
		Question:  strings.TrimSpace(question),
		Options:   options,
		Status:    "active",
		ExpiresAt: expiresAt,
	}

	err = s.pollRepo.Create(ctx, poll)
	if err != nil {
		return nil, errors.New("failed to create poll")
	}

	return poll, nil
}

func (s *pollService) GetPollByID(ctx context.Context, pollID string, requesterID string) (*models.Poll, error) {
	poll, err := s.pollRepo.FindByID(ctx, pollID)
	if err != nil {
		return nil, err
	}

	if requesterID != "" && poll.OwnerID.Hex() != requesterID {
		return nil, errors.New("unauthorized to manage this poll")
	}

	return poll, nil
}

func (s *pollService) GetPollsByOwner(ctx context.Context, ownerID string) ([]models.Poll, error) {
	return s.pollRepo.FindByOwnerID(ctx, ownerID)
}

func (s *pollService) UpdatePoll(ctx context.Context, pollID string, ownerID string, question string, optionTexts []string, expiresAt *time.Time) (*models.Poll, error) {
	poll, err := s.GetPollByID(ctx, pollID, ownerID)
	if err != nil {
		return nil, err
	}

	options, err := validatePollData(question, optionTexts)
	if err != nil {
		return nil, err
	}

	// Simple update logic: replace question, options, and expiresAt
	poll.Question = strings.TrimSpace(question)
	
	// Preserve existing option IDs if texts match, else they get new IDs
	// For simplicity in Stage 3, we just reassign texts. Realistically, we'd want to track IDs for voting.
	var newOptions []models.PollOption
	for _, newOpt := range options {
		var existingID primitive.ObjectID
		for _, oldOpt := range poll.Options {
			if oldOpt.Text == newOpt.Text {
				existingID = oldOpt.ID
				break
			}
		}
		newOpt.ID = existingID
		newOptions = append(newOptions, newOpt)
	}

	poll.Options = newOptions
	poll.ExpiresAt = expiresAt

	err = s.pollRepo.Update(ctx, poll)
	if err != nil {
		return nil, errors.New("failed to update poll")
	}

	return poll, nil
}
