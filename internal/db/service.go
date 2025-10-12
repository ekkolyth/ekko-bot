package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// AuthService provides methods for authentication-related database operations
type AuthService struct {
	db *DB
}

// NewAuthService creates a new AuthService
func NewAuthService(db *DB) *AuthService {
	return &AuthService{db: db}
}

// UserService provides methods for user-related database operations
type UserService struct {
	db *DB
}

// NewUserService creates a new UserService
func NewUserService(db *DB) *UserService {
	return &UserService{db: db}
}

// CreateUserWithSession creates a user and their first session
func (s *UserService) CreateUserWithSession(ctx context.Context, userID, name, email string, emailVerified bool, image *string) (*User, *Session, error) {
	var user *User
	var session *Session

	err := s.db.WithTx(ctx, func(q *Queries) error {
		// Create user
		createdUser, err := q.CreateUser(ctx, &CreateUserParams{
			ID:            userID,
			Name:          name,
			Email:         email,
			EmailVerified: emailVerified,
			Image:         image,
		})
		if err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}
		user = createdUser

		// Create session
		sessionID := generateID()
		sessionToken := generateID()
		expiresAt := time.Now().Add(24 * time.Hour) // 24 hour session

		createdSession, err := q.CreateSession(ctx, &CreateSessionParams{
			ID:        sessionID,
			ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
			Token:     sessionToken,
			UserId:    userID,
		})
		if err != nil {
			return fmt.Errorf("failed to create session: %w", err)
		}
		session = createdSession

		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return user, session, nil
}

// GetUserByEmail retrieves a user by their email address
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	return s.db.GetUserByEmail(ctx, email)
}

// GetUserByID retrieves a user by their ID
func (s *UserService) GetUserByID(ctx context.Context, userID string) (*User, error) {
	return s.db.GetUserByID(ctx, userID)
}

// UpdateUserProfile updates a user's profile information
func (s *UserService) UpdateUserProfile(ctx context.Context, userID, name, email string, emailVerified bool, image *string) (*User, error) {
	return s.db.UpdateUser(ctx, &UpdateUserParams{
		ID:            userID,
		Name:          name,
		Email:         email,
		EmailVerified: emailVerified,
		Image:         image,
	})
}

// SessionService provides methods for session-related database operations
type SessionService struct {
	db *DB
}

// NewSessionService creates a new SessionService
func NewSessionService(db *DB) *SessionService {
	return &SessionService{db: db}
}

// ValidateSession validates a session token and returns the associated user
func (s *SessionService) ValidateSession(ctx context.Context, token string) (*User, *Session, error) {
	session, err := s.db.GetSessionByToken(ctx, token)
	if err != nil {
		return nil, nil, fmt.Errorf("session not found: %w", err)
	}

	// Check if session is expired
	if session.ExpiresAt.Valid && session.ExpiresAt.Time.Before(time.Now()) {
		// Clean up expired session
		s.db.DeleteSession(ctx, session.ID)
		return nil, nil, fmt.Errorf("session expired")
	}

	// Get the user associated with this session
	user, err := s.db.GetUserByID(ctx, session.UserId)
	if err != nil {
		return nil, nil, fmt.Errorf("user not found: %w", err)
	}

	return user, session, nil
}

// CreateSession creates a new session for a user
func (s *SessionService) CreateSession(ctx context.Context, userID string, ipAddress, userAgent *string) (*Session, error) {
	sessionID := generateID()
	sessionToken := generateID()
	expiresAt := time.Now().Add(24 * time.Hour) // 24 hour session

	return s.db.CreateSession(ctx, &CreateSessionParams{
		ID:        sessionID,
		ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
		Token:     sessionToken,
		IpAddress: ipAddress,
		UserAgent: userAgent,
		UserId:    userID,
	})
}

// CleanupExpiredSessions removes all expired sessions
func (s *SessionService) CleanupExpiredSessions(ctx context.Context) error {
	return s.db.DeleteExpiredSessions(ctx)
}

// generateID generates a simple ID (in production, use a proper UUID generator)
func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
