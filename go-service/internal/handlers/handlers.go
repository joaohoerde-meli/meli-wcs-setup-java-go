package handlers

import (
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/client"
)

type Handler struct {
	javaClient *client.JavaClient
	proxy      *httputil.ReverseProxy
}

func New(javaClient *client.JavaClient, javaBaseURL string) *Handler {
	target, _ := url.Parse(javaBaseURL)
	return &Handler{
		javaClient: javaClient,
		proxy:      httputil.NewSingleHostReverseProxy(target),
	}
}

// GetTopology handles GET /api/topology/:sorterId — direct fast-path read.
func (h *Handler) GetTopology(c *gin.Context) {
	body, status, err := h.javaClient.Get("/api/topology/" + c.Param("sorterId"))
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "upstream unavailable"})
		return
	}
	c.Data(status, "application/json; charset=utf-8", body)
}

// GetTopologyExits handles GET /api/topology_exits/:sorterId — direct fast-path read.
func (h *Handler) GetTopologyExits(c *gin.Context) {
	body, status, err := h.javaClient.Get("/api/topology_exits/" + c.Param("sorterId"))
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "upstream unavailable"})
		return
	}
	c.Data(status, "application/json; charset=utf-8", body)
}

// ProxyToJava transparently proxies all other requests to the Java service.
func (h *Handler) ProxyToJava(c *gin.Context) {
	h.proxy.ServeHTTP(c.Writer, c.Request)
}
