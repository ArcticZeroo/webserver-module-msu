"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = require("cheerio");
const express = require("express");
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const config = require("../../../config/index");
const retryingRequest_1 = require("../../common/retryingRequest");
const index_1 = require("../../cache/index");
const ConversionUtil_1 = require("../../util/ConversionUtil");
const router = express.Router();
async function getMovieShowings() {
    let page;
    try {
        page = await retryingRequest_1.default(config.pages.MOVIE_NIGHT);
    }
    catch (e) {
        throw e;
    }
    const $ = cheerio.load(page);
    const content = $('.content-padding');
    content.find('.breadcrumbs').remove();
    const titleElements = content.find('h2');
    const showingsLists = content.find('ul');
    const movies = [];
    for (let i = 0; i < titleElements.length; i++) {
        try {
            const title = $(titleElements[i]).text().trim();
            const showings = [];
            const groupedShowings = {};
            const locations = [];
            const showingsElements = showingsLists[i].children;
            for (let j = 0; j < showingsElements.length; j++) {
                const showingsElement = showingsElements[j];
                let showingString;
                if (!showingsElement.children || showingsElement.children.length === 0) {
                    showingString = showingsElement.data;
                }
                else {
                    let full = '';
                    for (let k = 0; k < showingsElement.children.length; k++) {
                        const showingChild = showingsElement.children[k];
                        if (!showingChild.data && (!showingChild.children || !showingChild.children[0])) {
                            continue;
                        }
                        full += showingChild.data || showingChild.children[0].data;
                    }
                    showingString = full;
                }
                if (showingString.trim() === '') {
                    continue;
                }
                const movie = ConversionUtil_1.default.convertMovie(showingString);
                if (!movie) {
                    continue;
                }
                if (!locations.includes(movie.location)) {
                    locations.push(movie.location);
                }
                if (!groupedShowings[movie.location]) {
                    groupedShowings[movie.location] = [];
                }
                for (const date of movie.showtimes) {
                    groupedShowings[movie.location].push(date);
                    showings.push({ location: movie.location, date });
                }
            }
            movies.push({
                title,
                showings,
                groupedShowings,
                locations,
                special: !showings.length
            });
        }
        catch (e) {
            // It's supposed to be blank. If it breaks, just keep it movin
        }
    }
    return movies;
}
router.get('/list', index_1.handleEndpoint(index_1.CacheKey.movieNightShowings, getMovieShowings));
class MovieModule extends webserver_module_1.default {
    constructor(data) {
        super({ ...data, name: MovieModule.IDENTIFIER });
    }
    start() {
        this.app.use('/api/msu/movies', router);
    }
}
MovieModule.IDENTIFIER = 'Movie Night';
exports.default = MovieModule;
//# sourceMappingURL=index.js.map