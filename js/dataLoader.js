/**
 * Data Loader Module
 * Handles asynchronous loading of data from JSON files
 */
class DataLoader {
    /**
     * Load timeline data for a specific period
     * @param {string} period - Period identifier ('dvortsovye' or 'pavel')
     * @returns {Promise} - Promise that resolves with timeline data
     */
    static async loadTimelineData(period) {
        try {
            const response = await fetch(`data/periods/${period}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load timeline data for ${period}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading timeline data:', error);
            throw error;
        }
    }

    /**
     * Load tooltip details data
     * @returns {Promise} - Promise that resolves with details data
     */
    static async loadDetailsData() {
        try {
            const response = await fetch('data/details.json');
            if (!response.ok) {
                throw new Error('Failed to load details data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading details data:', error);
            throw error;
        }
    }

    /**
     * Load content data for a specific section and period
     * @param {string} section - Section identifier ('overview', 'people', 'events', 'reforms')
     * @param {string} period - Period identifier ('dvortsovye' or 'pavel')
     * @returns {Promise} - Promise that resolves with content data
     */
    static async loadContentData(section, period) {
        try {
            const response = await fetch(`data/content/${section}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load content data for ${section}`);
            }
            const data = await response.json();
            return data[period] || { title: "Информация отсутствует", content: "<p>Информация для данного периода отсутствует.</p>" };
        } catch (error) {
            console.error(`Error loading content data for ${section}:`, error);
            throw error;
        }
    }
}

// Export for use in other modules
window.DataLoader = DataLoader;