const express = require('express')
const artistsRouter = express.Router()

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

artistsRouter.param('artistId', (req, res, next, artistId) => {
    db.get('SELECT * FROM Artist WHERE id = $artistId', { $artistId: artistId }, (error, artist) => {
        if (error) {
            next(error)
        } else if (artist) {
            req.artist = artist
            next()
        } else {
            res.status(404).send()
        }
    })
})

artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (error, artists) => {
        if (error) {
            next(error)
        } else {
            res.status(200).json({artists: artists})
        }
    })
})

artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({artist: req.artist})
})

artistsRouter.post('/', (req, res, next) => {
    const { name, dateOfBirth, biography } = req.body.artist
    let { isCurrentlyEmployed } = req.body.artist
    if (!(name && dateOfBirth && biography)) {
        return res.sendStatus(400)
    }
    isCurrentlyEmployed = (isCurrentlyEmployed === 0) ? 0 : 1
    db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed)
            VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)`,
            {
                $name: name,
                $dateOfBirth: dateOfBirth,
                $biography: biography,
                $isCurrentlyEmployed: isCurrentlyEmployed
            },
            function (error) {
                if (error) {
                    next(error)
                } else {
                    db.get('SELECT * FROM Artist WHERE id = $id', { $id: this.lastID }, (error, artist) => {
                        if (error) {
                            next(error)
                        } else {
                            res.status(201).json({artist: artist})
                        }
                    })
                }
            })
})

artistsRouter.put('/:artistId', (req, res, next) => {
    const { name, dateOfBirth, biography, isCurrentlyEmployed } = req.body.artist
    const id = req.params.artistId
    if (!(name && dateOfBirth && biography && isCurrentlyEmployed)) {
        return res.sendStatus(400)
    }
    db.run(`UPDATE Artist
            SET name = $name,
                date_of_birth = $dateOfBirth,
                biography = $biography,
                is_currently_employed = $isCurrentlyEmployed
            WHERE id = $id`, 
            {
                $name: name,
                $dateOfBirth: dateOfBirth,
                $biography: biography,
                $isCurrentlyEmployed: isCurrentlyEmployed,
                $id: id
            },
            (error) => {
                if (error) {
                    next(error)
                } else {
                    db.get('SELECT * FROM Artist WHERE id = $id', { $id: id }, (error, artist) => {
                        if (error) {
                            next(error)
                        } else {
                            res.status(200).json({artist: artist})
                        }
                    })
                }
            })
})

artistsRouter.delete('/:artistId', (req, res, next) => {
    const id = req.params.artistId
    db.run(`UPDATE Artist
            SET is_currently_employed = 0
            WHERE id = $id`,
            {
                $id: id
            },
            (error) => {
                if (error) {
                    next(error)
                } else {
                    db.get('SELECT * FROM Artist WHERE id = $id', { $id: id }, (error, artist) => {
                        if (error) {
                            next(error)
                        } else {
                            res.status(200).json({artist: artist})
                        }
                    })
                }
            })
})

module.exports = artistsRouter