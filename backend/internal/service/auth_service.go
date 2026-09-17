package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/internship/live-polling-tool/backend/internal/models"
	"github.com/internship/live-polling-tool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Signup(ctx context.Context, name, email, password string) (*models.User, error)
	Login(ctx context.Context, email, password string) (string, error)
	GetUserByID(ctx context.Context, id string) (*models.User, error)
}

type authService struct {
	userRepo  repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) AuthService {
	return &authService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

func (s *authService) Signup(ctx context.Context, name, email, password string) (*models.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if name == "" || email == "" || len(password) < 6 {
		return nil, errors.New("invalid input data")
	}

	// Check if user exists
	_, err := s.userRepo.FindByEmail(ctx, email)
	if err == nil {
		return nil, errors.New("email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Name:         name,
		Email:        email,
		PasswordHash: string(hashedPassword),
	}

	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, errors.New("failed to create user")
	}

	return user, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
		"iat":     time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", errors.New("failed to generate token")
	}

	return tokenString, nil
}

func (s *authService) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	return s.userRepo.FindByID(ctx, id)
}
