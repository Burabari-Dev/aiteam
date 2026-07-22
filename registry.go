package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"sync"
)

var (
	registryPath string
	registryMu   sync.RWMutex
)

func init() {
	var base string
	if runtime.GOOS == "windows" {
		base = os.Getenv("APPDATA")
	} else {
		base = os.Getenv("HOME")
		if base == "" {
			base = "~"
		}
		base = filepath.Join(base, ".config")
	}
	regDir := filepath.Join(base, "team-meeting-app")
	os.MkdirAll(regDir, 0755)
	registryPath = filepath.Join(regDir, "projects.json")
}

func loadRegistry() ([]ProjectRegistryEntry, error) {
	registryMu.RLock()
	defer registryMu.RUnlock()

	data, err := os.ReadFile(registryPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []ProjectRegistryEntry{}, nil
		}
		return nil, err
	}

	var entries []ProjectRegistryEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return nil, err
	}
	return entries, nil
}

func saveRegistry(entries []ProjectRegistryEntry) error {
	registryMu.Lock()
	defer registryMu.Unlock()

	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(registryPath, data, 0644)
}

func GetProjects() ([]ProjectRegistryEntry, error) {
	return loadRegistry()
}

func AddProject(projectPath string) (*ProjectRegistryEntry, error) {
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return nil, err
	}

	meta := loadProjectMeta(absPath)
	if meta == nil {
		return nil, nil
	}

	entries, err := loadRegistry()
	if err != nil {
		return nil, err
	}

	for i, e := range entries {
		if e.Path == absPath {
			entries[i].LastOpened = meta.CreatedAt
			entries[i].Name = meta.Name
			saveRegistry(entries)
			return &entries[i], nil
		}
	}

	entry := ProjectRegistryEntry{
		Name:       meta.Name,
		Path:       absPath,
		LastOpened: meta.CreatedAt,
	}
	entries = append(entries, entry)

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].LastOpened > entries[j].LastOpened
	})

	if err := saveRegistry(entries); err != nil {
		return nil, err
	}
	return &entry, nil
}

func RemoveProject(projectPath string) error {
	absPath, _ := filepath.Abs(projectPath)

	entries, err := loadRegistry()
	if err != nil {
		return err
	}

	filtered := make([]ProjectRegistryEntry, 0, len(entries))
	for _, e := range entries {
		if e.Path != absPath {
			filtered = append(filtered, e)
		}
	}
	return saveRegistry(filtered)
}

func UpdateProjectInRegistry(path, name, lastOpened string) {
	entries, err := loadRegistry()
	if err != nil {
		return
	}
	for i, e := range entries {
		if e.Path == path {
			entries[i].Name = name
			entries[i].LastOpened = lastOpened
			saveRegistry(entries)
			return
		}
	}
}
