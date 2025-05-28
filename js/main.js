/**
 * Main application script
 * Handles timeline initialization and UI interactions
 */
document.addEventListener('DOMContentLoaded', async function() {
    let timeline;
    let currentPeriod = 'dvortsovye';
    let currentSection = 'overview';
    let detailsData = {};

    // Initialize the application
    try {
        await initializeApp();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorMessage('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
    }

    /**
     * Initialize the application
     */
    async function initializeApp() {
        // Load details data for tooltips
        detailsData = await DataLoader.loadDetailsData();
        
        // Initialize timeline with default period
        await initTimeline();
        
        // Load initial content
        await updateSectionContent('overview');
    }

    /**
     * Initialize the timeline visualization
     */
    async function initTimeline() {
        const container = document.getElementById('timeline');
        const options = {
            locale: 'ru',
            zoomMin: 1000 * 60 * 60 * 24 * 30, // minimum one month
            zoomMax: 1000 * 60 * 60 * 24 * 365 * 150, // maximum 150 years
            orientation: 'top',
            moveable: true,
            zoomable: true,
            horizontalScroll: true,
            verticalScroll: false,
            showCurrentTime: false,
            format: {
                minorLabels: {
                    year: 'YYYY'
                }
            },
            tooltip: {
                followMouse: true,
                overflowMethod: 'flip'
            },
            template: function(item, element, data) {
              let html = '';
              if (item.content) {
                // Simpler div, focusing on padding and word wrapping.
                // Text alignment can be handled by .vis-item or this div.
                html = `<div style="padding: 4px 6px; overflow-wrap: break-word; text-align: center;">${item.content}</div>`;
              }
              return html;
            }
        };

        // Load timeline data for the current period
        const timelineData = await DataLoader.loadTimelineData(currentPeriod);
        
        // Update timeline title
        document.getElementById('timeline-title').textContent = timelineData.title;
        
        // Create timeline
        timeline = new vis.Timeline(container, timelineData.items, options);
        
        // Set initial window
        if (timelineData.timeWindow) {
            timeline.setWindow(timelineData.timeWindow.start, timelineData.timeWindow.end);
        }

        // Event handlers for timeline
        setupTimelineEventHandlers();
    }

    /**
     * Set up event handlers for timeline interactions
     */
    function setupTimelineEventHandlers() {
        // Click handler
        timeline.on('select', function (properties) {
            if (properties.items.length > 0) {
                const itemId = properties.items[0];
                const item = timeline.itemsData.get(itemId);
                showTooltip(item.content);

                // Auto-hide tooltip after 5 seconds
                setTimeout(() => {
                    document.getElementById('timeline-tooltip').style.display = 'none';
                }, 5000);
            }
        });

        // Hover handlers
        timeline.on('itemover', function (properties) {
            const item = timeline.itemsData.get(properties.item);
            showTooltip(item.content);
        });

        timeline.on('itemout', function (properties) {
            document.getElementById('timeline-tooltip').style.display = 'none';
        });
    }

    /**
     * Show tooltip with details for a timeline item
     * @param {string} itemContent - Content of the timeline item
     */
    function showTooltip(itemContent) {
        const tooltip = document.getElementById('timeline-tooltip');
        const details = detailsData[itemContent];

        if (details) {
            let html = `<h3>${details.title}</h3>`;
            html += `<p><strong>Период:</strong> ${details.period}</p>`;
            html += `<p>${details.description}</p>`;

            if (details.facts && details.facts.length > 0) {
                html += '<p><strong>Интересные факты:</strong></p><ul>';
                details.facts.forEach(fact => {
                    html += `<li>${fact}</li>`;
                });
                html += '</ul>';
            }

            tooltip.innerHTML = html;
            tooltip.style.display = 'block';

            const event = window.event;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - tooltip.offsetHeight - 10 + 'px';
        }
    }

    /**
     * Load timeline data for a specific period
     * @param {string} period - Period identifier
     */
    window.loadTimeline = async function(period) {
        currentPeriod = period;

        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        try {
            // Load new timeline data
            const timelineData = await DataLoader.loadTimelineData(period);
            
            // Update timeline title
            document.getElementById('timeline-title').textContent = timelineData.title;
            
            // Update timeline items
            timeline.setItems(timelineData.items);
            
            // Set window
            if (timelineData.timeWindow) {
                timeline.setWindow(timelineData.timeWindow.start, timelineData.timeWindow.end);
            }
            
            // Update content in current active section
            await updateSectionContent(currentSection);
        } catch (error) {
            console.error(`Error loading timeline for period ${period}:`, error);
            showErrorMessage('Не удалось загрузить данные временной шкалы.');
        }
    };

    /**
     * Timeline control functions
     */
    window.timelineFit = function() {
        timeline.fit();
    };

    window.timelineZoomIn = function() {
        timeline.zoomIn(0.5);
    };

    window.timelineZoomOut = function() {
        timeline.zoomOut(0.5);
    };

    window.timelineToday = async function() {
        try {
            const timelineData = await DataLoader.loadTimelineData(currentPeriod);
            if (timelineData.timeWindow && timelineData.timeWindow.start) {
                timeline.moveTo(timelineData.timeWindow.start);
            }
        } catch (error) {
            console.error('Error moving timeline to start date:', error);
        }
    };

    /**
     * Show a specific content section
     * @param {string} sectionId - Section identifier
     */
    window.showSection = async function(sectionId) {
        currentSection = sectionId;

        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));

        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Show selected section
        document.getElementById(sectionId).classList.add('active');

        // Activate corresponding tab
        event.target.classList.add('active');

        // Update section content
        await updateSectionContent(sectionId);
    };

    /**
     * Update content of a section based on current period
     * @param {string} sectionId - Section identifier
     */
    async function updateSectionContent(sectionId) {
        // Skip for family section which has static content
        if (sectionId === 'family') {
            return;
        }

        const contentElement = document.getElementById(`${sectionId}-content`);
        
        try {
            // Show loading indicator
            contentElement.innerHTML = '<p>Загрузка данных...</p>';
            
            // Load content data
            const contentData = await DataLoader.loadContentData(sectionId, currentPeriod);
            
            // Update content
            contentElement.innerHTML = contentData.content;
        } catch (error) {
            console.error(`Error updating content for section ${sectionId}:`, error);
            contentElement.innerHTML = '<p>Не удалось загрузить данные для этого раздела.</p>';
        }
    }

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.background = '#f8d7da';
        errorDiv.style.color = '#721c24';
        errorDiv.style.padding = '10px';
        errorDiv.style.margin = '10px 0';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.textAlign = 'center';
        errorDiv.innerHTML = `<strong>Ошибка:</strong> ${message}`;
        
        document.querySelector('.container').prepend(errorDiv);
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        if (timeline) {
            timeline.redraw();
        }
    });
});