package client

import (
	"io"
	"net/http"
	"time"
)

type JavaClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewJavaClient(baseURL string) *JavaClient {
	return &JavaClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

func (c *JavaClient) Get(path string) ([]byte, int, error) {
	resp, err := c.httpClient.Get(c.baseURL + path)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}
