package models

import (
	"gorm.io/gorm"
)

type UserRole string

const (
	UserRoleAdmin   UserRole = "admin"
	UserRoleMod     UserRole = "mod"
	UserRoleDefault UserRole = "user"
)

type User struct {
	gorm.Model
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"` // Ensures email is unique and not null
	Role      UserRole       `gorm:"not null" json:"role"`              // Ensures role is not null
}

type AllowedUser struct {
	gorm.Model
	Email string   `gorm:"uniqueIndex;not null" json:"email"` // Ensures email is unique and not null
	Role  UserRole `gorm:"not null" json:"role"`              // Ensures role is not null
}
