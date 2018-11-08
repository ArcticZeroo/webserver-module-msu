"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = require("cheerio");
const express = require("express");
const webserver_module_1 = require("@arcticzeroo/webserver-module");
const config_1 = require("../../config/");
const request_1 = require("../common/request");
const cache_1 = require("../cache");
const ConversionUtil_1 = require("../util/ConversionUtil");
const legacy_1 = require("./legacy");
const router = express.Router();
function getMovieShowings() {
    return __awaiter(this, void 0, void 0, function* () {
        let page;
        try {
            page = yield request_1.default(config_1.default.pages.MOVIE_NIGHT);
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
    });
}
router.get('/list', cache_1.handleEndpoint(cache_1.CacheKey.movieNightShowings, getMovieShowings));
class MovieModule extends webserver_module_1.default {
    start() {
        this.app.use('/api/msu/movies', router);
        this.loadChild(legacy_1.default);
    }
}
module.exports = MovieModule;
//# sourceMappingURL=index.js.map