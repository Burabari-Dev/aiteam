package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

const aiteamDir = ".aiteam"

func ensureAiteamDir(projectPath string) error {
	return os.MkdirAll(filepath.Join(projectPath, aiteamDir), 0755)
}

func loadProjectMeta(projectPath string) *ProjectMeta {
	metaPath := filepath.Join(projectPath, aiteamDir, "meta.json")
	data, err := os.ReadFile(metaPath)
	if err != nil {
		return nil
	}
	var meta ProjectMeta
	if err := json.Unmarshal(data, &meta); err != nil {
		return nil
	}
	return &meta
}

func saveProjectMeta(projectPath string, meta *ProjectMeta) error {
	if err := ensureAiteamDir(projectPath); err != nil {
		return err
	}
	metaPath := filepath.Join(projectPath, aiteamDir, "meta.json")
	data, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(metaPath, data, 0644)
}

func CreateProject(projectPath, name, description string) (*ProjectMeta, error) {
	meta := &ProjectMeta{
		Name:        name,
		Description: description,
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		TeamRoles:   []string{},
	}
	if err := saveProjectMeta(projectPath, meta); err != nil {
		return nil, err
	}
	return meta, nil
}

func InitTeamRoles(projectPath string, roles []string) error {
	meta := loadProjectMeta(projectPath)
	if meta == nil {
		return nil
	}

	for _, role := range roles {
		roleDir := filepath.Join(projectPath, aiteamDir, "team", role)
		if err := os.MkdirAll(roleDir, 0755); err != nil {
			return err
		}
	}

	meta.TeamRoles = roles
	return saveProjectMeta(projectPath, meta)
}

func GetTeamRoles(projectPath string) ([]string, error) {
	meta := loadProjectMeta(projectPath)
	if meta == nil {
		return nil, nil
	}
	return meta.TeamRoles, nil
}

func SaveMeeting(projectPath string, meeting *Meeting) error {
	meetingsDir := filepath.Join(projectPath, aiteamDir, "meetings")
	if err := os.MkdirAll(meetingsDir, 0755); err != nil {
		return err
	}
	meetingPath := filepath.Join(meetingsDir, meeting.ID+".json")
	data, err := json.MarshalIndent(meeting, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(meetingPath, data, 0644)
}

func LoadMeeting(projectPath, meetingID string) (*Meeting, error) {
	meetingPath := filepath.Join(projectPath, aiteamDir, "meetings", meetingID+".json")
	data, err := os.ReadFile(meetingPath)
	if err != nil {
		return nil, err
	}
	var meeting Meeting
	if err := json.Unmarshal(data, &meeting); err != nil {
		return nil, err
	}
	return &meeting, nil
}

func ListMeetings(projectPath string) ([]MeetingSummary, error) {
	meetingsDir := filepath.Join(projectPath, aiteamDir, "meetings")
	entries, err := os.ReadDir(meetingsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []MeetingSummary{}, nil
		}
		return nil, err
	}

	summaries := make([]MeetingSummary, 0, len(entries))
	for _, e := range entries {
		if filepath.Ext(e.Name()) != ".json" {
			continue
		}
		meetingPath := filepath.Join(meetingsDir, e.Name())
		data, err := os.ReadFile(meetingPath)
		if err != nil {
			continue
		}
		var meeting Meeting
		if err := json.Unmarshal(data, &meeting); err != nil {
			continue
		}
		summaries = append(summaries, MeetingSummary{
			ID:         meeting.ID,
			Title:      meeting.Title,
			StartedAt:  meeting.StartedAt,
			AgentCount: len(meeting.Agents),
		})
	}
	return summaries, nil
}

func AppendToAgentHistory(projectPath, roleName, line string) error {
	historyFile := filepath.Join(projectPath, aiteamDir, "team", roleName, "history.jsonl")
	f, err := os.OpenFile(historyFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.WriteString(line + "\n")
	return err
}
