const cheerio = require('cheerio');
const express = require('express');
const WebserverModule = require('@arcticzeroo/webserver-module');

const config = require('../../../config');
const request = require('../common/request');
const cache = require('../cache');
const DateUtil = require('../util/DateUtil');
const ConversionUtil = require('../util/ConversionUtil');

const router = express.Router();

async function getMovieShowings() {
    let page;
    try {
        page = await request(config.pages.MOVIE_NIGHT);
    } catch (e) {
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
            const title = titleElements[i].children[0].data;
            const showings = [];
            const groupedShowings = {};
            const locations = [];

            const showingsElements = showingsLists[i].children;

            for (let j = 0; j < showingsElements.length; j++) {
                const showingsElement = showingsElements[j];

                let showingString;

                if (!showingsElement.children || showingsElement.children.length === 0) {
                    showingString = showingsElement.data;
                } else {
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

                const movie = ConversionUtil.convertMovie(showingString);

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
                locations
            });
        } catch (e) {

        }
    }

    return movies;
}

cache.add('movieNight', { expireTime: 15 * 60 * 1000, fetch: getMovieShowings });

router.get('/', function handle(req, res) {
    async function go() {
        try {
            res.json({
                movies: await cache.getValue('movieNight')
            });
        } catch (e) {
            throw e;
        }
    }

    go().catch(e => {
        res.status(500).json({
            error: 'Internal Server Error'
        });

        console.error('Could not load movie showings:');
        console.error(e);
    });
});

class MovieLegacyModule extends WebserverModule {
    start() {
        this.app.use('/api/msu/movies', router);
    }
}

module.exports = MovieLegacyModule;