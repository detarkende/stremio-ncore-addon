package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	bittorrent "github.com/anacrolix/torrent"
	"github.com/anacrolix/torrent/types/infohash"
	rangeparser "github.com/detarkende/stremio-ncore-addon/torrent-server/internal/range-parser"
	responses "github.com/detarkende/stremio-ncore-addon/torrent-server/internal/responses"
	gin "github.com/gin-gonic/gin"
)

type AddTorrentRequest struct {
	Path string `json:"path"`
}

func main() {
	var port int
	var downloadDir string

	flag.IntVar(&port, "p", 0, "Port to run the server on")
	flag.StringVar(&downloadDir, "d", "", "Directory to store downloads")

	flag.Parse()

	if port == 0 {
		log.Fatal("Port flag is required")
		return
	}
	if downloadDir == "" {
		log.Fatal("Download directory flag is required")
		return
	}

	fmt.Printf("Starting server on port %d. Downloading to directory: %s\n", port, downloadDir)

	cfg := bittorrent.NewDefaultClientConfig()
	cfg.DataDir = downloadDir // Store all downloads in a specific directory
	cfg.Seed = true

	client, err := bittorrent.NewClient(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	r := gin.Default()

	r.GET("/torrents", func(c *gin.Context) {
		torrents := client.Torrents()
		response := responses.TorrentsToResponse(torrents)
		c.JSON(http.StatusOK, response)
	})

	r.POST("/torrents", func(c *gin.Context) {
		var json AddTorrentRequest
		if err := c.ShouldBindBodyWithJSON(&json); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		torrent, err := client.AddTorrentFromFile(json.Path)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		<-torrent.GotInfo()
		torrent.VerifyData()
		response := responses.TorrentToResponse(torrent)
		c.JSON(http.StatusOK, response)
	})

	r.GET("/torrents/:infoHash", func(c *gin.Context) {
		infoHash := c.Param("infoHash")
		torrent, ok := client.Torrent(infohash.FromHexString(infoHash))
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "Torrent not found"})
			return
		}
		response := responses.TorrentToResponse(torrent)
		c.JSON(http.StatusOK, response)
	})

	r.DELETE("/torrents/:infoHash", func(c *gin.Context) {
		infoHash := c.Param("infoHash")
		torrent, ok := client.Torrent(infohash.FromHexString(infoHash))
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "Torrent not found"})
			return
		}
		// Get torrent's root directory/files before dropping
		downloadPath := cfg.DataDir
		torrentName := torrent.Name()

		torrent.Drop()

		// Remove the data files
		fullPath := path.Join(downloadPath, torrentName)
		err := os.RemoveAll(fullPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Torrent removed but failed to delete data files",
				"details": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":  "Torrent and data deleted successfully",
			"infoHash": infoHash,
		})
	})

	r.Match([]string{"GET", "HEAD"}, "/torrents/:infoHash/files/*filePath", func(c *gin.Context) {
		infoHash := c.Param("infoHash")
		filepath := strings.TrimPrefix(c.Param("filePath"), "/")
		torrent, ok := client.Torrent(infohash.FromHexString(infoHash))
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "Torrent not found"})
			return
		}

		<-torrent.GotInfo()
		var targetFile *bittorrent.File
		for _, file := range torrent.Files() {
			if file.Path() == filepath {
				targetFile = file
				break
			}
		}
		if targetFile == nil {
			println(filepath)
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found: " + filepath})
			return
		}

		if c.Request.Method == "HEAD" {
			c.Status(http.StatusOK)
			c.Header("Content-Length", strconv.Itoa(int(targetFile.Length())))
			c.Header("Content-Type", getContentType(targetFile.Path()))
			c.Header("Accept-Ranges", "bytes")
			return
		}

		// Get file size
		fileSize := targetFile.Length()

		// Parse range header
		rangeHeader := c.GetHeader("Range")
		start, end, err := rangeparser.ParseRangeHeader(rangeHeader, fileSize)

		if err != nil {
			fmt.Println(err)
			c.Status(http.StatusRequestedRangeNotSatisfiable)
			c.Header("Accept-Ranges", "bytes")
			c.Header("Content-Type", getContentType(filepath))
			c.Header("Content-Range", fmt.Sprintf("bytes */%d", fileSize))
			return
		}

		// Set headers
		c.Header("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
		c.Header("Accept-Ranges", "bytes")
		c.Header("Content-Length", fmt.Sprintf("%d", end-start+1))
		c.Header("Content-Type", getContentType(filepath))
		c.Status(http.StatusPartialContent)

		// Create reader for the specific range
		reader := targetFile.NewReader()
		reader.SetReadahead(1024 * 1024) // 1MB readahead
		reader.Seek(start, io.SeekStart)

		// Stream the range
		remaining := end - start + 1
		buf := make([]byte, 32*1024) // 32KB buffer
		for remaining > 0 {
			readSize := min(remaining, int64(len(buf)))
			bytes, err := reader.Read(buf[:readSize])
			if err != nil && err != io.EOF {
				log.Printf("Error reading file: %v", err)
				return
			}
			if bytes > 0 {
				c.Writer.Write(buf[:bytes])
				remaining -= int64(bytes)
			}
			if err == io.EOF {
				break
			}
		}

	})

	r.Run(":" + strconv.Itoa(port))
}

func getContentType(filepath string) string {
	ext := strings.ToLower(path.Ext(filepath))
	switch ext {
	case ".mp4":
		return "video/mp4"
	case ".mkv":
		return "video/x-matroska"
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	default:
		return "application/octet-stream"
	}
}
