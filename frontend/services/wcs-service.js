import { config } from 'nordic/config';
import { RestClient } from 'nordic/restclient';
import { LoggerFactory } from 'nordic/logger';

const logger = LoggerFactory('wcs-service');

const client = RestClient({
  baseURL: config.get('endpoints.api'),
  timeout: 10000,
});

/**
 * List all sorters.
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function getSorters() {
  try {
    const response = await client.get('/api/sorters');

    return { data: response.data, error: null };
  } catch (error) {
    logger.error(error, { method: 'getSorters' });

    if (error.response) {
      return {
        data: null,
        error: { status: error.response.status, message: error.response.data?.detail },
      };
    }

    return { data: null, error: {} };
  }
}

/**
 * Get a single sorter by sorterId.
 * @param {string} sorterId
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function getSorter(sorterId) {
  try {
    const response = await client.get(`/api/sorters/${sorterId}`);

    return { data: response.data, error: null };
  } catch (error) {
    logger.error(error, { method: 'getSorter', sorterId });

    if (error.response) {
      return {
        data: null,
        error: { status: error.response.status, message: error.response.data?.detail },
      };
    }

    return { data: null, error: {} };
  }
}

/**
 * Create a new sorter.
 * @param {object} payload - TopologyPayload
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function createSorter(payload) {
  try {
    const response = await client.post('/api/sorters', { data: payload });

    return { data: response.data, error: null };
  } catch (error) {
    logger.error(error, { method: 'createSorter' });

    if (error.response) {
      return {
        data: null,
        error: {
          status: error.response.status,
          message: error.response.data?.detail,
          errors: error.response.data?.errors,
        },
      };
    }

    return { data: null, error: {} };
  }
}

/**
 * Update an existing sorter's topology.
 * @param {string} sorterId
 * @param {object} payload - TopologyPayload
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function updateTopology(sorterId, payload) {
  try {
    const response = await client.put(`/api/sorters/${sorterId}/topology`, { data: payload });

    return { data: response.data, error: null };
  } catch (error) {
    logger.error(error, { method: 'updateTopology', sorterId });

    if (error.response) {
      return {
        data: null,
        error: {
          status: error.response.status,
          message: error.response.data?.detail,
          errors: error.response.data?.errors,
        },
      };
    }

    return { data: null, error: {} };
  }
}

/**
 * Delete a sorter.
 * @param {string} sorterId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteSorter(sorterId) {
  try {
    await client.delete(`/api/sorters/${sorterId}`);

    return { error: null };
  } catch (error) {
    logger.error(error, { method: 'deleteSorter', sorterId });

    if (error.response) {
      return {
        error: { status: error.response.status, message: error.response.data?.detail },
      };
    }

    return { error: {} };
  }
}
