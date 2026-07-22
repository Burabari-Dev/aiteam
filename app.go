package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetProjects() []ProjectRegistryEntry {
	entries, err := GetProjects()
	if err != nil {
		return []ProjectRegistryEntry{}
	}
	return entries
}

func (a *App) AddProject(path string) ProjectRegistryEntry {
	entry, err := AddProject(path)
	if err != nil || entry == nil {
		return ProjectRegistryEntry{}
	}
	return *entry
}

func (a *App) RemoveProject(path string) bool {
	err := RemoveProject(path)
	return err == nil
}

func (a *App) CreateProject(projectPath, name, description string) ProjectMeta {
	meta, err := CreateProject(projectPath, name, description)
	if err != nil {
		return ProjectMeta{}
	}
	AddProject(projectPath)
	return *meta
}

func (a *App) GetProjectMeta(projectPath string) ProjectMeta {
	meta := loadProjectMeta(projectPath)
	if meta == nil {
		return ProjectMeta{}
	}
	return *meta
}

func (a *App) GetRoleTemplates() []RoleTemplate {
	return predefinedRoles
}

func (a *App) InitProjectTeam(projectPath string, roles []string) bool {
	err := InitTeamRoles(projectPath, roles)
	return err == nil
}

func (a *App) GetTeamRoles(projectPath string) []string {
	roles, err := GetTeamRoles(projectPath)
	if err != nil {
		return []string{}
	}
	return roles
}

func (a *App) ListMeetings(projectPath string) []MeetingSummary {
	summaries, err := ListMeetings(projectPath)
	if err != nil {
		return []MeetingSummary{}
	}
	return summaries
}

func (a *App) LoadMeeting(projectPath, meetingID string) Meeting {
	meeting, err := LoadMeeting(projectPath, meetingID)
	if err != nil {
		return Meeting{}
	}
	return *meeting
}

func (a *App) GetOrCreateActiveMeeting(projectPath string) Meeting {
	activePath := filepath.Join(projectPath, ".aiteam", "active_meeting.json")
	data, err := os.ReadFile(activePath)
	if err == nil {
		var active ActiveMeeting
		if json.Unmarshal(data, &active) == nil && active.MeetingID != "" {
			meeting, err := LoadMeeting(projectPath, active.MeetingID)
			if err == nil {
				return *meeting
			}
		}
	}

	id := "meeting-" + time.Now().UTC().Format("20060102T150405Z")
	meeting := Meeting{
		ID:            id,
		Title:         "Untitled Meeting",
		StartedAt:     time.Now().UTC().Format(time.RFC3339),
		Agents:        []string{},
		AgentSessions: map[string]string{},
		Messages:      []Message{},
	}

	SaveMeeting(projectPath, &meeting)

	active := ActiveMeeting{
		ProjectPath: projectPath,
		MeetingID:   id,
	}
	activeData, _ := json.Marshal(active)
	os.WriteFile(activePath, activeData, 0644)

	return meeting
}

func (a *App) SaveMeetingMessage(projectPath, meetingID string, msg Message) bool {
	meeting, err := LoadMeeting(projectPath, meetingID)
	if err != nil {
		return false
	}
	meeting.Messages = append(meeting.Messages, msg)
	err = SaveMeeting(projectPath, meeting)
	return err == nil
}

func (a *App) EndMeeting(projectPath, meetingID, title string) bool {
	meeting, err := LoadMeeting(projectPath, meetingID)
	if err != nil {
		return false
	}
	meeting.Title = title
	meeting.EndedAt = time.Now().UTC().Format(time.RFC3339)

	SaveMeeting(projectPath, meeting)

	activePath := filepath.Join(projectPath, ".aiteam", "active_meeting.json")
	os.Remove(activePath)

	return true
}
