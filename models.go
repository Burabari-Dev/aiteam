package main

type RoleTemplate struct {
	Name        string `json:"name"`
	Label       string `json:"label"`
	Description string `json:"description"`
	Context     string `json:"context"`
}

type ProjectRegistryEntry struct {
	Name       string `json:"name"`
	Path       string `json:"path"`
	LastOpened string `json:"lastOpened"`
}

type ProjectMeta struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	CreatedAt   string   `json:"createdAt"`
	TeamRoles   []string `json:"teamRoles"`
}

type Meeting struct {
	ID            string            `json:"id"`
	Title         string            `json:"title"`
	StartedAt     string            `json:"startedAt"`
	EndedAt       string            `json:"endedAt"`
	Agents        []string          `json:"agents"`
	AgentSessions map[string]string `json:"agentSessions"`
	Messages      []Message         `json:"messages"`
}

type MeetingSummary struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	StartedAt string   `json:"startedAt"`
	AgentCount int     `json:"agentCount"`
}

type Message struct {
	Role      string   `json:"role"`
	AgentName string   `json:"agentName,omitempty"`
	Content   string   `json:"content"`
	Timestamp string   `json:"timestamp"`
	Mentions  []string `json:"mentions,omitempty"`
}

type ActiveMeeting struct {
	ProjectPath string `json:"projectPath"`
	MeetingID   string `json:"meetingID"`
}
