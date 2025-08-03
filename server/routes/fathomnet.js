const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const router = express.Router();

const cache = new NodeCache({ stdTTL: 3600 });
const FATHOMNET_DATABASE_URL =
  "https://database.fathomnet.org/api/geoimages/query";
const FATHOMNET_DARWIN_CORE_BASE =
  "https://database.fathomnet.org/api/darwincore/query";

class FathomNetService {
  static async getSpeciesImages(species, limit = 3) {
    const cacheKey = `species_${species.toLowerCase()}_${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching FathomNet data for species: ${species}`);
      const imageResponse = await axios.post(
        FATHOMNET_DATABASE_URL,
        { concept: species },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Origin: "https://database.fathomnet.org",
            Referer: "https://database.fathomnet.org/fathomnet/",
          },
          timeout: 10000,
        }
      );

      if (
        imageResponse.data &&
        Array.isArray(imageResponse.data) &&
        imageResponse.data.length > 0
      ) {
        // Enrich each image with Darwin Core data to get owner institution
        const enrichedImages = await Promise.all(
          imageResponse.data.slice(0, limit).map(async (img) => {
            let ownerInstitution = "Unknown";

            try {
              // Get owner institution from Darwin Core API
              const institutionResponse = await axios.get(
                `${FATHOMNET_DARWIN_CORE_BASE}/ownerinstitutions/${img.uuid}`,
                {
                  headers: {
                    Accept: "application/json",
                    "Accept-Language": "en-US,en;q=0.9",
                    Connection: "keep-alive",
                    Referer: "https://database.fathomnet.org/fathomnet/",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  },
                  timeout: 3000,
                }
              );

              if (
                institutionResponse.data &&
                institutionResponse.data.length > 0
              ) {
                ownerInstitution = institutionResponse.data[0];
              }
            } catch (institutionError) {
              console.warn(
                `Could not fetch owner institution for ${img.uuid}:`,
                institutionError.message
              );
            }

            return {
              id: img.uuid,
              url: img.url,
              thumbnail: img.url,
              caption: `${species} observed at ${
                img.depthMeters || "unknown"
              }m depth by ${ownerInstitution}`,
              depth: img.depthMeters || null,
              latitude: img.latitude || null,
              longitude: img.longitude || null,
              timestamp: img.timestamp || null,
              contributor: img.contributorsEmail || null,
              dataset: "FathomNet Database",
              valid: img.valid || true,
              lastValidation: img.lastValidation || null,
              ownerInstitution: ownerInstitution,
            };
          })
        );

        const result = {
          species: species,
          images: enrichedImages,
          taxonomy: {
            scientificName: species,
            commonName: species,
          },
          fetchedAt: new Date().toISOString(),
          source: "FathomNet Database API with Darwin Core enrichment",
          totalFound: imageResponse.data.length,
        };

        cache.set(cacheKey, result);
        console.log(
          `Successfully cached FathomNet data for species: ${species} (${enrichedImages.length} images)`
        );
        return result;
      } else {
        const emptyResult = {
          species: species,
          images: [],
          taxonomy: null,
          error: `No images found for species: ${species}`,
          fetchedAt: new Date().toISOString(),
          source: "FathomNet Database API",
          totalFound: 0,
        };
        cache.set(cacheKey, emptyResult, 300);
        return emptyResult;
      }
    } catch (error) {
      console.error(`FathomNet API error for ${species}:`, error.message);
      const errorResult = {
        species: species,
        images: [],
        taxonomy: null,
        error: `FathomNet API error: ${error.message}`,
        fetchedAt: new Date().toISOString(),
        source: "FathomNet (API Error)",
        totalFound: 0,
      };
      cache.set(cacheKey, errorResult, 120);
      return errorResult;
    }
  }

  /**
   * Search for species by name (simplified API-only version)
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise<Array>} - Array of species suggestions
   */
  static async searchSpecies(query, limit = 10) {
    const cacheKey = `search_${query.toLowerCase()}_${limit}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for search: ${query}`);
      return cached;
    }

    try {
      console.log(`Searching FathomNet for: ${query}`);
      const searchResponse = await axios.post(
        FATHOMNET_DATABASE_URL,
        { concept: query },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Origin: "https://database.fathomnet.org",
            Referer: "https://database.fathomnet.org/fathomnet/",
          },
          timeout: 5000,
        }
      );

      console.log(
        `FathomNet API response for "${query}": ${
          searchResponse.data?.length || 0
        } total records`
      );

      if (searchResponse.data && searchResponse.data.length > 0) {
        const imageCount = searchResponse.data.length;
        const suggestions = [
          {
            name: query,
            scientificName: query,
            commonName: query,
            imageCount: imageCount,
          },
        ];

        cache.set(cacheKey, suggestions);
        console.log(
          `Successfully cached search results for: ${query} (${suggestions.length} species)`
        );
        return suggestions;
      } else {
        const emptyResult = [];
        cache.set(cacheKey, emptyResult, 300);
        return emptyResult;
      }
    } catch (error) {
      console.error(`FathomNet search error for ${query}:`, error.message);
      const errorResult = [];
      cache.set(cacheKey, errorResult, 120);
      return errorResult;
    }
  }

  static getCacheStats() {
    return {
      keys: cache.keys().length,
      stats: cache.getStats(),
    };
  }

  static clearCache() {
    cache.flushAll();
    console.log("FathomNet cache cleared");
  }
}

// Routes

/**
 * GET /api/fathomnet/species/:species
 * Get species images and metadata from FathomNet
 */
router.get("/species/:species", async (req, res) => {
  const { species } = req.params;
  const limit = parseInt(req.query.limit) || 3;

  if (!species) {
    return res.status(400).json({
      error: "Species parameter is required",
    });
  }

  try {
    const data = await FathomNetService.getSpeciesImages(species, limit);
    res.json(data);
  } catch (error) {
    console.error("Error in species endpoint:", error);
    res.status(500).json({
      error: "Failed to fetch species data",
      message: error.message,
    });
  }
});

/**
 * GET /api/fathomnet/search
 * Search for species suggestions
 */
router.get("/search", async (req, res) => {
  const { q: query, limit } = req.query;

  if (!query) {
    return res.status(400).json({
      error: "Query parameter (q) is required",
    });
  }

  try {
    const suggestions = await FathomNetService.searchSpecies(
      query,
      parseInt(limit) || 10
    );
    res.json({
      query: query,
      suggestions: suggestions,
    });
  } catch (error) {
    console.error("Error in search endpoint:", error);
    res.status(500).json({
      error: "Failed to search species",
      message: error.message,
    });
  }
});

router.post("/alert", async (req, res) => {
  const { species, auv_id, distance, confidence } = req.body;

  if (!species) {
    return res.status(400).json({ error: "Species is required" });
  }

  try {
    const speciesData = await FathomNetService.getSpeciesImages(species, 3);
    const enrichedAlert = {
      id: Date.now(),
      auv_id: auv_id || "AUV-001",
      message: `${species} detected`,
      severity: "info",
      timestamp: new Date().toISOString(),
      species: species,
      distance: distance || 120,
      confidence: confidence || 0.85,
      fathomnet: speciesData,
    };
    res.json(enrichedAlert);
  } catch (error) {
    console.error("Error processing species alert:", error);
    res.status(500).json({
      error: "Failed to process species alert",
      message: error.message,
    });
  }
});

router.get("/cache/stats", (req, res) => {
  res.json(FathomNetService.getCacheStats());
});

router.delete("/cache", (req, res) => {
  FathomNetService.clearCache();
  res.json({ message: "Cache cleared successfully" });
});

module.exports = router;
