package responses

import (
	bittorrent "github.com/anacrolix/torrent"
)

type TorrentFile struct {
	Name     string  `json:"name"`
	Path     string  `json:"path"`
	Size     int64   `json:"size"`
	Progress float64 `json:"progress"`
}

type TorrentResponse struct {
	InfoHash   string        `json:"infoHash"`
	Name       string        `json:"name"`
	Progress   float64       `json:"progress"`
	Size       int64         `json:"size"`
	Downloaded int64         `json:"downloaded"`
	Files      []TorrentFile `json:"files"`
}

func TorrentToResponse(torrent *bittorrent.Torrent) TorrentResponse {
	files := make([]TorrentFile, 0, len(torrent.Files()))
	for _, file := range torrent.Files() {
		files = append(files, TorrentFile{
			Name:     file.DisplayPath(),
			Path:     file.Path(),
			Size:     file.Length(),
			Progress: float64(file.BytesCompleted()) / float64(file.Length()),
		})
	}
	response := TorrentResponse{
		InfoHash:   torrent.InfoHash().String(),
		Name:       torrent.Name(),
		Progress:   float64(torrent.BytesCompleted()) / float64(torrent.Length()),
		Files:      files,
		Size:       torrent.Length(),
		Downloaded: torrent.BytesCompleted(),
	}
	return response
}

func TorrentsToResponse(torrents []*bittorrent.Torrent) []TorrentResponse {
	responses := make([]TorrentResponse, 0, len(torrents))
	for _, torrent := range torrents {
		responses = append(responses, TorrentToResponse(torrent))
	}
	return responses
}
