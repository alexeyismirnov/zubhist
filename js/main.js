/**
 * Main application script
 * Handles timeline initialization and UI interactions
 */
document.addEventListener('DOMContentLoaded', async function() {
    let timeline;
    let currentPeriod = 'dvortsovye'; // Default period
    let currentSection = 'overview';
    let detailsData = {};
    const audioPlayer = document.getElementById('chapter-audio-player');

    // Map period IDs to their respective audio files
    const audioFileMap = {
        'dvortsovye': 'audio/dvortsovy_perevorot.mp3',
        'pavel': 'audio/pavel.mp3',
        'alexander1_liberal': 'audio/alexander1.mp3'
    };

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

        // Set initial audio source
        if (audioPlayer && audioFileMap[currentPeriod]) {
            audioPlayer.src = audioFileMap[currentPeriod];
            // audioPlayer.load(); // Not strictly necessary here as src is set initially
        }
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
                html = `<div style="padding: 4px 6px; overflow-wrap: break-word; text-align: center;">${item.content}</div>`;
              }
              return html;
            }
        };

        const timelineData = await DataLoader.loadTimelineData(currentPeriod);
        document.getElementById('timeline-title').textContent = timelineData.title;
        timeline = new vis.Timeline(container, timelineData.items, options);
        
        if (timelineData.timeWindow) {
            timeline.setWindow(timelineData.timeWindow.start, timelineData.timeWindow.end);
        }
        setupTimelineEventHandlers();
    }
    /**
     * Set up event handlers for timeline interactions
     */
    function setupTimelineEventHandlers() {
        timeline.on('select', function (properties) {
            if (properties.items.length > 0) {
                const itemId = properties.items[0];
                const item = timeline.itemsData.get(itemId);
                showTooltip(item.content);
                setTimeout(() => {
                    document.getElementById('timeline-tooltip').style.display = 'none';
                }, 5000);
            }
});

        timeline.on('itemover', function (properties) {
            const item = timeline.itemsData.get(properties.item);
            showTooltip(item.content);
        });

        timeline.on('itemout', function () {
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
                details.facts.forEach(fact => { html += `<li>${fact}</li>`; });
                html += '</ul>';
            }
            tooltip.innerHTML = html;
            tooltip.style.display = 'block';
            const event = window.event;
            if (event) { // Ensure event is available
                tooltip.style.left = event.pageX + 10 + 'px';
                tooltip.style.top = event.pageY - tooltip.offsetHeight - 10 + 'px';
            } else { // Fallback position if event is not available
                tooltip.style.left = '10px';
                tooltip.style.top = '10px';
            }
        }
    }

    /**
     * Load timeline data for a specific period
     * @param {string} period - Period identifier
     */
    window.loadTimeline = async function(period) {
        currentPeriod = period;

        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        if (event && event.target) {
            event.target.classList.add('active');
        } else {
            const buttons = document.querySelectorAll('.period-btn');
            buttons.forEach(btn => {
                if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`loadTimeline('${period}')`)) {
                    btn.classList.add('active');
                }
            });
        }

        try {
            const timelineData = await DataLoader.loadTimelineData(period);
            document.getElementById('timeline-title').textContent = timelineData.title;
            timeline.setItems(timelineData.items);
            if (timelineData.timeWindow) {
                timeline.setWindow(timelineData.timeWindow.start, timelineData.timeWindow.end);
            }
            await updateSectionContent(currentSection);

            // Update audio player source using the map
            if (audioPlayer && audioFileMap[period]) {
                audioPlayer.src = audioFileMap[period];
                audioPlayer.load(); // Load the new audio source
                // Optional: auto-play the new audio
                // audioPlayer.play(); 
            } else if (audioPlayer) {
                console.warn(`Audio file not mapped for period: ${period}`);
                audioPlayer.removeAttribute('src'); // Or set to a default/silent audio
                audioPlayer.load();
            }

        } catch (error) {
            console.error(`Error loading timeline for period ${period}:`, error);
            showErrorMessage('Не удалось загрузить данные временной шкалы.');
        }
    };

    /**
     * Timeline control functions
     */
    window.timelineFit = function() { if(timeline) timeline.fit(); };
    window.timelineZoomIn = function() { if(timeline) timeline.zoomIn(0.5); };
    window.timelineZoomOut = function() { if(timeline) timeline.zoomOut(0.5); };
    window.timelineToday = async function() {
        try {
            const timelineData = await DataLoader.loadTimelineData(currentPeriod);
            if (timelineData.timeWindow && timelineData.timeWindow.start) {
                if(timeline) timeline.moveTo(timelineData.timeWindow.start);
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
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
        if (event && event.target) {
            event.target.classList.add('active');
        }
        await updateSectionContent(sectionId);
    };

    /**
     * Update content of a section based on current period
     * @param {string} sectionId - Section identifier
     */
    async function updateSectionContent(sectionId) {
        if (sectionId === 'family') return;
        const contentElement = document.getElementById(`${sectionId}-content`);
        try {
            contentElement.innerHTML = '<p>Загрузка данных...</p>';
            const contentData = await DataLoader.loadContentData(sectionId, currentPeriod);
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
        const container = document.querySelector('.container');
        if (container) {
            container.prepend(errorDiv);
        }
    }

    window.addEventListener('resize', function() {
        if (timeline) {
            timeline.redraw();
        }
    });
});