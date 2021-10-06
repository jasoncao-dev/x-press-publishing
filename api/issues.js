const express = require('express')
const issuesRouter = express.Router({mergeParams: true})

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

issuesRouter.param('issueId', (req, res, next, issueId) => {
    const issueSQL = 'SELECT * FROM Issue WHERE id = $issueId'
    db.get(issueSQL, { $issueId: issueId }, (error, issue) => {
        if (error) {
            next(error)
        } else if (!issue) {
            res.sendStatus(404)
        } else {
            next()
        }
    })
})

issuesRouter.get('/', (req, res, next) => {
    const seriesId = req.params.seriesId
    db.all('SELECT * FROM Issue WHERE series_id = $seriesId',
            {
                $seriesId: seriesId
            },
            (error, issues) => {
                if (error) {
                    next(error)
                } else {
                    res.status(200).json({issues: issues})
                }
            })
})

issuesRouter.post('/', (req, res, next) => {
    const { name, issueNumber, publicationDate, artistId } = req.body.issue
    const seriesId = req.params.seriesId
    const artistSQL = 'SELECT * FROM Artist WHERE id = $artistId'

    if (!(name && issueNumber && publicationDate && artistId)) {
        return res.sendStatus(400)
    }

    //Check if provided artist ID exists
    db.get(artistSQL, { $artistId: artistId }, (error, artist) => {
        if (error) {
            next(error)
        } else if (!artist) {
            res.sendStatus(400)
        } else {
            db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id)
                    VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)`,
                    {
                        $name: name,
                        $issueNumber: issueNumber,
                        $publicationDate: publicationDate,
                        $artistId: artistId,
                        $seriesId: seriesId
                    },
                    function (error) {
                        if (error) {
                            next(error)
                        } else {
                            db.get('SELECT * FROM Issue WHERE id = $id', { $id: this.lastID }, (error, issue) => {
                                if (error) {
                                    next(error)
                                } else {
                                    res.status(201).json({issue: issue})
                                }
                            })
                        }
                    })
        }
    })
})

issuesRouter.put('/:issueId', (req, res, next) => {
    const { name, issueNumber, publicationDate, artistId } = req.body.issue
    const issueId = req.params.issueId
    const artistSQL = 'SELECT * FROM Artist WHERE id = $artistId'

    if (!(name && issueNumber && publicationDate && artistId)) {
        return res.sendStatus(400)
    }

    //Check if provided artist ID exists
    db.get(artistSQL, { $artistId: artistId }, (error, artist) => {
        if (error) {
            next(error)
        } else if (!artist) {
            res.sendStatus(400)
        } else {
            db.run(`UPDATE Issue
                    SET name = $name,
                        issue_number = $issueNumber,
                        publication_date = $publicationDate,
                        artist_id = $artistId
                    WHERE id = $issueId`,
                    {
                        $name: name,
                        $issueNumber: issueNumber,
                        $publicationDate: publicationDate,
                        $artistId: artistId,
                        $issueId: issueId
                    },
                    function (error) {
                        if (error) {
                            next(error)
                        } else {
                            db.get('SELECT * FROM Issue WHERE id = $id', { $id: issueId }, (error, issue) => {
                                if (error) {
                                    next(error)
                                } else {
                                    res.status(200).json({issue: issue})
                                }
                            })
                        }
                    })
        }
    })
})

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run('DELETE FROM Issue WHERE id = $issueId', { $issueId: req.params.issueId }, (error) => {
        if (error) {
            next(error)
        } else {
            res.sendStatus(204)
        }
    })
})

module.exports = issuesRouter