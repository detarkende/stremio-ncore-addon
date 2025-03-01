package rangeparser

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// ParseRangeHeader parses a Range header string and returns a Range struct
// Example input: "bytes=0-499", "bytes=-500", "bytes=500-"
func ParseRangeHeader(rangeHeader string, fileSize int64) (int64, int64, error) {
	// Check if range header is empty
	if rangeHeader == "" {
		return -1, -1, errors.New("empty range header")
	}

	// Strip "bytes=" prefix
	if !strings.HasPrefix(rangeHeader, "bytes=") {
		return -1, -1, fmt.Errorf("invalid range header format: %s", rangeHeader)
	}
	rangeValue := strings.TrimPrefix(rangeHeader, "bytes=")

	// Split by dash to get start and end
	parts := strings.Split(rangeValue, "-")
	if len(parts) != 2 {
		return -1, -1, fmt.Errorf("invalid range format: %s", rangeValue)
	}

	var start, end int64
	var err error

	// Parse start position
	if parts[0] == "" {
		// If no start is specified (e.g., "bytes=-500"), it means the last N bytes
		if parts[1] == "" {
			return -1, -1, errors.New("range header missing both start and end values")
		}

		end, err = strconv.ParseInt(parts[1], 10, 64)
		if err != nil {
			return -1, -1, fmt.Errorf("invalid end position: %v", err)
		}

		// Calculate start based on end being a suffix length
		if end > fileSize {
			// If requested suffix length is greater than file size, return the whole file
			start = 0
		} else {
			start = fileSize - end
		}
		end = fileSize - 1
	} else {
		// Parse explicit start position
		start, err = strconv.ParseInt(parts[0], 10, 64)
		if err != nil {
			return -1, -1, fmt.Errorf("invalid start position: %v", err)
		}

		// Handle end position
		if parts[1] == "" {
			// If no end is specified (e.g., "bytes=500-"), it means from start to the end of file
			end = fileSize - 1
		} else {
			end, err = strconv.ParseInt(parts[1], 10, 64)
			if err != nil {
				return -1, -1, fmt.Errorf("invalid end position: %v", err)
			}
		}
	}

	// Validate range
	if start < 0 {
		return -1, -1, errors.New("negative start position is invalid")
	}

	if end < start {
		return -1, -1, fmt.Errorf("end position (%d) cannot be less than start position (%d)", end, start)
	}

	if start >= fileSize {
		return -1, -1, fmt.Errorf("start position (%d) is beyond file size (%d)", start, fileSize)
	}

	// Clamp end to file size
	if end >= fileSize {
		end = fileSize - 1
	}

	return start, end, nil
}
