package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/db"
	"github.com/go-chi/chi/v5"
)

// AuthHandlers handles authentication-related HTTP requests
type AuthHandlers struct {
	userService    *db.UserService
	sessionService *db.SessionService
}

// NewAuthHandlers creates a new AuthHandlers instance
func NewAuthHandlers(database *db.DB) *AuthHandlers {
	return &AuthHandlers{
		userService:    db.NewUserService(database),
		sessionService: db.NewSessionService(database),
	}
}

// RegisterRoutes registers authentication routes
func (h *AuthHandlers) RegisterRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.Get("/me", h.GetCurrentUser)
		r.Post("/login", h.Login)
		r.Post("/logout", h.Logout)
		r.Post("/register", h.Register)
	})
}

// GetCurrentUserResponse represents the response for getting current user
type GetCurrentUserResponse struct {
	User *db.User `json:"user"`
}

// GetCurrentUser handles GET /auth/me
func (h *AuthHandlers) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// In a real implementation, you'd extract the session token from cookies or headers
	// For this example, we'll assume it's in a header
	sessionToken := r.Header.Get("Authorization")
	if sessionToken == "" {
		http.Error(w, "Missing authorization header", http.StatusUnauthorized)
		return
	}

	// Remove "Bearer " prefix if present
	if len(sessionToken) > 7 && sessionToken[:7] == "Bearer " {
		sessionToken = sessionToken[7:]
	}

	user, session, err := h.sessionService.ValidateSession(r.Context(), sessionToken)
	if err != nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	// Update session last accessed time (optional)
	_ = session // You could update the session's updatedAt field here

	response := GetCurrentUserResponse{
		User: user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// LoginRequest represents the request body for login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"` // In a real app, you'd validate this properly
}

// LoginResponse represents the response for login
type LoginResponse struct {
	User    *db.User    `json:"user"`
	Session *db.Session `json:"session"`
	Token   string      `json:"token"`
}

// Login handles POST /auth/login
func (h *AuthHandlers) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get user by email
	user, err := h.userService.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// In a real implementation, you'd validate the password hash here
	// For this example, we'll skip password validation

	// Create a new session
	ipAddress := getClientIP(r)
	userAgent := r.UserAgent()
	
	session, err := h.sessionService.CreateSession(r.Context(), user.ID, &ipAddress, &userAgent)
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	response := LoginResponse{
		User:    user,
		Session: session,
		Token:   session.Token,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// RegisterRequest represents the request body for registration
type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RegisterResponse represents the response for registration
type RegisterResponse struct {
	User    *db.User    `json:"user"`
	Session *db.Session `json:"session"`
	Token   string      `json:"token"`
}

// Register handles POST /auth/register
func (h *AuthHandlers) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if user already exists
	existingUser, err := h.userService.GetUserByEmail(r.Context(), req.Email)
	if err == nil && existingUser != nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	// Generate a user ID (in production, use a proper UUID)
	userID := fmt.Sprintf("user_%d", time.Now().UnixNano())

	// Create user and session
	user, session, err := h.userService.CreateUserWithSession(r.Context(), userID, req.Name, req.Email, false, nil)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	response := RegisterResponse{
		User:    user,
		Session: session,
		Token:   session.Token,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// LogoutRequest represents the request body for logout
type LogoutRequest struct {
	SessionID string `json:"sessionId"`
}

// Logout handles POST /auth/logout
func (h *AuthHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	var req LogoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Delete the session
	err := h.sessionService.db.DeleteSession(r.Context(), req.SessionID)
	if err != nil {
		http.Error(w, "Failed to logout", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logged out successfully"))
}

// getClientIP extracts the client IP from the request
func getClientIP(r *http.Request) string {
	// Check for forwarded headers first
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	
	// Fall back to RemoteAddr
	ip, _, err := r.RemoteAddr, "", nil
	if err != nil {
		return "unknown"
	}
	return ip
}