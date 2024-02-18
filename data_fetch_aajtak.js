const fs = require('fs').promises;

const slugify = require('slugify');

const apiKey = 'AIzaSyDeF6zYZZxDZDyD-R_d41mE4QTOmjCg-po';  // Replace with your actual API key
const channelId = 'UCt4t-jeY85JegMlZ-E5UWtA';  // Replace with your actual channel ID
const year = '2023';

const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&order=date&maxResults=5000000`;

async function fetchVideos(pageToken = null) {
    let url = apiUrl + `&channelType=any&channelId=${channelId}&publishedAfter=${year}-02-01T00:00:00Z&publishedBefore=${year}-02-28T23:59:59Z`;

    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items) {
            const videoDetails = await Promise.all(data.items.map(async (item) => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;
                const slug = slugify(title, { lower: true });
                const publishedAt = item.snippet.publishedAt;

                const videoStatisticsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
                const statisticsResponse = await fetch(videoStatisticsUrl);

                if (statisticsResponse.ok) {
                    const statisticsData = await statisticsResponse.json();

                    if (statisticsData.items && statisticsData.items.length > 0) {
                        const likes = statisticsData.items[0].statistics.likeCount;
                        const views = statisticsData.items[0].statistics.viewCount;
                        const comments = await fetchVideoComments(videoId);

                        return {
                            videoId,
                            title:slug,
                            publishedAt,
                            likes,
                            views,
                            comments,
                        };
                    } else {
                        console.error(`No statistics data found for video ${videoId}`);
                    }
                } else {
                    console.error(`Error fetching statistics for video ${videoId}: ${statisticsResponse.statusText}`);
                }
            }));

            await appendToJSONFile('AAJTak_feb.json', videoDetails);

            if (data.nextPageToken) {
                await fetchVideos(data.nextPageToken);
            }
        } else {
            console.error('No video data found');
        }
    } catch (error) {
        console.error('Error fetching videos:', error);
    }
}

async function fetchVideoComments(videoId) {
    const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=100`;

    try {
        const commentsResponse = await fetch(commentsUrl);
        const commentsData = await commentsResponse.json();

        if (commentsData.items) {
            return commentsData.items.map(comment => ({
                author: comment.snippet.topLevelComment.snippet.authorDisplayName,
                text: comment.snippet.topLevelComment.snippet.textDisplay,
                publishedAt: comment.snippet.topLevelComment.snippet.publishedAt,
            }));
        } else {
            console.error(`No comments data found for video ${videoId}`);
            return [];
        }
    } catch (error) {
        console.error(`Error fetching comments for video ${videoId}: ${error}`);
        return [];
    }
}

async function appendToJSONFile(filename, newData) {
    try {
        let existingData = [];

        try {
            // Attempt to read existing data from the file
            const existingDataString = await fs.readFile(filename, 'utf-8');
            existingData = JSON.parse(existingDataString);
        } catch (readError) {
            // Handle the error, or ignore it if the file is empty or not valid JSON
            console.error('Error reading existing JSON data:', readError);
        }

        // Combine existing data with new data
        const combinedData = [...existingData, ...newData];

        // Write the combined data back to the file
        const jsonData = JSON.stringify(combinedData, null, 2);
        await fs.writeFile(filename, jsonData);
        console.log(`Data appended to ${filename}`);
    } catch (error) {
        console.error('Error appending to JSON file:', error);
    }
}

fetchVideos();
